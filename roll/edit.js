"use strict";
if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}
const { SlashCommandBuilder } = require('discord.js');
const checkTools = require('../modules/check.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const variables = {};
const gameName = function (params = {}) {
    return resolveGameName(params, 'edit.game_name', '【舊信息修改功能】Discord限定');
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
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'edit.help', () => getT({ locale: 'zh-tw' })('edit.help'));
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    userrole,
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
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = checkTools.permissionErrMsg({ locale,
                flag: checkTools.flag.ChkManager,
                role: userrole
            });
            if (rply.text) {
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
            .setDescription('【舊信息修改功能】Discord限定'),
        async execute() {
            return `.edit help`;
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