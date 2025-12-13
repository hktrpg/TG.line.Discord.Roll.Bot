"use strict";
if (!process.env.mongoURL) {
    return;
}
let save = {};
const records = require('../modules/records.js');

// Initialize data asynchronously
(async () => {
    try {
        save.save = await records.get('block');
    } catch (error) {
        console.error('[z_stop] Failed to initialize block data:', error);
        save.save = [];
    }
})();
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
    return `【🎲擲骰開關功能】
╭──── 📝系統簡介 ────
│ • 關閉特定關鍵字的骰子回應
│ • 符合關鍵字的指令將被過濾
│ • 無法過濾 b, k, bk 指令
│
├──── ⚙️基本指令 ────
│ • .bk add 關鍵字
│   新增過濾關鍵字
│ • .bk show
│   顯示過濾清單
│ • .bk del 編號
│   刪除指定關鍵字
│ • .bk del all
│   清空過濾清單
│
├──── ⚠️注意事項 ────
│ • 關鍵字使用模糊比對
│ • 只能過濾中英數字
│ • 如設定「D」會過濾全部包含D的指令
│ • 未生效時請用show重整
╰──────────────`
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
            rply.text += checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            });
            if (rply.text) {
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
            try {
                await records.pushBlockFunction('block', temp);
                save.save = await records.get('block');
                rply.text = '新增成功: ' + mainMsg[2];
            } catch (error) {
                console.error('[z_stop] Failed to push block function:', error);
                rply.text = '新增失敗，請稍後再試';
            }

            return rply;
        }
        case /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //刪除阻擋用關鍵字
            rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            });
            if (rply.text) {
                return rply;
            }

            for (let i = 0; i < save.save.length; i++) {
                if (save.save[i].groupid == groupid) {
                    let temp = save.save[i]
                    temp.blockfunction = []
                    try {
                        await records.setBlockFunction('block', temp);
                        save.save = await records.get('block');
                        rply.text = '刪除所有關鍵字';
                    } catch (error) {
                        console.error('[z_stop] Failed to delete all block functions:', error);
                        rply.text = '刪除失敗，請稍後再試';
                    }
                }
            }
            return rply;
        case /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //刪除阻擋用關鍵字
            if (!mainMsg[2]) rply.text += '沒有關鍵字. '
            rply.text += checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            });
            if (rply.text) {
                return rply;
            }

            for (let i = 0; i < save.save.length; i++) {
                if (save.save[i].groupid == groupid && mainMsg[2] < save.save[i].blockfunction.length && mainMsg[2] >= 0) {
                    let temp = save.save[i]
                    temp.blockfunction.splice(mainMsg[2], 1)
                    try {
                        await records.setBlockFunction('block', temp);
                        save.save = await records.get('block');
                        rply.text = '刪除成功: ' + mainMsg[2];
                    } catch (error) {
                        console.error('[z_stop] Failed to delete block function:', error);
                        rply.text = '刪除失敗，請稍後再試';
                    }
                }
            }
            return rply;

        case /^show$/i.test(mainMsg[1]): {
            try {
                save.save = await records.get('block');
            } catch (error) {
                console.error('[z_stop] Failed to get block data:', error);
                save.save = [];
            }

            rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkChannel,
                gid : groupid
            });
            if (rply.text) {
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