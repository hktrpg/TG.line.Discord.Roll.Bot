/* eslint-disable no-unused-vars */
"use strict";
const {
    EventEmitter
} = require("events");
require('events').EventEmitter.defaultMaxListeners = Infinity;
const schema = require('./schema.js');
const security = require('./security-utils.js');
let instance;
let MAX = 100;
const Message = schema.chatRoom;

// User request tracker for rate limiting
const userRequests = new Map();

class Records extends EventEmitter {
    constructor() {
        super();
    }

    async updateRecord(dbbase, query, update, options, callback) {
        try {
            const doc = await schema[dbbase].findOneAndUpdate(query, update, options);
            callback(doc);
        } catch (err) {
            console.error("Something wrong when updating data!", err);
        }
    }

    set(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { blockfunction: msg.blockfunction } }, { upsert: true }, callback);
    }

    pushblockfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { blockfunction: msg.blockfunction } }, { new: true, upsert: true }, callback);
    }

    pushrandomAnsfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { randomAnsfunction: msg.randomAnsfunction } }, { new: true, upsert: true }, callback);
    }

    setrandomAnsfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { randomAnsfunction: msg.randomAnsfunction } }, { upsert: true }, callback);
    }

    pushrandomAnsAllgroup(dbbase, msg, callback) {
        this.updateRecord(dbbase, {}, { $push: { randomAnsAllgroup: msg.randomAnsAllgroup } }, { new: true, upsert: true }, callback);
    }

    setrandomAnsAllgroup(dbbase, msg, callback) {
        this.updateRecord(dbbase, {}, { $set: { randomAnsAllgroup: msg.randomAnsAllgroup } }, { upsert: true }, callback);
    }

    get(target, callback) {
        if (schema[target]) {
            schema[target].find({}, (err, msgs) => {
                callback(msgs);
            });
        }
    }

    pushtrpgDatabasefunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { trpgDatabasefunction: msg.trpgDatabasefunction } }, { new: true, upsert: true }, callback);
    }

    settrpgDatabasefunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { trpgDatabasefunction: msg.trpgDatabasefunction } }, { upsert: true }, callback);
    }

    pushtrpgDatabaseAllgroup(dbbase, msg, callback) {
        this.updateRecord(dbbase, {}, { $push: { trpgDatabaseAllgroup: msg.trpgDatabaseAllgroup } }, { new: true, upsert: true }, callback);
    }

    settrpgDatabaseAllgroup(dbbase, msg, callback) {
        this.updateRecord(dbbase, {}, { $set: { trpgDatabaseAllgroup: msg.trpgDatabaseAllgroup } }, { upsert: true }, callback);
    }

    pushGroupSettingfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { GroupSettingfunction: msg.GroupSettingfunction } }, { new: true, upsert: true }, callback);
    }

    setGroupSettingfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { GroupSettingfunction: msg.GroupSettingfunction } }, { upsert: true }, callback);
    }

    pushtrpgCommandfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { trpgCommandfunction: msg.trpgCommandfunction } }, { new: true, upsert: true }, callback);
    }

    settrpgCommandfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { trpgCommandfunction: msg.trpgCommandfunction } }, { upsert: true }, callback);
    }

    editSettrpgCommandfunction(dbbase, msg, callback) {
        const topicRegex = new RegExp(`^${msg.trpgCommandfunction[0]?.topic}$`, 'i');
        this.updateRecord(dbbase, { groupid: msg.groupid, "trpgCommandfunction.topic": topicRegex }, { $set: { "trpgCommandfunction.$.contact": msg.trpgCommandfunction[0].contact } }, { new: true, upsert: false }, callback);
    }

    pushtrpgDarkRollingfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { trpgDarkRollingfunction: msg.trpgDarkRollingfunction } }, { new: true, upsert: true }, callback);
    }

    settrpgDarkRollingfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { trpgDarkRollingfunction: msg.trpgDarkRollingfunction } }, { upsert: true }, callback);
    }

    pushtrpgLevelSystemfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { trpgLevelSystemfunction: msg.trpgLevelSystemfunction } }, { new: true, upsert: true }, callback);
    }

    settrpgLevelSystemfunctionLevelUpWord(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { LevelUpWord: msg.LevelUpWord } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    settrpgLevelSystemfunctionRankWord(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { RankWord: msg.RankWord } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    settrpgLevelSystemfunctionConfig(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { Switch: msg.Switch, Hidden: msg.Hidden } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    settrpgLevelSystemfunctionNewUser(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $push: { trpgLevelSystemfunction: msg.trpgLevelSystemfunction } }, { upsert: true }, callback);
    }

    settrpgLevelSystemfunctionTitleWord(dbbase, msg, callback) {
        this.updateRecord(dbbase, { groupid: msg.groupid }, { $set: { Title: msg.Title } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    settrpgLevelSystemfunctionEXPup(dbbase, msgA, msg, callback) {
        this.updateRecord(dbbase, { groupid: msgA.groupid }, { $set: { trpgLevelSystemfunction: msg } }, {}, callback);
    }

    maxtrpgLevelSystemfunctionEXPup(dbbase, userid, exp, lv, msgA, msg, callback) {
        this.updateRecord(dbbase, { groupid: msgA.groupid, 'trpgLevelSystemfunction.userid': userid }, { $max: { 'trpgLevelSystemfunction.$.EXP': exp, 'trpgLevelSystemfunction.$.Level': lv } }, {}, callback);
    }

    settrpgSaveLogfunctionRealTime(dbbase, msg, callback) {
        this.updateRecord(dbbase, {}, {
            $setOnInsert: { "RealTimeRollingLogfunction.StartTime": msg.StartTime },
            $set: { "RealTimeRollingLogfunction.LogTime": msg.LogTime, "RealTimeRollingLogfunction.LastTimeLog": msg.LastTimeLog },
            $max: {
                "RealTimeRollingLogfunction.DiscordCountRoll": msg.DiscordCountRoll,
                "RealTimeRollingLogfunction.DiscordCountText": msg.DiscordCountText,
                "RealTimeRollingLogfunction.LineCountRoll": msg.LineCountRoll,
                "RealTimeRollingLogfunction.LineCountText": msg.LineCountText,
                "RealTimeRollingLogfunction.TelegramCountRoll": msg.TelegramCountRoll,
                "RealTimeRollingLogfunction.TelegramCountText": msg.TelegramCountText,
                "RealTimeRollingLogfunction.WhatsappCountRoll": msg.WhatsappCountRoll,
                "RealTimeRollingLogfunction.WhatsappCountText": msg.WhatsappCountText,
                "RealTimeRollingLogfunction.WWWCountRoll": msg.WWWCountRoll,
                "RealTimeRollingLogfunction.WWWCountText": msg.WWWCountText
            }
        }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    maxTrpgSaveLogfunction(dbbase, msg, callback) {
        this.updateRecord(dbbase, { "RollingLogfunction.LogTime": { '$gte': msg.start, '$lte': msg.end } }, {
            $set: { "RollingLogfunction.LogTime": msg.LogTime },
            $max: {
                "RollingLogfunction.DiscordCountRoll": msg.DiscordCountRoll,
                "RollingLogfunction.DiscordCountText": msg.DiscordCountText,
                "RollingLogfunction.LineCountRoll": msg.LineCountRoll,
                "RollingLogfunction.LineCountText": msg.LineCountText,
                "RollingLogfunction.TelegramCountRoll": msg.TelegramCountRoll,
                "RollingLogfunction.TelegramCountText": msg.TelegramCountText,
                "RollingLogfunction.WhatsappCountRoll": msg.WhatsappCountRoll,
                "RollingLogfunction.WhatsappCountText": msg.WhatsappCountText,
                "RollingLogfunction.WWWCountRoll": msg.WWWCountRoll,
                "RollingLogfunction.WWWCountText": msg.WWWCountText
            }
        }, { upsert: true }, callback);
    }

    async chatRoomPush(msg, ip = null) {
        try {
            // Apply rate limiting if IP is provided
            if (ip && !security.checkRateLimit(ip, 5, 5000)) {
                const error = new Error('Too many requests');
                error.statusCode = 429;
                throw error;
            }

            // Validate and sanitize message
            const sanitizedMsg = security.validateChatMessage(msg);
            
            // Create and save the new message
            const m = new Message(sanitizedMsg);
            await m.save();
            
            // Notify subscribers but send the sanitized message
            this.emit("new_message", sanitizedMsg);

            // Get count of messages in this room with sanitized room number
            const count = await Message.countDocuments({
                'roomNumber': sanitizedMsg.roomNumber
            });

            // If under MAX, no cleanup needed
            if (count <= MAX) return;
            
            // Find the cutoff timestamp and delete older messages in a single operation
            const overdraft = count - MAX;
            const cutoffMessages = await Message.find({
                'roomNumber': sanitizedMsg.roomNumber
            }).sort({
                'time': 1
            }).limit(overdraft);
            
            if (cutoffMessages.length > 0) {
                const cutoffTime = cutoffMessages[cutoffMessages.length - 1].time;
                await Message.deleteMany({
                    'roomNumber': sanitizedMsg.roomNumber,
                    'time': { $lte: cutoffTime }
                });
            }
        } catch (error) {
            console.error("Error in chatRoomPush:", error.message);
            throw error; // Rethrow for proper handling upstream
        }
    }

    async chatRoomGetAsync(roomNumber, limit = MAX, skip = 0) {
        try {
            // Sanitize room number input
            const sanitizedRoomNumber = security.sanitizeMongoDbInput(roomNumber);
            
            // Validate and constrain limit and skip parameters
            const validatedLimit = Math.min(Math.max(1, parseInt(limit) || MAX), MAX);
            const validatedSkip = Math.max(0, parseInt(skip) || 0);
            
            return await Message.find({
                roomNumber: sanitizedRoomNumber
            }).sort({
                'time': -1
            }).skip(validatedSkip).limit(validatedLimit);
        } catch (error) {
            console.error("Error in chatRoomGetAsync:", error.message);
            return [];
        }
    }

    // Legacy method for backward compatibility
    chatRoomGet(roomNumber, callback) {
        if (typeof callback === 'function') {
            // Sanitize inputs for backward compatibility
            const sanitizedRoomNumber = security.sanitizeMongoDbInput(roomNumber);
            
            // Support original callback pattern with secure query
            Message.find({
                roomNumber: sanitizedRoomNumber
            }).sort({'time': -1}).exec((err, msgs) => {
                callback(msgs || []);
            });
        } else {
            // Return a promise when no callback provided
            return this.chatRoomGetAsync(roomNumber);
        }
    }

    chatRoomSetMax(max) {
        // Make sure max is a reasonable number
        const parsedMax = parseInt(max);
        if (!isNaN(parsedMax) && parsedMax > 0 && parsedMax <= 1000) {
            MAX = parsedMax;
        }
    }

    chatRoomGetMax() {
        return MAX;
    }

    // Add method to sanitize messages for display
    sanitizeMessagesForDisplay(messages) {
        if (!Array.isArray(messages)) return [];
        
        return messages.map(msg => {
            return {
                name: security.sanitizeContent(msg.name || ''),
                msg: security.sanitizeContent(msg.msg || ''),
                time: msg.time,
                roomNumber: msg.roomNumber
            };
        });
    }
}

module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }

    return instance;
})();