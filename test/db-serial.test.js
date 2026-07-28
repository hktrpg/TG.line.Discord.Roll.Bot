"use strict";

const {
    findNextSerial,
    ensureSerials,
    findBySerial
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

    describe('findBySerial', () => {
        const items = [{ topic: 'a', serial: 0 }, { topic: 'b', serial: 2 }];

        it('finds by serial', () => {
            expect(findBySerial(items, 2).topic).toBe('b');
            expect(findBySerial(items, 1)).toBeUndefined();
        });
    });
});
