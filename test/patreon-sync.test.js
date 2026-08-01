"use strict";

const mockSchema = {
    veryImportantPerson: {
        updateMany: jest.fn(),
        updateOne: jest.fn(),
        find: jest.fn(() => ({ lean: jest.fn().mockResolvedValue([]) })),
        findOneAndUpdate: jest.fn()
    }
};

jest.mock("../modules/db/schema.js", () => mockSchema);

const sync = require("../modules/patreon/patreon-sync.js");

describe("patreon-sync", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSchema.veryImportantPerson.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });
    });

    test("notesForKey builds stable note prefix", () => {
        expect(sync.notesForKey("abc123")).toBe("patreon:abc123");
        expect(sync.notesForKey("")).toBe("patreon:");
    });

    test("syncSlotToVip upserts active user slot with platform", async () => {
        await sync.syncSlotToVip(
            { targetId: "u1", targetType: "user", platform: "Discord", name: "Tester", switch: true },
            2,
            "hash1",
            "Fallback",
            { switch: true }
        );

        expect(mockSchema.veryImportantPerson.findOneAndUpdate).toHaveBeenCalledWith(
            { id: "u1", notes: "patreon:hash1", platform: "discord" },
            expect.objectContaining({
                $set: expect.objectContaining({
                    id: "u1",
                    level: 2,
                    name: "Tester",
                    switch: true,
                    platform: "discord"
                }),
                $unset: { endDate: "" }
            }),
            { upsert: true }
        );
    });

    test("syncSlotToVip disables inactive channel slot", async () => {
        await sync.syncSlotToVip(
            { targetId: "c1", targetType: "channel", platform: "telegram", switch: false },
            1,
            "hash2",
            "Fallback"
        );

        expect(mockSchema.veryImportantPerson.updateMany).toHaveBeenCalledWith(
            { gpid: "c1", notes: "patreon:hash2", platform: "telegram" },
            { $set: { switch: false } }
        );
    });

    test("syncMemberSlotsToVip disables orphan VIP rows", async () => {
        mockSchema.veryImportantPerson.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { _id: "orphan1", id: "old-user", notes: "patreon:hashX", platform: "discord", switch: true }
            ])
        });

        await sync.syncMemberSlotsToVip({
            keyHash: "hashX",
            level: 2,
            patreonName: "Pat",
            slots: [
                { targetId: "u-new", targetType: "user", platform: "discord", switch: true }
            ]
        });

        expect(mockSchema.veryImportantPerson.findOneAndUpdate).toHaveBeenCalled();
        expect(mockSchema.veryImportantPerson.updateOne).toHaveBeenCalledWith(
            { _id: "orphan1" },
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
