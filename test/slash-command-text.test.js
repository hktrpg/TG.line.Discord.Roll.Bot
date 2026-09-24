"use strict";

const {
    slashImportDdbText,
    slashImportUdonText,
    slashCompareText,
    slashExportUdonText,
} = require("../modules/character-card/slash-command-text.js");

describe("character-card slash-command-text", () => {
    test("slashImportDdbText", () => {
        expect(slashImportDdbText({ ddbId: "95607806", cardName: "Sad", replace: true }))
            .toBe(".char importddb replace 95607806 Sad");
        expect(slashImportDdbText({ ddbId: "1", cardName: "X", replace: false }))
            .toBe(".char importddb 1 X");
    });

    test("slashImportUdonText", () => {
        const xml = "<character></character>";
        expect(slashImportUdonText({ cardName: "CoC", xml, replace: false }))
            .toBe(`.char importudon name[CoC]~xml[${xml}]~`);
    });

    test("slashCompareText", () => {
        expect(slashCompareText({ rollA: "A", rollB: "B", ac: 18 }))
            .toBe(".ch compare A B 18");
        expect(slashCompareText({ rollA: "A", rollB: "B", ac: null }))
            .toBe(".ch compare A B");
    });

    test("slashExportUdonText", () => {
        expect(slashExportUdonText({ cardName: "CoC" }))
            .toBe(".char exportudon name[CoC]~");
    });
});
