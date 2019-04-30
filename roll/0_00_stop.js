var rply = {
    default: 'on',
    type: 'text',
    text: ''
};


//const db = require('../modules/db-connector.js');
//const schema = require('../modules/schema.js'); // 新增這行

//const mongoose = require('mongoose');
const records = require('../modules/records.js'); // 新增這行

var save;
records.get((msgs) => {
    console.log('exports.records.get():', msgs);
    save = msgs
})
gameName = function () {
    return 'Block'
}

gameType = function () {
    return 'Block:hktrpg'
}
prefixs = function () {
    return /[.]t/ig
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
        case /^dev$/i.test(mainMsg[1]):
            //rply.text = exports.records.get();
            //console.log(exports.records.get())
            rply.text = mainMsg[2];
            records.push(rply)
            console.log('dev')
            records.get((msgs) => {
                console.log('exports.records.get():', msgs.toString());
            })

            console.log('save:  ', save)
            break;
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