"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const gameName = function (params = {}) {
    return resolveGameName(params, 'request_rolling.game_name', '【要求擲骰/點擊功能】');
}

const gameType = function () {
    return 'funny:request:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^\.re$/i,
        second: null
    }]
}
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'request_rolling.help', () => getT({ locale: 'zh-tw' })('request_rolling.help'));
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    locale,
    t
}) {
    const i18nParams = { locale, t };
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage(i18nParams);
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
    text = text.replace(/^\.re\s+/i, '').replaceAll(/[\r\n]/gm, '').split(',')
    text.splice(10);
    for (let index = 0; index < text.length; index++) {
        text[index] = text[index].slice(0, 80);
    }
    text = text.filter(Boolean)
    return text;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('re')
            .setDescription('Discord要求擲骰/點擊功能')
            .addStringOption(option => 
                option.setName('text1')
                    .setDescription('第一個選項 (例: 1d100 哈哈 或 簽到)')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('text2')
                    .setDescription('第二個選項 (例: 1d3 SC成功)')
                    .setRequired(false))
            .addStringOption(option => 
                option.setName('text3')
                    .setDescription('第三個選項 (例: 1d10 SC失敗)')
                    .setRequired(false))
            .addStringOption(option => 
                option.setName('text4')
                    .setDescription('第四個選項 (可輸入擲骰或純文字)')
                    .setRequired(false))
            .addStringOption(option => 
                option.setName('text5')
                    .setDescription('第五個選項 (可輸入擲骰或純文字)')
                    .setRequired(false)),
        async execute(interaction) {
            const options = ['text1', 'text2', 'text3', 'text4', 'text5']
                .map(name => interaction.options.getString(name))
                .filter(Boolean);
            return `.re ${options.join(', ')}`;
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