"use strict";

/**
 * Unit: token Phase 3 remote contract (needsLocal vs help).
 * Avoid requiring forward.js here — its top-level `return` breaks Jest/Babel
 * (same class of issue as modules/chat/logs.js). Forward is covered by
 * route-table allowlist + live Worker proof when mongoURL is set.
 */
describe('Phase 3 token worker contract', () => {
	const prevWorker = process.env.ROLL_WORKER_MODE;
	const prevSecret = process.env.DISCORD_CHANNEL_SECRET;

	beforeAll(() => {
		process.env.ROLL_WORKER_MODE = 'true';
		process.env.DISCORD_CHANNEL_SECRET = process.env.DISCORD_CHANNEL_SECRET || 'test-secret';
		jest.resetModules();
	});

	afterAll(() => {
		if (prevWorker === undefined) delete process.env.ROLL_WORKER_MODE;
		else process.env.ROLL_WORKER_MODE = prevWorker;
		if (prevSecret === undefined) delete process.env.DISCORD_CHANNEL_SECRET;
		else process.env.DISCORD_CHANNEL_SECRET = prevSecret;
	});

	it('token help works without discordMessage on worker', async () => {
		const token = require('../roll/token.js');
		const result = await token.rollDiceCommand({
			inputStr: '.token help',
			mainMsg: ['.token', 'help'],
			botname: 'Discord',
			discordClient: null,
			discordMessage: null,
			locale: 'zh-tw',
		});
		expect(result.needsLocal).toBeUndefined();
		expect(result.quotes).toBe(true);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('token make without avatarUrl returns needsLocal on worker', async () => {
		const token = require('../roll/token.js');
		const result = await token.rollDiceCommand({
			inputStr: '.token Hero',
			mainMsg: ['.token', 'Hero'],
			botname: 'Discord',
			discordClient: null,
			discordMessage: null,
			avatarUrl: null,
			locale: 'zh-tw',
		});
		expect(result).toEqual({ needsLocal: true, moduleName: 'token' });
	});

	it('token getAvatar prefers prefetched URL', async () => {
		const token = require('../roll/token.js');
		const url = await token.getAvatar(null, null, 'https://cdn.example/avatar.png');
		expect(url).toBe('https://cdn.example/avatar.png');
	});
});
