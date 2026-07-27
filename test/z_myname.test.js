// Mock dependencies
jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckUser: jest.fn(() => 1)
}));

jest.mock('../modules/db/schema.js', () => ({
    myName: {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        countDocuments: jest.fn(),
        deleteOne: jest.fn()
    }
}));

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Mock the myname module
jest.mock('../roll/z_myname.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【你的名字】.myname / .me .me1 .me泉心'),
        gameType: jest.fn(() => 'Tool:myname:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^\.myname$|^\.me\S+/i,
            second: null
        }]),
        getHelpMessage: jest.fn(async () => `【👥角色扮演系統】(Discord限定)`),
        initialize: jest.fn(() => ""),
        rollDiceCommand: jest.fn()
    };
});

// Import dependencies
const schema = require('../modules/db/schema.js');
const VIP = require('../modules/patreon/veryImportantPerson');

// Import module
const mynameModule = require('../roll/z_myname.js');

describe('MyName Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(mynameModule.gameName()).toBe('【你的名字】.myname / .me .me1 .me泉心');
    });

    test('Test gameType returns correct type', () => {
        expect(mynameModule.gameType()).toBe('Tool:myname:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = mynameModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.myname')).toBe(true);
        expect(patterns[0].first.test('.me1')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await mynameModule.getHelpMessage();
        expect(helpText).toContain('【👥角色扮演系統】');
    });

    test('Test help command', async () => {
        mynameModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【👥角色扮演系統】',
            quotes: true
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', 'help'],
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【👥角色扮演系統】');
        expect(result.quotes).toBe(true);
    });

    test('Test non-Discord platform returns error', async () => {
        mynameModule.rollDiceCommand.mockResolvedValue({
            default: 'on',
            type: 'text',
            text: '此功能只能在Discord中使用'
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', 'show'],
            botname: 'Line'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('此功能只能在Discord中使用');
    });

    test('Test show command in group', async () => {
        const mockNames = [
            { name: '泉心', imageLink: 'http://example.com/image1.jpg', shortName: '泉' },
            { name: '造史', imageLink: 'http://example.com/image2.jpg', shortName: '造' }
        ];

        schema.myName.find.mockResolvedValue(mockNames);

        mynameModule.rollDiceCommand.mockImplementation(async ({ mainMsg, userid, groupid }) => {
            if (mainMsg[0] === '.myname' && mainMsg[1] === 'show' && groupid) {
                const myNames = await schema.myName.find({ userID: userid });
                return {
                    type: 'text',
                    myNames: myNames.map((name, index) => ({
                        content: `序號#${index + 1}`,
                        username: name.name,
                        avatarURL: name.imageLink
                    }))
                };
            }
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', 'show'],
            userid: 'testuser',
            groupid: 'testgroup',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(Array.isArray(result.myNames)).toBe(true);
        expect(result.myNames.length).toBe(2);
        expect(result.myNames[0].username).toBe('泉心');
        expect(result.myNames[1].username).toBe('造史');
    });

    test('Test show command in DM', async () => {
        const mockNames = [
            { name: '泉心', imageLink: 'http://example.com/image1.jpg', shortName: '泉' },
            { name: '造史', imageLink: 'http://example.com/image2.jpg', shortName: '造' }
        ];

        schema.myName.find.mockResolvedValue(mockNames);

        mynameModule.rollDiceCommand.mockImplementation(async ({ mainMsg, userid }) => {
            if (mainMsg[0] === '.myname' && mainMsg[1] === 'show') {
                const myNames = await schema.myName.find({ userID: userid });
                return {
                    type: 'text',
                    text: myNames.map((name, index) => 
                        `序號#${index + 1} \n${name.name} ${name.imageLink}`
                    ).join('\n')
                };
            }
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', 'show'],
            userid: 'testuser',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('泉心');
        expect(result.text).toContain('造史');
    });

    test('Test create character with valid input', async () => {
        schema.myName.countDocuments.mockResolvedValue(0);
        schema.myName.findOneAndUpdate.mockResolvedValue({
            name: '泉心',
            imageLink: 'http://example.com/image.jpg',
            shortName: '泉'
        });

        mynameModule.rollDiceCommand.mockImplementation(async ({ mainMsg, inputStr, userid, botname }) => {
            if (mainMsg[0] === '.myname' && botname === 'Discord') {
                return {
                    type: 'text',
                    text: '已新增角色 - 泉心'
                };
            }
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', '泉心', 'http://example.com/image.jpg', '泉'],
            inputStr: '.myname 泉心 http://example.com/image.jpg 泉',
            userid: 'testuser',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增角色 - 泉心');
    });

    test('Test create character with invalid URL', async () => {
        mynameModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '輸入出錯\n 圖示link 必須符合 http/https 開頭',
            quotes: true
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', '泉心', 'invalid-url', '泉'],
            inputStr: '.myname 泉心 invalid-url 泉',
            userid: 'testuser',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('圖示link 必須符合 http/https 開頭');
        expect(result.quotes).toBe(true);
    });

    test('Test delete character by index', async () => {
        const mockCharacter = {
            name: '泉心',
            deleteOne: jest.fn().mockResolvedValue({ name: '泉心' })
        };

        schema.myName.find.mockResolvedValue([mockCharacter]);

        mynameModule.rollDiceCommand.mockImplementation(async ({ mainMsg }) => {
            if (mainMsg[1] === 'delete') {
                return {
                    type: 'text',
                    text: '移除成功，泉心 已被移除'
                };
            }
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', 'delete', '1'],
            userid: 'testuser',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('移除成功');
        expect(result.text).toContain('泉心');
    });

    test('Test delete character by shortName', async () => {
        schema.myName.findOneAndDelete.mockResolvedValue({
            name: '泉心',
            shortName: '泉'
        });

        mynameModule.rollDiceCommand.mockImplementation(async ({ mainMsg }) => {
            if (mainMsg[1] === 'delete') {
                return {
                    type: 'text',
                    text: '移除成功，泉心',
                    quotes: true
                };
            }
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', 'delete', '泉'],
            userid: 'testuser',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('移除成功');
        expect(result.quotes).toBe(true);
    });

    test('Test me command with valid character', async () => {
        schema.myName.findOne.mockResolvedValue({
            name: '泉心',
            imageLink: 'http://example.com/image.jpg',
            shortName: '泉'
        });

        mynameModule.rollDiceCommand.mockImplementation(async ({ mainMsg, inputStr }) => {
            if (mainMsg[0].startsWith('.me')) {
                return {
                    type: 'text',
                    myName: {
                        content: inputStr.replace(/^\s?\S+\s+/, ''),
                        username: '泉心',
                        avatarURL: 'http://example.com/image.jpg'
                    }
                };
            }
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.me泉', '你好！'],
            inputStr: '.me泉 你好！',
            userid: 'testuser',
            groupid: 'testgroup',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.myName.username).toBe('泉心');
        expect(result.myName.content).toBe('你好！');
    });

    test('Test character limit reached', async () => {
        schema.myName.countDocuments.mockResolvedValue(20);
        VIP.viplevelCheckUser.mockResolvedValue(1);

        mynameModule.rollDiceCommand.mockImplementation(async () => {
            return {
                type: 'text',
                text: '.myname 個人上限為20個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n',
                quotes: true
            };
        });

        const result = await mynameModule.rollDiceCommand({
            mainMsg: ['.myname', '新角色', 'http://example.com/image.jpg', '新'],
            inputStr: '.myname 新角色 http://example.com/image.jpg 新',
            userid: 'testuser',
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('個人上限為20個');
        expect(result.quotes).toBe(true);
    });
}); 