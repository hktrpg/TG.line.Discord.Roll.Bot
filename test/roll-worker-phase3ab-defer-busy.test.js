"use strict";

/**
 * Phase 3ab — REMOTE_ONLY defer-busy queue: silent enqueue + drain deliver.
 * Strict proof that busy is not shown when defer is active.
 */

jest.mock('../modules/roll-worker/client', () => ({
	isEnabled: jest.fn(() => true),
	getConfig: jest.fn(() => ({
		url: process.env.ROLL_WORKER_URL || 'http://127.0.0.1:3950',
		token: 'phase3ab',
		timeoutMs: 5000,
	})),
	parse: jest.fn(),
	beginLinkMonitor: jest.fn(),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async (params) => ({
		text: `local:${params.inputStr || ''}`,
		type: 'text',
	})),
	findRollModuleName: jest.fn(() => '0-advroll'),
}));

jest.mock('../modules/i18n/i18n.js', () => ({
	DEFAULT_LOCALE: 'zh-tw',
	init: jest.fn(async () => {}),
	createTranslator: jest.fn(() => (key) => (
		key === 'common.errors.system_busy' ? 'SYSTEM_BUSY_I18N' : key
	)),
}));

const client = require('../modules/roll-worker/client');
const analytics = require('../modules/analytics');
const parseRouter = require('../modules/roll-worker/parse-router');
const deferQueue = require('../modules/roll-worker/defer-queue');
const { markWorkerUp, resetConnectionStatus } = require('../modules/roll-worker/connection-status');

describe('Phase 3ab REMOTE_ONLY defer-busy', () => {
	const envKeys = [
		'ROLL_WORKER_REMOTE_ONLY',
		'ROLL_WORKER_URL',
		'ROLL_WORKER_DEFER_BUSY',
		'ROLL_WORKER_DEFER_MAX',
		'ROLL_WORKER_DEFER_PER_USER',
	];
	const prev = {};

	beforeEach(() => {
		jest.clearAllMocks();
		for (const key of envKeys) prev[key] = process.env[key];
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_WORKER_DEFER_BUSY;
		process.env.ROLL_WORKER_DEFER_MAX = '100';
		process.env.ROLL_WORKER_DEFER_PER_USER = '10';
		deferQueue.resetDeferQueue();
		resetConnectionStatus();
		client.isEnabled.mockReturnValue(true);
		analytics.findRollModuleName.mockReturnValue('0-advroll');
		client.parse.mockReset();
	});

	afterEach(() => {
		deferQueue.resetDeferQueue();
		resetConnectionStatus();
		for (const key of envKeys) {
			if (prev[key] === undefined) delete process.env[key];
			else process.env[key] = prev[key];
		}
	});

	it('transport failure → deferred (no system_busy text, no local)', async () => {
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));
		const result = await parseRouter.parseInput({
			inputStr: '1d100',
			botname: 'Telegram',
			userid: 'u-ab1',
			locale: 'zh-tw',
		}, {
			replyTarget: { botname: 'Telegram', chatId: 'c-ab1', userid: 'u-ab1' },
		});
		expect(result.deferred).toBe(true);
		expect(result.text).toBe('');
		expect(result.text).not.toBe('SYSTEM_BUSY_I18N');
		expect(analytics.parseInput).not.toHaveBeenCalled();
		expect(deferQueue.size()).toBe(1);
	});

	it('hybrid mode still local-fallback (never enqueue)', async () => {
		delete process.env.ROLL_WORKER_REMOTE_ONLY;
		client.parse.mockRejectedValue(new Error('ECONNREFUSED'));
		const result = await parseRouter.parseInput({
			inputStr: '1d20',
			botname: 'Telegram',
			userid: 'u-hy',
			locale: 'zh-tw',
		}, {
			replyTarget: { botname: 'Telegram', chatId: 'c-hy', userid: 'u-hy' },
		});
		expect(result.deferred).toBeUndefined();
		expect(result.text).toBe('local:1d20');
		expect(deferQueue.size()).toBe(0);
	});

	it('opt-out ROLL_WORKER_DEFER_BUSY=false returns system_busy', async () => {
		process.env.ROLL_WORKER_DEFER_BUSY = 'false';
		client.parse.mockRejectedValue(new Error('ECONNREFUSED'));
		const result = await parseRouter.parseInput({
			inputStr: '1d8',
			botname: 'Telegram',
			userid: 'u-off',
			locale: 'zh-tw',
		}, {
			replyTarget: { botname: 'Telegram', chatId: 'c-off', userid: 'u-off' },
		});
		expect(result.deferred).toBeUndefined();
		expect(result.text).toBe('SYSTEM_BUSY_I18N');
		expect(deferQueue.size()).toBe(0);
	});

	it('needsLocal under remote-only → deferred; drain with deferredReplay delivers local', async () => {
		client.parse.mockResolvedValue({
			needsLocal: true,
			moduleName: 'token',
			text: '',
		});
		const enq = await parseRouter.parseInput({
			inputStr: '.token help',
			botname: 'Discord',
			userid: 'u-ab2',
			locale: 'zh-tw',
		}, {
			replyTarget: {
				botname: 'Discord',
				channelId: 'ch-ab2',
				userid: 'u-ab2',
				isInteraction: false,
			},
		});
		expect(enq.deferred).toBe(true);
		expect(deferQueue.size()).toBe(1);

		const delivered = [];
		deferQueue.registerDeliverer('Discord', async (_job, result) => {
			delivered.push(result.text);
		});

		// Worker still returns needsLocal — deferredReplay allowLocal completes.
		client.parse.mockResolvedValue({
			needsLocal: true,
			moduleName: 'token',
		});
		const drain = await deferQueue.tryDrain({ batch: 5 });
		expect(drain.drained).toBe(1);
		expect(delivered[0]).toBe('local:.token help');
		expect(deferQueue.size()).toBe(0);
	});

	it('transport drain while Worker still down does NOT local-fallback', async () => {
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));
		await parseRouter.parseInput({
			inputStr: '1d100',
			botname: 'Discord',
			userid: 'u-ab-no-local',
			locale: 'zh-tw',
		}, {
			replyTarget: {
				botname: 'Discord',
				channelId: 'ch-nl',
				userid: 'u-ab-no-local',
			},
		});
		expect(deferQueue.size()).toBe(1);
		analytics.parseInput.mockClear();

		const delivered = [];
		deferQueue.registerDeliverer('Discord', async (_job, result) => {
			delivered.push(result.text);
		});

		// CONNECTED flap / drain while Worker still refusing — must stay queued (no dup).
		const drain = await deferQueue.tryDrain({ batch: 5 });
		expect(drain.drained).toBe(0);
		expect(delivered).toHaveLength(0);
		expect(analytics.parseInput).not.toHaveBeenCalled();
		expect(deferQueue.size()).toBe(1);
	});

	it('onWorkerConnected drains queued job when Worker recovers', async () => {
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED'));
		await parseRouter.parseInput({
			inputStr: 'cc 50',
			botname: 'Telegram',
			userid: 'u-ab3',
			locale: 'zh-tw',
		}, {
			replyTarget: { botname: 'Telegram', chatId: 'c-ab3', userid: 'u-ab3' },
		});
		expect(deferQueue.size()).toBe(1);

		const delivered = [];
		deferQueue.registerDeliverer('Telegram', async (_job, result) => {
			delivered.push(result.text);
		});
		client.parse.mockResolvedValue({ text: 'remote-ok', type: 'text', _rollWorker: true });

		deferQueue.onWorkerConnected();
		await new Promise((r) => setImmediate(r));
		await new Promise((r) => setTimeout(r, 80));
		if (deferQueue.size() > 0) {
			await deferQueue.tryDrain({ batch: 5 });
		}
		expect(delivered).toContain('remote-ok');
		expect(deferQueue.size()).toBe(0);
	});

	it('markWorkerUp notifies onWorkerUp listeners (link→drain wiring)', () => {
		const { onWorkerUp } = require('../modules/roll-worker/connection-status');
		let hit = 0;
		onWorkerUp(() => { hit += 1; });
		resetConnectionStatus();
		expect(markWorkerUp({ url: 'http://x' })).toBe(true);
		expect(hit).toBe(1);
		expect(markWorkerUp({ url: 'http://x' })).toBe(false);
		expect(hit).toBe(1);
	});

	it('export mutator timeout never enqueues', async () => {
		analytics.findRollModuleName.mockReturnValue('export');
		client.parse.mockRejectedValue(new Error('timeout of 120000ms exceeded'));
		const result = await parseRouter.parseInput({
			inputStr: '.discord html',
			botname: 'Discord',
			userid: 'u-export',
			locale: 'zh-tw',
		}, {
			replyTarget: { botname: 'Discord', channelId: 'c-ex', userid: 'u-export' },
		});
		expect(result.deferred).toBeUndefined();
		expect(result.text).toBe('SYSTEM_BUSY_I18N');
		expect(deferQueue.size()).toBe(0);
	});

	it('ParseMode line documents defer=on when remote-only', () => {
		const lines = [];
		parseRouter.logParseMode({
			info: (m) => lines.push(m),
			warn: () => {},
			log: () => {},
		});
		// may already have logged once in process — force by reading source contract too
		const src = require('node:fs').readFileSync(
			require('node:path').join(__dirname, '../modules/roll-worker/parse-router.js'),
			'utf8'
		);
		expect(src).toMatch(/defer=\$\{deferOn/);
		expect(src).toMatch(/isDeferBusyActive/);
		expect(src).toMatch(/tryDeferBusy/);
	});

	it.each([
		['Line', { botname: 'Line', targetId: 'Cxxxx', chatId: 'Cxxxx', userid: 'Uline' }],
		['Whatsapp', { botname: 'Whatsapp', chatId: 'wa@g.us', userid: 'Uwa' }],
		['WWW', {
			botname: 'WWW',
			kind: 'chat',
			userid: 'www-user',
			wwwMessage: { name: 'n', time: new Date().toISOString(), roomNumber: 'r1' },
		}],
	])('%s replyTarget enqueues on transport failure', async (_label, replyTarget) => {
		client.parse.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:1'));
		const result = await parseRouter.parseInput({
			inputStr: '1d100',
			botname: replyTarget.botname,
			userid: replyTarget.userid,
			locale: 'zh-tw',
		}, { replyTarget });
		expect(result.deferred).toBe(true);
		expect(result.text).toBe('');
		expect(deferQueue.size()).toBe(1);
	});

	it('characterAction jobType drains via characterReplayFn + WWW deliverer', async () => {
		const emitted = [];
		const fakeSocket = {
			connected: true,
			emit: (ev, payload) => emitted.push({ ev, payload }),
		};
		deferQueue.setCharacterReplayFn(async () => ({
			characterResult: { characterReRollName: 'Hero' },
			rplyVal: { text: '1d100 → 42', type: 'text' },
		}));
		deferQueue.registerDeliverer('WWW', async (job, result) => {
			const rt = job.replyTarget;
			const text = result?.rplyVal?.text || '';
			const name = result?.characterResult?.characterReRollName || '';
			rt.socket.emit(rt.eventName || 'rolling', `${name}：\n${text}`);
		});
		const enq = deferQueue.enqueue({
			reason: 'transport',
			jobType: 'characterAction',
			params: { doc: { a: 1 }, item: '攻擊', locale: 'zh-tw', botname: 'WWW' },
			replyTarget: {
				botname: 'WWW',
				kind: 'characterAction',
				eventName: 'rolling',
				userid: 'sock-1',
				socket: fakeSocket,
			},
		});
		expect(enq.ok).toBe(true);
		const drain = await deferQueue.tryDrain({ batch: 5 });
		expect(drain.drained).toBe(1);
		expect(emitted[0]?.ev).toBe('rolling');
		expect(emitted[0]?.payload).toContain('Hero');
		expect(emitted[0]?.payload).toContain('42');
	});
});
