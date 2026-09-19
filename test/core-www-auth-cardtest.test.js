'use strict';

const fs = require('node:fs');
const path = require('node:path');

describe('core-www auth and cardtest routes', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '../modules/core-www.js'),
        'utf8'
    );

    test('getListInfo uses unified AUTH_FAILED response', () => {
        expect(src).toMatch(/code:\s*'AUTH_FAILED'/);
        expect(src).toMatch(/www\.socket\.login_failed/);
        expect(src).not.toMatch(/code:\s*'USER_NOT_FOUND'/);
        expect(src).not.toMatch(/code:\s*'INVALID_PASSWORD'/);
    });

    test('/cardtest is gated by WWW_CARDTEST', () => {
        expect(src).toMatch(/cardtestEnabled\s*=\s*isEnvEnabled\('WWW_CARDTEST'\)/);
        expect(src).toMatch(/if\s*\(!cardtestEnabled\)/);
    });
});
