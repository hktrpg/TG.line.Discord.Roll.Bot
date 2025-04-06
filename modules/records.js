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
            const result = await this.schema.findOneAndUpdate(query, update, {
                new: true,
                runValidators: true,
                ...options
            });
            return result;
        } catch (err) {
            console.error(`[ERROR] Database operation failed:`, err);
            throw err;
        }
    }

    async find(query = {}, options = {}) {
        try {
            const result = await this.schema.find(query, options);
            return result;
        } catch (err) {
            console.error(`[ERROR] Database find operation failed:`, err);
            throw err;
        }
    }

    async countDocuments(query = {}) {
        try {
            const count = await this.schema.countDocuments(query);
            return count;
        } catch (err) {
            console.error(`[ERROR] Count documents operation failed:`, err);
            throw err;
        }
    }

    async deleteMany(query) {
        try {
            const result = await this.schema.deleteMany(query);
            return result;
        } catch (err) {
            console.error(`[ERROR] Delete many operation failed:`, err);
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

            // Always perform database operation
            const document = await this.dbOperations[databaseName].findOneAndUpdate(query, update, options);

            // Update cache with new document
            if (document) {
                const cacheKey = `${databaseName}:${JSON.stringify(query)}`;
                cache.set(cacheKey, document);
            }

            callback(document);
        } catch (err) {
            console.error(`[ERROR] Database operation failed for ${databaseName}:`, err);
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
    async pushTrpgDatabaseFunction(databaseName, data, callback) {
        try {
            const query = { groupid: data.groupid };
            const update = { $push: { trpgDatabasefunction: data.trpgDatabasefunction[0] } };
            const options = { new: true, upsert: true };

            const result = await this.updateRecord(databaseName, query, update, options, (doc) => {
                if (doc) {
                    callback(doc);
                } else {
                    callback(null);
                }
            });
        } catch (err) {
            console.error(`[ERROR] Failed to push trpgDatabaseFunction:`, err);
            callback(null);
        }
    }

    async setTrpgDatabaseFunction(databaseName, data, callback) {
        try {
            const query = { groupid: data.groupid };
            const update = { $set: { trpgDatabasefunction: data.trpgDatabasefunction } };
            const options = { new: true, upsert: true };

            const result = await this.updateRecord(databaseName, query, update, options, (doc) => {
                if (doc) {
                    callback(doc);
                } else {
                    callback(null);
                }
            });
        } catch (err) {
            console.error(`[ERROR] Failed to set trpgDatabaseFunction:`, err);
            callback(null);
        }
    }

    async pushTrpgDatabaseAllGroup(databaseName, data, callback) {
        try {
            const query = { groupid: data.groupid };
            const update = { $push: { trpgDatabaseAllgroup: data.trpgDatabaseAllgroup[0] } };
            const options = { new: true, upsert: true };

            const result = await this.updateRecord(databaseName, query, update, options, (doc) => {
                if (doc) {
                    callback(doc);
                } else {
                    callback(null);
                }
            });
        } catch (err) {
            console.error(`[ERROR] Failed to push trpgDatabaseAllGroup:`, err);
            callback(null);
        }
    }

    async setTrpgDatabaseAllGroup(databaseName, data, callback) {
        try {
            const query = { groupid: data.groupid };
            const update = { $set: { trpgDatabaseAllgroup: data.trpgDatabaseAllgroup } };
            const options = { new: true, upsert: true };

            const result = await this.updateRecord(databaseName, query, update, options, (doc) => {
                if (doc) {
                    callback(doc);
                } else {
                    callback(null);
                }
            });
        } catch (err) {
            console.error(`[ERROR] Failed to set trpgDatabaseAllGroup:`, err);
            callback(null);
        }
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

    editsetTrpgCommandFunction(databaseName, data, callback) {
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

    // Forwarded message operations
    async findForwardedMessage(query, options = {}) {
        try {
            // Generate cache key based on both query and options
            const cacheKey = `forwardedMessage:${JSON.stringify(query)}:${JSON.stringify(options)}`;
            
            // Check cache first
            const cachedMessage = cache.get(cacheKey);
            if (cachedMessage) {
                console.log('Cache hit for:', cacheKey);
                return cachedMessage;
            }
            console.log('Cache miss for:', cacheKey);

            // If not in cache, query the database
            let dbQuery = this.dbOperations.forwardedMessage.schema.findOne(query);
            
            // Apply sort if provided
            if (options.sort) {
                dbQuery = dbQuery.sort(options.sort);
            }

            const message = await dbQuery;
            console.log('Database query result:', message);

            // Update cache if message found
            if (message) {
                cache.set(cacheKey, message);
                console.log('Cache updated for:', cacheKey);
            }

            return message;
        } catch (err) {
            console.error(`[ERROR] Failed to find forwarded message:`, err);
            return null;
        }
    }

    async createForwardedMessage(data) {
        try {
            const message = await this.dbOperations.forwardedMessage.schema.create(data);
            
            // Update cache with new message
            if (message) {
                // Cache for direct sourceMessageId lookup
                cache.set(`forwardedMessage:${JSON.stringify({ sourceMessageId: message.sourceMessageId })}`, message);
                
                // Cache for userId lookup
                cache.set(`forwardedMessage:${JSON.stringify({ userId: message.userId })}`, message);
                
                // Cache for combined lookup
                cache.set(`forwardedMessage:${JSON.stringify({ 
                    userId: message.userId,
                    sourceMessageId: message.sourceMessageId 
                })}`, message);
            }
            
            return message;
        } catch (err) {
            console.error(`[ERROR] Failed to create forwarded message:`, err);
            throw err;
        }
    }

    async deleteForwardedMessage(filter) {
        try {
            // First find the message to get the sourceMessageId
            const message = await this.dbOperations.forwardedMessage.schema.findOne(filter);
            if (!message) {
                return null;
            }

            // Delete the message
            const deletedMessage = await this.dbOperations.forwardedMessage.schema.findOneAndDelete(filter);
            
            // Clear all related caches
            if (deletedMessage) {
                // Clear the cache for direct sourceMessageId lookup
                cache.del(`forwardedMessage:${JSON.stringify({ sourceMessageId: deletedMessage.sourceMessageId })}`);
                
                // Clear the cache for userId lookup
                cache.del(`forwardedMessage:${JSON.stringify({ userId: deletedMessage.userId })}`);
                
                // Clear the cache for combined lookup
                cache.del(`forwardedMessage:${JSON.stringify({ 
                    userId: deletedMessage.userId,
                    sourceMessageId: deletedMessage.sourceMessageId 
                })}`);

                // Clear any cache with sort options
                cache.del(`forwardedMessage:${JSON.stringify({ userId: deletedMessage.userId })}:${JSON.stringify({ sort: { fixedId: -1 } })}`);
            }
            
            return deletedMessage;
        } catch (err) {
            console.error(`[ERROR] Failed to delete forwarded message:`, err);
            throw err;
        }
    }

    async findForwardedMessages(filter) {
        try {
            const messages = await this.dbOperations.forwardedMessage.schema.find(filter).sort({ fixedId: 1 });

            // Update cache for each message
            messages.forEach(message => {
                const cacheKey = `forwardedMessage:${message.sourceMessageId}`;
                cache.set(cacheKey, message);
            });

            return messages;
        } catch (err) {
            console.error(`[ERROR] Failed to find forwarded messages:`, err);
            return [];
        }
    }

    async countForwardedMessages(filter) {
        try {
            return await this.dbOperations.forwardedMessage.schema.countDocuments(filter);
        } catch (err) {
            console.error(`[ERROR] Failed to count forwarded messages:`, err);
            return 0;
        }
    }
}

let instance;

module.exports = (function () {
    if (!instance) {
        instance = new Records();
    }
    return instance;
})();