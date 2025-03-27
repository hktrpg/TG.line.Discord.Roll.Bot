// Mock dependencies
jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(() => 1)
}));

jest.mock('../modules/schema.js', () => ({
    roleReact: {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndRemove: jest.fn(),
        countDocuments: jest.fn()
    }
}));

// Mock emoji-regex
jest.mock('emoji-regex', () => () => /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g);

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Mock the role module
jest.mock('../roll/z_role.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【身分組管理】.roleReact'),
        gameType: jest.fn(() => 'Tool:role:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^\.roleReact$/i,
            second: null
        }]),
        getHelpMessage: jest.fn(() => `【👥身分組管理】(Discord限定)`),
        initialize: jest.fn(() => ""),
        rollDiceCommand: jest.fn()
    };
});

// Import dependencies
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');

// Import module
const roleModule = require('../roll/z_role.js');

describe('Role Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(roleModule.gameName()).toBe('【身分組管理】.roleReact');
    });

    test('Test gameType returns correct type', () => {
        expect(roleModule.gameType()).toBe('Tool:role:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = roleModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.roleReact')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = roleModule.getHelpMessage();
        expect(helpText).toContain('【👥身分組管理】');
    });

    test('Test help command', async () => {
        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【👥身分組管理】(Discord限定)',
            quotes: true
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'help'],
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【👥身分組管理】');
        expect(result.quotes).toBe(true);
    });

    test('Test non-Discord platform returns error', async () => {
        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '此功能只能在Discord中使用'
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'show'],
            botname: 'Line'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('此功能只能在Discord中使用');
    });

    test('Test show command', async () => {
        const mockRoleReacts = [
            {
                serial: 1,
                message: '2023/10/25 12:00 - ID: 123456789',
                detail: [
                    { roleID: '111111', emoji: '🎨' },
                    { roleID: '222222', emoji: '😁' }
                ]
            }
        ];

        schema.roleReact.find.mockResolvedValue(mockRoleReacts);

        roleModule.rollDiceCommand.mockImplementation(async ({ mainMsg, groupid }) => {
            if (mainMsg[0] === '.roleReact' && mainMsg[1] === 'show') {
                const list = await schema.roleReact.find({ groupid });
                return {
                    type: 'text',
                    text: list.map(item => 
                        `序號#${item.serial} \n 新增日期: ${item.message}\n` +
                        item.detail.map(role => 
                            `身分ID#${role.roleID} emoji: ${role.emoji}\n`
                        ).join('')
                    ).join('\n')
                };
            }
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'show'],
            groupid: 'testgroup',
            botname: 'Discord',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('序號#1');
        expect(result.text).toContain('🎨');
        expect(result.text).toContain('😁');
    });

    test('Test add command with valid input', async () => {
        schema.roleReact.findOne.mockResolvedValue(null);
        schema.roleReact.countDocuments.mockResolvedValue(0);

        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已成功增加。你現在可以試試role功能',
            newRoleReactFlag: true,
            newRoleReactMessageId: '123456789',
            newRoleReactDetail: [
                { roleID: '111111', emoji: '🎨' },
                { roleID: '222222', emoji: '😁' }
            ]
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'add'],
            inputStr: `.roleReact add
111111 🎨
222222 😁
[[messageID]]
123456789`,
            groupid: 'testgroup',
            botname: 'Discord',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已成功增加');
        expect(result.newRoleReactFlag).toBe(true);
        expect(result.newRoleReactMessageId).toBe('123456789');
        expect(result.newRoleReactDetail).toHaveLength(2);
    });

    test('Test add command with existing message', async () => {
        const existingConfig = {
            detail: [{ roleID: '111111', emoji: '🎨' }],
            save: jest.fn().mockResolvedValue(true)
        };

        schema.roleReact.findOne.mockResolvedValue(existingConfig);

        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已成功更新。你現在可以試試role功能',
            newRoleReactFlag: true,
            newRoleReactMessageId: '123456789',
            newRoleReactDetail: [{ roleID: '222222', emoji: '😁' }]
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'add'],
            inputStr: `.roleReact add
222222 😁
[[messageID]]
123456789`,
            groupid: 'testgroup',
            botname: 'Discord',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已成功更新');
        expect(result.newRoleReactFlag).toBe(true);
    });

    test('Test delete command', async () => {
        schema.roleReact.findOneAndRemove.mockResolvedValue({
            serial: 1,
            message: '2023/10/25 12:00 - ID: 123456789'
        });

        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '移除成功，#1\n2023/10/25 12:00 - ID: 123456789'
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'delete', '1'],
            groupid: 'testgroup',
            botname: 'Discord',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('移除成功');
        expect(result.text).toContain('#1');
    });

    test('Test non-admin user returns error', async () => {
        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '這功能只可以由伺服器管理員使用'
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'show'],
            groupid: 'testgroup',
            botname: 'Discord',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('這功能只可以由伺服器管理員使用');
    });

    test('Test add command with limit reached', async () => {
        schema.roleReact.countDocuments.mockResolvedValue(3);
        VIP.viplevelCheckGroup.mockResolvedValue(0);

        roleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '.roleReact 群組上限為3個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n',
            quotes: true
        });

        const result = await roleModule.rollDiceCommand({
            mainMsg: ['.roleReact', 'add'],
            inputStr: `.roleReact add
111111 🎨
[[messageID]]
123456789`,
            groupid: 'testgroup',
            botname: 'Discord',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('群組上限為3個');
        expect(result.quotes).toBe(true);
    });
}); 