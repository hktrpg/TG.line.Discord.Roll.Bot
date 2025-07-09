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

// Create mock modules
const mockRollModule = {
    gameType: () => 'dice',
    prefixs: () => [{
        first: /^\.test$/i,
        second: null
    }],
    rollDiceCommand: jest.fn().mockResolvedValue({
        text: 'Test roll result',
        type: 'text'
    })
};

const mockStateModule = {
    gameType: () => 'state',
    prefixs: () => [{
        first: /^\.state$/i,
        second: null
    }],
    rollDiceCommand: jest.fn().mockResolvedValue({
        text: '',
        type: 'text',
        state: true
    })
};

const mockZStopModule = {
    initialize: () => ({
        save: []
    })
};

// Mock the module system
jest.mock('fs', () => ({
    readdir: jest.fn().mockImplementation((path, callback) => {
        process.nextTick(() => callback(null, ['test.js', 'state.js', 'z_stop.js']));
    })
}));

jest.mock('path', () => ({
    basename: jest.fn().mockImplementation((file) => {
        if (file === 'test.js') return 'test';
        if (file === 'state.js') return 'state';
        if (file === 'z_stop.js') return 'z_stop';
        return 'mockRoll';
    }),
    join: jest.fn().mockReturnValue('../roll/mockRoll.js')
}));

jest.mock('util', () => ({
    promisify: jest.fn().mockReturnValue(() => Promise.resolve(['test.js', 'state.js', 'z_stop.js']))
}));

// Import analytics module
const analytics = require('../modules/analytics.js');

// Add mock modules to analytics exports
analytics.test = mockRollModule;
analytics.state = mockStateModule;
analytics.z_stop = mockZStopModule;

describe('Analytics Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('parseInput Tests', () => {
        test('Test basic input parsing', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test command',
                mainMsg: ['.test', 'command'],
                groupid: 'testgroup',
                userid: 'testuser',
                botname: 'Discord'
            });

            expect(result).toHaveProperty('text');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('LevelUp');
            expect(result).toHaveProperty('statue');
        });

        test('Test EXPUP functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test command',
                mainMsg: ['.test', 'command'],
                groupid: 'testgroup',
                userid: 'testuser',
                displayname: 'Test User',
                displaynameDiscord: 'Discord User',
                membercount: 5
            });

            expect(result.LevelUp).toBe('Level up!');
            expect(result.statue).toBe('active');
        });

        test('Test rolldice functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test command',
                mainMsg: ['.test', 'command'],
                groupid: 'testgroup'
            });

            expect(result.text).toBe('Test roll result');
            expect(result.type).toBe('text');
        });

        test('Test multiple roll times', async () => {
            const result = await analytics.parseInput({
                inputStr: '.3 .test command',
                mainMsg: ['.3', '.test', 'command'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(mockRollModule.rollDiceCommand).toHaveBeenCalled();
        });

        test('Test state functionality', async () => {
            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result.text).toContain('HKTRPG系統狀態報告');
            expect(result.text).toContain('Line');
            expect(result.text).toContain('Discord');
        });
    });

    describe('findRollList Tests', () => {
        test('Test finding roll module with matching prefix', () => {
            const mainMsg = ['.test', 'command'];
            const result = analytics.findRollList(mainMsg);
            expect(result).toBeTruthy();
            expect(result.gameType()).toBe('dice');
        });

        test('Test finding roll module with roll times prefix', () => {
            const mainMsg = ['.3', '.test', 'command'];
            const result = analytics.findRollList(mainMsg);
            expect(result).toBeTruthy();
            expect(result.gameType()).toBe('dice');
        });

        test('Test with non-matching prefix', () => {
            const mainMsg = ['.invalid', 'command'];
            const result = analytics.findRollList(mainMsg);
            expect(result).toBeNull();
        });

        test('Test with empty mainMsg', () => {
            const result = analytics.findRollList([]);
            expect(result).toBeUndefined();
        });
    });

    describe('RollContext Tests', () => {
        test('Test context creation with minimal params', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test command',
                mainMsg: ['.test', 'command']
            });

            expect(result).toBeTruthy();
        });

        test('Test context creation with full params', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test command',
                mainMsg: ['.test', 'command'],
                groupid: 'testgroup',
                userid: 'testuser',
                userrole: 1,
                botname: 'Discord',
                displayname: 'Test User',
                channelid: 'testchannel',
                displaynameDiscord: 'Discord User',
                membercount: 5,
                discordClient: {},
                discordMessage: {},
                titleName: 'Title',
                tgDisplayname: 'TG User'
            });

            expect(result).toBeTruthy();
        });
    });

    describe('Error Handling Tests', () => {
        test('Test rolldice error handling', async () => {
            mockRollModule.rollDiceCommand.mockRejectedValueOnce(new Error('Test error'));

            const result = await analytics.parseInput({
                inputStr: '.test command',
                mainMsg: ['.test', 'command'],
                groupid: 'testgroup'
            });

            expect(result).toBeDefined();
            expect(result.text).toBe('');
            expect(result.type).toBe('text');
        });
    });

    describe('State Text Tests', () => {
        test('Test state text generation', async () => {
            const mockState = {
                LogTime: new Date().toString(),
                StartTime: new Date().toString(),
                LineCountRoll: 100,
                DiscordCountRoll: 200,
                TelegramCountRoll: 300,
                WhatsappCountRoll: 400,
                WWWCountRoll: 500
            };

            const logs = require('../modules/logs');
            logs.getState.mockImplementationOnce(() => Promise.resolve(mockState));

            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result.text).toContain('HKTRPG系統狀態報告');
            expect(result.text).toContain('Line　　 100');
            expect(result.text).toContain('Discord　200');
            expect(result.text).toContain('Telegram 300');
        });

        test('Test state text with missing data', async () => {
            const logs = require('../modules/logs');
            logs.getState.mockImplementationOnce(() => Promise.resolve({}));

            const result = await analytics.parseInput({
                inputStr: '.state',
                mainMsg: ['.state'],
                groupid: 'testgroup'
            });

            expect(result.text).toBe('');
        });
    });
}); 