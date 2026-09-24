"use strict";

const { fetchCharacterData } = require("./character-client.js");
const { buildCharacterCardPatch } = require("./attack-extractor.js");
const { parseRollSpec } = require("./roll-spec-parser.js");
const { generateCompareAnyDice } = require("./anydice-codegen.js");
const { compareAttacks, DEFAULT_ITERATIONS } = require("./dpr-simulator.js");

const IMPORT_ERROR_KEYS = {
    invalid_id: "character.importddb_error_invalid_id",
    not_public: "character.importddb_error_not_public",
    not_found: "character.importddb_error_not_found",
    rate_limit: "character.importddb_error_rate_limit",
    network: "character.importddb_error_network",
    parse_error: "character.importddb_error_parse_error",
};

function parseImportDdbInput(inputStr) {
    let rest = inputStr.replace(/^\.char\s+importddb\s+/i, "").trim();
    const replaceMode = /^replace\s+/i.test(rest);
    if (replaceMode) {
        rest = rest.replace(/^replace\s+/i, "");
    }
    const tokens = rest.split(/\s+/);
    return {
        replaceMode,
        idInput: tokens[0],
        cardName: tokens.slice(1).join(" ").trim(),
    };
}

function translateFetchError(translate, fetchResult) {
    const key = IMPORT_ERROR_KEYS[fetchResult.code];
    if (key) {
        return translate(key, {
            retrySec: fetchResult.retryMs ? Math.ceil(fetchResult.retryMs / 1000) : undefined,
        });
    }
    return translate("character.importddb_failed", { error: fetchResult.code });
}

function matchTwoRollNames(body, rollNames) {
    const names = [...new Set(rollNames.filter(Boolean))].sort((a, b) => b.length - a.length);
    let rest = body.trim();
    let targetAc = 15;
    let targetAcFromInput = false;
    const acMatch = rest.match(/^(.*\S)\s+(\d+)$/);
    if (acMatch) {
        targetAc = Number.parseInt(acMatch[2], 10);
        targetAcFromInput = true;
        rest = acMatch[1].trim();
    }
    const lowerRest = rest.toLowerCase();
    for (const nameA of names) {
        const prefix = nameA.toLowerCase();
        if (lowerRest !== prefix && !lowerRest.startsWith(prefix + " ")) {
            continue;
        }
        const after = rest.slice(nameA.length).trim();
        const afterLower = after.toLowerCase();
        for (const nameB of names) {
            if (afterLower === nameB.toLowerCase()) {
                return { rollNameA: nameA, rollNameB: nameB, targetAc, targetAcFromInput };
            }
        }
    }
    return null;
}

function parseCompareInput(inputStr, rollNames) {
    const body = inputStr.replace(/^\.(?:char|ch)\s+compare\s+/i, "").trim();
    if (Array.isArray(rollNames) && rollNames.length > 0) {
        const matched = matchTwoRollNames(body, rollNames);
        if (matched) {
            return matched;
        }
        if (rollNames.some(name => /\s/.test(String(name)))) {
            return null;
        }
    }
    const tokens = body.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) {
        return null;
    }
    let targetAc = 15;
    let targetAcFromInput = false;
    if (tokens[2] && /^\d+$/.test(tokens[2])) {
        targetAc = Number.parseInt(tokens[2], 10);
        targetAcFromInput = true;
    }
    return { rollNameA: tokens[0], rollNameB: tokens[1], targetAc, targetAcFromInput };
}

function resolveCompareTargetAc(specA, specB, targetAc, targetAcFromInput) {
    if (targetAcFromInput) {
        return targetAc;
    }
    const fromA = specA?.targetAc;
    const fromB = specB?.targetAc;
    if (fromA !== undefined && !Number.isNaN(fromA)) {
        return fromA;
    }
    if (fromB !== undefined && !Number.isNaN(fromB)) {
        return fromB;
    }
    return targetAc;
}

function findRollEntry(rolls, query, escapeRegex) {
    if (!Array.isArray(rolls) || !query) {
        return;
    }
    const pattern = escapeRegex(query);
    const direct = rolls.find(
        element => element?.name && element.name.match(new RegExp("^" + pattern + "$", "i"))
    );
    if (direct) {
        return direct;
    }
    const lower = query.toLowerCase();
    return rolls.find(element => {
        if (!element?.name) {
            return false;
        }
        const name = element.name.toLowerCase();
        return name.endsWith(":" + lower) || name.replace(/^ddb:/i, "") === lower;
    });
}

function rollSpecFromEntry(entry) {
    const spec = parseRollSpec(entry.itemA);
    if (!spec) {
        return null;
    }
    spec.name = entry.name;
    return spec;
}

function formatPercent(rate) {
    return `${(rate * 100).toFixed(1)}%`;
}

function formatAverage(value) {
    return (Math.round(value * 100) / 100).toFixed(2);
}

function buildCompareMessage(translate, doc, entryA, entryB, targetAc, targetAcFromInput = false) {
    const specA = rollSpecFromEntry(entryA);
    const specB = rollSpecFromEntry(entryB);
    if (!specA || !specB) {
        return null;
    }

    const ac = resolveCompareTargetAc(specA, specB, targetAc, targetAcFromInput);

    const anydice = generateCompareAnyDice([specA, specB], ac);
    const { a, b, deltaAvgDamage } = compareAttacks(specA, specB, ac, DEFAULT_ITERATIONS, 42_001);

    let text = translate("character.compare_header", {
        name: doc.name,
        ac: ac,
        iterations: DEFAULT_ITERATIONS,
    });
    for (const [entry, sim] of [[entryA, a], [entryB, b]]) {
        text += translate("character.compare_row", {
            label: entry.name,
            hit: formatPercent(sim.hitRate),
            crit: formatPercent(sim.critRate),
            avg: formatAverage(sim.avgDamage),
            avgHit: formatAverage(sim.avgDamageOnHit),
            p90: String(sim.p90Damage),
        });
    }
    const winner = deltaAvgDamage > 0
        ? entryA.name
        : deltaAvgDamage < 0
            ? entryB.name
            : translate("character.compare_tie");
    text += translate("character.compare_verdict", {
        winner,
        delta: formatAverage(Math.abs(deltaAvgDamage)),
    });
    text += "\n\n" + translate("character.compare_anydice_header") + "\n```\n" + anydice + "\n```\n"
        + translate("character.compare_anydice_hint");
    return text;
}

async function importDdbCharacter(idInput, userid) {
    return fetchCharacterData(idInput, userid);
}

module.exports = {
    DEFAULT_ITERATIONS,
    parseImportDdbInput,
    translateFetchError,
    parseCompareInput,
    resolveCompareTargetAc,
    findRollEntry,
    rollSpecFromEntry,
    buildCompareMessage,
    importDdbCharacter,
    buildCharacterCardPatch,
};
