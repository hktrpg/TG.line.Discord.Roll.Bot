"use strict";

const crypto = require('node:crypto');

jest.mock('../modules/db/connector.js', () => ({}));
jest.mock('../modules/db/schema.js', () => ({
    accountPW: {},
    allowRolling: {},
    veryImportantPerson: {},
    theNewsMessage: {},
    discordRespawnSchedule: {},
    mongodbState: jest.fn(),
    mongodbStateCheck: jest.fn()
}));
jest.mock('../modules/chat/check.js', () => ({
    permissionErrMsg: jest.fn(),
    flag: { ChkChannel: 1, ChkChannelAdmin: 2 }
}));
jest.mock('../modules/discord/deploy-commands.js', () => ({
    registeredGlobalSlashCommands: jest.fn(),
    testRegisteredSlashCommands: jest.fn()
}));
jest.mock('../modules/runtime/schedule.js', () => ({
    agenda: null,
    JOB_NAME: 'dailyDiscordMaintenance',
    AGENDA_TIMEZONE: 'Asia/Hong_Kong',
    SCHEDULE_DOC_KEY: 'default',
    buildCronExpression: () => '0 0 * * *',
    getRespawnScheduleDoc: jest.fn(),
    syncDiscordMaintenanceSchedule: jest.fn()
}));
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    model: jest.fn(),
    Schema: jest.fn(),
    connection: { readyState: 0 }
}));

process.env.SALT = process.env.SALT || 'test_salt';
process.env.CRYPTO_SECRET = process.env.CRYPTO_SECRET || 'test_crypto_secret';
delete process.env.mongoURL;

const { generatePatreonKey } = require('../roll/z_admin.js');

describe('generatePatreonKey', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns XXXX-XXXX-XXXX-XXXX uppercase alphanumeric', () => {
        const key = generatePatreonKey();
        expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('rejects biased high bytes and keeps sampling until 16 chars', () => {
        // maxUnbiased = 252; bytes >= 252 are skipped (rejection sampling).
        let call = 0;
        jest.spyOn(crypto, 'randomBytes').mockImplementation((n) => {
            call += 1;
            if (call === 1) {
                return Buffer.alloc(n, 255);
            }
            return Buffer.from(Array.from({ length: n }, (_, i) => i % 36));
        });

        const key = generatePatreonKey();
        expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect(call).toBeGreaterThan(1);
    });
});
