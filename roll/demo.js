"use strict";
var variables = {};

var gameName = function () {
    return '【Demo】'
}

var gameType = function () {
    return 'Demo:hktrpg'
}
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}
var getHelpMessage = function () {
    return "【示範】" + "\n\
只是一個Demo的第一行\n\
只是一個Demo末行"
}
var initialize = function () {
    return variables;
}

// eslint-disable-next-line no-unused-vars
var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        case /^\d+$/i.test(mainMsg[1]):
            rply.text = 'Demo' + mainMsg[1]
            return rply;
        case /^\S/.test(mainMsg[1] || ''):
            rply.text = 'Demo'
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