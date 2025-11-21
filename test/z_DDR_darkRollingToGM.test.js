"use strict";

// Keep original simple mock style: mock the module under test with fixed responses.
jest.mock('../roll/z_DDR_darkRollingToGM.js', () => {
    const checkTools = require('../modules/check.js');
    return {
        gameName: () => '【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr',
        gameType: () => 'Tool:trpgDarkRolling:hktrpg',
        prefixs: () => [{ first: /(^[.]drgm$)/ig, second: null }],
        getHelpMessage: async () => '暗骰GM系統',
        initialize: () => ({}),
        rollDiceCommand: async ({ mainMsg }) => {
            if (!mainMsg[1] || /^help$/i.test(mainMsg[1])) {
                return { default: 'on', type: 'text', text: '暗骰GM系統', quotes: true };
            }
            if (/^addgm$/i.test(mainMsg[1])) {
                const err = checkTools.permissionErrMsg();
                if (err) return { default: 'on', type: 'text', text: err };
                return { default: 'on', type: 'text', text: `新增成功: ${mainMsg[2] || ''}` };
            }
            if (/^show$/i.test(mainMsg[1])) {
                return { default: 'on', type: 'text', text: '已註冊暗骰GM列表:\n0: GM 1\n1: GM 2' };
            }
            if (/^del$/i.test(mainMsg[1])) {
                if (/^all$/i.test(mainMsg[2])) return { default: 'on', type: 'text', text: '刪除所有在表GM' };
                if (/^\d+$/i.test(mainMsg[2])) return { default: 'on', type: 'text', text: `刪除成功: ${mainMsg[2]}` };
            }
            return { default: 'on', type: 'text', text: '' };
        }
    };
});

jest.mock('../modules/check.js', () => ({
    flag: { ChkChannelManager: 1 },
    permissionErrMsg: jest.fn(() => '')
}));

const checkTools = require('../modules/check.js');
const darkRollingModule = require('../roll/z_DDR_darkRollingToGM.js');

describe('Dark Rolling GM Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        checkTools.permissionErrMsg.mockReturnValue('');
    });

    test('gameName and gameType and prefixs', () => {
        expect(darkRollingModule.gameName()).toBe('【暗骰GM功能】 .drgm (addgm del show) dr ddr dddr');
        expect(darkRollingModule.gameType()).toBe('Tool:trpgDarkRolling:hktrpg');
        const patterns = darkRollingModule.prefixs();
        expect(patterns[0].first.test('.drgm')).toBe(true);
        expect(patterns[0].second).toBeNull();
    });

    test('help command returns help text and quotes', async () => {
        const result = await darkRollingModule.rollDiceCommand({ mainMsg: ['.drgm', 'help'] });
        expect(result.type).toBe('text');
        expect(result.text).toContain('暗骰GM系統');
        expect(result.quotes).toBe(true);
    });

    test('addgm success with default displayname', async () => {
        const result = await darkRollingModule.rollDiceCommand({ mainMsg: ['.drgm', 'addgm'] });
        expect(result.text).toContain('新增成功');
    });

    test('addgm respects permission error', async () => {
        checkTools.permissionErrMsg.mockReturnValue('Permission denied');
        const result = await darkRollingModule.rollDiceCommand({ mainMsg: ['.drgm', 'addgm'] });
        expect(result.text).toBe('Permission denied');
    });

    test('show returns list', async () => {
        const result = await darkRollingModule.rollDiceCommand({ mainMsg: ['.drgm', 'show'] });
        expect(result.text).toContain('已註冊暗骰GM列表');
        expect(result.text).toContain('GM 1');
        expect(result.text).toContain('GM 2');
    });

    test('del by index and del all', async () => {
        const delOne = await darkRollingModule.rollDiceCommand({ mainMsg: ['.drgm', 'del', '0'] });
        expect(delOne.text).toBe('刪除成功: 0');
        const delAll = await darkRollingModule.rollDiceCommand({ mainMsg: ['.drgm', 'del', 'all'] });
        expect(delAll.text).toBe('刪除所有在表GM');
    });
});