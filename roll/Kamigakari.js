"use strict";
const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();

var variables = {};

var gameName = function () {
    return '【神我狩】 .kk (ET RT NT KT MTx)'
}

var gameType = function () {
    return 'Kamigakari:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^[.]kk$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【神我狩 Kamigakari】" + "\n\
・啓動語 .kk (指令) 如 .kk ET\n\
 \n\
・感情表(ET)\n\
・霊紋消費の代償表(RT)\n\
・伝奇名字・名前決定表(NT)\n\
・魔境臨界表(KT)\n\
・獲得素材チャート(MTx xは［法則障害］の［強度］。省略時は１)\n\
例） MT MT3 MT9\n"
}
var initialize = function () {
    return variables;
}

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    //let result = {};
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = this.getHelpMessage();
            return rply;
        case /^MT(\d*)$|^RT$|^ET$|^NT$|^KT$/i.test(mainMsg[1]):
            bcdice.setGameByTitle("Kamigakari")
            bcdice.setMessage(mainMsg[1])
            rply.text = mainMsg[1] + ' ' + bcdice.dice_command()[0]
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