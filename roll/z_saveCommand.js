"use strict";
try {
    var rply = {
        default: 'on',
        type: 'text',
        text: '',
        save: ''
    };
    const records = require('../modules/records.js');
    records.get('trpgCommand', (msgs) => {
        rply.trpgCommandfunction = msgs
    })

    var gameName = function () {
        return '(公測中)儲存擲骰指令功能 .cmd (add del show 自定關鍵字)'
    }
    var gameType = function () {
        return 'trpgCommand:hktrpg'
    }
    var prefixs = function () {
        return [{
            first: /(^[.]cmd$)/ig,
            second: null
        }]
    }
    var getHelpMessage = function () {
        return "【儲存擲骰指令功能】" + "\
        \n 這是根據關鍵字來再現擲骰指令,\
        \n 例如輸入 .cmd add  pc1鬥毆 cc 80 鬥毆 \
        \n 再輸入.cmd pc1鬥毆  就會執行後方的指令\
        \n add 後面第一個是關鍵字, 可以是符號或任何字\
        \n P.S.如果沒立即生效 用.cmd show 刷新一下\
    \n 輸入.cmd add (關鍵字) (指令)即可增加關鍵字\
    \n 輸入.cmd show 顯示所有關鍵字\
    \n 輸入.cmd del(編號)或all 即可刪除\
    \n 輸入.cmd  (關鍵字) 即可執行 \
    \n "
    }
    var initialize = function () {
        return rply;
    }

    var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {

        rply.text = '';
        switch (true) {
            case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
                rply.text = this.getHelpMessage();
                return rply;

                // .cmd(0) ADD(1) TOPIC(2) CONTACT(3)
            case /(^[.]cmd$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
                //console.log('mainMsg: ', mainMsg)
                //增加資料庫
                //檢查有沒有重覆

                let checkifsamename = 0
                if (groupid && userrole >= 1 && mainMsg[3] && mainMsg[2] && mainMsg[3].toLowerCase() != ".cmd") {
                    if (rply.trpgCommandfunction)
                        for (var i = 0; i < rply.trpgCommandfunction.length; i++) {
                            if (rply.trpgCommandfunction[i].groupid == groupid) {
                                if (rply.trpgCommandfunction[i].trpgCommandfunction.length > 30) {
                                    rply.text = '只可以有30個關鍵字啊'
                                    return rply;
                                }
                                // console.log('checked1')
                                if (rply.trpgCommandfunction[0] && rply.trpgCommandfunction[0].trpgCommandfunction[0])
                                    for (var a = 0; a < rply.trpgCommandfunction[i].trpgCommandfunction.length; a++) {
                                        if (rply.trpgCommandfunction[i].trpgCommandfunction[a].topic == mainMsg[2]) {
                                            //   console.log('checked')
                                            checkifsamename = 1
                                        }
                                    }
                            }
                        }
                    let temp = {
                        groupid: groupid,
                        trpgCommandfunction: [{
                            topic: mainMsg[2],
                            contact: inputStr.replace(/\.cmd\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
                        }]
                    }
                    if (checkifsamename == 0) {
                        records.pushtrpgCommandfunction('trpgCommand', temp, () => {
                            records.get('trpgCommand', (msgs) => {
                                rply.trpgCommandfunction = msgs
                                // console.log(rply);
                            })

                        })
                        rply.text = '新增成功: ' + mainMsg[2] + '\n' + inputStr.replace(/\.cmd\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
                    } else rply.text = '新增失敗. 重複標題'
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += ' 沒有標題.'
                    if (!mainMsg[3])
                        rply.text += ' 沒有擲骰指令'
                    if (mainMsg[3] && mainMsg[3].toLowerCase() == ".cmd")
                        rply.text += '指令不可以儲存.cmd啊'
                    if (!groupid)
                        rply.text += ' 不在群組.'
                    if (groupid && userrole < 1)
                        rply.text += ' 只有GM以上才可新增.'
                }
                return rply;

            case /(^[.]cmd$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
                //刪除資料庫
                if (groupid && mainMsg[2] && rply.trpgCommandfunction && userrole >= 2) {
                    for (var i = 0; i < rply.trpgCommandfunction.length; i++) {
                        if (rply.trpgCommandfunction[i].groupid == groupid) {
                            let temp = rply.trpgCommandfunction[i]
                            temp.trpgCommandfunction = []
                            records.settrpgCommandfunction('trpgCommand', temp, () => {
                                records.get('trpgCommand', (msgs) => {
                                    rply.trpgCommandfunction = msgs
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
            case /(^[.]cmd$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //刪除資料庫
                if (groupid && mainMsg[2] && rply.trpgCommandfunction && userrole >= 1) {
                    for (var i = 0; i < rply.trpgCommandfunction.length; i++) {
                        if (rply.trpgCommandfunction[i].groupid == groupid && mainMsg[2] < rply.trpgCommandfunction[i].trpgCommandfunction.length && mainMsg[2] >= 0) {
                            let temp = rply.trpgCommandfunction[i]
                            temp.trpgCommandfunction.splice(mainMsg[2], 1)
                            //console.log('rply.trpgCommandfunction: ', temp)
                            records.settrpgCommandfunction('trpgCommand', temp, () => {
                                records.get('trpgCommand', (msgs) => {
                                    rply.trpgCommandfunction = msgs
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

            case /(^[.]cmd$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
                //顯示
                records.get('trpgCommand', (msgs) => {
                    rply.trpgCommandfunction = msgs
                })
                //console.log(rply.trpgCommandfunction)
                if (groupid) {
                    let temp = 0;
                    if (rply.trpgCommandfunction)
                        for (var i = 0; i < rply.trpgCommandfunction.length; i++) {
                            if (rply.trpgCommandfunction[i].groupid == groupid) {
                                rply.text += '資料庫列表:'
                                for (var a = 0; a < rply.trpgCommandfunction[i].trpgCommandfunction.length; a++) {
                                    temp = 1
                                    rply.text += ("\n") + a + '. ' + rply.trpgCommandfunction[i].trpgCommandfunction[a].topic + '\n' + rply.trpgCommandfunction[i].trpgCommandfunction[a].contact + '\n'
                                }
                            }
                        }
                    if (temp == 0) rply.text = '沒有已設定的關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                //顯示資料庫
                rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/\,/gm, ', ')
                return rply
            case /(^[.]cmd$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
                //顯示關鍵字
                //let times = /^[.]cmd/.exec(mainMsg[0])[1] || 1
                //if (times > 30) times = 30;
                //if (times < 1) times = 1
                //console.log(times)
                if (groupid) {
                    //    console.log(mainMsg[1])
                    let temp = 0;
                    if (rply.trpgCommandfunction && mainMsg[1])
                        for (var i = 0; i < rply.trpgCommandfunction.length; i++) {
                            if (rply.trpgCommandfunction[i].groupid == groupid) {
                                // console.log(rply.trpgCommandfunction[i])
                                //rply.text += '資料庫列表:'
                                for (var a = 0; a < rply.trpgCommandfunction[i].trpgCommandfunction.length; a++) {
                                    if (rply.trpgCommandfunction[i].trpgCommandfunction[a].topic.toLowerCase() == mainMsg[1].toLowerCase()) {
                                        temp = 1
                                        rply.text = rply.trpgCommandfunction[i].trpgCommandfunction[a].topic + '\n' + rply.trpgCommandfunction[i].trpgCommandfunction[a].contact;

                                    }

                                }
                            }
                        }
                    if (temp == 0) rply.text = '沒有相關關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                rply.text = rply.text.replace(/\,/mg, ' ')
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
} catch (e) {
    console.log(e)
}