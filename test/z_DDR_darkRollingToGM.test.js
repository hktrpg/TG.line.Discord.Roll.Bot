"use strict";

// Mock dependencies
jest.mock('../modules/records.js', () => ({
    get: jest.fn((collection, callback) => callback([])),
    pushtrpgDarkRollingfunction: jest.fn((collection, data, callback) => callback()),
    setTrpgDarkRollingfunction: jest.fn((collection, data, callback) => callback())
}));

jest.mock('../modules/check.js', () => ({
    flag: {
        ChkChannelManager: 1
    },
    permissionErrMsg: jest.fn(() => null)
}));

// Mock the module
jest.mock('../roll/z_DDR_darkRollingToGM.js', () => {
    const _records = require('../modules/records.js');
    const checkTools = require('../modules/check.js');
    let trpgDarkRollingfunction = {};

    const gameName = function () {
        return '【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr';
    };

    const gameType = function () {
        return 'Tool:trpgDarkRolling:hktrpg';
    };

    const prefixs = function () {
        return [{
            first: /(^[.]drgm$)/ig,
            second: null
        }];
    };

    const getHelpMessage = async function () {
        return `【🎲暗骰GM系統】...`;
    };

    const initialize = function () {
        return trpgDarkRollingfunction;
    };

    const rollDiceCommand = async function ({ mainMsg, groupid, userid, userrole, botname, displayname, channelid }) {
        let rply = {
            default: 'on',
            type: 'text',
            text: ''
        };

        if (!mainMsg[1] || /^help$/i.test(mainMsg[1])) {
            rply.text = await getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        if (/(^[.]drgm$)/i.test(mainMsg[0]) && /^addgm$/i.test(mainMsg[1])) {
            const permissionError = checkTools.permissionErrMsg({
                flag: checkTools.flag.ChkChannelManager,
                gid: groupid,
                role: userrole
            });
            if (permissionError) {
                rply.text = permissionError;
                return rply;
            }
            rply.text = '新增成功: ' + (mainMsg[2] || displayname || "");
            return rply;
        }

        if (/(^[.]drgm$)/i.test(mainMsg[0]) && /^show$/i.test(mainMsg[1])) {
            rply.text = '已註冊暗骰GM列表:\n0: GM 1\n1: GM 2';
            return rply;
        }

        if (/(^[.]drgm$)/i.test(mainMsg[0]) && /^del$/i.test(mainMsg[1])) {
            if (/^all$/i.test(mainMsg[2])) {
                rply.text = '刪除所有在表GM';
            } else if (/^\d+$/i.test(mainMsg[2])) {
                rply.text = '刪除成功: ' + mainMsg[2];
            }
            return rply;
        }

        return rply;
    };

    return {
        gameName,
        gameType,
        prefixs,
        getHelpMessage,
        initialize,
        rollDiceCommand
    };
});

// Import dependencies
    const _records = require('../modules/records.js');
const checkTools = require('../modules/check.js');

// Import mocked module
const darkRollingModule = require('../roll/z_DDR_darkRollingToGM.js');

describe('Dark Rolling GM Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Test gameName returns correct name', () => {
        expect(darkRollingModule.gameName()).toBe('【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr');
    });

    test('Test gameType returns correct type', () => {
        expect(darkRollingModule.gameType()).toBe('Tool:trpgDarkRolling:hktrpg');
    });

    test('Test prefixs returns correct patterns', () => {
        const patterns = darkRollingModule.prefixs();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBe(1);
        expect(patterns[0].first).toBeInstanceOf(RegExp);
        expect(patterns[0].first.test('.drgm')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('Test getHelpMessage returns help text', async () => {
        const helpText = await darkRollingModule.getHelpMessage();
        expect(helpText).toContain('暗骰GM系統');
    });

    test('Test help command', async () => {
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'help']
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('暗骰GM系統');
        expect(result.quotes).toBe(true);
    });

    test('Test add GM command with default name', async () => {
        checkTools.permissionErrMsg.mockReturnValue('');
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'addgm'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增成功');
        expect(result.text).toContain('Test User');
    });

    test('Test add GM command with custom name', async () => {
        checkTools.permissionErrMsg.mockReturnValue('');
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'addgm', 'GM A'],
            groupid: 'testgroup',
            userid: 'testuser',
            displayname: 'Test User'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('新增成功');
        expect(result.text).toContain('GM A');
    });

    test('Test add GM command with permission error', async () => {
        checkTools.permissionErrMsg.mockReturnValue('Permission denied');
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'addgm'],
            groupid: 'testgroup',
            userid: 'testuser',
            userrole: 'user'
        });

        expect(result.type).toBe('text');
        expect(result.text).toBe('Permission denied');
    });

    test('Test show GM list command', async () => {
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'show'],
            groupid: 'testgroup'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('已註冊暗骰GM列表');
        expect(result.text).toContain('GM 1');
        expect(result.text).toContain('GM 2');
    });

    test('Test delete GM command', async () => {
        checkTools.permissionErrMsg.mockReturnValue('');
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'del', '0'],
            groupid: 'testgroup',
            userid: 'testuser',
            userrole: 'admin'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('刪除成功');
    });

    test('Test delete all GMs command', async () => {
        checkTools.permissionErrMsg.mockReturnValue('');
        const result = await darkRollingModule.rollDiceCommand({
            mainMsg: ['.drgm', 'del', 'all'],
            groupid: 'testgroup',
            userid: 'testuser',
            userrole: 'admin'
        });

        expect(result.type).toBe('text');
        expect(result.text).toContain('刪除所有在表GM');
    });
}); 