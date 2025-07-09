"use strict";
if (!process.env.mongoURL) {
    return;
}

// 導入依賴
const rollbase = require('./rollbase.js');
const records = require('../modules/records.js');
const schema = require('../modules/schema.js');
const NodeCache = require('node-cache');
const checkTools = require('../modules/check.js');
const VIP = require('../modules/veryImportantPerson');
const { SlashCommandBuilder } = require('discord.js');

// 常量定義
const CACHE_TTL = {
    GROUP_CONFIG: 300,  // 群組配置緩存5分鐘
    MEMBER_DATA: 60,    // 成員數據緩存1分鐘
    DATABASE: 300       // 數據庫緩存5分鐘
};

const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];

// 初始化緩存
const cache = new NodeCache({
    stdTTL: CACHE_TTL.GROUP_CONFIG,
    checkperiod: 120 // 每2分鐘檢查過期緩存
});

// 全局數據
let trpgDatabasefunction = {
    trpgDatabasefunction: null,
    trpgDatabaseAllgroup: null
};

/**
 * 數據庫操作相關函數
 */
const dbOperations = {
    /**
     * 批量更新緩存
     * @param {string} groupid 群組ID
     * @param {string} userid 用戶ID
     * @returns {Promise<Object>} 更新後的數據
     */
    async updateCache(groupid, userid) {
        try {
            const [groupConfig, groupMembers, userInfo] = await Promise.all([
                schema.trpgLevelSystem.findOne({ groupid }),
                schema.trpgLevelSystemMember.find({ groupid }).sort({ EXP: -1 }),
                schema.trpgLevelSystemMember.findOne({ groupid, userid })
            ]);

            if (groupConfig) {
                cache.set(`group_config_${groupid}`, groupConfig, CACHE_TTL.GROUP_CONFIG);
            }
            if (groupMembers) {
                cache.set(`group_members_${groupid}`, groupMembers, CACHE_TTL.MEMBER_DATA);
            }
            if (userInfo) {
                cache.set(`user_${groupid}_${userid}`, userInfo, CACHE_TTL.MEMBER_DATA);
            }

            return { groupConfig, groupMembers, userInfo };
        } catch (error) {
            console.error('Cache update error:', error);
            return { groupConfig: null, groupMembers: null, userInfo: null };
        }
    },

    /**
     * 查找群組配置
     * @param {string} groupid 群組ID
     * @returns {Promise<Object>} 群組配置
     */
    async findGp(groupid) {
        if (!process.env.mongoURL || !groupid) return null;

        const cacheKey = `group_config_${groupid}`;
        let config = cache.get(cacheKey);

        if (!config) {
            try {
                config = await schema.trpgLevelSystem.findOne({
                    groupid: groupid,
                    SwitchV2: 1
                });

                if (config) {
                    cache.set(cacheKey, config, CACHE_TTL.GROUP_CONFIG);
                }
            } catch (error) {
                console.error('Find group config error:', error);
                return null;
            }
        }

        return config;
    },

    /**
     * 查找群組成員
     * @param {string} groupid 群組ID
     * @returns {Promise<Array>} 成員列表
     */
    async findGpMember(groupid) {
        if (!process.env.mongoURL || !groupid) return null;

        const cacheKey = `group_members_${groupid}`;
        let members = cache.get(cacheKey);

        if (!members) {
            try {
                members = await schema.trpgLevelSystemMember.find({
                    groupid: groupid
                }).sort({ EXP: -1 });

                if (members) {
                    cache.set(cacheKey, members, CACHE_TTL.MEMBER_DATA);
                }
            } catch (error) {
                console.error('Find group members error:', error);
                return null;
            }
        }

        return members;
    },

    /**
     * 查找用戶信息
     * @param {string} groupid 群組ID
     * @param {string} userid 用戶ID
     * @returns {Promise<Object>} 用戶信息
     */
    async findUser(groupid, userid) {
        if (!groupid || !userid) return null;

        const cacheKey = `user_${groupid}_${userid}`;
        let user = cache.get(cacheKey);

        if (!user) {
            try {
                user = await schema.trpgLevelSystemMember.findOne({
                    groupid: groupid,
                    userid: userid
                });

                if (user) {
                    cache.set(cacheKey, user, CACHE_TTL.MEMBER_DATA);
                }
            } catch (error) {
                console.error('Find user error:', error);
                return null;
            }
        }

        return user;
    },

    /**
     * 計算用戶排名
     * @param {string} who 用戶ID
     * @param {Array} data 成員數據
     * @returns {string} 排名
     */
    ranking(who, data) {
        if (!data || !Array.isArray(data)) return "0";
        const memberMap = new Map(data.map((member, index) => [member.userid, index + 1]));
        return memberMap.get(who) || "0";
    },

    /**
     * 清除緩存
     * @param {string} groupid 群組ID
     * @param {string} userid 用戶ID
     */
    clearCache(groupid, userid) {
        if (groupid) {
            cache.del(`group_config_${groupid}`);
            cache.del(`group_members_${groupid}`);
        }
        if (userid) {
            cache.del(`user_${groupid}_${userid}`);
        }
    }
};

/**
 * 數據庫操作相關函數
 */
const databaseOperations = {
    /**
     * 按需獲取群組數據庫
     * @returns {Promise<Array>} 群組數據庫
     */
    async getGroupDatabase() {
        const cacheKey = 'group_database';
        let database = cache.get(cacheKey);

        if (!database) {
            try {
                database = await new Promise((resolve) => {
                    records.get('trpgDatabase', (msgs) => {
                        resolve(msgs);
                    });
                });
                cache.set(cacheKey, database, CACHE_TTL.DATABASE);
            } catch (error) {
                console.error('Get group database error:', error);
                return null;
            }
        }

        return database;
    },

    /**
     * 按需獲取全服數據庫
     * @returns {Promise<Array>} 全服數據庫
     */
    async getGlobalDatabase() {
        const cacheKey = 'global_database';
        let database = cache.get(cacheKey);

        if (!database) {
            try {
                database = await new Promise((resolve) => {
                    records.get('trpgDatabaseAllgroup', (msgs) => {
                        resolve(msgs);
                    });
                });
                cache.set(cacheKey, database, CACHE_TTL.DATABASE);
            } catch (error) {
                console.error('Get global database error:', error);
                return null;
            }
        }

        return database;
    },

    /**
     * 更新群組數據庫
     * @returns {Promise<void>}
     */
    async updateGroupDatabase() {
        try {
            const database = await new Promise((resolve) => {
                records.get('trpgDatabase', (msgs) => {
                    resolve(msgs);
                });
            });
            cache.set('group_database', database, CACHE_TTL.DATABASE);
        } catch (error) {
            console.error('Update group database error:', error);
        }
    },

    /**
     * 更新全服數據庫
     * @returns {Promise<void>}
     */
    async updateGlobalDatabase() {
        try {
            const database = await new Promise((resolve) => {
                records.get('trpgDatabaseAllgroup', (msgs) => {
                    resolve(msgs);
                });
            });
            cache.set('global_database', database, CACHE_TTL.DATABASE);
        } catch (error) {
            console.error('Update global database error:', error);
        }
    },

    /**
     * 刪除群組所有數據
     * @param {string} groupid 群組ID
     * @returns {Promise<void>}
     */
    async deleteAllGroupData(groupid) {
        try {
            const database = await this.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            if (groupData) {
                groupData.trpgDatabasefunction = [];
                await new Promise((resolve) => {
                    records.setTrpgDatabaseFunction('trpgDatabase', groupData, () => {
                        this.updateGroupDatabase();
                        resolve();
                    });
                });
            }
        } catch (error) {
            console.error('Delete all group data error:', error);
        }
    },

    /**
     * 刪除指定索引的數據
     * @param {string} groupid 群組ID
     * @param {number} index 索引
     * @returns {Promise<void>}
     */
    async deleteGroupDataByIndex(groupid, index) {
        try {
            const database = await this.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            if (groupData && index >= 0 && index < groupData.trpgDatabasefunction.length) {
                groupData.trpgDatabasefunction.splice(index, 1);
                await new Promise((resolve) => {
                    records.setTrpgDatabaseFunction('trpgDatabase', groupData, () => {
                        this.updateGroupDatabase();
                        resolve();
                    });
                });
            }
        } catch (error) {
            console.error('Delete group data by index error:', error);
        }
    }
};

/**
 * 遊戲功能名稱
 * @returns {string} 功能名稱
 */
const gameName = () => '【資料庫功能】 .db(p) (add del show 自定關鍵字)';

/**
 * 遊戲類型
 * @returns {string} 遊戲類型
 */
const gameType = () => 'funny:trpgDatabase:hktrpg';

/**
 * 命令前綴
 * @returns {Array} 前綴配置
 */
const prefixs = () => [{
        first: /(^[.]db(p|)$)/ig,
        second: null
}];

/**
 * 獲取幫助信息
 * @returns {Promise<string>} 幫助信息
 */
const getHelpMessage = async () => {
    return `【📚資料庫功能】
╭──── 💡功能簡介 ────
│ 資料庫可以儲存和調用自定義內容
│ 支援文字、數字、表情符號
│ 分為個人資料庫和全服資料庫
│
├──── 📝基本指令 ────
│ • .db add 關鍵字 內容
│   新增資料項目
│ • .db show
│   顯示資料清單
│ • .db del 標題
│   刪除指定標題
│ • .db 關鍵字/index
│   顯示資料內容
│
├──── 🌐全服指令 ────
│ • .dbp add/show
│   新增/顯示全服資料
│ • .dbp newType
│   查看特殊效果範例
│
├──── ✨特殊標記 ────
│ ■ 基礎功能:
│ • {br} - 換行
│ • {ran:100} - 隨機1-100
│ • {random:5-20} - 隨機5-20
│ • {server.member_count} - 總人數
│ • {my.name} - 使用者名字
│
│ ■ 等級相關(.level):
│ • {my.level} - 等級
│ • {my.exp} - 經驗值
│ • {my.title} - 稱號
│ • {my.Ranking} - 排名
│ • {my.RankingPer} - 排名百分比
│ • {allgp.name} - 隨機成員名
│ • {allgp.title} - 隨機稱號
│
├──── 📖使用範例 ────
│ 1. 基本資料儲存:
│ .db add 防具表 皮甲{br}鎖甲{br}板甲
│
│ 2. 隨機回應:
│ .db add 運氣 今天的運氣是{ran:100}分
│
│ 3. 動態資訊:
│ .db add 伺服器 目前有{server.member_count}人
│ {my.name}的等級是{my.level}
├──── ⚠️注意事項 ────
│ • 關鍵字可用中英數+表情
│ • 未生效時用show重整
╰──────────────`;
};

/**
 * 初始化功能
 * @returns {Object} 功能配置
 */
const initialize = () => trpgDatabasefunction;

// 導入等級系統
exports.z_Level_system = require('./z_Level_system');

/**
 * 異步字符串替換
 * @param {string} str 原始字符串
 * @param {RegExp} regex 正則表達式
 * @param {Function} asyncFn 異步替換函數
 * @returns {Promise<string>} 處理後的字符串
 */
async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

/**
 * 檢查群組數據庫是否達到上限
 * @param {Object} groupData 群組數據
 * @param {number} limit 上限數量
 * @returns {boolean} 是否達到上限
 */
function isGroupDatabaseFull(groupData, limit) {
    return groupData && groupData.trpgDatabasefunction &&
        groupData.trpgDatabasefunction.length >= limit;
}

/**
 * 檢查關鍵字是否已存在
 * @param {Object} groupData 群組數據
 * @param {string} topic 關鍵字
 * @returns {boolean} 是否存在
 */
function isTopicExists(groupData, topic) {
    if (!groupData || !groupData.trpgDatabasefunction) return false;

    return groupData.trpgDatabasefunction.some(item =>
        item.topic === topic
    );
}

/**
 * 創建新的數據庫條目
 * @param {string} groupid 群組ID
 * @param {string} topic 關鍵字
 * @param {string} content 內容
 * @returns {Object} 數據庫條目
 */
function createDatabaseEntry(groupid, topic, content) {
    return {
        groupid,
        trpgDatabasefunction: [{
            topic,
            contact: content
        }]
    };
}

/**
 * 檢查權限
 * @param {Object} params 參數對象
 * @returns {string} 錯誤信息
 */
function checkPermission(params) {
    return checkTools.permissionErrMsg({
        flag: checkTools.flag.ChkChannelManager,
        gid: params.groupid,
        role: params.userrole
    });
}

/**
 * 格式化數據庫列表
 * @param {Array} items 數據項列表
 * @param {number} page 當前頁碼
 * @param {number} pageSize 每頁數量
 * @returns {string} 格式化後的列表
 */
function formatDatabaseList(items, page = 1, pageSize = 20) {
    if (!items || items.length === 0) {
        return '📝 沒有已設定的關鍵字\n\n' +
               '💡 使用方式:\n' +
               '• 新增項目: .db add 標題 內容\n' +
               '• 查看列表: .db show [頁碼]\n' +
               '• 使用標題: .db 標題\n' +
               '• 使用編號: .db 編號\n' +
               '• 刪除項目: .db del 編號/all';
    }

    const totalPages = Math.ceil(items.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, items.length);
    const currentItems = items.slice(startIndex, endIndex);

    let output = `📚 資料庫列表 (第 ${page}/${totalPages} 頁)\n`;
    output += '╭──────────────────────────────────────\n';

    // 每行顯示2個項目
    for (let i = 0; i < currentItems.length; i += 2) {
        const item1 = currentItems[i];
        const item2 = currentItems[i + 1];
        const globalIndex1 = startIndex + i;
        const globalIndex2 = startIndex + i + 1;

        const padding1 = (globalIndex1 + 1).toString().padStart(2, '0');
        const topic1 = item1.topic.length > 12 ? item1.topic.substring(0, 12) + '...' : item1.topic;

        if (item2) {
            const padding2 = (globalIndex2 + 1).toString().padStart(2, '0');
            const topic2 = item2.topic.length > 12 ? item2.topic.substring(0, 12) + '...' : item2.topic;
            output += `│ #${padding1}: ${topic1.padEnd(15)} #${padding2}: ${topic2}\n`;
        } else {
            output += `│ #${padding1}: ${topic1}\n`;
        }
    }

    output += '╰──────────────────────────────────────\n';
    output += `📊 共 ${items.length} 個關鍵字\n\n`;
    output += `💡 使用方式:\n`;
    output += `• 使用編號: .db 編號\n`;
    output += `• 使用標題: .db 標題\n`;
    output += `• 查看列表: .db show [頁碼]\n`;
    output += `• 新增項目: .db add 標題 內容\n`;
    output += `• 刪除項目: .db del 編號/all\n\n`;
    output += `💡 特殊標記:\n`;
    output += `• {br} - 換行\n`;
    output += `• {ran:100} - 隨機1-100\n`;
    output += `• {random:5-20} - 隨機5-20\n`;
    output += `• {my.name} - 使用者名字\n`;
    output += `• {my.level} - 使用者等級\n`;
    output += `• {my.exp} - 使用者經驗值\n`;
    output += `• {my.title} - 使用者稱號\n`;
    output += `• {my.Ranking} - 使用者排名\n`;
    output += `• {server.member_count} - 伺服器人數`;

    if (totalPages > 1) {
        output += `\n\n💡 使用 .db show ${page + 1} 查看下一頁`;
    }

    return output;
}

/**
 * 查找關鍵字內容
 * @param {Array} database 數據庫
 * @param {string} topic 關鍵字
 * @returns {Object|null} 匹配的內容
 */
function findTopicContent(database, topic) {
    if (!database || !topic) return null;

    for (const group of database) {
        const item = group.trpgDatabasefunction.find(
            item => item.topic.toLowerCase() === topic.toLowerCase()
        );
        if (item) return item;
    }
    return null;
}

/**
 * 檢查全服數據庫是否達到上限
 * @param {Object} database 數據庫
 * @returns {boolean} 是否達到上限
 */
function isGlobalDatabaseFull(database) {
    return database?.[0]?.trpgDatabaseAllgroup?.length > 100;
}

/**
 * 檢查全服關鍵字是否已存在
 * @param {Object} database 數據庫
 * @param {string} topic 關鍵字
 * @returns {boolean} 是否存在
 */
function isGlobalTopicExists(database, topic) {
    if (!database) return false;

    return database.some(group =>
        group.trpgDatabaseAllgroup.some(item =>
            item.topic.toLowerCase() === topic.toLowerCase()
        )
    );
}

/**
 * 創建新的全服數據庫條目
 * @param {string} topic 關鍵字
 * @param {string} content 內容
 * @returns {Object} 數據庫條目
 */
function createGlobalDatabaseEntry(topic, content) {
    return {
        trpgDatabaseAllgroup: [{
            topic,
            contact: content
        }]
    };
}

/**
 * 格式化全服數據庫列表
 * @param {Array} database 數據庫
 * @param {number} page 當前頁碼
 * @param {number} pageSize 每頁數量
 * @returns {string} 格式化後的列表
 */
function formatGlobalDatabaseList(database, page = 1, pageSize = 20) {
    if (!database || database.length === 0) {
        return '📝 沒有已設定的關鍵字';
    }

    const allItems = database.reduce((acc, group) => {
        if (group.trpgDatabaseAllgroup) {
            acc.push(...group.trpgDatabaseAllgroup);
        }
        return acc;
    }, []);

    if (allItems.length === 0) {
        return '📝 沒有已設定的關鍵字';
    }

    const totalPages = Math.ceil(allItems.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, allItems.length);
    const currentItems = allItems.slice(startIndex, endIndex);

    let output = `🌐 全服資料庫列表 (第 ${page}/${totalPages} 頁)\n`;
    output += '╭──────────────────────────────────────\n';

    // 每行顯示2個項目
    for (let i = 0; i < currentItems.length; i += 2) {
        const item1 = currentItems[i];
        const item2 = currentItems[i + 1];
        const globalIndex1 = startIndex + i;
        const globalIndex2 = startIndex + i + 1;

        const padding1 = (globalIndex1 + 1).toString().padStart(2, '0');
        const topic1 = item1.topic.length > 12 ? item1.topic.substring(0, 12) + '...' : item1.topic;

        if (item2) {
            const padding2 = (globalIndex2 + 1).toString().padStart(2, '0');
            const topic2 = item2.topic.length > 12 ? item2.topic.substring(0, 12) + '...' : item2.topic;
            output += `│ #${padding1}: ${topic1.padEnd(15)} #${padding2}: ${topic2}\n`;
        } else {
            output += `│ #${padding1}: ${topic1}\n`;
        }
    }

    output += '╰──────────────────────────────────────\n';
    output += `📊 共 ${allItems.length} 個關鍵字\n\n`;
    output += `💡 使用方式:\n`;
    output += `• 使用編號: .dbp 編號\n`;
    output += `• 使用標題: .dbp 標題\n`;
    output += `• 查看列表: .dbp show [頁碼]\n`;
    output += `• 新增項目: .dbp add 標題 內容\n`;
    output += `• 刪除項目: .dbp del 編號/all`;

    if (totalPages > 1) {
        output += `\n\n💡 使用 .dbp show ${page + 1} 查看下一頁`;
    }

    return output;
}

/**
 * 查找全服關鍵字內容
 * @param {Array} database 數據庫
 * @param {string} topic 關鍵字
 * @returns {Object|null} 匹配的內容
 */
function findGlobalTopicContent(database, topic) {
    if (!database || !topic) return null;

    for (const group of database) {
        const item = group.trpgDatabaseAllgroup.find(
            item => item.topic.toLowerCase() === topic.toLowerCase()
        );
        if (item) return item;
    }
    return null;
}

 
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userrole,
    userid,
    displayname,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let checkifsamename = 0;
    let checkifsamenamegroup = 0;
    let tempshow = 0;
    let temp2 = 0;
    let lv;
    let limit = FUNCTION_LIMIT[0];
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;

        // .DB(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]db$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            // 驗證輸入
            if (!mainMsg[2]) rply.text += '❌ 沒有輸入標題。\n\n';
            if (!mainMsg[3]) rply.text += '❌ 沒有輸入內容。\n\n';

            // 檢查權限
            if (rply.text += checkPermission({ groupid, userrole })) {
                return rply;
            }

            // 獲取VIP等級和限制
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = FUNCTION_LIMIT[lv];

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 檢查是否達到上限
            if (isGroupDatabaseFull(groupData, limit)) {
                rply.text = `⚠️ 關鍵字已達上限 ${limit} 個\n`;
                rply.text += `💎 支援及解鎖上限: https://www.patreon.com/HKTRPG\n\n`;
                rply.text += `💡 使用方式:\n`;
                rply.text += `• 使用編號: .db 編號\n`;
                rply.text += `• 使用標題: .db 標題\n`;
                rply.text += `• 查看列表: .db show [頁碼]\n`;
                rply.text += `• 新增項目: .db add 標題 內容\n`;
                rply.text += `• 刪除項目: .db del 編號/all`;
                return rply;
            }

            // 檢查關鍵字是否重複
            if (isTopicExists(groupData, mainMsg[2])) {
                rply.text = '❌ 新增失敗: 標題重複\n\n';
                rply.text += `💡 使用方式:\n`;
                rply.text += `• 使用編號: .db 編號\n`;
                rply.text += `• 使用標題: .db 標題\n`;
                rply.text += `• 查看列表: .db show [頁碼]\n`;
                rply.text += `• 新增項目: .db add 標題 內容\n`;
                rply.text += `• 刪除項目: .db del 編號/all`;
                return rply;
            }

            // 創建新條目
            const content = inputStr
                .replace(/\.db\s+add\s+/i, '')
                .replace(mainMsg[2], '')
                .replace(/^\s+/, '');

            const newEntry = createDatabaseEntry(groupid, mainMsg[2], content);

            // 保存到數據庫
            records.pushTrpgDatabaseFunction('trpgDatabase', newEntry, () => {
                databaseOperations.updateGroupDatabase();
            });

            // 獲取當前索引
            const currentIndex = (groupData?.trpgDatabasefunction?.length || 0) + 1;

            rply.text = `✅ 新增成功: ${mainMsg[2]}\n\n`;
            rply.text += `💡 查看方式:\n`;
            rply.text += `• 使用編號: .db ${currentIndex}\n`;
            rply.text += `• 使用標題: .db ${mainMsg[2]}\n\n`;
            rply.text += `💡 其他功能:\n`;
            rply.text += `• 查看列表: .db show [頁碼]\n`;
            rply.text += `• 刪除項目: .db del ${currentIndex}\n`;
            rply.text += `• 刪除全部: .db del all`;
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]): {
            // 驗證輸入
            if (!mainMsg[2]) {
                rply.text = '❌ 請指定要刪除的標題\n\n';
                rply.text += `💡 使用方式:\n`;
                rply.text += `• 刪除項目: .db del 標題\n`;
                rply.text += `• 查看列表: .db show\n`;
                rply.text += `• 新增項目: .db add 標題 內容`;
                return rply;
            }

            // 檢查權限
            if (rply.text += checkPermission({ groupid, userrole })) {
                return rply;
            }

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 查找要刪除的項目
            const index = groupData?.trpgDatabasefunction?.findIndex(
                item => item.topic.toLowerCase() === mainMsg[2].toLowerCase()
            );

            if (index === -1) {
                rply.text = `❌ 找不到標題為 "${mainMsg[2]}" 的項目\n\n`;
                rply.text += `💡 使用方式:\n`;
                rply.text += `• 刪除項目: .db del 標題\n`;
                rply.text += `• 查看列表: .db show\n`;
                rply.text += `• 新增項目: .db add 標題 內容`;
                return rply;
            }

            // 刪除指定標題的數據
            await databaseOperations.deleteGroupDataByIndex(groupid, index);

            rply.text = `🗑️ 已刪除標題為 "${mainMsg[2]}" 的項目\n\n`;
            rply.text += `💡 使用方式:\n`;
            rply.text += `• 查看列表: .db show\n`;
            rply.text += `• 新增項目: .db add 標題 內容\n`;
            rply.text += `• 刪除項目: .db del 標題`;
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 檢查群組
            if (!groupid) {
                rply.text = '❌ 不在群組中';
                return rply;
            }

            // 如果有標題參數,搜索並顯示該標題的內容
            if (mainMsg[2] && !/^\d+$/.test(mainMsg[2])) {
                const content = findTopicContent(database, mainMsg[2]);
                if (content) {
                    rply.text = `【${content.topic}】\n${content.contact}`;
                    // 處理特殊標記
                    rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
                    return rply;
                } else {
                    rply.text = '沒有找到相關關鍵字';
                    return rply;
                }
            }

            // 獲取頁碼
            const page = parseInt(mainMsg[2]) || 1;

            // 格式化並顯示列表
            rply.text = formatDatabaseList(groupData?.trpgDatabasefunction, page);
            rply.quotes = true;
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^\d+$/i.test(mainMsg[1]): {
            // 檢查群組
            if (!groupid) {
                rply.text = '不在群組中';
                return rply;
            }

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 獲取指定索引的內容
            const index = parseInt(mainMsg[1]) - 1;
            if (groupData?.trpgDatabasefunction && index >= 0 && index < groupData.trpgDatabasefunction.length) {
                const content = groupData.trpgDatabasefunction[index];
                rply.text = `【${content.topic}】\n${content.contact}`;
                // 處理特殊標記
                rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            } else {
                rply.text = '沒有找到該編號的關鍵字';
            }
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            // 檢查群組
            if (!groupid) {
                rply.text = '不在群組.';
                return rply;
            }

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();

            // 查找關鍵字內容
            const content = findTopicContent(database, mainMsg[1]);

            if (content) {
                rply.text = `【${content.topic}】\n${content.contact}`;
            } else {
                rply.text = '沒有相關關鍵字.';
            }

            // 處理特殊標記
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            // 驗證輸入
            if (!mainMsg[2]) {
                rply.text = '❌ 新增失敗: 沒有關鍵字';
                        return rply;
                    }
            if (!mainMsg[3]) {
                rply.text = '❌ 新增失敗: 沒有內容';
                return rply;
            }

            // 獲取全服數據庫
            const database = await databaseOperations.getGlobalDatabase();

            // 檢查是否達到上限
            if (isGlobalDatabaseFull(database)) {
                rply.text = '⚠️ 全服關鍵字已達上限 100 個';
                return rply;
            }

            // 檢查關鍵字是否重複
            if (isGlobalTopicExists(database, mainMsg[2])) {
                rply.text = '❌ 新增失敗: 關鍵字重複';
                return rply;
            }

            // 創建新條目
            const content = inputStr
                .replace(/\.dbp add /i, '')
                .replace(mainMsg[2], '')
                .replace(/^\s+/, '');

            const newEntry = createGlobalDatabaseEntry(mainMsg[2], content);

            // 保存到數據庫
            records.pushTrpgDatabaseAllGroup('trpgDatabaseAllgroup', newEntry, () => {
                databaseOperations.updateGlobalDatabase();
            });

            // 獲取當前索引
            const allItems = database.reduce((acc, group) => {
                if (group.trpgDatabaseAllgroup) {
                    acc.push(...group.trpgDatabaseAllgroup);
                }
                return acc;
            }, []);
            const currentIndex = allItems.length + 1;

            rply.text = `✅ 新增成功: ${mainMsg[2]}\n`;
            rply.text += `💡 查看方式:\n`;
            rply.text += `• 使用編號: .dbp ${currentIndex}\n`;
            rply.text += `• 使用標題: .dbp ${mainMsg[2]}`;
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            // 獲取全服數據庫
            const database = await databaseOperations.getGlobalDatabase();

            // 如果有標題參數,搜索並顯示該標題的內容
            if (mainMsg[2] && !/^\d+$/.test(mainMsg[2])) {
                const content = findGlobalTopicContent(database, mainMsg[2]);
                if (content) {
                    rply.text = `【${content.topic}】\n${content.contact}`;
                    // 處理特殊標記
                    rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
                    return rply;
                } else {
                    rply.text = '沒有找到相關關鍵字';
                    return rply;
                }
            }

            // 獲取頁碼
            const page = parseInt(mainMsg[2]) || 1;

            // 格式化並顯示列表
            rply.text = formatGlobalDatabaseList(database, page);
            rply.quotes = true;
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]): {
            // 驗證輸入
            if (!mainMsg[2]) {
                rply.text = '❌ 請指定要刪除的標題\n\n';
                rply.text += `💡 使用方式:\n`;
                rply.text += `• 刪除項目: .dbp del 標題\n`;
                rply.text += `• 查看列表: .dbp show\n`;
                rply.text += `• 新增項目: .dbp add 標題 內容`;
                return rply;
            }

            // 獲取全服數據庫
            const database = await databaseOperations.getGlobalDatabase();

            // 查找要刪除的項目
            let foundGroup = null;
            let foundIndex = -1;
            for (const group of database) {
                const index = group.trpgDatabaseAllgroup?.findIndex(
                    item => item.topic.toLowerCase() === mainMsg[2].toLowerCase()
                );
                if (index !== -1) {
                    foundGroup = group;
                    foundIndex = index;
                    break;
                }
            }

            if (foundIndex === -1) {
                rply.text = `❌ 找不到標題為 "${mainMsg[2]}" 的項目\n\n`;
                rply.text += `💡 使用方式:\n`;
                rply.text += `• 刪除項目: .dbp del 標題\n`;
                rply.text += `• 查看列表: .dbp show\n`;
                rply.text += `• 新增項目: .dbp add 標題 內容`;
                return rply;
            }

            // 刪除指定標題的數據
            foundGroup.trpgDatabaseAllgroup.splice(foundIndex, 1);
            await new Promise((resolve) => {
                records.setTrpgDatabaseAllGroup('trpgDatabaseAllgroup', foundGroup, () => {
                    databaseOperations.updateGlobalDatabase();
                    resolve();
                });
            });

            rply.text = `🗑️ 已刪除標題為 "${mainMsg[2]}" 的項目\n\n`;
            rply.text += `💡 使用方式:\n`;
            rply.text += `• 查看列表: .dbp show\n`;
            rply.text += `• 新增項目: .dbp add 標題 內容\n`;
            rply.text += `• 刪除項目: .dbp del 標題`;
            return rply;
        }
        default:
            break;
    }
    async function replacer(first, second) {
        let temp = '',
            num = 0,
            temp2 = '';
        switch (true) {
            case /^ran:\d+/i.test(second):
                temp = /^ran:(\d+)/i.exec(second)
                if (!temp || !temp[1]) return ' ';
                return rollbase.Dice(temp[1]) || ' ';
            case /^random:\d+/i.test(second):
                temp = /^random:(\d+)-(\d+)/i.exec(second)
                if (!temp || !temp[1] || !temp[2]) return ' ';
                return rollbase.DiceINT(temp[1], temp[2]) || ' ';
            case /^allgp.name$/i.test(second):
                temp = await dbOperations.findGpMember(groupid);
                if (!temp) return ' ';
                num = rollbase.DiceINT(0, temp.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp[num].name
                return temp || ' ';
            // * {allgp.name} <---隨機全GP其中一人名字
            case /^allgp.title$/i.test(second):
                temp = await dbOperations.findGp(groupid);
                if (!temp) return ' ';
                if (temp.Title.length == 0) {
                    temp.Title = exports.z_Level_system.Title();
                }
                temp2 = await temp.Title.filter(function (item) {
                    return item;
                });
                num = rollbase.DiceINT(0, temp2.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp2[num]
                return temp || ' ';
            // * {allgp.title}<---隨機全GP其中一種稱號
            case /^server.member_count$/i.test(second):
                temp = await dbOperations.findGpMember(groupid);
                num = (temp && temp.length) ? Math.max(membercount, temp.length) : membercount;
                return num || ' ';
            //  {server.member_count} 現在頻道中總人數 \
            case /^my.RankingPer$/i.test(second): {
                //* {my.RankingPer} 現在排名百分比 \
                let gpMember = await dbOperations.findGpMember(groupid);
                temp2 = await dbOperations.ranking(userid, gpMember)
                if (!temp2) return ' ';
                num = (temp && gpMember.length) ? Math.max(membercount, gpMember.length) : membercount;
                temp2 = Math.ceil(temp2 / num * 10000) / 100 + '%';
                return temp2 || ' ';
            }
            case /^my.Ranking$/i.test(second): {
                let gpMember = await dbOperations.findGpMember(groupid);
                //* {my.Ranking} 顯示擲骰者現在排名 \
                if (!gpMember) return ' ';
                return await dbOperations.ranking(userid, gpMember) || ' ';
            }
            case /^my.exp$/i.test(second):
                //* {my.exp} 顯示擲骰者經驗值
                temp = await dbOperations.findGp(groupid);
                temp2 = await dbOperations.findUser(groupid, userid);
                if (!temp || !temp2 || !temp2.EXP) return ' ';
                return temp2.EXP || ' ';
            case /^my.name$/i.test(second):
                //* {my.name} <---顯示擲骰者名字
                return displaynameDiscord || displayname || "無名";
            case /^my.title$/i.test(second):
                // * {my.title}<---顯示擲骰者稱號
                temp = await dbOperations.findGp(groupid);
                temp2 = await dbOperations.findUser(groupid, userid);
                if (!temp || !temp2 || !temp2.Level || !temp.Title) return ' ';
                //   let userTitle = await this.checkTitle(userlevel, trpgLevelSystemfunction.trpgLevelSystemfunction[i].Title);
                return await exports.z_Level_system.checkTitle(temp2.Level, temp.Title) || ' ';
            case /^my.level$/i.test(second):
                //* {my.level}<---顯示擲骰者等級
                temp2 = await dbOperations.findUser(groupid, userid);
                if (!temp2 || !temp2.Level) return ' ';
                return temp2.Level || ' ';
            case /^br$/i.test(second):
                temp = '\n'
                return temp || ' ';
            default:
                break;
        }
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('db')
            .setDescription('【資料庫功能】 管理個人資料庫')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('help')
                    .setDescription('顯示資料庫功能說明'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增資料項目')
                    .addStringOption(option => 
                        option.setName('topic')
                            .setDescription('關鍵字')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('content')
                            .setDescription('內容')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示資料清單')
                    .addIntegerOption(option => 
                        option.setName('page')
                            .setDescription('頁碼')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('刪除指定標題')
                    .addStringOption(option => 
                        option.setName('topic')
                            .setDescription('要刪除的標題')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('get')
                    .setDescription('顯示資料內容')
                    .addStringOption(option => 
                        option.setName('topic')
                            .setDescription('關鍵字或編號')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            if (subcommand === 'help') {
                return '.db help';
            } else if (subcommand === 'add') {
                const topic = interaction.options.getString('topic');
                const content = interaction.options.getString('content');
                return `.db add ${topic} ${content}`;
            } else if (subcommand === 'show') {
                const page = interaction.options.getInteger('page');
                return page ? `.db show ${page}` : '.db show';
            } else if (subcommand === 'del') {
                const topic = interaction.options.getString('topic');
                return `.db del ${topic}`;
            } else if (subcommand === 'get') {
                const topic = interaction.options.getString('topic');
                return `.db ${topic}`;
            }
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('dbp')
            .setDescription('【全服資料庫功能】 管理全服資料庫')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('help')
                    .setDescription('顯示全服資料庫功能說明'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('新增全服資料項目')
                    .addStringOption(option => 
                        option.setName('topic')
                            .setDescription('關鍵字')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('content')
                            .setDescription('內容')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示全服資料清單')
                    .addIntegerOption(option => 
                        option.setName('page')
                            .setDescription('頁碼')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('del')
                    .setDescription('刪除指定全服標題')
                    .addStringOption(option => 
                        option.setName('topic')
                            .setDescription('要刪除的標題')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('get')
                    .setDescription('顯示全服資料內容')
                    .addStringOption(option => 
                        option.setName('topic')
                            .setDescription('關鍵字或編號')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            if (subcommand === 'help') {
                return '.dbp help';
            } else if (subcommand === 'add') {
                const topic = interaction.options.getString('topic');
                const content = interaction.options.getString('content');
                return `.dbp add ${topic} ${content}`;
            } else if (subcommand === 'show') {
                const page = interaction.options.getInteger('page');
                return page ? `.dbp show ${page}` : '.dbp show';
            } else if (subcommand === 'del') {
                const topic = interaction.options.getString('topic');
                return `.dbp del ${topic}`;
            } else if (subcommand === 'get') {
                const topic = interaction.options.getString('topic');
                return `.dbp ${topic}`;
            }
        }
    }
];

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    dbOperations,
    databaseOperations,
    discordCommand
};
