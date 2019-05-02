var rply = {
    default: 'on',
    type: 'text',
    text: ''
};


/*
var unforgivable = [
        "password",
        "12345678",
        "8675309",
        "[a-z]{8,}",
        "qwerty",
        "asdfg",
        "qazwsx",
        "zxcvb",
        "letmein",
        "trustno1",
        "omnicloud",
        "monkey"
    ];
    var re = new RegExp(unforgivable.join("|"), "i");
 */

//const db = require('../modules/db-connector.js');
//const schema = require('../modules/schema.js'); // 新增這行

//const mongoose = require('mongoose');
const records = require('../modules/records.js'); // 新增這行

var save;
records.get('block', (msgs) => {
    console.log('exports.records.get(): 0 0 stop', msgs);
    save = JSON.stringify(msgs)
})
gameName = function () {
    return '阻擋關鍵字 .block'
}

gameType = function () {
    return 'Block:hktrpg'
}
prefixs = function () {
    return [/[.]t/ig,]
}
getHelpMessage = function () {
    return "【Block】" + "\
    \n 輸入.block add xxxxx 即可增加關鍵字 每次一個\
    \n 輸入.block show 顯示關鍵字\
    \n 輸入.block del (編號) 即可刪除\
    \n "
}
initialize = function () {
    return rply;
}

rollDiceCommand = function (inputStr, mainMsg, groupid, userid) {
    rply.text = '';
    switch (true) {
        case /^dev$/i.test(mainMsg[1]):
            //rply.text = exports.records.get();
            //console.log(exports.records.get())
            rply.text = mainMsg[3];
            records.push(mainMsg[2], rply)
            console.log('dev')
            records.get((msgs) => {
                console.log('exports.records.get():', msgs.toString());
            })
            console.log('save:  ', save)
            break;
        case /^add$/i.test(mainMsg[1]):
            //增加阻檔用關鍵字
            if (groupid && mainMsg[2]) {
                let temp = { groupid: groupid, blockfunction: mainMsg[2] }
                records.push('block', temp)
                rply.text = '新增成功' + mainMsg[2]
            }
            else {
                rply.text = '新增失敗.'
                if (!mainMsg[2])
                    rply.text += '沒有關鍵字.'
                if (!groupid)
                    rply.text += '不在群組.'
            }
            return rply;
        case /^del$/i.test(mainMsg[1]):
            //刪除阻檔用關鍵字
            rply.text = 'Demo'
            return rply;
        case /^show$/i.test(mainMsg[1]):
            //顯示阻檔用關鍵字
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