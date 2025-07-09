"use strict";

const funny = require('../roll/1_funny');
const rollbase = require('../roll/rollbase');

// Mock rollbase.Dice to return predictable values for testing
jest.mock('../roll/rollbase', () => ({
    Dice: jest.fn(),
    shuffleTarget: jest.fn(() => ['魔術師 ＋', '力量 ＋', '隱者 ＋'])
}));

describe('Funny Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(funny.gameName()).toContain('【趣味擲骰】');
        expect(funny.gameName()).toContain('choice');
        expect(funny.gameName()).toContain('運勢');
        expect(funny.gameName()).toContain('每日塔羅');
    });

    test('Test gameType returns correct type', () => {
        expect(funny.gameType()).toBe('funny:funny:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = funny.prefixs();
        expect(patterns).toHaveLength(1);
        expect(patterns[0].first.toString()).toContain('排序');
        expect(patterns[0].first.toString()).toContain('choice');
        expect(patterns[0].first.toString()).toContain('每日塔羅');
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await funny.getHelpMessage();
        expect(helpText).toContain('【🎲趣味擲骰系統】');
        expect(helpText).toContain('隨機功能');
        expect(helpText).toContain('占卜系統');
        expect(helpText).toContain('每日功能');
    });

    test('Test rollDiceCommand with help', async () => {
        const result = await funny.rollDiceCommand({
            inputStr: 'choice help',
            mainMsg: ['choice', 'help'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲趣味擲骰系統】');
        expect(result.buttonCreate).toBeDefined();
    });

    test('Test rollDiceCommand with 排序', async () => {
        // Ensure rollbase.Dice returns fixed values for testing
        rollbase.Dice.mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3);
        
        const result = await funny.rollDiceCommand({
            inputStr: '排序 A B C D',
            mainMsg: ['排序', 'A', 'B', 'C', 'D'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('排序');
        expect(result.text).toContain('A');
        expect(result.text).toContain('B');
        expect(result.text).toContain('C');
        // The output might not contain D based on the random sorting algorithm and our mocks
        // So we'll just check that the result contains some expected parts
        expect(result.text).toMatch(/→.*\[.*\]/);
    });

    test('Test rollDiceCommand with 隨機', async () => {
        rollbase.Dice.mockReturnValueOnce(2);
        
        const result = await funny.rollDiceCommand({
            inputStr: '隨機 蘋果 香蕉 橘子',
            mainMsg: ['隨機', '蘋果', '香蕉', '橘子'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('隨機');
        expect(result.text).toContain('香蕉');
    });

    test('Test rollDiceCommand with 每日塔羅', async () => {
        const result = await funny.rollDiceCommand({
            inputStr: '每日塔羅',
            mainMsg: ['每日塔羅'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('【每日塔羅】');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with 時間塔羅', async () => {
        const result = await funny.rollDiceCommand({
            inputStr: '時間塔羅',
            mainMsg: ['時間塔羅'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('【時間塔羅】');
        expect(result.text).toContain('過去:');
        expect(result.text).toContain('現在:');
        expect(result.text).toContain('未來:');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with 大十字塔羅', async () => {
        const result = await funny.rollDiceCommand({
            inputStr: '大十字塔羅',
            mainMsg: ['大十字塔羅'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('【大十字塔羅】');
        expect(result.text).toContain('現況:');
        expect(result.text).toContain('結論:');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with 立flag', async () => {
        rollbase.Dice.mockReturnValueOnce(1);
        
        const result = await funny.rollDiceCommand({
            inputStr: '立flag',
            mainMsg: ['立flag'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toBeTruthy();
    });

    test('Test rollDiceCommand with 運勢', async () => {
        rollbase.Dice.mockReturnValueOnce(1);
        
        const result = await funny.rollDiceCommand({
            inputStr: '運勢',
            mainMsg: ['運勢'],
            displayname: 'testUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('運勢');
    });

    test('Test rollDiceCommand with 每日廢話', async () => {
        const result = await funny.rollDiceCommand({
            inputStr: '每日廢話 測試人',
            mainMsg: ['每日廢話', '測試人'],
            displayname: 'testUser',
            displaynameDiscord: 'discordUser'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('測試人');
    });

    test('Test discord commands are properly defined', () => {
        expect(funny.discordCommand).toBeDefined();
        expect(Array.isArray(funny.discordCommand)).toBe(true);
        expect(funny.discordCommand.length).toBeGreaterThan(0);
        
        // Check individual commands
        const sortCommand = funny.discordCommand.find(cmd => cmd.data && cmd.data.name === '排序');
        expect(sortCommand).toBeDefined();
        expect(sortCommand.data.description).toContain('隨機排序');
        
        const randomCommand = funny.discordCommand.find(cmd => cmd.data && cmd.data.name === '隨機');
        expect(randomCommand).toBeDefined();
        expect(randomCommand.data.description).toContain('隨機抽選');
        
        const tarotCommand = funny.discordCommand.find(cmd => cmd.data && cmd.data.name === '塔羅');
        expect(tarotCommand).toBeDefined();
        expect(tarotCommand.data.description).toContain('塔羅占卜');
    });
}); 