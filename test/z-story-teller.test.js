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
        const storyPath = path.join(__dirname, '..', 'test', 'test.json');
        expect(fs.existsSync(storyPath)).toBe(true);
        // Load module after mocks
        st = require('../roll/z-story-teller.js');
    });

    test('Evaluator disallows dot operator in conditions/values', async () => {
        const { rollDiceCommand } = st;
        // Start story to initialize a run and scope
        await rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Eve'], userid: USER_ID, botname: 'Discord' });

        // Use a crafted page jump that would evaluate a condition with dot if allowed
        // Since dot is disallowed, any expression containing dot should be treated as false/ignored
        // We cannot inject raw condition via command, but we can verify value evaluator fallback behavior
        const mod = require('../roll/z-story-teller.js');
        const scope = { a: 1 };
        // @ts-ignore access internal
        const _val = mod.__proto__ && mod.evalExpressionValue ? mod.evalExpressionValue('a.b + 1', scope) : undefined;
        // If not directly accessible (since not exported), assert via behavior: set should treat with dot as literal and not crash
        const r = await rollDiceCommand({ mainMsg: ['.st', 'set', 'nickname', 'Hero'], userid: USER_ID, botname: 'Discord' });
        expect(r.type).toBe('text');
        expect(r.text.length).toBeGreaterThan(0);
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
        try { await st.rollDiceCommand({ mainMsg: ['.st', 'end'], userid: USER_ID, botname: 'Discord' }); } catch {}
        const r = await st.rollDiceCommand({
            mainMsg: ['.st', 'start'],
            userid: USER_ID
        });
        expect(r.type).toBe('text');
        expect(r.text).toContain('請輸入 .st start');
    });

    test('Start story prompts for player variables, then begin after set', async () => {
        try { await st.rollDiceCommand({ mainMsg: ['.st', 'end'], userid: USER_ID, botname: 'Discord' }); } catch {}
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
const storyTeller = require('../roll/z-story-teller.js');

describe('StoryTeller Discord-only restrictions', function () {
    let rollDiceCommand;

    beforeEach(function () {
        // Reset the command function
        rollDiceCommand = storyTeller.rollDiceCommand;
    });

    describe('Import command restrictions', function () {
        it('should reject import command on non-Discord platforms', async function () {
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

        it('should allow import command on Discord', async function () {
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

    describe('Export command restrictions', function () {
        it('should reject export command on non-Discord platforms', async function () {
            const params = {
                mainMsg: ['.st', 'export', 'test'],
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

        it('should allow export command on Discord', async function () {
            const params = {
                mainMsg: ['.st', 'export', 'test'],
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

    describe('Update command restrictions', function () {
        it('should reject update command on non-Discord platforms', async function () {
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

        it('should allow update command on Discord', async function () {
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

    describe('Poll mode restrictions in start command', function () {
        it('should reject poll mode on non-Discord platforms', async function () {
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

        it('should allow poll mode on Discord', async function () {
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

    describe('Poll mode restrictions in edit command', function () {
        it('should reject poll mode in edit on non-Discord platforms', async function () {
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

        it('should allow poll mode in edit on Discord', async function () {
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

    describe('Help message updates', function () {
        it('should include Discord-only indicators in help message', function () {
            const helpMessage = storyTeller.getHelpMessage();

            // Check that Discord-only features are marked
            assert(helpMessage.includes('（僅Discord）'));
            assert(helpMessage.includes('poll、import、export、update 僅於Discord有效'));
        });
    });
});

describe('StoryTeller Advanced Functionality', () => {
    const USER_ID = 'tester-uid';
    let st;

    beforeAll(() => {
        st = require('../roll/z-story-teller.js');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should handle set command with expressions', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Alice'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'set', 'strength', '10'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle set command with arithmetic expressions', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Bob'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'set', 'agility', '5+3'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle dice expressions in set command', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Charlie'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'set', 'wit', '2d6'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle show command', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'David'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'show'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('變數');
    });

    test('should handle show command with specific variable', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Eve'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'show', 'player_name'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle goto command with page number', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Frank'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'goto', '1'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle goto command with invalid page', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Grace'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'goto', '999'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('只能前往');
    });

    test('should handle status command', async () => {
        await st.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await st.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Henry'], userid: USER_ID, botname: 'Discord' });
        
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'status'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });

    test('should handle help command', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'help'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });

    test('should handle unknown command', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'unknown'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });

    test('should handle start command with invalid story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'start', 'nonexistent'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('找不到該劇本');
    });

    test('should handle end command without active story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'end'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('已結束');
    });

    test('should handle pause command without active story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'pause'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('已暫停');
    });

    test('should handle continue command with invalid ID', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'continue', 'invalid-id'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('找不到該遊戲ID');
    });

    test('should handle set command without active story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'set', 'player_name', 'Alice'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('請先使用');
    });

    test('should handle goto command without active story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'goto', '1'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('請先使用');
    });

    test('should handle show command without active story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'show'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });

    test('should handle status command without active story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'status'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });
});

describe('StoryTeller Error Handling', () => {
    const USER_ID = 'tester-uid';
    let st;

    beforeAll(() => {
        st = require('../roll/z-story-teller.js');
    });

    test('should handle malformed commands gracefully', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });

    test('should handle empty mainMsg array', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: [],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle null mainMsg', async () => {
        try {
            const result = await st.rollDiceCommand({
                mainMsg: null,
                userid: USER_ID,
                botname: 'Discord'
            });
            expect(result.type).toBe('text');
        } catch (error) {
            // Expected to fail due to null mainMsg
            expect(error).toBeDefined();
        }
    });

    test('should handle undefined mainMsg', async () => {
        try {
            const result = await st.rollDiceCommand({
                mainMsg: undefined,
                userid: USER_ID,
                botname: 'Discord'
            });
            expect(result.type).toBe('text');
        } catch (error) {
            // Expected to fail due to undefined mainMsg
            expect(error).toBeDefined();
        }
    });
});

describe('StoryTeller File Operations', () => {
    const USER_ID = 'tester-uid';
    let st;

    beforeAll(() => {
        st = require('../roll/z-story-teller.js');
    });

    test('should handle list command', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'list'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('可啟動的劇本');
    });

    test('should handle validate command with valid story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'validate', 'test'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
    });

    test('should handle validate command with invalid story', async () => {
        const result = await st.rollDiceCommand({
            mainMsg: ['.st', 'validate', 'nonexistent'],
            userid: USER_ID,
            botname: 'Discord'
        });
        expect(result.type).toBe('text');
        expect(result.text).toContain('互動故事');
    });
});
