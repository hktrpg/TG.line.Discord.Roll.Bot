"use strict";

const path = require('node:path');
const fs = require('node:fs');
const i18n = require('../modules/i18n.js');

describe('i18n module', () => {
    beforeAll(async () => {
        await i18n.init();
    });

    describe('normalizeLocale', () => {
        test('defaults to zh-tw for empty input', () => {
            expect(i18n.normalizeLocale()).toBe('zh-tw');
            expect(i18n.normalizeLocale('')).toBe('zh-tw');
        });

        test('recognizes Traditional Chinese variants', () => {
            expect(i18n.normalizeLocale('zh-TW')).toBe('zh-tw');
            expect(i18n.normalizeLocale('zh-hant')).toBe('zh-tw');
        });

        test('recognizes English variants', () => {
            expect(i18n.normalizeLocale('en')).toBe('en');
            expect(i18n.normalizeLocale('en-US')).toBe('en');
            expect(i18n.normalizeLocale('en-GB')).toBe('en');
        });

        test('falls back unknown locales to zh-tw', () => {
            expect(i18n.normalizeLocale('ja')).toBe('zh-tw');
            expect(i18n.normalizeLocale('fr-FR')).toBe('zh-tw');
        });
    });

    describe('matchLocale', () => {
        test('returns null for unsupported locales', () => {
            expect(i18n.matchLocale('ja')).toBeNull();
            expect(i18n.matchLocale('')).toBeNull();
            expect(i18n.matchLocale()).toBeNull();
        });

        test('matches aliases and codes', () => {
            expect(i18n.matchLocale('zh-hant')).toBe('zh-tw');
            expect(i18n.matchLocale('en-US')).toBe('en');
        });
    });

    describe('formatLocaleList', () => {
        test('lists code and display name once per locale', () => {
            expect(i18n.formatLocaleList()).toBe('zh-tw 正體中文\nen English');
        });
    });

    describe('createTranslator', () => {
        test('returns zh-tw strings by default', () => {
            const t = i18n.createTranslator('zh-tw');
            expect(t('lang.usage')).toContain('.lang');
        });

        test('returns English strings for en locale', () => {
            const t = i18n.createTranslator('en');
            expect(t('lang.usage')).toContain('/lang');
        });

        test('loads funny overlay bundles for indexed content', () => {
            const t = i18n.createTranslator('en');
            expect(t('funny.joke_0')).toContain('fan');
            expect(t('funny.daily_answer_0')).toBe('Not necessarily');
        });

        test('falls back to zh-tw for missing keys', () => {
            const t = i18n.createTranslator('en');
            expect(t('welcome.i18n_guide.0')).toBeDefined();
        });
    });

    describe('getGlossaryTerm', () => {
        test('returns localized TRPG terms', () => {
            expect(i18n.getGlossaryTerm('initiative', 'en')).toBe('Initiative');
            expect(i18n.getGlossaryTerm('initiative', 'zh-tw')).toBe('先攻');
        });

        test('returns null for unknown terms', () => {
            expect(i18n.getGlossaryTerm('nonexistent')).toBeNull();
        });
    });

    describe('enrichSlashCommandLocalizations', () => {
        test('adds description localizations for known commands', () => {
            const commandData = {
                name: 'rr',
                description: 'Roll dice',
                options: [{
                    name: 'notation',
                    description: 'Dice notation',
                    type: 3
                }]
            };
            const enriched = i18n.enrichSlashCommandLocalizations(commandData);
            expect(enriched.description_localizations).toBeDefined();
            expect(enriched.description_localizations['en-US']).toBeTruthy();
            expect(enriched.options[0].description_localizations).toBeDefined();
        });
    });

    describe('zh-tw regression snapshots', () => {
        test('welcome message with i18n_guide stays within Discord embed limit', () => {
            const zhTw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lang', 'zh-tw.json'), 'utf8'));
            const welcome = [
                ...zhTw.welcome.join_message,
                ...zhTw.welcome.i18n_guide
            ].join('\n');
            expect(welcome.length).toBeLessThanOrEqual(4096);
        });

        test('core zh-tw strings match baseline', () => {
            const t = i18n.createTranslator('zh-tw');
            expect(t('common.errors.no_response_prefix', { prefix: '.cc ' })).toMatchSnapshot();
            expect(t('rollbase.errors.dice_count_limit', { below: 0, above: 100 })).toMatchSnapshot();
            expect(t('lang.current', { locale: 'zh-tw' })).toMatchSnapshot();
        });
    });
});

describe('lang JSON files', () => {
    test('lang files exist and parse', () => {
        const langDir = path.join(__dirname, '..', 'lang');
        expect(fs.existsSync(path.join(langDir, 'zh-tw.json'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'en.json'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'glossary.json'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'overlays', 'en'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'overlays', 'zh-tw'))).toBe(true);
    });
});
