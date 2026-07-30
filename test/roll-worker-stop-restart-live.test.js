"use strict";

/**
 * Live smoke: spawn Primary + Standby, .root-equivalent stop/restart via local-worker.
 */
jest.setTimeout(90_000);

const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..');
const PORT_P = 3981;
const PORT_S = 3982;
const TOKEN = 'live-stop-restart-token';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpJson(port, method, urlPath, body = null) {
	return new Promise((resolve, reject) => {
		const data = body ? JSON.stringify(body) : null;
		const req = http.request({
			hostname: '127.0.0.1',
			port,
			path: urlPath,
			method,
			headers: {
				Authorization: `Bearer ${TOKEN}`,
				'Content-Type': 'application/json',
				...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
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
			const res = await httpJson(port, 'GET', '/health');
			if (res.status === 200 && res.body?.ok) return res.body;
		} catch {
			/* retry */
		}
		await sleep(200);
	}
	throw new Error(`health timeout :${port}`);
}

function spawnWorker(port) {
	const child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
		cwd: ROOT,
		env: {
			...process.env,
			ROLL_WORKER_MODE: 'true',
			ROLL_WORKER_PORT: String(port),
			ROLL_WORKER_TOKEN: TOKEN,
			ROLL_WORKER_SPAWN: 'false', ROLL_STANDBY_SPAWN: 'false',
			NODE_ENV: 'production',
		},
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: false,
	});
	return child;
}

describe('live stop / restart Primary + Standby', () => {
	let primaryChild;
	let standbyChild;
	let localWorker;

	beforeAll(async () => {
		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PORT_P}`;
		process.env.ROLL_STANDBY_URL = `http://127.0.0.1:${PORT_S}`;
		process.env.ROLL_WORKER_PORT = String(PORT_P);
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		process.env.ROLL_WORKER_DRAIN_MS = '200';
		process.env.ROLL_WORKER_HEALTH_PROBE_MS = '2000';
		process.env.ROLL_STANDBY_RELOAD_WAIT_MS = '15000';
		process.env.ROLL_WORKER_SPAWN = 'true';
		delete process.env.ROLL_WORKER_MODE;

		primaryChild = spawnWorker(PORT_P);
		standbyChild = spawnWorker(PORT_S);
		await waitHealth(PORT_P);
		await waitHealth(PORT_S);

		jest.resetModules();
		localWorker = require('../modules/roll-worker/local-worker');
		localWorker.resetStoppedFlagsForTests();
	});

	afterAll(async () => {
		try {
			await localWorker?.shutdown();
		} catch {
			/* ignore */
		}
		try {
			localWorker?.resetStoppedFlagsForTests();
		} catch {
			/* ignore */
		}
		for (const child of [primaryChild, standbyChild]) {
			if (!child || child.killed) continue;
			try {
				child.kill('SIGTERM');
			} catch {
				/* ignore */
			}
		}
		await sleep(500);
	});

	it('stop primary then restart primary brings /health back', async () => {
		const stop = await localWorker.stopPrimary({ drainMs: 200 });
		expect(stop.ok).toBe(true);
		expect(localWorker.isPrimaryStopped()).toBe(true);

		await sleep(400);
		await expect(httpJson(PORT_P, 'GET', '/health')).rejects.toThrow();

		// restartPrimary must spawn/rediscover — no manual spawn workaround.
		const restart = await localWorker.restartPrimary({ drainMs: 200 });
		expect(restart.ok).toBe(true);
		expect(localWorker.isPrimaryStopped()).toBe(false);
		await waitHealth(PORT_P);
	});

	it('restart standby self-restarts on same port', async () => {
		const before = await waitHealth(PORT_S);
		const result = await localWorker.restartStandby({ drainMs: 200 });
		expect(result.ok).toBe(true);
		expect(['self-restart', 'ensure-spawn', 'supervised-respawn']).toContain(result.mode);
		const after = await waitHealth(PORT_S);
		expect(after.ok).toBe(true);
		// Successor may be a new process; health must recover.
		expect(after).toBeTruthy();
		expect(before).toBeTruthy();
	});
});
