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

        test('recognizes Simplified Chinese variants', () => {
            expect(i18n.normalizeLocale('zh-hans')).toBe('zh-hans');
            expect(i18n.normalizeLocale('zh-cn')).toBe('zh-hans');
            expect(i18n.normalizeLocale('cn')).toBe('zh-hans');
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
            expect(i18n.matchLocale('zh-hans')).toBe('zh-hans');
            expect(i18n.matchLocale('zh-cn')).toBe('zh-hans');
            expect(i18n.matchLocale('cn')).toBe('zh-hans');
        });
    });

    describe('formatLocaleList', () => {
        test('lists code and display name once per locale', () => {
            expect(i18n.formatLocaleList()).toBe('zh-tw 正體中文\nen English\nzh-hans 简体中文');
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

        test('loads coc overlay bundles for indexed tables', () => {
            const t = i18n.createTranslator('en');
            expect(t('coc.mania_0')).toBeTruthy();
            expect(t('coc.phobia_0')).toBeTruthy();
            expect(t('coc.madness_rt_0')).toBeTruthy();
            expect(t('coc.cult_goal_0')).toBeTruthy();
        });

        test('falls back to zh-tw for missing keys', () => {
            const t = i18n.createTranslator('en');
            expect(t('welcome.i18n_guide.0')).toBeDefined();
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

        test('adds English name_localizations for Chinese funny commands', () => {
            const commandData = {
                name: '每日',
                description: '進行每日功能',
                options: [{
                    name: '黃曆',
                    description: '顯示今日黃曆',
                    type: 1
                }, {
                    name: '星座',
                    description: '顯示每日星座運程',
                    type: 1,
                    options: [{
                        name: 'star',
                        description: '哪個星座',
                        type: 3,
                        choices: [{ name: '白羊', value: '每日白羊' }]
                    }]
                }]
            };
            const enriched = i18n.enrichSlashCommandLocalizations(commandData);
            expect(enriched.name_localizations['en-US']).toBe('daily');
            expect(enriched.options[0].name_localizations['en-US']).toBe('almanac');
            expect(enriched.options[1].name_localizations['en-US']).toBe('horoscope');
            expect(enriched.options[1].options[0].choices[0].name_localizations['en-US']).toBe('Aries');
        });

        test('adds English name_localizations for top-level Chinese commands', () => {
            const cases = [
                ['排序', 'sort'],
                ['隨機', 'random'],
                ['輪盤', 'wheel'],
                ['運勢', 'fortune'],
                ['塔羅', 'tarot'],
                ['時間塔羅', 'time-tarot'],
                ['每日塔羅', 'daily-tarot'],
                ['大十字塔羅', 'celtic-cross'],
                ['立flag', 'flag']
            ];
            for (const [zhName, enName] of cases) {
                const enriched = i18n.enrichSlashCommandLocalizations({
                    name: zhName,
                    description: 'test'
                });
                expect(enriched.name_localizations?.['en-US']).toBe(enName);
            }
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
        expect(fs.existsSync(path.join(langDir, 'zh-hans.json'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'overlays', 'en'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'overlays', 'zh-tw'))).toBe(true);
        expect(fs.existsSync(path.join(langDir, 'overlays', 'zh-hans'))).toBe(true);
    });
});
