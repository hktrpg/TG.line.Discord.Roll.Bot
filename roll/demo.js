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

    try {
        // First argument is the command
        const command = mainMsg[1]?.toLowerCase() || '';
        
        // Handle different commands
        switch (true) {
            case /^help$/i.test(command) || !command: {
                // Get help message in user's language
                rply.text = i18n.translate('demo.help', {
                    language: userLang,
                    prefix: '.' // For text commands, use . as prefix in examples
                });
                rply.quotes = true;
                return rply;
            }
            
            case /^\d+$/i.test(command): {
                // Example of translation with variables (number demonstration)
                rply.text = i18n.translate('demo.results.number', {
                    language: userLang,
                    number: command,
                    user: displayname
                });
                return rply;
            }
            
            case /^lang$/i.test(command): {
                // Show current language settings
                const groupLang = groupid ? await i18n.getGroupLanguage(groupid) : null;
                
                rply.text = i18n.translate('demo.language.current', {
                    language: userLang,
                    userLanguage: userLang,
                    groupLanguage: groupLang || i18n.translate('language.notSet', { language: userLang })
                });
                return rply;
            }
            
            default: {
                // Default response
                rply.text = i18n.translate('demo.results.default', { 
                    language: userLang 
                });
                return rply;
            }
        }
    } catch (error) {
        console.error('Error in demo command:', error);
        rply.text = i18n.translate('system.error.command', { 
            userid, 
            groupid 
        });
        return rply;
    }
}

const discordCommand = [{
    data: (() => {
        // Get localizations for command names and descriptions
        const getLocalizationMap = (key) => {
            // Discord's supported locales - we only map the ones we have translations for
            const discordLocaleMap = {
                'en': 'en-US',    // English (US)
                'zh-TW': 'zh-TW', // Chinese (Taiwan)
                'zh-CN': 'zh-CN'  // Chinese (China)
            };

            const localizationMap = {};
            i18n.getLanguages().forEach(lang => {
                try {
                    // Skip languages we don't have a Discord mapping for
                    if (!discordLocaleMap[lang]) {
                        return;
                    }

                    // Get the translated value for this key in each language
                    const translation = i18n.directTranslateSync(key, lang);
                    if (translation && translation !== key) {
                        // Use the Discord-specific locale code
                        const discordLocale = discordLocaleMap[lang];
                        localizationMap[discordLocale] = translation;
                    }
                } catch (err) {
                    console.error(`Failed to get localization for ${key} in ${lang}:`, err);
                }
            });
            return localizationMap;
        };

        // Build the slash command with localizations
        const command = new SlashCommandBuilder()
            .setName(i18n.directTranslateSync('demo.slash.name', 'en') || 'demo')
            .setDescription(i18n.directTranslateSync('demo.slash.description', 'en') || 'Demo command showing i18n functionality')
            .setNameLocalizations(getLocalizationMap('demo.slash.name'))
            .setDescriptionLocalizations(getLocalizationMap('demo.slash.description'));

        // Add 'number' subcommand
        command.addSubcommand(subcommand => 
            subcommand
                .setName(i18n.directTranslateSync('demo.slash.number.name', 'en') || 'number')
                .setDescription(i18n.directTranslateSync('demo.slash.number.description', 'en') || 'Display a number with i18n')
                .setNameLocalizations(getLocalizationMap('demo.slash.number.name'))
                .setDescriptionLocalizations(getLocalizationMap('demo.slash.number.description'))
                .addIntegerOption(option => 
                    option.setName(i18n.directTranslateSync('demo.slash.option.value.name', 'en') || 'value')
                        .setDescription(i18n.directTranslateSync('demo.slash.option.value.description', 'en') || 'The number to display')
                        .setNameLocalizations(getLocalizationMap('demo.slash.option.value.name'))
                        .setDescriptionLocalizations(getLocalizationMap('demo.slash.option.value.description'))
                        .setRequired(true))
        );

        // Add 'help' subcommand
        command.addSubcommand(subcommand => 
            subcommand
                .setName(i18n.directTranslateSync('demo.slash.help.name', 'en') || 'help')
                .setDescription(i18n.directTranslateSync('demo.slash.help.description', 'en') || 'Show help information')
                .setNameLocalizations(getLocalizationMap('demo.slash.help.name'))
                .setDescriptionLocalizations(getLocalizationMap('demo.slash.help.description'))
        );

        return command;
    })(),
    
    async execute(interaction) {
        try {
            const userid = interaction.user.id;
            const groupid = interaction.guildId;
            const userLang = await i18n.getUserLanguage({ userid, groupid });
            
            // Get the subcommand
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'number':
                    // Get the value from the option
                    const value = interaction.options.getInteger('value');
                    
                    // Translate with number interpolation
                    const response = i18n.translate('demo.results.number', {
                        language: userLang,
                        number: value,
                        user: interaction.user.displayName || interaction.user.username
                    });
                    
                    await interaction.reply({ 
                        content: response,
                        ephemeral: true
                    });
                    break;
                    
                case 'help':
                default:
                    // Show help message in user's language
                    const helpText = i18n.translate('demo.help', { 
                        language: userLang,
                        prefix: '/'  // For slash commands, use / as prefix in examples
                    });
                    
                    await interaction.reply({ 
                        content: helpText,
                        ephemeral: true 
                    });
                    break;
            }
        } catch (error) {
            console.error('Error in demo slash command:', error);
            
            // Get user's language for error message
            const errorMsg = i18n.translate('system.error.command', { 
                userid: interaction.user.id,
                groupid: interaction.guildId
            });
            
            await interaction.reply({ 
                content: errorMsg, 
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