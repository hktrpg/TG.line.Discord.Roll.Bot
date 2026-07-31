"use strict";

/**
 * Phase 3u: review fixes — findRollList gate, export empty history,
 * forward reply-ref errors, gateway HMAC, SSRF allowlist, token required.
 */

const http = require('node:http');
const {
	attachGatewayAuth,
	verifyGatewayAuth,
	signClaims,
	stableStringify,
} = require('../modules/roll-worker/request-auth');
const {
	hasExportHistoryMessages,
} = require('../modules/roll-worker/export-history');
const {
	assertSafeDiscordFetchUrl,
	isDiscordCdnHost,
} = require('../modules/roll-worker/safe-fetch');
const {
	resolveForwardOwnershipLive,
} = require('../modules/roll-worker/forward-ownership');

const TOKEN = 'phase3u-hmac-token';

function listen(app) {
	return new Promise((resolve) => {
		const server = app.listen(0, '127.0.0.1', () => {
			const { port } = server.address();
			resolve({ server, port });
		});
	});
}

function httpJson(port, method, path, body, headers = {}) {
	return new Promise((resolve, reject) => {
		const data = body ? JSON.stringify(body) : null;
		const req = http.request({
			hostname: '127.0.0.1',
			port,
			path,
			method,
			headers: {
				'Content-Type': 'application/json',
				...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
				...headers,
			},
		}, (res) => {
			let raw = '';
			res.on('data', (chunk) => { raw += chunk; });
			res.on('end', () => {
				let json = null;
				try { json = raw ? JSON.parse(raw) : null; } catch { json = raw; }
				resolve({ status: res.statusCode, body: json });
			});
		});
		req.on('error', reject);
		if (data) req.write(data);
		req.end();
	});
}

describe('Phase 3u shouldSkipLocalFindRollList gate', () => {
	it('never skips local findRollList (WhatsApp chatter must not hit Worker)', async () => {
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
			const parseRouter = require('../modules/roll-worker/parse-router');
			process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
			expect(parseRouter.shouldSkipLocalFindRollList('Whatsapp')).toBe(false);
			expect(parseRouter.shouldSkipLocalFindRollList('Telegram')).toBe(false);
			expect(parseRouter.shouldSkipLocalFindRollList('Line')).toBe(false);
			expect(parseRouter.shouldSkipLocalFindRollList('Plurk')).toBe(false);
			expect(parseRouter.shouldSkipLocalFindRollList('Discord')).toBe(false);
			delete process.env.ROLL_WORKER_URL;
		});
	});

	it('WhatsApp-style gate: no match → no parse (no EXP via parseInput)', async () => {
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
				.shouldSkipLocalFindRollList('Whatsapp');
			expect(shouldSkip).toBe(false);

			const findRollList = () => null;
			let target = true;
			if (!shouldSkip) {
				target = findRollList();
			}
			const privatemsg = 0;
			const wouldParse = !(!target && privatemsg === 0);
			expect(target).toBeNull();
			expect(wouldParse).toBe(false);
		});
	});
});

describe('Phase 3u export empty prefetch', () => {
	it('empty sum_messages is not satisfied prefetch', () => {
		expect(hasExportHistoryMessages(null)).toBe(false);
		expect(hasExportHistoryMessages({})).toBe(false);
		expect(hasExportHistoryMessages({ sum_messages: [] })).toBe(false);
		expect(hasExportHistoryMessages({ sum_messages: [{}] })).toBe(true);
	});

	it('empty exportHistoryMeta triggers Gateway re-prefetch before remote', async () => {
		await jest.isolateModulesAsync(async () => {
			const prefetchExportHistory = jest.fn(async () => ({
				exportHistoryMeta: { sum_messages: [{ contact: 'x' }], totalSize: 1 },
				exportMeta: { hasReadPermission: true },
			}));
			jest.doMock('../modules/roll-worker/discord-prefetch', () => ({
				prefetchExportHistory,
				canPrefetchExportHistory: jest.fn(async () => ({ allow: true, demoMode: false })),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'ok', type: 'text' })),
				findRollModuleName: jest.fn(() => 'export'),
			}));
			const parse = jest.fn(async (params) => {
				expect(params.exportHistoryMeta.sum_messages).toHaveLength(1);
				return { text: 'remote', type: 'text', _rollWorker: true };
			});
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse,
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
				userid: 'u1',
				groupid: 'g1',
				channelid: 'c1',
				userrole: 3,
				discordClient: {},
				discordMessage: { id: 'm1' },
				exportHistoryMeta: { sum_messages: [], totalSize: 0 },
			}, { keepProof: true });

			expect(prefetchExportHistory).toHaveBeenCalled();
			expect(parse).toHaveBeenCalled();
			expect(result.text).toBe('remote');
		});
	});
});

describe('Phase 3u forward reply-ref fetch errors', () => {
	it('deleted reply reference fails closed (not_your_button), does not throw', async () => {
		const messagesFetch = jest.fn(async (id) => {
			if (String(id) === 'msg-ref') {
				throw new Error('Unknown Message');
			}
			return {
				content: 'Hero的角色',
				mentions: { users: new Map() },
				interaction: null,
				reference: { messageId: 'msg-ref' },
			};
		});
		const discordClient = {
			channels: {
				fetch: jest.fn(async () => ({
					messages: { fetch: messagesFetch },
				})),
			},
		};

		await expect(resolveForwardOwnershipLive(discordClient, {
			sourceChannelId: '2',
			sourceMessageId: '3',
			userid: 'user-owner',
		})).resolves.toMatchObject({
			ok: false,
			errorKey: 'forward.not_your_button',
		});
	});
});

describe('Phase 3u gateway HMAC auth', () => {
	it('sign/verify round-trip and rejects tampered userid', () => {
		const params = {
			inputStr: '1d3',
			userid: 'real-user',
			userrole: 1,
			botname: 'Telegram',
		};
		const signed = attachGatewayAuth(params, TOKEN);
		expect(verifyGatewayAuth(signed, TOKEN).ok).toBe(true);

		const tampered = { ...signed, userid: 'admin-forged' };
		expect(verifyGatewayAuth(tampered, TOKEN).ok).toBe(false);
		expect(verifyGatewayAuth(tampered, TOKEN).error).toMatch(/mismatch/i);
	});

	it('stableStringify is order-independent for objects', () => {
		expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
		const a = signClaims({ userid: 'u', botname: 'X' }, TOKEN, 1);
		const b = signClaims({ botname: 'X', userid: 'u' }, TOKEN, 1);
		expect(a.sig).toBe(b.sig);
	});

	it('verify rejects truncated signatures without throwing', () => {
		const signed = attachGatewayAuth({ inputStr: '1d3', botname: 'Telegram' }, TOKEN);
		signed._gatewayAuth.sig = signed._gatewayAuth.sig.slice(0, 8);
		expect(verifyGatewayAuth(signed, TOKEN).ok).toBe(false);
	});

	it('HTTP /v1/parse rejects Bearer without _gatewayAuth', async () => {
		const prev = process.env.ROLL_WORKER_TOKEN;
		process.env.ROLL_WORKER_TOKEN = TOKEN;
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			const { createRollWorkerApp: createApp } = require('../modules/roll-worker/server');
			const { attachGatewayAuth: sign } = require('../modules/roll-worker/request-auth');
			const app = createApp({ allowNoToken: false });
			const { server, port } = await listen(app);

			const noSig = await httpJson(port, 'POST', '/v1/parse', {
				inputStr: '1d3',
				botname: 'Telegram',
			}, { Authorization: `Bearer ${TOKEN}` });
			expect(noSig.status).toBe(401);
			expect(String(noSig.body.error || '')).toMatch(/gateway auth/i);

			const signedBody = sign({
				inputStr: '1d3',
				botname: 'Telegram',
				locale: 'zh-tw',
			}, TOKEN);
			const ok = await httpJson(port, 'POST', '/v1/parse', signedBody, {
				Authorization: `Bearer ${TOKEN}`,
			});
			expect(ok.status).toBe(200);
			expect(ok.body._rollWorker).toBe(true);

			await new Promise((resolve) => server.close(resolve));
		});
		if (prev === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prev;
	});

	it('createRollWorkerApp without token rejects unless allowNoToken', async () => {
		const prevToken = process.env.ROLL_WORKER_TOKEN;
		const prevAllow = process.env.ROLL_WORKER_ALLOW_NO_TOKEN;
		delete process.env.ROLL_WORKER_TOKEN;
		delete process.env.ROLL_WORKER_ALLOW_NO_TOKEN;
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			const { createRollWorkerApp } = require('../modules/roll-worker/server');
			const app = createRollWorkerApp({ allowNoToken: false });
			const { server, port } = await listen(app);
			const res = await httpJson(port, 'POST', '/v1/parse', { inputStr: '1d3' });
			expect(res.status).toBe(401);
			await new Promise((resolve) => server.close(resolve));
		});
		if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prevToken;
		if (prevAllow === undefined) delete process.env.ROLL_WORKER_ALLOW_NO_TOKEN;
		else process.env.ROLL_WORKER_ALLOW_NO_TOKEN = prevAllow;
	});
});

describe('Phase 3u SSRF allowlist', () => {
	it('blocks metadata / private hosts and non-Discord hosts', async () => {
		expect(isDiscordCdnHost('cdn.discordapp.com')).toBe(true);
		expect(isDiscordCdnHost('media.discordapp.net')).toBe(true);
		expect(isDiscordCdnHost('cdn.discord.com')).toBe(true);
		expect(isDiscordCdnHost('evil.example')).toBe(false);

		const httpCdn = await assertSafeDiscordFetchUrl('http://cdn.discordapp.com/a.png');
		const metadata = await assertSafeDiscordFetchUrl('https://169.254.169.254/latest/meta-data/');
		const evil = await assertSafeDiscordFetchUrl('https://evil.example/a.csv');
		const okCsv = await assertSafeDiscordFetchUrl('https://cdn.discordapp.com/attachments/1/2/a.csv');
		expect(httpCdn.ok).toBe(false);
		expect(metadata.ok).toBe(false);
		expect(evil.ok).toBe(false);
		expect(okCsv.ok).toBe(true);
	});
});
