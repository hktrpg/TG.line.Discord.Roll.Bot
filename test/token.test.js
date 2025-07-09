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

jest.mock('jimp', () => ({
  read: jest.fn().mockImplementation(() => ({
    mask: jest.fn().mockReturnThis(),
    getBufferAsync: jest.fn().mockResolvedValue(Buffer.from('fake-image-data'))
  }))
}));

jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(true),
    metadata: jest.fn().mockResolvedValue({ width: 520, height: 520 }),
    extract: jest.fn().mockReturnThis(),
    composite: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image-data'))
  });
  mockSharp.gravity = { center: 'center' };
  return mockSharp;
});

jest.mock('axios', () => {
  return {
    default: jest.fn().mockResolvedValue({ data: Buffer.from('fake-image-data') })
  };
});

jest.mock('fs', () => ({
  unlinkSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true)
}));

jest.mock('geopattern', () => ({
  generate: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('<svg>fake-pattern</svg>')
  })
}));

jest.mock('imgbox', () => ({
    imgbox: jest.fn().mockResolvedValue({
        ok: true,
        files: [{ url: 'https://example.com/image.png', original_url: 'https://example.com/image.png' }]
    })
}));

// Import the module after mocking
const tokenModule = require('../roll/token.js');

describe('Token Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    const name = tokenModule.gameName();
    expect(name).toBeTruthy();
    expect(name).toBe('【製作Token】.token .token2 .token3 .tokenupload');
  });

  test('Test gameType returns correct type', () => {
    expect(tokenModule.gameType()).toBe('Tool:Token:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = tokenModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(1);
    expect(patterns[0].first).toBeInstanceOf(RegExp);
    expect(patterns[0].first.test('.token')).toBe(true);
    expect(patterns[0].first.test('.token2')).toBe(true);
    expect(patterns[0].first.test('.token3')).toBe(true);
    expect(patterns[0].first.test('.tokenupload')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = tokenModule.getHelpMessage();
    expect(helpText).toContain('🎭Token製作系統');
    expect(helpText).toContain('基本功能');
    expect(helpText).toContain('Token生成');
    expect(helpText).toContain('特殊功能');
    expect(helpText).toContain('圖片上傳');
  });

  test('Test initialize returns empty variables object', () => {
    const init = tokenModule.initialize();
    expect(init).toEqual({});
  });

  test('Test rollDiceCommand with help command', async () => {
    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.token', 'help'],
      inputStr: '.token help'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe(tokenModule.getHelpMessage());
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with .tokenupload command', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map([
        ['1', { contentType: 'image/png', url: 'https://example.com/image.png' }]
      ])
    };

    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.tokenupload'],
      inputStr: '.tokenupload',
      discordMessage: mockDiscordMessage,
      discordClient: {}
    });
    
    expect(result.text).toBeTruthy();
    expect(result.text).toContain('https://example.com/image.png');
  });

  test('Test rollDiceCommand with .token2 command', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map([
        ['1', { contentType: 'image/png', url: 'https://example.com/image.png' }]
      ])
    };

    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.token2'],
      inputStr: '.token2\nTest Name\nTest Second Line',
      discordMessage: mockDiscordMessage,
      discordClient: {}
    });
    
    expect(result.sendImage).toBeTruthy();
    expect(result.sendImage).toContain('temp_');
    expect(result.sendImage).toContain('.png');
  });

  test('Test rollDiceCommand with .token3 command', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map([
        ['1', { contentType: 'image/png', url: 'https://example.com/image.png' }]
      ])
    };

    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.token3'],
      inputStr: '.token3\nTest Name\nTest Second Line',
      discordMessage: mockDiscordMessage,
      discordClient: {},
      displaynameDiscord: 'Test User'
    });
    
    expect(result.sendImage).toBeTruthy();
    expect(result.sendImage).toContain('temp_');
    expect(result.sendImage).toContain('.png');
  });

  test('Test rollDiceCommand with .token command', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map([
        ['1', { contentType: 'image/png', url: 'https://example.com/image.png' }]
      ])
    };

    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.token'],
      inputStr: '.token\nTest Name\nTest Second Line',
      discordMessage: mockDiscordMessage,
      discordClient: {}
    });
    
    expect(result.sendImage).toBeTruthy();
    expect(result.sendImage).toContain('temp_');
    expect(result.sendImage).toContain('.png');
  });

  test('Test rollDiceCommand with no image attachment', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map(),
      author: null
    };

    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.token'],
      inputStr: '.token\nTest Name',
      discordMessage: mockDiscordMessage,
      discordClient: {}
    });
    
    expect(result.text).toContain('製作失敗，可能出現某些錯誤');
  });

  test('Test rollDiceCommand with invalid image format', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map([
        ['1', { contentType: 'application/pdf', url: 'https://example.com/file.pdf' }]
      ])
    };

    const result = await tokenModule.rollDiceCommand({
      mainMsg: ['.tokenupload'],
      inputStr: '.tokenupload',
      discordMessage: mockDiscordMessage,
      discordClient: {}
    });
    
    expect(result.text).toContain('沒有找到reply裡有圖片');
  });

  test('Test getAvatar with direct message', async () => {
    const mockDiscordMessage = {
      type: 0,
      attachments: new Map(),
      author: {
        displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
      }
    };

    const result = await tokenModule.getAvatar(mockDiscordMessage, {});
    expect(result).toBe('https://example.com/avatar.png');
  });

  test('Test getName with two lines of text', async () => {
    const result = await tokenModule.getName({}, '.token\nFirst Line\nSecond Line');
    expect(result.text).toBe('First Line');
    expect(result.secondLine).toBe('Second Line');
  });

  test('Test getName with single line of text', async () => {
    const result = await tokenModule.getName({}, '.token\nSingle Line');
    expect(result.text).toBe('Single Line');
    expect(result.secondLine).toBe('');
  });

  test('Test getFileExtension', () => {
    const result = tokenModule.getFileExtension('https://example.com/image.png');
    expect(result).toBe('.png');
  });

  test('Test colorTextBuilder with single line', () => {
    const result = tokenModule.colorTextBuilder({
      text: 'Test Text',
      text2: '',
      size: [92, 61],
      position: 96
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toContain('Test Text');
  });

  test('Test colorTextBuilder with two lines', () => {
    const result = tokenModule.colorTextBuilder({
      text: 'First Line',
      text2: 'Second Line',
      size: [92, 61],
      position: 96
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toContain('First Line');
    expect(result.toString()).toContain('Second Line');
  });

  // Restore original process.env after tests
  afterAll(() => {
    process.env = originalProcessEnv;
  });
}); 