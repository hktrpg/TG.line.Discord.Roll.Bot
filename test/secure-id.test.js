'use strict';

const crypto = require('node:crypto');
const { secureRandomString } = require('../utils/secure-id');

test('export identifiers use crypto.randomInt and preserve their alphabet and lengths', () => {
    const random = jest.spyOn(crypto, 'randomInt').mockReturnValue(61);
    try {
        expect(secureRandomString(16)).toBe('9'.repeat(16));
        expect(secureRandomString(7)).toBe('9'.repeat(7));
        expect(random).toHaveBeenCalledTimes(23);
        expect(random).toHaveBeenCalledWith(62);
    } finally {
        random.mockRestore();
    }
});
