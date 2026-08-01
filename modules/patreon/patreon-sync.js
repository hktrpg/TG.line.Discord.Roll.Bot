'use strict';

const schema = require('../db/schema.js');

const PATREON_NOTES_PREFIX = "patreon:";

/** @param {string} keyHash - keyHash for notes identifier */
function notesForKey(keyHash) {
    return PATREON_NOTES_PREFIX + (keyHash || '');
}

function normalizePlatform(platform) {
    return String(platform || '').trim().toLowerCase();
}

/**
 * VIP filter including platform so Discord/Telegram numeric IDs do not collide.
 * @param {Object} slot
 * @param {string} notes
 */
function vipFilterForSlot(slot, notes) {
    const isChannel = slot.targetType === "channel";
    const platform = normalizePlatform(slot.platform);
    if (isChannel) {
        return { gpid: slot.targetId, notes, platform };
    }
    return { id: slot.targetId, notes, platform };
}

function activeSlotKey(slot) {
    const isChannel = slot.targetType === "channel";
    const platform = normalizePlatform(slot.platform);
    return `${isChannel ? 'g' : 'u'}:${slot.targetId}:${platform}`;
}

function vipRowKey(row) {
    const platform = normalizePlatform(row.platform);
    if (row.gpid) return `g:${row.gpid}:${platform}`;
    return `u:${row.id}:${platform}`;
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
    const platform = normalizePlatform(slot.platform);
    const filter = vipFilterForSlot(slot, notes);
    const update = isChannel
        ? { gpid: slot.targetId, level, name: slot.name || memberName, notes, switch: true, platform }
        : { id: slot.targetId, level, name: slot.name || memberName, notes, switch: true, platform };

    if (slot.switch !== false) {
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

/**
 * Disable Patreon VIP rows for this key that are no longer in the active slot set.
 * @param {string} notes
 * @param {Set<string>} activeKeys
 */
async function disableOrphanVipRows(notes, activeKeys) {
    const rows = await schema.veryImportantPerson.find({ notes, switch: { $ne: false } }).lean();
    for (const row of rows || []) {
        if (activeKeys.has(vipRowKey(row))) continue;
        const filter = row.gpid
            ? { _id: row._id }
            : { _id: row._id };
        await schema.veryImportantPerson.updateOne(filter, { $set: { switch: false } });
    }
}

/**
 * Sync all slots of a patreon member document to veryImportantPerson.
 * Also disables VIP rows for removed slots (same notes).
 * @param {Object} member - patreonMember doc with keyHash, level, name, slots
 */
async function syncMemberSlotsToVip(member) {
    if (!member || !member.keyHash) return;
    const notes = notesForKey(member.keyHash);
    const level = member.level;
    const memberName = member.name || member.patreonName;
    const activeKeys = new Set();

    for (const slot of member.slots || []) {
        if (!slot.targetId) continue;
        if (slot.switch !== false) {
            activeKeys.add(activeSlotKey(slot));
        }
        await syncSlotToVip(slot, level, member.keyHash, memberName, member);
    }

    await disableOrphanVipRows(notes, activeKeys);
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
    normalizePlatform,
    applyVipGraceAfterCancellation,
    syncSlotToVip,
    syncMemberSlotsToVip,
    clearVipEntriesByPatreonKey
};
