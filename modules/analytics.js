"use strict";
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const { Types: { ObjectId } } = require('mongoose');
const readdir = util.promisify(fs.readdir);

// Create an index of available roll modules
const rollModules = new Map();

// Initialize the module index
(async function () {
	try {
		const files = await readdir('./roll/');
		for (const file of files) {
			const name = path.basename(file, '.js');
			if ((name !== 'index' && name !== 'demo') && file.endsWith('.js')) {
				rollModules.set(name.toLowerCase(), {
					name,
					path: path.join(__dirname, '../roll/', file)
				});
			}
		}
	} catch (error) {
		console.error('[Analytics] Error initializing roll modules:', error);
	}
}());

// Lazy loading function for roll modules
function getRollModule(moduleName) {
	if (!moduleName) return null;

	const moduleInfo = rollModules.get(moduleName.toLowerCase());
	if (!moduleInfo) return null;

	// Only require the module when it's first accessed
	if (!exports[moduleInfo.name]) {
		try {
			exports[moduleInfo.name] = require(moduleInfo.path);
		} catch (error) {
			console.error(`[Analytics] Error loading module ${moduleInfo.name}:`, error);
			return null;
		}
	}

	return exports[moduleInfo.name];
}

const schema = require('./db/schema.js');
const i18n = require('./i18n/i18n.js');
const buildInfo = require('./runtime/build-info');
const { buildStateVersionSection } = require('./runtime/state-version');
const debugMode = (process.env.DEBUG) ? true : false;
const MESSAGE_SPLITOR = (/\S+/ig);
const courtMessage = require('./chat/logs').courtMessage || function () {};
const getState = require('./chat/logs').getState || function () {};
const EXPUP = require('./chat/level').EXPUP || function () {};

// 創建一個統一的上下文類來管理參數
class RollContext {
	constructor(params) {
		this.inputStr = params.inputStr || "";
		this.groupid = params.groupid || null;
		this.userid = params.userid || null;
		this.userrole = params.userrole || 1;
		this.botname = params.botname || null;
		this.displayname = params.displayname || null;
		this.channelid = params.channelid || null;
		this.displaynameDiscord = params.displaynameDiscord || null;
		this.membercount = params.membercount || 0;
		this.discordClient = params.discordClient || null;
		this.discordMessage = params.discordMessage || null;
		this.channelType = params.channelType ?? params.discordMessage?.channel?.type ?? null;
		this.titleName = params.titleName || '';
		this.tgDisplayname = params.tgDisplayname || '';
		this.avatarUrl = params.avatarUrl || null;
		this.attachmentsMeta = Array.isArray(params.attachmentsMeta) ? params.attachmentsMeta : null;
		this.replyAttachmentsMeta = Array.isArray(params.replyAttachmentsMeta) ? params.replyAttachmentsMeta : null;
		this.replyContent = params.replyContent || null;
		this.storyAttachmentMeta = params.storyAttachmentMeta || null;
		this.storyGroupNamesMeta = params.storyGroupNamesMeta || null;
		this.forwardSourceMeta = params.forwardSourceMeta || null;
		this.chatroomChannelMeta = params.chatroomChannelMeta || null;
		this.exportMeta = params.exportMeta || null;
		this.exportHistoryMeta = params.exportHistoryMeta || null;
		this.clusterHealthMeta = params.clusterHealthMeta || null;
		this.clusterMemMeta = params.clusterMemMeta || null;
		this.csvAttachmentMeta = params.csvAttachmentMeta || null;
		this.fixShardMeta = params.fixShardMeta || null;
		this.slashDeployMeta = params.slashDeployMeta || null;
		this.gatewayBuildInfo = params.gatewayBuildInfo || null;
		this.standbyWorkerUrl = params.standbyWorkerUrl || null;
		this.skipExp = Boolean(params.skipExp);
		this.locale = params.locale || i18n.DEFAULT_LOCALE;
		this.t = params.t || i18n.createTranslator(this.locale);
		this.mainMsg = this.inputStr.replaceAll(/^\s/g, '').match(MESSAGE_SPLITOR);
	}

	toParams() {
		return {
			inputStr: this.inputStr,
			groupid: this.groupid,
			userid: this.userid,
			userrole: this.userrole,
			mainMsg: this.mainMsg,
			botname: this.botname,
			displayname: this.displayname,
			channelid: this.channelid,
			displaynameDiscord: this.displaynameDiscord,
			membercount: this.membercount,
			discordClient: this.discordClient,
			discordMessage: this.discordMessage,
			channelType: this.channelType,
			titleName: this.titleName,
			tgDisplayname: this.tgDisplayname,
			avatarUrl: this.avatarUrl,
			attachmentsMeta: this.attachmentsMeta,
			replyAttachmentsMeta: this.replyAttachmentsMeta,
			replyContent: this.replyContent,
			storyAttachmentMeta: this.storyAttachmentMeta,
			storyGroupNamesMeta: this.storyGroupNamesMeta,
			forwardSourceMeta: this.forwardSourceMeta,
			chatroomChannelMeta: this.chatroomChannelMeta,
			exportMeta: this.exportMeta,
			exportHistoryMeta: this.exportHistoryMeta,
			clusterHealthMeta: this.clusterHealthMeta,
			clusterMemMeta: this.clusterMemMeta,
			csvAttachmentMeta: this.csvAttachmentMeta,
			fixShardMeta: this.fixShardMeta,
			slashDeployMeta: this.slashDeployMeta,
			gatewayBuildInfo: this.gatewayBuildInfo,
			standbyWorkerUrl: this.standbyWorkerUrl,
			skipExp: this.skipExp,
			locale: this.locale,
			t: this.t
		};
	}
}

const parseInput = async (params) => {
	const context = new RollContext(params);

	// Always finish i18n load before translating — otherwise t() returns undefined
	// and replies become the literal string "undefined" (e.g. COC `cc`).
	await i18n.init();

	// Worker + chat platforms: re-resolve from DB so Discord/TG Gateway
	// process-local locale caches cannot disagree (zh-tw vs en) for the same guild.
	// WWW/Local/Api: trust params.locale (page UI language), not botLocale DB.
	const channelType = params.channelType ?? params.discordMessage?.channel?.type;
	const webBot = context.botname === 'WWW'
		|| context.botname === 'Local'
		|| context.botname === 'Api';
	const onWorker = process.env.ROLL_WORKER_MODE === 'true';
	if ((onWorker && !webBot) || !params.locale) {
		context.locale = await i18n.resolveLocale({
			groupid: context.groupid,
			userid: context.userid,
			channelType,
			botname: context.botname
		});
	} else {
		context.locale = i18n.normalizeLocale(params.locale);
	}
	// Recreate translator after init (params.t may have been built too early).
	context.t = i18n.createTranslator(context.locale);

	let result = {
		text: '',
		type: 'text',
		LevelUp: '',
		statue: ''
	};

	// EXPUP 功能 + LevelUP 功能
	if (context.groupid && !context.skipExp) {
		let tempEXPUP = await EXPUP(
			context.groupid,
			context.userid,
			context.displayname,
			context.displaynameDiscord,
			context.membercount,
			context.tgDisplayname,
			context.discordMessage,
			context.locale
		);
		result.LevelUp = tempEXPUP?.text || '';
		// EXPUP fills `status`; platforms read `statue` (legacy key).
		result.statue = tempEXPUP?.status || '';
	}

	// 檢查是不是要停止 z_stop 功能
	if (context.groupid && context.mainMsg[0] && z_stop(context.mainMsg, context.groupid)) {
		return result;
	}

	// rolldice 擲骰功能
	try {
		let rollDiceResult = await rolldice(context);
		if (rollDiceResult?.needsLocal) {
			return {
				...rollDiceResult,
				LevelUp: result.LevelUp,
				statue: result.statue,
			};
		}
		if (rollDiceResult) {
			result = { ...result, ...rollDiceResult };
		}
	} catch (error) {
		console.error(`[Analytics] rolldice GET ERROR:
			Stack: ${error.stack}
			Name: ${error.name}
			Input: ${context.inputStr}
			Botname: ${context.botname}
			Time: ${new Date()}`);
	}

	// cmdfunction .cmd 功能 z_saveCommand 功能
	if (result.cmd && result.text) {
		let cmdFunctionResult = await cmdfunction({
			...context.toParams(),
			result
		});
		if (cmdFunctionResult?.needsLocal) {
			return {
				...cmdFunctionResult,
				LevelUp: result.LevelUp,
				statue: result.statue,
				nestedNeedsLocal: true,
				nestedInputStr: result.text,
				parentResult: {
					cmd: true,
					text: result.text,
				},
			};
		}
		if (cmdFunctionResult) {
			result = { ...result, ...cmdFunctionResult };
		}
	}

	// characterReRoll 功能
	if (result.characterReRoll) {
		let characterReRoll = await cmdfunction({
			...context.toParams(),
			result
		});
		if (characterReRoll?.needsLocal) {
			return {
				...characterReRoll,
				LevelUp: result.LevelUp,
				statue: result.statue,
				nestedNeedsLocal: true,
				nestedInputStr: result.characterReRollItem || result.text,
				parentResult: {
					characterReRoll: true,
					text: result.text,
					characterName: result.characterName,
					characterReRollName: result.characterReRollName,
				},
			};
		}
		const t = context.t;
		if (result.text && characterReRoll.text) {
			result.text = t('character.reroll_combined', {
				name: result.characterName,
				rollName: result.characterReRollName,
				roll: characterReRoll.text,
				original: result.text
			});
		} else {
			result.text = result.text || '';
			if (characterReRoll && characterReRoll.text) {
				result.text += `======\n${characterReRoll.text}`;
			}
		}
	}

	// state 功能 — pass Gateway build identity when Worker computes the report
	if (result.state) {
		result.text = await stateText(context.locale, {
			gatewayBuildInfo: context.gatewayBuildInfo || null,
			standbyWorkerUrl: context.standbyWorkerUrl || null,
		});
	}

	// courtMessage + saveLog — skip on skipExp (workerError/needsLocal fallback / schedule)
	// so fall-open dual-exec does not inflate platform roll metrics (L10).
	if (!context.skipExp) {
		await courtMessage({ result, botname: context.botname, inputStr: context.inputStr });
	}
	return result;
}

const rolldice = async (context) => {
	if (!context.groupid) {
		context.groupid = '';
	}
	const moduleName = findRollModuleName(context.mainMsg);
	let target = moduleName ? getRollModule(moduleName) : null;
	if (!target) return null;

	// On Roll Worker, Discord-coupled modules cannot run without a live client.
	if (
		process.env.ROLL_WORKER_MODE === 'true'
		&& context.botname === 'Discord'
		&& !context.discordClient
	) {
		try {
			const { isRemoteAllowed } = require('./roll-worker/route-table');
			if (!isRemoteAllowed(moduleName, 'Discord')) {
				return { needsLocal: true, moduleName };
			}
		} catch {
			return { needsLocal: true, moduleName };
		}
	}

	(debugMode) ? console.log('[analytics]            trigger:', context.inputStr) : '';

	let rollTimes = context.inputStr.match(/^\.(\d{1,2})\s/);
	
	rollTimes ? rollTimes = rollTimes[1] : rollTimes = 1;
	rollTimes > 10 ? rollTimes = 10 : null;
	context.inputStr = context.inputStr.replace(/^\.\d{1,2}\s/, '');

	/^\.(\d{1,2})$/.test(context.mainMsg[0]) ? context.mainMsg.shift() : null;
	context.mainMsg = context.mainMsg.filter(item => item !== '');

	let retext = '';
	let tempsave = {};
	for (let index = 0; index < rollTimes; index++) {
		if (rollTimes > 1 && /^dice|^funny/i.test(target.gameType())) {
			let result = await target.rollDiceCommand(context.toParams());
			if (result?.needsLocal) {
				return result;
			}
			if (result && result.text) {
				retext += `#${index + 1}： ${result.text.replaceAll('\n', '')}\n`;
				tempsave = result;
			}
		} else {
			let result = await target.rollDiceCommand(context.toParams());
			if (result?.needsLocal) {
				return result;
			}
			if (result) {
				tempsave = result;
			}
		}
	}

	if (retext && tempsave) {
		tempsave.text = retext;
	}

	return tempsave || {};
}

function findRollModuleName(mainMsg) {
	if (!mainMsg || !Array.isArray(mainMsg) || mainMsg.length === 0) return null;

	const msg = [...mainMsg];
	if (msg[0] && /^\.(\d{1,2})$/.test(msg[0])) {
		msg.shift();
	}
	if (!msg[1]) msg[1] = '';

	if (msg[0] && (msg[0].toLowerCase() === '.me' || msg[0].toLowerCase() === '.mee')) {
		return 'z_myname';
	}

	for (const [moduleKey] of rollModules) {
		const module = getRollModule(moduleKey);
		if (!module || !module.prefixs || typeof module.prefixs !== 'function') continue;

		const prefixList = module.prefixs();
		if (!Array.isArray(prefixList)) continue;

		const match = prefixList.some(prefix => {
			if (!msg[0] || !prefix || !prefix.first) return false;
			const firstMatch = msg[0].match(prefix.first);
			if (!firstMatch) return false;
			if (prefix.second === null) return true;
			return msg[1] && msg[1].match(prefix.second);
		});

		if (match) {
			const info = rollModules.get(moduleKey);
			return info?.name || moduleKey;
		}
	}

	return null;
}

function findRollList(mainMsg) {
	const moduleName = findRollModuleName(mainMsg);
	if (!moduleName) return null;

	// Keep legacy mutation: strip .N repeat prefix from caller's mainMsg
	if (mainMsg[0] && /^\.(\d{1,2})$/.test(mainMsg[0])) {
		mainMsg.shift();
	}
	if (!mainMsg[1]) mainMsg[1] = '';

	return getRollModule(moduleName);
}

/** HK calendar month bounds (UTC+8). `month` is 1–12. */
function hkMonthBounds(year, month) {
	const lastDay = new Date(year, month, 0).getDate();
	const start = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+08:00`);
	const end = new Date(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999+08:00`);
	return { start, end };
}

function hkCalendarNow() {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Hong_Kong',
		year: 'numeric',
		month: '2-digit'
	}).formatToParts(new Date());
	const y = Number.parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
	const m = Number.parseInt(parts.find((p) => p.type === 'month')?.value ?? '0', 10);
	return { y, m };
}

function hkLastMonth() {
	let { y, m } = hkCalendarNow();
	m -= 1;
	if (m < 1) {
		m = 12;
		y -= 1;
	}
	return { y, m };
}

function hkSameMonthLastYear() {
	// Compare last month vs. the same calendar month one year prior (not current month last year)
	const { y, m } = hkLastMonth();
	return { y: y - 1, m };
}

/** Parse DB / locale strings (incl. GMT+0800, 台北標準時間, etc.) to a Date. */
function parseToDate(input) {
	if (input == null) return null;
	if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
	let s = String(input).trim();
	if (!s) return null;
	let t = Date.parse(s);
	if (!Number.isNaN(t)) return new Date(t);
	s = s.replaceAll(/\s+GMT[+-]\d{2}:?\d{2,4}(?:\s*\([^)]*\))?/gi, '').trim();
	s = s.replaceAll(/\s*\([^)]*\)\s*$/u, '').trim();
	t = Date.parse(s);
	return Number.isNaN(t) ? null : new Date(t);
}

/**
 * Snapshot ordering time for RollingLog: prefer Mongoose createdAt, else parsed LogTime (aggregation),
 * else ObjectId insertion time. Used so legacy rows without timestamps still align with HK month windows.
 */
const ROLLING_LOG_EFFECTIVE_AT_STAGE = {
	$addFields: {
		effectiveAt: {
			$ifNull: [
				'$createdAt',
				{
					$ifNull: [
						{
							$dateFromString: {
								dateString: '$RollingLogfunction.LogTime',
								onError: null,
								onNull: null
							}
						},
						{ $toDate: '$_id' }
					]
				}
			]
		}
	}
};

const ROLLING_LOG_STRIP_EFFECTIVE_AT = { $project: { effectiveAt: 0 } };

function rollingLogAggregateLastOnOrBefore(bound, strictBefore) {
	const cmp = strictBefore ? { $lt: bound } : { $lte: bound };
	return [
		ROLLING_LOG_EFFECTIVE_AT_STAGE,
		{ $match: { effectiveAt: cmp } },
		{ $sort: { effectiveAt: -1 } },
		{ $limit: 1 },
		ROLLING_LOG_STRIP_EFFECTIVE_AT
	];
}

function rollingLogAggregateOldest() {
	return [
		ROLLING_LOG_EFFECTIVE_AT_STAGE,
		{ $sort: { effectiveAt: 1 } },
		{ $limit: 1 },
		ROLLING_LOG_STRIP_EFFECTIVE_AT
	];
}

/**
 * ObjectId boundary for a Date, using the 4-byte timestamp encoded in every ObjectId.
 * 'min' → lowest ObjectId for that second; 'max' → highest.
 * This lets us do indexed _id range queries as a fast fallback when createdAt is absent.
 */
function objectIdAtTime(date, side) {
	const secs = Math.floor(date.getTime() / 1000);
	const tail = side === 'max' ? 'ffffffffffffffff' : '0000000000000000';
	return new ObjectId(secs.toString(16).padStart(8, '0') + tail);
}

/**
 * Oldest RollingLog snapshot by `effectiveAt`: createdAt ?? parsed LogTime ?? ObjectId time (see rollingLogAggregateOldest).
 * Important: Do NOT use findOne().sort({ createdAt: 1 }) with a createdAt-only filter — legacy rows often lack
 * createdAt; that query then returns the earliest *among rows that have createdAt* only (e.g. 2026), ignoring older data.
 */
async function rollingLogSnapshotOldest() {
	if (!schema.RollingLog) return null;
	try {
		const rows = await schema.RollingLog.aggregate(rollingLogAggregateOldest());
		if (rows[0]) return rows[0];
	} catch (error) {
		console.error('[Analytics] MongoDB error (RollingLog aggregate oldest):', error.name, error.reason);
	}
	// Fallback if aggregation fails: oldest insertion order (indexed _id)
	try {
		const fastById = await schema.RollingLog.findOne()
			.sort({ _id: 1 })
			.lean()
			.exec();
		if (fastById) return fastById;
	} catch (error) {
		console.error('[Analytics] MongoDB error (RollingLog find oldest _id):', error.name, error.reason);
	}
	return null;
}

/**
 * Last snapshot at/before bound. Tries createdAt index → _id range (always indexed) → aggregation fallback.
 */
async function rollingLogSnapshotLastOnOrBefore(bound, strictBefore) {
	if (!schema.RollingLog) return null;
	const cmp = strictBefore ? { $lt: bound } : { $lte: bound };
	// Fast path 1: createdAt index
	try {
		const fast = await schema.RollingLog.findOne({ createdAt: cmp })
			.sort({ createdAt: -1 })
			.lean()
			.exec();
		if (fast) return fast;
	} catch (error) {
		console.error('[Analytics] MongoDB error (RollingLog find last on/before createdAt):', error.name, error.reason);
	}
	// Fast path 2: _id range – ObjectId timestamp is second-accurate and always indexed
	try {
		const boundId = objectIdAtTime(bound, strictBefore ? 'min' : 'max');
		const cmpId = strictBefore ? { $lt: boundId } : { $lte: boundId };
		const fastById = await schema.RollingLog.findOne({ _id: cmpId })
			.sort({ _id: -1 })
			.lean()
			.exec();
		if (fastById) return fastById;
	} catch (error) {
		console.error('[Analytics] MongoDB error (RollingLog find last on/before _id):', error.name, error.reason);
	}
	// Slow path: full aggregation fallback
	try {
		const rows = await schema.RollingLog.aggregate(rollingLogAggregateLastOnOrBefore(bound, strictBefore));
		return rows[0] ?? null;
	} catch (error) {
		console.error('[Analytics] MongoDB error (RollingLog aggregate last on/before):', error.name, error.reason);
		return null;
	}
}

/**
 * @param {unknown} [preloadedFirstEver] - Shared promise or doc for the earliest RollingLog row (same for all months).
 *   When omitted, fetches via indexed query (with aggregation fallback).
 */
async function resolveRollingLogFirstEver(preloadedFirstEver) {
	if (preloadedFirstEver !== undefined) {
		return await preloadedFirstEver;
	}
	return rollingLogSnapshotOldest();
}

/**
 * Delta of cumulative *CountRoll fields between last snapshot before month start and last snapshot at/before month end.
 * RollingLog snapshots copy RealTime cumulative totals (see logs.js pushToDefiniteLog).
 * @param {string} [debugLabel] - When DEBUG env is set, logs use this label (e.g. lastMonth / lastYearSameMonth).
 * @param {Promise<object | null> | object | null} [preloadedFirstEver] - Shared oldest snapshot; avoids a third query per call when passed from stateText.
 */
async function monthlyRollDeltas(year, month, debugLabel = '', preloadedFirstEver) {
	const { start, end } = hkMonthBounds(year, month);
	const rollFields = [
		'LineCountRoll',
		'DiscordCountRoll',
		'TelegramCountRoll',
		'WhatsappCountRoll',
		'WWWCountRoll'
	];
	try {
		const [before, snapEnd, firstEver] = await Promise.all([
			rollingLogSnapshotLastOnOrBefore(start, true),
			rollingLogSnapshotLastOnOrBefore(end, false),
			resolveRollingLogFirstEver(preloadedFirstEver)
		]);
		if (debugMode) {
			const snap = (doc) => (doc
				? {
					_id: String(doc._id),
					createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
					logTime: doc.RollingLogfunction?.LogTime,
					effectiveAtGuess: (() => {
						if (doc.createdAt) return doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt);
						const lt = parseToDate(doc.RollingLogfunction?.LogTime);
						if (lt) return lt.toISOString();
						return doc._id?.getTimestamp?.()?.toISOString?.() ?? '—';
					})()
				}
				: null);
			console.log('[Analytics][DEBUG][stateText] monthlyRollDeltas', debugLabel || '(no label)', {
				year,
				month,
				rangeStart: start.toISOString(),
				rangeEnd: end.toISOString(),
				snapshotBeforeMonth: snap(before),
				snapshotEndOfMonth: snap(snapEnd),
				firstSnapshotInDb: snap(firstEver),
				hasSnapEndFunction: Boolean(snapEnd?.RollingLogfunction)
			});
		}
		if (!snapEnd?.RollingLogfunction) {
			if (debugMode) {
				console.log('[Analytics][DEBUG][stateText] monthlyRollDeltas', debugLabel || '(no label)', '→ null (no RollingLog snapshot at/before month end; missing data or no pushToDefiniteLog history)');
			}
			return null;
		}
		const out = {};
		for (const f of rollFields) {
			const ev = snapEnd.RollingLogfunction[f] ?? 0;
			if (before?.RollingLogfunction) {
				out[f] = Math.max(0, ev - (before.RollingLogfunction[f] ?? 0));
			} else {
				const bv = firstEver?.RollingLogfunction?.[f] ?? 0;
				out[f] = Math.max(0, ev - bv);
			}
		}
		if (debugMode) {
			console.log('[Analytics][DEBUG][stateText] monthlyRollDeltas', debugLabel || '(no label)', '→ deltas', out);
		}
		return out;
	} catch (error) {
		console.error('[Analytics] monthlyRollDeltas error:', error.message);
		return null;
	}
}

/** Short-lived cache so repeated `.admin state` does not hammer MongoDB. Set ADMIN_STATE_CACHE_SEC=0 to disable. */
const ADMIN_STATE_CACHE_MS = Math.max(0, Number.parseInt(process.env.ADMIN_STATE_CACHE_SEC || '300', 10) * 1000);
let stateTextCache = {};
let stateTextRefreshing = {};

async function computeStateText(locale = i18n.DEFAULT_LOCALE, options = {}) {
	await i18n.init();
	const t = i18n.createTranslator(locale);
	let state = await getState() || '';
	// No mongoURL / empty logs module: still produce a version-focused state report for .admin state.
	if (Object.keys(state).length === 0 || !state.LogTime) {
		const nowIso = new Date().toISOString();
		state = {
			LogTime: nowIso,
			StartTime: nowIso,
			LineCountRoll: 0,
			DiscordCountRoll: 0,
			TelegramCountRoll: 0,
			WhatsappCountRoll: 0,
			WWWCountRoll: 0,
		};
	}

	/** Human-readable HK time for status UI (no suffix). */
	const formatPrettyTimestamp = (input) => {
		const d = parseToDate(input);
		if (!d) return '—';
		const intlLocale = i18n.toIntlLocale(locale);
		return new Intl.DateTimeFormat(intlLocale, {
			timeZone: 'Asia/Hong_Kong',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).format(d);
	};

	const formatNumber = (num) => num.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");
	const fmtOrDash = (v) => (v == null ? '—' : formatNumber(v));
	const hkLm = hkLastMonth();
	const hkLy = hkSameMonthLastYear();

	// One shared "oldest snapshot" query for UI + both monthly delta runs (indexed find + aggregation fallback).
	const oldestRollingPromise = rollingLogSnapshotOldest();
	const countOrZero = (model, method, ...args) => (
		(model && typeof model[method] === 'function')
			? model[method](...args).catch(error => {
				console.error('[Analytics] MongoDB error:', error.name, error.reason);
				return 0;
			})
			: Promise.resolve(0)
	);

	const [levelSystemCount, characterCardCount, userCount, oldestRolling, lastMonthDelta, lastYearDelta] = await Promise.all([
		countOrZero(schema.trpgLevelSystem, 'countDocuments', { Switch: '1' }),
		countOrZero(schema.characterCard, 'estimatedDocumentCount'),
		countOrZero(schema.firstTimeMessage, 'estimatedDocumentCount'),
		oldestRollingPromise,
		monthlyRollDeltas(hkLm.y, hkLm.m, 'lastMonth', oldestRollingPromise),
		monthlyRollDeltas(hkLy.y, hkLy.m, 'lastYearSameMonth', oldestRollingPromise)
	]);

	const tripleLine = (total, field) => `${formatNumber(total)}(${fmtOrDash(lastMonthDelta?.[field])}/${fmtOrDash(lastYearDelta?.[field])})`;

	if (debugMode) {
		console.log('[Analytics][DEBUG][stateText] HK calendar', {
			now: hkCalendarNow(),
			lastMonthWindow: hkLm,
			sameMonthLastYearWindow: hkLy
		});
		console.log('[Analytics][DEBUG][stateText] RealTime *CountRoll (report 總數)', {
			LineCountRoll: state.LineCountRoll,
			DiscordCountRoll: state.DiscordCountRoll,
			TelegramCountRoll: state.TelegramCountRoll,
			WhatsappCountRoll: state.WhatsappCountRoll,
			WWWCountRoll: state.WWWCountRoll
		});
		console.log('[Analytics][DEBUG][stateText] triple display (總數 / 上月 / 上年同月)', {
			LINE: tripleLine(state.LineCountRoll, 'LineCountRoll'),
			Discord: tripleLine(state.DiscordCountRoll, 'DiscordCountRoll'),
			Telegram: tripleLine(state.TelegramCountRoll, 'TelegramCountRoll'),
			WhatsApp: tripleLine(state.WhatsappCountRoll, 'WhatsappCountRoll'),
			WWW: tripleLine(state.WWWCountRoll, 'WWWCountRoll')
		});
		console.log('[Analytics][DEBUG][stateText] If lastYearSameMonth is —: often no RollingLog rows for that calendar month (no snapshots yet or DB restored without history).');
	}

	let startTimeDisplay = '—';
	if (oldestRolling?.RollingLogfunction?.LogTime) {
		startTimeDisplay = formatPrettyTimestamp(oldestRolling.RollingLogfunction.LogTime);
	}
	if (startTimeDisplay === '—' && oldestRolling?.createdAt) {
		startTimeDisplay = formatPrettyTimestamp(oldestRolling.createdAt);
	}
	if (startTimeDisplay === '—' && state.StartTime?.trim()) {
		startTimeDisplay = formatPrettyTimestamp(state.StartTime);
	}
	const logTimeDisplay = formatPrettyTimestamp(state.LogTime);

	const divTop = '◆ ────────────────────────';
	const div = '────────────────────────';

	const lmLabel = t('admin.state_report.month_label', { yy: hkLm.y % 100, m: hkLm.m });
	const lyLabel = t('admin.state_report.month_label', { yy: hkLy.y % 100, m: hkLy.m });

	const versionBlock = await buildStateVersionSection(t, {
		...options,
		debug: debugMode,
	});

	return [
		t('admin.state_report.header'),
		divTop,
		t('admin.state_report.section_version'),
		div,
		...versionBlock,
		divTop,
		t('admin.state_report.section_time'),
		div,
		t('admin.state_report.earliest_record', { time: startTimeDisplay }),
		t('admin.state_report.current_time', { time: logTimeDisplay }),
		divTop,
		t('admin.state_report.section_roll_stats', { lastMonth: lmLabel, lastYear: lyLabel }),
		div,
		t('admin.state_report.line', { stats: tripleLine(state.LineCountRoll, 'LineCountRoll') }),
		t('admin.state_report.discord', { stats: tripleLine(state.DiscordCountRoll, 'DiscordCountRoll') }),
		t('admin.state_report.telegram', { stats: tripleLine(state.TelegramCountRoll, 'TelegramCountRoll') }),
		t('admin.state_report.whatsapp', { stats: tripleLine(state.WhatsappCountRoll, 'WhatsappCountRoll') }),
		t('admin.state_report.www', { stats: tripleLine(state.WWWCountRoll, 'WWWCountRoll') }),
		divTop,
		t('admin.state_report.section_system'),
		div,
		t('admin.state_report.level_groups', { count: formatNumber(levelSystemCount) }),
		t('admin.state_report.character_cards', { count: formatNumber(characterCardCount) }),
		t('admin.state_report.users', { count: formatNumber(userCount) }),
		divTop,
		t('admin.state_report.section_rng'),
		div,
		t('admin.state_report.rng_tools'),
		divTop
	].join('\n');
}

async function refreshStateCache(locale = i18n.DEFAULT_LOCALE, options = {}) {
	const normalized = i18n.normalizeLocale(locale);
	const versionKey = [
		options.gatewayBuildInfo?.display || '',
		options.standbyWorkerUrl || '',
		buildInfo.getDisplay(),
	].join('|');
	const cacheKey = `${normalized}::${versionKey}`;
	if (stateTextRefreshing[cacheKey]) return;
	const cache = stateTextCache[cacheKey];
	// Skip recompute if cache is still fresh (e.g. timer fires after a recent user-triggered refresh)
	if (ADMIN_STATE_CACHE_MS > 0 && cache?.text && Date.now() < cache.expiresAt) return;
	stateTextRefreshing[cacheKey] = true;
	try {
		const text = await computeStateText(normalized, options);
		if (text) {
			stateTextCache[cacheKey] = { text, expiresAt: Date.now() + ADMIN_STATE_CACHE_MS };
		}
	} catch (error) {
		console.error('[Analytics] refreshStateCache error:', error.message);
	} finally {
		stateTextRefreshing[cacheKey] = false;
	}
}

async function stateText(locale = i18n.DEFAULT_LOCALE, options = {}) {
	const normalized = i18n.normalizeLocale(locale);
	const versionKey = [
		options.gatewayBuildInfo?.display || '',
		options.standbyWorkerUrl || '',
		buildInfo.getDisplay(),
	].join('|');
	const cacheKey = `${normalized}::${versionKey}`;
	const now = Date.now();
	const cache = stateTextCache[cacheKey] || { text: '', expiresAt: 0 };

	// Cache valid → return immediately
	if (cache.text && now < cache.expiresAt) {
		return cache.text;
	}

	// Cache stale but exists → return stale immediately, refresh in background
	if (cache.text) {
		refreshStateCache(normalized, options);
		return cache.text;
	}

	// Cache empty (first call) → must wait
	await refreshStateCache(normalized, options);
	return stateTextCache[cacheKey]?.text || '';
}

// Pre-warm cache after startup to avoid first-call delay
if (ADMIN_STATE_CACHE_MS > 0) {
	setTimeout(() => refreshStateCache(i18n.DEFAULT_LOCALE).catch(() => {}), 60_000);
}

async function cmdfunction({ result, ...context }) {
	let newInputStr = result.characterReRollItem || result.text;
	let mainMsg = newInputStr.match(MESSAGE_SPLITOR);
	let tempResut = {};

	try {
		tempResut = await rolldice(new RollContext({
			...context,
			inputStr: newInputStr,
			mainMsg
		}));
	} catch (error) {
		console.error(`[Analytics] cmdfunction GET ERROR:
			Error: ${error}
			Input: ${newInputStr}
			Botname: ${context.botname}
			Time: ${new Date()}`);
	}

	(debugMode) ? console.log('[analytics]            inputStr2:', newInputStr) : '';
	const t = context.t || i18n.createTranslator(context.locale);
	if (typeof tempResut === 'object' && tempResut !== null) {
		if (result.characterName) {
			tempResut.text = t('character.reroll_perform', {
				name: result.characterName,
				rollName: result.characterReRollName,
				text: tempResut.text
			});
		}
		return tempResut;
	}
	return;
}

function z_stop(mainMsg, groupid) {
	const zStopModule = getRollModule('z_stop');
	if (!zStopModule || typeof zStopModule.initialize !== 'function') return false;

	const saveData = zStopModule.initialize();
	if (!saveData || !saveData.save) return false;

	const groupInfo = saveData.save.find(e => e.groupid == groupid);
	if (!groupInfo || !groupInfo.blockfunction) return false;

	const match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()));
	if (match) {
		if (debugMode) console.log('[analytics] Match AND STOP');
		return true;
	}
	return false;
}

module.exports.debugMode = debugMode;
module.exports.parseInput = parseInput;
module.exports.findRollList = findRollList;
module.exports.findRollModuleName = findRollModuleName;
module.exports.buildStateVersionSection = buildStateVersionSection;