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

describe('Call of Cthulhu Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
}); 