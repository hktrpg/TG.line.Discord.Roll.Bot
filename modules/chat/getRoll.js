"use strict";

const parseRouter = require('../roll-worker/parse-router');

/**
 * Replace [[expression]] segments with dice results via parse router (Worker when enabled).
 * Schedule always allows local fallback so worker outages do not inject system_busy into cron text.
 */
async function rollText(text, options = {}) {
	return replaceAsync(text, /\[\[(.*?)\]\]/ig, (match, expression) =>
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

async function rollDiceExpression(match, expression, options = {}) {
	const result = await parseRouter.parseInput({
		inputStr: expression,
		botname: options.botname || 'Schedule',
		locale: options.locale || null,
		groupid: options.groupid || null,
		userid: options.userid || null,
	}, { allowLocalFallback: true });
	return (result && result.text) ? result.text : match;
}

module.exports = {
	rollText
};
