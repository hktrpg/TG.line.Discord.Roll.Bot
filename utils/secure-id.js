'use strict';

const crypto = require('node:crypto');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function secureRandomString(length) {
    let result = '';
    for (let i = 0; i < length; i++) result += ALPHABET[crypto.randomInt(ALPHABET.length)];
    return result;
}

module.exports = { secureRandomString };
