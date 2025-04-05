"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const checkTools = require('../modules/check.js');
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
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
    return `【✏️訊息編輯系統】Discord限定
╭────── 📝功能說明 ──────
│ 管理員可用此功能修改:
│ 　• HKTRPG發送的訊息
│ 　• Webhook(角色扮演)發送的訊息
│ 
│ ⚠️使用限制:
│ 　• 僅限修改以上兩種訊息
│ 　• 無法修改其他人或BOT的訊息
│ 　• 需具備管理員或頻道管理權限
│
│ 📋使用方法:
│ 1. 對目標訊息按右鍵
│ 2. 選擇回覆(Reply)
│ 3. 輸入以下格式:
│ 
│ .edit 信息第一行
│ 信息第二行
│ 信息第三行
│
│ 🔑權限要求:
│ 　• 需具備頻道Admin權限
│ 　• 或擁有頻道管理權限
╰──────────────`
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
                flag: checkTools.flag.ChkManager,
                role: userrole
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
            .setDescription('修改 HKTRPG 或 Webhook 發送的訊息')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('新的訊息內容 (可使用換行)')
                    .setRequired(true)),
        async execute(interaction) {
            if (!interaction.member.permissions.has('ManageMessages') &&
                !interaction.member.permissions.has('Administrator')) {
                return '你需要管理員或頻道管理權限才能使用此功能';
            }
            if (!interaction.message?.reference) {
                return '請回覆(Reply)要修改的訊息';
            }
            const text = interaction.options.getString('text');
            return `.edit ${text}`;
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