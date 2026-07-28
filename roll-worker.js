/* eslint-disable n/no-process-exit */
"use strict";

/**
 * Roll Worker entry — analytics + roll only. No platform gateways.
 * Does not start Agenda job processor (gateways own send jobs).
 */
process.env.ROLL_WORKER_MODE = 'true';

require('dotenv').config({ override: true, quiet: true });

const { startRollWorkerServer } = require('./modules/roll-worker/server');
const { logParseMode } = require('./modules/roll-worker/parse-router');

startRollWorkerServer();
logParseMode(console);

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
