// Mock dependencies
jest.mock('fs', () => ({
    readdir: jest.fn()
}));

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

jest.mock('../modules/logs', () => ({
    courtMessage: jest.fn(),
    getState: jest.fn().mockResolvedValue({
        LogTime: new Date().toString(),
        StartTime: new Date().toString(),
        LineCountRoll: 100,
        DiscordCountRoll: 200,
        TelegramCountRoll: 300,
        WhatsappCountRoll: 400,
        WWWCountRoll: 500
    })
}));

// Mock test command module
const mockCommandModule = {
    prefixs: () => [{
        first: /^\.test$/i,
        second: null
    }],
    gameType: () => 'dice:test',
    rollDiceCommand: jest.fn().mockResolvedValue({
        text: 'Test roll',
        type: 'text'
    })
};

// Mock z_stop module
const mockZStopModule = {
    initialize: () => ({
        save: [{
            groupid: 'group1',
            blockfunction: ['blocked']
        }]
    })
};

// Import the module
const analytics = require('../modules/analytics.js');

// Add mock modules to exports
analytics.testCommand = mockCommandModule;
analytics.z_stop = mockZStopModule;

describe('Analytics Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset exports but keep necessary mocks
        Object.keys(analytics).forEach(key => {
            if (!['debugMode', 'parseInput', 'findRollList', 'testCommand', 'z_stop'].includes(key)) {
                delete analytics[key];
            }
        });
    });

    describe('Input Processing Tests', () => {
        test('processes basic command input', async () => {
            const result = await analytics.parseInput({
                inputStr: '.test command',
                groupid: 'group1',
                userid: 'user1'
            });

            expect(result.text).toBe('Test roll');
            expect(result.type).toBe('text');
            expect(result.LevelUp).toBe('Level up!');
            expect(result.statue).toBe('active');
        });

        test('handles empty input', async () => {
            const result = await analytics.parseInput({
                inputStr: '',
                groupid: null
            });

            expect(result.text).toBe('');
            expect(result.type).toBe('text');
            expect(result.LevelUp).toBe('');
            expect(result.statue).toBe('');
        });

        test('processes state command', async () => {
            mockCommandModule.rollDiceCommand.mockResolvedValueOnce({
                text: '',
                type: 'text',
                state: true
            });

            const result = await analytics.parseInput({
                inputStr: '.test state',
                groupid: 'group1'
            });

            expect(result.text).toContain('HKTRPG系統狀態報告');
            expect(result.text).toContain('Line');
            expect(result.text).toContain('Discord');
            expect(result.text).toContain('Telegram');
        });

        test('handles blocked commands', async () => {
            const result = await analytics.parseInput({
                inputStr: '.blocked command',
                groupid: 'group1'
            });

            expect(result.text).toBe('');
            expect(result.type).toBe('text');
        });
    });

    describe('findRollList Function Tests', () => {
        test('finds command module by prefix', () => {
            const mainMsg = ['.test', 'command'];
            const result = analytics.findRollList(mainMsg);
            expect(result).toBe(mockCommandModule);
        });

        test('returns undefined for unknown command', () => {
            const mainMsg = ['.unknown', 'command'];
            const result = analytics.findRollList(mainMsg);
            expect(result).toBeUndefined();
        });

        test('handles empty input', () => {
            expect(analytics.findRollList([])).toBeUndefined();
            expect(analytics.findRollList()).toBeUndefined();
            expect(analytics.findRollList(null)).toBeUndefined();
        });

        test('handles roll times prefix', () => {
            const mainMsg = ['.2', '.test', 'command'];
            const result = analytics.findRollList(mainMsg);
            expect(result).toBe(mockCommandModule);
            expect(mainMsg).toEqual(['.test', 'command']);
        });
    });

    describe('Error Handling Tests', () => {
        test('handles rollDiceCommand errors', async () => {
            mockCommandModule.rollDiceCommand.mockRejectedValueOnce(new Error('Test error'));
            
            const result = await analytics.parseInput({
                inputStr: '.test error',
                groupid: 'group1'
            });

            expect(result.text).toBe('');
            expect(result.type).toBe('text');
        });

        test('handles missing dependencies', async () => {
            delete analytics.testCommand;
            
            const result = await analytics.parseInput({
                inputStr: '.test command',
                groupid: 'group1'
            });

            expect(result.text).toBe('');
            expect(result.type).toBe('text');
        });
    });

    describe('Multiple Roll Tests', () => {
        beforeEach(() => {
            let rollCount = 0;
            mockCommandModule.rollDiceCommand.mockImplementation(() => {
                rollCount++;
                return Promise.resolve({
                    text: `Roll #${rollCount}`,
                    type: 'text'
                });
            });
        });

        test('handles multiple rolls with dice commands', async () => {
            const result = await analytics.parseInput({
                inputStr: '.3 .test command',
                groupid: 'group1'
            });

            expect(mockCommandModule.rollDiceCommand).toHaveBeenCalledTimes(3);
        });

        test('limits maximum roll times to 10', async () => {
            const result = await analytics.parseInput({
                inputStr: '.20 .test command',
                groupid: 'group1'
            });

            expect(mockCommandModule.rollDiceCommand).toHaveBeenCalledTimes(10);
        });

        test('handles single roll correctly', async () => {
            mockCommandModule.rollDiceCommand.mockResolvedValueOnce({
                text: 'Single roll',
                type: 'text'
            });

            const result = await analytics.parseInput({
                inputStr: '.test command',
                groupid: 'group1'
            });

            expect(mockCommandModule.rollDiceCommand).toHaveBeenCalledTimes(1);
        });
    });
}); 