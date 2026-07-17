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
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const FUNCTION_LIMIT = [30, 200, 200, 300, 300, 300, 300, 300];
const gameName = function (params = {}) {
    return resolveGameName(params, 'stop.game_name', '【擲骰開關功能】 .bk (add del show)');
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
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'stop.help');
}
const initialize = function () {
    return save;
}

const rollDiceCommand = async function ({
    mainMsg,
    groupid,
    userrole,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let lv;
    let limit = FUNCTION_LIMIT[0];
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        case /^add$/i.test(mainMsg[1]) && /^\S+$/ig.test(mainMsg[2]): {
            //增加阻擋用關鍵字
            //if (!mainMsg[2]) return;
            if (!mainMsg[2]) rply.text += translate('stop.no_keyword');
            rply.text += checkTools.permissionErrMsg({ locale,
                flag : checkTools.flag.ChkChannelManager,
                gid : groupid,
                role : userrole
            });
            if (rply.text) {
                return rply;
            }

            if (mainMsg[2].length <= 1 || /bk/ig.test(mainMsg[2])) {
                rply.text = translate('stop.keyword_too_short');
                return rply;
            }
            lv = await VIP.viplevelCheckGroup(groupid);
            limit = FUNCTION_LIMIT[lv];
            let findVIP = save.save.find(function (item) {
                return item._doc.groupid;
            });
            if (findVIP)
                if (findVIP._doc.blockfunction.length >= limit) {
                    rply.text = translate('stop.limit_reached', { limit });
                    return rply;
                }

            let temp = {
                groupid: groupid,
                blockfunction: mainMsg[2]
            }
            try {
                await records.pushBlockFunction('block', temp);
                save.save = await records.get('block');
                rply.text = translate('stop.add_success', { keyword: mainMsg[2] });
            } catch (error) {
                console.error('[z_stop] Failed to push block function:', error);
                rply.text = translate('stop.add_failed');
            }

            return rply;
        }
        case /^del$/i.test(mainMsg[1]) && /^all$/i.test(mainMsg[2]):
            //刪除阻擋用關鍵字
            rply.text = checkTools.permissionErrMsg({ locale,
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
                        rply.text = translate('stop.delete_all_success');
                    } catch (error) {
                        console.error('[z_stop] Failed to delete all block functions:', error);
                        rply.text = translate('stop.delete_failed');
                    }
                }
            }
            return rply;
        case /^del$/i.test(mainMsg[1]) && /^\d+$/i.test(mainMsg[2]):
            //刪除阻擋用關鍵字
            if (!mainMsg[2]) rply.text += translate('stop.no_keyword');
            rply.text += checkTools.permissionErrMsg({ locale,
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
                        rply.text = translate('stop.delete_success', { index: mainMsg[2] });
                    } catch (error) {
                        console.error('[z_stop] Failed to delete block function:', error);
                        rply.text = translate('stop.delete_failed');
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

            rply.text = checkTools.permissionErrMsg({ locale,
                flag : checkTools.flag.ChkChannel,
                gid : groupid
            });
            if (rply.text) {
                return rply;
            }
            
            let temp = 0;
            for (let i = 0; i < save.save.length; i++) {
                if (save.save[i].groupid == groupid) {
                    rply.text += translate('stop.list_header');
                    for (let a = 0; a < save.save[i].blockfunction.length; a++) {
                        temp = 1
                        rply.text += translate('stop.list_entry', { index: a, keyword: save.save[i].blockfunction[a] });
                    }
                }
            }
            if (temp == 0) rply.text = translate('stop.no_keywords');

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