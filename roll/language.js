"use strict";
const i18n = require('../modules/i18n');
const records = require('../modules/records');
const { SlashCommandBuilder } = require('discord.js');

const gameName = function () {
    // This is called from the system without user context
    return i18n.translate('language.name');
}

const gameType = function () {
    return 'admin:language'
}

const prefixs = function () {
    return [{
        first: /^\.(lang|language|語言|语言)$/i,
        second: null
    }]
}

// This function is called directly by the system
const getHelpMessage = function () {
    console.log('[DEBUG] getHelpMessage called');
    
    try {
        // If we have user context, use it
        if (this && this.userid) {
            console.log('[DEBUG] Help being shown with user context:', this.userid);
        }
    } catch (error) {
        console.error('[ERROR] Error in getHelpMessage:', error);
    }
    
    // Just return both language versions to avoid any issues
    // English version
    const helpEN = "【🌐Language Settings】\n╭────── ℹ️Instructions ──────\n│ View available languages:\n│ .lang list\n│ \n│ Set language:\n│ .lang [language code]\n│ or\n│ .language set [language code]\n│ Example: .lang en\n│ Example: .language set zh-tw\n│ \n│ Currently supported languages:\n│ en (English)\n│ zh-TW (繁體中文)\n│ zh-CN (简体中文)\n│ ja (日本語)\n│ ko (한국어)\n╰──────────────";
    
    // Chinese version 
    const helpZhTW = "【🌐語言設定】\n╭────── ℹ️說明 ──────\n│ 查看可用語言:\n│ .lang list\n│ \n│ 設置語言:\n│ .lang [語言代碼]\n│ 或\n│ .language set [語言代碼]\n│ 例如: .lang zh-TW\n│ 例如: .language set zh-tw\n│ \n│ 目前支持的語言:\n│ en (English)\n│ zh-TW (繁體中文)\n│ zh-CN (简体中文)\n│ ja (日本語)\n│ ko (한국어)\n╰──────────────";
    
    return helpZhTW;
}

const initialize = function () {
    return {};
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
    displaynameDiscord
}) {
    console.log('[DEBUG] rollDiceCommand called with userid:', userid, 'mainMsg:', mainMsg);
    
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    
    try {
        // Get current language for user first
        const currentLang = await i18n.getUserLanguage({ userid, groupid });
        
        // Handle help message or empty command - pass userid directly to translate
        // Make sure this is the first condition checked after getting user language
        if (!mainMsg[1] || mainMsg[1] === '' || /^help$/i.test(mainMsg[1])) {
            rply.text = i18n.translate('language.help', { 
                userid, 
                groupid,
                language: currentLang // Explicitly set language
            });
            rply.quotes = true;
            return rply;
        }
        
        // List available languages
        if (/^list$/i.test(mainMsg[1])) {
            const langs = i18n.getLanguages();
            rply.text = i18n.translate('language.available', { 
                userid,
                groupid,
                language: currentLang, // Explicitly set language
                list: langs.join(', '),
                current: currentLang
            });
            return rply;
        }
        
        // Support for ".language set zh-tw" format
        if (/^set$/i.test(mainMsg[1]) && mainMsg[2]) {
            const inputLang = mainMsg[2].toLowerCase();
            if (i18n.isSupported(inputLang)) {
                // Get properly cased language code
                const normalizedLang = i18n.getNormalizedLanguage(inputLang);
                
                // Store user preference in database
                await records.updateUserLanguage(userid, normalizedLang);
                
                // Clear the cache to ensure the new language is used immediately
                i18n.clearUserCache(userid);
                
                rply.text = i18n.translate('language.changed', {
                    userid,
                    groupid,
                    language: normalizedLang, // Use new language for message
                    from: currentLang,
                    to: normalizedLang
                });
            } else {
                rply.text = i18n.translate('language.notSupported', {
                    userid,
                    groupid,
                    requested: inputLang,
                    list: i18n.getLanguages().join(', ')
                });
            }
            return rply;
        }
        
        // Original format: ".language zh-tw"
        const inputLang = mainMsg[1].toLowerCase();
        if (i18n.isSupported(inputLang)) {
            // Get properly cased language code
            const normalizedLang = i18n.getNormalizedLanguage(inputLang);
            
            // Store user preference in database
            await records.updateUserLanguage(userid, normalizedLang);
            
            // Clear the cache to ensure the new language is used immediately
            i18n.clearUserCache(userid);
            
            rply.text = i18n.translate('language.changed', {
                userid,
                groupid,
                language: normalizedLang, // Use new language for message
                from: currentLang,
                to: normalizedLang
            });
        } else {
            rply.text = i18n.translate('language.notSupported', {
                userid,
                groupid,
                requested: inputLang,
                list: i18n.getLanguages().join(', ')
            });
        }
        
        return rply;
    } catch (error) {
        console.error('Error in language command:', error);
        rply.text = i18n.translate('system.error.command', { userid, groupid });
        return rply;
    }
}

const discordCommand = [{
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Set your preferred language')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Language code (e.g., en, zh-TW)')
                .setRequired(false)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: '繁體中文', value: 'zh-TW' },
                    { name: '简体中文', value: 'zh-CN' },
                    { name: '日本語', value: 'ja' },
                    { name: '한국어', value: 'ko' },
                )),
    async execute(interaction) {
        try {
            const langOption = interaction.options.getString('language');
            const userid = interaction.user.id;
            
            // If no language provided, show current language and list
            if (!langOption) {
                const currentLang = await i18n.getUserLanguage({ userid });
                
                // First show help message in user's language
                const helpText = i18n.translate('language.help', {
                    userid,
                    language: currentLang // Explicitly set language
                });
                
                await interaction.reply({ content: helpText, ephemeral: true });
                return;
            }
            
            // Check if language is supported
            if (!i18n.isSupported(langOption)) {
                await interaction.reply({
                    content: i18n.translate('language.notSupported', {
                        userid,
                        requested: langOption,
                        list: i18n.getLanguages().join(', ')
                    }),
                    ephemeral: true
                });
                return;
            }
            
            // Get current language
            const currentLang = await i18n.getUserLanguage({ userid });
            
            // Get properly cased language code
            const normalizedLang = i18n.getNormalizedLanguage(langOption);
            
            // Update language
            await records.updateUserLanguage(userid, normalizedLang);
            
            // Clear the cache to ensure the new language is used immediately
            i18n.clearUserCache(userid);
            
            // Respond with message in new language
            await interaction.reply({
                content: i18n.translate('language.changed', {
                    userid,
                    from: currentLang,
                    to: normalizedLang
                }),
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error in language slash command:', error);
            await interaction.reply({
                content: i18n.translate('system.error.command', { userid: interaction.user.id }),
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