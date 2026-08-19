"use strict";

const moment = require('moment');
const { checkAtTime } = require('../roll/schedule-at-time.js');

describe('checkAtTime datetime formats', () => {
    test('parses YYYYMMDD HHMM and YYYYMMDDHHMM as the same local time', () => {
        const split = checkAtTime('20260818', '1129');
        const compact = checkAtTime('202608181129');

        expect(split).toBeTruthy();
        expect(compact).toBeTruthy();
        expect(split.threeColum).toBe(true);
        expect(compact.threeColum).toBe(false);
        expect(moment(split.time).format('YYYYMMDDHHmm')).toBe('202608181129');
        expect(moment(compact.time).format('YYYYMMDDHHmm')).toBe('202608181129');
        expect(compact.time.getTime()).toBe(split.time.getTime());
    });

    test('parses afternoon 24h time in compact form', () => {
        const result = checkAtTime('202206041900');
        expect(result).toBeTruthy();
        expect(result.threeColum).toBe(false);
        expect(moment(result.time).format('YYYYMMDDHHmm')).toBe('202206041900');
    });

    test('returns undefined for invalid tokens', () => {
        expect(checkAtTime('not-a-time')).toBeUndefined();
        expect(checkAtTime('20260818', 'abc')).toBeUndefined();
    });
});
