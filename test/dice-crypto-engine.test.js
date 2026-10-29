'use strict';

describe('dice roller crypto engine', () => {
    test('basic dice and .rr use the node crypto engine with real dependencies', () => {
        const random = require('random-js');
        const roller = require('@dice-roller/rpg-dice-roller');
        const rollbase = require('../roll/rollbase');
        expect(roller.NumberGenerator.generator.engine).toBe(random.nodeCrypto);
        const next = jest.spyOn(random.nodeCrypto, 'next');
        try {
            const reply = rollbase.rollDiceCommand({ mainMsg: ['.rr'], inputStr: '.rr 4d6kh3' });
            expect(reply.text).toMatch(/4d6/);
            expect(next).toHaveBeenCalled();
        } finally {
            next.mockRestore();
        }
        for (let i = 0; i < 10; i++) {
            expect(rollbase.Dice(6)).toBeGreaterThanOrEqual(1);
            expect(rollbase.Dice(6)).toBeLessThanOrEqual(6);
        }
        expect(new roller.DiceRoll('4d6kh3').output).toMatch(/4d6/);
        expect(() => new roller.DiceRoll('not dice')).toThrow();
    });
});
