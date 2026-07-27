// Mock dependencies
jest.mock('../modules/db/watchdog.js', () => ({
    isDbOnline: jest.fn(() => true)
}));

jest.mock('../modules/db/schema.js', () => ({
    eventList: {
        find: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn(),
        findOneAndDelete: jest.fn(),
        aggregate: jest.fn()
    },
    eventMember: {
        findOne: jest.fn(),
        updateOne: jest.fn(),
        findOneAndUpdate: jest.fn()
    },
    trpgLevelSystem: {
        findOne: jest.fn()
    },
    trpgLevelSystemMember: {
        findOne: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn()
    }
}));

jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckUser: jest.fn(() => 0),
    viplevelCheckGroup: jest.fn(() => 0)
}));

jest.mock('../roll/rollbase', () => ({
    Dice: jest.fn(() => 1),
    DiceINT: jest.fn(() => 1)
}));

// Mock the event module
jest.mock('../roll/z_event.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【事件功能】 .event (add edit show delete) .evt (event 任何名字)'),
        gameType: jest.fn(() => 'Funny:trpgevent:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^\.event|^\.evt/i,
            second: null
        }]),
        getHelpMessage: jest.fn(() => `【🎲事件功能】
基本指令
事件指令
能量系統`),
        rollDiceCommand: jest.fn()
    };
});

// Set environment variables
process.env.mongoURL = 'test_mongo_url';
process.env.DEBUG = 'true';

// Import dependencies
    const _dbWatchdog = require('../modules/db/watchdog.js');
const schema = require('../modules/db/schema.js');
const VIP = require('../modules/patreon/veryImportantPerson');
const rollDice = require('../roll/rollbase');

// Import module
const eventModule = require('../roll/z_event.js');

describe('Event Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset schema mocks
        schema.eventList.find.mockResolvedValue([]);
        schema.eventList.findOne.mockResolvedValue(null);
        schema.eventList.updateOne.mockResolvedValue({});
        schema.eventList.findOneAndDelete.mockResolvedValue({});
        schema.eventList.aggregate.mockResolvedValue([]);
        schema.eventMember.findOne.mockResolvedValue(null);
        schema.eventMember.updateOne.mockResolvedValue({});
        schema.eventMember.findOneAndUpdate.mockResolvedValue({});
        schema.trpgLevelSystem.findOne.mockResolvedValue({ SwitchV2: true });
        schema.trpgLevelSystemMember.findOne.mockResolvedValue({ Level: 1, EXP: 100, name: 'Test User' });
        schema.trpgLevelSystemMember.updateOne.mockResolvedValue({});
        schema.trpgLevelSystemMember.updateMany.mockResolvedValue({});
        schema.trpgLevelSystemMember.aggregate.mockResolvedValue([]);
        VIP.viplevelCheckUser.mockResolvedValue(0);
        VIP.viplevelCheckGroup.mockResolvedValue(0);
        rollDice.Dice.mockReturnValue(1);
        rollDice.DiceINT.mockReturnValue(1);

        // Reset event module mocks
        eventModule.rollDiceCommand.mockReset();
    });

    test('Test gameName returns correct name', () => {
        expect(eventModule.gameName()).toBe('【事件功能】 .event (add edit show delete) .evt (event 任何名字)');
    });

    test('Test gameType returns correct type', () => {
        expect(eventModule.gameType()).toBe('Funny:trpgevent:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = eventModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.event')).toBe(true);
        expect(patterns[0].first.test('.evt')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = eventModule.getHelpMessage();
        expect(helpText).toContain('【🎲事件功能】');
        expect(helpText).toContain('基本指令');
        expect(helpText).toContain('事件指令');
        expect(helpText).toContain('能量系統');
    });

    test('Test help command', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【🎲事件功能】\n基本指令\n事件指令\n能量系統',
            quotes: true
        });

        const result = await eventModule.rollDiceCommand({
            mainMsg: ['.event', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲事件功能】');
        expect(result.quotes).toBe(true);
    });

    test('Test add event command with valid input', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增/修改事件 Test Event SAN Test Series',
            quotes: true
        });

        const inputStr = `.event add
name:Test Event
chain:Test Series
exp:SAN
0:Nothing happens
1:Good thing happens
-1:Bad thing happens`;

        const result = await eventModule.rollDiceCommand({
            inputStr,
            mainMsg: ['.event', 'add', 'Test Event'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User',
            displaynameDiscord: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增/修改事件');
        expect(result.text).toContain('Test Event');
        expect(result.text).toContain('SAN');
        expect(result.text).toContain('Test Series');
    });

    test('Test add event command with invalid input', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增事件失敗 至少設定 3 個結果',
            quotes: true
        });

        const inputStr = `.event add
name:Test Event
exp:SAN
0:Nothing happens`;

        const result = await eventModule.rollDiceCommand({
            inputStr,
            mainMsg: ['.event', 'add', 'Test Event'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增事件失敗');
        expect(result.text).toContain('至少設定 3 個結果');
    });

    test('Test delete event command', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '刪除事件成功 Test Event',
            quotes: true
        });

        const result = await eventModule.rollDiceCommand({
            mainMsg: ['.event', 'delete', 'Test Event'],
            groupid: 'testgroup',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('刪除事件成功');
        expect(result.text).toContain('Test Event');
    });

    test('Test show events command', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: 'Test User EN: 20',
            quotes: true
        });

        const result = await eventModule.rollDiceCommand({
            mainMsg: ['.event', 'show'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('Test User');
        expect(result.text).toContain('EN:');
        expect(result.quotes).toBe(true);
    });

    test('Test random event command', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '🔗 **隨機事件發生** Random Event',
            quotes: true
        });

        const result = await eventModule.rollDiceCommand({
            mainMsg: ['.evt', 'random'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('🔗 **隨機事件發生**');
        expect(result.text).toContain('Random Event');
        expect(result.quotes).toBe(true);
    });

    test('Test event command with insufficient energy', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '沒有足夠EN',
            quotes: true
        });

        const result = await eventModule.rollDiceCommand({
            mainMsg: ['.evt', 'random'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('沒有足夠EN');
    });

    test('Test useExp command', async () => {
        eventModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '你已把100EXP加到這群組的帳號裡',
            quotes: true
        });

        const result = await eventModule.rollDiceCommand({
            mainMsg: ['.event', 'useExp'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('你已把100EXP加到這群組的帳號裡');
    });
}); 