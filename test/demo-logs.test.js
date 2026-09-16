'use strict';

const { listDemoLogs, getDemoLog, isDemoLogId } = require('../modules/session-log/demo-logs.js');
const { eventsCharCount } = require('../modules/session-log/demo-script-parser.js');
const SessionLogReader = require('../views/common/session-log-reader.js');

describe('demo-logs', () => {
    it('lists 10 demo logs', () => {
        const logs = listDemoLogs();
        expect(logs).toHaveLength(10);
        expect(logs[0].isDemo).toBe(true);
    });

    it('returns demo log by id', () => {
        const log = getDemoLog('demo-01');
        expect(log).toBeTruthy();
        expect(log.title).toContain('門後的目錄');
        expect(log.events.length).toBeGreaterThan(20);
    });

    it('aligns messageCount with actual events', () => {
        const log = getDemoLog('demo-10');
        expect(log.messageCount).toBe(log.events.length);
        expect(log.charCount).toBeGreaterThan(8000);
        expect(log.events[0].type).not.toBe('system');
    });

    it('builds full scripts for all demos with varied lengths', () => {
        const charCounts = [];
        for (const meta of listDemoLogs()) {
            const log = getDemoLog(meta.id);
            expect(log.events.length).toBeGreaterThan(15);
            expect(log.messageCount).toBe(log.events.length);
            charCounts.push(eventsCharCount(log.events));
        }
        charCounts.sort((a, b) => a - b);
        expect(charCounts[0]).toBeLessThan(2000);
        expect(charCounts.at(-1)).toBeGreaterThan(8000);
        expect(charCounts.at(-1) - charCounts[0]).toBeGreaterThan(6000);
    });

    it('detects demo ids', () => {
        expect(isDemoLogId('demo-01')).toBe(true);
        expect(isDemoLogId('507f1f77bcf86cd799439011')).toBe(false);
    });

    it('splits demo logs into scene-based chapters', () => {
        const log = getDemoLog('demo-01');
        const chapters = SessionLogReader.splitIntoChapters(log.events);
        expect(chapters.length).toBeGreaterThan(1);
        expect(chapters[0].events.length).toBeGreaterThan(0);
    });

    it('parses expandable reference attachments in demo-01', () => {
        const log = getDemoLog('demo-01');
        const ref = log.events.find((event) => event.type === 'reference' && event.caption === '書店平面圖');
        expect(ref).toBeTruthy();
        expect(ref.body).toContain('目錄室');
        expect(ref.body).toContain('一樓');
    });
});
