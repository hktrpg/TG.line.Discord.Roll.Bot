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

### Example with Discord Slash Command

```javascript
const discordCommand = [{
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('My command description'),
    
    async execute(interaction) {
        const userLang = await i18n.getUserLanguage({ userid: interaction.user.id });
        
        const response = i18n.translate('myCommand.response', {
            language: userLang,
            user: interaction.user.displayName
        });
        
        await interaction.reply({ content: response });
    }
}];
```

## Translation Files Structure

Translation files are located in the `locales` directory, with one file per language:

- `locales/en.json` - English (default)
- `locales/zh-TW.json` - Traditional Chinese

Key structure follows dot notation:

```json
{
  "category.subcategory.key": "Translated text"
}
```

## Adding New Translations

When adding new translatable text:

1. Add keys and English text to `locales/en.json`
2. Add the same keys with translated text to all other language files
3. Use dot notation to organize keys logically

## Performance Considerations

- Translations are cached for better performance
- Each user's language preference is also cached
- The system lazy-loads languages as needed

## Tips for Efficient Internationalization

1. **Group related translations** under common prefixes
2. **Reuse translations** where possible instead of duplicating similar text
3. **Use variables** instead of concatenating strings
4. **Document special formatting** in comments if needed
5. **Test with different languages** to ensure your UI adapts well

## Translation Workflow

For adding new features:

1. Define all UI text in English first
2. Add keys and translations to `locales/en.json`
3. Add the same keys to other language files
4. Use `i18n.translate()` in your code
5. Test with different languages

## Command Line Translation Testing

You can test a translation without changing your language:

```javascript
// Force a specific language
const text = i18n.translate('key.path', { language: 'zh-TW' });
console.log(text);
``` 