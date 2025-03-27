// Mock dependencies
jest.mock('../modules/records.js', () => ({
    get: jest.fn((type, callback) => callback([])),
    set: jest.fn((type, data, callback) => callback()),
    pushTrpgDatabaseFunction: jest.fn((type, data, callback) => callback()),
    pushtrpgDatabaseAllgroup: jest.fn((type, data, callback) => callback()),
    settrpgDatabasefunction: jest.fn((type, data, callback) => callback())
}));

jest.mock('../modules/check.js', () => ({
    permissionErrMsg: jest.fn(({ flag, gid, role }) => {
        if (role >= 1 || !flag) return null;
        return '權限不足，需要頻道管理員權限';
    }),
    flag: {
        ChkChannelManager: 1,
        ChkChannel: 2
    }
}));

jest.mock('../modules/schema.js', () => ({
    trpgLevelSystem: {
        findOne: jest.fn().mockResolvedValue({
            SwitchV2: 1,
            Title: ['新手', '初心者']
        })
    },
    trpgLevelSystemMember: {
        findOne: jest.fn().mockResolvedValue({
            Level: 1,
            EXP: 100
        }),
        find: jest.fn().mockResolvedValue([
            { userid: 'user1', EXP: 100, name: 'User 1' },
            { userid: 'user2', EXP: 200, name: 'User 2' }
        ])
    }
}));

jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(() => 1)
}));

jest.mock('../roll/rollbase.js', () => ({
    Dice: jest.fn(() => 5),
    DiceINT: jest.fn(() => 10)
}));

jest.mock('../roll/z_Level_system.js', () => ({
    Title: jest.fn(() => ['新手', '初心者']),
    checkTitle: jest.fn(() => '新手')
}));

// Mock the trpgDatabase module
jest.mock('../roll/z_trpgDatabase.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【資料庫功能】 .db(p) (add del show 自定關鍵字)'),
        gameType: jest.fn(() => 'funny:trpgDatabase:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^[.]db$|^[.]dbp$/ig,
            second: null
        }]),
        getHelpMessage: jest.fn(() => `【📚資料庫功能】`),
        initialize: jest.fn(() => ({
            trpgDatabasefunction: [],
            trpgDatabaseAllgroup: []
        })),
        rollDiceCommand: jest.fn()
    };
});

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Import dependencies
const records = require('../modules/records.js');
const VIP = require('../modules/veryImportantPerson');
const checkTools = require('../modules/check.js');
const schema = require('../modules/schema.js');
const rollbase = require('../roll/rollbase.js');

// Import module
const trpgDatabaseModule = require('../roll/z_trpgDatabase.js');

describe('TRPG Database Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(trpgDatabaseModule.gameName()).toBe('【資料庫功能】 .db(p) (add del show 自定關鍵字)');
    });

    test('Test gameType returns correct type', () => {
        expect(trpgDatabaseModule.gameType()).toBe('funny:trpgDatabase:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = trpgDatabaseModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        
        // Test the regex pattern against various inputs
        const regex = patterns[0].first;
        
        // Test .db command
        regex.lastIndex = 0;
        expect(regex.test('.db')).toBe(true);
        
        // Test .dbp command
        regex.lastIndex = 0;
        expect(regex.test('.dbp')).toBe(true);
        
        // Test invalid commands
        regex.lastIndex = 0;
        expect(regex.test('.dba')).toBe(false);
        regex.lastIndex = 0;
        expect(regex.test('db')).toBe(false);
        
        // Test case insensitivity
        regex.lastIndex = 0;
        expect(regex.test('.DB')).toBe(true);
        regex.lastIndex = 0;
        expect(regex.test('.DBP')).toBe(true);
        
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await trpgDatabaseModule.getHelpMessage();
        expect(helpText).toContain('【📚資料庫功能】');
    });

    test('Test help command', async () => {
        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【📚資料庫功能】',
            quotes: true
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【📚資料庫功能】');
        expect(result.quotes).toBe(true);
    });

    test('Test db add command with insufficient permissions', async () => {
        trpgDatabaseModule.rollDiceCommand.mockImplementation(async ({ mainMsg, groupid, userrole }) => {
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

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'add', 'test', 'content'],
            groupid: 'testgroup',
            userrole: 0
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('權限不足，需要頻道管理員權限');
    });

    test('Test db add command with valid input', async () => {
        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增成功: test'
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'add', 'test', 'content'],
            groupid: 'testgroup',
            userrole: 1,
            inputStr: '.db add test content'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('新增成功: test');
    });

    test('Test db add command with limit reached', async () => {
        VIP.viplevelCheckGroup.mockResolvedValue(0);
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgDatabasefunction: Array(30).fill({ topic: 'test', contact: 'content' })
            }]);
        });

        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '關鍵字上限30個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n'
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'add', 'test', 'content'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('關鍵字上限30個');
    });

    test('Test db show command', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgDatabasefunction: [
                    { topic: 'test1', contact: 'content1' },
                    { topic: 'test2', contact: 'content2' }
                ]
            }]);
        });

        trpgDatabaseModule.rollDiceCommand.mockImplementation(async ({ mainMsg, groupid }) => {
            if (mainMsg[1] === 'show') {
                return {
                    type: 'text',
                    text: '資料庫列表:\n0: test1      1: test2',
                    quotes: true
                };
            }
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('資料庫列表');
        expect(result.text).toContain('test1');
        expect(result.text).toContain('test2');
        expect(result.quotes).toBe(true);
    });

    test('Test db show command with no entries', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgDatabasefunction: []
            }]);
        });

        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '沒有已設定的關鍵字. ',
            quotes: true
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('沒有已設定的關鍵字. ');
        expect(result.quotes).toBe(true);
    });

    test('Test db del command with specific index', async () => {
        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '刪除成功: 1'
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'del', '1'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('刪除成功: 1');
    });

    test('Test db del all command', async () => {
        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '刪除所有關鍵字'
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'del', 'all'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('刪除所有關鍵字');
    });

    test('Test dbp add command', async () => {
        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增成功: test'
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.dbp', 'add', 'test', 'content'],
            inputStr: '.dbp add test content'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('新增成功: test');
    });

    test('Test dbp show command', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                trpgDatabaseAllgroup: [
                    { topic: 'test1', contact: 'content1' },
                    { topic: 'test2', contact: 'content2' }
                ]
            }]);
        });

        trpgDatabaseModule.rollDiceCommand.mockImplementation(async ({ mainMsg }) => {
            if (mainMsg[1] === 'show') {
                return {
                    type: 'text',
                    text: '資料庫列表:\n0: test1      1: test2'
                };
            }
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.dbp', 'show']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('資料庫列表');
        expect(result.text).toContain('test1');
        expect(result.text).toContain('test2');
    });

    test('Test keyword with special variables', async () => {
        trpgDatabaseModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '測試{br}換行{ran:100}隨機數字'
        });

        const result = await trpgDatabaseModule.rollDiceCommand({
            mainMsg: ['.db', 'test'],
            groupid: 'testgroup',
            userid: 'user1',
            displayname: 'Test User',
            displaynameDiscord: 'Discord User',
            membercount: 5
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('測試');
        expect(result.text).toContain('換行');
        expect(result.text).toContain('隨機數字');
    });
}); 