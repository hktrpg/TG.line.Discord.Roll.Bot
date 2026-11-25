'use strict';

const { evaluateStoryExpression: evaluate } = require('../utils/story-expression');

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
