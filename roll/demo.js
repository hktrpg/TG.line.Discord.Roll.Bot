var rply = {
    default: 'on',
    type: 'text',
    text: ''
};

gameName = function () {
    return 'Demo'
}

gameType = function () {
    return 'Demo:hktrpg'
}
prefixs = function () {
    return [/^Demo$/i,/^啊$/i]
}
getHelpMessage = function () {
    return "【示範】" + "\
	\n  只是一個Demo\
		\n "
}
initialize = function () {
    return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
    rply.text = '';
    switch (true) {
        case /^\d+$/i.test(mainMsg[0]):
            rply.text = 'Demo' + mainMsg[1]
            return rply;

        case /^(?![\s\S])/.test(mainMsg[0] || ''):
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