"use strict";

/**
 * Phase 3w: review fixes — JSON body limit for export history, OpenAI empty-array
 * prefetch, expanded fail-closed modules, streaming safe-fetch, HMAC display claims,
 * fileLink artifact gate, needsLocal skipExp, loopback-only allow-no-token.
 */

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

describe('Phase 3w JSON body limit for exportHistoryMeta', () => {
	it('default JSON limit is 32mb (not 2mb)', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			const {
				DEFAULT_JSON_BODY_LIMIT,
				getJsonBodyLimit,
			} = require('../modules/roll-worker/server');
			expect(DEFAULT_JSON_BODY_LIMIT).toBe('32mb');
			const prev = process.env.ROLL_WORKER_JSON_LIMIT;
			delete process.env.ROLL_WORKER_JSON_LIMIT;
			expect(getJsonBodyLimit()).toBe('32mb');
			process.env.ROLL_WORKER_JSON_LIMIT = '48mb';
			expect(getJsonBodyLimit()).toBe('48mb');
			if (prev === undefined) delete process.env.ROLL_WORKER_JSON_LIMIT;
			else process.env.ROLL_WORKER_JSON_LIMIT = prev;
		});
	});

	it('Worker accepts ~3MB exportHistoryMeta body (above old 2mb cap)', async () => {
		await jest.isolateModulesAsync(async () => {
			const prevToken = process.env.ROLL_WORKER_TOKEN;
			delete process.env.ROLL_WORKER_TOKEN;
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'export-ok', type: 'text' })),
				findRollModuleName: jest.fn(() => 'export'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));

			const { createRollWorkerApp } = require('../modules/roll-worker/server');
			const app = createRollWorkerApp({ allowNoToken: true, jsonLimit: '32mb' });
			const server = await new Promise((resolve) => {
				const s = app.listen(0, '127.0.0.1', () => resolve(s));
			});
			const { port } = server.address();

			const chunk = 'x'.repeat(1024);
			const sum_messages = Array.from({ length: 3200 }, (_, i) => ({
				contact: `u${i}`,
				timestamp: i,
				content: chunk,
			}));
			const body = JSON.stringify({
				inputStr: '.discord html',
				botname: 'Discord',
				userid: 'u-3w',
				groupid: 'g-3w',
				channelid: 'c-3w',
				userrole: 3,
				exportHistoryMeta: { sum_messages, totalSize: sum_messages.length },
			});
			expect(Buffer.byteLength(body)).toBeGreaterThan(2 * 1024 * 1024);

			const res = await new Promise((resolve, reject) => {
				const req = http.request({
					hostname: '127.0.0.1',
					port,
					path: '/v1/parse',
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(body),
					},
				}, (response) => {
					let raw = '';
					response.on('data', (c) => { raw += c; });
					response.on('end', () => {
						let json = null;
						try { json = raw ? JSON.parse(raw) : null; } catch { json = raw; }
						resolve({ status: response.statusCode, body: json });
					});
				});
				req.on('error', reject);
				req.write(body);
				req.end();
			});

			await new Promise((resolve) => server.close(resolve));
			if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
			else process.env.ROLL_WORKER_TOKEN = prevToken;
			expect(res.status).toBe(200);
			expect(res.body.text).toBe('export-ok');
			expect(res.body._rollWorker).toBe(true);
		});
	});

	it('Worker rejects body above configured jsonLimit', async () => {
		await jest.isolateModulesAsync(async () => {
			const prevToken = process.env.ROLL_WORKER_TOKEN;
			delete process.env.ROLL_WORKER_TOKEN;
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'should-not-run', type: 'text' })),
				findRollModuleName: jest.fn(() => 'export'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));

			const { createRollWorkerApp } = require('../modules/roll-worker/server');
			const app = createRollWorkerApp({ allowNoToken: true, jsonLimit: '1mb' });
			const server = await new Promise((resolve) => {
				const s = app.listen(0, '127.0.0.1', () => resolve(s));
			});
			const { port } = server.address();

			const body = JSON.stringify({
				inputStr: '.discord html',
				botname: 'Discord',
				exportHistoryMeta: {
					sum_messages: Array.from({ length: 2000 }, () => ({
						content: 'y'.repeat(1024),
					})),
					totalSize: 2000,
				},
			});
			expect(Buffer.byteLength(body)).toBeGreaterThan(1024 * 1024);

			const res = await new Promise((resolve, reject) => {
				const req = http.request({
					hostname: '127.0.0.1',
					port,
					path: '/v1/parse',
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(body),
					},
				}, (response) => {
					let raw = '';
					response.on('data', (c) => { raw += c; });
					response.on('end', () => resolve({ status: response.statusCode, raw }));
				});
				req.on('error', reject);
				req.write(body);
				req.end();
			});

			await new Promise((resolve) => server.close(resolve));
			if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
			else process.env.ROLL_WORKER_TOKEN = prevToken;
			expect(res.status).toBe(413);
		});
	});
});

describe('Phase 3w OpenAI empty-array prefetch', () => {
	it('hasOpenAiDiscordPrefetch ignores empty arrays', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));
			const { hasOpenAiDiscordPrefetch } = require('../modules/roll-worker/parse-router');
			expect(hasOpenAiDiscordPrefetch({})).toBe(false);
			expect(hasOpenAiDiscordPrefetch({ attachmentsMeta: [] })).toBe(false);
			expect(hasOpenAiDiscordPrefetch({ replyAttachmentsMeta: [] })).toBe(false);
			expect(hasOpenAiDiscordPrefetch({ replyContent: '' })).toBe(false);
			expect(hasOpenAiDiscordPrefetch({
				attachmentsMeta: [{ url: 'https://cdn.discordapp.com/a.png' }],
			})).toBe(true);
			expect(hasOpenAiDiscordPrefetch({ replyContent: 'quoted' })).toBe(true);
		});
	});

	it('empty attachmentsMeta still triggers Discord openai prefetch', async () => {
		await jest.isolateModulesAsync(async () => {
			const prefetchOpenAiDiscordContext = jest.fn(async () => ({
				attachmentsMeta: [{ url: 'https://cdn.discordapp.com/live.png', name: 'live.png' }],
				replyAttachmentsMeta: [],
				replyContent: '',
			}));
			jest.doMock('../modules/roll-worker/discord-prefetch', () => ({
				prefetchOpenAiDiscordContext,
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'ai', type: 'text' })),
				findRollModuleName: jest.fn(() => 'openai'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:20612', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async (params) => ({
					text: 'remote-ai',
					type: 'text',
					_rollWorker: true,
					_seenAttachments: params.attachmentsMeta,
				})),
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const client = require('../modules/roll-worker/client');
			const result = await parseRouter.parseInput({
				inputStr: '.ai hello',
				botname: 'Discord',
				userid: 'u',
				groupid: 'g',
				discordMessage: { id: 'm1', attachments: { size: 1 } },
				discordClient: {},
				// Bug case: empty arrays are truthy and used to skip prefetch.
				attachmentsMeta: [],
				replyAttachmentsMeta: [],
			}, { keepProof: true });

			expect(prefetchOpenAiDiscordContext).toHaveBeenCalled();
			expect(client.parse).toHaveBeenCalledWith(expect.objectContaining({
				attachmentsMeta: [{ url: 'https://cdn.discordapp.com/live.png', name: 'live.png' }],
			}));
			expect(result.text).toBe('remote-ai');
		});
	});
});

describe('Phase 3w expanded fail-closed on workerError', () => {
	it('FAIL_CLOSED_ON_WORKER_ERROR covers mutating modules only', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));
			const {
				FAIL_CLOSED_ON_WORKER_ERROR,
				shouldSkipLocalFallbackOnWorkerError,
			} = require('../modules/roll-worker/parse-router');
			for (const name of [
				'export', 'openai', 'token', 'z_admin',
				'z-story-teller', 'forward', 'z_multi-server',
				'z_schedule', 'z_character', 'z_saveCommand',
				'z_random_ans', 'z_trpgDatabase', 'z_event',
				'z_Level_system', 'z_stop', 'z_DDR_darkRollingToGM',
			]) {
				expect(FAIL_CLOSED_ON_WORKER_ERROR.has(name)).toBe(true);
				expect(shouldSkipLocalFallbackOnWorkerError(name)).toBe(true);
			}
			expect(shouldSkipLocalFallbackOnWorkerError('0-advroll')).toBe(false);
			expect(shouldSkipLocalFallbackOnWorkerError('lang')).toBe(false);
		});
	});

	it('openai + worker timeout → silent empty and zero local parseInput calls', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'SHOULD-NOT-RUN', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:20612', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => {
					throw new Error('timeout of 30000ms exceeded');
				}),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput,
				findRollModuleName: jest.fn(() => 'openai'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (key) => (
					key === 'common.errors.system_busy' ? 'BUSY_NO_OPENAI_RERUN' : key
				),
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '.ai hello',
				botname: 'Discord',
				locale: 'zh-tw',
				userid: 'u-ai',
				groupid: 'g-ai',
			}, { keepProof: true });

			expect(parseInput).not.toHaveBeenCalled();
			expect(result.text).toBe('');
			expect(result.type).toBe('text');
		});
	});
});

describe('Phase 3w workerError skipExp', () => {
	it('workerError local fallback passes skipExp: true', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'local-after-error', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:20612', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => {
					throw new Error('timeout of 30000ms exceeded');
				}),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput,
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '1d100',
				botname: 'Telegram',
				userid: 'u',
				groupid: 'g',
			}, { keepProof: true });

			expect(parseInput).toHaveBeenCalledWith(expect.objectContaining({
				skipExp: true,
			}));
			expect(result.text).toBe('local-after-error');
		});
	});
});

describe('Phase 3w needsLocal skipExp', () => {
	it('needsLocal local fallback passes skipExp: true', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'local-after-needsLocal', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:20612', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({
					needsLocal: true,
					moduleName: 'token',
					LevelUp: 'WORKER_UP',
					statue: '',
				})),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput,
				findRollModuleName: jest.fn(() => 'token'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '.token make',
				botname: 'Discord',
				userid: 'u',
				groupid: 'g',
				discordClient: {},
				discordMessage: {},
			}, { keepProof: true });

			expect(parseInput).toHaveBeenCalledWith(expect.objectContaining({
				skipExp: true,
			}));
			expect(result.LevelUp).toBe('WORKER_UP');
			expect(result.text).toBe('local-after-needsLocal');
		});
	});
});

describe('Phase 3w streaming safe-fetch byte limit', () => {
	it('readBodyWithByteLimit rejects via Content-Length without buffering', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../utils/is-image-url', () => ({
				isSafeImageTarget: jest.fn(async () => true),
			}));
			const { readBodyWithByteLimit } = require('../modules/roll-worker/safe-fetch');
			let cancelled = false;
			const response = {
				headers: { get: (k) => (k === 'content-length' ? String(10_000) : null) },
				body: {
					cancel: async () => { cancelled = true; },
					getReader: () => {
						throw new Error('should not stream after content-length reject');
					},
				},
				arrayBuffer: async () => {
					throw new Error('should not arrayBuffer after content-length reject');
				},
			};
			await expect(readBodyWithByteLimit(response, 100)).rejects.toMatchObject({
				code: 'FETCH_TOO_LARGE',
			});
			expect(cancelled).toBe(true);
		});
	});

	it('readBodyWithByteLimit streams and aborts mid-read when over maxBytes', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../utils/is-image-url', () => ({
				isSafeImageTarget: jest.fn(async () => true),
			}));
			const { readBodyWithByteLimit } = require('../modules/roll-worker/safe-fetch');
			let cancelled = false;
			const chunks = [
				new Uint8Array(40).fill(1),
				new Uint8Array(40).fill(2),
				new Uint8Array(40).fill(3),
			];
			let idx = 0;
			const response = {
				headers: { get: () => null },
				body: {
					getReader: () => ({
						read: async () => {
							if (idx >= chunks.length) return { done: true, value: undefined };
							const value = chunks[idx++];
							return { done: false, value };
						},
						cancel: async () => { cancelled = true; },
					}),
				},
			};
			await expect(readBodyWithByteLimit(response, 50)).rejects.toMatchObject({
				code: 'FETCH_TOO_LARGE',
			});
			expect(cancelled).toBe(true);
			expect(idx).toBeLessThanOrEqual(2);
		});
	});

	it('safeFetchBuffer uses IP-pinned path and returns under-limit body', async () => {
		await jest.isolateModulesAsync(async () => {
			const { EventEmitter } = require('node:events');
			const payload = Buffer.from('stream-ok');
			jest.doMock('../utils/is-image-url', () => ({
				isSafeImageTarget: jest.fn(async () => true),
				resolvePublicFetchTarget: jest.fn(async () => ({
					address: '1.2.3.4',
					protocol: 'https:',
					port: 443,
					path: '/attachments/1/2/x.bin',
					headers: { Host: 'cdn.discordapp.com', 'User-Agent': 't', Accept: '*/*' },
				})),
			}));
			jest.doMock('node:https', () => ({
				request: (_opts, cb) => {
					const res = new EventEmitter();
					res.statusCode = 200;
					res.headers = { 'content-type': 'application/octet-stream' };
					res.resume = () => {};
					const req = {
						on() { return req; },
						end() {
							cb(res);
							res.emit('data', payload);
							res.emit('end');
						},
						destroy() {},
					};
					return req;
				},
			}));
			const { safeFetchBuffer } = require('../modules/roll-worker/safe-fetch');
			const out = await safeFetchBuffer(
				'https://cdn.discordapp.com/attachments/1/2/x.bin',
				{ maxBytes: 128 }
			);
			expect(out.bytes).toBe(payload.length);
			expect(Buffer.compare(out.buffer, payload)).toBe(0);
		});
	});
});

describe('Phase 3w HMAC signs display identity fields', () => {
	it('SIGNED_CLAIM_KEYS includes displayname fields', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.unmock('../modules/roll-worker/request-auth');
			const {
				SIGNED_CLAIM_KEYS,
				attachGatewayAuth,
				verifyGatewayAuth,
			} = require('../modules/roll-worker/request-auth');
			expect(Array.isArray(SIGNED_CLAIM_KEYS)).toBe(true);
			for (const key of [
				'displayname', 'displaynameDiscord', 'membercount', 'titleName', 'tgDisplayname',
			]) {
				expect(SIGNED_CLAIM_KEYS).toContain(key);
			}
			const token = 'phase3w-hmac';
			const params = attachGatewayAuth({
				inputStr: '1d100',
				userid: 'u1',
				botname: 'Telegram',
				displayname: 'Alice',
				membercount: 12,
			}, token);
			expect(verifyGatewayAuth(params, token).ok).toBe(true);
			params.displayname = 'Eve';
			expect(verifyGatewayAuth(params, token).ok).toBe(false);
		});
	});
});

describe('Phase 3w fileLink artifact gate + allow-no-token loopback', () => {
	it('Discord bot sendFiles/sendDmFiles use assertArtifactReadable', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
		const sendFilesIdx = src.indexOf('const sendFiles = async');
		const sendDmIdx = src.indexOf('const sendDmFiles = async');
		expect(sendFilesIdx).toBeGreaterThan(-1);
		expect(sendDmIdx).toBeGreaterThan(-1);
		const sendFilesBlock = src.slice(sendFilesIdx, sendDmIdx);
		const sendDmBlock = src.slice(sendDmIdx, sendDmIdx + 1200);
		expect(sendFilesBlock).toMatch(/assertArtifactReadable\(rplyVal\.fileLink/);
		expect(sendDmBlock).toMatch(/assertArtifactReadable\(rplyVal\.dmFileLink/);
	});

	it('isLoopbackHost + start refuse non-loopback without token (source contract)', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			const { isLoopbackHost } = require('../modules/roll-worker/server');
			expect(isLoopbackHost('127.0.0.1')).toBe(true);
			expect(isLoopbackHost('0.0.0.0')).toBe(false);
			expect(isLoopbackHost('10.0.0.1')).toBe(false);
		});
		const src = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/server.js'), 'utf8');
		expect(src).toMatch(/allowNoToken && !isLoopbackHost\(host\)/);
		// Dead check after exit(1) for !token && !allowNoToken must be gone.
		expect(src).not.toMatch(
			/!token && !allowNoToken && !isLoopbackHost/
		);
	});

	it('assertArtifactReadable still rejects path escape for fileLink safety', () => {
		const { assertArtifactReadable, resolveArtifactPath } = require('../modules/roll-worker/artifacts');
		expect(resolveArtifactPath('../outside.txt')).toBeNull();
		expect(assertArtifactReadable('/etc/passwd')).toBeNull();
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-3w-'));
		const prev = process.env.ROLL_ARTIFACT_ROOT;
		process.env.ROLL_ARTIFACT_ROOT = tmpDir;
		try {
			const file = path.join(tmpDir, 'export', 'ok.txt');
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, 'ok');
			expect(assertArtifactReadable('export/ok.txt')).toBe(path.resolve(file));
		} finally {
			if (prev === undefined) delete process.env.ROLL_ARTIFACT_ROOT;
			else process.env.ROLL_ARTIFACT_ROOT = prev;
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});
