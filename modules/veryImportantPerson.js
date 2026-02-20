"use strict";
const schema = require('./schema.js');
// const checkMongodb = require('./dbWatchdog.js');

const DebugMode = Boolean(process.env.DEBUG);
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

class VIPManager {
    constructor() {
        this.vipCache = null;
        this.lastUpdate = 0;
    }

    async refreshCache() {
        try {
            this.vipCache = await schema.veryImportantPerson.find({});
            this.lastUpdate = Date.now();
        } catch (error) {
            console.error('VIP MongoDB error:', error);
            throw new Error('Failed to fetch VIP data');
        }
    }

    async checkVIPLevel(id, type = 'group') {
        if (!id) return 0;

        // DIY模式直接返回最高權限
        if (DebugMode) return 5;

        // 檢查快取是否需要更新
        const needsUpdate = !this.vipCache ||
            (Date.now() - this.lastUpdate > CACHE_DURATION);

        if (needsUpdate) {
            await this.refreshCache();
        }

        // 根據類型選擇查詢條件；同一 id 可能有多筆（手動 + Patreon），取最高 level
        const searchKey = type === 'group' ? 'gpid' : 'id';

        const matches = (this.vipCache || []).filter(item =>
            item[searchKey] === id && item.switch !== false
        );
        if (matches.length === 0) return 0;
        return Math.max(...matches.map(item => Number(item.level) || 0));
    }
}

const vipManager = new VIPManager();

const viplevelCheckGroup = (groupID) =>
    vipManager.checkVIPLevel(groupID, 'group');

const viplevelCheckUser = (userid) =>
    vipManager.checkVIPLevel(userid, 'user');

module.exports = {
    viplevelCheckGroup,
    viplevelCheckUser
};