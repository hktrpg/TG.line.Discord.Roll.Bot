/* eslint-disable no-unused-vars */
"use strict";
const {
    EventEmitter
} = require("events");
require('events').EventEmitter.defaultMaxListeners = Infinity;
const schema = require('./schema.js');
const NodeCache = require('node-cache');
const { validate } = require('jsonschema');

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Validation schemas
const validationSchemas = {
    groupUpdate: {
        type: "object",
        required: ["groupid"],
        properties: {
            groupid: { type: "string" },
            blockfunction: { type: "array" },
            randomAnsfunction: { type: "array" },
            trpgDatabasefunction: { type: "array" },
            GroupSettingfunction: { type: "array" },
            trpgCommandfunction: { type: "array" },
            trpgDarkRollingfunction: { type: "array" },
            trpgLevelSystemfunction: { type: "array" }
        }
    }
};

class DatabaseOperation {
    constructor(schema) {
        this.schema = schema;
    }

    async findOneAndUpdate(query, update, options = {}) {
        try {
            return await this.schema.findOneAndUpdate(query, update, {
                new: true,
                runValidators: true,
                ...options
            });
        } catch (err) {
            console.error(`Database operation failed: ${err.message}`);
            throw err;
        }
    }

    async find(query = {}, options = {}) {
        try {
            return await this.schema.find(query, options);
        } catch (err) {
            console.error(`Database find operation failed: ${err.message}`);
            throw err;
        }
    }

    async countDocuments(query = {}) {
        try {
            return await this.schema.countDocuments(query);
        } catch (err) {
            console.error(`Count documents operation failed: ${err.message}`);
            throw err;
        }
    }

    async deleteMany(query) {
        try {
            return await this.schema.deleteMany(query);
        } catch (err) {
            console.error(`Delete many operation failed: ${err.message}`);
            throw err;
        }
    }
}

class Records extends EventEmitter {
    constructor() {
        super();
        this.maxChatMessages = 100;
        this.ChatRoomModel = schema.chatRoom;
        this.dbOperations = {};
        
        // Initialize database operations for each schema
        Object.keys(schema).forEach(key => {
            this.dbOperations[key] = new DatabaseOperation(schema[key]);
        });
    }

    async updateRecord(databaseName, query, update, options, callback) {
        try {
            // Validate input data if schema exists
            if (validationSchemas[databaseName]) {
                const validationResult = validate(query, validationSchemas[databaseName]);
                if (!validationResult.valid) {
                    throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
                }
            }

            // Check cache for existing record
            const cacheKey = `${databaseName}:${JSON.stringify(query)}`;
            const cachedResult = cache.get(cacheKey);
            if (cachedResult) {
                callback(cachedResult);
                return;
            }

            const document = await this.dbOperations[databaseName].findOneAndUpdate(query, update, options);
            
            // Update cache
            if (document) {
                cache.set(cacheKey, document);
            }

            callback(document);
        } catch (err) {
            console.error("Database operation failed:", err);
            callback(null);
        }
    }

    // Group block function operations
    setBlockFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { blockfunction: data.blockfunction } }, { upsert: true }, callback);
    }

    pushBlockFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { blockfunction: data.blockfunction } }, { new: true, upsert: true }, callback);
    }

    // Random answer operations
    pushRandomAnswerFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { randomAnsfunction: data.randomAnsfunction } }, { new: true, upsert: true }, callback);
    }

    setRandomAnswerFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { randomAnsfunction: data.randomAnsfunction } }, { upsert: true }, callback);
    }

    pushRandomAnswerAllGroup(databaseName, data, callback) {
        this.updateRecord(databaseName, {}, { $push: { randomAnsAllgroup: data.randomAnsAllgroup } }, { new: true, upsert: true }, callback);
    }

    setRandomAnswerAllGroup(databaseName, data, callback) {
        this.updateRecord(databaseName, {}, { $set: { randomAnsAllgroup: data.randomAnsAllgroup } }, { upsert: true }, callback);
    }

    // Generic get operation
    async get(target, callback) {
        try {
            if (schema[target]) {
                const documents = await schema[target].find({});
                callback(documents);
            }
        } catch (err) {
            console.error(`Failed to get documents from ${target}:`, err);
            callback([]);
        }
    }

    // TRPG database operations
    pushTrpgDatabaseFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { trpgDatabasefunction: data.trpgDatabasefunction } }, { new: true, upsert: true }, callback);
    }

    setTrpgDatabaseFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { trpgDatabasefunction: data.trpgDatabasefunction } }, { upsert: true }, callback);
    }

    pushTrpgDatabaseAllGroup(databaseName, data, callback) {
        this.updateRecord(databaseName, {}, { $push: { trpgDatabaseAllgroup: data.trpgDatabaseAllgroup } }, { new: true, upsert: true }, callback);
    }

    setTrpgDatabaseAllGroup(databaseName, data, callback) {
        this.updateRecord(databaseName, {}, { $set: { trpgDatabaseAllgroup: data.trpgDatabaseAllgroup } }, { upsert: true }, callback);
    }

    // Group settings operations
    pushGroupSettingFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { GroupSettingfunction: data.GroupSettingfunction } }, { new: true, upsert: true }, callback);
    }

    setGroupSettingFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { GroupSettingfunction: data.GroupSettingfunction } }, { upsert: true }, callback);
    }

    // TRPG command operations
    pushTrpgCommandFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { trpgCommandfunction: data.trpgCommandfunction } }, { new: true, upsert: true }, callback);
    }

    setTrpgCommandFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { trpgCommandfunction: data.trpgCommandfunction } }, { upsert: true }, callback);
    }

    editSetTrpgCommandFunction(databaseName, data, callback) {
        const topicRegex = new RegExp(`^${data.trpgCommandfunction[0]?.topic}$`, 'i');
        this.updateRecord(databaseName, { groupid: data.groupid, "trpgCommandfunction.topic": topicRegex }, { $set: { "trpgCommandfunction.$.contact": data.trpgCommandfunction[0].contact } }, { new: true, upsert: false }, callback);
    }

    // TRPG dark rolling operations
    pushTrpgDarkRollingFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { trpgDarkRollingfunction: data.trpgDarkRollingfunction } }, { new: true, upsert: true }, callback);
    }

    setTrpgDarkRollingFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { trpgDarkRollingfunction: data.trpgDarkRollingfunction } }, { upsert: true }, callback);
    }

    // TRPG level system operations
    pushTrpgLevelSystemFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { trpgLevelSystemfunction: data.trpgLevelSystemfunction } }, { new: true, upsert: true }, callback);
    }

    setTrpgLevelSystemFunctionLevelUpWord(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { LevelUpWord: data.LevelUpWord } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    setTrpgLevelSystemFunctionRankWord(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { RankWord: data.RankWord } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    setTrpgLevelSystemFunctionConfig(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { Switch: data.Switch, Hidden: data.Hidden } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    setTrpgLevelSystemFunctionNewUser(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $push: { trpgLevelSystemfunction: data.trpgLevelSystemfunction } }, { upsert: true }, callback);
    }

    setTrpgLevelSystemFunctionTitleWord(databaseName, data, callback) {
        this.updateRecord(databaseName, { groupid: data.groupid }, { $set: { Title: data.Title } }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    setTrpgLevelSystemFunctionExpUp(databaseName, groupData, levelData, callback) {
        this.updateRecord(databaseName, { groupid: groupData.groupid }, { $set: { trpgLevelSystemfunction: levelData } }, {}, callback);
    }

    maxTrpgLevelSystemFunctionExpUp(databaseName, userId, exp, level, groupData, levelData, callback) {
        this.updateRecord(databaseName, { groupid: groupData.groupid, 'trpgLevelSystemfunction.userid': userId }, { $max: { 'trpgLevelSystemfunction.$.EXP': exp, 'trpgLevelSystemfunction.$.Level': level } }, {}, callback);
    }

    // Logging operations
    setTrpgSaveLogFunctionRealTime(databaseName, data, callback) {
        this.updateRecord(databaseName, {}, {
            $setOnInsert: { "RealTimeRollingLogfunction.StartTime": data.StartTime },
            $set: { "RealTimeRollingLogfunction.LogTime": data.LogTime, "RealTimeRollingLogfunction.LastTimeLog": data.LastTimeLog },
            $max: {
                "RealTimeRollingLogfunction.DiscordCountRoll": data.DiscordCountRoll,
                "RealTimeRollingLogfunction.DiscordCountText": data.DiscordCountText,
                "RealTimeRollingLogfunction.LineCountRoll": data.LineCountRoll,
                "RealTimeRollingLogfunction.LineCountText": data.LineCountText,
                "RealTimeRollingLogfunction.TelegramCountRoll": data.TelegramCountRoll,
                "RealTimeRollingLogfunction.TelegramCountText": data.TelegramCountText,
                "RealTimeRollingLogfunction.WhatsappCountRoll": data.WhatsappCountRoll,
                "RealTimeRollingLogfunction.WhatsappCountText": data.WhatsappCountText,
                "RealTimeRollingLogfunction.WWWCountRoll": data.WWWCountRoll,
                "RealTimeRollingLogfunction.WWWCountText": data.WWWCountText
            }
        }, { upsert: true, setDefaultsOnInsert: true }, callback);
    }

    maxTrpgSaveLogFunction(databaseName, data, callback) {
        this.updateRecord(databaseName, { "RollingLogfunction.LogTime": { '$gte': data.start, '$lte': data.end } }, {
            $set: { "RollingLogfunction.LogTime": data.LogTime },
            $max: {
                "RollingLogfunction.DiscordCountRoll": data.DiscordCountRoll,
                "RollingLogfunction.DiscordCountText": data.DiscordCountText,
                "RollingLogfunction.LineCountRoll": data.LineCountRoll,
                "RollingLogfunction.LineCountText": data.LineCountText,
                "RollingLogfunction.TelegramCountRoll": data.TelegramCountRoll,
                "RollingLogfunction.TelegramCountText": data.TelegramCountText,
                "RollingLogfunction.WhatsappCountRoll": data.WhatsappCountRoll,
                "RollingLogfunction.WhatsappCountText": data.WhatsappCountText,
                "RollingLogfunction.WWWCountRoll": data.WWWCountRoll,
                "RollingLogfunction.WWWCountText": data.WWWCountText
            }
        }, { upsert: true }, callback);
    }

    // Chat room operations
    async chatRoomPush(message) {
        try {
            // Validate message
            if (!message || !message.roomNumber) {
                throw new Error('Invalid message format');
            }

            const chatMessage = new this.ChatRoomModel(message);
            await chatMessage.save();
            this.emit("new_message", message);

            // Clear cache for this room
            cache.del(`chatRoom:${message.roomNumber}`);

            const messageCount = await this.ChatRoomModel.countDocuments({ 'roomNumber': message.roomNumber });
            if (messageCount < this.maxChatMessages) return;

            const overflowCount = messageCount - this.maxChatMessages;
            const oldestMessages = await this.ChatRoomModel.find({ 'roomNumber': message.roomNumber })
                .sort({ 'time': 1 });

            if (!oldestMessages[overflowCount - 1]) return;

            await this.ChatRoomModel.deleteMany({
                'roomNumber': message.roomNumber,
                time: { $lt: oldestMessages[overflowCount - 1].time }
            });
        } catch (err) {
            console.error('Chat room push failed:', err);
            throw err;
        }
    }

    async chatRoomGet(roomNumber, callback) {
        try {
            // Check cache first
            const cacheKey = `chatRoom:${roomNumber}`;
            const cachedMessages = cache.get(cacheKey);
            if (cachedMessages) {
                callback(cachedMessages);
                return;
            }

            const messages = await this.ChatRoomModel.find({ roomNumber });
            
            // Update cache
            cache.set(cacheKey, messages);
            
            callback(messages);
        } catch (err) {
            console.error('Chat room get failed:', err);
            callback([]);
        }
    }

    chatRoomSetMax(max) {
        this.maxChatMessages = max;
    }

    chatRoomGetMax() {
        return this.maxChatMessages;
    }
}

let instance;

module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }
    return instance;
})();