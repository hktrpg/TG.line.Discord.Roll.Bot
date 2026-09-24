"use strict";

const { diceNotationWithinLimits } = require("./dice-utils.js");

/**
 * Parse roll.itemA format: hit:1d20+7; dmg:2d6+4; adv:0; dis:0; ac:15
 * @param {string} itemA
 * @returns {import('./attack-extractor.js').AttackSpec|null}
 */
function parseRollSpec(itemA) {
    if (!itemA || typeof itemA !== "string") {
        return null;
    }
    const parts = itemA.split(";").map(p => p.trim()).filter(Boolean);
    /** @type {Record<string, string>} */
    const map = {};
    for (const part of parts) {
        const idx = part.indexOf(":");
        if (idx === -1) {
            continue;
        }
        const key = part.slice(0, idx).trim().toLowerCase();
        const value = part.slice(idx + 1).trim();
        map[key] = value;
    }

    if (!map.dmg && !map.hit) {
        return null;
    }

    const hitRaw = (map.hit || "none").toLowerCase();
    const hitRoll = hitRaw === "none" ? null : hitRaw.replaceAll(/\s+/g, "");
    const damageRoll = (map.dmg || "0").replaceAll(/\s+/g, "");
    if ((hitRoll && !diceNotationWithinLimits(hitRoll)) || !diceNotationWithinLimits(damageRoll)) {
        return null;
    }

    return {
        name: "",
        hitRoll,
        damageRoll,
        advantage: map.adv === "1" || map.advantage === "1",
        disadvantage: map.dis === "1" || map.disadvantage === "1",
        targetAc: map.ac ? Number.parseInt(map.ac, 10) : undefined,
        source: "roll_spec",
    };
}

/**
 * @param {import('./attack-extractor.js').AttackSpec} spec
 * @returns {string}
 */
function formatRollSpec(spec) {
    const chunks = [];
    if (spec.hitRoll) {
        chunks.push(`hit:${spec.hitRoll}`);
    } else {
        chunks.push("hit:none");
    }
    chunks.push(`dmg:${spec.damageRoll}`);
    if (spec.advantage) {
        chunks.push("adv:1");
    }
    if (spec.disadvantage) {
        chunks.push("dis:1");
    }
    if (spec.targetAc !== undefined && !Number.isNaN(spec.targetAc)) {
        chunks.push(`ac:${spec.targetAc}`);
    }
    return chunks.join("; ");
}

module.exports = {
    parseRollSpec,
    formatRollSpec,
};
