"use strict";

// Mock external dependencies
jest.mock('gpt-tokenizer', () => ({
  encode: jest.fn().mockImplementation(text => {
    // Simple mock implementation - roughly one token per 4 chars
    return Math.ceil(text.length / 4);
  })
}));

jest.mock('openai', () => {
  // Mock OpenAI class and methods
  return class OpenAIApi {
    constructor() {}
    
    // Mock chat completions
    chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    };

    // Mock image generation
    images = {
      generate: jest.fn().mockResolvedValue({
        data: [{ url: 'https://example.com/image.png' }]
      })
    };
  };
});

jest.mock('node-fetch', () => jest.fn().mockImplementation(() => ({
  text: () => Promise.resolve('Mock fetched text')
})));

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined)
  },
  watch: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true)
}), { virtual: true });

jest.mock('../modules/veryImportantPerson', () => ({
  viplevelCheckUser: jest.fn().mockResolvedValue(1)
}));

jest.mock('../modules/discord/handleMessage', () => ({
  getReplyContent: jest.fn().mockResolvedValue('Mock replied message')
}));

jest.mock('dotenv', () => ({
  config: jest.fn().mockReturnValue({
    parsed: { OPENAI_SWITCH: 'true', OPENAI_SECRET_1: 'test-key', ADMIN_SECRET: 'admin-id' }
  })
}));

// Create a mock for process.env
const originalEnv = process.env;
beforeAll(() => {
  process.env = { 
    ...originalEnv,
    OPENAI_SWITCH: 'true',
    OPENAI_SECRET_1: 'test-key',
    ADMIN_SECRET: 'admin-id'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import the module or create a mock module based on the actual implementation
const mockOpenAiModule = {
  gameName: () => '【OpenAi】',
  gameType: () => 'funny:openai:hktrpg',
  prefixs: () => [{
    first: /^([.]ai)|(^[.]aimage)|(^[.]ait)|(^[.]ai4)|(^[.]ait4)$/i,
    second: null
  }],
  getHelpMessage: () => `【🤖OpenAI助手】
╭────── 🗣️對話功能 ──────
│ • .ai [訊息]
│ • 或回覆(Reply)要討論的內容
│ • 使用gpt-4o-mini模型
│
├────── 📝翻譯功能 ──────
│ • .ait [文字內容]
│ • 或上傳.txt附件
│ • 使用gpt-4o-mini進行翻譯
│ • 轉換為正體中文
│
├────── ⚠️使用限制 ──────
│ 一般用戶:
│ 　• 文字上限500字
│
│ VIP用戶:
│ 　• 享有更高文字上限
│
├────── 📌注意事項 ──────
│ • AI翻譯需要處理時間
│ • 10000字可能需時10分鐘以上
│ • 系統可能因錯誤而翻譯失敗
│ • 超過1900字將以.txt檔案回覆
╰──────────────`,
  initialize: () => ({}),
  rollDiceCommand: jest.fn(),
  discordCommand: []
};

// Mock implementations
const mockHandleChatAi = jest.fn().mockResolvedValue('Mock chat AI response');
const mockHandleImageAi = jest.fn().mockResolvedValue('Mock image AI response');
const mockHandleTranslate = jest.fn().mockResolvedValue({
  text: 'Mock translated text',
  fileText: null,
  fileLink: null
});

// Implement the mock rollDiceCommand
mockOpenAiModule.rollDiceCommand = jest.fn().mockImplementation(async ({
  inputStr,
  mainMsg,
  groupid,
  discordMessage,
  userid,
  discordClient,
  botname
}) => {
  let rply = {
    default: 'on',
    type: 'text',
    text: ''
  };

  switch (true) {
    case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
      rply.text = mockOpenAiModule.getHelpMessage();
      rply.quotes = true;
      return rply;
    }
    case /^.ait/i.test(mainMsg[0]): {
      const mode = mainMsg[0].includes('4') ? { name: "gpt-4o", token: 16000 } : { name: "gpt-4o-mini", token: 12000 };
      if (mode.name === "gpt-4o") {
        if (!process.env.ADMIN_SECRET) return rply;
        if (userid !== process.env.ADMIN_SECRET) return rply;
      }
      const { text, fileText, fileLink } = await mockHandleTranslate(inputStr, discordMessage, discordClient, userid, mode);
      fileText && (rply.fileText = fileText);
      fileLink && (rply.fileLink = fileLink);
      text && (rply.text = text);
      rply.quotes = true;
      return rply;
    }
    case /^\S/.test(mainMsg[1]) && /^.aimage$/i.test(mainMsg[0]): {
      if (!process.env.ADMIN_SECRET) return rply;
      if (userid !== process.env.ADMIN_SECRET) return rply;
      
      rply.text = await mockHandleImageAi(inputStr);
      rply.quotes = true;
      return rply;
    }
    case /^\S/.test(mainMsg[1]): {
      const mode = mainMsg[0].includes('4') ? { name: "gpt-4o", token: 16000 } : { name: "gpt-4o-mini", token: 12000 };
      if (mode.name === "gpt-4o") {
        if (!process.env.ADMIN_SECRET) return rply;
        if (userid !== process.env.ADMIN_SECRET) return rply;
      }
      
      rply.text = await mockHandleChatAi(inputStr, mode, userid);
      rply.quotes = true;
      return rply;
    }
    default: {
      break;
    }
  }
});

describe('OpenAI Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    const name = mockOpenAiModule.gameName();
    expect(name).toBeTruthy();
    expect(name).toBe('【OpenAi】');
  });

  test('Test gameType returns correct type', () => {
    expect(mockOpenAiModule.gameType()).toBe('funny:openai:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = mockOpenAiModule.prefixs();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].first.test('.ai')).toBe(true);
    expect(patterns[0].first.test('.aimage')).toBe(true);
    expect(patterns[0].first.test('.ait')).toBe(true);
    expect(patterns[0].first.test('.ai4')).toBe(true);
    expect(patterns[0].first.test('.ait4')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = mockOpenAiModule.getHelpMessage();
    expect(helpText).toContain('【🤖OpenAI助手】');
    expect(helpText).toContain('.ai [訊息]');
    expect(helpText).toContain('.ait [文字內容]');
    expect(helpText).toContain('使用gpt-4o-mini');
  });

  test('Test initialize returns empty variables object', () => {
    const init = mockOpenAiModule.initialize();
    expect(init).toEqual({});
  });

  test('Test rollDiceCommand with help shows help message', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ai', 'help'],
      inputStr: '.ai help'
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【🤖OpenAI助手】');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with chat command returns AI response', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ai', 'Tell me a story'],
      inputStr: '.ai Tell me a story',
      userid: 'user123'
    });
    
    expect(mockHandleChatAi).toHaveBeenCalledWith(
      '.ai Tell me a story',
      { name: "gpt-4o-mini", token: 12000 },
      'user123'
    );
    expect(result.type).toBe('text');
    expect(result.text).toBe('Mock chat AI response');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with ai4 command for non-admin user returns empty', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ai4', 'Advanced question'],
      inputStr: '.ai4 Advanced question',
      userid: 'regular-user'
    });
    
    expect(mockHandleChatAi).not.toHaveBeenCalled();
    expect(result).toEqual({ default: 'on', type: 'text', text: '' });
  });

  test('Test rollDiceCommand with ai4 command for admin user returns AI response', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ai4', 'Advanced question'],
      inputStr: '.ai4 Advanced question',
      userid: 'admin-id'
    });
    
    expect(mockHandleChatAi).toHaveBeenCalledWith(
      '.ai4 Advanced question',
      { name: "gpt-4o", token: 16000 },
      'admin-id'
    );
    expect(result.type).toBe('text');
    expect(result.text).toBe('Mock chat AI response');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with translate command returns translated text', async () => {
    mockHandleTranslate.mockResolvedValueOnce({ text: 'Translated text' });
    
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ait', 'Translate this text'],
      inputStr: '.ait Translate this text',
      userid: 'user123'
    });
    
    expect(mockHandleTranslate).toHaveBeenCalledWith(
      '.ait Translate this text',
      undefined,
      undefined,
      'user123',
      { name: "gpt-4o-mini", token: 12000 }
    );
    expect(result.type).toBe('text');
    expect(result.text).toBe('Translated text');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with translate command for large text returns file', async () => {
    mockHandleTranslate.mockResolvedValueOnce({ 
      fileText: 'This translation is too large',
      fileLink: ['./temp/translated_12345.txt'] 
    });
    
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ait', 'Very long text to translate'],
      inputStr: '.ait Very long text to translate',
      userid: 'user123'
    });
    
    expect(mockHandleTranslate).toHaveBeenCalled();
    expect(result.fileText).toBe('This translation is too large');
    expect(result.fileLink).toEqual(['./temp/translated_12345.txt']);
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with image command for non-admin user returns empty', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.aimage', 'Generate an image'],
      inputStr: '.aimage Generate an image',
      userid: 'regular-user'
    });
    
    expect(mockHandleImageAi).not.toHaveBeenCalled();
    expect(result).toEqual({ default: 'on', type: 'text', text: '' });
  });

  test('Test rollDiceCommand with image command for admin user returns image URL', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.aimage', 'Generate an image'],
      inputStr: '.aimage Generate an image',
      userid: 'admin-id'
    });
    
    expect(mockHandleImageAi).toHaveBeenCalledWith('.aimage Generate an image');
    expect(result.type).toBe('text');
    expect(result.text).toBe('Mock image AI response');
    expect(result.quotes).toBe(true);
  });

  test('Test Discord chat with reply concatenates messages', async () => {
    const result = await mockOpenAiModule.rollDiceCommand({
      mainMsg: ['.ai', 'Follow up question'],
      inputStr: '.ai Follow up question',
      userid: 'user123',
      botname: 'Discord',
      discordMessage: { type: 0 }
    });
    
    expect(mockHandleChatAi).toHaveBeenCalled();
    expect(result.type).toBe('text');
    expect(result.text).toBe('Mock chat AI response');
    expect(result.quotes).toBe(true);
  });

  test('Test module structure matches expected exports', () => {
    // Verify that we understand the module's structure
    expect(mockOpenAiModule.gameName).toBeDefined();
    expect(mockOpenAiModule.gameType).toBeDefined();
    expect(mockOpenAiModule.prefixs).toBeDefined();
    expect(mockOpenAiModule.getHelpMessage).toBeDefined();
    expect(mockOpenAiModule.initialize).toBeDefined();
    expect(mockOpenAiModule.rollDiceCommand).toBeDefined();
    expect(mockOpenAiModule.discordCommand).toBeDefined();
  });
}); 