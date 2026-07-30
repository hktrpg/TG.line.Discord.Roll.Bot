"use strict";

/**
 * Unit tests for local-worker helpers (no live spawn).
 */
jest.mock('../modules/roll-worker/client', () => ({
	isLocalEnabled: jest.fn(() => false),
	getLocalConfig: jest.fn(() => ({ url: '', token: 't', timeoutMs: 1000 })),
	getConfig: jest.fn(() => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 1000 })),
	isEnabled: jest.fn(() => true),
	healthAt: jest.fn(),
	requestAdminShutdown: jest.fn(),
	requestAdminReload: jest.fn(),
	parseLocal: jest.fn(),
}));

jest.mock('../modules/roll-worker/ensure-token', () => ({
	ensureRollWorkerToken: jest.fn(),
}));

const client = require('../modules/roll-worker/client');
const localWorker = require('../modules/roll-worker/local-worker');

describe('local-worker unit', () => {
	const prevSpawn = process.env.ROLL_LOCAL_WORKER_SPAWN;
	const prevUrl = process.env.ROLL_LOCAL_WORKER_URL;
	const prevProbe = process.env.ROLL_LOCAL_WORKER_HEALTH_PROBE_MS;
	const prevReloadWait = process.env.ROLL_LOCAL_WORKER_RELOAD_WAIT_MS;

	beforeEach(() => {
		process.env.ROLL_LOCAL_WORKER_HEALTH_PROBE_MS = '300';
	});

	afterEach(() => {
		jest.clearAllMocks();
		if (prevSpawn === undefined) delete process.env.ROLL_LOCAL_WORKER_SPAWN;
		else process.env.ROLL_LOCAL_WORKER_SPAWN = prevSpawn;
		if (prevUrl === undefined) delete process.env.ROLL_LOCAL_WORKER_URL;
		else process.env.ROLL_LOCAL_WORKER_URL = prevUrl;
		if (prevProbe === undefined) delete process.env.ROLL_LOCAL_WORKER_HEALTH_PROBE_MS;
		else process.env.ROLL_LOCAL_WORKER_HEALTH_PROBE_MS = prevProbe;
		if (prevReloadWait === undefined) delete process.env.ROLL_LOCAL_WORKER_RELOAD_WAIT_MS;
		else process.env.ROLL_LOCAL_WORKER_RELOAD_WAIT_MS = prevReloadWait;
	});

	it('startIfConfigured skips when no URL and SPAWN off', async () => {
		client.isLocalEnabled.mockReturnValue(false);
		delete process.env.ROLL_LOCAL_WORKER_SPAWN;
		const result = await localWorker.startIfConfigured();
		expect(result).toEqual({ ok: false, skipped: true });
	});

	it('startIfConfigured pending when URL unhealthy and SPAWN off', async () => {
		client.isLocalEnabled.mockReturnValue(true);
		client.getLocalConfig.mockReturnValue({
			url: 'http://127.0.0.1:3999',
			token: 't',
			timeoutMs: 1000,
		});
		client.healthAt.mockRejectedValue(new Error('down'));
		delete process.env.ROLL_LOCAL_WORKER_SPAWN;
		const result = await localWorker.startIfConfigured();
		expect(result.ok).toBe(false);
		expect(result.pending).toBe(true);
		expect(result.url).toBe('http://127.0.0.1:3999');
	});

	it('waitUntilUnhealthy returns true when healthAt throws', async () => {
		client.healthAt.mockRejectedValue(new Error('ECONNREFUSED'));
		const down = await localWorker.waitUntilUnhealthy('http://127.0.0.1:3998', 1000);
		expect(down).toBe(true);
	});

	it('reloadRemote fails when primary URL unset', async () => {
		client.isEnabled.mockReturnValue(false);
		const result = await localWorker.reloadRemote({ drainMs: 10 });
		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/ROLL_WORKER_URL unset/);
	});

	it('reloadRemote reports failure when health never returns after self-reload', async () => {
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3950',
			token: 't',
			timeoutMs: 1000,
		});
		client.requestAdminReload.mockResolvedValue({
			ok: true,
			reloading: true,
			pid: 99,
			mode: 'self-restart',
		});
		client.healthAt.mockRejectedValue(new Error('down'));
		process.env.ROLL_WORKER_RELOAD_WAIT_MS = '200';

		const result = await localWorker.reloadRemote({ drainMs: 10 });
		expect(result.ok).toBe(false);
		expect(result.mode).toBe('reload-sent');
		expect(result.error).toMatch(/did not return/i);
		expect(result.pid).toBe(99);
		expect(client.requestAdminReload).toHaveBeenCalled();
		expect(client.requestAdminShutdown).not.toHaveBeenCalled();
	}, 10_000);

	it('reloadRemote succeeds when worker self-restarts', async () => {
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3950',
			token: 't',
			timeoutMs: 1000,
		});
		client.requestAdminReload.mockResolvedValue({
			ok: true,
			reloading: true,
			pid: 42,
			mode: 'self-restart',
		});
		let calls = 0;
		client.healthAt.mockImplementation(async () => {
			calls += 1;
			if (calls === 1) throw new Error('down');
			return { ok: true };
		});
		process.env.ROLL_WORKER_RELOAD_WAIT_MS = '2000';

		const result = await localWorker.reloadRemote({ drainMs: 10 });
		expect(result.ok).toBe(true);
		expect(result.mode).toBe('self-restart');
		expect(client.requestAdminReload).toHaveBeenCalled();
	}, 10_000);

	it('getStatus reflects env', () => {
		client.isLocalEnabled.mockReturnValue(true);
		client.getLocalConfig.mockReturnValue({
			url: 'http://127.0.0.1:3951',
			token: 't',
			timeoutMs: 1000,
		});
		process.env.ROLL_LOCAL_WORKER_SPAWN = 'true';
		const status = localWorker.getStatus();
		expect(status.localUrl).toBe('http://127.0.0.1:3951');
		expect(status.localEnabled).toBe(true);
		expect(status.spawn).toBe(true);
	});

	it('reloadLocal rejects concurrent reload', async () => {
		process.env.ROLL_LOCAL_WORKER_RELOAD_WAIT_MS = '200';
		client.getLocalConfig.mockReturnValue({
			url: 'http://127.0.0.1:3951',
			token: 't',
			timeoutMs: 1000,
		});
		let releaseReload;
		client.requestAdminReload.mockImplementation(
			() => new Promise((resolve) => {
				releaseReload = () => resolve({
					ok: true,
					reloading: true,
					pid: 1,
					mode: 'self-restart',
				});
			})
		);
		// After reload: unhealthy immediately; then stay down → reload-sent.
		client.healthAt.mockRejectedValue(new Error('down'));

		const first = localWorker.reloadLocal({ drainMs: 10 });
		await new Promise((r) => setTimeout(r, 20));
		const second = await localWorker.reloadLocal({ drainMs: 10 });
		expect(second.ok).toBe(false);
		expect(second.error).toMatch(/already in progress/i);
		releaseReload();
		const firstResult = await first;
		expect(firstResult.ok).toBe(false);
		expect(firstResult.mode).toBe('reload-sent');
	}, 10_000);
});
