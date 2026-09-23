"use strict";

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cheerio = require('cheerio');

const source = fs.readFileSync(path.join(__dirname, '../views/discordLog.html'), 'utf8');
const names = ['highlightMatches', 'escapeHtml', 'applyHighlight', 'safeHttpUrl',
    'isImageUrl', 'renderAttachments', 'renderEmbeds', 'renderReply', 'renderContent'];
const implementations = names.map(name => [...source.matchAll(
    new RegExp(`^( +)${name}\\([^]*?^\\1},?\\r?$`, 'gm')
)].map(match => match[0].trim().replace(/,$/, '') + ','));

describe.each([0, 1])('Discord log renderer %i', index => {
    let renderer;
    beforeEach(() => {
        renderer = vm.runInNewContext('({' + implementations.map(methods => methods[index]).join('\n') + '})', {
            dt: (_key, values) => values.user
        });
    });

    test.each([
        ['Sam & Amy', 'am', ['am', 'Am']],
        ['Sam & Amy', '&', ['&']],
        ['Tom <Tom>', '<', ['<']],
        ['"Amy" & \'Sam\'', 'am', ['Am', 'am']],
        ['&amp; Amy', 'amp', ['amp']],
        ['A.*[B] a.*[b]', '.*[b]', ['.*[B]', '.*[b]']],
        ['<img src=x onerror=alert(1)>', 'img', ['img']],
        ['<b>Amy</b>', '', []],
        ['<b>Amy</b>', 'absent', []]
    ])('preserves %s when searching %s', (text, filter, matches) => {
        renderer.filter = filter;
        const $ = cheerio.load(renderer.highlightMatches(text, false));
        expect($.text()).toBe(text);
        expect($('strong').map((_i, node) => $(node).text()).get()).toEqual(matches);
        expect($('body').find('*').not('strong')).toHaveLength(0);
    });

    test('preserves bot suffix and handles missing names', () => {
        renderer.filter = 'am';
        expect(cheerio.load(renderer.highlightMatches('Sam & Amy', true)).text()).toBe('Sam & Amy(🤖)');
        expect(renderer.highlightMatches(null, false)).toBe('');
    });

    test('content, reply and embed callers escape exactly once', () => {
        renderer.filter = 'am';
        const text = 'Sam & Amy <img src=x>';
        const $ = cheerio.load(renderer.renderContent({
            contact: text,
            reply_to: { userName: text, contact: text },
            embeds: [{ title: text, description: text }]
        }));
        expect($.text().split(text)).toHaveLength(6);
        expect($('img')).toHaveLength(0);
        expect($('strong').filter((_i, node) => $(node).text() === 'am')).toHaveLength(5);
    });
});
