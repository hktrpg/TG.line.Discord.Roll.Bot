"use strict";

describe("records security and connection safeguards", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    function setupMocks({ readyState = 1, isConnected = true } = {}) {
        const chatRoomMock = jest.fn().mockImplementation((payload) => ({
            ...payload,
            save: jest.fn().mockResolvedValue(true)
        }));
        chatRoomMock.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });
        chatRoomMock.countDocuments = jest.fn().mockResolvedValue(0);
        chatRoomMock.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

        const genericCollection = {
            findOneAndUpdate: jest.fn().mockResolvedValue({ ok: 1 }),
            find: jest.fn().mockResolvedValue([])
        };

        jest.doMock("../modules/schema.js", () => ({
            chatRoom: chatRoomMock,
            groupSetting: genericCollection,
            forwardedMessage: {
                findOne: jest.fn(),
                find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
                create: jest.fn(),
                findOneAndDelete: jest.fn(),
                countDocuments: jest.fn(),
                collection: { dropIndexes: jest.fn(), createIndex: jest.fn() }
            }
        }));

        jest.doMock("../modules/db-connector.js", () => ({
            mongoose: { connection: { readyState } },
            connect: jest.fn().mockResolvedValue(),
            checkHealth: jest.fn().mockReturnValue({ isConnected })
        }));
    }

    test("get returns empty array for unknown collection", async () => {
        setupMocks({ readyState: 1, isConnected: true });
        const records = require("../modules/records.js");
        const result = await records.get("unknownCollection");
        expect(result).toEqual([]);
    });

    test("chatRoomPush rejects suspicious script payloads", async () => {
        setupMocks();
        const records = require("../modules/records.js");

        await expect(records.chatRoomPush({
            name: "tester",
            msg: "<script>alert(1)</script>",
            roomNumber: "room-1"
        })).rejects.toThrow("Invalid chat message");
    });
});
