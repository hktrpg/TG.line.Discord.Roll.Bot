'use strict';

const { randomUUID } = require('node:crypto');

const DAY = 86_400_000;
const HK_OFFSET = 8 * 3_600_000;
const leaseId = 'active-job';
const databaseOptions = { timeoutMS: 4000 };
let indexReady;

async function getCollection() {
    const connection = require('../db/connector').mongoose?.connection;
    if (connection?.readyState !== 1) throw new Error('Video quota storage is unavailable');
    const collection = connection.db.collection('socialVideoQuotas', { readPreference: 'primary' });
    indexReady ||= collection.createIndex({ expiresAt: 1 }, { ...databaseOptions, expireAfterSeconds: 0 })
        .catch(error => {
            indexReady = undefined;
            throw error;
        });
    await indexReady;
    return collection;
}

async function acquireVideoLease() {
    const collection = await getCollection();
    const token = randomUUID();
    const now = new Date();
    try {
        await collection.updateOne(
            { _id: leaseId, expiresAt: { $lte: now } },
            { $set: { token, expiresAt: new Date(Number(now) + 240_000) } },
            { ...databaseOptions, upsert: true },
        );
    } catch (error) {
        if (error.code === 11_000) return null;
        throw error;
    }
    return {
        collection,
        release: () => collection.deleteOne({ _id: leaseId, token }, databaseOptions),
    };
}

// Each accepted job holds the shared lease from reservation through refund or delivery.
// Charge before downloading so a crash or an ambiguous upload cannot give out extra copies.
async function reserveVideoQuota(lease, { platform, scope, id, userId }, time = Date.now()) {
    const day = Math.floor((time + HK_OFFSET) / DAY);
    const quotaId = `${platform}:${scope}:${id}:${day}`;
    const { collection } = lease;
    const row = await collection.findOne({ _id: quotaId }, databaseOptions);
    const actor = row?.members?.[userId];
    const group = scope === 'group';
    const limit = group ? 60 : 20;
    const cooldown = group ? 15_000 : 30_000;
    if (time - (row?.last || 0) < cooldown || (group && time - (actor?.last || 0) < 30_000)) {
        return { reason: 'cooldown' };
    }
    if (row?.used >= limit || row?.attempts >= 2 * limit || actor?.used >= 10 || actor?.attempts >= 20) {
        return { reason: 'quota' };
    }
    const expiresAt = new Date((day + 2) * DAY - HK_OFFSET);
    const inc = { used: 1, attempts: 1 };
    const set = { last: time, expiresAt };
    const refund = { used: -1 };
    if (group) {
        inc[`members.${userId}.used`] = 1;
        inc[`members.${userId}.attempts`] = 1;
        set[`members.${userId}.last`] = time;
        refund[`members.${userId}.used`] = -1;
    }
    await collection.updateOne({ _id: quotaId }, { $inc: inc, $set: set }, { ...databaseOptions, upsert: true });
    return { refund: () => collection.updateOne({ _id: quotaId }, { $inc: refund }, databaseOptions) };
}

module.exports = { acquireVideoLease, reserveVideoQuota };
