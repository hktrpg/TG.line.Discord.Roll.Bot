"use strict";

/**
 * Live proof: spawn real `roll-worker.js`, Gateway uses HTTP client (same as parse-router remote path).
 * Strict: health.parseCount++ and body._rollWorker === true.
 * (Avoid requiring analytics inside Jest — logs.js top-level return breaks Babel.)
 */
jest.setTimeout(60_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 39_63;

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

describe('roll-worker live Worker+Gateway proof (spawned process)', () => {
	let child;
	let client;
	const prevUrl = process.env.ROLL_WORKER_URL;

	beforeAll(async () => {
		const TOKEN = process.env.ROLL_WORKER_TOKEN || 'live-integration-token';
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
		delete process.env.ROLL_WORKER_TOKEN;
		if (child && !child.killed) {
			child.kill('SIGTERM');
			await sleep(400);
			try { child.kill('SIGKILL'); } catch { /* ignore */ }
		}
	});

	it('Gateway HTTP parse hits Worker (parseCount + _rollWorker)', async () => {
		expect(client.isEnabled()).toBe(true);
		const before = await client.health();

		const result = await client.parse({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		});

		const after = await client.health();
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(result._rollWorker).toBe(true);
		expect(String(result.text)).toMatch(/1d3|=\s*\d/i);
	});

	it('Discord allowlisted dice hits Worker remotely', async () => {
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
		expect(String(result.text)).toMatch(/1d3|=\s*\d/i);
	});

	it('Discord .token help hits Worker (Phase 3 remote)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.token help',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('token');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text).length).toBeGreaterThan(10);
	});

	it('Discord .token make without avatarUrl returns needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.token TestHero',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('Discord .admin state hits Worker (Phase 3c remote)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin state',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z_admin');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});

	it('Discord .admin clusterhealth returns needsLocal without parseCount++', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin clusterhealth',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});
});
