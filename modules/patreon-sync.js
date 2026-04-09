"use strict";

const schema = require('./schema.js');

const PATREON_NOTES_PREFIX = "patreon:";

/** @param {string} keyHash - keyHash for notes identifier */
function notesForKey(keyHash) {
    return PATREON_NOTES_PREFIX + (keyHash || '');
}

/**
 * Patreon-linked VIP rows: set/clear endDate for grace vs active reactivation.
 * @param {Object} member - patreonMember doc (switch, vipGraceUntil)
 * @param {Object} $set - fields to $set (mutated if grace endDate is applied)
 * @returns {{ $unset?: { endDate: string } }}
 */
function endDateOpsForMember(member, $set) {
    if (!member) return {};
    if (member.switch === true) {
        return { $unset: { endDate: '' } };
    }
    const until = member.vipGraceUntil ? new Date(member.vipGraceUntil).getTime() : Number.NaN;
    if (!Number.isNaN(until) && until > Date.now()) {
        $set.endDate = new Date(until);
        return {};
    }
    return {};
}

/**
 * After CSV shows Former/Not Active: keep VIP until graceEnd (Patreon paid-through style).
 * Only touches rows that are still "on" (switch !== false).
 * @param {Object} member - patreonMember doc (keyHash)
 * @param {Date} graceEndDate
 */
async function applyVipGraceAfterCancellation(member, graceEndDate) {
    if (!member || !member.keyHash || !graceEndDate) return;
    const notes = notesForKey(member.keyHash);
    await schema.veryImportantPerson.updateMany(
        { notes, switch: { $ne: false } },
        { $set: { endDate: graceEndDate } }
    );
}

/**
 * Sync a single slot to veryImportantPerson: upsert (switch on) or remove/disable (switch off).
 * @param {Object} slot - { targetId, targetType, platform, name, switch }
 * @param {number} level - VIP level from patreon member
 * @param {string} keyHash - keyHash (for notes marker)
 * @param {string} memberName - Fallback name
 * @param {Object} [member] - full patreonMember doc for VIP endDate (grace / reactivation)
 */
async function syncSlotToVip(slot, level, keyHash, memberName, member) {
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
        const $set = { ...update };
        const extra = endDateOpsForMember(member, $set);
        const payload = { $set, $setOnInsert: { startDate: new Date() } };
        if (extra.$unset) payload.$unset = extra.$unset;
        await schema.veryImportantPerson.findOneAndUpdate(
            filter,
            payload,
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
            const $set = { ...update };
            const extra = endDateOpsForMember(member, $set);
            const payload = { $set, $setOnInsert: { startDate: new Date() } };
            if (extra.$unset) payload.$unset = extra.$unset;
            await schema.veryImportantPerson.findOneAndUpdate(
                filter,
                payload,
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
        { $set: { switch: false }, $unset: { endDate: '' } }
    );
}

module.exports = {
    notesForKey,
    applyVipGraceAfterCancellation,
    syncSlotToVip,
    syncMemberSlotsToVip,
    clearVipEntriesByPatreonKey
};
