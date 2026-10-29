'use strict';

jest.mock('dotenv', () => ({ config: jest.fn(() => {
    process.env.CRYPTO_SECRET_WRITE_FORMAT = 'gcm-v1';
}) }));
const { loadDotenvPreserving } = require('../modules/roll-worker/dotenv-preserve');

test('worker retains an explicit encryption write format when dotenv loads', () => {
    const previous = process.env.CRYPTO_SECRET_WRITE_FORMAT;
    try {
        process.env.CRYPTO_SECRET_WRITE_FORMAT = 'ctr';
        loadDotenvPreserving();
        expect(process.env.CRYPTO_SECRET_WRITE_FORMAT).toBe('ctr');
        delete process.env.CRYPTO_SECRET_WRITE_FORMAT;
        loadDotenvPreserving();
        expect(process.env.CRYPTO_SECRET_WRITE_FORMAT).toBe('gcm-v1');
    } finally {
        if (previous === undefined) delete process.env.CRYPTO_SECRET_WRITE_FORMAT;
        else process.env.CRYPTO_SECRET_WRITE_FORMAT = previous;
    }
});
