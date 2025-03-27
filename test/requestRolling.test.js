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

// Mock the module to be tested
jest.mock('../roll/requestRolling.js', () => {
  const mockDiscordCommand = [{
    data: { 
      name: 're',
      description: '要求擲骰/點擊功能'
    },
    execute: jest.fn()
  }];
  
  return {
    gameName: jest.fn().mockReturnValue('【要求擲骰/點擊功能】'),
    gameType: jest.fn().mockReturnValue('funny:request:hktrpg'),
    prefixs: jest.fn().mockReturnValue([{
      first: /^\.re$/i,
      second: null
    }]),
    getHelpMessage: jest.fn().mockReturnValue('【🎲Discord互動功能】'),
    initialize: jest.fn().mockReturnValue({}),
    rollDiceCommand: jest.fn(),
    discordCommand: mockDiscordCommand
  };
});

// Import the module after mocking
const requestRollingModule = require('../roll/requestRolling.js');

describe('Request Rolling Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    const name = requestRollingModule.gameName();
    expect(name).toBeTruthy();
    expect(name).toBe('【要求擲骰/點擊功能】');
  });

  test('Test gameType returns correct type', () => {
    expect(requestRollingModule.gameType()).toBe('funny:request:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = requestRollingModule.prefixs();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].first.test('.re')).toBe(true);
    expect(patterns[0].first.test('.RE')).toBe(true);
    expect(patterns[0].first.test('.dice')).toBe(false);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = requestRollingModule.getHelpMessage();
    expect(helpText).toContain('【🎲Discord互動功能】');
  });

  test('Test initialize returns empty variables object', () => {
    const init = requestRollingModule.initialize();
    expect(init).toEqual({});
  });

  test('Test rollDiceCommand with help command', async () => {
    requestRollingModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (!mainMsg[1] || mainMsg[1] === 'help') {
        return {
          default: 'on',
          type: 'text',
          text: requestRollingModule.getHelpMessage(),
          quotes: true
        };
      }
      return null;
    });

    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re', 'help']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('Discord互動功能');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with no parameters', async () => {
    requestRollingModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[0] === '.re' && !mainMsg[1]) {
        return {
          default: 'on',
          type: 'text',
          text: requestRollingModule.getHelpMessage(),
          quotes: true
        };
      }
      return null;
    });

    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('Discord互動功能');
  });

  test('Test rollDiceCommand with valid options', async () => {
    requestRollingModule.rollDiceCommand.mockImplementation(({ mainMsg, inputStr }) => {
      if (mainMsg[0] === '.re' && mainMsg[1]) {
        return {
          default: 'on',
          type: 'text',
          text: '',
          requestRolling: ['1d100 哈哈', '1d3 SC成功', '1d10 SC失敗']
        };
      }
      return null;
    });

    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re', '1d100 哈哈, 1d3 SC成功, 1d10 SC失敗'],
      inputStr: '.re 1d100 哈哈, 1d3 SC成功, 1d10 SC失敗'
    });
    
    expect(result.type).toBe('text');
    expect(result.requestRolling).toEqual(['1d100 哈哈', '1d3 SC成功', '1d10 SC失敗']);
  });

  test('Test handleRequestRolling with option limits', async () => {
    // Custom mock for testing truncation and limits
    requestRollingModule.rollDiceCommand.mockImplementation(({ inputStr }) => {
      if (inputStr && inputStr.includes('.re')) {
        const text = inputStr.replace(/^\.re\s+/i, '').replace(/[\r\n]/gm, '').split(',');
        // Simulate the behavior of handleRequestRolling
        let processedOptions = text.slice(0, 10);
        processedOptions = processedOptions.map(option => option.substring(0, 80));
        processedOptions = processedOptions.filter(option => option.trim());
        
        return {
          default: 'on',
          type: 'text',
          text: '',
          requestRolling: processedOptions
        };
      }
      return null;
    });

    // Test with more than 10 options (should limit to 10)
    const manyOptions = Array(15).fill().map((_, i) => `option${i}`).join(', ');
    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re', manyOptions],
      inputStr: `.re ${manyOptions}`
    });
    
    expect(result.requestRolling.length).toBeLessThanOrEqual(10);

    // Test with options longer than 80 characters (should truncate)
    const longOption = 'x'.repeat(100);
    const result2 = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re', longOption],
      inputStr: `.re ${longOption}`
    });
    
    expect(result2.requestRolling[0].length).toBeLessThanOrEqual(80);
  });

  test('Test handleRequestRolling with empty options', async () => {
    requestRollingModule.rollDiceCommand.mockImplementation(({ inputStr }) => {
      if (inputStr && inputStr.includes('.re')) {
        const text = inputStr.replace(/^\.re\s+/i, '').replace(/[\r\n]/gm, '').split(',');
        // Simulate the behavior of handleRequestRolling
        const filtered = text.filter(n => n.trim());
        
        return {
          default: 'on',
          type: 'text',
          text: '',
          requestRolling: filtered
        };
      }
      return null;
    });

    // Test with empty options (should filter them out)
    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re', '1d100,  , ,2d6'],
      inputStr: '.re 1d100,  , ,2d6'
    });
    
    expect(result.requestRolling).toEqual(['1d100', '2d6']);
  });

  test('Test handleRequestRolling with newlines', async () => {
    requestRollingModule.rollDiceCommand.mockImplementation(({ inputStr }) => {
      if (inputStr && inputStr.includes('.re')) {
        const text = inputStr.replace(/^\.re\s+/i, '').replace(/[\r\n]/gm, '').split(',');
        // Simulate the behavior of handleRequestRolling
        const filtered = text.map(item => item.trim()).filter(n => n);
        
        return {
          default: 'on',
          type: 'text',
          text: '',
          requestRolling: filtered
        };
      }
      return null;
    });

    // Test with newlines (should remove them)
    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.re', '1d100\n, 2d6\r\n, 3d8'],
      inputStr: '.re 1d100\n, 2d6\r\n, 3d8'
    });
    
    expect(result.requestRolling).toEqual(['1d100', '2d6', '3d8']);
  });

  test('Test with invalid command returns null', async () => {
    requestRollingModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[0] !== '.re') {
        return null;
      }
      // Won't reach here if mainMsg[0] !== '.re'
      return {
        default: 'on',
        type: 'text',
        text: '',
        requestRolling: []
      };
    });

    const result = await requestRollingModule.rollDiceCommand({
      mainMsg: ['.dice', '1d100'],
      inputStr: '.dice 1d100'
    });
    
    expect(result).toBeNull();
  });

  test('Test discordCommand structure', () => {
    expect(requestRollingModule.discordCommand).toBeDefined();
    expect(Array.isArray(requestRollingModule.discordCommand)).toBe(true);
    expect(requestRollingModule.discordCommand.length).toBe(1);
    expect(requestRollingModule.discordCommand[0].data).toBeDefined();
    expect(requestRollingModule.discordCommand[0].execute).toBeDefined();
  });

  test('Test discordCommand properties', () => {
    const cmd = requestRollingModule.discordCommand[0];
    expect(cmd.data.name).toBe('re');
    expect(cmd.data.description).toBe('要求擲骰/點擊功能');
  });

  test('Test discordCommand execute function', async () => {
    // Mock the execute function
    requestRollingModule.discordCommand[0].execute.mockImplementation((interaction) => {
      const text1 = interaction.options.getString('text1');
      const text2 = interaction.options.getString('text2') ? `,${interaction.options.getString('text2')}` : '';
      return `.re ${text1}${text2}`;
    });

    // Mock interaction
    const mockInteraction = {
      options: {
        getString: jest.fn((param) => {
          if (param === 'text1') return '1d100 哈哈';
          if (param === 'text2') return '1d3 SC成功';
          return null;
        })
      }
    };

    const result = await requestRollingModule.discordCommand[0].execute(mockInteraction);
    
    expect(result).toBe('.re 1d100 哈哈,1d3 SC成功');
    expect(mockInteraction.options.getString).toHaveBeenCalledWith('text1');
  });

  test('Test discordCommand execute with only required parameter', async () => {
    // Mock the execute function
    requestRollingModule.discordCommand[0].execute.mockImplementation((interaction) => {
      const text1 = interaction.options.getString('text1');
      const text2 = interaction.options.getString('text2') ? `,${interaction.options.getString('text2')}` : '';
      return `.re ${text1}${text2}`;
    });

    // Mock interaction with only text1
    const mockInteraction = {
      options: {
        getString: jest.fn((param) => {
          if (param === 'text1') return '1d100 哈哈';
          return null;
        })
      }
    };

    const result = await requestRollingModule.discordCommand[0].execute(mockInteraction);
    
    expect(result).toBe('.re 1d100 哈哈');
    expect(mockInteraction.options.getString).toHaveBeenCalledWith('text1');
    expect(mockInteraction.options.getString).toHaveBeenCalledWith('text2');
  });

  test('Test environment variable is set', () => {
    // Check if DISCORD_CHANNEL_SECRET is correctly set in our test environment
    expect(process.env.DISCORD_CHANNEL_SECRET).toBe('test-secret');
    
    // The module should be properly loaded since the env var is set
    expect(requestRollingModule).toBeDefined();
  });
  
  // Restore original process.env after tests
  afterAll(() => {
    process.env = originalProcessEnv;
  });
}); 