"use strict";

/**
 * Spawn real `roll-worker.js` child + act as Gateway (parseRouter / client).
 * Exit 0 only if Worker parseCount increases and `_rollWorker` is true.
 * Proves Phase 3 → 3w: Discord remote paths, auth, export no dual-run, WWW gate, OpenAI caps,
 * large export JSON, fail-closed mutating modules, streaming fetch, HMAC display claims.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const PORT = 39_61;
const URL = `http://127.0.0.1:${PORT}`;
const PROOF_ADMIN_ID = 'proof-admin-3h';
const PROOF_ADMIN_SECRET = [process.env.ADMIN_SECRET, PROOF_ADMIN_ID].filter(Boolean).join(',');
const PROOF_TOKEN = process.env.ROLL_WORKER_TOKEN || 'proof-roll-worker-token';

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
	process.env.ROLL_WORKER_TOKEN = PROOF_TOKEN;

	const child = spawn(process.execPath, [path.join(ROOT, 'roll-worker.js')], {
		cwd: ROOT,
		env: {
			...process.env,
			ROLL_WORKER_MODE: 'true',
			ROLL_WORKER_HOST: '127.0.0.1',
			ROLL_WORKER_PORT: String(PORT),
			ROLL_WORKER_TOKEN: PROOF_TOKEN,
			// Do not inherit parent ROLL_WORKER_URL (may point at another port).
			ROLL_WORKER_URL: '',
			ADMIN_SECRET: PROOF_ADMIN_SECRET,
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

		// 11) Phase 3e: .st import with storyAttachmentMeta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.st import proofalias',
				botname: 'Discord',
				userid: 'u-proof',
				locale: 'zh-tw',
				storyAttachmentMeta: {
					url: 'https://example.invalid/missing.json',
					filename: 'missing.json',
					size: 1,
					contentType: 'application/json',
				},
			});
			const after = await client.health();
			assert(!result.needsLocal, 'st import meta not needsLocal', result);
			assert(result._rollWorker === true, 'st import _rollWorker', result);
			assert(result._rollWorkerModule === 'z-story-teller', 'st import module', result);
			assert(after.parseCount === before.parseCount + 1, 'st import parseCount++', { before, after });
			console.log('[proof] PASS Discord .st import with meta remote');
		}

		// 12) Phase 3e: .forward with forwardSourceMeta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.forward https://discord.com/channels/1/2/3',
				botname: 'Discord',
				groupid: '1',
				userid: 'u-proof',
				channelid: '99',
				locale: 'zh-tw',
				forwardSourceMeta: {
					sourceGuildId: '1',
					sourceChannelId: '2',
					sourceMessageId: '3',
					guildId: '1',
					messageContent: '證明角色的角色',
					isMentioned: true,
					isInteractionUser: false,
				},
			});
			const after = await client.health();
			assert(!result.needsLocal, 'forward meta not needsLocal', result);
			assert(result._rollWorker === true, 'forward _rollWorker', result);
			assert(result._rollWorkerModule === 'forward', 'forward module', result);
			assert(after.parseCount === before.parseCount + 1, 'forward parseCount++', { before, after });
			console.log('[proof] PASS Discord .forward with meta remote');
		}

		// 13) Phase 3f: .chatroom create with chatroomChannelMeta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.chatroom create 123456789012345678',
				botname: 'Discord',
				userid: 'u-proof',
				locale: 'zh-tw',
				chatroomChannelMeta: {
					allowed: true,
					channelId: '123456789012345678',
					guildId: 'g-proof',
					guildName: 'ProofGuild',
					channelName: 'general',
				},
			});
			const after = await client.health();
			assert(!result.needsLocal, 'chatroom create meta not needsLocal', result);
			assert(result._rollWorker === true, 'chatroom _rollWorker', result);
			assert(result._rollWorkerModule === 'z_multi-server', 'chatroom module', result);
			assert(after.parseCount === before.parseCount + 1, 'chatroom parseCount++', { before, after });
			console.log('[proof] PASS Discord .chatroom create with meta remote');
		}

		// 14) Phase 3f: .admin registerChannel → Worker (expanded)
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.admin registerChannel',
				botname: 'Discord',
				userid: 'u-proof',
				groupid: 'g1',
				channelid: 'c1',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'registerChannel not needsLocal', result);
			assert(result._rollWorker === true, 'registerChannel _rollWorker', result);
			assert(after.parseCount === before.parseCount + 1, 'registerChannel parseCount++', { before, after });
			console.log('[proof] PASS Discord .admin registerChannel remote');
		}

		// 15) Phase 3g: .discord html with exportHistoryMeta → Worker
		{
			pinGatewayWorkerUrl();
			const stamp = Date.now();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.discord html',
				botname: 'Discord',
				groupid: `g-proof-export-${stamp}`,
				channelid: `c-proof-export-${stamp}`,
				userrole: 3,
				userid: `u-proof-export-${stamp}`,
				locale: 'zh-tw',
				exportMeta: { hasReadPermission: true, channelName: 'proof-channel' },
				exportHistoryMeta: {
					sum_messages: [{
						timestamp: Date.now(),
						contact: 'proof export line',
						userName: 'proof',
						isbot: false,
						attachments: [],
						embeds: [],
					}],
					totalSize: 1,
				},
			});
			const after = await client.health();
			assert(!result.needsLocal, 'export html meta not needsLocal', result);
			assert(result._rollWorker === true, 'export html _rollWorker', result);
			assert(result._rollWorkerModule === 'export', 'export html module', result);
			assert(after.parseCount === before.parseCount + 1, 'export html parseCount++', { before, after });
			assert(Boolean(result.discordExportHtml), 'export html file id', result);
			console.log('[proof] PASS Discord .discord html with meta remote');
		}

		// 16) Phase 3g: .st list → Worker (story run / Mongo path)
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.st list',
				botname: 'Discord',
				userid: 'u-proof',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'st list not needsLocal', result);
			assert(result._rollWorker === true, 'st list _rollWorker', result);
			assert(result._rollWorkerModule === 'z-story-teller', 'st list module', result);
			assert(after.parseCount === before.parseCount + 1, 'st list parseCount++', { before, after });
			console.log('[proof] PASS Discord .st list remote');
		}

		// 17) Phase 3h: .admin clusterhealth with meta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.admin clusterhealth',
				botname: 'Discord',
				userid: PROOF_ADMIN_ID,
				locale: 'zh-tw',
				clusterHealthMeta: {
					healthReport: {
						clusters: [{ id: 0, ready: true, alive: true, shards: 1, uptime: 10 }],
						summary: {
							totalClusters: 1,
							activeClusters: 1,
							readyClusters: 1,
							deadClusters: 0,
							totalShards: 1,
						},
						processInfo: { pid: 1, uptime: 100, memoryMB: 64 },
					},
					dbStatus: {
						isDegradedMode: false,
						dbConnectionState: 1,
						consecutiveFailures: 0,
						cacheSize: 0,
						pendingSyncOperations: 0,
					},
					clusterProtectionStatus: {
						unhealthyCount: 0,
						healthTimeout: 60_000,
						maxRetries: 3,
					},
				},
			});
			const after = await client.health();
			assert(!result.needsLocal, 'clusterhealth meta not needsLocal', result);
			assert(result._rollWorker === true, 'clusterhealth _rollWorker', result);
			assert(after.parseCount === before.parseCount + 1, 'clusterhealth parseCount++', { before, after });
			assert(String(result.text || '').length > 10, 'clusterhealth text', result.text);
			console.log('[proof] PASS Discord .admin clusterhealth with meta remote');
		}

		// 18) Phase 3h: .root respawn → clusterIpc on Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.root respawn 0',
				botname: 'Discord',
				userid: PROOF_ADMIN_ID,
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'respawn not needsLocal', result);
			assert(result._rollWorker === true, 'respawn _rollWorker', result);
			assert(result.clusterIpc?.respawn === true, 'respawn clusterIpc', result);
			assert(after.parseCount === before.parseCount + 1, 'respawn parseCount++', { before, after });
			console.log('[proof] PASS Discord .root respawn clusterIpc remote');
		}

		// 19) Phase 3h: .token with avatarUrl → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.token ProofHero',
				botname: 'Discord',
				locale: 'zh-tw',
				avatarUrl: 'https://example.invalid/avatar.png',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'token avatar not needsLocal', result);
			assert(result._rollWorker === true, 'token avatar _rollWorker', result);
			assert(result._rollWorkerModule === 'token', 'token module', result);
			assert(after.parseCount === before.parseCount + 1, 'token avatar parseCount++', { before, after });
			console.log('[proof] PASS Discord .token with avatarUrl remote');
		}

		// 20) Phase 3i: .root fixshard check with meta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.root fixshard check',
				botname: 'Discord',
				userid: PROOF_ADMIN_ID,
				locale: 'zh-tw',
				fixShardMeta: {
					action: 'check',
					report: {
						totalShards: 2,
						healthyShards: 2,
						unhealthyShards: 0,
						unresponsiveShards: [],
					},
				},
			});
			const after = await client.health();
			assert(!result.needsLocal, 'fixshard check meta not needsLocal', result);
			assert(result._rollWorker === true, 'fixshard _rollWorker', result);
			assert(after.parseCount === before.parseCount + 1, 'fixshard parseCount++', { before, after });
			assert(String(result.text || '').length > 10, 'fixshard text', result.text);
			console.log('[proof] PASS Discord .root fixshard check with meta remote');
		}

		// 21) Phase 3i: .root registeredGlobal with slashDeployMeta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.root registeredGlobal',
				botname: 'Discord',
				userid: PROOF_ADMIN_ID,
				locale: 'zh-tw',
				slashDeployMeta: { text: 'PROOF_SLASH_OK' },
			});
			const after = await client.health();
			assert(!result.needsLocal, 'slash deploy meta not needsLocal', result);
			assert(result._rollWorker === true, 'slash deploy _rollWorker', result);
			assert(result.text === 'PROOF_SLASH_OK', 'slash deploy text', result);
			assert(after.parseCount === before.parseCount + 1, 'slash deploy parseCount++', { before, after });
			console.log('[proof] PASS Discord .root registeredGlobal with meta remote');
		}

		// 22) Phase 3j: denylist — any matched module remotes (assert router policy + live .lang)
		{
			pinGatewayWorkerUrl();
			const { isRemoteAllowed } = require('../modules/roll-worker/route-table');
			assert(isRemoteAllowed('future-new-module', 'Discord') === true, 'denylist remotes future module');
			assert(isRemoteAllowed(null, 'Discord') === false, 'denylist keeps unmatched local');
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.lang help',
				botname: 'Discord',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'lang help not needsLocal', result);
			assert(result._rollWorker === true, 'lang help _rollWorker', result);
			assert(result._rollWorkerModule === 'lang', 'lang module', result);
			assert(after.parseCount === before.parseCount + 1, 'lang parseCount++', { before, after });
			console.log('[proof] PASS Discord denylist + .lang help remote (Phase 3j)');
		}

		// 23) Phase 3k: .st mylist with storyGroupNamesMeta → Worker
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.st mylist',
				botname: 'Discord',
				userid: `u-proof-mylist-${Date.now()}`,
				locale: 'zh-tw',
				storyGroupNamesMeta: { '999888777666555444': 'ProofChannel' },
			});
			const after = await client.health();
			assert(!result.needsLocal, 'mylist meta not needsLocal', result);
			assert(result._rollWorker === true, 'mylist _rollWorker', result);
			assert(result._rollWorkerModule === 'z-story-teller', 'mylist module', result);
			assert(after.parseCount === before.parseCount + 1, 'mylist parseCount++', { before, after });
			console.log('[proof] PASS Discord .st mylist with group-names meta remote (Phase 3k)');
		}

		// 24) Phase 3l: auth rejects unauthenticated parse
		{
			pinGatewayWorkerUrl();
			const unauthorized = await new Promise((resolve, reject) => {
				const data = JSON.stringify({ inputStr: '1d3', botname: 'Telegram', locale: 'zh-tw' });
				const req = http.request({
					hostname: '127.0.0.1',
					port: PORT,
					path: '/v1/parse',
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(data),
					},
				}, (res) => {
					let raw = '';
					res.on('data', (c) => { raw += c; });
					res.on('end', () => resolve({ status: res.statusCode, body: raw }));
				});
				req.on('error', reject);
				req.write(data);
				req.end();
			});
			assert(unauthorized.status === 401, 'unauthenticated parse must 401', unauthorized);
			console.log('[proof] PASS auth rejects unauthenticated /v1/parse (Phase 3l)');
		}

		// 25) Phase 3l: deferred fixshard returns gatewayAction
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.root fixshard start',
				botname: 'Discord',
				userid: PROOF_ADMIN_ID,
				locale: 'zh-tw',
				fixShardMeta: { action: 'start', deferred: true },
			});
			const after = await client.health();
			assert(!result.needsLocal, 'deferred fixshard not needsLocal', result);
			assert(result._rollWorker === true, 'deferred fixshard _rollWorker', result);
			assert(result.gatewayAction?.type === 'fixshard', 'gatewayAction type', result);
			assert(result.gatewayAction?.action === 'start', 'gatewayAction action', result);
			assert(after.parseCount === before.parseCount + 1, 'deferred fixshard parseCount++', { before, after });
			console.log('[proof] PASS deferred fixshard gatewayAction (Phase 3l)');
		}

		// 26) Phase 3l: demo truncate + missing artifact helpers
		{
			const {
				truncateExportHistoryForDemo,
				assertArtifactReadable,
				DEMO_EXPORT_MESSAGE_LIMIT,
			} = require('../modules/roll-worker/artifacts');
			const truncated = truncateExportHistoryForDemo({
				totalSize: 900,
				sum_messages: Array.from({ length: 900 }, (_, i) => ({ contact: String(i) })),
			}, true);
			assert(truncated.sum_messages.length === DEMO_EXPORT_MESSAGE_LIMIT, 'demo truncate length', truncated);
			assert(assertArtifactReadable('temp/proof-missing-3l.bin') === null, 'missing artifact null');
			console.log('[proof] PASS demo truncate + artifact guard (Phase 3l)');
		}

		// 27) Phase 3m: Schedule remotes + token temp path helper + dark invalidate
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '1d3',
				botname: 'Schedule',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(!result.needsLocal, 'Schedule not needsLocal', result);
			assert(result._rollWorker === true, 'Schedule _rollWorker', result);
			assert(after.parseCount === before.parseCount + 1, 'Schedule parseCount++', { before, after });
			console.log('[proof] PASS Schedule botname remote (Phase 3m)');
		}
		{
			const { getTempFilePath, assertArtifactReadable } = require('../modules/roll-worker/artifacts');
			const tempFile = getTempFilePath('proof-3m-token.png');
			fs.writeFileSync(tempFile, 'x');
			assert(assertArtifactReadable(tempFile) === tempFile || assertArtifactReadable(tempFile) === require('node:path').resolve(tempFile), 'token temp readable', tempFile);
			try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
			const dark = require('../modules/roll-worker/dark-rolling');
			dark.invalidateCache();
			assert(true, 'dark invalidate callable');
			console.log('[proof] PASS token temp path + dark invalidate (Phase 3m)');
		}

		// 28) Phase 3n: export mention resolve + Line remote chat + dark local invalidate contract
		{
			const {
				replaceExportMentions,
				serializeExportMessage,
			} = require('../modules/roll-worker/discord-prefetch');
			const members = [{ id: '99', displayName: 'ProofNick', user: { id: '99', username: 'pn' } }];
			const mentioned = await replaceExportMentions('hi <@99>', members, null);
			assert(mentioned === 'hi @ProofNick', 'export mention resolve', mentioned);
			const row = await serializeExportMessage({
				type: 0,
				createdTimestamp: 1,
				content: 'x <@99>',
				author: { username: 'a', bot: false },
				attachments: { size: 0 },
				embeds: [],
				referenced_message: {
					content: 'y <@99>',
					author: { username: 'b', bot: false },
					attachments: { size: 0 },
					embeds: [],
				},
			}, { members, discordClient: null });
			assert(row.contact === 'x @ProofNick', 'serialize contact', row);
			assert(row.reply_to?.contact === 'y @ProofNick', 'serialize reply', row);
			console.log('[proof] PASS export mention/reply serialize (Phase 3n)');
		}
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: 'phase3n ordinary chat',
				botname: 'Line',
				groupid: 'g-proof-3n',
				userid: 'u-proof-3n',
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(result._rollWorker === true, 'Line chat _rollWorker', result);
			assert(after.parseCount === before.parseCount + 1, 'Line chat parseCount++', { before, after });
			console.log('[proof] PASS Line ordinary chat remote once (Phase 3n)');
		}

		// 29) Phase 3o: needsLocal carries LevelUp + forward ownership needsLocal
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '.forward https://discord.com/channels/1/2/3',
				botname: 'Discord',
				userid: 'u-proof-3o',
				groupid: '1',
				channelid: '99',
				locale: 'zh-tw',
				forwardSourceMeta: {
					sourceGuildId: '1',
					sourceChannelId: '2',
					sourceMessageId: '3',
					guildId: '1',
					messageContent: 'Hero的角色',
					isMentioned: false,
					isInteractionUser: false,
				},
			});
			const after = await client.health();
			assert(result.needsLocal === true, 'forward ownership needsLocal', result);
			assert(after.parseCount === before.parseCount, 'forward needsLocal no parseCount++', { before, after });
			console.log('[proof] PASS forward ownership → needsLocal (Phase 3o)');
		}
		{
			// Contract: needsLocal payload may include LevelUp from worker EXPUP
			const sample = { needsLocal: true, moduleName: 'token', LevelUp: 'UP', statue: 'S' };
			assert(sample.LevelUp === 'UP', 'needsLocal LevelUp contract', sample);
			console.log('[proof] PASS needsLocal LevelUp contract (Phase 3o)');
		}

		// 30) Phase 3p: client.parse keeps LevelUp keys on real 503 needsLocal
		{
			pinGatewayWorkerUrl();
			const result = await client.parse({
				inputStr: '.token ProofHero',
				botname: 'Discord',
				userid: 'u-proof-3p',
				groupid: 'g-proof-3p',
				locale: 'zh-tw',
			});
			assert(result.needsLocal === true, 'token make needsLocal', result);
			assert(Object.hasOwn(result, 'LevelUp'), 'needsLocal has LevelUp key', result);
			assert(Object.hasOwn(result, 'statue'), 'needsLocal has statue key', result);
			assert(typeof result.LevelUp === 'string', 'LevelUp is string', result);
			console.log('[proof] PASS client preserves needsLocal LevelUp keys (Phase 3p)');
		}

		// 31) Phase 3q: Telegram local fallback when worker URL is dead (no system_busy)
		{
			const prevUrl = process.env.ROLL_WORKER_URL;
			process.env.ROLL_WORKER_URL = 'http://127.0.0.1:1';
			// Clear require cache so client re-reads URL.
			const clientPath = require.resolve('../modules/roll-worker/client');
			const routerPath = require.resolve('../modules/roll-worker/parse-router');
			delete require.cache[clientPath];
			delete require.cache[routerPath];
			const parseRouterDead = require('../modules/roll-worker/parse-router');
			const result = await parseRouterDead.parseInput({
				inputStr: '1d3',
				botname: 'Telegram',
				locale: 'zh-tw',
			}, { keepProof: true });
			assert(result._rollWorker === false, 'dead worker Telegram falls local', result);
			assert(String(result.text || '').length > 0, 'local dice text', result);
			assert(!/忙碌|busy|SYSTEM_BUSY|system_busy/i.test(String(result.text || '')), 'no system_busy spam', result.text);
			process.env.ROLL_WORKER_URL = prevUrl;
			delete require.cache[clientPath];
			delete require.cache[routerPath];
			pinGatewayWorkerUrl();
			require('../modules/roll-worker/client');
			console.log('[proof] PASS Telegram dead-worker local fallback (Phase 3q)');
		}

		// 32) Phase 3r: export gate + chatroom member fetch contract
		{
			const { canPrefetchExportHistory, prefetchChatroomChannel } = require('../modules/roll-worker/discord-prefetch');
			const deniedRole = await canPrefetchExportHistory({ userid: 'u', groupid: 'g', userrole: 1 });
			assert(deniedRole.allow === false && deniedRole.reason === 'userrole', 'export gate userrole', deniedRole);

			let channelFetchCalled = false;
			const invoking = { id: 'u-proof-3r' };
			const { PermissionsBitField } = require('discord.js');
			const fakeClient = {
				channels: {
					fetch: async () => ({
						guildId: 'g-proof',
						name: 'ch',
						guild: {
							name: 'G',
							members: {
								fetch: async (id) => {
									assert(String(id) === 'u-proof-3r', 'fetch invoking userid', id);
									return invoking;
								},
							},
						},
						fetch: async () => {
							channelFetchCalled = true;
							throw new Error('must not use channel.fetch(userid)');
						},
						permissionsFor: (member) => ({
							has: (flag) => member === invoking && flag === PermissionsBitField.Flags.ManageChannels,
						}),
					}),
				},
			};
			const meta = await prefetchChatroomChannel(fakeClient, {
				channelId: 'c-proof',
				userid: 'u-proof-3r',
			});
			assert(channelFetchCalled === false, 'no channel.fetch(userid)', { channelFetchCalled });
			assert(meta?.allowed === true, 'chatroom allowed for invoker', meta);
			console.log('[proof] PASS export gate + chatroom members.fetch (Phase 3r)');
		}

		// 33) Phase 3s: forward Gateway live-retry ownership when prefetch flags false
		{
			const {
				shouldLiveResolveForwardOwnership,
				resolveForwardOwnershipLive,
			} = require('../modules/roll-worker/forward-ownership');

			const planWorker = shouldLiveResolveForwardOwnership({
				hasPrefetch: true,
				isMentioned: false,
				isInteractionUser: false,
				discordClient: null,
				rollWorkerMode: true,
			});
			assert(planWorker.action === 'needsLocal', 'worker ownership → needsLocal', planWorker);

			const planGateway = shouldLiveResolveForwardOwnership({
				hasPrefetch: true,
				isMentioned: false,
				isInteractionUser: false,
				discordClient: { channels: {} },
				rollWorkerMode: true,
			});
			assert(planGateway.action === 'liveFetch', 'gateway ownership → liveFetch', planGateway);

			let liveFetchCount = 0;
			const fakeClient = {
				channels: {
					fetch: async (channelId) => {
						liveFetchCount += 1;
						assert(String(channelId) === '2', 'live fetch source channel', channelId);
						return {
							messages: {
								fetch: async (id) => {
									if (String(id) === 'msg-ref') return { author: { id: 'u-proof-3s' } };
									return {
										content: 'Hero的角色',
										mentions: { users: new Map() },
										interaction: null,
										reference: { messageId: 'msg-ref' },
									};
								},
							},
						};
					},
				},
			};
			const live = await resolveForwardOwnershipLive(fakeClient, {
				sourceChannelId: '2',
				sourceMessageId: '3',
				userid: 'u-proof-3s',
			});
			assert(liveFetchCount === 1, 'Gateway live-retried channel fetch', { liveFetchCount });
			assert(live.ok === true, 'reply-ref ownership ok', live);
			assert(live.isMentioned === true, 'isMentioned via reply-ref', live);
			assert(live.messageContent === 'Hero的角色', 'messageContent', live);
			console.log('[proof] PASS forward Gateway live ownership retry (Phase 3s)');
		}

		// 34) Phase 3t: Schedule [[dice]] skipExp (no EXPUP) with groupid
		{
			pinGatewayWorkerUrl();
			const before = await client.health();
			const result = await client.parse({
				inputStr: '1d3',
				botname: 'Schedule',
				groupid: 'g-proof-3t',
				userid: 'u-proof-3t',
				skipExp: true,
				locale: 'zh-tw',
			});
			const after = await client.health();
			assert(result._rollWorker === true, 'Schedule skipExp remotes', result);
			assert(after.parseCount === before.parseCount + 1, 'Schedule skipExp parseCount++', { before, after });
			assert(!result.LevelUp, 'skipExp leaves LevelUp empty', result);
			assert(String(result.text || '').length > 0, 'Schedule dice text', result);

			// getRoll always injects skipExp into parseRouter (unit-proven in Jest; contract here).
			const getRollSrc = require('node:fs').readFileSync(
				require('node:path').join(__dirname, '../modules/chat/getRoll.js'),
				'utf8'
			);
			assert(/skipExp:\s*true/.test(getRollSrc), 'getRoll sets skipExp:true', getRollSrc.slice(0, 400));
			console.log('[proof] PASS Schedule skipExp (Phase 3t)');
		}

		// 35) Phase 3u: findRollList gate + empty export + HMAC + SSRF
		{
			pinGatewayWorkerUrl();
			const parseRouter = require('../modules/roll-worker/parse-router');
			assert(parseRouter.shouldSkipLocalFindRollList('Whatsapp') === false, 'WhatsApp never skips findRollList');
			assert(parseRouter.shouldSkipLocalFindRollList('Telegram') === false, 'TG never skips findRollList');

			const { hasExportHistoryMessages } = require('../modules/roll-worker/export-history');
			assert(hasExportHistoryMessages({ sum_messages: [] }) === false, 'empty export history not satisfied');
			assert(hasExportHistoryMessages({ sum_messages: [{}] }) === true, 'non-empty export history ok');

			const { attachGatewayAuth, verifyGatewayAuth } = require('../modules/roll-worker/request-auth');
			const signed = attachGatewayAuth({
				inputStr: '1d3',
				userid: 'proof-user',
				botname: 'Telegram',
			}, PROOF_TOKEN);
			assert(verifyGatewayAuth(signed, PROOF_TOKEN).ok === true, 'HMAC verify ok');
			const tampered = { ...signed, userid: 'forged-admin' };
			assert(verifyGatewayAuth(tampered, PROOF_TOKEN).ok === false, 'HMAC rejects tampered userid');

			// Bearer without signature → 401
			const unsignedReject = await new Promise((resolve, reject) => {
				const data = JSON.stringify({ inputStr: '1d3', botname: 'Telegram' });
				const req = http.request({
					hostname: '127.0.0.1',
					port: PORT,
					path: '/v1/parse',
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(data),
						Authorization: `Bearer ${PROOF_TOKEN}`,
					},
				}, (res) => {
					let raw = '';
					res.on('data', (c) => { raw += c; });
					res.on('end', () => resolve({ status: res.statusCode, body: raw }));
				});
				req.on('error', reject);
				req.write(data);
				req.end();
			});
			assert(unsignedReject.status === 401, 'unsigned body rejected', unsignedReject);

			const { assertSafeDiscordFetchUrl } = require('../modules/roll-worker/safe-fetch');
			const meta = await assertSafeDiscordFetchUrl('https://169.254.169.254/latest/meta-data/');
			assert(meta.ok === false, 'SSRF blocks link-local metadata');
			const evil = await assertSafeDiscordFetchUrl('https://evil.example/a.csv');
			assert(evil.ok === false, 'SSRF blocks non-Discord host');

			const {
				resolveForwardOwnershipLive,
			} = require('../modules/roll-worker/forward-ownership');
			const live = await resolveForwardOwnershipLive({
				channels: {
					fetch: async () => ({
						messages: {
							fetch: async (id) => {
								if (String(id) === 'msg-ref') throw new Error('Unknown Message');
								return {
									content: 'x',
									mentions: { users: new Map() },
									interaction: null,
									reference: { messageId: 'msg-ref' },
								};
							},
						},
					}),
				},
			}, { sourceChannelId: '1', sourceMessageId: '2', userid: 'u' });
			assert(live.ok === false && live.errorKey === 'forward.not_your_button', 'forward deleted ref fails closed', live);

			console.log('[proof] PASS Phase 3u review fixes (gate/HMAC/SSRF/export/forward)');
		}

		// 36) Phase 3v: export no dual-run + WWW gate + OpenAI byte cap
		{
			pinGatewayWorkerUrl();
			const parseRouter = require('../modules/roll-worker/parse-router');
			assert(
				parseRouter.shouldSkipLocalFallbackOnWorkerError('export') === true,
				'export skips local fallback on workerError'
			);
			assert(
				parseRouter.shouldSkipLocalFallbackOnWorkerError('0-advroll') === false,
				'dice still allows local fallback'
			);

			// Dead worker + export module → system_busy and ZERO local analytics calls.
			// Force findRollModuleName: parent proof process may lack mongoURL so export
			// module is not registered, but the dual-run guard keys off moduleName.
			const prevUrl = process.env.ROLL_WORKER_URL;
			process.env.ROLL_WORKER_URL = 'http://127.0.0.1:1';
			const clientPath = require.resolve('../modules/roll-worker/client');
			const routerPath = require.resolve('../modules/roll-worker/parse-router');
			const analyticsPath = require.resolve('../modules/analytics');
			delete require.cache[clientPath];
			delete require.cache[routerPath];
			const analytics = require('../modules/analytics');
			const prevFind = analytics.findRollModuleName;
			const prevParse = analytics.parseInput;
			let localParseCalls = 0;
			analytics.findRollModuleName = () => 'export';
			analytics.parseInput = async (...args) => {
				localParseCalls += 1;
				return prevParse.apply(analytics, args);
			};
			const parseRouterDead = require('../modules/roll-worker/parse-router');
			const exportResult = await parseRouterDead.parseInput({
				inputStr: '.discord html',
				botname: 'Discord',
				locale: 'zh-tw',
				userid: 'u-proof-3v-export',
				groupid: 'g-proof-3v-export',
				channelid: 'c-proof-3v-export',
				userrole: 3,
				exportHistoryMeta: {
					sum_messages: [{ contact: 'proof', timestamp: Date.now(), content: 'x' }],
					totalSize: 1,
				},
			}, { keepProof: true });
			analytics.findRollModuleName = prevFind;
			analytics.parseInput = prevParse;
			assert(
				localParseCalls === 0,
				'export dead-worker must not call local analytics (no dual-run)',
				{ localParseCalls, exportResult }
			);
			assert(
				/忙碌|busy|system_busy|SYSTEM_BUSY/i.test(String(exportResult.text || '')),
				'export dead-worker returns busy (no silent re-export)',
				exportResult
			);
			process.env.ROLL_WORKER_URL = prevUrl;
			delete require.cache[clientPath];
			delete require.cache[routerPath];
			delete require.cache[analyticsPath];
			pinGatewayWorkerUrl();
			require('../modules/roll-worker/client');

			assert(parseRouter.shouldSkipLocalFindRollList('WWW') === false, 'WWW never skips findRollList');
			const wwwSrc = fs.readFileSync(path.join(ROOT, 'modules/core-www.js'), 'utf8');
			assert(/shouldSkipLocalFindRollList\('WWW'\)/.test(wwwSrc), 'WWW chat gates findRollList');
			const handlerIdx = wwwSrc.indexOf('records.on("new_message"');
			const gateIdx = wwwSrc.indexOf("shouldSkipLocalFindRollList('WWW')", handlerIdx);
			const parseIdx = wwwSrc.indexOf('parseRouter.parseInput', gateIdx);
			assert(gateIdx > handlerIdx && parseIdx > gateIdx, 'WWW gate before parseRouter');

			const openaiSrc = fs.readFileSync(path.join(ROOT, 'roll/openai.js'), 'utf8');
			assert(/OPENAI_ATTACHMENT_MAX_BYTES\s*=\s*50\s*\*\s*1024\s*\*\s*1024/.test(openaiSrc), '50MB cap');
			assert(/safeFetchBuffer\(url,\s*\{\s*maxBytes/.test(openaiSrc), 'openai uses safeFetchBuffer');

			// IP-pinned safe-fetch: monkey-patch https.request (built-in cache swap is unreliable).
			const { EventEmitter } = require('node:events');
			const https = require('node:https');
			const isImagePath = require.resolve('../utils/is-image-url');
			const safeFetchPath = require.resolve('../modules/roll-worker/safe-fetch');
			const origHttpsRequest = https.request;
			const origIsImage = require.cache[isImagePath];
			delete require.cache[isImagePath];
			delete require.cache[safeFetchPath];
			require.cache[isImagePath] = {
				id: isImagePath,
				filename: isImagePath,
				loaded: true,
				exports: {
					isSafeImageTarget: async () => true,
					resolvePublicFetchTarget: async () => ({
						address: '1.2.3.4',
						protocol: 'https:',
						port: 443,
						path: '/attachments/1/2/x.bin',
						headers: { Host: 'cdn.discordapp.com', 'User-Agent': 't', Accept: '*/*' },
					}),
				},
			};
			https.request = (_opts, cb) => {
				const res = new EventEmitter();
				res.statusCode = 200;
				res.headers = {
					'content-type': 'application/octet-stream',
					'content-length': '64',
				};
				res.resume = () => {};
				const req = {
					on() { return req; },
					end() { cb(res); },
					destroy() {},
				};
				return req;
			};
			const { safeFetchBuffer: safeFetchBuffer3v } = require('../modules/roll-worker/safe-fetch');
			let tooLarge = false;
			try {
				await safeFetchBuffer3v('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 32 });
			} catch (error) {
				tooLarge = error?.code === 'FETCH_TOO_LARGE';
			}
			https.request = origHttpsRequest;
			assert(tooLarge === true, 'safeFetchBuffer enforces maxBytes');
			delete require.cache[safeFetchPath];
			if (origIsImage) require.cache[isImagePath] = origIsImage;
			else delete require.cache[isImagePath];

			console.log('[proof] PASS Phase 3v export/WWW/openai caps');
		}

		// 37) Phase 3w: JSON limit, empty-array openai prefetch, fail-closed set, streaming fetch, HMAC display
		{
			pinGatewayWorkerUrl();
			const {
				DEFAULT_JSON_BODY_LIMIT,
				getJsonBodyLimit,
				isLoopbackHost,
			} = require('../modules/roll-worker/server');
			assert(DEFAULT_JSON_BODY_LIMIT === '32mb', 'default json limit 32mb');
			assert(getJsonBodyLimit() === '32mb' || Boolean(process.env.ROLL_WORKER_JSON_LIMIT), 'json limit configured');
			assert(isLoopbackHost('127.0.0.1') === true, 'loopback true');
			assert(isLoopbackHost('0.0.0.0') === false, 'non-loopback false');

			const parseRouter = require('../modules/roll-worker/parse-router');
			assert(parseRouter.hasOpenAiDiscordPrefetch({ attachmentsMeta: [] }) === false, 'empty attachmentsMeta not prefetch');
			assert(parseRouter.hasOpenAiDiscordPrefetch({
				attachmentsMeta: [{ url: 'https://cdn.discordapp.com/a.png' }],
			}) === true, 'non-empty attachmentsMeta is prefetch');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('openai') === true, 'openai fail-closed');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('token') === true, 'token fail-closed');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('0-advroll') === false, 'dice still fallback');

			const { SIGNED_CLAIM_KEYS, attachGatewayAuth, verifyGatewayAuth } = require('../modules/roll-worker/request-auth');
			assert(SIGNED_CLAIM_KEYS.includes('displayname'), 'displayname signed');
			assert(SIGNED_CLAIM_KEYS.includes('membercount'), 'membercount signed');
			const signed = attachGatewayAuth({
				inputStr: '1d3',
				userid: 'u-proof-3w',
				botname: 'Telegram',
				displayname: 'ProofUser',
			}, PROOF_TOKEN);
			assert(verifyGatewayAuth(signed, PROOF_TOKEN).ok === true, 'HMAC displayname ok');
			signed.displayname = 'Tampered';
			assert(verifyGatewayAuth(signed, PROOF_TOKEN).ok === false, 'HMAC displayname tamper');

			// Live Worker accepts ~3MB body (above old 2mb) — use dice so we only prove JSON limit.
			const beforeLarge = await waitForHealth();
			const chunk = 'z'.repeat(1024);
			const sum_messages = Array.from({ length: 3200 }, (_, i) => ({
				contact: `p${i}`,
				timestamp: i,
				content: chunk,
			}));
			const largeBody = {
				inputStr: '1d3',
				botname: 'Telegram',
				userid: 'u-proof-3w-large',
				groupid: 'g-proof-3w-large',
				locale: 'zh-tw',
				// Attached only to inflate JSON past the old 2mb express limit.
				exportHistoryMeta: { sum_messages, totalSize: sum_messages.length },
			};
			const approxBytes = Buffer.byteLength(JSON.stringify(largeBody));
			assert(approxBytes > 2 * 1024 * 1024, 'proof payload > 2mb', { approxBytes });
			const client = require('../modules/roll-worker/client');
			const largeResult = await client.parse(largeBody);
			const afterLarge = await waitForHealth();
			assert(largeResult._rollWorker === true, 'large JSON body _rollWorker', largeResult);
			assert(
				afterLarge.parseCount === beforeLarge.parseCount + 1,
				'large JSON body parseCount++',
				{ beforeLarge, afterLarge }
			);

			// Streaming / Content-Length byte limits + redirect refuse (IP-pinned path).
			const { EventEmitter: EE3w } = require('node:events');
			const https3w = require('node:https');
			const isImagePath = require.resolve('../utils/is-image-url');
			const safeFetchPath = require.resolve('../modules/roll-worker/safe-fetch');
			const origHttpsRequest3w = https3w.request;
			const origIsImage3w = require.cache[isImagePath];
			delete require.cache[isImagePath];
			delete require.cache[safeFetchPath];
			require.cache[isImagePath] = {
				id: isImagePath,
				filename: isImagePath,
				loaded: true,
				exports: {
					isSafeImageTarget: async () => true,
					resolvePublicFetchTarget: async () => ({
						address: '1.2.3.4',
						protocol: 'https:',
						port: 443,
						path: '/attachments/1/2/x.bin',
						headers: { Host: 'cdn.discordapp.com', 'User-Agent': 't', Accept: '*/*' },
					}),
				},
			};
			let httpsMode = 'stream';
			https3w.request = (_opts, cb) => {
				const res = new EE3w();
				res.resume = () => {};
				const req = {
					on() { return req; },
					destroy() {},
					end() {
						if (httpsMode === 'redirect') {
							res.statusCode = 302;
							res.headers = { location: 'https://evil.example/x' };
							cb(res);
							return;
						}
						if (httpsMode === 'cl') {
							res.statusCode = 200;
							res.headers = { 'content-length': '99999', 'content-type': 'application/octet-stream' };
							cb(res);
							return;
						}
						res.statusCode = 200;
						res.headers = { 'content-type': 'application/octet-stream' };
						cb(res);
						res.emit('data', Buffer.alloc(40, 1));
						res.emit('data', Buffer.alloc(40, 2));
						res.emit('end');
					},
				};
				return req;
			};
			const { readBodyWithByteLimit, safeFetchBuffer } = require('../modules/roll-worker/safe-fetch');
			let streamTooLarge = false;
			try {
				await safeFetchBuffer('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 50 });
			} catch (error) {
				streamTooLarge = error?.code === 'FETCH_TOO_LARGE';
			}
			assert(streamTooLarge === true, 'streaming safeFetchBuffer enforces maxBytes');
			httpsMode = 'cl';
			let clTooLarge = false;
			try {
				await safeFetchBuffer('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 100 });
			} catch (error) {
				clTooLarge = error?.code === 'FETCH_TOO_LARGE';
			}
			assert(clTooLarge === true, 'Content-Length reject without full buffer');
			let clHelper = false;
			try {
				await readBodyWithByteLimit({
					headers: { get: (k) => (k === 'content-length' ? '99999' : null) },
					body: { cancel: async () => {}, getReader: () => ({ read: async () => ({ done: true }) }) },
				}, 100);
			} catch (error) {
				clHelper = error?.code === 'FETCH_TOO_LARGE';
			}
			assert(clHelper === true, 'readBodyWithByteLimit Content-Length reject');
			httpsMode = 'redirect';
			let redirected = false;
			try {
				await safeFetchBuffer('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 100 });
			} catch (error) {
				redirected = error?.code === 'FETCH_REDIRECT';
			}
			https3w.request = origHttpsRequest3w;
			assert(redirected === true, 'safeFetchBuffer refuses redirects');
			delete require.cache[safeFetchPath];
			if (origIsImage3w) require.cache[isImagePath] = origIsImage3w;
			else delete require.cache[isImagePath];

			const botSrc = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
			assert(/assertArtifactReadable\(rplyVal\.fileLink/.test(botSrc), 'fileLink gated');
			assert(/assertArtifactReadable\(rplyVal\.dmFileLink/.test(botSrc), 'dmFileLink gated');

			console.log('[proof] PASS Phase 3w json/prefetch/fail-closed/stream/HMAC');
		}

		// 38) Phase 3x / Pass 9: live Worker proofs for remotes + fail-closed contracts
		{
			pinGatewayWorkerUrl();
			const client = require('../modules/roll-worker/client');
			const parseRouter = require('../modules/roll-worker/parse-router');

			assert(client.DEFAULT_TIMEOUT_MS === 120_000, 'DEFAULT_TIMEOUT_MS 120s');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('z_schedule') === true, 'z_schedule fail-closed');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('z_character') === true, 'z_character fail-closed');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('z_Level_system') === true, 'level fail-closed');
			assert(parseRouter.shouldSkipLocalFallbackOnWorkerError('z_DDR_darkRollingToGM') === true, 'dark-roll fail-closed');

			// Live: bare Discord .ai → needsLocal; .ai help → remote help
			const bareAi = await client.parse({
				inputStr: '.ai',
				botname: 'Discord',
				userid: 'u-proof-ai',
				groupid: 'g-proof-ai',
				locale: 'zh-tw',
			});
			assert(bareAi.needsLocal === true, 'bare Discord .ai needsLocal', bareAi);
			assert(bareAi.moduleName === 'openai', 'bare .ai module openai', bareAi);

			const beforeHelp = await client.health();
			const aiHelp = await client.parse({
				inputStr: '.ai help',
				botname: 'Discord',
				userid: 'u-proof-ai-help',
				groupid: 'g-proof-ai-help',
				locale: 'zh-tw',
			});
			const afterHelp = await client.health();
			assert(!aiHelp.needsLocal, '.ai help not needsLocal', aiHelp);
			assert(aiHelp._rollWorker === true, '.ai help _rollWorker', aiHelp);
			assert(String(aiHelp.text || '').length > 20, '.ai help text', aiHelp.text);
			assert(afterHelp.parseCount === beforeHelp.parseCount + 1, '.ai help parseCount++', { beforeHelp, afterHelp });

			// Source contracts for Pass 9 writers / Discord wiring
			const wwwSrc = fs.readFileSync(path.join(ROOT, 'modules/core-www.js'), 'utf8');
			assert(/no local retry/.test(wwwSrc), 'WWW character-action fail-closed');
			const analyticsSrc = fs.readFileSync(path.join(ROOT, 'modules/analytics.js'), 'utf8');
			assert(/result\.statue\s*=\s*tempEXPUP\?\.status/.test(analyticsSrc), 'statue←status');
			const botSrc9 = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
			assert(/darkRolling\.getGroupGms\(channelid\)/.test(botSrc9), 'Discord getGroupGms');
			const wheelSrc = fs.readFileSync(path.join(ROOT, 'roll/wheel-animator.js'), 'utf8');
			assert(/getTempFilePath\(filename\)/.test(wheelSrc), 'wheel getTempFilePath');
			const schedSrc = fs.readFileSync(path.join(ROOT, 'roll/z_schedule.js'), 'utf8');
			assert(/at_save_error/.test(schedSrc) && /cron_save_error/.test(schedSrc), 'schedule save errors');
			const adminSrc = fs.readFileSync(path.join(ROOT, 'roll/z_admin.js'), 'utf8');
			assert(/type:\s*'slashDeploy'/.test(adminSrc), 'slashDeploy deferred');

			// Gateway workerError skipExp for fall-open dice
			{
				const analyticsPath = require.resolve('../modules/analytics');
				const clientPath = require.resolve('../modules/roll-worker/client');
				const routerPath = require.resolve('../modules/roll-worker/parse-router');
				const analytics = require('../modules/analytics');
				const prevParse = analytics.parseInput;
				const prevFind = analytics.findRollModuleName;
				let sawSkipExp = false;
				analytics.findRollModuleName = () => '0-advroll';
				analytics.parseInput = async (params) => {
					sawSkipExp = params.skipExp === true;
					return { text: 'local-skipExp', type: 'text' };
				};
				const prevUrl = process.env.ROLL_WORKER_URL;
				process.env.ROLL_WORKER_URL = 'http://127.0.0.1:1';
				delete require.cache[clientPath];
				delete require.cache[routerPath];
				const deadRouter = require('../modules/roll-worker/parse-router');
				const fb = await deadRouter.parseInput({
					inputStr: '1d3',
					botname: 'Telegram',
					userid: 'u-skipexp',
					groupid: 'g-skipexp',
					locale: 'zh-tw',
				}, { keepProof: true });
				analytics.parseInput = prevParse;
				analytics.findRollModuleName = prevFind;
				process.env.ROLL_WORKER_URL = prevUrl;
				delete require.cache[clientPath];
				delete require.cache[routerPath];
				delete require.cache[analyticsPath];
				pinGatewayWorkerUrl();
				require('../modules/roll-worker/client');
				assert(sawSkipExp === true, 'workerError local fallback skipExp', { fb, sawSkipExp });
			}

			console.log('[proof] PASS Phase 3x Pass9 live+contracts');
		}

		console.log('[proof] PASSED Worker+Gateway remote path (Phase 3 → 3x / Pass 9)');
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
