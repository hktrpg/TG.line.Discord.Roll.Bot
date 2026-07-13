"use strict";
if (!process.env.mongoURL) {
    return;
}

// 導入依賴
const { SlashCommandBuilder } = require('discord.js');
const records = require('../modules/records.js');
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
const VIP = require('../modules/veryImportantPerson.js');
const rollbase = require('./rollbase.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');

// 常量定義
const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];

/**
 * 數據庫操作相關函數
 */
const dbOperations = {
    /**
     * 查找群組配置
     */
    async findGp(groupid) {
        if (!process.env.mongoURL || !groupid) return null;
        try {
            const config = await schema.trpgLevelSystem.findOne({
                groupid: groupid,
                SwitchV2: 1
            });
            return config;
        } catch (error) {
            console.error('Find group config error:', error);
            return null;
        }
    },

    /**
     * 查找群組成員
     */
    async findGpMember(groupid) {
        if (!process.env.mongoURL || !groupid) return null;
        try {
            const members = await schema.trpgLevelSystemMember.find({
                groupid: groupid
            }).sort({ EXP: -1 });
            return members;
        } catch (error) {
            console.error('Find group members error:', error);
            return null;
        }
    },

    /**
     * 查找用戶信息
     */
    async findUser(groupid, userid) {
        if (!groupid || !userid) return null;
        try {
            const user = await schema.trpgLevelSystemMember.findOne({
                groupid: groupid,
                userid: userid
            });
            return user;
        } catch (error) {
            console.error('Find user error:', error);
            return null;
        }
    },

    /**
     * 計算用戶排名
     */
    ranking(who, data) {
        if (!data || !Array.isArray(data)) return "0";
        const memberMap = new Map(data.map((member, index) => [member.userid, index + 1]));
        return memberMap.get(who) || "0";
    }
};

/**
 * 數據庫操作相關函數
 */
const databaseOperations = {
    /**
     * 按需獲取群組數據庫
     */
    async getGroupDatabase() {
        try {
            const database = await records.get('trpgDatabase');
            return database;
        } catch (error) {
            console.error('Get group database error:', error);
            return null;
        }
    },

    /**
     * 按需獲取全服數據庫
     */
    async getGlobalDatabase() {
        try {
            const database = await records.get('trpgDatabaseAllgroup');
            return database;
        } catch (error) {
            console.error('Get global database error:', error);
            return null;
        }
    },

    /**
     * 刪除群組所有數據
     */
    async deleteAllGroupData(groupid) {
        try {
            const database = await this.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            if (groupData) {
                groupData.trpgDatabasefunction = [];
                await records.setTrpgDatabaseFunction('trpgDatabase', groupData);
            }
        } catch (error) {
            console.error('Delete all group data error:', error);
        }
    },

    /**
     * 刪除指定索引的數據
     */
    async deleteGroupDataByIndex(groupid, index) {
        try {
            const database = await this.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            if (groupData && index >= 0 && index < groupData.trpgDatabasefunction.length) {
                groupData.trpgDatabasefunction.splice(index, 1);
                await records.setTrpgDatabaseFunction('trpgDatabase', groupData);
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
const gameName = (params = {}) => resolveGameName(params, 'trpgdb.game_name', '【資料庫功能】 .db(p) (add del show 自定關鍵字)');

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
const getHelpMessage = async (params = {}) => {
    return resolveHelp(params, 'trpgdb.help', () => getT({ locale: 'zh-tw' })('trpgdb.help'));
};

/**
 * 初始化功能
 * @returns {Object} 功能配置
 */
const initialize = () => ({});

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
        locale: params.locale,
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
function formatDatabaseList(items, page = 1, pageSize = 20, translate) {
    const t = translate || getT({});
    if (!items || items.length === 0) {
        return t('trpgdb.list_empty') + t('trpgdb.usage_footer');
    }

    const totalPages = Math.ceil(items.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, items.length);
    const currentItems = items.slice(startIndex, endIndex);

    let output = t('trpgdb.list_header', { page, total: totalPages });

    for (let i = 0; i < currentItems.length; i += 2) {
        const item1 = currentItems[i];
        const item2 = currentItems[i + 1];
        const globalIndex1 = startIndex + i;
        const globalIndex2 = startIndex + i + 1;

        const padding1 = (globalIndex1 + 1).toString().padStart(2, '0');
        const topic1 = item1.topic.length > 12 ? item1.topic.slice(0, 12) + '...' : item1.topic;

        if (item2) {
            const padding2 = (globalIndex2 + 1).toString().padStart(2, '0');
            const topic2 = item2.topic.length > 12 ? item2.topic.slice(0, 12) + '...' : item2.topic;
            output += t('trpgdb.list_row_pair', {
                i1: padding1,
                t1: topic1.padEnd(15),
                i2: padding2,
                t2: topic2
            });
        } else {
            output += t('trpgdb.list_row_single', { i: padding1, topic: topic1 });
        }
    }

    output += t('trpgdb.list_footer', { count: items.length });
    output += t('trpgdb.usage_footer');
    output += '\n\n';
    output += t('trpgdb.list_special_tags');

    if (totalPages > 1) {
        output += t('trpgdb.list_next_page', { page: page + 1 });
    }

    return output;
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
function formatGlobalDatabaseList(database, page = 1, pageSize = 20, translate) {
    const t = translate || getT({});
    if (!database || database.length === 0) {
        return t('trpgdb.list_empty').trimEnd();
    }

    const allItems = database.reduce((acc, group) => {
        if (group.trpgDatabaseAllgroup) {
            acc.push(...group.trpgDatabaseAllgroup);
        }
        return acc;
    }, []);

    if (allItems.length === 0) {
        return t('trpgdb.list_empty').trimEnd();
    }

    const totalPages = Math.ceil(allItems.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, allItems.length);
    const currentItems = allItems.slice(startIndex, endIndex);

    let output = t('trpgdb.global_list_header', { page, total: totalPages });

    for (let i = 0; i < currentItems.length; i += 2) {
        const item1 = currentItems[i];
        const item2 = currentItems[i + 1];
        const globalIndex1 = startIndex + i;
        const globalIndex2 = startIndex + i + 1;

        const padding1 = (globalIndex1 + 1).toString().padStart(2, '0');
        const topic1 = item1.topic.length > 12 ? item1.topic.slice(0, 12) + '...' : item1.topic;

        if (item2) {
            const padding2 = (globalIndex2 + 1).toString().padStart(2, '0');
            const topic2 = item2.topic.length > 12 ? item2.topic.slice(0, 12) + '...' : item2.topic;
            output += t('trpgdb.list_row_pair', {
                i1: padding1,
                t1: topic1.padEnd(15),
                i2: padding2,
                t2: topic2
            });
        } else {
            output += t('trpgdb.list_row_single', { i: padding1, topic: topic1 });
        }
    }

    output += t('trpgdb.list_footer', { count: allItems.length });
    output += t('trpgdb.global_usage_footer');

    if (totalPages > 1) {
        output += t('trpgdb.global_list_next_page', { page: page + 1 });
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
    membercount,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    let lv;
    let limit = FUNCTION_LIMIT[0];
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;

        // .DB(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]db$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            // 驗證輸入
            if (!groupid) {
                rply.text = translate('trpgdb.not_in_group');
                return rply;
            }
            if (!mainMsg[2]) rply.text += translate('trpgdb.no_title');
            if (!mainMsg[3]) rply.text += translate('trpgdb.no_content');

            // 檢查權限
            rply.text += checkPermission({ groupid, userrole });
            if (rply.text) {
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
                rply.text = translate('trpgdb.limit_reached', { limit });
                rply.text += translate('trpgdb.usage_footer');
                return rply;
            }

            // 檢查關鍵字是否重複
            if (isTopicExists(groupData, mainMsg[2])) {
                rply.text = translate('trpgdb.duplicate_title');
                rply.text += translate('trpgdb.usage_footer');
                return rply;
            }

            // 創建新條目
            const content = inputStr
                .replace(/\.db\s+add\s+/i, '')
                .replace(mainMsg[2], '')
                .replace(/^\s+/, '');

            const newEntry = createDatabaseEntry(groupid, mainMsg[2], content);

            // 保存到數據庫
            await records.pushTrpgDatabaseFunction('trpgDatabase', newEntry);

            // 獲取當前索引
            const currentIndex = (groupData?.trpgDatabasefunction?.length || 0) + 1;

            rply.text = translate('trpgdb.add_success', { title: mainMsg[2] });
            rply.text += translate('trpgdb.add_success_view', {
                index: currentIndex,
                title: mainMsg[2]
            });
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]): {
            // 驗證輸入
            if (!groupid) {
                rply.text = translate('trpgdb.not_in_group');
                return rply;
            }
            if (!mainMsg[2]) {
                rply.text = translate('trpgdb.delete_specify');
                rply.text += translate('trpgdb.delete_del_hint');
                return rply;
            }

            // 檢查權限
            rply.text += checkPermission({ groupid, userrole });
            if (rply.text) {
                return rply;
            }

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            let targetIndex = -1;
            let targetTopic = '';

            // 檢查是否為數字編號
            if (/^\d+$/.test(mainMsg[2])) {
                const numberIndex = Number.parseInt(mainMsg[2]) - 1;
                if (groupData?.trpgDatabasefunction && numberIndex >= 0 && numberIndex < groupData.trpgDatabasefunction.length) {
                    targetIndex = numberIndex;
                    targetTopic = groupData.trpgDatabasefunction[numberIndex].topic;
                }
            } else {
                // 查找要刪除的項目（按標題）
                targetIndex = groupData?.trpgDatabasefunction?.findIndex(
                    item => item.topic.toLowerCase() === mainMsg[2].toLowerCase()
                );
                if (targetIndex !== -1 && groupData?.trpgDatabasefunction?.[targetIndex]) {
                    targetTopic = groupData.trpgDatabasefunction[targetIndex].topic;
                }
            }

            if (targetIndex === -1) {
                rply.text = translate('trpgdb.not_found_title', { title: mainMsg[2] });
                rply.text += translate('trpgdb.delete_del_hint');
                return rply;
            }

            // 刪除指定索引的數據
            await databaseOperations.deleteGroupDataByIndex(groupid, targetIndex);

            rply.text = translate('trpgdb.deleted', { title: targetTopic });
            rply.text += translate('trpgdb.delete_after_hint');
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = translate('trpgdb.not_in_group');
                return rply;
            }
            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 如果有標題參數,搜索並顯示該標題的內容
            if (mainMsg[2] && !/^\d+$/.test(mainMsg[2])) {
                const content = groupData?.trpgDatabasefunction?.find(
                    item => item.topic.toLowerCase() === mainMsg[2].toLowerCase()
                );
                if (content) {
                    rply.text = `【${content.topic}】\n${content.contact}`;
                    // 處理特殊標記
                    rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
                    return rply;
                } else {
                    rply.text = translate('trpgdb.not_found_keyword');
                    return rply;
                }
            }

            // 獲取頁碼
            const page = Number.parseInt(mainMsg[2]) || 1;

            // 格式化並顯示列表
            rply.text = formatDatabaseList(groupData?.trpgDatabasefunction, page, 20, translate);
            rply.quotes = true;
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^\d+$/i.test(mainMsg[1]): {
            // 檢查群組
            if (!groupid) {
                rply.text = translate('trpgdb.not_in_group_short');
                return rply;
            }

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 獲取指定索引的內容
            const index = Number.parseInt(mainMsg[1]) - 1;
            if (groupData?.trpgDatabasefunction && index >= 0 && index < groupData.trpgDatabasefunction.length) {
                const content = groupData.trpgDatabasefunction[index];
                rply.text = `【${content.topic}】\n${content.contact}`;
                // 處理特殊標記
                rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            } else {
                rply.text = translate('trpgdb.not_found_index');
            }
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            // 檢查群組
            if (!groupid) {
                rply.text = translate('trpgdb.not_in_group_short') + '.';
                return rply;
            }

            // 獲取群組數據庫
            const database = await databaseOperations.getGroupDatabase();
            const groupData = database?.find(data => data.groupid === groupid);

            // 查找關鍵字內容（僅限當前群組）
            const content = groupData?.trpgDatabasefunction?.find(
                item => item.topic.toLowerCase() === mainMsg[1].toLowerCase()
            );

            if (content) {
                rply.text = `【${content.topic}】\n${content.contact}`;
            } else {
                rply.text = translate('trpgdb.not_found_keyword') + '.';
            }

            // 處理特殊標記
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            // 驗證輸入
            if (!mainMsg[2]) {
                rply.text = translate('trpgdb.global_no_topic');
                return rply;
            }
            if (!mainMsg[3]) {
                rply.text = translate('trpgdb.global_no_content');
                return rply;
            }

            // 獲取全服數據庫
            const database = await databaseOperations.getGlobalDatabase();

            // 檢查是否達到上限
            if (isGlobalDatabaseFull(database)) {
                rply.text = translate('trpgdb.global_limit');
                return rply;
            }

            // 檢查關鍵字是否重複
            if (isGlobalTopicExists(database, mainMsg[2])) {
                rply.text = translate('trpgdb.global_duplicate');
                return rply;
            }

            // 創建新條目
            const content = inputStr
                .replace(/\.dbp add /i, '')
                .replace(mainMsg[2], '')
                .replace(/^\s+/, '');

            const newEntry = createGlobalDatabaseEntry(mainMsg[2], content);

            // 保存到數據庫
            await records.pushTrpgDatabaseAllGroup('trpgDatabaseAllgroup', newEntry);

            // 獲取當前索引
            const allItems = database.reduce((acc, group) => {
                if (group.trpgDatabaseAllgroup) {
                    acc.push(...group.trpgDatabaseAllgroup);
                }
                return acc;
            }, []);
            const currentIndex = allItems.length + 1;

            rply.text = translate('trpgdb.global_add_success', { title: mainMsg[2] });
            rply.text += translate('trpgdb.global_add_hints', {
                index: currentIndex,
                title: mainMsg[2]
            });
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
                    rply.text = translate('trpgdb.not_found_keyword');
                    return rply;
                }
            }

            // 獲取頁碼
            const page = Number.parseInt(mainMsg[2]) || 1;

            // 格式化並顯示列表
            rply.text = formatGlobalDatabaseList(database, page, 20, translate);
            rply.quotes = true;
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {

            // 獲取全服數據庫
            const database = await databaseOperations.getGlobalDatabase();

            // 檢查是否為數字編號
            if (/^\d+$/.test(mainMsg[1])) {
                const numberIndex = Number.parseInt(mainMsg[1]) - 1;
                const allItems = database.reduce((acc, group) => {
                    if (group.trpgDatabaseAllgroup) {
                        acc.push(...group.trpgDatabaseAllgroup);
                    }
                    return acc;
                }, []);

                if (numberIndex >= 0 && numberIndex < allItems.length) {
                    const content = allItems[numberIndex];
                    rply.text = `【${content.topic}】\n${content.contact}`;
                } else {
                    rply.text = translate('trpgdb.not_found_index');
                }
            } else {
                // 查找關鍵字內容
                const content = findGlobalTopicContent(database, mainMsg[1]);

                if (content) {
                    rply.text = `【${content.topic}】\n${content.contact}`;
                } else {
                    rply.text = translate('trpgdb.not_found_keyword') + '.';
                }
            }

            // 處理特殊標記
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
        }
        // case /(^[.]dbp$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]): {
        //     // 驗證輸入
        //     if (!mainMsg[2]) {
        //         rply.text = '❌ 請指定要刪除的標題或編號\n\n';
        //         rply.text += `💡 使用方式:\n`;
        //         rply.text += `• 刪除項目: .dbp del 標題\n`;
        //         rply.text += `• 刪除編號: .dbp del 編號\n`;
        //         rply.text += `• 查看列表: .dbp show\n`;
        //         rply.text += `• 新增項目: .dbp add 標題 內容`;
        //         return rply;
        //     }

        //     // 獲取全服數據庫
        //     const database = await databaseOperations.getGlobalDatabase();

        //     let foundGroup = null;
        //     let foundIndex = -1;
        //     let targetTopic = '';

        //     // 檢查是否為數字編號
        //     if (/^\d+$/.test(mainMsg[2])) {
        //         const numberIndex = Number.parseInt(mainMsg[2]) - 1;
        //         const allItems = database.reduce((acc, group) => {
        //             if (group.trpgDatabaseAllgroup) {
        //                 acc.push(...group.trpgDatabaseAllgroup);
        //             }
        //             return acc;
        //         }, []);

        //         if (numberIndex >= 0 && numberIndex < allItems.length) {
        //             targetTopic = allItems[numberIndex].topic;
        //             // 找到對應的群組和索引
        //             for (const group of database) {
        //                 const index = group.trpgDatabaseAllgroup?.findIndex(
        //                     item => item.topic === targetTopic
        //                 );
        //                 if (index !== -1) {
        //                     foundGroup = group;
        //                     foundIndex = index;
        //                     break;
        //                 }
        //             }
        //         }
        //     } else {
        //         // 查找要刪除的項目（按標題）
        //         for (const group of database) {
        //             const index = group.trpgDatabaseAllgroup?.findIndex(
        //                 item => item.topic.toLowerCase() === mainMsg[2].toLowerCase()
        //             );
        //             if (index !== -1) {
        //                 foundGroup = group;
        //                 foundIndex = index;
        //                 targetTopic = group.trpgDatabaseAllgroup[index].topic;
        //                 break;
        //             }
        //         }
        //     }

        //     if (foundIndex === -1) {
        //         rply.text = `❌ 找不到標題為 "${mainMsg[2]}" 的項目\n\n`;
        //         rply.text += `💡 使用方式:\n`;
        //         rply.text += `• 刪除項目: .dbp del 標題\n`;
        //         rply.text += `• 刪除編號: .dbp del 編號\n`;
        //         rply.text += `• 查看列表: .dbp show\n`;
        //         rply.text += `• 新增項目: .dbp add 標題 內容`;
        //         return rply;
        //     }

        //     // 刪除指定標題的數據
        //     foundGroup.trpgDatabaseAllgroup.splice(foundIndex, 1);
        //     await new Promise((resolve) => {
        //         records.setTrpgDatabaseAllGroup('trpgDatabaseAllgroup', foundGroup, () => {
        //             resolve();
        //         });
        //     });

        //     rply.text = `🗑️ 已刪除標題為 "${targetTopic}" 的項目\n\n`;
        //     rply.text += `💡 使用方式:\n`;
        //     rply.text += `• 查看列表: .dbp show\n`;
        //     rply.text += `• 新增項目: .dbp add 標題 內容\n`;
        //     rply.text += `• 刪除項目: .dbp del 標題/編號`;
        //     return rply;
        // }
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
                if (temp.Title.length === 0) {
                    temp.Title = exports.z_Level_system.Title();
                }
                temp2 = await temp.Title.filter(Boolean);
                num = rollbase.DiceINT(0, temp2.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp2[num]
                return temp || ' ';
            // * {allgp.title}<---隨機全GP其中一種稱號
            case /^server.member_count$/i.test(second):
                temp = await dbOperations.findGpMember(groupid);
                num = (temp && temp.length > 0) ? Math.max(membercount, temp.length) : membercount;
                return num || ' ';
            //  {server.member_count} 現在頻道中總人數 \
            case /^my.RankingPer$/i.test(second): {
                //* {my.RankingPer} 現在排名百分比 \
                let gpMember = await dbOperations.findGpMember(groupid);
                temp2 = await dbOperations.ranking(userid, gpMember)
                if (!temp2) return ' ';
                num = (temp && gpMember.length > 0) ? Math.max(membercount, gpMember.length) : membercount;
                temp2 = Math.ceil(temp2 / num * 10_000) / 100 + '%';
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
                return displaynameDiscord || displayname || translate('trpgdb.unnamed');
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

            switch (subcommand) {
                case 'help': {
                    return '.db help';
                }
                case 'add': {
                    const topic = interaction.options.getString('topic');
                    const content = interaction.options.getString('content');
                    return `.db add ${topic} ${content}`;
                }
                case 'show': {
                    const page = interaction.options.getInteger('page');
                    return page ? `.db show ${page}` : '.db show';
                }
                case 'del': {
                    const topic = interaction.options.getString('topic');
                    return `.db del ${topic}`;
                }
                case 'get': {
                    const topic = interaction.options.getString('topic');
                    return `.db ${topic}`;
                }
                // No default
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
            // .addSubcommand(subcommand =>
            //     subcommand
            //         .setName('del')
            //         .setDescription('刪除指定全服標題')
            //         .addStringOption(option =>
            //             option.setName('topic')
            //                 .setDescription('要刪除的標題')
            //                 .setRequired(true)))
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

            switch (subcommand) {
                case 'help': {
                    return '.dbp help';
                }
                case 'add': {
                    const topic = interaction.options.getString('topic');
                    const content = interaction.options.getString('content');
                    return `.dbp add ${topic} ${content}`;
                }
                case 'show': {
                    const page = interaction.options.getInteger('page');
                    return page ? `.dbp show ${page}` : '.dbp show';
                }
                // case 'del': {
                //     const topic = interaction.options.getString('topic');
                //     return `.dbp del ${topic}`;
                // }
                case 'get': {
                    const topic = interaction.options.getString('topic');
                    return `.dbp ${topic}`;
                }
                // No default
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