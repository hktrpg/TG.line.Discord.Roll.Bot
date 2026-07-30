/* eslint-disable n/no-process-exit */
"use strict";

/**
 * Roll Worker entry — analytics + roll only. No platform gateways.
 * Does not start Agenda job processor (gateways own send jobs).
 */
process.env.ROLL_WORKER_MODE = 'true';

(() => {
	const preserveKeys = [
		'ROLL_WORKER_URL',
		'ROLL_WORKER_TOKEN',
		'ROLL_WORKER_TIMEOUT_MS',
		'ROLL_WORKER_MODE',
		'ROLL_WORKER_HOST',
		'ROLL_WORKER_PORT',
		'ROLL_WORKER_REMOTE_ONLY',
		'ROLL_WORKER_DEFER_BUSY',
		// Tests/proof may pin ADMIN_SECRET on the child env; do not let .env wipe it.
		'ADMIN_SECRET',
	];
	const preserved = {};
	for (const key of preserveKeys) {
		if (process.env[key] !== undefined) preserved[key] = process.env[key];
	}
	require('dotenv').config({ override: true, quiet: true });
	process.env.DOTENV_CONFIG_QUIET = 'true';
	Object.assign(process.env, preserved);
})();

const { startRollWorkerServer } = require('./modules/roll-worker/server');

// Eager Agenda Mongo connect (API only, no job processor) so .at/.cron work
// without waiting for the first z_schedule lazy-load.
if (process.env.mongoURL) {
	require('./modules/runtime/schedule');
}

startRollWorkerServer();

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
