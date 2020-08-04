"use strict";
if (!process.env.mongoURL) {
    return;
}
const rollbase = require('./rollbase.js');
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};
var randomAnsfunction = {};
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');
const limitArr = [1, 200, 200, 300, 300, 300, 300, 300];
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
    return 'randomAns:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.]ra(\d+|p|p\d+|)$)/ig,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【自定義回應功能】" + "\n\
這是根據關鍵字來隨機抽選功能,只要符合內容,以後就會隨機抽選\n\
例如輸入 .ra add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 \n\
再輸入.ra 九大陣營  就會輸出 九大陣營中其中一個\n\
如果輸入.ra3 九大陣營  就會輸出 3次九大陣營\n\
如果輸入.ra3 九大陣營 天干 地支 就會輸出 3次九大陣營 天干 地支\n\
add 後面第一個是關鍵字, 可以是漢字,數字和英文或emoji\n\
P.S.如果沒立即生效 用.ra show 刷新一下\n\
輸入.ra add (關鍵字) (選項1) (選項2) (選項3)即可增加關鍵字\n\
輸入.ra show 顯示所有關鍵字\n\
輸入.ra del(編號)或all 即可刪除\n\
輸入.ra(次數,最多30次) (關鍵字1)(關鍵字2)(關鍵字n) 即可隨機抽選 \n\
如使用輸入.rap 會變成全服版,全服可看, 可用add show功能 \n\
例如輸入 .rap10 聖晶石召喚 即可十連抽了 \n\
"
}
var initialize = function () {
    return rply;
}

// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
    let checkifsamename = 0;
    rply.text = '';
    let times = (/^[.]ra(\d+|)/i.exec(mainMsg[0])) ? /^[.]ra(\d+|)/i.exec(mainMsg[0])[1] : 1;
    let timesgp = (/^[.]rap(\d+|)/i.exec(mainMsg[0])) ? /^[.]rap(\d+|)/i.exec(mainMsg[0])[1] : 1;
    let temp2 = 0;
    let checkifsamenamegroup = 0;
    let tempshow = 0;
    let lv;
    let limit = limitArr[0];
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        case /(^[.]ra(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            //
            //增加自定義關鍵字
            // .ra[0] add[1] 標題[2] 隨機1[3] 隨機2[4] 
            /*
            只限四張角色卡.
            使用VIPCHECK
            */
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = limitArr[lv];

            checkifsamename = 0
            if (groupid && userrole >= 1 && mainMsg[3] && mainMsg[4]) {
                if (randomAnsfunction.randomAnsfunction)
                    for (var i = 0; i < randomAnsfunction.randomAnsfunction.length; i++) {
                        if (randomAnsfunction.randomAnsfunction[i].groupid == groupid) {
                            // console.log('checked1')
                            if (randomAnsfunction.randomAnsfunction[i].randomAnsfunction.length >= limit) {
                                rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                                return rply;
                            }
                            for (var a = 0; a < randomAnsfunction.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                if (randomAnsfunction.randomAnsfunction[i].randomAnsfunction[a][0].toLowerCase() == mainMsg[2].toLowerCase()) {
                                    //   console.log('checked')
                                    checkifsamename = 1
                                }
                            }
                        }
                    }
                let temp = {
                    groupid: groupid,
                    randomAnsfunction: [mainMsg.slice(2)]
                }
                if (checkifsamename == 0) {
                    records.pushrandomAnsfunction('randomAns', temp, () => {
                        records.get('randomAns', (msgs) => {
                            randomAnsfunction.randomAnsfunction = msgs
                            // console.log(rply);
                        })

                    })
                    rply.text = '新增成功: ' + mainMsg[2]
                } else rply.text = '新增失敗. 重複關鍵字'
            } else {
                rply.text = '新增失敗.'
                if (!mainMsg[2])
                    rply.text += ' 沒有關鍵字.'
                if (!mainMsg[3] && !mainMsg[4])
                    rply.text += ' 沒有自定義回應,至少兩個.'
                if (!groupid)
                    rply.text += ' 不在群組.'
                if (groupid && userrole < 1)
                    rply.text += ' 只有GM以上才可新增.'
            }
            return rply;
        case /(^[.]ra(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //    
            //刪除所有自定義關鍵字
            //
            if (!mainMsg[2]) return;
            if (groupid && mainMsg[2] && randomAnsfunction.randomAnsfunction && userrole >= 2) {
                for (let i = 0; i < randomAnsfunction.randomAnsfunction.length; i++) {
                    if (randomAnsfunction.randomAnsfunction[i].groupid == groupid) {
                        let temp = randomAnsfunction.randomAnsfunction[i]
                        temp.randomAnsfunction = []
                        records.setrandomAnsfunction('randomAns', temp, () => {
                            records.get('randomAns', (msgs) => {
                                randomAnsfunction.randomAnsfunction = msgs
                            })
                        })
                        rply.text = '刪除所有關鍵字'
                    }
                }
            } else {
                rply.text = '刪除失敗.'
                if (!groupid)
                    rply.text += '不在群組. '
                if (groupid && userrole < 2)
                    rply.text += '只有GM以上才可刪除所有關鍵字. '
            }

            return rply;
        case /(^[.]ra(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //
            //刪除自定義關鍵字
            //
            if (groupid && mainMsg[2] && randomAnsfunction.randomAnsfunction && userrole >= 1) {
                for (let i = 0; i < randomAnsfunction.randomAnsfunction.length; i++) {
                    if (randomAnsfunction.randomAnsfunction[i].groupid == groupid && mainMsg[2] < randomAnsfunction.randomAnsfunction[i].randomAnsfunction.length && mainMsg[2] >= 0) {
                        let temp = randomAnsfunction.randomAnsfunction[i]
                        temp.randomAnsfunction.splice(mainMsg[2], 1)
                        //console.log('randomAnsfunction.randomAnsfunction: ', temp)
                        records.setrandomAnsfunction('randomAns', temp, () => {
                            records.get('randomAns', (msgs) => {
                                randomAnsfunction.randomAnsfunction = msgs
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
        case /(^[.]ra(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            records.get('randomAns', (msgs) => {
                randomAnsfunction.randomAnsfunction = msgs
            })
            if (groupid) {
                let temp = 0;
                if (randomAnsfunction.randomAnsfunction)
                    for (let i = 0; i < randomAnsfunction.randomAnsfunction.length; i++) {
                        if (randomAnsfunction.randomAnsfunction[i].groupid == groupid) {
                            rply.text += '自定義關鍵字列表:'
                            for (let a = 0; a < randomAnsfunction.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                temp = 1
                                rply.text += ("\n") + a + '. ' + randomAnsfunction.randomAnsfunction[i].randomAnsfunction[a][0]
                            }
                        }
                    }
                if (temp == 0) rply.text = '沒有已設定的關鍵字. '
            } else {
                rply.text = '不在群組. '
            }
            //顯示自定義關鍵字
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply
        case /(^[.]ra(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            //
            //RA使用抽選功能
            //
            times = /^[.]ra(\d+|)/i.exec(mainMsg[0])[1] || 1
            if (times > 30) times = 30;
            if (times < 1) times = 1
            //console.log(times)
            if (groupid) {
                //    console.log(mainMsg[1])
                let temp = 0;
                if (randomAnsfunction.randomAnsfunction)
                    for (let i = 0; i < randomAnsfunction.randomAnsfunction.length; i++) {
                        if (randomAnsfunction.randomAnsfunction[i].groupid == groupid) {
                            // console.log(randomAnsfunction.randomAnsfunction[i])
                            //rply.text += '自定義關鍵字列表:'
                            for (let aa = 1; aa < mainMsg.length; aa++)
                                for (let a = 0; a < randomAnsfunction.randomAnsfunction[i].randomAnsfunction.length; a++) {
                                    if (randomAnsfunction.randomAnsfunction[i].randomAnsfunction[a][0].toLowerCase() == mainMsg[aa].toLowerCase()) {
                                        temp = 1
                                        let temptitle = randomAnsfunction.randomAnsfunction[i].randomAnsfunction[a][0];
                                        let tempcontact = [...randomAnsfunction.randomAnsfunction[i].randomAnsfunction[a]];
                                        tempcontact.shift();
                                        rply.text += temptitle + ' → ';
                                        let result = [];


                                        for (; result.length < times;) {
                                            result = result.concat(await shuffle([...tempcontact]))
                                        }
                                        rply.text += result[0];
                                        for (let t = 1; t < times; t++) {
                                            rply.text += ' , ' + result[t];
                                        }
                                        rply.text += '\n'
                                    }

                                }
                        }
                    }
                if (temp == 0) rply.text = '沒有相關關鍵字. '
            } else {
                rply.text = '不在群組. '
            }
            return rply;
        case /(^[.]rap(\d+|)$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            //
            //增加
            //
            checkifsamenamegroup = 0
            if (randomAnsfunction.randomAnsAllgroup && mainMsg[2] && mainMsg[3] && mainMsg[4])
                for (let i = 0; i < randomAnsfunction.randomAnsAllgroup.length; i++) {
                    if (randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup.length > 30) {
                        rply.text = '防呆，只可以有100個關鍵字啊'
                        return rply;
                    }
                    for (let a = 0; a < randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup.length; a++) {
                        if (randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup[a][0].toLowerCase() == mainMsg[2].toLowerCase()) {
                            checkifsamenamegroup = 1
                        }
                    }
                }
            if (mainMsg[3] && mainMsg[4]) {
                let tempA = {
                    randomAnsAllgroup: [mainMsg.slice(2)]
                }
                if (checkifsamenamegroup == 0) {
                    records.pushrandomAnsAllgroup('randomAnsAllgroup', tempA, () => {
                        records.get('randomAnsAllgroup', (msgs) => {
                            randomAnsfunction.randomAnsAllgroup = msgs
                            // console.log(rply);
                        })
                    })
                    rply.text = '新增成功: ' + mainMsg[2]
                } else {
                    rply.text = '新增失敗. 重複關鍵字'
                }
            } else {
                rply.text = '新增失敗.'
                if (!mainMsg[2])
                    rply.text += ' 沒有關鍵字.'
                if (!mainMsg[3] && !mainMsg[4])
                    rply.text += ' 沒有自定義回應,至少兩個.'
            }
            return rply;
            /* case /(^[.]rap(\d+|)$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                 //刪除自定義關鍵字
                 if (mainMsg[2] && randomAnsfunction.randomAnsAllgroup) {
                     for (var i = 0; i < randomAnsfunction.randomAnsAllgroup.length; i++) {
                         if (mainMsg[2] < randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup.length && mainMsg[2] >= 0) {
                             let temp = randomAnsfunction.randomAnsAllgroup[i]
                             temp.randomAnsAllgroup.splice(mainMsg[2], 1)
                             //console.log('randomAnsfunction.randomAnsAllgroup: ', temp)
                             records.setrandomAnsAllgroup('randomAnsAllgroup', temp, () => {
                                 records.get('randomAnsAllgroup', (msgs) => {
                                     randomAnsfunction.randomAnsAllgroup = msgs
                                 })
                             })
                         }
                         rply.text = '刪除成功: ' + mainMsg[2]
                     }
                 } else {
                     rply.text = '刪除失敗.'
                     if (!mainMsg[2])
                         rply.text += '沒有關鍵字. '

                 }
                 return rply;
                 */
        case /(^[.]rap(\d+|)$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //
            //顯示列表
            //
            records.get('randomAnsAllgroup', (msgs) => {
                randomAnsfunction.randomAnsAllgroup = msgs
                //  console.log(rply)
            })
            tempshow = 0;
            if (randomAnsfunction.randomAnsAllgroup)
                for (let i = 0; i < randomAnsfunction.randomAnsAllgroup.length; i++) {
                    rply.text += '自定義關鍵字列表:'
                    for (let a = 0; a < randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup.length; a++) {
                        tempshow = 1
                        rply.text += ("\n") + a + '. ' + randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup[a][0]
                    }
                }
            if (tempshow == 0) rply.text = '沒有已設定的關鍵字. '
            //顯示自定義關鍵字
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply
        case /(^[.]rap(\d+|)$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            //
            //RAP顯示抽選功能
            //
            timesgp = /^[.]rap(\d+|)/i.exec(mainMsg[0])[1] || 1
            if (timesgp > 30) timesgp = 30;
            if (timesgp < 1) timesgp = 1
            temp2 = 0;
            if (randomAnsfunction.randomAnsAllgroup)
                for (let i = 0; i < randomAnsfunction.randomAnsAllgroup.length; i++) {
                    for (let aa = 1; aa < mainMsg.length; aa++)
                        for (let a = 0; a < randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup.length; a++) {
                            if (randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup[a][0].toLowerCase() == mainMsg[aa].toLowerCase()) {
                                temp2 = 1
                                let GPtemp = randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup[a];
                                let GPtempcontact = [...randomAnsfunction.randomAnsAllgroup[i].randomAnsAllgroup[a]];
                                GPtempcontact.shift();
                                rply.text += GPtemp[0] + ' → ';
                                let result = [];
                                for (; result.length < timesgp;) {
                                    result = result.concat(await shuffle([...GPtempcontact]))
                                }
                                rply.text += result[0];
                                for (let t = 1; t < timesgp; t++) {
                                    rply.text += ' , ' + result[t];
                                }
                                rply.text += '\n';
                            }
                        }
                }
            if (temp2 == 0) rply.text = '沒有相關關鍵字. '
            return rply;
        default:
            break;
    }
}


async function shuffle(array) {
    let currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        //currentIndex 
        //randomIndex = math.floor(math.random() * currentIndex);
        randomIndex = await rollbase.Dice(currentIndex) - 1
        //randomIndex =await rollbase.Dice(currentIndex) - 1
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};