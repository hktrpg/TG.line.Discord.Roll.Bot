'use strict';

const { evaluateWorkAccess, isPublicDiscoverable } = require('../modules/session-log/permissions.js');
const { filterEventsByChapterAccess } = require('../modules/session-log/chapters.js');

describe('session-log permissions', () => {
    const owner = { discordId: 'u1', userName: 'alice' };

    test('owner can read draft; share token ignored for draft', () => {
        const log = {
            ownerDiscordId: 'u1',
            status: 'draft',
            visibility: 'unlisted',
            shareToken: 'tok',
            moderation: { state: 'ok' },
        };
        expect(evaluateWorkAccess(log, owner, 'tok').allowed).toBe(true);
        expect(evaluateWorkAccess(log, null, 'tok').allowed).toBe(false);
    });

    test('published unlisted requires token', () => {
        const log = {
            ownerDiscordId: 'u1',
            status: 'published',
            visibility: 'unlisted',
            shareToken: 'tok',
            moderation: { state: 'ok' },
        };
        expect(evaluateWorkAccess(log, null, 'tok').allowed).toBe(true);
        expect(evaluateWorkAccess(log, null, 'bad').allowed).toBe(false);
    });

    test('taken_down is 404 for non-owner', () => {
        const log = {
            ownerDiscordId: 'u1',
            status: 'published',
            visibility: 'public',
            moderation: { state: 'taken_down' },
        };
        const guest = evaluateWorkAccess(log, null);
        expect(guest.allowed).toBe(false);
        expect(guest.reason).toBe('NOT_FOUND');
        expect(evaluateWorkAccess(log, owner).allowed).toBe(true);
    });

    test('deletedAt only visible to owner as trash', () => {
        const log = {
            ownerDiscordId: 'u1',
            status: 'published',
            visibility: 'public',
            deletedAt: new Date(),
            moderation: { state: 'ok' },
        };
        expect(evaluateWorkAccess(log, owner).reason).toBe('TRASH');
        expect(evaluateWorkAccess(log, null).allowed).toBe(false);
    });

    test('isPublicDiscoverable respects safe mode', () => {
        const log = {
            status: 'published',
            visibility: 'public',
            rating: 'r18',
            moderation: { state: 'ok' },
        };
        expect(isPublicDiscoverable(log)).toBe(true);
        expect(isPublicDiscoverable(log, { safe: true })).toBe(false);
    });

    test('filterEventsByChapterAccess hides unpublished chapters for guests', () => {
        const events = [
            { id: 'e1', type: 'say', text: 'a' },
            { id: 'e2', type: 'say', text: 'b' },
            { id: 'e3', type: 'say', text: 'c' },
        ];
        const chapters = [
            { id: 'c1', status: 'published', startEventId: 'e1', endEventId: 'e1' },
            { id: 'c2', status: 'draft', startEventId: 'e2', endEventId: 'e3' },
        ];
        const filtered = filterEventsByChapterAccess(events, chapters, false);
        expect(filtered.map((event) => event.id)).toEqual(['e1']);
        expect(filterEventsByChapterAccess(events, chapters, true)).toHaveLength(3);
    });
});
