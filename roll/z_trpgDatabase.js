"use strict";
if (!process.env.mongoURL) {
    return;
}
const rollbase = require('./rollbase.js');
const records = require('../modules/records.js');
var trpgDatabasefunction = {};
records.get('trpgDatabase', (msgs) => {
    trpgDatabasefunction.trpgDatabasefunction = msgs
});
records.get('trpgDatabaseAllgroup', (msgs) => {
    trpgDatabasefunction.trpgDatabaseAllgroup = msgs
});
const VIP = require('../modules/veryImportantPerson');
const limitArr = [30, 200, 200, 300, 300, 300, 300, 300];
var gameName = function () {
    return '(公測中)資料庫功能 (公共|)背包 (登記 刪除 顯示 自定關鍵字)'
}
var gameType = function () {
    return 'funny:trpgDatabase:hktrpg'
}
var prefixs = function () {
    return [{
       first: /(^(公共|)背包$)/ig,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【資料庫功能】" + "\n\
這是根據關鍵字來顯示數據的,\n\
例如輸入 背包 登記 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 \n\
再輸入背包 九大陣營  守序善良 (...太長省略) 中立邪惡 混亂邪惡\n\
add 後面第一個是關鍵字, 可以是漢字,數字,英文及emoji\n\
P.S.如果沒立即生效 用背包 顯示 刷新一下\n\
輸入背包 登記 關鍵字 內容即可增加關鍵字\n\
輸入背包 顯示 顯示所有關鍵字\n\
輸入背包 刪除編號或全部 即可刪除\n\
輸入背包  (關鍵字) 即可顯示 \n\
如使用輸入公共背包 會變成全服版,全服可看, 可用登記 顯示功能 \n\
新增指令 - 輸入公共背包 newType 可以觀看效果\n\
* {br}          <--隔一行\n\
* {ran:100}     <---隨機1-100\n\
* {random:5-20} <---隨機5-20\n\
* {server.member_count}  <---現在頻道中總人數 \n\
* {my.name}     <---顯示擲骰者名字\n\
以下需要開啓.level 功能\n\
* {allgp.name}  <---隨機全GP其中一人名字\n\
* {allgp.title}  <---隨機全GP其中一種稱號\n\
* {my.RankingPer}  <---現在排名百分比 \n\
* {my.Ranking}  <---顯示擲骰者現在排名 \n\
* {my.exp}      <---顯示擲骰者經驗值\n\
* {my.title}    <---顯示擲骰者稱號\n\
* {my.level}    <---顯示擲骰者等級\n\
"
}
var initialize = function () {
    return trpgDatabasefunction;
}
exports.z_Level_system = require('./z_Level_system');
// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function ({
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
    let limit = limitArr[0];
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;

            // .DB(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^背包$)/i.test(mainMsg[0]) && /^登記$/i.test(mainMsg[1]) && /^(?!(登記|刪除|顯示)$)/ig.test(mainMsg[2]):
            //增加資料庫
            //檢查有沒有重覆
            //if (!mainMsg[2]) return;
            //if (!mainMsg[3]) return;
            /*
                       只限四張角色卡.
                       使用VIPCHECK
                       */
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = limitArr[lv];

            if (groupid && userrole >= 1 && mainMsg[3]) {
                if (trpgDatabasefunction.trpgDatabasefunction)
                    for (var i = 0; i < trpgDatabasefunction.trpgDatabasefunction.length; i++) {
                        if (trpgDatabasefunction.trpgDatabasefunction[i].groupid == groupid) {
                            if (trpgDatabasefunction.trpgDatabasefunction[0] && trpgDatabasefunction.trpgDatabasefunction[0].trpgDatabasefunction[0]) {
                                if (trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length >= limit) {
                                    rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                                    return rply;
                                }
                                for (var a = 0; a < trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length; a++) {
                                    if (trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic == mainMsg[2]) {
                                        checkifsamename = 1
                                    }
                                }
                            }
                        }
                    }
                let temp = {
                    groupid: groupid,
                    trpgDatabasefunction: [{
                        topic: mainMsg[2],
                        contact: inputStr.replace(/\背包\s+登記\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
                    }]
                }
                if (checkifsamename == 0) {
                    records.pushtrpgDatabasefunction('trpgDatabase', temp, () => {
                        records.get('trpgDatabase', (msgs) => {
                            trpgDatabasefunction.trpgDatabasefunction = msgs
                            // console.log(rply);
                        })

                    })
                    rply.text = '新增成功: ' + mainMsg[2]
                } else rply.text = '新增失敗. 重複標題'
            } else {
                rply.text = '新增失敗.'
                if (!mainMsg[2])
                    rply.text += ' 沒有標題.'
                if (!mainMsg[3])
                    rply.text += ' 沒有內容'
                if (!groupid)
                    rply.text += ' 不在群組.'
                if (groupid && userrole < 1)
                    rply.text += ' 只有GM以上才可新增.'
            }
            return rply;

        case /(^背包$)/i.test(mainMsg[0]) && /^刪除$/i.test(mainMsg[1]) && /^全部$/i.test(mainMsg[2]):
            //刪除資料庫
            if (groupid && mainMsg[2] && trpgDatabasefunction.trpgDatabasefunction && userrole >= 2) {
                for (let i = 0; i < trpgDatabasefunction.trpgDatabasefunction.length; i++) {
                    if (trpgDatabasefunction.trpgDatabasefunction[i].groupid == groupid) {
                        let temp = trpgDatabasefunction.trpgDatabasefunction[i]
                        temp.trpgDatabasefunction = []
                        records.settrpgDatabasefunction('trpgDatabase', temp, () => {
                            records.get('trpgDatabase', (msgs) => {
                                trpgDatabasefunction.trpgDatabasefunction = msgs
                            })
                        })
                        rply.text = '刪除所有關鍵字'
                    }
                }
            } else {
                rply.text = '刪除失敗.'
                if (!groupid)
                    rply.text += '不在群組. '
                if (groupid && userrole < 1)
                    rply.text += '只有GM以上才可刪除. '
            }

            return rply;
        case /(^背包$)/i.test(mainMsg[0]) && /^刪除$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //刪除資料庫
            if (groupid && mainMsg[2] && trpgDatabasefunction.trpgDatabasefunction && userrole >= 1) {
                for (let i = 0; i < trpgDatabasefunction.trpgDatabasefunction.length; i++) {
                    if (trpgDatabasefunction.trpgDatabasefunction[i].groupid == groupid && mainMsg[2] < trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length && mainMsg[2] >= 0) {
                        let temp = trpgDatabasefunction.trpgDatabasefunction[i]
                        temp.trpgDatabasefunction.splice(mainMsg[2], 1)
                        //console.log('trpgDatabasefunction.trpgDatabasefunction: ', temp)
                        records.settrpgDatabasefunction('trpgDatabase', temp, () => {
                            records.get('trpgDatabase', (msgs) => {
                                trpgDatabasefunction.trpgDatabasefunction = msgs
                            })
                        })
                    }
                    rply.text = '刪除成功: ' + mainMsg[2]
                }
            } else {
                rply.text = '刪除失敗.'
                if (!mainMsg[2])
                    rply.text += '沒有關鍵字. '
                if (!groupid)
                    rply.text += '不在群組. '
                if (groupid && userrole < 1)
                    rply.text += '只有GM以上才可刪除. '
            }
            return rply;

        case /(^背包$)/i.test(mainMsg[0]) && /^顯示$/i.test(mainMsg[1]):
            //顯示
            records.get('trpgDatabase', (msgs) => {
                trpgDatabasefunction.trpgDatabasefunction = msgs
            })
            //console.log(trpgDatabasefunction.trpgDatabasefunction)
            if (groupid) {
                let temp = 0;
                if (trpgDatabasefunction.trpgDatabasefunction)
                    for (let i = 0; i < trpgDatabasefunction.trpgDatabasefunction.length; i++) {
                        if (trpgDatabasefunction.trpgDatabasefunction[i].groupid == groupid) {
                            rply.text += '資料庫列表:'
                            for (let a = 0; a < trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length; a++) {
                                temp = 1;
                                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + a + '. ' + trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic : '       ' + a + '. ' + trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic;
                            }
                        }
                    }
                if (temp == 0) rply.text = '沒有已設定的關鍵字. '
            } else {
                rply.text = '不在群組. '
            }
            //顯示資料庫
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply
        case /(^背包$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(登記|刪除|顯示)$)/ig.test(mainMsg[1]):
            //顯示關鍵字
            //let times = /^[.]db/.exec(mainMsg[0])[1] || 1
            //if (times > 30) times = 30;
            //if (times < 1) times = 1
            //console.log(times)
            if (groupid) {
                //    console.log(mainMsg[1])
                let temp = 0;
                if (trpgDatabasefunction.trpgDatabasefunction && mainMsg[1])
                    for (let i = 0; i < trpgDatabasefunction.trpgDatabasefunction.length; i++) {
                        if (trpgDatabasefunction.trpgDatabasefunction[i].groupid == groupid) {
                            // console.log(trpgDatabasefunction.trpgDatabasefunction[i])
                            //rply.text += '資料庫列表:'
                            for (let a = 0; a < trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length; a++) {
                                if (trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic.toLowerCase() == mainMsg[1].toLowerCase()) {
                                    temp = 1
                                    rply.text = trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic + '\n' + trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].contact;

                                }

                            }
                        }
                    }
                if (temp == 0) rply.text = '沒有相關關鍵字. '
                rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            } else {
                rply.text = '不在群組. '
            }
            rply.text = rply.text.replace(/,/mg, ' ')
            return rply;
        case /(^公共背包$)/i.test(mainMsg[0]) && /^登記$/i.test(mainMsg[1]) && /^(?!(登記|刪除|顯示)$)/ig.test(mainMsg[2]):
            //if (!mainMsg[2]) return;
            if (rply && trpgDatabasefunction.trpgDatabaseAllgroup && mainMsg[2])
                if (rply && trpgDatabasefunction.trpgDatabaseAllgroup && trpgDatabasefunction.trpgDatabaseAllgroup[0] && trpgDatabasefunction.trpgDatabaseAllgroup[0].trpgDatabaseAllgroup[0]) {
                    if (trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup.length > 100) {
                        rply.text = '只可以有100個關鍵字啊'
                        return rply;
                    }
                    for (let i = 0; i < trpgDatabasefunction.trpgDatabaseAllgroup.length; i++) {
                        for (let a = 0; a < trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup.length; a++) {
                            if (trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].topic.toLowerCase() == mainMsg[2].toLowerCase()) {
                                checkifsamenamegroup = 1
                            }
                        }
                    }
                }
            if (mainMsg[3]) {
                let tempA = {
                    trpgDatabaseAllgroup: [{
                        topic: mainMsg[2],
                        contact: inputStr.replace(/\.dbp add /i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
                    }]
                }
                if (checkifsamenamegroup == 0) {
                    records.pushtrpgDatabaseAllgroup('trpgDatabaseAllgroup', tempA, () => {
                        records.get('trpgDatabaseAllgroup', (msgs) => {
                            trpgDatabasefunction.trpgDatabaseAllgroup = msgs
                        });
                    })
                    rply.text = '新增成功: ' + mainMsg[2]
                } else {
                    rply.text = '新增失敗. 重複關鍵字'
                }
            } else {
                rply.text = '新增失敗.'
                if (!mainMsg[2])
                    rply.text += ' 沒有關鍵字.'
                if (!mainMsg[3])
                    rply.text += ' 沒有內容.'
            }
            return rply;
        case /(^公共背包$)/i.test(mainMsg[0]) && /^顯示$/i.test(mainMsg[1]):
            records.get('trpgDatabaseAllgroup', (msgs) => {
                trpgDatabasefunction.trpgDatabaseAllgroup = msgs
            })
            if (trpgDatabasefunction.trpgDatabaseAllgroup)
                for (let i = 0; i < trpgDatabasefunction.trpgDatabaseAllgroup.length; i++) {
                    rply.text += '資料庫列表:'
                    for (let a = 0; a < trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup.length; a++) {
                        tempshow = 1;
                        rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + a + '. ' + trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].topic : '      ' + a + '. ' + trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].topic;

                    }
                }
            if (tempshow == 0) rply.text = '沒有已設定的關鍵字. '
            //顯示資料庫
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply;
        case /(^公共背包$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(登記|刪除|顯示)$)/ig.test(mainMsg[1]):
            //let timesgp = /^[.]dbp/.exec(mainMsg[0])[1] || 1
            //  if (timesgp > 30) timesgp = 30;
            //  if (timesgp < 1) timesgp = 1
            if (trpgDatabasefunction.trpgDatabaseAllgroup && mainMsg[1])
                for (let i = 0; i < trpgDatabasefunction.trpgDatabaseAllgroup.length; i++) {
                    for (let a = 0; a < trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup.length; a++) {
                        if (trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].topic.toLowerCase() == mainMsg[1].toLowerCase()) {
                            temp2 = 1
                            rply.text = trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].topic + '\n' + trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].contact;


                        }
                    }
                }
            if (temp2 == 0) rply.text = '沒有相關關鍵字. '
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
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
                return await rollbase.Dice(temp[1]) || ' ';
            case /^random:\d+/i.test(second):
                temp = /^random:(\d+)-(\d+)/i.exec(second)
                if (!temp || !temp[1] || !temp[2]) return ' ';
                return await rollbase.DiceINT(temp[1], temp[2]) || ' ';
            case /^allgp.name$/i.test(second):
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                if (!temp) return ' ';
                num = await rollbase.DiceINT(0, temp.trpgLevelSystemfunction.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp.trpgLevelSystemfunction[num].name
                return temp || ' ';
                // * {allgp.name} <---隨機全GP其中一人名字
            case /^allgp.title$/i.test(second):
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                if (!temp) return ' ';
                if (temp.Title.length == 0) {
                    temp.Title = exports.z_Level_system.Title();
                }
                temp2 = await temp.Title.filter(function (item) {
                    return item;
                });
                num = await rollbase.DiceINT(0, temp2.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp2[num]
                return temp || ' ';
                // * {allgp.title}<---隨機全GP其中一種稱號
            case /^server.member_count$/i.test(second):
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                num = (temp && temp.trpgLevelSystemfunction && temp.trpgLevelSystemfunction.length) ? Math.max(membercount, temp.trpgLevelSystemfunction.length) : membercount;
                return num || ' ';
                //  {server.member_count} 現在頻道中總人數 \
            case /^my.RankingPer$/i.test(second):
                //* {my.RankingPer} 現在排名百分比 \
                // let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                if (!temp) return ' ';
                temp2 = await ranking(userid, temp.trpgLevelSystemfunction)
                if (!temp2) return ' ';
                num = (temp && temp.trpgLevelSystemfunction && temp.trpgLevelSystemfunction.length) ? Math.max(membercount, temp.trpgLevelSystemfunction.length) : membercount;
                temp2 = Math.ceil(temp2 / num * 10000) / 100 + '%';
                return temp2 || ' ';
            case /^my.Ranking$/i.test(second):
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                //     temp2 = await findUser(temp, userid);
                //* {my.Ranking} 顯示擲骰者現在排名 \
                if (!temp || !temp.trpgLevelSystemfunction) return ' ';
                return await ranking(userid, temp.trpgLevelSystemfunction) || ' ';
            case /^my.exp$/i.test(second):
                //* {my.exp} 顯示擲骰者經驗值
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(temp, userid);
                if (!temp || !temp2 || !temp2.EXP) return ' ';
                return temp2.EXP || ' ';
            case /^my.name$/i.test(second):
                //* {my.name} <---顯示擲骰者名字
                return displaynameDiscord || displayname || "無名";
            case /^my.title$/i.test(second):
                // * {my.title}<---顯示擲骰者稱號
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(temp, userid);
                if (!temp || !temp2 || !temp2.Level || !temp.Title) return ' ';
                //   let userTitle = await this.checkTitle(userlevel, trpgLevelSystemfunction.trpgLevelSystemfunction[i].Title);
                return await exports.z_Level_system.checkTitle(temp2.Level, temp.Title) || ' ';
            case /^my.level$/i.test(second):
                //* {my.level}<---顯示擲骰者等級
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(temp, userid);
                if (!temp || !temp2 || !temp2.Level) return ' ';
                return temp2.Level || ' ';
            case /^br$/i.test(second):
                temp = '\n'
                return temp || ' ';
            default:
                break;
        }

    }
}
async function findGp(groupid) {
    if (!process.env.mongoURL || !Object.keys(exports.z_Level_system).length || !groupid) {
        return;
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let gpInfo = exports.z_Level_system.initialize().trpgLevelSystemfunction.find(e => e.groupid == groupid);
    if (!gpInfo || gpInfo.Switch != 1) return;
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function findUser(gpInfo, userid) {
    if (!gpInfo || !gpInfo.trpgLevelSystemfunction) return;
    let userInfo = {};
    userInfo = gpInfo.trpgLevelSystemfunction.find(e => e.userid == userid);
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return userInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function ranking(who, data) {
    let array = [];
    let answer = "0";
    for (let key in data) {
        await array.push(data[key]);
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
        if (array[b].userid == who)
            answer = b + 1;

    }
    return answer;
}

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};
