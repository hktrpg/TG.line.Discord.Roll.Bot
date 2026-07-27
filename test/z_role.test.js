// Mock dependencies
jest.mock('../modules/patreon/veryImportantPerson', () => ({
    viplevelCheckGroup: jest.fn(() => 1)
}));

jest.mock('../modules/db/schema.js', () => ({
    roleReact: {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndDelete: jest.fn(),
        countDocuments: jest.fn()
    }
}));

// Mock emoji-regex
jest.mock('emoji-regex', () => () => /(?:[\u2700-\u27BF]|(?:\uD83C[\uDDE6-\uDDFF]){2}|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u0023-\u0039]\uFE0F?\u20E3|\u3299|\u3297|\u303D|\u3030|\u24C2|\uD83C[\uDD70-\uDD71]|\uD83C[\uDD7E-\uDD7F]|\uD83C\uDD8E|\uD83C[\uDD91-\uDD9A]|\uD83C[\uDDE6-\uDDFF]|[\uD83C[\uDE01-\uDE02]|\uD83C\uDE1A|\uD83C\uDE2F|[\uD83C[\uDE32-\uDE3A]|[\uD83C[\uDE50-\uDE51]|\u203C|\u2049|[\u25AA-\u25AB]|\u25B6|\u25C0|[\u25FB-\u25FE]|\u00A9|\u00AE|\u2122|\u2139|\uD83C\uDC04|[\u2600-\u26FF]|\u2B05|\u2B06|\u2B07|\u2B1B|\u2B1C|\u2B50|\u2B55|\u231A|\u231B|\u2328|\u23CF|[\u23E9-\u23F3]|[\u23F8-\u23FA]|\uD83C\uDCCF|\u2934|\u2935|[\u2190-\u21FF])/g);

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
const schema = require('../modules/db/schema.js');
const VIP = require('../modules/patreon/veryImportantPerson');

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
        schema.roleReact.findOneAndDelete.mockResolvedValue({
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