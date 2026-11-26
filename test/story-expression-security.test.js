'use strict';

const { evaluateStoryExpression: evaluate } = require('../utils/story-expression');

test('story expressions support hex, binary and octal literals', () => {
    expect(evaluate('score > 0x10 && score == 0B10001', { score: 17 })).toBe(true);
    expect(evaluate('0X2d6 + 0o17 + 0b10')).toBe(743);
    expect(evaluate('1e2 - 0O10 ** 2')).toBe(36);
    for (const invalid of ['0x', '0xG', '0b102', '0o18', '0x10name']) {
        expect(() => evaluate(invalid)).toThrow();
    }
});

test('story expressions retain arithmetic, comparison and short circuit behavior', () => {
    expect(evaluate('(hp + 2) * 3 >= 12 && active', { hp: 2, active: true })).toBe(true);
    expect(evaluate('false && missing', {})).toBe(false);
    expect(evaluate('true || missing', {})).toBe(true);
    expect(evaluate('score == 2', { score: '2' })).toBe(true);
    expect(evaluate('null')).toBeNull();
    expect(evaluate('undefined')).toBeUndefined();
    expect(evaluate('value == null', { value: undefined })).toBe(true);
    expect(evaluate('value !== null', { value: null })).toBe(false);
});

test('story expressions cannot execute code or modify global state', () => {
    const original = globalThis.setTimeout;
    for (const input of ['setTimeout=1', 'globalThis.setTimeout', 'constructor()', 'a[0]', '1;1']) {
        expect(() => evaluate(input, {})).toThrow();
    }
    expect(globalThis.setTimeout).toBe(original);
    expect(() => evaluate('x + 1', { x: {} })).toThrow();
    expect(() => evaluate('true || process', { process: 1 })).toThrow();
    expect(() => evaluate('('.repeat(70) + '1' + ')'.repeat(70))).toThrow();
});

test('legacy exponentiation and scientific notation work in the safe story parser', () => {
    expect(evaluate('2 ** 3')).toBe(8);
    expect(evaluate('2 ** 3 ** 2')).toBe(512);
    expect(evaluate('2 * 3 ** 2')).toBe(18);
    expect(evaluate('score > 1e2', { score: 101 })).toBe(true);
    expect(evaluate('2 ** -2 + 5E-1')).toBe(0.75);
    expect(evaluate('(-2) ** 2')).toBe(4);
    expect(() => evaluate('-2 ** 2')).toThrow();
    expect(() => evaluate('1.5e2')).toThrow();
});
