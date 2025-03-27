"use strict";

// Mock dependencies
jest.mock('chinese-conv', () => ({
  tify: jest.fn(text => text)
}));

jest.mock('@zetetic/duckduckgo-images-api', () => ({
  image_search: jest.fn()
}));

jest.mock('wikijs', () => ({
  default: jest.fn().mockReturnValue({
    page: jest.fn()
  })
}));

jest.mock('@vitalets/google-translate-api', () => ({
  translate: jest.fn()
}));

jest.mock('../modules/schema.js', () => ({
  translateChannel: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

jest.mock('../modules/veryImportantPerson', () => ({
  viplevelCheckGroup: jest.fn()
}));

jest.mock('../modules/translate', () => ({
  translateSwitchOn: jest.fn(),
  translateSwitchOff: jest.fn()
}));

jest.mock('./rollbase.js', () => ({
  Dice: jest.fn()
}));

// Import the module after mocking
const asyncModule = require('../roll/z_async_test.js');
const wiki = require('wikijs').default;
const duckImage = require('@zetetic/duckduckgo-images-api');
const translate = require('@vitalets/google-translate-api').translate;
const rollbase = require('./rollbase.js');

describe('Async Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    expect(asyncModule.gameName()).toBe('【Wiki查詢/圖片搜索】 .wiki .image .tran');
  });

  test('Test gameType returns correct type', () => {
    expect(asyncModule.gameType()).toBe('funny:Wiki:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = asyncModule.prefixs();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBe(1);
    expect(patterns[0].first).toBeInstanceOf(RegExp);
    expect(patterns[0].first.test('.wiki')).toBe(true);
    expect(patterns[0].first.test('.image')).toBe(true);
    expect(patterns[0].first.test('.tran')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', async () => {
    const helpText = await asyncModule.getHelpMessage();
    expect(helpText).toContain('【🔍Wiki查詢與翻譯系統】');
    expect(helpText).toContain('維基查詢');
    expect(helpText).toContain('圖片搜尋');
    expect(helpText).toContain('即時翻譯');
  });

  test('Test initialize returns empty variables object', () => {
    expect(asyncModule.initialize()).toEqual({});
  });

  describe('Wiki Search Tests', () => {
    test('Test wiki search with valid article', async () => {
      const mockPage = {
        summary: jest.fn().mockResolvedValue('Test article summary')
      };
      wiki.default().page.mockResolvedValue(mockPage);

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.wiki', 'test_article']
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('Test article summary');
    });

    test('Test wiki search with non-existent article', async () => {
      wiki.default().page.mockRejectedValue('Error: No article found');

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.wiki', 'nonexistent']
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('沒有此條目');
    });
  });

  describe('Translation Tests', () => {
    test('Test basic translation to Traditional Chinese', async () => {
      translate.mockResolvedValue({ text: '翻譯後的文字' });

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.tran', 'Hello World'],
        inputStr: '.tran Hello World'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('翻譯後的文字');
    });

    test('Test translation with specific language code', async () => {
      translate.mockResolvedValue({ text: 'Translated text' });

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.tran.en', '你好'],
        inputStr: '.tran.en 你好'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('Translated text');
    });

    test('Test translation with language name', async () => {
      translate.mockResolvedValue({ text: '翻訳されたテキスト' });

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.tran.日文', '你好'],
        inputStr: '.tran.日文 你好'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('翻訳されたテキスト');
    });

    test('Test translation error handling', async () => {
      translate.mockRejectedValue({ message: 'Translation error' });

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.tran', 'Hello'],
        inputStr: '.tran Hello'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('Translation error');
    });
  });

  describe('Image Search Tests', () => {
    test('Test image search with valid query', async () => {
      const mockImages = [
        { image: 'image1.jpg' },
        { image: 'image2.jpg' }
      ];
      duckImage.image_search.mockResolvedValue(mockImages);
      rollbase.Dice.mockReturnValue(1);

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.image', 'cats'],
        inputStr: '.image cats'
      });

      expect(result.type).toBe('image');
      expect(result.text).toBe('image1.jpg');
    });

    test('Test image search with no results', async () => {
      duckImage.image_search.mockResolvedValue([]);

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.image', 'nonexistent'],
        inputStr: '.image nonexistent'
      });

      expect(result.type).toBe('image');
      expect(result.text).toBe('沒有結果');
    });

    test('Test image search with yesno query', async () => {
      const mockImages = [
        { image: 'yes.gif' },
        { image: 'no.gif' }
      ];
      duckImage.image_search.mockResolvedValue(mockImages);
      rollbase.Dice.mockReturnValue(1);

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.image', 'yesno'],
        inputStr: '.image yesno'
      });

      expect(result.type).toBe('image');
      expect(result.text).toBe('yes.gif');
    });

    test('Test image search error handling', async () => {
      duckImage.image_search.mockRejectedValue(new Error('Search failed'));

      const result = await asyncModule.rollDiceCommand({
        mainMsg: ['.image', 'test'],
        inputStr: '.image test'
      });

      expect(result.type).toBe('text');
      expect(result.text).toBe('');
    });
  });

  test('Test help command', async () => {
    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.wiki', 'help']
    });

    expect(result.type).toBe('text');
    expect(result.text).toBe(await asyncModule.getHelpMessage());
  });
}); 