# Internationalization (i18n) Guide for Developers

This guide explains how to use the i18n system in the HKTRPG Bot for developers.

## Basic Usage

### 1. Import the i18n module

```javascript
const i18n = require('../modules/i18n');
```

### 2. Simple Translation

```javascript
// Gets translation in default language (English)
const text = i18n.translate('CoC7.title');
```

### 3. Translation with Variables

```javascript
const text = i18n.translate('dice.stats.total', {
  value: 25
});
// Returns "Total: 25"
```

### 4. User Language Preference

```javascript
// Get user's preferred language
const userLang = await i18n.getUserLanguage({ userid: "123456789" });

// Use that language for translation
const text = i18n.translate('system.welcome', {
  language: userLang
});
```

### 5. Pluralization

```javascript
// For count = 1: "1 item"
// For count = 5: "5 items"
const text = i18n.translatePlural('item.count', count, {
  language: userLang
});
```

### 6. Direct File Translation

For cases when i18next might fail, you can use direct file translation:

```javascript
// Synchronous direct translation
const text = i18n.directTranslateSync('key.path', 'en');

// Asynchronous version (for backward compatibility)
const text = await i18n.directTranslate('key.path', 'en');
```

## Language Management

### Get Available Languages

```javascript
const languages = i18n.getLanguages();
// Returns ['en', 'zh-TW', 'zh-CN', ...]
```

### Check if Language is Supported

```javascript
const isSupported = i18n.isSupported('en');
// Returns true
```

### Get Normalized Language Code

```javascript
const normalized = i18n.getNormalizedLanguage('zh-tw');
// Returns 'zh-TW' with correct case
```

### Clear Language Cache

```javascript
// Clear specific user cache
i18n.clearUserCache(userid);

// Clear specific group cache
i18n.clearUserCache(null, groupid);

// Clear all caches
i18n.clearUserCache();
```

## Integration with Command Modules

### Example with Command Module

```javascript
const i18n = require('../modules/i18n');

const gameName = function () {
    return i18n.translate('myCommand.name');
}

const getHelpMessage = function () {
    return i18n.translate('myCommand.help');
}

const rollDiceCommand = async function ({ inputStr, mainMsg, userid, groupid, displayname }) {
    // Get user's preferred language
    const userLang = await i18n.getUserLanguage({ userid, groupid });
    
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    
    // Use translations for responses
    rply.text = i18n.translate('myCommand.response', {
        language: userLang,
        user: displayname,
        value: mainMsg[1]
    });
    
    return rply;
}
```

## Discord Slash Command Localization

Discord supports command localization, allowing command names, descriptions, and options to appear in the user's preferred Discord language. Here's how to implement it:

### 1. Add Translation Keys in JSON Files

First, add slash command localization keys to all language files:

**locales/en.json:**
```json
{
  "command.slash.name": "mycommand",
  "command.slash.description": "This is my command",
  "command.slash.option.parameter": "parameter",
  "command.slash.option.parameter.description": "The parameter for the command"
}
```

**locales/zh-TW.json:**
```json
{
  "command.slash.name": "我的指令",
  "command.slash.description": "這是我的指令",
  "command.slash.option.parameter": "參數",
  "command.slash.option.parameter.description": "指令的參數"
}
```

### 2. Implement Localized Slash Commands

Use the following pattern to create localized slash commands:

```javascript
const discordCommand = [{
    data: (() => {
        // Helper function to get localizations for each language
        const getLocalizationMap = (key) => {
            // Discord's supported locales - map our language codes to Discord's
            const discordLocaleMap = {
                'en': 'en-US',    // English (US)
                'zh-TW': 'zh-TW', // Chinese (Taiwan)
                'zh-CN': 'zh-CN'  // Chinese (China)
                // Add more mappings as needed
            };
            
            const localizationMap = {};
            i18n.getLanguages().forEach(lang => {
                try {
                    // Skip languages we don't have a Discord mapping for
                    if (!discordLocaleMap[lang]) return;
                    
                    // Get translation for this language
                    const translation = i18n.directTranslateSync(key, lang);
                    if (translation && translation !== key) {
                        // Use Discord's locale code
                        localizationMap[discordLocaleMap[lang]] = translation;
                    }
                } catch (err) {
                    console.error(`Failed to get localization for ${key} in ${lang}:`, err);
                }
            });
            return localizationMap;
        };
        
        // Build the slash command with localizations
        const command = new SlashCommandBuilder()
            .setName(i18n.directTranslateSync('command.slash.name', 'en') || 'defaultname')
            .setDescription(i18n.directTranslateSync('command.slash.description', 'en') || 'Default description')
            .setNameLocalizations(getLocalizationMap('command.slash.name'))
            .setDescriptionLocalizations(getLocalizationMap('command.slash.description'));
        
        // Add options with localizations
        command.addStringOption(option => {
            option.setName(i18n.directTranslateSync('command.slash.option.parameter', 'en') || 'parameter')
                .setDescription(i18n.directTranslateSync('command.slash.option.parameter.description', 'en'))
                .setNameLocalizations(getLocalizationMap('command.slash.option.parameter'))
                .setDescriptionLocalizations(getLocalizationMap('command.slash.option.parameter.description'));
            return option;
        });
        
        return command;
    })(),
    
    async execute(interaction) {
        const userid = interaction.user.id;
        const groupid = interaction.guildId;
        
        // Get user's preferred language
        const userLang = await i18n.getUserLanguage({ userid, groupid });
        
        // Respond in user's language
        const response = i18n.translate('command.response', {
            language: userLang,
            user: interaction.user.displayName
        });
        
        await interaction.reply({ content: response, ephemeral: true });
    }
}];
```

### 3. Subcommand Localization

For commands with subcommands, follow this pattern:

```javascript
// Add a subcommand with localizations
command.addSubcommand(subcommand => {
    subcommand
        .setName(i18n.directTranslateSync('command.slash.subcommand.name', 'en') || 'subcommand')
        .setDescription(i18n.directTranslateSync('command.slash.subcommand.description', 'en'))
        .setNameLocalizations(getLocalizationMap('command.slash.subcommand.name'))
        .setDescriptionLocalizations(getLocalizationMap('command.slash.subcommand.description'));
    return subcommand;
});
```

## Important Notes About Discord Slash Commands

1. **Cannot Mix Options and Subcommands**: In Discord API, you cannot have both direct options and subcommands on the same command. Choose one or the other.

2. **Discord Locale Mapping**: Discord uses specific locale codes like 'en-US' rather than just 'en'. Map your language codes to Discord's supported locales.

3. **Discord's Supported Locales**: Discord only supports certain locales. Check the Discord API documentation for the full list.

## Translation Files Structure

Translation files are located in the `locales` directory, with one file per language:

- `locales/en.json` - English
- `locales/zh-TW.json` - Traditional Chinese
- `locales/zh-CN.json` - Simplified Chinese

Key structure follows dot notation:

```json
{
  "category.subcategory.key": "Translated text"
}
```

## Key Naming Conventions

For consistent organization, follow these conventions:

1. **Commands & Modules**:
   ```
   commandName.name         // Command name
   commandName.help         // Help text for the command
   commandName.response     // Response messages
   ```

2. **Slash Commands**:
   ```
   commandName.slash.name                    // Command name
   commandName.slash.description             // Command description
   commandName.slash.option.paramName        // Option name
   commandName.slash.option.paramName.description  // Option description
   commandName.slash.subcommand.name         // Subcommand name
   commandName.slash.subcommand.description  // Subcommand description
   ```

3. **Other Common Categories**:
   ```
   system.*       // System messages
   error.*        // Error messages
   ui.*           // UI elements
   game.*         // Game-specific terminology
   ```

## Adding New Translations

When adding new translatable text:

1. Add keys and English text to `locales/en.json`
2. Add the same keys with translated text to all other language files
3. Use dot notation to organize keys logically

## Performance Considerations

- Translations are cached for better performance
- Each user's language preference is also cached
- Use `directTranslateSync` for slash command definitions to avoid async issues

## Best Practices

1. **Group related translations** under common prefixes
2. **Reuse translations** where possible instead of duplicating similar text
3. **Use variables** instead of concatenating strings
4. **Document special formatting** in comments if needed
5. **Test with different languages** to ensure your UI adapts well
6. **Include fallbacks** when using translations to handle missing keys

## Command Line Translation Testing

You can test a translation without changing your language:

```javascript
// Force a specific language
const text = i18n.translate('key.path', { language: 'zh-TW' });
console.log(text);
``` 