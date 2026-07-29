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
		info('[ParseMode] Probing Roll Worker link (CONNECTED/DISCONNECTED via [RollWorkerLink])…');
		// Immediate health probe + 30s monitor — edge-triggered CONNECTED / DISCONNECTED logs.
		client.beginLinkMonitor({ logger });
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
		invalidateCachesAfterRemote(moduleName, local, params);
		return keepProof ? { ...local, _rollWorker: false } : local;
	}

	const useRemote = isRemoteAllowed(moduleName, params.botname);
	if (!useRemote) {
		const local = await analytics.parseInput(params);
		invalidateCachesAfterRemote(moduleName, local, params);
		return keepProof ? { ...local, _rollWorker: false, _rollWorkerModule: moduleName } : local;
	}

	const remoteParams = await enrichParamsForRemote(params, moduleName);

	/** Prefer enriched meta on local fallback so Gateway side-effects (e.g. fixshard) are not re-run. */
	const runLocalFallback = async ({ skipExp = false } = {}) => analytics.parseInput({
		...remoteParams,
		discordClient: params.discordClient,
		discordMessage: params.discordMessage,
		t: params.t,
		// Worker may already have awarded EXP / mutated; never double-award on fallback.
		skipExp: skipExp || Boolean(remoteParams.skipExp) || Boolean(params.skipExp),
	});

	try {
		const result = await client.parse(remoteParams);
		if (result?.needsLocal) {
			if (allowLocalFallback) {
				logLocalFallback('needsLocal', {
					botname: params.botname,
					moduleName: result.moduleName || moduleName,
				});
				// Nested characterReRoll/cmd already mutated parent on Worker — only re-run nested input.
				const nestedOnly = result.nestedNeedsLocal && result.nestedInputStr;
				const local = await analytics.parseInput({
					...remoteParams,
					...(nestedOnly ? { inputStr: result.nestedInputStr } : {}),
					discordClient: params.discordClient,
					discordMessage: params.discordMessage,
					t: params.t,
					skipExp: true,
				});
				const merged = mergeNeedsLocalResult(local, result, nestedOnly);
				invalidateCachesAfterRemote(moduleName, merged, remoteParams);
				return keepProof ? { ...merged, _rollWorker: false } : merged;
			}
			return {
				text: await getSystemBusyText(params.locale),
				type: 'text',
				LevelUp: result.LevelUp || '',
				statue: result.statue || '',
			};
		}
		invalidateCachesAfterRemote(moduleName, result, remoteParams);
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
			const local = await runLocalFallback({ skipExp: true });
			invalidateCachesAfterRemote(moduleName, local, remoteParams);
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
 * Modules that mutate shared quota / artifacts / external APIs / DB on Worker
 * must not silent-re-run locally after a remote timeout or transport error
 * (Worker may already have completed).
 */
const FAIL_CLOSED_ON_WORKER_ERROR = new Set([
	'export',
	'openai',
	'token',
	'z_admin',
	'z-story-teller',
	'forward',
	'z_multi-server',
	// DB / Agenda mutators — Worker may already have committed before timeout.
	'z_schedule',
	'z_character',
	'z_saveCommand',
	'z_random_ans',
	'z_trpgDatabase',
	'z_event',
	'z_Level_system',
	'z_stop',
	'z_DDR_darkRollingToGM',
]);

function shouldSkipLocalFallbackOnWorkerError(moduleName) {
	return FAIL_CLOSED_ON_WORKER_ERROR.has(moduleName);
}

/**
 * True when OpenAI Discord context already carries real prefetch content.
 * Empty arrays are NOT enough — they are truthy in JS and would skip live prefetch.
 */
function hasOpenAiDiscordPrefetch(params = {}) {
	return (Array.isArray(params.attachmentsMeta) && params.attachmentsMeta.length > 0)
		|| (Array.isArray(params.replyAttachmentsMeta) && params.replyAttachmentsMeta.length > 0)
		|| (typeof params.replyContent === 'string' && params.replyContent.length > 0);
}

/**
 * Merge Worker needsLocal payload with Gateway local nested/full parse.
 * When nestedNeedsLocal, parent already mutated on Worker — keep parent text combine rules.
 */
function mergeNeedsLocalResult(local, workerResult, nestedOnly) {
	const merged = {
		...local,
		LevelUp: local.LevelUp || workerResult.LevelUp || '',
		statue: local.statue || workerResult.statue || '',
	};
	if (!nestedOnly) return merged;

	const parent = workerResult.parentResult || {};
	if (parent.characterReRoll && parent.text && local.text) {
		try {
			const t = i18n.createTranslator(workerResult.locale || i18n.DEFAULT_LOCALE);
			merged.text = t('character.reroll_combined', {
				name: parent.characterName || '',
				rollName: parent.characterReRollName || '',
				roll: local.text,
				original: parent.text,
			});
		} catch {
			merged.text = `${parent.text}\n======\n${local.text}`;
		}
	} else if (parent.cmd && local.text) {
		merged.text = local.text;
	} else if (parent.text && !local.text) {
		merged.text = parent.text;
	}
	return merged;
}

function invalidateCachesAfterRemote(moduleName, result, params = {}) {
	const name = moduleName || result?._rollWorkerModule;
	if (name === 'z_DDR_darkRollingToGM') {
		try {
			require('./dark-rolling').invalidateCache();
		} catch (error) {
			console.warn('[ParseRouter] dark-rolling invalidate failed:', error?.message || error);
		}
	}
	if (name === 'z_Level_system' && params.groupid) {
		try {
			require('../chat/level').invalidateGroupConfig(params.groupid);
		} catch (error) {
			console.warn('[ParseRouter] level invalidate failed:', error?.message || error);
		}
	}
	if (name === 'z_stop') {
		try {
			const zStop = require('../../roll/z_stop');
			if (typeof zStop.reloadFromDb === 'function') {
				Promise.resolve(zStop.reloadFromDb()).catch((error) => {
					console.warn('[ParseRouter] z_stop reload failed:', error?.message || error);
				});
			}
		} catch (error) {
			console.warn('[ParseRouter] z_stop reload failed:', error?.message || error);
		}
	}
	if (name === 'z_saveCommand') {
		try {
			const cmd = require('../../roll/z_saveCommand');
			if (typeof cmd.reloadFromDb === 'function') {
				Promise.resolve(cmd.reloadFromDb()).catch((error) => {
					console.warn('[ParseRouter] z_saveCommand reload failed:', error?.message || error);
				});
			}
		} catch (error) {
			console.warn('[ParseRouter] z_saveCommand reload failed:', error?.message || error);
		}
	}
	if (name === 'z_admin') {
		try {
			const vip = require('../patreon/veryImportantPerson');
			if (typeof vip.invalidateCache === 'function') vip.invalidateCache();
		} catch (error) {
			console.warn('[ParseRouter] VIP invalidate failed:', error?.message || error);
		}
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
		if (hasOpenAiDiscordPrefetch(params)) {
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
		const parts = String(params.inputStr || '').trim().match(/\S+/ig) || [];
		const sub = String(parts[1] || '').toLowerCase();
		// L13: send processing notice on Gateway before remoted export (Worker has no discordMessage).
		let withNotice = params;
		if ((sub === 'html' || sub === 'txt') && params.discordMessage && !params.exportWaitNoticeSent) {
			try {
				const { sendDiscordExportWaitNotice } = require('../../roll/export');
				if (typeof sendDiscordExportWaitNotice === 'function') {
					await sendDiscordExportWaitNotice(params.discordMessage, params.userid, params.t);
					withNotice = { ...params, exportWaitNoticeSent: true };
				}
			} catch (error) {
				console.warn('[ParseRouter] export wait notice failed:', error?.message || error);
			}
		}
		const { hasExportHistoryMessages } = require('./export-history');
		if (hasExportHistoryMessages(withNotice.exportHistoryMeta)) return withNotice;
		if ((sub === 'html' || sub === 'txt') && withNotice.discordClient && withNotice.channelid) {
			try {
				const {
					prefetchExportHistory,
					canPrefetchExportHistory,
				} = require('./discord-prefetch');
				const gate = await canPrefetchExportHistory({
					userid: withNotice.userid,
					groupid: withNotice.groupid,
					userrole: withNotice.userrole,
				});
				if (!gate.allow) {
					return withNotice;
				}
				const limitMatch = String(withNotice.inputStr || '').match(/--limit\s+(\d+)/);
				const messageLimit = limitMatch ? Number.parseInt(limitMatch[1], 10) : null;
				const prefetched = await prefetchExportHistory(withNotice.discordClient, withNotice.discordMessage, {
					channelid: withNotice.channelid,
					messageLimit,
					demoMode: Boolean(gate.demoMode),
				});
				if (prefetched) {
					return { ...withNotice, ...prefetched };
				}
			} catch (error) {
				console.warn('[ParseRouter] export prefetch failed:', error?.message || error);
			}
		}
		return withNotice;
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
				&& !params.slashDeployMeta?.deferred
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
	hasOpenAiDiscordPrefetch,
	FAIL_CLOSED_ON_WORKER_ERROR,
	logParseMode,
	getSystemBusyText,
	SYSTEM_BUSY_KEY,
};
