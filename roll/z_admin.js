"use strict";
var variables = {};
const opt = {
    upsert: true,
    runValidators: true
}
const crypto = require('crypto');
const password = process.env.CRYPTO_SECRET,
    algorithm = 'aes-256-ctr';
//32bit ASCII
const adminSecret = process.env.ADMIN_SECRET;
//admin id
const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
var gameName = function () {
    return '【Admin Tool】'
}

var gameType = function () {
    return 'Admin:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^[.]admin$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【Admin 工具】" + "\
	\n  用來Debug 及調整VIP工具\
		\n debug 用來取得群組資料"
}

var initialize = function () {
    return variables;
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
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let filter = {};
    let doc = {};
    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = this.getHelpMessage();
            return rply;
        case /^state$/i.test(mainMsg[1]):
            rply.state = true;
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
            return rply;
        case /^decrypt$/i.test(mainMsg[1]):
            if (!adminSecret) return rply;
            if (!mainMsg[2]) return rply;
            if (!password) return rply;
            if (userid !== adminSecret) return rply;
            rply.text = decrypt(mainMsg[2]);
            return rply;
        case /^addVipGroup$/i.test(mainMsg[1]):
            if (!adminSecret) return rply;
            if (userid !== adminSecret) return rply;
            filter = await store(inputStr, 'gp');
            if (!filter.gpid) return rply;
            try {
                doc = await schema.veryImportantPerson.updateOne({
                    gpid: filter.gpid
                }, {
                    $set: filter,
                    $setOnInsert: {
                        startDate: new Date()
                    }
                }, opt)
                if (doc) {
                    await VIP.renew();
                    rply.text = "更新成功\n";
                    rply.text += JSON.stringify(filter);

                }
                //.admin addVipGroup -i  ID -l LV -n NAME -no NOTES -s SWITCH
            } catch (error) {
                console.log('新增VIP GET ERROR: ', error)
                rply.text = '新增VIP失敗\n因為 ' + error.message
            }
            return rply;
        case /^addVipUser$/i.test(mainMsg[1]):
            if (!adminSecret) return rply;
            if (userid !== adminSecret) return rply;
            filter = await store(inputStr, 'id');
            if (!filter.id) return rply;
            try {
                doc = await schema.veryImportantPerson.updateOne({
                    id: filter.id
                }, {
                    $set: filter,
                    $setOnInsert: {
                        startDate: new Date()
                    }
                }, opt)
                if (doc) {
                    await VIP.renew();
                    rply.text = "更新成功\n";
                    rply.text += JSON.stringify(filter);
                }
                //.admin addVipGroup -i  ID -l LV -n NAME -no NOTES -s SWITCH
            } catch (error) {
                console.log('新增VIP GET ERROR: ', error)
                rply.text = '新增VIP失敗\n因為 ' + error.message
            }
            return rply;

        default:
            break;
    }
}

async function store(mainMsg, mode) {
    const pattId = /\s+-i\s+(\S+)/ig;
    const pattGP = /\s+-g\s+(\S+)/ig;
    const pattLv = /\s+-l\s+(\S+)/ig;
    const pattName = /\s+-n\s+(\S+)/ig;
    const pattNotes = /\s+-no\s+(\S+)/ig;
    const pattSwitch = /\s+-s\s+(\S+)/ig;
    var resultId = pattId.exec(mainMsg);
    var resultGP = pattGP.exec(mainMsg);
    var resultLv = pattLv.exec(mainMsg);
    var resultName = pattName.exec(mainMsg);
    var resultNotes = pattNotes.exec(mainMsg);
    var resultSwitch = pattSwitch.exec(mainMsg);
    let reply = {};
    (resultId && mode == 'id') ? reply.id = resultId[1]: null;
    (resultGP && mode == 'gp') ? reply.gpid = resultGP[1]: null;
    (resultLv) ? reply.level = Number(resultLv[1]): null;
    (resultName) ? reply.name = resultName[1]: null;
    (resultNotes) ? reply.notes = resultNotes[1]: null;
    (resultSwitch && resultSwitch[1].toLowerCase() == 'true') ? reply.switch = true: null;
    (resultSwitch && resultSwitch[1].toLowerCase() == 'false') ? reply.switch = false: null;
    return reply;
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