"use strict";
var variables = {};

var gameName = function () {
    return '【Discord 頻道輸出工具】'
}
const fs = require('fs').promises;
const moment = require('moment-timezone');
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
    userid,
    channelid,
    groupid,
    botname
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    let C, M;
    let data = "";
    let totalSize = 0;

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
            await fs.writeFile(dir + channelid + '_' + userid + '.txt', data); // need to be in an async function
            rply.discordExport = channelid + '_' + userid;
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
module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};