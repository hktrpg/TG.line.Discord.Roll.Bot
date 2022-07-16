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
//32bit ASCII
const adminSecret = process.env.ADMIN_SECRET;
//admin id
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');
const pattId = /\s+-i\s+(\S+)/ig;
const pattGP = /\s+-g\s+(\S+)/ig;
const pattLv = /\s+-l\s+(\S+)/ig;
const pattName = /\s+-n\s+(\S+)/ig;
const pattNotes = /\s+-no\s+(\S+)/ig;
const pattSwitch = /\s+-s\s+(\S+)/ig;
//const VIP = require('../modules/veryImportantPerson');
const gameName = function () {
    return '【Admin Tool】.admin debug state account news on'
}

const gameType = function () {
    return 'admin:Admin:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^[.]admin$/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【Admin 工具】
用來Debug 及調整VIP工具
.admin state        取得Rollbot狀態

.admin debug        用來取得群組資料

.admin account (username) (password) 設定網頁版角色卡登入功能
username 4-16字,中英文限定 
password 6-16字,英文及以下符號限定 !@#$%^&*

.admin news on      開啓取得HKTRPG更新資訊
.admin news off     關閉取得HKTRPG更新資訊

`
}

const initialize = function () {
    return variables;
}
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount,
    titleName
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
    let temp2;
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        case /^state$/i.test(mainMsg[1]):
            rply.state = true;
            rply.quotes = true;
            return rply;

        case /^registerChannel$/i.test(mainMsg[1]):
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannel,
                gid: groupid
            })) {
                return rply;
            }
            try {
                temp = await schema.accountPW.findOne({
                    "id": userid
                });
            } catch (e) {
                console.error('registerChannel ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            try {
                temp2 = await schema.accountPW.findOne({
                    "id": userid,
                    "channel.id": channelid || groupid
                });
            } catch (e) {
                console.error('registerChannel ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            if (temp && temp2) {
                rply.text = "已註冊這頻道。如果想使用角色卡，請到\nhttps://www.hktrpg.com:20721/card/";
                if (!await checkGpAllow(channelid || groupid)) {
                    rply.text += '\n群組未被Admin 允許擲骰，請Admin在這群組輸入\n.admin disallowrolling';
                }
                return rply;
            }
            if (temp && !temp2) {
                temp.channel.push({
                    "id": channelid || groupid,
                    "botname": botname,
                    "titleName": titleName
                })
                await temp.save();
                rply.text = "註冊成功，如果想使用角色卡，請到\nhttps://www.hktrpg.com:20721/card/"
                if (!await checkGpAllow(channelid || groupid)) {
                    rply.text += '\n群組未被Admin 允許擲骰，請Admin在這群組輸入\n.admin disallowrolling';
                }
                return rply;
            }

            if (!temp) {
                //   temp = schema.accountPW({ name: 'Frodo', inventory: { ringOfPower: 1 }});
                temp = new schema.accountPW({
                    id: userid,
                    channel: {
                        "id": channelid || groupid,
                        "botname": botname,
                        "titleName": titleName
                    }
                });
                await temp.save().catch(error => console.error('admin #138 mongoDB error: ', error.name, error.reson));
                rply.text = "註冊成功。如果想使用角色卡，請到\nhttps://www.hktrpg.com:20721/card/";
                if (!await checkGpAllow(channelid || groupid)) {
                    rply.text += '\n群組未被Admin 允許擲骰，請Admin在這群組輸入\n.admin disallowrolling';
                }
                return rply;
            }

            return rply;

        case /^unregisterChannel$/i.test(mainMsg[1]):
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannel,
                gid: groupid
            })) {
                return rply;
            }
            try {
                await schema.accountPW.updateOne({
                    "id": userid
                }, {
                    $pull: {
                        channel: {
                            "id": channelid || groupid
                        }
                    }
                });
            } catch (e) {
                console.error('unregisterChannel ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            rply.text = "已移除註冊!如果想檢查，請到\nhttps://www.hktrpg.com:20721/card/"
            return rply;
        case /^disallowrolling$/i.test(mainMsg[1]):
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            try {
                doc = await schema.allowRolling.findOneAndRemove({
                    "id": channelid || groupid
                });
            } catch (e) {
                console.error('disAllowrolling ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            rply.text = "此頻道已被Admin不允許使用網頁版角色卡擲骰。\nAdmin 希望允許擲骰，可輸入\n.admin allowrolling";
            return rply;
        case /^allowrolling$/i.test(mainMsg[1]):
            if (rply.text = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelAdmin,
                gid: groupid,
                role: userrole
            })) {
                return rply;
            }

            try {
                doc = await schema.allowRolling.findOneAndUpdate({
                    "id": channelid || groupid
                }, {
                    $set: {
                        "id": channelid || groupid,
                        "botname": botname
                    }
                }, {
                    upsert: true,
                    returnNewDocument: true
                });

            } catch (e) {
                console.error('Allowrolling ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            rply.text = "此頻道已被Admin允許使用網頁版角色卡擲骰，希望擲骰玩家可在此頻道輸入以下指令登記。\n.admin registerChannel\nAdmin 希望取消允許，可輸入\n.admin disallowrolling";
            return rply;
        case /^account$/i.test(mainMsg[1]):
            if (groupid) {
                rply.text = "設定帳號時，請直接和HKTRPG對話，禁止在群組中使用";
                return rply;
            }
            if (!mainMsg[2]) {
                rply.text = "請設定使用者名稱，4-16字，中英文限定，大小階相同";
                return rply;
            }
            if (!mainMsg[3]) {
                rply.text = "請設定密碼，6-16字，英文及以下符號限定!@#$%^&*";
                return rply;
            }
            name = mainMsg[2].toLowerCase();
            if (!checkUserName(name)) {
                rply.text = "使用者名稱，4-16字，中英文限定，大小階相同";
                return rply;
            }

            if (!checkPassword(mainMsg[3])) {
                rply.text = "使用者密碼，6-16字，英文及以下符號限定!@#$%^&*";
                return rply;
            }
            hash = crypto.createHmac('sha256', mainMsg[3])
                .update(salt)
                .digest('hex');
            try {
                temp = await schema.accountPW.findOne({
                    "userName": name
                });
            } catch (e) {
                console.error('ACCOUNT ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            if (temp && temp.id != userid) {
                rply.text += "重覆用戶名稱"
                return rply;
            }
            try {
                await schema.accountPW.findOneAndUpdate({
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
                console.error('ACCOUNT ERROR:', e);
                rply.text += JSON.stringify(e);
                return rply;
            }
            rply.text += "現在你的帳號是: " + name + "\n" + "密碼: " + mainMsg[3];
            rply.text += "\n登入位置: https://www.hktrpg.com:20721/card/ \n如想經網頁擲骰，可以請Admin在群組輸入\n.admin  allowrolling\n然後希望擲骰玩家可在頻道輸入以下指令登記。\n.admin registerChannel";
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
                    rply.text = "更新成功\n";
                    rply.text += JSON.stringify(filter);

                }
                //.admin addVipGroup -i  ID -l LV -n NAME -no NOTES -s SWITCH
            } catch (error) {
                console.error('新增VIP GET ERROR: ', error)
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
                    rply.text = "更新成功\n";
                    rply.text += JSON.stringify(filter);
                }
                //.admin addVipGroup -i  ID -l LV -n NAME -no NOTES -s SWITCH
            } catch (error) {
                console.error('新增VIP GET ERROR: ', error)
                rply.text = '新增VIP失敗\n因為 ' + error.message
            }
            return rply;


        case /^news$/i.test(mainMsg[1]) && /^on$/i.test(mainMsg[2]):
            if (!userid) return rply;
            try {
                doc = await schema.theNewsMessage.updateOne({
                    userID: userid,
                    botname: botname
                }, {
                    userID: userid,
                    botname: botname,
                    switch: true
                }, opt)
                if (doc) {
                    rply.text = "更新成功\n你已開啓更新通知功能";
                }
                //.admin addVipGroup -i  ID -l LV -n NAME -no NOTES -s SWITCH
            } catch (error) {
                console.error('新增VIP GET ERROR: ', error)
                rply.text = '更新失敗\n因為 ' + error.message
            }
            return rply;

        case /^news$/i.test(mainMsg[1]) && /^off$/i.test(mainMsg[2]):
            if (!userid) return rply;

            try {
                doc = await schema.theNewsMessage.updateOne({
                    userID: userid,
                    botname: botname
                }, {
                    userID: userid,
                    botname: botname,
                    switch: false
                }, opt)
                if (doc) {
                    rply.text = "更新成功\n你已關閉更新通知功能";
                }
                //.admin addVipGroup -i  ID -l LV -n NAME -no NOTES -s SWITCH
            } catch (error) {
                console.error('新增VIP GET ERROR: ', error)
                rply.text = '更新失敗\n因為 ' + error.message
            }
            return rply;
        case /^send$/i.test(mainMsg[1]) && /^News$/i.test(mainMsg[2]): {
            if (!adminSecret) return;
            if (!mainMsg[2]) return;
            if (userid !== adminSecret) return;
            let target = await schema.theNewsMessage.find({ botname: botname, switch: true });
            //   let alluser = await schema.firstTimeMessage.find({ botname: botname });
            rply.sendNews = inputStr.replace(/\s?\S+\s+\S+\s+/, '');
            rply.target = target;
            // rply.alluser = alluser;
            return rply;
        }
        default:
            break;
    }
}

function checkUserName(text) {
    //True 即成功
    return /^[A-Za-z0-9\u3000\u3400-\u4DBF\u4E00-\u9FFF]{4,16}$/.test(text);
}

async function checkGpAllow(target) {
    let doc;
    try {
        doc = await schema.allowRolling.findOne({
            "id": target
        })
    } catch (e) {
        console.error('Allowrolling ERROR:', e);

    }
    return doc;
}


function checkPassword(text) {
    //True 即成功
    return /^[A-Za-z0-9!@#$%^&*]{6,16}$/.test(text);
}

async function store(mainMsg, mode) {
    var resultId = pattId.exec(mainMsg);
    var resultGP = pattGP.exec(mainMsg);
    var resultLv = pattLv.exec(mainMsg);
    var resultName = pattName.exec(mainMsg);
    var resultNotes = pattNotes.exec(mainMsg);
    var resultSwitch = pattSwitch.exec(mainMsg);
    let reply = {};
    (resultId && mode == 'id') ? reply.id = resultId[1] : null;
    (resultGP && mode == 'gp') ? reply.gpid = resultGP[1] : null;
    (resultLv) ? reply.level = Number(resultLv[1]) : null;
    (resultName) ? reply.name = resultName[1] : null;
    (resultNotes) ? reply.notes = resultNotes[1] : null;
    (resultSwitch && resultSwitch[1].toLowerCase() == 'true') ? reply.switch = true : null;
    (resultSwitch && resultSwitch[1].toLowerCase() == 'false') ? reply.switch = false : null;
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
/**


  case /^fixEXP$/i.test(mainMsg[1]): {
            if (!adminSecret||userid !== adminSecret){
                rply.text ="ADMIN 才可以使用"
                return rply;
                }
            let doc = await schema.trpgLevelSystem.find({})
            for (let index = 0; index < doc.length; index++) {
                let docTRPG = await schema.trpgLevelSystem.findOne({
                    groupid: doc[index].groupid
                })
                docTRPG.HiddenV2 = (docTRPG.Hidden == "1") ? true : false;
                docTRPG.SwitchV2 = (docTRPG.Switch == "1") ? true : false;
                await docTRPG.save()
                docTRPG.trpgLevelSystemfunction.forEach(async element => {
                    let newLVMember = new schema.trpgLevelSystemMember({
                        groupid: doc[index].groupid,
                        userid: element.userid,
                        name: element.name,
                        EXP: element.EXP,
                        //現在經驗值
                        Level: Number(element.Level),
                        //等級
                        LastSpeakTime: element.LastSpeakTime
                    })

                    await newLVMember.save()
                });
            }
            // await doc.save()


            rply.text = doc.length + '項 DONE '
            return rply;
        }

 */