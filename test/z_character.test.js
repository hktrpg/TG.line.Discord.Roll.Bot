"use strict";

// Mock environment variables
process.env.mongoURL = 'test_mongo_url';

// Mock dependencies
jest.mock('mathjs', () => ({
  evaluate: jest.fn()
}));

jest.mock('./rollbase', () => ({
  rollDiceCommand: jest.fn()
}));

jest.mock('./2_coc', () => ({
  rollDiceCommand: jest.fn()
}));

jest.mock('./0_advroll', () => ({
  rollDiceCommand: jest.fn()
}));

jest.mock('../modules/schema.js', () => ({
  characterCard: {
    find: jest.fn(),
    findOne: jest.fn(),
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

// Import the module after mocking
const characterModule = require('../roll/z_character.js');
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const mathjs = require('mathjs');

describe('Character Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(patterns[0].first.test('.char')).toBe(true);
    expect(patterns[0].first.test('.ch')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', async () => {
    const helpText = await characterModule.getHelpMessage();
    expect(helpText).toContain('【🎭HKTRPG角色卡系統】');
    expect(helpText).toContain('系統簡介');
    expect(helpText).toContain('基礎流程');
    expect(helpText).toContain('建立角色');
  });

  test('Test initialize returns empty variables object', () => {
    expect(characterModule.initialize()).toEqual({});
  });

  describe('Character Card Management Tests', () => {
    test('Test character card creation', async () => {
      const mockCharacter = {
        name: 'TestChar',
        state: [{ name: 'HP', itemA: '10', itemB: '10' }],
        roll: [{ name: '鬥毆', itemA: 'cc 50' }],
        notes: [{ name: '筆記', itemA: '測試角色' }]
      };

      schema.characterCard.findOne.mockResolvedValue(null);
      schema.characterCard.updateOne.mockResolvedValue({ ok: 1 });
      VIP.viplevelCheckUser.mockResolvedValue(1);
      VIP.viplevelCheckGroup.mockResolvedValue(1);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.char', 'add', 'TestChar'],
        inputStr: `.char add name[TestChar]~state[HP:10/10]~roll[鬥毆:cc 50]~notes[筆記:測試角色]~`,
        userid: 'test_user',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('新增/修改成功');
      expect(result.text).toContain('TestChar');
    });

    test('Test character card limit check', async () => {
      schema.characterCard.find.mockResolvedValue(Array(5).fill({}));
      VIP.viplevelCheckUser.mockResolvedValue(1);
      VIP.viplevelCheckGroup.mockResolvedValue(1);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.char', 'add', 'TestChar'],
        inputStr: `.char add name[TestChar]~state[HP:10/10]~`,
        userid: 'test_user',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('你的角色卡上限為4張');
    });

    test('Test character card deletion', async () => {
      schema.characterCard.findOne.mockResolvedValue({
        _id: 'test_id',
        name: 'TestChar'
      });
      schema.characterCard.findOneAndRemove.mockResolvedValue({ ok: 1 });
      schema.characterGpSwitch.deleteMany.mockResolvedValue({ ok: 1 });

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.char', 'delete', 'TestChar'],
        inputStr: '.char delete TestChar',
        userid: 'test_user'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('刪除角色卡成功: TestChar');
    });
  });

  describe('Character State Management Tests', () => {
    test('Test state value update', async () => {
      const mockCharacter = {
        _id: 'test_id',
        name: 'TestChar',
        state: [{ name: 'HP', itemA: '10', itemB: '10' }]
      };

      schema.characterGpSwitch.findOne.mockResolvedValue({
        cardId: 'test_id'
      });
      schema.characterCard.findOne.mockResolvedValue(mockCharacter);
      schema.characterCard.prototype.save = jest.fn().mockResolvedValue(mockCharacter);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.ch', 'HP', '15'],
        inputStr: '.ch HP 15',
        userid: 'test_user',
        groupid: 'test_group',
        channelid: 'test_channel'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('TestChar');
      expect(result.text).toContain('HP: 15/10');
    });

    test('Test state value calculation', async () => {
      const mockCharacter = {
        _id: 'test_id',
        name: 'TestChar',
        state: [{ name: 'HP', itemA: '10', itemB: '10' }]
      };

      schema.characterGpSwitch.findOne.mockResolvedValue({
        cardId: 'test_id'
      });
      schema.characterCard.findOne.mockResolvedValue(mockCharacter);
      schema.characterCard.prototype.save = jest.fn().mockResolvedValue(mockCharacter);
      mathjs.evaluate.mockReturnValue(15);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.ch', 'HP', '+5'],
        inputStr: '.ch HP +5',
        userid: 'test_user',
        groupid: 'test_group',
        channelid: 'test_channel'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('TestChar');
      expect(result.text).toContain('HP: 15/10');
    });
  });

  describe('Character Roll Tests', () => {
    test('Test roll command with dice', async () => {
      const mockCharacter = {
        _id: 'test_id',
        name: 'TestChar',
        roll: [{ name: '鬥毆', itemA: 'cc 50' }]
      };

      schema.characterGpSwitch.findOne.mockResolvedValue({
        cardId: 'test_id'
      });
      schema.characterCard.findOne.mockResolvedValue(mockCharacter);
      require('./rollbase').rollDiceCommand.mockResolvedValue({ text: 'Success!' });

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.ch', '鬥毆'],
        inputStr: '.ch 鬥毆',
        userid: 'test_user',
        groupid: 'test_group',
        channelid: 'test_channel'
      });

      expect(result.characterReRoll).toBe(true);
      expect(result.characterReRollName).toBe('鬥毆');
    });

    test('Test roll command with variable substitution', async () => {
      const mockCharacter = {
        _id: 'test_id',
        name: 'TestChar',
        state: [{ name: 'STR', itemA: '50' }],
        roll: [{ name: '力量', itemA: 'cc {STR}' }]
      };

      schema.characterGpSwitch.findOne.mockResolvedValue({
        cardId: 'test_id'
      });
      schema.characterCard.findOne.mockResolvedValue(mockCharacter);
      require('./rollbase').rollDiceCommand.mockResolvedValue({ text: 'Success!' });

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.ch', '力量'],
        inputStr: '.ch 力量',
        userid: 'test_user',
        groupid: 'test_group',
        channelid: 'test_channel'
      });

      expect(result.characterReRoll).toBe(true);
      expect(result.characterReRollName).toBe('力量');
    });
  });

  describe('Character Display Tests', () => {
    test('Test character list display', async () => {
      const mockCharacters = [
        { name: 'Char1' },
        { name: 'Char2' }
      ];

      schema.characterCard.find.mockResolvedValue(mockCharacters);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.char', 'show'],
        userid: 'test_user'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('角色卡列表');
      expect(result.text).toContain('Char1');
      expect(result.text).toContain('Char2');
    });

    test('Test character detail display', async () => {
      const mockCharacter = {
        name: 'TestChar',
        state: [{ name: 'HP', itemA: '10', itemB: '10' }],
        roll: [{ name: '鬥毆', itemA: 'cc 50' }],
        notes: [{ name: '筆記', itemA: '測試角色' }]
      };

      schema.characterCard.findOne.mockResolvedValue(mockCharacter);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.char', 'show0'],
        userid: 'test_user'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('TestChar');
      expect(result.text).toContain('HP: 10/10');
      expect(result.text).toContain('鬥毆: cc 50');
    });
  });

  describe('Character Button Tests', () => {
    test('Test button creation for character card', async () => {
      const mockCharacter = {
        name: 'TestChar',
        roll: [
          { name: '鬥毆', itemA: 'cc 50' },
          { name: '射擊', itemA: 'cc 45' }
        ]
      };

      schema.characterCard.findOne.mockResolvedValue(mockCharacter);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.char', 'button', 'TestChar'],
        inputStr: '.char button TestChar',
        userid: 'test_user',
        groupid: 'test_group',
        channelid: 'test_channel',
        botname: 'Discord'
      });

      expect(result.requestRollingCharacter).toBeDefined();
      expect(result.requestRollingCharacter[1]).toBe('TestChar');
      expect(result.requestRollingCharacter[2]).toBe('char');
    });

    test('Test button creation for current character', async () => {
      const mockCharacter = {
        _id: 'test_id',
        name: 'TestChar',
        roll: [
          { name: '鬥毆', itemA: 'cc 50' },
          { name: '射擊', itemA: 'cc 45' }
        ]
      };

      schema.characterGpSwitch.findOne.mockResolvedValue({
        cardId: 'test_id'
      });
      schema.characterCard.findOne.mockResolvedValue(mockCharacter);

      const result = await characterModule.rollDiceCommand({
        mainMsg: ['.ch', 'button'],
        inputStr: '.ch button',
        userid: 'test_user',
        groupid: 'test_group',
        channelid: 'test_channel',
        botname: 'Discord'
      });

      expect(result.requestRollingCharacter).toBeDefined();
      expect(result.requestRollingCharacter[1]).toBe('TestChar');
      expect(result.requestRollingCharacter[2]).toBe('ch');
    });
  });
}); 