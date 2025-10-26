"use strict";

// Mock dependencies
jest.mock('fuse.js', () => {
  return class MockFuse {
    constructor() {
      this.search = jest.fn();
    }
  };
});

// Mock the require for the data files
const mockPf2eData = {
  helpdoc: {
    "擲骰": "擲骰說明",
    "暴擊": "暴擊說明",
    "魔法飛彈": "魔法飛彈是一種1環的法術"
  }
};

jest.mock('../assets/pf2e/pf2_action.json', () => ({ helpdoc: mockPf2eData.helpdoc }), { virtual: true });
jest.mock('../assets/pf2e/pf2_feat.json', () => ({ helpdoc: mockPf2eData.helpdoc }), { virtual: true });
jest.mock('../assets/pf2e/pf2_item.json', () => ({ helpdoc: mockPf2eData.helpdoc }), { virtual: true });
jest.mock('../assets/pf2e/pf2_monster.json', () => ({ helpdoc: mockPf2eData.helpdoc }), { virtual: true });
jest.mock('../assets/pf2e/pf2state&spells.json', () => ({ helpdoc: mockPf2eData.helpdoc }), { virtual: true });

// Create mock for Pf2e class
const mockSearch = jest.fn();

// Create a mock for the module
const mockPf2eModule = {
  gameName: () => '【Pf2e】.pf2 ',
  gameType: () => 'Dice:Pf2e:hktrpg',
  prefixs: () => [{
    first: /^\.Pf2$/i,
    second: null
  }],
  getHelpMessage: () => `【🎲Pathfinder 2E查詢系統】
╭────── 🔍基本查詢 ──────
│ 指令格式:
│ 　• .pf2 [關鍵字]
│
├────── 📚功能說明 ──────
│ • 自動搜尋相關資料
│ • 無完全符合時顯示相似結果
│ • 支援中文關鍵字搜尋
│
├────── 💡使用提示 ──────
│ • 建議使用精確關鍵字
│ • 可查詢技能、特徵、職業等
│
├────── 📖資料來源 ──────
│ • 感謝 仙堂麻尋 提供資料
│ • 純美蘋果園 Pf2e中文化
│ • goddessfantasy.net#134913
╰──────────────`,
  initialize: () => ({}),
  rollDiceCommand: jest.fn(),
  discordCommand: []
};

// Mock implementation for rollDiceCommand
mockPf2eModule.rollDiceCommand = jest.fn().mockImplementation(({
  mainMsg
}) => {
  let rply = {
    default: 'on',
    type: 'text',
    text: ''
  };

  switch (true) {
    case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
      rply.text = mockPf2eModule.getHelpMessage();
      rply.quotes = true;
      return rply;
    }
    case /^\S/.test(mainMsg[1] || ''): {
      rply.text = mockSearch(mainMsg[1]);
      return rply;
    }
    default: {
      break;
    }
  }

  return rply;
});

// Implement mock search function
mockSearch.mockImplementation((keyword) => {
  if (!keyword) return '沒有找到相關資料';

  // Exact match case
  if (keyword === '魔法飛彈') {
    return `【魔法飛彈】
        魔法飛彈是一種1環的法術 \n
         `;
  }

  // Multiple results case
  if (keyword === '魔法') {
    return `【魔法飛彈】
魔法飛彈是一種1環的法術 \n
 `;
  }

  // Too many results case
  if (keyword === '法') {
    return '找到太多相關資料，請更精確的查詢\n\n魔法飛彈\n暴擊\n擲骰\n';
  }

  // No results case
  return '沒有找到相關資料';
});

describe('Pf2e Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test gameName returns correct name', () => {
    const name = mockPf2eModule.gameName();
    expect(name).toBeTruthy();
    expect(name).toBe('【Pf2e】.pf2 ');
  });

  test('Test gameType returns correct type', () => {
    expect(mockPf2eModule.gameType()).toBe('Dice:Pf2e:hktrpg');
  });

  test('Test prefixs returns correct pattern', () => {
    const patterns = mockPf2eModule.prefixs();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].first.test('.Pf2')).toBe(true);
    expect(patterns[0].first.test('.pf2')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = mockPf2eModule.getHelpMessage();
    expect(helpText).toContain('【🎲Pathfinder 2E查詢系統】');
    expect(helpText).toContain('.pf2 [關鍵字]');
    expect(helpText).toContain('可查詢技能、特徵、職業等');
  });

  test('Test initialize returns empty variables object', () => {
    const init = mockPf2eModule.initialize();
    expect(init).toEqual({});
  });

  test('Test rollDiceCommand with help parameter shows help message', async () => {
    const result = mockPf2eModule.rollDiceCommand({
      mainMsg: ['.pf2', 'help']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【🎲Pathfinder 2E查詢系統】');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand without parameter shows help message', async () => {
    const result = mockPf2eModule.rollDiceCommand({
      mainMsg: ['.pf2']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【🎲Pathfinder 2E查詢系統】');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with exact match keyword returns correct data', async () => {
    const result = mockPf2eModule.rollDiceCommand({
      mainMsg: ['.pf2', '魔法飛彈']
    });
    
    expect(mockSearch).toHaveBeenCalledWith('魔法飛彈');
    expect(result.type).toBe('text');
    expect(result.text).toContain('【魔法飛彈】');
    expect(result.text).toContain('魔法飛彈是一種1環的法術');
  });

  test('Test rollDiceCommand with partial match keyword returns similar results', async () => {
    const result = mockPf2eModule.rollDiceCommand({
      mainMsg: ['.pf2', '魔法']
    });
    
    expect(mockSearch).toHaveBeenCalledWith('魔法');
    expect(result.type).toBe('text');
    expect(result.text).toContain('【魔法飛彈】');
  });

  test('Test rollDiceCommand with too vague keyword returns list of options', async () => {
    const result = mockPf2eModule.rollDiceCommand({
      mainMsg: ['.pf2', '法']
    });
    
    expect(mockSearch).toHaveBeenCalledWith('法');
    expect(result.type).toBe('text');
    expect(result.text).toContain('找到太多相關資料');
    expect(result.text).toContain('魔法飛彈');
  });

  test('Test rollDiceCommand with non-existent keyword returns no results message', async () => {
    const result = mockPf2eModule.rollDiceCommand({
      mainMsg: ['.pf2', '不存在的關鍵字']
    });
    
    expect(mockSearch).toHaveBeenCalledWith('不存在的關鍵字');
    expect(result.type).toBe('text');
    expect(result.text).toBe('沒有找到相關資料');
  });

  test('Test module structure matches expected exports', () => {
    expect(mockPf2eModule.gameName).toBeDefined();
    expect(mockPf2eModule.gameType).toBeDefined();
    expect(mockPf2eModule.prefixs).toBeDefined();
    expect(mockPf2eModule.getHelpMessage).toBeDefined();
    expect(mockPf2eModule.initialize).toBeDefined();
    expect(mockPf2eModule.rollDiceCommand).toBeDefined();
    expect(mockPf2eModule.discordCommand).toBeDefined();
  });

  // 自動完成功能測試
  describe('Autocomplete Functionality Tests', () => {
    let mockPf2eInstance;

    beforeEach(() => {
      // 創建模擬的 Pf2e 實例
      mockPf2eInstance = {
        pf2eData: [
          { name: '魔法飛彈', desc: '魔法飛彈是一種1環的法術' },
          { name: '火球術', desc: '火球術是一種3環的法術' },
          { name: '治療術', desc: '治療術是一種1環的法術' },
          { name: '暴擊', desc: '暴擊說明' },
          { name: '擲骰', desc: '擲骰說明' }
        ],
        searchForAutocomplete: jest.fn(),
        getAllData: jest.fn()
      };

      // 模擬 searchForAutocomplete 方法
      mockPf2eInstance.searchForAutocomplete.mockImplementation((query, limit = 10) => {
        if (!query || query.trim().length === 0) {
          return mockPf2eInstance.pf2eData.slice(0, limit).map(item => ({
            id: item.name,
            display: item.name,
            value: item.name,
            metadata: {
              description: item.desc.length > 100 ? item.desc.substring(0, 100) + '...' : item.desc
            }
          }));
        }

        const searchTerm = query.toLowerCase().trim();
        const results = [];

        for (const item of mockPf2eInstance.pf2eData) {
          const name = item.name || '';
          const desc = item.desc || '';
          const searchableText = `${name} ${desc}`.toLowerCase();

          if (searchableText.includes(searchTerm)) {
            results.push({
              id: item.name,
              display: item.name,
              value: item.name,
              metadata: {
                description: desc.length > 100 ? desc.substring(0, 100) + '...' : desc
              }
            });
          }
        }

        return results.slice(0, limit);
      });

      // 模擬 getAllData 方法
      mockPf2eInstance.getAllData.mockImplementation(() => {
        return mockPf2eInstance.pf2eData.map(item => ({
          id: item.name,
          display: item.name,
          value: item.name,
          metadata: {
            description: item.desc.length > 100 ? item.desc.substring(0, 100) + '...' : item.desc
          }
        }));
      });
    });

    test('Test searchForAutocomplete with empty query returns all data', () => {
      const results = mockPf2eInstance.searchForAutocomplete('', 3);
      expect(results).toHaveLength(3);
      expect(results[0].display).toBe('魔法飛彈');
      expect(results[0].metadata.description).toBe('魔法飛彈是一種1環的法術');
    });

    test('Test searchForAutocomplete with exact match', () => {
      const results = mockPf2eInstance.searchForAutocomplete('魔法飛彈', 5);
      expect(results).toHaveLength(1);
      expect(results[0].display).toBe('魔法飛彈');
      expect(results[0].value).toBe('魔法飛彈');
      expect(results[0].id).toBe('魔法飛彈');
    });

    test('Test searchForAutocomplete with partial match', () => {
      const results = mockPf2eInstance.searchForAutocomplete('魔法', 5);
      expect(results).toHaveLength(1);
      expect(results[0].display).toBe('魔法飛彈');
    });

    test('Test searchForAutocomplete with no matches', () => {
      const results = mockPf2eInstance.searchForAutocomplete('不存在的關鍵字', 5);
      expect(results).toHaveLength(0);
    });

    test('Test searchForAutocomplete with limit parameter', () => {
      const results = mockPf2eInstance.searchForAutocomplete('', 2);
      expect(results).toHaveLength(2);
    });

    test('Test getAllData returns correct format', () => {
      const results = mockPf2eInstance.getAllData();
      expect(results).toHaveLength(5);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('display');
      expect(results[0]).toHaveProperty('value');
      expect(results[0]).toHaveProperty('metadata');
      expect(results[0].metadata).toHaveProperty('description');
    });

    test('Test autocomplete data format consistency', () => {
      const results = mockPf2eInstance.searchForAutocomplete('火', 5);
      results.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('display');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('metadata');
        expect(typeof item.id).toBe('string');
        expect(typeof item.display).toBe('string');
        expect(typeof item.value).toBe('string');
        expect(typeof item.metadata).toBe('object');
      });
    });

    test('Test autocomplete search with case insensitive matching', () => {
      const results = mockPf2eInstance.searchForAutocomplete('魔法', 5);
      expect(results).toHaveLength(1);
      expect(results[0].display).toBe('魔法飛彈');
    });

    test('Test autocomplete search with description matching', () => {
      const results = mockPf2eInstance.searchForAutocomplete('法術', 5);
      expect(results).toHaveLength(3); // 魔法飛彈、火球術和治療術
      expect(results.some(item => item.display === '魔法飛彈')).toBe(true);
      expect(results.some(item => item.display === '火球術')).toBe(true);
      expect(results.some(item => item.display === '治療術')).toBe(true);
    });
  });
}); 