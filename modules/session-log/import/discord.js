'use strict';

const { convertDiscordMessages, collectPlayerNames } = require('../discord-import.js');

/**
 * Wrap Discord decrypted messages into the unified parser result shape.
 * @param {object[]} messages
 * @returns {{ events: object[], playerNames: string[], sourceMeta: object, warnings: string[] }}
 */
function parseDiscordMessages(messages) {
    const list = Array.isArray(messages) ? messages : [];
    const warnings = [];
    if (list.length === 0) {
        warnings.push('No Discord messages provided');
    }
    const events = convertDiscordMessages(list);
    return {
        events,
        playerNames: collectPlayerNames(events),
        sourceMeta: { platform: 'discord' },
        warnings,
    };
}

module.exports = { parseDiscordMessages };
