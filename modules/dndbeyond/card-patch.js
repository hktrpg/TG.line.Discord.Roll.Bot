"use strict";

function mergeListByName(target, source) {
    const merged = [...(target || [])];
    for (const sourceElement of source || []) {
        if (!sourceElement?.name) {
            continue;
        }
        const key = sourceElement.name.toLowerCase();
        const existing = merged.find(
            element => element?.name && element.name.toLowerCase() === key
        );
        if (existing) {
            Object.assign(existing, sourceElement);
        } else {
            merged.push({ ...sourceElement });
        }
    }
    return merged;
}

function filterDdbRollEntries(rolls) {
    return (rolls || []).filter(entry => !/^ddb:/i.test(entry?.name || ""));
}

function filterDdbNoteEntries(notes) {
    return (notes || []).filter(entry => !/^ddb:/i.test(entry?.name || ""));
}

function copyImportList(list) {
    return (list || [])
        .filter(item => item?.name)
        .map(item => ({ ...item }));
}

/**
 * @param {object} card
 * @param {{ states: object[], rolls: object[], notes: object[], image?: string }} patch
 * @param {boolean} replaceMode — when true, replace entire card data (state/roll/notes/image)
 */
function applyImportPatch(card, patch, replaceMode) {
    const next = { ...card };
    if (replaceMode) {
        next.state = copyImportList(patch.states);
        next.roll = copyImportList(patch.rolls);
        next.notes = copyImportList(patch.notes);
        next.image = patch.image || "";
        return next;
    }
    next.state = mergeListByName(next.state, patch.states);
    next.roll = mergeListByName(next.roll, patch.rolls);
    next.notes = mergeListByName(next.notes, patch.notes);
    if (patch.image) {
        next.image = patch.image;
    }
    return next;
}

module.exports = {
    mergeListByName,
    filterDdbRollEntries,
    filterDdbNoteEntries,
    applyImportPatch,
};
