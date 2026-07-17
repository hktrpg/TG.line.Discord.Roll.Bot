"use strict";
if (!process.env.mongoURL) return;

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const schema = require('./schema.js');
const i18n = require('./i18n.js');
const checkMongodb = require('./dbWatchdog.js');
const timerManager = require('./timer-manager');

const userCache = new Map();
const USER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const USER_CACHE_MAX = 50_000;
let userCacheClearInterval;

function startUserCacheClearInterval() {
    if (userCacheClearInterval) timerManager.clearInterval(userCacheClearInterval);
    userCacheClearInterval = timerManager.setInterval(() => userCache.clear(), USER_CACHE_TTL_MS);
}

function pruneUserCacheIfNeeded() {
    if (userCache.size <= USER_CACHE_MAX) return;
    const toDelete = userCache.size - USER_CACHE_MAX;
    const keys = [...userCache.keys()].slice(0, toDelete);
    for (const k of keys) userCache.delete(k);
}

startUserCacheClearInterval();

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

function updateMessageCache() {
    try {
        const newCache = readJsonFile("./assets/message.json");
        if (Object.keys(newCache).length > 0) {
            messageCache = newCache;
        }
    } catch (error) {
        console.error('[MessageCache] Update failed:', error);
    }
}

let updateTimer;
const startUpdateTimer = () => {
    if (updateTimer) timerManager.clearInterval(updateTimer);
    updateTimer = timerManager.setInterval(updateMessageCache, 60 * 60 * 1000);
};

let messageCache = readJsonFile("./assets/message.json");
startUpdateTimer();

function joinMessages(messages) {
    return messages.join("\n");
}

function getWelcomeLines(type) {
    try {
        const langPath = path.join(__dirname, '..', 'lang', `${i18n.DEFAULT_LOCALE}.json`);
        const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        const bodyKey = type === 'join' ? 'join_message' : 'first_time_message';
        const body = langData?.welcome?.[bodyKey];
        const guide = langData?.welcome?.i18n_guide;
        if (Array.isArray(body) && body.length > 0) {
            return [...body, ...(Array.isArray(guide) ? guide : [])];
        }
    } catch (error) {
        console.error('[Message] Failed to load welcome from lang:', error.message);
    }

    const fallback = type === 'join' ? messageCache.joinMessage : messageCache.firstTimeUseMessage;
    return Array.isArray(fallback) ? [...fallback] : [];
}

function buildWelcomeMessage(type) {
    return joinMessages(getWelcomeLines(type));
}

function joinMessage() {
    return buildWelcomeMessage('join');
}

function firstTimeMessage() {
    return buildWelcomeMessage('first_time');
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
        }).lean();

        if (!user) {
            userCache.set(cacheKey, true);
            pruneUserCacheIfNeeded();
            await new schema.firstTimeMessage({
                userID: hash,
                botname
            }).save();
            return true;
        }

        userCache.set(cacheKey, true);
        pruneUserCacheIfNeeded();
        return false;
    } catch (error) {
        console.error('newUserChecker Error:', error);
        return false;
    }
}

async function maybeSendFirstTimeWelcome(userid, botname = 'Discord') {
    if (!userid || !process.env.mongoURL) return false;
    const isNew = await newUserChecker(userid, botname);
    if (!isNew) return false;
    return firstTimeMessage();
}

module.exports = {
    joinMessage,
    newUserChecker,
    firstTimeMessage,
    buildWelcomeMessage,
    maybeSendFirstTimeWelcome
};
