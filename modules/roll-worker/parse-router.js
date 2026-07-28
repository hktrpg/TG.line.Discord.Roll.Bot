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
		info('[ParseMode] Discord allowlist → worker (admin/story help remote; cluster ops needsLocal). Other platforms → worker.');
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

function stripWorkerProof(result) {
	if (!result || typeof result !== 'object') return result;
	const cleaned = { ...result };
	delete cleaned._rollWorker;
	delete cleaned._rollWorkerModule;
	return cleaned;
}

/**
 * Route parseInput to Roll Worker or local analytics.
 * @param {object} params - same as analytics.parseInput
 * @param {object} [options]
 * @param {boolean} [options.allowLocalFallback=false] - Discord: fall back to local on worker error / needsLocal
 * @param {boolean} [options.keepProof=false] - keep `_rollWorker` markers for tests / ops
 */
async function parseInput(params = {}, options = {}) {
	const allowLocalFallback = options.allowLocalFallback === true
		|| params.botname === 'Discord';
	const keepProof = options.keepProof === true;

	if (!client.isEnabled()) {
		const local = await analytics.parseInput(params);
		return keepProof ? { ...local, _rollWorker: false } : local;
	}

	const mainMsg = typeof params.inputStr === 'string'
		? params.inputStr.replaceAll(/^\s/g, '').match(/\S+/ig)
		: null;
	const moduleName = analytics.findRollModuleName
		? analytics.findRollModuleName(mainMsg)
		: null;

	const useRemote = isRemoteAllowed(moduleName, params.botname);
	if (!useRemote) {
		const local = await analytics.parseInput(params);
		return keepProof ? { ...local, _rollWorker: false, _rollWorkerModule: moduleName } : local;
	}

	const remoteParams = await enrichParamsForRemote(params, moduleName);

	try {
		const result = await client.parse(remoteParams);
		if (result?.needsLocal) {
			if (allowLocalFallback) {
				logLocalFallback('needsLocal', {
					botname: params.botname,
					moduleName: result.moduleName || moduleName,
				});
				const local = await analytics.parseInput(params);
				return keepProof ? { ...local, _rollWorker: false } : local;
			}
			return {
				text: await getSystemBusyText(params.locale),
				type: 'text',
			};
		}
		return keepProof ? result : stripWorkerProof(result);
	} catch (error) {
		if (allowLocalFallback) {
			logLocalFallback('workerError', {
				botname: params.botname,
				moduleName,
				error: error?.message || String(error),
			});
			const local = await analytics.parseInput(params);
			return keepProof ? { ...local, _rollWorker: false } : local;
		}
		console.error('[ParseRouter] Roll worker failed (no local fallback):', error?.message || error);
		return {
			text: await getSystemBusyText(params.locale),
			type: 'text',
		};
	}
}

/**
 * Prefetch Discord-only assets so Worker can run without live client.
 */
async function enrichParamsForRemote(params, moduleName) {
	if (params.botname !== 'Discord') return params;
	if (!params.discordMessage) return params;

	if (moduleName === 'token') {
		if (params.avatarUrl) return params;
		if (!params.discordClient) return params;
		try {
			const { getAvatar } = require('../../roll/token.js');
			if (typeof getAvatar !== 'function') return params;
			const avatarUrl = await getAvatar(params.discordMessage, params.discordClient);
			if (!avatarUrl) return params;
			return { ...params, avatarUrl };
		} catch (error) {
			console.warn('[ParseRouter] token avatar prefetch failed:', error?.message || error);
			return params;
		}
	}

	if (moduleName === 'openai') {
		if (params.attachmentsMeta || params.replyAttachmentsMeta || params.replyContent) {
			return params;
		}
		try {
			const { prefetchOpenAiDiscordContext } = require('./discord-prefetch');
			const ctx = await prefetchOpenAiDiscordContext(params.discordMessage, params.discordClient);
			return { ...params, ...ctx };
		} catch (error) {
			console.warn('[ParseRouter] openai prefetch failed:', error?.message || error);
			return params;
		}
	}

	return params;
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
