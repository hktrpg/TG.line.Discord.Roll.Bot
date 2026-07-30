"use strict";

/**
 * stop flags: ensure skips; parse-router skips Primary/Standby layers.
 */
jest.mock('../modules/roll-worker/client', () => ({
	isLocalEnabled: jest.fn(() => true),
	getLocalConfig: jest.fn(() => ({ url: 'http://127.0.0.1:3951', token: 't', timeoutMs: 1000 })),
	getConfig: jest.fn(() => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 1000 })),
	isEnabled: jest.fn(() => true),
	healthAt: jest.fn(),
	requestAdminShutdown: jest.fn().mockResolvedValue({ ok: true }),
	requestAdminReload: jest.fn(),
	parseLocal: jest.fn(),
	parse: jest.fn(),
	beginLinkMonitor: jest.fn(),
}));

jest.mock('../modules/roll-worker/ensure-token', () => ({
	ensureRollWorkerToken: jest.fn(),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async () => ({ text: 'embedded', type: 'text' })),
	findRollModuleName: jest.fn(() => 'demo'),
}));

const client = require('../modules/roll-worker/client');
const analytics = require('../modules/analytics');
const localWorker = require('../modules/roll-worker/local-worker');
const parseRouter = require('../modules/roll-worker/parse-router');

describe('stop flags', () => {
	beforeEach(() => {
		localWorker.resetStoppedFlagsForTests();
		jest.clearAllMocks();
		client.isEnabled.mockReturnValue(true);
		client.isLocalEnabled.mockReturnValue(true);
		client.requestAdminShutdown.mockResolvedValue({ ok: true });
		client.healthAt.mockRejectedValue(new Error('down'));
		analytics.parseInput.mockResolvedValue({ text: 'embedded', type: 'text' });
		delete process.env.ROLL_WORKER_REMOTE_ONLY;
	});

	afterEach(() => {
		localWorker.resetStoppedFlagsForTests();
	});

	it('stopPrimary sets flag and ensurePrimaryWorker skips', async () => {
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		const stop = await localWorker.stopPrimary({ drainMs: 10 });
		expect(stop.ok).toBe(true);
		expect(localWorker.isPrimaryStopped()).toBe(true);
		const ensured = await localWorker.ensurePrimaryWorker();
		expect(ensured.stopped).toBe(true);
		expect(ensured.ok).toBe(false);
	});

	it('stopStandby sets flag and ensureLocalWorker skips', async () => {
		process.env.ROLL_STANDBY_URL = 'http://127.0.0.1:3951';
		const stop = await localWorker.stopStandby({ drainMs: 10 });
		expect(stop.ok).toBe(true);
		expect(localWorker.isStandbyStopped()).toBe(true);
		const ensured = await localWorker.ensureLocalWorker();
		expect(ensured.stopped).toBe(true);
	});

	it('parse-router skips Primary when stopped and uses Embedded', async () => {
		jest.spyOn(parseRouter, 'ensureWorkersReady').mockResolvedValue(null);
		await localWorker.stopPrimary({ drainMs: 10 });
		const result = await parseRouter.parseInput({
			inputStr: '.demo',
			botname: 'Telegram',
			userid: 'u1',
		}, { keepProof: true });
		expect(client.parse).not.toHaveBeenCalled();
		expect(analytics.parseInput).toHaveBeenCalled();
		expect(result._rollWorker).toBe(false);
		parseRouter.ensureWorkersReady.mockRestore();
	}, 15_000);
});
