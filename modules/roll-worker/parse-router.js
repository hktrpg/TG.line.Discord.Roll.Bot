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
		info('[ParseMode] Discord matched modules → worker (denylist; needsLocal for live Discord). Other platforms → worker.');
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
 * @param {boolean} [options.allowLocalFallback=true] - fall back to local on worker error / needsLocal
 * @param {boolean} [options.keepProof=false] - keep `_rollWorker` markers for tests / ops
 */
async function parseInput(params = {}, options = {}) {
	// Default: always fall back locally so Worker outages do not spam system_busy on TG/Line/etc.
	const allowLocalFallback = options.allowLocalFallback !== false;
	const keepProof = options.keepProof === true;

	const mainMsg = typeof params.inputStr === 'string'
		? params.inputStr.replaceAll(/^\s/g, '').match(/\S+/ig)
		: null;
	const moduleName = analytics.findRollModuleName
		? analytics.findRollModuleName(mainMsg)
		: null;

	if (!client.isEnabled()) {
		const local = await analytics.parseInput(params);
		invalidateDarkRollingIfNeeded(moduleName, local);
		return keepProof ? { ...local, _rollWorker: false } : local;
	}

	const useRemote = isRemoteAllowed(moduleName, params.botname);
	if (!useRemote) {
		const local = await analytics.parseInput(params);
		invalidateDarkRollingIfNeeded(moduleName, local);
		return keepProof ? { ...local, _rollWorker: false, _rollWorkerModule: moduleName } : local;
	}

	const remoteParams = await enrichParamsForRemote(params, moduleName);

	/** Prefer enriched meta on local fallback so Gateway side-effects (e.g. fixshard) are not re-run. */
	const runLocalFallback = async () => analytics.parseInput({
		...remoteParams,
		discordClient: params.discordClient,
		discordMessage: params.discordMessage,
		t: params.t,
	});

	try {
		const result = await client.parse(remoteParams);
		if (result?.needsLocal) {
			if (allowLocalFallback) {
				logLocalFallback('needsLocal', {
					botname: params.botname,
					moduleName: result.moduleName || moduleName,
				});
				const local = await runLocalFallback();
				// Worker may already have LevelUp; local EXPUP often hits speak cooldown.
				const merged = {
					...local,
					LevelUp: local.LevelUp || result.LevelUp || '',
					statue: local.statue || result.statue || '',
				};
				invalidateDarkRollingIfNeeded(moduleName, merged);
				return keepProof ? { ...merged, _rollWorker: false } : merged;
			}
			return {
				text: await getSystemBusyText(params.locale),
				type: 'text',
				LevelUp: result.LevelUp || '',
				statue: result.statue || '',
			};
		}
		invalidateDarkRollingIfNeeded(moduleName, result);
		return keepProof ? result : stripWorkerProof(result);
	} catch (error) {
		// Export writes quota + artifacts on the Worker. Re-running locally after
		// timeout/error can double-charge and duplicate files — fail closed.
		if (shouldSkipLocalFallbackOnWorkerError(moduleName)) {
			logLocalFallback('workerErrorNoFallback', {
				botname: params.botname,
				moduleName,
				error: error?.message || String(error),
			});
			return {
				text: await getSystemBusyText(params.locale),
				type: 'text',
			};
		}
		if (allowLocalFallback) {
			logLocalFallback('workerError', {
				botname: params.botname,
				moduleName,
				error: error?.message || String(error),
			});
			const local = await runLocalFallback();
			invalidateDarkRollingIfNeeded(moduleName, local);
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
 * Modules that mutate shared quota/artifacts on Worker must not silent-re-run locally
 * after a remote timeout or transport error (Worker may already have completed).
 */
function shouldSkipLocalFallbackOnWorkerError(moduleName) {
	return moduleName === 'export';
}

function invalidateDarkRollingIfNeeded(moduleName, result) {
	const name = moduleName || result?._rollWorkerModule;
	if (name !== 'z_DDR_darkRollingToGM') return;
	try {
		require('./dark-rolling').invalidateCache();
	} catch (error) {
		console.warn('[ParseRouter] dark-rolling invalidate failed:', error?.message || error);
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

	if (moduleName === 'z-story-teller') {
		const sub = String(params.inputStr || '').trim().split(/\s+/)[1]?.toLowerCase();
		if ((sub === 'import' || sub === 'update') && !params.storyAttachmentMeta) {
			try {
				const { prefetchStoryAttachment } = require('./discord-prefetch');
				const storyAttachmentMeta = await prefetchStoryAttachment(
					params.discordMessage,
					params.discordClient
				);
				if (storyAttachmentMeta) {
					return { ...params, storyAttachmentMeta };
				}
			} catch (error) {
				console.warn('[ParseRouter] story prefetch failed:', error?.message || error);
			}
		}
		if (sub === 'mylist' && !params.storyGroupNamesMeta && params.discordClient && params.userid) {
			try {
				const { prefetchStoryGroupNames } = require('./discord-prefetch');
				const prefetched = await prefetchStoryGroupNames(params.discordClient, {
					userid: params.userid,
				});
				if (prefetched) {
					return { ...params, ...prefetched };
				}
			} catch (error) {
				console.warn('[ParseRouter] story group names prefetch failed:', error?.message || error);
			}
		}
		return params;
	}

	if (moduleName === 'forward') {
		if (params.forwardSourceMeta) return params;
		const parts = String(params.inputStr || '').trim().match(/\S+/ig) || [];
		const messageLink = parts[1];
		if (/^https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+$/i.test(messageLink || '')) {
			try {
				const { prefetchForwardSource } = require('./discord-prefetch');
				const forwardSourceMeta = await prefetchForwardSource(
					params.discordMessage,
					params.discordClient,
					{
						messageLink,
						userid: params.userid,
						channelid: params.channelid,
					}
				);
				if (forwardSourceMeta) {
					return { ...params, forwardSourceMeta };
				}
			} catch (error) {
				console.warn('[ParseRouter] forward prefetch failed:', error?.message || error);
			}
		}
		return params;
	}

	if (moduleName === 'z_multi-server') {
		if (params.chatroomChannelMeta) return params;
		const parts = String(params.inputStr || '').trim().match(/\S+/ig) || [];
		const sub = String(parts[1] || '').toLowerCase();
		let channelId = null;
		if (sub === 'create') channelId = parts[2];
		else if (sub === 'join') channelId = parts[3];
		else if (sub === 'exit' && parts[2]) channelId = parts[2];
		if (channelId && params.discordClient) {
			try {
				const { prefetchChatroomChannel } = require('./discord-prefetch');
				const chatroomChannelMeta = await prefetchChatroomChannel(params.discordClient, {
					channelId,
					userid: params.userid,
				});
				if (chatroomChannelMeta) {
					return { ...params, chatroomChannelMeta };
				}
			} catch (error) {
				console.warn('[ParseRouter] chatroom prefetch failed:', error?.message || error);
			}
		}
		return params;
	}

	if (moduleName === 'export') {
		const { hasExportHistoryMessages } = require('./export-history');
		if (hasExportHistoryMessages(params.exportHistoryMeta)) return params;
		const parts = String(params.inputStr || '').trim().match(/\S+/ig) || [];
		const sub = String(parts[1] || '').toLowerCase();
		if ((sub === 'html' || sub === 'txt') && params.discordClient && params.channelid) {
			try {
				const {
					prefetchExportHistory,
					canPrefetchExportHistory,
				} = require('./discord-prefetch');
				const gate = await canPrefetchExportHistory({
					userid: params.userid,
					groupid: params.groupid,
					userrole: params.userrole,
				});
				if (!gate.allow) {
					return params;
				}
				const limitMatch = String(params.inputStr || '').match(/--limit\s+(\d+)/);
				const messageLimit = limitMatch ? Number.parseInt(limitMatch[1], 10) : null;
				const prefetched = await prefetchExportHistory(params.discordClient, params.discordMessage, {
					channelid: params.channelid,
					messageLimit,
					demoMode: Boolean(gate.demoMode),
				});
				if (prefetched) {
					return { ...params, ...prefetched };
				}
			} catch (error) {
				console.warn('[ParseRouter] export prefetch failed:', error?.message || error);
			}
		}
		return params;
	}

	if (moduleName === 'z_admin') {
		const parts = String(params.inputStr || '').trim().match(/\S+/ig) || [];
		const sub = String(parts[1] || '').toLowerCase();
		try {
			const {
				collectClusterHealthMeta,
				collectClusterMemMeta,
				prefetchCsvAttachment,
				collectFixShardMeta,
				collectSlashDeployMeta,
			} = require('./admin-remote');
			if (sub === 'clusterhealth' && !params.clusterHealthMeta) {
				const clusterHealthMeta = collectClusterHealthMeta();
				if (clusterHealthMeta) {
					return { ...params, clusterHealthMeta };
				}
			}
			if (sub === 'mem' && !params.clusterMemMeta && params.discordClient) {
				const clusterMemMeta = await collectClusterMemMeta(params.discordClient);
				if (clusterMemMeta) {
					return { ...params, clusterMemMeta };
				}
			}
			if (sub === 'importpatreon' && !params.csvAttachmentMeta && params.discordMessage) {
				const csvAttachmentMeta = prefetchCsvAttachment(params.discordMessage);
				if (csvAttachmentMeta) {
					return { ...params, csvAttachmentMeta };
				}
			}
			if (sub === 'fixshard' && !params.fixShardMeta) {
				const fixShardMeta = await collectFixShardMeta(parts[2]);
				if (fixShardMeta) {
					return { ...params, fixShardMeta };
				}
			}
			if (
				(sub === 'registeredglobal' || sub === 'testregistered' || sub === 'removeslashcommands')
				&& !params.slashDeployMeta?.text
			) {
				const targetId = parts[2] || params.groupid;
				const slashDeployMeta = await collectSlashDeployMeta({
					action: sub,
					targetId,
					locale: params.locale,
				});
				if (slashDeployMeta) {
					return { ...params, slashDeployMeta };
				}
			}
		} catch (error) {
			console.warn('[ParseRouter] admin prefetch failed:', error?.message || error);
		}
		return params;
	}

	return params;
}

/**
 * Whether gateway should skip local findRollList and always ask the router/worker.
 * Always false: Gateway and Worker share the same roll/* codebase, so local
 * findRollList is the command gate. Skipping caused WhatsApp/TG/Line chatter to
 * hit /v1/parse (EXP + load) for every group message.
 */
function shouldSkipLocalFindRollList() {
	return false;
}

module.exports = {
	parseInput,
	shouldSkipLocalFallbackOnWorkerError,
	shouldSkipLocalFindRollList,
	logParseMode,
	getSystemBusyText,
	SYSTEM_BUSY_KEY,
};
