"use strict";

/**
 * Modules safe to run on Roll Worker (no live discordClient / discordMessage required).
 * Unknown modules stay local on Discord gateway.
 */
const REMOTE_ALLOWLIST = new Set([
	'0-advroll',
	'1-funny',
	'2-coc',
	'5e',
	'fate',
	'help',
	'rollbase',
	'wod',
	'pf2e',
	'wn',
	'pokemon',
	'digmon',
	'init',
	'code',
	'edit',
	'lang',
	'yumingkueichai',
	'request-rolling',
	'z_character',
	'z_Level_system',
	'z_trpgDatabase',
	'z_random_ans',
	'z_saveCommand',
	'z_schedule',
	'z_stop',
	'z_event',
	'z_async_test',
	'z_bcdice',
	'z_DDR_darkRollingToGM',
	'z_myname',
	'z_role',
	// Prefetch / needsLocal for Discord-coupled steps (see Phase 3)
	'forward',
	'token',
	'openai',
	'export',
	'z_multi-server',
	'z_admin',
	'z-story-teller',
]);

/** Discord-only / needs live client — never remote. Empty after Phase 3c. */
const LOCAL_DISCORD_ONLY = new Set([
]);

function normalizeModuleId(moduleId) {
	if (!moduleId || typeof moduleId !== 'string') return '';
	return moduleId.trim();
}

function isRemoteAllowed(moduleId, botname) {
	const id = normalizeModuleId(moduleId);
	if (!id) {
		// No match yet — non-Discord can still send to worker (worker runs findRollList).
		return botname !== 'Discord';
	}
	if (LOCAL_DISCORD_ONLY.has(id)) return false;
	if (botname !== 'Discord') return true;
	return REMOTE_ALLOWLIST.has(id);
}

function isDiscordLocalOnly(moduleId) {
	return LOCAL_DISCORD_ONLY.has(normalizeModuleId(moduleId));
}

module.exports = {
	REMOTE_ALLOWLIST,
	LOCAL_DISCORD_ONLY,
	isRemoteAllowed,
	isDiscordLocalOnly,
	normalizeModuleId,
};
