'use strict';

/**
 * Parse ADMIN_SECRET into Discord user IDs (comma / semicolon / whitespace separated).
 *
 * @param {string|undefined|null} rawAdminSecret
 * @returns {string[]}
 */
function parseAdminIds(rawAdminSecret) {
	if (!rawAdminSecret) return [];
	return String(rawAdminSecret)
		.split(/[\s,;]+/)
		.map((id) => id.trim())
		.filter(Boolean);
}

/** @deprecated Prefer parseAdminIds — same behavior, legacy name used by roll modules. */
const parseAdminSecrets = parseAdminIds;

module.exports = {
	parseAdminIds,
	parseAdminSecrets,
};
