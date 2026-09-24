"use strict";

const { Random, MersenneTwister19937 } = require("random-js");
const { rollDie, rollDamageNotation, doubleDiceInDamageNotation } = require("./dice-utils.js");

const DEFAULT_ITERATIONS = 50_000;

function createRng(seed) {
    if (seed === undefined) {
        return () => Math.random();
    }
    const engine = MersenneTwister19937.seed(seed);
    const random = new Random(engine);
    return () => random.real(0, 1, false);
}

function rollD20Attack(hitNotation, advantage, disadvantage, rng) {
    if (!hitNotation) {
        return { total: 21, natural: 20 };
    }
    const mod = Number.parseInt(hitNotation.match(/^1d20([+-]\d+)?$/i)?.[1] || "0", 10);
    const rollOnce = () => {
        const natural = rollDie(20, rng);
        return { total: natural + mod, natural };
    };
    if (advantage && !disadvantage) {
        const a = rollOnce();
        const b = rollOnce();
        return a.total >= b.total ? a : b;
    }
    if (disadvantage && !advantage) {
        const a = rollOnce();
        const b = rollOnce();
        return a.total <= b.total ? a : b;
    }
    return rollOnce();
}

function resolveHitDamage(spec, attack, targetAc, rng) {
    if (!spec.hitRoll) {
        return rollDamageNotation(spec.damageRoll, rng);
    }
    if (attack.natural === 20) {
        return rollDamageNotation(doubleDiceInDamageNotation(spec.damageRoll), rng);
    }
    if (attack.natural === 1 || attack.total < targetAc) {
        return 0;
    }
    return rollDamageNotation(spec.damageRoll, rng);
}

function simulateAttack(spec, targetAc, iterations = DEFAULT_ITERATIONS, seed) {
    const rng = createRng(seed);
    let hits = 0;
    let crits = 0;
    let totalDamage = 0;
    let onHitTotal = 0;
    let onHitN = 0;
    const damageSamples = [];

    for (let i = 0; i < iterations; i++) {
        const attack = rollD20Attack(spec.hitRoll, spec.advantage, spec.disadvantage, rng);
        const damage = resolveHitDamage(spec, attack, targetAc, rng);
        if (spec.hitRoll && attack.natural === 20) {
            crits++;
            hits++;
        } else if (spec.hitRoll && attack.natural !== 1 && attack.total >= targetAc) {
            hits++;
        }
        if (damage > 0) {
            onHitTotal += damage;
            onHitN++;
        }
        totalDamage += damage;
        damageSamples.push(damage);
    }

    damageSamples.sort((a, b) => a - b);
    const p90Index = Math.min(damageSamples.length - 1, Math.floor(damageSamples.length * 0.9));

    return {
        iterations,
        targetAc,
        hitRate: hits / iterations,
        critRate: crits / iterations,
        avgDamage: totalDamage / iterations,
        avgDamageOnHit: onHitN > 0 ? onHitTotal / onHitN : 0,
        p90Damage: damageSamples[p90Index] ?? 0,
    };
}

function compareAttacks(a, b, targetAc, iterations = DEFAULT_ITERATIONS, seed) {
    const simA = simulateAttack(a, targetAc, iterations, seed);
    const simB = simulateAttack(b, targetAc, iterations, seed === undefined ? undefined : seed + 1);
    return { a: simA, b: simB, deltaAvgDamage: simA.avgDamage - simB.avgDamage };
}

module.exports = {
    DEFAULT_ITERATIONS,
    simulateAttack,
    compareAttacks,
    rollD20Attack,
};
