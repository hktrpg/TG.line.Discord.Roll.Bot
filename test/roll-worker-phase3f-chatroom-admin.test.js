"use strict";

/**
 * Phase 3f: chatroom create with channel meta + expanded admin remote.
 */
jest.setTimeout(120_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 3968;
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

describe('Phase 3f chatroom/admin expanded remote (spawned)', () => {
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

	it('.chatroom create without meta needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.chatroom create 123456789012345678',
			botname: 'Discord',
			userid: 'u1',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.chatroom create with chatroomChannelMeta hits Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.chatroom create 123456789012345678',
			botname: 'Discord',
			userid: 'u1',
			locale: 'zh-tw',
			chatroomChannelMeta: {
				allowed: true,
				channelId: '123456789012345678',
				guildId: 'g1',
				guildName: 'Guild',
				channelName: 'general',
			},
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z_multi-server');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});

	it('.admin registerchannel hits Worker (expanded remote)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.admin registerChannel',
			botname: 'Discord',
			userid: 'u1',
			groupid: 'g1',
			channelid: 'c1',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z_admin');
		expect(after.parseCount).toBe(before.parseCount + 1);
	});

	it('.root schedule hits Worker (expanded remote)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.root schedule',
			botname: 'Discord',
			userid: 'not-admin',
			locale: 'zh-tw',
		});
		const after = await client.health();
		// Non-admin gets root_admin_only text, but path is remote (not needsLocal)
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
	});
});

describe('Phase 3f prefetchChatroomChannel unit', () => {
	it('returns null without client', async () => {
		const { prefetchChatroomChannel } = require('../modules/roll-worker/discord-prefetch');
		const out = await prefetchChatroomChannel(null, { channelId: '1', userid: 'u' });
		expect(out).toBeNull();
	});
});
