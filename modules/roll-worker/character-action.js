"use strict";

const i18n = require('../i18n/i18n.js');
const analytics = require('../analytics');
const { mainCharacter } = require('../../roll/z_character');

/**
 * Run WWW-style character item roll (mainCharacter + optional nested parseInput).
 * Used by Roll Worker HTTP and local WWW fallback.
 */
async function runCharacterAction({ doc, item, locale, botname = 'WWW' } = {}) {
	if (!doc || !item) {
		return { error: 'missing doc or item' };
	}

	await i18n.init();
	const t = i18n.createTranslator(locale || i18n.DEFAULT_LOCALE);
	const characterResult = await mainCharacter(doc, ['', item], `.ch ${item}`, t);

	if (!characterResult) {
		return { characterResult: null, rplyVal: null };
	}

	let rplyVal = null;
	if (characterResult.characterReRoll && characterResult.characterReRollItem) {
		rplyVal = await analytics.parseInput({
			inputStr: characterResult.characterReRollItem,
			botname,
			locale: locale || i18n.DEFAULT_LOCALE,
			discordClient: null,
			discordMessage: null,
		});
	}

	return { characterResult, rplyVal };
}

module.exports = {
	runCharacterAction,
};
