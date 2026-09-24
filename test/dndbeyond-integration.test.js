"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
    parseCharacterId,
    fetchCharacterData,
    clearCachesForTests,
    USER_COOLDOWN_MS,
} = require("../modules/dndbeyond/character-client.js");
const {
    extractCharacterImport,
    buildCharacterCardPatch,
} = require("../modules/dndbeyond/attack-extractor.js");
const { parseRollSpec, formatRollSpec } = require("../modules/dndbeyond/roll-spec-parser.js");
const { generateCompareAnyDice } = require("../modules/dndbeyond/anydice-codegen.js");
const { compareAttacks, simulateAttack } = require("../modules/dndbeyond/dpr-simulator.js");
const { doubleDiceInDamageNotation } = require("../modules/dndbeyond/dice-utils.js");
const { resolveCompareTargetAc } = require("../modules/dndbeyond/character-commands.js");
const { SECTION } = require("../modules/character-card/section-keys.js");

const fixturePath = path.join(__dirname, "fixtures", "dndbeyond-character-v5.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const demoFixturePath = path.join(__dirname, "fixtures", "dndbeyond-character-95607806.json");
const demoFixture = JSON.parse(fs.readFileSync(demoFixturePath, "utf8"));

describe("dndbeyond character-client", () => {
    afterEach(() => {
        clearCachesForTests();
    });

    test("parseCharacterId accepts URL and digits", () => {
        expect(parseCharacterId("https://www.dndbeyond.com/characters/12345")).toBe("12345");
        expect(parseCharacterId("12345")).toBe("12345");
        expect(parseCharacterId("")).toBeNull();
    });

    test("fetchCharacterData uses cache and cooldown", async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ data: fixture }),
        });
        const first = await fetchCharacterData("900001", "user1", { fetchImpl, skipCooldown: true });
        expect(first.ok).toBe(true);
        const second = await fetchCharacterData("900001", "user2", { fetchImpl, skipCooldown: true });
        expect(second.fromCache).toBe(true);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    test("fetchCharacterData maps 403 to not_public", async () => {
        const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 403 });
        const result = await fetchCharacterData("1", "u", { fetchImpl, skipCooldown: true });
        expect(result).toEqual({ ok: false, code: "not_public" });
    });

    test("checkUserCooldown blocks rapid requests", async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ data: fixture }),
        });
        await fetchCharacterData("900001", "cooluser", { fetchImpl });
        const blocked = await fetchCharacterData("900002", "cooluser", { fetchImpl });
        expect(blocked.ok).toBe(false);
        expect(blocked.code).toBe("rate_limit");
        expect(blocked.retryMs).toBeLessThanOrEqual(USER_COOLDOWN_MS);
    });
});

describe("dndbeyond attack-extractor", () => {
    test("extractCharacterImport reads weapons and spell attack", () => {
        const result = extractCharacterImport(fixture);
        expect(result.characterName).toBe("Fixture Fighter");
        expect(result.states.some(s => s.name === "STR")).toBe(true);
        const names = result.attacks.map(a => a.name);
        expect(names).toContain("Longsword");
        expect(names).toContain("Shortbow");
        expect(names).toContain("Fire Bolt");
        expect(names).not.toContain("Dagger");
    });

    test("buildCharacterCardPatch produces roll spec strings", () => {
        const patch = buildCharacterCardPatch(fixture, 900_001);
        expect(patch.rolls.length).toBeGreaterThanOrEqual(3);
        const longsword = patch.rolls.find(r => /longsword/i.test(r.name));
        expect(longsword.itemA).toMatch(/hit:1d20/);
        expect(longsword.itemA).toMatch(/dmg:1d8/);
        expect(longsword.section).toBe(SECTION.COMBAT);
        expect(patch.rolls.every(r => !/^ddb:/i.test(r.name))).toBe(true);
        expect(patch.notes.every(n => !/^ddb:/i.test(n.name))).toBe(true);
    });

    test("extractCharacterImport aligns with public demo druid (95607806)", () => {
        const patch = buildCharacterCardPatch(demoFixture, "95607806");
        expect(patch.importSummary.stateCount).toBeGreaterThanOrEqual(15);
        expect(patch.importSummary.attackCount).toBe(2);
        expect(patch.importSummary.rollCount).toBeGreaterThanOrEqual(25);
        expect(patch.states.find(s => s.name === "DEX")?.itemA).toBe("15");
        expect(patch.states.find(s => s.name === "WIS")?.itemA).toBe("18");
        expect(patch.states.find(s => s.name === "HP")?.itemA).toBe("38/38");
        expect(patch.states.find(s => s.name === "AC")?.itemA).toBe("15");
        expect(patch.states.find(s => s.name === "Spell DC")?.itemA).toBe("15");
        expect(patch.states.some(s => s.name === "Darkvision")).toBe(true);
        expect(patch.rolls.some(r => r.name === "Unarmed Strike")).toBe(true);
        expect(patch.notes.some(n => n.name === "Equipment")).toBe(true);
        expect(patch.states.find(s => s.name === "Passive Perception")?.itemA).toBe("17");
        expect(patch.rolls.some(r => /scimitar/i.test(r.name))).toBe(true);
        expect(patch.rolls.some(r => /Save WIS/i.test(r.name))).toBe(true);
        expect(patch.rolls.some(r => /Perception/i.test(r.name))).toBe(true);
        expect(patch.notes.some(n => n.name === "Guidance" || n.name === "Proficiencies")).toBe(true);

        const perceptionRoll = patch.rolls.find(r => r.name === "Perception");
        expect(perceptionRoll?.section).toBe(SECTION.SKILLS);
        expect(patch.rolls.find(r => r.name === "Unarmed Strike")?.section).toBe(SECTION.COMBAT);
        expect(patch.rolls.find(r => r.name === "Save WIS")?.section).toBe(SECTION.SAVES);
        expect(patch.states.find(s => s.name === "Passive Perception")?.section).toBe(SECTION.PASSIVES);
    });
});

describe("dndbeyond card-patch", () => {
    test("applyImportPatch replaceMode replaces entire card data", () => {
        const { applyImportPatch } = require("../modules/dndbeyond/card-patch.js");
        const card = {
            state: [{ name: "Custom", itemA: "99" }],
            roll: [{ name: "Manual", itemA: "1d6" }],
            notes: [{ name: "Keep", itemA: "text" }],
            image: "https://example.com/old.png",
        };
        const patch = {
            states: [{ name: "STR", itemA: "10" }],
            rolls: [{ name: "Scimitar", itemA: "hit:1d20+4; dmg:1d6+1" }],
            notes: [{ name: "Guidance", itemA: "1" }],
            image: "https://example.com/new.png",
        };
        const replaced = applyImportPatch(card, patch, true);
        expect(replaced.state).toEqual([{ name: "STR", itemA: "10" }]);
        expect(replaced.roll).toEqual([{ name: "Scimitar", itemA: "hit:1d20+4; dmg:1d6+1" }]);
        expect(replaced.notes).toEqual([{ name: "Guidance", itemA: "1" }]);
        expect(replaced.image).toBe("https://example.com/new.png");

        const merged = applyImportPatch(card, patch, false);
        expect(merged.state.some(s => s.name === "Custom")).toBe(true);
        expect(merged.state.some(s => s.name === "STR")).toBe(true);
        expect(merged.roll.some(r => r.name === "Manual")).toBe(true);
        expect(merged.image).toBe("https://example.com/new.png");
    });
});

describe("dndbeyond roll-spec and anydice", () => {
    test("parseRollSpec roundtrip", () => {
        const spec = {
            name: "Test",
            hitRoll: "1d20+5",
            damageRoll: "2d6+3",
            advantage: true,
            targetAc: 15,
        };
        const itemA = formatRollSpec(spec);
        const parsed = parseRollSpec(itemA);
        expect(parsed.hitRoll).toBe("1d20+5");
        expect(parsed.advantage).toBe(true);
        expect(parsed.targetAc).toBe(15);
    });

    test("generateCompareAnyDice includes AC checks", () => {
        const a = parseRollSpec("hit:1d20+5; dmg:1d8+3; ac:15");
        const b = parseRollSpec("hit:1d20+3; dmg:1d6+2; ac:15");
        a.name = "A";
        b.name = "B";
        const code = generateCompareAnyDice([a, b], 15);
        expect(code).toContain(">= 15");
        expect(code).toContain("1d8 + 3");
    });
});

describe("dndbeyond dpr-simulator", () => {
    test("doubleDiceInDamageNotation doubles dice only", () => {
        expect(doubleDiceInDamageNotation("1d8+3")).toBe("2d8+3");
        expect(doubleDiceInDamageNotation("2d6+1d4+5")).toBe("4d6+2d4+5");
    });

    test("resolveCompareTargetAc prefers roll spec ac when CLI omits AC", () => {
        const specA = parseRollSpec("hit:1d20+5; dmg:1d8+3; ac:18");
        const specB = parseRollSpec("hit:1d20+3; dmg:1d6+2");
        expect(resolveCompareTargetAc(specA, specB, 15, false)).toBe(18);
        expect(resolveCompareTargetAc(specA, specB, 20, true)).toBe(20);
    });

    test("resolveCompareTargetAc uses CLI default when imports omit ac on rolls", () => {
        const specA = parseRollSpec("hit:1d20+4; dmg:1d6+1");
        const specB = parseRollSpec("hit:1d20+5; dmg:2d6");
        expect(resolveCompareTargetAc(specA, specB, 15, false)).toBe(15);
    });

    test("simulateAttack is stable with seed", () => {
        const spec = parseRollSpec("hit:1d20+5; dmg:1d8+3");
        const r1 = simulateAttack(spec, 15, 10_000, 99);
        const r2 = simulateAttack(spec, 15, 10_000, 99);
        expect(r1.avgDamage).toBe(r2.avgDamage);
        expect(r1.hitRate).toBeGreaterThan(0.3);
        expect(r1.hitRate).toBeLessThan(0.9);
    });

    test("simulateAttack crit damage doubles dice only (not flat modifier)", () => {
        const alwaysHit = parseRollSpec("hit:1d20+20; dmg:1d8+3");
        const result = simulateAttack(alwaysHit, 5, 50_000, 1234);
        expect(result.critRate).toBeGreaterThan(0.04);
        expect(result.avgDamageOnHit).toBeLessThan(12);
        expect(result.avgDamageOnHit).toBeGreaterThan(7);
    });

    test("compareAttacks picks higher modifier", () => {
        const strong = parseRollSpec("hit:1d20+10; dmg:1d8+5");
        const weak = parseRollSpec("hit:1d20+2; dmg:1d8+1");
        const { deltaAvgDamage } = compareAttacks(strong, weak, 15, 20_000, 7);
        expect(deltaAvgDamage).toBeGreaterThan(0);
    });
});
