'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const security = require('../utils/security');

describe('versioned CRYPTO_SECRET encryption', () => {
    const previous = { secret: process.env.CRYPTO_SECRET, format: process.env.CRYPTO_SECRET_WRITE_FORMAT };
    beforeEach(() => {
        process.env.CRYPTO_SECRET = 'unit-test-secret-with-unicode-測試';
        delete process.env.CRYPTO_SECRET_WRITE_FORMAT;
    });
    afterAll(() => {
        if (previous.secret === undefined) delete process.env.CRYPTO_SECRET;
        else process.env.CRYPTO_SECRET = previous.secret;
        if (previous.format === undefined) delete process.env.CRYPTO_SECRET_WRITE_FORMAT;
        else process.env.CRYPTO_SECRET_WRITE_FORMAT = previous.format;
    });

    test('default writes legacy and both formats remain readable', () => {
        // Use an ASCII secret because legacy CTR derives a fixed character-length key.
        process.env.CRYPTO_SECRET = 'legacy-test-secret';
        expect(security.decryptWithCryptoSecret('00000000000000000000000000000000:ec3f9bf330f16f0a')).toBe('old data');
        const legacy = security.encryptWithCryptoSecret('old data');
        expect(legacy).toMatch(/^[a-f0-9]{32}:[a-f0-9]+$/);
        process.env.CRYPTO_SECRET_WRITE_FORMAT = 'gcm-v1';
        const current = security.encryptWithCryptoSecret('new data 測試');
        expect(current).toMatch(/^gcm1:[a-f0-9]{24}:[a-f0-9]{32}:[a-f0-9]+$/);
        delete process.env.CRYPTO_SECRET_WRITE_FORMAT;
        expect(security.decryptWithCryptoSecret(legacy)).toBe('old data');
        expect(security.decryptWithCryptoSecret(current)).toBe('new data 測試');
    });

    test('authenticated encryption uses different nonces', () => {
        process.env.CRYPTO_SECRET_WRITE_FORMAT = 'gcm-v1';
        const first = security.encryptWithCryptoSecret('same');
        const second = security.encryptWithCryptoSecret('same');
        expect(first.split(':')[1]).not.toBe(second.split(':')[1]);
        expect(security.decryptWithCryptoSecret(first)).toBe('same');
    });

    test.each([1, 2, 3])('rejects tampering in component %i', (index) => {
        process.env.CRYPTO_SECRET_WRITE_FORMAT = 'gcm-v1';
        const parts = security.encryptWithCryptoSecret('private data').split(':');
        parts[index] = (parts[index][0] === '0' ? '1' : '0') + parts[index].slice(1);
        expect(security.decryptWithCryptoSecret(parts.join(':'))).toMatch(/^DECRYPTION_ERROR:/);
    });

    test('rejects wrong secret, malformed GCM and invalid write option', () => {
        process.env.CRYPTO_SECRET_WRITE_FORMAT = 'gcm-v1';
        const ciphertext = security.encryptWithCryptoSecret('private');
        process.env.CRYPTO_SECRET = 'wrong-secret';
        expect(security.decryptWithCryptoSecret(ciphertext)).toMatch(/^DECRYPTION_ERROR:/);
        expect(security.decryptWithCryptoSecret('gcm1:bad')).toMatch(/^DECRYPTION_ERROR:/);
        process.env.CRYPTO_SECRET_WRITE_FORMAT = 'unexpected';
        expect(security.encryptWithCryptoSecret('private')).toMatch(/^ENCRYPTION_ERROR:/);
    });
});
