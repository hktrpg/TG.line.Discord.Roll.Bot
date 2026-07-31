"use strict";

/**
 * Phase A/B: /v1/admin/shutdown + /v1/admin/reload (self-restart),
 * supervised local respawn, shared local + remote reload without PM2.
 * Avoids requiring analytics via parse-router (Babel breaks on chat/logs top-level return).
 */
jest.setTimeout(90_000);

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
	findRollModuleName: jest.fn(() => '0-advroll'),
}));

jest.mock('../modules/roll-worker/character-action', () => ({
	runCharacterAction: jest.fn(),
}));

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const request = require('node:http');

const ROOT = path.join(__dirname, '..');
const LOCK_PATH = path.join(ROOT, 'temp', 'roll-local-worker.lock');
// Keep clear of phase3k/l/m (3973–3975) — Jest runs live spawn suites in parallel.
const PORT = 3985;
const PORT_R = 3986;
const TOKEN = 'phase-ab-reload-token';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpJson(port, method, urlPath, body, extraHeaders = {}) {
	return new Promise((resolve, reject) => {
		const data = body ? JSON.stringify(body) : null;
		const req = request.request({
			hostname: '127.0.0.1',
			port,
			path: urlPath,
			method,
			headers: {
				'Content-Type': 'application/json',
				...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
				...extraHeaders,
			},
		}, (res) => {
			let raw = '';
			res.on('data', (chunk) => { raw += chunk; });
			res.on('end', () => {
				let json = null;
				try { json = raw ? JSON.parse(raw) : null; } catch { json = raw; }
				resolve({ status: res.statusCode, body: json });
			});
		});
		req.on('error', reject);
		if (data) req.write(data);
		req.end();
	});
}

async function waitHealth(port, timeoutMs = 25_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await httpJson(port, 'GET', '/health', null, {
				Authorization: `Bearer ${TOKEN}`,
			});
			// Require authenticated detail so a leftover worker with another token cannot pass.
			if (res.status === 200 && res.body.ok && typeof res.body.parseCount === 'number') {
				return res.body;
			}
		} catch {
			// retry
		}
		await sleep(200);
	}
	throw new Error(`health timeout :${port}`);
}

describe('roll-worker admin shutdown (unit app)', () => {
	const { createRollWorkerApp } = require('../modules/roll-worker/server');
	let server;
	let port;
	const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

	beforeAll(async () => {
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		const app = createRollWorkerApp({ allowNoToken: false, disableRateLimit: true });
		server = await new Promise((resolve) => {
			const s = app.listen(0, '127.0.0.1', () => resolve(s));
		});
		port = server.address().port;
	});

	afterAll(async () => {
		exitSpy.mockRestore();
		await new Promise((resolve) => server.close(resolve));
	});

	it('POST /v1/admin/shutdown accepts loopback + Bearer', async () => {
		const res = await httpJson(port, 'POST', '/v1/admin/shutdown', { drainMs: 10 }, {
			Authorization: `Bearer ${TOKEN}`,
		});
		expect(res.status).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.shuttingDown).toBe(true);
		await sleep(80);
		expect(exitSpy).toHaveBeenCalledWith(0);
	});

	it('POST /v1/admin/shutdown rejects bad token', async () => {
		exitSpy.mockClear();
		const res = await httpJson(port, 'POST', '/v1/admin/shutdown', { drainMs: 10 }, {
			Authorization: 'Bearer wrong',
		});
		expect(res.status).toBe(401);
		expect(exitSpy).not.toHaveBeenCalled();
	});
});

describe('roll-worker admin reload (unit app)', () => {
	const { createRollWorkerApp } = require('../modules/roll-worker/server');
	let server;
	let port;
	let reloadCalls;

	beforeAll(async () => {
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		reloadCalls = [];
		const app = createRollWorkerApp({
			allowNoToken: false,
			disableRateLimit: true,
			performAdminReload: (ctx) => {
				reloadCalls.push(ctx);
			},
		});
		server = await new Promise((resolve) => {
			const s = app.listen(0, '127.0.0.1', () => resolve(s));
		});
		app.locals.httpServer = server;
		port = server.address().port;
	});

	afterAll(async () => {
		await new Promise((resolve) => server.close(resolve));
	});

	it('POST /v1/admin/reload accepts loopback + Bearer and schedules self-restart', async () => {
		reloadCalls.length = 0;
		const res = await httpJson(port, 'POST', '/v1/admin/reload', { drainMs: 25 }, {
			Authorization: `Bearer ${TOKEN}`,
		});
		expect(res.status).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.reloading).toBe(true);
		expect(res.body.mode).toBe('self-restart');
		expect(res.body.shuttingDown).toBeUndefined();
		expect(reloadCalls).toHaveLength(1);
		expect(reloadCalls[0].drainMs).toBe(25);
		expect(reloadCalls[0].httpServer).toBe(server);
	});

	it('POST /v1/admin/reload rejects bad token', async () => {
		const before = reloadCalls.length;
		const res = await httpJson(port, 'POST', '/v1/admin/reload', { drainMs: 10 }, {
			Authorization: 'Bearer wrong',
		});
		expect(res.status).toBe(401);
		expect(reloadCalls).toHaveLength(before);
	});
});

describe('Phase A supervised local reload (live)', () => {
	let localWorker;
	const saved = {};

	beforeAll(async () => {
		for (const key of [
			'ROLL_WORKER_TOKEN',
			'ROLL_WORKER_SPAWN', 'ROLL_STANDBY_SPAWN',
			'ROLL_STANDBY_PORT',
			'ROLL_STANDBY_URL',
			'ROLL_WORKER_DRAIN_MS',
			'ROLL_WORKER_URL',
		]) {
			saved[key] = process.env[key];
		}
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		process.env.ROLL_WORKER_SPAWN = 'true';
		process.env.ROLL_STANDBY_SPAWN = 'true';
		process.env.ROLL_STANDBY_PORT = String(PORT);
		process.env.ROLL_WORKER_DRAIN_MS = '200';
		delete process.env.ROLL_STANDBY_URL;
		// Avoid primary URL side-effects during spawn-only test.
		delete process.env.ROLL_WORKER_URL;
		try { fs.unlinkSync(LOCK_PATH); } catch { /* ignore */ }
		jest.resetModules();
		localWorker = require('../modules/roll-worker/local-worker');
		const started = await localWorker.startIfConfigured();
		expect(started.ok).toBe(true);
		expect(started.supervised).toBe(true);
		await waitHealth(PORT);
	});

	afterAll(async () => {
		try {
			await localWorker.shutdown();
		} catch {
			/* ignore */
		}
		for (const [key, value] of Object.entries(saved)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	});

	it('reloadLocal respawns supervised child and health returns', async () => {
		const before = localWorker.getStatus();
		expect(before.supervised).toBe(true);
		const result = await localWorker.reloadLocal({ drainMs: 200 });
		expect(result.ok).toBe(true);
		expect(result.mode).toBe('supervised-respawn');
		await waitHealth(PORT);
		const after = localWorker.getStatus();
		expect(after.localUrl).toContain(String(PORT));
		expect(after.childPid).toBeTruthy();
		if (before.childPid) {
			expect(after.childPid).not.toBe(before.childPid);
		}
	});
});

describe('Phase A external local reload without PM2 (live)', () => {
	let child;
	const PORT_E = 3987;
	const saved = {};

	beforeAll(async () => {
		for (const key of [
			'ROLL_WORKER_TOKEN',
			'ROLL_STANDBY_URL',
			'ROLL_WORKER_SPAWN', 'ROLL_STANDBY_SPAWN',
			'ROLL_STANDBY_RELOAD_WAIT_MS',
			'ROLL_WORKER_URL',
		]) {
			saved[key] = process.env[key];
		}
		child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
			cwd: ROOT,
			env: {
				...process.env,
				ROLL_WORKER_MODE: 'true',
				ROLL_WORKER_HOST: '127.0.0.1',
				ROLL_WORKER_PORT: String(PORT_E),
				ROLL_WORKER_TOKEN: TOKEN,
				ROLL_WORKER_URL: '',
				ROLL_WORKER_SPAWN: 'false', ROLL_STANDBY_SPAWN: 'false',
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		process.env.ROLL_STANDBY_URL = `http://127.0.0.1:${PORT_E}`;
		process.env.ROLL_WORKER_SPAWN = 'false';
		process.env.ROLL_STANDBY_SPAWN = 'false';
		process.env.ROLL_STANDBY_RELOAD_WAIT_MS = '15000';
		delete process.env.ROLL_WORKER_URL;
		await waitHealth(PORT_E);
		jest.resetModules();
	});

	afterAll(async () => {
		try {
			await httpJson(PORT_E, 'POST', '/v1/admin/shutdown', { drainMs: 50 }, {
				Authorization: `Bearer ${TOKEN}`,
			});
			await sleep(400);
		} catch { /* ignore */ }
		if (child && !child.killed) {
			child.kill('SIGTERM');
			await sleep(400);
			try { child.kill('SIGKILL'); } catch { /* ignore */ }
		}
		for (const [key, value] of Object.entries(saved)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	});

	it('reloadLocal self-restarts shared worker and health returns', async () => {
		const localWorker = require('../modules/roll-worker/local-worker');
		const beforePid = child?.pid;
		// Ensure pre-reload uptime is high enough that a successor's fresh uptime is clearly lower.
		let beforeHealth = await waitHealth(PORT_E);
		while (beforeHealth.uptime < 4) {
			await sleep(500);
			beforeHealth = await waitHealth(PORT_E);
		}
		const result = await localWorker.reloadLocal({ drainMs: 150 });
		expect(result).toMatchObject({ ok: true, mode: 'self-restart' });
		const afterHealth = await waitHealth(PORT_E);
		// Old child handle is obsolete; successor is detached.
		child = null;
		if (beforePid) {
			expect(result.pid).toBe(beforePid);
		}
		expect(afterHealth.ok).toBe(true);
		expect(afterHealth.uptime).toBeLessThan(beforeHealth.uptime);
	}, 30_000);
});

describe('Phase B reloadRemote against live primary', () => {
	let child;
	const prevUrl = process.env.ROLL_WORKER_URL;
	const prevToken = process.env.ROLL_WORKER_TOKEN;

	beforeAll(async () => {
		child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
			cwd: ROOT,
			env: {
				...process.env,
				ROLL_WORKER_MODE: 'true',
				ROLL_WORKER_HOST: '127.0.0.1',
				ROLL_WORKER_PORT: String(PORT_R),
				ROLL_WORKER_TOKEN: TOKEN,
				ROLL_WORKER_URL: '',
				ROLL_WORKER_SPAWN: 'false', ROLL_STANDBY_SPAWN: 'false',
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PORT_R}`;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		process.env.ROLL_WORKER_RELOAD_WAIT_MS = '15000';
		await waitHealth(PORT_R);
	});

	afterAll(async () => {
		if (prevUrl === undefined) delete process.env.ROLL_WORKER_URL;
		else process.env.ROLL_WORKER_URL = prevUrl;
		if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prevToken;
		// Stop whatever is listening (may be a detached successor).
		try {
			await httpJson(PORT_R, 'POST', '/v1/admin/shutdown', { drainMs: 50 }, {
				Authorization: `Bearer ${TOKEN}`,
			});
			await sleep(400);
		} catch { /* ignore */ }
		if (child && !child.killed) {
			child.kill('SIGTERM');
			await sleep(200);
			try { child.kill('SIGKILL'); } catch { /* ignore */ }
		}
	});

	it('reloadRemote self-restarts and health returns without PM2', async () => {
		jest.resetModules();
		const localWorker = require('../modules/roll-worker/local-worker');
		const beforePid = child?.pid;
		let beforeHealth = await waitHealth(PORT_R);
		while (beforeHealth.uptime < 4) {
			await sleep(500);
			beforeHealth = await waitHealth(PORT_R);
		}
		const result = await localWorker.reloadRemote({ drainMs: 150 });
		expect(result.ok).toBe(true);
		expect(result.mode).toBe('self-restart');
		const afterHealth = await waitHealth(PORT_R);
		child = null;
		if (beforePid) {
			expect(result.pid).toBe(beforePid);
		}
		expect(afterHealth.ok).toBe(true);
		// Successor is a new process — uptime must be lower than the pre-reload process.
		expect(afterHealth.uptime).toBeLessThan(beforeHealth.uptime);
	}, 30_000);
});
