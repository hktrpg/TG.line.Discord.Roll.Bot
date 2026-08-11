"use strict";

const parseRouter = require('../roll-worker/parse-router');

/** Long [[.ai]] prompts often exceed the default Worker HTTP timeout during schedule runs. */
const SCHEDULE_AI_TIMEOUT_MS = Number.parseInt(
	process.env.SCHEDULE_AI_TIMEOUT_MS || String(5 * 60 * 1000),
	10
);

/**
 * Replace [[expression]] segments with dice results via parse router (Worker when enabled).
 * Schedule always allows local fallback so worker outages do not inject system_busy into cron text.
 * Uses [\s\S] so multi-line [[.ai ...]] prompts are matched (`.` alone stops at newlines).
 */
async function rollText(text, options = {}) {
	return replaceAsync(text, /\[\[([\s\S]*?)\]\]/gi, (match, expression) =>
		rollDiceExpression(match, expression, options)
	);
}

async function replaceAsync(str, regex, asyncFn) {
	const promises = [];
	str.replace(regex, (match, ...args) => {
		promises.push(asyncFn(match, ...args));
	});
	const data = await Promise.all(promises);
	return str.replace(regex, () => data.shift());
}

function isBotCommandExpression(expression) {
	return /^\.\S+/i.test(String(expression || '').trim());
}

function isAiCommandExpression(expression) {
	// .ai / .aim / .aih / .ait / .aimage / …
	return /^\.ai/i.test(String(expression || '').trim());
}

async function systemBusyText(locale) {
	try {
		const i18n = require('../i18n/i18n.js');
		await i18n.init();
		return i18n.createTranslator(locale || i18n.DEFAULT_LOCALE)('common.errors.system_busy');
	} catch {
		return '';
	}
}

async function rollDiceExpression(match, expression, options = {}) {
	const parseOptions = { allowLocalFallback: true };
	// Long scheduled AI prompts need more than ROLL_WORKER_TIMEOUT_MS (often 120s).
	if (isAiCommandExpression(expression)
		&& Number.isFinite(SCHEDULE_AI_TIMEOUT_MS)
		&& SCHEDULE_AI_TIMEOUT_MS > 0) {
		parseOptions.timeoutMs = SCHEDULE_AI_TIMEOUT_MS;
	}

	let result;
	try {
		result = await parseRouter.parseInput({
			inputStr: expression,
			botname: options.botname || 'Schedule',
			locale: options.locale || null,
			groupid: options.groupid || null,
			userid: options.userid || null,
			channelid: options.channelid || null,
			// Schedule [[dice]] substitution must never award channel XP.
			skipExp: true,
		}, parseOptions);
	} catch (error) {
		console.error('[getRoll] rollDiceExpression failed:', error?.message || error);
		result = null;
	}

	if (result && result.text) return result.text;

	// Never echo raw [[.ai long prompt]] (or other .commands) when parse timed out / returned empty.
	if (isBotCommandExpression(expression)) {
		return systemBusyText(options.locale);
	}
	return match;
}

module.exports = {
	rollText
};
