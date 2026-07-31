"use strict";

/**
 * Phase 3k: .st mylist group-name prefetch + separation-complete inventory lock.
 */
jest.setTimeout(60_000);

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const http = require('node:http');

const ROOT = path.join(__dirname, '..');
const PORT = 3973;
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

describe('Phase 3k storyGroupNames + inventory (spawned)', () => {
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

	it('.st mylist with storyGroupNamesMeta hits Worker remotely', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.st mylist',
			botname: 'Discord',
			userid: `u-phase3k-${Date.now()}`,
			locale: 'zh-tw',
			storyGroupNamesMeta: {
				'111222333444555666': 'ProofGuildChannel',
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z-story-teller');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});
});

describe('Phase 3k resolveStoryGroupName unit', () => {
	it('prefers storyGroupNamesMeta over live client', async () => {
		const { resolveStoryGroupName } = require('../modules/roll-worker/discord-prefetch');
		const name = await resolveStoryGroupName('99', {
			discordClient: {
				channels: { fetch: async () => ({ name: 'should-not-use' }) },
			},
			storyGroupNamesMeta: { 99: 'FromMeta' },
		});
		expect(name).toBe('FromMeta');
	});

	it('returns empty without meta or client', async () => {
		const { resolveStoryGroupName } = require('../modules/roll-worker/discord-prefetch');
		expect(await resolveStoryGroupName('1', {})).toBe('');
	});

	it('prefetchStoryGroupNames returns null without client', async () => {
		const { prefetchStoryGroupNames } = require('../modules/roll-worker/discord-prefetch');
		expect(await prefetchStoryGroupNames(null, { userid: 'u1' })).toBeNull();
	});
});

describe('Phase 3k separation inventory lock', () => {
	it('only known roll modules contain needsLocal returns', () => {
		const rollDir = path.join(ROOT, 'roll');
		const allowed = new Set([
			'export.js',
			'z-story-teller.js',
			'z_multi-server.js',
			'forward.js',
			'z_admin.js',
			'token.js',
			'openai.js',
		]);
		const offenders = [];
		for (const file of fs.readdirSync(rollDir)) {
			if (!file.endsWith('.js')) continue;
			const text = fs.readFileSync(path.join(rollDir, file), 'utf8');
			if (!/needsLocal\s*:\s*true/.test(text)) continue;
			if (!allowed.has(file)) offenders.push(file);
		}
		expect(offenders).toEqual([]);
	});

	it('LOCAL_DISCORD_ONLY stays empty (denylist complete)', () => {
		const { LOCAL_DISCORD_ONLY, isRemoteAllowed } = require('../modules/roll-worker/route-table');
		expect(LOCAL_DISCORD_ONLY.size).toBe(0);
		expect(isRemoteAllowed('any-matched-module', 'Discord')).toBe(true);
		expect(isRemoteAllowed(null, 'Discord')).toBe(false);
	});
});
