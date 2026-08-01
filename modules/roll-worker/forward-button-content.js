'use strict';

const i18n = require('../i18n/i18n.js');

/**
 * Button labels are defined in lang/*.json. Matchers are derived from every
 * supported locale so .forward / button handlers stay in sync when copy changes.
 */
const LABEL_SPECS = [
	{ kind: 'card', key: 'discord.character.card_label', placeholder: '{{name}}' },
	{ kind: 'char', key: 'discord.character.char_label', placeholder: '{{name}}' },
	{ kind: 'request', key: 'discord.buttons.request_rolling', placeholder: '{{displayname}}' },
];

/** @type {Array<{ kind: string, prefix: string, suffix: string }>|null} */
let matchersCache = null;

function resetMatchersCache() {
	matchersCache = null;
}

function buildMatchers() {
	const matchers = [];
	const seen = new Set();

	for (const locale of i18n.SUPPORTED_LOCALES) {
		const t = i18n.createTranslator(locale);
		for (const spec of LABEL_SPECS) {
			const template = String(t(spec.key) || '');
			if (!template || template === spec.key) continue;

			const placeholderIndex = template.indexOf(spec.placeholder);
			if (placeholderIndex === -1) continue;

			const prefix = template.slice(0, placeholderIndex);
			const suffix = template.slice(placeholderIndex + spec.placeholder.length);
			if (!suffix) continue;

			const dedupeKey = `${spec.kind}\0${prefix}\0${suffix}`;
			if (seen.has(dedupeKey)) continue;
			seen.add(dedupeKey);
			matchers.push({ kind: spec.kind, prefix, suffix });
		}
	}

	// Longer suffixes first: "character card" before "character", 角色卡 before 角色
	matchers.sort((a, b) => b.suffix.length - a.suffix.length || b.prefix.length - a.prefix.length);
	return matchers;
}

function getMatchers() {
	if (!matchersCache) {
		matchersCache = buildMatchers();
	}
	return matchersCache;
}

function endsWithInsensitive(text, suffix) {
	if (!suffix) return false;
	if (text.endsWith(suffix)) return true;
	return text.toLowerCase().endsWith(suffix.toLowerCase());
}

function startsWithInsensitive(text, prefix) {
	if (!prefix) return true;
	if (text.startsWith(prefix)) return true;
	return text.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * @returns {{ kind: 'char'|'card'|'request', name: string, prefix: string, suffix: string }|null}
 */
function matchForwardButtonContent(messageContent) {
	const text = String(messageContent || '').trim();
	if (!text) return null;

	for (const matcher of getMatchers()) {
		if (!endsWithInsensitive(text, matcher.suffix)) continue;
		if (!startsWithInsensitive(text, matcher.prefix)) continue;

		const nameStart = matcher.prefix.length;
		const nameEnd = text.length - matcher.suffix.length;
		if (nameEnd < nameStart) continue;

		return {
			kind: matcher.kind,
			name: text.slice(nameStart, nameEnd).trim(),
			prefix: matcher.prefix,
			suffix: matcher.suffix,
		};
	}
	return null;
}

/**
 * Classify Discord button-message content for .forward / button handlers.
 * @returns {'char'|'card'|'request'|null}
 */
function classifyForwardButtonContent(messageContent) {
	return matchForwardButtonContent(messageContent)?.kind || null;
}

/**
 * Extract display name stored for a forwarded button.
 * @param {string} messageContent
 * @param {'char'|'card'|'request'} kind
 * @param {Function} translate
 */
function extractForwardButtonName(messageContent, kind, translate) {
	if (kind === 'request') {
		return translate('forward.request_roll_button');
	}
	const matched = matchForwardButtonContent(messageContent);
	if (matched && matched.kind === kind) {
		return matched.name;
	}
	return '';
}

module.exports = {
	LABEL_SPECS,
	classifyForwardButtonContent,
	extractForwardButtonName,
	matchForwardButtonContent,
	resetMatchersCache,
	buildMatchers,
};
