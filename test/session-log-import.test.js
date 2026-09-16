'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseMarkdown } = require('../modules/session-log/import/markdown.js');
const { parseWhatsApp } = require('../modules/session-log/import/whatsapp.js');
const { parseTelegram } = require('../modules/session-log/import/telegram.js');
const { parseLine } = require('../modules/session-log/import/line.js');
const { importWork } = require('../modules/session-log/import/index.js');
const { buildChaptersFromEvents } = require('../modules/session-log/chapters.js');

const fixtures = path.join(__dirname, 'fixtures', 'session-log');

describe('session-log import parsers', () => {
    test('parses markdown with scenes, say, and images', () => {
        const content = fs.readFileSync(path.join(fixtures, 'sample.md'), 'utf8');
        const result = parseMarkdown(content);
        expect(result.events.some((event) => event.type === 'scene')).toBe(true);
        expect(result.events.some((event) => event.type === 'say' && event.name === 'Alice')).toBe(true);
        expect(result.events.some((event) => event.type === 'reference')).toBe(true);
        expect(result.playerNames).toEqual(expect.arrayContaining(['Alice', 'Bob']));
        const chapters = buildChaptersFromEvents(result.events);
        expect(chapters.length).toBeGreaterThanOrEqual(2);
    });

    test('parses whatsapp export', () => {
        const content = fs.readFileSync(path.join(fixtures, 'sample-whatsapp.txt'), 'utf8');
        const result = parseWhatsApp(content);
        expect(result.events.length).toBeGreaterThanOrEqual(3);
        expect(result.events.some((event) => event.type === 'reference')).toBe(true);
        expect(result.playerNames).toEqual(expect.arrayContaining(['Alice', 'Bob']));
    });

    test('parses telegram json', () => {
        const content = fs.readFileSync(path.join(fixtures, 'sample-telegram.json'), 'utf8');
        const result = parseTelegram(content);
        expect(result.events.some((event) => event.type === 'say')).toBe(true);
        expect(result.events.some((event) => event.type === 'reference')).toBe(true);
        expect(result.sourceMeta.chatName).toBe('TRPG Table');
        expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    });

    test('parses line export', () => {
        const content = fs.readFileSync(path.join(fixtures, 'sample-line.txt'), 'utf8');
        const result = parseLine(content);
        expect(result.events.some((event) => event.type === 'say' && event.name === 'Alice')).toBe(true);
        expect(result.events.some((event) => event.type === 'reference')).toBe(true);
    });

    test('importWork builds commercial metadata defaults', () => {
        const content = fs.readFileSync(path.join(fixtures, 'sample.md'), 'utf8');
        const { payload, warnings } = importWork('manual_md', {
            content,
            metadata: {
                title: 'Test Work',
                status: 'published',
                visibility: 'public',
                rating: 'teen',
            },
        });
        expect(payload.title).toBe('Test Work');
        expect(payload.status).toBe('published');
        expect(payload.visibility).toBe('public');
        expect(payload.rating).toBe('teen');
        expect(payload.license).toBe('all_rights_reserved');
        expect(payload.chapters.length).toBeGreaterThan(0);
        expect(payload.contentHash).toMatch(/^[a-f0-9]{64}$/);
        expect(Array.isArray(warnings)).toBe(true);
    });
});
