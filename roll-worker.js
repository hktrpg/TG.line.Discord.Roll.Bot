/* eslint-disable n/no-process-exit */
"use strict";

/**
 * Roll Worker entry — analytics + roll only. No platform gateways.
 * Does not start Agenda job processor (gateways own send jobs).
 */
process.env.ROLL_WORKER_MODE = 'true';

(() => {
	require('./modules/roll-worker/dotenv-preserve').loadDotenvPreserving();
	process.env.DOTENV_CONFIG_QUIET = 'true';
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
