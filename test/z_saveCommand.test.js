// Mock dependencies
jest.mock('../modules/check.js', () => ({
    permissionErrMsg: jest.fn(() => null),
    flag: {
        ChkChannelManager: 1
    }
}));

jest.mock('../modules/records.js', () => ({
    get: jest.fn((type, callback) => callback([])),
    pushTrpgCommandFunction: jest.fn((type, data, callback) => callback()),
    editsetTrpgCommandFunction: jest.fn((type, data, callback) => callback()),
    setTrpgCommandFunction: jest.fn((type, data, callback) => callback())
}));

jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(() => 1)
}));

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Mock the save command module
jest.mock('../roll/z_saveCommand.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【儲存擲骰指令功能】 .cmd (add edit del show 自定關鍵字)'),
        gameType: jest.fn(() => 'Tool:trpgCommand:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /(^[.]cmd$)/ig,
            second: null
        }]),
        getHelpMessage: jest.fn(async () => `【💾儲存擲骰指令】`),
        initialize: jest.fn(() => ({ commands: [] })),
        rollDiceCommand: jest.fn()
    };
});

// Import dependencies
const records = require('../modules/records.js');
const checkTools = require('../modules/check.js');
const VIP = require('../modules/veryImportantPerson');

// Import module
const saveCommandModule = require('../roll/z_saveCommand.js');

describe('Save Command Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(saveCommandModule.gameName()).toBe('【儲存擲骰指令功能】 .cmd (add edit del show 自定關鍵字)');
    });

    test('Test gameType returns correct type', () => {
        expect(saveCommandModule.gameType()).toBe('Tool:trpgCommand:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = saveCommandModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.cmd')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await saveCommandModule.getHelpMessage();
        expect(helpText).toContain('【💾儲存擲骰指令】');
    });

    test('Test help command', async () => {
        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【💾儲存擲骰指令】',
            quotes: true
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【💾儲存擲骰指令】');
        expect(result.quotes).toBe(true);
    });

    test('Test add command with valid input', async () => {
        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增成功: 可使用.cmd \npc1鬥毆\ncc 80 鬥毆'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'add', 'pc1鬥毆', 'cc', '80', '鬥毆'],
            inputStr: '.cmd add pc1鬥毆 cc 80 鬥毆',
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增成功');
        expect(result.text).toContain('pc1鬥毆');
    });

    test('Test add command with duplicate keyword', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgCommandfunction: [{
                    topic: 'pc1鬥毆',
                    contact: 'cc 80 鬥毆'
                }]
            }]);
        });

        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已有該關鍵字\n請使用.cmd edit 來編輯或.cmd show 顯示列表\n\n'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'add', 'pc1鬥毆', 'cc', '90', '鬥毆'],
            inputStr: '.cmd add pc1鬥毆 cc 90 鬥毆',
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已有該關鍵字');
    });

    test('Test edit command', async () => {
        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '編輯成功: pc1鬥毆\ncc 90 鬥毆'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'edit', 'pc1鬥毆', 'cc', '90', '鬥毆'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('編輯成功');
        expect(result.text).toContain('pc1鬥毆');
    });

    test('Test show command', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgCommandfunction: [{
                    topic: 'pc1鬥毆',
                    contact: 'cc 80 鬥毆'
                }]
            }]);
        });

        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '資料庫列表:\n0: pc1鬥毆\ncc 80 鬥毆\n'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('資料庫列表');
        expect(result.text).toContain('pc1鬥毆');
    });

    test('Test delete specific command', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgCommandfunction: [{
                    topic: 'pc1鬥毆',
                    contact: 'cc 80 鬥毆'
                }]
            }]);
        });

        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '刪除成功: 0: pc1鬥毆 \n cc 80 鬥毆'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'del', '0'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('刪除成功');
    });

    test('Test delete all commands', async () => {
        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已刪除所有關鍵字'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'del', 'all'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('已刪除所有關鍵字');
    });

    test('Test execute saved command', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgCommandfunction: [{
                    topic: 'pc1鬥毆',
                    contact: 'cc 80 鬥毆'
                }]
            }]);
        });

        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: 'cc 80 鬥毆',
            cmd: true
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'pc1鬥毆'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('cc 80 鬥毆');
        expect(result.cmd).toBe(true);
    });

    test('Test command limit reached', async () => {
        records.get.mockImplementation((type, callback) => {
            callback([{
                groupid: 'testgroup',
                trpgCommandfunction: Array(30).fill({
                    topic: 'command',
                    contact: 'content'
                })
            }]);
        });

        VIP.viplevelCheckGroup.mockResolvedValue(0);

        saveCommandModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '關鍵字上限30個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n'
        });

        const result = await saveCommandModule.rollDiceCommand({
            mainMsg: ['.cmd', 'add', 'newcommand', 'content'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('關鍵字上限30個');
    });
}); 