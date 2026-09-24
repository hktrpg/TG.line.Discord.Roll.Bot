"use strict";

/** Stable section keys for DDB import and www grouping (display via i18n). */
const SECTION = Object.freeze({
    GENERAL: "General",
    IDENTITY: "Identity",
    VITALS: "Vitals",
    ABILITIES: "Abilities",
    PASSIVES: "Passives",
    SAVES: "Saves",
    SKILLS: "Skills",
    COMBAT: "Combat",
    SPELLCASTING: "Spellcasting",
    SPELLS: "Spells",
    EQUIPMENT: "Equipment",
    FEATURES: "Features",
});

const SECTION_ORDER = [
    SECTION.IDENTITY,
    SECTION.VITALS,
    SECTION.ABILITIES,
    SECTION.PASSIVES,
    SECTION.SPELLCASTING,
    SECTION.SAVES,
    SECTION.SKILLS,
    SECTION.COMBAT,
    SECTION.SPELLS,
    SECTION.EQUIPMENT,
    SECTION.FEATURES,
    SECTION.GENERAL,
];

const MAX_SECTION_KEY_LENGTH = 50;
const MAX_KIND_LENGTH = 20;

const SECTION_ALIASES = Object.freeze({
    Attributes: SECTION.ABILITIES,
    Notes: SECTION.GENERAL,
});

function normalizeSectionKey(value) {
    const key = (value || "").toString().trim();
    if (!key) {
        return SECTION.GENERAL;
    }
    if (SECTION_ALIASES[key]) {
        return SECTION_ALIASES[key];
    }
    const aliasKey = Object.keys(SECTION_ALIASES).find(
        candidate => candidate.toLowerCase() === key.toLowerCase()
    );
    if (aliasKey) {
        return SECTION_ALIASES[aliasKey];
    }
    return key.slice(0, MAX_SECTION_KEY_LENGTH);
}

function tagEntry(entry, section, kind, order) {
    if (!entry || !entry.name) {
        return entry;
    }
    const next = { ...entry };
    if (section) {
        next.section = normalizeSectionKey(section);
    }
    if (kind) {
        next.kind = String(kind).slice(0, MAX_KIND_LENGTH);
    }
    if (order !== undefined && order !== null && !Number.isNaN(Number(order))) {
        next.order = Number(order);
    }
    return next;
}

function tagList(list, section, kind) {
    return (list || []).map((entry, index) => tagEntry(entry, section, kind, index));
}

module.exports = {
    SECTION,
    SECTION_ORDER,
    MAX_SECTION_KEY_LENGTH,
    MAX_KIND_LENGTH,
    normalizeSectionKey,
    tagEntry,
    tagList,
};
