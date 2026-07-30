"use strict";

/**
 * Live proof (outside Jest): primary + local Roll Workers + Gateway parseRouter.
 * Exit 0 when hybrid workerError falls back to local HTTP (_rollLocalWorker).
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..');
const PRIMARY_PORT = 39_81;
const LOCAL_PORT = 39_82;
const TOKEN = process.env.ROLL_WORKER_TOKEN || 'proof-local-worker-token';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(port, urlPath) {
	return new Promise((resolve, reject) => {
		http.get(`http://127.0.0.1:${port}${urlPath}`, {
			headers: { Authorization: `Bearer ${TOKEN}` },
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
		}).on('error', reject);
	});
}

async function waitHealth(port, timeoutMs = 30_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await getJson(port, '/health');
			if (res.status === 200 && res.body.ok) return res.body;
		} catch {
			// retry
		}
		await sleep(200);
	}
	throw new Error(`health timeout :${port}`);
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
			ROLL_LOCAL_WORKER_URL: '',
			ROLL_LOCAL_WORKER_SPAWN: 'false',
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

function assert(cond, label) {
	if (!cond) throw new Error(`PROOF FAIL: ${label}`);
}

async function main() {
	let primary = spawnWorker(PRIMARY_PORT);
	let local = spawnWorker(LOCAL_PORT);
	try {
		await Promise.all([waitHealth(PRIMARY_PORT), waitHealth(LOCAL_PORT)]);
		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PRIMARY_PORT}`;
		process.env.ROLL_LOCAL_WORKER_URL = `http://127.0.0.1:${LOCAL_PORT}`;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		process.env.ROLL_WORKER_REMOTE_ONLY = 'false';

		const client = require('../modules/roll-worker/client');
		assert(client.isLocalEnabled() === true, 'local worker URL enabled (distinct from primary)');
		assert(client.isEnabled() === true, 'primary worker URL enabled');

		const parseRouter = require('../modules/roll-worker/parse-router');
		const remote = await parseRouter.parseInput({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		}, { keepProof: true });
		assert(remote._rollWorker === true, 'primary remote _rollWorker');
		console.log('OK primary remote parse');

		const beforeLocal = await getJson(LOCAL_PORT, '/health');
		await killChild(primary);
		primary = null;
		await sleep(300);

		const fallback = await parseRouter.parseInput({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		}, { keepProof: true });
		assert(fallback._rollLocalWorker === true, 'fallback _rollLocalWorker');
		assert(fallback._rollWorker === false, 'fallback _rollWorker false');
		assert(Boolean(fallback.text), 'fallback text');
		const afterLocal = await getJson(LOCAL_PORT, '/health');
		assert(
			afterLocal.body.parseCount > beforeLocal.body.parseCount,
			'local parseCount increased'
		);
		console.log('OK hybrid fallback → local HTTP');

		// Three-way: local HTTP down → Gateway in-process analytics.
		await killChild(local);
		local = null;
		await sleep(300);
		const mainFb = await parseRouter.parseInput({
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		}, { keepProof: true });
		assert(mainFb._rollLocalWorker !== true, 'no _rollLocalWorker after local killed');
		assert(mainFb._rollWorker === false, 'main-thread proof marker');
		assert(Boolean(mainFb.text), 'in-process fallback text');
		console.log('OK hybrid fallback → in-process after local down');

		// Reload proof against a fresh local worker (external, no PM2 → shutdown-sent).
		local = spawnWorker(LOCAL_PORT);
		await waitHealth(LOCAL_PORT);
		process.env.ROLL_LOCAL_WORKER_URL = `http://127.0.0.1:${LOCAL_PORT}`;
		const localWorker = require('../modules/roll-worker/local-worker');
		const reload = await localWorker.restartStandby({ drainMs: 200 });
		assert(
			reload.ok === true
			&& ['shutdown-sent', 'supervised-respawn', 'external-restart', 'self-restart', 'ensure-spawn'].includes(reload.mode),
			`restart standby mode=${reload.mode} ok=${reload.ok} error=${reload.error || ''}`
		);
		console.log('OK .root restart standby path:', reload.mode);
		local = null; // process exiting via shutdown
		console.log('PROOF PASSED Phase A/B local worker');
	} finally {
		await killChild(primary);
		await killChild(local);
	}
}

main()
	.then(() => {
		// analytics/mongoose timers may keep the event loop alive
		// eslint-disable-next-line n/no-process-exit
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		// eslint-disable-next-line n/no-process-exit
		process.exit(1);
	});
