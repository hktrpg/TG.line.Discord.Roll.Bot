"use strict";

const os = require('node:os');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { defineModels, createMongoStore } = require('../modules/discord/chatroom-store');
const { createChatroomService } = require('../modules/discord/chatroom-service');

jest.setTimeout(60_000);

// Uses a disposable database, never the bot's configured mongoURL.
// Set MONGOMS_SYSTEM_BINARY to reuse an installed binary without downloading.
describe('chatroom MongoDB integration', () => {
    let server;
    let connection;
    let models;
    let store;
    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        // Driver 7.7 dynamically imports its default os adapter, which Jest's
        // CommonJS VM disallows. Supply the same native adapter explicitly so
        // the real MongoDB handshake retains its required client metadata.
        connection = await mongoose.createConnection(server.getUri(), {
            runtimeAdapters: { os }
        }).asPromise();
        // Models are registered on an isolated connection; schema uses mongoose.Schema.
        models = defineModels({ Schema: mongoose.Schema, models: connection.models,
            model: (...args) => connection.model(...args) });
        await Promise.all(Object.values(models).map(model => model.init()));
        store = createMongoStore(models);
    });
    afterAll(async () => {
        if (connection) await connection.close();
        if (server) await server.stop();
    });
    beforeEach(async () => {
        await Promise.all(Object.values(models).map(model => model.deleteMany({})));
    });

    it('retains settings and opt-out across new service instances, never reads legacy collections', async () => {
        const legacy = connection.collection('multiservers');
        await legacy.insertOne({ channelid: '100', multiId: 'old' });
        expect(await store.getChannel('100')).toBeNull();
        await store.ensureChannel({ id: '100', guildId: '1', guildName: 'A', name: 'chat' });
        await store.setOptOut('u', true);
        const restarted = createMongoStore(models);
        const user = await restarted.getUser('u');
        const channel = await restarted.getChannel('100');
        expect(user.optedOut).toBe(true);
        expect(channel.enabled).toBe(false);
        expect(await legacy.countDocuments({ channelid: '100' })).toBe(1);
    });

    it('uses atomic revision checks to accept just one competing settings change', async () => {
        const channel = await store.ensureChannel({ id: '100', guildId: '1' });
        const results = await Promise.all([
            store.changeChannel('100', channel.revision, { roomId: 'one' }),
            store.changeChannel('100', channel.revision, { roomId: 'two' })
        ]);
        expect(results.filter(Boolean)).toHaveLength(1);
        expect(await store.configuredChannelIds()).toEqual(['100']);
    });

    it('enforces quotas atomically across workers and rolls over at UTC midnight', async () => {
        const now = Date.parse('2026-10-25T23:59:59Z');
        const results = await Promise.all(Array.from({ length: 20 }, () => store.consumeQuota('1', 10, 30, now)));
        expect(results.filter(Boolean)).toHaveLength(3);
        expect(await store.consumeQuota('1', 10, 30, now + 2000)).toBe(true);
    });

    it('deduplicates cross-process deliveries, excludes expired mappings and omits text fields', async () => {
        const now = Date.now();
        const record = { _id: 'source:target', sourceChannelId: '100', sourceMessageId: '1',
            targetChannelId: '200', userId: 'u', expiresAt: new Date(now + 1000), text: 'must not persist' };
        const reserved = await Promise.all([store.reserveDelivery(record), store.reserveDelivery(record)]);
        expect(reserved.filter(Boolean)).toHaveLength(1);
        await store.completeDelivery(record._id, 'sent');
        expect(await store.deliveriesFor('100', '1', now)).toHaveLength(1);
        expect(await store.deliveriesFor('100', '1', now + 1001)).toHaveLength(0);
        expect(await models.delivery.findById(record._id).lean()).not.toHaveProperty('text');
        const indexes = await models.delivery.collection.indexes();
        expect(indexes.some(index => index.expireAfterSeconds === 0)).toBe(true);
    });

    it('runs the actual invite/join/confirm/delivery path using MongoDB', async () => {
        const transport = { notice: jest.fn(async () => {}), canRead: async () => true,
            send: jest.fn(async () => ({ id: 'sent' })), remove: jest.fn(async () => {}) };
        const service = createChatroomService({ store, transport,
            translator: { available: () => true, translate: async () => '你好' }, enabled: () => true });
        const a = { id: '100', guildId: '1', guildName: 'A', name: 'a', canManage: true, canSend: true };
        const b = { ...a, id: '200', guildId: '2', guildName: 'B' };
        const run = (action, channel, extra = {}) => service.command({ action, channel, userId: 'admin', ...extra });
        const invitation = await run('invite', a);
        await run('join', b, { code: invitation.match(/[\da-f]{48}/)[0] });
        await run('confirm', a);
        await run('translate', b, { language: 'zh-TW' });
        const message = { id: '1', channelId: '100', guildId: '1', content: 'Hello', author: { id: 'u', username: 'Alice' } };
        await service.handleMessage(message);
        expect(transport.send).toHaveBeenCalledWith('200', expect.objectContaining({ text: 'Hello', translation: '你好' }));
        const persisted = await models.delivery.findOne().lean();
        expect(persisted.sentMessageId).toBe('sent');
        expect(JSON.stringify(persisted)).not.toContain('Hello');
        await service.handleDelete(message);
        expect(transport.remove).toHaveBeenCalledWith('200', 'sent');
    });

    it('runs slash commands and Gateway events across two isolated shard runtimes', async () => {
        const facade = { Schema: mongoose.Schema, models: connection.models,
            model: (...args) => connection.model(...args) };
        jest.doMock('../modules/db/connector', () => ({ mongoose: facade }));
        const { createChatroomRuntime } = require('../modules/discord/chatroom-runtime');
        const channels = new Map();
        for (const [id, guildId] of [['100', '1'], ['200', '2']]) {
            channels.set(id, { id, guildId, name: `chat-${id}`, type: 0, nsfw: false,
                permissionsFor: () => ({ has: () => true }),
                guild: { name: `guild-${guildId}`, members: {
                    fetch: async () => ({ id: 'admin' }), fetchMe: async () => ({ id: 'bot' })
                } }
            });
        }
        const posted = [];
        const rest = {
            get: jest.fn(async route => ({ type: 0, nsfw: false, id: route.split('/')[2] })),
            post: jest.fn(async (route, options) => {
                const sent = { id: String(posted.length + 1), route, body: options.body };
                posted.push(sent);
                return sent;
            }),
            delete: jest.fn(async () => {})
        };
        const clientFor = id => ({ user: { id: 'bot' }, rest, channels: {
            cache: new Map([[id, channels.get(id)]]), fetch: async target => channels.get(target)
        } });
        const env = { CHATROOM_ENABLED: 'true', mongoURL: 'test-connector-mock',
            CHATROOM_TRANSLATION_ENABLED: 'true' };
        const translateSpy = jest.spyOn(require('@vitalets/google-translate-api'), 'translate')
            .mockResolvedValue({ text: '你好' });
        try {
            const clientA = clientFor('100');
            const clientB = clientFor('200');
            const a = createChatroomRuntime(clientA, { env });
            const b = createChatroomRuntime(clientB, { env });
            const invoke = async (runtime, channelId, action, values = {}) => {
                const interaction = { channelId, guildId: channels.get(channelId).guildId,
                    user: { id: 'admin' }, options: { getSubcommand: () => action, getString: name => values[name] || null },
                    deferReply: jest.fn(async () => {}), editReply: jest.fn(async () => {}) };
                await runtime.handleInteraction(interaction);
                return interaction.editReply.mock.calls[0][0].content;
            };
            const invitation = await invoke(a, '100', 'invite');
            await invoke(b, '200', 'join', { code: invitation.match(/[\da-f]{48}/)[0] });
            expect(await invoke(a, '100', 'confirm')).toContain('Bridge active');
            await invoke(b, '200', 'translate', { language: 'zh-TW' });
            const message = { id: '777', channelId: '100', guildId: '1', content: 'Hello',
                author: { id: 'u', username: 'Alice' } };
            await a.handleMessage(message);
            const bridged = posted.filter(item => item.body.embeds);
            expect(bridged).toHaveLength(1);
            expect(bridged[0].route).toBe('/channels/200/messages');
            expect(bridged[0].body.embeds[1].description).toBe('你好');
            expect(clientA.channels.cache.has('200')).toBe(false);
            expect(translateSpy).toHaveBeenCalledTimes(1);
            expect(translateSpy).toHaveBeenCalledWith('Hello', expect.objectContaining({ to: 'zh-TW', host: 'translate.google.com' }));
            await b.handleInteraction({ user: { id: 'u' },
                options: { getSubcommand: () => 'optout', getString: () => null },
                deferReply: async () => {}, editReply: async () => {} });
            await a.handleMessage({ ...message, id: '778' });
            expect(posted.filter(item => item.body.embeds)).toHaveLength(1);
            await a.handleDelete(message);
            expect(rest.delete).toHaveBeenCalledWith(`/channels/200/messages/${bridged[0].id}`, expect.any(Object));
        } finally {
            translateSpy.mockRestore();
            jest.dontMock('../modules/db/connector');
        }
    });
});
