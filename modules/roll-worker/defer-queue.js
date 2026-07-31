"use strict";

/**
 * In-memory defer queue for ROLL_WORKER_REMOTE_ONLY busy replies.
 * Lost on process restart. Interaction jobs may hold a live Discord interaction ref.
 */

const DEFAULT_MAX = 10_000;
const DEFAULT_PER_USER = 20;
const DEFAULT_TTL_MS = 600_000; // 10 min
const INTERACTION_TTL_CAP_MS = 840_000; // 14 min — Discord interaction token ~15 min
const DEFAULT_DRAIN_BATCH = 20;
const DEFAULT_DRAIN_INTERVAL_MS = 5000;

/** @type {object[]} */
let queue = [];
let jobSeq = 0;
/** @type {ReturnType<typeof setInterval> | null} */
let drainTimer = null;
let drainInFlight = false;
/** @type {Map<string, (job: object, result: object) => Promise<void>>} */
const deliverers = new Map();
/** @type {((job: object, options?: object) => Promise<object>) | null} */
let replayFn = null;
/** @type {((job: object, options?: object) => Promise<object>) | null} */
let characterReplayFn = null;

function isDeferBusyActive() {
	if (process.env.ROLL_WORKER_REMOTE_ONLY !== 'true') return false;
	if (!(process.env.ROLL_WORKER_URL || '').trim()) return false;
	if (process.env.ROLL_WORKER_DEFER_BUSY === 'false') return false;
	return true;
}

function getMax() {
	const n = Number.parseInt(process.env.ROLL_WORKER_DEFER_MAX || String(DEFAULT_MAX), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX;
}

function getPerUser() {
	const n = Number.parseInt(process.env.ROLL_WORKER_DEFER_PER_USER || String(DEFAULT_PER_USER), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_PER_USER;
}

function getTtlMs() {
	const n = Number.parseInt(process.env.ROLL_WORKER_DEFER_TTL_MS || String(DEFAULT_TTL_MS), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_MS;
}

function getDrainBatch() {
	const n = Number.parseInt(process.env.ROLL_WORKER_DEFER_DRAIN_BATCH || String(DEFAULT_DRAIN_BATCH), 10);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_DRAIN_BATCH;
}

function size() {
	return queue.length;
}

function resetDeferQueue() {
	queue = [];
	stopDrainMonitor();
	drainInFlight = false;
}

function registerDeliverer(botname, fn) {
	if (!botname || typeof fn !== 'function') return;
	deliverers.set(String(botname), fn);
}

function setReplayFn(fn) {
	replayFn = typeof fn === 'function' ? fn : null;
}

function setCharacterReplayFn(fn) {
	characterReplayFn = typeof fn === 'function' ? fn : null;
}

function leanCharacterParams(params = {}) {
	return {
		doc: params.doc || null,
		item: params.item || null,
		locale: params.locale || null,
		botname: params.botname || 'WWW',
	};
}

/**
 * Clone replyTarget for in-memory queue. Keeps live refs (interaction/socket/client)
 * in the same Gateway process — not serializable across restarts.
 */
function cloneReplyTarget(replyTarget, userid) {
	const isInteraction = Boolean(replyTarget.isInteraction && replyTarget.interaction);
	return {
		botname: replyTarget.botname,
		channelId: replyTarget.channelId || null,
		messageId: replyTarget.messageId || null,
		guildId: replyTarget.guildId || null,
		chatId: replyTarget.chatId || null,
		plurkId: replyTarget.plurkId || null,
		targetId: replyTarget.targetId || null,
		userid: replyTarget.userid || userid,
		kind: replyTarget.kind || null,
		eventName: replyTarget.eventName || null,
		includeCandle: Boolean(replyTarget.includeCandle),
		wwwMessage: replyTarget.wwwMessage || null,
		privatemsg: replyTarget.privatemsg || 0,
		displaynameDiscord: replyTarget.displaynameDiscord || null,
		isInteraction,
		// Live refs — same Gateway process only (lost on restart).
		interaction: isInteraction ? replyTarget.interaction : null,
		message: replyTarget.message || null,
		socket: replyTarget.socket || null,
	};
}

function isTransportSafeError(error) {
	const msg = String(error?.message || error || '');
	const code = error?.code || error?.errno || '';
	const hay = `${code} ${msg}`.toLowerCase();
	return (
		hay.includes('econnrefused')
		|| hay.includes('enotfound')
		|| hay.includes('econnreset')
		|| hay.includes('etimedout')
		|| hay.includes('eai_again')
		|| hay.includes('socket hang up')
		|| hay.includes('network error')
		|| /\btimeout\b/.test(hay)
	);
}

/**
 * Connect failed before Worker could run (safe to defer even for fail-closed mutators).
 * Timeouts are NOT included — Worker may already have mutated.
 */
function isPreFlightConnectError(error) {
	const msg = String(error?.message || error || '');
	const code = error?.code || error?.errno || '';
	const hay = `${code} ${msg}`.toLowerCase();
	return (
		hay.includes('econnrefused')
		|| hay.includes('enotfound')
		|| hay.includes('econnreset')
		|| hay.includes('eai_again')
		|| hay.includes('socket hang up')
		|| hay.includes('network error')
	);
}

/**
 * Reasons that may be deferred (remote-only busy paths).
 * Mutator fail-closed mid-flight is NOT safe — caller must not pass that.
 */
function isDeferrableReason(reason) {
	return [
		'transport',
		'needsLocal',
		'remoteOnlyBlockedLocal',
		'workerError',
		'remoteOnlyMisconfig',
		'primaryStopped',
	].includes(reason);
}

function leanParseParams(params = {}) {
	return {
		inputStr: params.inputStr || '',
		groupid: params.groupid || null,
		userid: params.userid || null,
		userrole: params.userrole ?? 1,
		botname: params.botname || null,
		displayname: params.displayname || null,
		channelid: params.channelid || null,
		displaynameDiscord: params.displaynameDiscord || null,
		membercount: params.membercount || 0,
		titleName: params.titleName || '',
		tgDisplayname: params.tgDisplayname || '',
		locale: params.locale || null,
		channelType: params.channelType ?? null,
		skipExp: Boolean(params.skipExp),
	};
}

function countUserJobs(userid) {
	if (!userid) return 0;
	const id = String(userid);
	return queue.filter((j) => String(j.userid || '') === id).length;
}

/**
 * @param {{ reason: string, params: object, replyTarget?: object, moduleName?: string, jobType?: string }} jobInput
 * @returns {{ ok: boolean, deferred?: boolean, dropped?: string, id?: number }}
 */
function enqueue(jobInput = {}) {
	if (!isDeferBusyActive()) return { ok: false };
	const reason = jobInput.reason || '';
	if (!isDeferrableReason(reason)) return { ok: false };

	const jobType = jobInput.jobType === 'characterAction' ? 'characterAction' : 'parse';
	const params = jobType === 'characterAction'
		? leanCharacterParams(jobInput.params || {})
		: leanParseParams(jobInput.params || {});
	const replyTarget = jobInput.replyTarget || null;
	if (!replyTarget || !replyTarget.botname) return { ok: false };

	const userid = params.userid || replyTarget.userid || null;
	const perUser = getPerUser();
	if (userid && countUserJobs(userid) >= perUser) {
		console.warn(`[DeferQueue] drop per-user full | userid=${userid} | max=${perUser}`);
		return { ok: false, dropped: 'perUser' };
	}

	const isInteraction = Boolean(replyTarget.isInteraction && replyTarget.interaction);
	const ttlMs = isInteraction ? Math.min(getTtlMs(), INTERACTION_TTL_CAP_MS) : getTtlMs();
	const now = Date.now();
	jobSeq += 1;
	const job = {
		id: jobSeq,
		jobType,
		enqueuedAt: now,
		expiresAt: now + ttlMs,
		reason,
		moduleName: jobInput.moduleName || null,
		userid,
		params,
		replyTarget: cloneReplyTarget(replyTarget, userid),
	};

	while (queue.length >= getMax()) {
		const dropped = queue.shift();
		console.warn(`[DeferQueue] drop oldest (full) | id=${dropped?.id} | reason=${dropped?.reason}`);
		void notifyDroppedJob(dropped, 'full');
	}

	// Prefer interactions at the front of drain order: insert before first non-interaction.
	if (isInteraction) {
		const idx = queue.findIndex((j) => !j.replyTarget?.isInteraction);
		if (idx === -1) queue.push(job);
		else queue.splice(idx, 0, job);
	} else {
		queue.push(job);
	}

	ensureDrainMonitor();
	return { ok: true, deferred: true, id: job.id };
}

async function getDropBusyText(locale) {
	try {
		const i18n = require('../i18n/i18n');
		await i18n.init();
		const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
		return t('common.errors.system_busy');
	} catch {
		return 'The system is busy. Please try again later.';
	}
}

/**
 * Notify user / clear Discord interaction when a queued job is dropped (expire or full).
 * Fire-and-forget safe — never throws to callers.
 */
async function notifyDroppedJob(job, dropReason) {
	if (!job?.replyTarget?.botname) return;
	const deliver = deliverers.get(job.replyTarget.botname);
	if (!deliver) {
		console.warn(`[DeferQueue] drop no deliverer | id=${job.id} | reason=${dropReason} | botname=${job.replyTarget.botname}`);
		return;
	}
	try {
		const text = await getDropBusyText(job.params?.locale);
		await deliver(job, {
			text,
			type: 'text',
			_deferDropped: dropReason,
		});
	} catch (error) {
		console.warn(`[DeferQueue] drop notify error | id=${job.id} | ${error?.message || error}`);
	}
}

async function purgeExpired() {
	const now = Date.now();
	const keep = [];
	const expired = [];
	for (const job of queue) {
		if (job.expiresAt <= now) {
			console.warn(`[DeferQueue] expire | id=${job.id} | reason=${job.reason} | botname=${job.replyTarget?.botname}`);
			expired.push(job);
			continue;
		}
		keep.push(job);
	}
	queue = keep;
	for (const job of expired) {
		await notifyDroppedJob(job, 'expire');
	}
	return expired.length;
}

async function tryDrain(options = {}) {
	if (drainInFlight) return { drained: 0 };
	if (!isDeferBusyActive()) return { drained: 0 };
	const hasParseReplay = typeof replayFn === 'function';
	const hasCharacterReplay = typeof characterReplayFn === 'function';
	if (!hasParseReplay && !hasCharacterReplay) return { drained: 0 };

	drainInFlight = true;
	let drained = 0;
	const batch = options.batch || getDrainBatch();
	try {
		purgeExpired();
		const remaining = [];
		for (const job of queue) {
			if (drained >= batch) {
				remaining.push(job);
				continue;
			}
			const isCharacter = job.jobType === 'characterAction';
			if (isCharacter && !hasCharacterReplay) {
				remaining.push(job);
				continue;
			}
			if (!isCharacter && !hasParseReplay) {
				remaining.push(job);
				continue;
			}
			// Interactions first already ordered; process in current order.
			let result;
			try {
				result = isCharacter
					? await characterReplayFn(job, { deferredReplay: true })
					: await replayFn(job, { deferredReplay: true });
			} catch (error) {
				console.warn(`[DeferQueue] replay error | id=${job.id} | ${error?.message || error}`);
				remaining.push(job);
				continue;
			}

			if (result?.deferred) {
				remaining.push(job);
				continue;
			}
			if (result?.busy) {
				remaining.push(job);
				continue;
			}

			const deliver = deliverers.get(job.replyTarget.botname);
			if (!deliver) {
				console.warn(`[DeferQueue] no deliverer | botname=${job.replyTarget.botname} | id=${job.id}`);
				remaining.push(job);
				continue;
			}

			try {
				await deliver(job, result || { text: '', type: 'text' });
				drained += 1;
			} catch (error) {
				console.warn(`[DeferQueue] deliver error | id=${job.id} | ${error?.message || error}`);
				remaining.push(job);
			}
		}
		queue = remaining;
	} finally {
		drainInFlight = false;
	}
	return { drained, size: queue.length };
}

function ensureDrainMonitor() {
	if (drainTimer || !isDeferBusyActive()) return;
	drainTimer = setInterval(() => {
		tryDrain().catch(() => { /* logged inside */ });
	}, DEFAULT_DRAIN_INTERVAL_MS);
	if (typeof drainTimer.unref === 'function') {
		drainTimer.unref();
	}
}

function startDrainMonitor() {
	if (!isDeferBusyActive()) return;
	ensureDrainMonitor();
}

function stopDrainMonitor() {
	if (drainTimer) {
		clearInterval(drainTimer);
		drainTimer = null;
	}
}

/** Hook for CONNECTED — non-blocking. */
function onWorkerConnected() {
	if (!isDeferBusyActive() || queue.length === 0) return;
	tryDrain().catch(() => { /* ignore */ });
}

module.exports = {
	DEFAULT_MAX,
	DEFAULT_PER_USER,
	DEFAULT_TTL_MS,
	INTERACTION_TTL_CAP_MS,
	isDeferBusyActive,
	isTransportSafeError,
	isPreFlightConnectError,
	isDeferrableReason,
	leanParseParams,
	enqueue,
	tryDrain,
	size,
	resetDeferQueue,
	registerDeliverer,
	setReplayFn,
	setCharacterReplayFn,
	startDrainMonitor,
	stopDrainMonitor,
	onWorkerConnected,
	purgeExpired,
	notifyDroppedJob,
	getMax,
	getPerUser,
	getTtlMs,
};
