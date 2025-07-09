"use strict";

// Mock environment variables
process.env.mongoURL = 'test_mongo_url';

// Mock dependencies
jest.mock('mathjs', () => ({
    evaluate: jest.fn()
}));

jest.mock('../roll/rollbase.js', () => ({
    rollDiceCommand: jest.fn()
}));

jest.mock('../roll/2-coc.js', () => ({
    rollDiceCommand: jest.fn()
}));

jest.mock('../roll/0-advroll.js', () => ({
    rollDiceCommand: jest.fn()
}));

jest.mock('../modules/schema.js', () => ({
    characterCard: {
        findOne: jest.fn(),
        find: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndRemove: jest.fn(),
        updateOne: jest.fn()
    },
    characterGpSwitch: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        deleteMany: jest.fn()
    }
}));

jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckUser: jest.fn(),
    viplevelCheckGroup: jest.fn()
}));

// Mock the character module
jest.mock('../roll/z_character.js', () => {
    // Only create the mock if mongoURL is set
    if (!process.env.mongoURL) {
        return undefined;
    }

    const regex = /(^[.]char$)|(^[.]ch$)/ig;
    return {
        gameName: () => '【角色卡功能】 .char (add edit show delete use nonuse button) .ch (set show showall button)',
        gameType: () => 'Tool:trpgcharacter:hktrpg',
        prefixs: () => [{
            first: regex,
            second: null
        }],
        getHelpMessage: async () => '【🎭HKTRPG角色卡系統】\n系統簡介\n基礎流程',
        initialize: () => ({}),
        rollDiceCommand: jest.fn()
    };
});

// Import the module after mocking
const characterModule = require('../roll/z_character.js');
const mathjs = require('mathjs');
const rollbase = require('../roll/rollbase.js');
const coc = require('../roll/2-coc.js');
const advroll = require('../roll/0-advroll.js');
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');

describe('Character Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (characterModule && characterModule.rollDiceCommand) {
            characterModule.rollDiceCommand.mockReset();
        }
    });

    test('Test gameName returns correct name', () => {
        expect(characterModule.gameName()).toBe('【角色卡功能】 .char (add edit show delete use nonuse button) .ch (set show showall button)');
    });

    test('Test gameType returns correct type', () => {
        expect(characterModule.gameType()).toBe('Tool:trpgcharacter:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = characterModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        
        // Test .char pattern
        const charPattern = patterns[0].first;
        expect(charPattern.test('.char')).toBe(true);
        
        // Reset lastIndex since we're reusing the regex
        charPattern.lastIndex = 0;
        
        // Test .ch pattern
        expect(charPattern.test('.ch')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await characterModule.getHelpMessage();
        expect(helpText).toContain('HKTRPG角色卡系統');
        expect(helpText).toContain('系統簡介');
        expect(helpText).toContain('基礎流程');
    });

    test('Test initialize returns empty variables object', () => {
        expect(characterModule.initialize()).toEqual({});
    });

    test('Test help command', async () => {
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: await characterModule.getHelpMessage(),
            quotes: true
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.char', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe(await characterModule.getHelpMessage());
        expect(result.quotes).toBe(true);
    });

    test('Test show command with no characters', async () => {
        schema.characterCard.find.mockResolvedValue([]);
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: '角色卡列表',
            buttonCreate: true
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.char', 'show'],
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('角色卡列表');
        expect(result.buttonCreate).toBeDefined();
    });

    test('Test add character command', async () => {
        VIP.viplevelCheckUser.mockResolvedValue(0);
        VIP.viplevelCheckGroup.mockResolvedValue(0);
        schema.characterCard.find.mockResolvedValue([]);
        schema.characterCard.updateOne.mockResolvedValue({ ok: 1 });
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: '新增/修改成功\nTestChar'
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.char', 'add', 'TestChar'],
            inputStr: `.char add name[TestChar]~state[HP:15/15;MP:10/10]~roll[攻擊:cc 50]~notes[測試角色]~`,
            userid: 'testuser',
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增/修改成功');
        expect(result.text).toContain('TestChar');
    });

    test('Test character state update', async () => {
        schema.characterGpSwitch.findOne.mockResolvedValue({
            cardId: 'testid'
        });
        schema.characterCard.findOne.mockResolvedValue({
            name: 'TestChar',
            state: [{ name: 'HP', itemA: '15', itemB: '15' }],
            _id: 'testid'
        });
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: 'TestChar\nHP: 10/15'
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.ch', 'HP', '10'],
            inputStr: '.ch HP 10',
            userid: 'testuser',
            groupid: 'testgroup',
            channelid: 'testchannel'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('TestChar');
        expect(result.text).toContain('HP: 10/15');
    });

    test('Test character roll command', async () => {
        schema.characterGpSwitch.findOne.mockResolvedValue({
            cardId: 'testid'
        });
        schema.characterCard.findOne.mockResolvedValue({
            name: 'TestChar',
            roll: [{ name: '攻擊', itemA: 'cc 50' }],
            _id: 'testid'
        });
        rollbase.rollDiceCommand.mockResolvedValue({
            text: '攻擊成功'
        });
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            characterReRoll: true,
            characterReRollName: '攻擊'
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.ch', '攻擊'],
            inputStr: '.ch 攻擊',
            userid: 'testuser',
            groupid: 'testgroup',
            channelid: 'testchannel'
        });

        expect(result.characterReRoll).toBe(true);
        expect(result.characterReRollName).toBe('攻擊');
    });

    test('Test character button command', async () => {
        schema.characterGpSwitch.findOne.mockResolvedValue({
            cardId: 'testid'
        });
        schema.characterCard.findOne.mockResolvedValue({
            name: 'TestChar',
            roll: [{ name: '攻擊', itemA: 'cc 50' }],
            _id: 'testid'
        });
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            requestRollingCharacter: ['TestChar', 'TestChar'],
            type: 'text',
            text: '已為你生成按鈕'
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.ch', 'button'],
            inputStr: '.ch button',
            userid: 'testuser',
            groupid: 'testgroup',
            channelid: 'testchannel',
            botname: 'Discord'
        });

        expect(result.requestRollingCharacter).toBeDefined();
        expect(result.requestRollingCharacter[1]).toBe('TestChar');
    });

    test('Test character delete command', async () => {
        schema.characterCard.findOne.mockResolvedValue({
            name: 'TestChar',
            _id: 'testid'
        });
        schema.characterCard.findOneAndRemove.mockResolvedValue({ ok: 1 });
        schema.characterGpSwitch.deleteMany.mockResolvedValue({ ok: 1 });
        characterModule.rollDiceCommand.mockResolvedValueOnce({
            type: 'text',
            text: '刪除角色卡成功\nTestChar'
        });

        const result = await characterModule.rollDiceCommand({
            mainMsg: ['.char', 'delete', 'TestChar'],
            inputStr: '.char delete TestChar',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('刪除角色卡成功');
        expect(result.text).toContain('TestChar');
    });
}); 