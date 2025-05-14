"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const i18n = require('../modules/i18n');

const gameName = function () {
    return i18n.translate('demo.name');
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
const getHelpMessage = function () {
    return i18n.translate('demo.help');
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
    // Get user's preferred language
    const userLang = await i18n.getUserLanguage({ userid, groupid });
    
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
        case /^\d+$/i.test(mainMsg[1]): {
            // Example of translation with variables
            rply.text = i18n.translate('demo.results.number', {
                language: userLang,
                number: mainMsg[1],
                user: displayname
            });
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = i18n.translate('demo.results.default', { language: userLang });
            return rply;
        }
        default: {
            break;
        }
    }
}

const discordCommand = [{
    data: new SlashCommandBuilder()
        .setName('demo')
        .setDescription('Demo command showing i18n functionality')
        .addIntegerOption(option => 
            option.setName('number')
                .setDescription('A number to display')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            const number = interaction.options.getInteger('number');
            const userLang = await i18n.getUserLanguage({ userid: interaction.user.id });
            
            if (number) {
                const response = i18n.translate('demo.results.number', {
                    language: userLang,
                    number: number,
                    user: interaction.user.displayName || interaction.user.username
                });
                await interaction.reply({ content: response });
            } else {
                const response = i18n.translate('demo.help', { language: userLang });
                await interaction.reply({ content: response });
            }
        } catch (error) {
            console.error('Error in demo slash command:', error);
            await interaction.reply({ 
                content: 'Error processing demo command', 
                ephemeral: true 
            });
        }
    }
}];

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};