"use strict";

/**
 * Phase 3h: admin clusterhealth/mem/importpatreon via meta;
 * root respawn via clusterIpc; token make with avatarUrl remote.
 */
jest.setTimeout(90_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 39_70;
const TOKEN = 'phase-spawn-token';
const ADMIN_ID = 'proof-admin-3h';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(urlPath) {
	return new Promise((resolve, reject) => {
		http.get(`http://127.0.0.1:${PORT}${urlPath}`, (res) => {
			let raw = '';
			res.on('data', (c) => { raw += c; });
			res.on('end', () => {
				try {
					resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') });
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', reject);
	});
}

async function waitHealth(timeoutMs = 25_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await getJson('/health');
			if (res.status === 200 && res.body.ok) return res.body;
		} catch {
			// retry
		}
		await sleep(200);
	}
	throw new Error('worker health timeout');
}

const SAMPLE_HEALTH = {
	healthReport: {
		clusters: [
			{ id: 0, ready: true, alive: true, shards: 2, uptime: 100 },
		],
		summary: {
			totalClusters: 1,
			activeClusters: 1,
			readyClusters: 1,
			deadClusters: 0,
			totalShards: 2,
		},
		processInfo: { pid: 1, uptime: 3661, memoryMB: 128 },
	},
	dbStatus: {
		isDegradedMode: false,
		dbConnectionState: 1,
		consecutiveFailures: 0,
		cacheSize: 0,
		pendingSyncOperations: 0,
	},
	clusterProtectionStatus: {
		unhealthyCount: 0,
		healthTimeout: 60_000,
		maxRetries: 3,
	},
};

describe('Phase 3h admin/token Worker remote (spawned)', () => {
	let child;
	let client;
	const prevUrl = process.env.ROLL_WORKER_URL;
	const prevToken = process.env.ROLL_WORKER_TOKEN;

	beforeAll(async () => {
		child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
			cwd: ROOT,
			env: {
				...process.env,
				ROLL_WORKER_MODE: 'true',
				ROLL_WORKER_HOST: '127.0.0.1',
				ROLL_WORKER_PORT: String(PORT),
				ROLL_WORKER_TOKEN: TOKEN,
				ROLL_WORKER_URL: '',
				ADMIN_SECRET: ADMIN_ID,
				OPENAI_SWITCH: process.env.OPENAI_SWITCH || 'true',
				DISCORD_CHANNEL_SECRET: process.env.DISCORD_CHANNEL_SECRET || 'proof-secret',
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PORT}`;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		jest.resetModules();
		client = require('../modules/roll-worker/client');
		await waitHealth();
	});

	afterAll(async () => {
		if (prevUrl === undefined) delete process.env.ROLL_WORKER_URL;
		else process.env.ROLL_WORKER_URL = prevUrl;
		if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prevToken;
		if (child && !child.killed) {
			child.kill('SIGTERM');
			await sleep(400);
			try { child.kill('SIGKILL'); } catch { /* ignore */ }
		}
	});

	it('.admin clusterhealth without meta still needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin clusterhealth',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.admin clusterhealth with clusterHealthMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin clusterhealth',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			clusterHealthMeta: SAMPLE_HEALTH,
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z_admin');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(20);
	});

	it('.root mem with clusterMemMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root mem',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			clusterMemMeta: {
				rows: [{
					clusterId: 0,
					rss: 100 * 1024 * 1024,
					heapUsed: 50 * 1024 * 1024,
					heapTotal: 80 * 1024 * 1024,
					external: 1024 * 1024,
					heapSizeLimit: 2 * 1024 * 1024 * 1024,
					uptime: 42,
				}],
				hostTotal: 8 * 1024 * 1024 * 1024,
				hostFree: 4 * 1024 * 1024 * 1024,
				heapSizeLimit: 2 * 1024 * 1024 * 1024,
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(10);
	});

	it('.root restart discord returns clusterIpc remotely', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root restart discord 0',
			botname: 'Discord',
			userid: ADMIN_ID,
			groupid: 'g1',
			channelid: 'c1',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(result.clusterIpc).toEqual(expect.objectContaining({
			respawn: true,
			id: '0',
		}));
	});

	it('.root importpatreon with csvAttachmentMeta hits Worker (download may fail)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root importpatreon',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			csvAttachmentMeta: {
				url: 'https://example.invalid/missing.csv',
				name: 'missing.csv',
				size: 12,
				contentType: 'text/csv',
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('.token make with avatarUrl hits Worker (not needsLocal)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.token ProofHero',
			botname: 'Discord',
			locale: 'zh-tw',
			avatarUrl: 'https://example.invalid/avatar.png',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('token');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});
});

describe('Phase 3h admin-remote collectors unit', () => {
	it('collectClusterHealthMeta returns null without global helper', () => {
		const { collectClusterHealthMeta } = require('../modules/roll-worker/admin-remote');
		const prev = globalThis.getClusterHealthReport;
		delete globalThis.getClusterHealthReport;
		expect(collectClusterHealthMeta()).toBeNull();
		if (prev) globalThis.getClusterHealthReport = prev;
	});

	it('prefetchCsvAttachment reads csv from message', () => {
		const { prefetchCsvAttachment } = require('../modules/roll-worker/admin-remote');
		const meta = prefetchCsvAttachment({
			attachments: {
				size: 1,
				values() {
					return [{
						url: 'https://cdn.example/a.csv',
						name: 'a.csv',
						size: 9,
						contentType: 'text/csv',
					}].values();
				},
			},
		});
		expect(meta.name).toBe('a.csv');
		expect(meta.url).toContain('a.csv');
	});
});
