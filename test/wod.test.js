"use strict";

// Mock dependencies
jest.mock('../roll/rollbase.js', () => ({
  BuildRollDice: jest.fn().mockResolvedValue([1, 2, 3, 4, 5, 6]),
  Dice: jest.fn().mockReturnValue(4)
}));

// Import the module after mocking
const wodModule = require('../roll/wod.js');

describe('World of Darkness Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    expect(wodModule.gameName()).toBe('【WOD黑暗世界】.xWDy');
  });

  test('Test gameType returns correct type', () => {
    expect(wodModule.gameType()).toBe('Dice:WOD:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = wodModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(1);
    expect(patterns[0].first).toBeInstanceOf(RegExp);
    expect(patterns[0].first.test('.3wd8')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', async () => {
    const helpText = await wodModule.getHelpMessage();
    expect(helpText).toContain('世界of黑暗擲骰系統');
    expect(helpText).toContain('基本格式');
    expect(helpText).toContain('判定規則');
    expect(helpText).toContain('參數說明');
    expect(helpText).toContain('範例指令');
  });

  test('Test initialize returns empty variables object', () => {
    expect(wodModule.initialize()).toEqual({});
  });

  test('Test rollDiceCommand with standard roll (3 dice)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wd8']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/); // Should contain dice results
    expect(result.text).toContain('成功');
  });

  test('Test rollDiceCommand with custom success threshold (5wd9)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.5wd9']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
  });

  test('Test rollDiceCommand with bonus successes (3wd8+2)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wd8+2']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
  });

  test('Test rollDiceCommand with penalty successes (3wd8-1)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wd8-1']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
  });

  test('Test rollDiceCommand with description text', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wd8', 'Test roll']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
    expect(result.text).toContain('Test roll');
  });

  test('Test rollDiceCommand with invalid dice count (>600)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.601wd8']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('');
  });

  test('Test rollDiceCommand with invalid dice count (<1)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.0wd8']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('');
  });

  test('Test rollDiceCommand with invalid success threshold (<=3)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wd3']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('加骰最少比3高');
  });

  test('Test rollDiceCommand with default success threshold (10)', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wd']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
  });

  test('Test rollDiceCommand with WOD alias', async () => {
    const result = await wodModule.rollDiceCommand({
      mainMsg: ['.3wod8']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
  });
}); 