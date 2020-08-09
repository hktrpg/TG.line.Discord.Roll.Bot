"use strict";
if (!process.env.mongoURL) {
    return;
}
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
    return '(公測中)資料庫功能 .db(p) (add del show 自定關鍵字)'
}
var gameType = function () {
    return 'trpgDatabase:hktrpg'
}
var prefixs = function () {
    return [{
        first: /(^[.]db(p|)$)/ig,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【資料庫功能】" + "\n\
這是根據關鍵字來顯示數據的,\n\
例如輸入 .db add 九大陣營 守序善良 (...太長省略) 中立邪惡 混亂邪惡 \n\
再輸入.db 九大陣營  守序善良 (...太長省略) 中立邪惡 混亂邪惡\n\
add 後面第一個是關鍵字, 可以是漢字,數字,英文及emoji\n\
P.S.如果沒立即生效 用.db show 刷新一下\n\
輸入.db add (關鍵字) (內容)即可增加關鍵字\n\
輸入.db show 顯示所有關鍵字\n\
輸入.db del(編號)或all 即可刪除\n\
輸入.db  (關鍵字) 即可顯示 \n\
如使用輸入.dbp 會變成全服版,全服可看, 可用add show功能 \n\
"
}
var initialize = function () {
    return trpgDatabasefunction;
}

// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
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
        case /(^[.]db$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
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
                            // console.log('checked1')
                            if (trpgDatabasefunction.trpgDatabasefunction[0] && trpgDatabasefunction.trpgDatabasefunction[0].trpgDatabasefunction[0]) {
                                if (trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length >= limit) {
                                    rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                                    return rply;
                                }
                                for (var a = 0; a < trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction.length; a++) {
                                    if (trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic == mainMsg[2]) {
                                        //   console.log('checked')
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
                        contact: inputStr.replace(/\.db\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
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

        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
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
        case /(^[.]db$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
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

        case /(^[.]db$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
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
                                temp = 1
                                rply.text += ("\n") + a + '. ' + trpgDatabasefunction.trpgDatabasefunction[i].trpgDatabasefunction[a].topic
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
        case /(^[.]db$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
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
            } else {
                rply.text = '不在群組. '
            }
            rply.text = rply.text.replace(/,/mg, ' ')
            return rply;
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
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
                if (!mainMsg[3])
                    rply.text += ' 沒有內容.'
            }
            return rply;
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            records.get('trpgDatabaseAllgroup', (msgs) => {
                trpgDatabasefunction.trpgDatabaseAllgroup = msgs
            })
            if (trpgDatabasefunction.trpgDatabaseAllgroup)
                for (let i = 0; i < trpgDatabasefunction.trpgDatabaseAllgroup.length; i++) {
                    rply.text += '資料庫列表:'
                    for (let a = 0; a < trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup.length; a++) {
                        tempshow = 1
                        rply.text += ("\n") + a + '. ' + trpgDatabasefunction.trpgDatabaseAllgroup[i].trpgDatabaseAllgroup[a].topic
                    }
                }
            if (tempshow == 0) rply.text = '沒有已設定的關鍵字. '
            //顯示資料庫
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply
        case /(^[.]dbp$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[0]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
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