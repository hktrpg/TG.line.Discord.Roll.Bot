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
}); 