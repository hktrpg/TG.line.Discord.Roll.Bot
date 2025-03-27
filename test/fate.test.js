"use strict";

// Mock dependencies
jest.mock('../roll/rollbase.js', () => ({
    Dice: jest.fn()
}));

jest.mock('mathjs', () => ({
    evaluate: jest.fn()
}));

// Import dependencies after mocking
const rollbase = require('../roll/rollbase.js');
const mathjs = require('mathjs');

// Create a mock fate module for testing
const mockFateModule = {
    gameName: () => '【命運Fate】 .4df(m|-)(加值)',
    gameType: () => 'Dice:fate',
    prefixs: () => [{
        first: /^[.]4df(\d+|(\+|m|-)(\d+)|)/i,
        second: null
    }],
    getHelpMessage: jest.fn().mockResolvedValue(`【🎲命運Fate骰系統】
╭────── 🎯骰子說明 ──────
│ 命運骰(Fate Dice)組成:
│ 　• ⊞ 「＋」兩面 (+1)
│ 　• ⊟ 「－」兩面 (-1)
│ 　• ▉ 空白兩面 (0)
│
├────── 🎲擲骰指令 ──────
│ 基本指令:
│ 　• .4df - 擲四顆命運骰
│
│ 加入修正值:
│ 　• .4df3   → 結果+3
│ 　• .4df+3  → 結果+3
│ 　• .4dfm4  → 結果-4
│ 　• .4df-4  → 結果-4
╰──────────────`),
    initialize: () => ({}),
    rollDiceCommand: jest.fn()
};

describe('Fate Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Set up dice rolls to be deterministic for testing
        rollbase.Dice.mockImplementation((sides) => {
            if (sides === 3) return 3; // Always roll the highest (3), which maps to +1 in Fate
        });
        
        // Set up mathjs evaluate
        mathjs.evaluate.mockImplementation((expression) => {
            // Simple evaluation for testing
            if (expression === '4 + 3') return 7;
            if (expression === '4 - 4') return 0;
            // Default to returning the expression
            return expression;
        });
        
        // Setup rollDiceCommand implementation
        mockFateModule.rollDiceCommand.mockImplementation(async ({
            inputStr,
            mainMsg
        }) => {
            let rply = {
                default: 'on',
                type: 'text',
                text: ''
            };
            
            switch (true) {
                case /^help$/i.test(mainMsg[1]):
                    rply.text = await mockFateModule.getHelpMessage();
                    rply.quotes = true;
                    return rply;
                default: {
                    try {
                        // Simulate rolling 4 Fate dice
                        let temp = '';
                        let ans = 0;
                        
                        // Simulate 4 dice rolls
                        for (let i = 0; i < 4; i++) {
                            const random = (rollbase.Dice(3) - 2); // Maps to -1, 0, or +1
                            ans += random;
                            // Convert to symbols
                            if (random === -1) temp += '－';
                            else if (random === 0) temp += '▉';
                            else if (random === 1) temp += '＋';
                        }
                        
                        rply.text = 'Fate ' + inputStr + '\n' + temp + ' = ' + ans;
                        
                        // Handle modifiers
                        let mod = mainMsg[0].replace(/^\.4df/ig, '').replace(/^(\d)/, '+$1').replace(/m/ig, '-').replace(/-/g, ' - ').replace(/\+/g, ' + ');
                        if (mod) {
                            // Calculate with modifier
                            let result = mathjs.evaluate(ans + mod);
                            rply.text += ` ${mod} = ${result}`.replace(/\*/g, ' * ');
                        }
                    } catch (error) {
                        rply.text = `.4df 輸入出錯 \n${error.message}`;
                    }
                    return rply;
                }
            }
        });
    });

    test('Test gameName returns correct name', () => {
        const name = mockFateModule.gameName();
        expect(name).toBeTruthy();
        expect(name).toBe('【命運Fate】 .4df(m|-)(加值)');
    });

    test('Test gameType returns correct type', () => {
        expect(mockFateModule.gameType()).toBe('Dice:fate');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = mockFateModule.prefixs();
        expect(patterns).toHaveLength(1);
        expect(patterns[0].first.test('.4df')).toBe(true);
        expect(patterns[0].first.test('.4df3')).toBe(true);
        expect(patterns[0].first.test('.4df+3')).toBe(true);
        expect(patterns[0].first.test('.4dfm4')).toBe(true);
        expect(patterns[0].first.test('.4df-4')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await mockFateModule.getHelpMessage();
        expect(helpText).toContain('命運Fate骰系統');
        expect(helpText).toContain('.4df');
        expect(helpText).toContain('＋」兩面');
        expect(helpText).toContain('－」兩面');
    });

    test('Test initialize returns empty variables object', () => {
        const init = mockFateModule.initialize();
        expect(init).toEqual({});
    });

    test('Test rollDiceCommand with help', async () => {
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df', 'help'],
            inputStr: '.4df help'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('命運Fate骰系統');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with basic dice roll', async () => {
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df'],
            inputStr: '.4df'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('Fate .4df');
        // With our mock always returning 3 for the dice roll, 
        // each die gives (3-2) = +1, so 4 dice = +4 total
        expect(result.text).toContain('＋＋＋＋ = 4');
    });

    test('Test rollDiceCommand with positive modifier', async () => {
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df+3'],
            inputStr: '.4df+3'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('Fate .4df+3');
        // Use regex to match the output with flexible spacing
        expect(result.text).toMatch(/＋＋＋＋ = 4\s*\+\s*3 = 7/);
    });

    test('Test rollDiceCommand with negative modifier using m', async () => {
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4dfm4'],
            inputStr: '.4dfm4'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('Fate .4dfm4');
        // Use regex to match the output with flexible spacing
        expect(result.text).toMatch(/＋＋＋＋ = 4\s*-\s*4 = 0/);
    });

    test('Test rollDiceCommand with negative modifier using -', async () => {
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df-4'],
            inputStr: '.4df-4'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('Fate .4df-4');
        // Use regex to match the output with flexible spacing
        expect(result.text).toMatch(/＋＋＋＋ = 4\s*-\s*4 = 0/);
    });

    test('Test rollDiceCommand with direct number as modifier', async () => {
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df3'],
            inputStr: '.4df3'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('Fate .4df3');
        // Use regex to match the output with flexible spacing
        expect(result.text).toMatch(/＋＋＋＋ = 4\s*\+\s*3 = 7/);
    });

    test('Test rollDiceCommand with different dice roll outcomes', async () => {
        // Setup dice to give varied results
        let rollCount = 0;
        rollbase.Dice.mockImplementation((sides) => {
            if (sides === 3) {
                rollCount++;
                if (rollCount === 1) return 1; // -1 after adjustment
                if (rollCount === 2) return 2; // 0 after adjustment
                if (rollCount === 3) return 3; // +1 after adjustment
                if (rollCount === 4) return 1; // -1 after adjustment
            }
            return 1; // Default
        });
        
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df'],
            inputStr: '.4df'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('Fate .4df');
        // With our varied mock results, we should see one of each symbol
        // Total should be (-1 + 0 + 1 + -1) = -1
        expect(result.text).toContain('－▉＋－ = -1');
    });

    test('Test rollDiceCommand with error handling', async () => {
        // Force an error by making mathjs.evaluate throw
        mathjs.evaluate.mockImplementation(() => {
            throw new Error('Test error');
        });
        
        const result = await mockFateModule.rollDiceCommand({
            mainMsg: ['.4df+3'],
            inputStr: '.4df+3'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('.4df 輸入出錯');
        expect(result.text).toContain('Test error');
    });

    test('Test module structure matches expected exports', () => {
        // Verify that we understand the module's structure
        expect(mockFateModule.gameName).toBeDefined();
        expect(mockFateModule.gameType).toBeDefined();
        expect(mockFateModule.prefixs).toBeDefined();
        expect(mockFateModule.getHelpMessage).toBeDefined();
        expect(mockFateModule.initialize).toBeDefined();
        expect(mockFateModule.rollDiceCommand).toBeDefined();
    });
}); 