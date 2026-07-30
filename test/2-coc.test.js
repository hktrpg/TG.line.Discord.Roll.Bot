"use strict";

// Mock dependencies that might cause issues during testing
jest.mock('../modules/db/schema.js', () => ({}));
jest.mock('../modules/chat/check.js', () => ({
    permissionErrMsg: jest.fn(() => null),
    flag: { ChkChannelAdmin: 'admin', ChkChannel: 'channel' }
}));
jest.mock('../modules/db/watchdog.js', () => ({
    isDbOnline: jest.fn(() => true)
}));
jest.mock('../roll/rollbase.js', () => ({
    Dice: jest.fn(() => 50),
    DiceINT: jest.fn(() => 20),
    BuildDiceCal: jest.fn((expr) => `${expr} = 50`),
    BuildRollDice: jest.fn(() => '3+3')
}));
jest.mock('mathjs', () => ({
    evaluate: jest.fn(() => 10)
}));
jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis(),
        addChoices: jest.fn().mockReturnThis(),
        addSubcommand: jest.fn().mockReturnThis()
    }))
}));

const coc = require('../roll/2-coc.js');

describe('CoC (Call of Cthulhu) RPG System', () => {
    describe('Module exports', () => {
        test('should export rollDiceCommand function', () => {
            expect(typeof coc.rollDiceCommand).toBe('function');
        });

        test('should export initialize function', () => {
            expect(typeof coc.initialize).toBe('function');
        });

        test('should export getHelpMessage function', () => {
            expect(typeof coc.getHelpMessage).toBe('function');
        });

        test('should export prefixs function', () => {
            expect(typeof coc.prefixs).toBe('function');
        });

        test('should export gameType function', () => {
            expect(typeof coc.gameType).toBe('function');
        });

        test('should export gameName function', () => {
            expect(typeof coc.gameName).toBe('function');
        });

        test('should export discordCommand array', () => {
            expect(Array.isArray(coc.discordCommand)).toBe(true);
        });
    });

    describe('initialize', () => {
        test('should return an empty object', () => {
            const result = coc.initialize();
            expect(result).toEqual({});
        });
    });

    describe('gameName', () => {
        test('should return the correct game name', () => {
            const result = coc.gameName();
            expect(result).toBe('【克蘇魯神話】 cc cc(n)1~2 ccb ccrt ccsu .dp .cc7build .cc6build .cc7bg');
        });
    });

    describe('gameType', () => {
        test('should return the correct game type', () => {
            const result = coc.gameType();
            expect(result).toBe('Dice:CoC');
        });
    });

    describe('prefixs', () => {
        test('should return an array of prefix patterns', () => {
            const result = coc.prefixs();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);

            // Check first prefix object structure
            expect(result[0]).toHaveProperty('first');
            expect(result[0]).toHaveProperty('second');

            // Check second prefix object structure
            expect(result[1]).toHaveProperty('first');
            expect(result[1]).toHaveProperty('second');
        });
    });

    describe('getHelpMessage', () => {
        test('should return a help message string', () => {
            const result = coc.getHelpMessage();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('【🦑克蘇魯神話RPG系統】');
        });
    });

    describe('cc7build i18n', () => {
        const i18n = require('../modules/i18n/i18n.js');

        beforeAll(async () => {
            await i18n.init();
        });

        test('zh-tw build has no English Traditional Chinese banner', async () => {
            const locale = 'zh-tw';
            const t = i18n.createTranslator(locale);
            const result = await coc.rollDiceCommand({
                mainMsg: ['.cc7build', '20'],
                userid: 'u1',
                groupid: 'g1',
                userrole: 1,
                locale,
                t
            });
            expect(result.text).toContain('調查員年齡設為：20');
            expect(result.text).not.toContain('(Traditional Chinese)');
            expect(result.text).not.toContain('Investigator age:');
        });

        test('en build is English without zh_only_notice banner', async () => {
            const locale = 'en';
            const t = i18n.createTranslator(locale);
            const result = await coc.rollDiceCommand({
                mainMsg: ['.cc7build', '20'],
                userid: 'u1',
                groupid: 'g1',
                userrole: 1,
                locale,
                t
            });
            expect(result.text).toContain('Investigator age: 20');
            expect(result.text).not.toContain('(Traditional Chinese)');
            expect(result.text).not.toMatch(/^（繁中）/);
        });
    });

    describe('discordCommand', () => {
        test('should contain slash command definitions', () => {
            const commands = coc.discordCommand;
            expect(commands.length).toBeGreaterThan(0);

            // Check that each command has the required properties
            for (const command of commands) {
                expect(command).toHaveProperty('data');
                expect(command).toHaveProperty('execute');
                expect(typeof command.execute).toBe('function');
            }
        });
    });
});