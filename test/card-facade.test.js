"use strict";

const {
    synthesizeSectionsFromFlat,
    projectToLegacyArrays,
    prepareCardForMongoSave,
} = require("../modules/character-card/card-facade.js");
const { SECTION } = require("../modules/character-card/section-keys.js");

describe("card-facade", () => {
    test("synthesizeSectionsFromFlat groups by section within bucket", () => {
        const sections = synthesizeSectionsFromFlat({
            state: [
                { name: "HP", itemA: "8/10", section: SECTION.VITALS },
                { name: "Name", itemA: "Ada", section: SECTION.IDENTITY },
            ],
            roll: [
                { name: "Perception", itemA: "1d20+5", section: SECTION.SKILLS },
            ],
            notes: [],
        });
        expect(sections.some(s => s.bucket === "state" && s.title === SECTION.VITALS)).toBe(true);
        expect(sections.some(s => s.bucket === "roll" && s.title === SECTION.SKILLS)).toBe(true);
    });

    test("projectToLegacyArrays round-trips flat entries", () => {
        const flat = {
            state: [{ name: "HP", itemA: "10", section: SECTION.VITALS }],
            roll: [{ name: "Athletics", itemA: "cc 50", section: SECTION.SKILLS }],
            notes: [{ name: "Memo", itemA: "hello", section: SECTION.GENERAL }],
        };
        const prepared = prepareCardForMongoSave(flat, { forceV2: true });
        const projected = projectToLegacyArrays(prepared);
        expect(projected.state.map(s => s.name)).toContain("HP");
        expect(projected.roll.map(r => r.name)).toContain("Athletics");
        expect(projected.notes.map(n => n.name)).toContain("Memo");
    });

    test("prepareCardForMongoSave sets schemaVersion 2", () => {
        const out = prepareCardForMongoSave({ state: [], roll: [], notes: [] }, { forceV2: true });
        expect(out.schemaVersion).toBe(2);
        expect(Array.isArray(out.sections)).toBe(true);
    });
});
