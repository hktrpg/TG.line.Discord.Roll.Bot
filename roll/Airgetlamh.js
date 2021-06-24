"use strict";
const {
    DynamicLoader
} = require('bcdice');

async function callDice(gameType, message) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.eval(message);
    return result.text;
}
async function callHelp(gameType) {
    const loader = new DynamicLoader();
    const GameSystem = await loader.dynamicLoad(gameType);
    const result = GameSystem.HELP_MESSAGE;
    return result;
}
var variables = {};

var gameName = function () {
    return '【朱の孤塔】 .al (nALx*p)'
}

var gameType = function () {
    return 'Dice:Airgetlamh'
}
var prefixs = function () {
    return [{
        first: /^[.]al$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return null
}
var initialize = function () {
    return variables;
}

var rollDiceCommand = async function ({
    mainMsg
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let result = '';
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = '【朱の孤塔】\n' + await callHelp("Airgetlamh");
            return rply;
        default:
            result = await callDice("Airgetlamh", mainMsg[1])
            if (result)
                rply.text = mainMsg[1] + ' ' + result;
            return rply;
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