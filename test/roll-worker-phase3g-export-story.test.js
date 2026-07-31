"use strict";

/**
 * Phase 3g: export html|txt with Gateway-prefetched history ??Worker remote;
 * story list / update with meta ??Worker remote.
 */
jest.setTimeout(90_000);

const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 3969;
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

const SAMPLE_HISTORY = {
	sum_messages: [
		{
			timestamp: Date.now(),
			contact: 'phase3g export proof line',
			userName: 'proof-user',
			isbot: false,
			attachments: [],
			embeds: [],
		},
	],
	totalSize: 1,
};

describe('Phase 3g export/story Worker remote (spawned)', () => {
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

	it('.discord html without history meta still needsLocal', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.discord html',
			botname: 'Discord',
			groupid: `g-phase3g-nl-${Date.now()}`,
			channelid: `c-phase3g-nl-${Date.now()}`,
			userrole: 3,
			userid: `u-phase3g-nl-${Date.now()}`,
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBe(true);
		expect(after.parseCount).toBe(before.parseCount);
	});

	it('.discord html with exportHistoryMeta hits Worker (not needsLocal)', async () => {
		const stamp = Date.now();
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.discord html',
			botname: 'Discord',
			groupid: `g-phase3g-html-${stamp}`,
			channelid: `c-phase3g-html-${stamp}`,
			userrole: 3,
			userid: `u-phase3g-html-${stamp}`,
			locale: 'zh-tw',
			exportMeta: { hasReadPermission: true, channelName: 'proof-channel' },
			exportHistoryMeta: SAMPLE_HISTORY,
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('export');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
		expect(result.discordExportHtml).toBeTruthy();
	});

	it('.discord txt with exportHistoryMeta hits Worker (not needsLocal)', async () => {
		const stamp = Date.now();
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.discord txt',
			botname: 'Discord',
			groupid: `g-phase3g-txt-${stamp}`,
			channelid: `c-phase3g-txt-${stamp}`,
			userrole: 3,
			userid: `u-phase3g-txt-${stamp}`,
			locale: 'zh-tw',
			exportMeta: { hasReadPermission: true, channelName: 'proof-txt' },
			exportHistoryMeta: SAMPLE_HISTORY,
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('export');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(result.discordExport).toBeTruthy();
	});

	it('.st list hits Worker remotely (Mongo path, no Discord client)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.st list',
			botname: 'Discord',
			userid: 'u-phase3g-st',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(result._rollWorkerModule).toBe('z-story-teller');
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});

	it('.st update with storyAttachmentMeta hits Worker (not needsLocal)', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '.st update remotealias',
			botname: 'Discord',
			userid: 'u-phase3g-st',
			locale: 'zh-tw',
			storyAttachmentMeta: {
				url: 'https://example.invalid/story-missing.json',
				filename: 'story-missing.json',
				size: 10,
				contentType: 'application/json',
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
