"use strict";
if (!process.env.mongoURL) return;

const fs = require('fs');
const crypto = require('crypto');
const schema = require('./schema.js');
const checkMongodb = require('./dbWatchdog.js');

// 使用 Map 來做使用者快取
const userCache = new Map();

// 讀取訊息檔案的工具函數
const readJsonFile = (filename) => {
    try {
        const data = fs.readFileSync(filename);
        if (!data) throw new Error('File is empty');
        const parsed = JSON.parse(data);
        if (!parsed.joinMessage || !parsed.firstTimeUseMessage) {
            throw new Error('Invalid message format');
        }
        return parsed;
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return { joinMessage: [], firstTimeUseMessage: [] };
    }
};

// 更新訊息快取的函數
function updateMessageCache() {
    try {
        const newCache = readJsonFile("./assets/message.json");
        if (Object.keys(newCache).length > 0) {
            messageCache = newCache;
            //console.log('[MessageCache] Updated successfully');
        }
    } catch (error) {
        console.error('[MessageCache] Update failed:', error);
    }
}

// 使用防抖動的計時器
let updateTimer;
const startUpdateTimer = () => {
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(updateMessageCache, 60 * 60 * 1000);
};

// 初始設定
let messageCache = readJsonFile("./assets/message.json");
startUpdateTimer();

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