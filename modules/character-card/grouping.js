"use strict";

const { SECTION, SECTION_ORDER, normalizeSectionKey } = require("./section-keys.js");

function entrySortKey(entry, fallbackIndex) {
    if (entry && typeof entry.order === "number" && !Number.isNaN(entry.order)) {
        return entry.order;
    }
    return fallbackIndex;
}

/**
 * @param {object[]} entries
 * @returns {{ key: string, items: { entry: object, index: number }[] }[]}
 */
function groupEntriesBySection(entries) {
    const list = Array.isArray(entries) ? entries : [];
    const buckets = new Map();
    for (let index = 0; index < list.length; index++) {
        const entry = list[index];
        if (!entry) {
            continue;
        }
        const key = normalizeSectionKey(entry.section);
        if (!buckets.has(key)) {
            buckets.set(key, []);
        }
        buckets.get(key).push({ entry, index, sort: entrySortKey(entry, index) });
    }
    const orderedKeys = [];
    for (const key of SECTION_ORDER) {
        if (buckets.has(key)) {
            orderedKeys.push(key);
        }
    }
    for (const key of buckets.keys()) {
        if (!orderedKeys.includes(key)) {
            orderedKeys.push(key);
        }
    }
    return orderedKeys.map(key => {
        const items = buckets.get(key) || [];
        items.sort((a, b) => a.sort - b.sort || a.index - b.index);
        return { key, items: items.map(({ entry, index }) => ({ entry, index })) };
    });
}

module.exports = {
    groupEntriesBySection,
    SECTION,
};
