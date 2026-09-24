"use strict";

const { abilityMod, d20AttackRoll } = require("./dice-utils.js");

const STAT_NAMES = { 1: "STR", 2: "DEX", 3: "CON", 4: "INT", 5: "WIS", 6: "CHA" };

const SAVE_SUBTYPE_BY_STAT_ID = {
    1: "strength-saving-throws",
    2: "dexterity-saving-throws",
    3: "constitution-saving-throws",
    4: "intelligence-saving-throws",
    5: "wisdom-saving-throws",
    6: "charisma-saving-throws",
};

/** State row names overwritten on DDB import (replace mode). */
const DDB_SYNCED_STATE_NAMES = new Set([
    "Name",
    "Race",
    "Class",
    "HP",
    "Speed",
    "Initiative",
    "Passive Perception",
    "Passive Investigation",
    "Passive Insight",
    "STR",
    "DEX",
    "CON",
    "INT",
    "WIS",
    "CHA",
    "PB",
    "AC",
    "Spell DC",
    "Spell Slots",
    "Darkvision",
]);

const ABILITY_SCORE_SUBTYPES = {
    "strength-score": 1,
    "dexterity-score": 2,
    "constitution-score": 3,
    "intelligence-score": 4,
    "wisdom-score": 5,
    "charisma-score": 6,
};

const SKILL_DEFINITIONS = [
    { sub: "acrobatics", statId: 2, label: "Acrobatics" },
    { sub: "animal-handling", statId: 5, label: "Animal Handling" },
    { sub: "arcana", statId: 4, label: "Arcana" },
    { sub: "athletics", statId: 1, label: "Athletics" },
    { sub: "deception", statId: 6, label: "Deception" },
    { sub: "history", statId: 4, label: "History" },
    { sub: "insight", statId: 5, label: "Insight" },
    { sub: "intimidation", statId: 6, label: "Intimidation" },
    { sub: "investigation", statId: 4, label: "Investigation" },
    { sub: "medicine", statId: 5, label: "Medicine" },
    { sub: "nature", statId: 4, label: "Nature" },
    { sub: "perception", statId: 5, label: "Perception" },
    { sub: "performance", statId: 6, label: "Performance" },
    { sub: "persuasion", statId: 6, label: "Persuasion" },
    { sub: "religion", statId: 4, label: "Religion" },
    { sub: "sleight-of-hand", statId: 2, label: "Sleight of Hand" },
    { sub: "stealth", statId: 2, label: "Stealth" },
    { sub: "survival", statId: 5, label: "Survival" },
];

function readTotalLevel(data) {
    return (data.classes || []).reduce((sum, c) => sum + (c.level || 0), 0);
}

function readProficiencyBonus(data) {
    if (typeof data.proficiencyBonus === "number") {
        return data.proficiencyBonus;
    }
    const totalLevel = readTotalLevel(data);
    return totalLevel > 0 ? Math.floor((totalLevel - 1) / 4) + 2 : 2;
}

function readBaseStats(data) {
    const stats = {};
    for (const s of data.stats || []) {
        if (s?.id && s.value !== undefined) {
            stats[s.id] = s.value;
        }
    }
    for (const o of data.overrideStats || []) {
        if (o?.id != null && o.value != null) {
            stats[o.id] = o.value;
        }
    }
    for (const b of data.bonusStats || []) {
        if (b?.id != null && b.value != null) {
            stats[b.id] = (stats[b.id] ?? 0) + b.value;
        }
    }
    for (const mod of iterateCharacterModifiers(data)) {
        const statId = ABILITY_SCORE_SUBTYPES[mod.subType];
        if (!statId) {
            continue;
        }
        const delta = mod.value ?? mod.fixedValue;
        if (delta == null || Number.isNaN(Number(delta))) {
            continue;
        }
        if (mod.type === "bonus" || mod.type === "increment") {
            stats[statId] = (stats[statId] ?? 10) + Number(delta);
        }
        if (mod.type === "set" && mod.subType?.endsWith("-score")) {
            stats[statId] = Number(delta);
        }
    }
    return stats;
}

/** @deprecated alias */
const readEffectiveStats = readBaseStats;

function computeMaxHitPoints(data, stats) {
    if (typeof data.overrideHitPoints === "number") {
        return data.overrideHitPoints;
    }
    const conMod = abilityMod(stats[3] ?? 10);
    let total = 0;
    for (const cls of data.classes || []) {
        const level = cls.level || 0;
        const hd = cls.definition?.hitDice || 8;
        if (level <= 0) {
            continue;
        }
        total += hd + conMod;
        const perLevel = Math.floor(hd / 2) + 1 + conMod;
        total += (level - 1) * perLevel;
    }
    const bonus = data.bonusHitPoints ?? 0;
    if (total > 0) {
        return total + bonus;
    }
    return (data.baseHitPoints ?? 0) + bonus;
}

function resolveWalkSpeed(data) {
    for (const mod of iterateCharacterModifiers(data)) {
        if (mod.subType === "innate-speed-walking" || mod.subType === "walking-speed") {
            const speed = mod.value ?? mod.fixedValue;
            if (speed != null) {
                return `${speed} ft.`.slice(0, 50);
            }
        }
    }
    const raceSpeed = data.race?.weightSpeed ?? data.race?.speed;
    if (raceSpeed) {
        return `${raceSpeed} ft.`.slice(0, 50);
    }
    return;
}

function isProficientIn(data, subType) {
    return iterateCharacterModifiers(data).some(
        mod => mod.type === "proficiency" && mod.subType === subType
    );
}

function skillModifier(data, stats, pb, skill) {
    let total = abilityMod(stats[skill.statId] ?? 10);
    if (isProficientIn(data, skill.sub)) {
        total += pb;
    }
    return total;
}

function passiveScore(data, stats, pb, skillSub, statId) {
    const skill = SKILL_DEFINITIONS.find(s => s.sub === skillSub);
    if (skill) {
        return 10 + skillModifier(data, stats, pb, skill);
    }
    return 10 + abilityMod(stats[statId] ?? 10);
}

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

function isSaveProficient(data, statId) {
    const subType = SAVE_SUBTYPE_BY_STAT_ID[statId];
    if (!subType) {
        return false;
    }
    return isProficientIn(data, subType);
}

function savingThrowModifier(data, stats, pb, statId) {
    const mod = abilityMod(stats[statId] ?? 10);
    const prof = isSaveProficient(data, statId) ? pb : 0;
    return mod + prof;
}

function resolveCharacterImage(data) {
    const url = data.decorations?.avatarUrl
        || data.decorations?.largeAvatarUrl
        || data.race?.avatarUrl;
    if (!url || typeof url !== "string") {
        return;
    }
    return url.slice(0, 500);
}

function formatClassLine(data) {
    const primary = (data.classes || [])[0];
    if (!primary) {
        return;
    }
    const def = primary.definition || {};
    const sub = primary.subclassDefinition?.name;
    const level = primary.level || readTotalLevel(data);
    let line = `${def.name || "Class"} ${level}`;
    if (sub) {
        line += ` · ${sub}`;
    }
    return line.slice(0, 50);
}

function formatRaceLine(data) {
    const race = data.race?.fullName || data.race?.baseName || data.race?.name;
    const bg = data.background?.definition?.name;
    if (race && bg) {
        return `${race} / ${bg}`.slice(0, 50);
    }
    if (race) {
        return String(race).slice(0, 50);
    }
    return bg ? String(bg).slice(0, 50) : undefined;
}

function resolveHitPoints(data, stats) {
    const max = computeMaxHitPoints(data, stats);
    const removed = data.removedHitPoints ?? 0;
    const temp = data.temporaryHitPoints ?? 0;
    const current = Math.max(0, max - removed);
    if (max <= 0) {
        return;
    }
    const itemA = temp > 0 ? `${current}+${temp}/${max}` : `${current}/${max}`;
    return itemA.slice(0, 50);
}

function buildCombatStates(data, stats, pb) {
    const speed = resolveWalkSpeed(data);
    const initMod = abilityMod(stats[2] ?? 10);
    return [
        ...(speed ? [{ name: "Speed", itemA: speed }] : []),
        {
            name: "Initiative",
            itemA: initMod >= 0 ? `+${initMod}` : String(initMod),
        },
        {
            name: "Passive Perception",
            itemA: String(passiveScore(data, stats, pb, "perception", 5)),
        },
        {
            name: "Passive Investigation",
            itemA: String(passiveScore(data, stats, pb, "investigation", 4)),
        },
        {
            name: "Passive Insight",
            itemA: String(passiveScore(data, stats, pb, "insight", 5)),
        },
    ];
}

function buildSheetStates(data, stats, pb) {
    const rows = [];
    const characterName = (data.name || "").toString().trim();
    if (characterName) {
        rows.push({ name: "Name", itemA: characterName.slice(0, 50) });
    }
    const raceLine = formatRaceLine(data);
    if (raceLine) {
        rows.push({ name: "Race", itemA: raceLine });
    }
    const classLine = formatClassLine(data);
    if (classLine) {
        rows.push({ name: "Class", itemA: classLine });
    }
    const hp = resolveHitPoints(data, stats);
    if (hp) {
        rows.push({ name: "HP", itemA: hp });
    }
    for (const [id, label] of Object.entries(STAT_NAMES)) {
        const val = stats[Number(id)];
        if (val !== undefined) {
            rows.push({ name: label, itemA: String(val), itemB: String(abilityMod(val)) });
        }
    }
    rows.push(
        { name: "PB", itemA: String(pb) },
        ...buildCombatStates(data, stats, pb),
        ...buildSpellcastingStates(data, stats, pb),
        ...(resolveDarkvision(data) ? [{ name: "Darkvision", itemA: resolveDarkvision(data) }] : [])
    );
    return rows;
}

function resolveSpellcastingAbilityId(data) {
    for (const cls of data.classes || []) {
        const fromClass = cls.definition?.spellCastingAbilityId;
        if (fromClass) {
            return fromClass;
        }
    }
    return 5;
}

function resolveSpellSaveDc(data, stats, pb) {
    const statId = resolveSpellcastingAbilityId(data);
    return 8 + pb + abilityMod(stats[statId] ?? 10);
}

function resolveSpellSlotLine(data) {
    const totalLevel = readTotalLevel(data);
    const cls = (data.classes || [])[0];
    const table = cls?.definition?.spellRules?.levelSpellSlots;
    if (!table || totalLevel < 1 || totalLevel >= table.length) {
        return;
    }
    const row = table[totalLevel];
    const usedByLevel = new Map(
        (data.spellSlots || []).map(slot => [slot.level, slot.used ?? 0])
    );
    const parts = [];
    for (let index = 0; index < row.length && index < 9; index++) {
        const max = row[index];
        if (max > 0) {
            const level = index + 1;
            const used = usedByLevel.get(level) ?? 0;
            const remaining = Math.max(0, max - used);
            parts.push(used > 0 ? `L${level}:${remaining}/${max}` : `L${level}:${max}`);
        }
    }
    if (parts.length === 0) {
        return;
    }
    return parts.join(" ").slice(0, 50);
}

function buildSpellcastingStates(data, stats, pb) {
    const rows = [];
    const hasCaster = (data.classes || []).some(
        cls => cls.definition?.spellRules || cls.definition?.canCastSpells
    );
    if (!hasCaster && (data.classSpells || []).length === 0) {
        return rows;
    }
    const dc = resolveSpellSaveDc(data, stats, pb);
    rows.push({ name: "Spell DC", itemA: String(dc) });
    const slots = resolveSpellSlotLine(data);
    if (slots) {
        rows.push({ name: "Spell Slots", itemA: slots });
    }
    return rows;
}

function resolveDarkvision(data) {
    for (const mod of iterateCharacterModifiers(data)) {
        if (mod.subType === "darkvision" || mod.subType === "set-base-darkvision") {
            const feet = mod.value ?? mod.fixedValue;
            if (feet != null) {
                return `${feet} ft.`.slice(0, 50);
            }
        }
    }
    return;
}

function buildUnarmedStrikeRoll(stats) {
    const strMod = abilityMod(stats[1] ?? 10);
    const damage = Math.max(0, 1 + strMod);
    return {
        name: "Unarmed Strike",
        itemA: `hit:${d20AttackRoll(strMod)}; dmg:${damage}`.slice(0, 150),
    };
}

function collectAllSpellEntries(data) {
    const entries = [];
    for (const list of Object.values(data.spells || {})) {
        if (Array.isArray(list)) {
            entries.push(...list);
        }
    }
    for (const cs of data.classSpells || []) {
        if (Array.isArray(cs.spells)) {
            entries.push(...cs.spells);
        }
    }
    return entries;
}

function buildHealingSpellRolls(data, stats, pb, skipNames) {
    const rolls = [];
    const abilityModOnly = abilityMod(stats[resolveSpellcastingAbilityId(data)] ?? 10);
    for (const spell of collectAllSpellEntries(data)) {
        const def = spell.definition || {};
        const name = def.name;
        if (!name || skipNames.has(name.toLowerCase())) {
            continue;
        }
        const isHealingWord = name.toLowerCase() === "healing word";
        const hasHealing = Boolean(def.healing || (def.healingDice && def.healingDice.length > 0));
        if (!isHealingWord && !hasHealing) {
            continue;
        }
        const dice = def.healingDice?.[0]?.diceString
            || def.healing?.diceString
            || (isHealingWord ? "1d4" : "1d8");
        const notation = appendHealingNotation(String(dice).replaceAll(/\s+/g, ""), abilityModOnly);
        rolls.push({ name: name.slice(0, 50), itemA: notation.slice(0, 150) });
        skipNames.add(name.toLowerCase());
    }
    return rolls;
}

function appendHealingNotation(dice, modifier) {
    const cleaned = String(dice).replaceAll(/\s+/g, "");
    if (modifier === 0) {
        return cleaned;
    }
    const sign = modifier > 0 ? `+${modifier}` : String(modifier);
    return `${cleaned}${sign}`;
}

function buildInventoryNote(data) {
    const equipped = [];
    const carried = [];
    for (const item of data.inventory || []) {
        const name = item.definition?.name || item.name;
        if (!name) {
            continue;
        }
        const qty = item.quantity > 1 ? `${name} x${item.quantity}` : name;
        if (item.equipped) {
            equipped.push(qty);
        } else {
            carried.push(qty);
        }
    }
    if (equipped.length === 0 && carried.length === 0) {
        return;
    }
    const parts = [];
    if (equipped.length > 0) {
        parts.push(`Equipped: ${equipped.slice(0, 8).join(", ")}`);
    }
    if (carried.length > 0) {
        parts.push(`Carried: ${carried.slice(0, 12).join(", ")}`);
    }
    return {
        name: "Equipment",
        itemA: parts.join(" | ").slice(0, 1500),
    };
}

function buildSkillRolls(data, stats, pb) {
    const rolls = [];
    for (const skill of SKILL_DEFINITIONS) {
        const total = skillModifier(data, stats, pb, skill);
        rolls.push({
            name: skill.label.slice(0, 50),
            itemA: d20AttackRoll(total).slice(0, 150),
        });
    }
    return rolls;
}

function buildInitiativeRoll(data, stats) {
    const mod = abilityMod(stats[2] ?? 10);
    return [{
        name: "Initiative",
        itemA: d20AttackRoll(mod).slice(0, 150),
    }];
}

function stripHtml(text) {
    return (text || "").replaceAll(/<[^>]*>/g, " ").replaceAll(/\s+/g, " ").trim();
}

function buildProficiencyNote(data) {
    const mods = iterateCharacterModifiers(data);
    const langs = mods
        .filter(m => m.type === "language" && m.subType)
        .map(m => m.friendlySubtypeName || m.subType);
    const armor = mods
        .filter(m => m.type === "proficiency" && /armor|shield/i.test(m.subType || ""))
        .map(m => m.friendlySubtypeName || m.subType);
    const parts = [];
    if (armor.length > 0) {
        parts.push(`Armor: ${[...new Set(armor)].slice(0, 8).join(", ")}`);
    }
    if (langs.length > 0) {
        parts.push(`Languages: ${[...new Set(langs)].join(", ")}`);
    }
    if (parts.length === 0) {
        return;
    }
    return {
        name: "Proficiencies",
        itemA: parts.join(" | ").slice(0, 1500),
    };
}

function buildFeatureNotes(data) {
    const notes = [];
    for (const list of Object.values(data.actions || {})) {
        if (!Array.isArray(list)) {
            continue;
        }
        for (const action of list) {
            if (!action?.name) {
                continue;
            }
            const snippet = stripHtml(action.snippet || action.description || "");
            if (!snippet) {
                continue;
            }
            notes.push({
                name: String(action.name).slice(0, 50),
                itemA: snippet.slice(0, 1500),
            });
        }
    }
    return notes.slice(0, 20);
}

function buildSavingThrowRolls(data, stats, pb) {
    const rolls = [];
    for (const [id, label] of Object.entries(STAT_NAMES)) {
        const statId = Number(id);
        const total = savingThrowModifier(data, stats, pb, statId);
        rolls.push({
            name: `Save ${label}`.slice(0, 50),
            itemA: d20AttackRoll(total).slice(0, 150),
        });
    }
    return rolls;
}

function collectPreparedSpellNames(data) {
    const seen = new Set();
    const names = [];
    const addSpell = spell => {
        const name = (spell.definition || {}).name;
        if (!name) {
            return;
        }
        const key = name.toLowerCase();
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        names.push(name);
    };
    for (const list of Object.values(data.spells || {})) {
        if (Array.isArray(list)) {
            for (const spell of list) {
                addSpell(spell);
            }
        }
    }
    for (const cs of data.classSpells || []) {
        for (const spell of cs.spells || []) {
            addSpell(spell);
        }
    }
    return names;
}

function formatSpellNoteItem(spellName, data, stats, pb) {
    for (const cs of data.classSpells || []) {
        for (const spell of cs.spells || []) {
            const def = spell.definition || {};
            if (def.name !== spellName) {
                continue;
            }
            const level = def.level;
            const levelLabel = level === 0 ? "Cantrip" : `${level}${level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th"}`;
            const school = def.school ? String(def.school) : "";
            const bits = [levelLabel, school].filter(Boolean);
            if (def.requiresSavingThrow && stats && pb != null) {
                const dc = resolveSpellSaveDc(data, stats, pb);
                const saveStat = STAT_NAMES[def.saveDcAbilityId] || "Save";
                bits.push(`${saveStat} DC ${dc}`);
            }
            if (def.concentration) {
                bits.push("Conc.");
            }
            if (def.ritual) {
                bits.push("Ritual");
            }
            return bits.join(" · ").slice(0, 150) || spellName.slice(0, 150);
        }
    }
    return spellName.slice(0, 150);
}

/**
 * @param {string[]} attackSpellNames lowercased
 */
function buildPreparedSpellNotes(data, attackSpellNames, stats, pb) {
    const notes = [];
    for (const name of collectPreparedSpellNames(data)) {
        if (attackSpellNames.has(name.toLowerCase())) {
            continue;
        }
        notes.push({
            name: name.slice(0, 50),
            itemA: formatSpellNoteItem(name, data, stats, pb),
        });
    }
    return notes;
}

module.exports = {
    DDB_SYNCED_STATE_NAMES,
    readBaseStats,
    readEffectiveStats,
    readProficiencyBonus,
    readTotalLevel,
    resolveCharacterImage,
    buildSheetStates,
    buildSavingThrowRolls,
    buildSkillRolls,
    buildInitiativeRoll,
    buildPreparedSpellNotes,
    buildProficiencyNote,
    buildFeatureNotes,
    buildUnarmedStrikeRoll,
    buildHealingSpellRolls,
    buildInventoryNote,
    computeMaxHitPoints,
};
