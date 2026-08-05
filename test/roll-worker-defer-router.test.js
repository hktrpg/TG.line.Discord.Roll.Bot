"use strict";

jest.mock('../modules/roll-worker/client', () => ({
	isEnabled: jest.fn(),
	isLocalEnabled: jest.fn(() => false),
	getConfig: jest.fn(() => ({
		url: 'http://127.0.0.1:20612',
		token: 't',
		timeoutMs: 30_000,
	})),
	getLocalConfig: jest.fn(() => ({ url: '', token: 't', timeoutMs: 1000 })),
	healthAt: jest.fn(async () => ({ ok: true, role: 'roll-worker' })),
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
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:20612';
		delete process.env.ROLL_WORKER_DEFER_BUSY;
		deferQueue.resetDeferQueue();
		parseRouter.resetWorkersReadyForTests();
		client.isEnabled.mockReturnValue(true);
		client.healthAt.mockResolvedValue({ ok: true, role: 'roll-worker' });
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

	it('mutator timeout never enqueues and never shows system_busy', async () => {
		analytics.findRollModuleName.mockReturnValue('export');
		client.parse.mockRejectedValue(new Error('timeout of 120000ms exceeded'));
		const result = await parseRouter.parseInput({
			inputStr: '.discord html',
			botname: 'Discord',
			userid: 'u8',
			locale: 'zh-tw',
		}, { replyTarget: { botname: 'Discord', channelId: 'c', userid: 'u8' } });
		expect(result.deferred).toBeUndefined();
		expect(result.text).toBe('');
		expect(result.text).not.toBe('SYSTEM_BUSY_I18N');
		expect(deferQueue.size()).toBe(0);
	});

	it('defer-on paths never return system_busy text', async () => {
		const target = { botname: 'Discord', channelId: 'c', userid: 'u-nobusy' };
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));
		const transport = await parseRouter.parseInput({
			inputStr: '1d100', botname: 'Discord', userid: 'u-nobusy', locale: 'zh-tw',
		}, { replyTarget: target });
		expect(transport.text).not.toBe('SYSTEM_BUSY_I18N');

		deferQueue.resetDeferQueue();
		analytics.findRollModuleName.mockReturnValue('export');
		client.parse.mockRejectedValue(new Error('timeout of 120000ms exceeded'));
		const mutatorTimeout = await parseRouter.parseInput({
			inputStr: '.discord html', botname: 'Discord', userid: 'u-nobusy', locale: 'zh-tw',
		}, { replyTarget: target });
		expect(mutatorTimeout.deferred).toBeUndefined();
		expect(mutatorTimeout.text).toBe('');
		expect(mutatorTimeout.text).not.toBe('SYSTEM_BUSY_I18N');

		deferQueue.resetDeferQueue();
		analytics.findRollModuleName.mockReturnValue('0-advroll');
		client.parse.mockResolvedValue({ needsLocal: true, text: '', type: 'text' });
		const needsLocal = await parseRouter.parseInput({
			inputStr: '1d100', botname: 'Discord', userid: 'u-nobusy', locale: 'zh-tw',
		}, { replyTarget: target });
		expect(needsLocal.text).not.toBe('SYSTEM_BUSY_I18N');
	});

	it('HTTP path without replyTarget returns deferred flag (client retry)', async () => {
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));
		const result = await parseRouter.parseInput({
			inputStr: '1d100',
			botname: 'Local',
			userid: 'http-user',
			locale: 'zh-tw',
		});
		expect(result.deferred).toBe(true);
		expect(result.text).toBe('');
		expect(deferQueue.size()).toBe(0);
	});

	it('mutator pre-flight ECONNREFUSED defers under REMOTE_ONLY', async () => {
		analytics.findRollModuleName.mockReturnValue('z_schedule');
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:20612'));
		const result = await parseRouter.parseInput({
			inputStr: '.at 1mins [[1d100]]',
			botname: 'Discord',
			userid: 'u-sched',
			locale: 'zh-tw',
		}, { replyTarget: { botname: 'Discord', channelId: 'c', userid: 'u-sched' } });
		expect(result.deferred).toBe(true);
		expect(result.text).toBe('');
		expect(analytics.parseInput).not.toHaveBeenCalled();
		expect(deferQueue.size()).toBe(1);
	});

	it('remote-fail log is rate-limited (not per message)', async () => {
		parseRouter.resetOpsLogCounters();
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:20612'));
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
		expect(remoteFailLogs[0]).toMatch(/outcome=deferred/);
		expect(remoteFailLogs[0]).toMatch(/ECONNREFUSED/);
	});
});
