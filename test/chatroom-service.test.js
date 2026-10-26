"use strict";

const { createChatroomService, INVITE_MS, DELIVERY_MS, JOB_MS } = require('../modules/discord/chatroom-service');
const { createStore } = require('./chatroom-test-store');

const channelA = { id: '100', guildId: '1', guildName: 'A guild', name: 'A', canManage: true, canSend: true };
const channelB = { id: '200', guildId: '2', guildName: 'B guild', name: 'B', canManage: true, canSend: true };
const message = (overrides = {}) => ({ id: '1000001', channelId: '100', guildId: '1',
    author: { id: 'u1', username: 'Alice' }, content: 'Hello, fellow investigators!', ...overrides });

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function setup(options = {}) {
    const store = createStore();
    const transport = {
        notice: jest.fn(async () => ({})),
        send: jest.fn(async () => ({ id: `sent-${transport.send.mock.calls.length}` })),
        remove: jest.fn(async () => {}),
        canRead: jest.fn(async () => true)
    };
    const translator = { available: () => true, translate: jest.fn(async () => '各位調查員，你好！') };
    const clock = { time: Date.parse('2026-10-25T00:00:00Z'), enabled: true };
    const report = jest.fn();
    const service = createChatroomService({ store, transport, translator, report,
        now: () => clock.time, enabled: () => clock.enabled,
        isCommand: text => /^1d100$/i.test(text), ...options });
    const command = (action, channel = channelA, more = {}) => service.command({
        action, channel, userId: 'admin', ...more
    });
    async function invite() {
        const result = await command('invite');
        return result.match(/[\da-f]{48}/)[0];
    }
    async function pair() {
        const code = await invite();
        await command('join', channelB, { code });
        await command('confirm');
        transport.notice.mockClear();
    }
    return { service, store, transport, translator, clock, report, command, invite, pair };
}

describe('chatroom consent and lifecycle', () => {
    it('requires a guest approval and a source confirmation before either direction works', async () => {
        const s = setup();
        const code = await s.invite();
        expect(s.store.channels.get('100').inviteHash).not.toBe(code);
        expect(JSON.stringify([...s.store.channels.values()])).not.toContain(code);
        await s.service.handleMessage(message());
        await s.command('join', channelB, { code });
        await s.service.handleMessage(message());
        expect(s.transport.send).not.toHaveBeenCalled();
        expect(await s.command('status')).toContain('https://discord.com/channels/2/200');
        await s.command('confirm');
        await s.service.handleMessage(message());
        await s.service.handleMessage(message({ id: '1000002', channelId: '200', guildId: '2' }));
        expect(s.transport.send.mock.calls.map(call => call[0])).toEqual(['200', '100']);
        expect(s.transport.notice.mock.calls.some(call => call[1].includes('/chatroom optout'))).toBe(true);
    });

    it('rejects expired, same-server and reused invitations', async () => {
        const s = setup();
        const code = await s.invite();
        await expect(s.command('join', { ...channelB, guildId: '1' }, { code })).rejects.toThrow('Invitation');
        s.clock.time += INVITE_MS;
        await expect(s.command('join', channelB, { code })).rejects.toThrow('Invitation');
        await s.command('disconnect');
        const next = await s.invite();
        await s.command('join', channelB, { code: next });
        await expect(s.command('join', { ...channelB, id: '300', guildId: '3' }, { code: next })).rejects.toThrow('Invitation');
    });

    it('only accepts one of two simultaneous joins', async () => {
        const s = setup();
        const code = await s.invite();
        const result = await Promise.allSettled([
            s.command('join', channelB, { code }),
            s.command('join', { ...channelB, id: '300', guildId: '3' }, { code })
        ]);
        expect(result.filter(item => item.status === 'fulfilled')).toHaveLength(1);
        const host = s.store.channels.get('100');
        expect(['200', '300']).toContain(host.peerId);
        await s.command('confirm');
        await s.service.handleMessage(message());
        expect(s.transport.send).toHaveBeenCalledTimes(1);
        expect(s.transport.send.mock.calls[0][0]).toBe(host.peerId);
    });

    it('fails closed when a public consent notice fails', async () => {
        const s = setup();
        const code = await s.invite();
        s.transport.notice.mockRejectedValueOnce(new Error('missing access'));
        await expect(s.command('join', channelB, { code })).rejects.toThrow();
        await s.command('confirm');
        await s.service.handleMessage(message());
        expect(s.transport.send).not.toHaveBeenCalled();
    });

    it('denies non-managers but still allows members to opt out and inspect status', async () => {
        const s = setup();
        await expect(s.command('invite', { ...channelA, canManage: false })).rejects.toThrow('Manage Channels');
        await s.command('optout', null, { userId: 'u1' });
        expect(await s.command('status', channelA, { userId: 'u1' })).toContain('Opted out: true');
        expect(s.store.channels.size).toBe(0);
    });

    it('allows stopping even after bot sending permissions are removed', async () => {
        const s = setup();
        await s.pair();
        await s.command('pause', { ...channelA, canSend: false });
        await s.service.handleMessage(message());
        await s.service.handleMessage(message({ channelId: '200', guildId: '2' }));
        expect(s.transport.send).not.toHaveBeenCalled();
        await s.command('disconnect', { ...channelA, canSend: false });
        expect(s.store.channels.get('200').roomId).toBeNull();
    });

    it('cannot activate legacy records or process any content with the global flag off', async () => {
        const s = setup();
        s.clock.enabled = false;
        await s.service.handleMessage(message());
        expect(s.store.channels.size).toBe(0);
        await expect(s.command('invite')).rejects.toThrow('disabled');
        expect(s.transport.send).not.toHaveBeenCalled();
    });
});

describe('chatroom message processing', () => {
    it('excludes bots, webhooks, DMs, commands, private rolls and unconfigured channels', async () => {
        const s = setup();
        await s.pair();
        for (const input of [
            message({ author: { id: 'bot', bot: true } }), message({ webhookId: 'hook' }),
            message({ guildId: null }), message({ channelId: '999' }), message({ system: true }),
            ...['dr 1d100', 'ddr secret', 'dddr secret', '.roll 1d100', '/help', '1d100'].map(content => message({ content }))
        ]) await s.service.handleMessage(input);
        expect(s.transport.send).not.toHaveBeenCalled();
        expect(s.translator.translate).not.toHaveBeenCalled();
    });

    it('deduplicates deliveries and stores IDs, never message bodies', async () => {
        const s = setup();
        await s.pair();
        await Promise.all([s.service.handleMessage(message()), s.service.handleMessage(message())]);
        expect(s.transport.send).toHaveBeenCalledTimes(1);
        expect(JSON.stringify([...s.store.deliveries.values()])).not.toContain(message().content);
        expect(+[...s.store.deliveries.values()][0].expiresAt).toBe(s.clock.time + DELIVERY_MS);
    });

    it('provides standalone translation and an independent off switch', async () => {
        const s = setup();
        await s.command('translate', channelA, { language: 'zh-TW' });
        await s.service.handleMessage(message());
        expect(s.transport.send).toHaveBeenCalledWith('100', expect.objectContaining({ translation: '各位調查員，你好！', bridge: false }));
        await s.command('translate', channelA, { language: 'off' });
        await s.service.handleMessage(message({ id: '1000002' }));
        expect(s.transport.send).toHaveBeenCalledTimes(1);
    });

    it('translates incoming bridged text in the destination language and enforces a quota', async () => {
        const s = setup({ dailyLimit: 30 });
        await s.pair();
        await s.command('translate', channelB, { language: 'ja' });
        await s.service.handleMessage(message());
        await s.service.handleMessage(message({ id: '1000002' }));
        expect(s.translator.translate).toHaveBeenCalledTimes(1);
        expect(s.translator.translate).toHaveBeenCalledWith(message().content, 'ja');
        expect(s.transport.send.mock.calls[1][1].translationError).toBe(true);
    });

    it('never retries a failed provider and reports no raw error/text', async () => {
        const s = setup();
        await s.command('translate', channelA, { language: 'en' });
        s.translator.translate.mockRejectedValue(new Error('SECRET raw content'));
        await s.service.handleMessage(message());
        expect(s.translator.translate).toHaveBeenCalledTimes(1);
        expect(s.transport.send).toHaveBeenCalledWith('100', expect.objectContaining({ translationError: true }));
        expect(JSON.stringify(s.report.mock.calls)).not.toContain('SECRET');
    });

    it('rechecks opt-out after translation and drops queued work even after opt-in', async () => {
        const s = setup();
        await s.command('translate', channelA, { language: 'en' });
        const started = deferred();
        const gate = deferred();
        s.translator.translate.mockImplementation(async () => { started.resolve(); await gate.promise; return 'Translated'; });
        const work = s.service.handleMessage(message());
        await started.promise;
        await s.command('optout', null, { userId: 'u1' });
        await s.command('optin', null, { userId: 'u1' });
        gate.resolve();
        await work;
        expect(s.transport.send).not.toHaveBeenCalled();
    });

    it('drops work queued before pause/resume or the job deadline', async () => {
        const s = setup();
        await s.pair();
        await s.command('translate', channelB, { language: 'en' });
        const started = deferred();
        const gate = deferred();
        s.translator.translate.mockImplementation(async () => { started.resolve(); await gate.promise; return 'Translated'; });
        const work = s.service.handleMessage(message());
        await started.promise;
        await s.command('pause');
        await s.command('confirm');
        s.clock.time += JOB_MS;
        gate.resolve();
        await work;
        expect(s.transport.send).not.toHaveBeenCalled();
    });

    it('deletes copies using retained mappings even after the bridge is disconnected', async () => {
        const s = setup();
        await s.pair();
        await s.service.handleMessage(message());
        await s.command('disconnect');
        await s.service.handleDelete({ channelId: '100', id: '1000001' });
        expect(s.transport.remove).toHaveBeenCalledWith('200', 'sent-1');
        expect(s.store.deliveries.size).toBe(0);
    });

    it('replaces edits and removes copies when an edit becomes a private command', async () => {
        const s = setup();
        await s.pair();
        await s.service.handleMessage(message());
        await s.service.handleUpdate(message({ content: 'Updated', editedTimestamp: 1 }));
        expect(s.transport.remove).toHaveBeenCalledWith('200', 'sent-1');
        expect(s.transport.send.mock.calls[1][1].text).toBe('Updated');
        expect(s.transport.send.mock.calls[1][1].nonce).not.toBe(s.transport.send.mock.calls[0][1].nonce);
        await s.service.handleUpdate(message({ content: 'dr 1d100', editedTimestamp: 2 }));
        expect(s.transport.send).toHaveBeenCalledTimes(2);
        expect(s.store.deliveries.size).toBe(0);
    });

    it('removes a copy if deletion arrives during the send request', async () => {
        const s = setup();
        await s.pair();
        const started = deferred();
        const gate = deferred();
        s.transport.send.mockImplementation(async () => { started.resolve(); await gate.promise; return { id: 'late' }; });
        const work = s.service.handleMessage(message());
        await started.promise;
        await s.service.handleDelete(message());
        gate.resolve();
        await work;
        expect(s.transport.remove).toHaveBeenCalledWith('200', 'late');
        expect(s.store.deliveries.size).toBe(0);
    });

    it('does not fetch or repost text for partial edit events', async () => {
        const s = setup();
        await s.pair();
        await s.service.handleMessage(message());
        await s.service.handleUpdate({ id: '1000001', channelId: '100', partial: true });
        expect(s.transport.remove).toHaveBeenCalledTimes(1);
        expect(s.transport.send).toHaveBeenCalledTimes(1);
    });

    it('fails closed on DB/read-permission errors', async () => {
        const s = setup();
        await s.pair();
        s.transport.canRead.mockResolvedValue(false);
        await s.service.handleMessage(message());
        s.store.getChannel = async () => { throw new Error('database credentials'); };
        await s.service.handleMessage(message());
        expect(s.transport.send).not.toHaveBeenCalled();
        expect(s.report).toHaveBeenCalledWith('message_failed');
    });

    it('caps a slow destination queue', async () => {
        const s = setup({ maxQueue: 1 });
        await s.pair();
        const started = deferred();
        const gate = deferred();
        s.transport.send.mockImplementation(async () => { started.resolve(); await gate.promise; return { id: 'one' }; });
        const work = s.service.handleMessage(message());
        await started.promise;
        await s.service.handleMessage(message({ id: '1000002' }));
        gate.resolve();
        await work;
        expect(s.transport.send).toHaveBeenCalledTimes(1);
        expect(s.service.metrics.queueFull).toBe(1);
    });

    it('removes a known sent copy if its delivery mapping cannot be persisted', async () => {
        const s = setup();
        await s.pair();
        s.store.completeDelivery = async () => { throw new Error('database unavailable'); };
        await s.service.handleMessage(message());
        expect(s.transport.remove).toHaveBeenCalledWith('200', 'sent-1');
        expect(s.service.metrics.failed).toBe(1);
    });

    it('requires both endpoint approvals again when both sides paused', async () => {
        const s = setup();
        await s.pair();
        await s.command('pause');
        await s.command('pause', channelB);
        await s.command('confirm');
        await s.service.handleMessage(message());
        expect(s.transport.send).not.toHaveBeenCalled();
        await s.command('confirm', channelB);
        await s.service.handleMessage(message({ id: '1000002' }));
        expect(s.transport.send).toHaveBeenCalledTimes(1);
    });

    it('does not translate any text after the shared deployment quota is exhausted', async () => {
        const s = setup({ globalDailyLimit: 1 });
        await s.command('translate', channelA, { language: 'en' });
        await s.service.handleMessage(message());
        expect(s.translator.translate).not.toHaveBeenCalled();
        expect(s.transport.send).toHaveBeenCalledWith('100', expect.objectContaining({ translationError: true }));
    });

    it('does not forward a create event overtaken by deletion during configuration discovery', async () => {
        const started = deferred();
        const gate = deferred();
        const s = setup({ isConfigured: async () => { started.resolve(); await gate.promise; return true; } });
        await s.pair();
        const work = s.service.handleMessage(message());
        await started.promise;
        await s.service.handleDelete(message());
        gate.resolve();
        await work;
        await s.service.handleMessage(message()); // A replay of the deleted create.
        expect(s.transport.send).not.toHaveBeenCalled();
    });

    it('keeps the newest edit when asynchronous cleanup reorders edit handlers', async () => {
        const s = setup();
        await s.pair();
        const started = deferred();
        const gate = deferred();
        const original = s.store.deliveriesFor;
        let count = 0;
        s.store.deliveriesFor = async (...args) => {
            if (++count === 1) { started.resolve(); await gate.promise; }
            return original(...args);
        };
        const older = s.service.handleUpdate(message({ content: 'older', editedTimestamp: 1 }));
        await started.promise;
        await s.service.handleUpdate(message({ content: 'newer', editedTimestamp: 2 }));
        gate.resolve();
        await older;
        expect(s.transport.send).toHaveBeenCalledTimes(1);
        expect(s.transport.send.mock.calls[0][1].text).toBe('newer');
        expect(s.transport.remove).not.toHaveBeenCalled();
        expect(s.store.deliveries.size).toBe(1);
    });

    it.each([
        { delay: 0, editedTimestamp: 1 },
        { delay: 0, editedTimestamp: 2 },
        { delay: JOB_MS * 3, editedTimestamp: 1 }
    ])('ignores stale or duplicate edits after a newer delivery (%j)', async ({ delay, editedTimestamp }) => {
        const s = setup();
        await s.pair();
        await s.service.handleUpdate(message({ content: 'newer', editedTimestamp: 2 }));
        s.clock.time += delay;
        await s.service.handleUpdate(message({ content: 'stale', editedTimestamp }));
        expect(s.transport.send).toHaveBeenCalledTimes(1);
        expect(s.transport.remove).not.toHaveBeenCalled();
        expect(s.store.deliveries.size).toBe(1);
    });
});
