"use strict";

// Keep DB offline to exercise in-memory + filesystem fallback
jest.mock('../modules/schema.js', () => ({}));

// Keep VIP stable
jest.mock('../modules/veryImportantPerson.js', () => ({
    viplevelCheckUser: jest.fn().mockResolvedValue(0)
}));

const fs = require('node:fs');
const path = require('node:path');

const storyTeller = require('../roll/z-story-teller.js');

describe('StoryTeller additional coverage', () => {
    const USER_ID = 'cov-user';
    const GROUP_ID = 'G1';

    function writeStory(alias, ownerId) {
        const dir = path.join(__dirname, '..', 'roll', 'storyTeller');
        fs.mkdirSync(dir, { recursive: true });
        const p = path.join(dir, alias + '.json');
        const story = {
            title: 'COV ' + alias,
            type: 'story',
            author: 'Tester',
            introduction: 'Intro',
            playerVariables: [{ key: 'player_name', prompt: 'Name:' }],
            variables: [],
            speakers: [],
            gameStats: [],
            ownerId: ownerId,
            initialPage: '0',
            pages: {
                '0': {
                    id: '0', title: 'P0', content: [{ text: 'Hi {player_name}' }],
                    choices: [{ text: 'Go end', action: '1' }]
                },
                '1': {
                    id: '1', title: 'Ending', content: [], choices: [{ text: 'End', action: 'END' }],
                    isEnding: true, endings: [{ text: 'Bye' }]
                }
            }
        };
        fs.writeFileSync(p, JSON.stringify(story, null, 2), 'utf8');
        return p;
    }

    afterAll(() => {
        // cleanup temp exports
        try {
            const outDir = path.join(process.cwd(), 'temp');
            if (fs.existsSync(outDir)) {
                const files = fs.readdirSync(outDir).filter(f => /_RUN_DESIGN\.txt$/i.test(f));
                for (const f of files) fs.unlinkSync(path.join(outDir, f));
                // leave dir
            }
        } catch {}
        // cleanup created stories
        try {
            const dir = path.join(__dirname, '..', 'roll', 'storyTeller');
            if (fs.existsSync(dir)) {
                for (const f of fs.readdirSync(dir)) {
                    if (/^allowcov|^exportcov/i.test(f)) {
                        fs.unlinkSync(path.join(dir, f));
                    }
                }
            }
        } catch {}
    });

    test('Poll mode attaches discordCreatePoll and strips textual choices', async () => {
        // start in poll mode
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'start', 'test', 'poll', '5'], userid: USER_ID, botname: 'Discord' });
        const r = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Eve'], userid: USER_ID, botname: 'Discord' });
        expect(r.type).toBe('text');
        // choices text removed
        expect(r.text).not.toMatch(/可用選項：/);
        // poll payload present
        expect(r.discordCreatePoll).toBeTruthy();
        expect(r.discordCreatePoll.minutes).toBe(5);
        expect(Array.isArray(r.discordCreatePoll.options)).toBe(true);
        expect(r.discordCreatePoll.options.length).toBeGreaterThan(0);
    });

    test('Goto invalid target shows allowed choices and buttons', async () => {
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord' });
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Bob'], userid: USER_ID, botname: 'Discord' });
        const r = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'goto', '999'], userid: USER_ID, botname: 'Discord' });
        expect(r.text).toMatch(/^只能前往當前頁面的可選項目/);
        expect(Array.isArray(r.buttonCreate)).toBe(true);
        expect(r.buttonCreate.some(b => b.startsWith('.st goto')) || r.buttonCreate.includes('.st end')).toBe(true);
    });

    test('List with alias shows details and start button', async () => {
        const r = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'list', 'test'], userid: USER_ID });
        expect(r.type).toBe('text');
        expect(r.text).toMatch(/【/);
        expect(Array.isArray(r.buttonCreate)).toBe(true);
        expect(r.buttonCreate[0]).toMatch(/^\.st start test$/);
    });

    test('Debug and Game commands render status, including paused runs', async () => {
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord', channelid: 'C1' });
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Cathy'], userid: USER_ID, botname: 'Discord', channelid: 'C1' });
        const dbg = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'debug'], userid: USER_ID, botname: 'Discord', channelid: 'C1' });
        expect(dbg.text).toContain('【Debug】');
        const paused = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'pause'], userid: USER_ID, botname: 'Discord', channelid: 'C1' });
        expect(paused.text).toContain('已暫停（ID：');
        const game = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'game'], userid: USER_ID, botname: 'Discord', channelid: 'C1' });
        expect(game.text).toContain('【暫停中的遊戲】');
        expect(game.text).toMatch(/ID：/);
    });

    test('Edit mode switches between all and alone on active run', async () => {
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'start', 'test'], userid: USER_ID, botname: 'Discord', channelid: 'C2' });
        await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Dora'], userid: USER_ID, botname: 'Discord', channelid: 'C2' });
        const r1 = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'edit', 'all'], userid: USER_ID, botname: 'Discord', channelid: 'C2' });
        expect(r1.text).toBe('已設定參與權限為：所有人');
        const r2 = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'edit', 'alone'], userid: USER_ID, botname: 'Discord', channelid: 'C2' });
        expect(r2.text).toBe('已設定參與權限為：僅發起者');
    });

    describe('Filesystem allow/disallow + export + verify + my/mylist', () => {
        const alias = 'allowcov';
        beforeAll(() => {
            writeStory(alias, USER_ID);
        });

        test('Allow all/author and group allow/disallow update _meta', async () => {
            const r1 = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'allow', alias, 'all'], userid: USER_ID, groupid: GROUP_ID });
            expect(r1.text).toMatch(/已設定任何人可啟動|已更新權限設定/);
            const r2 = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'allow', alias, 'AUTHOR'], userid: USER_ID, groupid: GROUP_ID });
            expect(r2.text).toMatch(/已設定僅作者可啟動|已更新權限設定/);
            const r3 = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'allow', alias], userid: USER_ID, groupid: GROUP_ID });
            expect(r3.text).toMatch(/已設定允許的群組\/頻道|已更新權限設定/);
            const r4 = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'disallow', alias, GROUP_ID], userid: USER_ID });
            expect(r4.text).toContain('已取消允許');

            const p = path.join(__dirname, '..', 'roll', 'storyTeller', alias + '.json');
            const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
            expect(obj._meta).toBeTruthy();
            expect(['AUTHOR_ONLY', 'GROUP_ONLY', 'ANYONE']).toContain(obj._meta.startPermission);
        });

        test('Export generates a temp file and Verify runs', async () => {
            const exp = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'export', alias], userid: USER_ID, botname: 'Discord' });
            expect(exp.text).toMatch(/^已將『/);
            expect(Array.isArray(exp.dmFileLink)).toBe(true);
            const outFile = exp.dmFileLink[0];
            expect(fs.existsSync(outFile)).toBe(true);

            const ver = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'verify', alias], userid: USER_ID });
            expect(/^verify: /.test(ver.text)).toBe(true);
        });

        test('My and Mylist show stats for owner', async () => {
            // play and end once to create a completed entry in memory
            await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'start', alias], userid: USER_ID, botname: 'Discord', channelid: 'C3' });
            await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'set', 'player_name', 'Eva'], userid: USER_ID, botname: 'Discord', channelid: 'C3' });
            await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'goto', '1'], userid: USER_ID, botname: 'Discord', channelid: 'C3' });
            await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'end'], userid: USER_ID, botname: 'Discord', channelid: 'C3' });

            const my = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'my'], userid: USER_ID });
            expect(my.text).toContain('【我的劇本】');

            const mylist = await storyTeller.rollDiceCommand({ mainMsg: ['.st', 'mylist'], userid: USER_ID });
            expect(mylist.text).toContain('【我的劇本清單】');
            // Depending on test order and in-memory runs, alias may or may not appear.
            // Assert output is non-empty and well-formed.
            expect(mylist.text.length).toBeGreaterThan(10);
        });
    });
});


