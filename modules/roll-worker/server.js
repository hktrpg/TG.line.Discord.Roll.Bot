"use strict";

const express = require('express');
const analytics = require('../analytics');
const { isRemoteAllowed } = require('./route-table');
const { runCharacterAction } = require('./character-action');

function isLoopbackHost(host) {
	const h = String(host || '').toLowerCase();
	return h === '127.0.0.1' || h === '::1' || h === 'localhost';
}

function createRollWorkerApp(options = {}) {
	const app = express();
	app.use(express.json({ limit: '2mb' }));

	const expectedToken = (process.env.ROLL_WORKER_TOKEN || '').trim();
	const allowNoToken = process.env.ROLL_WORKER_ALLOW_NO_TOKEN === 'true'
		|| options.allowNoToken === true;
	const bindHost = options.host || process.env.ROLL_WORKER_HOST || '127.0.0.1';

	const stats = {
		parseCount: 0,
		characterActionCount: 0,
		needsLocalCount: 0,
	};

	app.use((req, res, next) => {
		// Health stays open for probes; mutate endpoints require a shared secret when configured.
		if (req.path === '/health') {
			return next();
		}

		if (!expectedToken) {
			if (allowNoToken || isLoopbackHost(bindHost)) {
				return next();
			}
			return res.status(401).json({
				error: 'Unauthorized: ROLL_WORKER_TOKEN required',
			});
		}

		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : '';
		if (token !== expectedToken) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		return next();
	});

	app.get('/health', (_req, res) => {
		res.json({
			ok: true,
			role: 'roll-worker',
			uptime: process.uptime(),
			parseCount: stats.parseCount,
			characterActionCount: stats.characterActionCount,
			needsLocalCount: stats.needsLocalCount,
			auth: expectedToken ? 'required' : (allowNoToken ? 'disabled' : 'loopback-only'),
		});
	});

	app.post('/v1/parse', async (req, res) => {
		try {
			const params = req.body || {};
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
				});
			}

			stats.parseCount += 1;
			return res.json({
				...(result || {}),
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
			const body = req.body || {};
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
	return app;
}

function startRollWorkerServer() {
	const host = process.env.ROLL_WORKER_HOST || '127.0.0.1';
	const port = Number.parseInt(process.env.ROLL_WORKER_PORT || '3950', 10);
	const token = (process.env.ROLL_WORKER_TOKEN || '').trim();
	const allowNoToken = process.env.ROLL_WORKER_ALLOW_NO_TOKEN === 'true';

	if (!token && !allowNoToken && !isLoopbackHost(host)) {
		console.error('[RollWorker] Refusing to bind non-loopback without ROLL_WORKER_TOKEN');
		// eslint-disable-next-line n/no-process-exit
		process.exit(1);
	}
	if (!token) {
		console.warn(
			'[RollWorker] WARNING: ROLL_WORKER_TOKEN unset — /v1/* accepts unauthenticated requests'
			+ (isLoopbackHost(host) ? ' on loopback only' : '')
			+ '. Set ROLL_WORKER_TOKEN on worker and all gateways.'
		);
	}

	const app = createRollWorkerApp({ host });
	const server = app.listen(port, host, () => {
		console.log(`[RollWorker] Listening on http://${host}:${port}`
			+ (token ? ' (auth required)' : ' (auth off)'));
	});
	return { app, server };
}

module.exports = {
	createRollWorkerApp,
	startRollWorkerServer,
	isLoopbackHost,
};
