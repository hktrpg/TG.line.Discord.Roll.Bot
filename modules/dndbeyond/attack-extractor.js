"use strict";

const {
    abilityMod,
    d20AttackRoll,
    damageDefToNotation,
    appendModifierToDamage,
} = require("./dice-utils.js");
const { formatRollSpec } = require("./roll-spec-parser.js");
const {
    buildSheetStates,
    buildSavingThrowRolls,
    buildPreparedSpellNotes,
    buildSkillRolls,
    buildInitiativeRoll,
    buildProficiencyNote,
    buildFeatureNotes,
    buildUnarmedStrikeRoll,
    buildHealingSpellRolls,
    buildInventoryNote,
    resolveCharacterImage,
    readBaseStats: readEffectiveStatsFromSheet,
} = require("./sheet-extractor.js");
const { applyDdbSectionTags, buildTaggedNotes } = require("./ddb-section-tags.js");

/**
 * @typedef {object} AttackSpec
 * @property {string} name
 * @property {string|null} hitRoll
 * @property {string} damageRoll
 * @property {boolean} [advantage]
 * @property {boolean} [disadvantage]
 * @property {number} [targetAc]
 * @property {string} [source]
 * @property {number} [ddbEntityId]
 */

function readBaseStats(data) {
    return readEffectiveStatsFromSheet(data);
}

function readProficiencyBonus(data) {
    if (typeof data.proficiencyBonus === "number") {
        return data.proficiencyBonus;
    }
    const totalLevel = readTotalLevel(data);
    return totalLevel > 0 ? Math.floor((totalLevel - 1) / 4) + 2 : 2;
}

function readTotalLevel(data) {
    return (data.classes || []).reduce((sum, c) => sum + (c.level || 0), 0);
}

/**
 * DDB v5 returns modifiers as an array (older) or grouped object (race, class, …).
 * @param {object} data
 * @returns {object[]}
 */
function iterateCharacterModifiers(data) {
    const raw = data.modifiers;
    if (!raw) {
        return [];
    }
    if (Array.isArray(raw)) {
        return raw;
    }
    if (typeof raw === "object") {
        const list = [];
        for (const value of Object.values(raw)) {
            if (Array.isArray(value)) {
                list.push(...value);
            }
        }
        return list;
    }
    return [];
}

function sumModifiersForEntity(data, entityId, subType) {
    let total = 0;
    for (const mod of iterateCharacterModifiers(data)) {
        if (mod?.entityId === entityId && mod.subType === subType && typeof mod.value === "number") {
            total += mod.value;
        }
    }
    return total;
}

function propertyNames(properties) {
    return (properties || []).map(p => (p.name || p).toString().toLowerCase());
}

/**
 * Melee (including thrown) uses Strength. Ranged uses Dexterity.
 * Finesse uses whichever of Strength or Dexterity is higher.
 * Thrown alone does not switch the attack to Dexterity.
 * @param {object[]|string[]} properties
 * @param {Record<number, number>} stats
 * @returns {number}
 */
function weaponAbilityStatId(properties, stats) {
    const names = propertyNames(properties);
    const finesse = names.includes("finesse");
    const ranged = names.includes("range") || names.includes("ranged");
    if (finesse) {
        const strMod = abilityMod(stats[1] ?? 10);
        const dexMod = abilityMod(stats[2] ?? 10);
        return dexMod > strMod ? 2 : 1;
    }
    return ranged ? 2 : 1;
}

function weaponAttackModifier(stats, statId, pb, entityId, data) {
    const mod = abilityMod(stats[statId] ?? 10);
    return mod + pb + sumModifiersForEntity(data, entityId, "attack-roll");
}

function extractEquippedWeapon(data, item, stats, pb) {
    if (!item.equipped) {
        return null;
    }
    const def = item.definition || {};
    const filterType = (def.filterType || def.type || "").toString();
    if (!/weapon/i.test(filterType) && !def.damage) {
        return null;
    }
    const name = def.name || item.name;
    if (!name) {
        return null;
    }
    const statId = weaponAbilityStatId(def.properties, stats);
    const entityId = item.id;
    const damageMod = abilityMod(stats[statId] ?? 10)
        + sumModifiersForEntity(data, entityId, "damage");
    return {
        name,
        hitRoll: d20AttackRoll(weaponAttackModifier(stats, statId, pb, entityId, data)),
        damageRoll: appendModifierToDamage(damageDefToNotation(def.damage), damageMod),
        source: "ddb_weapon",
        ddbEntityId: entityId,
    };
}

function spellAttackModifier(data, spellEntry, stats, pb) {
    for (const mod of iterateCharacterModifiers(data)) {
        if (mod.subType === "spell-attacks" && typeof mod.value === "number") {
            return mod.value;
        }
    }
    const castingStat = resolveSpellCastingAbilityId(data, spellEntry);
    return abilityMod(stats[castingStat] ?? 10) + pb
        + sumModifiersForEntity(data, spellEntry.id, "attack-roll");
}

function resolveSpellCastingAbilityId(data, spellEntry) {
    if (spellEntry.spellCastingAbilityId) {
        return spellEntry.spellCastingAbilityId;
    }
    const def = spellEntry.definition || spellEntry;
    if (def.spellCastingAbilityId) {
        return def.spellCastingAbilityId;
    }
    for (const cls of data.classes || []) {
        const fromClass = cls.definition?.spellCastingAbilityId;
        if (fromClass) {
            return fromClass;
        }
    }
    return 4;
}

function cantripDamageMultiplier(totalLevel) {
    if (totalLevel >= 17) {
        return 4;
    }
    if (totalLevel >= 11) {
        return 3;
    }
    if (totalLevel >= 5) {
        return 2;
    }
    return 1;
}

function damageDieFromSpellDefinition(def) {
    for (const mod of def.modifiers || []) {
        if (mod?.type === "damage" && mod.die?.diceCount && mod.die?.diceValue) {
            return mod.die;
        }
    }
    return null;
}

function spellDamageNotation(spellEntry, totalLevel) {
    const def = spellEntry.definition || spellEntry;
    const scale = spellEntry.scale || def.scale;
    if (scale?.dice?.diceCount) {
        return damageDefToNotation(scale.dice);
    }
    const dmg = def.dice || def.damage;
    if (typeof dmg === "object" && (dmg.diceCount || dmg.diceValue)) {
        return damageDefToNotation(dmg);
    }
    if (typeof dmg === "string") {
        return dmg.replaceAll(/\s+/g, "");
    }
    const modifierDie = damageDieFromSpellDefinition(def);
    if (modifierDie) {
        const level = typeof def.level === "number" ? def.level : 0;
        const diceCount = (modifierDie.diceCount ?? 1)
            * (level === 0 ? cantripDamageMultiplier(totalLevel) : 1);
        return damageDefToNotation({
            ...modifierDie,
            diceCount,
        });
    }
    return "0";
}

function activationIsUsable(activation) {
    const activationType = activation?.activationType;
    if (typeof activationType === "number") {
        return activationType >= 1 && activationType <= 8;
    }
    return /action|bonus|reaction/i.test(String(activationType || ""));
}

function resolveArmorClass(data, stats) {
    if (typeof data.armorClass === "number") {
        return data.armorClass;
    }
    const dexMod = abilityMod(stats[2] ?? 10);
    let ac = 10 + dexMod;
    let wearingArmor = false;
    let shieldBonus = 0;
    for (const item of data.inventory || []) {
        if (!item.equipped) {
            continue;
        }
        const def = item.definition || {};
        const filterType = (def.filterType || "").toString().toLowerCase();
        const typeLabel = (def.type || "").toString();
        if (filterType === "armor" && /shield/i.test(typeLabel)) {
            shieldBonus += typeof def.armorClass === "number" ? def.armorClass : 2;
            continue;
        }
        if (filterType !== "armor" && !/armor/i.test(typeLabel)) {
            continue;
        }
        wearingArmor = true;
        const base = typeof def.armorClass === "number" ? def.armorClass : 10;
        if (/heavy/i.test(typeLabel)) {
            ac = base;
        } else if (/medium/i.test(typeLabel)) {
            ac = base + Math.min(dexMod, 2);
        } else {
            ac = base + dexMod;
        }
    }
    if (shieldBonus > 0) {
        ac += shieldBonus;
    }
    return wearingArmor || shieldBonus > 0 ? ac : undefined;
}

function isSpellAttackRoll(def, spellEntry, totalLevel) {
    if (def.requiresSavingThrow) {
        return false;
    }
    if (def.requiresAttackRoll === true || def.attackType != null) {
        return spellDamageNotation(spellEntry, totalLevel) !== "0";
    }
    if (def.level !== 0) {
        return false;
    }
    const damageRoll = spellDamageNotation(spellEntry, totalLevel);
    if (damageRoll === "0") {
        return false;
    }
    const range = def.range || {};
    const hasNumericRange = typeof range.rangeValue === "number" && range.rangeValue > 0;
    return hasNumericRange && activationIsUsable(def.activation || {});
}

function extractSpellAttack(data, spellEntry, stats, pb, totalLevel) {
    const def = spellEntry.definition || spellEntry;
    if (!def?.name || !isSpellAttackRoll(def, spellEntry, totalLevel)) {
        return null;
    }
    const damageRoll = spellDamageNotation(spellEntry, totalLevel);
    return {
        name: def.name,
        hitRoll: d20AttackRoll(spellAttackModifier(data, spellEntry, stats, pb)),
        damageRoll,
        source: "ddb_spell",
        ddbEntityId: spellEntry.id,
    };
}

function collectSpellEntries(data) {
    const spells = [];
    for (const list of Object.values(data.spells || {})) {
        if (Array.isArray(list)) {
            spells.push(...list);
        }
    }
    for (const cs of data.classSpells || []) {
        if (Array.isArray(cs.spells)) {
            spells.push(...cs.spells);
        }
    }
    return spells;
}

function pushExtracted(extractFn, label, attacks, skipped) {
    try {
        const spec = extractFn();
        if (spec) {
            attacks.push(spec);
        }
    } catch {
        skipped.push(label);
    }
}

function extractCharacterImport(data) {
    const stats = readBaseStats(data);
    const pb = readProficiencyBonus(data);
    const totalLevel = readTotalLevel(data);
    const states = buildSheetStates(data, stats, pb);
    const ac = resolveArmorClass(data, stats);
    if (ac !== undefined) {
        states.push({ name: "AC", itemA: String(ac) });
    }

    const attacks = [];
    const skipped = [];
    for (const item of data.inventory || []) {
        const label = (item.definition || {}).name || "weapon";
        pushExtracted(
            () => extractEquippedWeapon(data, item, stats, pb),
            label,
            attacks,
            skipped
        );
    }

    const seenSpells = new Set();
    for (const spell of collectSpellEntries(data)) {
        const defName = (spell.definition || {}).name;
        if (!defName || seenSpells.has(defName.toLowerCase())) {
            continue;
        }
        pushExtracted(
            () => {
                const spec = extractSpellAttack(data, spell, stats, pb, totalLevel);
                if (spec) {
                    seenSpells.add(defName.toLowerCase());
                }
                return spec;
            },
            defName,
            attacks,
            skipped
        );
    }

    return {
        characterName: data.name || "Unknown",
        states,
        attacks,
        skipped,
    };
}

function attackToRollEntry(spec, compareTargetAc) {
    const withAc = { ...spec };
    // compareTargetAc is optional enemy AC for `.ch compare` when CLI omits AC — not the character's own AC.
    if (compareTargetAc !== undefined && withAc.targetAc === undefined) {
        withAc.targetAc = compareTargetAc;
    }
    const name = String(spec.name || "").slice(0, 50);
    return { name, itemA: formatRollSpec(withAc).slice(0, 150) };
}

function buildCharacterCardPatch(data, characterId) {
    void characterId;
    const extracted = extractCharacterImport(data);
    const stats = readBaseStats(data);
    const pb = readProficiencyBonus(data);
    const attackSpellNames = new Set(
        extracted.attacks
            .filter(a => a.source === "ddb_spell")
            .map(a => a.name.toLowerCase())
    );
    const utilitySkip = new Set(attackSpellNames);
    const attackRolls = extracted.attacks.map(a => attackToRollEntry(a));
    const saveRolls = buildSavingThrowRolls(data, stats, pb);
    const skillRolls = buildSkillRolls(data, stats, pb);
    const initRolls = buildInitiativeRoll(data, stats);
    const healingRolls = buildHealingSpellRolls(data, stats, pb, utilitySkip);
    const spellNotes = buildPreparedSpellNotes(data, attackSpellNames, stats, pb);
    const profNote = buildProficiencyNote(data);
    const equipNote = buildInventoryNote(data);
    const featureNotes = buildFeatureNotes(data);
    const skippedNote = extracted.skipped.length > 0
        ? {
            name: "Import skipped",
            itemA: extracted.skipped.slice(0, 5).join(", "),
        }
        : undefined;
    const notes = buildTaggedNotes({
        spellNotes,
        featureNotes,
        profNote,
        equipNote,
        skippedNote,
    });
    const rolls = [
        ...attackRolls,
        buildUnarmedStrikeRoll(stats),
        ...healingRolls,
        ...saveRolls,
        ...skillRolls,
        ...initRolls,
    ];
    const skillLabels = new Set(skillRolls.map(r => r.name));
    const image = resolveCharacterImage(data);
    const patch = applyDdbSectionTags({
        image,
        rolls,
        states: extracted.states,
        notes,
        skipped: extracted.skipped,
        importSummary: {
            stateCount: extracted.states.length,
            rollCount: rolls.length,
            noteCount: notes.length,
            attackCount: attackRolls.length,
        },
    }, skillLabels);
    return patch;
}

module.exports = {
    abilityMod,
    iterateCharacterModifiers,
    resolveArmorClass,
    extractCharacterImport,
    buildCharacterCardPatch,
    attackToRollEntry,
};
