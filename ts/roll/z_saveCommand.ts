"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.mongoURL) {
    // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
    return;
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkTools... Remove this comment to see the full error message
const checkTools = require('../modules/check.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'records'.
const records = require('../modules/records.js');
let trpgCommandfunction = {};
records.get('trpgCommand', (msgs: any) => {
    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
    trpgCommandfunction.trpgCommandfunction = msgs
})
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'VIP'.
const VIP = require('../modules/veryImportantPerson');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'FUNCTION_L... Remove this comment to see the full error message
const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'gameName'.
const gameName = function () {
    return '【儲存擲骰指令功能】 .cmd (add del show 自定關鍵字)'
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'gameType'.
const gameType = function () {
    return 'Tool:trpgCommand:hktrpg'
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'prefixs'.
const prefixs = function () {
    return [{
        first: /(^[.]cmd$)/ig,
        second: null
    }];
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'getHelpMes... Remove this comment to see the full error message
const getHelpMessage = async function () {
    return `【儲存擲骰指令功能】
這是根據關鍵字來再現擲骰指令

輸入.cmd add (關鍵字) (指令)即可增加關鍵字
輸入.cmd show 顯示所有關鍵字
輸入.cmd del(編號)或all 即可刪除
輸入.cmd  (關鍵字) 即可執行 

例如輸入 .cmd add  pc1鬥毆 cc 80 鬥毆 
再輸入.cmd pc1鬥毆  就會執行後方的指令
add 後面第一個是關鍵字, 可以是符號或任何字
P.S.如果沒立即生效 用.cmd show 刷新一下


`
}
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'initialize... Remove this comment to see the full error message
const initialize = function () {
    return trpgCommandfunction;
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rollDiceCo... Remove this comment to see the full error message
// eslint-disable-next-line no-unused-vars
const rollDiceCommand = async function(
    this: any,
    {
        inputStr,
        mainMsg,
        groupid,
        userrole
    }: any
) {
    let checkifsamename = 0
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let lv;
    let limit = FUNCTION_LIMIT[0];
    let temp = 0;
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            // @ts-expect-error TS(2339): Property 'quotes' does not exist on type '{ defaul... Remove this comment to see the full error message
            rply.quotes = true;
            return rply;
        // .cmd(0) ADD(1) TOPIC(2) CONTACT(3)
        case /(^[.]cmd$)/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[2]):
            //增加資料庫
            //檢查有沒有重覆
            if (!mainMsg[2]) rply.text += ' 沒有標題.\n\n'
            if (!mainMsg[3]) rply.text += ' 沒有擲骰指令\n\n'
            if (mainMsg[3] && mainMsg[3].toLowerCase() == ".cmd") rply.text += '指令不可以儲存.cmd\n\n'
            if (rply.text += checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            lv = await VIP.viplevelCheckGroup(groupid);
            limit = FUNCTION_LIMIT[lv];
            checkifsamename = 0
            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
            if (trpgCommandfunction.trpgCommandfunction)
                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                for (let i = 0; i < trpgCommandfunction.trpgCommandfunction.length; i++) {
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    if (trpgCommandfunction.trpgCommandfunction[i].groupid == groupid) {
                        // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                        if (trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction.length >= limit) {
                            rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                            return rply;
                        }
                        // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                        if (trpgCommandfunction.trpgCommandfunction[0] && trpgCommandfunction.trpgCommandfunction[0].trpgCommandfunction[0])
                            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                            for (let a = 0; a < trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction.length; a++) {
                                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                                if (trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction[a].topic == mainMsg[2]) {
                                    checkifsamename = 1
                                }
                            }
                    }
                }
            // @ts-expect-error TS(2322): Type '{ groupid: any; trpgCommandfunction: { topic... Remove this comment to see the full error message
            temp = {
                groupid: groupid,
                trpgCommandfunction: [{
                    topic: mainMsg[2],
                    contact: inputStr.replace(/\.cmd\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
                }]
            }
            if (checkifsamename == 0) {
                records.pushtrpgCommandfunction('trpgCommand', temp, () => {
                    records.get('trpgCommand', (msgs: any) => {
                        // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                        trpgCommandfunction.trpgCommandfunction = msgs
                    })

                })
                rply.text = '新增成功: ' + mainMsg[2] + '\n' + inputStr.replace(/\.cmd\s+add\s+/i, '').replace(mainMsg[2], '').replace(/^\s+/, '')
            } else rply.text = '新增失敗. 重複標題'

            return rply;

        case /(^[.]cmd$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //刪除資料庫
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
            for (let i = 0; i < trpgCommandfunction.trpgCommandfunction.length; i++) {
                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                if (trpgCommandfunction.trpgCommandfunction[i].groupid == groupid) {
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    temp = trpgCommandfunction.trpgCommandfunction[i]
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    temp.trpgCommandfunction = []
                    records.settrpgCommandfunction('trpgCommand', temp, () => {
                        records.get('trpgCommand', (msgs: any) => {
                            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                            trpgCommandfunction.trpgCommandfunction = msgs
                        })
                    })
                    rply.text = '刪除所有關鍵字'
                }
            }
            return rply;
        case /(^[.]cmd$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //刪除資料庫
            if (!mainMsg[2]) rply.text += '沒有關鍵字. '
            if (rply.text += checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
            for (let i = 0; i < trpgCommandfunction.trpgCommandfunction.length; i++) {
                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                if (trpgCommandfunction.trpgCommandfunction[i].groupid == groupid && mainMsg[2] < trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction.length && mainMsg[2] >= 0) {
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    temp = trpgCommandfunction.trpgCommandfunction[i]
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    temp.trpgCommandfunction.splice(mainMsg[2], 1)
                    records.settrpgCommandfunction('trpgCommand', temp, () => {
                        records.get('trpgCommand', (msgs: any) => {
                            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                            trpgCommandfunction.trpgCommandfunction = msgs
                        })
                    })
                }
                rply.text = '刪除成功: ' + mainMsg[2]
            }
            return rply;

        case /(^[.]cmd$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1]):
            //顯示
            records.get('trpgCommand', (msgs: any) => {
                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                trpgCommandfunction.trpgCommandfunction = msgs
            })
            if (!groupid) {
                rply.text = '此功能必須在群組中使用. ';
                return rply
            }
            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
            if (trpgCommandfunction.trpgCommandfunction)
                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                for (let i = 0; i < trpgCommandfunction.trpgCommandfunction.length; i++) {
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    if (trpgCommandfunction.trpgCommandfunction[i].groupid == groupid) {
                        rply.text += '資料庫列表:'
                        // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                        for (let a = 0; a < trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction.length; a++) {
                            temp = 1
                            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                            rply.text += ("\n") + a + '. ' + trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction[a].topic + '\n' + trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction[a].contact + '\n'
                        }
                    }
                }
            if (temp == 0) rply.text = '沒有已設定的關鍵字. '
            //顯示資料庫
            rply.text = rply.text.replace(/^([^(,)\1]*?)\s*(,)\s*/mg, '$1: ').replace(/,/gm, ', ')
            return rply
        case /(^[.]cmd$)/i.test(mainMsg[0]) && /\S/i.test(mainMsg[1]) && /^(?!(add|del|show)$)/ig.test(mainMsg[1]):
            //顯示關鍵字
            if (!groupid) {
                rply.text = '此功能必須在群組中使用. ';
                return rply
            }
            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
            if (trpgCommandfunction.trpgCommandfunction && mainMsg[1])
                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                for (let i = 0; i < trpgCommandfunction.trpgCommandfunction.length; i++) {
                    // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                    if (trpgCommandfunction.trpgCommandfunction[i].groupid == groupid) {
                        //rply.text += '資料庫列表:'
                        // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                        for (let a = 0; a < trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction.length; a++) {
                            // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                            if (trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction[a].topic.toLowerCase() == mainMsg[1].toLowerCase()) {
                                temp = 1
                                // @ts-expect-error TS(2339): Property 'trpgCommandfunction' does not exist on t... Remove this comment to see the full error message
                                rply.text = trpgCommandfunction.trpgCommandfunction[i].trpgCommandfunction[a].contact;
                                // @ts-expect-error TS(2339): Property 'cmd' does not exist on type '{ default: ... Remove this comment to see the full error message
                                rply.cmd = true;
                            }
                        }
                    }
                }
            if (temp == 0) rply.text = '沒有相關關鍵字. ';
            //rply.text = rply.text.replace(/,/mg, ' ')
            return rply;
        default:
            break;

    }
}


// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};