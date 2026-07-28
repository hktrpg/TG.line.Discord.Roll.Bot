"use strict";

/**
 * Shared fixed-serial helpers for list-style roll features.
 * startFrom: 0 for .ra/.cmd/.drgm, 1 for .db/.dbp/.myname
 */

function hasSerial(item) {
    return item && typeof item.serial === 'number' && Number.isFinite(item.serial);
}

/**
 * Next free serial, filling gaps. Empty list returns startFrom.
 * @param {number[]} serials
 * @param {number} startFrom
 * @returns {number}
 */
function findNextSerial(serials, startFrom = 1) {
    const base = Number(startFrom) || 0;
    if (!serials || serials.length === 0) return base;

    const sorted = [...serials]
        .filter(n => typeof n === 'number' && Number.isFinite(n))
        .sort((a, b) => a - b);

    if (sorted.length === 0) return base;

    // Find first gap starting from base
    let expected = base;
    for (const value of sorted) {
        if (value < base) continue;
        if (value === expected) {
            expected += 1;
            continue;
        }
        if (value > expected) return expected;
    }
    return expected;
}

/**
 * Ensure every item has a serial.
 * - If none have serial: assign by index (+ startFrom offset for 1-based).
 * - If some missing: only fill missing via findNextSerial (never renumber existing).
 * @param {object[]} items
 * @param {number} startFrom
 * @returns {{ items: object[], changed: boolean }}
 */
function ensureSerials(items, startFrom = 1) {
    if (!Array.isArray(items) || items.length === 0) {
        return { items: items || [], changed: false };
    }

    const base = Number(startFrom) || 0;
    const anyHave = items.some(hasSerial);
    const anyMissing = items.some(item => !hasSerial(item));

    if (!anyMissing) {
        return { items, changed: false };
    }

    let changed = false;

    if (!anyHave) {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            if (!item || typeof item !== 'object') continue;
            item.serial = base === 0 ? index : index + base;
            changed = true;
        }
        return { items, changed };
    }

    const existing = items.filter(hasSerial).map(item => item.serial);
    for (const item of items) {
        if (!item || typeof item !== 'object' || hasSerial(item)) continue;
        const next = findNextSerial(existing, base);
        item.serial = next;
        existing.push(next);
        changed = true;
    }
    return { items, changed };
}

/**
 * @param {object[]} items
 * @param {number} serial
 * @returns {object|undefined}
 */
function findBySerial(items, serial) {
    const n = Number(serial);
    if (!Array.isArray(items) || !Number.isFinite(n)) return;
    return items.find(item => hasSerial(item) && item.serial === n);
}

/**
 * @param {object[]} items
 * @param {number} serial
 * @returns {number} index or -1
 */
function findIndexBySerial(items, serial) {
    const n = Number(serial);
    if (!Array.isArray(items) || !Number.isFinite(n)) return -1;
    return items.findIndex(item => hasSerial(item) && item.serial === n);
}

/**
 * Sort items by serial ascending (in place). Missing serials go last.
 * @param {object[]} items
 * @returns {object[]}
 */
function sortBySerial(items) {
    if (!Array.isArray(items)) return items || [];
    return items.sort((a, b) => {
        const sa = hasSerial(a) ? a.serial : Number.POSITIVE_INFINITY;
        const sb = hasSerial(b) ? b.serial : Number.POSITIVE_INFINITY;
        return sa - sb;
    });
}

module.exports = {
    findNextSerial,
    ensureSerials,
    findBySerial,
    findIndexBySerial,
    sortBySerial,
    hasSerial
};
