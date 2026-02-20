"use strict";

/**
 * Patreon tier limits and labels.
 * Index 0 = non-VIP, 1-7 = tier limits (A-F).
 * @see https://www.patreon.com/hktrpg
 */

const LIMIT_AT_ARR = [10, 20, 50, 200, 200, 200, 200, 200];

/** Patreon slot limits: A = 5 groups/users, B or above = 10. Index 0 = non-VIP, 1 = A, 2+ = B~F */
const PATREON_SLOTS_LIMIT = [0, 5, 10, 10, 10, 10, 10, 10];

const TIER_LETTER_TO_LEVEL = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6
};

const TIER_LABELS = {
    1: "Tier A: 調查員",
    2: "Tier B: 神秘學家",
    3: "Tier C: 教主",
    4: "Tier D: KP",
    5: "Tier E: 支援者",
    6: "Tier F: ??????"
};

function getMaxSlotsForLevel(level) {
    if (level == null || level < 0 || level >= PATREON_SLOTS_LIMIT.length) {
        return PATREON_SLOTS_LIMIT[0];
    }
    return PATREON_SLOTS_LIMIT[level];
}

function tierLetterToLevel(tierLetter) {
    const upper = String(tierLetter).toUpperCase();
    return TIER_LETTER_TO_LEVEL[upper] ?? null;
}

function getTierLabel(level) {
    return TIER_LABELS[level] ?? `Level ${level}`;
}

/**
 * Map Patreon CSV "Tier" column to level (1=調查員, 2=神秘學家, 3=教主).
 * Only 調查員 and above (調查員, 神秘學家, 教主) return 1–3; 無名調查員 and others return null.
 * @param {string} tierName - Tier name from CSV (e.g. "調查員", "神秘學家", "教主", "無名調查員")
 * @returns {number|null} Level 1–3 or null
 */
function csvTierNameToLevel(tierName) {
    if (!tierName || typeof tierName !== 'string') return null;
    const t = tierName.trim();
    if (t.includes('教主')) return 3;
    if (t.includes('神秘學家')) return 2;
    if (t.includes('調查員') && !t.includes('無名')) return 1;
    return null;
}

module.exports = {
    LIMIT_AT_ARR,
    PATREON_SLOTS_LIMIT,
    TIER_LETTER_TO_LEVEL,
    TIER_LABELS,
    getMaxSlotsForLevel,
    tierLetterToLevel,
    getTierLabel,
    csvTierNameToLevel
};
