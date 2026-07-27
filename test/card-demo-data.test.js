"use strict";

const { buildCardDemoData } = require('../views/common/cardManager.js');

describe('buildCardDemoData', () => {
    it('uses fallbacks when translator is missing', () => {
        const demo = buildCardDemoData(null);
        expect(demo.name).toBe('DemoCharacter');
        expect(demo.roll.some(r => r.name === 'HProll')).toBe(true);
        expect(demo.roll.some(r => r.name === 'LuckCheck')).toBe(true);
        for (const item of [...demo.state, ...demo.roll, ...demo.notes]) {
            expect(item.name).not.toMatch(/\s/);
        }
    });

    it('rejects translations that contain whitespace in item names', () => {
        const tr = (key) => {
            const map = {
                card_demo_name: 'Demo Character',
                card_demo_roll_hp: 'HP roll',
                card_demo_roll_luck_check: 'Luck check',
                card_demo_brawl: 'Brawl',
                card_demo_luck: 'Luck'
            };
            return map[key] || key;
        };
        const demo = buildCardDemoData(tr);
        expect(demo.name).toBe('DemoCharacter');
        expect(demo.roll.find(r => r.itemA === '1d{HP}').name).toBe('HProll');
        expect(demo.roll.find(r => r.itemA.startsWith('CC {')).name).toBe('LuckCheck');
        expect(demo.state.some(s => s.name === 'Brawl')).toBe(true);
    });

    it('keeps single-token translations', () => {
        const tr = (key) => {
            const map = {
                card_demo_name: 'DemoChar',
                card_demo_roll_hp: 'HProllEN',
                card_demo_brawl: 'BrawlEN'
            };
            return map[key] || key;
        };
        const demo = buildCardDemoData(tr);
        expect(demo.name).toBe('DemoChar');
        expect(demo.roll.find(r => r.itemA === '1d{HP}').name).toBe('HProllEN');
        expect(demo.state.some(s => s.name === 'BrawlEN')).toBe(true);
    });
});
