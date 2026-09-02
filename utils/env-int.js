'use strict';

/**
 * Parse a positive integer from env (must be > 0). Invalid / missing → fallback.
 *
 * @param {string} name
 * @param {number} fallback
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number}
 */
function parsePositiveIntEnv(name, fallback, env = process.env) {
	const raw = env[name];
	if (raw === undefined || raw === '') {
		return fallback;
	}
	const n = Number.parseInt(String(raw), 10);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Parse a non-negative integer from env (0 allowed). Invalid / missing → fallback.
 *
 * @param {string} name
 * @param {number} fallback
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number}
 */
function parseNonNegativeIntEnv(name, fallback, env = process.env) {
	const raw = env[name];
	if (raw === undefined || raw === '') {
		return fallback;
	}
	const n = Number.parseInt(String(raw), 10);
	return Number.isFinite(n) && n >= 0 ? n : fallback;
}

module.exports = {
	parsePositiveIntEnv,
	parseNonNegativeIntEnv,
};
