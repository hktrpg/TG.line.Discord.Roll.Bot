"use strict";

/**
 * Spawn real `roll-worker.js` child + act as Gateway (parseRouter / client).
 * Exit 0 only if Worker parseCount increases and `_rollWorker` is true.
 * Proves Phase 3: Discord dice + `.token help` remote; `.token` make needsLocal.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..');
const PORT = 39_61;
const URL = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGetJson(urlPath) {
	return new Promise((resolve, reject) => {
		http.get(`${URL}${urlPath}`, (res) => {
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

async function waitForHealth(timeoutMs = 20_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await httpGetJson('/health');
			if (res.status === 200 && res.body.ok) return res.body;
		} catch {
			// retry
		}
		await sleep(250);
	}
	throw new Error('Worker health timeout');
}

function assert(condition, label, detail) {
	if (!condition) {
		const err = new Error(`PROOF FAIL: ${label}`);
		err.detail = detail;
		throw err;
	}
}

function pinGatewayWorkerUrl() {
	process.env.ROLL_WORKER_URL = URL;
}

async function main() {
	pinGatewayWorkerUrl();
	process.env.ROLL_WORKER_HOST = '127.0.0.1';
	process.env.ROLL_WORKER_PORT = String(PORT);

	const child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
		cwd: ROOT,
		env: {
			...process.env,
			ROLL_WORKER_MODE: 'true',
			ROLL_WORKER_HOST: '127.0.0.1',
			ROLL_WORKER_PORT: String(PORT),
			// Do not inherit parent ROLL_WORKER_URL (may point at another port).
			ROLL_WORKER_URL: '',
			OPENAI_SWITCH: process.env.OPENAI_SWITCH || 'true',
			DISCORD_CHANNEL_SECRET: process.env.DISCORD_CHANNEL_SECRET || 'proof-secret',
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});

	let stderr = '';
	child.stderr.on('data', (d) => { stderr += d.toString(); });
	child.stdout.on('data', (d) => { process.stdout.write(`[worker] ${d}`); });

	try {
		const health0 = await waitForHealth();
		console.log('[proof] worker up', health0);

		pinGatewayWorkerUrl();
		const parseRouter = require('../modules/roll-worker/parse-router');
		const client = require('../modules/roll-worker/client');
		pinGatewayWorkerUrl();

		// 1) Non-Discord Gateway → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await parseRouter.parseInput({
				inputStr: '1d3',
				botname: 'Telegram',
				locale: 'zh-tw',
			}, { keepProof: true });
			const after = await client.health();
			assert(after.parseCount === before.parseCount + 1, 'TG parseCount++', { before, after });
			assert(result._rollWorker === true, 'TG _rollWorker', result);
			assert(Boolean(result.text) && /1d3|=\s*\d/i.test(String(result.text)), 'TG dice text', result.text);
			console.log('[proof] PASS Telegram remote', before.parseCount, '->', after.parseCount);
		}

		// 2) Discord allowlisted dice → Worker (not local-only)
		{
			const before = await client.health();
			const result = await parseRouter.parseInput({
				inputStr: '1d3',
				botname: 'Discord',
				locale: 'zh-tw',
			}, { keepProof: true });
			const after = await client.health();
			assert(after.parseCount === before.parseCount + 1, 'Discord dice parseCount++', { before, after });
			assert(result._rollWorker === true, 'Discord dice _rollWorker', result);
			console.log('[proof] PASS Discord dice remote', before.parseCount, '->', after.parseCount);
		}

		// 3) Phase 3: .token help → Worker
		{
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.token help',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'token help not needsLocal', result);
			assert(result._rollWorker === true, 'token help _rollWorker', result);
			assert(result._rollWorkerModule === 'token', 'token help module', result);
			assert(after.parseCount === before.parseCount + 1, 'token help parseCount++', { before, after });
			assert(String(result.text).length > 10, 'token help text', result.text);
			console.log('[proof] PASS Discord .token help remote');
		}

		// 4) Phase 3: .token make without avatar → needsLocal (Gateway would retry)
		{
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.token TestHero',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(result.needsLocal === true, 'token make needsLocal', result);
			assert(after.parseCount === before.parseCount, 'token make no parseCount++', { before, after });
			console.log('[proof] PASS Discord .token make needsLocal');
		}

		// 5) Phase 3c: .admin state → Worker (no longer local-only)
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.admin state',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'admin state not needsLocal', result);
			assert(result._rollWorker === true, 'admin state _rollWorker', result);
			assert(result._rollWorkerModule === 'z_admin', 'admin state module', result);
			assert(after.parseCount === before.parseCount + 1, 'admin state parseCount++', { before, after });
			console.log('[proof] PASS Discord .admin state remote');
		}

		// 5b) Phase 3c: .admin clusterhealth → needsLocal
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.admin clusterhealth',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(result.needsLocal === true, 'admin clusterhealth needsLocal', result);
			assert(after.parseCount === before.parseCount, 'admin clusterhealth no parseCount++', { before, after });
			console.log('[proof] PASS Discord .admin clusterhealth needsLocal');
		}

		// 6) Phase 3b: .ai help → Worker
		{
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.ai help',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'ai help not needsLocal', result);
			assert(result._rollWorker === true, 'ai help _rollWorker', result);
			assert(result._rollWorkerModule === 'openai', 'ai help module', result);
			assert(after.parseCount === before.parseCount + 1, 'ai help parseCount++', { before, after });
			console.log('[proof] PASS Discord .ai help remote');
		}

		// 7) Phase 3d: .ait text → Worker (no longer needsLocal)
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.ait hello',
				botname: 'Discord',
				userid: 'u-proof',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'ait not needsLocal', result);
			assert(result._rollWorker === true, 'ait _rollWorker', result);
			assert(result._rollWorkerModule === 'openai', 'ait module', result);
			assert(after.parseCount === before.parseCount + 1, 'ait parseCount++', { before, after });
			console.log('[proof] PASS Discord .ait remote (Phase 3d)');
		}

		// 8) Phase 3b: .discord help → Worker (export module)
		{
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.discord help',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'discord help not needsLocal', result);
			assert(result._rollWorker === true, 'discord help _rollWorker', result);
			assert(result._rollWorkerModule === 'export', 'discord help module', result);
			assert(after.parseCount === before.parseCount + 1, 'discord help parseCount++', { before, after });
			console.log('[proof] PASS Discord .discord help remote');
		}

		// 9) Phase 3b: .chatroom help → Worker
		{
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.chatroom help',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'chatroom help not needsLocal', result);
			assert(result._rollWorker === true, 'chatroom help _rollWorker', result);
			assert(result._rollWorkerModule === 'z_multi-server', 'chatroom help module', result);
			assert(after.parseCount === before.parseCount + 1, 'chatroom help parseCount++', { before, after });
			console.log('[proof] PASS Discord .chatroom help remote');
		}

		// 10) Phase 3c: .st help → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.st help',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'st help not needsLocal', result);
			assert(result._rollWorker === true, 'st help _rollWorker', result);
			assert(result._rollWorkerModule === 'z-story-teller', 'st help module', result);
			assert(after.parseCount === before.parseCount + 1, 'st help parseCount++', { before, after });
			console.log('[proof] PASS Discord .st help remote');
		}

		console.log('[proof] PASSED Worker+Gateway remote path (Phase 3 → 3d)');
		process.exitCode = 0;
	} catch (error) {
		console.error('[proof] ERROR', error.message || error);
		if (error.detail) console.error('[proof] detail', error.detail);
		console.error(stderr.slice(-800));
		process.exitCode = 1;
	} finally {
		child.kill('SIGTERM');
		await sleep(500);
		try { child.kill('SIGKILL'); } catch { /* ignore */ }
		// Force exit — worker child / open handles can keep the event loop alive.
		process.exit(process.exitCode || 0);
	}
}

main();
