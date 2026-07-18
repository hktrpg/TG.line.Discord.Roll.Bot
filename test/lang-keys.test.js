"use strict";

const fs = require('node:fs');
const path = require('node:path');
const { loadLocaleBundle } = require('../modules/i18n-overlays.js');

function flattenKeys(object, prefix = '') {
    const keys = [];
    if (!object || typeof object !== 'object') {
        return keys;
    }
    for (const [key, value] of Object.entries(object)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            keys.push(...flattenKeys(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys.sort();
}

function loadLang(locale) {
    const filePath = path.join(__dirname, '..', 'lang', `${locale}.json`);
    const main = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return loadLocaleBundle(locale, main);
}

describe('lang key parity', () => {
    const zhTw = loadLang('zh-tw');
    const en = loadLang('en');
    const zhTwKeys = flattenKeys(zhTw);
    const enKeys = flattenKeys(en);

    test('zh-tw and en have identical key structure', () => {
        const onlyInZh = zhTwKeys.filter((key) => !enKeys.includes(key));
        const onlyInEn = enKeys.filter((key) => !zhTwKeys.includes(key));

        expect({
            onlyInZh,
            onlyInEn
        }).toEqual({
            onlyInZh: [],
            onlyInEn: []
        });
    });

    test('i18n_guide exists in both locales with language instructions', () => {
        expect(Array.isArray(zhTw.welcome.i18n_guide)).toBe(true);
        expect(Array.isArray(en.welcome.i18n_guide)).toBe(true);
        expect(zhTw.welcome.i18n_guide.length).toBeGreaterThan(0);
        expect(en.welcome.i18n_guide.length).toBeGreaterThan(0);
        expect(zhTw.welcome.i18n_guide.join('\n')).toMatch(/\.lang en/);
        expect(en.welcome.i18n_guide.join('\n')).toMatch(/\.lang en/);
        expect(en.welcome.join_message[0]).toMatch(/Thanks for adding/i);
    });

    test('glossary has terms for supported locales', () => {
        const glossaryPath = path.join(__dirname, '..', 'lang', 'glossary.json');
        const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
        for (const term of Object.values(glossary.terms || {})) {
            expect(term['zh-tw']).toBeTruthy();
            expect(term.en).toBeTruthy();
        }
    });

    test('overlay files have identical key structure', () => {
        const overlayRoot = path.join(__dirname, '..', 'lang', 'overlays');
        const zhFiles = fs.readdirSync(path.join(overlayRoot, 'zh-tw')).filter((file) => file.endsWith('.json')).sort();
        const enFiles = fs.readdirSync(path.join(overlayRoot, 'en')).filter((file) => file.endsWith('.json')).sort();
        expect(enFiles).toEqual(zhFiles);

        for (const fileName of zhFiles) {
            const zhKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(overlayRoot, 'zh-tw', fileName), 'utf8'))).sort();
            const enKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(overlayRoot, 'en', fileName), 'utf8'))).sort();
            expect({ fileName, zhKeys, enKeys }).toEqual({ fileName, zhKeys, enKeys: zhKeys });
        }
    });

    test('no literal backslash-n escape sequences in loaded strings', () => {
        const { loadLocaleBundle } = require('../modules/i18n-overlays.js');
        const bad = [];
        for (const locale of ['zh-tw', 'en']) {
            const main = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lang', `${locale}.json`), 'utf8'));
            const bundle = loadLocaleBundle(locale, main);
            const walk = (object, prefix = '') => {
                for (const [key, value] of Object.entries(object)) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        walk(value, fullKey);
                    } else if (String(value).includes('\\n') && !String(value).includes('\n')) {
                        bad.push(fullKey);
                    }
                }
            };
            walk(bundle);
        }
        expect(bad).toEqual([]);
    });
});
