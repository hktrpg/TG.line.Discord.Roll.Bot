# HKTRPG Internationalization (i18n) System

This directory contains the translation files for the HKTRPG bot. The bot uses i18next for internationalization, with each language having its own JSON file.

## Structure

- `en.json` - English translations
- `zh-TW.json` - Traditional Chinese translations
- `zh-CN.json` - Simplified Chinese translations (to be added)
- `ja.json` - Japanese translations (to be added)
- `ko.json` - Korean translations (to be added)

## Translation Format

Translations use dot notation keys (e.g., `CoC7.title`) and support interpolation with double curly braces (`{{variable}}`).

Example:
```json
{
  "system.name": "HKTRPG Bot",
  "demo.results.number": "Demo result: {{number}} from {{user}}"
}
```

## Adding a New Language

1. Create a new JSON file named with the language code (e.g., `zh-CN.json`)
2. Copy the contents of `en.json` as a template
3. Translate all values (right side of each key-value pair)
4. Make sure to maintain placeholders like `{{number}}` in translations

## Adding New Translations

When adding new text that needs translation:

1. Add the key and English text to `en.json`
2. Add the same key with translated text to each language file
3. In your code, use `i18n.translate('key.path')` to retrieve translations

## Key Structure Guidelines

- Use namespacing with dot notation (`category.subcategory.name`)
- Group related strings together (e.g., `CoC7.Skills.Accounting`)
- For game-specific terms, prefix with game code (e.g., `CoC7`, `DnD5`)
- For UI elements, use `ui.component.element.state` pattern

## Pluralization

For pluralization, use the `_one`, `_other` suffixes:

```json
{
  "item.count_one": "{{count}} item",
  "item.count_other": "{{count}} items"
}
```

Then use `i18n.translatePlural('item.count', count)` in your code.

## Language Selection

Users can change their language with the `lang` command:

```
lang list       - Show available languages
lang zh-TW      - Switch to Traditional Chinese
```

Or with the slash command:
```
/language language:繁體中文
``` 