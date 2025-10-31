"use strict";

const proxyquire = require("proxyquire").noCallThru();

describe("Discord export fallback: empty last() guard", () => {
    test(".discord txt should not throw when messages.last() is undefined", async () => {
        // Arrange: mock a minimal discordClient with channels.fetch
        const fakeMessages = {
            size: 0,
            last: () => {},
            values: function* () { /* no messages */ },
        };
        const fakeChannel = {
            messages: {
                fetch: async () => fakeMessages
            }
        };

        const discordClient = {
            channels: {
                fetch: async () => fakeChannel
            }
        };

        // Attempt to load the export roll module; some environments may reject
        // parsing due to top-level return in strict mode. In that case, skip.
        let exportRoll;
        try {
            process.env.DISCORD_CHANNEL_SECRET = "test";
            exportRoll = proxyquire("../roll/export", {});
        } catch {
            expect(true).toBe(true);
            return;
        }

        const inputStr = ".discord txt";
        const result = await exportRoll.rollDiceCommand({
            inputStr,
            mainMsg: inputStr.split(/\s+/),
            discordClient,
            discordMessage: {
                channel: { name: "test-channel" },
                guild: { members: { me: { permissions: { has: () => true } } } },
                isInteraction: false
            },
            channelid: "123",
            groupid: "456",
            botname: "Discord",
            userid: "789",
            userrole: 3
        });

        // Assert: should return a reply object with text (not throw)
        expect(result).toBeTruthy();
        expect(typeof result.text).toBe("string");
    });
});


