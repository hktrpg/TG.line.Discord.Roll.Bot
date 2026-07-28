"use strict";

const express = require('express');
const analytics = require('../analytics');
const { isRemoteAllowed } = require('./route-table');

function createRollWorkerApp() {
	const app = express();
	app.use(express.json({ limit: '1mb' }));

	const expectedToken = (process.env.ROLL_WORKER_TOKEN || '').trim();

	app.use((req, res, next) => {
		if (!expectedToken) {
			return next();
		}
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : '';
		if (token !== expectedToken) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		return next();
	});

	app.get('/health', (_req, res) => {
		res.json({ ok: true, role: 'roll-worker', uptime: process.uptime() });
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

			// Discord-coupled modules must not run here (no live client).
			if (params.botname === 'Discord' && moduleName && !isRemoteAllowed(moduleName, 'Discord')) {
				return res.status(503).json({ needsLocal: true, moduleName });
			}

			// Nested cmd / characterReRoll may hit a local-only module mid-flight.
			const result = await analytics.parseInput({
				...params,
				discordClient: null,
				discordMessage: null,
				t: undefined,
			});

			if (result?.needsLocal) {
				return res.status(503).json({ needsLocal: true, moduleName: result.moduleName || moduleName });
			}

			return res.json(result || {});
		} catch (error) {
			console.error('[RollWorker] /v1/parse error:', error?.message || error);
			return res.status(500).json({
				error: error?.message || 'parse failed',
			});
		}
	});

	return app;
}

function startRollWorkerServer() {
	const host = process.env.ROLL_WORKER_HOST || '127.0.0.1';
	const port = Number.parseInt(process.env.ROLL_WORKER_PORT || '3950', 10);
	const app = createRollWorkerApp();
	const server = app.listen(port, host, () => {
		console.log(`[RollWorker] Listening on http://${host}:${port}`);
	});
	return { app, server };
}

module.exports = {
	createRollWorkerApp,
	startRollWorkerServer,
};
