"use strict";

jest.mock('../modules/roll-worker/client', () => ({
	isEnabled: jest.fn(),
	getConfig: jest.fn(() => ({
		url: 'http://127.0.0.1:3950',
		token: 't',
		timeoutMs: 30_000,
	})),
	parse: jest.fn(),
	beginLinkMonitor: jest.fn(),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async () => ({ text: 'local-ok', type: 'text' })),
	findRollModuleName: jest.fn(() => '0-advroll'),
}));

jest.mock('../modules/i18n/i18n.js', () => {
	const DEFAULT_LOCALE = 'zh-tw';
	return {
		DEFAULT_LOCALE,
		init: jest.fn(async () => {}),
		createTranslator: jest.fn(() => (key) => {
			if (key === 'common.errors.system_busy') return 'SYSTEM_BUSY_I18N';
			return key;
		}),
	};
});

const client = require('../modules/roll-worker/client');
const analytics = require('../modules/analytics');
const parseRouter = require('../modules/roll-worker/parse-router');
const deferQueue = require('../modules/roll-worker/defer-queue');

describe('parse-router defer under REMOTE_ONLY', () => {
	const envPrev = {};

	beforeEach(() => {
		jest.clearAllMocks();
		for (const key of ['ROLL_WORKER_REMOTE_ONLY', 'ROLL_WORKER_URL', 'ROLL_WORKER_DEFER_BUSY']) {
			envPrev[key] = process.env[key];
		}
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_WORKER_DEFER_BUSY;
		deferQueue.resetDeferQueue();
		client.isEnabled.mockReturnValue(true);
		analytics.findRollModuleName.mockReturnValue('0-advroll');
	});

	afterEach(() => {
		deferQueue.resetDeferQueue();
		for (const [key, value] of Object.entries(envPrev)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	});

	it('hybrid (no remote-only) does not enqueue on worker error', async () => {
		delete process.env.ROLL_WORKER_REMOTE_ONLY;
		client.parse.mockRejectedValue(new Error('ECONNREFUSED'));
		const result = await parseRouter.parseInput({
			inputStr: '1d100',
			botname: 'Telegram',
			userid: 'u',
			locale: 'zh-tw',
		}, { replyTarget: { botname: 'Telegram', chatId: '1', userid: 'u' } });
		expect(result.deferred).toBeUndefined();
		expect(analytics.parseInput).toHaveBeenCalled();
		expect(deferQueue.size()).toBe(0);
	});

	it('remote-only transport error returns deferred when replyTarget set', async () => {
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));
		const result = await parseRouter.parseInput({
			inputStr: '1d100',
			botname: 'Telegram',
			userid: 'u9',
			locale: 'zh-tw',
		}, { replyTarget: { botname: 'Telegram', chatId: '9', userid: 'u9' } });
		expect(result.deferred).toBe(true);
		expect(result.text).toBe('');
		expect(analytics.parseInput).not.toHaveBeenCalled();
		expect(deferQueue.size()).toBe(1);
	});

	it('mutator fail-closed still returns busy (no defer)', async () => {
		analytics.findRollModuleName.mockReturnValue('export');
		client.parse.mockRejectedValue(new Error('timeout of 120000ms exceeded'));
		const result = await parseRouter.parseInput({
			inputStr: '.discord html',
			botname: 'Discord',
			userid: 'u8',
			locale: 'zh-tw',
		}, { replyTarget: { botname: 'Discord', channelId: 'c', userid: 'u8' } });
		expect(result.deferred).toBeUndefined();
		expect(result.text).toBe('SYSTEM_BUSY_I18N');
		expect(deferQueue.size()).toBe(0);
	});

	it('remote-fail log is rate-limited (not per message)', async () => {
		parseRouter.resetOpsLogCounters();
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3950'));
		const warns = [];
		const spy = jest.spyOn(console, 'warn').mockImplementation((m) => warns.push(String(m)));
		const target = { botname: 'Discord', channelId: 'c', userid: 'u-spam' };
		for (let i = 0; i < 5; i++) {
			await parseRouter.parseInput({
				inputStr: '1d100',
				botname: 'Discord',
				userid: `u-spam-${i}`,
				locale: 'zh-tw',
			}, { replyTarget: { ...target, userid: `u-spam-${i}` } });
		}
		spy.mockRestore();
		const remoteFailLogs = warns.filter((w) => w.includes('OPS remote-fail'));
		// First event logs once; remaining 4 in the 60s window are suppressed.
		expect(remoteFailLogs).toHaveLength(1);
		expect(remoteFailLogs[0]).toMatch(/deferred=yes/);
		expect(remoteFailLogs[0]).toMatch(/ECONNREFUSED/);
	});
});
