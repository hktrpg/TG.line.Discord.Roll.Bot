"use strict";
if (!process.env.mongoURL) {
    return;
}
const rollbase = require('./rollbase.js');
//const records = require('../modules/records.js');

const schema = require('../modules/schema.js');

const checkTools = require('../modules/check.js');
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];
const gameName = function () {
    return '【資料庫功能】 .db(p) (add del show 自定關鍵字)'
}
const gameType = function () {
    return 'funny:trpgDatabase:hktrpg'
}
const prefixs = function () {
    return [{
        first: /(^[.]db(p|)$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【資料庫功能】
這是根據關鍵字來顯示數據的,
例如輸入 .db add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 
再輸入.db 九大陣營  守序善良 (...太長省略) 中立邪惡 混亂邪惡
add 後面第一個是關鍵字, 可以是漢字,數字,英文及emoji
P.S.如果沒立即生效 用.db show 刷新一下
輸入.db add (關鍵字) (內容)即可增加關鍵字
輸入.db show 顯示所有關鍵字
輸入.db del(編號)或all 即可刪除
輸入.db  (關鍵字) 即可顯示 
如使用輸入.dbp 會變成全服版,全服可看, 可用add show功能 
新增指令 - 輸入.dbp newType 可以觀看效果
* {br}          <--隔一行
* {ran:100}     <---隨機1-100
* {random:5-20} <---隨機5-20
* {server.member_count}  <---現在頻道中總人數 
* {my.name}     <---顯示擲骰者名字
以下需要開啓.level 功能
* {allgp.name}  <---隨機全GP其中一人名字
* {allgp.title}  <---隨機全GP其中一種稱號
* {my.RankingPer}  <---現在排名百分比 
* {my.Ranking}  <---顯示擲骰者現在排名 
* {my.exp}      <---顯示擲骰者經驗值
* {my.title}    <---顯示擲骰者稱號
* {my.level}    <---顯示擲骰者等級
`
}
const initialize = function () {
    return { _trpgDB, _trpgDBgp };
}
exports.z_Level_system = require('./z_Level_system');
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
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;

        // .DB(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]db$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            //增加資料庫
            //檢查有沒有重覆

            if (!mainMsg[2]) rply.text += ' 沒有輸入標題。\n\n';
            if (!mainMsg[3]) rply.text += ' 沒有輸入內容。\n\n';
            if (rply.text) return rply;
            if (rply.text += checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            let lv = await VIP.viplevelCheckGroup(groupid);
            let limit = FUNCTION_LIMIT[lv];

            //1.找出這個GP的LIMIT


            const gpList = await schema.trpgDatabase.findOne({ groupid: groupid });
            console.log('gpList', gpList);
            if (!gpList) {
                const temp = new schema.trpgDatabase({
                    groupid: groupid,
                    trpgDatabasefunction: [{
                        topic: mainMsg[2],
                        contact: inputStr.replace(/\.db\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
                    }]
                });
                await temp.save();
                rply.text = `新增成功: ${mainMsg[2]}
                使用.db ${mainMsg[2]} 來顯示內容`;
                return rply;
            }

            console.log('gpList', gpList)
            const dbDoc = gpList?.trpgDatabasefunction || [];
            let count = dbDoc.filter(item => item.topic !== undefined && item.topic !== "").length;

            console.log('dbDoc', dbDoc);
            if (count > limit) {
                rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                return rply;
            }


            //2.檢查有沒有重覆
            const doublecheck = dbDoc?.find(x => x.topic == mainMsg[2]);
            console.log('doublecheck', doublecheck)
            if (doublecheck) {
                rply.text = '有重複關鍵字，請重新輸入。可以輸入 .db show 來查看關鍵字。';
                return rply;
            }

            let temp =
            {
                topic: mainMsg[2],
                contact: inputStr.replace(/\.db\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
            };

            let pushed = false;
            dbDoc.forEach(item => {
                if (Object.keys(item).length === 0) {
                    item = temp;
                    pushed = true;
                }
            });

            if (!pushed) {
                dbDoc.push(temp);
            }
            await gpList.save();

            rply.text = `新增成功: ${mainMsg[2]}
            使用.db ${mainMsg[2]} 來顯示內容`;
            return rply;



        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]): {
            //刪除資料庫
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }
            await schema.trpgDatabase.findOneAndDelete({ groupid: groupid });
            rply.text = '刪除所有關鍵字'
            return rply;
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]): {
            //刪除資料庫
            if (!mainMsg[2]) {
                rply.text += '沒有關鍵字. \n\n';
                return rply;
            }

            if (rply.text += checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            const gpList = await schema.trpgDatabase.findOne({ groupid: groupid });
            if (!gpList) {
                rply.text = '在這個頻道並沒有 已紀錄的database，請使用.db add 先新增資料. \n\n';
                return rply;
            }

            const dbDoc = gpList?.trpgDatabasefunction || [];
            dbDoc.forEach(item => {
                if (item.topic == mainMsg[2]) {
                    item.topic = "";
                    item.contact = "";
                }
            });
            await gpList.save();
            rply.text = '刪除成功: ' + mainMsg[2];
            rply.text += `\n使用.db show 來顯示所有關鍵字`;


            return rply;

        } case /(^[.]db$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]): {
            //顯示
            if (!groupid) {
                rply.text = '不在群組. ';
                return rply;
            }
            const gpList = await schema.trpgDatabase.findOne({ groupid: groupid });
            console.log('gpList', gpList)
            const dbDoc = gpList?.trpgDatabasefunction || [];
            console.log('dbDoc', dbDoc);
            let count = dbDoc.filter(item => item.topic !== undefined && item.topic !== "").length;
            console.log('count', count)
            if (count == 0) {
                rply.text = `沒有已設定的關鍵字.
使用.db add (關鍵字) (內容)即可增加關鍵字`;
                return rply;
            }
            rply.text += '資料庫列表:'
            let showNum = 0;
            for (let num = 0; num < dbDoc.length; num++) {
                console.log('num', num)
                if (!dbDoc[num].topic) continue;

                rply.text += (showNum % 3 == 0) ? "\n" : "      ";

                rply.text += `${num + 1}. ${dbDoc[num].topic}`;
                showNum++;

            }


            rply.quotes = true;
            //顯示資料庫
            console.log('rply.text', rply.text)
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            console.log('rply.text2', rply.text)
            return rply
        }
        case /(^[.]db$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]): {
            //顯示關鍵字
            //let times = /^[.]db/.exec(mainMsg[0])[1] || 1
            //if (times > 30) times = 30;
            //if (times < 1) times = 1
            if (!groupid) {
                rply.text = '不在群組. '
                return rply;
            }
            let temp = 0;
            if (_trpgDB && mainMsg[1])
                for (let i = 0; i < _trpgDB.length; i++) {
                    if (_trpgDB[i].groupid == groupid) {
                        //rply.text += '資料庫列表:'
                        for (let a = 0; a < _trpgDB[i].trpgDatabasefunction.length; a++) {
                            if (_trpgDB[i].trpgDatabasefunction[a].topic.toLowerCase() == mainMsg[1].toLowerCase()) {
                                temp = 1
                                rply.text = `【${_trpgDB[i].trpgDatabasefunction[a].topic}】\n${_trpgDB[i].trpgDatabasefunction[a].contact}`;

                            }

                        }
                    }
                }
            if (temp == 0) rply.text = '沒有相關關鍵字. '
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);

            // rply.text = rply.text.replace(/,/mg, ' ')
            return rply;
        }
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            //if (!mainMsg[2]) return;
            if (rply && _trpgDBgp && mainMsg[2])
                if (rply && _trpgDBgp && _trpgDBgp[0] && _trpgDBgp[0].trpgDatabaseAllgroup[0]) {
                    if (_trpgDBgp[0].trpgDatabaseAllgroup.length > 100) {
                        rply.text = '只可以有100個關鍵字啊'
                        return rply;
                    }
                    for (let i = 0; i < _trpgDBgp.length; i++) {
                        for (let a = 0; a < _trpgDBgp[i].trpgDatabaseAllgroup.length; a++) {
                            if (_trpgDBgp[i].trpgDatabaseAllgroup[a].topic.toLowerCase() == mainMsg[2].toLowerCase()) {
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
                            _trpgDBgp = msgs
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
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            records.get('trpgDatabaseAllgroup', (msgs) => {
                _trpgDBgp = msgs
            })
            if (_trpgDBgp)
                for (let i = 0; i < _trpgDBgp.length; i++) {
                    rply.text += '資料庫列表:'
                    for (let a = 0; a < _trpgDBgp[i].trpgDatabaseAllgroup.length; a++) {
                        tempshow = 1;
                        rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + a + '. ' + _trpgDBgp[i].trpgDatabaseAllgroup[a].topic : '      ' + a + '. ' + _trpgDBgp[i].trpgDatabaseAllgroup[a].topic;

                    }
                }
            if (tempshow == 0) rply.text = '沒有已設定的關鍵字. '
            //顯示資料庫
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply;
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            //let timesgp = /^[.]dbp/.exec(mainMsg[0])[1] || 1
            //  if (timesgp > 30) timesgp = 30;
            //  if (timesgp < 1) timesgp = 1
            if (_trpgDBgp && mainMsg[1])
                for (let i = 0; i < _trpgDBgp.length; i++) {
                    for (let a = 0; a < _trpgDBgp[i].trpgDatabaseAllgroup.length; a++) {
                        if (_trpgDBgp[i].trpgDatabaseAllgroup[a].topic.toLowerCase() == mainMsg[1].toLowerCase()) {
                            temp2 = 1
                            rply.text = `【${_trpgDBgp[i].trpgDatabaseAllgroup[a].topic}】
${_trpgDBgp[i].trpgDatabaseAllgroup[a].contact}`;


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
                return rollbase.Dice(temp[1]) || ' ';
            case /^random:\d+/i.test(second):
                temp = /^random:(\d+)-(\d+)/i.exec(second)
                if (!temp || !temp[1] || !temp[2]) return ' ';
                return rollbase.DiceINT(temp[1], temp[2]) || ' ';
            case /^allgp.name$/i.test(second):
                temp = await findGpMember(groupid);
                if (!temp) return ' ';
                num = rollbase.DiceINT(0, temp.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp[num].name
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
                num = rollbase.DiceINT(0, temp2.length - 1)
                num = (num < 1) ? 0 : num;
                temp = temp2[num]
                return temp || ' ';
            // * {allgp.title}<---隨機全GP其中一種稱號
            case /^server.member_count$/i.test(second):
                temp = await findGpMember(groupid);
                num = (temp && temp.length) ? Math.max(membercount, temp.length) : membercount;
                return num || ' ';
            //  {server.member_count} 現在頻道中總人數 \
            case /^my.RankingPer$/i.test(second): {
                //* {my.RankingPer} 現在排名百分比 \
                // let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
                let gpMember = await findGpMember(groupid);
                temp2 = await ranking(userid, gpMember)
                if (!temp2) return ' ';
                num = (temp && gpMember.length) ? Math.max(membercount, gpMember.length) : membercount;
                temp2 = Math.ceil(temp2 / num * 10000) / 100 + '%';
                return temp2 || ' ';
            }
            case /^my.Ranking$/i.test(second): {
                let gpMember = await findGpMember(groupid);
                //* {my.Ranking} 顯示擲骰者現在排名 \
                if (!gpMember) return ' ';
                return await ranking(userid, gpMember) || ' ';
            }
            case /^my.exp$/i.test(second):
                //* {my.exp} 顯示擲骰者經驗值
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(groupid, userid);
                if (!temp || !temp2 || !temp2.EXP) return ' ';
                return temp2.EXP || ' ';
            case /^my.name$/i.test(second):
                //* {my.name} <---顯示擲骰者名字
                return displaynameDiscord || displayname || "無名";
            case /^my.title$/i.test(second):
                // * {my.title}<---顯示擲骰者稱號
                temp = await findGp(groupid, userid, displayname, displaynameDiscord, membercount);
                temp2 = await findUser(groupid, userid);
                if (!temp || !temp2 || !temp2.Level || !temp.Title) return ' ';
                //   let userTitle = await this.checkTitle(userlevel, trpgLevelSystemfunction.trpgLevelSystemfunction[i].Title);
                return await exports.z_Level_system.checkTitle(temp2.Level, temp.Title) || ' ';
            case /^my.level$/i.test(second):
                //* {my.level}<---顯示擲骰者等級
                temp2 = await findUser(groupid, userid);
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
async function findGp(groupid) {
    if (!process.env.mongoURL || !groupid) {
        return;
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let gpInfo = await schema.trpgLevelSystem.findOne({
        groupid: groupid
    }).catch(error => console.error('db #430 mongoDB error: ', error.name, error.reson));
    if (!gpInfo || gpInfo.SwitchV2 != 1) return;
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}
async function findGpMember(groupid) {
    if (!process.env.mongoURL || !groupid) {
        return;
    }
    //1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
    let gpInfo = await schema.trpgLevelSystemMember.find({
        groupid: groupid
    }).catch(error => console.error('db #443 mongoDB error: ', error.name, error.reson));
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function findUser(groupid, userid) {
    if (!groupid || !userid) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({
        groupid: groupid,
        userid: userid
    }).catch(error => console.error('db #454 mongoDB error: ', error.name, error.reson));
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


async function reNewDb(dbName, dbData) {
    records.get(dbName, (msgs) => {
        dbData = msgs
    });
}
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};