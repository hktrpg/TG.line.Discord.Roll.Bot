'use strict';

/**
 * Split events into chapter metadata for storage / import.
 * Mirrors SessionLogReader.splitIntoChapters logic (scene boundaries).
 * @param {object[]} events
 * @returns {object[]}
 */
function buildChaptersFromEvents(events) {
    const list = Array.isArray(events) ? events : [];
    if (list.length === 0) {
        return [{
            id: 'c0001',
            title: 'Opening',
            order: 0,
            startEventId: '',
            endEventId: '',
            status: 'published',
            wordCount: 0,
            views: 0,
        }];
    }

    const chapters = [];
    let current = {
        id: 'c0001',
        title: 'Opening',
        order: 0,
        events: [],
    };

    for (const event of list) {
        if (event.type === 'scene') {
            if (current.events.length > 0) {
                chapters.push(current);
                current = {
                    id: `c${String(chapters.length + 1).padStart(4, '0')}`,
                    title: event.title || `Chapter ${chapters.length + 1}`,
                    order: chapters.length,
                    events: [event],
                };
            } else {
                current.title = event.title || current.title;
                current.events.push(event);
            }
        } else {
            current.events.push(event);
        }
    }
    if (current.events.length > 0) chapters.push(current);

    return chapters.map((chapter, index) => {
        const wordCount = chapter.events.reduce((sum, event) => {
            const text = event.text || event.title || event.label || '';
            return sum + String(text).length;
        }, 0);
        const first = chapter.events[0];
        const last = chapter.events.at(-1);
        return {
            id: chapter.id || `c${String(index + 1).padStart(4, '0')}`,
            title: String(chapter.title || `Chapter ${index + 1}`).slice(0, 300),
            order: index,
            startEventId: first?.id || '',
            endEventId: last?.id || '',
            status: chapter.status || 'published',
            publishAt: chapter.publishAt,
            wordCount,
            views: chapter.views || 0,
        };
    });
}

/**
 * Filter events for non-owners based on chapter publish status.
 * @param {object[]} events
 * @param {object[]} chapters
 * @param {boolean} isOwner
 * @returns {object[]}
 */
function filterEventsByChapterAccess(events, chapters, isOwner) {
    if (isOwner || !Array.isArray(events)) return events || [];
    if (!Array.isArray(chapters) || chapters.length === 0) return events;

    const unpublished = chapters.filter((chapter) => chapter.status && chapter.status !== 'published');
    if (unpublished.length === 0) return events;

    const hiddenIds = new Set();
    for (const chapter of unpublished) {
        let inRange = false;
        for (const event of events) {
            if (event.id === chapter.startEventId) inRange = true;
            if (inRange) hiddenIds.add(event.id);
            if (event.id === chapter.endEventId) inRange = false;
        }
    }
    return events.filter((event) => !hiddenIds.has(event.id));
}

/**
 * @param {object[]} events
 * @returns {string}
 */
function hashEventsContent(events) {
    const crypto = require('node:crypto');
    const payload = JSON.stringify((events || []).map((event) => ({
        type: event.type,
        name: event.name,
        text: event.text,
        title: event.title,
    })));
    return crypto.createHash('sha256').update(payload).digest('hex');
}

module.exports = {
    buildChaptersFromEvents,
    filterEventsByChapterAccess,
    hashEventsContent,
};
