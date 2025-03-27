"use strict";

// Mock dependencies
jest.mock('chinese-conv', () => ({
  tify: jest.fn(text => text)
}));

jest.mock('@zetetic/duckduckgo-images-api', () => ({
  image_search: jest.fn()
}));

jest.mock('wikijs', () => {
  const mockWiki = jest.fn();
  mockWiki.mockReturnValue({
    page: jest.fn()
  });
  return {
    default: mockWiki
  };
});

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

jest.mock('../roll/rollbase.js', () => ({
  Dice: jest.fn()
}));

// Import the module after mocking
const asyncModule = require('../roll/z_async_test.js');
const chineseConv = require('chinese-conv');
const duckImage = require('@zetetic/duckduckgo-images-api');
const wiki = require('wikijs').default;
const translate = require('@vitalets/google-translate-api').translate;
const rollbase = require('../roll/rollbase.js');

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
    expect(helpText).toContain('Wiki查詢與翻譯系統');
    expect(helpText).toContain('維基查詢');
    expect(helpText).toContain('圖片搜尋');
    expect(helpText).toContain('即時翻譯');
  });

  test('Test initialize returns empty variables object', () => {
    expect(asyncModule.initialize()).toEqual({});
  });

  test('Test wiki search command', async () => {
    const mockPage = {
      summary: jest.fn().mockResolvedValue('Test summary')
    };
    const mockWikiInstance = wiki();
    mockWikiInstance.page.mockResolvedValue(mockPage);

    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.wiki', 'test'],
      inputStr: '.wiki test'
    });

    expect(result.type).toBe('text');
    expect(result.text).toBe('Test summary');
    expect(wiki).toHaveBeenCalledWith({
      apiUrl: 'https://zh.wikipedia.org/w/api.php'
    });
  });

  test('Test wiki search command with no results', async () => {
    const mockWikiInstance = wiki();
    mockWikiInstance.page.mockRejectedValue('Error: No article found');

    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.wiki', 'nonexistent'],
      inputStr: '.wiki nonexistent'
    });

    expect(result.type).toBe('text');
    expect(result.text).toBe('沒有此條目');
  });

  test('Test basic translation command', async () => {
    translate.mockResolvedValue({ text: 'Translated text' });

    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.tran', 'Hello'],
      inputStr: '.tran Hello'
    });

    expect(result.type).toBe('text');
    expect(result.text).toBe('Translated text');
    expect(translate).toHaveBeenCalledWith(' Hello', { to: 'zh-TW' });
  });

  test('Test translation command with specific language', async () => {
    translate.mockResolvedValue({ text: 'Translated text' });

    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.tran.ja', 'Hello'],
      inputStr: '.tran.ja Hello'
    });

    expect(result.type).toBe('text');
    expect(result.text).toBe('Translated text');
    expect(translate).toHaveBeenCalledWith(' Hello', { to: 'ja' });
  });

  test('Test image search command', async () => {
    const mockImages = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' }
    ];
    duckImage.image_search.mockResolvedValue(mockImages);
    rollbase.Dice.mockReturnValue(1);

    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.image', 'cat'],
      inputStr: '.image cat'
    });

    expect(result.type).toBe('image');
    expect(result.text).toBe('image1.jpg');
    expect(duckImage.image_search).toHaveBeenCalledWith({
      query: 'cat',
      moderate: true
    });
  });

  test('Test image search command with yesno', async () => {
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
    expect(duckImage.image_search).toHaveBeenCalledWith({
      query: 'yes GIF',
      moderate: true
    });
  });

  test('Test image search command with no results', async () => {
    duckImage.image_search.mockResolvedValue([]);

    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.image', 'nonexistent'],
      inputStr: '.image nonexistent'
    });

    expect(result.type).toBe('image');
    expect(result.text).toBe('沒有結果');
  });

  test('Test help command', async () => {
    const result = await asyncModule.rollDiceCommand({
      mainMsg: ['.wiki', 'help']
    });

    expect(result.type).toBe('text');
    expect(result.text).toBe(await asyncModule.getHelpMessage());
  });
}); 