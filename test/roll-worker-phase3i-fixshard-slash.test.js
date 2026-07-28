"use strict";

/**
 * Phase 3i: fixshard + slash deploy via Gateway-prefetched meta ??Worker remote.
 */
jest.setTimeout(90_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 39_71;
const TOKEN = 'phase-spawn-token';
const ADMIN_ID = 'proof-admin-3i';

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

describe('Phase 3i fixshard/slash Worker remote (spawned)', () => {
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

	it('.root fixshard check without meta still needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root fixshard check',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.root fixshard check with fixShardMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root fixshard check',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			fixShardMeta: {
				action: 'check',
				report: {
					totalShards: 4,
					healthyShards: 4,
					unhealthyShards: 0,
					unresponsiveShards: [],
				},
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z_admin');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(10);
	});

	it('.root fixshard status with fixShardMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root fixshard status',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			fixShardMeta: {
				action: 'status',
				status: {
					inProgress: false,
					unresponsiveShards: [],
					totalUnresponsive: 0,
				},
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(5);
	});

	it('.root fixshard start with fixShardMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root fixshard start',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			fixShardMeta: {
				action: 'start',
				result: { inProgress: false, message: 'No unresponsive shards to fix' },
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '')).toContain('No unresponsive');
	});

	it('.root registeredGlobal without meta still needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root registeredGlobal',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.root registeredGlobal with slashDeployMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root registeredGlobal',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			slashDeployMeta: { text: 'PROOF_SLASH_DEPLOY_OK' },
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(result.text).toBe('PROOF_SLASH_DEPLOY_OK');
	});

	it('.root removeSlashCommands with slashDeployMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root removeSlashCommands 123456789012345678',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			slashDeployMeta: { text: 'PROOF_REMOVE_SLASH_OK' },
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(result.text).toBe('PROOF_REMOVE_SLASH_OK');
	});
});

describe('Phase 3i admin-remote fixshard/slash unit', () => {
	it('classifies fixshard/slash as live unless meta present', () => {
		const { adminSubNeedsLiveDiscord } = require('../modules/roll-worker/admin-remote');
		expect(adminSubNeedsLiveDiscord('.root', 'fixshard')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'fixshard', {
			fixShardMeta: { action: 'check' },
		})).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'registeredglobal')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'registeredglobal', {
			slashDeployMeta: { text: 'ok' },
		})).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'removeslashcommands')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'testregistered', {
			slashDeployMeta: { text: 'ok' },
		})).toBe(false);
	});

	it('collectFixShardMeta returns null without globals', async () => {
		const { collectFixShardMeta } = require('../modules/roll-worker/admin-remote');
		const prev = globalThis.checkShardHealth;
		delete globalThis.checkShardHealth;
		expect(await collectFixShardMeta('check')).toBeNull();
		if (prev) globalThis.checkShardHealth = prev;
	});

	it('collectFixShardMeta status uses getShardFixStatus', async () => {
		const { collectFixShardMeta } = require('../modules/roll-worker/admin-remote');
		globalThis.getShardFixStatus = () => ({
			inProgress: false,
			unresponsiveShards: [],
			totalUnresponsive: 0,
		});
		const meta = await collectFixShardMeta('status');
		expect(meta.action).toBe('status');
		expect(meta.status.inProgress).toBe(false);
		delete globalThis.getShardFixStatus;
	});
});
