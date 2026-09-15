'use strict';

const {
    convertDiscordMessages,
    buildSessionLogFromMessages,
    applyMods,
    messageToEvent,
} = require('../modules/session-log/discord-import.js');

describe('discord-import', () => {
    test('messageToEvent converts say messages', () => {
        const event = messageToEvent({
            contact: '你好',
            userName: '林晚晴',
            isbot: false,
            timestamp: 1,
        }, 0);
        expect(event.type).toBe('say');
        expect(event.name).toBe('林晚晴');
    });

    test('messageToEvent converts bot dice messages', () => {
        const event = messageToEvent({
            contact: '林晚晴 圖書館使用 cc 70 → 14 極限成功',
            userName: 'HKTRPG',
            isbot: true,
            timestamp: 2,
        }, 1);
        expect(event.type).toBe('dice');
        expect(event.verdict).toContain('極限成功');
    });

    test('messageToEvent converts attachments to reference', () => {
        const event = messageToEvent({
            contact: '地圖',
            userName: 'KP',
            isbot: false,
            attachments: [{ url: 'https://example.com/map.png', name: 'map.png' }],
            timestamp: 3,
        }, 2);
        expect(event.type).toBe('reference');
        expect(event.url).toBe('https://example.com/map.png');
    });

    test('buildSessionLogFromMessages builds metadata', () => {
        const log = buildSessionLogFromMessages([
            { contact: '測試', userName: '玩家A', isbot: false, timestamp: 1000 },
        ], { title: '測試團' });
        expect(log.title).toBe('測試團');
        expect(log.events.length).toBe(1);
        expect(log.playerNames).toContain('玩家A');
    });

    test('applyMods hides and patches events', () => {
        const events = [
            { id: 'e0001', type: 'say', name: 'A', text: 'hello' },
            { id: 'e0002', type: 'say', name: 'B', text: 'world' },
        ];
        const mods = [
            { op: 'hide', eventId: 'e0001' },
            { op: 'edit', eventId: 'e0002', patch: { text: 'earth' } },
        ];
        const out = applyMods(events, mods);
        expect(out).toHaveLength(1);
        expect(out[0].text).toBe('earth');
    });

    test('convertDiscordMessages preserves order', () => {
        const events = convertDiscordMessages([
            { contact: '【場景】圖書館', userName: 'KP', isbot: false, timestamp: 1 },
            { contact: '我們進去吧', userName: '玩家', isbot: false, timestamp: 2 },
        ]);
        expect(events[0].type).toBe('scene');
        expect(events[1].type).toBe('say');
    });
});
