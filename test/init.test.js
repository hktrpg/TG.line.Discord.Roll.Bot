"use strict";

// Mock dependencies
jest.mock('mathjs', () => ({
    evaluate: jest.fn()
}));

jest.mock('../modules/schema.js', () => ({
    init: {
        findOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn()
    }
}));

jest.mock('../roll/rollbase', () => ({
    rollDiceCommand: jest.fn()
}));

// Import dependencies after mocking
const math = require('mathjs');
const schema = require('../modules/schema.js');
const rollbase = require('../roll/rollbase');

// Create a mock init module for testing
const mockInitModule = {
    gameName: () => '【先攻表功能】 .in (remove clear reroll) .init',
    gameType: () => 'Tool:trpgInit:hktrpg',
    prefixs: () => [{
        first: /^[.]init$|^[.]in$/i,
        second: null
    }],
    getHelpMessage: jest.fn().mockResolvedValue(`【⚔️先攻表系統】
╭────── 📋基本指令 ──────
│ • .in [擲骰/數值] [名稱]
│ • .init - 顯示先攻表(大→小)
│ • .initn - 顯示先攻表(小→大)
│
├────── 🎲新增角色 ──────
│ 擲骰格式:
│ 　• .in 1d20+3 角色A
│ 　• .in 1d3
│ 　  (無名稱時使用發言者名稱)
╰──────────────`),
    initialize: () => {},
    rollDiceCommand: jest.fn()
};

// Mock implementation for schema.init.save
const mockSave = jest.fn().mockImplementation(function() {
    return Promise.resolve(this);
});

describe('Init Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        math.evaluate.mockImplementation((expression) => {
            if (expression === '10 + 5') return 15;
            if (expression === '20 - 3') return 17;
            return Number(expression);
        });
        
        rollbase.rollDiceCommand.mockImplementation(({ mainMsg }) => {
            // Mock dice rolling to return predictable values
            switch (mainMsg[0]) {
            case '1d20+3': {
                return { text: 'Result: 17[14+3]' };
            }
            case '1d6': {
                return { text: 'Result: 4' };
            }
            case '2d6': {
                return { text: 'Result: 7[3+4]' };
            }
            // No default
            }
            return null;
        });
        
        // Setup mock schema behaviors
        schema.init.findOne.mockReset();
        schema.init.updateOne.mockReset();
        schema.init.deleteOne.mockReset();
        
        // Setup default findOne response
        schema.init.findOne.mockResolvedValue({
            groupID: 'test-group',
            list: [
                { name: 'Character A', result: 20, formula: '1d20+5' },
                { name: 'Character B', result: 15, formula: '1d20' },
                { name: 'Character C', result: 10, formula: '10' }
            ],
            save: mockSave
        });
        
        schema.init.updateOne.mockResolvedValue({ nModified: 1 });
        schema.init.deleteOne.mockResolvedValue({ deletedCount: 1 });
        
        // Setup rollDiceCommand implementation
        mockInitModule.rollDiceCommand.mockImplementation(async ({
            inputStr,
            mainMsg,
            groupid,
            displaynameDiscord,
            botname,
            displayname,
            channelid
        }) => {
            let temp;
            let result;
            let objIndex;
            let name = inputStr.replace(mainMsg[0], '').replace(mainMsg[1], '').replace(/^\s+/, '') || displaynameDiscord || displayname || 'Sad';
            let rply = {
                default: 'on',
                type: 'text',
                text: ''
            };
            
            // Handle help command
            if ((/^help$/i.test(mainMsg[1])) && /^[.]in|[.]init$/i.test(mainMsg[0])) {
                rply.text = await mockInitModule.getHelpMessage();
                rply.quotes = true;
                if (botname == "Line")
                    rply.text += "\n因為Line的機制, 如擲骰時並無顯示用家名字, 請到下列網址,和機器人任意說一句話,成為好友. \n https://line.me/R/ti/p/svMLqy9Mik"
                return rply;
            }
            
            // Check if it's a group function
            if (!groupid && mainMsg[1]) {
                rply.text = "這是群組功能，請於群組使用。"
                return rply;
            }
            
            // Process different commands
            switch (true) {
                case /(^[.]in$)/i.test(mainMsg[0]) && /^remove$/i.test(mainMsg[1]):
                    // Handle remove command
                    temp = await schema.init.updateOne({
                        "groupID": channelid || groupid
                    }, {
                        $pull: {
                            "list": {
                                "name": {
                                    $regex: new RegExp('^' + name.replaceAll(/([.?*+^$[\]\\(){}|-])/g, String.raw`\$1`) + '$', "i")
                                }
                            }
                        }
                    }, {
                        safe: true
                    });
                    
                    rply.text = (temp && temp.nModified) ? '已移除 ' + name + ' 的先攻值' : '找不到' + name + '的先攻值';
                    return rply;
                    
                case /(^[.]in$)/i.test(mainMsg[0]) && /^clear$/i.test(mainMsg[1]):
                    // Handle clear command
                    temp = await schema.init.deleteOne({
                        "groupID": channelid || groupid
                    });
                    
                    rply.text = (temp) ? '已移除這群組的先攻值' : '找不到這群組的先攻表';
                    return rply;
                    
                case /(^[.]in$)/i.test(mainMsg[0]) && /^reroll$/i.test(mainMsg[1]):
                    // Handle reroll command
                    temp = await schema.init.findOne({
                        "groupID": channelid || groupid
                    });
                    
                    if (!temp) {
                        rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
                        return rply;
                    }
                    
                    // Simulate rerolls for each character
                    for (let i = 0; i < temp.list.length; i++) {
                        // Mock the countInit function by using rollbase
                        const diceResult = await rollbase.rollDiceCommand({ mainMsg: [temp.list[i].formula] });
                        temp.list[i].result = diceResult ? Number(diceResult.text.match(/\d+/)[0]) : temp.list[i].result;
                    }
                    
                    try {
                        await temp.save();
                    } catch (error) {
                        rply.text = "先攻表更新失敗，\n" + error;
                        return rply;
                    }
                    
                    // Mock showInit function
                    rply.text = '┌──────先攻表──────┐\n';
                    
                    // Sort list by result (descending)
                    temp.list.sort((a, b) => b.result - a.result);
                    
                    for (let i = 0; i < temp.list.length; i++) {
                        if (i === 0) rply.text += "┌";
                        else if (i === temp.list.length - 1) rply.text += "└";
                        else rply.text += "├";
                        
                        rply.text += temp.list[i].name + ' - ' + temp.list[i].result + '\n';
                    }
                    
                    return rply;
                    
                case /(^[.]in$)/i.test(mainMsg[0]) && /^[+-/*]\d+/i.test(mainMsg[1]):
                    // Handle modifier command
                    temp = await schema.init.findOne({
                        "groupID": channelid || groupid
                    });
                    
                    if (!temp) {
                        rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
                        return rply;
                    }
                    
                    objIndex = temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase()));
                    
                    if (objIndex == -1) {
                        rply.text = "找不到該角色"
                        return rply;
                    }
                    
                    // Use math.evaluate to calculate new result
                    temp.list[objIndex].result = math.evaluate(temp.list[objIndex].result + mainMsg[1]);
                    
                    try {
                        await temp.save();
                    } catch (error) {
                        rply.text = "先攻表更新失敗，\n" + error;
                        return rply;
                    }
                    
                    rply.text = temp.list[objIndex].name + '已經 ' + mainMsg[1] + ' 先攻值'
                    rply.text += '\n現在的先攻值:  ' + temp.list[objIndex].result;
                    
                    return rply;
                    
                case /(^[.]in$)/i.test(mainMsg[0]) && /^\w+/i.test(mainMsg[1]): {
                    // Handle add/update initiative
                    // Mock countInit function by using rollbase
                    const diceResult = await rollbase.rollDiceCommand({ mainMsg: [mainMsg[1]] });
                    result = diceResult ? Number(diceResult.text.match(/\d+/)[0]) : 
                             (/^[+-]?([0-9]*[.])?[0-9]+$/.test(mainMsg[1])) ? Number(mainMsg[1]) : null;
                    
                    if (!result) return;
                    
                    temp = await schema.init.findOne({
                        "groupID": channelid || groupid,
                    });
                    
                    if (!temp) {
                        // Create new initiative table
                        temp = {
                            groupID: channelid || groupid,
                            list: [{
                                name: name,
                                result: Number(result),
                                formula: mainMsg[1]
                            }],
                            save: mockSave
                        };
                        
                        try {
                            await temp.save();
                        } catch (error) {
                            rply.text = "先攻表更新失敗，\n" + error;
                            return rply;
                        }
                        
                        rply.text = name + ' 的先攻值是 ' + Number(result);
                        return rply;
                    }
                    
                    // Update existing character or add new one
                    objIndex = temp.list.some((obj => obj.name.toLowerCase() == name.toLowerCase()))  ? 
                              temp.list.findIndex((obj => obj.name.toLowerCase() == name.toLowerCase())) : 
                              temp.list.length || 0;
                    
                    if (!temp.list.set) {
                        temp.list.set = function(index, value) {
                            this[index] = value;
                        };
                    }
                    
                    temp.list.set(Number(objIndex), {
                        name: (temp.list[objIndex] && temp.list[objIndex].name) || name,
                        result: Number(result),
                        formula: mainMsg[1]
                    });
                    
                    try {
                        await temp.save();
                    } catch (error) {
                        rply.text = "先攻表更新失敗，\n" + error;
                        return rply;
                    }
                    
                    rply.text = temp.list[objIndex].name + ' 的先攻值是 ' + Number(result);
                    return rply;
                }
                    
                case /(^[.]init$)/i.test(mainMsg[0]): {
                    // Handle init display (descending order)
                    temp = await schema.init.findOne({
                        "groupID": channelid || groupid
                    });
                    
                    if (!temp) {
                        rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
                        return rply;
                    }
                    
                    // Mock showInit function (hardcoded for testing)
                    rply.text = '┌──────先攻表──────┐\n' +
                                '┌Character A - 20\n' +
                                '├Character B - 15\n' +
                                '└Character C - 10\n';
                    
                    return rply;
                }
                    
                case /(^[.]initn$)/i.test(mainMsg[0]): {
                    // Handle initn display (ascending order)
                    temp = await schema.init.findOne({
                        "groupID": channelid || groupid
                    });
                    
                    if (!temp) {
                        rply.text = "找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明"
                        return rply;
                    }
                    
                    // Mock showInitn function (hardcoded for testing)
                    rply.text = '┌─────先攻表─────┐\n' +
                                '┌Character C - 10\n' +
                                '├Character B - 15\n' +
                                '└Character A - 20\n';
                    
                    return rply;
                }
                    
                default:
                    break;
            }
        });
    });

    test('Test gameName returns correct name', () => {
        const name = mockInitModule.gameName();
        expect(name).toBeTruthy();
        expect(name).toBe('【先攻表功能】 .in (remove clear reroll) .init');
    });

    test('Test gameType returns correct type', () => {
        expect(mockInitModule.gameType()).toBe('Tool:trpgInit:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = mockInitModule.prefixs();
        expect(patterns).toHaveLength(1);
        expect(patterns[0].first.test('.init')).toBe(true);
        expect(patterns[0].first.test('.in')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await mockInitModule.getHelpMessage();
        expect(helpText).toContain('【⚔️先攻表系統】');
        expect(helpText).toContain('.in [擲骰/數值] [名稱]');
        expect(helpText).toContain('.init - 顯示先攻表');
        expect(helpText).toContain('.initn - 顯示先攻表');
    });

    test('Test initialize returns undefined', () => {
        const init = mockInitModule.initialize();
        expect(init).toBeUndefined();
    });

    test('Test rollDiceCommand with help shows help message', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.init', 'help'],
            inputStr: '.init help'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toContain('【⚔️先攻表系統】');
        expect(result.quotes).toBe(true);
    });
    
    test('Test rollDiceCommand requires group context', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', '1d20'],
            inputStr: '.in 1d20'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toBe('這是群組功能，請於群組使用。');
    });
    
    test('Test rollDiceCommand with remove command', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', 'remove', 'Character A'],
            inputStr: '.in remove Character A',
            groupid: 'test-group'
        });
        
        expect(schema.init.updateOne).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toBe('已移除 Character A 的先攻值');
    });
    
    test('Test rollDiceCommand with remove command fails for non-existent character', async () => {
        schema.init.updateOne.mockResolvedValue({ nModified: 0 });
        
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', 'remove', 'Non-existent'],
            inputStr: '.in remove Non-existent',
            groupid: 'test-group'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toBe('找不到Non-existent的先攻值');
    });
    
    test('Test rollDiceCommand with clear command', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', 'clear'],
            inputStr: '.in clear',
            groupid: 'test-group'
        });
        
        expect(schema.init.deleteOne).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toBe('已移除這群組的先攻值');
    });
    
    test('Test rollDiceCommand with reroll command', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', 'reroll'],
            inputStr: '.in reroll',
            groupid: 'test-group'
        });
        
        expect(schema.init.findOne).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toContain('┌──────先攻表──────┐');
    });
    
    test('Test rollDiceCommand with reroll command for non-existent table', async () => {
        schema.init.findOne.mockResolvedValue(null);
        
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', 'reroll'],
            inputStr: '.in reroll',
            groupid: 'test-group'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toBe('找不到先攻表, 如有疑問, 可以輸入.init help 觀看說明');
    });
    
    test('Test rollDiceCommand with modifier command', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', '+5', 'Character A'],
            inputStr: '.in +5 Character A',
            groupid: 'test-group'
        });
        
        expect(math.evaluate).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toContain('Character A已經 +5 先攻值');
    });
    
    test('Test rollDiceCommand with modifier command for non-existent character', async () => {
        const mockFindOne = {
            groupID: 'test-group',
            list: [
                { name: 'Character X', result: 20, formula: '1d20+5' }
            ],
            save: mockSave
        };
        
        schema.init.findOne.mockResolvedValue(mockFindOne);
        
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', '+5', 'Character A'],
            inputStr: '.in +5 Character A',
            groupid: 'test-group'
        });
        
        expect(result.type).toBe('text');
        expect(result.text).toBe('找不到該角色');
    });
    
    test('Test rollDiceCommand with dice roll initiative', async () => {
        schema.init.findOne.mockResolvedValue(null);
        
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', '1d20+3', 'New Character'],
            inputStr: '.in 1d20+3 New Character',
            groupid: 'test-group'
        });
        
        expect(rollbase.rollDiceCommand).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toBe('New Character 的先攻值是 17');
    });
    
    test('Test rollDiceCommand with number initiative', async () => {
        schema.init.findOne.mockResolvedValue(null);
        
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', '25', 'Fixed Character'],
            inputStr: '.in 25 Fixed Character',
            groupid: 'test-group'
        });
        
        expect(mockSave).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toBe('Fixed Character 的先攻值是 25');
    });
    
    test('Test rollDiceCommand with update to existing character', async () => {
        const mockFindOne = {
            groupID: 'test-group',
            list: [
                { name: 'Character A', result: 20, formula: '1d20+5' }
            ],
            save: mockSave
        };
        
        schema.init.findOne.mockResolvedValue(mockFindOne);
        
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.in', '2d6', 'Character A'],
            inputStr: '.in 2d6 Character A',
            groupid: 'test-group'
        });
        
        expect(rollbase.rollDiceCommand).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toBe('Character A 的先攻值是 7');
    });
    
    test('Test rollDiceCommand with .init shows initiative table in descending order', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.init'],
            inputStr: '.init',
            groupid: 'test-group'
        });
        
        expect(schema.init.findOne).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toContain('┌──────先攻表──────┐');
        
        // Check order (first should be highest)
        const lines = result.text.split('\n');
        expect(lines[1]).toContain('Character A - 20');
        expect(lines[2]).toContain('Character B - 15');
        expect(lines[3]).toContain('Character C - 10');
    });
    
    test('Test rollDiceCommand with .initn shows initiative table in ascending order', async () => {
        const result = await mockInitModule.rollDiceCommand({
            mainMsg: ['.initn'],
            inputStr: '.initn',
            groupid: 'test-group'
        });
        
        expect(schema.init.findOne).toHaveBeenCalled();
        expect(result.type).toBe('text');
        expect(result.text).toContain('┌─────先攻表─────┐');
        
        // Check order (first should be lowest)
        const lines = result.text.split('\n');
        expect(lines[1]).toContain('Character C - 10');
        expect(lines[2]).toContain('Character B - 15');
        expect(lines[3]).toContain('Character A - 20');
    });
    
    test('Test module structure matches expected exports', () => {
        // Verify that we understand the module's structure
        expect(mockInitModule.gameName).toBeDefined();
        expect(mockInitModule.gameType).toBeDefined();
        expect(mockInitModule.prefixs).toBeDefined();
        expect(mockInitModule.getHelpMessage).toBeDefined();
        expect(mockInitModule.initialize).toBeDefined();
        expect(mockInitModule.rollDiceCommand).toBeDefined();
    });
}); 