"use strict";

/**
 * Phase A live: spawn primary + local Roll Workers; Gateway client hits both.
 * parse-router routing is covered in roll-worker-parse-router.test.js (mocked).
 * Full parseRouter+HTTP proof: yarn proof:local-worker (outside Jest / Babel).
 */
jest.setTimeout(90_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PRIMARY_PORT = 3971;
const LOCAL_PORT = 3972;
const TOKEN = 'phase-a-local-http-token';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(port, urlPath, { auth = false } = {}) {
	return new Promise((resolve, reject) => {
		const headers = {};
		if (auth) headers.Authorization = `Bearer ${TOKEN}`;
		http.get(`http://127.0.0.1:${port}${urlPath}`, { headers }, (res) => {
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

async function waitHealth(port, timeoutMs = 30_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await getJson(port, '/health', { auth: true });
			if (res.status === 200 && res.body.ok) return res.body;
		} catch {
			// retry
		}
		await sleep(200);
	}
	throw new Error(`worker health timeout :${port}`);
}

function spawnWorker(port) {
	return spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
		cwd: ROOT,
		env: {
			...process.env,
			ROLL_WORKER_MODE: 'true',
			ROLL_WORKER_HOST: '127.0.0.1',
			ROLL_WORKER_PORT: String(port),
			ROLL_WORKER_TOKEN: TOKEN,
			ROLL_WORKER_URL: '',
			ROLL_STANDBY_URL: '',
			ROLL_WORKER_SPAWN: 'false', ROLL_STANDBY_SPAWN: 'false',
			ROLL_WORKER_REMOTE_ONLY: 'false',
			OPENAI_SWITCH: process.env.OPENAI_SWITCH || 'true',
			DISCORD_CHANNEL_SECRET: process.env.DISCORD_CHANNEL_SECRET || 'proof-secret',
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

async function killChild(child) {
	if (!child || child.killed) return;
	child.kill('SIGTERM');
	await sleep(400);
	try { child.kill('SIGKILL'); } catch { /* ignore */ }
}

describe('Phase A local HTTP workers (live client)', () => {
	let primary;
	let local;
	let client;
	const prev = {
		url: process.env.ROLL_WORKER_URL,
		localUrl: process.env.ROLL_STANDBY_URL,
		token: process.env.ROLL_WORKER_TOKEN,
	};

	beforeAll(async () => {
		primary = spawnWorker(PRIMARY_PORT);
		local = spawnWorker(LOCAL_PORT);
		await Promise.all([waitHealth(PRIMARY_PORT), waitHealth(LOCAL_PORT)]);

		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PRIMARY_PORT}`;
		process.env.ROLL_STANDBY_URL = `http://127.0.0.1:${LOCAL_PORT}`;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		jest.resetModules();
		client = require('../modules/roll-worker/client');
	});

	afterAll(async () => {
		if (prev.url === undefined) delete process.env.ROLL_WORKER_URL;
		else process.env.ROLL_WORKER_URL = prev.url;
		if (prev.localUrl === undefined) delete process.env.ROLL_STANDBY_URL;
		else process.env.ROLL_STANDBY_URL = prev.localUrl;
		if (prev.token === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prev.token;
		await killChild(primary);
		await killChild(local);
	});

	it('primary client.parse hits Worker', async () => {
		expect(client.isEnabled()).toBe(true);
		expect(client.isLocalEnabled()).toBe(true);
		const before = await client.health();
		const result = await client.parse({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
	});

	it('client.parseLocal hits local Worker independently', async () => {
		const before = await getJson(LOCAL_PORT, '/health', { auth: true });
		const result = await client.parseLocal({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		});
		const after = await getJson(LOCAL_PORT, '/health', { auth: true });
		expect(result._rollWorker).toBe(true);
		expect(after.body.parseCount).toBe(before.body.parseCount + 1);
	});

	it('after primary kill, parseLocal still works (fallback target)', async () => {
		await killChild(primary);
		primary = null;
		await sleep(300);
		await expect(client.parse({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		})).rejects.toBeTruthy();

		const result = await client.parseLocal({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		});
		expect(result._rollWorker).toBe(true);
		expect(String(result.text)).toMatch(/1d3|=\s*\d/i);
	});
});
