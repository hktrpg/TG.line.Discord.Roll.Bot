"use strict";

const analytics = require('../analytics');
const i18n = require('../i18n/i18n.js');
const client = require('./client');
const { isRemoteAllowed } = require('./route-table');

const SYSTEM_BUSY_KEY = 'common.errors.system_busy';

const FALLBACK_LOG_INTERVAL_MS = 60_000;
let loggedModeOnce = false;
let lastFallbackLogAt = 0;
let fallbackSinceLastLog = 0;

async function getSystemBusyText(locale) {
	await i18n.init();
	const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
	return t(SYSTEM_BUSY_KEY);
}

/**
 * Log parse backend mode once per process (gateway or diagnostics).
 */
function logParseMode(logger = console) {
	if (loggedModeOnce) return;
	loggedModeOnce = true;

	const info = typeof logger.info === 'function'
		? (msg) => logger.info(msg)
		: (msg) => console.info(msg);

	if (process.env.ROLL_WORKER_MODE === 'true') {
		const { url, token } = client.getConfig();
		info(`[ParseMode] ROLE=roll-worker | mode=backend | token=${token ? 'set' : 'off'}`);
		info(`[ParseMode] Gateways should set ROLL_WORKER_URL (default ${url})`);
		return;
	}

	if (client.isEnabled()) {
		const { url, token, timeoutMs } = client.getConfig();
		info(`[ParseMode] ROLE=gateway | mode=roll-worker-remote | url=${url} | token=${token ? 'set' : 'off'} | timeoutMs=${timeoutMs}`);
		info('[ParseMode] Discord allowlist → worker; admin/export/token/story → local. Other platforms → worker.');
		return;
	}

	info('[ParseMode] ROLE=gateway | mode=local-analytics | ROLL_WORKER_URL unset (in-process roll/*)');
}

/**
 * Ops-only: rate-limited warning when Discord falls back to in-process analytics.
 * Never append this to user-facing replies.
 */
function logLocalFallback(reason, meta = {}) {
	fallbackSinceLastLog += 1;
	const now = Date.now();
	if (now - lastFallbackLogAt < FALLBACK_LOG_INTERVAL_MS && lastFallbackLogAt !== 0) {
		return;
	}
	const suppressed = fallbackSinceLastLog;
	lastFallbackLogAt = now;
	fallbackSinceLastLog = 0;
	console.warn(
		`[ParseRouter] OPS fallback→local | reason=${reason}`
		+ ` | botname=${meta.botname || ''}`
		+ ` | module=${meta.moduleName || ''}`
		+ ` | countSinceLastLog=${suppressed}`
		+ (meta.error ? ` | error=${meta.error}` : '')
	);
}

/**
 * Route parseInput to Roll Worker or local analytics.
 * @param {object} params - same as analytics.parseInput
 * @param {object} [options]
 * @param {boolean} [options.allowLocalFallback=false] - Discord: fall back to local on worker error / needsLocal
 */
async function parseInput(params = {}, options = {}) {
	const allowLocalFallback = options.allowLocalFallback === true
		|| params.botname === 'Discord';

	if (!client.isEnabled()) {
		return analytics.parseInput(params);
	}

	const mainMsg = typeof params.inputStr === 'string'
		? params.inputStr.replaceAll(/^\s/g, '').match(/\S+/ig)
		: null;
	const moduleName = analytics.findRollModuleName
		? analytics.findRollModuleName(mainMsg)
		: null;

	const useRemote = isRemoteAllowed(moduleName, params.botname);
	if (!useRemote) {
		return analytics.parseInput(params);
	}

	try {
		const result = await client.parse(params);
		if (result?.needsLocal) {
			if (allowLocalFallback) {
				logLocalFallback('needsLocal', {
					botname: params.botname,
					moduleName: result.moduleName || moduleName,
				});
				return analytics.parseInput(params);
			}
			return {
				text: await getSystemBusyText(params.locale),
				type: 'text',
			};
		}
		return result;
	} catch (error) {
		if (allowLocalFallback) {
			logLocalFallback('workerError', {
				botname: params.botname,
				moduleName,
				error: error?.message || String(error),
			});
			return analytics.parseInput(params);
		}
		console.error('[ParseRouter] Roll worker failed (no local fallback):', error?.message || error);
		return {
			text: await getSystemBusyText(params.locale),
			type: 'text',
		};
	}
}

/**
 * Whether gateway should skip local findRollList and always ask the router/worker.
 * When worker URL is set, new prefixes live on worker — local findRollList can miss them.
 */
function shouldSkipLocalFindRollList(botname) {
	if (!client.isEnabled()) return false;
	// Discord still uses local findRollList for allowlist routing.
	return botname !== 'Discord';
}

module.exports = {
	parseInput,
	shouldSkipLocalFindRollList,
	logParseMode,
	getSystemBusyText,
	SYSTEM_BUSY_KEY,
};
