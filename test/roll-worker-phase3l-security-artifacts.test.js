"use strict";

/**
 * Phase 3l: Bugbot fixes — auth token, export demo truncate, artifacts, deferred fixshard.
 */
jest.setTimeout(90_000);

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const PORT = 3974;
const TOKEN = 'phase3l-proof-token';
const ADMIN_ID = 'proof-admin-3l';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpJson(method, urlPath, body, headers = {}) {
	return new Promise((resolve, reject) => {
		const data = body === undefined ? null : JSON.stringify(body);
		const req = http.request({
			hostname: '127.0.0.1',
			port: PORT,
			path: urlPath,
			method,
			headers: {
				'Content-Type': 'application/json',
				...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
				...headers,
			},
		}, (res) => {
			let raw = '';
			res.on('data', (chunk) => { raw += chunk; });
			res.on('end', () => {
				let json = null;
				try { json = raw ? JSON.parse(raw) : null; } catch { json = raw; }
				resolve({ status: res.statusCode, body: json });
			});
		});
		req.on('error', reject);
		if (data) req.write(data);
		req.end();
	});
}

describe('Phase 3l artifacts + export demo helpers', () => {
	const {
		truncateExportHistoryForDemo,
		assertArtifactReadable,
		resolveArtifactPath,
		DEMO_EXPORT_MESSAGE_LIMIT,
		getArtifactRoot,
	} = require('../modules/roll-worker/artifacts');

	it('truncateExportHistoryForDemo caps at 500 when demoMode', () => {
		const history = {
			totalSize: 800,
			sum_messages: Array.from({ length: 800 }, (_, i) => ({ contact: String(i) })),
		};
		const out = truncateExportHistoryForDemo(history, true);
		expect(out.sum_messages).toHaveLength(DEMO_EXPORT_MESSAGE_LIMIT);
		expect(out.totalSize).toBe(DEMO_EXPORT_MESSAGE_LIMIT);
		expect(truncateExportHistoryForDemo(history, false).sum_messages).toHaveLength(800);
	});

	it('assertArtifactReadable rejects missing and path escape', () => {
		expect(assertArtifactReadable('temp/does-not-exist-3l.bin')).toBeNull();
		expect(resolveArtifactPath('../outside.txt')).toBeNull();
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-art-'));
		const prev = process.env.ROLL_ARTIFACT_ROOT;
		process.env.ROLL_ARTIFACT_ROOT = tmpDir;
		try {
			const file = path.join(tmpDir, 'ok.txt');
			fs.writeFileSync(file, 'x');
			expect(assertArtifactReadable('ok.txt')).toBe(path.resolve(file));
			expect(getArtifactRoot()).toBe(path.resolve(tmpDir));
		} finally {
			if (prev === undefined) delete process.env.ROLL_ARTIFACT_ROOT;
			else process.env.ROLL_ARTIFACT_ROOT = prev;
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe('Phase 3l admin-remote deferred fixshard', () => {
	const { collectFixShardMeta, adminSubNeedsLiveDiscord } = require('../modules/roll-worker/admin-remote');

	it('collectFixShardMeta start/stop does not call global mutators', async () => {
		let startCalls = 0;
		let stopCalls = 0;
		globalThis.startShardFix = () => {
			startCalls += 1;
			return { inProgress: true, unresponsiveShards: [1] };
		};
		globalThis.stopShardFix = () => {
			stopCalls += 1;
			return { message: 'stopped' };
		};
		const startMeta = await collectFixShardMeta('start');
		const stopMeta = await collectFixShardMeta('stop');
		expect(startMeta).toEqual({ action: 'start', deferred: true });
		expect(stopMeta).toEqual({ action: 'stop', deferred: true });
		expect(startCalls).toBe(0);
		expect(stopCalls).toBe(0);
		expect(adminSubNeedsLiveDiscord('.root', 'fixshard', { fixShardMeta: startMeta })).toBe(false);
	});
});

describe('Phase 3l live worker + gateway with token (spawned)', () => {
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

		const start = Date.now();
		let ready = false;
		while (Date.now() - start < 60_000) {
			try {
				const health = await client.health();
				if (health?.ok) {
					ready = true;
					break;
				}
			} catch {
				// retry
			}
			await sleep(200);
		}
		if (!ready) {
			throw new Error(`Phase 3l worker health timeout on port ${PORT}`);
		}
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

	it('GET /health stays open; auth=required', async () => {
		const res = await httpJson('GET', '/health');
		expect(res.status).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.auth).toBe('required');
	});

	it('rejects /v1/parse without Bearer token', async () => {
		const res = await httpJson('POST', '/v1/parse', {
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		});
		expect(res.status).toBe(401);
	});

	it('rejects /v1/parse with wrong token', async () => {
		const res = await httpJson('POST', '/v1/parse', {
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		}, { Authorization: 'Bearer wrong' });
		expect(res.status).toBe(401);
	});

	it('Gateway client with token parses Discord dice on Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '1d3',
			botname: 'Discord',
			userid: 'u1',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('wrong gateway token is rejected (401)', async () => {
		process.env.ROLL_WORKER_TOKEN = 'wrong-token';
		jest.resetModules();
		const badClient = require('../modules/roll-worker/client');
		await expect(badClient.parse({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		})).rejects.toThrow(/401|Unauthorized/i);
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		jest.resetModules();
		client = require('../modules/roll-worker/client');
	});

	it('.root fixshard start deferred returns gatewayAction (no mutate on worker)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root fixshard start',
			botname: 'Discord',
			userid: ADMIN_ID,
			locale: 'zh-tw',
			fixShardMeta: { action: 'start', deferred: true },
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(result.gatewayAction).toEqual({ type: 'fixshard', action: 'start' });
	});
});
