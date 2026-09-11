'use strict';

const fs = require('node:fs');
const path = require('node:path');

const homeHtml = fs.readFileSync(path.join(__dirname, '..', 'views', 'home.html'), 'utf8');

describe('www product hub', () => {
    test('lists invite targets and core tools', () => {
        expect(homeHtml).toContain('https://discord.hktrpg.com');
        expect(homeHtml).toContain('https://telegram.hktrpg.com/');
        expect(homeHtml).toContain('https://line.hktrpg.com');
        expect(homeHtml).toContain('https://rollbot.hktrpg.com/');
        expect(homeHtml).toContain('https://roll.hktrpg.com/');
        expect(homeHtml).toContain('https://card.hktrpg.com/');
        expect(homeHtml).toContain('https://bothelp.hktrpg.com/');
        expect(homeHtml).toContain('id="invite"');
    });
});
