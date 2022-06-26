// @ts-expect-error TS(6200): Definitions of the following identifiers conflict ... Remove this comment to see the full error message
"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.DISCORD_CHANNEL_SECRET) {
    // @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
    return;
}
const variables = {};
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'SlashComma... Remove this comment to see the full error message
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
    }];
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

const rollDiceCommand = async function(
    this: any,
    {
        inputStr,
        mainMsg,
        userrole
    }: any
) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            (rply as any).quotes = true;
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            if (userrole <= 1) {
                rply.text = '修改信息時，需要Admin或頻道管理權限，請重新檢查'
                return rply;
            }
            (rply as any).discordEditMessage = inputStr.replace(/^\S+\s+/, '');
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
            .addStringOption((option: any) => option.setName('text').setDescription('輸入內容').setRequired(true)),
        async execute(interaction: any) {
            const text = interaction.options.getString('text')
            return `.edit ${text}`
        }
    }
];
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};