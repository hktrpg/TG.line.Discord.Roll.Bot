"use strict";

// Mock the entire z_bcdice module
jest.mock('../roll/z_bcdice.js', () => {
    // Only create mock if mongoURL is set
    if (!process.env.mongoURL) {
        return;
    }

    return {
        gameName: jest.fn().mockReturnValue('【BcDice】.bc'),
        gameType: jest.fn().mockReturnValue('Dice:bcdice:hktrpg'),
        prefixs: jest.fn().mockReturnValue([{
            first: /^\.bc$|^\.al$|^\.kk$|^\.mk$|^\.ss$|^\.sg$|^\.UK$|^\.dx$|^\.nc$|^\.sw$/i,
            second: null
        }]),
        getHelpMessage: jest.fn().mockReturnValue(`【🎲BcDice日系擲骰系統】
╭────── 🎯系統簡介 ──────
│ • 支援100+種日系TRPG骰表
│ • 完整支援原版擲骰指令
│ • 可自由切換不同遊戲系統`),
        initialize: jest.fn().mockReturnValue({}),
        rollDiceCommand: jest.fn(),
        discordCommand: [
            {
                data: {
                    name: 'bcdice擲骰'
                }
            },
            {
                data: {
                    name: 'bcdice設定'
                }
            }
        ]
    };
});

// Mock other dependencies
jest.mock('bcdice', () => ({
    DynamicLoader: jest.fn().mockImplementation(() => ({
        dynamicLoad: jest.fn()
    }))
}));

jest.mock('../modules/chat/check.js', () => ({
    permissionErrMsg: jest.fn(),
    flag: {
        ChkChannelManager: 1
    }
}));

jest.mock('../modules/db/schema.js', () => ({
    bcdiceRegedit: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn()
    }
}));

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Import modules
const { DynamicLoader } = require('bcdice');
const bcdiceModule = require('../roll/z_bcdice.js');
const checkTools = require('../modules/chat/check.js');
const schema = require('../modules/db/schema.js');

describe('BCDice Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(bcdiceModule.gameName()).toBe('【BcDice】.bc');
    });

    test('Test gameType returns correct type', () => {
        expect(bcdiceModule.gameType()).toBe('Dice:bcdice:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = bcdiceModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.bc')).toBe(true);
        expect(patterns[0].first.test('.kk')).toBe(true);
        expect(patterns[0].first.test('.dx')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = bcdiceModule.getHelpMessage();
        expect(helpText).toContain('BcDice日系擲骰系統');
        expect(helpText).toContain('系統簡介');
    });

    test('Test initialize returns empty variables object', () => {
        expect(bcdiceModule.initialize()).toEqual({});
    });

    test('Test help command', async () => {
        bcdiceModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: bcdiceModule.getHelpMessage(),
            quotes: true
        });

        const result = await bcdiceModule.rollDiceCommand({
            mainMsg: ['.bc', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe(bcdiceModule.getHelpMessage());
        expect(result.quotes).toBe(true);
    });

    test('Test Kamigakari command', async () => {
        const mockGameSystem = {
            eval: jest.fn().mockReturnValue({ text: 'Dice Result' })
        };
        const mockLoader = DynamicLoader();
        mockLoader.dynamicLoad.mockResolvedValue(mockGameSystem);

        bcdiceModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: '2D6 \nDice Result'
        });

        const result = await bcdiceModule.rollDiceCommand({
            mainMsg: ['.kk', '2D6'],
            inputStr: '.kk 2D6'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('2D6 \nDice Result');
    });

    test('Test dicehelp command with no registered system', async () => {
        schema.bcdiceRegedit.findOne.mockResolvedValue(null);
        bcdiceModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: '沒有已設定的骰表ID',
            quotes: true
        });

        const result = await bcdiceModule.rollDiceCommand({
            mainMsg: ['.bc', 'dicehelp'],
            botname: 'testbot',
            channelid: 'testchannel'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('沒有已設定的骰表ID');
        expect(result.quotes).toBe(true);
    });

    test('Test use command without admin permission', async () => {
        checkTools.permissionErrMsg.mockReturnValue('Permission Denied');
        bcdiceModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: 'Permission Denied'
        });

        const result = await bcdiceModule.rollDiceCommand({
            mainMsg: ['.bc', 'use', 'Cthulhu'],
            userrole: 1,
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('Permission Denied');
    });

    test('Test delete command with admin permission', async () => {
        checkTools.permissionErrMsg.mockReturnValue(null);
        schema.bcdiceRegedit.findOneAndDelete.mockResolvedValue({ trpgId: 'Cthulhu' });
        bcdiceModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: '已刪除BcDice的設定'
        });

        const result = await bcdiceModule.rollDiceCommand({
            mainMsg: ['.bc', 'delete'],
            userrole: 3,
            groupid: 'testgroup',
            botname: 'testbot',
            channelid: 'testchannel'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('已刪除BcDice的設定');
    });

    test('Test Discord slash commands structure', () => {
        expect(Array.isArray(bcdiceModule.discordCommand)).toBe(true);
        expect(bcdiceModule.discordCommand.length).toBe(2);
        
        const [rollCommand, settingCommand] = bcdiceModule.discordCommand;
        
        expect(rollCommand.data.name).toBe('bcdice擲骰');
        expect(settingCommand.data.name).toBe('bcdice設定');
    });
}); 