"use strict";

const crypto = require("node:crypto");
const { groupEntriesBySection } = require("./grouping.js");
const { SECTION } = require("./section-keys.js");

function newSectionId() {
    return crypto.randomUUID();
}

function copyEntry(entry) {
    if (!entry?.name) {
        return null;
    }
    const next = {
        name: entry.name,
        itemA: entry.itemA,
    };
    if (entry.itemB !== undefined && entry.itemB !== null && entry.itemB !== "") {
        next.itemB = entry.itemB;
    }
    if (entry.section) {
        next.section = entry.section;
    }
    if (entry.kind) {
        next.kind = entry.kind;
    }
    if (typeof entry.order === "number") {
        next.order = entry.order;
    }
    return next;
}

/**
 * Build v2 sections tree from flat buckets (grouped by entry.section).
 * @param {{ state?: object[], roll?: object[], notes?: object[] }} card
 */
function synthesizeSectionsFromFlat(card) {
    const bucketDefs = [
        { bucket: "state", list: card.state || [] },
        { bucket: "roll", list: card.roll || [] },
        { bucket: "notes", list: card.notes || [] },
    ];
    const sections = [];
    for (const { bucket, list } of bucketDefs) {
        const groups = groupEntriesBySection(list);
        for (const group of groups) {
            const items = group.items
                .map(({ entry }) => copyEntry(entry))
                .filter(Boolean);
            if (items.length === 0) {
                continue;
            }
            sections.push({
                id: newSectionId(),
                title: group.key === SECTION.GENERAL ? bucket : group.key,
                bucket,
                items,
            });
        }
    }
    return sections;
}

/**
 * Flatten v2 sections into legacy arrays (bot / .ch).
 * @param {{ sections?: object[], state?: object[], roll?: object[], notes?: object[] }} card
 */
function projectToLegacyArrays(card) {
    if (!card.sections || card.sections.length === 0) {
        return {
            state: [...(card.state || [])],
            roll: [...(card.roll || [])],
            notes: [...(card.notes || [])],
        };
    }
    const state = [];
    const roll = [];
    const notes = [];
    for (const section of card.sections) {
        const bucket = section.bucket || "state";
        const target = bucket === "roll" ? roll : bucket === "notes" ? notes : state;
        for (const item of section.items || []) {
            const copied = copyEntry(item);
            if (copied) {
                target.push(copied);
            }
            for (const child of item.children || []) {
                const childCopy = copyEntry(child);
                if (childCopy) {
                    target.push(childCopy);
                }
            }
        }
    }
    return { state, roll, notes };
}

/**
 * @param {object} card
 * @param {{ forceV2?: boolean, existingSchemaVersion?: number }} [options]
 */
function prepareCardForMongoSave(card, options = {}) {
    const { forceV2 = false, existingSchemaVersion = 1 } = options;
    const next = { ...card };
    const version = next.schemaVersion ?? existingSchemaVersion ?? 1;
    const useV2 = forceV2 || version >= 2;

    if (useV2 && next.sections?.length > 0 && (!next.state?.length && !next.roll?.length)) {
        const projected = projectToLegacyArrays(next);
        next.state = projected.state;
        next.roll = projected.roll;
        next.notes = projected.notes;
    }

    if (useV2) {
        next.schemaVersion = 2;
        next.sections = synthesizeSectionsFromFlat(next);
    } else {
        next.schemaVersion = next.schemaVersion || 1;
    }
    return next;
}

function cardFieldsForMongoSet(card) {
    const prepared = card.schemaVersion >= 2 ? card : prepareCardForMongoSave(card);
    const set = {
        state: prepared.state || [],
        roll: prepared.roll || [],
        notes: prepared.notes || [],
        schemaVersion: prepared.schemaVersion || 1,
    };
    if (prepared.schemaVersion >= 2) {
        set.sections = prepared.sections || [];
    }
    return set;
}

module.exports = {
    synthesizeSectionsFromFlat,
    projectToLegacyArrays,
    prepareCardForMongoSave,
    cardFieldsForMongoSet,
};
