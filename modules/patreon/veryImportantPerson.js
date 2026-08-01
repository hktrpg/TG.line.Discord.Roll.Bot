"use strict";
const schema = require('../db/schema.js');
const { isEnvEnabled } = require('../../utils/env-flag.js');
// const checkMongodb = require('./db/watchdog.js');

const DebugMode = isEnvEnabled('DEBUG');
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

/** Normalize botname / platform for VIP row matching (Discord → discord). */
function normalizeVipPlatform(platform) {
    return String(platform || '').trim().toLowerCase();
}

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

    /**
     * @param {string} id
     * @param {'group'|'user'} [type]
     * @param {string} [platform] - botname or platform; when set, platform-tagged rows must match (legacy empty platform still matches)
     */
    async checkVIPLevel(id, type = 'group', platform) {
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
        const wantPlatform = normalizeVipPlatform(platform);

        const now = Date.now();
        const matches = (this.vipCache || []).filter(item => {
            if (item[searchKey] !== id || item.switch === false) return false;
            const end = item.endDate ? new Date(item.endDate).getTime() : null;
            if (end != null && !Number.isNaN(end) && end < now) return false;
            if (wantPlatform) {
                const rowPlatform = normalizeVipPlatform(item.platform);
                // Legacy/manual rows (no platform) still apply; platform-tagged rows must match.
                if (rowPlatform && rowPlatform !== wantPlatform) return false;
            }
            return true;
        });
        if (matches.length === 0) return 0;
        return Math.max(...matches.map(item => Number(item.level) || 0));
    }
}

const vipManager = new VIPManager();

const viplevelCheckGroup = (groupID, platform) =>
    vipManager.checkVIPLevel(groupID, 'group', platform);

const viplevelCheckUser = (userid, platform) =>
    vipManager.checkVIPLevel(userid, 'user', platform);

function invalidateCache() {
    vipManager.vipCache = null;
    vipManager.lastUpdate = 0;
}

module.exports = {
    viplevelCheckGroup,
    viplevelCheckUser,
    normalizeVipPlatform,
    invalidateCache,
};
