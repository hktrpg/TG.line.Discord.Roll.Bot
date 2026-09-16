'use strict';

const { registerSessionLogJobs } = require('../modules/session-log/session-log-jobs.js');

describe('session-log publish jobs', () => {
    test('publishScheduled promotes due works', async () => {
        const saved = [];
        const dueWork = {
            status: 'scheduled',
            publishAt: new Date(Date.now() - 1000),
            chapters: [],
            async save() { saved.push({ ...this }); },
        };
        const schema = {
            sessionLog: {
                find: (query) => {
                    if (query.status === 'scheduled') {
                        return {
                            limit: async () => [dueWork],
                        };
                    }
                    return {
                        limit: async () => [],
                    };
                },
            },
        };
        const jobs = registerSessionLogJobs({ schema, agenda: null });
        await jobs.publishScheduled();
        expect(dueWork.status).toBe('published');
        expect(saved.length).toBe(1);
    });
});
