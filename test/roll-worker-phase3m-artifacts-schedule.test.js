"use strict";

/**
 * Phase 3m: token artifact root, export demo prefetch, schedule fallback, dark-rolling invalidate.
 */
jest.setTimeout(90_000);

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
// Avoid 3975 — historically shared with reload PORT_E; leftovers cause Unauthorized.
const PORT = 3988;
const TOKEN = 'phase3m-proof-token';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Phase 3m token temp under ROLL_ARTIFACT_ROOT', () => {
	it('getTempFilePath writes under artifact root', () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-3m-'));
		const prev = process.env.ROLL_ARTIFACT_ROOT;
		process.env.ROLL_ARTIFACT_ROOT = tmpDir;
		jest.resetModules();
		try {
			const { getTempFilePath, assertArtifactReadable } = require('../modules/roll-worker/artifacts');
			const file = getTempFilePath('finally_proof.png');
			expect(file.startsWith(path.resolve(tmpDir))).toBe(true);
			fs.writeFileSync(file, 'png');
			expect(assertArtifactReadable(file)).toBe(path.resolve(file));
			expect(assertArtifactReadable('temp/finally_proof.png')).toBe(path.resolve(file));
		} finally {
			if (prev === undefined) delete process.env.ROLL_ARTIFACT_ROOT;
			else process.env.ROLL_ARTIFACT_ROOT = prev;
			fs.rmSync(tmpDir, { recursive: true, force: true });
			jest.resetModules();
		}
	});
});

describe('Phase 3m export demo prefetch', () => {
	it('prefetchExportHistory stops at DEMO limit when demoMode', async () => {
		const { DEMO_EXPORT_MESSAGE_LIMIT } = require('../modules/roll-worker/artifacts');
		const { prefetchExportHistory } = require('../modules/roll-worker/discord-prefetch');

		const makeBatch = (size, beforeId) => {
			const map = new Map();
			for (let i = 0; i < size; i++) {
				const id = `${beforeId || 'b'}-${i}`;
				map.set(id, {
					id,
					createdTimestamp: Date.now(),
					content: `m${i}`,
					author: { username: 'u', bot: false },
					attachments: { size: 0 },
					embeds: [],
				});
			}
			return {
				size: map.size,
				values: () => map.values(),
				last: () => [...map.values()].at(-1),
			};
		};

		let fetches = 0;
		const discordClient = {
			channels: {
				fetch: async () => ({
					messages: {
						fetch: async () => {
							fetches += 1;
							// Always return full page so demoMode is what stops the loop
							return makeBatch(100, String(fetches));
						},
					},
				}),
			},
		};

		const out = await prefetchExportHistory(discordClient, {
			channel: { name: 'c', permissionsFor: () => ({ has: () => true }) },
			guild: { members: { me: { permissions: { has: () => false } } } },
		}, { channelid: 'c1', demoMode: true });

		expect(out.exportHistoryMeta.totalSize).toBeGreaterThanOrEqual(DEMO_EXPORT_MESSAGE_LIMIT);
		expect(out.exportHistoryMeta.totalSize).toBeLessThanOrEqual(DEMO_EXPORT_MESSAGE_LIMIT + 100);
		expect(fetches).toBeLessThanOrEqual(Math.ceil(DEMO_EXPORT_MESSAGE_LIMIT / 100) + 1);
	});

	it('resolveExportDemoMode returns false without mongoURL', async () => {
		const prev = process.env.mongoURL;
		delete process.env.mongoURL;
		const { resolveExportDemoMode } = require('../modules/roll-worker/discord-prefetch');
		await expect(resolveExportDemoMode('user-1')).resolves.toBe(false);
		if (prev !== undefined) process.env.mongoURL = prev;
	});
});

describe('Phase 3m dark-rolling cache invalidate', () => {
	it('invalidateCache clears in-memory cache without Mongo connect', async () => {
		jest.resetModules();
		const getMock = jest.fn()
			.mockResolvedValueOnce([{ groupid: 'g1', trpgDarkRollingfunction: [{ userid: 'u1' }] }])
			.mockResolvedValueOnce([]);
		jest.doMock('../modules/db/records', () => ({ get: getMock }));
		const prevMongo = process.env.mongoURL;
		process.env.mongoURL = 'mongodb://127.0.0.1:9/mock-dark-rolling';
		const dark = require('../modules/roll-worker/dark-rolling');
		const first = await dark.getGroupGms('g1');
		expect(first).toHaveLength(1);
		expect(getMock).toHaveBeenCalledTimes(1);
		const cached = await dark.getGroupGms('g1');
		expect(cached).toHaveLength(1);
		expect(getMock).toHaveBeenCalledTimes(1);
		dark.invalidateCache();
		const after = await dark.getGroupGms('g1');
		expect(after).toHaveLength(0);
		expect(getMock).toHaveBeenCalledTimes(2);
		if (prevMongo === undefined) delete process.env.mongoURL;
		else process.env.mongoURL = prevMongo;
		dark.invalidateCache();
		jest.dontMock('../modules/db/records');
		jest.resetModules();
	});
});

describe('Phase 3m schedule local fallback', () => {
	it('getRoll passes allowLocalFallback true', async () => {
		jest.resetModules();
		jest.doMock('../modules/roll-worker/parse-router', () => ({
			parseInput: jest.fn(async () => ({ text: '7', type: 'text' })),
		}));
		const parseRouter = require('../modules/roll-worker/parse-router');
		const { rollText } = require('../modules/chat/getRoll');
		const out = await rollText('[[1d6]]', { botname: 'Schedule' });
		expect(out).toBe('7');
		expect(parseRouter.parseInput).toHaveBeenCalledWith(
			expect.objectContaining({ botname: 'Schedule', inputStr: '1d6' }),
			{ allowLocalFallback: true }
		);
		jest.dontMock('../modules/roll-worker/parse-router');
		jest.resetModules();
	});
});

describe('Phase 3m live worker+gateway (spawned)', () => {
	let child;
	let client;
	const prevUrl = process.env.ROLL_WORKER_URL;
	const prevToken = process.env.ROLL_WORKER_TOKEN;
	const artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-3m-live-'));

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
				ROLL_ARTIFACT_ROOT: artifactRoot,
				OPENAI_SWITCH: process.env.OPENAI_SWITCH || 'true',
				DISCORD_CHANNEL_SECRET: process.env.DISCORD_CHANNEL_SECRET || 'proof-secret',
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		process.env.ROLL_WORKER_URL = `http://127.0.0.1:${PORT}`;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		process.env.ROLL_ARTIFACT_ROOT = artifactRoot;
		jest.resetModules();
		client = require('../modules/roll-worker/client');

		const start = Date.now();
		let ready = false;
		while (Date.now() - start < 25_000) {
			try {
				const health = await client.health();
				// parseCount only present when Bearer matches Worker token
				if (health?.ok && typeof health.parseCount === 'number') {
					ready = true;
					break;
				}
			} catch {
				// retry
			}
			await sleep(200);
		}
		if (!ready) throw new Error(`Phase 3m worker health timeout on ${PORT}`);
	});

	afterAll(async () => {
		if (prevUrl === undefined) delete process.env.ROLL_WORKER_URL;
		else process.env.ROLL_WORKER_URL = prevUrl;
		if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prevToken;
		delete process.env.ROLL_ARTIFACT_ROOT;
		if (child && !child.killed) {
			child.kill('SIGTERM');
			await sleep(400);
			try { child.kill('SIGKILL'); } catch { /* ignore */ }
		}
		fs.rmSync(artifactRoot, { recursive: true, force: true });
	});

	it('Schedule botname remotes dice on Worker', async () => {
		const before = await client.health();
		const result = await client.parse({
			inputStr: '1d3',
			botname: 'Schedule',
			locale: 'zh-tw',
		});
		const after = await client.health();
		expect(result.needsLocal).toBeFalsy();
		expect(result._rollWorker).toBe(true);
		expect(after.parseCount).toBe(before.parseCount + 1);
		expect(String(result.text || '').length).toBeGreaterThan(0);
	});
});
