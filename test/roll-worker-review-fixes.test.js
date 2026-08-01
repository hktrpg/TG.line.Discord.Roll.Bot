"use strict";

/**
 * Review fixes: enqueue-fail busy text, silent mutator mid-flight, primary ensure health.
 */
jest.mock('../modules/roll-worker/client', () => ({
	isEnabled: jest.fn(() => true),
	isLocalEnabled: jest.fn(() => false),
	getConfig: jest.fn(() => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 1000 })),
	getLocalConfig: jest.fn(() => ({ url: '', token: 't', timeoutMs: 1000 })),
	parse: jest.fn(),
	parseLocal: jest.fn(),
	healthAt: jest.fn(async () => ({ ok: true, role: 'roll-worker' })),
	beginLinkMonitor: jest.fn(),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(),
	findRollModuleName: jest.fn(() => '0-advroll'),
}));

jest.mock('../modules/i18n/i18n', () => ({
	init: jest.fn(async () => {}),
	DEFAULT_LOCALE: 'zh-tw',
	createTranslator: () => (key) => (
		key === 'common.errors.system_busy' ? 'SYSTEM_BUSY_I18N' : key
	),
}));

const client = require('../modules/roll-worker/client');
const analytics = require('../modules/analytics');
const deferQueue = require('../modules/roll-worker/defer-queue');
const parseRouter = require('../modules/roll-worker/parse-router');

describe('review fixes (defer enqueue fail + mutator silent)', () => {
	const prev = {};

	beforeEach(() => {
		for (const key of [
			'ROLL_WORKER_REMOTE_ONLY',
			'ROLL_WORKER_URL',
			'ROLL_WORKER_DEFER_BUSY',
			'ROLL_WORKER_DEFER_PER_USER',
			'ROLL_WORKER_DEFER_MAX',
		]) {
			prev[key] = process.env[key];
		}
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_WORKER_DEFER_BUSY;
		process.env.ROLL_WORKER_DEFER_PER_USER = '1';
		process.env.ROLL_WORKER_DEFER_MAX = '100';
		deferQueue.resetDeferQueue();
		parseRouter.resetWorkersReadyForTests();
		jest.clearAllMocks();
		client.healthAt.mockResolvedValue({ ok: true, role: 'roll-worker' });
		analytics.findRollModuleName.mockReturnValue('0-advroll');
		client.isLocalEnabled.mockReturnValue(false);
	});

	afterEach(() => {
		deferQueue.resetDeferQueue();
		parseRouter.resetWorkersReadyForTests();
		for (const [key, value] of Object.entries(prev)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	});

	it('per-user enqueue failure returns system_busy (not silent empty)', async () => {
		const target = { botname: 'Line', chatId: 'c1', userid: 'u-cap' };
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));

		const first = await parseRouter.parseInput({
			inputStr: '1d100',
			botname: 'Line',
			userid: 'u-cap',
			locale: 'zh-tw',
		}, { replyTarget: target });
		expect(first.deferred).toBe(true);
		expect(deferQueue.size()).toBe(1);

		const second = await parseRouter.parseInput({
			inputStr: '1d20',
			botname: 'Line',
			userid: 'u-cap',
			locale: 'zh-tw',
		}, { replyTarget: target });
		expect(second.deferred).toBeUndefined();
		expect(second.text).toBe('SYSTEM_BUSY_I18N');
		expect(deferQueue.size()).toBe(1);
	});

	it('mutator mid-flight timeout stays silent empty (no system_busy)', async () => {
		analytics.findRollModuleName.mockReturnValue('export');
		client.parse.mockRejectedValue(new Error('timeout of 120000ms exceeded'));
		const result = await parseRouter.parseInput({
			inputStr: '.discord html',
			botname: 'Discord',
			userid: 'u-mut',
			locale: 'zh-tw',
		}, { replyTarget: { botname: 'Discord', channelId: 'c', userid: 'u-mut' } });
		expect(result.deferred).toBeUndefined();
		expect(result.text).toBe('');
		expect(result.text).not.toBe('SYSTEM_BUSY_I18N');
		expect(deferQueue.size()).toBe(0);
	});

	it('ensureWorkersReady skips health wait in Jest (avoids isolateModules hang)', async () => {
		const prevSpawn = process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_WORKER_SPAWN;
		parseRouter.resetWorkersReadyForTests();
		const started = Date.now();
		const out = await parseRouter.ensureWorkersReady({ info() {}, warn() {}, error() {} });
		expect(Date.now() - started).toBeLessThan(200);
		expect(out?.testHarness || out?.skipped).toBeTruthy();
		if (prevSpawn === undefined) delete process.env.ROLL_WORKER_SPAWN;
		else process.env.ROLL_WORKER_SPAWN = prevSpawn;
	});
});
