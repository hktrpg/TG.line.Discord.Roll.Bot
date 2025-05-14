"use strict";
const i18n = require('../modules/i18n');
const records = require('../modules/records');
const { SlashCommandBuilder } = require('discord.js');

const gameName = function () {
    // This is called from the system without user context
    // en: Language Settings
    // zh-TW: 語言設定
    return i18n.translate('language.name');
}

const gameType = function () {
    return 'admin:language'
}

const prefixs = function () {
    return [{
        first: /^\.(language)$/i,
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

            // Use the translation system with the user's context
            return i18n.translate('language.help', {
                userid: this.userid,
                groupid: this.groupid
            });
        }
    } catch (error) {
        console.error('[ERROR] Error in getHelpMessage:', error);
    }

    // If there's no user context, use the default language
    return i18n.translate('language.help');
}

const initialize = function () {
    return {};
}

// Handler for help command
const handleHelpCommand = async function ({ userid, groupid, currentLang }) {
    console.log(`[DEBUG] Showing help in language: ${currentLang}`);

    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

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

// Handler for list command - Show supported languages and current settings
const handleListCommand = async function ({ userid, groupid, currentLang }) {
    const langs = i18n.getLanguages();

    // Get the user's language setting
    const userLang = await i18n.getUserLanguage({ userid, groupid });

    // Get the group's language setting if in a group
    let groupLang = null;
    if (groupid) {
        groupLang = await records.getGroupLanguage(groupid);
    }

    return {
        default: 'on',
        type: 'text',
        text: i18n.translate('language.listSettings', {
            userid,
            groupid,
            language: currentLang,
            supportedList: langs.join(', '),
            userLanguage: userLang,
            groupLanguage: groupLang || i18n.translate('language.notSet', { language: currentLang })
        })
    };
}

// Handler for setting group language command
const handleSetGroupCommand = async function ({ mainMsg, userid, groupid, userrole, currentLang }) {
    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    // Check if user has admin/manager role
    const isAdmin = (userrole === 3);

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

// Handler for setting user language using the set command
const handleSetCommand = async function ({ mainMsg, userid, groupid, currentLang }) {
    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

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

// Handler for setting user language directly
const handleDirectLanguageCommand = async function ({ mainMsg, userid, groupid, currentLang }) {
    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

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

        // Check if we have any command at all
        if (!mainMsg[1] || mainMsg[1] === '') {
            console.log('[DEBUG] No command provided, showing help');
            return await handleHelpCommand({ userid, groupid, currentLang });
        }

        // Get the command and convert to lowercase
        const command = mainMsg[1].toLowerCase();
        console.log('[DEBUG] Command parsed:', command, 'Arguments:', mainMsg.slice(2));

        // Direct command matching instead of switch/case
        if (command === 'help') {
            console.log('[DEBUG] Executing help command');
            return await handleHelpCommand({ userid, groupid, currentLang });
        }

        if (command === 'list') {
            console.log('[DEBUG] Executing list command');
            return await handleListCommand({ userid, groupid, currentLang });
        }

        if (command === 'setgroup' && mainMsg[2]) {
            console.log('[DEBUG] Executing setgroup command');
            return await handleSetGroupCommand({
                mainMsg,
                userid,
                groupid,
                userrole,
                currentLang
            });
        }

        if (command === 'set' && mainMsg[2]) {
            console.log('[DEBUG] Executing set command with language:', mainMsg[2]);
            return await handleSetCommand({
                mainMsg,
                userid,
                groupid,
                currentLang
            });
        }

        if (command === 'group' && mainMsg[2]) {
            console.log('[DEBUG] Executing group command (backward compatibility)');
            return await handleSetGroupCommand({
                mainMsg,
                userid,
                groupid,
                userrole,
                currentLang
            });
        }

        // If command is a valid language code, set it directly
        if (i18n.isSupported(command)) {
            console.log('[DEBUG] Setting language directly to:', command);
            return await handleDirectLanguageCommand({
                mainMsg,
                userid,
                groupid,
                currentLang
            });
        }

        // If we get here, no command matched - show help
        console.log('[DEBUG] No command matched, showing help');
        return await handleHelpCommand({ userid, groupid, currentLang });
    } catch (error) {
        console.error('Error in language command:', error);
        rply.text = i18n.translate('system.error.command', { userid, groupid });
        return rply;
    }
}

const discordCommand = [{
    data: (() => {
        // Load localizations from i18n
        const getLocalizationMap = (key) => {
            // Discord's supported locales - we only map the ones we have translations for
            const discordLocaleMap = {
                'en': 'en-US',    // English (US)
                'zh-TW': 'zh-TW', // Chinese (Taiwan)
                'zh-CN': 'zh-CN'  // Chinese (China)
                // Add more mappings as needed for other supported languages
                // 'ja': 'ja',    // Japanese
                // 'ko': 'ko',    // Korean
            };

            const localizationMap = {};
            i18n.getLanguages().forEach(lang => {
                try {
                    // Skip languages we don't have a Discord mapping for
                    if (!discordLocaleMap[lang]) {
                        console.log(`[DEBUG] Skipping locale ${lang} - no Discord mapping`);
                        return;
                    }

                    // Get the translated value for this key in each language
                    const translation = i18n.directTranslateSync(key, lang);
                    if (translation && translation !== key) {
                        // Use the Discord-specific locale code
                        const discordLocale = discordLocaleMap[lang];
                        localizationMap[discordLocale] = translation;
                        console.log(`[DEBUG] Added localization for ${key} in ${discordLocale}: ${translation}`);
                    }
                } catch (err) {
                    console.error(`[ERROR] Failed to get localization for ${key} in ${lang}:`, err);
                }
            });
            return localizationMap;
        };

        // Build the slash command with localizations
        const command = new SlashCommandBuilder()
            .setName(i18n.directTranslateSync('language.slash.name', 'en') || 'language')
            .setDescription(i18n.directTranslateSync('language.slash.description', 'en') || 'Set your preferred language')
            .setNameLocalizations(getLocalizationMap('language.slash.name'))
            .setDescriptionLocalizations(getLocalizationMap('language.slash.description'));

        // Add 'set' subcommand for setting user language
        command.addSubcommand(subcommand => {
            subcommand
                .setName('set')
                .setDescription('Set your preferred language')
                .setNameLocalizations(getLocalizationMap('language.slash.set.name'))
                .setDescriptionLocalizations(getLocalizationMap('language.slash.set.description'))
                .addStringOption(option => {
                    option.setName(i18n.directTranslateSync('language.slash.option.language', 'en') || 'language')
                        .setDescription(i18n.directTranslateSync('language.slash.option.language.description', 'en') || 'Language code (e.g., en, zh-TW)')
                        .setRequired(true)
                        .setNameLocalizations(getLocalizationMap('language.slash.option.language'))
                        .setDescriptionLocalizations(getLocalizationMap('language.slash.option.language.description'))
                        .addChoices(
                            { name: 'English', value: 'en' },
                            { name: '繁體中文', value: 'zh-TW' },
                            { name: '简体中文', value: 'zh-CN' },
                            { name: '日本語', value: 'ja' },
                            { name: '한국어', value: 'ko' },
                        );
                    return option;
                });
            return subcommand;
        });

        // Add setgroup subcommand with localizations
        command.addSubcommand(subcommand => {
            subcommand
                .setName(i18n.directTranslateSync('language.slash.setgroup.name', 'en') || 'setgroup')
                .setDescription(i18n.directTranslateSync('language.slash.setgroup.description', 'en') || 'Set language for the entire group (admin only)')
                .setNameLocalizations(getLocalizationMap('language.slash.setgroup.name'))
                .setDescriptionLocalizations(getLocalizationMap('language.slash.setgroup.description'))
                .addStringOption(option => {
                    option.setName(i18n.directTranslateSync('language.slash.option.language', 'en') || 'language')
                        .setDescription(i18n.directTranslateSync('language.slash.option.language.description', 'en') || 'Language code (e.g., en, zh-TW)')
                        .setRequired(true)
                        .setNameLocalizations(getLocalizationMap('language.slash.option.language'))
                        .setDescriptionLocalizations(getLocalizationMap('language.slash.option.language.description'))
                        .addChoices(
                            { name: 'English', value: 'en' },
                            { name: '繁體中文', value: 'zh-TW' },
                            { name: '简体中文', value: 'zh-CN' },
                            { name: '日本語', value: 'ja' },
                            { name: '한국어', value: 'ko' },
                        );
                    return option;
                });
            return subcommand;
        });

        // Add list subcommand with localizations
        command.addSubcommand(subcommand => {
            subcommand
                .setName(i18n.directTranslateSync('language.slash.list.name', 'en') || 'list')
                .setDescription(i18n.directTranslateSync('language.slash.list.description', 'en') || 'Show supported languages and current settings')
                .setNameLocalizations(getLocalizationMap('language.slash.list.name'))
                .setDescriptionLocalizations(getLocalizationMap('language.slash.list.description'));
            return subcommand;
        });

        return command;
    })(),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const userid = interaction.user.id;
            const groupid = interaction.guildId;

            // Handle group language setting (admin only)
            if (subcommand === 'setgroup') {
                const langOption = interaction.options.getString('language');

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

                if (!groupid) {
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
                const currentGroupLang = await records.getGroupLanguage(groupid);

                // Get properly cased language code
                const normalizedLang = i18n.getNormalizedLanguage(langOption);

                // Update language
                await records.updateGroupLanguage(groupid, normalizedLang);

                // Clear the cache to ensure the new language is used immediately
                i18n.clearUserCache(null, groupid);

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

            // List available languages and settings
            if (subcommand === 'list') {
                // Get the user's language setting
                const userLang = await i18n.getUserLanguage({ userid, groupid });

                // Get the group's language setting if in a group
                let groupLang = null;
                if (groupid) {
                    groupLang = await records.getGroupLanguage(groupid);
                }

                const listText = i18n.translate('language.listSettings', {
                    userid,
                    groupid,
                    supportedList: i18n.getLanguages().join(', '),
                    userLanguage: userLang,
                    groupLanguage: groupLang || i18n.translate('language.notSet', { language: userLang })
                });

                await interaction.reply({
                    content: listText,
                    ephemeral: true
                });
                return;
            }

            // Set user language (using the 'set' subcommand)
            if (subcommand === 'set') {
                const langOption = interaction.options.getString('language');

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
                return;
            }

            // If we got here, show help message
            const currentLang = await i18n.getUserLanguage({ userid });
            const helpText = i18n.translate('language.help', {
                userid,
                language: currentLang
            });

            await interaction.reply({
                content: helpText,
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