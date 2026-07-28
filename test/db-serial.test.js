"use strict";

const {
    findNextSerial,
    ensureSerials,
    findBySerial,
    findIndexBySerial,
    sortBySerial,
    hasSerial
} = require('../modules/db/serial.js');

describe('modules/db/serial', () => {
    describe('findNextSerial', () => {
        it('returns startFrom when empty', () => {
            expect(findNextSerial([], 0)).toBe(0);
            expect(findNextSerial([], 1)).toBe(1);
            expect(findNextSerial(null, 1)).toBe(1);
        });

        it('fills gaps from 0', () => {
            expect(findNextSerial([0, 1, 3], 0)).toBe(2);
            expect(findNextSerial([0, 1, 2], 0)).toBe(3);
        });

        it('fills gaps from 1', () => {
            expect(findNextSerial([1, 2, 4], 1)).toBe(3);
            expect(findNextSerial([1, 2, 3], 1)).toBe(4);
        });
    });

    describe('ensureSerials', () => {
        it('assigns by index when none have serial (startFrom 0)', () => {
            const items = [{ topic: 'a' }, { topic: 'b' }];
            const { changed } = ensureSerials(items, 0);
            expect(changed).toBe(true);
            expect(items.map(i => i.serial)).toEqual([0, 1]);
        });

        it('assigns by index+1 when none have serial (startFrom 1)', () => {
            const items = [{ topic: 'a' }, { topic: 'b' }];
            const { changed } = ensureSerials(items, 1);
            expect(changed).toBe(true);
            expect(items.map(i => i.serial)).toEqual([1, 2]);
        });

        it('does not renumber existing when some missing', () => {
            const items = [{ topic: 'a', serial: 0 }, { topic: 'b' }, { topic: 'c', serial: 5 }];
            const { changed } = ensureSerials(items, 0);
            expect(changed).toBe(true);
            expect(items[0].serial).toBe(0);
            expect(items[2].serial).toBe(5);
            expect(items[1].serial).toBe(1);
        });

        it('returns changed false when all have serial', () => {
            const items = [{ serial: 0 }, { serial: 2 }];
            const { changed } = ensureSerials(items, 0);
            expect(changed).toBe(false);
        });
    });

    describe('findBySerial / findIndexBySerial', () => {
        const items = [{ topic: 'a', serial: 0 }, { topic: 'b', serial: 2 }];

        it('finds by serial', () => {
            expect(findBySerial(items, 2).topic).toBe('b');
            expect(findBySerial(items, 1)).toBeUndefined();
        });

        it('finds index by serial', () => {
            expect(findIndexBySerial(items, 0)).toBe(0);
            expect(findIndexBySerial(items, 2)).toBe(1);
            expect(findIndexBySerial(items, 9)).toBe(-1);
        });

        it('hasSerial', () => {
            expect(hasSerial({ serial: 0 })).toBe(true);
            expect(hasSerial({ serial: '0' })).toBe(false);
            expect(hasSerial({})).toBe(false);
        });
    });

    describe('sortBySerial', () => {
        it('sorts ascending by serial', () => {
            const items = [{ serial: 3 }, { serial: 0 }, { serial: 1 }];
            sortBySerial(items);
            expect(items.map(i => i.serial)).toEqual([0, 1, 3]);
        });

        it('puts missing serials last', () => {
            const items = [{ serial: 2 }, { name: 'x' }, { serial: 0 }];
            sortBySerial(items);
            expect(items[0].serial).toBe(0);
            expect(items[1].serial).toBe(2);
            expect(items[2].name).toBe('x');
        });
    });
});
