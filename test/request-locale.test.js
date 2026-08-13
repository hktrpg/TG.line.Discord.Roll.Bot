'use strict';

const i18n = require('../modules/i18n/i18n.js');
const {
    runWithLocale,
    loc,
    getRequestLocale,
    getRequestTranslator
} = require('../modules/i18n/request-locale.js');
const rollI18n = require('../modules/i18n/roll-i18n.js');

describe('request-locale (ALS + loc)', () => {
    beforeAll(async () => {
        await i18n.init();
    });

    test('loc falls back to default locale outside runWithLocale', () => {
        expect(getRequestLocale()).toBeNull();
        expect(loc('lang.game_name')).toContain('語言');
    });

    test('loc uses request locale inside runWithLocale', async () => {
        await runWithLocale('en', async () => {
            expect(getRequestLocale()).toBe('en');
            expect(loc('lang.game_name')).toContain('Language');
            expect(loc('rollbase.bool_true')).toBe('Success');
            expect(loc('rollbase.bool_false')).toBe('Failure');
        });
        expect(getRequestLocale()).toBeNull();
    });

    test('concurrent runWithLocale calls keep separate locales', async () => {
        const [enName, zhName] = await Promise.all([
            runWithLocale('en', async () => {
                await new Promise((resolve) => setImmediate(resolve));
                return loc('lang.game_name');
            }),
            runWithLocale('zh-tw', async () => {
                await new Promise((resolve) => setImmediate(resolve));
                return loc('lang.game_name');
            })
        ]);
        expect(enName).toContain('Language');
        expect(zhName).toContain('語言');
    });

    test('getT / getLocale prefer ALS when params omit locale', async () => {
        await runWithLocale('en', async () => {
            expect(rollI18n.getLocale({})).toBe('en');
            expect(rollI18n.getT({})('lang.game_name')).toContain('Language');
            expect(typeof getRequestTranslator()).toBe('function');
        });
    });

    test('explicit params.locale still wins over ALS', async () => {
        await runWithLocale('en', async () => {
            expect(rollI18n.getLocale({ locale: 'zh-hans' })).toBe('zh-hans');
            expect(rollI18n.getT({ locale: 'zh-hans' })('rollbase.bool_true')).toBe('成功');
        });
    });

    test('roll-i18n re-exports loc', () => {
        expect(rollI18n.loc).toBe(loc);
        expect(typeof rollI18n.runWithLocale).toBe('function');
    });
});

describe('fate module with loc()', () => {
    const fate = require('../roll/fate.js');
    const rollbase = require('../roll/rollbase.js');

    beforeAll(async () => {
        await i18n.init();
    });

    test('rollDiceCommand uses request locale via loc()', async () => {
        const diceSpy = jest.spyOn(rollbase, 'Dice').mockReturnValue(3);
        try {
            const result = await runWithLocale('en', () => fate.rollDiceCommand({
                inputStr: '.4df',
                mainMsg: ['.4df']
            }));
            expect(result.text).toMatch(/^Fate /);
            expect(result.text).toContain('＋＋＋＋');
            expect(result.text).toContain('= 4');
        } finally {
            diceSpy.mockRestore();
        }
    });
});
