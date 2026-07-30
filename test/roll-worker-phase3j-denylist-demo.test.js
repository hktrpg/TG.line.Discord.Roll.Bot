"use strict";

/**
 * Phase 3j: Discord denylist routing ??matched modules remoted by default.
 * (demo.js is excluded from analytics loader ??prove via route-table + live allow-all path)
 */
jest.setTimeout(60_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 3972;
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

describe('Phase 3j Discord denylist remote (spawned)', () => {
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

	it('Discord dice still remotes under denylist model', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '1d3',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('Discord .lang help remotes (matched module, denylist)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.lang help',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('lang');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});
});

describe('Phase 3j route-table denylist unit', () => {
	it('remotes any matched module id on Discord', () => {
		const { isRemoteAllowed, LOCAL_DISCORD_ONLY } = require('../modules/roll-worker/route-table');
		expect(isRemoteAllowed('future-new-module', 'Discord')).toBe(true);
		expect(isRemoteAllowed(null, 'Discord')).toBe(false);
		expect(LOCAL_DISCORD_ONLY.size).toBe(0);
	});

	it('LOCAL_DISCORD_ONLY still hard-blocks', () => {
		jest.resetModules();
		const route = require('../modules/roll-worker/route-table');
		route.LOCAL_DISCORD_ONLY.add('blocked-mod');
		expect(route.isRemoteAllowed('blocked-mod', 'Discord')).toBe(false);
		route.LOCAL_DISCORD_ONLY.delete('blocked-mod');
	});
});
