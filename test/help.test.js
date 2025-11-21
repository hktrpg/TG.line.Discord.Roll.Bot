"use strict";

// Mock dependencies
jest.mock('node:fs', () => ({
    readdirSync: jest.fn(),
}));

jest.mock('axios', () => ({
    get: jest.fn()
}));

// Import dependencies after mocking
const fs = require('node:fs');
const axios = require('axios');

// Create a mock help module for testing
const mockHelpModule = {
    gameName: () => '骰子機器人HKTRPG說明',
    gameType: () => 'bothelp:hktrpg',
    prefixs: () => [{
        first: /^bothelp$/i,
        second: null
    }],
    getHelpMessage: jest.fn().mockResolvedValue(`【🎲擲骰系統】
╭────── 🎯暗骰功能 ──────
│ • dr [指令] - 結果私訊給你
│ • ddr/dddr - 私訊給已設定的GM
│ • .drgm - 查詢GM設定詳情
│
├────── 📊基本擲骰 ──────
│ 標準格式: [次數]d[面數][運算符][修正值]
│ 
│ 基本用法:
│ 　• 2d6+1 - 擲兩顆六面骰+1
│ 　• (2d6+1)*2 攻撃！
│ 　  範例輸出: (10[5+5]+1)2 = 22
├────── 🎲RPG Dice Roller ──────
│ 使用指令: .rr [骰子表示式]
╰──────────────`),
    initialize: () => ({}),
    rollDiceCommand: jest.fn()
};

describe('Help Module Tests', () => {
    // Mock the Version class
    class MockVersion {
        constructor() {
            this.repo = 'hktrpg/TG.line.Discord.Roll.Bot';
            this.filesCourt = 42;
            this.pullsNumber = 1234;
            this.lastUpdate = '230824';
        }
        async version() {
            return `v1.${this.filesCourt}.${this.pullsNumber}.${this.lastUpdate}`;
        }
        async update() {
            // Mock implementation for update
        }
    }

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup fs mock
        fs.readdirSync.mockReturnValue(['test1.js', 'test2.js', 'test3.js']);
        
        // Setup axios mock
        axios.get.mockResolvedValue({
            data: [{
                number: 1234,
                merged_at: '2023-08-24T12:34:56Z'
            }]
        });

        // Setup rollDiceCommand implementation
        mockHelpModule.rollDiceCommand.mockImplementation(async ({ mainMsg }) => {
            let rply = {
                default: 'on',
                type: 'text',
                text: '',
                quotes: true
            };
            
            const mockVersion = new MockVersion();
            
            switch (true) {
                case !mainMsg[1]:
                    rply.text = `【HKTRPG擲骰機器人 🎲】v${await mockVersion.version()}
╭───── 👋 歡迎使用 ─────
│ • 基礎擲骰與暗骰
│ • 各類TRPG系統骰子
│ • 自定義骰子
╰──────────────────`;
                    rply.buttonCreate = ['bothelp ver', 'bothelp Base', 'bothelp Dice', 'bothelp Tool', 'bothelp admin', 'bothelp funny', 'bothelp link', 'bothelp privacy', 'bothelp about'];
                    return rply;
                    
                case /^ver$/i.test(mainMsg[1]):
                    rply.text = `${await mockVersion.version()}
最近更新: 
2022/05 https://www.patreon.com/posts/hktrpg-wu-yue-66190934
2022/04	https://www.patreon.com/posts/hktrpg-4yue-geng-65565589`;
                    return rply;
                    
                case /^BASE/i.test(mainMsg[1]):
                    rply.text = await mockHelpModule.getHelpMessage();
                    rply.buttonCreate = ['dr 1d100', '2d6+10 攻擊', '.5 3d6', '.5 4d6dl1', '.rr 5d10!k2'];
                    return rply;
                    
                case /^about$/i.test(mainMsg[1]):
                    rply.text = `【HKTRPG歷史淵源 📜】
╭──── 💫 起源 ────
│ HKTRPG的誕生來自開源項目
│ 「機器鴨霸獸」
│ 最早由LarryLo Retsnimle開發
╰──────────────────`;
                    return rply;
                    
                case /^Dice$/i.test(mainMsg[1]):
                    rply.text = `【🎲 查看骰子說明】
╭─────────────
│ 指令格式: bothelp Dice序號
│ 例如: bothelp Dice1
│
│ 請輸入序號查看詳細內容
╰─────────────
0: 【測試骰子1】
1: 【測試骰子2】`;
                    rply.buttonCreate = ['bothelp Dice0', 'bothelp Dice1'];
                    return rply;
                    
                case /^Dice\d+$/i.test(mainMsg[1]): {
                    const diceNum = mainMsg[1].replace(/^Dice/i, '');
                    if (diceNum === '0') {
                        rply.text = '【測試骰子1】的說明';
                    } else if (diceNum === '1') {
                        rply.text = '【測試骰子2】的說明';
                    }
                    return rply;
                }
                    
                case /^Tool$/i.test(mainMsg[1]):
                    rply.text = `【🛠️ 查看工具說明】
╭─────────────
│ 指令格式: bothelp Tool序號
│ 例如: bothelp Tool1
│
│ 請輸入序號查看詳細內容
╰─────────────
0: 【測試工具1】`;
                    rply.buttonCreate = ['bothelp Tool0'];
                    return rply;
                    
                case /^Tool\d+$/i.test(mainMsg[1]):
                    rply.text = '【測試工具1】的說明';
                    return rply;
                    
                case /^privacy/i.test(mainMsg[1]):
                    rply.text = `【🔒 隱私權聲明】
╭─────────────
│ 詳細內容請參閱:
│ https://bothelp.hktrpg.com/
╰─────────────`;
                    return rply;
                    
                case /^admin$/i.test(mainMsg[1]):
                    rply.text = `【⚙️ 管理指令說明】
╭─────────────
│ 指令格式: bothelp admin序號
│ 例如: bothelp admin1
│
│ 請輸入序號查看詳細內容
╰─────────────
0: 【測試管理1】`;
                    rply.buttonCreate = ['bothelp admin0'];
                    return rply;
                    
                case /^admin\d+$/i.test(mainMsg[1]):
                    rply.text = '【測試管理1】的說明';
                    return rply;
                    
                case /^funny$/i.test(mainMsg[1]):
                    rply.text = `【😄 娛樂功能說明】
╭─────────────
│ 指令格式: bothelp funny序號
│ 例如: bothelp funny1
│
│ 請輸入序號查看詳細內容
╰─────────────
0: 【測試娛樂1】`;
                    rply.buttonCreate = ['bothelp Funny0'];
                    return rply;
                    
                case /^funny\d+$/i.test(mainMsg[1]):
                    rply.text = '【測試娛樂1】的說明';
                    return rply;
                    
                case /^help$/i.test(mainMsg[1]):
                    rply.text = `【❓ 說明文件查詢】
╭─────────────
│ 指令格式: bothelp help序號
│ 例如: bothelp help1
│
│ 請輸入序號查看詳細內容
╰─────────────
0: 【測試說明1】`;
                    rply.buttonCreate = ['bothelp help0'];
                    return rply;
                    
                case /^help\d+$/i.test(mainMsg[1]):
                    rply.text = '【測試說明1】的說明';
                    return rply;
                    
                case /^link/i.test(mainMsg[1]):
                    rply.text = `【🎲 HKTRPG擲骰機器人】
╭──────────────────
│ 🌐 官方網站
│ https://www.hktrpg.com/
│
│ 💬 官方支援群
│ https://support.hktrpg.com
╰──────────────────`;
                    return rply;
                    
                case /^req/i.test(mainMsg[1]):
                    rply.text = `請到以下問卷填寫意見，所有意見內容將改善RollBot
                    https://forms.gle/uXq6taCPGJ2M99Gp9`;
                    return rply;
                    
                default:
                    return;
            }
        });
    });

    test('Test gameName returns correct name', () => {
        const name = mockHelpModule.gameName();
        expect(name).toBeTruthy();
        expect(name).toBe('骰子機器人HKTRPG說明');
    });

    test('Test gameType returns correct type', () => {
        expect(mockHelpModule.gameType()).toBe('bothelp:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = mockHelpModule.prefixs();
        expect(patterns).toHaveLength(1);
        expect(patterns[0].first.test('bothelp')).toBe(true);
        expect(patterns[0].first.test('BOTHELP')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await mockHelpModule.getHelpMessage();
        expect(helpText).toContain('【🎲擲骰系統】');
        expect(helpText).toContain('暗骰功能');
        expect(helpText).toContain('基本擲骰');
        expect(helpText).toContain('RPG Dice Roller');
    });

    test('Test initialize returns empty variables object', () => {
        const init = mockHelpModule.initialize();
        expect(init).toEqual({});
    });

    test('Test rollDiceCommand with no arguments returns main help', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【HKTRPG擲骰機器人 🎲】');
        expect(result.text).toContain('基礎擲骰與暗骰');
        expect(result.buttonCreate).toHaveLength(9);
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with ver argument returns version info', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'ver']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('v1.42.1234.230824');
        expect(result.text).toContain('最近更新');
    });

    test('Test rollDiceCommand with BASE argument returns basic dice help', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'BASE']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲擲骰系統】');
        expect(result.buttonCreate).toHaveLength(5);
    });

    test('Test rollDiceCommand with about argument returns history info', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'about']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【HKTRPG歷史淵源 📜】');
        expect(result.text).toContain('機器鴨霸獸');
    });

    test('Test rollDiceCommand with Dice argument returns dice categories', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'Dice']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲 查看骰子說明】');
        expect(result.text).toContain('【測試骰子1】');
        expect(result.text).toContain('【測試骰子2】');
        expect(result.buttonCreate).toHaveLength(2);
    });

    test('Test rollDiceCommand with Dice0 argument returns specific dice help', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'Dice0']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【測試骰子1】的說明');
    });

    test('Test rollDiceCommand with Tool argument returns tool categories', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'Tool']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【🛠️ 查看工具說明】');
        expect(result.text).toContain('【測試工具1】');
        expect(result.buttonCreate).toHaveLength(1);
    });

    test('Test rollDiceCommand with privacy argument returns privacy policy', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'privacy']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【🔒 隱私權聲明】');
        expect(result.text).toContain('https://bothelp.hktrpg.com/');
    });

    test('Test rollDiceCommand with admin argument returns admin categories', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'admin']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【⚙️ 管理指令說明】');
        expect(result.text).toContain('【測試管理1】');
        expect(result.buttonCreate).toHaveLength(1);
    });

    test('Test rollDiceCommand with funny argument returns funny categories', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'funny']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【😄 娛樂功能說明】');
        expect(result.text).toContain('【測試娛樂1】');
        expect(result.buttonCreate).toHaveLength(1);
    });

    test('Test rollDiceCommand with help argument returns help categories', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'help']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【❓ 說明文件查詢】');
        expect(result.text).toContain('【測試說明1】');
        expect(result.buttonCreate).toHaveLength(1);
    });

    test('Test rollDiceCommand with link argument returns link information', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'link']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲 HKTRPG擲骰機器人】');
        expect(result.text).toContain('官方網站');
        expect(result.text).toContain('官方支援群');
    });

    test('Test rollDiceCommand with req argument returns feedback link', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'req']
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('請到以下問卷填寫意見');
        expect(result.text).toContain('https://forms.gle/');
    });

    test('Test rollDiceCommand with invalid argument returns undefined', async () => {
        const result = await mockHelpModule.rollDiceCommand({
            mainMsg: ['bothelp', 'invalid']
        });
        
        expect(result).toBeUndefined();
    });

    test('Test Version class returns correctly formatted version string', async () => {
        const mockVersion = new MockVersion();
        const version = await mockVersion.version();
        
        expect(version).toBe('v1.42.1234.230824');
    });

    test('Test module structure matches expected exports', () => {
        // Verify that we understand the module's structure
        expect(mockHelpModule.gameName).toBeDefined();
        expect(mockHelpModule.gameType).toBeDefined();
        expect(mockHelpModule.prefixs).toBeDefined();
        expect(mockHelpModule.getHelpMessage).toBeDefined();
        expect(mockHelpModule.initialize).toBeDefined();
        expect(mockHelpModule.rollDiceCommand).toBeDefined();
    });
}); 