"use strict";

// Mock dependencies
jest.mock('../roll/rollbase.js', () => ({
  BuildRollDice: jest.fn().mockResolvedValue([1, 2, 3, 4, 5, 6]),
  Dice: jest.fn()
}));

// Import the module after mocking
const kcModule = require('../roll/yumingkueichai.js');
const rollbase = require('../roll/rollbase.js');

describe('Yuming Kuei Chai Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    expect(kcModule.gameName()).toBe('【貓貓鬼差】.kc xDy z');
  });

  test('Test gameType returns correct type', () => {
    expect(kcModule.gameType()).toBe('Dice:yumingkueichai:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = kcModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(2);
    
    // First pattern pair
    expect(patterns[0].first).toBeInstanceOf(RegExp);
    expect(patterns[0].second).toBeInstanceOf(RegExp);
    expect(patterns[0].first.test('.KC')).toBe(true);
    expect(patterns[0].second.test('4d10')).toBe(true);
    expect(patterns[0].second.test('5d12')).toBe(true);
    expect(patterns[0].second.test('d8')).toBe(true);
    
    // Second pattern pair
    expect(patterns[1].first).toBeInstanceOf(RegExp);
    expect(patterns[1].first.test('.KC')).toBe(true);
    expect(patterns[1].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', async () => {
    const helpText = await kcModule.getHelpMessage();
    expect(helpText).toContain('貓貓鬼差系統');
    expect(helpText).toContain('基本格式');
    expect(helpText).toContain('參數說明');
    expect(helpText).toContain('判定規則');
    expect(helpText).toContain('十八啦玩法');
    expect(helpText).toContain('範例指令');
  });

  test('Test initialize returns empty variables object', () => {
    expect(kcModule.initialize()).toEqual({});
  });

  test('Test rollDiceCommand with help command', async () => {
    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', 'help']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe(await kcModule.getHelpMessage());
  });

  test('Test rollDiceCommand with default roll (4 dice)', async () => {
    rollbase.Dice.mockReturnValueOnce(3)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', 'd']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 3,3,5,1 \]/);
    expect(result.text).toContain('達成值 6');
    expect(result.text).toContain('[5,1]');
  });

  test('Test rollDiceCommand with 5 dice', async () => {
    rollbase.Dice.mockReturnValueOnce(3)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '5d']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 3,3,5,5,1 \]/);
    expect(result.text).toContain('達成值');
  });

  test('Test rollDiceCommand with target number', async () => {
    rollbase.Dice.mockReturnValueOnce(3)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '4d', '7']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('目標值 ≧ 7');
    expect(result.text).toMatch(/\[ 3,3,5,1 \]/);
    expect(result.text).toContain('失敗');
  });

  test('Test rollDiceCommand with modifier', async () => {
    rollbase.Dice.mockReturnValueOnce(3)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '4d10']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 3,3,5,1 \]/);
    expect(result.text).toContain('達成值');
  });

  test('Test rollDiceCommand with dramatic failure', async () => {
    rollbase.Dice.mockReturnValueOnce(2)
                 .mockReturnValueOnce(2)
                 .mockReturnValueOnce(2)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '4d']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 2,2,2,1 \]/);
    expect(result.text).toContain('戲劇性失敗');
  });

  test('Test rollDiceCommand with no pairs', async () => {
    rollbase.Dice.mockReturnValueOnce(1)
                 .mockReturnValueOnce(2)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(4);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '4d']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 1,2,3,4 \]/);
    expect(result.text).toContain('失敗');
  });

  test('Test rollDiceCommand with value capping', async () => {
    rollbase.Dice.mockReturnValueOnce(3)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '4d25', '25']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 3,3,5,1 \]/);
    expect(result.text).toContain('目標值 ≧ 20');
  });

  test('Test rollDiceCommand with description text', async () => {
    rollbase.Dice.mockReturnValueOnce(3)
                 .mockReturnValueOnce(3)
                 .mockReturnValueOnce(5)
                 .mockReturnValueOnce(1);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '4d', 'Test roll']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 3,3,5,1 \]/);
    expect(result.text).toContain('Test roll');
  });

  test('Test special case for 5D with 11112', async () => {
    rollbase.Dice.mockReturnValueOnce(1)
                 .mockReturnValueOnce(1)
                 .mockReturnValueOnce(1)
                 .mockReturnValueOnce(1)
                 .mockReturnValueOnce(2);

    const result = await kcModule.rollDiceCommand({
      mainMsg: ['.kc', '5d']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[ 1,1,1,1,2 \]/);
    expect(result.text).toContain('達成值 2');
  });
}); 