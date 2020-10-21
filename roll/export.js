"use strict";
var variables = {};

var gameName = function () {
    return '【Discord 頻道輸出工具】'
}
const VIP = require('../modules/veryImportantPerson');
const limitArr = [1, 20, 40, 40, 40, 99, 99, 99];
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
    return "【聊天紀錄】" + "\n\
.discord html 可以輸出有分析功能的聊天紀錄\n\
.discord txt 可以輸出純文字的聊天紀錄\n\
需要使用者及rollbot 都有閱讀頻道聊天紀錄的權限\n\
然後會私訊你紀錄\n\
\n\
因為資源限制，\n\
每個群組 5分鐘可以使用一次,\n\
每個ACC可以一星期使用一次\n\
\n\
經patreon解鎖功能的話可以一星期使用20次以上，\n\
及可以一分鐘使用一次。\n\
https://www.patreon.com/HKTRPG"
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
    userid
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
    let lv, limit, check;
    let channelName = discordMessage.channel.name || '';
    let date = new Date;
    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();
    let tempA = channelid + '_' + hour + minutes + seconds;
    let permission, hasReadPermission;

    if (groupid) {
        permission = (discordMessage.channel && discordMessage.channel.permissionsFor(discordClient.user).has("READ_MESSAGE_HISTORY")) || (discordMessage.member && discordMessage.member.hasPermission("ADMINISTRATOR"));
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
            if (!permission) {
                rply.text = "你沒有相關權限，禁止使用這功能。\n你需要有查看此頻道對話歷史的權限。"
                return rply;
            }
            if (botname !== "Discord") {
                rply.text = "這是Discord限定功能"
                return rply;
            }
            lv = await VIP.viplevelCheckUser(userid);
            limit = limitArr[lv];
            check = await schema.characterCard.find({
                id: userid
            });
            if (check.length >= limit) {
                rply.text = '你每星期下載聊天紀錄的上限為' + limit + '次' + '\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n或自組服務器\n源代碼  http://bit.ly/HKTRPG_GITHUB';
                return rply
            }

            C = await discordClient.channels.fetch(channelid);
            discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG現在開始努力處理，需要一點時間');
            M = await lots_of_messages_getter(C);
            totalSize = M.totalSize;
            M = M.sum_messages;
            if (M.length == 0) return;
            for (let index = M.length - 1; index >= 0; index--) {
                if (M[index].type == 'DEFAULT') {
                    newRawDate[M.length - 1 - index] = {
                        timestamp: M[index].createdTimestamp,
                        contact: M[index].content.replace(/<@(.*?)>/ig, replacer),
                        userName: M[index].author.username,
                        isbot: M[index].author.bot
                    }
                } else
                if (M[index].type !== 'DEFAULT') {
                    newRawDate[M.length - 1 - index] = {
                        timestamp: M[index].createdTimestamp,
                        contact: M[index].author.username + '\n' + M[index].type,
                        userName: '系統信息',
                        isbot: true
                    }
                }
            }
            try {
                await fs.access(dir)
            } catch (error) {
                if (error && error.code === 'ENOENT')
                    await fs.mkdir(dir);
            }
            data = await fs.readFile(__dirname + '/../views/discordLog.html', 'utf-8')
            var key = makeid(32);
            var newAESDate = getAES(key, key, JSON.stringify(newRawDate));
            //aesData = [];
            newValue = data.replace(/aesData\s=\s\[\]/, 'aesData = ' + JSON.stringify(newAESDate)).replace(/<h1>聊天紀錄<\/h1>/, '<h1>' + channelName + ' 的聊天紀錄</h1>');
            var tempB = key;
            await fs.writeFile(dir + channelid + '_' + hour + minutes + seconds + '.html', newValue); // need to be in an async function
            rply.discordExportHtml = [
                tempA,
                tempB
            ]
            rply.text = '已私訊你 頻道 ' + discordMessage.channel.name + ' 的聊天紀錄\n你的channel 聊天紀錄 共有 ' + totalSize + ' 項\n\n'
            return rply;
        case /^export$/i.test(mainMsg[1]):
            if (botname !== "Discord") {
                rply.text = "Discord限定功能"
                return rply;
            }
            if (!channelid || !groupid) return;
            C = await discordClient.channels.fetch(channelid);
            M = await lots_of_messages_getter(C);

            totalSize = M.totalSize;
            M = M.sum_messages;
            if (M.length == 0) return;
            for (let index = M.length - 1; index >= 0; index--) {
                let time = M[index].createdTimestamp.toString().slice(0, -3);
                const dateObj = moment
                    .unix(time)
                    .tz('Asia/Taipei')
                    .format('YYYY-MM-DD HH:mm:ss');
                data += M[index].author.username + '	' + dateObj + '\n';
                data += M[index].content
                    .replace(/<@(.*?)>/ig, replacer)
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
            rply.text = '你的channel 聊天紀錄 共有 ' + totalSize + ' 項\n\n'
            return rply;
        case /^\S/.test(mainMsg[1] || ''):
            rply.text = 'Demo'
            return rply;
        default:
            break;
    }
}

async function lots_of_messages_getter(channel) {
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
        sum_messages.push(...messages.array());
        last_id = messages.last().id;

        if (messages.size != 100) {
            break;
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
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};