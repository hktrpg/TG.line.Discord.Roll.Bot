"use strict";

/**
 * Gateway auto-frame helpers (Primary + Standby) + .root restart / stop.
 *
 * Default (SPAWN unset): Gateway auto-discovers/spawns Primary (:3950)
 * then Standby (:3951). Opt-out: ROLL_LOCAL_WORKER_SPAWN=false → Embedded only.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const client = require('./client');
const { ensureRollWorkerToken } = require('./ensure-token');

const ROOT = path.join(__dirname, '..', '..');
const LOCK_PATH = path.join(ROOT, 'temp', 'roll-local-worker.lock');
const PRIMARY_LOCK_PATH = path.join(ROOT, 'temp', 'roll-primary-worker.lock');
const DEFAULT_LOCAL_PORT = 3951;
const DEFAULT_PRIMARY_PORT = 3950;
const DEFAULT_DRAIN_MS = 1500;
const DEFAULT_HEALTH_WAIT_MS = 25_000;
const DEFAULT_HEALTH_PROBE_MS = 5000;

/** Supervised Standby child. */
let childProc = null;
let supervised = false;
/** Supervised Primary child (when ROLL_WORKER_URL was unset). */
let primaryChildProc = null;
let primarySupervised = false;
let reloading = false;
/** Operator stop: block auto-ensure / parse until .root restart. */
let stoppedPrimary = false;
let stoppedStandby = false;

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

function spawnFlag() {
	return (process.env.ROLL_LOCAL_WORKER_SPAWN || '').trim().toLowerCase();
}

/** Global auto-spawn opt-out / force (primary + local). */
function shouldAutoSpawnWorkers() {
	const flag = spawnFlag();
	if (flag === 'false' || flag === '0' || flag === 'off') return false;
	if (process.env.ROLL_WORKER_MODE === 'true') return false;
	if (flag === 'true' || flag === '1' || flag === 'on') return true;
	// Jest / unit tests: never auto-spawn unless SPAWN=true (avoids live children).
	if (process.env.NODE_ENV === 'test') return false;
	// Default: Gateway auto-frames Workers even when ROLL_WORKER_URL unset.
	return true;
}

function getPrimaryWorkerPort() {
	const raw = (process.env.ROLL_WORKER_URL || '').trim();
	if (!raw) return null;
	try {
		const u = new URL(raw);
		if (u.port) return Number.parseInt(u.port, 10);
		if (u.protocol === 'https:') return 443;
		if (u.protocol === 'http:') return 80;
	} catch {
		/* ignore */
	}
	return null;
}

function getPrimarySpawnPort() {
	const n = Number.parseInt(process.env.ROLL_WORKER_PORT || String(DEFAULT_PRIMARY_PORT), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_PRIMARY_PORT;
}

function getSpawnPort() {
	const n = Number.parseInt(process.env.ROLL_LOCAL_WORKER_PORT || String(DEFAULT_LOCAL_PORT), 10);
	let port = Number.isFinite(n) && n > 0 ? n : DEFAULT_LOCAL_PORT;
	const primaryPort = getPrimaryWorkerPort() || getPrimarySpawnPort();
	if (primaryPort && port === primaryPort) {
		port = primaryPort === DEFAULT_LOCAL_PORT ? 3952 : DEFAULT_LOCAL_PORT;
	}
	return port;
}

/**
 * Whether Gateway may spawn a supervised Local Worker.
 * Requires primary URL (after ensurePrimary) and not REMOTE_ONLY.
 */
function shouldSpawn() {
	if (!shouldAutoSpawnWorkers()) return false;
	if (process.env.ROLL_WORKER_REMOTE_ONLY === 'true') return false;
	return Boolean((process.env.ROLL_WORKER_URL || '').trim());
}

/** Only explicit SPAWN=true may replace an operator-set ROLL_LOCAL_WORKER_URL. */
function shouldReplaceUnhealthyUrl() {
	const flag = spawnFlag();
	return flag === 'true' || flag === '1' || flag === 'on';
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

function readLockFile(lockPath) {
	try {
		const raw = fs.readFileSync(lockPath, 'utf8');
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function writeLockFile(lockPath, { pid, port, url }) {
	try {
		fs.mkdirSync(path.dirname(lockPath), { recursive: true });
		fs.writeFileSync(lockPath, JSON.stringify({ pid, port, url, at: Date.now() }, null, 2));
	} catch (error) {
		console.warn('[Standby] lock write failed:', error?.message || error);
	}
}

function clearLockFileIfPid(lockPath, pid) {
	const lock = readLockFile(lockPath);
	if (lock?.pid === pid) {
		try {
			fs.unlinkSync(lockPath);
		} catch {
			/* ignore */
		}
	}
}

function readLock() {
	return readLockFile(LOCK_PATH);
}

function writeLock(payload) {
	writeLockFile(LOCK_PATH, payload);
}

function clearLockIfOurs(pid) {
	clearLockFileIfPid(LOCK_PATH, pid);
}

function readPrimaryLock() {
	return readLockFile(PRIMARY_LOCK_PATH);
}

function writePrimaryLock(payload) {
	writeLockFile(PRIMARY_LOCK_PATH, payload);
}

function clearPrimaryLockIfOurs(pid) {
	clearLockFileIfPid(PRIMARY_LOCK_PATH, pid);
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

function spawnChild({ port, token, role = 'local' }) {
	const url = `http://127.0.0.1:${port}`;
	const label = role === 'primary' ? 'PrimaryWorker' : 'LocalWorker';
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
		if (line) console.info(`[${label}:child] ${line}`);
	});
	child.stderr?.on('data', (buf) => {
		const line = String(buf).trim();
		if (line) console.warn(`[${label}:child] ${line}`);
	});
	child.on('exit', (code, signal) => {
		console.warn(`[${label}] child exit code=${code} signal=${signal || ''}`);
		if (role === 'primary') {
			if (primaryChildProc === child) {
				primaryChildProc = null;
				primarySupervised = false;
			}
			clearPrimaryLockIfOurs(child.pid);
			return;
		}
		if (childProc === child) {
			childProc = null;
			supervised = false;
		}
		clearLockIfOurs(child.pid);
	});
	return { child, url, port };
}

/**
 * Ensure ROLL_WORKER_URL: discover existing :3950, reuse lock, or auto-spawn.
 */
function isPrimaryStopped() {
	return stoppedPrimary === true;
}

function isStandbyStopped() {
	return stoppedStandby === true;
}

/** @internal Jest / process recycle */
function resetStoppedFlagsForTests() {
	stoppedPrimary = false;
	stoppedStandby = false;
}

async function ensurePrimaryWorker(logger = console) {
	const info = typeof logger.info === 'function'
		? (msg) => logger.info(msg)
		: (msg) => console.info(msg);
	const probeMs = getHealthProbeMs();

	if (stoppedPrimary) {
		return { ok: false, skipped: true, stopped: true };
	}

	if (client.isEnabled()) {
		const { url } = client.getConfig();
		return { ok: true, url, supervised: false, existing: true };
	}
	if (!shouldAutoSpawnWorkers()) {
		return { ok: false, skipped: true };
	}

	const port = getPrimarySpawnPort();
	const defaultUrl = `http://127.0.0.1:${port}`;

	try {
		await waitHealth(defaultUrl, probeMs);
		process.env.ROLL_WORKER_URL = defaultUrl;
		info(`[Primary] discovered existing ${defaultUrl}`);
		return { ok: true, url: defaultUrl, supervised: false, discovered: true };
	} catch {
		/* spawn path */
	}

	const lock = readPrimaryLock();
	if (lock?.url && isPidAlive(lock.pid)) {
		try {
			await waitHealth(lock.url, probeMs);
			process.env.ROLL_WORKER_URL = lock.url;
			info(`[Primary] reuse lock pid=${lock.pid} url=${lock.url}`);
			return { ok: true, url: lock.url, supervised: false, reusedLock: true };
		} catch {
			info(`[Primary] lock pid=${lock.pid} unhealthy — spawning replacement`);
			clearPrimaryLockIfOurs(lock.pid);
		}
	}

	const token = ensureSharedToken();
	if (!token && process.env.ROLL_WORKER_ALLOW_NO_TOKEN !== 'true') {
		return { ok: false, error: 'ROLL_WORKER_TOKEN missing; cannot spawn primary worker' };
	}
	const { child, url } = spawnChild({ port, token, role: 'primary' });
	primaryChildProc = child;
	primarySupervised = true;
	process.env.ROLL_WORKER_URL = url;
	writePrimaryLock({ pid: child.pid, port, url });
	await waitHealth(url);
	info(`[Primary] spawned pid=${child.pid} url=${url}`);
	return { ok: true, url, supervised: true, pid: child.pid };
}

/**
 * Ensure ROLL_LOCAL_WORKER_URL (after primary is available).
 */
async function ensureLocalWorker(logger = console) {
	const info = typeof logger.info === 'function'
		? (msg) => logger.info(msg)
		: (msg) => console.info(msg);

	const probeMs = getHealthProbeMs();

	if (stoppedStandby) {
		return { ok: false, skipped: true, stopped: true };
	}

	if (client.isLocalEnabled()) {
		const { url } = client.getLocalConfig();
		try {
			await waitHealth(url, probeMs);
			info(`[Standby] using existing ${url}`);
			return { ok: true, url, supervised: false };
		} catch {
			if (!shouldReplaceUnhealthyUrl()) {
				info(`[Standby] ROLL_LOCAL_WORKER_URL=${url} not healthy yet (will retry on fallback)`);
				return { ok: false, url, supervised: false, pending: true };
			}
			info(`[Standby] ROLL_LOCAL_WORKER_URL=${url} unhealthy — SPAWN replacement`);
		}
	} else if (!shouldSpawn()) {
		return { ok: false, skipped: true };
	}

	const lock = readLock();
	if (lock?.url && isPidAlive(lock.pid)) {
		try {
			await waitHealth(lock.url, probeMs);
			process.env.ROLL_LOCAL_WORKER_URL = lock.url;
			info(`[Standby] reuse lock pid=${lock.pid} url=${lock.url}`);
			return { ok: true, url: lock.url, supervised: false, reusedLock: true };
		} catch {
			info(`[Standby] lock pid=${lock.pid} unhealthy — spawning replacement`);
			clearLockIfOurs(lock.pid);
		}
	}

	const port = getSpawnPort();
	const token = ensureSharedToken();
	if (!token && process.env.ROLL_WORKER_ALLOW_NO_TOKEN !== 'true') {
		return { ok: false, error: 'ROLL_WORKER_TOKEN missing; cannot spawn local worker' };
	}
	const { child, url } = spawnChild({ port, token, role: 'local' });
	childProc = child;
	supervised = true;
	process.env.ROLL_LOCAL_WORKER_URL = url;
	writeLock({ pid: child.pid, port, url });
	await waitHealth(url);
	info(`[Standby] spawned pid=${child.pid} url=${url}`);
	return { ok: true, url, supervised: true, pid: child.pid };
}

/**
 * Ensure primary then local Workers (auto when SPAWN not false).
 */
async function startIfConfigured(logger = console) {
	const primary = await ensurePrimaryWorker(logger);
	const local = await ensureLocalWorker(logger);
	return {
		ok: Boolean(primary?.ok || local?.ok),
		primary,
		local,
		url: local?.url || primary?.url || null,
		supervised: Boolean(local?.supervised || primary?.supervised),
		reusedLock: Boolean(local?.reusedLock || primary?.reusedLock),
		pending: Boolean(local?.pending),
		skipped: Boolean(primary?.skipped && local?.skipped),
	};
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
 * Restart Standby compute (clears stopped flag).
 * - Supervised SPAWN: Gateway shutdown + respawn child.
 * - Shared Standby: self-restart via /v1/admin/reload.
 * - If down after stop: ensure/spawn.
 */
async function restartStandby({ drainMs = getDrainMs() } = {}) {
	stoppedStandby = false;
	const { url } = client.getLocalConfig();
	const targetUrl = url || process.env.ROLL_LOCAL_WORKER_URL;
	if (targetUrl) {
		try {
			await waitHealth(targetUrl, getHealthProbeMs());
			return reloadLocal({ drainMs });
		} catch {
			/* down — ensure path */
		}
	}
	const ensured = await ensureLocalWorker(console);
	if (ensured?.ok) {
		return {
			ok: true,
			mode: ensured.supervised ? 'supervised-respawn' : 'ensure-spawn',
			url: ensured.url,
			pid: ensured.pid,
			note: 'Standby was down; ensure/spawn completed. Discord Gateway was not restarted.',
		};
	}
	return {
		ok: false,
		error: ensured?.error
			|| 'Standby unavailable (set ROLL_LOCAL_WORKER_URL or allow auto SPAWN)',
	};
}

/**
 * Restart Primary compute (clears stopped flag).
 */
async function restartPrimary({ drainMs = getDrainMs() } = {}) {
	stoppedPrimary = false;
	if (client.isEnabled()) {
		const { url } = client.getConfig();
		try {
			await waitHealth(url, getHealthProbeMs());
			return reloadRemote({ drainMs });
		} catch {
			/* down — ensure path */
		}
	}
	const ensured = await ensurePrimaryWorker(console);
	if (ensured?.ok) {
		return {
			ok: true,
			mode: ensured.supervised ? 'supervised-respawn' : 'ensure-spawn',
			url: ensured.url,
			pid: ensured.pid,
			note: 'Primary was down; ensure/spawn completed. Gateway Discord connection was not restarted.',
		};
	}
	return {
		ok: false,
		error: ensured?.error || 'ROLL_WORKER_URL unset (auto-spawn disabled?)',
	};
}

/**
 * Reload local compute (internal; prefer restartStandby).
 * - Supervised SPAWN: Gateway shutdown + respawn child.
 * - Shared local Worker: Worker self-restarts via /v1/admin/reload.
 */
async function reloadLocal({ drainMs = getDrainMs() } = {}) {
	if (reloading) {
		return { ok: false, error: 'restart already in progress' };
	}
	reloading = true;
	try {
		const { url } = client.getLocalConfig();
		if (!url && !supervised) {
			return {
				ok: false,
				error: 'ROLL_LOCAL_WORKER_URL unset (auto-spawn disabled? set URL or remove ROLL_LOCAL_WORKER_SPAWN=false)',
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
					console.warn('[Standby] supervised shutdown:', error?.message || error);
				}
			}
			await waitUntilUnhealthy(targetUrl, Math.min(drainMs + 3000, 10_000));
			await stopSupervisedChild();
			const port = getSpawnPort();
			const token = ensureSharedToken();
			const spawned = spawnChild({ port, token, role: 'local' });
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
				hint: 'Restart requires loopback + Bearer on the Standby process.',
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
				hint: 'Check Standby logs; retry .root restart standby.',
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
				note: 'Standby self-restarted (successor process). Discord Gateway was not restarted.',
			};
		} catch {
			return {
				ok: false,
				mode: 'reload-sent',
				url: targetUrl,
				pid: data?.pid,
				error: 'Standby reload started but /health did not return',
				hint: 'Check Standby logs; start yarn start:roll-worker on ROLL_LOCAL_WORKER_URL if needed.',
			};
		}
	} finally {
		reloading = false;
	}
}

/**
 * Reload primary ROLL_WORKER_URL via Worker self-restart (/v1/admin/reload).
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
				? 'Primary refused non-loopback admin reload. Run restart on the Primary host or use SSH/PM2 there.'
				: 'Restart failed. Confirm ROLL_WORKER_URL is reachable on loopback with a valid Bearer token.',
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
			hint: 'Check Primary logs; retry .root restart primary.',
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
			note: 'Primary self-restarted (successor process). Gateway Discord connection was not restarted.',
		};
	} catch {
		return {
			ok: false,
			mode: 'reload-sent',
			url,
			pid: data?.pid,
			error: 'Primary reload started but /health did not return',
			hint: 'Check Primary logs on the host. If the successor failed to bind the port, start yarn start:roll-worker manually.',
			warning: 'ROLL_WORKER_URL may be down until Primary is running again. Discord Gateway stays up.',
		};
	}
}

async function stopStandby({ drainMs = getDrainMs() } = {}) {
	if (reloading) {
		return { ok: false, error: 'restart already in progress' };
	}
	reloading = true;
	try {
		stoppedStandby = true;
		const { url } = client.getLocalConfig();
		const targetUrl = url || process.env.ROLL_LOCAL_WORKER_URL;
		const wasSupervised = supervised && childProc;

		if (wasSupervised) {
			if (targetUrl) {
				try {
					await client.requestAdminShutdown(targetUrl, { drainMs });
				} catch (error) {
					console.warn('[Standby] stop shutdown:', error?.message || error);
				}
			}
			await waitUntilUnhealthy(targetUrl, Math.min(drainMs + 3000, 10_000));
			await stopSupervisedChild();
			return {
				ok: true,
				mode: 'stopped',
				url: targetUrl || null,
				note: 'Standby stopped; auto-spawn blocked until .root restart standby.',
			};
		}

		if (!targetUrl) {
			return {
				ok: true,
				mode: 'stopped',
				url: null,
				note: 'No Standby URL; flag set so auto-spawn stays off until restart.',
			};
		}

		try {
			await client.requestAdminShutdown(targetUrl, { drainMs });
		} catch (error) {
			console.warn('[Standby] stop shutdown:', error?.message || error);
		}
		await waitUntilUnhealthy(targetUrl, Math.min(drainMs + 5000, 15_000));
		return {
			ok: true,
			mode: 'stopped',
			url: targetUrl,
			note: 'Standby shutdown requested; auto-spawn blocked until .root restart standby.',
		};
	} finally {
		reloading = false;
	}
}

async function stopPrimary({ drainMs = getDrainMs() } = {}) {
	if (reloading) {
		return { ok: false, error: 'restart already in progress' };
	}
	reloading = true;
	try {
		stoppedPrimary = true;
		const { url } = client.getConfig();
		const wasSupervised = primarySupervised && primaryChildProc;

		if (wasSupervised) {
			if (url) {
				try {
					await client.requestAdminShutdown(url, { drainMs });
				} catch (error) {
					console.warn('[Primary] stop shutdown:', error?.message || error);
				}
			}
			await waitUntilUnhealthy(url, Math.min(drainMs + 3000, 10_000));
			await stopPrimarySupervisedChild();
			return {
				ok: true,
				mode: 'stopped',
				url: url || null,
				note: 'Primary stopped; auto-spawn blocked until .root restart primary.',
			};
		}

		if (!url || !client.isEnabled()) {
			return {
				ok: true,
				mode: 'stopped',
				url: null,
				note: 'No Primary URL; flag set so auto-spawn stays off until restart.',
			};
		}

		try {
			await client.requestAdminShutdown(url, { drainMs });
		} catch (error) {
			console.warn('[Primary] stop shutdown:', error?.message || error);
		}
		await waitUntilUnhealthy(url, Math.min(drainMs + 5000, 15_000));
		return {
			ok: true,
			mode: 'stopped',
			url,
			note: 'Primary shutdown requested; auto-spawn blocked until .root restart primary.',
		};
	} finally {
		reloading = false;
	}
}

async function restart(target = 'standby') {
	const t = String(target || 'standby').toLowerCase();
	if (t === 'primary') return restartPrimary();
	return restartStandby();
}

async function stop(target = 'standby') {
	const t = String(target || 'standby').toLowerCase();
	if (t === 'primary') return stopPrimary();
	return stopStandby();
}

async function stopPrimarySupervisedChild() {
	if (!primaryChildProc || primaryChildProc.killed) {
		primaryChildProc = null;
		primarySupervised = false;
		return;
	}
	const pid = primaryChildProc.pid;
	try {
		primaryChildProc.kill('SIGTERM');
	} catch {
		/* ignore */
	}
	const start = Date.now();
	while (Date.now() - start < 5000 && isPidAlive(pid)) {
		await sleep(100);
	}
	if (isPidAlive(pid)) {
		try {
			primaryChildProc.kill('SIGKILL');
		} catch {
			/* ignore */
		}
	}
	primaryChildProc = null;
	primarySupervised = false;
	clearPrimaryLockIfOurs(pid);
}

function getStatus() {
	const local = client.getLocalConfig();
	const primary = client.getConfig();
	return {
		primaryUrl: primary.url || null,
		primaryEnabled: client.isEnabled(),
		primarySupervised,
		primaryChildPid: primaryChildProc?.pid || null,
		primaryStopped: stoppedPrimary,
		localUrl: local.url || null,
		localEnabled: client.isLocalEnabled(),
		standbyStopped: stoppedStandby,
		spawn: shouldSpawn(),
		autoSpawn: shouldAutoSpawnWorkers(),
		supervised,
		childPid: childProc?.pid || null,
		reloading,
		lock: readLock(),
		primaryLock: readPrimaryLock(),
	};
}

async function shutdown() {
	if (supervised) {
		await stopSupervisedChild();
	}
	if (primarySupervised) {
		await stopPrimarySupervisedChild();
	}
}

module.exports = {
	DEFAULT_LOCAL_PORT,
	DEFAULT_PRIMARY_PORT,
	startIfConfigured,
	ensurePrimaryWorker,
	ensureLocalWorker,
	restart,
	stop,
	restartStandby,
	restartPrimary,
	stopStandby,
	stopPrimary,
	reloadLocal,
	reloadRemote,
	isPrimaryStopped,
	isStandbyStopped,
	resetStoppedFlagsForTests,
	getStatus,
	shutdown,
	waitHealth,
	waitUntilUnhealthy,
	shouldSpawn,
	shouldAutoSpawnWorkers,
	shouldReplaceUnhealthyUrl,
	getSpawnPort,
	getPrimarySpawnPort,
};
