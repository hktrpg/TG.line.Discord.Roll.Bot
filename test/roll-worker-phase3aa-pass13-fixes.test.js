"use strict";

/**
 * Phase 3aa / Pass 13 — close remaining Low/Info:
 * L8 sign-all HMAC claims, L10 skip courtMessage on skipExp,
 * M4 env Discord denylist, M6 timeout-race design contract.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

describe('Phase 3aa L8 HMAC signs all body keys', () => {
	it('tampering a future/unknown field fails verify', () => {
		const {
			attachGatewayAuth,
			verifyGatewayAuth,
			pickClaims,
			UNSIGNED_KEYS,
		} = require('../modules/roll-worker/request-auth');
		expect(UNSIGNED_KEYS.has('_gatewayAuth')).toBe(true);
		const token = 'phase3aa-hmac';
		const signed = attachGatewayAuth({
			inputStr: '1d3',
			userid: 'u1',
			botname: 'Telegram',
			futureFeatureFlag: { enabled: true, quota: 9 },
		}, token);
		expect(pickClaims(signed)).toHaveProperty('futureFeatureFlag');
		expect(pickClaims(signed)).not.toHaveProperty('_gatewayAuth');
		expect(verifyGatewayAuth(signed, token).ok).toBe(true);
		signed.futureFeatureFlag = { enabled: false, quota: 9 };
		expect(verifyGatewayAuth(signed, token).ok).toBe(false);
	});

	it('adding an extra unsigned field after attach fails verify', () => {
		const {
			attachGatewayAuth,
			verifyGatewayAuth,
		} = require('../modules/roll-worker/request-auth');
		const token = 'phase3aa-hmac-2';
		const signed = attachGatewayAuth({
			inputStr: '1d100',
			userid: 'u2',
			botname: 'Discord',
		}, token);
		signed.injectedRole = 99;
		expect(verifyGatewayAuth(signed, token).ok).toBe(false);
	});
});

describe('Phase 3aa L10 courtMessage skipped when skipExp', () => {
	it('analytics source skips courtMessage under skipExp', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/analytics.js'), 'utf8');
		expect(src).toMatch(/if\s*\(\s*!context\.skipExp\s*\)\s*\{[\s\S]*courtMessage/);
	});

	it('workerError fallback with skipExp does not call courtMessage', async () => {
		await jest.isolateModulesAsync(async () => {
			const courtMessage = jest.fn(async () => {});
			jest.doMock('../modules/chat/logs', () => ({ courtMessage }));
			jest.doMock('../modules/chat/level', () => ({
				EXPUP: jest.fn(async () => ({ text: '', status: '' })),
				tempSwitchV2: [],
				invalidateGroupConfig: jest.fn(),
			}));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => {
					throw new Error('timeout of 30000ms exceeded');
				}),
			}));
			// Local analytics on fallback — isolate real analytics with mocks.
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
				normalizeLocale: (l) => l || 'zh-tw',
			}));

			// Use parse-router → local analytics.parseInput with skipExp.
			// Mock analytics to observe skipExp + simulate courtMessage gate.
			const parseInput = jest.fn(async (params) => {
				expect(params.skipExp).toBe(true);
				if (!params.skipExp) {
					await courtMessage({ result: { text: 'x' }, botname: 'Telegram', inputStr: '1d3' });
				}
				return { text: 'local-dice', type: 'text' };
			});
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

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '1d3',
				botname: 'Telegram',
				userid: 'u',
				groupid: 'g',
			}, { keepProof: true });

			expect(result.text).toBe('local-dice');
			expect(parseInput).toHaveBeenCalledWith(expect.objectContaining({ skipExp: true }));
			expect(courtMessage).not.toHaveBeenCalled();
		});
	});
});

describe('Phase 3aa M4 env Discord denylist', () => {
	it('ROLL_WORKER_DISCORD_DENYLIST forces module local on Discord', () => {
		const prev = process.env.ROLL_WORKER_DISCORD_DENYLIST;
		process.env.ROLL_WORKER_DISCORD_DENYLIST = 'openai,token';
		jest.unmock('../modules/roll-worker/route-table');
		jest.resetModules();
		try {
			const {
				isRemoteAllowed,
				isDiscordLocalOnly,
				getLocalDiscordOnly,
			} = require('../modules/roll-worker/route-table');
			expect(typeof getLocalDiscordOnly).toBe('function');
			expect(getLocalDiscordOnly().has('openai')).toBe(true);
			expect(isDiscordLocalOnly('token')).toBe(true);
			expect(isRemoteAllowed('openai', 'Discord')).toBe(false);
			expect(isRemoteAllowed('0-advroll', 'Discord')).toBe(true);
			expect(isRemoteAllowed('openai', 'Telegram')).toBe(true);
		} finally {
			if (prev === undefined) delete process.env.ROLL_WORKER_DISCORD_DENYLIST;
			else process.env.ROLL_WORKER_DISCORD_DENYLIST = prev;
			jest.resetModules();
		}
	});

	it('.env.copy documents ROLL_WORKER_DISCORD_DENYLIST', () => {
		const env = fs.readFileSync(path.join(ROOT, '.env.copy'), 'utf8');
		expect(env).toMatch(/ROLL_WORKER_DISCORD_DENYLIST/);
	});
});

describe('Phase 3aa M6 timeout race design contract', () => {
	it('client timeout does not send cancel; Worker has no cancel endpoint', () => {
		const clientSrc = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/client.js'), 'utf8');
		const serverSrc = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/server.js'), 'utf8');
		// Design: axios timeout aborts Gateway wait only — no /v1/cancel.
		expect(clientSrc).not.toMatch(/\/v1\/cancel/);
		expect(serverSrc).not.toMatch(/\/v1\/cancel/);
		expect(clientSrc).toMatch(/DEFAULT_TIMEOUT_MS\s*=\s*120_000/);
	});
});
