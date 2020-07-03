"use strict";
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};

var gameName = function () {
    return '【Admin Tool】'
}

var gameType = function () {
    return 'Admin:hktrpg'
}
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^[.]admin$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【Admin 工具】" + "\
	\n  用來Debug 及調整VIP工具\
		\n "
}
var initialize = function () {
    return rply;
}
const secret = process.env.ADMIN_SECRET;

/**
 * 功能: 核對已有的secret
 * 
 * 
 * 
 * 
 * 
 */

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
    rply.text = '';
    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = this.getHelpMessage();
            return rply;
        case /^debug$/i.test(mainMsg[1]):
            rply.text = "Debug function \ninputStr: " + inputStr + '\ngroupid: ' + groupid + "\nuserid: " + userid + '\ngroupid: ' + groupid
            rply.text += (userrole) ? '\nuserrole: ' + userrole : '';
            rply.text += (botname) ? '\nbotname: ' + botname : '';
            rply.text += (displayname) ? '\ndisplayname: ' + displayname : '';
            rply.text += (displaynameDiscord) ? '\ndisplaynameDiscord: ' + displaynameDiscord : '';
            rply.text += (membercount) ? '\nmembercount: ' + membercount : '';
            console.log("Debug function ", "inputStr: " + inputStr + '\ngroupid: ' + groupid + "\nuserid: " + userid + '\nuserrole: ' + userrole, '\nbotname: ', botname, '\ndisplayname: ', displayname, '\nchannelid: ', channelid, '\ndisplaynameDiscord: ', displaynameDiscord, '\nmembercount: ', membercount)
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