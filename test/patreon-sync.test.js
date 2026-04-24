"use strict";

const mockSchema = {
    veryImportantPerson: {
        updateMany: jest.fn(),
        findOneAndUpdate: jest.fn()
    }
};

jest.mock("../modules/schema.js", () => mockSchema);

const sync = require("../modules/patreon-sync.js");

describe("patreon-sync", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("notesForKey builds stable note prefix", () => {
        expect(sync.notesForKey("abc123")).toBe("patreon:abc123");
        expect(sync.notesForKey("")).toBe("patreon:");
    });

    test("syncSlotToVip upserts active user slot", async () => {
        await sync.syncSlotToVip(
            { targetId: "u1", targetType: "user", name: "Tester", switch: true },
            2,
            "hash1",
            "Fallback",
            { switch: true }
        );

        expect(mockSchema.veryImportantPerson.findOneAndUpdate).toHaveBeenCalledWith(
            { id: "u1", notes: "patreon:hash1" },
            expect.objectContaining({
                $set: expect.objectContaining({
                    id: "u1",
                    level: 2,
                    name: "Tester",
                    switch: true
                }),
                $unset: { endDate: "" }
            }),
            { upsert: true }
        );
    });

    test("syncSlotToVip disables inactive channel slot", async () => {
        await sync.syncSlotToVip(
            { targetId: "c1", targetType: "channel", switch: false },
            1,
            "hash2",
            "Fallback"
        );

        expect(mockSchema.veryImportantPerson.updateMany).toHaveBeenCalledWith(
            { gpid: "c1", notes: "patreon:hash2" },
            { $set: { switch: false } }
        );
    });

    test("applyVipGraceAfterCancellation sets grace endDate", async () => {
        const grace = new Date("2030-01-01T00:00:00.000Z");
        await sync.applyVipGraceAfterCancellation({ keyHash: "hash3" }, grace);

        expect(mockSchema.veryImportantPerson.updateMany).toHaveBeenCalledWith(
            { notes: "patreon:hash3", switch: { $ne: false } },
            { $set: { endDate: grace } }
        );
    });

    test("clearVipEntriesByPatreonKey disables all linked VIP rows", async () => {
        await sync.clearVipEntriesByPatreonKey({ keyHash: "hash4" });

        expect(mockSchema.veryImportantPerson.updateMany).toHaveBeenCalledWith(
            { notes: "patreon:hash4" },
            { $set: { switch: false }, $unset: { endDate: "" } }
        );
    });
});
