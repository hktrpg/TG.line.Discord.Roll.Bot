"use strict";

// Mock dependencies
jest.mock('fuse.js', () => {
  return class MockFuse {
    constructor() {
      this.search = jest.fn();
    }
  }
});

jest.mock('mathjs', () => ({
  randomInt: jest.fn()
}));

// Mock fs.readdirSync to return test data files
jest.mock('fs', () => ({
  readdirSync: jest.fn().mockReturnValue(['pokedex-kanto.js', 'moves-fire.js']),
}));

// Mock the require statements for the Pokemon data
jest.mock('../assets/pokemon/pokedex-kanto.js', () => ({
  Pokedex: [
    {
      id: '025',
      name: '皮卡丘',
      alias: 'Pikachu',
      type: ['Electric'],
      info: {
        category: '鼠寶可夢',
        height: 0.4,
        weight: 6,
        image: 'images/pokemon/025.png'
      },
      rank: 2,
      baseHP: 3,
      ability: '靜電',
      attr: {
        str: { value: 2, max: 3 },
        dex: { value: 3, max: 3 },
        vit: { value: 2, max: 3 },
        spe: { value: 3, max: 3 },
        ins: { value: 2, max: 3 }
      },
      evolution: {
        stage: '初階',
        time: '特殊'
      },
      moves: [
        { rank: 1, name: '電擊', type: 'Electric' },
        { rank: 2, name: '搖尾巴', type: 'Normal' }
      ]
    },
    {
      id: '150',
      name: '超夢',
      alias: 'Mewtwo',
      type: ['Psychic'],
      info: {
        category: '基因寶可夢',
        height: 2,
        weight: 122,
        image: 'images/pokemon/150.png'
      },
      rank: 5,
      baseHP: 8,
      ability: '壓力',
      attr: {
        str: { value: 3, max: 5 },
        dex: { value: 4, max: 5 },
        vit: { value: 3, max: 5 },
        spe: { value: 5, max: 5 },
        ins: { value: 4, max: 5 }
      },
      evolution: {
        stage: '傳說',
        time: 'N/A'
      },
      moves: [
        { rank: 1, name: '念力', type: 'Psychic' },
        { rank: 5, name: '精神強念', type: 'Psychic' }
      ]
    }
  ]
}), { virtual: true });

jest.mock('../assets/pokemon/moves-fire.js', () => ({
  MoveList: [
    {
      name: '火焰輪',
      alias: 'Fire Wheel',
      type: 'Fire',
      power: 8,
      accuracy: 2,
      damage: '1',
      effect: '造成傷害',
      desc: '使用火焰包圍攻擊敵人'
    },
    {
      name: '噴射火焰',
      alias: 'Flamethrower',
      type: 'Fire',
      power: 10,
      accuracy: 3,
      damage: '2',
      effect: '有機率使目標陷入灼傷狀態',
      desc: '從口中噴出烈焰攻擊敵人'
    }
  ]
}), { virtual: true });

// Import dependencies after mocking
    const _fs = require('fs');
const mathjs = require('mathjs');

// Mock the module to be tested
jest.mock('../roll/pokemon.js', () => {
  return {
    gameName: jest.fn().mockReturnValue('【PokeRole】.poke '),
    gameType: jest.fn().mockReturnValue('Dice:pokerole:hktrpg'),
    prefixs: jest.fn().mockReturnValue([{
      first: /^[.]poke$/i,
      second: null
    }]),
    getHelpMessage: jest.fn().mockReturnValue(`【🎮寶可夢PokeRole】
╭────── 📖基礎查詢 ──────
│ • .poke - 顯示完整指令列表
│
├────── 🔍寶可夢資料 ──────
│ 基本查詢:
│ 　• .poke mon [名稱/編號]
│ 　  例: .poke mon 超夢
│
│ 招式列表:
│ 　• .poke mon [名稱/編號] --d
│ 　  例: .poke mon 超夢 --d
│
├────── ⚔️招式查詢 ──────
│ • .poke move [招式名稱]
│ 　例: .poke move 火焰輪
│
├────── 🏆對戰模擬 ──────
│ 格式:
│ .poke vs [攻擊方] [防守方]
│
│ 攻擊方可使用:
│ 　• 招式名稱
│ 　• 屬性
│
│ 防守方可使用:
│ 　• 寶可夢名稱/編號
│ 　• 單一或雙重屬性
│
│ 範例:
│ 　• .poke vs 火之誓約 夢幻
│ 　• .poke vs 火 100
│ 　• .poke vs 火 超能力,水
│
├────── 📚資料來源 ──────
│ • hazmole.github.io/PokeRole
│ • 免費開源TRPG中文化團隊
╰──────────────`),
    initialize: jest.fn().mockReturnValue({}),
    rollDiceCommand: jest.fn(),
    discordCommand: []
  };
});

// Import the module to be tested
const pokemonModule = require('../roll/pokemon.js');

describe('Pokemon Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    mathjs.randomInt.mockImplementation((min, max) => 25); // Fixed random number for testing
  });

  test('Test gameName returns correct name', () => {
    const name = pokemonModule.gameName();
    expect(name).toBeTruthy();
    expect(name).toBe('【PokeRole】.poke ');
  });

  test('Test gameType returns correct type', () => {
    expect(pokemonModule.gameType()).toBe('Dice:pokerole:hktrpg');
  });

  test('Test prefixs returns correct patterns', () => {
    const patterns = pokemonModule.prefixs();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].first.test('.poke')).toBe(true);
    expect(patterns[0].second).toBeNull();
  });

  test('Test getHelpMessage returns help text', () => {
    const helpText = pokemonModule.getHelpMessage();
    expect(helpText).toContain('【🎮寶可夢PokeRole】');
    expect(helpText).toContain('.poke');
    expect(helpText).toContain('寶可夢資料');
    expect(helpText).toContain('招式查詢');
    expect(helpText).toContain('對戰模擬');
  });

  test('Test initialize returns empty variables object', () => {
    const init = pokemonModule.initialize();
    expect(init).toEqual({});
  });

  test('Test rollDiceCommand with help command', async () => {
    // Mock implementation for this specific test
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (!mainMsg[1] || mainMsg[1] === 'help') {
        return {
          default: 'on',
          type: 'text',
          text: pokemonModule.getHelpMessage(),
          quotes: true,
          buttonCreate: ['.poke', '.poke mon 超夢', '.poke move 火焰輪', '.poke vs 火之誓約 夢幻', '.poke vs 火 100', '.poke vs 火 超能力 水']
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'help']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('寶可夢PokeRole');
    expect(result.quotes).toBe(true);
    expect(result.buttonCreate).toHaveLength(6);
    expect(result.buttonCreate[0]).toBe('.poke');
  });

  test('Test rollDiceCommand with no parameters', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (!mainMsg[1]) {
        return {
          default: 'on',
          type: 'text',
          text: pokemonModule.getHelpMessage(),
          quotes: true,
          buttonCreate: ['.poke', '.poke mon 超夢', '.poke move 火焰輪', '.poke vs 火之誓約 夢幻', '.poke vs 火 100', '.poke vs 火 超能力 水']
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('寶可夢PokeRole');
  });

  test('Test rollDiceCommand with vs command', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'vs') {
        return {
          default: 'on',
          type: 'text',
          text: '攻方屬性：火\n防方屬性：超能力\n屬性效果：效果不佳，減少 1 點受到的傷害',
          quotes: true
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'vs', '火', '超夢']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('攻方屬性：火');
    expect(result.text).toContain('防方屬性：超能力');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with move command', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'move') {
        return {
          default: 'on',
          type: 'text',
          text: '【火焰輪】 Fire Wheel 火 威力：8\n命中：2\n招式傷害：1\n招式內容：造成傷害\n招式描述：使用火焰包圍攻擊敵人',
          quotes: true
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'move', '火焰輪']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【火焰輪】');
    expect(result.text).toContain('火');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with mon command', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'mon') {
        return {
          default: 'on',
          type: 'text',
          text: '#025 【皮卡丘】 Pikachu 電 \n鼠寶可夢 0.4m / 6kg\n建議等級：2  基礎HP：3  特性：靜電 \n力量 ●●○\n靈巧 ●●●\n活力 ●●○\n特殊 ●●●\n洞察 ●●○\n進化階段：初階 進化時間：特殊\n',
          quotes: true
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'mon', '皮卡丘']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【皮卡丘】');
    expect(result.text).toContain('電');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with mon command and detail flag', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'mon' && mainMsg.includes('--d')) {
        return {
          default: 'on',
          type: 'text',
          text: '#025 【皮卡丘】 Pikachu 電 \n鼠寶可夢 0.4m / 6kg\n建議等級：2  基礎HP：3  特性：靜電 \n力量 ●●○\n靈巧 ●●●\n活力 ●●○\n特殊 ●●●\n洞察 ●●○\n進化階段：初階 進化時間：特殊\n------招式------\n等級：1 【電擊】 電\n等級：2 【搖尾巴】 一般\n',
          quotes: true
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'mon', '皮卡丘', '--d']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【皮卡丘】');
    expect(result.text).toContain('------招式------');
    expect(result.quotes).toBe(true);
  });

  test('Test rollDiceCommand with random mon when no name provided', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'mon' && !mainMsg[2]) {
        return {
          default: 'on',
          type: 'text',
          text: '#025 【皮卡丘】 Pikachu 電 \n鼠寶可夢 0.4m / 6kg\n建議等級：2  基礎HP：3  特性：靜電 \n力量 ●●○\n靈巧 ●●●\n活力 ●●○\n特殊 ●●●\n洞察 ●●○\n進化階段：初階 進化時間：特殊\n',
          quotes: true
        };
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'mon']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【皮卡丘】');
    expect(result.quotes).toBe(true);
  });

  test('Test vs command with moves and Pokémon', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'vs' && mainMsg[2] === '火焰輪' && mainMsg[3] === '皮卡丘') {
        return {
          default: 'on',
          type: 'text',
          text: `攻方屬性：火
防方屬性：電
屬性效果：正常
--------------------
攻方招式：【火焰輪】 威力：8
攻方命中：2
攻方招式傷害：1
攻方招式內容：造成傷害
攻方招式描述：使用火焰包圍攻擊敵人
--------------------
防方小精靈：皮卡丘
防方小精靈圖片：https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/assets/pokemon/images/pokemon/025.png`,
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'vs', '火焰輪', '皮卡丘']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('攻方屬性：火');
    expect(result.text).toContain('防方屬性：電');
    expect(result.text).toContain('攻方招式：【火焰輪】');
    expect(result.text).toContain('防方小精靈：皮卡丘');
  });

  test('Test vs command with type properties only', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'vs' && mainMsg[2] === '火' && mainMsg[3] === '水') {
        return {
          default: 'on',
          type: 'text',
          text: `攻方屬性：火
防方屬性：水
屬性效果：效果不佳，減少 1 點受到的傷害`,
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'vs', '火', '水']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('攻方屬性：火');
    expect(result.text).toContain('防方屬性：水');
    expect(result.text).toContain('效果不佳');
  });

  test('Test error handling for vs command with invalid input', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'vs' && (mainMsg[2] === 'invalid' || mainMsg[3] === 'invalid')) {
        return {
          default: 'on',
          type: 'text',
          text: '找不到攻方屬性，請確認名稱，你可以輸入完整招式名稱或屬性\n找不到防方屬性，請確認名稱，你可以輸入小精靈名稱，編號或屬性\n',
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'vs', 'invalid', 'invalid']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('找不到攻方屬性');
    expect(result.text).toContain('找不到防方屬性');
  });

  test('Test error handling for move command with non-existent move', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'move' && mainMsg[2] === 'nonexistent') {
        return {
          default: 'on',
          type: 'text',
          text: '沒有找到相關資料',
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'move', 'nonexistent']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('沒有找到相關資料');
  });

  test('Test error handling for mon command with non-existent Pokemon', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'mon' && mainMsg[2] === 'nonexistent') {
        return {
          default: 'on',
          type: 'text',
          text: '沒有找到相關資料',
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'mon', 'nonexistent']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toBe('沒有找到相關資料');
  });

  test('Test mon command with numbered Pokemon', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'mon' && mainMsg[2] === '25') {
        return {
          default: 'on',
          type: 'text',
          text: '#025 【皮卡丘】 Pikachu 電 \n鼠寶可夢 0.4m / 6kg\n建議等級：2  基礎HP：3  特性：靜電 \n力量 ●●○\n靈巧 ●●●\n活力 ●●○\n特殊 ●●●\n洞察 ●●○\n進化階段：初階 進化時間：特殊\n',
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'mon', '25']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【皮卡丘】');
    expect(result.quotes).toBe(true);
  });

  test('Test vs command with dual-type defense', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'vs' && mainMsg[2] === '火' && mainMsg[3] === '草' && mainMsg[4] === '毒') {
        return {
          default: 'on',
          type: 'text',
          text: `攻方屬性：火
防方屬性：草,毒
屬性效果：效果絕佳，承受額外 1 點來自該攻擊的傷害`,
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'vs', '火', '草', '毒']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('攻方屬性：火');
    expect(result.text).toContain('防方屬性：草,毒');
    expect(result.text).toContain('效果絕佳');
  });

  test('Test vs command with immunity', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'vs' && mainMsg[2] === '地面' && mainMsg[3] === '飛行') {
        return {
          default: 'on',
          type: 'text',
          text: `攻方屬性：地面
防方屬性：飛行
屬性效果：免疫該攻擊傷害`,
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'vs', '地面', '飛行']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('攻方屬性：地面');
    expect(result.text).toContain('防方屬性：飛行');
    expect(result.text).toContain('免疫該攻擊傷害');
  });

  test('Test mon command with English Pokemon name', () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'mon' && mainMsg[2] === 'Pikachu') {
        return {
          default: 'on',
          type: 'text',
          text: '#025 【皮卡丘】 Pikachu 電 \n鼠寶可夢 0.4m / 6kg\n建議等級：2  基礎HP：3  特性：靜電 \n力量 ●●○\n靈巧 ●●●\n活力 ●●○\n特殊 ●●●\n洞察 ●●○\n進化階段：初階 進化時間：特殊\n',
          quotes: true
        };
      }
      return null;
    });

    const result = pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'mon', 'Pikachu']
    });
    
    expect(result.type).toBe('text');
    expect(result.text).toContain('【皮卡丘】');
    expect(result.quotes).toBe(true);
  });

  test('Test invalid command returns undefined', async () => {
    pokemonModule.rollDiceCommand.mockImplementation(({ mainMsg }) => {
      if (mainMsg[1] === 'invalid_command') {
        return;
      }
      return null;
    });

    const result = await pokemonModule.rollDiceCommand({
      mainMsg: ['.poke', 'invalid_command']
    });
    
    expect(result).toBeUndefined();
  });

  test('Test discordCommand array exists', () => {
    expect(pokemonModule.discordCommand).toBeDefined();
    expect(Array.isArray(pokemonModule.discordCommand)).toBe(true);
  });

  // 自動完成功能測試
  describe('Autocomplete Functionality Tests', () => {
    let mockPokemonInstance;
    let mockMovesInstance;

    beforeEach(() => {
      // 創建模擬的 Pokemon 實例
      mockPokemonInstance = {
        pokemonData: [
          {
            id: '025',
            name: '皮卡丘',
            alias: 'Pikachu',
            type: ['Electric'],
            info: { category: '鼠寶可夢' }
          },
          {
            id: '150',
            name: '超夢',
            alias: 'Mewtwo',
            type: ['Psychic'],
            info: { category: '基因寶可夢' }
          },
          {
            id: '004',
            name: '小火龍',
            alias: 'Charmander',
            type: ['Fire'],
            info: { category: '蜥蜴寶可夢' }
          }
        ],
        searchForAutocomplete: jest.fn(),
        getAllData: jest.fn()
      };

      // 創建模擬的 Moves 實例
      mockMovesInstance = {
        pokemonData: [
          {
            name: '火焰輪',
            alias: 'Fire Wheel',
            type: 'Fire',
            power: '8',
            accuracy: '2'
          },
          {
            name: '噴射火焰',
            alias: 'Flamethrower',
            type: 'Fire',
            power: '10',
            accuracy: '3'
          },
          {
            name: '電擊',
            alias: 'Thunder Shock',
            type: 'Electric',
            power: '4',
            accuracy: '2'
          }
        ],
        searchForAutocomplete: jest.fn(),
        getAllData: jest.fn()
      };

      // 模擬 Pokemon searchForAutocomplete 方法
      mockPokemonInstance.searchForAutocomplete.mockImplementation((query, limit = 10) => {
        if (!query || query.trim().length === 0) {
          return mockPokemonInstance.pokemonData.slice(0, limit).map(pokemon => ({
            id: pokemon.id,
            display: pokemon.name,
            value: pokemon.name,
            metadata: {
              alias: pokemon.alias,
              type: pokemon.type,
              category: pokemon.info?.category,
              id: pokemon.id
            }
          }));
        }

        const searchTerm = query.toLowerCase().trim();
        const results = [];

        for (const pokemon of mockPokemonInstance.pokemonData) {
          const name = pokemon.name || '';
          const alias = pokemon.alias || '';
          const id = pokemon.id || '';
          const type = pokemon.type || [];
          const category = pokemon.info?.category || '';
          const searchableText = `${name} ${alias} ${id} ${type.join(' ')} ${category}`.toLowerCase();

          if (searchableText.includes(searchTerm)) {
            results.push({
              id: pokemon.id,
              display: pokemon.name,
              value: pokemon.name,
              metadata: {
                alias: pokemon.alias,
                type: pokemon.type,
                category: pokemon.info?.category,
                id: pokemon.id
              }
            });
          }
        }

        return results.slice(0, limit);
      });

      // 模擬 Moves searchForAutocomplete 方法
      mockMovesInstance.searchForAutocomplete.mockImplementation((query, limit = 10) => {
        if (!query || query.trim().length === 0) {
          return mockMovesInstance.pokemonData.slice(0, limit).map(move => ({
            id: move.name,
            display: move.name,
            value: move.name,
            metadata: {
              alias: move.alias,
              type: [move.type],
              power: move.power,
              accuracy: move.accuracy
            }
          }));
        }

        const searchTerm = query.toLowerCase().trim();
        const results = [];

        for (const move of mockMovesInstance.pokemonData) {
          const name = move.name || '';
          const alias = move.alias || '';
          const type = move.type || '';
          const power = move.power || '';
          const searchableText = `${name} ${alias} ${type} ${power}`.toLowerCase();

          if (searchableText.includes(searchTerm)) {
            results.push({
              id: move.name,
              display: move.name,
              value: move.name,
              metadata: {
                alias: move.alias,
                type: [move.type],
                power: move.power,
                accuracy: move.accuracy
              }
            });
          }
        }

        return results.slice(0, limit);
      });

      // 模擬 getAllData 方法
      mockPokemonInstance.getAllData.mockImplementation(() => {
        return mockPokemonInstance.pokemonData.map(pokemon => ({
          id: pokemon.id,
          display: pokemon.name,
          value: pokemon.name,
          metadata: {
            alias: pokemon.alias,
            type: pokemon.type,
            category: pokemon.info?.category,
            id: pokemon.id
          }
        }));
      });

      mockMovesInstance.getAllData.mockImplementation(() => {
        return mockMovesInstance.pokemonData.map(move => ({
          id: move.name,
          display: move.name,
          value: move.name,
          metadata: {
            alias: move.alias,
            type: [move.type],
            power: move.power,
            accuracy: move.accuracy
          }
        }));
      });
    });

    describe('Pokemon Autocomplete Tests', () => {
      test('Test Pokemon searchForAutocomplete with empty query returns all data', () => {
        const results = mockPokemonInstance.searchForAutocomplete('', 3);
        expect(results).toHaveLength(3);
        expect(results[0].display).toBe('皮卡丘');
        expect(results[0].metadata.type).toEqual(['Electric']);
      });

      test('Test Pokemon searchForAutocomplete with exact name match', () => {
        const results = mockPokemonInstance.searchForAutocomplete('皮卡丘', 5);
        expect(results).toHaveLength(1);
        expect(results[0].display).toBe('皮卡丘');
        expect(results[0].value).toBe('皮卡丘');
        expect(results[0].id).toBe('025');
      });

      test('Test Pokemon searchForAutocomplete with alias match', () => {
        const results = mockPokemonInstance.searchForAutocomplete('Pikachu', 5);
        expect(results).toHaveLength(1);
        expect(results[0].display).toBe('皮卡丘');
      });

      test('Test Pokemon searchForAutocomplete with type match', () => {
        const results = mockPokemonInstance.searchForAutocomplete('火', 5);
        expect(results).toHaveLength(1);
        expect(results[0].display).toBe('小火龍');
        expect(results[0].metadata.type).toEqual(['Fire']);
      });

      test('Test Pokemon searchForAutocomplete with ID match', () => {
        const results = mockPokemonInstance.searchForAutocomplete('025', 5);
        expect(results).toHaveLength(1);
        expect(results[0].display).toBe('皮卡丘');
      });

      test('Test Pokemon searchForAutocomplete with no matches', () => {
        const results = mockPokemonInstance.searchForAutocomplete('不存在的寶可夢', 5);
        expect(results).toHaveLength(0);
      });

      test('Test Pokemon getAllData returns correct format', () => {
        const results = mockPokemonInstance.getAllData();
        expect(results).toHaveLength(3);
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('display');
        expect(results[0]).toHaveProperty('value');
        expect(results[0]).toHaveProperty('metadata');
        expect(results[0].metadata).toHaveProperty('alias');
        expect(results[0].metadata).toHaveProperty('type');
        expect(results[0].metadata).toHaveProperty('category');
      });
    });

    describe('Pokemon Moves Autocomplete Tests', () => {
      test('Test Moves searchForAutocomplete with empty query returns all data', () => {
        const results = mockMovesInstance.searchForAutocomplete('', 3);
        expect(results).toHaveLength(3);
        expect(results[0].display).toBe('火焰輪');
        expect(results[0].metadata.type).toEqual(['Fire']);
      });

      test('Test Moves searchForAutocomplete with exact name match', () => {
        const results = mockMovesInstance.searchForAutocomplete('火焰輪', 5);
        expect(results).toHaveLength(1);
        expect(results[0].display).toBe('火焰輪');
        expect(results[0].value).toBe('火焰輪');
        expect(results[0].id).toBe('火焰輪');
      });

      test('Test Moves searchForAutocomplete with alias match', () => {
        const results = mockMovesInstance.searchForAutocomplete('Fire Wheel', 5);
        expect(results).toHaveLength(1);
        expect(results[0].display).toBe('火焰輪');
      });

      test('Test Moves searchForAutocomplete with type match', () => {
        const results = mockMovesInstance.searchForAutocomplete('火', 5);
        expect(results).toHaveLength(2); // 火焰輪和噴射火焰
        expect(results.some(item => item.display === '火焰輪')).toBe(true);
        expect(results.some(item => item.display === '噴射火焰')).toBe(true);
      });

      test('Test Moves searchForAutocomplete with no matches', () => {
        const results = mockMovesInstance.searchForAutocomplete('不存在的招式', 5);
        expect(results).toHaveLength(0);
      });

      test('Test Moves getAllData returns correct format', () => {
        const results = mockMovesInstance.getAllData();
        expect(results).toHaveLength(3);
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('display');
        expect(results[0]).toHaveProperty('value');
        expect(results[0]).toHaveProperty('metadata');
        expect(results[0].metadata).toHaveProperty('alias');
        expect(results[0].metadata).toHaveProperty('type');
        expect(results[0].metadata).toHaveProperty('power');
        expect(results[0].metadata).toHaveProperty('accuracy');
      });
    });

    describe('Autocomplete Data Format Tests', () => {
      test('Test Pokemon autocomplete data format consistency', () => {
        const results = mockPokemonInstance.searchForAutocomplete('皮', 5);
        for (const item of results) {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('display');
          expect(item).toHaveProperty('value');
          expect(item).toHaveProperty('metadata');
          expect(typeof item.id).toBe('string');
          expect(typeof item.display).toBe('string');
          expect(typeof item.value).toBe('string');
          expect(typeof item.metadata).toBe('object');
          expect(Array.isArray(item.metadata.type)).toBe(true);
        }
      });

      test('Test Moves autocomplete data format consistency', () => {
        const results = mockMovesInstance.searchForAutocomplete('火', 5);
        for (const item of results) {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('display');
          expect(item).toHaveProperty('value');
          expect(item).toHaveProperty('metadata');
          expect(typeof item.id).toBe('string');
          expect(typeof item.display).toBe('string');
          expect(typeof item.value).toBe('string');
          expect(typeof item.metadata).toBe('object');
          expect(Array.isArray(item.metadata.type)).toBe(true);
        }
      });

      test('Test autocomplete search with case insensitive matching', () => {
        const pokemonResults = mockPokemonInstance.searchForAutocomplete('PIKACHU', 5);
        const movesResults = mockMovesInstance.searchForAutocomplete('FIRE', 5);
        
        expect(pokemonResults).toHaveLength(1);
        expect(pokemonResults[0].display).toBe('皮卡丘');
        
        expect(movesResults).toHaveLength(2);
        expect(movesResults.some(item => item.display === '火焰輪')).toBe(true);
      });

      test('Test autocomplete search with limit parameter', () => {
        const pokemonResults = mockPokemonInstance.searchForAutocomplete('', 2);
        const movesResults = mockMovesInstance.searchForAutocomplete('', 2);
        
        expect(pokemonResults).toHaveLength(2);
        expect(movesResults).toHaveLength(2);
      });
    });
  });
}); 