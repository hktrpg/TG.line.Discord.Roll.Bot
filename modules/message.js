"use strict";
if (!process.env.mongoURL) return;

const fs = require('fs');
const schema = require('./schema.js');
const crypto = require('crypto');
const checkMongodb = require('./dbWatchdog.js');

// 使用 Map 來做使用者快取
const userCache = new Map();

// 讀取訊息檔案的工具函數
const readJsonFile = (filename) => {
    try {
        return JSON.parse(fs.readFileSync(filename));
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return { joinMessage: [], firstTimeUseMessage: [] };
    }
};

// 快取訊息內容
const messageCache = readJsonFile("./assets/message.json");

function joinMessages(messages) {
    return messages.join("\n");
}

function joinMessage() {
    return joinMessages(messageCache.joinMessage);
}

function firstTimeMessage() {
    return joinMessages(messageCache.firstTimeUseMessage);
}

async function newUserChecker(userid, botname) {
    if (!checkMongodb.isDbOnline()) return false;
    
    const hash = crypto.createHash('sha256')
        .update(userid.toString())
        .digest('base64');
    
    const cacheKey = `${hash}:${botname}`;
    if (userCache.has(cacheKey)) return false;

    try {
        const user = await schema.firstTimeMessage.findOne({ 
            userID: hash, 
            botname 
        });

        if (!user) {
            userCache.set(cacheKey, true);
            await new schema.firstTimeMessage({ 
                userID: hash, 
                botname 
            }).save();
            return true;
        }

        userCache.set(cacheKey, true);
        return false;
    } catch (error) {
        console.error('newUserChecker Error:', error);
        return false;
    }
}

module.exports = {
    joinMessage,
    newUserChecker,
    firstTimeMessage
};