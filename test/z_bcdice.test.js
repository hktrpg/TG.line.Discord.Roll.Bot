"use strict";

// Mock environment variables
process.env.mongoURL = 'test_mongo_url';

// Mock dependencies
jest.mock('bcdice', () => ({
  DynamicLoader: jest.fn().mockImplementation(() => ({
    dynamicLoad: jest.fn()
  }))
}));

jest.mock('../modules/check.js', () => ({
  permissionErrMsg: jest.fn(),
  flag: {
    ChkChannelManager: 2
  }
}));

jest.mock('../modules/schema.js', () => ({
  bcdiceRegedit: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

jest.mock('discord.js', () => ({
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis()
  }))
}));

// Import the module after mocking
const bcdiceModule = require('../roll/z_bcdice.js');
const { DynamicLoader } = require('bcdice');
const checkTools = require('../modules/check.js');
const schema = require('../modules/schema.js');

describe('BcDice Module Tests', () => {
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
    expect(patterns[0].first.test('.al')).toBe(true);
    expect(patterns[0].first.test('.kk')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = bcdiceModule.getHelpMessage();
    expect(helpText).toContain('【🎲BcDice日系擲骰系統】');
    expect(helpText).toContain('系統簡介');
    expect(helpText).toContain('使用步驟');
    expect(helpText).toContain('常用指令');
  });

  test('Test initialize returns empty variables object', () => {
    expect(bcdiceModule.initialize()).toEqual({});
  });

  describe('Dice Command Tests', () => {
    test('Test help command', async () => {
      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'help']
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe(bcdiceModule.getHelpMessage());
      expect(result.quotes).toBe(true);
    });

    test('Test Kamigakari dice command', async () => {
      const mockGameSystem = {
        eval: jest.fn().mockReturnValue({ text: 'Success!' })
      };
      DynamicLoader.mockImplementation(() => ({
        dynamicLoad: jest.fn().mockResolvedValue(mockGameSystem)
      }));

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.kk', '1D100']
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('1D100\nSuccess!');
    });

    test('Test DoubleCross dice command', async () => {
      const mockGameSystem = {
        eval: jest.fn().mockReturnValue({ text: 'Success!' })
      };
      DynamicLoader.mockImplementation(() => ({
        dynamicLoad: jest.fn().mockResolvedValue(mockGameSystem)
      }));

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.dx', '1D100']
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('1D100\nSuccess!');
    });

    test('Test SwordWorld dice command', async () => {
      const mockGameSystem = {
        eval: jest.fn().mockReturnValue({ text: 'Success!' })
      };
      DynamicLoader.mockImplementation(() => ({
        dynamicLoad: jest.fn().mockResolvedValue(mockGameSystem)
      }));

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.sw', '1D100']
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('1D100\nSuccess!');
    });
  });

  describe('System Registration Tests', () => {
    test('Test system registration with valid ID', async () => {
      const mockGameSystem = {
        HELP_MESSAGE: 'System help message'
      };
      DynamicLoader.mockImplementation(() => ({
        dynamicLoad: jest.fn().mockResolvedValue(mockGameSystem)
      }));

      schema.bcdiceRegedit.findOneAndUpdate.mockResolvedValue({
        trpgId: 'TestSystem'
      });

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'use', 'TestSystem'],
        userrole: 3,
        botname: 'test_bot',
        channelid: 'test_channel',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('已更新BcDice');
      expect(result.text).toContain('TestSystem');
    });

    test('Test system registration without permission', async () => {
      checkTools.permissionErrMsg.mockReturnValue('Permission denied');

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'use', 'TestSystem'],
        userrole: 1,
        botname: 'test_bot',
        channelid: 'test_channel',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('Permission denied');
    });

    test('Test system registration with invalid ID', async () => {
      DynamicLoader.mockImplementation(() => ({
        dynamicLoad: jest.fn().mockRejectedValue(new Error('Invalid system'))
      }));

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'use', 'InvalidSystem'],
        userrole: 3,
        botname: 'test_bot',
        channelid: 'test_channel',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('此骰表ID沒有回應');
    });
  });

  describe('System Help Tests', () => {
    test('Test dicehelp with registered system', async () => {
      schema.bcdiceRegedit.findOne.mockResolvedValue({
        trpgId: 'TestSystem'
      });

      const mockGameSystem = {
        HELP_MESSAGE: 'System help message'
      };
      DynamicLoader.mockImplementation(() => ({
        dynamicLoad: jest.fn().mockResolvedValue(mockGameSystem)
      }));

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'dicehelp'],
        botname: 'test_bot',
        channelid: 'test_channel'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('System help message');
    });

    test('Test dicehelp without registered system', async () => {
      schema.bcdiceRegedit.findOne.mockResolvedValue(null);

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'dicehelp'],
        botname: 'test_bot',
        channelid: 'test_channel'
      });

      expect(result.type).toBe('text');
      expect(result.text).toContain('沒有已設定的骰表ID');
    });
  });

  describe('System Deletion Tests', () => {
    test('Test system deletion with permission', async () => {
      schema.bcdiceRegedit.findOneAndDelete.mockResolvedValue({
        trpgId: 'TestSystem'
      });

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'delete'],
        userrole: 3,
        botname: 'test_bot',
        channelid: 'test_channel',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('已刪除BcDice的設定');
    });

    test('Test system deletion without permission', async () => {
      checkTools.permissionErrMsg.mockReturnValue('Permission denied');

      const result = await bcdiceModule.rollDiceCommand({
        mainMsg: ['.bc', 'delete'],
        userrole: 1,
        botname: 'test_bot',
        channelid: 'test_channel',
        groupid: 'test_group'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('Permission denied');
    });
  });

  describe('Discord Command Tests', () => {
    test('Test bcdice擲骰 command', async () => {
      const command = bcdiceModule.discordCommand.find(cmd => cmd.data.name === 'bcdice擲骰');
      const result = await command.execute({
        options: {
          getString: jest.fn().mockReturnValue('1D100')
        }
      });

      expect(result).toBe('.bc 1D100');
    });

    test('Test bcdice設定 command with help', async () => {
      const command = bcdiceModule.discordCommand.find(cmd => cmd.data.name === 'bcdice設定');
      const result = await command.execute({
        options: {
          getString: jest.fn().mockImplementation((name) => {
            if (name === '指令') return 'help';
            return '';
          })
        }
      });

      expect(result).toBe('.bc help');
    });

    test('Test bcdice設定 command with use', async () => {
      const command = bcdiceModule.discordCommand.find(cmd => cmd.data.name === 'bcdice設定');
      const result = await command.execute({
        options: {
          getString: jest.fn().mockImplementation((name) => {
            if (name === '指令') return 'use';
            if (name === 'usetext') return 'TestSystem';
            return '';
          })
        }
      });

      expect(result).toBe('.bc use TestSystem');
    });
  });
}); 