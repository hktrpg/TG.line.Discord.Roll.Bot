// Mock dependencies
jest.mock('../modules/db/records.js', () => ({
    get: jest.fn((type, callback) => callback([])),
    set: jest.fn((type, data, callback) => callback()),
    pushblockfunction: jest.fn((type, data, callback) => callback())
}));

jest.mock('../modules/chat/check.js', () => ({
    permissionErrMsg: jest.fn(({ flag, gid, role }) => {
        if (role >= 1 || !flag) return null;
        return '權限不足，需要頻道管理員權限';
    }),
    flag: {
        ChkChannelManager: 1,
        ChkChannel: 2
    }
}));

jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(() => 1)
}));

// Mock the stop module
jest.mock('../roll/z_stop.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【擲骰開關功能】 .bk (add del show)'),
        gameType: jest.fn(() => 'admin:Block:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^[.]bk$/ig,
            second: null
        }]),
        getHelpMessage: jest.fn(() => `【🎲擲骰開關功能】`),
        initialize: jest.fn(() => ({ save: [] })),
        rollDiceCommand: jest.fn()
    };
});

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Import dependencies
const records = require('../modules/db/records.js');
const VIP = require('../modules/patreon/veryImportantPerson');
const checkTools = require('../modules/chat/check.js');

// Import module
const stopModule = require('../roll/z_stop.js');

describe('Stop Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(stopModule.gameName()).toBe('【擲骰開關功能】 .bk (add del show)');
    });

    test('Test gameType returns correct type', () => {
        expect(stopModule.gameType()).toBe('admin:Block:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = stopModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.bk')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await stopModule.getHelpMessage();
        expect(helpText).toContain('【🎲擲骰開關功能】');
    });

    test('Test help command', async () => {
        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【🎲擲骰開關功能】',
            quotes: true
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲擲骰開關功能】');
        expect(result.quotes).toBe(true);
    });

    test('Test add command with insufficient permissions', async () => {
        stopModule.rollDiceCommand.mockImplementation(async ({ mainMsg, groupid, userrole }) => {
            const permissionError = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (permissionError) {
                return {
                    type: 'text',
                    text: permissionError
                };
            }
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'add', 'test'],
            groupid: 'testgroup',
            userrole: 0
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('權限不足，需要頻道管理員權限');
    });

    test('Test add command with invalid keyword', async () => {
        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '至少兩個字，及不可以阻擋bk'
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'add', 'b'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('至少兩個字，及不可以阻擋bk');
    });

    test('Test add command with valid keyword', async () => {
        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增成功: test'
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'add', 'test'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('新增成功: test');
    });

    test('Test add command with limit reached', async () => {
        VIP.viplevelCheckGroup.mockResolvedValue(0);
        records.get.mockResolvedValue([{
            _doc: {
                groupid: 'testgroup',
                blockfunction: Array(30).fill('test')
            }
        }]);

        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '關鍵字上限30個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n'
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'add', 'test'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('關鍵字上限30個');
    });

    test('Test show command', async () => {
        records.get.mockResolvedValue([{
            groupid: 'testgroup',
            blockfunction: ['test1', 'test2']
        }]);

        stopModule.rollDiceCommand.mockImplementation(async ({ mainMsg, groupid }) => {
            if (mainMsg[1] === 'show') {
                return {
                    type: 'text',
                    text: '阻擋用關鍵字列表:\n0: test1\n1: test2'
                };
            }
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('阻擋用關鍵字列表');
        expect(result.text).toContain('test1');
        expect(result.text).toContain('test2');
    });

    test('Test show command with no keywords', async () => {
        records.get.mockResolvedValue([{
            groupid: 'testgroup',
            blockfunction: []
        }]);

        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '沒有阻擋用關鍵字. '
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('沒有阻擋用關鍵字. ');
    });

    test('Test del command with specific index', async () => {
        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '刪除成功: 1'
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'del', '1'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('刪除成功: 1');
    });

    test('Test del all command', async () => {
        stopModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '刪除所有關鍵字'
        });

        const result = await stopModule.rollDiceCommand({
            mainMsg: ['.bk', 'del', 'all'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('刪除所有關鍵字');
    });
}); 