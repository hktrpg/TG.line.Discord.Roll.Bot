"use strict";

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
	ensureRollWorkerToken,
	readTokenFromEnvFile,
	upsertEnvToken,
	parseTokenFromEnvContent,
} = require('../modules/roll-worker/ensure-token');

describe('ensureRollWorkerToken', () => {
	let tmpDir;
	let envPath;
	let prevToken;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-token-'));
		envPath = path.join(tmpDir, '.env');
		prevToken = process.env.ROLL_WORKER_TOKEN;
		delete process.env.ROLL_WORKER_TOKEN;
	});

	afterEach(() => {
		if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prevToken;
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('returns existing process.env token without writing', () => {
		process.env.ROLL_WORKER_TOKEN = 'already-set';
		const token = ensureRollWorkerToken({ envPath, generate: true });
		expect(token).toBe('already-set');
		expect(fs.existsSync(envPath)).toBe(false);
	});

	it('loads token from .env when process.env is empty', () => {
		fs.writeFileSync(envPath, 'FOO=1\nROLL_WORKER_TOKEN=from-file\nBAR=2\n', 'utf8');
		const token = ensureRollWorkerToken({ envPath, generate: true });
		expect(token).toBe('from-file');
		expect(process.env.ROLL_WORKER_TOKEN).toBe('from-file');
	});

	it('generates and persists a new token when missing', () => {
		const logs = [];
		const token = ensureRollWorkerToken({
			envPath,
			generate: true,
			logger: { info: (m) => logs.push(m), warn: () => {}, log: () => {} },
		});
		expect(token).toMatch(/^[a-f0-9]{64}$/);
		expect(process.env.ROLL_WORKER_TOKEN).toBe(token);
		expect(readTokenFromEnvFile(envPath)).toBe(token);
		expect(logs.some((m) => /Generated ROLL_WORKER_TOKEN/.test(m))).toBe(true);
	});

	it('does not generate when generate=false', () => {
		const token = ensureRollWorkerToken({ envPath, generate: false });
		expect(token).toBe('');
		expect(fs.existsSync(envPath)).toBe(false);
	});

	it('does not log the token when .env write fails', () => {
		const badPath = path.join(tmpDir, 'missing-dir', '.env');
		const warns = [];
		const token = ensureRollWorkerToken({
			envPath: badPath,
			generate: true,
			logger: {
				info: () => {},
				warn: (m) => warns.push(String(m)),
				log: () => {},
			},
		});
		expect(token).toMatch(/^[a-f0-9]{64}$/);
		expect(warns.some((m) => m.includes(token))).toBe(false);
		expect(warns.some((m) => /in memory only/.test(m))).toBe(true);
	});

	it('upsert preserves other .env lines', () => {
		fs.writeFileSync(envPath, '# keep\nMONGO=url\nROLL_WORKER_TOKEN=old\n', 'utf8');
		upsertEnvToken('new-secret', envPath);
		const content = fs.readFileSync(envPath, 'utf8');
		expect(content).toContain('# keep');
		expect(content).toContain('MONGO=url');
		expect(parseTokenFromEnvContent(content)).toBe('new-secret');
		expect(content).not.toContain('old');
	});
});
