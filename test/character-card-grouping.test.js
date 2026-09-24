"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { groupEntriesBySection, SECTION } = require("../modules/character-card/grouping.js");
const { normalizeSectionKey } = require("../modules/character-card/section-keys.js");
const { buildTaggedNotes } = require("../modules/dndbeyond/ddb-section-tags.js");
const { buildCharacterCardPatch } = require("../modules/dndbeyond/attack-extractor.js");

describe("character-card grouping", () => {
    test("normalizeSectionKey maps common Udonarium section titles", () => {
        expect(normalizeSectionKey("Attributes")).toBe(SECTION.ABILITIES);
        expect(normalizeSectionKey("Notes")).toBe(SECTION.GENERAL);
    });

    test("groupEntriesBySection orders known keys and defaults missing section", () => {
        const entries = [
            { name: "Perception", itemA: "1d20", section: "Skills", order: 1 },
            { name: "HP", itemA: "10/10", section: "Vitals" },
            { name: "Orphan", itemA: "x" },
        ];
        const groups = groupEntriesBySection(entries);
        expect(groups[0].key).toBe(SECTION.VITALS);
        expect(groups.some(g => g.key === SECTION.SKILLS)).toBe(true);
        const general = groups.find(g => g.key === SECTION.GENERAL);
        expect(general?.items.some(i => i.entry.name === "Orphan")).toBe(true);
    });
});

describe("ddb section tags", () => {
    test("buildTaggedNotes assigns spell and feature sections", () => {
        const notes = buildTaggedNotes({
            spellNotes: [{ name: "Shield", itemA: "desc" }],
            featureNotes: [{ name: "Second Wind", itemA: "desc" }],
            equipNote: { name: "Equipment", itemA: "sword" },
        });
        expect(notes.find(n => n.name === "Shield")?.section).toBe(SECTION.SPELLS);
        expect(notes.find(n => n.name === "Second Wind")?.section).toBe(SECTION.FEATURES);
        expect(notes.find(n => n.name === "Equipment")?.section).toBe(SECTION.EQUIPMENT);
    });

    test("buildCharacterCardPatch tags Perception skill roll", () => {
        const fixturePath = path.join(__dirname, "fixtures", "dndbeyond-character-v5.json");
        const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
        const patch = buildCharacterCardPatch(fixture, "1");
        const perception = patch.rolls.find(r => r.name === "Perception");
        expect(perception).toBeDefined();
        expect(perception.section).toBe(SECTION.SKILLS);
        const strState = patch.states.find(s => s.name === "STR");
        expect(strState?.section).toBe(SECTION.ABILITIES);
    });
});
