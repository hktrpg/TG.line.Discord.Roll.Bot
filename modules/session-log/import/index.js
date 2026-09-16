'use strict';

const { parseDiscordMessages } = require('./discord.js');
const { parseMarkdown } = require('./markdown.js');
const { parseWhatsApp } = require('./whatsapp.js');
const { parseLine } = require('./line.js');
const { parseTelegram } = require('./telegram.js');
const { buildWorkFromEvents } = require('./build-work.js');

const SOURCES = Object.freeze([
    'discord_export',
    'manual_md',
    'manual',
    'whatsapp',
    'telegram',
    'line',
]);

/**
 * @param {string} source
 * @returns {boolean}
 */
function isValidSource(source) {
    return SOURCES.includes(source);
}

/**
 * Parse content for a given import source.
 * @param {string} source
 * @param {{ messages?: object[], content?: string|object }} payload
 * @returns {{ events: object[], playerNames: string[], sourceMeta: object, warnings: string[] }}
 */
function parseImport(source, payload = {}) {
    switch (source) {
        case 'discord_export':
            return parseDiscordMessages(payload.messages);
        case 'manual_md':
        case 'manual':
            return parseMarkdown(payload.content);
        case 'whatsapp':
            return parseWhatsApp(payload.content);
        case 'telegram':
            return parseTelegram(payload.content);
        case 'line':
            return parseLine(payload.content);
        default:
            return {
                events: [],
                playerNames: [],
                sourceMeta: {},
                warnings: [`Unknown import source: ${source}`],
            };
    }
}

/**
 * Full pipeline: parse + build work document fields.
 * @param {string} source
 * @param {{ messages?: object[], content?: string|object, metadata?: object }} options
 * @returns {{ payload: object, warnings: string[], preview: object }}
 */
function importWork(source, options = {}) {
    const parsed = parseImport(source, options);
    const metadata = options.metadata || {};
    const meta = {
        ...metadata,
        importSource: source === 'manual' ? 'manual_md' : source,
        sourceMeta: Object.assign({}, parsed.sourceMeta, metadata.sourceMeta),
        playerNames: parsed.playerNames,
    };
    const payload = buildWorkFromEvents(parsed.events, meta);
    return {
        payload,
        warnings: parsed.warnings,
        preview: {
            eventCount: parsed.events.length,
            playerNames: parsed.playerNames,
            sampleEvents: parsed.events.slice(0, 20),
            sourceMeta: parsed.sourceMeta,
        },
    };
}

module.exports = {
    SOURCES,
    isValidSource,
    parseImport,
    importWork,
    buildWorkFromEvents,
};
