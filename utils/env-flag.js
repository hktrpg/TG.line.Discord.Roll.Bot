'use strict';

/**
 * True only for explicit enable values (not any non-empty string).
 * Avoids Boolean(process.env.X) treating "false" / "0" as enabled.
 *
 * @param {string} name
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
function isEnvEnabled(name, env = process.env) {
	const raw = env[name];
	if (raw === undefined || raw === null) return false;
	const value = String(raw).trim().toLowerCase();
	return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

module.exports = {
	isEnvEnabled,
};
