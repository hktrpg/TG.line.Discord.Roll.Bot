"use strict";

/**
 * Phase 3e: story import + forward create with Gateway-prefetched meta → Worker remote.
 */
jest.setTimeout(120_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 3967;
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

describe('Phase 3e story/forward prefetch remote (spawned)', () => {
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

	it('.st import without meta still needsLocal', async () => {
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

	it('.st import with storyAttachmentMeta hits Worker (not needsLocal)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.st import remotealias',
			botname: 'Discord',
			userid: 'u1',
			locale: 'zh-tw',
			storyAttachmentMeta: {
				url: 'https://example.invalid/story-missing.json',
				filename: 'story-missing.json',
				size: 10,
				contentType: 'application/json',
			},
		});
		const after = await client.health();
		// Download will fail → user-facing error text, but path is remote
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z-story-teller');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('.forward create without meta needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.forward https://discord.com/channels/1/2/3',
			botname: 'Discord',
			groupid: '1',
			userid: 'u1',
			channelid: '99',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.forward create with forwardSourceMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.forward https://discord.com/channels/1/2/3',
			botname: 'Discord',
			groupid: '1',
			userid: 'u1',
			channelid: '99',
			locale: 'zh-tw',
			forwardSourceMeta: {
				sourceGuildId: '1',
				sourceChannelId: '2',
				sourceMessageId: '3',
				guildId: '1',
				messageContent: '測試角色的角色',
				isMentioned: true,
				isInteractionUser: false,
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('forward');
		expect(after.parseCount).toBe(before.parseCount + 1);
		// May fail Mongo or succeed — either way remote path proven
		expect(result).toHaveProperty('text');
	});
});
