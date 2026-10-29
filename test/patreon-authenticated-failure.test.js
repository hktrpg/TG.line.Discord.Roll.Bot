'use strict';

jest.mock('../utils/security.js', () => ({
    getCryptoSecretKey: jest.fn(() => 'present'),
    decryptWithCryptoSecret: jest.fn(() => 'DECRYPTION_ERROR: authentication failed'),
    encryptWithCryptoSecret: jest.fn(() => 'encrypted'),
}));
jest.mock('../modules/db/schema.js', () => ({
    patreonMember: { findOne: jest.fn(), find: jest.fn(), updateOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../modules/patreon/patreon-sync.js', () => ({
    clearVipEntriesByPatreonKey: jest.fn(), syncMemberSlotsToVip: jest.fn(),
}));
jest.mock('../modules/patreon/veryImportantPerson.js', () => ({ invalidateCache: jest.fn() }));

const schema = require('../modules/db/schema.js');
const sync = require('../modules/patreon/patreon-sync.js');
const security = require('../utils/security.js');
const { runImport } = require('../modules/patreon/patreon-import.js');

beforeEach(() => jest.clearAllMocks());

test('a member with corrupt authenticated data is not overwritten or changed', async () => {
    schema.patreonMember.findOne.mockReturnValue({ lean: async () => ({
        patreonName: 'Example', keyEncrypted: 'gcm1:corrupt', switch: true,
    }) });
    const csv = 'Name,Patron Status,Tier,Last Updated\nExample,Active patron,Test,2026-10-01';
    const result = await runImport(csv, { keyMode: 'newonly' });
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Authenticated data decryption failed')]));
    expect(schema.patreonMember.updateOne).not.toHaveBeenCalled();
    expect(schema.patreonMember.create).not.toHaveBeenCalled();
    expect(sync.clearVipEntriesByPatreonKey).not.toHaveBeenCalled();
});

test('email decryption failure is reported and never used as an email address', async () => {
    schema.patreonMember.findOne.mockReturnValue({ lean: async () => null });
    schema.patreonMember.find.mockReturnValue({ sort: () => ({ lean: async () => [{
        patreonName: 'Example', keyEncrypted: 'key', emailEncrypted: 'gcm1:bad', level: 1,
    }] }) });
    security.decryptWithCryptoSecret.mockImplementation(value => value === 'key'
        ? 'ABCD-EFGH-IJKL-MNOP' : 'DECRYPTION_ERROR: authentication failed');
    const csv = 'Name,Patron Status,Tier,Last Updated\nIgnored,Unknown,,2026-10-01';
    const result = await runImport(csv, { keyMode: 'all', generateEmail: true });
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Email decryption failed')]));
    expect(result.emailContent).not.toContain('DECRYPTION_ERROR');
});
