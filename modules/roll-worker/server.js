"use strict";

const crypto = require('node:crypto');
const path = require('node:path');
const { spawn } = require('node:child_process');
const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const analytics = require('../analytics');
const buildInfo = require('../runtime/build-info');
const { isRemoteAllowed } = require('./route-table');
const { runCharacterAction } = require('./character-action');
const {
	verifyGatewayAuth,
	stripGatewayAuth,
} = require('./request-auth');
const { ensureRollWorkerToken } = require('./ensure-token');
const { readGatewayFromRequest } = require('./gateway-label');

const WORKER_ENTRY = path.join(__dirname, '..', '..', 'roll-worker.js');
const WORKER_ROOT = path.join(__dirname, '..', '..');

function timingSafeTokenEqual(provided, expected) {
	const a = Buffer.from(String(provided || ''), 'utf8');
	const b = Buffer.from(String(expected || ''), 'utf8');
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}

/** Default large enough for Discord exportHistoryMeta (channel history in JSON). */
const DEFAULT_JSON_BODY_LIMIT = '32mb';
/** Authenticated /v1/* soft cap — mitigates signed 32mb body DoS (L2). */
const DEFAULT_RATE_LIMIT_POINTS = 300;
const DEFAULT_RATE_LIMIT_DURATION = 60;

function isLoopbackHost(host) {
	const h = String(host || '').toLowerCase();
	return h === '127.0.0.1' || h === '::1' || h === 'localhost';
}

function workerBootVerbose() {
	const flag = (process.env.ROLL_WORKER_DEBUG || '').trim().toLowerCase();
	return flag === 'true' || flag === '1' || flag === 'on';
}

/** Express req.ip / remoteAddress may be IPv4-mapped (`::ffff:127.0.0.1`). */
function isLoopbackRemoteAddress(addr) {
	const a = String(addr || '').toLowerCase().replace(/^::ffff:/, '');
	return a === '127.0.0.1' || a === '::1' || a === 'localhost';
}

/**
 * Close HTTP server (release port), spawn a successor Worker, then exit.
 * Injectable for Jest (pass performAdminReload).
 * @param {{ drainMs: number, httpServer?: import('node:http').Server | null }} ctx
 */
function defaultPerformAdminReload(ctx = {}) {
	const drainMs = Number(ctx.drainMs) || 0;
	const httpServer = ctx.httpServer || null;
	setTimeout(() => {
		let finished = false;
		const startSuccessor = () => {
			if (finished) return;
			finished = true;
			try {
				const child = spawn(process.execPath, [WORKER_ENTRY], {
					cwd: WORKER_ROOT,
					env: { ...process.env },
					detached: true,
					stdio: 'ignore',
				});
				child.unref();
				console.warn(
					`[RollWorker] admin reload spawned successor pid=${child.pid}`
					+ ` | exiting pid=${process.pid}`
				);
			} catch (error) {
				console.error('[RollWorker] admin reload spawn failed:', error?.message || error);
			}
			// eslint-disable-next-line n/no-process-exit
			process.exit(0);
		};

		if (httpServer && typeof httpServer.close === 'function') {
			httpServer.close(() => startSuccessor());
			// Port release hang fallback
			setTimeout(startSuccessor, 2000).unref?.();
			return;
		}
		startSuccessor();
	}, drainMs).unref?.();
}

function getJsonBodyLimit() {
	const fromEnv = (process.env.ROLL_WORKER_JSON_LIMIT || '').trim();
	return fromEnv || DEFAULT_JSON_BODY_LIMIT;
}

function getRateLimitConfig() {
	const points = Number.parseInt(
		process.env.ROLL_WORKER_RATE_LIMIT_POINTS || String(DEFAULT_RATE_LIMIT_POINTS),
		10
	);
	const duration = Number.parseInt(
		process.env.ROLL_WORKER_RATE_LIMIT_DURATION || String(DEFAULT_RATE_LIMIT_DURATION),
		10
	);
	return {
		points: Number.isFinite(points) && points > 0 ? points : DEFAULT_RATE_LIMIT_POINTS,
		duration: Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_RATE_LIMIT_DURATION,
	};
}

function createRollWorkerApp(options = {}) {
	const app = express();
	const jsonLimit = options.jsonLimit || getJsonBodyLimit();
	app.use(express.json({ limit: jsonLimit }));

	const expectedToken = (process.env.ROLL_WORKER_TOKEN || '').trim();
	const allowNoToken = process.env.ROLL_WORKER_ALLOW_NO_TOKEN === 'true'
		|| options.allowNoToken === true;
	const bindHost = options.host || process.env.ROLL_WORKER_HOST || '127.0.0.1';
	const rateLimitDisabled = options.disableRateLimit === true
		|| process.env.ROLL_WORKER_RATE_LIMIT_DISABLED === 'true';
	const rateLimitConfig = options.rateLimit || getRateLimitConfig();
	const performAdminReload = typeof options.performAdminReload === 'function'
		? options.performAdminReload
		: defaultPerformAdminReload;
	const rateLimiter = rateLimitDisabled
		? null
		: new RateLimiterMemory(rateLimitConfig);

	const stats = {
		parseCount: 0,
		characterActionCount: 0,
		needsLocalCount: 0,
		rateLimitedCount: 0,
	};

	async function rejectIfRateLimited(req, res) {
		if (!rateLimiter) return false;
		try {
			const key = req.ip || req.socket?.remoteAddress || 'unknown';
			await rateLimiter.consume(key);
			return false;
		} catch {
			stats.rateLimitedCount += 1;
			res.status(429).json({ error: 'Too Many Requests' });
			return true;
		}
	}

	/** Worker-side peer link per Gateway label (edge-triggered CONNECTED / DISCONNECTED). */
	/** @type {Map<string, { state: string, lastAt: number }>} */
	const peers = new Map();
	const PEER_IDLE_MS = 90_000;
	const peerIdleTimer = setInterval(() => {
		const now = Date.now();
		for (const [gateway, entry] of peers) {
			if (entry.state === 'up' && entry.lastAt > 0 && (now - entry.lastAt) > PEER_IDLE_MS) {
				entry.state = 'down';
				console.warn(
					`[RollWorker] DISCONNECTED | gateway=${gateway}`
					+ ` | idle>${Math.round(PEER_IDLE_MS / 1000)}s`
				);
			}
		}
	}, 15_000);
	if (typeof peerIdleTimer.unref === 'function') {
		peerIdleTimer.unref();
	}
	app.locals.peerIdleTimer = peerIdleTimer;
	app.locals.peers = peers;

	function noteGatewayPeer(req, via, extra = {}) {
		const from = req.ip || req.socket?.remoteAddress || 'unknown';
		const ids = readGatewayFromRequest(req);
		const gateway = ids.gateway;
		const bot = String(extra.botname || ids.botname || '').trim();
		const entry = peers.get(gateway) || { state: 'waiting', lastAt: 0 };
		entry.lastAt = Date.now();
		if (entry.state === 'up') {
			peers.set(gateway, entry);
			return;
		}
		const prev = entry.state;
		entry.state = 'up';
		peers.set(gateway, entry);
		if (workerBootVerbose()) {
			console.info(
				`[RollWorker] CONNECTED | gateway=${gateway}`
				+ (bot ? ` | bot=${bot}` : '')
				+ ` | peer=${from} | via=${via} | was=${prev}`
			);
		}
	}

	app.use((req, res, next) => {
		// Health stays open for probes; mutate endpoints require a shared secret when configured.
		if (req.path === '/health') {
			return next();
		}

		if (!expectedToken) {
			if (allowNoToken) {
				return next();
			}
			return res.status(401).json({
				error: 'Unauthorized: ROLL_WORKER_TOKEN required',
			});
		}

		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : '';
		if (!timingSafeTokenEqual(token, expectedToken)) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		return next();
	});

	app.get('/health', (req, res) => {
		// Probes always get ok+role. Counters/uptime require Bearer when token is configured (L6).
		const base = {
			ok: true,
			role: 'roll-worker',
			auth: expectedToken ? 'required' : (allowNoToken ? 'disabled' : 'token-required'),
		};
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : '';
		const detailOk = !expectedToken || timingSafeTokenEqual(token, expectedToken);
		if (!detailOk) {
			return res.json(base);
		}
		// Authenticated (or auth-off) health probe from Gateway monitor.
		noteGatewayPeer(req, 'GET /health');
		const { gateway } = readGatewayFromRequest(req);
		const peerStates = {};
		for (const [name, entry] of peers) {
			peerStates[name] = entry.state;
		}
		return res.json({
			...base,
			uptime: process.uptime(),
			parseCount: stats.parseCount,
			characterActionCount: stats.characterActionCount,
			needsLocalCount: stats.needsLocalCount,
			rateLimitedCount: stats.rateLimitedCount,
			gateway,
			peer: peerStates[gateway] || 'waiting',
			peers: peerStates,
			version: buildInfo.getPublic(),
		});
	});

	app.post('/v1/parse', async (req, res) => {
		try {
			if (await rejectIfRateLimited(req, res)) return;
			const rawParams = req.body || {};
			const auth = verifyGatewayAuth(rawParams, expectedToken, {
				required: Boolean(expectedToken),
			});
			if (!auth.ok) {
				return res.status(401).json({ error: `Unauthorized: ${auth.error}` });
			}
			const params = stripGatewayAuth(rawParams);
			noteGatewayPeer(req, 'POST /v1/parse', { botname: params.botname });
			const mainMsg = typeof params.inputStr === 'string'
				? params.inputStr.replaceAll(/^\s/g, '').match(/\S+/ig)
				: null;

			const moduleName = analytics.findRollModuleName
				? analytics.findRollModuleName(mainMsg)
				: null;

			if (params.botname === 'Discord' && moduleName && !isRemoteAllowed(moduleName, 'Discord')) {
				stats.needsLocalCount += 1;
				return res.status(503).json({ needsLocal: true, moduleName });
			}

			const result = await analytics.parseInput({
				...params,
				discordClient: null,
				discordMessage: null,
				t: undefined,
			});

			if (result?.needsLocal) {
				stats.needsLocalCount += 1;
				return res.status(503).json({
					needsLocal: true,
					moduleName: result.moduleName || moduleName,
					// EXPUP may already have run on the worker before needsLocal.
					LevelUp: result.LevelUp || '',
					statue: result.statue || '',
					nestedNeedsLocal: Boolean(result.nestedNeedsLocal),
					nestedInputStr: result.nestedInputStr || undefined,
					parentResult: result.parentResult || undefined,
				});
			}

			stats.parseCount += 1;
			return res.json({
				...result,
				_rollWorker: true,
				_rollWorkerModule: moduleName || null,
			});
		} catch (error) {
			console.error('[RollWorker] /v1/parse error:', error?.message || error);
			return res.status(500).json({
				error: error?.message || 'parse failed',
			});
		}
	});

	app.post('/v1/character-action', async (req, res) => {
		try {
			if (await rejectIfRateLimited(req, res)) return;
			const rawBody = req.body || {};
			const auth = verifyGatewayAuth(rawBody, expectedToken, {
				required: Boolean(expectedToken),
			});
			if (!auth.ok) {
				return res.status(401).json({ error: `Unauthorized: ${auth.error}` });
			}
			const body = stripGatewayAuth(rawBody);
			noteGatewayPeer(req, 'POST /v1/character-action', {
				botname: body.botname || 'WWW',
			});
			const payload = await runCharacterAction({
				doc: body.doc,
				item: body.item,
				locale: body.locale,
				botname: body.botname || 'WWW',
			});
			if (payload.error) {
				return res.status(400).json(payload);
			}
			stats.characterActionCount += 1;
			return res.json({
				...payload,
				_rollWorker: true,
			});
		} catch (error) {
			console.error('[RollWorker] /v1/character-action error:', error?.message || error);
			return res.status(500).json({
				error: error?.message || 'character-action failed',
			});
		}
	});

	/**
	 * Phase A/B: drain + exit so process manager / Gateway supervisor can respawn.
	 * Bearer required (middleware). Callers must be loopback only.
	 */
	let shuttingDown = false;
	app.post('/v1/admin/shutdown', (req, res) => {
		const remote = req.ip || req.socket?.remoteAddress || '';
		if (!isLoopbackRemoteAddress(remote)) {
			return res.status(403).json({
				error: 'Forbidden: /v1/admin/shutdown is loopback-only',
			});
		}
		if (shuttingDown) {
			return res.json({ ok: true, shuttingDown: true, pid: process.pid, already: true });
		}
		const rawDrain = Number.parseInt(String(req.body?.drainMs ?? '500'), 10);
		const drainMs = Number.isFinite(rawDrain)
			? Math.min(Math.max(rawDrain, 0), 10_000)
			: 500;
		shuttingDown = true;
		console.warn(`[RollWorker] admin shutdown requested | drainMs=${drainMs} | pid=${process.pid}`);
		res.json({ ok: true, shuttingDown: true, pid: process.pid, drainMs });
		setTimeout(() => {
			// eslint-disable-next-line n/no-process-exit
			process.exit(0);
		}, drainMs).unref?.();
		return;
	});

	/**
	 * True reload: drain, close listener, spawn successor Worker, exit.
	 * Unlike shutdown, a new process binds the same port without PM2.
	 */
	let reloading = false;
	app.post('/v1/admin/reload', (req, res) => {
		const remote = req.ip || req.socket?.remoteAddress || '';
		if (!isLoopbackRemoteAddress(remote)) {
			return res.status(403).json({
				error: 'Forbidden: /v1/admin/reload is loopback-only',
			});
		}
		if (shuttingDown || reloading) {
			return res.json({
				ok: true,
				reloading: true,
				pid: process.pid,
				already: true,
			});
		}
		const rawDrain = Number.parseInt(String(req.body?.drainMs ?? '500'), 10);
		const drainMs = Number.isFinite(rawDrain)
			? Math.min(Math.max(rawDrain, 0), 10_000)
			: 500;
		reloading = true;
		console.warn(`[RollWorker] admin reload requested | drainMs=${drainMs} | pid=${process.pid}`);
		res.json({
			ok: true,
			reloading: true,
			pid: process.pid,
			drainMs,
			mode: 'self-restart',
		});
		performAdminReload({
			drainMs,
			httpServer: app.locals.httpServer || null,
		});
		return;
	});

	app.locals.stats = stats;
	app.locals.expectedToken = expectedToken;
	app.locals.allowNoToken = allowNoToken;
	app.locals.bindHost = bindHost;
	app.locals.performAdminReload = performAdminReload;
	return app;
}

function startRollWorkerServer() {
	const host = process.env.ROLL_WORKER_HOST || '127.0.0.1';
	// Manual `yarn start:roll-worker` defaults to :3952 so it does not collide with
	// Gateway auto-Primary (:3950) or Standby (:3951). Gateway spawn always sets PORT explicitly.
	const port = Number.parseInt(process.env.ROLL_WORKER_PORT || '3952', 10);
	const allowNoToken = process.env.ROLL_WORKER_ALLOW_NO_TOKEN === 'true';

	// Auto-generate + persist shared secret unless auth-off test mode is explicit.
	ensureRollWorkerToken({ generate: !allowNoToken });
	const token = (process.env.ROLL_WORKER_TOKEN || '').trim();

	if (!token && !allowNoToken) {
		console.error(
			'[RollWorker] Refusing to start without ROLL_WORKER_TOKEN'
			+ ' (auto-generate failed; set ROLL_WORKER_TOKEN or ROLL_WORKER_ALLOW_NO_TOKEN=true for local tests)'
		);
		// eslint-disable-next-line n/no-process-exit
		process.exit(1);
	}
	// ALLOW_NO_TOKEN is for local tests only — never bind it on a public interface.
	if (!token && allowNoToken && !isLoopbackHost(host)) {
		console.error('[RollWorker] Refusing to bind non-loopback without ROLL_WORKER_TOKEN');
		// eslint-disable-next-line n/no-process-exit
		process.exit(1);
	}
	if (!token && allowNoToken) {
		console.warn(
			'[RollWorker] WARNING: ROLL_WORKER_ALLOW_NO_TOKEN=true — /v1/* accepts unauthenticated requests'
			+ ' on loopback. Never use in production.'
		);
	}

	const app = createRollWorkerApp({ host });
	const server = app.listen(port, host, () => {
		if (workerBootVerbose()) {
			console.log(`[RollWorker] Listening on http://${host}:${port}`
				+ (token ? ' | auth=on' : ' | auth=off')
				+ ` | jsonLimit=${getJsonBodyLimit()}`
				+ ' | wait Gateway (CONNECTED/DISCONNECTED)');
		} else if (!process.env.ROLL_WORKER_PORT) {
			// One-line hint when using manual default port (not Gateway-spawned).
			console.info(`[RollWorker] manual :${port} (auto Primary uses :3950; set ROLL_WORKER_PORT to override)`);
		}
	});
	server.on('error', (error) => {
		if (error?.code === 'EADDRINUSE') {
			console.error(
				`[RollWorker] port ${host}:${port} already in use.`
				+ (port === 3950
					? ' Gateway auto-Primary may already own :3950 — use ROLL_WORKER_PORT=3952 (yarn start:roll-worker default) or stop the other process.'
					: ' Stop the other process or set ROLL_WORKER_PORT to a free port.')
			);
			// eslint-disable-next-line n/no-process-exit
			process.exit(1);
		}
		throw error;
	});
	app.locals.httpServer = server;
	return { app, server };
}

module.exports = {
	DEFAULT_JSON_BODY_LIMIT,
	DEFAULT_RATE_LIMIT_POINTS,
	DEFAULT_RATE_LIMIT_DURATION,
	WORKER_ENTRY,
	getJsonBodyLimit,
	getRateLimitConfig,
	createRollWorkerApp,
	startRollWorkerServer,
	defaultPerformAdminReload,
	isLoopbackHost,
	isLoopbackRemoteAddress,
};
