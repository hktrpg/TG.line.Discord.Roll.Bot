"use strict";

/**
 * Local HTTP Roll Worker helpers for Gateway hybrid fallback + .root reload.
 *
 * Preferred ops: run one shared `yarn start:roll-worker` on ROLL_LOCAL_WORKER_URL
 * (e.g. :3951). Optional ROLL_LOCAL_WORKER_SPAWN=true lets a single Gateway process
 * own a child — do NOT enable on every Discord hybrid-sharding cluster worker.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const client = require('./client');
const { ensureRollWorkerToken } = require('./ensure-token');

const ROOT = path.join(__dirname, '..', '..');
const LOCK_PATH = path.join(ROOT, 'temp', 'roll-local-worker.lock');
const DEFAULT_LOCAL_PORT = 3951;
const DEFAULT_DRAIN_MS = 1500;
const DEFAULT_HEALTH_WAIT_MS = 25_000;
const DEFAULT_HEALTH_PROBE_MS = 5000;

let childProc = null;
let supervised = false;
let reloading = false;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDrainMs() {
	const n = Number.parseInt(process.env.ROLL_LOCAL_WORKER_DRAIN_MS || String(DEFAULT_DRAIN_MS), 10);
	return Number.isFinite(n) && n >= 0 ? Math.min(n, 30_000) : DEFAULT_DRAIN_MS;
}

function getHealthProbeMs() {
	const n = Number.parseInt(
		process.env.ROLL_LOCAL_WORKER_HEALTH_PROBE_MS || String(DEFAULT_HEALTH_PROBE_MS),
		10
	);
	return Number.isFinite(n) && n > 0 ? Math.min(n, 30_000) : DEFAULT_HEALTH_PROBE_MS;
}

function getSpawnPort() {
	const n = Number.parseInt(process.env.ROLL_LOCAL_WORKER_PORT || String(DEFAULT_LOCAL_PORT), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_LOCAL_PORT;
}

function shouldSpawn() {
	return process.env.ROLL_LOCAL_WORKER_SPAWN === 'true';
}

function isPidAlive(pid) {
	if (!pid || !Number.isFinite(pid)) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function readLock() {
	try {
		const raw = fs.readFileSync(LOCK_PATH, 'utf8');
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function writeLock({ pid, port, url }) {
	try {
		fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
		fs.writeFileSync(LOCK_PATH, JSON.stringify({ pid, port, url, at: Date.now() }, null, 2));
	} catch (error) {
		console.warn('[LocalWorker] lock write failed:', error?.message || error);
	}
}

function clearLockIfOurs(pid) {
	const lock = readLock();
	if (lock?.pid === pid) {
		try {
			fs.unlinkSync(LOCK_PATH);
		} catch {
			/* ignore */
		}
	}
}

async function waitHealth(url, timeoutMs = DEFAULT_HEALTH_WAIT_MS) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const body = await client.healthAt(url);
			if (body?.ok) return body;
		} catch {
			// retry
		}
		await sleep(200);
	}
	throw new Error(`local worker health timeout: ${url}`);
}

/** Wait until /health fails (process exited / not ready). */
async function waitUntilUnhealthy(url, timeoutMs = 10_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const body = await client.healthAt(url);
			if (!body?.ok) return true;
		} catch {
			return true;
		}
		await sleep(100);
	}
	return false;
}

function ensureSharedToken() {
	if (process.env.ROLL_WORKER_ALLOW_NO_TOKEN === 'true') {
		return (process.env.ROLL_WORKER_TOKEN || '').trim();
	}
	ensureRollWorkerToken({ generate: true });
	return (process.env.ROLL_WORKER_TOKEN || '').trim();
}

function spawnChild({ port, token }) {
	const url = `http://127.0.0.1:${port}`;
	const child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
		cwd: ROOT,
		env: {
			...process.env,
			ROLL_WORKER_MODE: 'true',
			ROLL_WORKER_HOST: '127.0.0.1',
			ROLL_WORKER_PORT: String(port),
			ROLL_WORKER_TOKEN: token || process.env.ROLL_WORKER_TOKEN || '',
			// Child must not recurse into another local worker / primary URL.
			ROLL_WORKER_URL: '',
			ROLL_LOCAL_WORKER_URL: '',
			ROLL_LOCAL_WORKER_SPAWN: 'false',
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	child.stdout?.on('data', (buf) => {
		const line = String(buf).trim();
		if (line) console.info(`[LocalWorker:child] ${line}`);
	});
	child.stderr?.on('data', (buf) => {
		const line = String(buf).trim();
		if (line) console.warn(`[LocalWorker:child] ${line}`);
	});
	child.on('exit', (code, signal) => {
		console.warn(`[LocalWorker] child exit code=${code} signal=${signal || ''}`);
		if (childProc === child) {
			childProc = null;
			supervised = false;
		}
		clearLockIfOurs(child.pid);
	});
	return { child, url, port };
}

/**
 * Ensure ROLL_LOCAL_WORKER_URL is usable. Optionally spawn a supervised child.
 * Safe no-op when URL unset and SPAWN off.
 */
async function startIfConfigured(logger = console) {
	const info = typeof logger.info === 'function'
		? (msg) => logger.info(msg)
		: (msg) => console.info(msg);

	const probeMs = getHealthProbeMs();

	if (client.isLocalEnabled()) {
		const { url } = client.getLocalConfig();
		try {
			await waitHealth(url, probeMs);
			info(`[LocalWorker] using existing ${url}`);
			return { ok: true, url, supervised: false };
		} catch {
			if (!shouldSpawn()) {
				info(`[LocalWorker] ROLL_LOCAL_WORKER_URL=${url} not healthy yet (will retry on fallback)`);
				return { ok: false, url, supervised: false, pending: true };
			}
			// SPAWN on: replace dead shared URL with a supervised child on ROLL_LOCAL_WORKER_PORT.
			info(`[LocalWorker] ROLL_LOCAL_WORKER_URL=${url} unhealthy — SPAWN replacement`);
		}
	} else if (!shouldSpawn()) {
		return { ok: false, skipped: true };
	}

	const lock = readLock();
	if (lock?.url && isPidAlive(lock.pid)) {
		try {
			await waitHealth(lock.url, probeMs);
			process.env.ROLL_LOCAL_WORKER_URL = lock.url;
			info(`[LocalWorker] reuse lock pid=${lock.pid} url=${lock.url}`);
			return { ok: true, url: lock.url, supervised: false, reusedLock: true };
		} catch {
			info(`[LocalWorker] lock pid=${lock.pid} unhealthy — spawning replacement`);
			clearLockIfOurs(lock.pid);
		}
	}

	const port = getSpawnPort();
	const token = ensureSharedToken();
	if (!token && process.env.ROLL_WORKER_ALLOW_NO_TOKEN !== 'true') {
		return { ok: false, error: 'ROLL_WORKER_TOKEN missing; cannot spawn local worker' };
	}
	const { child, url } = spawnChild({ port, token });
	childProc = child;
	supervised = true;
	process.env.ROLL_LOCAL_WORKER_URL = url;
	writeLock({ pid: child.pid, port, url });
	await waitHealth(url);
	info(`[LocalWorker] spawned pid=${child.pid} url=${url}`);
	return { ok: true, url, supervised: true, pid: child.pid };
}

async function stopSupervisedChild() {
	if (!childProc || childProc.killed) {
		childProc = null;
		supervised = false;
		return;
	}
	const pid = childProc.pid;
	try {
		childProc.kill('SIGTERM');
	} catch {
		/* ignore */
	}
	const start = Date.now();
	while (Date.now() - start < 5000 && isPidAlive(pid)) {
		await sleep(100);
	}
	if (isPidAlive(pid)) {
		try {
			childProc.kill('SIGKILL');
		} catch {
			/* ignore */
		}
	}
	childProc = null;
	supervised = false;
	clearLockIfOurs(pid);
}

/**
 * Reload local compute.
 * - Supervised SPAWN: Gateway shutdown + respawn child.
 * - Shared local Worker: Worker self-restarts via /v1/admin/reload.
 */
async function reloadLocal({ drainMs = getDrainMs() } = {}) {
	if (reloading) {
		return { ok: false, error: 'reload already in progress' };
	}
	reloading = true;
	try {
		const { url } = client.getLocalConfig();
		if (!url && !supervised) {
			return {
				ok: false,
				error: 'ROLL_LOCAL_WORKER_URL unset (start shared local worker or ROLL_LOCAL_WORKER_SPAWN=true)',
			};
		}
		const targetUrl = url || process.env.ROLL_LOCAL_WORKER_URL;
		const wasSupervised = supervised && childProc;

		if (wasSupervised) {
			if (targetUrl) {
				try {
					await client.requestAdminShutdown(targetUrl, { drainMs });
				} catch (error) {
					// Process may already be dead — continue respawn.
					console.warn('[LocalWorker] supervised shutdown:', error?.message || error);
				}
			}
			await waitUntilUnhealthy(targetUrl, Math.min(drainMs + 3000, 10_000));
			await stopSupervisedChild();
			const port = getSpawnPort();
			const token = ensureSharedToken();
			const spawned = spawnChild({ port, token });
			childProc = spawned.child;
			supervised = true;
			process.env.ROLL_LOCAL_WORKER_URL = spawned.url;
			writeLock({ pid: spawned.child.pid, port: spawned.port, url: spawned.url });
			await waitHealth(spawned.url);
			return {
				ok: true,
				mode: 'supervised-respawn',
				url: spawned.url,
				pid: spawned.child.pid,
				note: 'Discord-coupled needsLocal paths still use Gateway in-process analytics (not reloaded).',
			};
		}

		// Shared / external local Worker: true self-restart (spawn successor + exit).
		let data;
		try {
			data = await client.requestAdminReload(targetUrl, { drainMs });
		} catch (error) {
			return {
				ok: false,
				url: targetUrl,
				error: error?.message || String(error),
				status: error?.status,
				hint: 'Reload requires loopback + Bearer on the local Worker.',
			};
		}

		const down = await waitUntilUnhealthy(targetUrl, Math.min(drainMs + 5000, 15_000));
		if (!down) {
			return {
				ok: false,
				mode: 'reload-uncertain',
				url: targetUrl,
				pid: data?.pid,
				error: 'Reload requested but /health still OK — process may not have restarted',
				hint: 'Check Worker logs; retry .root reload local.',
			};
		}
		const waitMs = Number.parseInt(process.env.ROLL_LOCAL_WORKER_RELOAD_WAIT_MS || '15000', 10);
		try {
			await waitHealth(targetUrl, Number.isFinite(waitMs) ? waitMs : 15_000);
			return {
				ok: true,
				mode: 'self-restart',
				url: targetUrl,
				pid: data?.pid,
				note: 'Local Worker self-restarted (successor process). Discord Gateway was not restarted.',
			};
		} catch {
			return {
				ok: false,
				mode: 'reload-sent',
				url: targetUrl,
				pid: data?.pid,
				error: 'Local Worker reload started but /health did not return',
				hint: 'Check Worker logs; start yarn start:roll-worker on ROLL_LOCAL_WORKER_URL if needed.',
			};
		}
	} finally {
		reloading = false;
	}
}

/**
 * Reload primary ROLL_WORKER_URL via Worker self-restart (/v1/admin/reload).
 * Waits for health to drop then return — no PM2 required on loopback.
 */
async function reloadRemote({ drainMs = getDrainMs() } = {}) {
	if (!client.isEnabled()) {
		return { ok: false, error: 'ROLL_WORKER_URL unset' };
	}
	const { url } = client.getConfig();
	let data;
	try {
		data = await client.requestAdminReload(url, { drainMs });
	} catch (error) {
		const status = error?.status;
		return {
			ok: false,
			url,
			error: error?.message || String(error),
			status,
			hint: status === 403
				? 'Worker refused non-loopback admin reload. Run reload on the Worker host or use SSH/PM2 there.'
				: 'Reload failed. Confirm ROLL_WORKER_URL is reachable on loopback with a valid Bearer token.',
		};
	}

	const down = await waitUntilUnhealthy(url, Math.min(drainMs + 5000, 15_000));
	if (!down) {
		return {
			ok: false,
			mode: 'reload-uncertain',
			url,
			pid: data?.pid,
			error: 'Reload requested but /health still OK — process may not have restarted',
			hint: 'Check Worker logs; retry .root reload remote.',
		};
	}

	const waitMs = Number.parseInt(
		process.env.ROLL_WORKER_RELOAD_WAIT_MS
			|| process.env.ROLL_LOCAL_WORKER_RELOAD_WAIT_MS
			|| '15000',
		10,
	);
	try {
		await waitHealth(url, Number.isFinite(waitMs) && waitMs > 0 ? waitMs : 15_000);
		return {
			ok: true,
			mode: 'self-restart',
			url,
			pid: data?.pid,
			note: 'Primary Roll Worker self-restarted (successor process). Gateway Discord connection was not restarted.',
		};
	} catch {
		return {
			ok: false,
			mode: 'reload-sent',
			url,
			pid: data?.pid,
			error: 'Primary Roll Worker reload started but /health did not return',
			hint: 'Check Worker logs on the host. If the successor failed to bind the port, start yarn start:roll-worker manually.',
			warning: 'ROLL_WORKER_URL may be down until the Worker is running again. Discord Gateway stays up.',
		};
	}
}

async function reload(target = 'local') {
	const t = String(target || 'local').toLowerCase();
	if (t === 'remote') return reloadRemote();
	if (t === 'all') {
		const local = await reloadLocal();
		const remote = await reloadRemote();
		return { ok: Boolean(local.ok || remote.ok), local, remote };
	}
	return reloadLocal();
}

function getStatus() {
	const local = client.getLocalConfig();
	return {
		localUrl: local.url || null,
		localEnabled: client.isLocalEnabled(),
		spawn: shouldSpawn(),
		supervised,
		childPid: childProc?.pid || null,
		reloading,
		lock: readLock(),
	};
}

async function shutdown() {
	if (supervised) {
		await stopSupervisedChild();
	}
}

module.exports = {
	DEFAULT_LOCAL_PORT,
	startIfConfigured,
	reload,
	reloadLocal,
	reloadRemote,
	getStatus,
	shutdown,
	waitHealth,
	waitUntilUnhealthy,
};
