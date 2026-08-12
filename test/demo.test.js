'use strict';

const i18n = require('../modules/i18n/i18n.js');
const { runWithLocale } = require('../modules/i18n/request-locale.js');
const demo = require('../roll/demo.js');

describe('demo roll module (i18n styles)', () => {
    beforeAll(async () => {
        await i18n.init();
    });

    test('help via resolveHelp follows request locale', async () => {
        const zh = await runWithLocale('zh-tw', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'help']
        }));
        expect(zh.text).toContain('loc');
        expect(zh.quotes).toBe(true);

        const en = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['Demo', 'help']
        }));
        expect(en.text).toMatch(/i18n style demo|loc\('demo/i);
    });

    test('hi uses loc plain string', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'hi']
        }));
        expect(result.text).toContain("loc('demo.hi')");
    });

    test('greet interpolates name', async () => {
        const result = await runWithLocale('zh-tw', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'greet', '小明']
        }));
        expect(result.text).toContain('小明');
    });

    test('check uses ternary success/fail keys', async () => {
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.8); // → roll 81
        try {
            const pass = await runWithLocale('en', () => demo.rollDiceCommand({
                mainMsg: ['.demo', 'check', '50']
            }));
            expect(pass.text).toBe('81 > 50 = Success');

            const fail = await runWithLocale('zh-tw', () => demo.rollDiceCommand({
                mainMsg: ['.demo', 'check', '90']
            }));
            expect(fail.text).toBe('81 > 90 = 失敗');
        } finally {
            spy.mockRestore();
        }
    });

    test('ns helper shortens demo.* keys', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'ns']
        }));
        expect(result.text).toContain("ns('demo')");
        expect(typeof demo.ns).toBe('function');
        expect(demo.ns('demo')('hi')).toContain("loc('demo.hi')");
    });

    test('getT() with no args works under ALS', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'gett']
        }));
        expect(result.text).toContain('getT()');
        expect(result.text).not.toContain('locale, t');
    });

    test('locale reports request language without { locale, t }', async () => {
        const result = await runWithLocale('zh-hans', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'locale']
        }));
        expect(result.text).toContain('zh-hans');
    });

    test('rollDiceCommand does not require locale or t params', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'hi']
            // intentionally omit locale / t
        }));
        expect(result.text).toContain("loc('demo.hi')");
    });
});