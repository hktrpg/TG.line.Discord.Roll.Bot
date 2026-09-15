'use strict';

const { listDemoLogs, getDemoLog, isDemoLogId } = require('../modules/session-log/demo-logs.js');

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
        expect(log.events.length).toBeGreaterThan(0);
    });

    it('detects demo ids', () => {
        expect(isDemoLogId('demo-01')).toBe(true);
        expect(isDemoLogId('507f1f77bcf86cd799439011')).toBe(false);
    });
});
