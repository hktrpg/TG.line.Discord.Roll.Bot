"use strict";
var variables = {};

var gameName = function () {
    return '【Discord 頻道輸出工具】'
}
const VIP = require('../modules/veryImportantPerson');
const limitArr = [20, 20, 20, 30, 30, 99, 99, 99];
/**
 *  因為資源限制，
 *  每個guild 5分鐘可以使用一次,
 *  每個ACC可以一星期
 */
const fs = require('fs').promises;
const moment = require('moment-timezone');
const CryptoJS = require("crypto-js");
var gameType = function () {
    return 'Tool:Export:hktrpg'
}
const dir = __dirname + '/../tmp/';
var prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^[.]discord$/i,
        second: null
    }]
}
var getHelpMessage = function () {
    return "【示範】" + "\n\
只是一個Demo的第一行\n\
只是一個Demo末行"
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
    let channelName = discordMessage.channel.name || '';
    var date = new Date;
    var seconds = date.getSeconds();
    var minutes = date.getMinutes();
    var hour = date.getHours();
    var tempA = channelid + '_' + hour + minutes + seconds;
    var permission = discordMessage.channel.permissionsFor(discordClient.user).has("READ_MESSAGE_HISTORY") || discordMessage.member.hasPermission("ADMINISTRATOR");
    var hasReadPermission = discordMessage.channel.permissionsFor(discordMessage.guild.me).has("READ_MESSAGE_HISTORY") || discordMessage.guild.me.hasPermission("ADMINISTRATOR");

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
            if (!channelid) {
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
            if (!channelid || !groupid) return;
            C = await discordClient.channels.fetch(channelid);
            discordMessage.channel.send("<@" + userid + '>\n' + ' 請等等，HKTRPG正在努力進行中，需要一點時間');
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
            rply.text = '\n' + '你的channel 聊天紀錄 共有 ' + totalSize + ' 項\n\n'
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