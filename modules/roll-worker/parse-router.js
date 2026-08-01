"use strict";

const analytics = require('../analytics');
const i18n = require('../i18n/i18n.js');
const client = require('./client');
const { isRemoteAllowed } = require('./route-table');
const deferQueue = require('./defer-queue');

const SYSTEM_BUSY_KEY = 'common.errors.system_busy';

function getLifecycleFlags() {
	try {
		return require('./local-worker');
	} catch {
		return {
			isPrimaryStopped: () => false,
			isStandbyStopped: () => false,
		};
	}
}

const FALLBACK_LOG_INTERVAL_MS = 60_000;
let loggedModeOnce = false;
let workersReadyPromise = null;
let lastFallbackLogAt = 0;
let fallbackSinceLastLog = 0;
let lastRemoteFailLogAt = 0;
let remoteFailSinceLastLog = 0;
let replayHookInstalled = false;

/**
 * Gateway switch: never run in-process analytics when remoting is configured.
 * Env: ROLL_WORKER_REMOTE_ONLY=true
 */
function isRemoteOnlyMode() {
	return process.env.ROLL_WORKER_REMOTE_ONLY === 'true';
}

/** Job reasons that may complete via in-process analytics during defer drain. */
const DEFER_LOCAL_REPLAY_REASONS = new Set([
	'needsLocal',
	'remoteOnlyBlockedLocal',
]);

function ensureDeferReplayHook() {
	if (replayHookInstalled) return;
	replayHookInstalled = true;
	deferQueue.setReplayFn(async (job, replayOptions = {}) => {
		// Transport/workerError must re-hit Worker only — never local on drain.
		// Otherwise a flapping CONNECTED edge runs local and defeats REMOTE_ONLY.
		const allowLocalFallback = DEFER_LOCAL_REPLAY_REASONS.has(job.reason);
		const result = await parseInput(job.params || {}, {
			deferredReplay: true,
			allowLocalFallback,
			replyTarget: job.replyTarget,
			keepProof: false,
			...replayOptions,
		});
		if (result?.deferred) return { deferred: true };
		const busyText = await getSystemBusyText(job.params?.locale);
		if (result?.text === busyText) return { busy: true };
		return result || { text: '', type: 'text' };
	});
}

/**
 * Try to enqueue instead of returning system_busy (remote-only + defer on).
 * @param {boolean} [alreadyQueued] - drain replay: signal re-queue without duplicating
 * @returns {Promise<object|null>} deferred result or null to fall through to busy text
 */
async function tryDeferBusy({ reason, params, replyTarget, moduleName, alreadyQueued = false }) {
	if (!deferQueue.isDeferBusyActive()) return null;
	// HTTP (/api, /api/local): no push channel — signal deferred so clients can retry.
	if (!replyTarget) {
		return { deferred: true, text: '', type: 'text' };
	}
	// Drain path already holds the job — do not enqueue a second copy.
	if (alreadyQueued) return { deferred: true, text: '', type: 'text' };
	ensureDeferReplayHook();
	deferQueue.startDrainMonitor();
	const enq = deferQueue.enqueue({ reason, params, replyTarget, moduleName });
	if (!enq.ok) return null;
	return { deferred: true, text: '', type: 'text' };
}

async function getSystemBusyText(locale) {
	await i18n.init();
	const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
	return t(SYSTEM_BUSY_KEY);
}

/**
 * REMOTE_ONLY fail after defer unavailable / enqueue failed.
 * Successful defer returns `{ deferred: true }` elsewhere (silent until drain).
 * Always surface system_busy — never silent empty (platforms would drop the reply).
 */
async function remoteOnlyFailResult(locale, extras = {}) {
	return {
		text: await getSystemBusyText(locale),
		type: 'text',
		...extras,
	};
}

/**
 * Mutator mid-flight timeout/error: Worker may already have committed — no replay, no busy spam.
 */
function remoteOnlySilentFailResult(extras = {}) {
	return { text: '', type: 'text', ...extras };
}

function shouldSkipEnsureWorkersInTest() {
	// Unit tests mock client.isEnabled() → ensurePrimaryWorker waitHealth(~5s) on a
	// dead URL, which times out Jest and leaves isolateModulesAsync nested/broken.
	// Live spawn suites must set ROLL_WORKER_SPAWN=true to opt in.
	if (process.env.NODE_ENV !== 'test') return false;
	if (process.env.ROLL_WORKER_MODE === 'true') return true;
	const spawn = (process.env.ROLL_WORKER_SPAWN || '').trim().toLowerCase();
	return spawn !== 'true' && spawn !== '1' && spawn !== 'on';
}

/**
 * Auto-frame primary + local Workers once per Gateway process (no-op on Worker).
 */
function ensureWorkersReady(logger = console) {
	if (process.env.ROLL_WORKER_MODE === 'true') {
		return Promise.resolve(null);
	}
	if (shouldSkipEnsureWorkersInTest()) {
		return Promise.resolve({ ok: false, skipped: true, testHarness: true });
	}
	if (!workersReadyPromise) {
		workersReadyPromise = (async () => {
			try {
				const localWorker = require('./local-worker');
				return await localWorker.startIfConfigured(logger);
			} catch (error) {
				console.warn('[ParseMode] worker auto-start skipped:', error?.message || error);
				return { ok: false, error: error?.message || String(error) };
			}
		})();
	}
	return workersReadyPromise;
}

/** @internal Jest — clear cached auto-start promise + ParseMode banner latch */
function resetWorkersReadyForTests() {
	workersReadyPromise = null;
	loggedModeOnce = false;
}

/**
 * Frame Workers + optionally print [Gateway] banner; always start link monitors.
 * @param {Console} [logger]
 * @param {{ announceBanner?: boolean }} [options] - announceBanner=false: monitors only (Discord cluster ≠ 0)
 */
async function logParseMode(logger = console, options = {}) {
	if (loggedModeOnce) return;
	loggedModeOnce = true;

	const announceBanner = options.announceBanner !== false;
	// Always console.info so the line is `[Gateway] …`, not `[System] …`.
	const info = (msg) => console.info(msg);

	if (process.env.ROLL_WORKER_MODE === 'true') {
		return;
	}

	const started = await ensureWorkersReady(logger);

	const primaryHow = started?.primary?.supervised
		? `spawned${started.primary.pid ? ` pid=${started.primary.pid}` : ''}`
		: (started?.primary?.discovered
			? 'discovered'
			: (started?.primary?.reusedLock
				? 'reused'
				: (started?.primary?.existing ? 'configured' : '')));

	if (client.isEnabled()) {
		const { url, token, timeoutMs } = client.getConfig();
		const remoteOnly = isRemoteOnlyMode();
		const deferOn = remoteOnly && deferQueue.isDeferBusyActive();
		const localUrl = (typeof client.isLocalEnabled === 'function' && client.isLocalEnabled()
			&& typeof client.getLocalConfig === 'function')
			? (client.getLocalConfig().url || '')
			: '';
		const standbyPart = localUrl
			? `Standby ${localUrl}`
			: (started?.local?.pending ? 'Standby pending' : 'Standby off');
		if (announceBanner) {
			info(`[Gateway] Primary ${url}`
				+ (primaryHow ? ` (${primaryHow})` : '')
				+ ` | ${standbyPart}`
				+ ` | fallback=${remoteOnly ? 'none (remote-only)' : 'Embedded'}`
				+ ` | token=${token ? 'on' : 'off'}`
				+ ` | timeout=${timeoutMs}ms`
				+ (remoteOnly ? ` | defer=${deferOn ? 'on' : 'off'}` : ''));
		}
		// Monitors on every process; banner processes also show boot CONNECTED.
		const linkLogger = announceBanner
			? console
			: { info() {}, warn: console.warn, error: console.error };
		client.beginLinkMonitor({ logger: linkLogger });
		if (localUrl && typeof client.beginStandbyLinkMonitor === 'function') {
			client.beginStandbyLinkMonitor({ logger: linkLogger });
		}
		if (deferOn) {
			ensureDeferReplayHook();
			deferQueue.startDrainMonitor();
		}
		return;
	}

	if (!announceBanner) return;

	if (isRemoteOnlyMode()) {
		info('[Gateway] MISCONFIG | REMOTE_ONLY=on but ROLL_WORKER_URL unset');
		return;
	}

	info('[Gateway] Primary off | Standby off | Embedded only (set ROLL_WORKER_URL or allow auto-spawn)');
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
		`[Gateway] OPS fallback→local | reason=${reason}`
		+ ` | botname=${meta.botname || ''}`
		+ ` | module=${meta.moduleName || ''}`
		+ ` | countSinceLastLog=${suppressed}`
		+ (meta.error ? ` | error=${meta.error}` : '')
	);
}

/**
 * Rate-limited: REMOTE_ONLY / no-local path when Worker is down (avoid per-message spam).
 */
function logRemoteFailNoLocal(meta = {}) {
	remoteFailSinceLastLog += 1;
	const now = Date.now();
	if (now - lastRemoteFailLogAt < FALLBACK_LOG_INTERVAL_MS && lastRemoteFailLogAt !== 0) {
		return;
	}
	const suppressed = remoteFailSinceLastLog;
	lastRemoteFailLogAt = now;
	remoteFailSinceLastLog = 0;
	console.warn(
		`[Gateway] OPS remote-fail (no local)`
		+ ` | deferred=${meta.deferred ? 'yes' : 'busy'}`
		+ ` | botname=${meta.botname || ''}`
		+ ` | module=${meta.moduleName || ''}`
		+ ` | countSinceLastLog=${suppressed}`
		+ (meta.error ? ` | error=${meta.error}` : '')
	);
}

/** Test/reset helper for rate-limit counters. */
function resetOpsLogCounters() {
	lastFallbackLogAt = 0;
	fallbackSinceLastLog = 0;
	lastRemoteFailLogAt = 0;
	remoteFailSinceLastLog = 0;
}

function stripWorkerProof(result) {
	if (!result || typeof result !== 'object') return result;
	const cleaned = { ...result };
	delete cleaned._rollWorker;
	delete cleaned._rollWorkerModule;
	delete cleaned._rollLocalWorker;
	return cleaned;
}

/**
 * Route parseInput to Roll Worker or local analytics.
 * @param {object} params - same as analytics.parseInput
 * @param {object} [options]
 * @param {boolean} [options.allowLocalFallback] - default true unless ROLL_WORKER_REMOTE_ONLY
 * @param {boolean} [options.keepProof=false] - keep `_rollWorker` markers for tests / ops
 * @param {boolean} [options.deferredReplay=false] - drain path; allow local under remote-only
 * @param {object} [options.replyTarget] - defer-queue delivery target (Discord/TG/LINE/WA/WWW)
 */
async function parseInput(params = {}, options = {}) {
	// Ensure auto primary/local Workers are up before first route decision.
	if (process.env.ROLL_WORKER_MODE !== 'true') {
		await ensureWorkersReady(console);
	}

	const remoteOnly = isRemoteOnlyMode();
	const deferredReplay = options.deferredReplay === true;
	// Default: fall back locally on Worker outages unless remote-only switch is on.
	// Drain callers must pass allowLocalFallback explicitly (needsLocal only).
	const allowLocalFallback = Object.hasOwn(options, 'allowLocalFallback')
		? options.allowLocalFallback !== false
		: !remoteOnly;
	const keepProof = options.keepProof === true;
	const replyTarget = options.replyTarget || null;

	const mainMsg = typeof params.inputStr === 'string'
		? params.inputStr.replaceAll(/^\s/g, '').match(/\S+/ig)
		: null;
	const moduleName = analytics.findRollModuleName
		? analytics.findRollModuleName(mainMsg)
		: null;

	if (!client.isEnabled()) {
		if (remoteOnly) {
			console.error('[Gateway] ROLL_WORKER_REMOTE_ONLY requires ROLL_WORKER_URL');
			const deferred = await tryDeferBusy({
				reason: 'remoteOnlyMisconfig',
				params,
				replyTarget,
				moduleName,
				alreadyQueued: deferredReplay,
			});
			if (deferred) return deferred;
			return remoteOnlyFailResult(params.locale);
		}
		const local = await analytics.parseInput(params);
		invalidateCachesAfterRemote(moduleName, local, params);
		return keepProof ? { ...local, _rollWorker: false } : local;
	}

	const useRemote = isRemoteAllowed(moduleName, params.botname);
	if (!useRemote) {
		if (remoteOnly) {
			// Unmatched Discord chat: stay silent (do not hit Worker or local analytics).
			if (!moduleName) {
				return keepProof
					? { text: '', type: 'text', _rollWorker: false, _rollWorkerModule: null }
					: { text: '', type: 'text' };
			}
			if (allowLocalFallback) {
				const local = await analytics.parseInput(params);
				invalidateCachesAfterRemote(moduleName, local, params);
				return keepProof ? { ...local, _rollWorker: false, _rollWorkerModule: moduleName } : local;
			}
			logLocalFallback('remoteOnlyBlockedLocal', {
				botname: params.botname,
				moduleName,
			});
			const deferred = await tryDeferBusy({
				reason: 'remoteOnlyBlockedLocal',
				params,
				replyTarget,
				moduleName,
				alreadyQueued: deferredReplay,
			});
			if (deferred) return deferred;
			return remoteOnlyFailResult(params.locale);
		}
		const local = await analytics.parseInput(params);
		invalidateCachesAfterRemote(moduleName, local, params);
		return keepProof ? { ...local, _rollWorker: false, _rollWorkerModule: moduleName } : local;
	}

	const remoteParams = await enrichParamsForRemote(params, moduleName);

	/**
	 * Main-thread analytics (needs live Discord client / Message).
	 * Not covered by .root restart standby — Gateway process must restart for these code paths.
	 */
	const runMainThreadLocal = async ({ skipExp = false } = {}) => analytics.parseInput({
		...remoteParams,
		discordClient: params.discordClient,
		discordMessage: params.discordMessage,
		t: params.t,
		// Worker may already have awarded EXP / mutated; never double-award on fallback.
		skipExp: skipExp || Boolean(remoteParams.skipExp) || Boolean(params.skipExp),
	});

	/**
	 * Hybrid workerError path: prefer ROLL_STANDBY_URL HTTP, then in-process analytics.
	 * needsLocal must NOT use this — Discord live objects cannot cross HTTP.
	 */
	const runLocalFallback = async ({ skipExp = false } = {}) => {
		const skip = skipExp || Boolean(remoteParams.skipExp) || Boolean(params.skipExp);
		if (typeof client.isLocalEnabled === 'function'
			&& client.isLocalEnabled()
			&& typeof client.parseLocal === 'function'
			&& !getLifecycleFlags().isStandbyStopped()) {
			try {
				const httpLocal = await client.parseLocal({
					...remoteParams,
					skipExp: skip,
				});
				if (httpLocal?.needsLocal) {
					logLocalFallback('localHttpNeedsLocal', {
						botname: params.botname,
						moduleName: httpLocal.moduleName || moduleName,
					});
					return runMainThreadLocal({ skipExp: true });
				}
				logLocalFallback('workerErrorLocalHttp', {
					botname: params.botname,
					moduleName,
				});
				return { ...httpLocal, _rollLocalWorker: true };
			} catch (error) {
				logLocalFallback('localHttpError', {
					botname: params.botname,
					moduleName,
					error: error?.message || String(error),
				});
			}
		}
		return runMainThreadLocal({ skipExp: skip });
	};

	// Operator stop Primary: still try Standby → Embedded (or Standby-only under REMOTE_ONLY).
	if (getLifecycleFlags().isPrimaryStopped()) {
		logLocalFallback('primaryStopped', {
			botname: params.botname,
			moduleName,
		});
		if (allowLocalFallback) {
			const local = await runLocalFallback({ skipExp: false });
			invalidateCachesAfterRemote(moduleName, local, remoteParams);
			return keepProof
				? { ...local, _rollWorker: false }
				: stripWorkerProof(local);
		}
		if (typeof client.isLocalEnabled === 'function'
			&& client.isLocalEnabled()
			&& typeof client.parseLocal === 'function'
			&& !getLifecycleFlags().isStandbyStopped()) {
			try {
				const httpLocal = await client.parseLocal({
					...remoteParams,
					skipExp: false,
				});
				if (httpLocal?.needsLocal) {
					const deferred = await tryDeferBusy({
						reason: 'needsLocal',
						params: remoteParams,
						replyTarget,
						moduleName: httpLocal.moduleName || moduleName,
						alreadyQueued: deferredReplay,
					});
					if (deferred) return deferred;
					return remoteOnlyFailResult(params.locale);
				}
				invalidateCachesAfterRemote(moduleName, httpLocal, remoteParams);
				return keepProof
					? { ...httpLocal, _rollWorker: false, _rollLocalWorker: true }
					: stripWorkerProof({ ...httpLocal, _rollLocalWorker: true });
			} catch (error) {
				logLocalFallback('localHttpError', {
					botname: params.botname,
					moduleName,
					error: error?.message || String(error),
				});
			}
		}
		const deferred = await tryDeferBusy({
			reason: 'primaryStopped',
			params: remoteParams,
			replyTarget,
			moduleName,
			alreadyQueued: deferredReplay,
		});
		if (deferred) return deferred;
		return remoteOnlyFailResult(params.locale);
	}

	try {
		const result = await client.parse(remoteParams);
		if (result?.needsLocal) {
			if (allowLocalFallback) {
				logLocalFallback('needsLocal', {
					botname: params.botname,
					moduleName: result.moduleName || moduleName,
				});
				// Nested characterReRoll/cmd already mutated parent on Worker — only re-run nested input.
				// Always main-thread: needs live discordClient / Message (not hot-reloadable via local HTTP).
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
			const deferred = await tryDeferBusy({
				reason: 'needsLocal',
				params: remoteParams,
				replyTarget,
				moduleName: result.moduleName || moduleName,
				alreadyQueued: deferredReplay,
			});
			if (deferred) return deferred;
			return remoteOnlyFailResult(params.locale, {
				LevelUp: result.LevelUp || '',
				statue: result.statue || '',
			});
		}
		invalidateCachesAfterRemote(moduleName, result, remoteParams);
		return keepProof ? result : stripWorkerProof(result);
	} catch (error) {
		// Mutators (export / schedule / DB…): never local-fallback after Worker error.
		// Pre-flight connect → defer (or system_busy if enqueue fails).
		// Timeout / mid-flight → no replay (double-write risk); silent empty (not busy spam).
		if (shouldSkipLocalFallbackOnWorkerError(moduleName)) {
			if (deferQueue.isPreFlightConnectError(error)) {
				const deferred = await tryDeferBusy({
					reason: 'transport',
					params: remoteParams,
					replyTarget,
					moduleName,
					alreadyQueued: deferredReplay,
				});
				logRemoteFailNoLocal({
					botname: params.botname,
					moduleName,
					deferred: Boolean(deferred),
					error: error?.message || String(error),
				});
				if (deferred) return deferred;
				return remoteOnlyFailResult(params.locale);
			}
			logLocalFallback('workerErrorNoFallback', {
				botname: params.botname,
				moduleName,
				error: error?.message || String(error),
			});
			return remoteOnlySilentFailResult();
		}
		if (allowLocalFallback) {
			// runLocalFallback logs workerErrorLocalHttp / localHttpError / falls to main-thread.
			const local = await runLocalFallback({ skipExp: true });
			if (!local?._rollLocalWorker) {
				logLocalFallback('workerError', {
					botname: params.botname,
					moduleName,
					error: error?.message || String(error),
				});
			}
			invalidateCachesAfterRemote(moduleName, local, remoteParams);
			return keepProof
				? { ...local, _rollWorker: false }
				: stripWorkerProof(local);
		}
		const deferReason = deferQueue.isTransportSafeError(error) ? 'transport' : 'workerError';
		const deferred = await tryDeferBusy({
			reason: deferReason,
			params: remoteParams,
			replyTarget,
			moduleName,
			alreadyQueued: deferredReplay,
		});
		logRemoteFailNoLocal({
			botname: params.botname,
			moduleName,
			deferred: Boolean(deferred),
			error: error?.message || String(error),
		});
		if (deferred) return deferred;
		return remoteOnlyFailResult(params.locale);
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
			console.warn('[Gateway] dark-rolling invalidate failed:', error?.message || error);
		}
	}
	if (name === 'z_Level_system' && params.groupid) {
		try {
			require('../chat/level').invalidateGroupConfig(params.groupid);
		} catch (error) {
			console.warn('[Gateway] level invalidate failed:', error?.message || error);
		}
	}
	if (name === 'z_stop') {
		try {
			const zStop = require('../../roll/z_stop');
			if (typeof zStop.reloadFromDb === 'function') {
				Promise.resolve(zStop.reloadFromDb()).catch((error) => {
					console.warn('[Gateway] z_stop reload failed:', error?.message || error);
				});
			}
		} catch (error) {
			console.warn('[Gateway] z_stop reload failed:', error?.message || error);
		}
	}
	if (name === 'z_saveCommand') {
		try {
			const cmd = require('../../roll/z_saveCommand');
			if (typeof cmd.reloadFromDb === 'function') {
				Promise.resolve(cmd.reloadFromDb()).catch((error) => {
					console.warn('[Gateway] z_saveCommand reload failed:', error?.message || error);
				});
			}
		} catch (error) {
			console.warn('[Gateway] z_saveCommand reload failed:', error?.message || error);
		}
	}
	if (name === 'z_admin') {
		try {
			const vip = require('../patreon/veryImportantPerson');
			if (typeof vip.invalidateCache === 'function') vip.invalidateCache();
		} catch (error) {
			console.warn('[Gateway] VIP invalidate failed:', error?.message || error);
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
			console.warn('[Gateway] token avatar prefetch failed:', error?.message || error);
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
			console.warn('[Gateway] openai prefetch failed:', error?.message || error);
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
				console.warn('[Gateway] story prefetch failed:', error?.message || error);
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
				console.warn('[Gateway] story group names prefetch failed:', error?.message || error);
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
				console.warn('[Gateway] forward prefetch failed:', error?.message || error);
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
				console.warn('[Gateway] chatroom prefetch failed:', error?.message || error);
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
				console.warn('[Gateway] export wait notice failed:', error?.message || error);
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
				console.warn('[Gateway] export prefetch failed:', error?.message || error);
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
			console.warn('[Gateway] admin prefetch failed:', error?.message || error);
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
	isRemoteOnlyMode,
	shouldSkipLocalFallbackOnWorkerError,
	shouldSkipLocalFindRollList,
	hasOpenAiDiscordPrefetch,
	FAIL_CLOSED_ON_WORKER_ERROR,
	FALLBACK_LOG_INTERVAL_MS,
	logParseMode,
	ensureWorkersReady,
	resetWorkersReadyForTests,
	logRemoteFailNoLocal,
	resetOpsLogCounters,
	getSystemBusyText,
	remoteOnlyFailResult,
	remoteOnlySilentFailResult,
	SYSTEM_BUSY_KEY,
	tryDeferBusy,
};
