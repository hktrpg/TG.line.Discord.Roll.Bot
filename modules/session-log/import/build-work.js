'use strict';

/**
 * Build a sessionLog document payload from parsed events + metadata.
 */

const { buildChaptersFromEvents, hashEventsContent } = require('../chapters.js');

function collectPlayerNames(events) {
    const names = new Set();
    for (const event of events || []) {
        if (event.type === 'say' && event.name) {
            names.add(event.name);
        }
    }
    return [...names];
}

function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    const seen = new Set();
    const result = [];
    for (const tag of tags) {
        const value = String(tag || '').trim().slice(0, 40);
        if (!value || seen.has(value)) continue;
        seen.add(value);
        result.push(value);
        if (result.length >= 10) break;
    }
    return result;
}

function normalizeWarnings(warnings) {
    if (!Array.isArray(warnings)) return [];
    return warnings
        .map((item) => String(item || '').trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 20);
}

function normalizeCoverUrl(url) {
    const value = String(url || '').trim().slice(0, 2000);
    if (!value) return '';
    if (value.startsWith('/session-log-assets/')) return value;
    if (/^https:\/\//i.test(value)) return value;
    return '';
}

const STATUSES = new Set(['draft', 'scheduled', 'published', 'archived']);
const RATINGS = new Set(['general', 'teen', 'r15', 'r18']);
const LICENSES = new Set(['all_rights_reserved', 'cc_by', 'cc_by_nc', 'cc_by_nc_nd', 'cc0']);
const ORIGINALITIES = new Set(['original', 'fanwork', 'translation']);

/**
 * @param {object[]} events
 * @param {object} [meta]
 * @returns {object}
 */
function buildWorkFromEvents(events, meta = {}) {
    const list = Array.isArray(events) ? events : [];
    const firstWithTs = list.find((item) => item.timestamp);
    const ts = firstWithTs?.timestamp || Date.now();
    const sessionDate = meta.sessionDate
        || new Date(ts).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    const importSource = meta.importSource || meta.source || 'manual';
    const visibility = ['private', 'unlisted', 'public'].includes(meta.visibility)
        ? meta.visibility
        : 'private';
    const status = STATUSES.has(meta.status) ? meta.status : 'draft';
    const rating = RATINGS.has(meta.rating) ? meta.rating : 'general';
    const license = LICENSES.has(meta.license) ? meta.license : 'all_rights_reserved';
    const originality = ORIGINALITIES.has(meta.originality) ? meta.originality : 'original';

    const chapters = Array.isArray(meta.chapters) && meta.chapters.length > 0
        ? meta.chapters
        : buildChaptersFromEvents(list);

    return {
        title: String(meta.title || meta.channelName || '未命名作品').slice(0, 200),
        subtitle: String(meta.subtitle || '').slice(0, 200),
        synopsis: String(meta.synopsis || '').slice(0, 2000),
        coverUrl: normalizeCoverUrl(meta.coverUrl),
        coverAssetId: meta.coverAssetId ? String(meta.coverAssetId).slice(0, 100) : undefined,
        tags: normalizeTags(meta.tags),
        genre: String(meta.genre || '').slice(0, 40),
        sessionDate: String(sessionDate).slice(0, 120),
        location: String(meta.location || '').slice(0, 200),
        importSource,
        sourceMeta: meta.sourceMeta || undefined,
        visibility,
        status,
        publishAt: meta.publishAt ? new Date(meta.publishAt) : undefined,
        rating,
        contentWarnings: normalizeWarnings(meta.contentWarnings),
        license,
        originality,
        sourceAttribution: String(meta.sourceAttribution || '').slice(0, 500),
        chapters,
        stats: { views: 0, reads: 0 },
        moderation: { state: 'ok' },
        contentHash: hashEventsContent(list),
        seriesId: meta.seriesId ? String(meta.seriesId).slice(0, 40) : undefined,
        seriesOrder: Number(meta.seriesOrder) || 0,
        theme: String(meta.theme || 'kakuyomu').slice(0, 40),
        settings: {
            hideOOC: Boolean(meta.settings?.hideOOC),
            hideDice: Boolean(meta.settings?.hideDice),
        },
        events: list,
        mods: [],
        messageCount: list.length,
        playerNames: meta.playerNames || collectPlayerNames(list),
    };
}

module.exports = {
    buildWorkFromEvents,
    collectPlayerNames,
    normalizeTags,
    normalizeCoverUrl,
    normalizeWarnings,
    STATUSES,
    RATINGS,
    LICENSES,
    ORIGINALITIES,
};
