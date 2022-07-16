"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const checkTools = require('../modules/check.js');
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【舊信息修改功能】Discord限定'
}

const gameType = function () {
    return 'tool:edit:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.edit$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【舊信息修改功能】Discord限定
這是讓管理員用來修改由HKTRPG和webhook(角色扮演功能)所發出的信息的功能
就像你自己只能修改自己的信息一樣，此功能不能修改其他人或其他BOT的信息。
使用方法:  
對想要修改的信息右擊點選reply 然後按以下格式輸入即可
.edit 信息第一行
信息第二行
信息第三行

注: 本功能需要Admin或頻道管理權限
`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userrole,
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            if (rply.text = checkTools.permissionErrMsg({
                flag : checkTools.flag.ChkManager,
                role : userrole
            })) {
                return rply;
            }

            rply.discordEditMessage = inputStr.replace(/^\S+\s+/, '')
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('edit')
            .setDescription('【修改舊信息】 請Reply想要修改的信息')
            .addStringOption(option => option.setName('text').setDescription('輸入內容').setRequired(true)),
        async execute(interaction) {
            const text = interaction.options.getString('text')
            return `.edit ${text}`
        }
    }
];
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};