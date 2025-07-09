"use strict";

// Create a mock process.env
const originalProcessEnv = process.env;
process.env = { 
  ...originalProcessEnv,
  DISCORD_CHANNEL_SECRET: 'test-secret' 
};

// Mock dependencies
jest.mock('discord.js', () => ({
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis()
  }))
}));

// Mock mathjs
jest.mock('mathjs', () => ({
  evaluate: jest.fn().mockImplementation((expr) => {
    // For simplicity, handle a few expected cases
    if (expr === '8+1') return 9;
    if (expr === '10>5') return true;
    if (expr === '5<10') return true;
    if (expr === '8>10') return false;
    if (expr.includes('+')) return 8;
    return expr;
  })
}));

// Mock random-js
jest.mock('random-js', () => ({
  Random: jest.fn().mockImplementation(() => ({
    integer: jest.fn().mockImplementation((min, max) => {
      // Always return 4 for dice rolls for predictable tests
      return 4;
    }),
    shuffle: jest.fn().mockImplementation(arr => [...arr].reverse())
  })),
  nodeCrypto: {}
}));

// Mock @dice-roller/rpg-dice-roller
jest.mock('@dice-roller/rpg-dice-roller', () => ({
  DiceRoller: jest.fn(),
  DiceRoll: jest.fn().mockImplementation((notation) => ({
    output: `Rolled ${notation}: 15`
  }))
}));

// Import the module after mocking
const rollbaseModule = require('../roll/rollbase.js');

describe('Rollbase Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    const name = rollbaseModule.gameName();
    expect(name).toBeTruthy();
    expect(name).toBe('【基本擲骰】.z xDy kl dh');
  });

  test('Test gameType returns correct type', () => {
    expect(rollbaseModule.gameType()).toBe('dice:rollbase:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = rollbaseModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(3);
    
    // Check .rr pattern
    expect(patterns[2].first).toBeInstanceOf(RegExp);
    expect(patterns[2].first.test('.rr')).toBe(true);
    expect(patterns[2].first.test('.RR')).toBe(true);
    expect(patterns[2].second).toBeNull();

    // Check number pattern
    expect(patterns[1].first).toBeInstanceOf(RegExp);
    expect(patterns[1].first.test('5')).toBe(true);
    expect(patterns[1].first.test('30')).toBe(true);
    expect(patterns[1].first.test('31')).toBe(false);
    expect(patterns[1].second).toBeInstanceOf(RegExp);
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = rollbaseModule.getHelpMessage();
    expect(helpText).toContain('🎲基本擲骰系統');
    expect(helpText).toContain('基本格式');
  });

  test('Test initialize returns empty variables object', () => {
    const init = rollbaseModule.initialize();
    expect(init).toEqual({});
  });

  test('Test Dice function returns a random integer', () => {
    const result = rollbaseModule.Dice(100);
    expect(result).toBe(4); // Based on our mock
  });

  test('Test DiceINT function returns a random integer between start and end', () => {
    const result = rollbaseModule.DiceINT(1, 100);
    expect(result).toBe(4); // Based on our mock
    
    // Test with reversed order (should sort internally)
    const result2 = rollbaseModule.DiceINT(100, 1);
    expect(result2).toBe(4); // Based on our mock
  });

  test('Test sortNumber function correctly sorts numbers', () => {
    const arr = [3, 1, 4, 2];
    arr.sort(rollbaseModule.sortNumber);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  test('Test FunnyDice function returns a random integer starting from 0', () => {
    const result = rollbaseModule.FunnyDice(3);
    expect(result).toBe(4); // Based on our mock
  });

  test('Test shuffleTarget function shuffles an array', () => {
    const arr = [1, 2, 3, 4];
    const result = rollbaseModule.shuffleTarget(arr);
    expect(result).toEqual([4, 3, 2, 1]); // Based on our mock
  });

  test('Test BuildDiceCal function with valid input', () => {
    const result = rollbaseModule.BuildDiceCal('2d6+1');
    // With our mocks, should replace the dice notation and evaluate
    expect(result).toBeTruthy();
    expect(result).toContain('=');
  });

  test('Test BuildDiceCal function with invalid inputs', () => {
    // Test with non-dice input
    const result1 = rollbaseModule.BuildDiceCal('not a dice');
    expect(result1).toBeUndefined();
    
    // Test with decimal input
    const result2 = rollbaseModule.BuildDiceCal('1.5d6');
    expect(result2).toBeUndefined();
    
    // Test with too many dice
    const result3 = rollbaseModule.BuildDiceCal('201d6');
    expect(result3).toBeUndefined();
    
    // Test with invalid sides
    const result4 = rollbaseModule.BuildDiceCal('2d1');
    expect(result4).toBeUndefined();
    
    // Test with too many sides
    const result5 = rollbaseModule.BuildDiceCal('2d501');
    expect(result5).toBeUndefined();
  });

  test('Test BuildRollDice function builds a roll expression', () => {
    const result = rollbaseModule.BuildRollDice('2d6');
    expect(result).toBeTruthy();
    expect(result).toContain('(');
    expect(result).toContain(')');
  });

  test('Test rollDiceCommand with .rr command', async () => {
    const result = await rollbaseModule.rollDiceCommand({
      mainMsg: ['.rr'],
      inputStr: '.rr 2d6'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('Rolled 2d6: 15'); // Based on our DiceRoll mock
  });

  test('Test rollDiceCommand with .rr command error', async () => {
    // Mock DiceRoll to throw an error
    require('@dice-roller/rpg-dice-roller').DiceRoll.mockImplementationOnce(() => {
      throw { 
        name: 'Error', 
        message: 'Invalid dice notation' 
      };
    });
    
    const result = await rollbaseModule.rollDiceCommand({
      mainMsg: ['.rr'],
      inputStr: '.rr invalid'
    });
    
    expect(result.type).toBe('text');
    // The actual implementation combines name and message
    expect(result.text).toContain('Error');
    expect(result.text).toContain('Invalid dice notation');
  });

  test('Test rollDiceCommand with standard dice notation', async () => {
    const result = await rollbaseModule.rollDiceCommand({
      mainMsg: ['2d6'],
      inputStr: '2d6'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBeTruthy();
  });

  test('Test nomalDiceRoller with single dice roll', () => {
    const result = rollbaseModule.nomalDiceRoller('2d6');
    expect(result).toBeTruthy();
    expect(result).toContain('2d6');
  });

  test('Test nomalDiceRoller with multiple rolls', () => {
    const result = rollbaseModule.nomalDiceRoller('3', '2d6');
    expect(result).toBeTruthy();
    expect(result).toContain('3次擲骰');
    expect(result).toContain('2d6');
  });

  test('Test nomalDiceRoller with invalid parentheses', () => {
    const result = rollbaseModule.nomalDiceRoller('2d6 + (', 'test');
    expect(result).toBeUndefined();
  });

  test('Test nomalDiceRoller with invalid characters', () => {
    const result = rollbaseModule.nomalDiceRoller('2d6 @ invalid', 'test');
    expect(result).toBeUndefined();
  });

  test('Test nomalDiceRoller with decimal point', () => {
    const result = rollbaseModule.nomalDiceRoller('2.5d6');
    expect(result).toBeUndefined();
  });

  test('Test Discord command structure', () => {
    expect(rollbaseModule.discordCommand).toBeDefined();
    expect(Array.isArray(rollbaseModule.discordCommand)).toBe(true);
    expect(rollbaseModule.discordCommand.length).toBe(2);
    
    const cmd = rollbaseModule.discordCommand[0];
    expect(cmd.data).toBeDefined();
    expect(cmd.execute).toBeDefined();
  });

  test('Test Discord command properties', () => {
    const cmd = rollbaseModule.discordCommand[0];
    // The SlashCommandBuilder is mocked, so we can't access its properties directly
    // Instead, just check that data exists
    expect(cmd.data).toBeDefined();
    // We can't verify the exact name without more complex mocking
  });

  test('Test Discord command execute function', async () => {
    const mockInteraction = {
      options: {
        getString: jest.fn().mockReturnValue('2d6')
      }
    };
    
    const result = await rollbaseModule.discordCommand[0].execute(mockInteraction);
    expect(result).toBe('2d6');
    expect(mockInteraction.options.getString).toHaveBeenCalledWith('text');
  });
  
  // Restore original process.env after tests
  afterAll(() => {
    process.env = originalProcessEnv;
  });
}); 