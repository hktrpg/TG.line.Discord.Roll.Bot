"use strict";
const variables = {};
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const gameName = function (params = {}) {
    return resolveGameName(params, 'demo.game_name', '【Demo】');
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'demo.help');
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    const i18nParams = { locale, t };
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage(i18nParams);
            rply.quotes = true;
            return rply;
        }
        case /^\d+$/i.test(mainMsg[1]): {
            rply.text = translate('demo.output_debug', {
                value: mainMsg[1],
                inputStr,
                groupid,
                userid,
                userrole,
                botname,
                displayname,
                channelid,
                displaynameDiscord,
                membercount
            });
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = translate('demo.output');
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};