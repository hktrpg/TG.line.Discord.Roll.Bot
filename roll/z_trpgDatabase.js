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

// 常量定義
const CACHE_TTL = {
    GROUP_CONFIG: 300,  // 群組配置緩存5分鐘
    MEMBER_DATA: 60     // 成員數據緩存1分鐘
};

const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];

// 初始化緩存
const cache = new NodeCache({ stdTTL: CACHE_TTL.GROUP_CONFIG });

// 全局數據
let trpgDatabasefunction = {
    trpgDatabasefunction: null,
    trpgDatabaseAllgroup: null
};

// 初始化數據
records.get('trpgDatabase', (msgs) => {
    trpgDatabasefunction.trpgDatabasefunction = msgs;
});

records.get('trpgDatabaseAllgroup', (msgs) => {
    trpgDatabasefunction.trpgDatabaseAllgroup = msgs;
});

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
│ • .db del 編號/all
│   刪除指定/全部
│ • .db 關鍵字
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
        const [groupConfig, groupMembers, userInfo] = await Promise.all([
            schema.trpgLevelSystem.findOne({ groupid }),
            schema.trpgLevelSystemMember.find({ groupid }),
            schema.trpgLevelSystemMember.findOne({ groupid, userid })
        ]).catch(error => {
            console.error('Cache update error:', error);
            return [null, null, null];
        });

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
    },

    /**
     * 查找群組配置
     * @param {string} groupid 群組ID
     * @returns {Promise<Object>} 群組配置
     */
    async findGp(groupid) {
        if (!process.env.mongoURL || !groupid) return;

        const cacheKey = `group_config_${groupid}`;
        let config = cache.get(cacheKey);

        if (!config) {
            config = await schema.trpgLevelSystem.findOne({
                groupid: groupid,
                SwitchV2: 1
            }).catch(error => {
                console.error('db #430 mongoDB error:', error.name, error.reason);
                return null;
            });

            if (config) {
                cache.set(cacheKey, config, CACHE_TTL.GROUP_CONFIG);
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
        if (!process.env.mongoURL || !groupid) return;

        const cacheKey = `group_members_${groupid}`;
        let members = cache.get(cacheKey);

        if (!members) {
            members = await schema.trpgLevelSystemMember.find({
                groupid: groupid
            }).sort({ EXP: -1 }).catch(error => {
                console.error('db #443 mongoDB error:', error.name, error.reason);
                return null;
            });

            if (members) {
                cache.set(cacheKey, members, CACHE_TTL.MEMBER_DATA);
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
        if (!groupid || !userid) return;

        const cacheKey = `user_${groupid}_${userid}`;
        let user = cache.get(cacheKey);

        if (!user) {
            user = await schema.trpgLevelSystemMember.findOne({
                groupid: groupid,
                userid: userid
            }).catch(error => {
                console.error('db #454 mongoDB error:', error.name, error.reason);
                return null;
            });

            if (user) {
                cache.set(cacheKey, user, CACHE_TTL.MEMBER_DATA);
            }
        }

        return user;
    },

    /**
     * 計算用戶排名
     * @param {string} who 用戶ID
     * @param {Array} data 成員數據
     * @returns {Promise<string>} 排名
     */
    async ranking(who, data) {
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
 * 刪除群組所有數據
 * @param {string} groupid 群組ID
 * @returns {Promise<void>}
 */
async function deleteAllGroupData(groupid) {
    const groupData = trpgDatabasefunction.trpgDatabasefunction?.find(
        data => data.groupid === groupid
    );
    
    if (groupData) {
        groupData.trpgDatabasefunction = [];
        await new Promise((resolve) => {
            records.setTrpgDatabaseFunction('trpgDatabase', groupData, () => {
                records.get('trpgDatabase', (msgs) => {
                    trpgDatabasefunction.trpgDatabasefunction = msgs;
                    resolve();
                });
            });
        });
    }
}

/**
 * 刪除指定索引的數據
 * @param {string} groupid 群組ID
 * @param {number} index 索引
 * @returns {Promise<void>}
 */
async function deleteGroupDataByIndex(groupid, index) {
    const groupData = trpgDatabasefunction.trpgDatabasefunction?.find(
        data => data.groupid === groupid
    );
    
    if (groupData && index >= 0 && index < groupData.trpgDatabasefunction.length) {
        groupData.trpgDatabasefunction.splice(index, 1);
        await new Promise((resolve) => {
            records.setTrpgDatabaseFunction('trpgDatabase', groupData, () => {
                records.get('trpgDatabase', (msgs) => {
                    trpgDatabasefunction.trpgDatabasefunction = msgs;
                    resolve();
                });
            });
        });
    }
}

/**
 * 格式化數據庫列表
 * @param {Array} items 數據項列表
 * @returns {string} 格式化後的列表
 */
function formatDatabaseList(items) {
    if (!items || items.length === 0) {
        return '沒有已設定的關鍵字.';
    }
    
    return items.map((item, index) => 
        `${index % 2 === 0 ? '\n' : '       '}${index}: ${item.topic}`
    ).join('');
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
 * @returns {string} 格式化後的列表
 */
function formatGlobalDatabaseList(database) {
    if (!database || database.length === 0) {
        return '沒有已設定的關鍵字.';
    }

    return database.map(group => 
        group.trpgDatabaseAllgroup.map((item, index) => 
            `${index % 2 === 0 ? '\n' : '      '}${index}: ${item.topic}`
        ).join('')
    ).join('');
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

/**
 * 更新全服數據庫
 * @returns {Promise<void>}
 */
async function updateGlobalDatabase() {
    await new Promise((resolve) => {
        records.get('trpgDatabaseAllgroup', (msgs) => {
            trpgDatabasefunction.trpgDatabaseAllgroup = msgs;
            resolve();
        });
    });
}

// eslint-disable-next-line no-unused-vars
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
            if (!mainMsg[2]) rply.text += ' 沒有輸入標題。\n\n';
            if (!mainMsg[3]) rply.text += ' 沒有輸入內容。\n\n';
            
            // 檢查權限
            if (rply.text += checkPermission({ groupid, userrole })) {
                return rply;
            }

            // 獲取VIP等級和限制
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = FUNCTION_LIMIT[lv];

            // 檢查群組數據庫
            const groupData = trpgDatabasefunction.trpgDatabasefunction?.find(
                data => data.groupid === groupid
            );

            // 檢查是否達到上限
            if (isGroupDatabaseFull(groupData, limit)) {
                rply.text = `關鍵字上限${limit}個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n`;
                return rply;
            }

            // 檢查關鍵字是否重複
            if (isTopicExists(groupData, mainMsg[2])) {
                rply.text = '新增失敗. 重複標題';
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
                records.get('trpgDatabase', (msgs) => {
                    trpgDatabasefunction.trpgDatabasefunction = msgs;
                });
            });

            rply.text = '新增成功: ' + mainMsg[2];
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]): {
            // 檢查權限
            if (rply.text = checkPermission({ groupid, userrole })) {
                return rply;
            }

            // 刪除所有數據
            await deleteAllGroupData(groupid);
            rply.text = '刪除所有關鍵字';
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]): {
            // 驗證輸入
            if (!mainMsg[2]) rply.text += '沒有關鍵字. \n\n';
            
            // 檢查權限
            if (rply.text += checkPermission({ groupid, userrole })) {
                return rply;
            }

            // 刪除指定索引的數據
            await deleteGroupDataByIndex(groupid, parseInt(mainMsg[2]));
            rply.text = '刪除成功: ' + mainMsg[2];
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            // 更新數據
            await new Promise((resolve) => {
                records.get('trpgDatabase', (msgs) => {
                    trpgDatabasefunction.trpgDatabasefunction = msgs;
                    resolve();
                });
            });

            // 檢查群組
            if (!groupid) {
                rply.text = '不在群組.';
                return rply;
            }

            // 獲取群組數據
            const groupData = trpgDatabasefunction.trpgDatabasefunction?.find(
                data => data.groupid === groupid
            );

            // 格式化並顯示列表
            rply.text = '資料庫列表:' + formatDatabaseList(groupData?.trpgDatabasefunction);
            rply.quotes = true;
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            // 檢查群組
            if (!groupid) {
                rply.text = '不在群組.';
                return rply;
            }

            // 查找關鍵字內容
            const content = findTopicContent(trpgDatabasefunction.trpgDatabasefunction, mainMsg[1]);
            
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
                rply.text = '新增失敗. 沒有關鍵字.';
                return rply;
            }
            if (!mainMsg[3]) {
                rply.text = '新增失敗. 沒有內容.';
                return rply;
            }

            // 更新數據庫
            await updateGlobalDatabase();

            // 檢查是否達到上限
            if (isGlobalDatabaseFull(trpgDatabasefunction.trpgDatabaseAllgroup)) {
                rply.text = '只可以有100個關鍵字啊';
                return rply;
            }

            // 檢查關鍵字是否重複
            if (isGlobalTopicExists(trpgDatabasefunction.trpgDatabaseAllgroup, mainMsg[2])) {
                rply.text = '新增失敗. 重複關鍵字';
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
                records.get('trpgDatabaseAllgroup', (msgs) => {
                    trpgDatabasefunction.trpgDatabaseAllgroup = msgs;
                });
            });

            rply.text = '新增成功: ' + mainMsg[2];
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            // 更新數據庫
            await updateGlobalDatabase();

            // 格式化並顯示列表
            rply.text = '資料庫列表:' + formatGlobalDatabaseList(trpgDatabasefunction.trpgDatabaseAllgroup);
            rply.quotes = true;
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            // 更新數據庫
            await updateGlobalDatabase();

            // 查找關鍵字內容
            const content = findGlobalTopicContent(trpgDatabasefunction.trpgDatabaseAllgroup, mainMsg[1]);
            
            if (content) {
                rply.text = `【${content.topic}】\n${content.contact}`;
            } else {
                rply.text = '沒有相關關鍵字.';
            }

            // 處理特殊標記
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
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

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName,
    dbOperations
};