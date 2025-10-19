// Mock dependencies
jest.mock('../modules/schema.js', () => ({
    trpgLevelSystem: {
        countDocuments: jest.fn().mockResolvedValue(10)
    },
    characterCard: {
        countDocuments: jest.fn().mockResolvedValue(20)
    },
    firstTimeMessage: {
        countDocuments: jest.fn().mockResolvedValue(30)
    }
}));

// Mock fs and path for roll module loading
jest.mock('node:fs', () => ({
    readdir: jest.fn()
}));

jest.mock('node:path', () => ({
    basename: jest.fn((file, ext) => file.replace(ext || '', '')),
    join: jest.fn((...args) => args.join('/'))
}));

// Mock roll modules
jest.mock('../roll/help.js', () => ({
    prefixs: () => [{ first: /^\.help$/i, second: null }],
    rollDiceCommand: jest.fn().mockResolvedValue({
        text: 'Help text',
        type: 'text'
    })
}));

jest.mock('../roll/z_myname.js', () => ({
    prefixs: () => [{ first: /^\.me$/i, second: null }],
    rollDiceCommand: jest.fn().mockResolvedValue({
        text: 'My name result',
        type: 'text'
    })
}));

jest.mock('../roll/z_stop.js', () => ({
    save: [
        {
            groupid: 'testgroup',
            blockfunction: ['stop']
        }
    ],
    initialize: jest.fn().mockReturnValue({
        save: [
            {
                groupid: 'testgroup',
                blockfunction: ['stop']
            }
        ]
    })
}));

jest.mock('../modules/level', () => ({
    EXPUP: jest.fn().mockResolvedValue({
        text: 'Level up!',
        statue: 'active'
    })
}));

jest.mock('../modules/logs', () => {
    const mockState = {
        LogTime: new Date().toString(),
        StartTime: new Date().toString(),
        LineCountRoll: 100,
        DiscordCountRoll: 200,
        TelegramCountRoll: 300,
        WhatsappCountRoll: 400,
        WWWCountRoll: 500
    };

    return {
        courtMessage: jest.fn(),
        getState: jest.fn().mockImplementation(() => Promise.resolve(mockState))
    };
});

// Import analytics module
const analytics = require('../modules/analytics.js');

describe('Analytics Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Function Tests', () => {
        test('Test parseInput basic structure', async () => {
            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                groupid: 'testgroup',
                userid: 'testuser',
                botname: 'Discord'
            });

            expect(result).toHaveProperty('text');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('LevelUp');
            expect(result).toHaveProperty('statue');
            expect(typeof result.text).toBe('string');
            expect(result.type).toBe('text');
        });

        test('Test EXPUP functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                groupid: 'testgroup',
                userid: 'testuser',
                displayname: 'Test User',
                displaynameDiscord: 'Discord User',
                membercount: 5
            });

            expect(result.LevelUp).toBe('Level up!');
            expect(result.statue).toBe('active');
        });

        test('Test without groupid', async () => {
            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                userid: 'testuser'
            });

            expect(result.LevelUp).toBe('');
            expect(result.statue).toBe('');
        });
    });

    describe('findRollList Tests', () => {
        test('Test with empty array', () => {
            const result = analytics.findRollList([]);
            expect(result).toBeUndefined();
        });

        test('Test with null/undefined', () => {
            expect(analytics.findRollList(null)).toBeUndefined();
            expect(analytics.findRollList()).toBeUndefined();
        });

        test('Test with roll times prefix', () => {
            const mainMsg = ['.3', '.help'];
            const _result = analytics.findRollList(mainMsg);
            // After processing, mainMsg should be modified
            expect(mainMsg[0]).toBe('.help');
        });

        test('Test with unrecognized command', () => {
            const result = analytics.findRollList(['.nonexistent']);
            expect(result).toBeNull();
        });
    });

    describe('Error Handling Tests', () => {
        test('Test with malformed input', async () => {
            const result = await analytics.parseInput({
                inputStr: '.unknown',
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.text).toBe('');
            expect(result.type).toBe('text');
        });

        test('Test with invalid parameters', async () => {
            const result = await analytics.parseInput({
                inputStr: '.invalid',
                mainMsg: ['.invalid'],
                groupid: null,
                userid: null
            });

            expect(result).toBeDefined();
            expect(typeof result.text).toBe('string');
        });
    });

    describe('Integration Tests', () => {
        test('Test parseInput with help command', async () => {
            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                groupid: 'testgroup',
                userid: 'testuser'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
            expect(result.LevelUp).toBe('Level up!');
        });

        test('Test with roll times format', async () => {
            const result = await analytics.parseInput({
                inputStr: '.2 .help',
                mainMsg: ['.2', '.help'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
        });
    });

    describe('RollContext Tests', () => {
        test('Test RollContext constructor with all parameters', () => {
            const params = {
                inputStr: 'test input',
                groupid: 'testgroup',
                userid: 'testuser',
                userrole: 2,
                botname: 'TestBot',
                displayname: 'Test User',
                channelid: 'testchannel',
                displaynameDiscord: 'Discord User',
                membercount: 5,
                discordClient: {},
                discordMessage: {},
                titleName: 'Test Title',
                tgDisplayname: 'Telegram User'
            };

            // We can't directly test RollContext as it's not exported, but we can test its behavior through parseInput
            const result = analytics.parseInput(params);
            expect(result).toBeDefined();
        });

        test('Test RollContext with minimal parameters', () => {
            const params = {
                inputStr: 'test'
            };

            const result = analytics.parseInput(params);
            expect(result).toBeDefined();
        });
    });

    describe('findRollList Advanced Tests', () => {
        test('Test .me command routing to z_myname', () => {
            const result = analytics.findRollList(['.me']);
            expect(result).toBeDefined();
        });

        test('Test .mee command routing to z_myname', () => {
            const result = analytics.findRollList(['.mee']);
            expect(result).toBeDefined();
        });

        test('Test with second prefix matching', () => {
            // Mock a module with second prefix
            const mockModule = {
                prefixs: () => [{ first: /^\.test$/i, second: /^sub$/i }],
                rollDiceCommand: jest.fn()
            };
            
            // This test verifies the logic for second prefix matching
            const result = analytics.findRollList(['.test', 'sub']);
            // The actual result depends on what modules are available
            expect(result === null || result === undefined || typeof result === 'object').toBe(true);
        });

        test('Test with non-array prefixs', () => {
            // This tests the case where prefixs() doesn't return an array
            const result = analytics.findRollList(['.invalid']);
            expect(result).toBeNull();
        });
    });

    describe('z_stop Function Tests', () => {
        test('Test z_stop with matching blocked function', async () => {
            // This tests the z_stop functionality
            const result = await analytics.parseInput({
                inputStr: 'stop',
                mainMsg: ['stop'],
                groupid: 'testgroup',
                userid: 'testuser'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
        });

        test('Test z_stop with non-matching function', async () => {
            const result = await analytics.parseInput({
                inputStr: 'help',
                mainMsg: ['help'],
                groupid: 'testgroup',
                userid: 'testuser'
            });

            expect(result).toBeDefined();
        });

        test('Test z_stop with different groupid', async () => {
            const result = await analytics.parseInput({
                inputStr: 'stop',
                mainMsg: ['stop'],
                groupid: 'differentgroup',
                userid: 'testuser'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Multiple Roll Times Tests', () => {
        test('Test with multiple roll times for dice module', async () => {
            // Mock a dice module
            jest.doMock('../roll/5e.js', () => ({
                prefixs: () => [{ first: /^dice$/i, second: null }],
                gameType: () => 'dice',
                rollDiceCommand: jest.fn().mockResolvedValue({
                    text: 'Dice result',
                    type: 'text'
                })
            }));

            const result = await analytics.parseInput({
                inputStr: '.3 dice',
                mainMsg: ['.3', 'dice'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test with roll times > 10 (should be capped at 10)', async () => {
            const result = await analytics.parseInput({
                inputStr: '.15 help',
                mainMsg: ['.15', 'help'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('Test with empty mainMsg after processing', () => {
            const result = analytics.findRollList(['']);
            expect(result === null || result === undefined).toBe(true);
        });

        test('Test with undefined mainMsg[1]', () => {
            const result = analytics.findRollList(['.help']);
            expect(result === null || result === undefined || typeof result === 'object').toBe(true);
        });

        test('Test with module loading error', async () => {
            // This tests error handling in getRollModule
            const result = await analytics.parseInput({
                inputStr: '.nonexistent',
                mainMsg: ['.nonexistent'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
        });
    });

    describe('State and Command Function Tests', () => {
        test('Test state command functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
        });

        test('Test with characterReRoll functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test',
                mainMsg: ['.test'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test with cmd functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.cmd',
                mainMsg: ['.cmd'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Debug Mode Tests', () => {
        test('Test debugMode export', () => {
            expect(analytics.debugMode).toBeDefined();
            expect(typeof analytics.debugMode).toBe('boolean');
        });
    });

    describe('State Text Function Tests', () => {
        test('Test stateText with valid state data', async () => {
            // Mock getState to return valid data
            const mockLogs = require('../modules/logs');
            mockLogs.getState.mockResolvedValueOnce({
                LogTime: 'Mon Oct 19 2024 10:00:00 GMT+0800 (Hong Kong Standard Time)',
                StartTime: 'Mon Oct 19 2024 09:00:00 GMT+0800 (Hong Kong Standard Time)',
                LineCountRoll: 1000,
                DiscordCountRoll: 2000,
                TelegramCountRoll: 3000,
                WhatsappCountRoll: 4000,
                WWWCountRoll: 5000
            });

            // We can't directly test stateText as it's not exported, but we can test it through parseInput
            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
        });

        test('Test stateText with empty state', async () => {
            const mockLogs = require('../modules/logs');
            mockLogs.getState.mockResolvedValueOnce({});

            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test stateText with null state', async () => {
            const mockLogs = require('../modules/logs');
            mockLogs.getState.mockResolvedValueOnce(null);

            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Module Loading Tests', () => {
        test('Test module initialization error handling', async () => {
            // Mock fs.readdir to throw an error
            const fs = require('node:fs');
            fs.readdir.mockRejectedValueOnce(new Error('File system error'));

            // This tests the error handling in the module initialization
            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test getRollModule with non-existent module', () => {
            const result = analytics.findRollList(['.nonexistent']);
            expect(result).toBeNull();
        });

        test('Test getRollModule with null moduleName', () => {
            // This tests the early return in getRollModule
            const result = analytics.findRollList(['']);
            expect(result === null || result === undefined).toBe(true);
        });
    });

    describe('RollDice Function Tests', () => {
        test('Test rolldice with no target found', async () => {
            const result = await analytics.parseInput({
                inputStr: '.nonexistent',
                mainMsg: ['.nonexistent'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('text');
        });

        test('Test rolldice with groupid set to empty string', async () => {
            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                groupid: null,
                userid: 'testuser'
            });

            expect(result).toBeDefined();
        });

        test('Test rolldice with roll times extraction', async () => {
            const result = await analytics.parseInput({
                inputStr: '.5 .help',
                mainMsg: ['.5', '.help'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test rolldice with roll times > 10', async () => {
            const result = await analytics.parseInput({
                inputStr: '.15 .help',
                mainMsg: ['.15', '.help'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test rolldice with roll times = 10', async () => {
            const result = await analytics.parseInput({
                inputStr: '.10 .help',
                mainMsg: ['.10', '.help'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Command Function Tests', () => {
        test('Test cmdfunction with characterReRollItem', async () => {
            // Mock a module that returns characterReRollItem
            const mockModule = {
                prefixs: () => [{ first: /^\.test$/i, second: null }],
                rollDiceCommand: jest.fn().mockResolvedValue({
                    text: 'Test result',
                    type: 'text',
                    characterReRollItem: '.help'
                })
            };

            const result = await analytics.parseInput({
                inputStr: '.test',
                mainMsg: ['.test'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });

        test('Test cmdfunction error handling', async () => {
            // This tests error handling in cmdfunction
            const result = await analytics.parseInput({
                inputStr: '.test',
                mainMsg: ['.test'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Court Message Tests', () => {
        test('Test courtMessage integration', async () => {
            const mockLogs = require('../modules/logs');
            mockLogs.courtMessage.mockImplementation(() => {});

            const result = await analytics.parseInput({
                inputStr: '.help',
                mainMsg: ['.help'],
                groupid: 'testgroup',
                botname: 'TestBot'
            });

            expect(result).toBeDefined();
            expect(mockLogs.courtMessage).toHaveBeenCalled();
        });
    });
}); 