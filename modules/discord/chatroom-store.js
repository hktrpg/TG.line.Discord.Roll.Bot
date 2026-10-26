"use strict";

const { randomUUID } = require('node:crypto');

// Separate collections: the disabled legacy multiServer/translateChannel records
// are deliberately never read, migrated, or re-enabled by this feature.
function defineModels(mongoose) {
    const { Schema } = mongoose;
    const model = (name, definition, indexes = []) => {
        if (mongoose.models[name]) return mongoose.models[name];
        const schema = new Schema(definition, { versionKey: false });
        for (const [keys, options] of indexes) schema.index(keys, options);
        return mongoose.model(name, schema);
    };
    return {
        channel: model('chatroomV2Channel', {
            _id: String, guildId: String, guildName: String, channelName: String,
            revision: String, roomId: { type: String, default: null },
            peerId: { type: String, default: null }, enabled: { type: Boolean, default: false },
            inviteHash: String, inviteExpiresAt: Date, approvedBy: String,
            translationLanguage: { type: String, default: null }, updatedAt: Date
        }, [[{ inviteHash: 1 }, { unique: true, sparse: true }]]),
        user: model('chatroomV2User', {
            _id: String, optedOut: Boolean, revision: String, updatedAt: Date
        }),
        delivery: model('chatroomV2Delivery', {
            _id: String, sourceChannelId: String, sourceMessageId: String,
            targetChannelId: String, userId: String, sentMessageId: String,
            sourceEditedTimestamp: { type: Number, default: 0 },
            state: String, expiresAt: Date
        }, [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
            [{ sourceMessageId: 1, sourceChannelId: 1 }, {}]]),
        usage: model('chatroomV2Usage', {
            _id: String, characters: Number, expiresAt: Date
        }, [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]])
    };
}

function createMongoStore(models) {
    const value = async query => query.lean();
    async function ensureChannel(channel) {
        try {
            await models.channel.updateOne({ _id: channel.id }, { $setOnInsert: {
                guildId: channel.guildId, guildName: channel.guildName,
                channelName: channel.name, revision: randomUUID(),
                enabled: false, roomId: null, peerId: null, translationLanguage: null
            } }, { upsert: true });
        } catch (error) {
            if (error.code !== 11_000) throw error;
        }
        return value(models.channel.findById(channel.id));
    }
    return {
        ensureChannel,
        configuredChannelIds: async () => {
            const rows = await models.channel.find({ $or: [
                { roomId: { $ne: null } }, { translationLanguage: { $ne: null } }
            ] }).select('_id').lean();
            return rows.map(row => row._id);
        },
        getChannel: id => value(models.channel.findById(id)),
        findInvite: hash => value(models.channel.findOne({ inviteHash: hash })),
        async changeChannel(id, revision, changes, unset = {}) {
            return value(models.channel.findOneAndUpdate({ _id: id, revision }, {
                $set: { ...changes, revision: randomUUID(), updatedAt: new Date() },
                $unset: unset
            }, { returnDocument: 'after', runValidators: true }));
        },
        getUser: id => value(models.user.findById(id)),
        async setOptOut(id, optedOut) {
            await models.user.updateOne({ _id: id }, { $set: {
                optedOut, revision: randomUUID(), updatedAt: new Date()
            } }, { upsert: true });
        },
        async reserveDelivery(record) {
            try {
                await models.delivery.create({ ...record, state: 'reserved' });
                return true;
            } catch (error) {
                if (error.code === 11_000) return false;
                throw error;
            }
        },
        completeDelivery: (id, sentMessageId) => models.delivery.updateOne(
            { _id: id }, { $set: { state: 'sent', sentMessageId } }),
        deliveriesFor: (channelId, messageId, now) => value(models.delivery.find({
            sourceChannelId: channelId, sourceMessageId: messageId,
            state: 'sent', expiresAt: { $gt: new Date(now) }
        })),
        forgetDelivery: id => models.delivery.deleteOne({ _id: id }),
        async consumeQuota(guildId, characters, limit, now) {
            const day = new Date(now).toISOString().slice(0, 10);
            const id = `${guildId}:${day}`;
            try {
                await models.usage.updateOne({ _id: id }, { $setOnInsert: {
                    characters: 0, expiresAt: new Date(now + 2 * 86_400_000)
                } }, { upsert: true });
            } catch (error) {
                if (error.code !== 11_000) throw error;
            }
            const result = await models.usage.updateOne({
                _id: id, characters: { $lte: limit - characters }
            }, { $inc: { characters } });
            return result.modifiedCount === 1;
        }
    };
}

module.exports = { defineModels, createMongoStore };
