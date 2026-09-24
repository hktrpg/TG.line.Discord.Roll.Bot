"use strict";

const { validateCardPayload, notesContentMaxLength } = require("../modules/www/validate-card-payload.js");

describe("validate-card-payload", () => {
    test("notesContentMaxLength uses 4000 for schemaVersion 2", () => {
        expect(notesContentMaxLength({ schemaVersion: 2 })).toBe(4000);
        expect(notesContentMaxLength({ schemaVersion: 1 })).toBe(1500);
    });

    test("validateCardPayload allows long notes on v2", () => {
        const longNote = "x".repeat(2000);
        const err = validateCardPayload({
            name: "Hero",
            state: [],
            roll: [],
            notes: [{ name: "Bio", itemA: longNote }],
            schemaVersion: 2,
        });
        expect(err).toBeNull();
    });

    test("validateCardPayload rejects long notes on v1", () => {
        const longNote = "x".repeat(2000);
        const err = validateCardPayload({
            name: "Hero",
            state: [],
            roll: [],
            notes: [{ name: "Bio", itemA: longNote }],
            schemaVersion: 1,
        });
        expect(err).toBeTruthy();
    });
});
