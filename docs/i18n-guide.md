# HKTRPG Internationalization (i18n) Guide

This guide explains how to use and extend the internationalization system in the HKTRPG bot.

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Using Translations](#using-translations)
   - [Basic Translation](#basic-translation)
   - [Language Resolution Priority](#language-resolution-priority)
     - [Detailed Priority Algorithm](#detailed-priority-algorithm)
     - [User Language Lookup Process](#user-language-lookup-process)
     - [Example Scenarios](#example-scenarios)
   - [User Context Translation Caching](#user-context-translation-caching)
   - [Direct File Translation](#direct-file-translation)
   - [Translation Fallback Mechanisms](#translation-fallback-mechanisms)
4. [Adding New Languages](#adding-new-languages)
5. [User/Group Language Settings](#usergroup-language-settings)
   - [Language Preferences Storage](#language-preferences-storage)
   - [Accessing Language Settings](#accessing-language-settings)
   - [Managing Caches](#managing-caches)
6. [Discord Slash Command Localization](#discord-slash-command-localization)
   - [Command Structure with Localizations](#command-structure-with-localizations)
   - [Discord Locale Code Requirements](#discord-locale-code-requirements)
   - [Implementing Subcommands with Localizations](#implementing-subcommands-with-localizations)
   - [Complete Example: Language Command Structure](#complete-example-language-command-structure)
   - [Handling Command Execution](#handling-command-execution)
   - [Permissions and Command Validation](#permissions-and-command-validation)
   - [Responding to Users in Their Preferred Language](#responding-to-users-in-their-preferred-language)
   - [Internationalized Messages When Changing Language](#internationalized-messages-when-changing-language)
7. [Advanced Translation Features](#advanced-translation-features)
   - [Pluralization](#pluralization)
   - [Interpolation](#interpolation)
8. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
9. [Troubleshooting](#troubleshooting)
   - [Missing Translations](#missing-translations)
   - [Cache Issues](#cache-issues)
   - [Debugging](#debugging)

## Introduction

The HKTRPG bot uses a custom internationalization system built on top of i18next. This allows the bot to support multiple languages, with each user or group able to set their preferred language.

Currently supported languages:
- English (en)
- Traditional Chinese (zh-TW)
- Simplified Chinese (zh-CN)

## Core Concepts

The i18n system is built around these key components:

1. **Translation Files**: JSON files in the `locales/` directory
2. **Translation Manager**: Singleton class that handles all translation operations
3. **Language Commands**: Commands for users to manage their language preferences
4. **Discord Integration**: Support for Discord's locale system

## Using Translations

### Basic Translation

```javascript
const i18n = require('../modules/i18n');

// Simple translation
const message = i18n.translate('system.welcome');

// Translation with variables
const greeting = i18n.translate('user.greeting', { 
    name: 'John',
    day: 'Monday'
});

// Translation with explicit language
const chineseMessage = i18n.translate('system.welcome', {
    language: 'zh-TW'
});

// Translation with user and group context
// This automatically uses the user's preferred language
const personalizedMessage = i18n.translate('system.greeting', {
    userid: '123456789',
    groupid: '987654321'
});
```

### Language Resolution Priority

The `translate()` method determines which language to use through the following priority system:

1. If the `language` parameter is explicitly provided, that language is used
2. If `userid` is provided, the system looks up the user's preferred language
3. If `groupid` is provided and no user language is found, the group's language is used
4. If none of the above resolve to a valid language, the default language (zh-TW) is used

#### Detailed Priority Algorithm

When you call `i18n.translate()` with user context parameters, this is what happens internally:

1. **Check for explicit language**:
   ```javascript
   if (language) {
       return this._translateWithLanguage(key, language, values);
   }
   ```

2. **Check for user language** (if userid is provided):
   - First checks the in-memory cache (`userLang:${userid}`)
   - If found in cache, uses that language immediately
   - If not in cache, defaults to system language for this request
   - In parallel, starts an async database lookup to update the cache for future requests:
     ```javascript
     this.getUserLanguage({ userid, groupid })
         .then(userLang => {
             translationCache.set(cacheKey, userLang, 3600); // 1 hour cache
         })
     ```

3. **Check for group language** (if no user language found):
   - Checks in-memory cache (`groupLang:${groupid}`)
   - If found in cache, uses that language
   - If not in cache, defaults to system language for this request
   - In parallel, starts an async database lookup to update the cache

4. **Last resort - default language**:
   - Falls back to `DEFAULT_LANGUAGE` (zh-TW)

#### User Language Lookup Process

When `getUserLanguage()` is called (either directly or through `translate()`):

1. Check cache for user language
2. If not in cache, query database through records module
3. If user has no language set, check for group language
4. If group has no language set, return default language

This multi-layered approach ensures:
- Fast response times using cached values when available
- Correct language preferences when users change settings
- Fallback to appropriate defaults when needed

#### Example Scenarios

**Scenario 1**: User with personal language setting
```javascript
// User has set English as their language
i18n.translate('greeting', { userid: '123456789' });
// Uses English for translation, regardless of group
```

**Scenario 2**: User without setting in a group with setting
```javascript
// User has no language setting, but group uses Chinese
i18n.translate('greeting', { userid: '123456789', groupid: '987654321' });
// Uses Chinese (group setting)
```

**Scenario 3**: Override with explicit language
```javascript
// Force Japanese regardless of user/group settings
i18n.translate('greeting', { 
    userid: '123456789',
    groupid: '987654321',
    language: 'ja'
});
// Uses Japanese (explicit override)
```

### User Context Translation Caching

The translation system uses a sophisticated caching mechanism to provide optimal performance even when dealing with user context:

#### Cache Types

1. **Translation Caches**: 
   - Full language files: `translations:${language}`
   - Individual translations: `t:${language}:${key}`

2. **User Preference Caches**:
   - User language settings: `userLang:${userid}`
   - Group language settings: `groupLang:${groupid}`

#### Performance Optimizations

When translating with user context, the system implements several optimizations:

1. **Non-blocking Language Lookup**:
   - If a user/group language isn't in cache, the system uses the default language immediately
   - It then initiates an asynchronous database lookup in the background
   - The result is cached for future requests
   - This prevents translation calls from being delayed by database queries

2. **Parallel Processing**:
   ```javascript
   // This returns immediately using cached or default language
   const text = i18n.translate('key', { userid, groupid });
   
   // Meanwhile, in the background:
   getUserLanguage({ userid, groupid })
       .then(userLang => { /* update cache */ })
       .catch(err => { /* handle error */ });
   ```

3. **Cache Invalidation Strategy**:
   - User/group caches expire after 1 hour (CACHE_TTL = 3600 seconds)
   - Caches are explicitly cleared when language settings are updated
   - Translation caches have similar TTL but can be force-reloaded

#### Memory Usage Considerations

The caching system is designed to balance performance and memory usage:

- Keys are stored in normalized form to reduce duplication
- User/group caches only store language codes, not translations
- Translation caches store both full language files and frequently used individual keys
- Cache entries expire automatically to prevent memory leaks

Understanding these caching mechanisms helps when implementing high-traffic applications where translation performance is critical.

### Direct File Translation

Sometimes you need to bypass the i18next system and access translations directly:

```javascript
// Synchronous direct translation
const directTranslation = i18n.directTranslateSync('key.path', 'en');

// Asynchronous version (for backward compatibility)
const translation = await i18n.directTranslate('key.path', 'zh-TW');
```

### Translation Fallback Mechanisms

The system uses several fallback mechanisms to ensure robust operation even when translations are missing:

1. **i18next Lookup**: First attempts to use i18next's standard lookup
2. **Direct File Access**: If i18next fails, tries direct file access to the JSON translation files
3. **Default Language Fallback**: If the translation is missing in the requested language, falls back to the default language
4. **Key Return**: If all fallbacks fail, returns the key itself

This multi-level fallback system ensures the application doesn't crash due to missing translations:

```javascript
// Even if 'my.missing.key' doesn't exist in any language file,
// this will return 'my.missing.key' instead of throwing an error
const text = i18n.translate('my.missing.key', { 
    userid: '123456789'
});
```

## Adding New Languages

1. Create a new JSON file in the `locales/` directory, e.g., `ja.json` for Japanese
2. Add all translation keys from an existing file (like `en.json`)
3. Update the supported languages in `modules/i18n.js`:

```javascript
// Add to LANGUAGES array
const LANGUAGES = ['en', 'zh-TW', 'zh-CN', 'ja'];

// Add to LANGUAGE_MAPPING for aliases
const LANGUAGE_MAPPING = {
  'zh': 'zh-TW',
  'zh-tw': 'zh-TW',
  'zh-cn': 'zh-CN',
  'ja': 'ja',
  'jp': 'ja'  // Common alias
};
```

## User/Group Language Settings

Users can set their language using the following commands:

- `.language set en` - Set personal language to English
- `.language setgroup zh-TW` - Set group language (admin only)
- `.language list` - Show supported languages and current settings

### Language Preferences Storage

User and group language preferences are stored in the database and cached for performance:

1. **Database Storage**: Language settings are persisted in the database through the records module
2. **Memory Caching**: Once retrieved, language settings are cached for 1 hour (CACHE_TTL = 3600 seconds)
3. **Automatic Updates**: When a user changes their language, the cache is automatically cleared

### Accessing Language Settings

In your code, you can access or modify these settings:

```javascript
// Get user's language (also checks group language as fallback)
const userLang = await i18n.getUserLanguage({ 
    userid: '123456789', 
    groupid: '987654321' 
});

// Get group language directly
const groupLang = await i18n.getGroupLanguage('987654321');

// Check if language is supported
if (i18n.isSupported('zh-CN')) {
    // Language is valid
}

// Get proper case/normalized version of language code
const normalizedLang = i18n.getNormalizedLanguage('zh-cn'); // Returns 'zh-CN'
```

### Managing Caches

When language settings change, you may need to clear the cache:

```javascript
// Clear specific user's language cache
i18n.clearUserCache(userid);

// Clear specific group's language cache
i18n.clearUserCache(null, groupid);

// Clear all user and group language caches
i18n.clearUserCache();

// Force reload all translation resources
await i18n.reloadResources(); // All languages
await i18n.reloadResources('en'); // Specific language
```

## Discord Slash Command Localization

Discord has its own localization system for slash commands. Here's how to support it:

### Command Structure with Localizations

The system provides a pattern for creating localized slash commands based on the implementation in `language.js`:

```javascript
const { SlashCommandBuilder } = require('discord.js');

// Function to get localizations for a key
const getLocalizationMap = (key) => {
    const discordLocaleMap = {
        'en': 'en-US',    // English (US)
        'zh-TW': 'zh-TW', // Chinese (Taiwan)
        'zh-CN': 'zh-CN'  // Chinese (China)
        // Add other language mappings as needed
    };
    
    const localizationMap = {};
    i18n.getLanguages().forEach(lang => {
        // Skip languages without a Discord mapping
        if (!discordLocaleMap[lang]) return;
        
        // Get translation for this key in each language
        const translation = i18n.directTranslateSync(key, lang);
        if (translation && translation !== key) {
            const discordLocale = discordLocaleMap[lang];
            localizationMap[discordLocale] = translation;
        }
    });
    return localizationMap;
};

// Create the slash command with localizations
const command = new SlashCommandBuilder()
    .setName(i18n.directTranslateSync('command.name', 'en') || 'fallback-name')
    .setDescription(i18n.directTranslateSync('command.description', 'en') || 'Description')
    .setNameLocalizations(getLocalizationMap('command.name'))
    .setDescriptionLocalizations(getLocalizationMap('command.description'));
```

### Discord Locale Code Requirements

Discord has specific requirements for locale codes used in localizations:

1. **Use Discord's Official Locale List**: Discord only accepts specific locale codes from their supported list. Examples:
   - `en-US` for English (US)
   - `zh-CN` for Chinese (Simplified)
   - `zh-TW` for Chinese (Traditional)

2. **Format Matters**: The format must exactly match Discord's enum values - case sensitivity matters:
   ```javascript
   // Correct
   'en-US': 'English translation'
   
   // Wrong - will be rejected by Discord API
   'en_US': 'English translation'
   'en': 'English translation'
   'EN-US': 'English translation'
   ```

3. **Mapping to Internal Codes**: You need to map your internal language codes (e.g., 'en', 'zh-TW') to Discord's locale codes (e.g., 'en-US', 'zh-TW'):
   ```javascript
   const discordLocaleMap = {
       'en': 'en-US',      // Map our 'en' to Discord's 'en-US'
       'zh-TW': 'zh-TW',   // These match exactly
       'zh-CN': 'zh-CN',   // These match exactly
       'ja': 'ja',         // For future language support
       'ko': 'ko'          // For future language support
   };
   ```

4. **Common Discord Locale Codes**:
   - `en-US` - English (US)
   - `en-GB` - English (UK)
   - `zh-CN` - Chinese (Simplified)
   - `zh-TW` - Chinese (Traditional)
   - `ja` - Japanese
   - `ko` - Korean
   - `fr` - French
   - `de` - German
   - `es-ES` - Spanish (Spain)

For a complete list, refer to the [Discord API documentation](https://discord.com/developers/docs/reference#locales).

### Implementing Subcommands with Localizations

For commands with subcommands, follow this pattern from `language.js`:

```javascript
// Add a subcommand with full localization
command.addSubcommand(subcommand => {
    subcommand
        .setName('subcommand-name')
        .setDescription('Subcommand description')
        .setNameLocalizations(getLocalizationMap('command.subcommand.name'))
        .setDescriptionLocalizations(getLocalizationMap('command.subcommand.description'))
        .addStringOption(option => {
            option.setName('option-name')
                .setDescription('Option description')
                .setRequired(true)
                .setNameLocalizations(getLocalizationMap('command.option.name'))
                .setDescriptionLocalizations(getLocalizationMap('command.option.description'))
                .addChoices(
                    { name: 'Choice 1', value: 'value1' },
                    { name: 'Choice 2', value: 'value2' }
                );
            return option;
        });
    return subcommand;
});
```

### Complete Example: Language Command Structure

Here's a comprehensive breakdown of how the `language` command is structured in `language.js`:

```javascript
const discordCommand = [{
    // Define the command using a self-executing function for organization
    data: (() => {
        // Helper function to get localizations for each language
        const getLocalizationMap = (key) => {
            const discordLocaleMap = {
                'en': 'en-US',
                'zh-TW': 'zh-TW',
                'zh-CN': 'zh-CN'
                // Additional mappings commented out but ready for future use
                // 'ja': 'ja',
                // 'ko': 'ko',
            };

            const localizationMap = {};
            i18n.getLanguages().forEach(lang => {
                // Skip languages without a Discord mapping
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
            });
            return localizationMap;
        };

        // Build the slash command with localizations
        const command = new SlashCommandBuilder()
            .setName(i18n.directTranslateSync('language.slash.name', 'en') || 'language')
            .setDescription(i18n.directTranslateSync('language.slash.description', 'en') || 'Set your preferred language')
            .setNameLocalizations(getLocalizationMap('language.slash.name'))
            .setDescriptionLocalizations(getLocalizationMap('language.slash.description'));

        // Add 'set' subcommand with localizations
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

        // Add 'setgroup' subcommand with localizations
        command.addSubcommand(subcommand => {
            subcommand
                .setName(i18n.directTranslateSync('language.slash.setgroup.name', 'en') || 'setgroup')
                .setDescription(i18n.directTranslateSync('language.slash.setgroup.description', 'en') || 'Set language for the entire group (admin only)')
                .setNameLocalizations(getLocalizationMap('language.slash.setgroup.name'))
                .setDescriptionLocalizations(getLocalizationMap('language.slash.setgroup.description'))
                .addStringOption(option => {
                    // Similar structure to the 'set' command's language option
                    // ...
                    return option;
                });
            return subcommand;
        });

        // Add 'list' subcommand with localizations (no options needed)
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
    
    // Execute method to handle the command when invoked
    async execute(interaction) {
        try {
            // Get user context from the interaction
            const subcommand = interaction.options.getSubcommand();
            const userid = interaction.user.id;
            const groupid = interaction.guildId;

            // Handle different subcommands with specific logic
            switch(subcommand) {
                case 'setgroup':
                    // Step 1: Get the language option value
                    const langOption = interaction.options.getString('language');

                    // Step 2: Validate permissions for admin-only commands
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

                    // Step 3: Validate group context exists
                    if (!groupid) {
                        await interaction.reply({
                            content: i18n.translate('language.needGroup', { userid }),
                            ephemeral: true
                        });
                        return;
                    }

                    // Step 4: Validate language is supported
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

                    // Step 5: Get current language for change message
                    const currentGroupLang = await records.getGroupLanguage(groupid);
                    const normalizedLang = i18n.getNormalizedLanguage(langOption);

                    // Step 6: Update database
                    await records.updateGroupLanguage(groupid, normalizedLang);

                    // Step 7: Clear cache
                    i18n.clearUserCache(null, groupid);

                    // Step 8: Send confirmation in the NEW language
                    await interaction.reply({
                        content: i18n.translate('language.groupChanged', {
                            userid,
                            from: currentGroupLang || i18n.defaultLanguage,
                            to: normalizedLang
                        }),
                        ephemeral: true
                    });
                    break;

                case 'list':
                    // Get the user's language setting
                    const userLang = await i18n.getUserLanguage({ userid, groupid });

                    // Get the group's language setting if in a group
                    let groupLang = null;
                    if (groupid) {
                        groupLang = await records.getGroupLanguage(groupid);
                    }

                    // Format the list message with all settings
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
                    break;

                case 'set':
                    // Similar implementation to setgroup but for user language
                    // ...
                    break;

                default:
                    // Handle unknown subcommand by showing help
                    const currentLang = await i18n.getUserLanguage({ userid });
                    const helpText = i18n.translate('language.help', {
                        userid,
                        language: currentLang
                    });

                    await interaction.reply({
                        content: helpText,
                        ephemeral: true
                    });
                    break;
            }
        } catch (error) {
            // Error handling with proper i18n
            console.error('Error in language slash command:', error);
            await interaction.reply({
                content: i18n.translate('system.error.command', { userid: interaction.user.id }),
                ephemeral: true
            });
        }
    }
}];
```

#### Translation Key Structure

Note how the translation keys are structured hierarchically:

- Base command: `language.slash.name`, `language.slash.description`
- Subcommands: `language.slash.set.name`, `language.slash.setgroup.name`, `language.slash.list.name`
- Options: `language.slash.option.language`, `language.slash.option.language.description`

This organization makes it easy to manage translations for each part of the command structure.

### Handling Command Execution

The `execute` method in the `language.js` implementation demonstrates how to handle different subcommands and respond with translations based on user context:

```javascript
async execute(interaction) {
    try {
        // Get user context from the interaction
        const subcommand = interaction.options.getSubcommand();
        const userid = interaction.user.id;
        const groupid = interaction.guildId;

        // Handle different subcommands with specific logic
        switch(subcommand) {
            case 'setgroup':
                // Step 1: Get the language option value
                const langOption = interaction.options.getString('language');

                // Step 2: Validate permissions for admin-only commands
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

                // Step 3: Validate group context exists
                if (!groupid) {
                    await interaction.reply({
                        content: i18n.translate('language.needGroup', { userid }),
                        ephemeral: true
                    });
                    return;
                }

                // Step 4: Validate language is supported
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

                // Step 5: Get current language for change message
                const currentGroupLang = await records.getGroupLanguage(groupid);
                const normalizedLang = i18n.getNormalizedLanguage(langOption);

                // Step 6: Update database
                await records.updateGroupLanguage(groupid, normalizedLang);

                // Step 7: Clear cache
                i18n.clearUserCache(null, groupid);

                // Step 8: Send confirmation in the NEW language
                await interaction.reply({
                    content: i18n.translate('language.groupChanged', {
                        userid,
                        from: currentGroupLang || i18n.defaultLanguage,
                        to: normalizedLang
                    }),
                    ephemeral: true
                });
                break;

            case 'list':
                // Get the user's language setting
                const userLang = await i18n.getUserLanguage({ userid, groupid });

                // Get the group's language setting if in a group
                let groupLang = null;
                if (groupid) {
                    groupLang = await records.getGroupLanguage(groupid);
                }

                // Format the list message with all settings
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
                break;

            case 'set':
                // Similar implementation to setgroup but for user language
                // ...
                break;

            default:
                // Handle unknown subcommand by showing help
                const currentLang = await i18n.getUserLanguage({ userid });
                const helpText = i18n.translate('language.help', {
                    userid,
                    language: currentLang
                });

                await interaction.reply({
                    content: helpText,
                    ephemeral: true
                });
                break;
        }
    } catch (error) {
        // Error handling with proper i18n
        console.error('Error in language slash command:', error);
        await interaction.reply({
            content: i18n.translate('system.error.command', { userid: interaction.user.id }),
            ephemeral: true
        });
    }
}
```

This implementation demonstrates several important patterns:

1. **Subcommand Selection**: Using `interaction.options.getSubcommand()` to determine which functionality to execute
2. **Permission Checking**: Validating admin permissions for restricted commands
3. **Input Validation**: Checking that user inputs (like language codes) are valid
4. **Context-Aware Responses**: Using the user's language preferences for responses
5. **Error Handling**: Catching and reporting errors with translated messages

### Permissions and Command Validation

For commands that require specific permissions (like the `setgroup` subcommand in `language.js`):

```javascript
// Check permissions for admin-only commands
const hasAdminPermission = interaction.member && (
    interaction.member.permissions.has('ADMINISTRATOR') ||
    interaction.member.permissions.has('MANAGE_GUILD')
);

if (!hasAdminPermission) {
    await interaction.reply({
        content: i18n.translate('command.adminOnly', { userid }),
        ephemeral: true
    });
    return;
}

// Continue with admin command...
```

### Responding to Users in Their Preferred Language

Always use the user's preferred language when responding:

```javascript
// Get the user's preferred language
const userLang = await i18n.getUserLanguage({ userid, groupid });

// Use it for translations in responses
const response = i18n.translate('command.response', {
    language: userLang,
    // Other variables
});

await interaction.reply({ content: response, ephemeral: true });
```

### Internationalized Messages When Changing Language

When a user changes their language, it's a good practice to use the new language for confirmation messages:

```javascript
// Get normalized language code
const normalizedLang = i18n.getNormalizedLanguage(langOption);

// Update language in database
await records.updateUserLanguage(userid, normalizedLang);

// Clear cache
i18n.clearUserCache(userid);

// Respond in the NEW language
await interaction.reply({
    content: i18n.translate('language.changed', {
        language: normalizedLang,  // Use new language for message
        from: currentLang,
        to: normalizedLang
    }),
    ephemeral: true
});
```

## Advanced Translation Features

### Pluralization

For plural forms, use the `translatePlural` method with the count parameter:

```javascript
// In JSON files:
// "item.count_one": "{{count}} item",
// "item.count_other": "{{count}} items"

// For count = 1: returns "1 item"
// For count = 5: returns "5 items"
const text = i18n.translatePlural('item.count', count, {
    language: userLang
});
```

### Interpolation

The translation system supports variable interpolation using the `{{variableName}}` syntax:

```javascript
// In JSON file:
// "greeting.withName": "Hello, {{name}}! Today is {{day}}."

const greeting = i18n.translate('greeting.withName', {
    name: 'Alice',
    day: 'Monday'
}); 
// Returns: "Hello, Alice! Today is Monday."
```

You can combine interpolation with user/group context:

```javascript
const result = i18n.translate('dice.roll.result', {
    userid: '123456789',
    groupid: '987654321',
    dice: '2d6',
    result: 7,
    critical: true
});
```

## Common Patterns and Best Practices

1. **Use Namespaced Keys**: Structure keys using dots, e.g., `command.roll.help`

2. **Handle Missing Translations**:
```javascript
const message = i18n.translate(key, options) || fallbackText;
```

3. **Structure Translation Files**:
   - Group related strings together
   - Use comments for context
   - Keep keys consistent across languages

4. **Avoid String Concatenation**: 
   - Bad: `i18n.translate('prefix') + variable + i18n.translate('suffix')`
   - Good: `i18n.translate('complete', { variable })`

5. **Testing New Languages**:
   - Use the direct translation methods to verify keys exist
   - Test with both UI methods and API calls

6. **User Context Best Practices**:
   - Always pass both `userid` and `groupid` when available:
     ```javascript
     i18n.translate('key', { userid, groupid, ...otherVariables });
     ```
   - Only specify language explicitly when you need to override user preferences:
     ```javascript
     // Forcing a specific language regardless of user setting
     i18n.translate('system.message', { language: 'en' });
     ```
   - For messages that must be consistent across users (like system notices), use explicit language:
     ```javascript
     // Show system messages in default language to all users
     i18n.translate('system.maintenance', { language: i18n.defaultLanguage });
     ```
   - In command handlers, get user language once at the beginning:
     ```javascript
     const userLang = await i18n.getUserLanguage({ userid, groupid });
     
     // Then use it for multiple translations
     const help = i18n.translate('command.help', { language: userLang });
     const response = i18n.translate('command.response', { language: userLang });
     ```

7. **Performance Considerations**:
   - Cache language settings after lookups when processing multiple translations
   - For batch operations affecting multiple users, consider using direct language instead of userid/groupid
   - Clear user/group caches immediately after language settings change
   - Be aware that initial translations with uncached user preferences may use default language

## Troubleshooting

### Missing Translations

If translations are not showing correctly:

1. Check that the key exists in the language file
2. Verify the language is in the supported languages list
3. Check that the language mapping includes any aliases
4. Try using direct translation methods as a fallback

### Cache Issues

The system uses caching for performance. If updates aren't showing:

```javascript
// Clear specific user/group cache
i18n.clearUserCache(userid, groupid);

// Force reload all resources
await i18n.reloadResources();
```

### Debugging

Enable debug mode to see detailed logging:

```
process.env.DEBUG = 'true';
```