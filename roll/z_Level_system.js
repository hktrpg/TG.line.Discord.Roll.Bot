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
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');

const gameName = function (params = {}) {
    return resolveGameName(params, 'level.game_name', '【經驗值功能】 .level (show config LevelUpWord RankWord)');
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
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'level.help', () => getT({ locale: 'zh-tw' })('level.help'));
}
const initialize = function () {
    return;
}
const checkTitle = async function (userlvl, DBTitle, locale = 'zh-tw') {
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
    if (!temptitle) {
        const titles = Title(locale);
        for (let g = 0; g < titles.length; g++) {
            if (userlvl >= g) {
                if (templvl <= g && titles[g]) {
                    templvl = g
                    temptitle = titles[g];
                }
            }
        }
    }
    return temptitle;
}

async function buildWordPreview(templateWord, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage, locale }) {
    const translate = getT({ locale });
    const docMember = await schema.trpgLevelSystemMember.find({ groupid }).sort({ EXP: -1 }).lean()
        .catch(error => { console.error('buildWordPreview mongoDB error:', error.name, error.reason); return null; });
    if (!docMember) return null;
    const myselfIndex = docMember.findIndex(m => m.userid === userid.toString());
    if (myselfIndex === -1) return null;
    const username = tgDisplayname || displaynameDiscord || displayname || translate('level.unnamed');
    const userlevel = docMember[myselfIndex].Level;
    const userexp = docMember[myselfIndex].EXP;
    const usermember_count = Math.max(membercount, docMember.length);
    const userRanking = myselfIndex + 1;
    const userRankingPer = Math.ceil(userRanking / usermember_count * 10_000) / 100 + '%';
    const userTitle = await checkTitle(userlevel, doc?.Title || [], locale);
    let preview = templateWord
        .replaceAll(/{user.name}/ig, username)
        .replaceAll(/{user.level}/ig, userlevel)
        .replaceAll(/{user.exp}/ig, userexp)
        .replaceAll(/{user.Ranking}/ig, userRanking)
        .replaceAll(/{user.RankingPer}/ig, userRankingPer)
        .replaceAll(/{server.member_count}/ig, usermember_count)
        .replaceAll(/{user.title}/ig, userTitle);
    if (/{user.displayName}/ig.test(preview)) {
        const userDisplayName = getDisplayName(discordMessage) || username || translate('level.unnamed');
        preview = preview.replaceAll(/{user.displayName}/ig, userDisplayName);
    }
    return preview;
}

const Title = function (locale = 'zh-tw') {
    const t = getT({ locale });
    const titles = t('level.default_titles', { returnObjects: true });
    let TitleArr = [];
    if (titles && typeof titles === 'object' && !Array.isArray(titles)) {
        for (const [lvl, title] of Object.entries(titles)) {
            TitleArr[Number(lvl)] = title;
        }
        return TitleArr;
    }
    TitleArr[0] = "無名調查員";
    TitleArr[3] = "雀";
    TitleArr[4] = "調查員";
    TitleArr[8] = "記者";
    TitleArr[11] = "偵探";
    TitleArr[13] = "小熊";
    TitleArr[14] = "考古家";
    TitleArr[18] = "神秘學家";
    TitleArr[21] = "狂信徒";
    TitleArr[24] = "教主";
    TitleArr[28] = "眷族";
    TitleArr[31] = "眷族首領";
    TitleArr[33] = "南";
    TitleArr[34] = "化身";
    TitleArr[38] = "舊神";
    TitleArr[41] = "舊日支配者";
    TitleArr[43] = "門";
    TitleArr[44] = "外神";
    TitleArr[48] = "KP";
    TitleArr[53] = "東";
    TitleArr[54] = "作者";
    return TitleArr;
};

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
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            if (botname == "Line")
                rply.text += translate('level.line_friend_hint');
            return rply;
        // .level(0) LevelUpWord(1) TOPIC(2) CONTACT(3)

        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            rply.text = checkTools.permissionErrMsg({ locale,
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
                rply.text = translate('level.title_deleted');
                return rply
            }
            doc.Title = [];
            await doc.save();
            tempSwitchV2.invalidateGroupConfig(groupid);
            rply.text = translate('level.title_deleted');
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = translate('level.group_only');
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('[Level System] MongoDB error:', error.name, error.reason));
            if (!doc || doc.Title.length === 0) {
                rply.text = translate('level.using_default_title');
                return rply
            }
            rply.text = translate('level.title_header');
            for (let te = 0; te < doc.Title.length; te++) {
                if (doc.Title[te]) {
                    rply.text += translate('level.title_level_entry', { level: te, title: doc.Title[te] });
                }
            }
            return rply

        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^TitleWord$/i.test(mainMsg[1]): {
            //
            // Title
            //
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            // Check if there's any input to process
            if (!mainMsg[2]) {
                rply.text = translate('level.title_input_required');
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
                rply.text = translate('level.title_add_no_input');
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
            rply.text = translate('level.title_add_success');
            for (let te = 0; te < temprply.length; te++) {
                if (temprply[te])
                    rply.text += translate('level.title_level_entry', { level: te, title: temprply[te] });
            }
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = translate('level.title_add_group_only');
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #242 mongoDB error:', error.name, error.reason));
            const levelUpTemplate = doc?.LevelUpWord || translate('level.default_level_up_word');
            const levelUpLabel = doc?.LevelUpWord ? translate('level.levelup_custom_label') : translate('level.levelup_default_label');
            rply.text = `${levelUpLabel}\n${levelUpTemplate}`;
            const levelUpPreview = await buildWordPreview(levelUpTemplate, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage, locale });
            if (levelUpPreview) rply.text += translate('level.preview_label') + levelUpPreview;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            rply.text = checkTools.permissionErrMsg({ locale,
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
            rply.text = translate('level.levelup_deleted');
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^LevelUpWord$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            // Check if there's any input to process
            if (!mainMsg[2]) {
                rply.text = translate('level.levelup_input_required');
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
            rply.text = translate('level.levelup_added', { text: inputStr.replace(/\s?.*\s+\w+\s+/i, '') });

            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = translate('level.title_add_group_only');
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #294 mongoDB error:', error.name, error.reason));
            const rankTemplate = doc?.RankWord || translate('level.default_rank_word');
            const rankLabel = doc?.RankWord ? translate('level.rank_custom_label') : translate('level.rank_default_label');
            rply.text = `${rankLabel}\n${rankTemplate}`;
            const rankPreview = await buildWordPreview(rankTemplate, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage, locale });
            if (rankPreview) rply.text += translate('level.preview_label') + rankPreview;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]) && /^del$/i.test(mainMsg[2]): {
            rply.text = checkTools.permissionErrMsg({ locale,
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
            rply.text = translate('level.rank_deleted');
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^RankWord$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            // Check if there's any input to process
            if (!mainMsg[2]) {
                rply.text = translate('level.rank_input_required');
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
            rply.text = translate('level.rank_added', { text: inputStr.replace(/\s?.*\s+\w+\s+/i, '') });
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]) && /^Show$/i.test(mainMsg[2]): {
            if (!groupid) {
                rply.text = translate('level.group_only');
                return rply
            }
            let doc = await schema.trpgLevelSystem.findOne({
                groupid: groupid
            }).lean().catch(error => console.error('level_system #345 mongoDB error:', error.name, error.reason));
            rply.text = translate('level.config_current');
            rply.text += (doc && doc.SwitchV2) ? translate('level.config_on') : translate('level.config_off');
            rply.text += translate('level.config_notify_line', {
                state: (doc && doc.HiddenV2) ? translate('level.config_notify_on') : translate('level.config_notify_off')
            });
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^config$/i.test(mainMsg[1]): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            });
            if (rply.text) {
                return rply;
            }

            if (!mainMsg[2]) {
                rply.text = translate('level.config_onoff_missing');
                rply.text += translate('level.config_detail_hint');
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
                    rply.text = translate('level.config_onoff_missing');
                    return rply
            }
            rply.text = translate('level.config_success');
            rply.text += (doc.SwitchV2) ? translate('level.config_on') : translate('level.config_off');
            rply.text += translate('level.config_notify_line', {
                state: (doc.HiddenV2) ? translate('level.config_notify_on') : translate('level.config_notify_off')
            });
            return rply;
        }

        case /(^[.]level$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            if (!checkMongodb.isDbOnline()) return;
            if (!groupid) {
                rply.text = translate('level.group_only');
                return rply
            }
            if (!userid) {
                rply.text = translate('level.no_userid');
                return rply
            }
            let doc = await tempSwitchV2.getGroupLevelConfig(groupid).catch(error => {
                console.error('level_system #442 mongoDB error:', error.name, error.reason ?? error.message);
                checkMongodb.dbErrOccurs();
                return null;
            });
            if (!doc) {
                rply.text = translate('level.not_enabled');
                return rply
            }
            const rankWord = doc.RankWord || translate('level.default_rank_word');
            const rendered = await buildWordPreview(rankWord, { groupid, userid, membercount, tgDisplayname, displaynameDiscord, displayname, doc, discordMessage, locale });
            if (!rendered) {
                rply.text = translate('level.no_user_data');
                return rply
            }
            rply.text = rendered;
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMe$/i.test(mainMsg[1]): {
            if (!groupid) {
                rply.text = translate('level.group_only');
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
                rply.text = translate('level.not_enabled');
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({
                groupid: groupid
            }).sort({
                EXP: -1
            }).limit(RankNumber).lean().catch(error => console.error('level_system #525 mongoDB error:', error.name, error.reason ?? error.message));
            if (docMember.length === 0) {
                rply.text = translate('level.insufficient_data');
                return rply;
            }
            rply.quotes = true;
            rply.text = await rankingList(doc, docMember, RankNumber, translate('level.group_rank_title'));
            return rply;
        }
        case /(^[.]level$)/i.test(mainMsg[0]) && /^showMeAtTheWorld$/i.test(mainMsg[1]): {
            //顯示自己的排名
            let myExp = await schema.trpgLevelSystemMember.findOne({ groupid: groupid, userid: userid })
                .lean().catch(error => console.error('level_system #537 mongoDB error:', error.name, error.reason));
            if (!myExp || !myExp.EXP) {
                rply.text = translate('level.no_world_data');
                return rply;
            }
            let docMember = await schema.trpgLevelSystemMember.find({ EXP: { $gt: myExp.EXP } }).countDocuments()
                .catch(error => console.error('level_system #543 mongoDB error:', error.name, error.reason));
            rply.text = translate('level.world_rank', { rank: docMember + 1 });
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
                rply.text = translate('level.insufficient_data');
                return rply;
            }
            rply.quotes = true;
            rply.text = await rankingList({}, docMember, RankNumber, translate('level.world_rank_title'), docMemberCount);
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
        const worldTitle = translate('level.world_rank_title');

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
                    answer += (Title === worldTitle) ? translate('level.world_rank_population', { count: docMemberCount }) : "\n┌";
                } else
                    if (b < RankNumber - 1 && b < array.length - 1) {
                        answer += "├"
                    } else
                        if (b == RankNumber - 1 || b == array.length - 1) {
                            answer += "└"
                        }
                answer += translate('level.rank_entry', {
                    rank: Number([b]) + 1,
                    title: await checkTitle(array[b].Level, tempTitleAll, locale),
                    name: array[b].name,
                    level: array[b].Level,
                    exp: await kMGTPE(Number.parseInt(array[b].EXP), 1)
                });
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