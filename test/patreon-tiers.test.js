"use strict";

const tiers = require("../modules/patreon-tiers.js");

describe("patreon-tiers", () => {
    test("getMaxSlotsForLevel falls back to level 0 for invalid values", () => {
        expect(tiers.getMaxSlotsForLevel(null)).toBe(0);
        expect(tiers.getMaxSlotsForLevel(-1)).toBe(0);
        expect(tiers.getMaxSlotsForLevel(999)).toBe(0);
    });

    test("tierLetterToLevel supports case-insensitive letters and unknown values", () => {
        expect(tiers.tierLetterToLevel("a")).toBe(1);
        expect(tiers.tierLetterToLevel("B")).toBe(2);
        expect(tiers.tierLetterToLevel("z")).toBeNull();
    });

    test("csvTierNameToLevel resolves known labels and rejects unknown labels", () => {
        expect(tiers.csvTierNameToLevel("調查員")).toBe(1);
        expect(tiers.csvTierNameToLevel("神秘學家")).toBe(2);
        expect(tiers.csvTierNameToLevel("教主")).toBe(3);
        expect(tiers.csvTierNameToLevel("悠久者(名譽會員) - Honorary Member(Lifetime)")).toBe(7);
        expect(tiers.csvTierNameToLevel("無名調查員")).toBeNull();
        expect(tiers.csvTierNameToLevel("")).toBeNull();
    });

    test("addVipGraceEndDate adds configured grace days", () => {
        const from = new Date("2026-01-01T00:00:00.000Z");
        const out = tiers.addVipGraceEndDate(from);
        const msPerDay = 24 * 60 * 60 * 1000;
        expect(Math.round((out.getTime() - from.getTime()) / msPerDay)).toBe(tiers.PATREON_VIP_GRACE_DAYS);
    });
});
