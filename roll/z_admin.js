"use strict";
var rply = {
    default: 'on',
    type: 'text',
    text: ''
};
const crypto = require('crypto');
const password = process.env.CRYPTO_SECRET,
    algorithm = 'aes-256-ctr';
//32bit ASCII
const adminSecret = process.env.ADMIN_SECRET;
//admin id
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
            rply.text = "Debug function" + '\ngroupid: ' + groupid + "\nuserid: " + userid;
            rply.text += '\nchannelid: ' + channelid;
            rply.text += (userrole) ? '\nuserrole: ' + userrole : '';
            rply.text += (botname) ? '\nbotname: ' + botname : '';
            rply.text += (displayname) ? '\ndisplayname: ' + displayname : '';
            rply.text += (displaynameDiscord) ? '\ndisplaynameDiscord: ' + displaynameDiscord : '';
            rply.text += (membercount) ? '\nmembercount: ' + membercount : '';
            //     .digest('hex');
            if (!password) return rply;
            rply.text = 'Debug encrypt Data: \n' + encrypt(rply.text);
            console.log(rply.text)
            return rply;
        case /^decrypt$/i.test(mainMsg[1]):
            if (!adminSecret) return rply;
            if (!mainMsg[2]) return rply;
            if (!password) return rply;
            if (userid !== adminSecret) return rply;
            rply.text = decrypt(mainMsg[2]);
            return rply;
        default:
            break;
    }
}

function encrypt(text) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(password, 'utf-8'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(password, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};