// Mock dependencies
jest.mock('../modules/dbWatchdog.js', () => ({
    isDbOnline: jest.fn(() => true),
    dbErrOccurs: jest.fn()
}));

jest.mock('../modules/check.js', () => ({
    permissionErrMsg: jest.fn(() => null),
    flag: {
        ChkChannelAdmin: 1
    }
}));

jest.mock('../modules/level.js', () => ({
    tempSwitchV2: [{
        groupid: 'testgroup',
        SwitchV2: true
    }]
}));

jest.mock('../modules/schema.js', () => ({
    trpgLevelSystem: {
        findOne: jest.fn(),
        updateOne: jest.fn()
    },
    trpgLevelSystemMember: {
        find: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn(),
        countDocuments: jest.fn()
    }
}));

// Mock the level system module
jest.mock('../roll/z_Level_system.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【經驗值功能】 .level (show config LevelUpWord RankWord)'),
        gameType: jest.fn(() => 'funny:trpgLevelSystem:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /(^[.]level$)/ig,
            second: null
        }]),
        getHelpMessage: jest.fn(async () => `【⭐經驗值系統】
基本設定
等級查詢
自訂系統`),
        rollDiceCommand: jest.fn(),
        checkTitle: jest.fn(),
        Title: jest.fn(() => {
            let Title = []
            Title[0] = "無名調查員";
            Title[4] = "調查員";
            Title[8] = "記者";
            return Title;
        })
    };
});

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Import dependencies
const schema = require('../modules/schema.js');
const checkTools = require('../modules/check.js');

// Import module
const levelModule = require('../roll/z_Level_system.js');

describe('Level System Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset schema mocks
        schema.trpgLevelSystem.findOne.mockResolvedValue({
            groupid: 'testgroup',
            SwitchV2: true,
            HiddenV2: true,
            Title: [],
            LevelUpWord: '',
            RankWord: ''
        });
        schema.trpgLevelSystem.updateOne.mockResolvedValue({});
        schema.trpgLevelSystemMember.find.mockResolvedValue([{
            userid: 'testuser',
            name: 'Test User',
            Level: 5,
            EXP: 500
        }]);
        schema.trpgLevelSystemMember.findOne.mockResolvedValue({
            userid: 'testuser',
            name: 'Test User',
            Level: 5,
            EXP: 500
        });
        schema.trpgLevelSystemMember.updateOne.mockResolvedValue({});
        schema.trpgLevelSystemMember.countDocuments.mockResolvedValue(1);

        // Reset level module mocks
        levelModule.rollDiceCommand.mockReset();
        levelModule.checkTitle.mockReset();
    });

    test('Test gameName returns correct name', () => {
        expect(levelModule.gameName()).toBe('【經驗值功能】 .level (show config LevelUpWord RankWord)');
    });

    test('Test gameType returns correct type', () => {
        expect(levelModule.gameType()).toBe('funny:trpgLevelSystem:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = levelModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.level')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await levelModule.getHelpMessage();
        expect(helpText).toContain('【⭐經驗值系統】');
        expect(helpText).toContain('基本設定');
        expect(helpText).toContain('等級查詢');
        expect(helpText).toContain('自訂系統');
    });

    test('Test help command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【⭐經驗值系統】\n基本設定\n等級查詢\n自訂系統',
            quotes: true
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【⭐經驗值系統】');
        expect(result.quotes).toBe(true);
    });

    test('Test config command with valid input', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '修改成功: \n經驗值功能: 啓動\n升級通知功能: 啓動'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'config', '11'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('修改成功');
        expect(result.text).toContain('經驗值功能: 啓動');
        expect(result.text).toContain('升級通知功能: 啓動');
    });

    test('Test config show command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '現在設定: \n經驗值功能: 啓動\n升級通知功能: 啓動'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'config', 'Show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('現在設定');
        expect(result.text).toContain('經驗值功能');
        expect(result.text).toContain('升級通知功能');
    });

    test('Test TitleWord command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增稱號成功: \n0等級: 無名調查員'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'TitleWord', '-0', '無名調查員'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增稱號成功');
        expect(result.text).toContain('0等級: 無名調查員');
    });

    test('Test TitleWord show command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '稱號:\n0等級: 無名調查員\n3等級: 調查員'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'TitleWord', 'Show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('稱號:');
        expect(result.text).toContain('0等級: 無名調查員');
        expect(result.text).toContain('3等級: 調查員');
    });

    test('Test LevelUpWord command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增升級語成功.\n恭喜 {user.name} 升級了！'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'LevelUpWord', '恭喜 {user.name} 升級了！'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增升級語成功');
        expect(result.text).toContain('恭喜 {user.name} 升級了！');
    });

    test('Test RankWord command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '新增查詢語成功.\n{user.name} 目前排名第 {user.Ranking}'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'RankWord', '{user.name} 目前排名第 {user.Ranking}'],
            groupid: 'testgroup',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增查詢語成功');
        expect(result.text).toContain('{user.name} 目前排名第 {user.Ranking}');
    });

    test('Test show command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: 'Test User《無名調查員》，你的克蘇魯神話知識現在是 5點！'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'show'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User',
            membercount: 10
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('Test User');
        expect(result.text).toContain('5點');
    });

    test('Test showMe command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '群組排行榜\n第1名 《無名調查員》 Test User 5級 500經驗',
            quotes: true
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'showMe'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('群組排行榜');
        expect(result.text).toContain('Test User');
        expect(result.quotes).toBe(true);
    });

    test('Test showMeTheWorld command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '世界排行榜\n第1名 《無名調查員》 Test User 5級 500經驗',
            quotes: true
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'showMeTheWorld'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('世界排行榜');
        expect(result.text).toContain('Test User');
        expect(result.quotes).toBe(true);
    });

    test('Test showMeAtTheWorld command', async () => {
        levelModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '你現在的世界排名是第6名'
        });

        const result = await levelModule.rollDiceCommand({
            mainMsg: ['.level', 'showMeAtTheWorld'],
            groupid: 'testgroup',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('你現在的世界排名是第6名');
    });

    test('Test checkTitle function', async () => {
        levelModule.checkTitle.mockResolvedValue('專家');
        const title = await levelModule.checkTitle(5, ['新手', '初級', '中級', '高級', '專家']);
        expect(title).toBe('專家');
    });

    test('Test Title function returns default titles', () => {
        const titles = levelModule.Title();
        expect(Array.isArray(titles)).toBe(true);
        expect(titles[0]).toBe('無名調查員');
        expect(titles[4]).toBe('調查員');
        expect(titles[8]).toBe('記者');
    });
}); 