"use strict";

/**
 * Gateway auto-frame helpers (Primary + Standby) + .root restart / stop.
 *
 * Default (ROLL_WORKER_SPAWN unset): Gateway auto-discovers/spawns **Primary only** (:20612).
 * Standby (:20613) only when ROLL_STANDBY_SPAWN=true, or ROLL_STANDBY_URL is set.
 * Opt-out Primary auto-frame: ROLL_WORKER_SPAWN=false → Embedded only (unless URL set).
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const client = require('./client');
const { ensureRollWorkerToken } = require('./ensure-token');

const ROOT = path.join(__dirname, '..', '..');
const LOCK_PATH = path.join(ROOT, 'temp', 'roll-local-worker.lock');
const PRIMARY_LOCK_PATH = path.join(ROOT, 'temp', 'roll-primary-worker.lock');
const DEFAULT_PRIMARY_PORT = 20_612;
const DEFAULT_LOCAL_PORT = 20_613;
const DEFAULT_MANUAL_PORT = 20_614;
const DEFAULT_DRAIN_MS = 1500;
const DEFAULT_HEALTH_WAIT_MS = 60_000;
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
	const n = Number.parseInt(process.env.ROLL_WORKER_DRAIN_MS || String(DEFAULT_DRAIN_MS), 10);
	return Number.isFinite(n) && n >= 0 ? Math.min(n, 30_000) : DEFAULT_DRAIN_MS;
}

function getHealthProbeMs() {
	const n = Number.parseInt(
		process.env.ROLL_WORKER_HEALTH_PROBE_MS || String(DEFAULT_HEALTH_PROBE_MS),
		10
	);
	return Number.isFinite(n) && n > 0 ? Math.min(n, 30_000) : DEFAULT_HEALTH_PROBE_MS;
}

function workerSpawnFlag() {
	return (process.env.ROLL_WORKER_SPAWN || '').trim().toLowerCase();
}

function standbySpawnFlag() {
	return (process.env.ROLL_STANDBY_SPAWN || '').trim().toLowerCase();
}

/** Primary auto-spawn opt-out / force. Standby uses shouldSpawn() separately. */
function shouldAutoSpawnWorkers() {
	const flag = workerSpawnFlag();
	if (flag === 'false' || flag === '0' || flag === 'off') return false;
	if (process.env.ROLL_WORKER_MODE === 'true') return false;
	if (flag === 'true' || flag === '1' || flag === 'on') return true;
	// Jest / unit tests: never auto-spawn unless ROLL_WORKER_SPAWN=true (avoids live children).
	if (process.env.NODE_ENV === 'test') return false;
	// Default: Gateway auto-frames Primary even when ROLL_WORKER_URL unset.
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
	const n = Number.parseInt(process.env.ROLL_STANDBY_PORT || String(DEFAULT_LOCAL_PORT), 10);
	let port = Number.isFinite(n) && n > 0 ? n : DEFAULT_LOCAL_PORT;
	const primaryPort = getPrimaryWorkerPort() || getPrimarySpawnPort();
	if (primaryPort && port === primaryPort) {
		port = primaryPort === DEFAULT_LOCAL_PORT ? DEFAULT_MANUAL_PORT : DEFAULT_LOCAL_PORT;
	}
	return port;
}

/**
 * Whether Gateway may spawn a supervised Standby.
 * Explicit ROLL_STANDBY_SPAWN=true only (default is Primary-only).
 * Requires primary URL (after ensurePrimary) and not REMOTE_ONLY.
 */
function shouldSpawn() {
	if (process.env.ROLL_WORKER_REMOTE_ONLY === 'true') return false;
	if (process.env.ROLL_WORKER_MODE === 'true') return false;
	const flag = standbySpawnFlag();
	if (flag !== 'true' && flag !== '1' && flag !== 'on') return false;
	return Boolean((process.env.ROLL_WORKER_URL || '').trim());
}

/** Only explicit ROLL_STANDBY_SPAWN=true may replace an operator-set ROLL_STANDBY_URL. */
function shouldReplaceUnhealthyUrl() {
	const flag = standbySpawnFlag();
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
			// Anonymous probe only — never send Bearer during discovery (M30).
			const body = await client.healthAt(url);
			if (body?.ok && body.role === 'roll-worker') return body;
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

function debugWorkerLog(...args) {
	const flag = (process.env.ROLL_WORKER_DEBUG || '').trim().toLowerCase();
	if (flag === 'true' || flag === '1' || flag === 'on') {
		console.info(...args);
	}
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
	const label = role === 'primary' ? 'Primary' : 'Standby';
	// Opt-in only: piping duplicates IDE debugger child console (Listening/CONNECTED ×2).
	const childLog = (process.env.ROLL_WORKER_CHILD_LOG || '').trim().toLowerCase();
	const pipeChild = childLog === 'true' || childLog === '1' || childLog === 'on';
	const child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
		cwd: ROOT,
		env: {
			...process.env,
			DOTENV_CONFIG_QUIET: 'true',
			ROLL_WORKER_MODE: 'true',
			ROLL_WORKER_HOST: '127.0.0.1',
			ROLL_WORKER_PORT: String(port),
			ROLL_WORKER_TOKEN: token || process.env.ROLL_WORKER_TOKEN || '',
			// Parent owns boot Listening / link lines — child stays quiet in shared consoles.
			ROLL_WORKER_GATEWAY_CHILD: 'true',
			// Child must not recurse into another local worker / primary URL.
			ROLL_WORKER_URL: '',
			ROLL_STANDBY_URL: '',
			ROLL_STANDBY_SPAWN: 'false',
			ROLL_WORKER_SPAWN: 'false',
		},
		stdio: pipeChild ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'ignore', 'ignore'],
	});
	if (pipeChild) {
		child.stdout?.on('data', (buf) => {
			const text = String(buf);
			for (const line of text.split(/\r?\n/)) {
				if (line) console.info(`[${label}:child] ${line}`);
			}
		});
		child.stderr?.on('data', (buf) => {
			const text = String(buf);
			for (const line of text.split(/\r?\n/)) {
				if (line) console.warn(`[${label}:child] ${line}`);
			}
		});
	}
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
 * Ensure ROLL_WORKER_URL: discover existing :20612, reuse lock, or auto-spawn.
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

/**
 * @param {Console} [logger]
 * @param {{ forceSpawn?: boolean }} [options] - forceSpawn: operator restart; ignore SPAWN=false
 */
async function ensurePrimaryWorker(logger = console, options = {}) {
	const forceSpawn = options.forceSpawn === true;
	const info = typeof logger.info === 'function'
		? (msg) => logger.info(msg)
		: (msg) => console.info(msg);
	const probeMs = getHealthProbeMs();

	if (stoppedPrimary) {
		return { ok: false, skipped: true, stopped: true };
	}

	if (client.isEnabled()) {
		const { url } = client.getConfig();
		try {
			await waitHealth(url, probeMs);
			return { ok: true, url, supervised: false, existing: true };
		} catch {
			info(`[Primary] ROLL_WORKER_URL=${url} unhealthy`);
			if (!forceSpawn && !shouldAutoSpawnWorkers()) {
				return { ok: false, url, supervised: false, pending: true };
			}
			/* fall through — discover / lock / spawn (same as Standby ensure) */
		}
	} else if (!forceSpawn && !shouldAutoSpawnWorkers()) {
		return { ok: false, skipped: true };
	}

	// Prefer port from ROLL_WORKER_URL so restart after stop does not adopt
	// an unrelated healthy worker on the default :20612 (parallel Jest live tests).
	const port = getPrimaryWorkerPort() || getPrimarySpawnPort();
	const defaultUrl = `http://127.0.0.1:${port}`;

	try {
		await waitHealth(defaultUrl, probeMs);
		process.env.ROLL_WORKER_URL = defaultUrl;
		debugWorkerLog(`[Primary] discovered existing ${defaultUrl}`);
		return { ok: true, url: defaultUrl, supervised: false, discovered: true };
	} catch {
		/* spawn path */
	}

	const lock = readPrimaryLock();
	if (lock?.url && isPidAlive(lock.pid)) {
		let lockPort = null;
		try {
			lockPort = Number.parseInt(new URL(lock.url).port, 10) || null;
		} catch {
			lockPort = null;
		}
		// Ignore locks for a different port than the Primary we are restoring.
		if (lockPort && lockPort !== port) {
			debugWorkerLog(`[Primary] ignore lock url=${lock.url} (want port ${port})`);
		} else {
			try {
				await waitHealth(lock.url, probeMs);
				process.env.ROLL_WORKER_URL = lock.url;
				debugWorkerLog(`[Primary] reuse lock pid=${lock.pid} url=${lock.url}`);
				return { ok: true, url: lock.url, supervised: false, reusedLock: true };
			} catch {
				info(`[Primary] lock pid=${lock.pid} unhealthy — spawning replacement`);
				clearPrimaryLockIfOurs(lock.pid);
			}
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
	// Single boot line in Gateway console (child is ROLL_WORKER_GATEWAY_CHILD=quiet).
	console.info(`[RollWorker] Listening on ${url}`
		+ ` | auth=${(process.env.ROLL_WORKER_TOKEN || '').trim() ? 'on' : 'off'}`
		+ ` | supervised pid=${child.pid}`);
	debugWorkerLog(`[Primary] spawned pid=${child.pid} url=${url}`);
	return { ok: true, url, supervised: true, pid: child.pid };
}

/**
 * Ensure ROLL_STANDBY_URL (after primary is available).
 * Discover existing :20613 (manual yarn start:roll-worker:standby) before SPAWN.
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
			debugWorkerLog(`[Standby] using existing ${url}`);
			return { ok: true, url, supervised: false };
		} catch {
			if (!shouldReplaceUnhealthyUrl()) {
				debugWorkerLog(`[Standby] ROLL_STANDBY_URL=${url} not healthy yet (will retry on fallback)`);
				return { ok: false, url, supervised: false, pending: true };
			}
			info(`[Standby] ROLL_STANDBY_URL=${url} unhealthy — SPAWN replacement`);
		}
	} else if (!shouldSpawn()) {
		return { ok: false, skipped: true };
	}

	const port = getSpawnPort();
	const defaultUrl = `http://127.0.0.1:${port}`;

	// Manual Standby (or prior process) already on the port — reuse, do not spawn.
	try {
		await waitHealth(defaultUrl, probeMs);
		process.env.ROLL_STANDBY_URL = defaultUrl;
		debugWorkerLog(`[Standby] discovered existing ${defaultUrl}`);
		return { ok: true, url: defaultUrl, supervised: false, discovered: true };
	} catch {
		/* spawn path */
	}

	const lock = readLock();
	if (lock?.url && isPidAlive(lock.pid)) {
		try {
			await waitHealth(lock.url, probeMs);
			process.env.ROLL_STANDBY_URL = lock.url;
			debugWorkerLog(`[Standby] reuse lock pid=${lock.pid} url=${lock.url}`);
			return { ok: true, url: lock.url, supervised: false, reusedLock: true };
		} catch {
			info(`[Standby] lock pid=${lock.pid} unhealthy — spawning replacement`);
			clearLockIfOurs(lock.pid);
		}
	}

	const token = ensureSharedToken();
	if (!token && process.env.ROLL_WORKER_ALLOW_NO_TOKEN !== 'true') {
		return { ok: false, error: 'ROLL_WORKER_TOKEN missing; cannot spawn Standby' };
	}
	const { child, url } = spawnChild({ port, token, role: 'local' });
	childProc = child;
	supervised = true;
	process.env.ROLL_STANDBY_URL = url;
	writeLock({ pid: child.pid, port, url });
	await waitHealth(url);
	console.info(`[RollWorker] Standby Listening on ${url}`
		+ ` | auth=${(process.env.ROLL_WORKER_TOKEN || '').trim() ? 'on' : 'off'}`
		+ ` | supervised pid=${child.pid}`);
	debugWorkerLog(`[Standby] spawned pid=${child.pid} url=${url}`);
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
	const targetUrl = url || process.env.ROLL_STANDBY_URL;
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
			|| 'Standby unavailable (set ROLL_STANDBY_URL or ROLL_STANDBY_SPAWN=true)',
	};
}

/**
 * Restart Primary compute (clears stopped flag).
 * When Primary is down, force spawn/discover even if ROLL_WORKER_SPAWN=false
 * (operator explicitly asked to bring Primary back).
 */
async function restartPrimary({ drainMs = getDrainMs() } = {}) {
	stoppedPrimary = false;
	if (client.isEnabled()) {
		const { url } = client.getConfig();
		try {
			await waitHealth(url, getHealthProbeMs());
			return reloadRemote({ drainMs });
		} catch {
			/* down — ensure/spawn path */
		}
	}
	const ensured = await ensurePrimaryWorker(console, { forceSpawn: true });
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
				error: 'ROLL_STANDBY_URL unset (auto-spawn disabled? set URL or ROLL_STANDBY_SPAWN=true)',
			};
		}
		const targetUrl = url || process.env.ROLL_STANDBY_URL;
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
			process.env.ROLL_STANDBY_URL = spawned.url;
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
		const waitMs = Number.parseInt(process.env.ROLL_STANDBY_RELOAD_WAIT_MS || '15000', 10);
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
				hint: 'Check Standby logs; start yarn start:roll-worker:standby (or ROLL_WORKER_PORT matching ROLL_STANDBY_URL) if needed.',
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
	if (reloading) {
		return { ok: false, error: 'restart already in progress' };
	}
	if (!client.isEnabled()) {
		return { ok: false, error: 'ROLL_WORKER_URL unset' };
	}
	reloading = true;
	try {
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
				|| process.env.ROLL_STANDBY_RELOAD_WAIT_MS
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
				hint: 'Check Primary logs on the host. If the successor failed to bind the port, start yarn start:roll-worker:primary manually.',
				warning: 'ROLL_WORKER_URL may be down until Primary is running again. Discord Gateway stays up.',
			};
		}
	} finally {
		reloading = false;
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
		const targetUrl = url || process.env.ROLL_STANDBY_URL;
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
	DEFAULT_MANUAL_PORT,
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
