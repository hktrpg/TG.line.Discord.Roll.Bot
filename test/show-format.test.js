"use strict";

const { formatBucketForShow } = require("../modules/character-card/show-format.js");
const { SECTION } = require("../modules/character-card/section-keys.js");

describe("show-format", () => {
    test("showAllMode groups entries under section headers", () => {
        const state = [
            { name: "HP", itemA: "10", section: SECTION.VITALS },
            { name: "AC", itemA: "15", section: SECTION.VITALS },
            { name: "Perception", itemA: "+5", section: SECTION.SKILLS },
        ];
        const out = formatBucketForShow(state, "showAllMode", "state", ["", "", "", ""]);
        expect(out).toContain(`【${SECTION.VITALS}】`);
        expect(out).toContain("HP");
        expect(out).toContain("Perception");
    });
});
