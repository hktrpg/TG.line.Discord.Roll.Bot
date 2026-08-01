"use strict";

/**
 * Phase 3z / Pass 12 — remaining Low fixes:
 * L3 future-ts replay, L4 discord.com allowlist, L5 symlink jail,
 * L6 health detail auth, L7 chatroom permission text, L12 mylist unknown name, L13 export wait notice.
 */

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function getJson(port, urlPath, headers = {}) {
	return new Promise((resolve, reject) => {
		http.get({
			hostname: '127.0.0.1',
			port,
			path: urlPath,
			headers,
		}, (res) => {
			let raw = '';
			res.on('data', (c) => { raw += c; });
			res.on('end', () => {
				let body = null;
				try { body = JSON.parse(raw || '{}'); } catch { body = raw; }
				resolve({ status: res.statusCode, body });
			});
		}).on('error', reject);
	});
}

describe('Phase 3z L3 reject future gateway auth ts', () => {
	it('future ts beyond skew fails; past within window ok', () => {
		const {
			attachGatewayAuth,
			verifyGatewayAuth,
			DEFAULT_CLOCK_SKEW_MS,
		} = require('../modules/roll-worker/request-auth');
		expect(DEFAULT_CLOCK_SKEW_MS).toBe(5000);
		const token = 'phase3z-hmac';
		const now = Date.now();
		const signed = attachGatewayAuth({
			inputStr: '1d3',
			userid: 'u',
			botname: 'Telegram',
		}, token, now);
		expect(verifyGatewayAuth(signed, token, { now }).ok).toBe(true);

		const future = attachGatewayAuth({
			inputStr: '1d3',
			userid: 'u',
			botname: 'Telegram',
		}, token, now + 60_000);
		const rejected = verifyGatewayAuth(future, token, { now });
		expect(rejected.ok).toBe(false);
		expect(rejected.error).toMatch(/future/i);

		const skewOk = attachGatewayAuth({
			inputStr: '1d3',
			userid: 'u',
			botname: 'Telegram',
		}, token, now + 1000);
		expect(verifyGatewayAuth(skewOk, token, { now }).ok).toBe(true);
	});
});

describe('Phase 3z L4 Discord host allowlist', () => {
	it('allows discord.com CDN and nested subdomains', () => {
		const { isDiscordCdnHost } = require('../modules/roll-worker/safe-fetch');
		expect(isDiscordCdnHost('cdn.discordapp.com')).toBe(true);
		expect(isDiscordCdnHost('cdn.discord.com')).toBe(true);
		expect(isDiscordCdnHost('media.discordapp.net')).toBe(true);
		expect(isDiscordCdnHost('a.b.cdn.discordapp.com')).toBe(true);
		expect(isDiscordCdnHost('evil.example')).toBe(false);
		expect(isDiscordCdnHost('discordapp.com.evil.example')).toBe(false);
	});
});

describe('Phase 3z L5 artifact symlink jail', () => {
	it('assertArtifactReadable rejects symlink escape outside root', () => {
		const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-3z-root-'));
		const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-3z-out-'));
		const prev = process.env.ROLL_ARTIFACT_ROOT;
		process.env.ROLL_ARTIFACT_ROOT = tmpRoot;
		try {
			jest.resetModules();
			const { assertArtifactReadable, getTempFilePath } = require('../modules/roll-worker/artifacts');
			const secret = path.join(outside, 'secret.txt');
			fs.writeFileSync(secret, 'leak');
			const link = path.join(tmpRoot, 'temp', 'escape.txt');
			fs.mkdirSync(path.dirname(link), { recursive: true });
			try {
				fs.symlinkSync(secret, link);
			} catch (error) {
				// Windows may require admin for symlinks — skip behavioral assert.
				if (error.code === 'EPERM' || error.code === 'EACCES') {
					const src = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/artifacts.js'), 'utf8');
					expect(src).toMatch(/realpathSync/);
					return;
				}
				throw error;
			}
			expect(assertArtifactReadable(link)).toBeNull();
			expect(assertArtifactReadable('temp/escape.txt')).toBeNull();
			const ok = getTempFilePath('ok.txt');
			fs.writeFileSync(ok, 'safe');
			expect(assertArtifactReadable(ok)).toBe(path.resolve(ok));
		} finally {
			if (prev === undefined) delete process.env.ROLL_ARTIFACT_ROOT;
			else process.env.ROLL_ARTIFACT_ROOT = prev;
			fs.rmSync(tmpRoot, { recursive: true, force: true });
			fs.rmSync(outside, { recursive: true, force: true });
		}
	});
});

describe('Phase 3z L6 /health counters require Bearer when token set', () => {
	it('unauthenticated health is ok-only; Bearer gets counters', async () => {
		await jest.isolateModulesAsync(async () => {
			process.env.ROLL_WORKER_TOKEN = 'phase3z-health-token';
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			const { createRollWorkerApp } = require('../modules/roll-worker/server');
			const app = createRollWorkerApp({ disableRateLimit: true });
			app.locals.stats.parseCount = 7;
			const server = await new Promise((resolve) => {
				const s = app.listen(0, '127.0.0.1', () => resolve(s));
			});
			const { port } = server.address();
			try {
				const anon = await getJson(port, '/health');
				expect(anon.status).toBe(200);
				expect(anon.body.ok).toBe(true);
				expect(anon.body.role).toBe('roll-worker');
				expect(anon.body.parseCount).toBeUndefined();
				expect(anon.body.uptime).toBeUndefined();

				const authed = await getJson(port, '/health', {
					Authorization: 'Bearer phase3z-health-token',
				});
				expect(authed.status).toBe(200);
				expect(authed.body.parseCount).toBe(7);
				expect(typeof authed.body.uptime).toBe('number');
			} finally {
				await new Promise((resolve) => server.close(resolve));
				delete process.env.ROLL_WORKER_TOKEN;
			}
		});
	});
});

describe('Phase 3z L7 chatroom permission_denied text', () => {
	it('z_multi-server returns permission_denied instead of silent return', () => {
		const src = fs.readFileSync(path.join(ROOT, 'roll/z_multi-server.js'), 'utf8');
		expect(src).toMatch(/chatroom\.permission_denied/);
		expect(src.match(/chatroom\.permission_denied/g).length).toBeGreaterThanOrEqual(3);
		for (const locale of ['zh-tw', 'zh-hans', 'en']) {
			const lang = JSON.parse(fs.readFileSync(path.join(ROOT, `lang/${locale}.json`), 'utf8'));
			expect(lang.chatroom.permission_denied.length).toBeGreaterThan(5);
		}
	});
});

describe('Phase 3z L12 mylist unknown group label', () => {
	it('uses mylist_group_unknown when name meta missing', () => {
		const src = fs.readFileSync(path.join(ROOT, 'roll/z-story-teller.js'), 'utf8');
		expect(src).toMatch(/mylist_group_unknown/);
		for (const locale of ['zh-tw', 'zh-hans', 'en']) {
			const lang = JSON.parse(fs.readFileSync(path.join(ROOT, `lang/${locale}.json`), 'utf8'));
			expect(lang.storyteller.mylist_group_unknown).toMatch(/\{\{id\}\}/);
		}
	});
});

describe('Phase 3z L13 Gateway export wait notice before remote', () => {
	it('parse-router sends wait notice and export skips when exportWaitNoticeSent', () => {
		const router = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/parse-router.js'), 'utf8');
		expect(router).toMatch(/sendDiscordExportWaitNotice/);
		expect(router).toMatch(/exportWaitNoticeSent:\s*true/);
		const exportSrc = fs.readFileSync(path.join(ROOT, 'roll/export.js'), 'utf8');
		expect(exportSrc).toMatch(/exportWaitNoticeSent/);
		expect(exportSrc).toMatch(/sendDiscordExportWaitNotice,/);
	});

	it('enrichParamsForRemote sets exportWaitNoticeSent after notice', async () => {
		await jest.isolateModulesAsync(async () => {
			const sendDiscordExportWaitNotice = jest.fn(async () => {});
			jest.doMock(require.resolve('../roll/export'), () => ({
				sendDiscordExportWaitNotice,
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(() => 'export'),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:20612', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async (params) => {
					expect(params.exportWaitNoticeSent).toBe(true);
					expect(sendDiscordExportWaitNotice).toHaveBeenCalled();
					return { text: 'exported', type: 'text', _rollWorker: true, _rollWorkerModule: 'export' };
				}),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '.discord html',
				botname: 'Discord',
				userid: 'u-export',
				groupid: 'g-export',
				channelid: 'c-export',
				discordMessage: { channel: { send: jest.fn() } },
				discordClient: {},
				exportHistoryMeta: { sum_messages: [{ contact: 'a' }], totalSize: 1 },
				t: (k) => k,
			}, { keepProof: true });

			expect(result.text).toBe('exported');
			expect(sendDiscordExportWaitNotice).toHaveBeenCalledTimes(1);
		});
	});
});
