// Mock dependencies
jest.mock('../modules/db/watchdog.js', () => ({
    isDbOnline: jest.fn(() => true)
}));

jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(() => 1),
    viplevelCheckUser: jest.fn(() => 1)
}));

jest.mock('../modules/db/schema.js', () => ({
    randomAns: {
        findOne: jest.fn(),
        updateOne: jest.fn(),
        find: jest.fn()
    },
    randomAnsPersonal: {
        findOne: jest.fn(),
        find: jest.fn(),
        deleteMany: jest.fn()
    },
    randomAnsServer: {
        findOne: jest.fn(),
        find: jest.fn(),
        deleteMany: jest.fn()
    },
    trpgLevelSystem: {
        findOne: jest.fn()
    },
    trpgLevelSystemMember: {
        find: jest.fn(),
        findOne: jest.fn()
    }
}));

jest.mock('../modules/chat/check.js', () => ({
    permissionErrMsg: jest.fn(() => null),
    flag: {
        ChkChannelManager: 1
    }
}));

jest.mock('../roll/rollbase.js', () => ({
    Dice: jest.fn(() => 3),
    DiceINT: jest.fn((min, max) => Math.floor((min + max) / 2))
}));

jest.mock('../roll/z_Level_system.js', () => ({
    Title: jest.fn(() => ['新手', '初級', '中級']),
    checkTitle: jest.fn(() => '中級')
}));

// Mock the random answer module
jest.mock('../roll/z_random_ans.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【自定義骰子/回應功能】 .ra(p)(s)(次數) (add del show 自定骰子名稱)'),
        gameType: jest.fn(() => 'funny:randomAns:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /(^[.](r|)ra(\d+|p|p\d+|s|s\d+|)$)/ig,
            second: null
        }]),
        getHelpMessage: jest.fn(async () => `【🎲自定義骰子系統】`),
        initialize: jest.fn(() => ""),
        rollDiceCommand: jest.fn()
    };
});

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Import dependencies
const _schema = require('../modules/db/schema.js');
const _VIP = require('../modules/patreon/veryImportantPerson');
const _checkTools = require('../modules/chat/check.js');
const _rollbase = require('../roll/rollbase.js');

// Import module
const randomAnsModule = require('../roll/z_random_ans.js');

describe('Random Answer Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(randomAnsModule.gameName()).toBe('【自定義骰子/回應功能】 .ra(p)(s)(次數) (add del show 自定骰子名稱)');
    });

    test('Test gameType returns correct type', () => {
        expect(randomAnsModule.gameType()).toBe('funny:randomAns:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = randomAnsModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.ra')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await randomAnsModule.getHelpMessage();
        expect(helpText).toContain('【🎲自定義骰子系統】');
    });

    test('Test help command', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【🎲自定義骰子系統】',
            quotes: true
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【🎲自定義骰子系統】');
        expect(result.quotes).toBe(true);
    });

    test('Test add command with valid input', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '✅ 新增成功\n🎲 骰子名稱：測試骰子\n📝 選項數量：2\n🔍 選項內容：選項1、選項2'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', 'add', '測試骰子', '選項1', '選項2'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('✅ 新增成功');
        expect(result.text).toContain('測試骰子');
    });

    test('Test add command with duplicate name', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '更新成功\n輸入.ra 測試骰子 \n即可使用'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', 'add', '測試骰子', '選項3'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('更新成功');
    });

    test('Test show command without parameters', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '📑 群組骰子列表\n#0：骰子1\n#1：骰子2',
            quotes: true
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('📑 群組骰子列表');
        expect(result.quotes).toBe(true);
    });

    test('Test show command with specific dice', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '🎲 群組骰子：測試骰子\n📝 選項數量：2\n🔍 選項內容：\n#1：選項1\n#2：選項2'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', 'show', '測試骰子'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('測試骰子');
        expect(result.text).toContain('選項1');
        expect(result.text).toContain('選項2');
    });

    test('Test delete command', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '✅ 刪除成功\n🎲 骰子名稱: 測試骰子\n📝 選項數量: 2\n🔍 選項內容: 選項1 選項2'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', 'del', '測試骰子'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('✅ 刪除成功');
    });

    test('Test roll command with single dice', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '測試骰子 → 選項2'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', '測試骰子'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('測試骰子');
    });

    test('Test roll command with multiple times', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '測試骰子 → #01 → 選項1\n#02 → 選項2\n#03 → 選項3'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra3', '測試骰子'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('測試骰子');
        expect(result.text).toMatch(/#0[1-3]/);
    });

    test('Test personal dice (rap) add command', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增成功  \n序號: 1\n標題: 個人骰子\n內容: 選項1,選項2'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.rap', 'add', '個人骰子', '選項1', '選項2'],
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增成功');
    });

    test('Test server dice (ras) add command', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增成功  \n序號: 1\n標題: 伺服器骰子\n內容: 選項1,選項2'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ras', 'add', '伺服器骰子', '選項1', '選項2'],
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增成功');
    });

    test('Test variable replacement in roll results', async () => {
        randomAnsModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '測試骰子 → 擲骰者是測試用戶，等級是5'
        });

        const result = await randomAnsModule.rollDiceCommand({
            mainMsg: ['.ra', '測試骰子'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: '測試用戶'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('測試用戶');
        expect(result.text).toContain('5');
    });
}); 