"use strict";

const { ChannelType, PermissionsBitField } = require('discord.js');
const { createTranslator } = require('../modules/discord/chatroom-translation');
const { makePayload, snapshot, createDiscordTransport, createChatroomRuntime } = require('../modules/discord/chatroom-runtime');

describe('chatroom translation provider', () => {
    it('does not call a provider without explicit enablement', async () => {
        const translateImpl = jest.fn();
        const translator = createTranslator({ env: {}, translateImpl });
        expect(translator.available()).toBe(false);
        await expect(translator.translate('private text', 'en')).rejects.toThrow('unavailable');
        expect(translateImpl).not.toHaveBeenCalled();
    });

    it('uses the existing keyless library without credentials, with a fixed host and timeout', async () => {
        const translateImpl = jest.fn(async () => ({ text: "Hi & 'friends'" }));
        const translator = createTranslator({ env: { CHATROOM_TRANSLATION_ENABLED: 'true' }, translateImpl });
        expect(translator.available()).toBe(true);
        expect(await translator.translate('你好', 'en')).toBe("Hi & 'friends'");
        expect(translateImpl).toHaveBeenCalledWith('你好', {
            from: 'auto', to: 'en', host: 'translate.google.com',
            fetchOptions: { signal: expect.any(AbortSignal), redirect: 'error' }
        });
    });

    it('sanitizes provider errors and rejects unsupported targets', async () => {
        const translateImpl = jest.fn(async () => { throw new Error('raw user content and IP address'); });
        const translator = createTranslator({ env: { CHATROOM_TRANSLATION_ENABLED: 'true' }, translateImpl });
        await expect(translator.translate('你好', 'en')).rejects.toThrow(/^translation_failed$/);
        await expect(translator.translate('你好', 'unsupported')).rejects.toThrow('unavailable');
        expect(translateImpl).toHaveBeenCalledTimes(1);
    });

    it('spaces requests by at least one second without queuing or retrying', async () => {
        let time = 0;
        const translateImpl = jest.fn(async () => ({ text: 'Hello' }));
        const translator = createTranslator({ env: { CHATROOM_TRANSLATION_ENABLED: 'true' },
            translateImpl, now: () => time });
        await translator.translate('你好', 'en');
        time = 999;
        await expect(translator.translate('你好', 'en')).rejects.toThrow(/^translation_rate_limited$/);
        time = 1000;
        await translator.translate('你好', 'en');
        expect(translateImpl).toHaveBeenCalledTimes(2);
    });

    it('opens a one-minute cooldown after 429 and then allows a new request', async () => {
        let time = 0;
        const translateImpl = jest.fn().mockRejectedValueOnce(Object.assign(new Error('IP and URL'), { statusCode: 429 }))
            .mockResolvedValue({ text: 'Hello' });
        const translator = createTranslator({ env: { CHATROOM_TRANSLATION_ENABLED: 'true' },
            translateImpl, now: () => time });
        await expect(translator.translate('你好', 'en')).rejects.toThrow(/^translation_rate_limited$/);
        time = 59_999;
        await expect(translator.translate('你好', 'en')).rejects.toThrow(/^translation_rate_limited$/);
        expect(translateImpl).toHaveBeenCalledTimes(1);
        time = 60_000;
        expect(await translator.translate('你好', 'en')).toBe('Hello');
        expect(translateImpl).toHaveBeenCalledTimes(2);
    });

    it('allows only one in-flight request across this process adapter', async () => {
        let finish;
        const translateImpl = jest.fn(() => new Promise(resolve => { finish = resolve; }));
        const translator = createTranslator({ env: { CHATROOM_TRANSLATION_ENABLED: 'true' }, translateImpl });
        const first = translator.translate('你好', 'en');
        await expect(translator.translate('其他文字', 'ja')).rejects.toThrow(/^translation_rate_limited$/);
        finish({ text: 'Hello' });
        expect(await first).toBe('Hello');
        expect(translateImpl).toHaveBeenCalledTimes(1);
    });

    it.each([null, { text: '' }, { text: [] }, { text: 'x'.repeat(3001) }])('rejects malformed provider output: %p', async result => {
        const translator = createTranslator({ env: { CHATROOM_TRANSLATION_ENABLED: 'true' },
            translateImpl: async () => result });
        await expect(translator.translate('你好', 'en')).rejects.toThrow(/^translation_failed$/);
    });
});

describe('chatroom Discord adapter', () => {
    it('uses bot embeds, disables mentions, and enables nonce deduplication', () => {
        const payload = makePayload({ bridge: true, author: '@everyone', text: '<@123> @everyone',
            sourceName: 'A / chat', sourceUrl: 'https://discord.com/channels/1/2/3', nonce: 'nonce', translation: '譯文' });
        expect(payload.allowed_mentions).toEqual({ parse: [], replied_user: false });
        expect(payload.enforce_nonce).toBe(true);
        expect(payload.embeds).toHaveLength(2);
        expect(payload).not.toHaveProperty('username');
        expect(payload).not.toHaveProperty('webhook');
    });

    it('copies mutable Gateway input before the legacy parser can modify it', () => {
        const message = { content: 'original', author: { id: 'u', username: 'Name' }, member: { displayName: 'Display' } };
        const original = snapshot(message);
        message.content = 'changed';
        message.author.id = 'other';
        expect(original.content).toBe('original');
        expect(original.author.id).toBe('u');
    });

    it('delivers through REST to a destination absent from this shard cache', async () => {
        const client = { rest: { post: jest.fn(async () => ({ id: 'sent' })), delete: jest.fn(),
            get: jest.fn(async () => ({ type: ChannelType.GuildText, nsfw: false })) },
            channels: { cache: new Map() } };
        const transport = createDiscordTransport(client);
        await transport.send('200', { text: 'hello', sourceName: 'source', author: 'Name', nonce: '123' });
        expect(client.rest.post).toHaveBeenCalledWith('/channels/200/messages', expect.any(Object));
    });

    it('checks live membership, bot permissions and same-guild text-channel scope', async () => {
        const member = { id: 'u' };
        const bot = { id: 'bot' };
        const channel = { id: '100', guildId: '1', name: 'chat', type: ChannelType.GuildText,
            guild: { name: 'Server', members: { fetch: jest.fn(async () => member), fetchMe: jest.fn(async () => bot) } },
            permissionsFor: value => ({ has: flags => value === member
                ? flags === PermissionsBitField.Flags.ManageChannels : true }) };
        const client = { channels: { fetch: jest.fn(async () => channel) } };
        const transport = createDiscordTransport(client);
        const result = await transport.managedChannel({ guildId: '1', channelId: '100', user: { id: 'u' } });
        expect(result.canManage).toBe(true);
        expect(channel.guild.members.fetch).toHaveBeenCalledWith({ user: 'u', force: true });
        expect(await transport.managedChannel({ guildId: '2', channelId: '100', user: { id: 'u' } })).toBeNull();
    });

    it('keeps commands private and acknowledges before inspecting settings', async () => {
        const calls = [];
        const runtime = createChatroomRuntime({}, { env: {} });
        const interaction = { options: { getSubcommand: () => 'optout', getString: () => null }, user: { id: 'u' },
            deferReply: jest.fn(async () => { calls.push('defer'); }),
            editReply: jest.fn(async payload => { calls.push('edit'); expect(payload.content).toContain('disabled'); }) };
        await runtime.handleInteraction(interaction);
        expect(calls).toEqual(['defer', 'edit']);
        expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 });
    });
});
