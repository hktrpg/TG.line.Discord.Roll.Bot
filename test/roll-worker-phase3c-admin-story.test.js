"use strict";

/**
 * Phase 3c: z_admin / z-story-teller help+safe remote; cluster/import needsLocal.
 */
jest.setTimeout(120_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 3965;
const TOKEN = 'phase-spawn-token';

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

async function waitHealth(timeoutMs = 60_000) {
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

describe('Phase 3c admin/story Worker contract (spawned)', () => {
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

	it('.admin help hits Worker remotely', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin help',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z_admin');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});

	it('.admin state hits Worker remotely (sets state flag)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin state',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('.admin clusterhealth without client returns needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin clusterhealth',
			botname: 'Discord',
			userid: 'admin-user',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.st help hits Worker remotely', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.st help',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z-story-teller');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});

	it('.st import without client returns needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.st import myalias',
			botname: 'Discord',
			userid: 'u1',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});
});

describe('Phase 3c adminSubNeedsLiveDiscord unit', () => {
	it('classifies safe vs live Discord admin subs', () => {
		const { adminSubNeedsLiveDiscord } = require('../modules/roll-worker/admin-remote.js');
		expect(adminSubNeedsLiveDiscord('.admin', 'help')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.admin', 'state')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.admin', 'debug')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.admin', 'registerchannel')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.admin', 'account')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.admin', 'clusterhealth')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.admin', 'clusterhealth', {
			clusterHealthMeta: { healthReport: { clusters: [] } },
		})).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'help')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'schedule')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'decrypt')).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'restart')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'restart', { mainMsg2: 'primary' })).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'restart', { mainMsg2: 'discord' })).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'stop')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'mem')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'mem', {
			clusterMemMeta: { rows: [{ clusterId: 0 }] },
		})).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'importpatreon')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'importpatreon', {
			csvAttachmentMeta: { url: 'https://example.invalid/a.csv' },
		})).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'fixshard')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.root', 'fixshard', {
			fixShardMeta: { action: 'status' },
		})).toBe(false);
		expect(adminSubNeedsLiveDiscord('.root', 'registeredglobal')).toBe(true);
		expect(adminSubNeedsLiveDiscord('.patreon', 'level')).toBe(false);
	});
});
