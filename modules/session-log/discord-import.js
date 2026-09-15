'use strict';

const crypto = require('node:crypto');

const DICE_PATTERNS = [
    /\d+d\d+/i,
    /→|->/,
    /(極限|困難|成功|失敗|大成功|大失敗|fumble|critical)/i,
    /(檢定|检定|roll|cc\s*\d|sc\s*\d)/i,
    /\[hktrpg\]/i,
];

const OOC_PATTERNS = [
    /^\(?\s*ooc\s*[):：]/i,
    /^\/\//,
    /^（\s*ooc/i,
];

const SCENE_PATTERNS = [
    /^[◆★■●]\s*/,
    /^【[^】]+】/,
    /^\*[^*]+\*$/,
];

const KP_NAME_PATTERNS = /^(kp|gm|dm|守秘人|主持人)$/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeDice(text) {
    if (!text) return false;
    return DICE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeOoc(text) {
    if (!text) return false;
    return OOC_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeScene(text) {
    if (!text) return false;
    const trimmed = text.trim();
    return SCENE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isKeeperName(name) {
    return KP_NAME_PATTERNS.test(String(name || '').trim());
}

/**
 * @param {object} attachment
 * @returns {{ url: string, caption: string, mime: string }|null}
 */
function normalizeAttachment(attachment) {
    if (!attachment || typeof attachment !== 'object') return null;
    const url = attachment.url || attachment.proxyURL || attachment.proxy_url || '';
    const caption = attachment.name || attachment.filename || '';
    if (!url && !caption) return null;
    return {
        url,
        caption,
        mime: attachment.content_type || attachment.contentType || '',
    };
}

/**
 * @param {object} embed
 * @returns {{ url: string, caption: string, mime: string }|null}
 */
function normalizeEmbed(embed) {
    if (!embed || typeof embed !== 'object') return null;
    const title = embed.title || '';
    const description = embed.description || '';
    const caption = [title, description].filter(Boolean).join(' — ');
    const url = embed.url || embed.image?.url || embed.thumbnail?.url || '';
    if (!caption && !url) return null;
    return { url, caption, mime: 'embed' };
}

/**
 * Parse dice roll fields from bot message text.
 * @param {string} text
 * @param {string} name
 * @returns {{ label: string, expr: string, result: string, verdict: string }}
 */
function parseDiceFields(text) {
    const line = String(text || '').replaceAll('\n', ' ').trim();
    const arrowMatch = line.match(/(.+?)\s*(?:→|->)\s*(.+)$/);
    const verdict = arrowMatch ? arrowMatch[2].trim() : '';
    const left = arrowMatch ? arrowMatch[1].trim() : line;
    const exprMatch = left.match(/(\d+d\d+[^\s]*|cc\s*\d+|sc\s*[\d/]+)/i);
    return {
        label: left.slice(0, 80),
        expr: exprMatch ? exprMatch[1] : '',
        result: verdict.split(/\s+/)[0] || '',
        verdict,
    };
}

/**
 * @param {object} message
 * @param {number} index
 * @returns {object}
 */
function messageToEvent(message, index) {
    const id = `e${String(index + 1).padStart(4, '0')}`;
    const contact = String(message.contact || message.c || '').trim();
    const userName = String(message.userName || message.u || 'unknown').trim();
    const isbot = Boolean(message.isbot ?? message.b);
    const timestamp = message.timestamp ?? message.t ?? null;
    const attachments = message.attachments || message.a || [];
    const embeds = message.embeds || message.e || [];

    const refs = [];
    for (const item of attachments) {
        const normalized = normalizeAttachment(item);
        if (normalized) refs.push(normalized);
    }
    for (const item of embeds) {
        const normalized = normalizeEmbed(item);
        if (normalized) refs.push(normalized);
    }

    if (refs.length > 0) {
        const primary = refs[0];
        return {
            id,
            type: 'reference',
            name: userName,
            text: contact,
            url: primary.url,
            caption: primary.caption || contact,
            mime: primary.mime,
            timestamp,
        };
    }

    if (!contact) {
        return { id, type: 'system', name: '系統', text: '', timestamp };
    }

    if (looksLikeScene(contact)) {
        const title = contact.replaceAll(/^[◆★■●\s【]+/g, '').replaceAll(/[】*]+$/g, '').trim();
        return { id, type: 'scene', title, timestamp };
    }

    if (looksLikeOoc(contact)) {
        const text = contact.replace(OOC_PATTERNS[0], '').replace(/^（\s*ooc\s*[：:]/i, '').trim();
        return { id, type: 'ooc', name: userName, text, timestamp };
    }

    if (isbot && looksLikeDice(contact)) {
        const dice = parseDiceFields(contact);
        return {
            id,
            type: 'dice',
            name: userName,
            label: dice.label,
            expr: dice.expr,
            result: dice.result,
            verdict: dice.verdict,
            timestamp,
        };
    }

    if (isbot && !looksLikeDice(contact)) {
        return { id, type: 'narration', name: userName || 'KP', text: contact, timestamp };
    }

    if (isKeeperName(userName)) {
        return { id, type: 'narration', name: userName, text: contact, timestamp };
    }

    return { id, type: 'say', name: userName, text: contact, timestamp };
}

/**
 * @param {object[]} messages
 * @returns {object[]}
 */
function convertDiscordMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages
        .map((message, index) => messageToEvent(message, index))
        .filter((event) => event.type !== 'system' || event.text);
}

/**
 * @param {object[]} events
 * @returns {string[]}
 */
function collectPlayerNames(events) {
    const names = new Set();
    for (const event of events) {
        if (event.type === 'say' && event.name) {
            names.add(event.name);
        }
    }
    return [...names];
}

/**
 * @param {object[]} messages
 * @param {object} [meta]
 * @returns {object}
 */
function buildSessionLogFromMessages(messages, meta = {}) {
    const events = convertDiscordMessages(messages);
    const firstTs = messages.find((item) => item.timestamp || item.t);
    const ts = firstTs ? (firstTs.timestamp ?? firstTs.t) : Date.now();
    const sessionDate = meta.sessionDate || new Date(ts).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    return {
        title: meta.title || meta.channelName || '未命名團錄',
        subtitle: meta.subtitle || '',
        sessionDate,
        location: meta.location || '',
        importSource: 'discord_export',
        visibility: meta.visibility || 'private',
        theme: meta.theme || 'kakuyomu',
        settings: {
            hideOOC: false,
            hideDice: false,
        },
        events,
        mods: [],
        messageCount: messages.length,
        playerNames: collectPlayerNames(events),
    };
}

/**
 * Apply non-destructive mods for reader output.
 * @param {object[]} events
 * @param {object[]} mods
 * @returns {object[]}
 */
function applyMods(events, mods) {
    if (!Array.isArray(events)) return [];
    if (!Array.isArray(mods) || mods.length === 0) return [...events];

    const hidden = new Set();
    const patches = new Map();

    for (const mod of mods) {
        if (!mod || !mod.eventId) continue;
        if (mod.op === 'hide') hidden.add(mod.eventId);
        if (mod.op === 'unhide') hidden.delete(mod.eventId);
        if (mod.op === 'edit' && mod.patch && typeof mod.patch === 'object') {
            patches.set(mod.eventId, mod.patch);
        }
    }

    return events
        .filter((event) => !hidden.has(event.id))
        .map((event) => {
            const patch = patches.get(event.id);
            return patch ? { ...event, ...patch } : event;
        });
}

/**
 * @returns {string}
 */
function generateShareToken() {
    return crypto.randomBytes(12).toString('base64url');
}

module.exports = {
    convertDiscordMessages,
    buildSessionLogFromMessages,
    applyMods,
    generateShareToken,
    looksLikeDice,
    messageToEvent,
};
