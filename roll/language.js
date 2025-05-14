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
    const helpEN = "【🌐Language Settings】\n╭────── ℹ️Instructions ──────\n│ View available languages:\n│ .lang list\n│ \n│ Set language:\n│ .lang [language code]\n│ or\n│ .language set [language code]\n│ Example: .lang en\n│ Example: .language set zh-tw\n│ \n│ For admins - Set group language:\n│ .lang group [language code]\n│ Example: .lang group en\n│ \n│ Currently supported languages:\n│ en (English)\n│ zh-TW (繁體中文)\n│ zh-CN (简体中文)\n│ ja (日本語)\n│ ko (한국어)\n╰──────────────";

    // Chinese version 
    const helpZhTW = "【🌐語言設定】\n╭────── ℹ️說明 ──────\n│ 查看可用語言:\n│ .lang list\n│ \n│ 設置語言:\n│ .lang [語言代碼]\n│ 或\n│ .language set [語言代碼]\n│ 例如: .lang zh-TW\n│ 例如: .language set zh-tw\n│ \n│ 管理員功能 - 設置群組語言:\n│ .lang group [語言代碼]\n│ 例如: .lang group zh-TW\n│ \n│ 目前支持的語言:\n│ en (English)\n│ zh-TW (繁體中文)\n│ zh-CN (简体中文)\n│ ja (日本語)\n│ ko (한국어)\n╰──────────────";

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
            console.log(`[DEBUG] Showing help in language: ${currentLang}`);
            
            // First try normal translation
            rply.text = i18n.translate('language.help', { 
                userid, 
                groupid,
                language: currentLang // Explicitly set language
            });
            
            // If that fails or if we're debugging, also try direct file translation
            try {
                const directTranslation = await i18n.directTranslate('language.help', currentLang);
                if (directTranslation) {
                    console.log('[DEBUG] Using direct file translation for help');
                    rply.text = directTranslation;
                }
            } catch (err) {
                console.error('[ERROR] Direct translation failed:', err);
            }
            
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

        // Admin command to set group language
        if (/^group$/i.test(mainMsg[1]) && mainMsg[2]) {
            // Check if user has admin/manager role
            const isAdmin = userrole === 1 || userrole === 2 || userrole === 3;
            
            if (!isAdmin) {
                rply.text = i18n.translate('language.adminOnly', {
                    userid,
                    groupid,
                    language: currentLang
                });
                return rply;
            }
            
            if (!groupid) {
                rply.text = i18n.translate('language.needGroup', {
                    userid,
                    language: currentLang
                });
                return rply;
            }
            
            const inputLang = mainMsg[2].toLowerCase();
            if (i18n.isSupported(inputLang)) {
                // Get properly cased language code
                const normalizedLang = i18n.getNormalizedLanguage(inputLang);
                
                // Get current group language if any
                const records = require('../modules/records');
                const currentGroupLang = await records.getGroupLanguage(groupid);
                
                // Store group preference in database
                await records.updateGroupLanguage(groupid, normalizedLang);
                
                // Clear the cache to ensure the new language is used immediately
                i18n.clearUserCache(null, groupid);
                
                // Try normal translation first
                rply.text = i18n.translate('language.groupChanged', {
                    userid,
                    groupid,
                    language: normalizedLang, // Use new language for message
                    from: currentGroupLang || i18n.defaultLanguage,
                    to: normalizedLang
                });
                
                // If the key is returned (translation not found), try direct translation
                if (rply.text === 'language.groupChanged') {
                    try {
                        const directTranslation = await i18n.directTranslate('language.groupChanged', normalizedLang);
                        if (directTranslation) {
                            // Replace placeholders manually
                            rply.text = directTranslation
                                .replace('{{from}}', currentGroupLang || i18n.defaultLanguage)
                                .replace('{{to}}', normalizedLang);
                        }
                    } catch (err) {
                        console.error('[ERROR] Direct translation failed:', err);
                    }
                }
            } else {
                rply.text = i18n.translate('language.notSupported', {
                    userid,
                    groupid,
                    requested: inputLang,
                    list: i18n.getLanguages().join(', ')
                });
                
                // If the key is returned (translation not found), try direct translation
                if (rply.text === 'language.notSupported') {
                    try {
                        const directTranslation = await i18n.directTranslate('language.notSupported', currentLang);
                        if (directTranslation) {
                            // Replace placeholders manually
                            rply.text = directTranslation
                                .replace('{{requested}}', inputLang)
                                .replace('{{list}}', i18n.getLanguages().join(', '));
                        }
                    } catch (err) {
                        console.error('[ERROR] Direct translation failed:', err);
                    }
                }
            }
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

                // Try normal translation first
                rply.text = i18n.translate('language.changed', {
                    userid,
                    groupid,
                    language: normalizedLang, // Use new language for message
                    from: currentLang,
                    to: normalizedLang
                });
                
                // If the key is returned (translation not found), try direct translation
                if (rply.text === 'language.changed') {
                    try {
                        const directTranslation = await i18n.directTranslate('language.changed', normalizedLang);
                        if (directTranslation) {
                            // Replace placeholders manually
                            rply.text = directTranslation
                                .replace('{{from}}', currentLang)
                                .replace('{{to}}', normalizedLang);
                        }
                    } catch (err) {
                        console.error('[ERROR] Direct translation failed:', err);
                    }
                }
            } else {
                rply.text = i18n.translate('language.notSupported', {
                    userid,
                    groupid,
                    requested: inputLang,
                    list: i18n.getLanguages().join(', ')
                });
                
                // If the key is returned (translation not found), try direct translation
                if (rply.text === 'language.notSupported') {
                    try {
                        const directTranslation = await i18n.directTranslate('language.notSupported', currentLang);
                        if (directTranslation) {
                            // Replace placeholders manually
                            rply.text = directTranslation
                                .replace('{{requested}}', inputLang)
                                .replace('{{list}}', i18n.getLanguages().join(', '));
                        }
                    } catch (err) {
                        console.error('[ERROR] Direct translation failed:', err);
                    }
                }
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

            // Try normal translation first
            rply.text = i18n.translate('language.changed', {
                userid,
                groupid,
                language: normalizedLang, // Use new language for message
                from: currentLang,
                to: normalizedLang
            });
            
            // If the key is returned (translation not found), try direct translation
            if (rply.text === 'language.changed') {
                try {
                    const directTranslation = await i18n.directTranslate('language.changed', normalizedLang);
                    if (directTranslation) {
                        // Replace placeholders manually
                        rply.text = directTranslation
                            .replace('{{from}}', currentLang)
                            .replace('{{to}}', normalizedLang);
                    }
                } catch (err) {
                    console.error('[ERROR] Direct translation failed:', err);
                }
            }
        } else {
            rply.text = i18n.translate('language.notSupported', {
                userid,
                groupid,
                requested: inputLang,
                list: i18n.getLanguages().join(', ')
            });
            
            // If the key is returned (translation not found), try direct translation
            if (rply.text === 'language.notSupported') {
                try {
                    const directTranslation = await i18n.directTranslate('language.notSupported', currentLang);
                    if (directTranslation) {
                        // Replace placeholders manually
                        rply.text = directTranslation
                            .replace('{{requested}}', inputLang)
                            .replace('{{list}}', i18n.getLanguages().join(', '));
                    }
                } catch (err) {
                    console.error('[ERROR] Direct translation failed:', err);
                }
            }
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
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('group')
                .setDescription('Set language for the entire group (admin only)')
                .addStringOption(option =>
                    option.setName('language')
                        .setDescription('Language code (e.g., en, zh-TW)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'English', value: 'en' },
                            { name: '繁體中文', value: 'zh-TW' },
                            { name: '简体中文', value: 'zh-CN' },
                            { name: '日本語', value: 'ja' },
                            { name: '한국어', value: 'ko' },
                        ))),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand(false);
            const userid = interaction.user.id;
            
            // Handle group language setting (admin only)
            if (subcommand === 'group') {
                const langOption = interaction.options.getString('language');
                const guildId = interaction.guildId;
                
                // Check if user has admin permissions
                const member = interaction.member;
                const hasAdminPermission = member && (
                    member.permissions.has('ADMINISTRATOR') || 
                    member.permissions.has('MANAGE_GUILD')
                );
                
                if (!hasAdminPermission) {
                    await interaction.reply({
                        content: i18n.translate('language.adminOnly', { userid }),
                        ephemeral: true
                    });
                    return;
                }
                
                if (!guildId) {
                    await interaction.reply({
                        content: i18n.translate('language.needGroup', { userid }),
                        ephemeral: true
                    });
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
                
                // Get current group language
                const records = require('../modules/records');
                const currentGroupLang = await records.getGroupLanguage(guildId);
                
                // Get properly cased language code
                const normalizedLang = i18n.getNormalizedLanguage(langOption);
                
                // Update language
                await records.updateGroupLanguage(guildId, normalizedLang);
                
                // Clear the cache to ensure the new language is used immediately
                i18n.clearUserCache(null, guildId);
                
                // Respond with message in new language
                await interaction.reply({
                    content: i18n.translate('language.groupChanged', {
                        userid,
                        from: currentGroupLang || i18n.defaultLanguage,
                        to: normalizedLang
                    }),
                    ephemeral: true
                });
                return;
            }
            
            // Regular user language setting (existing code)
            const langOption = interaction.options.getString('language');

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