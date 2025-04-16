"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const i18n = require('../modules/i18n');

const gameName = function () {
    return '【Demo】'
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}

const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}

const getHelpMessage = async function (userId) {
    return await i18n.translate('demo:help', {}, userId);
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
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = await this.getHelpMessage(userid);
            rply.quotes = true;
            return rply;
        }
        case /^\d+$/i.test(mainMsg[1]): {
            rply.text = await i18n.translate('demo:roll.result', {
                number: mainMsg[1],
                input: inputStr,
                group: groupid,
                user: userid,
                role: userrole,
                bot: botname,
                name: displayname,
                channel: channelid,
                discordName: displaynameDiscord,
                members: membercount
            }, userid);
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = await i18n.translate('demo:simple', {}, userid);
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = []

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};