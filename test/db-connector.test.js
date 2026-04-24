"use strict";

describe("db-connector", () => {
    const originalEnv = process.env;

    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env = originalEnv;
    });

    test("exports fallback API when mongoURL is missing", async () => {
        process.env = { ...originalEnv };
        delete process.env.mongoURL;

        const connector = require("../modules/db-connector.js");
        expect(connector.checkHealth().isConnected).toBe(false);
        await expect(connector.connect()).rejects.toThrow("MongoDB URL is not configured");
    });

    test("supports transaction success and rollback", async () => {
        process.env = { ...originalEnv, mongoURL: "mongodb://example/test" };

        const close = jest.fn().mockResolvedValue(undefined);
        const session = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            abortTransaction: jest.fn().mockResolvedValue(undefined),
            endSession: jest.fn()
        };

        const mockConnection = {
            readyState: 1,
            error: null,
            close,
            once: jest.fn(),
            on: jest.fn(function () { return this; }),
            removeAllListeners: jest.fn(),
            getClient: jest.fn(() => ({ topology: { on: jest.fn() } }))
        };

        jest.doMock("mongoose", () => ({
            set: jest.fn(),
            connect: jest.fn().mockResolvedValue(true),
            startSession: jest.fn().mockResolvedValue(session),
            connection: mockConnection
        }));
        jest.doMock("recachegoose", () => jest.fn());

        const connector = require("../modules/db-connector.js");

        const ok = await connector.withTransaction(async () => "ok");
        expect(ok).toBe("ok");
        expect(session.commitTransaction).toHaveBeenCalled();

        await expect(connector.withTransaction(async () => {
            throw new Error("boom");
        })).rejects.toThrow("boom");
        expect(session.abortTransaction).toHaveBeenCalled();
    });

    test("shutdown gate blocks restart and checkHealth remains accessible", async () => {
        process.env = { ...originalEnv, mongoURL: "mongodb://example/test" };

        const mockConnection = {
            readyState: 1,
            error: null,
            close: jest.fn().mockResolvedValue(undefined),
            once: jest.fn(),
            on: jest.fn(function () { return this; }),
            removeAllListeners: jest.fn(),
            getClient: jest.fn(() => ({ topology: { on: jest.fn() } }))
        };

        jest.doMock("mongoose", () => ({
            set: jest.fn(),
            connect: jest.fn().mockResolvedValue(true),
            startSession: jest.fn(),
            connection: mockConnection
        }));
        jest.doMock("recachegoose", () => jest.fn());

        const connector = require("../modules/db-connector.js");
        connector.notifyShuttingDown();
        const restarted = await connector.restart();
        expect(restarted).toBe(false);
        expect(connector.checkHealth()).toHaveProperty("isShuttingDown", true);
    });
});
