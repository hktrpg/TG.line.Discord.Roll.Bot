"use strict";

/**
 * Discord routing (Phase 3j):
 * - Matched modules remoted by default.
 * - Modules that need live Discord return `needsLocal` or use Gateway prefetch meta.
 * - LOCAL_DISCORD_ONLY is the only hard block (empty unless a future module must never leave Gateway).
 * - REMOTE_ALLOWLIST is retained as documentation of modules known to support remote paths.
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

/** Discord-only / must never remote. Empty after Phase 3 — modules use needsLocal instead. */
const LOCAL_DISCORD_ONLY = new Set([
]);

/**
 * Effective Discord denylist = built-in LOCAL_DISCORD_ONLY
 * + comma-separated ROLL_WORKER_DISCORD_DENYLIST (ops override; M4).
 */
function getLocalDiscordOnly() {
	const fromEnv = String(process.env.ROLL_WORKER_DISCORD_DENYLIST || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	if (fromEnv.length === 0) return LOCAL_DISCORD_ONLY;
	return new Set([...LOCAL_DISCORD_ONLY, ...fromEnv]);
}

function normalizeModuleId(moduleId) {
	if (!moduleId || typeof moduleId !== 'string') return '';
	return moduleId.trim();
}

function isRemoteAllowed(moduleId, botname) {
	const id = normalizeModuleId(moduleId);
	if (!id) {
		// No match yet — non-Discord can still send to worker (worker runs findRollList).
		// Discord stays local for unmatched chat noise.
		return botname !== 'Discord';
	}
	// Denylist is Discord-only (Telegram/Line/etc. keep remoting).
	if (botname === 'Discord' && getLocalDiscordOnly().has(id)) return false;
	// Phase 3j: any matched module remotes; needsLocal handles live Discord edges.
	return true;
}

function isDiscordLocalOnly(moduleId) {
	return getLocalDiscordOnly().has(normalizeModuleId(moduleId));
}

module.exports = {
	REMOTE_ALLOWLIST,
	LOCAL_DISCORD_ONLY,
	getLocalDiscordOnly,
	isRemoteAllowed,
	isDiscordLocalOnly,
	normalizeModuleId,
};
