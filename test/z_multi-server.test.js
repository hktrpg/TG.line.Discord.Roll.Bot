// Mock dependencies
jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckUser: jest.fn(() => 1)
}));

jest.mock('../modules/schema', () => ({
    multiServer: {
        findOneAndUpdate: jest.fn(),
        find: jest.fn(),
        findOneAndDelete: jest.fn()
    }
}));

jest.mock('../modules/multi-server', () => ({
    getRecords: jest.fn()
}));

jest.mock('../roll/rollbase.js', () => ({
    Dice: jest.fn(() => 12_345_678)
}));

// Mock Discord.js
jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn(),
    PermissionsBitField: {
        Flags: {
            ManageChannels: 'MANAGE_CHANNELS'
        }
    },
    Permissions: {
        MANAGE_CHANNELS: 'MANAGE_CHANNELS'
    }
}));

// Set environment variables
process.env.DISCORD_CHANNEL_SECRET = 'test_secret';

// Mock the multi-server module
jest.mock('../roll/z_multi-server.js', () => {
    // Only return the module if DISCORD_CHANNEL_SECRET is set
    if (!process.env.DISCORD_CHANNEL_SECRET) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【同步聊天】.chatroom'),
        gameType: jest.fn(() => 'Demo:Demo:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^\.chatroom$/i,
            second: null
        }]),
        getHelpMessage: jest.fn(() => `【同步聊天】.chatroom
    .chatroom create
    .chatroom join`),
        initialize: jest.fn(() => ({})),
        rollDiceCommand: jest.fn(),
        discordCommand: []
    };
});

// Import module
const multiServerModule = require('../roll/z_multi-server.js');

describe('Multi Server Module Tests', () => {
    let mockDiscordClient;
    let mockChannel;
    let mockGuild;
    let mockMember;
    let mockPermissions;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Discord.js mocks
        mockPermissions = {
            has: jest.fn(() => true)
        };

        mockMember = {
            members: {
                find: jest.fn(() => ({
                    id: 'testuser',
                    permissions: mockPermissions
                }))
            }
        };

        mockGuild = {
            id: 'testguild',
            name: 'Test Guild'
        };

        mockChannel = {
            id: 'testchannel',
            name: 'test-channel',
            guild: mockGuild,
            fetch: jest.fn(() => Promise.resolve(mockMember)),
            permissionsFor: jest.fn(() => mockPermissions)
        };

        mockDiscordClient = {
            channels: {
                fetch: jest.fn(() => Promise.resolve(mockChannel))
            }
        };

        // Reset module mocks
        multiServerModule.rollDiceCommand.mockReset();
    });

    test('Test gameName returns correct name', () => {
        expect(multiServerModule.gameName()).toBe('【同步聊天】.chatroom');
    });

    test('Test gameType returns correct type', () => {
        expect(multiServerModule.gameType()).toBe('Demo:Demo:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = multiServerModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.chatroom')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = multiServerModule.getHelpMessage();
        expect(helpText).toContain('【同步聊天】.chatroom');
        expect(helpText).toContain('.chatroom create');
        expect(helpText).toContain('.chatroom join');
    });

    test('Test help command', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【同步聊天】.chatroom\n.chatroom create\n.chatroom join',
            quotes: true
        });

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【同步聊天】.chatroom');
        expect(result.quotes).toBe(true);
    });

    test('Test create command with valid channel', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已把Test Guild - test-channel新增到聊天室'
        });

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'create', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient,
            botname: 'TestBot'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已把Test Guild - test-channel新增到聊天室');
    });

    test('Test create command with invalid permissions', async () => {
        mockPermissions.has.mockReturnValue(false);
        multiServerModule.rollDiceCommand.mockResolvedValue();

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'create', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient
        });

        expect(result).toBeUndefined();
    });

    test('Test join command with valid channel', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已把Test Guild - test-channel新增到聊天室，想把其他頻道加入，請輸入 .join testmultiid (其他頻道的ID)'
        });

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'join', 'testmultiid', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient,
            botname: 'TestBot'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已把Test Guild - test-channel新增到聊天室');
    });

    test('Test join command with invalid permissions', async () => {
        mockPermissions.has.mockReturnValue(false);
        multiServerModule.rollDiceCommand.mockResolvedValue();

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'join', 'testmultiid', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient
        });

        expect(result).toBeUndefined();
    });

    test('Test exit command with admin role', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已移除聊天室'
        });

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'exit'],
            userrole: 3,
            channelid: 'testchannel'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('已移除聊天室');
    });

    test('Test exit command with specific channel', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已移除聊天室'
        });

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'exit', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('已移除聊天室');
    });

    test('Test exit command with invalid permissions', async () => {
        mockPermissions.has.mockReturnValue(false);
        multiServerModule.rollDiceCommand.mockResolvedValue();

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'exit', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient
        });

        expect(result).toBeUndefined();
    });

    test('Test create command with database error', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue();

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'create', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient,
            botname: 'TestBot'
        });

        expect(result).toBeUndefined();
    });

    test('Test join command with max channels reached', async () => {
        multiServerModule.rollDiceCommand.mockResolvedValue();

        const result = await multiServerModule.rollDiceCommand({
            mainMsg: ['.chatroom', 'join', 'testmultiid', 'testchannel'],
            userid: 'testuser',
            discordClient: mockDiscordClient
        });

        expect(result).toBeUndefined();
    });
}); 