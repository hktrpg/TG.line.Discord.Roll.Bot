"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
    buildCharacterCardPatchFromUdonarium,
} = require("../modules/udonarium/character-bridge.js");
const { buildUdonariumCharacterXml } = require("../modules/udonarium/udonarium-export.js");

const fixturePath = path.join(__dirname, "fixtures", "udonarium-character-minimal.xml");
const fixtureXml = fs.readFileSync(fixturePath, "utf8");

describe("udonarium export", () => {
    test("buildUdonariumCharacterXml emits character root and chat-palette", () => {
        const patch = buildCharacterCardPatchFromUdonarium(fixtureXml);
        const xml = buildUdonariumCharacterXml({
            name: "Sample Investigator",
            state: patch.states,
            roll: patch.rolls,
            notes: patch.notes,
        });
        expect(xml).toContain("<character name=\"Sample Investigator\">");
        expect(xml).toContain("numberResource");
        expect(xml).toContain("<chat-palette");
        expect(xml).toContain("DEX");
    });

    test("import → export → import preserves core HP and roll names", () => {
        const first = buildCharacterCardPatchFromUdonarium(fixtureXml);
        const xml = buildUdonariumCharacterXml({
            name: "RoundTrip",
            state: first.states,
            roll: first.rolls,
            notes: first.notes,
        });
        const second = buildCharacterCardPatchFromUdonarium(xml);
        const hp1 = first.states.find(s => s.name === "HP");
        const hp2 = second.states.find(s => s.name === "HP");
        expect(hp2?.itemA).toBe(hp1?.itemA);
        expect(hp2?.itemB).toBe(hp1?.itemB);
        expect(second.rolls.some(r => r.name === "DEX")).toBe(true);
    });
});
