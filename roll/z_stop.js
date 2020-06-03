"use strict";
if (process.env.mongoURL) {
    var rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const records = require('../modules/records.js');
    records.get('block', (msgs) => {
        rply.save = msgs
    })
    var gameName = function () {
        return '(公測中)擲骰開關功能 .bk (add del show)'
    }

    var gameType = function () {
        return 'Block:hktrpg'
    }
    var prefixs = function () {
        return [{
            first: /^[.]bk$/ig,
            second: null
        }]
    }
    var getHelpMessage = function () {
        return "【擲骰開關功能】" + "\
        \n 這是根據關鍵字來開關功能,只要符合內容,\
        \n 例如運勢,那麼只要字句中包括,就不會讓Bot有反應\
        \n 所以注意如果用了D, 那麼1D100, .1WD 都會全部沒反應.\
        \n 另外不可擋b,k,bk, 只可以擋漢字,數字和英文\
        \n P.S.如果沒立即生效 用.bk show 刷新一下\
    \n 輸入.bk add xxxxx 即可增加關鍵字 每次一個\
    \n 輸入.bk show 顯示關鍵字\
    \n 輸入.bk del (編號)或all 即可刪除\
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

            case /^add$/i.test(mainMsg[1]) && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/ig.test(mainMsg[2]) && /^((?!^(b|k|bk)$).)*$/ig.test(mainMsg[2]):
                //增加阻擋用關鍵字
                //if (!mainMsg[2]) return;
                if (groupid && mainMsg[2] && userrole >= 2) {
                    let temp = {
                        groupid: groupid,
                        blockfunction: mainMsg[2]
                    }
                    records.pushblockfunction('block', temp, () => {
                        records.get('block', (msgs) => {
                            rply.save = msgs
                        })

                    })
                    rply.text = '新增成功: ' + mainMsg[2]
                } else {
                    rply.text = '新增失敗.'
                    if (!mainMsg[2])
                        rply.text += '沒有關鍵字. '
                    if (!groupid)
                        rply.text += '不在群組. '
                    if (groupid && userrole < 2)
                        rply.text += '只有DM以上才可新增. '
                }
                return rply;

            case /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
                //刪除阻擋用關鍵字
                if (groupid && mainMsg[2] && rply.save && userrole >= 2) {
                    for (var i = 0; i < rply.save.length; i++) {
                        if (rply.save[i].groupid == groupid) {
                            let temp = rply.save[i]
                            temp.blockfunction = []
                            records.set('block', temp, () => {
                                records.get('block', (msgs) => {
                                    rply.save = msgs
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
                        rply.text += '只有DM以上才可刪除. '
                }

                return rply;
            case /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
                //刪除阻擋用關鍵字
                if (groupid && mainMsg[2] && rply.save && userrole >= 2) {
                    for (var i = 0; i < rply.save.length; i++) {
                        if (rply.save[i].groupid == groupid && mainMsg[2] < rply.save[i].blockfunction.length && mainMsg[2] >= 0) {
                            let temp = rply.save[i]
                            temp.blockfunction.splice(mainMsg[2], 1)
                            //console.log(rply.save[i])
                            records.set('block', temp, () => {
                                records.get('block', (msgs) => {
                                    rply.save = msgs
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
                    if (groupid && userrole < 2)
                        rply.text += '只有DM以上才可刪除. '
                }
                return rply;

            case /^show$/i.test(mainMsg[1]):
                records.get('block', (msgs) => {
                    rply.save = msgs
                })
                if (groupid) {
                    let temp = 0;
                    for (var i = 0; i < rply.save.length; i++) {
                        if (rply.save[i].groupid == groupid) {
                            rply.text += '阻擋用關鍵字列表:'
                            for (var a = 0; a < rply.save[i].blockfunction.length; a++) {
                                temp = 1
                                rply.text += ("\n") + a + '. ' + rply.save[i].blockfunction[a]
                            }
                        }
                    }
                    if (temp == 0) rply.text = '沒有阻擋用關鍵字. '
                } else {
                    rply.text = '不在群組. '
                }
                //顯示阻擋用關鍵字
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
}