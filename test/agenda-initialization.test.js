"use strict";

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');

// Exercise the installed Agenda, including its asynchronous database callback.
// Mock only the network driver and application connector. No .env or live DB.
function probe(mode) {
    const script = `
        const path = require('node:path');
        process.env.mongoURL = 'mongodb+srv://schedule-test.invalid/test';
        process.env.ROLL_WORKER_MODE = ${JSON.stringify(mode)} === 'gateway-success' ? 'false' : 'true';
        const connectorPath = require.resolve('./modules/db/connector');
        require.cache[connectorPath] = { id: connectorPath, filename: connectorPath, loaded: true,
            exports: { mongoose: { connection: { readyState: 2 } }, checkHealth: () => ({ isConnected: false }) } };
        const agendaEntry = require.resolve('agenda');
        const driverPath = require.resolve('mongodb', { paths: [path.dirname(agendaEntry)] });
        const schemaPath = require.resolve('./modules/db/schema');
        require.cache[schemaPath] = { id: schemaPath, filename: schemaPath, loaded: true, exports: {} };
        const collection = { deleteMany: async () => ({ deletedCount: 0 }),
            createIndex: (_keys, _options, cb) => setImmediate(() => {
            cb(${JSON.stringify(mode)} === 'index-error' ? Object.assign(new Error('test index error'), { code: 85 }) : null);
        }) };
        require(driverPath).MongoClient.connect = (_url, _options, cb) => setImmediate(() => {
            if (${JSON.stringify(mode)} === 'dns-error') {
                cb(Object.assign(new Error('querySrv ETIMEOUT test.invalid'), { code: 'ETIMEOUT' }), null);
            } else {
                cb(null, { db: () => ({ collection: () => collection }) });
            }
        });
        let processorStarted = false;
        require('agenda').prototype.start = async () => { processorStarted = true; };
        const schedule = require('./modules/runtime/schedule');
        let state = 'pending';
        schedule.ensureAgendaReady().then(() => { state = 'ready'; }, error => { state = 'rejected'; });
        setTimeout(() => {
            console.log(JSON.stringify({ alive: true, state, processorStarted,
                collectionReady: Boolean(schedule.agenda._collection) }));
            process.exit(0);
        }, 100);
    `;
    return spawnSync(process.execPath, ['--unhandled-rejections=strict', '-e', script], {
        cwd: root, env: { ...process.env, NODE_OPTIONS: '' }, encoding: 'utf8', timeout: 10_000
    });
}

describe('Agenda initialization failure isolation', () => {
    it('survives asynchronous SRV failure and rejects scheduling readiness promptly', () => {
        const result = probe('dns-error');
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"state":"rejected"');
        expect(result.stdout).toContain('"alive":true');
        expect(result.stderr).not.toMatch(/UnhandledPromiseRejection|Uncaught Error/);
    });

    it('rejects readiness on an index error rather than waiting forever', () => {
        const result = probe('index-error');
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"state":"rejected"');
    });

    it('initializes the installed Agenda collection without starting a Worker processor', () => {
        const result = probe('success');
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"state":"ready"');
        expect(result.stdout).toContain('"collectionReady":true');
        expect(result.stdout).toContain('"processorStarted":false');
    });

    it('still starts a Gateway processor after its own Agenda connection is ready', () => {
        const result = probe('gateway-success');
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"state":"ready"');
        expect(result.stdout).toContain('"processorStarted":true');
    });
});
