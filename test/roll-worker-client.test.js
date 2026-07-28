"use strict";

const { toSerializableContext, isEnabled, getConfig } = require('../modules/roll-worker/client');

describe('roll-worker client', () => {
	const originalUrl = process.env.ROLL_WORKER_URL;

	afterEach(() => {
		if (originalUrl === undefined) {
			delete process.env.ROLL_WORKER_URL;
		} else {
			process.env.ROLL_WORKER_URL = originalUrl;
		}
	});

	it('isEnabled only when ROLL_WORKER_URL is set', () => {
		delete process.env.ROLL_WORKER_URL;
		expect(isEnabled()).toBe(false);
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		expect(isEnabled()).toBe(true);
	});

	it('strips non-serializable fields from context', () => {
		const ctx = toSerializableContext({
			inputStr: '1d100',
			botname: 'Discord',
			locale: 'en',
			discordClient: { fake: true },
			discordMessage: { channel: { type: 0 } },
			t: () => 'nope',
			channelType: 0,
		});
		expect(ctx.inputStr).toBe('1d100');
		expect(ctx.botname).toBe('Discord');
		expect(ctx.channelType).toBe(0);
		expect(ctx.discordClient).toBeUndefined();
		expect(ctx.discordMessage).toBeUndefined();
		expect(ctx.t).toBeUndefined();
	});

	it('reads channelType from discordMessage when not provided', () => {
		const ctx = toSerializableContext({
			inputStr: 'x',
			discordMessage: { channel: { type: 1 } },
		});
		expect(ctx.channelType).toBe(1);
	});

	it('includes avatarUrl and attachmentsMeta in serializable context', () => {
		const ctx = toSerializableContext({
			inputStr: '.ait',
			botname: 'Discord',
			avatarUrl: 'https://cdn.example/a.png',
			attachmentsMeta: [{ url: 'https://cdn.example/f.txt', name: 'f.txt', size: 1 }],
			replyContent: 'quoted',
			discordClient: { fake: true },
		});
		expect(ctx.avatarUrl).toBe('https://cdn.example/a.png');
		expect(ctx.attachmentsMeta).toHaveLength(1);
		expect(ctx.replyContent).toBe('quoted');
		expect(ctx.discordClient).toBeUndefined();
	});

	it('getConfig uses defaults', () => {
		delete process.env.ROLL_WORKER_URL;
		delete process.env.ROLL_WORKER_TOKEN;
		delete process.env.ROLL_WORKER_TIMEOUT_MS;
		const cfg = getConfig();
		expect(cfg.url).toContain('127.0.0.1:3950');
		expect(cfg.timeoutMs).toBe(30_000);
	});
});
