"use strict";

const crypto = require('node:crypto');
const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const analytics = require('../analytics');
const { isRemoteAllowed } = require('./route-table');
const { runCharacterAction } = require('./character-action');
const {
	verifyGatewayAuth,
	stripGatewayAuth,
} = require('./request-auth');
const { ensureRollWorkerToken } = require('./ensure-token');

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

	/** Worker-side peer link (edge-triggered CONNECTED / DISCONNECTED). */
	let peerState = 'waiting';
	let lastPeerAt = 0;
	const PEER_IDLE_MS = 90_000;
	const peerIdleTimer = setInterval(() => {
		if (peerState === 'up' && lastPeerAt > 0 && (Date.now() - lastPeerAt) > PEER_IDLE_MS) {
			peerState = 'down';
			console.warn(`[RollWorker] DISCONNECTED | no Gateway traffic for ${Math.round(PEER_IDLE_MS / 1000)}s`);
		}
	}, 15_000);
	if (typeof peerIdleTimer.unref === 'function') {
		peerIdleTimer.unref();
	}
	app.locals.peerIdleTimer = peerIdleTimer;

	function noteGatewayPeer(req, via) {
		const from = req.ip || req.socket?.remoteAddress || 'unknown';
		lastPeerAt = Date.now();
		if (peerState === 'up') return;
		const prev = peerState;
		peerState = 'up';
		console.info(`[RollWorker] CONNECTED | peer=${from} | via=${via} | was=${prev}`);
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
		return res.json({
			...base,
			uptime: process.uptime(),
			parseCount: stats.parseCount,
			characterActionCount: stats.characterActionCount,
			needsLocalCount: stats.needsLocalCount,
			rateLimitedCount: stats.rateLimitedCount,
			peer: peerState,
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
			noteGatewayPeer(req, 'POST /v1/parse');
			const params = stripGatewayAuth(rawParams);
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
			noteGatewayPeer(req, 'POST /v1/character-action');
			const body = stripGatewayAuth(rawBody);
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

	app.locals.stats = stats;
	app.locals.expectedToken = expectedToken;
	app.locals.allowNoToken = allowNoToken;
	app.locals.bindHost = bindHost;
	return app;
}

function startRollWorkerServer() {
	const host = process.env.ROLL_WORKER_HOST || '127.0.0.1';
	const port = Number.parseInt(process.env.ROLL_WORKER_PORT || '3950', 10);
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
		console.log(`[RollWorker] Listening on http://${host}:${port}`
			+ (token ? ' (auth + gateway signature required)' : ' (auth off)')
			+ ` | jsonLimit=${getJsonBodyLimit()}`);
		console.info('[RollWorker] Waiting for Gateway — will log CONNECTED on first probe/request, DISCONNECTED after 90s silence');
	});
	return { app, server };
}

module.exports = {
	DEFAULT_JSON_BODY_LIMIT,
	DEFAULT_RATE_LIMIT_POINTS,
	DEFAULT_RATE_LIMIT_DURATION,
	getJsonBodyLimit,
	getRateLimitConfig,
	createRollWorkerApp,
	startRollWorkerServer,
	isLoopbackHost,
};
