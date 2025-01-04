"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const gameName = function () {
    return '【要求擲骰/點擊功能】'
}

const gameType = function () {
    return 'funny:request:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.re$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【🎲Discord互動功能】
╭────── 🎯要求擲骰/點擊 ──────
│ 指令格式:
│ 　• .re [選項1], [選項2], ...
│
├────── 📋選項格式 ──────
│ • 擲骰選項:
│ 　- [x]d[y] [描述]
│ 　  例: 1d100 哈哈
│ 　      1d3 SC成功
│ 　      1d10 SC失敗
│
│ • 純文字選項:
│ 　- [文字]
│ 　  例: 簽到
│
├────── 💡使用說明 ──────
│ • 僅限Discord使用
│ • 多個選項用逗號分隔
│ • 系統會自動生成按鈕
│ • 其他用戶可點擊參與
│
├────── 📝範例指令 ──────
 .re 1d100 哈哈, 1d3 SC成功,
     1d10 SC失敗, 簽到
╰──────────────`
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
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.re$/i.test(mainMsg[0]):
            {
                rply.requestRolling = handleRequestRolling(inputStr)
                return rply;
            }
        default: {
            break;
        }
    }
}
function handleRequestRolling(text) {
    text = text.replace(/^\.re\s+/i, '').replace(/[\r\n]/gm, '').split(',')
    text.splice(10);
    for (let index = 0; index < text.length; index++) {
        text[index] = text[index].substring(0, 80);
    }
    text = text.filter(n => n)
    return text;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('re')
            .setDescription('要求擲骰/點擊功能')
            .addStringOption(option => option.setName('text1').setDescription('輸入第一個擲骰內容').setRequired(true))
            .addStringOption(option => option.setName('text2').setDescription('輸入第二個擲骰內容'))
            .addStringOption(option => option.setName('text3').setDescription('輸入第三個擲骰內容'))
            .addStringOption(option => option.setName('text4').setDescription('輸入第四個擲骰內容'))
            .addStringOption(option => option.setName('text5').setDescription('輸入第五個擲骰內容')),
        async execute(interaction) {
            const text1 = interaction.options.getString('text1');
            const text2 = (interaction.options.getString('text2')) ? `,${interaction.options.getString('text2')}` : '';
            const text3 = (interaction.options.getString('text3')) ? `,${interaction.options.getString('text3')}` : '';
            const text4 = (interaction.options.getString('text4')) ? `,${interaction.options.getString('text4')}` : '';
            const text5 = (interaction.options.getString('text5')) ? `,${interaction.options.getString('text5')}` : '';
            return `.re ${text1}${text2}${text3}${text4}${text5}`;
        }
    }
]
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};