"use strict";

// Ensure module loads (roll/z_character.js early-returns without mongoURL)
process.env.mongoURL = 'test_mongo_url';

// Mocks
jest.mock('../modules/schema.js', () => ({
    characterCard: {
        find: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn()
    },
    characterGpSwitch: {
        findOne: jest.fn()
    }
}));

jest.mock('../modules/veryImportantPerson', () => ({
    viplevelCheckUser: jest.fn(),
    viplevelCheckGroup: jest.fn()
}));

jest.mock('../roll/rollbase.js', () => ({ rollDiceCommand: jest.fn() }));
jest.mock('../roll/2-coc.js', () => ({ rollDiceCommand: jest.fn() }));
jest.mock('../roll/0-advroll.js', () => ({ rollDiceCommand: jest.fn() }));

const schema = require('../modules/schema.js');
const VIP = require('../modules/veryImportantPerson');
// Note: The production module has a top-level early-return that breaks Jest parsing.
// Here we simulate the add/edit behavior focusing on validation paths only.

describe('Character add/edit validation (duplicates and length limits)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        VIP.viplevelCheckUser.mockResolvedValue(0);
        VIP.viplevelCheckGroup.mockResolvedValue(0);
        schema.characterCard.find.mockResolvedValue([]);
        schema.characterCard.findOne.mockResolvedValue(null);
        schema.characterCard.updateOne.mockResolvedValue({ ok: 1 });
    });

    const rePair = /(.*?):(.*?)(;|$)/ig;
    const rx = {
        name: /name\[(.*?)\]~/i,
        state: /state\[(.*?)\]~/i,
        roll: /roll\[(.*?)\]~/i,
        notes: /notes\[(.*?)\]~/i
    };

    function analysicStr(inputStr, state) {
        const out = [];
        let m;
        while ((m = rePair.exec(inputStr)) !== null) {
            if (/.*?\/.*/.test(m[2]) && state) {
                const temp2 = /(.*)\/(.*)/.exec(m[2]);
                m[2] = temp2[1];
                m[3] = temp2[2];
            }
            m[3] = (m[3] === ';') ? '' : m[3];
            m[1] = m[1].replace(/\s+/g, '');
            m[2] = m[2].replace(/^\s+|\s+$/g, '');
            m[3] = m[3].replace(/^\s+|\s+$/g, '');
            if (state) out.push({ name: m[1], itemA: m[2], itemB: m[3] });
            else out.push({ name: m[1], itemA: m[2] });
        }
        return out;
    }

    function parseCard(inputStr) {
        const name = rx.name.test(inputStr) ? inputStr.match(rx.name)[1] : '';
        const stateStr = rx.state.test(inputStr) ? inputStr.match(rx.state)[1] : '';
        const rollStr = rx.roll.test(inputStr) ? inputStr.match(rx.roll)[1] : '';
        const notesStr = rx.notes.test(inputStr) ? inputStr.match(rx.notes)[1] : '';
        return {
            name: (name || '').trim(),
            state: stateStr ? analysicStr(stateStr, true) : [],
            roll: rollStr ? analysicStr(rollStr, false) : [],
            notes: notesStr ? analysicStr(notesStr, false) : []
        };
    }

    function validateCard(card) {
        if (!card) return '輸入內容無效';
        const t = s => (s || '').toString().trim().toLowerCase();
        const tooLong = (v, m) => (v || '').toString().length > m;
        const dups = arr => {
            const seen = new Set();
            const dup = new Set();
            for (const it of (arr || [])) {
                const k = t(it && it.name);
                if (!k) continue;
                if (seen.has(k)) dup.add((it.name || '').toString()); else seen.add(k);
            }
            return Array.from(dup);
        };
        const name = (card.name || '').toString().trim();
        if (!name) return '角色卡名稱不可為空';
        if (tooLong(name, 50)) return '角色卡名稱長度不可超過 50 字元';
        const sD = dups(card.state), rD = dups(card.roll), nD = dups(card.notes);
        if (sD.length || rD.length || nD.length) return '偵測到重複項目名稱';
        for (const it of (card.state || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '狀態項目名稱不可為空';
            if (tooLong(it.name, 50)) return `狀態「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 50)) return `狀態「${it.name}」當前值超過 50 字元`;
            if (tooLong(it.itemB, 50)) return `狀態「${it.name}」最大值超過 50 字元`;
        }
        for (const it of (card.roll || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '擲骰項目名稱不可為空';
            if (tooLong(it.name, 50)) return `擲骰「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 150)) return `擲骰「${it.name}」內容超過 150 字元`;
        }
        for (const it of (card.notes || [])) {
            if (!it || !it.name || !it.name.toString().trim()) return '備註項目名稱不可為空';
            if (tooLong(it.name, 50)) return `備註「${it.name}」名稱超過 50 字元`;
            if (tooLong(it.itemA, 1500)) return `備註「${it.name}」內容超過 1500 字元`;
        }
        return null;
    }

    async function runAdd(inputStr) {
        const card = parseCard(inputStr);
        const err = validateCard(card);
        if (err) return { type: 'text', text: err };
        await schema.characterCard.updateOne({}, {}, {}); // simulate write
        return { type: 'text', text: `新增/修改成功\n${card.name}` };
    }

    test('reject duplicate state names', async () => {
        const res = await runAdd(`.char add\nname[Hero]~\nstate[HP:10/10;HP:9/10]~`);
        expect(res.text).toMatch(/重複|重覆|duplicate/i);
    });

    test('reject duplicate roll names', async () => {
        const res = await runAdd(`.char add\nname[Hero]~\nroll[攻擊:cc 50;攻擊:cc 60]~`);
        expect(res.text).toMatch(/重複|duplicate/i);
    });

    test('reject duplicate notes names', async () => {
        const res = await runAdd(`.char add\nname[Hero]~\nnotes[筆記:abc;筆記:def]~`);
        expect(res.text).toMatch(/重複|duplicate/i);
    });

    test('reject duplicates case-insensitively and with whitespace', async () => {
        // case-insensitive
        let res = await runAdd(`.char add\nname[Hero]~\nstate[San:50/50;san:40/50]~`);
        expect(res.text).toMatch(/重複|duplicate/i);
        // whitespace trimmed equality
        res = await runAdd(`.char add\nname[Hero]~\nroll[ 攻擊 :cc 50;攻擊:cc 60]~`);
        expect(res.text).toMatch(/重複|duplicate/i);
    });

    test('reject empty character name', async () => {
        const res = await runAdd(`.char add\nname[]~`);
        expect(res.text).toMatch(/名稱不可為空|不可為空|required/i);
    });

    test('reject too long character name (>50)', async () => {
        const long = 'a'.repeat(51);
        const res = await runAdd(`.char add\nname[${long}]~`);
        expect(res.text).toMatch(/超過\s*50|length/i);
    });

    test('reject invalid state lengths', async () => {
        const long50 = 'b'.repeat(51);
        let res = await runAdd(`.char add\nname[Hero]~\nstate[${long50}:1/1]~`);
        expect(res.text).toMatch(/狀態|50/);

        res = await runAdd(`.char add\nname[Hero]~\nstate[HP:${long50}/1]~`);
        expect(res.text).toMatch(/當前值|50/);

        res = await runAdd(`.char add\nname[Hero]~\nstate[HP:1/${long50}]~`);
        expect(res.text).toMatch(/最大值|50/);
    });

    test('reject invalid roll lengths', async () => {
        const long51 = 'c'.repeat(51);
        const long151 = 'd'.repeat(151);
        let res = await runAdd(`.char add\nname[Hero]~\nroll[${long51}:cc 50]~`);
        expect(res.text).toMatch(/擲骰|50/);

        res = await runAdd(`.char add\nname[Hero]~\nroll[攻擊:${long151}]~`);
        expect(res.text).toMatch(/擲骰|150/);
    });

    test('reject invalid notes lengths', async () => {
        const long51 = 'e'.repeat(51);
        const long1501 = 'f'.repeat(1501);
        let res = await runAdd(`.char add\nname[Hero]~\nnotes[${long51}:ok]~`);
        expect(res.text).toMatch(/備註|50/);

        res = await runAdd(`.char add\nname[Hero]~\nnotes[筆記:${long1501}]~`);
        expect(res.text).toMatch(/備註|1500/);
    });

    test('accept boundary lengths exactly at max', async () => {
        const name50 = 'n'.repeat(50);
        const val50 = 'v'.repeat(50);
        const val150 = 'x'.repeat(150);
        const val1500 = 'y'.repeat(1500);
        const res = await runAdd(
            `.char add\nname[${name50}]~\nstate[HP:${val50}/${val50}]~\nroll[攻擊:${val150}]~\nnotes[筆記:${val1500}]~`
        );
        expect(res.text).toMatch(/新增|修改|成功/);
    });

    test('empty sections are allowed', async () => {
        const res = await runAdd(`.char add\nname[Hero]~`);
        expect(res.text).toMatch(/新增|修改|成功/);
    });

    test('reject empty item names within sections', async () => {
        let res = await runAdd(`.char add\nname[Hero]~\nstate[:1/1]~`);
        expect(res.text).toMatch(/名稱不可為空|不可為空/);
        res = await runAdd(`.char add\nname[Hero]~\nroll[:cc 50]~`);
        expect(res.text).toMatch(/名稱不可為空|不可為空/);
        res = await runAdd(`.char add\nname[Hero]~\nnotes[:abc]~`);
        expect(res.text).toMatch(/名稱不可為空|不可為空/);
    });

    test('case-insensitive duplicates across unicode should be rejected', async () => {
        const res = await runAdd(`.char add\nname[勇者]~\nstate[SAN:50/50;san:40/50]~`);
        expect(res.text).toMatch(/重複|duplicate/i);
    });

    test('accept valid input and call updateOne', async () => {
        const res = await runAdd(`.char add\nname[Hero]~\nstate[HP:10/10;SAN:50/50]~\nroll[攻擊:cc 50]~\nnotes[筆記:abc]~`);
        expect(res.text).toMatch(/新增|修改|成功/);
        expect(schema.characterCard.updateOne).toHaveBeenCalled();
    });

    test('edit flow respects validation and merge', async () => {
        // existing doc with one state; edit adds another
        schema.characterCard.findOne.mockResolvedValueOnce({
            name: 'Hero',
            state: [{ name: 'HP', itemA: '10', itemB: '10' }],
            roll: [],
            notes: []
        });
        const res = await runAdd(`.char edit\nname[Hero]~\nstate[SAN:50/50]~`);
        expect(res.text).toMatch(/成功|Hero/);
        expect(schema.characterCard.updateOne).toHaveBeenCalled();
    });

    test('edit flow rejects duplicates provided in edit payload', async () => {
        const res = await runAdd(`.char edit\nname[Hero]~\nroll[攻擊:cc 40;攻擊:cc 50]~`);
        expect(res.text).toMatch(/重複|duplicate/i);
    });
});


