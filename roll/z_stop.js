"use strict";
if (!process.env.mongoURL) {
    return;
}
let save = {};
const records = require('../modules/records.js');
records.get('block', (msgs) => {
    save.save = msgs
})
const checkTools = require('../modules/check.js');
const VIP = require('../modules/veryImportantPerson');
const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];
const gameName = function () {
    return '【擲骰開關功能】 .bk (add del show)'
}

const gameType = function () {
    return 'admin:Block:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^[.]bk$/ig,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【擲骰開關功能】
這是根據關鍵字來開關功能,只要符合內容,
例如運勢,那麼只要字句中包括,就不會讓Bot有反應
所以注意如果用了D, 那麼1D100, .1WD 都會全部沒反應.
另外不可擋b,k,bk, 只可以擋漢字,數字和英文
P.S.如果沒立即生效 用.bk show 刷新一下
輸入.bk add xxxxx 即可增加關鍵字 每次一個
輸入.bk show 顯示關鍵字
輸入.bk del (編號)或all 即可刪除`
}
const initialize = function () {
    return save;
}

const rollDiceCommand = async function ({
    mainMsg,
    groupid,
    userrole
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let lv;
    let limit = FUNCTION_LIMIT[0];
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        case /^add$/i.test(mainMsg[1]) && /^\S+$/ig.test(mainMsg[2]): {
            //增加阻擋用關鍵字
            //if (!mainMsg[2]) return;
            if (!mainMsg[2]) rply.text += '沒有關鍵字. '
            if (rply.text += checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            })) {
                return rply;
            }

            if (mainMsg[2].length <= 1 || /bk/ig.test(mainMsg[2])) {
                rply.text = '至少兩個字，及不可以阻擋bk'
                return rply;
            }
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = FUNCTION_LIMIT[lv];
            let findVIP = save.save.find(function (item) {
                return item._doc.groupid;
            });
            if (findVIP)
                if (findVIP._doc.blockfunction.length >= limit) {
                    rply.text = '關鍵字上限' + limit + '個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n';
                    return rply;
                }

            let temp = {
                groupid: groupid,
                blockfunction: mainMsg[2]
            }
            records.pushblockfunction('block', temp, () => {
                records.get('block', (msgs) => {
                    save.save = msgs
                })

            })
            rply.text = '新增成功: ' + mainMsg[2]

            return rply;
        }
        case /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //刪除阻擋用關鍵字
            if (rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            })) {
                return rply;
            }

            for (let i = 0; i < save.save.length; i++) {
                if (save.save[i].groupid == groupid) {
                    let temp = save.save[i]
                    temp.blockfunction = []
                    records.set('block', temp, () => {
                        records.get('block', (msgs) => {
                            save.save = msgs
                        })
                    })
                    rply.text = '刪除所有關鍵字'
                }
            }
            return rply;
        case /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //刪除阻擋用關鍵字
            if (!mainMsg[2]) rply.text += '沒有關鍵字. '
            if (rply.text += checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            })) {
                return rply;
            }

            for (let i = 0; i < save.save.length; i++) {
                if (save.save[i].groupid == groupid && mainMsg[2] < save.save[i].blockfunction.length && mainMsg[2] >= 0) {
                    let temp = save.save[i]
                    temp.blockfunction.splice(mainMsg[2], 1)
                    records.set('block', temp, () => {
                        records.get('block', (msgs) => {
                            save.save = msgs
                        })
                    })

                }
                rply.text = '刪除成功: ' + mainMsg[2]
            }
            return rply;

        case /^show$/i.test(mainMsg[1]): {
            records.get('block', (msgs) => {
                save.save = msgs
            })

            if (rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannel,
                gid : groupid
            })) {
                return rply;
            }
            
            let temp = 0;
            for (let i = 0; i < save.save.length; i++) {
                if (save.save[i].groupid == groupid) {
                    rply.text += '阻擋用關鍵字列表:'
                    for (let a = 0; a < save.save[i].blockfunction.length; a++) {
                        temp = 1
                        rply.text += ("\n") + a + ": " + save.save[i].blockfunction[a]
                    }
                }
            }
            if (temp == 0) rply.text = '沒有阻擋用關鍵字. '

            //顯示阻擋用關鍵字
            return rply;
        }
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