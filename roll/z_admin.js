"use strict";
var variables = {};
const opt = {
    upsert: true,
    runValidators: true
}
const salt = process.env.SALT;
const crypto = require('crypto');
const password = process.env.CRYPTO_SECRET,
    algorithm = 'aes-256-ctr';
const link = process.env.WEB_LINK;
const port = process.env.PORT || 20721;
//32bit ASCII
const adminSecret = process.env.ADMIN_SECRET;
//admin id
const schema = require('../modules/core-schema.js');
const VIP = require('../modules/veryImportantPerson');
var gameName = function () {
    return '【Admin Tool】'
}

var gameType = function () {
    return 'admin:Admin:hktrpg'
}
var prefixs = function () {
    return [{
        first: /^[.]admin$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【Admin 工具】" + "\
用來Debug 及調整VIP工具\n\
.admin state 取得Rollbot狀態\n\
.admin debug 用來取得群組資料\n\
.admin account (username) (password) \n\
username 4-16字,中英文限定 \n\
password 6-16字,英文及以下符號限定 !@#$%^&*\n"
}

var initialize = function () {
    return variables;
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
    let filter = {};
    let doc = {};
    let temp;
    let hash = ""
    let name;
    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = this.getHelpMessage();
            return rply;
        case /^state$/i.test(mainMsg[1]):
            rply.state = true;
            return rply;
        case /^account$/i.test(mainMsg[1]):
            name = mainMsg[2].toLowerCase();
            if (groupid) {
                rply.text = "設定帳號時，請直接和HKTRPG對話，禁止在群組中使用";
                return rply;
            }
            if (!name || !checkUserName(name)) {
                rply.text = "請設定使用者名稱，4-16字，中英文限定，大小階相同";
                return rply;
            }
            if (!mainMsg[3] || !checkPassword(mainMsg[3])) {
                rply.text = "請設定密碼，6-16字，英文及以下符號限定!@#$%^&*";
                return rply;
            }
            hash = crypto.createHmac('sha256', mainMsg[3])
                .update(salt)
                .digest('hex');
            try {
                temp = await schema.accountPW.findOne({
                    "userName": name
                });
                console.log(temp)
            } catch (e) {
                console.log('ACCOUNT ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            if (temp && temp.id != userid) {
                rply.text += "重覆用戶名稱"
                return rply;
            }
            try {
                doc = await schema.accountPW.findOneAndUpdate({
                    "id": userid
                }, {
                    $set: {
                        "userName": name,
                        "password": hash
                    }
                }, {
                    upsert: true,
                    returnNewDocument: true
                });

            } catch (e) {
                console.log('ACCOUNT ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            if (doc) {
                rply.text += "現在你的帳號是: " + name + "\n" + "密碼: " + mainMsg[3];
                if (link)
                    rply.text += "\n登入位置: https://www.hktrpg.com:20721/card/ ";
                return rply;
            }

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

function checkUserName(text) {
    //True 即成功
    return /^[A-Za-z0-9\u3000\u3400-\u4DBF\u4E00-\u9FFF]{4,16}$/.test(text);
}

function checkPassword(text) {
    //True 即成功
    return /^[A-Za-z0-9!@#$%^&*]{6,16}$/.test(text);
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