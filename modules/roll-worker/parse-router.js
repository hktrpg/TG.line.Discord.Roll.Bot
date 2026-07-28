"use strict";

const analytics = require('../analytics');
const client = require('./client');
const { isRemoteAllowed } = require('./route-table');

const BACKEND_UPDATING_TEXT = '後端更新中，請稍後再試。';

let loggedModeOnce = false;

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
				return analytics.parseInput(params);
			}
			return {
				text: BACKEND_UPDATING_TEXT,
				type: 'text',
			};
		}
		return result;
	} catch (error) {
		console.error('[ParseRouter] Roll worker failed:', error?.message || error);
		if (allowLocalFallback) {
			return analytics.parseInput(params);
		}
		return {
			text: BACKEND_UPDATING_TEXT,
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
	BACKEND_UPDATING_TEXT,
};
