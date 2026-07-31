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
	const prevWorkerSpawn = process.env.ROLL_WORKER_SPAWN;
	const prevStandbySpawn = process.env.ROLL_STANDBY_SPAWN;
	const prevUrl = process.env.ROLL_STANDBY_URL;
	const prevProbe = process.env.ROLL_WORKER_HEALTH_PROBE_MS;
	const prevReloadWait = process.env.ROLL_STANDBY_RELOAD_WAIT_MS;
	const prevPrimary = process.env.ROLL_WORKER_URL;
	const prevRemoteOnly = process.env.ROLL_WORKER_REMOTE_ONLY;
	const prevWorkerMode = process.env.ROLL_WORKER_MODE;

	beforeEach(() => {
		process.env.ROLL_WORKER_HEALTH_PROBE_MS = '300';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_WORKER_REMOTE_ONLY;
		delete process.env.ROLL_WORKER_MODE;
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
	});

	afterEach(() => {
		jest.clearAllMocks();
		if (prevWorkerSpawn === undefined) delete process.env.ROLL_WORKER_SPAWN;
		else process.env.ROLL_WORKER_SPAWN = prevWorkerSpawn;
		if (prevStandbySpawn === undefined) delete process.env.ROLL_STANDBY_SPAWN;
		else process.env.ROLL_STANDBY_SPAWN = prevStandbySpawn;
		if (prevUrl === undefined) delete process.env.ROLL_STANDBY_URL;
		else process.env.ROLL_STANDBY_URL = prevUrl;
		if (prevProbe === undefined) delete process.env.ROLL_WORKER_HEALTH_PROBE_MS;
		else process.env.ROLL_WORKER_HEALTH_PROBE_MS = prevProbe;
		if (prevReloadWait === undefined) delete process.env.ROLL_STANDBY_RELOAD_WAIT_MS;
		else process.env.ROLL_STANDBY_RELOAD_WAIT_MS = prevReloadWait;
		if (prevPrimary === undefined) delete process.env.ROLL_WORKER_URL;
		else process.env.ROLL_WORKER_URL = prevPrimary;
		if (prevRemoteOnly === undefined) delete process.env.ROLL_WORKER_REMOTE_ONLY;
		else process.env.ROLL_WORKER_REMOTE_ONLY = prevRemoteOnly;
		if (prevWorkerMode === undefined) delete process.env.ROLL_WORKER_MODE;
		else process.env.ROLL_WORKER_MODE = prevWorkerMode;
	});

	it('shouldAutoSpawnWorkers defaults on even without ROLL_WORKER_URL', () => {
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
		delete process.env.ROLL_WORKER_URL;
		const prevNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		try {
			expect(localWorker.shouldAutoSpawnWorkers()).toBe(true);
			expect(localWorker.shouldSpawn()).toBe(false); // local needs primary URL first
		} finally {
			process.env.NODE_ENV = prevNodeEnv;
		}
	});

	it('shouldAutoSpawnWorkers stays off in Jest unless ROLL_WORKER_SPAWN=true', () => {
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
		expect(process.env.NODE_ENV).toBe('test');
		expect(localWorker.shouldAutoSpawnWorkers()).toBe(false);
		process.env.ROLL_WORKER_SPAWN = 'true';
		expect(localWorker.shouldAutoSpawnWorkers()).toBe(true);
	});

	it('shouldSpawn stays off when ROLL_STANDBY_SPAWN unset even if primary URL set (Primary-only default)', () => {
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		const prevNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		try {
			expect(localWorker.shouldSpawn()).toBe(false);
			expect(localWorker.shouldAutoSpawnWorkers()).toBe(true);
		} finally {
			process.env.NODE_ENV = prevNodeEnv;
		}
	});

	it('shouldSpawn on when ROLL_STANDBY_SPAWN=true and primary URL set', () => {
		process.env.ROLL_STANDBY_SPAWN = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		expect(localWorker.shouldSpawn()).toBe(true);
	});

	it('shouldSpawn / shouldAutoSpawnWorkers respect SPAWN=false opt-out', () => {
		process.env.ROLL_WORKER_SPAWN = 'false';
		process.env.ROLL_STANDBY_SPAWN = 'false';
		expect(localWorker.shouldSpawn()).toBe(false);
		expect(localWorker.shouldAutoSpawnWorkers()).toBe(false);
	});

	it('shouldSpawn stays off under REMOTE_ONLY', () => {
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		expect(localWorker.shouldSpawn()).toBe(false);
	});

	it('shouldAutoSpawnWorkers stays off in Worker mode', () => {
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
		process.env.ROLL_WORKER_MODE = 'true';
		expect(localWorker.shouldAutoSpawnWorkers()).toBe(false);
	});
	it('getSpawnPort avoids colliding with primary Worker port', () => {
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3951';
		delete process.env.ROLL_STANDBY_PORT;
		expect(localWorker.getSpawnPort()).toBe(3952);
	});

	it('startIfConfigured skips spawn when SPAWN=false but keeps existing primary URL', async () => {
		client.isLocalEnabled.mockReturnValue(false);
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3950',
			token: 't',
			timeoutMs: 1000,
		});
		client.healthAt.mockResolvedValue({ ok: true });
		process.env.ROLL_WORKER_SPAWN = 'false';
		process.env.ROLL_STANDBY_SPAWN = 'false';
		delete process.env.ROLL_STANDBY_URL;
		const result = await localWorker.startIfConfigured();
		expect(result.ok).toBe(true);
		expect(result.primary.ok).toBe(true);
		expect(result.primary.existing).toBe(true);
		expect(result.local.skipped).toBe(true);
	});

	it('startIfConfigured fully skips when SPAWN=false and no primary URL', async () => {
		client.isLocalEnabled.mockReturnValue(false);
		client.isEnabled.mockReturnValue(false);
		process.env.ROLL_WORKER_SPAWN = 'false';
		process.env.ROLL_STANDBY_SPAWN = 'false';
		delete process.env.ROLL_WORKER_URL;
		delete process.env.ROLL_STANDBY_URL;
		const result = await localWorker.startIfConfigured();
		expect(result.ok).toBe(false);
		expect(result.skipped).toBe(true);
		expect(result.primary.skipped).toBe(true);
		expect(result.local.skipped).toBe(true);
	});
	it('startIfConfigured pending when URL unhealthy and SPAWN not explicit true', async () => {
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3950',
			token: 't',
			timeoutMs: 1000,
		});
		client.isLocalEnabled.mockReturnValue(true);
		client.getLocalConfig.mockReturnValue({
			url: 'http://127.0.0.1:3999',
			token: 't',
			timeoutMs: 1000,
		});
		client.healthAt.mockRejectedValue(new Error('down'));
		delete process.env.ROLL_WORKER_SPAWN;
		delete process.env.ROLL_STANDBY_SPAWN;
		const result = await localWorker.startIfConfigured();
		// Primary URL set but unhealthy + SPAWN off in Jest → pending (not fake existing).
		expect(result.primary.pending).toBe(true);
		expect(result.primary.ok).toBe(false);
		expect(result.pending).toBe(true);
		expect(result.local.pending).toBe(true);
		expect(result.local.url).toBe('http://127.0.0.1:3999');
	});

	it('ensurePrimaryWorker does not treat unhealthy URL as existing', async () => {
		localWorker.resetStoppedFlagsForTests();
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3950',
			token: 't',
			timeoutMs: 1000,
		});
		client.healthAt.mockRejectedValue(new Error('ECONNREFUSED'));
		delete process.env.ROLL_WORKER_SPAWN;
		const result = await localWorker.ensurePrimaryWorker();
		expect(result.ok).toBe(false);
		expect(result.pending).toBe(true);
		expect(result.existing).toBeUndefined();
	});

	it('ensurePrimaryWorker forceSpawn rediscovers when configured URL down', async () => {
		localWorker.resetStoppedFlagsForTests();
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3990',
			token: 't',
			timeoutMs: 1000,
		});
		client.healthAt.mockImplementation(async (url) => {
			if (String(url).includes('3990')) throw new Error('down');
			if (String(url).includes('3950')) return { ok: true };
			throw new Error('down');
		});
		process.env.ROLL_WORKER_SPAWN = 'false';
		process.env.ROLL_WORKER_PORT = '3950';
		const result = await localWorker.ensurePrimaryWorker(console, { forceSpawn: true });
		expect(result.ok).toBe(true);
		expect(result.discovered).toBe(true);
		expect(result.existing).toBeUndefined();
		expect(process.env.ROLL_WORKER_URL).toBe('http://127.0.0.1:3950');
	}, 15_000);

	it('restartPrimary after stop rediscovers instead of fake existing', async () => {
		localWorker.resetStoppedFlagsForTests();
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3990',
			token: 't',
			timeoutMs: 1000,
		});
		client.requestAdminShutdown.mockResolvedValue({ ok: true });
		client.healthAt.mockImplementation(async (url) => {
			if (String(url).includes('3990')) throw new Error('down');
			if (String(url).includes('3950')) return { ok: true };
			throw new Error('down');
		});
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3990';
		process.env.ROLL_WORKER_SPAWN = 'false';
		process.env.ROLL_WORKER_PORT = '3950';

		await localWorker.stopPrimary({ drainMs: 10 });
		expect(localWorker.isPrimaryStopped()).toBe(true);

		const restart = await localWorker.restartPrimary({ drainMs: 10 });
		expect(localWorker.isPrimaryStopped()).toBe(false);
		expect(restart.ok).toBe(true);
		expect(restart.mode).toBe('ensure-spawn');
		expect(restart.url).toBe('http://127.0.0.1:3950');
	}, 15_000);

	it('reloadRemote rejects concurrent reload', async () => {
		client.isEnabled.mockReturnValue(true);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:3950',
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
		client.healthAt.mockRejectedValue(new Error('down'));
		process.env.ROLL_WORKER_RELOAD_WAIT_MS = '200';

		const first = localWorker.reloadRemote({ drainMs: 10 });
		await new Promise((r) => setTimeout(r, 20));
		const second = await localWorker.reloadRemote({ drainMs: 10 });
		expect(second.ok).toBe(false);
		expect(second.error).toMatch(/already in progress/i);
		releaseReload();
		const firstResult = await first;
		expect(firstResult.ok).toBe(false);
		expect(firstResult.mode).toBe('reload-sent');
	}, 10_000);

	it('ensureLocalWorker discovers healthy manual Standby before SPAWN', async () => {
		client.isEnabled.mockReturnValue(true);
		client.isLocalEnabled.mockReturnValue(false);
		process.env.ROLL_STANDBY_SPAWN = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_STANDBY_URL;
		client.healthAt.mockResolvedValue({ ok: true });

		const result = await localWorker.ensureLocalWorker();
		expect(result.ok).toBe(true);
		expect(result.discovered).toBe(true);
		expect(result.supervised).toBe(false);
		expect(result.url).toBe('http://127.0.0.1:3951');
		expect(process.env.ROLL_STANDBY_URL).toBe('http://127.0.0.1:3951');
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
		process.env.ROLL_STANDBY_SPAWN = 'true';
		const status = localWorker.getStatus();
		expect(status.localUrl).toBe('http://127.0.0.1:3951');
		expect(status.localEnabled).toBe(true);
		expect(status.spawn).toBe(true);
	});

	it('reloadLocal rejects concurrent reload', async () => {
		process.env.ROLL_STANDBY_RELOAD_WAIT_MS = '200';
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
