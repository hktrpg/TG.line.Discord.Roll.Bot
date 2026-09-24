"use strict";

const { SECTION, tagEntry, tagList } = require("../character-card/section-keys.js");

const IDENTITY_STATE = new Set(["Name", "Race", "Class"]);
const VITALS_STATE = new Set(["HP", "AC", "Speed", "Initiative", "Darkvision"]);
const ABILITY_STATE = new Set(["STR", "DEX", "CON", "INT", "WIS", "CHA", "PB"]);
const PASSIVE_STATE = new Set([
    "Passive Perception",
    "Passive Investigation",
    "Passive Insight",
]);
const SPELLCASTING_STATE = new Set(["Spell DC", "Spell Slots"]);

function sectionForState(entry) {
    const name = entry?.name || "";
    if (IDENTITY_STATE.has(name)) {
        return SECTION.IDENTITY;
    }
    if (VITALS_STATE.has(name)) {
        return SECTION.VITALS;
    }
    if (ABILITY_STATE.has(name)) {
        return SECTION.ABILITIES;
    }
    if (PASSIVE_STATE.has(name)) {
        return SECTION.PASSIVES;
    }
    if (SPELLCASTING_STATE.has(name)) {
        return SECTION.SPELLCASTING;
    }
    return SECTION.GENERAL;
}

function kindForState(entry) {
    const name = entry?.name || "";
    if (name === "HP") {
        return "resource";
    }
    if (ABILITY_STATE.has(name)) {
        return "ability";
    }
    return "stat";
}

function tagStateEntries(states) {
    return (states || []).map((entry, index) =>
        tagEntry(entry, sectionForState(entry), kindForState(entry), index)
    );
}

function tagRollEntries(rolls, skillLabels) {
    const skills = skillLabels instanceof Set ? skillLabels : new Set(skillLabels || []);
    return (rolls || []).map((entry, index) => {
        const name = entry?.name || "";
        if (name.startsWith("Save ")) {
            return tagEntry(entry, SECTION.SAVES, "roll", index);
        }
        if (skills.has(name)) {
            return tagEntry(entry, SECTION.SKILLS, "roll", index);
        }
        if (name === "Initiative") {
            return tagEntry(entry, SECTION.VITALS, "roll", index);
        }
        return tagEntry(entry, SECTION.COMBAT, "roll", index);
    });
}

function buildTaggedNotes({ spellNotes, featureNotes, profNote, equipNote, skippedNote }) {
    const notes = [
        ...tagList(spellNotes, SECTION.SPELLS, "note"),
        ...tagList(featureNotes, SECTION.FEATURES, "note"),
        ...(profNote ? tagList([profNote], SECTION.IDENTITY, "text") : []),
        ...(equipNote ? tagList([equipNote], SECTION.EQUIPMENT, "text") : []),
        ...(skippedNote ? tagList([skippedNote], SECTION.GENERAL, "text") : []),
    ];
    return notes;
}

function applyDdbSectionTags(patch, skillLabels) {
    return {
        ...patch,
        states: tagStateEntries(patch.states),
        rolls: tagRollEntries(patch.rolls, skillLabels),
    };
}

module.exports = {
    applyDdbSectionTags,
    tagStateEntries,
    tagRollEntries,
    buildTaggedNotes,
    SECTION,
};
