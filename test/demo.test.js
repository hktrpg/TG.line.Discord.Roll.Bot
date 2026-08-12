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
        expect(zh.text).toContain('rply');
        expect(zh.quotes).toBe(true);

        const en = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['Demo', 'help']
        }));
        expect(en.text).toMatch(/special syntax|rply/i);
    });

    test('hi uses loc plain string without locale/t params', async () => {
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
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.8);
        try {
            const pass = await runWithLocale('en', () => demo.rollDiceCommand({
                mainMsg: ['.demo', 'check', '50']
            }));
            expect(pass.text).toBe('81 > 50 = Success');
        } finally {
            spy.mockRestore();
        }
    });

    test('getT() with no args works under ALS', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'gett']
        }));
        expect(result.text).toContain('getT()');
    });
});

describe('demo bot-specific syntax', () => {
    beforeAll(async () => {
        await i18n.init();
    });

    test('quotes sets rply.quotes', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'quotes']
        }));
        expect(result.quotes).toBe(true);
        expect(result.text).toMatch(/quotes/i);
    });

    test('buttons sets buttonCreate commands', async () => {
        const result = await runWithLocale('zh-tw', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'buttons']
        }));
        expect(result.buttonCreate).toEqual(expect.arrayContaining(['.demo hi', '1d100']));
        expect(result.quotes).toBe(true);
    });

    test('re sets requestRolling options', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 're']
        }));
        expect(result.requestRolling).toEqual(expect.arrayContaining(['1d100 哈哈', '簽到']));
    });

    test('chbutton sets requestRollingCharacter payload', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'chbutton']
        }));
        expect(result.requestRollingCharacter[0]).toContain('.ch 鬥毆');
        expect(result.requestRollingCharacter[1]).toBe('DemoPC');
        expect(result.requestRollingCharacter[2]).toBe('ch');
    });

    test('inline expands [[NdM]]', async () => {
        const diceSpy = jest.spyOn(require('../roll/rollbase.js'), 'Dice').mockReturnValue(4);
        try {
            const result = await runWithLocale('en', () => demo.rollDiceCommand({
                mainMsg: ['.demo', 'inline', 'hit', '[[1d6]]', 'and', '[[2d3]]']
            }));
            expect(result.text).toContain('hit 4 and 8');
        } finally {
            diceSpy.mockRestore();
        }
    });

    test('var expands {San} style placeholders', async () => {
        const result = await runWithLocale('zh-tw', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'var', '.sc', '{San}']
        }));
        expect(result.text).toContain('.sc 80');
    });

    test('ch sets characterReRoll nest fields', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'ch']
        }));
        expect(result.characterReRoll).toBe(true);
        expect(result.characterReRollItem).toBe('1d100');
        expect(result.characterName).toBe('DemoPC');
    });

    test('levelup sets LevelUp append text', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'levelup'],
            displayname: 'Ada'
        }));
        expect(result.LevelUp).toContain('Ada');
        expect(result.LevelUp).toContain('Lv5');
    });

    test('cmd nests re-parse via rply.cmd', async () => {
        const result = await runWithLocale('en', () => demo.rollDiceCommand({
            mainMsg: ['.demo', 'cmd', '2d6']
        }));
        expect(result.cmd).toBe(true);
        expect(result.text).toBe('2d6');
    });

    test('dark / schedule / tokens / angle are documented replies', async () => {
        for (const command of ['dark', 'schedule', 'tokens', 'angle']) {
            const result = await runWithLocale('zh-tw', () => demo.rollDiceCommand({
                mainMsg: ['.demo', command]
            }));
            expect(result.text.length).toBeGreaterThan(20);
            expect(result.quotes).toBe(true);
        }
    });

    test('expand helpers are exported for unit use', () => {
        expect(demo.expandSimpleInline('x[[1d1]]y').length).toBeGreaterThan(2);
        expect(demo.expandDemoVars('{HP}+1', { HP: 10 })).toBe('10+1');
    });
});
