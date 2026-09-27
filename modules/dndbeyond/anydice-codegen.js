"use strict";

const { parseD20AttackNotation } = require("./dice-utils.js");

function d20RollPart(hitRoll, advantage, disadvantage) {
    const parsed = parseD20AttackNotation(hitRoll);
    if (!parsed) {
        throw new Error("unsupported attack notation");
    }
    let rollPart = "1d20";
    if (advantage && !disadvantage) {
        rollPart = "[highest 1 of 2d20]";
    } else if (disadvantage && !advantage) {
        rollPart = "[lowest 1 of 2d20]";
    }
    return rollPart + (parsed.bonusNotation === "0" ? "" : parsed.bonusNotation);
}

function hitRollToAnyDice(spec, targetAc, label) {
    if (!spec.hitRoll) {
        return null;
    }
    const ac = targetAc ?? spec.targetAc;
    const tag = label ? ` // ${label}` : "";
    const rollPart = d20RollPart(spec.hitRoll, spec.advantage, spec.disadvantage);
    if (ac !== undefined && !Number.isNaN(ac)) {
        return `output ${rollPart} >= ${ac}${tag}`;
    }
    return `output ${rollPart}${tag}`;
}

function damageRollToAnyDice(spec, label) {
    const normalized = spec.damageRoll
        .replaceAll("+", " + ")
        .replaceAll("-", " - ")
        .replaceAll(/\s+/g, " ")
        .trim();
    const tag = label ? ` // ${label}` : "";
    return `output ${normalized}${tag}`;
}

function generateCompareAnyDice(specs, targetAc) {
    return specs.flatMap(spec => {
        const label = spec.name || "attack";
        const lines = [];
        const hitLine = hitRollToAnyDice(spec, targetAc, `${label} hit`);
        if (hitLine) {
            lines.push(hitLine);
        }
        lines.push(damageRollToAnyDice(spec, `${label} dmg`));
        return lines;
    }).join("\n");
}

module.exports = {
    hitRollToAnyDice,
    damageRollToAnyDice,
    generateCompareAnyDice,
};
