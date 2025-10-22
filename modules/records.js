/* eslint-disable no-unused-vars */
"use strict";
const {
    EventEmitter
} = require("events");
require('events').EventEmitter.defaultMaxListeners = Infinity;
const NodeCache = require('node-cache');
const { validate } = require('jsonschema');
const schema = require('./schema.js');

// 🔒 Try to load security utilities
let security;
try {
    security = require('../utils/security.js');
} catch {
    console.warn('⚠️ Security utilities not found, using basic validation');
}

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

// 🔒 Input Validation Helper
const InputValidator = {
    sanitizeString(input, maxLength = 100) {
        if (typeof input !== 'string') {
            return '';
        }
        return input.trim().slice(0, maxLength);
    },
    
    sanitizeGroupId(groupId) {
        if (typeof groupId !== 'string') {
            throw new TypeError('Invalid groupId type - expected string');
        }
        const sanitized = groupId.trim();
        if (!sanitized || sanitized.length > 100) {
            throw new TypeError('Invalid groupId length');
        }
        return sanitized;
    },
    
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            throw new TypeError('Invalid object type');
        }
        // Prevent prototype pollution
        if (obj.__proto__ || obj.constructor || obj.prototype) {
            throw new TypeError('Suspicious object detected');
        }
        return obj;
    },
    
    validateChatMessage(message) {
        // 使用 security.js 的验证，如果可用
        if (security && security.validateChatMessage) {
            return security.validateChatMessage(message);
        }
        
        // Fallback 基本验证
        if (!message || typeof message !== 'object') {
            return { valid: false, error: 'Invalid message format' };
        }
        
        const name = String(message.name || '').trim();
        const msg = String(message.msg || '').trim();
        const roomNumber = String(message.roomNumber || '').trim();
        
        if (!name || name.length > 50) {
            return { valid: false, error: 'Invalid name' };
        }
        
        if (!msg || msg.length > 2000) {
            return { valid: false, error: 'Invalid message' };
        }
        
        if (!roomNumber || roomNumber.length > 50) {
            return { valid: false, error: 'Invalid room number' };
        }
        
        // 检查可疑模式
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(msg)) {
                return { valid: false, error: 'Suspicious content detected' };
            }
        }
        
        return {
            valid: true,
            data: {
                name: name.slice(0, 50),
                msg: msg.slice(0, 2000),
                roomNumber: roomNumber.slice(0, 50)
            }
        };
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
        } catch (error) {
            console.error(`[ERROR] Database operation failed:`, error);
            throw error;
        }
    }

    async find(query = {}, options = {}) {
        try {
            const result = await this.schema.find(query, options);
            return result;
        } catch (error) {
            console.error(`[ERROR] Database find operation failed:`, error);
            throw error;
        }
    }

    async countDocuments(query = {}) {
        try {
            const count = await this.schema.countDocuments(query);
            return count;
        } catch (error) {
            console.error(`[ERROR] Count documents operation failed:`, error);
            throw error;
        }
    }

    async deleteMany(query) {
        try {
            const result = await this.schema.deleteMany(query);
            return result;
        } catch (error) {
            console.error(`[ERROR] Delete many operation failed:`, error);
            throw error;
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
        for (const key of Object.keys(schema)) {
            this.dbOperations[key] = new DatabaseOperation(schema[key]);
        }
    }

    async updateRecord(databaseName, query, update, options, callback) {
        try {
            // 🔒 Sanitize groupId if present in query
            if (query && query.groupid) {
                try {
                    query.groupid = InputValidator.sanitizeGroupId(query.groupid);
                } catch (error) {
                    console.error(`[SECURITY] Invalid groupId:`, error.message);
                    callback(null);
                    return;
                }
            }
            
            // 🔒 Validate query object
            try {
                if (query && typeof query === 'object') {
                    InputValidator.sanitizeObject(query);
                }
            } catch (error) {
                console.error(`[SECURITY] Suspicious query object:`, error.message);
                callback(null);
                return;
            }
            
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
        } catch (error) {
            console.error(`[ERROR] Database operation failed for ${databaseName}:`, error);
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
        } catch (error) {
            console.error(`Failed to get documents from ${target}:`, error);
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
        } catch (error) {
            console.error(`[ERROR] Failed to push trpgDatabaseFunction:`, error);
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
        } catch (error) {
            console.error(`[ERROR] Failed to set trpgDatabaseFunction:`, error);
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
        } catch (error) {
            console.error(`[ERROR] Failed to push trpgDatabaseAllGroup:`, error);
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
        } catch (error) {
            console.error(`[ERROR] Failed to set trpgDatabaseAllGroup:`, error);
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
            // 🔒 使用增强的输入验证
            const validation = InputValidator.validateChatMessage(message);
            if (!validation.valid) {
                console.error(`[SECURITY] Invalid chat message: ${validation.error}`);
                throw new Error(`Invalid chat message: ${validation.error}`);
            }

            const { name, msg, roomNumber } = validation.data;
            const safeTime = message.time ? new Date(message.time) : new Date();

            const chatMessage = new this.ChatRoomModel({
                name: name,
                msg: msg,
                time: Number.isNaN(safeTime.getTime()) ? new Date() : safeTime,
                roomNumber: roomNumber
            });
            await chatMessage.save();
            
            // Emit with validated data
            this.emit("new_message", {
                name: name,
                msg: msg,
                time: safeTime,
                roomNumber: roomNumber
            });

            // Clear cache for this room
            cache.del(`chatRoom:${roomNumber}`);

            const messageCount = await this.ChatRoomModel.countDocuments({ 'roomNumber': roomNumber });
            if (messageCount < this.maxChatMessages) return;

            const overflowCount = messageCount - this.maxChatMessages;
            const oldestMessages = await this.ChatRoomModel.find({ 'roomNumber': roomNumber })
                .sort({ 'time': 1 });

            if (!oldestMessages[overflowCount - 1]) return;

            await this.ChatRoomModel.deleteMany({
                'roomNumber': roomNumber,
                time: { $lt: oldestMessages[overflowCount - 1].time }
            });
        } catch (error) {
            console.error('[ERROR] Chat room push failed:', error.message);
            throw error;
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

            // Always return messages in chronological order with a deterministic tiebreaker
            const messages = await this.ChatRoomModel
                .find({ roomNumber })
                .sort({ time: 1, _id: 1 });

            // Update cache
            cache.set(cacheKey, messages);

            callback(messages);
        } catch (error) {
            console.error('Chat room get failed:', error);
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
                return cachedMessage;
            }

            // If not in cache, query the database
            let dbQuery = this.dbOperations.forwardedMessage.schema.findOne(query);

            // Apply sort if provided
            if (options.sort) {
                dbQuery = dbQuery.sort(options.sort);
            }

            const message = await dbQuery;

            // Update cache if message found
            if (message) {
                // Update the main cache key
                cache.set(cacheKey, message);

                // Also update individual lookup caches for consistency
                if (message.sourceMessageId) {
                    cache.set(`forwardedMessage:${JSON.stringify({ sourceMessageId: message.sourceMessageId })}`, message);
                }

                if (message.userId) {
                    cache.set(`forwardedMessage:${JSON.stringify({ userId: message.userId })}`, message);
                }

                if (message.userId && message.sourceMessageId) {
                    cache.set(`forwardedMessage:${JSON.stringify({
                        userId: message.userId,
                        sourceMessageId: message.sourceMessageId
                    })}`, message);
                }
            }

            return message;
        } catch (error) {
            console.error(`[ERROR] Failed to find forwarded message:`, error);
            return null;
        }
    }

    async createForwardedMessage(data) {
        try {
            //console.log(`[DEBUG] Attempting to create forwarded message with data:`, JSON.stringify(data));

            // Check if a message with this fixedId already exists for this user
            const existingMessage = await this.dbOperations.forwardedMessage.schema.findOne({
                userId: data.userId,
                fixedId: data.fixedId
            });

            if (existingMessage) {
                console.error(`[ERROR] Duplicate fixedId detected for user ${data.userId}: ${data.fixedId}`);
                console.error(`[ERROR] Existing message:`, JSON.stringify(existingMessage));

                // Get a new fixedId for this user
                data.fixedId = await this.getNextFixedIdForUser(data.userId);
                //console.log(`[DEBUG] Adjusted fixedId to: ${data.fixedId}`);
            }

            const message = await this.dbOperations.forwardedMessage.schema.create(data);

            // Update cache with new message
            if (message) {
                // Clear any existing caches for this user to ensure consistency
                this.clearUserForwardedMessageCache(message.userId);

                // Cache for direct sourceMessageId lookup
                cache.set(`forwardedMessage:${JSON.stringify({ sourceMessageId: message.sourceMessageId })}`, message);

                // Cache for userId lookup
                cache.set(`forwardedMessage:${JSON.stringify({ userId: message.userId })}`, message);

                // Cache for combined lookup
                cache.set(`forwardedMessage:${JSON.stringify({
                    userId: message.userId,
                    sourceMessageId: message.sourceMessageId
                })}`, message);

                // Cache for the specific query that would find this message
                cache.set(`forwardedMessage:${JSON.stringify({
                    userId: message.userId,
                    fixedId: message.fixedId
                })}`, message);

                //console.log(`[DEBUG] Successfully created forwarded message with fixedId: ${message.fixedId}`);
            }

            return message;
        } catch (error) {
            console.error(`[ERROR] Failed to create forwarded message:`, error);
            console.error(`[ERROR] Error details:`, JSON.stringify({
                code: error.code,
                keyPattern: error.keyPattern,
                keyValue: error.keyValue
            }));

            // If it's a duplicate key error, try again with a new fixedId
            if (error.code === 11_000 && error.keyPattern && error.keyPattern.fixedId) {
                //console.log(`[DEBUG] Retrying with a new fixedId for user ${data.userId}`);
                data.fixedId = await this.getNextFixedIdForUser(data.userId);
                return this.createForwardedMessage(data);
            }

            throw error;
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
                // Clear all caches for this user to ensure consistency
                this.clearUserForwardedMessageCache(deletedMessage.userId);

                // Clear the cache for direct sourceMessageId lookup
                cache.del(`forwardedMessage:${JSON.stringify({ sourceMessageId: deletedMessage.sourceMessageId })}`);

                // Clear the cache for userId lookup
                cache.del(`forwardedMessage:${JSON.stringify({ userId: deletedMessage.userId })}`);

                // Clear the cache for combined lookup
                cache.del(`forwardedMessage:${JSON.stringify({
                    userId: deletedMessage.userId,
                    sourceMessageId: deletedMessage.sourceMessageId
                })}`);

                // Clear the cache for the specific query that would find this message
                cache.del(`forwardedMessage:${JSON.stringify({
                    userId: deletedMessage.userId,
                    fixedId: deletedMessage.fixedId
                })}`);

                // Clear any cache with sort options
                cache.del(`forwardedMessage:${JSON.stringify({ userId: deletedMessage.userId })}:${JSON.stringify({ sort: { fixedId: -1 } })}`);
            }

            return deletedMessage;
        } catch (error) {
            console.error(`[ERROR] Failed to delete forwarded message:`, error);
            throw error;
        }
    }

    async findForwardedMessages(filter) {
        try {
            const messages = await this.dbOperations.forwardedMessage.schema.find(filter).sort({ fixedId: 1 });

            // Update cache for each message
            for (const message of messages) {
                // Update the main cache key for this query
                const queryCacheKey = `forwardedMessage:${JSON.stringify(filter)}:${JSON.stringify({ sort: { fixedId: 1 } })}`;
                cache.set(queryCacheKey, messages);

                // Update individual message caches
                if (message.sourceMessageId) {
                    cache.set(`forwardedMessage:${JSON.stringify({ sourceMessageId: message.sourceMessageId })}`, message);
                }

                if (message.userId) {
                    cache.set(`forwardedMessage:${JSON.stringify({ userId: message.userId })}`, message);
                }

                if (message.userId && message.sourceMessageId) {
                    cache.set(`forwardedMessage:${JSON.stringify({
                        userId: message.userId,
                        sourceMessageId: message.sourceMessageId
                    })}`, message);
                }

                // Cache for the specific query that would find this message
                cache.set(`forwardedMessage:${JSON.stringify({
                    userId: message.userId,
                    fixedId: message.fixedId
                })}`, message);
            }

            return messages;
        } catch (error) {
            console.error(`[ERROR] Failed to find forwarded messages:`, error);
            return [];
        }
    }

    // Helper method to clear all caches related to a user's forwarded messages
    clearUserForwardedMessageCache(userId) {
        try {
            // Get all cache keys
            const keys = cache.keys();

            // Filter keys related to this user
            const userKeys = keys.filter(key => {
                try {
                    const keyData = JSON.parse(key.replace('forwardedMessage:', ''));
                    return keyData.userId === userId;
                } catch {
                    return false;
                }
            });

            // Delete all related keys
            for (const key of userKeys) {
                cache.del(key);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to clear user forwarded message cache:`, error);
        }
    }

    async getNextFixedId() {
        try {
            // Find all existing fixedIds
            const messages = await this.dbOperations.forwardedMessage.schema.find({}, { fixedId: 1 })
                .sort({ fixedId: 1 });

            // If no messages exist, start with 1
            if (!messages || messages.length === 0) {
                return 1;
            }

            // Extract all fixedIds into an array
            const existingIds = new Set(messages.map(msg => msg.fixedId));

            // Find the first missing ID starting from 1
            let nextId = 1;
            while (existingIds.has(nextId)) {
                nextId++;
            }

            return nextId;
        } catch (error) {
            console.error(`[ERROR] Failed to get next fixedId:`, error);
            // Return a timestamp-based ID as a fallback
            return Date.now();
        }
    }

    async getNextFixedIdForUser(userId) {
        try {
            // Find all existing fixedIds for this user
            const messages = await this.dbOperations.forwardedMessage.schema.find(
                { userId: userId },
                { fixedId: 1 }
            ).sort({ fixedId: 1 });

            // If no messages exist for this user, start with 1
            if (!messages || messages.length === 0) {
                return 1;
            }

            // Extract all fixedIds into an array
            const existingIds = new Set(messages.map(msg => msg.fixedId));

            // Find the first missing ID starting from 1
            let nextId = 1;
            while (existingIds.has(nextId)) {
                nextId++;
            }
            return nextId;
        } catch (error) {
            console.error(`[ERROR] Failed to get next fixedId for user ${userId}:`, error);
            // Return a timestamp-based ID as a fallback
            return Date.now();
        }
    }

    async countForwardedMessages(filter) {
        try {
            return await this.dbOperations.forwardedMessage.schema.countDocuments(filter);
        } catch (error) {
            console.error(`[ERROR] Failed to count forwarded messages:`, error);
            return 0;
        }
    }

    async recreateForwardedMessageIndex() {
        try {
            // Drop the existing index
            await this.dbOperations.forwardedMessage.schema.collection.dropIndexes();

            // Create the new compound index
            await this.dbOperations.forwardedMessage.schema.collection.createIndex(
                { userId: 1, fixedId: 1 },
                { unique: true }
            );

            return true;
        } catch (error) {
            console.error(`[ERROR] Failed to recreate forwardedMessage index:`, error);
            return false;
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