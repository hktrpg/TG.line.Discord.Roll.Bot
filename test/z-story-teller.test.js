"use strict";

// Keep DB offline to exercise in-memory + filesystem fallback
jest.mock('../modules/schema.js', () => ({}));

// Keep VIP stable
jest.mock('../modules/veryImportantPerson.js', () => ({
    viplevelCheckUser: jest.fn().mockResolvedValue(0)
}));

const path = require('node:path');
const fs = require('node:fs');

describe('StoryTeller (.st) Module Tests', () => {
    /** @type {import('../roll/z-story-teller.js')} */
    let st;

    const USER_ID = 'tester-uid';

    beforeAll(() => {
        // Assert the test story exists so tests are meaningful
        const storyPath = path.join(__dirname, '..', 'roll', 'storyTeller', 'test.json');
        expect(fs.existsSync(storyPath)).toBe(true);
        // Load module after mocks
        st = require('../roll/z-story-teller.js');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Basic exports work', () => {
        expect(st.gameName()).toContain('StoryTeller');
        expect(st.gameType()).toBe('Tool:storyTeller');

        const pfx = st.prefixs();
        expect(Array.isArray(pfx)).toBe(true);
        expect(pfx[0].first.test('.st')).toBe(true);

        expect(st.initialize()).toEqual({});

        const help = st.getHelpMessage();
        expect(help).toContain('互動故事');
        expect(help).toContain('.st start');
    });

    test('Start without key suggests usage', async () => {
        const r = await st.rollDiceCommand({
            mainMsg: ['.st', 'start'],
            userid: USER_ID
        });
        expect(r.type).toBe('text');
        expect(r.text).toContain('請輸入 .st start');
    });

    test('Start story prompts for player variables, then begin after set', async () => {
        // Start specific story (filesystem fallback: roll/storyTeller/test.json)
        const r1 = await st.rollDiceCommand({
            mainMsg: ['.st', 'start', 'test'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(r1.type).toBe('text');
        // Should ask for player setup first
        expect(r1.text).toContain('角色設定');

        // Set required player variable
        const r2 = await st.rollDiceCommand({
            mainMsg: ['.st', 'set', 'player_name', 'Alice'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(r2.type).toBe('text');
        // Game should auto-start and render page 0
        expect(r2.text).toContain('遊戲開始');
        expect(r2.text).toMatch(/【變數測試平台】/);
        // Choices/buttons should be provided
        expect(Array.isArray(r2.buttonCreate)).toBe(true);
        expect(r2.buttonCreate.some(b => /^\.st goto 1$/.test(b))).toBe(true);
    });

    test('Goto 2a suffix navigates to page 2', async () => {
        // Ensure a run is active and on page 0
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Bob'], userid: USER_ID, botname: 'Discord' });

        const r = await st.rollDiceCommand({
            mainMsg: ['.st', 'goto', '2a'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(r.type).toBe('text');
        expect(r.text).toMatch(/【多分支同頁測試】/);
        // Page 2 shows interpolated stats line (allow negatives and multi-digits)
        expect(r.text).toMatch(/Strength=-?\d+, Agility=-?\d+, Wit=-?\d+, Charm=-?\d+/);
    });

    test('Pause and continue by id', async () => {
        // Start and set to ensure active
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Cathy'], userid: USER_ID, botname: 'Discord' });

        const paused = await st.rollDiceCommand({
            mainMsg: ['.st', 'pause'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(paused.text).toContain('已暫停（ID：');
        const idMatch = paused.text.match(/ID：([^）]+)/);
        expect(idMatch).not.toBeNull();
        const runId = idMatch ? idMatch[1].trim() : '';
        expect(runId).toBeTruthy();

        const cont = await st.rollDiceCommand({
            mainMsg: ['.st', 'continue', runId],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(cont.type).toBe('text');
        // Resumed output should be a valid page render
        expect(cont.text.length).toBeGreaterThan(0);
    });

    test('End the story produces summary', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Dora'], userid: USER_ID, botname: 'Discord' });

        const ended = await st.rollDiceCommand({
            mainMsg: ['.st', 'end'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(ended.type).toBe('text');
        expect(ended.text).toContain('已結束本次故事');
        expect(ended.text).toContain('標題：');
    });

    test('List shows filesystem stories including test', async () => {
        const r = await st.rollDiceCommand({
            mainMsg: ['.st', 'list'],
            userid: USER_ID
        });
        expect(r.type).toBe('text');
        expect(r.text).toContain('可啟動的劇本');
        // Should include an entry for alias: test
        expect(r.text).toMatch(/\(alias: test\)/);
    });

    test('Poll mode is Discord-only', async () => {
        const r = await st.rollDiceCommand({
            mainMsg: ['.st', 'start', 'test', 'poll'],
            userid: USER_ID,
            botname: 'Line'
        });
        expect(r.type).toBe('text');
        expect(r.text).toContain('投票模式僅在 Discord 上可用');
    });
});

const assert = require('assert');

// Mock the required modules
const mockDb = {};
const mockVIP = {};
// Start of Selection

// Use proxyquire to mock dependencies safely without modifying global require
let proxyquire;
try {
    proxyquire = require('proxyquire').noCallThru();
} catch {
    throw new Error("proxyquire module is not installed. Please run 'yarn add --dev proxyquire' to install it.");
}

const storyTeller = proxyquire('../roll/z-story-teller.js', {
    '../db/schema.js': mockDb,
    '../db/veryImportantPerson.js': mockVIP
});
// End of Selection

describe('StoryTeller Discord-only restrictions', function() {
    let rollDiceCommand;

    beforeEach(function() {
        // Reset the command function
        rollDiceCommand = storyTeller.rollDiceCommand;
    });

    describe('Import command restrictions', function() {
        it('should reject import command on non-Discord platforms', async function() {
            const params = {
                mainMsg: ['.st', 'import', 'test', 'Test Story'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Line',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            assert.strictEqual(result.text, '此功能僅在 Discord 上可用。');
        });

        it('should allow import command on Discord', async function() {
            const params = {
                mainMsg: ['.st', 'import', 'test', 'Test Story'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Discord',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            // Should not return the Discord-only restriction message
            assert.notStrictEqual(result.text, '此功能僅在 Discord 上可用。');
        });
    });

    describe('Export command restrictions', function() {
        it('should reject exportfile command on non-Discord platforms', async function() {
            const params = {
                mainMsg: ['.st', 'exportfile', 'test'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Telegram',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            assert.strictEqual(result.text, '此功能僅在 Discord 上可用。');
        });

        it('should allow exportfile command on Discord', async function() {
            const params = {
                mainMsg: ['.st', 'exportfile', 'test'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Discord',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            // Should not return the Discord-only restriction message
            assert.notStrictEqual(result.text, '此功能僅在 Discord 上可用。');
        });
    });

    describe('Update command restrictions', function() {
        it('should reject update command on non-Discord platforms', async function() {
            const params = {
                mainMsg: ['.st', 'update', 'test', 'Updated Story'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Whatsapp',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            assert.strictEqual(result.text, '此功能僅在 Discord 上可用。');
        });

        it('should allow update command on Discord', async function() {
            const params = {
                mainMsg: ['.st', 'update', 'test', 'Updated Story'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Discord',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            // Should not return the Discord-only restriction message
            assert.notStrictEqual(result.text, '此功能僅在 Discord 上可用。');
        });
    });

    describe('Poll mode restrictions in start command', function() {
        it('should reject poll mode on non-Discord platforms', async function() {
            const params = {
                mainMsg: ['.st', 'start', 'test', 'poll', '5'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Line',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            assert.strictEqual(result.text, '投票模式僅在 Discord 上可用。');
        });

        it('should allow poll mode on Discord', async function() {
            const params = {
                mainMsg: ['.st', 'start', 'test', 'poll', '5'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Discord',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            // Should not return the poll restriction message
            assert.notStrictEqual(result.text, '投票模式僅在 Discord 上可用。');
        });
    });

    describe('Poll mode restrictions in edit command', function() {
        it('should reject poll mode in edit on non-Discord platforms', async function() {
            // For this test, we'll just verify that the restriction logic exists
            // The actual functionality requires a complex database setup
            const params = {
                mainMsg: ['.st', 'edit', 'poll', '5'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Telegram',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            // Non-Discord platforms must be rejected explicitly
            assert.strictEqual(result.text, '投票模式僅在 Discord 上可用。');
        });

        it('should allow poll mode in edit on Discord', async function() {
            // For this test, we'll just verify that the restriction logic exists
            const params = {
                mainMsg: ['.st', 'edit', 'poll', '5'],
                groupid: 'test-group',
                userid: 'test-user',
                botname: 'Discord',
                displayname: 'Test User',
                channelid: 'test-channel',
                discordClient: null,
                discordMessage: null
            };

            const result = await rollDiceCommand.call(storyTeller, params);
            
            // If there is an active run in this channel (created by previous tests),
            // it should set poll mode and report the configured minutes
            assert.strictEqual(result.text, '已設定參與權限為：投票（5 分鐘）');
        });
    });

    describe('Help message updates', function() {
        it('should include Discord-only indicators in help message', function() {
            const helpMessage = storyTeller.getHelpMessage();
            
            // Check that Discord-only features are marked
            assert(helpMessage.includes('（僅Discord）'));
            assert(helpMessage.includes('poll、import、exportfile、update 僅於Discord有效'));
        });
    });
});
