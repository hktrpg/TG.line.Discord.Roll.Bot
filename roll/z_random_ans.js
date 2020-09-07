"use strict";
if (!process.env.mongoURL) {
    return;
}
const rollbase = require('./rollbase.js');
const schema = require('../modules/core-schema.js');
const randomAnsfunction = {
    randomAnsfunction: [],
    randomAnsAllgroup: []
};
const opt = {
    upsert: true,
    runValidators: true
}
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');
const limitArr = [30, 200, 200, 300, 300, 300, 300, 300];
records.get('randomAns', (msgs) => {
    randomAnsfunction.randomAnsfunction = msgs
})
records.get('randomAnsAllgroup', (msgs) => {
    randomAnsfunction.randomAnsAllgroup = msgs
})
var gameName = function () {
    return '(公測中)自定義回應功能 .ra(p)(次數) (add del show 自定關鍵字)'
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
const getHelpMessage = function () {
    return "【自定義回應功能】" + "\n\
這是根據關鍵字來隨機抽選功能,只要符合內容,以後就會隨機抽選\n\
例如輸入 .ra add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 \n\
再輸入.ra 九大陣營  就會輸出 九大陣營中其中一個\n\
如果輸入.ra3 九大陣營  就會輸出 3次九大陣營\n\
如果輸入.ra3 九大陣營 天干 地支 就會輸出 3次九大陣營 天干 地支\n\
如果輸入.rra3 九大陣營 就會輸出3次有可能重覆的九大陣營\n\
add 後面第一個是關鍵字, 可以是漢字,數字和英文或emoji\n\
P.S.如果沒立即生效 用.ra show 刷新一下\n\
輸入.ra add (關鍵字) (選項1) (選項2) (選項3)即可增加關鍵字\n\
輸入.ra show 顯示所有關鍵字\n\
輸入.ra show (關鍵字)顯示內容\n\
輸入.ra del (關鍵字) 即可刪除\n\
輸入.ra(次數,最多30次) (關鍵字1)(關鍵字2)(關鍵字n) 即可不重覆隨機抽選 \n\
輸入.rra(次數,最多30次) (關鍵字1)(關鍵字2)(關鍵字n) 即可重覆隨機抽選 \n\
如使用輸入.rap 會變成全服版,全服可看, 可用add show功能 \n\
例如輸入 .rap10 聖晶石召喚 即可十連抽了 \n\
"
}
const initialize = function () {
    return randomAnsfunction;
}

// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
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
            rply.text = this.getHelpMessage();
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
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
                rply.text += ' 沒有自定義回應,至少兩個.'
            if (!groupid)
                rply.text += ' 不在群組.'
            if (groupid && userrole < 1)
                rply.text += ' 只有GM以上才可新增.'
            if (rply.text) {
                rply.text = '新增失敗.\n' + rply.text;
                return rply;
            }
            getData = await randomAnsfunction.randomAnsfunction.find(e => e.groupid == groupid)
            if (getData)
                check = await getData.randomAnsfunction.find(e =>
                    e[0].toLowerCase() == mainMsg[2].toLowerCase()
                )
            if (check) {
                rply.text = '新增失敗. 重複關鍵字'
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
                records.get('randomAns', (msgs) => {
                    randomAnsfunction.randomAnsfunction = msgs
                    // console.log(rply);
                })
                rply.text = '新增成功: ' + mainMsg[2]
            } else rply.text = '新增失敗'
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]):
            //
            //刪除自定義關鍵字
            //
            if (!mainMsg[2])
                rply.text += '沒有關鍵字. '
            if (!groupid)
                rply.text += '不在群組. '
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
            console.log(getData)
            temp = getData.randomAnsfunction.filter(e => e[0].toLowerCase() === mainMsg[2].toLowerCase());
            console.log(temp)
            if (temp.length == 0) {
                rply.text += '沒有此關鍵字. \n現在已更新刪除方式, 刪除請輸入 .ra del 名字'
                return rply;
            }
            temp.forEach(f => getData.randomAnsfunction.splice(getData.randomAnsfunction.findIndex(e => e[0] === f[0]), 1));
            check = await getData.save();
            if (check) {
                records.get('randomAns', (msgs) => {
                    randomAnsfunction.randomAnsfunction = msgs
                })
                rply.text += '刪除成功\n' + temp;

            }
            return rply;
        case /(^[.](r|)ra(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            records.get('randomAns', (msgs) => {
                randomAnsfunction.randomAnsfunction = msgs
            })
            if (!groupid) {
                rply.text += '不在群組. '
                return rply;
            }
            getData = await randomAnsfunction.randomAnsfunction.find(e => e.groupid == groupid);
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
                rply.text = '不在群組. '
            }
            times = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[2] || 1;
            check = /^[.](r|)ra(\d+|)/i.exec(mainMsg[0])[1] || '';
            if (times > 30) times = 30;
            if (times < 1) times = 1
            getData = randomAnsfunction.randomAnsfunction.find(e => e.groupid == groupid)
            if (!getData) return;
            for (let i in mainMsg) {
                if (i == 0) continue;
                temp = getData.randomAnsfunction.find(e => e[0].toLowerCase() == mainMsg[i].toLowerCase())
                if (!temp) continue;
                if (check) {
                    //repeat mode
                    rply.text += temp[0] + ' → ';
                    for (let num = 0; num < times; num++) {
                        let randomNumber = await rollbase.Dice(temp.length - 1);
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
            getData = await randomAnsfunction.randomAnsAllgroup.find(e => e)
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
                records.get('randomAnsAllgroup', (msgs) => {
                    randomAnsfunction.randomAnsAllgroup = msgs
                    // console.log(rply);
                })
                rply.text = '新增成功: ' + mainMsg[2]
            } else rply.text = '新增失敗'
            return rply;
        case /(^[.](r|)rap(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            records.get('randomAnsAllgroup', (msgs) => {
                randomAnsfunction.randomAnsAllgroup = msgs
            })
            getData = await randomAnsfunction.randomAnsAllgroup.find(e => e);
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
            getData = randomAnsfunction.randomAnsAllgroup.find(e => e)
            if (!getData) return;
            for (let i in mainMsg) {
                if (i == 0) continue;
                temp = getData.randomAnsAllgroup.find(e => e[0].toLowerCase() == mainMsg[i].toLowerCase())
                if (!temp) continue;
                if (check) {
                    //repeat mode
                    rply.text += temp[0] + ' → ';
                    for (let num = 0; num < times; num++) {
                        let randomNumber = await rollbase.Dice(temp.length - 1);
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
            return rply;
        default:
            break;
    }
}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};