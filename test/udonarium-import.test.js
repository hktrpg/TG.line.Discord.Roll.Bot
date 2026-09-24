"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
    buildCharacterCardPatchFromUdonarium,
    splitPaletteLine,
} = require("../modules/udonarium/character-bridge.js");
const { runUdonariumCharacterCardImport } = require("../modules/udonarium/www-import.js");
const { parseImportUdonInput, parseExportUdonInput } = require("../modules/udonarium/character-commands.js");

const fixturePath = path.join(__dirname, "fixtures", "udonarium-character-minimal.xml");
const fixtureXml = fs.readFileSync(fixturePath, "utf8");

describe("udonarium character-bridge", () => {
    test("splitPaletteLine separates command and label", () => {
        const entry = splitPaletteLine("1d100<=65 DEX");
        expect(entry.name).toBe("DEX");
        expect(entry.itemA).toBe("1d100<=65");
    });

    test("buildCharacterCardPatchFromUdonarium maps resources and palette", () => {
        const patch = buildCharacterCardPatchFromUdonarium(fixtureXml);
        const hp = patch.states.find(s => s.name === "HP");
        expect(hp?.itemA).toBe("8");
        expect(hp?.itemB).toBe("10");
        expect(hp?.section).toBe("Abilities");
        const bg = patch.notes.find(n => n.name === "Background");
        expect(bg?.itemA).toContain("librarian");
        expect(patch.rolls.some(r => r.name === "DEX")).toBe(true);
    });
});

describe("udonarium character-commands", () => {
    test("parseImportUdonInput reads name and xml blocks", () => {
        const input = ".char importudon replace name[CoC]~xml[<character name=\"x\"><data name=\"HP\" type=\"simpleNumber\">10</data></character>]~";
        const parsed = parseImportUdonInput(input);
        expect(parsed.replaceMode).toBe(true);
        expect(parsed.cardName).toBe("CoC");
        expect(parsed.xmlContent).toContain("<character");
    });

    test("parseExportUdonInput reads name block or token", () => {
        expect(parseExportUdonInput(".char exportudon name[Sad]~")).toBe("Sad");
        expect(parseExportUdonInput(".char exportudon Sad")).toBe("Sad");
    });
});

describe("udonarium www-import", () => {
    test("runUdonariumCharacterCardImport rejects empty xml", async () => {
        const result = await runUdonariumCharacterCardImport({
            platformUserId: "u",
            cardId: "c",
            fileContent: "<root></root>",
        });
        expect(result.ok).toBe(false);
        expect(result.code).toBe("invalid_udonarium_xml");
    });
});
