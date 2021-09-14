"use strict";

const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
const limitAtArr = [1, 20, 20, 30, 30, 99, 99, 99];
const limitCronArr = [1, 20, 20, 30, 30, 99, 99, 99];


var gameName = function () {
    return '【定時發訊功能】.schedule at cron delete'
}

var gameType = function () {
    return 'funny:schedule:hktrpg'
}
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^schedule$/i,
        second: null
    }]
}
var getHelpMessage = async function () {
    return `【定時任務功能】
    兩種模式
    【at】指定一個時間
    如 20220604 1900
    5mins  (五分鐘後)
    5hours (五小時後)
    會發佈指定一個信息
    
    【cron】 每天指定一個時間可以發佈一個信息(24小時制)
    如 1230  2200 
    
    .schedule at 5mins
    五分鐘後叫吧!
    
    .schedule cron 0831
    每天八時三十一分`
}
var initialize = function () {
    return "";
}

var rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1] || !mainMsg[2]: {
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^at+$/i.test(mainMsg[1]): {
            let lv = await VIP.viplevelCheckUser(userid);
            let limit = limitAtArr[lv];
            let check = await schema.eventList.find({
                userID: userid
            });
            let levelLv = await findMaxLv(userid);

            return rply;
        }
        case /^cron$/.test(mainMsg[1]): {
            rply.text = 'Demo'
            return rply;
        }
        case /^delete$/.test(mainMsg[1]): {
            rply.text = 'Demo'
            return rply;
        }
        default: {
            break;
        }
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