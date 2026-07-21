'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadLocaleBundle } = require('../modules/i18n-overlays.js');

const LOCALE_CODES = Object.keys(require('../lang/locales.json'));

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
    const bundles = Object.fromEntries(LOCALE_CODES.map((code) => [code, loadLang(code)]));
    const keySets = Object.fromEntries(
        LOCALE_CODES.map((code) => [code, flattenKeys(bundles[code])])
    );
    const baseline = 'zh-tw';

    test('all locales include the zh-tw key set; zh-hans matches zh-tw exactly', () => {
        // en may have extra slash.*.name keys for Discord English name_localizations.
        for (const code of LOCALE_CODES) {
            if (code === baseline) continue;
            const onlyInBaseline = keySets[baseline].filter((key) => !keySets[code].includes(key));
            expect({ locale: code, onlyInBaseline }).toEqual({
                locale: code,
                onlyInBaseline: []
            });
        }

        const onlyInZhHans = keySets['zh-hans'].filter((key) => !keySets[baseline].includes(key));
        expect(onlyInZhHans).toEqual([]);
    });

    test('i18n_guide exists in all locales with language instructions', () => {
        for (const code of LOCALE_CODES) {
            const guide = bundles[code].welcome.i18n_guide;
            expect(Array.isArray(guide)).toBe(true);
            expect(guide.length).toBeGreaterThan(0);
            const text = guide.join('\n');
            expect(text).toMatch(/\.lang en/);
            expect(text).toMatch(/\.lang zh-hans/);
        }
        expect(bundles.en.welcome.join_message[0]).toMatch(/Thanks for adding/i);
    });

    test('overlay files have identical key structure across locales', () => {
        const overlayRoot = path.join(__dirname, '..', 'lang', 'overlays');
        const baselineFiles = fs.readdirSync(path.join(overlayRoot, baseline))
            .filter((file) => file.endsWith('.json'))
            .sort();

        for (const code of LOCALE_CODES) {
            if (code === baseline) continue;
            const files = fs.readdirSync(path.join(overlayRoot, code))
                .filter((file) => file.endsWith('.json'))
                .sort();
            expect({ locale: code, files }).toEqual({ locale: code, files: baselineFiles });
        }

        for (const fileName of baselineFiles) {
            const baselineKeys = Object.keys(
                JSON.parse(fs.readFileSync(path.join(overlayRoot, baseline, fileName), 'utf8'))
            ).sort();
            for (const code of LOCALE_CODES) {
                if (code === baseline) continue;
                const keys = Object.keys(
                    JSON.parse(fs.readFileSync(path.join(overlayRoot, code, fileName), 'utf8'))
                ).sort();
                expect({ fileName, locale: code, keys }).toEqual({
                    fileName,
                    locale: code,
                    keys: baselineKeys
                });
            }
        }
    });

    test('no literal backslash-n escape sequences in loaded strings', () => {
        const bad = [];
        for (const locale of LOCALE_CODES) {
            const main = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lang', `${locale}.json`), 'utf8'));
            const bundle = loadLocaleBundle(locale, main);
            const walk = (object, prefix = '') => {
                for (const [key, value] of Object.entries(object)) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        walk(value, fullKey);
                    } else if (String(value).includes('\\n') && !String(value).includes('\n')) {
                        bad.push(`${locale}:${fullKey}`);
                    }
                }
            };
            walk(bundle);
        }
        expect(bad).toEqual([]);
    });
});
