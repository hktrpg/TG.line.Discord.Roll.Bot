'use strict';

/**
 * Shared dotenv load for Roll Worker / openai: preserve spawn/test env over .env.
 * ROLL_WORKER_TEST_NO_OPENAI=true strips API secrets so contract tests never hit live AI.
 */
const DEFAULT_PRESERVE_KEYS = [
	'ROLL_WORKER_URL',
	'ROLL_WORKER_TOKEN',
	'ROLL_WORKER_TIMEOUT_MS',
	'ROLL_WORKER_MODE',
	'ROLL_WORKER_HOST',
	'ROLL_WORKER_PORT',
	'ROLL_WORKER_REMOTE_ONLY',
	'ROLL_WORKER_DEFER_BUSY',
	'ROLL_WORKER_GATEWAY_CHILD',
	'ROLL_STANDBY_URL',
	'ROLL_STANDBY_SPAWN',
	'ROLL_WORKER_SPAWN',
	'ADMIN_SECRET',
	'ROLL_WORKER_TEST_NO_OPENAI',
];

function stripOpenAiSecrets() {
	if (process.env.ROLL_WORKER_TEST_NO_OPENAI !== 'true') return;
	for (const key of Object.keys(process.env)) {
		if (/^OPENAI_SECRET_\d+$/.test(key)) {
			delete process.env[key];
		}
	}
}

/**
 * @param {string[]} [extraPreserveKeys]
 */
function loadDotenvPreserving(extraPreserveKeys = []) {
	const preserveKeys = [...DEFAULT_PRESERVE_KEYS, ...extraPreserveKeys];
	const preserved = {};
	for (const key of preserveKeys) {
		if (process.env[key] !== undefined) preserved[key] = process.env[key];
	}
	require('dotenv').config({ override: true, quiet: true });
	Object.assign(process.env, preserved);
	stripOpenAiSecrets();
}

module.exports = {
	DEFAULT_PRESERVE_KEYS,
	loadDotenvPreserving,
	stripOpenAiSecrets,
};
