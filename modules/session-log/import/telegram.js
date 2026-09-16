'use strict';

const { collectPlayerNames } = require('./build-work.js');

/**
 * Flatten Telegram text field (string or array of entities).
 * @param {unknown} text
 * @returns {string}
 */
function flattenText(text) {
    if (typeof text === 'string') return text;
    if (Array.isArray(text)) {
        return text.map((part) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && typeof part.text === 'string') return part.text;
            return '';
        }).join('');
    }
    return '';
}

/**
 * Parse Telegram Desktop JSON export.
 * @param {string|object} content
 * @returns {{ events: object[], playerNames: string[], sourceMeta: object, warnings: string[] }}
 */
function parseTelegram(content) {
    const warnings = [];
    let data = content;
    if (typeof content === 'string') {
        try {
            data = JSON.parse(content);
        } catch {
            return {
                events: [],
                playerNames: [],
                sourceMeta: { platform: 'telegram' },
                warnings: ['Invalid Telegram JSON'],
            };
        }
    }

    const messages = Array.isArray(data?.messages) ? data.messages : [];
    const chatName = data?.name || data?.chat?.name || '';
    const events = [];
    let skipped = 0;
    let index = 0;

    const nextId = () => {
        index += 1;
        return `e${String(index).padStart(4, '0')}`;
    };

    for (const msg of messages) {
        if (!msg || msg.type !== 'message') {
            skipped += 1;
            continue;
        }
        const name = String(msg.from || msg.actor || 'unknown').trim().slice(0, 100);
        const timestamp = msg.date_unixtime
            ? Number(msg.date_unixtime) * 1000
            : (msg.date ? Date.parse(msg.date) : undefined);
        const text = flattenText(msg.text).trim();

        if (msg.photo || msg.file || msg.media_type === 'voice_message') {
            const caption = text || msg.file || msg.photo || 'media';
            events.push({
                id: nextId(),
                type: 'reference',
                name,
                text: String(caption).slice(0, 500),
                url: '',
                caption: String(caption).slice(0, 500),
                mime: msg.mime_type || msg.media_type || 'media',
                timestamp: Number.isFinite(timestamp) ? timestamp : undefined,
            });
            continue;
        }

        if (!text) {
            skipped += 1;
            continue;
        }

        events.push({
            id: nextId(),
            type: 'say',
            name,
            text: text.slice(0, 8000),
            timestamp: Number.isFinite(timestamp) ? timestamp : undefined,
        });
    }

    if (skipped > 0) {
        warnings.push(`Skipped ${skipped} non-message or empty item(s)`);
    }
    if (events.length === 0) {
        warnings.push('No messages parsed from Telegram export');
    }

    return {
        events,
        playerNames: collectPlayerNames(events),
        sourceMeta: {
            platform: 'telegram',
            chatName: chatName || undefined,
        },
        warnings,
    };
}

module.exports = { parseTelegram, flattenText };
