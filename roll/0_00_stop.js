//const records = require('../modules/records.js'); // 新增這行

var rply = {
    default: 'on',
    type: 'text',
    text: ''
};


gameName = function () {
    return 'Block'
}

gameType = function () {
    return 'Block:hktrpg'
}
prefixs = function () {
    return /[.]block/ig
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
        case /^dev+$/i.test(mainMsg[0]):
            rply.text = records.get();
            console.log(records.get())
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

// socket.emit("chatRecord", records.get()); // 砍掉這行
// 改成下面這個