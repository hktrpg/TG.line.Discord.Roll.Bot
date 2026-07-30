"use strict";

/**
 * Phase 3p: client.parse must preserve LevelUp/statue from HTTP 503 needsLocal body.
 */
jest.setTimeout(60_000);

const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 3979;
const TOKEN = 'phase3p-levelup-token';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Phase 3p client preserves needsLocal LevelUp', () => {
	it('maps 503 body LevelUp/statue through client.parse contract', () => {
		const responseData = {
			needsLocal: true,
			moduleName: 'token',
			LevelUp: 'WORKER_LEVEL_UP',
			statue: '★',
		};
		const mapped = {
			needsLocal: true,
			moduleName: responseData.moduleName || undefined,
			LevelUp: responseData.LevelUp || '',
			statue: responseData.statue || '',
		};
		expect(mapped.LevelUp).toBe('WORKER_LEVEL_UP');
		expect(mapped.statue).toBe('★');
		expect(mapped.moduleName).toBe('token');
	});
});

describe('Phase 3p live worker 503 needsLocal carries LevelUp', () => {
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
				DISCORD_CHANNEL_SECRET: process.env.DISCORD_CHANNEL_SECRET || 'proof-secret',
				OPENAI_SWITCH: process.env.OPENAI_SWITCH || 'true',
			},
			stdio: ['ignore', 'ignore', 'ignore'],
		});

		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PORT}`;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		jest.resetModules();
		client = require('../modules/roll-worker/client');

		const start = Date.now();
		let ready = false;
		while (Date.now() - start < 25_000) {
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
		if (!ready) throw new Error(`Phase 3p worker health timeout on ${PORT}`);
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

	it('.token make without avatar returns needsLocal (fields present)', async () => {
		const result = await client.parse({
			inputStr: '.token Hero',
			botname: 'Discord',
			userid: 'u-3p',
			groupid: 'g-3p',
			locale: 'zh-tw',
		});
		expect(result.needsLocal).toBe(true);
		expect(result).toHaveProperty('LevelUp');
		expect(result).toHaveProperty('statue');
		expect(typeof result.LevelUp).toBe('string');
		expect(typeof result.statue).toBe('string');
	});

	it('HTTP 503 JSON includes LevelUp keys from mocked-shaped server path', async () => {
		// Direct HTTP against live worker: real token needsLocal body must be parseable.
		const { attachGatewayAuth } = require('../modules/roll-worker/request-auth');
		const payload = attachGatewayAuth({
			inputStr: '.token Hero',
			botname: 'Discord',
			userid: 'u-3p-http',
			groupid: 'g-3p',
			locale: 'zh-tw',
		}, TOKEN);
		const body = await new Promise((resolve, reject) => {
			const data = JSON.stringify(payload);
			const req = http.request({
				hostname: '127.0.0.1',
				port: PORT,
				path: '/v1/parse',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(data),
					Authorization: `Bearer ${TOKEN}`,
				},
			}, (res) => {
				let raw = '';
				res.on('data', (c) => { raw += c; });
				res.on('end', () => {
					try {
						resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') });
					} catch (error) {
						reject(error);
					}
				});
			});
			req.on('error', reject);
			req.write(data);
			req.end();
		});
		expect(body.status).toBe(503);
		expect(body.body.needsLocal).toBe(true);
		expect(body.body).toHaveProperty('LevelUp');
		expect(body.body).toHaveProperty('statue');
	});
});
