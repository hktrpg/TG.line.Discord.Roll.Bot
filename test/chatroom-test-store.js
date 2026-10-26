"use strict";

const { randomUUID } = require('node:crypto');

// Stateful test double: real service logic, CAS races and delivery reservations are
// exercised rather than mocking the feature under test.
function createStore() {
    const channels = new Map();
    const users = new Map();
    const deliveries = new Map();
    const usage = new Map();
    const copy = value => value ? structuredClone(value) : null;
    return {
        channels, users, deliveries, usage,
        async ensureChannel(channel) {
            if (!channels.has(channel.id)) channels.set(channel.id, {
                _id: channel.id, guildId: channel.guildId, guildName: channel.guildName,
                channelName: channel.name, revision: randomUUID(),
                roomId: null, peerId: null, enabled: false, translationLanguage: null
            });
            return copy(channels.get(channel.id));
        },
        async getChannel(id) { return copy(channels.get(id)); },
        async findInvite(hash) { return copy([...channels.values()].find(item => item.inviteHash === hash)); },
        async changeChannel(id, revision, changes, unset = {}) {
            const current = channels.get(id);
            if (!current || current.revision !== revision) return null;
            const updated = { ...current, ...changes, revision: randomUUID() };
            for (const key of Object.keys(unset)) delete updated[key];
            channels.set(id, updated);
            return copy(updated);
        },
        async getUser(id) { return copy(users.get(id)); },
        async setOptOut(id, optedOut) { users.set(id, { _id: id, optedOut, revision: randomUUID() }); },
        async reserveDelivery(record) {
            if (deliveries.has(record._id)) return false;
            deliveries.set(record._id, { ...record, state: 'reserved' });
            return true;
        },
        async completeDelivery(id, sentMessageId) { Object.assign(deliveries.get(id), { sentMessageId, state: 'sent' }); },
        async deliveriesFor(channelId, messageId, now) {
            return [...deliveries.values()].filter(item => item.sourceChannelId === channelId
                && item.sourceMessageId === messageId && item.state === 'sent' && +item.expiresAt > now).map(copy);
        },
        async forgetDelivery(id) { deliveries.delete(id); },
        async consumeQuota(guildId, characters, limit, now) {
            const key = `${guildId}:${new Date(now).toISOString().slice(0, 10)}`;
            const used = usage.get(key) || 0;
            if (used + characters > limit) return false;
            usage.set(key, used + characters);
            return true;
        }
    };
}

module.exports = { createStore };
