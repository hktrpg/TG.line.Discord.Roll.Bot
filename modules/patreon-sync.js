"use strict";

const schema = require('./schema.js');

const PATREON_NOTES_PREFIX = "patreon:";

/** @param {string} keyHash - keyHash for notes identifier */
function notesForKey(keyHash) {
    return PATREON_NOTES_PREFIX + (keyHash || '');
}

/**
 * Sync a single slot to veryImportantPerson: upsert (switch on) or remove/disable (switch off).
 * @param {Object} slot - { targetId, targetType, platform, name, switch }
 * @param {number} level - VIP level from patreon member
 * @param {string} keyHash - keyHash (for notes marker)
 * @param {string} memberName - Fallback name
 */
async function syncSlotToVip(slot, level, keyHash, memberName) {
    if (!slot || !slot.targetId) return;
    const notes = notesForKey(keyHash);
    const isChannel = slot.targetType === "channel";
    const filter = isChannel
        ? { gpid: slot.targetId, notes }
        : { id: slot.targetId, notes };
    const update = isChannel
        ? { gpid: slot.targetId, level, name: slot.name || memberName, notes, switch: true }
        : { id: slot.targetId, level, name: slot.name || memberName, notes, switch: true };

    if (slot.switch) {
        await schema.veryImportantPerson.findOneAndUpdate(
            filter,
            { $set: update, $setOnInsert: { startDate: new Date() } },
            { upsert: true }
        );
    } else {
        const filterOff = isChannel ? { gpid: slot.targetId, notes } : { id: slot.targetId, notes };
        await schema.veryImportantPerson.updateMany(filterOff, { $set: { switch: false } });
    }
}

/**
 * Sync all slots of a patreon member document to veryImportantPerson.
 * @param {Object} member - patreonMember doc with keyHash, level, name, slots
 */
async function syncMemberSlotsToVip(member) {
    if (!member || !member.keyHash) return;
    const notes = notesForKey(member.keyHash);
    const level = member.level;
    const memberName = member.name || member.patreonName;

    for (const slot of member.slots || []) {
        if (!slot.targetId) continue;
        const isChannel = slot.targetType === "channel";
        const filter = isChannel
            ? { gpid: slot.targetId, notes }
            : { id: slot.targetId, notes };
        if (slot.switch) {
            const update = isChannel
                ? { gpid: slot.targetId, level, name: slot.name || memberName, notes, switch: true }
                : { id: slot.targetId, level, name: slot.name || memberName, notes, switch: true };
            await schema.veryImportantPerson.findOneAndUpdate(
                filter,
                { $set: update, $setOnInsert: { startDate: new Date() } },
                { upsert: true }
            );
        } else {
            await schema.veryImportantPerson.updateMany(filter, { $set: { switch: false } });
        }
    }
}

/**
 * Clear all veryImportantPerson rows that were created from this patreon member (e.g. on .root offpatreon).
 * @param {Object} member - patreonMember doc (use keyHash)
 */
async function clearVipEntriesByPatreonKey(member) {
    if (!member || !member.keyHash) return;
    const notes = notesForKey(member.keyHash);
    await schema.veryImportantPerson.updateMany(
        { notes },
        { $set: { switch: false } }
    );
}

module.exports = {
    notesForKey,
    syncSlotToVip,
    syncMemberSlotsToVip,
    clearVipEntriesByPatreonKey
};
