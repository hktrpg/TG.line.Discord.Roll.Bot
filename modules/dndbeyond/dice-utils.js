"use strict";

function abilityMod(score) {
    return Math.floor((score - 10) / 2);
}

function signedModifier(total) {
    return total >= 0 ? `+${total}` : String(total);
}

function d20AttackRoll(totalModifier) {
    return `1d20${signedModifier(totalModifier)}`;
}

function damageDefToNotation(damageDef) {
    if (!damageDef) {
        return "0";
    }
    const count = damageDef.diceCount ?? 0;
    const sides = damageDef.diceValue ?? 0;
    const mult = damageDef.diceMultiplier ?? 1;
    const fixed = damageDef.fixedValue ?? 0;
    const parts = [];
    if (count > 0 && sides > 0) {
        parts.push(`${count * mult}d${sides}`);
    }
    if (fixed !== 0) {
        parts.push(fixed > 0 ? `+${fixed}` : String(fixed));
    }
    return parts.length > 0 ? parts.join("") : "0";
}

function appendModifierToDamage(baseNotation, modifier) {
    if (modifier === 0) {
        return baseNotation;
    }
    const sign = signedModifier(modifier);
    if (/^\d+d\d+$/i.test(baseNotation)) {
        return `${baseNotation}${sign}`;
    }
    if (baseNotation === "0") {
        return String(modifier);
    }
    return `${baseNotation}${sign}`;
}

function rollDie(sides, rng) {
    return Math.floor(rng() * sides) + 1;
}

/**
 * Double only dice terms for 5e critical hits (e.g. 1d8+3 -> 2d8+3).
 * @param {string} notation
 * @returns {string}
 */
function doubleDiceInDamageNotation(notation) {
    if (!notation || typeof notation !== "string") {
        return "0";
    }
    return notation.replaceAll(/\s+/g, "").replaceAll(
        /([+-]?)(\d*)d(\d+)/gi,
        (_match, sign, count, sides) => `${sign}${Number.parseInt(count || "1", 10) * 2}d${sides}`
    );
}

function rollDamageNotation(notation, rng) {
    const cleaned = notation.replaceAll(/\s+/g, "");
    let total = 0;
    const diceRe = /([+-]?)(\d*)d(\d+)/gi;
    let match = diceRe.exec(cleaned);
    while (match) {
        const sign = match[1] === "-" ? -1 : 1;
        const count = Number.parseInt(match[2] || "1", 10);
        const sides = Number.parseInt(match[3], 10);
        for (let i = 0; i < count; i++) {
            total += sign * rollDie(sides, rng);
        }
        match = diceRe.exec(cleaned);
    }
    const flatRe = /([+-]\d+)(?!.*d)/gi;
    let flat = flatRe.exec(cleaned);
    while (flat) {
        total += Number.parseInt(flat[1], 10);
        flat = flatRe.exec(cleaned);
    }
    if (!/d/i.test(cleaned) && /^[+-]?\d+$/.test(cleaned)) {
        total = Number.parseInt(cleaned, 10);
    }
    return total;
}

module.exports = {
    abilityMod,
    signedModifier,
    d20AttackRoll,
    damageDefToNotation,
    appendModifierToDamage,
    rollDie,
    doubleDiceInDamageNotation,
    rollDamageNotation,
};
