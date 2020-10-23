"use strict";
var variables = {};
const oneMinuts = (process.env.DEBUG) ? 1 : 60000;
const sevenDay = (process.env.DEBUG) ? 1 : 60 * 24 * 7 * 60000;
var gameName = function () {
    return '【Discord 頻道輸出工具】'
}
const opt = {
    upsert: true,
    runValidators: true
}
const VIP = require('../modules/veryImportantPerson');
const limitArr = (process.env.DEBUG) ? [99, 99, 99, 40, 40, 99, 99, 99] : [2, 20, 40, 40, 40, 99, 99, 99];
/**
 * 因為資源限制，
 * 每個guild 5分鐘可以使用一次,
 * 每個ACC可以一星期一次
 * 
 *  
 * 升級的話, 個人一星期20次
 * 只有一分鐘限制
 * 
 */
const schema = require('../modules/core-schema.js');
const fs = require('fs').promises;
const moment = require('moment-timezone');
const CryptoJS = require("crypto-js");
var gameType = function () {
    return 'Tool:Export:hktrpg'
}
const dir = __dirname + '/../tmp/';
var prefixs = function () {
    return [{
        first: /^[.]discord$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "測試進行中【聊天紀錄】" + "\n\
.discord html 可以輸出有分析功能的聊天紀錄\n\
.discord txt 可以輸出純文字的聊天紀錄\n\
需要使用者及rollbot 都有閱讀頻道聊天紀錄的權限\n\
然後會私訊你紀錄\n\
注意 使用此功能，你需要有管理此頻道的權限或管理員權限。\n\
另外網頁版內容經過AES加密，後者是純文字檔案\n\
因為經過server處理，擔心個資外洩請勿使用。\n\
\n\
因為資源限制，\n\
每個群組 5分鐘可以使用一次,\n\
每個ACC可以一星期使用兩次\n\
\n\
經patreon解鎖功能的話可以一星期使用20次以上，\n\
及可以一分鐘使用一次。\n\
\n\
另外這是開發團錄功能的副產品，團錄功能敬請期待(?)"
}
var initialize = function () {
    return variables;
}

var rollDiceCommand = async function ({
    mainMsg,
    discordClient,
    discordMessage,
    channelid,
    groupid,
    botname,
    userid,
    userrole
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let C, M;
    let data = "";
    let totalSize = 0;
    let newRawDate = [];
    let newValue = "";
    let lv, limit, checkUser, checkGP;
    let channelName = discordMessage.channel.name || '';
    let date = new Date;
    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();
    let tempA = channelid + '_' + hour + minutes + seconds;
    let hasReadPermission, gpLimitTime;
    let update, gpRemainingTime, userRemainingTime;
    let theTime = new Date();
    let demoMode = false;
    if (groupid) {
        hasReadPermission = discordMessage.channel.permissionsFor(discordMessage.guild.me).has("READ_MESSAGE_HISTORY") || discordMessage.guild.me.hasPermission("ADMINISTRATOR");
    }

    function replacer(first, second) {
        let users = discordClient.users.cache.get(second);
        if (users && users.username) {
            return '@' + users.username;
        } else return first;
    }
    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = this.getHelpMessage();
            return rply;
        case /^html$/i.test(mainMsg[1]):
            if (!channelid || !groupid) {
                rply.text = "這是頻道功能，需要在頻道上使用。"
                return rply;
            }
            if (!hasReadPermission) {
                rply.text = "HKTRPG沒有相關權限，禁止使用這功能。\nHKTRPG需要有查看此頻道對話歷史的權限。"
                return rply;
            }
            if (userrole < 2) {
                rply.text = "你沒有相關權限，禁止使用這功能。\n你需要有管理此頻道的權限或管理員權限。"
                return rply;
            }
            if (botname !== "Discord") {
                rply.text = "這是Discord限定功能"
                return rply;
            }
            lv = await VIP.viplevelCheckUser(userid);
            limit = limitArr[lv];
            checkUser = await schema.exportUser.findOne({
                userID: userid
            });
            checkGP = await schema.exportGp.findOne({
                groupID: userid
            });
            gpLimitTime = (lv > 0) ? oneMinuts : oneMinuts * 5;
            gpRemainingTime = (checkGP) ? theTime - checkGP.lastActiveAt - gpLimitTime : 1;
            userRemainingTime = (checkUser) ? theTime - checkUser.lastActiveAt - sevenDay : 1;
            try {
                C = await discordClient.channels.fetch(channelid);
            } catch (error) {
                if (error) {
                    rply.text = "出現錯誤(ERROR): " + '\n' + error;
                    return rply;
                }
            }
            //<0 = DC 未過
            if (gpRemainingTime < 0) {
                rply.text = "此群組的冷卻時間未過，冷卻剩餘" + millisToMinutesAndSeconds(gpRemainingTime) + '時間';
                return rply;
            }
            if (userRemainingTime < 0 && checkUser && checkUser.times >= limit) {
                rply.text = '你每星期完整下載聊天紀錄的上限為' + limit + '次，冷卻剩餘' + millisToMinutesAndSeconds(userRemainingTime) + '時間\n現在正處於Demo模式，可以輸出500條信息\n\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n\n源代碼  http://bit.ly/HKTRPG_GITHUB\n';
                demoMode = true;
            }
            /**
             * A. 檢查GP 資料, USER 資料 
             * 
             * B. 檢查 GP 5分鐘DC 時間 
             * PASS-> 檢查 
             * 
             * C. USER > 檢查時間
             * 超過一星期 -> 立即進行動作
             * 更新最新使用時間
             * 運行EXPORT
             * 
             * 
             * 檢查
             */
            console.log('USE EXPORT HTML')
            if (!checkGP) {
                checkGP = await schema.exportGp.updateOne({
                    groupID: userid
                }, {
                    lastActiveAt: new Date()
                }, opt);
            } else {
                checkGP.lastActiveAt = theTime;
                await checkGP.save();
            }


            discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            M = await lots_of_messages_getter_HTML(C, demoMode);
            if (M.length == 0) {
                rply.text = "未能讀取信息";
                return rply;
            }
            if (!checkUser) {
                checkUser = await schema.exportUser.updateOne({
                    userID: userid
                }, {
                    lastActiveAt: new Date(),
                    times: 1
                }, opt);
            } else {
                if (userRemainingTime && userRemainingTime > 0) {
                    update = {
                        times: 1,
                        lastActiveAt: new Date()
                    }
                } else {
                    if (!demoMode)
                        update = {
                            $inc: {
                                times: 1
                            }
                        }
                }
                if (update)
                    await schema.exportUser.updateOne({
                        userID: userid
                    }, update, opt);
            }
            totalSize = M.totalSize;
            newRawDate = M.sum_messages;

            try {
                await fs.access(dir)
            } catch (error) {
                if (error && error.code === 'ENOENT')
                    await fs.mkdir(dir);
            }
            data = await fs.readFile(__dirname + '/../views/discordLog.html', 'utf-8')
            var key = makeid(32);
            var randomLink = makeid(7);
            var newAESDate = AES(key, key, JSON.stringify(newRawDate));
            //aesData = [];
            newValue = data.replace(/aesData\s=\s\[\]/, 'aesData = ' + JSON.stringify(newAESDate.toString('base64'))).replace(/<h1>聊天紀錄<\/h1>/, '<h1>' + channelName + ' 的聊天紀錄</h1>');
            var tempB = key;
            await fs.writeFile(dir + channelid + '_' + hour + minutes + seconds + '_' + randomLink + '.html', newValue); // need to be in an async function
            rply.discordExportHtml = [
                tempA + '_' + randomLink,
                tempB
            ]
            rply.text += '已私訊你 頻道 ' + discordMessage.channel.name + ' 的聊天紀錄\n你的channel 聊天紀錄 共有 ' + totalSize + ' 項\n\n'
            return rply;
        case /^txt$/i.test(mainMsg[1]):
            if (!channelid || !groupid) {
                rply.text = "這是頻道功能，需要在頻道上使用。"
                return rply;
            }
            if (!hasReadPermission) {
                rply.text = "HKTRPG沒有相關權限，禁止使用這功能。\nHKTRPG需要有查看此頻道對話歷史的權限。"
                return rply;
            }
            if (userrole < 2) {
                rply.text = "你沒有相關權限，禁止使用這功能。\n你需要有管理此頻道的權限或管理員權限。"
                return rply;
            }
            if (botname !== "Discord") {
                rply.text = "這是Discord限定功能"
                return rply;
            }

            lv = await VIP.viplevelCheckUser(userid);
            limit = limitArr[lv];
            checkUser = await schema.exportUser.findOne({
                userID: userid
            });
            checkGP = await schema.exportGp.findOne({
                groupID: userid
            });
            gpLimitTime = (lv > 0) ? oneMinuts : oneMinuts * 5;
            gpRemainingTime = (checkGP) ? theTime - checkGP.lastActiveAt - gpLimitTime : 1;
            userRemainingTime = (checkUser) ? theTime - checkUser.lastActiveAt - sevenDay : 1;
            try {
                C = await discordClient.channels.fetch(channelid);
            } catch (error) {
                if (error) {
                    rply.text = "出現錯誤(ERROR): " + '\n' + error;
                    return rply;
                }
            }
            //<0 = DC 未過
            if (gpRemainingTime < 0) {
                rply.text = "此群組的冷卻時間未過，冷卻剩餘" + millisToMinutesAndSeconds(gpRemainingTime) + '時間';
                return rply;
            }
            if (userRemainingTime < 0 && checkUser && checkUser.times >= limit) {
                rply.text = '你每星期完整下載聊天紀錄的上限為' + limit + '次，冷卻剩餘' + millisToMinutesAndSeconds(userRemainingTime) + '時間\n現在正處於Demo模式，可以輸出500條信息\n\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply;
            }

            if (!checkGP) {
                checkGP = await schema.exportGp.updateOne({
                    groupID: userid
                }, {
                    lastActiveAt: new Date()
                }, opt);
            } else {
                checkGP.lastActiveAt = theTime;
                await checkGP.save();
            }


            console.log('USE EXPORT TXT')
            discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            M = await lots_of_messages_getter_TXT(C, demoMode);
            if (M.length == 0) {
                rply.text = "未能讀取信息";
                return rply;
            }
            if (!checkUser) {
                checkUser = await schema.exportUser.updateOne({
                    userID: userid
                }, {
                    lastActiveAt: new Date(),
                    times: 1
                }, opt);
            } else {
                if (userRemainingTime && userRemainingTime > 0) {
                    update = {
                        times: 1,
                        lastActiveAt: new Date()
                    }
                } else {
                    if (!demoMode)
                        update = {
                            $inc: {
                                times: 1
                            }
                        }
                }
                if (update)
                    await schema.exportUser.updateOne({
                        userID: userid
                    }, update, opt);
            }
            totalSize = M.totalSize;
            M = M.sum_messages;
            M.sort(function (b, a) {
                return a.timestamp - b.timestamp;
            });
            for (let index = M.length - 1; index >= 0; index--) {
                let time = M[index].timestamp.toString().slice(0, -3);
                const dateObj = moment
                    .unix(time)
                    .tz('Asia/Taipei')
                    .format('YYYY-MM-DD HH:mm:ss');
                if (M[index].isbot) {
                    data += '(🤖)'
                }
                data += M[index].userName + '	' + dateObj + '\n';
                data += M[index].contact.replace(/<@(.*?)>/ig, rollDiceCommand.replacer)
                data += '\n\n';
            }
            try {
                await fs.access(dir)
            } catch (error) {
                if (error && error.code === 'ENOENT')
                    await fs.mkdir(dir);
            }
            await fs.writeFile(dir + channelid + '_' + hour + minutes + seconds + '.txt', data); // need to be in an async function
            rply.discordExport = channelid + '_' + hour + minutes + seconds;
            rply.text += '已私訊你 頻道 ' + discordMessage.channel.name + ' 的聊天紀錄\n你的channel 聊天紀錄 共有 ' + totalSize + ' 項\n\n'
            return rply;
        default:
            break;
    }
}

async function lots_of_messages_getter_HTML(channel, demo) {
    const sum_messages = [];
    let last_id;
    let totalSize = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const options = {
            limit: 100
        };
        if (last_id) {
            options.before = last_id;
        }
        const messages = await channel.messages.fetch(options);
        totalSize += (messages.size) ? messages.size : 0;
        messages.forEach(element => {
            let temp;
            if (element.type == 'DEFAULT') {
                temp = {
                    timestamp: element.createdTimestamp,
                    contact: element.content.replace(/<@(.*?)>/ig, rollDiceCommand.replacer),
                    userName: element.author.username,
                    isbot: element.author.bot
                }
            } else
            if (element.type !== 'DEFAULT') {
                temp = {
                    timestamp: element.createdTimestamp,
                    contact: element.author.username + '\n' + element.type,
                    userName: '系統信息',
                    isbot: true
                }
            }
            sum_messages.push(temp)
        });
        last_id = messages.last().id;
        if (messages.size != 100) {
            break;
        }
        if (demo) {
            if (totalSize >= 500) {
                break;
            }
        }
    }

    return {
        sum_messages: sum_messages,
        totalSize: totalSize
    };
}
async function lots_of_messages_getter_TXT(channel, demo) {
    const sum_messages = [];
    let last_id;
    let totalSize = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const options = {
            limit: 100
        };
        if (last_id) {
            options.before = last_id;
        }
        const messages = await channel.messages.fetch(options);
        totalSize += (messages.size) ? messages.size : 0;
        messages.forEach(element => {
            let temp;
            if (element.type == 'DEFAULT') {
                temp = {
                    timestamp: element.createdTimestamp,
                    contact: element.content.replace(/<@(.*?)>/ig, rollDiceCommand.replacer),
                    userName: element.author.username,
                    isbot: element.author.bot
                }
            } else
            if (element.type !== 'DEFAULT') {
                temp = {
                    timestamp: element.createdTimestamp,
                    contact: element.author.username + '\n' + element.type,
                    userName: '系統信息',
                    isbot: true
                }
            }
            sum_messages.push(temp)
        });
        last_id = messages.last().id;
        if (messages.size != 100) {
            break;
        }
        if (demo) {
            if (totalSize >= 400) {
                break;
            }
        }
    }

    return {
        sum_messages: sum_messages,
        totalSize: totalSize
    };
}

function getAesString(data, key, iv) { //加密
    var keyy = CryptoJS.enc.Utf8.parse(key);
    //alert(key）;
    var ivv = CryptoJS.enc.Utf8.parse(iv);
    var encrypted = CryptoJS.AES.encrypt(data, keyy, {
        iv: ivv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString(); //返回的是base64格式的密文
}


function AES(key, iv, data) {
    var crypto = require('crypto');
    let algo = "aes-256-cbc"; // we are using 128 bit here because of the 16 byte key. use 256 is the key is 32 byte.
    var cipher = crypto.createCipheriv(algo, Buffer.from(key, 'utf-8'), iv.slice(0, 16));
    // var encrypted = cipher.update(data, 'utf-8', 'base64'); // `base64` here represents output encoding
    //encrypted += cipher.final('base64');
    var encrypted = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);
    return encrypted;
}

function getAES(key, iv, data) { //加密
    var encrypted = getAesString(data, key, iv); //密文
    //    var encrypted1 = CryptoJS.enc.Utf8.parse(encrypted);
    return encrypted;
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
const millisToMinutesAndSeconds = (millis) => {
    millis = millis * -1;
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    //ES6 interpolated literals/template literals 
    //If seconds is less than 10 put a zero in front.
    return `${minutes}分鐘${(seconds < 10 ? "0" : "")}${seconds}秒`;
}

module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};