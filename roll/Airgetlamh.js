const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();
//const records = require('../modules/records.js'); // 新增這行
function calldice(gameType, message) {
    bcdice.setGameByTitle(gameType)
    bcdice.setMessage(message)
    return bcdice.dice_command()
}
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};

gameName = function () {
    return '朱の孤塔 .al (nALx*p)'
}

gameType = function () {
    return 'Airgetlamh:hktrpg'
}
prefixs = function () {
    return /^[.]al$/i
}
getHelpMessage = function () {
    return "【朱の孤塔のエアゲトラム】" + "\
	\n・命中判定\
    \n.al [n]AL[X]*[p]：「n」で連射数を指定、「X」で目標値を指定、「p」で威力を指定。\
    \n「*」は「x」でも代用化。\
    \n例：.al 3AL7*5 → 3連射で目標値7、威力5、5AL5x3 → 5連射で目標値5、威力3\
		\n "
}
initialize = function () {
    return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
    rply.text = '';
    if (mainMsg && mainMsg[1])
        result = calldice("Airgetlamh", mainMsg[1])
    if (result && result[0] != 1)
        rply.text = mainMsg[1] + ' ' + result[0];
    return rply;

}


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};