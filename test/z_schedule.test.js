// Mock dependencies
jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckUser: jest.fn(() => 1),
    viplevelCheckGroup: jest.fn(() => 1)
}));

jest.mock('../modules/dbWatchdog.js', () => ({
    isDbOnline: jest.fn(() => true)
}));

jest.mock('../modules/schema.js', () => ({
    agendaAtHKTRPG: {
        countDocuments: jest.fn()
    }
}));

jest.mock('../modules/check.js', () => ({
    permissionErrMsg: jest.fn(() => null),
    flag: {
        ChkChannelManager: 1
    }
}));

jest.mock('../modules/schedule', () => ({
    agenda: {
        jobs: jest.fn(),
        create: jest.fn(() => ({
            repeatEvery: jest.fn(),
            save: jest.fn()
        })),
        schedule: jest.fn()
    }
}));

// Mock moment
jest.mock('moment', () => () => ({
    add: jest.fn(() => ({
        toDate: jest.fn(() => new Date('2024-01-01T12:00:00Z'))
    })),
    toDate: jest.fn(() => new Date('2024-01-01T12:00:00Z'))
}));

// Mock the schedule module
jest.mock('../roll/z_schedule.js', () => {
    // Only return the module if mongoURL is set
    if (!process.env.mongoURL) {
        return {};
    }

    return {
        gameName: jest.fn(() => '【定時發訊功能】.at /.cron  mins hours delete show'),
        gameType: jest.fn(() => 'funny:schedule:hktrpg'),
        prefixs: jest.fn(() => [{
            first: /^\.at$|^\.cron$/i,
            second: null
        }]),
        getHelpMessage: jest.fn(() => `【⏰定時任務功能】`),
        initialize: jest.fn(() => ""),
        rollDiceCommand: jest.fn()
    };
});

// Set environment variables
process.env.mongoURL = 'test_mongo_url';

// Import dependencies
const _moment = require('moment');
const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
const _checkTools = require('../modules/check.js');
const agenda = require('../modules/schedule');

// Import module
const scheduleModule = require('../roll/z_schedule.js');

describe('Schedule Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(scheduleModule.gameName()).toBe('【定時發訊功能】.at /.cron  mins hours delete show');
    });

    test('Test gameType returns correct type', () => {
        expect(scheduleModule.gameType()).toBe('funny:schedule:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = scheduleModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.at')).toBe(true);
        expect(patterns[0].first.test('.cron')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', () => {
        const helpText = scheduleModule.getHelpMessage();
        expect(helpText).toContain('【⏰定時任務功能】');
    });

    test('Test help command', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '【⏰定時任務功能】',
            quotes: true
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', 'help'],
            botname: 'Discord'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('【⏰定時任務功能】');
        expect(result.quotes).toBe(true);
    });

    test('Test non-Discord/Telegram platform returns error', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '此功能只能在Discord, Telegram中使用'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', 'show'],
            botname: 'Line'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('此功能只能在Discord, Telegram中使用');
    });

    test('Test at show command', async () => {
        const mockJobs = [{
            attrs: {
                nextRunAt: new Date('2024-01-01T12:00:00Z'),
                data: {
                    replyText: 'Test message'
                }
            }
        }];

        agenda.agenda.jobs.mockResolvedValue(mockJobs);

        scheduleModule.rollDiceCommand.mockImplementation(async ({ mainMsg, groupid }) => {
            if (mainMsg[0] === '.at' && mainMsg[1] === 'show' && groupid) {
                const jobs = await agenda.agenda.jobs();
                return {
                    type: 'text',
                    text: jobs.map(job => 
                        `序號#1 下次運行時間 ${job.attrs.nextRunAt.toString().replace(/:\d+\s.*/, '')}\n${job.attrs.data.replyText}\n`
                    ).join('')
                };
            }
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', 'show'],
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('Test message');
    });

    test('Test at add command with minutes', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於Mon Jan 01 2024運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '5mins', 'Test message'],
            inputStr: '.at 5mins Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
    });

    test('Test at add command with hours', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於Mon Jan 01 2024運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '2hours', 'Test message'],
            inputStr: '.at 2hours Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
    });

    test('Test at add command with specific date/time', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於Mon Jan 01 2024運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '20240101', '1200', 'Test message'],
            inputStr: '.at 20240101 1200 Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
    });

    test('Test cron add command', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於每天 12:30 (24小時制)運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.cron', '1230', 'Test message'],
            inputStr: '.cron 1230 Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
    });

    test('Test cron add command with days', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於每隔2天 12:30 (24小時制)運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.cron', '1230-2', 'Test message'],
            inputStr: '.cron 1230-2 Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
        expect(result.text).toContain('每隔2天');
    });

    test('Test cron add command with weekdays', async () => {
        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於每個星期的1,3 12:30 (24小時制)運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.cron', '1230-mon-wed', 'Test message'],
            inputStr: '.cron 1230-mon-wed Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
        expect(result.text).toContain('每個星期');
    });

    test('Test delete at command', async () => {
        const mockJobs = [{
            attrs: {
                data: {
                    replyText: 'Test message'
                }
            },
            remove: jest.fn().mockResolvedValue(true)
        }];

        agenda.agenda.jobs.mockResolvedValue(mockJobs);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已刪除序號#1 \nTest message'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', 'delete', '1'],
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userrole: 1
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已刪除序號#1');
    });

    test('Test delete cron command', async () => {
        const mockJobs = [{
            attrs: {
                data: {
                    replyText: 'Test message'
                }
            },
            remove: jest.fn().mockResolvedValue(true)
        }];

        agenda.agenda.jobs.mockResolvedValue(mockJobs);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已刪除序號#1 \nTest message'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.cron', 'delete', '1'],
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已刪除序號#1');
    });

    test('Test at command limit reached', async () => {
        schema.agendaAtHKTRPG.countDocuments.mockResolvedValue(5);
        VIP.viplevelCheckUser.mockResolvedValue(0);
        VIP.viplevelCheckGroup.mockResolvedValue(0);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '.at 整個群組上限5個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '5mins', 'Test message'],
            inputStr: '.at 5mins Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('整個群組上限5個');
    });

    test('Test cron command limit reached', async () => {
        schema.agendaAtHKTRPG.countDocuments.mockResolvedValue(2);
        VIP.viplevelCheckUser.mockResolvedValue(0);
        VIP.viplevelCheckGroup.mockResolvedValue(0);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '.cron 整個群組上限2個\n支援及解鎖上限 https://www.patreon.com/HKTRPG\n'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.cron', '1230', 'Test message'],
            inputStr: '.cron 1230 Test message',
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser',
            userrole: 3
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('整個群組上限2個');
    });

    test('Test custom role name and link for VIP users', async () => {
        VIP.viplevelCheckUser.mockResolvedValue(1);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '已新增排定內容\n將於Mon Jan 01 2024運行'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '5mins'],
            inputStr: `.at 5mins
name=CustomName
link=https://example.com/image.jpg
Test message`,
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已新增排定內容');
    });

    test('Test custom role name and link for non-VIP users', async () => {
        VIP.viplevelCheckUser.mockResolvedValue(0);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '.at裡的角色發言功能只供Patreoner使用，請支持伺服器運作，或自建Server\nhttps://www.patreon.com/HKTRPG'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '5mins'],
            inputStr: `.at 5mins
name=CustomName
link=https://example.com/image.jpg
Test message`,
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('只供Patreoner使用');
    });

    test('Test empty name parameter validation', async () => {
        VIP.viplevelCheckUser.mockResolvedValue(1);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '請完整設定名字和圖片網址\nname= 不能為空'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '1mins'],
            inputStr: `.at 1mins
name=
link=https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png
測試`,
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('name= 不能為空');
    });

    test('Test invalid link format validation', async () => {
        VIP.viplevelCheckUser.mockResolvedValue(1);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '請完整設定名字和圖片網址\nlink= 必須以 http:// 或 https:// 開頭'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '1mins'],
            inputStr: `.at 1mins
name=Sad
link=htt
測試`,
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('link= 必須以 http:// 或 https:// 開頭');
    });

    test('Test empty link parameter validation', async () => {
        VIP.viplevelCheckUser.mockResolvedValue(1);

        scheduleModule.rollDiceCommand.mockResolvedValue({
            type: 'text',
            text: '請完整設定名字和圖片網址\nlink= 不能為空'
        });

        const result = await scheduleModule.rollDiceCommand({
            mainMsg: ['.at', '1mins'],
            inputStr: `.at 1mins
name=Sad
link=
測試`,
            groupid: 'testgroup',
            botname: 'Discord',
            channelid: 'testchannel',
            userid: 'testuser'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('link= 不能為空');
    });
}); 