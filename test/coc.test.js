"use strict";

const coc = require('../roll/2-coc.js');
const rollbase = require('../roll/rollbase.js');

// Mock dependencies to avoid issues with schema.js and other modules
jest.mock('../modules/schema.js', () => ({
    developmentConductor: {
        findOne: jest.fn().mockResolvedValue(null),
        findOneAndUpdate: jest.fn().mockResolvedValue({ switch: true })
    },
    developmentRollingRecord: {
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ n: 0 }),
        countDocuments: jest.fn().mockResolvedValue(0)
    }
}));

jest.mock('../modules/check.js', () => ({
    permissionErrMsg: jest.fn().mockReturnValue(null),
    flag: {
        ChkChannel: 1,
        ChkChannelAdmin: 2
    }
}));

jest.mock('../modules/dbWatchdog.js', () => ({
    isDbOnline: jest.fn().mockReturnValue(true),
    dbErrOccurs: jest.fn()
}));

// Mock mathjs
jest.mock('mathjs', () => ({
    evaluate: jest.fn().mockReturnValue(5)
}));

// Mock rollbase functions to return predictable values for testing
jest.mock('../roll/rollbase.js', () => ({
    Dice: jest.fn(),
    BuildDiceCal: jest.fn(),
    DiceINT: jest.fn(),
    BuildRollDice: jest.fn().mockReturnValue('2d6')
}));

// Mock skill arrays for character creation
global.移動類 = [
    { name: "導航", skill: 10 },
    { name: "生存", skill: 10 },
    { name: "跳躍", skill: 20 }
];

global.隱密類 = [
    { name: "潛行", skill: 20 },
    { name: "追蹤", skill: 10 },
    { name: "喬裝", skill: 5 }
];

global.職業興趣 = [
    { name: "信譽", skill: 0 },
    { name: "職業技能1", skill: 15 },
    { name: "職業技能2", skill: 15 }
];

global.調查類 = [
    { name: "偵查", skill: 25 },
    { name: "聆聽", skill: 20 },
    { name: "圖書館使用", skill: 20 }
];

global.戰鬥類 = [
    { name: "鬥毆", skill: 25 },
    { name: "手槍", skill: 20 },
    { name: "步槍", skill: 25 }
];

global.醫療類 = [
    { name: "急救", skill: 30 },
    { name: "醫學", skill: 5 },
    { name: "心理學", skill: 10 }
];

global.語言類 = [
    { name: "英語", skill: 0 },
    { name: "中文", skill: 0 },
    { name: "日語", skill: 0 }
];

global.學問類 = [
    { name: "歷史", skill: 5 },
    { name: "神秘學", skill: 5 },
    { name: "科學", skill: 1 }
];

global.交際類 = [
    { name: "魅惑", skill: 15 },
    { name: "恐嚇", skill: 15 },
    { name: "取悅", skill: 15 }
];

describe('Call of Cthulhu Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock Math.random to return predictable values
        Math.random = jest.fn(() => 0.5);
        // Default mock implementation
        rollbase.Dice.mockImplementation(num => {
            if (num === 100) return 50; // Default d100 roll
            if (num === 10) return 5;   // Default d10 roll
            return 3;                   // Default for other dice
        });
        rollbase.BuildDiceCal.mockReturnValue('3d6*5 = 45');
    });

    test('Test gameName returns correct name', () => {
        const name = coc.gameName();
        expect(name).toBeTruthy();
        expect(name).toContain('克蘇魯神話');
        expect(name).toContain('cc');
        expect(name).toContain('ccb');
    });

    test('Test gameType returns correct type', () => {
        expect(coc.gameType()).toBe('Dice:CoC');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = coc.prefixs();
        expect(patterns).toHaveLength(2);
        expect(patterns[0].first.toString()).toContain('ccrt');
        expect(patterns[0].first.toString()).toContain('ccsu');
        expect(patterns[1].first.toString()).toContain('cc');
        expect(patterns[1].first.toString()).toContain('成長檢定');
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = coc.getHelpMessage();
        expect(helpText).toContain('克蘇魯神話RPG系統');
        expect(helpText).toContain('基本擲骰');
        expect(helpText).toContain('理智檢定');
        expect(helpText).toContain('成長相關');
    });

    test('Test rollDiceCommand with help', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', 'help']
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('克蘇魯神話RPG系統');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with ccrt (immediate insanity)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['ccrt']
        });
        expect(result.type).toBe('text');
        expect(result.text).toBeTruthy();
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with ccsu (summary insanity)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['ccsu']
        });
        expect(result.type).toBe('text');
        expect(result.text).toBeTruthy();
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with ccb (CoC6 roll)', async () => {
        // Mock a success roll
        rollbase.Dice.mockReturnValueOnce(40);

        const result = await coc.rollDiceCommand({
            mainMsg: ['ccb', '60', '偵查']
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('ccb<=60');
        expect(result.text).toContain('40');
        expect(result.text).toContain('成功');
        expect(result.text).toContain('偵查');
    });

    test('Test rollDiceCommand with ccb (CoC6 failure)', async () => {
        // Mock a failure roll
        rollbase.Dice.mockReturnValueOnce(70);

        const result = await coc.rollDiceCommand({
            mainMsg: ['ccb', '60']
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('失敗');
    });

    test('Test rollDiceCommand with cc (CoC7 regular success)', async () => {
        // Mock a regular success roll
        rollbase.Dice.mockReturnValueOnce(50);

        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('50');
        expect(result.text).toContain('通常成功');
        expect(result.text).toContain('偵查');
    });

    test('Test rollDiceCommand with cc (CoC7 hard success)', async () => {
        // Mock a hard success roll (≦ skill/2)
        rollbase.Dice.mockReturnValueOnce(30);

        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('30');
        expect(result.text).toContain('困難成功');
    });

    test('Test rollDiceCommand with cc (CoC7 extreme success)', async () => {
        // Mock an extreme success roll (≦ skill/5)
        rollbase.Dice.mockReturnValueOnce(10);

        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('10');
        expect(result.text).toContain('極限成功');
    });

    test('Test rollDiceCommand with cc (CoC7 critical success)', async () => {
        // Mock a critical success roll (1)
        rollbase.Dice.mockReturnValueOnce(1);

        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('1');
        expect(result.text).toContain('大成功');
    });

    test('Test rollDiceCommand with cc (CoC7 failure)', async () => {
        // Mock a failure roll
        rollbase.Dice.mockReturnValueOnce(80);

        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('80');
        expect(result.text).toContain('失敗');
    });

    test('Test rollDiceCommand with cc (CoC7 fumble)', async () => {
        // Mock a fumble roll
        rollbase.Dice.mockReturnValueOnce(100);

        const result = await coc.rollDiceCommand({
            mainMsg: ['cc', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('100');
        expect(result.text).toContain('大失敗');
    });

    test('Test rollDiceCommand with .sc (Sanity check)', async () => {
        // Mock SanCheck behavior
        rollbase.Dice.mockReturnValueOnce(50); // d100 roll
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['.sc', '50', '1d4/1d10'],
            botname: 'test'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('San Check');
        expect(result.text).toContain('50');
        expect(result.buttonCreate).toBeDefined();
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .dp (Development Phase)', async () => {
        // Setup successful roll for development
        rollbase.Dice.mockReturnValueOnce(99); // Roll higher than skill
        rollbase.Dice.mockReturnValueOnce(3);  // Roll for improvement

        const result = await coc.rollDiceCommand({
            mainMsg: ['.dp', '50', '偵查'],
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('成長或增強檢定');
        expect(result.text).toContain('偵查');
        expect(result.text).toContain('成功');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .chase', async () => {
        // Setup for chase generation
        rollbase.Dice.mockReturnValueOnce(3); // Number of rounds
        rollbase.Dice.mockReturnValueOnce(50); // Chase roll

        const result = await coc.rollDiceCommand({
            mainMsg: ['.chase'],
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('追逐戰產生器');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .cccc (Cult generator)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.cccc'],
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('Cult 產生器');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .cc7bg (Character background)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.cc7bg'],
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('背景描述生成器');
        expect(result.quotes).toBe(true);
    });

    test('Test Discord commands are properly defined', () => {
        expect(coc.discordCommand).toBeDefined();
        expect(Array.isArray(coc.discordCommand)).toBe(true);
        expect(coc.discordCommand.length).toBeGreaterThan(0);
        
        // Test a few specific commands
        const ccrtCommand = coc.discordCommand.find(cmd => cmd.data && cmd.data.name === 'ccrt');
        expect(ccrtCommand).toBeDefined();
        expect(ccrtCommand.data.description).toContain('即時型瘋狂');
        
        const ccCommand = coc.discordCommand.find(cmd => cmd.data && cmd.data.name === 'cc');
        expect(ccCommand).toBeDefined();
        expect(ccCommand.data.description).toContain('克蘇魯神話TRPG CoC 7th 擲骰');
    });

    // Test additional CoC functions
    test('Test rollDiceCommand with cc1 (bonus die)', async () => {
        rollbase.Dice.mockReturnValueOnce(50).mockReturnValueOnce(5);
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['cc1', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('偵查');
    });

    test('Test rollDiceCommand with ccn1 (penalty die)', async () => {
        rollbase.Dice.mockReturnValueOnce(50).mockReturnValueOnce(5);
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['ccn1', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('偵查');
    });

    test('Test rollDiceCommand with cc2 (two bonus dice)', async () => {
        rollbase.Dice.mockReturnValueOnce(50).mockReturnValueOnce(5).mockReturnValueOnce(3);
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['cc2', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('偵查');
    });

    test('Test rollDiceCommand with ccn2 (two penalty dice)', async () => {
        rollbase.Dice.mockReturnValueOnce(50).mockReturnValueOnce(5).mockReturnValueOnce(3);
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['ccn2', '70', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('1D100 ≦ 70');
        expect(result.text).toContain('偵查');
    });

    test('Test rollDiceCommand with .cc7build (character creation)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.cc7build']
        });
        expect(result.type).toBe('text');
        expect(result.text).toBeTruthy();
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .cc6build (CoC6 character creation)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.cc6build']
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('六版核心創角');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .ccpulpbuild (Pulp character creation)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.ccpulpbuild']
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('Pulp CoC');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .ccpc (Pulp character)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.ccpc']
        });
        expect(result.type).toBe('text');
        expect(result.text).toBeTruthy();
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .ccdr (development record)', async () => {
        const result = await coc.rollDiceCommand({
            mainMsg: ['.ccdr']
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('克蘇魯神話');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with 成長檢定', async () => {
        rollbase.Dice.mockReturnValueOnce(99); // Roll higher than skill for development
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['成長檢定', '50', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('成長或增強檢定');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with 幕間成長', async () => {
        rollbase.Dice.mockReturnValueOnce(99); // Roll higher than skill for development
        
        const result = await coc.rollDiceCommand({
            mainMsg: ['幕間成長', '50', '偵查'],
            userid: 'testuser',
            groupid: 'testgroup'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('成長或增強檢定');
        expect(result.quotes).toBe(true);
    });

    // Test initialize function
    test('Test initialize function', () => {
        const result = coc.initialize();
        expect(result).toBeDefined();
    });
}); 