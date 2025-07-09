"use strict";

// Mock dependencies
jest.mock('../roll/rollbase.js', () => ({
  BuildRollDice: jest.fn().mockResolvedValue([1, 2, 3, 4, 5, 6]),
  Dice: jest.fn().mockReturnValue(4)
}));

jest.mock('mathjs', () => ({
  evaluate: jest.fn().mockImplementation((expr) => {
    try {
      return eval(expr);
    } catch {
      return expr;
    }
  })
}));

// Import the module after mocking
const wnModule = require('../roll/WN.js');

describe('Witch Hunting Night Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    expect(wnModule.gameName()).toBe('【魔女狩獵之夜】.wn xDn+-y');
  });

  test('Test gameType returns correct type', () => {
    expect(wnModule.gameType()).toBe('Dice:witch-hunting-night:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = wnModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(1);
    expect(patterns[0].first).toBeInstanceOf(RegExp);
    expect(patterns[0].first.test('.wn')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', async () => {
    const helpText = await wnModule.getHelpMessage();
    expect(helpText).toContain('魔女狩獵之夜');
    expect(helpText).toContain('標準擲骰');
    expect(helpText).toContain('進階擲骰');
    expect(helpText).toContain('魔改規則');
  });

  test('Test initialize returns empty variables object', () => {
    expect(wnModule.initialize()).toEqual({});
  });

  test('Test rollDiceCommand with help command', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', 'help']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe(await wnModule.getHelpMessage());
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with standard roll (3 dice)', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '3']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/); // Should contain dice results
    expect(result.text).toContain('成功');
  });

  test('Test rollDiceCommand with custom success threshold (5D4+3)', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '5D4+3']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
    expect(result.text).toContain('3修正');
  });

  test('Test rollDiceCommand with net success calculation (3DD6+2)', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '3DD6+2']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('罪業超過6點時扣除6點罪業，轉化為一點代價');
  });

  test('Test rollDiceCommand with modified rules (3@3+3)', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '3@3+3']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
    expect(result.text).toContain('3修正');
  });

  test('Test rollDiceCommand with modified rules and net success (3@D3+2)', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '3@D3+2']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
    expect(result.text).toContain('2修正');
  });

  test('Test rollDiceCommand with invalid input', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', 'invalid']
    });
    
    expect(result).toBeUndefined();
  });

  test('Test rollDiceCommand with sin value >= 6', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '3D6']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('罪業超過6點時扣除6點罪業，轉化為一點代價');
  });

  test('Test rollDiceCommand with sin value >= 6 in modified rules', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '3@6']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('罪業6以上扣除5點罪業，增加一點代價');
  });

  test('Test rollDiceCommand with dice count > 200', async () => {
    const result = await wnModule.rollDiceCommand({
      mainMsg: ['.wn', '201']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toMatch(/\[[\d, ]+\]/);
    expect(result.text).toContain('成功');
  });
}); 