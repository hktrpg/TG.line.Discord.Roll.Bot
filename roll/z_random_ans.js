"use strict";
if (!process.env.mongoURL) {
    return;
}
const rollbase = require('./rollbase.js');
const schema = require('../modules/schema.js');
exports.z_Level_system = require('./z_Level_system');
const opt = {
    upsert: true,
    runValidators: true
}

const VIP = require('../modules/veryImportantPerson');
const limitArr = [30, 200, 200, 300, 300, 300, 300, 300];
var gameName = function () {
    return '(公測中)自定義骰子/回應功能 .ra(p)(次數) (add del show 自定關鍵字)'
}
var gameType = function () {
    return 'funny:randomAns:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.](r|)ra(\d+|p|p\d+|)$)/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【自定義骰子/回應功能】
這是根據關鍵字來隨機抽選功能,只要符合內容,以後就會隨機抽選

輸入.ra add (關鍵字) (選項1) (選項2) (選項3)即可增加關鍵字
重覆輸入，可以增加選項，總共上限3000字

輸入.ra show 顯示所有關鍵字及編號
輸入.ra show (關鍵字)顯示內容
輸入.ra del (關鍵字) 即可刪除
輸入.ra(次數,最多30次) (關鍵字1/編號)(關鍵字2)(關鍵字n) 即可不重覆隨機抽選 
輸入.rra(次數,最多30次) (關鍵字1/編號)(關鍵字2)(關鍵字n) 即可重覆隨機抽選

如使用輸入.rap 會變成全服版,全服可看, 可用add show功能 
例如輸入 .rap10 聖晶石召喚 即可十連抽了 

例如輸入 .ra add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 
再輸入.ra 九大陣營  就會輸出 九大陣營中其中一個
如果輸入.ra3 九大陣營  就會輸出 3次九大陣營
如果輸入.ra3 九大陣營 天干 地支 就會輸出 3次九大陣營 天干 地支
如果輸入.rra3 九大陣營 就會輸出3次有可能重覆的九大陣營
add 後面第一個是關鍵字, 可以是漢字,數字和英文或emoji

--20210719 新增: 關鍵字可用數字代替, 如編號5,可以輪入 .ra 5 --

新增指令 - 輸入.rap newType 可以觀看效果
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
    return;
}
/**
 * {ran:100} <---隨機1-100
 * {random:5-20} <---隨機5-20
 * {allgp.name} <---隨機全GP其中一人名字
 * {allgp.title}<---隨機全GP其中一人稱號
 * {server.member_count}<---現在頻道中總人數 \
 * {my.RankingPer}<---現在排名百分比 \
 * {my.Ranking}<---顯示擲骰者現在排名 \
 * {my.exp}<---顯示擲骰者經驗值
 * {my.name} <---顯示擲骰者名字
 * {my.title}<---顯示擲骰者稱號
 * {my.level}<---顯示擲骰者等級
 */
var rollDiceCommand = async function ({
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
    let times = [];
    let lv;
    let limit = limitArr[0];
    let getData;
    let check;
    let temp;
    let filter;
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]): {
            //
            //增加自定義關鍵字
            // .ra[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
            /*
            只限四張角色卡.
            使用VIPCHECK
            */
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = limitArr[lv];
            if (!mainMsg[2])
                rply.text += ' 沒有關鍵字.'
            if (!mainMsg[4])
                rply.text += ' 沒有自定義內容,至少兩個.'
            if (!groupid)
                rply.text += ' 此功能必須在群組中使用.'
            if (groupid && userrole < 1)
                rply.text += ' 只有GM以上才可新增.'
            if (rply.text) {
                rply.text = '新增失敗.\n' + rply.text;
                return rply;
            }
            getData = await schema.randomAns.findOne({ groupid: groupid })
            let update = false;
            let findIndex = getData && getData.randomAnsfunction.findIndex((e) => {
                return e && e[0] && e[0].toLowerCase() == mainMsg[2].toLowerCase()
            })
            if (findIndex >= 0 && findIndex != null) {
                let tempCheck = getData.randomAnsfunction[findIndex].join('') + mainMsg.slice(3).join('')
                if (tempCheck.length > 3000) {
                    rply.text = '更新失敗. 總內容不得超過3000字'
                    return rply;
                } else {
                    update = true;
                    getData.randomAnsfunction.set(findIndex, [...getData.randomAnsfunction[findIndex], ...mainMsg.slice(3)])
                }
            }
            if (update) {
                await getData.save();
                rply.text = `已更新!\n.ra show ${mainMsg[2]} 可以顯示所有內容`
                return rply;
            }
            if (getData && getData.randomAnsfunction.length >= limit) {
                rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply;
            }
            temp = {
                randomAnsfunction: [mainMsg.slice(2)]
            }
            check = await schema.randomAns.updateOne({
                groupid: groupid
            }, {
                $push: temp
            }, opt)
            if (check.n == 1) {
                rply.text = '新增成功: ' + mainMsg[2]
            } else rply.text = '新增失敗'
            return rply;
        } case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]):
            //
            //刪除自定義關鍵字
            //
            if (!mainMsg[2])
                rply.text += '沒有關鍵字. '
            if (!groupid)
                rply.text += '此功能必須在群組中使用. '
            if (groupid && userrole < 1)
                rply.text += '只有GM以上才可刪除. '
            if (rply.text)
                return rply;
            filter = {
                groupid: groupid,
            };
            getData = await schema.randomAns.findOne(filter)
            if (!getData) {
                rply.text += '沒有此關鍵字. '
                return rply;
            }
            temp = getData.randomAnsfunction.filter(e => e[0].toLowerCase() === mainMsg[2].toLowerCase());
            if (temp.length == 0) {
                rply.text += '沒有此關鍵字. \n現在已更新刪除方式, 刪除請輸入 .ra del 名字'
                return rply;
            }
            temp.forEach(f => getData.randomAnsfunction.splice(getData.randomAnsfunction.findIndex(e => e[0] === f[0]), 1));
            check = await getData.save();
            if (check) {
                rply.text += '刪除成功\n' + temp;
            }
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            if (!groupid) {
                rply.text += '此功能必須在群組中使用. '
                return rply;
            }
            rply.quotes = true;
            getData = await schema.randomAns.findOne({ groupid: groupid })
            if (!getData || getData.randomAnsfunction.length == 0) {
                rply.text = '沒有已設定的關鍵字. '
                return rply
            }
            if (mainMsg[2]) {
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[2].toLowerCase())
                for (let i in temp) {
                    rply.text += (i == 0) ? '自定義關鍵字 ' + temp[i] + '\n' : '';
                    rply.text += ((i % 2 && i != 1) && i !== 0) ? ("\n") + i + '. ' + temp[i] + "        " : (i == 0) ? '' : i + '. ' + temp[i] + "        ";
                }
            }
            if (rply.text) {
                return rply
            }
            rply.text += '自定義關鍵字列表:';
            for (let a in getData.randomAnsfunction) {
                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + a + '. ' + getData.randomAnsfunction[a][0] : "     " + a + '. ' + getData.randomAnsfunction[a][0];
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            rply.text += '\n在show [空格]後面輸入關鍵字標題, 可以顯示詳細內容';
            return rply
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            //
            //RA使用抽選功能
            //
            if (!groupid) {
                rply.text = '此功能必須在群組中使用. '
            }
            times = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[2] || 1;
            check = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) times = 30;
            if (times < 1) times = 1
            getData = await schema.randomAns.findOne({ groupid: groupid })
            if (!getData) return;
            for (let i in mainMsg) {
                if (i == 0) continue;
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[i].toLowerCase())
                if (!temp && mainMsg[i].match(/^\d+$/)) {
                    temp = getData.randomAnsfunction[mainMsg[i]]
                }
                if (!temp) continue;
                if (check) {
                    //repeat mode
                    rply.text += temp[0] + ' → ';
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.length - 1);
                        rply.text += (num == 0) ? temp[randomNumber] : ', ' + temp[randomNumber];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                } else {
                    //not repeat mode
                    rply.text += temp[0] + ' → ';
                    let items = [];
                    let tempItems = [...temp]
                    tempItems.splice(0, 1);
                    while (items.length < times) {
                        items = tempItems
                            .map((a) => ({
                                sort: Math.random(),
                                value: a
                            }))
                            .sort((a, b) => a.sort - b.sort)
                            .map((a) => a.value)
                            .concat(items)
                    }
                    for (let num = 0; num < times; num++) {
                        rply.text += (num == 0) ? items[num] : ', ' + items[num];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                }

            }
            rply.text = await replaceAsync(rply.text, /{(.*?)}/ig, replacer);
            return rply;
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            //
            //增加自定義關鍵字
            // .rap[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
            if (!mainMsg[2])
                rply.text += ' 沒有關鍵字.'
            if (!mainMsg[4])
                rply.text += ' 沒有自定義回應,至少兩個.'
            if (rply.text) {
                rply.text = '新增失敗.\n' + rply.text;
                return rply;
            }
            getData = await schema.randomAnsAllgroup.findOne({})
            if (getData)
                check = await getData.randomAnsAllgroup.find(e =>
                    e[0].toLowerCase() == mainMsg[2].toLowerCase()
                )
            if (check) {
                rply.text = '新增失敗. 重複關鍵字'
                return rply;
            }
            if (getData.randomAnsAllgroup.length > 100) {
                rply.text = '公共關鍵字上限' + 100 + '個';
                return rply;
            }
            temp = {
                randomAnsAllgroup: [mainMsg.slice(2)]
            }
            check = await schema.randomAnsAllgroup.updateOne({}, {
                $push: temp
            }, opt)
            if (check.n == 1) {
                rply.text = '新增成功: ' + mainMsg[2]
            } else rply.text = '新增失敗'
            return rply;
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            rply.quotes = true;
            getData = await schema.randomAnsAllgroup.findOne({})
            if (!getData || getData.randomAnsAllgroup.length == 0) {
                rply.text = '沒有已設定的關鍵字. '
                return rply
            }
            if (mainMsg[2]) {
                temp = getData.randomAnsAllgroup.find(e => e[0].toLowerCase() == mainMsg[2].toLowerCase())
                for (let i in temp) {
                    rply.text += (i == 0) ? '自定義關鍵字 ' + temp[i] + '\n' : '';
                    rply.text += ((i % 2 && i != 1) && i !== 0) ? ("\n") + i + '. ' + temp[i] + "        " : (i == 0) ? '' : i + '. ' + temp[i] + "        ";
                }
            }
            if (rply.text) {
                return rply
            }
            rply.text += '自定義關鍵字列表:';
            for (let a in getData.randomAnsAllgroup) {
                rply.text += ((a % 2 && a != 1) || a == 0) ? ("\n") + a + '. ' + getData.randomAnsAllgroup[a][0] : "     " + a + '. ' + getData.randomAnsAllgroup[a][0];
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            rply.text += '\n在show [空格]後面輸入關鍵字標題, 可以顯示詳細內容';
            return rply
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            //
            //RAP使用抽選功能
            //
            times = /^[.](r|)rap(\d+|)/i.exec(mainMsg[0])[2] || 1;
            check = /^[.](r|)rap(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) times = 30;
            if (times < 1) times = 1
            getData = await schema.randomAnsAllgroup.findOne({})
            if (!getData) return;
            for (let i in mainMsg) {
                if (i == 0) continue;
                temp = getData.randomAnsAllgroup.find(e => e[0].toLowerCase() == mainMsg[i].toLowerCase())
                if (!temp && mainMsg[i].match(/^\d+$/)) {
                    temp = getData.randomAnsAllgroup[mainMsg[i]]
                }
                if (!temp) continue;
                if (check) {
                    //repeat mode
                    rply.text += temp[0] + ' → ';
                    for (let num = 0; num < times; num++) {
                        let randomNumber = rollbase.Dice(temp.length - 1);
                        rply.text += (num == 0) ? temp[randomNumber] : ', ' + temp[randomNumber];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                } else {
                    //not repeat mode
                    rply.text += temp[0] + ' → ';
                    let items = [];
                    let tempItems = [...temp]
                    tempItems.splice(0, 1);
                    while (items.length < times) {
                        items = tempItems
                            .map((a) => ({
                                sort: Math.random(),
                                value: a
                            }))
                            .sort((a, b) => a.sort - b.sort)
                            .map((a) => a.value)
                            .concat(items)
                    }
                    for (let num = 0; num < times; num++) {
                        rply.text += (num == 0) ? items[num] : ', ' + items[num];
                        rply.text += (num == times - 1) ? '\n' : '';
                    }
                }

            }
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
                temp = (temp && temp[num] && temp[num].name) ? temp[num].name : ' ';
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
                temp = (temp2 && temp2[num]) ? temp2[num] : ' ';
                return temp;
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
    });
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
    });
    // userInfo.name = displaynameDiscord || displayname || '無名'
    return gpInfo;
    //6 / 7 * LVL * (2 * LVL * LVL + 30 * LVL + 100)
}

async function findUser(groupid, userid) {
    if (!groupid || !userid) return;
    let userInfo = await schema.trpgLevelSystemMember.findOne({
        groupid: groupid,
        userid: userid
    });
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