"use strict";

const dnd5e = require('../roll/5e.js');
const rollbase = require('../roll/rollbase.js');

// Mock Discord.js
jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis()
    }))
}));

// Mock rollbase functions to return predictable values for testing
jest.mock('../roll/rollbase.js', () => ({
    nomalDiceRoller: jest.fn()
}));

describe('D&D 5E Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation for dice roller
        rollbase.nomalDiceRoller.mockReturnValue('4d6dl1：\n[6+4+2] = 12');
    });

    test('Test gameName returns correct name', () => {
        const name = dnd5e.gameName();
        expect(name).toBeTruthy();
        expect(name).toContain('5E工具');
        expect(name).toContain('.5ebuild');
    });

    test('Test gameType returns correct type', () => {
        expect(dnd5e.gameType()).toBe('dnd5e:Dice:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = dnd5e.prefixs();
        expect(patterns).toHaveLength(1);
        expect(patterns[0].first.toString()).toContain('.5ebuild');
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = dnd5e.getHelpMessage();
        expect(helpText).toContain('D&D 5E工具箱');
        expect(helpText).toContain('.5eBuild');
        expect(helpText).toContain('角色建立器');
        expect(helpText).toContain('自動計算屬性值');
    });

    test('Test initialize returns empty variables object', () => {
        const init = dnd5e.initialize();
        expect(init).toEqual({});
    });

    test('Test rollDiceCommand with help', async () => {
        const result = await dnd5e.rollDiceCommand({
            mainMsg: ['.5ebuild', 'help'],
            inputStr: '.5ebuild help'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('D&D 5E工具箱');
        expect(result.quotes).toBe(true);
    });

    test('Test rollDiceCommand with .5ebuild', async () => {
        // Setup mock to return different dice rolls for each attribute
        const mockReturnValues = [
            '4d6dl1：\n[6+5+4] = 15', // First call
            '4d6dl1：\n[6+4+2] = 12',  // Second call
            '4d6dl1：\n[5+4+4] = 13',  // Third call
            '4d6dl1：\n[6+6+5] = 17',  // Fourth call
            '4d6dl1：\n[5+3+2] = 10',  // Fifth call
            '4d6dl1：\n[6+3+1] = 10'   // Sixth call
        ];
        
        // Set up the mock to return different values on each call
        rollbase.nomalDiceRoller
            .mockReturnValueOnce(mockReturnValues[0])
            .mockReturnValueOnce(mockReturnValues[1])
            .mockReturnValueOnce(mockReturnValues[2])
            .mockReturnValueOnce(mockReturnValues[3])
            .mockReturnValueOnce(mockReturnValues[4])
            .mockReturnValueOnce(mockReturnValues[5]);

        const result = await dnd5e.rollDiceCommand({
            mainMsg: ['.5ebuild'],
            inputStr: '.5ebuild'
        });

        expect(result).toBeDefined();
        expect(result.type).toBe('text');
        expect(result.text).toContain('5e 屬性產生器');
        expect(result.text).toContain('==================');
    });

    test('Test rollDiceCommand with incorrect command returns undefined', async () => {
        const result = await dnd5e.rollDiceCommand({
            mainMsg: ['wrongcommand'],
            inputStr: 'wrongcommand'
        });
        expect(result).toBeUndefined();
    });

    test('Test randomStats error handling', async () => {
        // Force an error in randomStats by having the mock throw an error
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        // Make the first call to nomalDiceRoller throw an error
        rollbase.nomalDiceRoller.mockImplementationOnce(() => {
            throw new Error('Test error');
        });

        const result = await dnd5e.rollDiceCommand({
            mainMsg: ['.5ebuild'],
            inputStr: '.5ebuild'
        });

        // Should log an error
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toContain('#5E工具 - .5ebuild - randomStats Error');
        
        // Function should still return a result object even with error
        expect(result).toBeDefined();
        expect(result.type).toBe('text');
        
        consoleSpy.mockRestore();
    });

    test('Test Discord commands are properly defined', () => {
        expect(dnd5e.discordCommand).toBeDefined();
        expect(Array.isArray(dnd5e.discordCommand)).toBe(true);
        expect(dnd5e.discordCommand.length).toBe(1);
        
        const buildCommand = dnd5e.discordCommand[0];
        expect(buildCommand).toBeDefined();
        expect(buildCommand.data).toBeDefined();
        // Test execute function
        expect(typeof buildCommand.execute).toBe('function');
        // Not testing the actual resolve value as it might be async
    });
}); 