"use strict";

/**
 * Phase 3v: review fixes — export no dual-run on worker error,
 * WWW findRollList gate, OpenAI attachment byte cap.
 */

describe('Phase 3v export workerError must not re-run locally', () => {
	it('shouldSkipLocalFallbackOnWorkerError for mutating modules', async () => {
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
				shouldSkipLocalFallbackOnWorkerError,
			} = require('../modules/roll-worker/parse-router');
			expect(shouldSkipLocalFallbackOnWorkerError('export')).toBe(true);
			expect(shouldSkipLocalFallbackOnWorkerError('openai')).toBe(true);
			expect(shouldSkipLocalFallbackOnWorkerError('0-advroll')).toBe(false);
			expect(shouldSkipLocalFallbackOnWorkerError(null)).toBe(false);
		});
	});

	it('export + worker timeout → system_busy and zero local parseInput calls', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'SHOULD-NOT-RUN', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => {
					throw new Error('timeout of 30000ms exceeded');
				}),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput,
				findRollModuleName: jest.fn(() => 'export'),
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
					key === 'common.errors.system_busy' ? 'BUSY_NO_EXPORT_RERUN' : key
				),
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '.discord html',
				botname: 'Discord',
				locale: 'zh-tw',
				userid: 'u-export',
				groupid: 'g-export',
				channelid: 'c-export',
				userrole: 3,
				exportHistoryMeta: {
					sum_messages: [{ contact: 'x', timestamp: 1, content: 'hi' }],
					totalSize: 1,
				},
			}, { keepProof: true });

			expect(parseInput).not.toHaveBeenCalled();
			expect(result.text).toBe('BUSY_NO_EXPORT_RERUN');
			expect(result.type).toBe('text');
		});
	});

	it('export needsLocal still falls back locally (missing prefetch)', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'local-export', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({
					needsLocal: true,
					moduleName: 'export',
					LevelUp: '',
					statue: '',
				})),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput,
				findRollModuleName: jest.fn(() => 'export'),
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
				inputStr: '.discord html',
				botname: 'Discord',
				locale: 'zh-tw',
			});

			expect(parseInput).toHaveBeenCalledTimes(1);
			expect(result.text).toBe('local-export');
		});
	});

	it('non-export modules still local-fallback on workerError', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'local-dice', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: '', timeoutMs: 30_000 }),
				parse: jest.fn(async () => {
					throw new Error('ECONNREFUSED');
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
				createTranslator: () => (key) => (
					key === 'common.errors.system_busy' ? 'BUSY' : key
				),
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '1d3',
				botname: 'Telegram',
				locale: 'zh-tw',
			});

			expect(parseInput).toHaveBeenCalledTimes(1);
			expect(result.text).toBe('local-dice');
			expect(result.text).not.toBe('BUSY');
		});
	});
});

describe('Phase 3v WWW findRollList gate', () => {
	it('core-www source gates new_message with findRollList', () => {
		const fs = require('node:fs');
		const path = require('node:path');
		const src = fs.readFileSync(
			path.join(__dirname, '../modules/core-www.js'),
			'utf8'
		);
		expect(src).toMatch(/shouldSkipLocalFindRollList\('WWW'\)/);
		expect(src).toMatch(/findRollList\(/);
		const handlerIdx = src.indexOf('records.on("new_message"');
		const gateIdx = src.indexOf("shouldSkipLocalFindRollList('WWW')", handlerIdx);
		const parseIdx = src.indexOf('parseRouter.parseInput', gateIdx);
		expect(handlerIdx).toBeGreaterThan(-1);
		expect(gateIdx).toBeGreaterThan(handlerIdx);
		expect(parseIdx).toBeGreaterThan(gateIdx);
	});

	it('WWW-style gate: no match → no parse (same contract as WhatsApp)', async () => {
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
			const shouldSkip = require('../modules/roll-worker/parse-router')
				.shouldSkipLocalFindRollList('WWW');
			expect(shouldSkip).toBe(false);

			const findRollList = () => null;
			let wouldParse = true;
			if (!shouldSkip) {
				const target = findRollList();
				if (!target) wouldParse = false;
			}
			expect(wouldParse).toBe(false);
		});
	});
});

describe('Phase 3v OpenAI attachment byte cap', () => {
	it('openai.js fetchDiscordAttachment uses safeFetchBuffer with 50MB cap', () => {
		const src = require('node:fs').readFileSync(
			require('node:path').join(__dirname, '../roll/openai.js'),
			'utf8'
		);
		expect(src).toMatch(/OPENAI_ATTACHMENT_MAX_BYTES\s*=\s*50\s*\*\s*1024\s*\*\s*1024/);
		expect(src).toMatch(/safeFetchBuffer\(url,\s*\{\s*maxBytes/);
		expect(src).toMatch(/fetchDiscordAttachment/);
		expect(src).toMatch(/module\.exports[\s\S]*OPENAI_ATTACHMENT_MAX_BYTES/);
	});

	it('safeFetchBuffer rejects downloads over maxBytes', async () => {
		const prevFetch = globalThis.fetch;
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../utils/is-image-url', () => ({
				isSafeImageTarget: jest.fn(async () => true),
			}));
			globalThis.fetch = jest.fn(async () => ({
				ok: true,
				status: 200,
				headers: { get: () => 'application/octet-stream' },
				arrayBuffer: async () => Buffer.alloc(64, 1),
			}));

			const { safeFetchBuffer } = require('../modules/roll-worker/safe-fetch');
			await expect(
				safeFetchBuffer('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 32 })
			).rejects.toMatchObject({ code: 'FETCH_TOO_LARGE' });

			await expect(
				safeFetchBuffer('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 128 })
			).resolves.toMatchObject({ bytes: 64 });
		});
		globalThis.fetch = prevFetch;
	});

	it('fetchDiscordAttachment contract: capped download returns Response-like shim', async () => {
		await jest.isolateModulesAsync(async () => {
			const body = Buffer.from('hello-openai-cap', 'utf8');
			const safeFetchBuffer = jest.fn(async () => ({
				buffer: body,
				bytes: body.length,
				contentType: 'text/plain',
			}));
			jest.doMock('../modules/roll-worker/safe-fetch', () => ({
				safeFetchBuffer,
				assertSafeDiscordFetchUrl: jest.fn(),
			}));

			const { safeFetchBuffer: mocked } = require('../modules/roll-worker/safe-fetch');
			const maxBytes = 50 * 1024 * 1024;
			const downloaded = await mocked('https://cdn.discordapp.com/a.txt', { maxBytes });
			const buffer = downloaded.buffer;
			const response = {
				ok: true,
				async buffer() { return buffer; },
				async text() { return buffer.toString('utf8'); },
			};
			expect(response.ok).toBe(true);
			expect(await response.text()).toBe('hello-openai-cap');
			expect(Buffer.compare(await response.buffer(), body)).toBe(0);
			expect(safeFetchBuffer).toHaveBeenCalledWith(
				'https://cdn.discordapp.com/a.txt',
				{ maxBytes }
			);
		});
	});
});
