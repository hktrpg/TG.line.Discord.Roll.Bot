// Reference
//https://github.com/cookkkie/mee6
"use strict";
if (!process.env.mongoURL) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const checkMongodb = require('../modules/dbWatchdog.js');
const checkTools = require('../modules/check.js');
const tempSwitchV2 = require('../modules/level');
const schema = require('../modules/schema.js');
const DEFAULT_RANK_WORD = "{user.displayName}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點！\n現在排名是{server.member_count}人中的第{user.Ranking}名！{user.RankingPer}！\n調查經驗是{user.exp}點。 "
const DEFAULT_LEVEL_UP_WORD = "恭喜 {user.displayName}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！"

const gameName = function () {
    return '【經驗值功能】 .level (show config LevelUpWord RankWord)'
}
const gameType = function () {
    return 'funny:trpgLevelSystem:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]level$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【⭐經驗值系統】
╭──── 📝系統簡介 ────
│ • 基於Mee6設計的經驗系統
│ • 發言可獲得經驗值提升等級
│ • 支援排名、稱號、自訂通知
│
├──── ⚙️基本設定 ────
│ • .level config 11
│   開啟並顯示升級通知
│ • .level config 10
│   開啟但不顯示通知
│ • .level config 00
│   關閉經驗值功能
│
├──── 📊等級查詢 ────
│ • .level show
│   查詢自己現在等級
│ • .level showMe [數字]
│   查詢群組排名(預設前5名)
│ • .level showMeTheworld [數字]
│   查詢世界排名(預設前6名)
│ • .level showMeAtTheworld
│   查詢自己的世界排名
│
├──── ✨自訂系統 ────
│ ■ 升級通知及回應:
│ • .level LevelUpWord [內容]
│   設定升級通知文字
│ • .level RankWord [內容]
│   設定查詢回應文字
│ • 加上del使用預設文字
│ • 加上show顯示目前設定
│
│ ■ 稱號設定:
│ • .level TitleWord -[LV] [稱號]
│   設定達到等級後的稱號
│   例: -0 無名調查員 -5 調查員 -10 記者
│
├──── 💬升級語及RankWord支援代碼 ────
│ • {user.name} 使用者名稱
│ • {user.displayName} 群暱稱
│ • {user.level} 當前等級
│ • {user.title} 當前稱號
│ • {user.exp} 累積經驗值 
│ • {user.Ranking} 目前排名
│ • {user.RankingPer} 排名比例
│ • {server.member_count} 總人數
├──── 📋預設回應範例 ────
│ {user.displayName}《{user.title}》，
│ 你的克蘇魯神話知識現在是 {user.level}點！
│ 現在排名是{server.member_count}人中的
│ 第{user.Ranking}名！{user.RankingPer}！
│ 調查經驗是{user.exp}點。
╰──────────────`
}
const initialize = function () {
    return;
}
const checkTitle = async function (userlvl, DBTitle) {
    let templvl = 0;
    let temptitle = ""
    if (DBTitle && DBTitle.length > 0) {
        for (let g = 0; g < DBTitle.length; g++) {
            if (userlvl >= g) {
                if (templvl <= g && DBTitle[g]) {
                    templvl = g
                    temptitle = DBTitle[g];
                }
            }
        }
    }
    if (!temptitle)
        for (let g = 0; g < Title().length; g++) {
            if (userlvl >= g) {
                if (templvl <= g && Title()[g]) {
                    templvl = g
                    temptitle = Title()[g];
                }
            }
        }
    return temptitle;
}

async function buildWordPreview(templateWord, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage }) {
    const docMember = await schema.trpgLevelSystemMember.find({ groupid }).sort({ EXP: -1 }).lean()
        .catch(error => { console.error('buildWordPreview mongoDB error:', error.name, error.reason); return null; });
    if (!docMember) return null;
    const myselfIndex = docMember.findIndex(m => m.userid === userid.toString());
    if (myselfIndex === -1) return null;
    const username = tgDisplayname || displaynameDiscord || displayname || '無名';
    const userlevel = docMember[myselfIndex].Level;
    const userexp = docMember[myselfIndex].EXP;
    const usermember_count = Math.max(membercount, docMember.length);
    const userRanking = myselfIndex + 1;
    const userRankingPer = Math.ceil(userRanking / usermember_count * 10_000) / 100 + '%';
    const userTitle = await checkTitle(userlevel, doc?.Title || []);
    let preview = templateWord
        .replaceAll(/{user.name}/ig, username)
        .replaceAll(/{user.level}/ig, userlevel)
        .replaceAll(/{user.exp}/ig, userexp)
        .replaceAll(/{user.Ranking}/ig, userRanking)
        .replaceAll(/{user.RankingPer}/ig, userRankingPer)
        .replaceAll(/{server.member_count}/ig, usermember_count)
        .replaceAll(/{user.title}/ig, userTitle);
    if (/{user.displayName}/ig.test(preview)) {
        const userDisplayName = getDisplayName(discordMessage) || username || '無名';
        preview = preview.replaceAll(/{user.displayName}/ig, userDisplayName);
    }
    return preview;
}

const Title = function () {
    let Title = []
    Title[0] = "無名調查員";
    Title[3] = "雀";
    Title[4] = "調查員";
    Title[8] = "記者";
    Title[11] = "偵探";
    Title[13] = "小熊";
    Title[14] = "考古家";
    Title[18] = "神秘學家";
    Title[21] = "狂信徒";
    Title[24] = "教主";
    Title[28] = "眷族";
    Title[31] = "眷族首領";
    Title[33] = "南";
    Title[34] = "化身";
    Title[38] = "舊神";
    Title[41] = "舊日支配者";
    Title[43] = "門";
    Title[44] = "外神";
    Title[48] = "KP";
    Title[53] = "東";
    Title[54] = "作者";
    return Title;
}

/*
    稱號
    0-3     無名調查員
    4-7     調查員
    8-10    記者    
    11-13   偵探
    14-17   考古家
    18-20   神秘學家
    21-23   狂信徒
    24-27   教主
    28-30   眷族
    31-33   眷族首領
    34-37   化身
    38-40   舊神
    41-43   舊日支配者
    44-47   外神
    48-50   門
    */
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    displaynameDiscord,
    tgDisplayname,
    discordMessage,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            if (botname == "Line")
                rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
            return rply;
        // .level(0) LevelUpWord(1) TOPIC(2) CONTACT(3)

        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('[Level System] MongoDB error:', error.name, error.reason));

            // Question: If there's no GP, can it be deleted?
            if (!doc || doc.Title.length === 0) {
                rply.text = "刪除稱號成功。現改回使用預設稱號。"
                return rply
            }
            doc.Title = [];
            await doc.save();
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = "刪除稱號成功。現改回使用預設稱號。"
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '查詢失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('[Level System] MongoDB error:', error.name, error.reason));
            if (!doc || doc.Title.length === 0) {
                rply.text = "正在使用預設稱號。"
                return rply
            }
            rply.text = '稱號:\n'
            for (let te = 0; te < doc.Title.length; te++) {
                if (doc.Title[te]) {
                    rply.text += `${[te]}等級: ` + doc.Title[te] + "\n"
                }
            }
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]): {
            //
            // Title
            //
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            // Check if there's any input to process
            if (!mainMsg[2]) {
                rply.text = '請提供稱號設定，格式為 \n.level TitleWord -(等級) (稱號).\n例如: -0 無名調查員 -5 調查員 -10 記者';
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('[Level System] MongoDB error:', error.name, error.reason));

            // Add null check for doc before accessing doc.Title
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                });
            }

            let temprply = setNew(inputStr, doc.Title || [])

            if (temprply.length === 0) {
                rply.text = '新增失敗。 未有稱號輸入，格式為 \n.level TitleWord -(等級) (稱號).'
                return rply
            }
            await schema.trpgLevelSystem.updateOne({
                groupid: groupid
            }, {
                $set: {
                    "Title": temprply
                }
            }).catch(error => console.error('[Level System] MongoDB error:', error.name, error.reason ?? error.message));
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = '新增稱號成功: \n'
            for (let te = 0; te < temprply.length; te++) {
                if (temprply[te])
                    rply.text += [te] + '等級: ' + temprply[te] + '\n'
            }
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #242 mongoDB error:', error.name, error.reason));
            const levelUpTemplate = doc?.LevelUpWord || DEFAULT_LEVEL_UP_WORD;
            const levelUpLabel = doc?.LevelUpWord ? '現在升級語:' : '正在使用預設升級語:';
            rply.text = `${levelUpLabel}\n${levelUpTemplate}`;
            const levelUpPreview = await buildWordPreview(levelUpTemplate, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage });
            if (levelUpPreview) rply.text += '\n\n【實際效果預覽】\n' + levelUpPreview;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #262 mongoDB error:', error.name, error.reason));
            
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                });
            }
            
            doc.LevelUpWord = "";
            await doc.save().catch(error => console.error('level_system #264 mongoDB error:', error.name, error.reason ?? error.message));
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = "刪除升級語成功."
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            // Check if there's any input to process
            if (!mainMsg[2]) {
                rply.text = '請提供升級通知文字，格式為 \n.level LevelUpWord [內容]\n可使用的關鍵字有: {user.name}, {user.displayName}, {user.level}, {user.title}, {user.exp}, {user.Ranking}, {user.RankingPer}, {server.member_count}';
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #280 mongoDB error:', error.name, error.reason));
            
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                });
            }
            
            doc.LevelUpWord = inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            await doc.save().catch(error => console.error('level_system #282 mongoDB error:', error.name, error.reason ?? error.message));
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = "新增升級語成功.\n" + inputStr.replace(/\s?.*\s+\w+\s+/i, '');

            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '新增失敗。你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #294 mongoDB error:', error.name, error.reason));
            const rankTemplate = doc?.RankWord || DEFAULT_RANK_WORD;
            const rankLabel = doc?.RankWord ? '現在查詢語:' : '正在使用預設查詢語:';
            rply.text = `${rankLabel}\n${rankTemplate}`;
            const rankPreview = await buildWordPreview(rankTemplate, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage });
            if (rankPreview) rply.text += '\n\n【實際效果預覽】\n' + rankPreview;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #314 mongoDB error:', error.name, error.reason));
            
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                });
            }
            
            doc.RankWord = "";
            await doc.save();
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = "刪除查詢語成功."
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            // Check if there's any input to process
            if (!mainMsg[2]) {
                rply.text = '請提供查詢回應文字，格式為 \n.level RankWord [內容]\n可使用的關鍵字有: {user.name}, {user.displayName}, {user.level}, {user.title}, {user.exp}, {user.Ranking}, {user.RankingPer}, {server.member_count}';
                return rply;
            }

            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #332 mongoDB error:', error.name, error.reason));
            
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                });
            }
            
            doc.RankWord = inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            await doc.save();
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = "新增查詢語成功.\n" + inputStr.replace(/\s?.*\s+\w+\s+/i, '');
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = '你不在群組當中，請在群組中使用。'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #345 mongoDB error:', error.name, error.reason));
            rply.text = '現在設定: ' + '\n經驗值功能: ';
            rply.text += (doc && doc.SwitchV2) ? '啟動\n升級通知功能: ' : '關閉\n升級通知功能: ';
            rply.text += (doc && doc.HiddenV2) ? '啟動' : '關閉';
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            if (!mainMsg[2]) {
                rply.text = '修改失敗。沒有設定onoff\n';
                rply.text += '\nconfig 11 代表啓動功能 \
                \n 數字11代表等級升級時會進行升級通知，10代表不會自動進行升級通知，\
                \n 00的話代表不啓動功能\n'
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).catch(error => console.error('level_system #370 mongoDB error:', error.name, error.reason));
            if (!doc) {
                doc = new schema.trpgLevelSystem({
                    groupid: groupid
                })
            }
            switch (mainMsg[2]) {
                case '00': {
                    doc.SwitchV2 = false;
                    doc.HiddenV2 = false;
                    await doc.save();
                    tempSwitchV2.invalidateGroupConfig(groupid);
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    if (temp) temp.SwitchV2 = false;
                    break;
                }
                case '01': {
                    doc.SwitchV2 = false;
                    doc.HiddenV2 = true;
                    await doc.save();
                    tempSwitchV2.invalidateGroupConfig(groupid);
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    if (temp) temp.SwitchV2 = false;
                    break;
                }
                case '11': {
                    doc.SwitchV2 = true;
                    doc.HiddenV2 = true;
                    await doc.save();
                    tempSwitchV2.invalidateGroupConfig(groupid);
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    if (temp) temp.SwitchV2 = true;
                    break;
                }
                case '10': {
                    doc.SwitchV2 = true;
                    doc.HiddenV2 = false;
                    await doc.save();
                    tempSwitchV2.invalidateGroupConfig(groupid);
                    let temp = tempSwitchV2.tempSwitchV2.find(function (group) {
                        return group.groupid == groupid;
                    });
                    if (temp) temp.SwitchV2 = true;
                }
                    break;
                default:
                    rply.text = '修改失敗。沒有設定onoff\n';
                    rply.text += '\nconfig 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                    return rply
            }
            rply.text = '修改成功: ' + '\n經驗值功能: ';
            rply.text += (doc.SwitchV2) ? '啟動\n升級通知功能: ' : '關閉\n升級通知功能: ';
            rply.text += (doc.HiddenV2) ? '啟動' : '關閉';
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = '你不在群組當中，請在群組中使用。'
                return rply
            }
            if (!userid) {
                rply.text = '出現問題，你沒有UserID。'
                return rply
            }
            let doc = await tempSwitchV2.getGroupLevelConfig(groupid).catch(error => {
                console.error('level_system #442 mongoDB error:', error.name, error.reason ?? error.message);
                checkMongodb.dbErrOccurs();
                return null;
            });
            if (!doc) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能'
                return rply
            }
            const rankWord = doc.RankWord || DEFAULT_RANK_WORD;
            const rendered = await buildWordPreview(rankWord, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage });
            if (!rendered) {
                rply.text = '未有你的資料，請稍後再試。'
                return rply
            }
            rply.text = rendered;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMe$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = '你不在群組當中，請在群組中使用。'
                return rply
            }
            //顯示群組頭五名排名
            let RankNumber = 5
            if (mainMsg[2]) {
                if (mainMsg[2] > 5 && mainMsg[2] <= 20)
                    RankNumber = Number(mainMsg[2])
                if (mainMsg[2] > 20)
                    RankNumber = 20
            }
            let doc = await tempSwitchV2.getGroupLevelConfig(groupid).catch(error => {
                console.error('level_system #514 mongoDB error:', error.name, error.reason ?? error.message);
                return null;
            });
            if (!doc) {
                rply.text = '此群組並有沒有開啓LEVEL功能. \n.level config 11 代表啓動功能 \
                    \n 數字11代表等級升級時會進行通知，10代表不會自動通知，\
                    \n 00的話代表不啓動功能\n'
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({
                groupid: groupid
            }).sort({
                EXP: -1
            }).limit(RankNumber).lean().catch(error => console.error('level_system #525 mongoDB error:', error.name, error.reason ?? error.message));
            if (docMember.length === 0) {
                rply.text = '此群組未有足夠資料\n'
                return rply;
            }
            rply.quotes = true;
            rply.text = await rankingList(doc, docMember, RankNumber, "群組排行榜");
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeAtTheWorld$/i.test(mainMsg[1]): {
            //顯示自己的排名
            let myExp = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid })
                .lean().catch(error => console.error('level_system #537 mongoDB error:', error.name, error.reason));
            if (!myExp || !myExp.EXP) {
                rply.text = "未有找到你的資料，請檢查有沒有開啓經驗值功能";
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({ EXP: { $gt: myExp.EXP } }).countDocuments()
                .catch(error => console.error('level_system #543 mongoDB error:', error.name, error.reason));
            rply.text = `你現在的世界排名是第${docMember + 1}名`
            return rply;

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeTheWorld$/i.test(mainMsg[1]): {
            //顯示世界頭六名排名
            let RankNumber = 6
            if (mainMsg[2]) {
                if (mainMsg[2] > 6 && mainMsg[2] <= 20)
                    RankNumber = Number(mainMsg[2])
                if (mainMsg[2] > 20)
                    RankNumber = 20
            }
            let docMember = await schema.trpgLevelSystemMember.find({}, { name: 1, EXP: 1, Level: 1 }).sort({
                EXP: -1
            }).limit(RankNumber).lean().catch(error => console.error('level_system #559 mongoDB error:', error.name, error.reason));
            // 世界排行榜總人數用近似值即可，避免全表 COLLSCAN
            let docMemberCount = (schema.trpgLevelSystemMember && typeof schema.trpgLevelSystemMember.estimatedDocumentCount === 'function')
                ? await schema.trpgLevelSystemMember.estimatedDocumentCount().catch(error => {
                    console.error('level_system #560 mongoDB error:', error.name, error.reason);
                    return 0;
                })
                : 0;

            if (docMember.length === 0) {
                rply.text = '此群組未有足夠資料\n'
                return rply;
            }
            rply.quotes = true;
            rply.text = await rankingList({}, docMember, RankNumber, "世界排行榜", docMemberCount);
            return rply;

        }
        default:
            break;
    }

    function setNew(a, result) {
        let b = /-(\d+)\s+(\S+)/ig
        let e = /-(\d+)\s+(\S+)/
        //let f = [];
        let c = a.match(b);
        let d = [];
        if (c)
            for (let i = 0; i < c.length; i++) {
                d[i] = e.exec(c[i])
            }
        if (d)
            for (let i = 0; i < d.length; i++) {
                //限制0-500以內
                if (d[i][1] && d[i][2] && d[i][1] <= 500 && d[i][1] >= 0)
                    result[d[i][1]] = d[i][2]
            }

        return result;
    }




    async function rankingList(gp, who, RankNumber, Title, docMemberCount) {
        let array = [];
        let answer = ""
        let tempTitleAll = gp.Title || [];

        for (let key in who) {
            array.push(who[key]);
        }
        array.sort(function (a, b) {
            return b.Level - a.Level;
        });
        let rank = 1;
        for (let i = 0; i < array.length; i++) {
            if (i > 0 && array[i].Level < array[i - 1].Level) {
                rank++;
            }
            array[i].rank = rank;
        }
        for (let b = 0; b < RankNumber; b++) {
            if (array && array[b]) {
                if (b == 0) {
                    answer += Title
                    answer += (Title == "世界排行榜") ? " (人口: " + docMemberCount + "人)\n┌" : "\n┌";
                } else
                    if (b < RankNumber - 1 && b < array.length - 1) {
                        answer += "├"
                    } else
                        if (b == RankNumber - 1 || b == array.length - 1) {
                            answer += "└"
                        }
                answer += "第" + (Number([b]) + 1) + "名 "
                answer += "《" + await checkTitle(array[b].Level, tempTitleAll) + "》 "
                answer += array[b].name + " " + array[b].Level + "級 " + await kMGTPE(Number.parseInt(array[b].EXP), 1) + "經驗\n";
            }
        }
        return answer;

    }

    //將千位以上變成約數
    async function kMGTPE(num, fixed) {
        if (num === null) {
            return null;
        } // terminate early
        if (num === 0) {
            return '0';
        } // terminate early
        fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
        let b = (num).toPrecision(2).split("e"), // get power
            k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
            c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
            d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
            e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
        return e;
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('level')
            .setDescription('【經驗值系統】查看等級、排名和設定')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('help')
                    .setDescription('顯示經驗值系統的幫助信息'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('show')
                    .setDescription('顯示現時升級語及其他語')
                    .addStringOption(option =>
                        option.setName('type')
                            .setDescription('要顯示的設定類型')
                            .setRequired(true)
                            .addChoices(
                                { name: '升級通知文字', value: 'levelupword' },
                                { name: '查詢回應文字', value: 'rankword' },
                                { name: '稱號設定', value: 'titleword' }
                            )))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('showme')
                    .setDescription('查詢群組排名')
                    .addIntegerOption(option =>
                        option.setName('count')
                            .setDescription('顯示前幾名 (預設5名)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('showmetheworld')
                    .setDescription('查詢世界排名')
                    .addIntegerOption(option =>
                        option.setName('count')
                            .setDescription('顯示前幾名 (預設6名)')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('showmeattheworld')
                    .setDescription('查詢自己的世界排名'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('config')
                    .setDescription('設定經驗值功能')
                    .addStringOption(option =>
                        option.setName('setting')
                            .setDescription('設定值: 11(開啟並顯示通知), 10(開啟但不顯示通知), 00(關閉功能)')
                            .setRequired(true)
                            .addChoices(
                                { name: '開啟並顯示通知', value: '11' },
                                { name: '開啟但不顯示通知', value: '10' },
                                { name: '關閉功能', value: '00' }
                            )))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('levelupword')
                    .setDescription('設定升級通知文字')
                    .addStringOption(option =>
                        option.setName('action')
                            .setDescription('動作: 設定文字、顯示現有設定或刪除設定')
                            .setRequired(true)
                            .addChoices(
                                { name: '設定文字', value: 'set' },
                                { name: '顯示現有設定', value: 'show' },
                                { name: '刪除設定', value: 'del' }
                            ))
                    .addStringOption(option =>
                        option.setName('text')
                            .setDescription('升級通知文字')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('rankword')
                    .setDescription('設定查詢回應文字')
                    .addStringOption(option =>
                        option.setName('action')
                            .setDescription('動作: 設定文字、顯示現有設定或刪除設定')
                            .setRequired(true)
                            .addChoices(
                                { name: '設定文字', value: 'set' },
                                { name: '顯示現有設定', value: 'show' },
                                { name: '刪除設定', value: 'del' }
                            ))
                    .addStringOption(option =>
                        option.setName('text')
                            .setDescription('查詢回應文字')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('titleword')
                    .setDescription('設定等級稱號')
                    .addStringOption(option =>
                        option.setName('action')
                            .setDescription('動作: 設定稱號、顯示現有設定或刪除設定')
                            .setRequired(true)
                            .addChoices(
                                { name: '設定稱號', value: 'set' },
                                { name: '顯示現有設定', value: 'show' },
                                { name: '刪除設定', value: 'del' }
                            ))
                    .addStringOption(option =>
                        option.setName('titles')
                            .setDescription('格式: -0 無名調查員 -5 調查員 -10 記者')
                            .setRequired(false))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'help':
                    return `.level help`;
                case 'show': {
                    const type = interaction.options.getString('type');
                    return `.level ${type} Show`;
                }
                case 'showme': {
                    const count = interaction.options.getInteger('count');
                    return count ? `.level showMe ${count}` : `.level showMe`;
                }
                case 'showmetheworld': {
                    const worldCount = interaction.options.getInteger('count');
                    return worldCount ? `.level showMeTheworld ${worldCount}` : `.level showMeTheworld`;
                }
                case 'showmeattheworld':
                    return `.level showMeAtTheworld`;
                case 'config': {
                    const setting = interaction.options.getString('setting');
                    return `.level config ${setting}`;
                }
                case 'levelupword': {
                    const levelUpAction = interaction.options.getString('action');
                    const levelUpText = interaction.options.getString('text');
                    
                    switch (levelUpAction) {
                        case 'show': {
                            return `.level LevelUpWord Show`;
                        }
                        case 'del': {
                            return `.level LevelUpWord del`;
                        }
                        case 'set': {
                            return levelUpText ? `.level LevelUpWord ${levelUpText}` : `.level LevelUpWord Show`;
                        }
                        // No default
                    }
                    break;
                }
                case 'rankword': {
                    const rankAction = interaction.options.getString('action');
                    const rankText = interaction.options.getString('text');
                    
                    switch (rankAction) {
                    case 'show': {
                        return `.level RankWord Show`;
                    }
                    case 'del': {
                        return `.level RankWord del`;
                    }
                    case 'set': {
                        return rankText ? `.level RankWord ${rankText}` : `.level RankWord Show`;
                    }
                    // No default
                    }
                    break;
                }
                case 'titleword': {
                    const titleAction = interaction.options.getString('action');
                    const titles = interaction.options.getString('titles');
                    
                    switch (titleAction) {
                    case 'show': {
                        return `.level TitleWord Show`;
                    }
                    case 'del': {
                        return `.level TitleWord del`;
                    }
                    case 'set': {
                        return titles ? `.level TitleWord ${titles}` : `.level TitleWord Show`;
                    }
                    // No default
                    }
                    break;
                }
                default:
                    return `.level help`;
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
    Title: Title,
    checkTitle: checkTitle,
    discordCommand: discordCommand
};


function getDisplayName(message) {
    if (!message) return;
    if (message.member?.displayName) return message.member.displayName;
    return message.author?.username;
}

/*
let trpgLevelSystemfunction = [{
        nickname: "Bob",
        EXP: 100
    },
    {
        nickname: "Amy",
        EXP: 200
    },
    {
        nickname: "Grant",
        EXP: 1300
    },
    {
        nickname: "Steve",
        EXP: 4200
    },
    {
        nickname: "Joe",
        EXP: 500
    }
];
function rankingList(who) {
    let array = [];

    for (let key in trpgLevelSystemfunction) {
        array.push(trpgLevelSystemfunction[key]);

    }

    array.sort(function (a, b) {
        return b.EXP - a.EXP;
    });

    let rank = 1;
    for (let i = 0; i < array.length; i++) {
        if (i > 0 && array[i].EXP < array[i - 1].EXP) {
            rank++;
        }
        array[i].rank = rank;
    }
    for (let b = 0; b < array.length; b++) {
            document.write("第",Number([b])+1, "名 ",array[b].nickname ," ",array[b].EXP," <br\>");

    }


}
rankingList('Joe');

┌
├
├
├
└

let a = ".lev  -3 a -34 bc -1 DEF -2   Gh i -30 JK -45 ab 23"
let b = /-(\d+)\s+(\S+)/ig
let e = /-(\d+)\s+(\S+)/

let f = [];

let c = a.match(b);
document.write(c,"<br\>");
for (let z=0 ;z<c.length;z++)
{
document.write(z," ", c[z],"<br\>");
}
document.write("<br\>");
let d=[];
for (let i=0 ;i<c.length;i++)
{
d[i]=e.exec(c[i])
f.push({lvl:d[i][1],Title:d[i][2]})

document.write(i," ",d[i],"<br\>");
}
document.write("<br\>");
for(let dd=0;dd<f.length;dd++)
document.write(f[dd].lvl," ",f[dd].Title,"<br\>");
*/