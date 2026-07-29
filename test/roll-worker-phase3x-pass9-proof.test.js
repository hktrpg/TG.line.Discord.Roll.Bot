"use strict";

/**
 * Phase 3x / Pass 9 proof tests — fill docs/roll-worker.md coverage gaps:
 * redirect refuse (M2), OpenAI bare needsLocal (M3), WWW character-action fail-closed (M1),
 * timeout default (M5), fail-closed mutators behavioral (H2), nested needsLocal (M13),
 * level invalidate sticky (H4), Discord getGroupGms (H3), artifact writers (M9–M11),
 * .bk/.cmd reload hooks (M7/M12), slashDeploy defer (M14), schedule save errors (M15),
 * statue←status (L14).
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const ROOT = path.join(__dirname, '..');

describe('Phase 3x M2 safe-fetch refuses redirects', () => {
	it('pinnedFetchBuffer rejects HTTP 302 with FETCH_REDIRECT', async () => {
		await jest.isolateModulesAsync(async () => {
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
					res.statusCode = 302;
					res.headers = { location: 'https://evil.example/steal' };
					res.resume = () => {};
					const req = {
						on() { return req; },
						end() { cb(res); },
						destroy() {},
					};
					return req;
				},
			}));
			const { safeFetchBuffer } = require('../modules/roll-worker/safe-fetch');
			await expect(
				safeFetchBuffer('https://cdn.discordapp.com/attachments/1/2/x.bin', { maxBytes: 128 })
			).rejects.toMatchObject({ code: 'FETCH_REDIRECT' });
		});
	});

	it('pinnedFetchBuffer connects to resolved IP with Host header (IP pin)', async () => {
		await jest.isolateModulesAsync(async () => {
			let seenOpts = null;
			jest.doMock('../utils/is-image-url', () => ({
				isSafeImageTarget: jest.fn(async () => true),
				resolvePublicFetchTarget: jest.fn(async () => ({
					address: '203.0.113.9',
					protocol: 'https:',
					port: 443,
					path: '/attachments/9/9/pin.bin',
					headers: { Host: 'cdn.discordapp.com', 'User-Agent': 't', Accept: '*/*' },
				})),
			}));
			jest.doMock('node:https', () => ({
				request: (opts, cb) => {
					seenOpts = opts;
					const res = new EventEmitter();
					res.statusCode = 200;
					res.headers = { 'content-type': 'application/octet-stream' };
					res.resume = () => {};
					const req = {
						on() { return req; },
						end() {
							cb(res);
							res.emit('data', Buffer.from('pinned'));
							res.emit('end');
						},
						destroy() {},
					};
					return req;
				},
			}));
			const { safeFetchBuffer } = require('../modules/roll-worker/safe-fetch');
			const out = await safeFetchBuffer(
				'https://cdn.discordapp.com/attachments/9/9/pin.bin',
				{ maxBytes: 64 }
			);
			expect(seenOpts.host).toBe('203.0.113.9');
			expect(seenOpts.headers.Host).toBe('cdn.discordapp.com');
			expect(seenOpts.servername).toBe('cdn.discordapp.com');
			expect(out.buffer.toString()).toBe('pinned');
		});
	});
});

describe('Phase 3x M3 OpenAI bare Discord .ai → needsLocal', () => {
	it('openai.js returns needsLocal for bare Discord Worker .ai*', () => {
		const src = fs.readFileSync(path.join(ROOT, 'roll/openai.js'), 'utf8');
		expect(src).toMatch(/Bare Discord \.ai\*/);
		expect(src).toMatch(/needsLocal:\s*true,\s*moduleName:\s*'openai'/);
		expect(src).toMatch(/ROLL_WORKER_MODE/);
		// Explicit help stays remote (return help before needsLocal branch).
		const helpIdx = src.indexOf("mainMsg[1] === 'help'");
		const needsLocalIdx = src.indexOf("needsLocal: true, moduleName: 'openai'");
		expect(helpIdx).toBeGreaterThan(-1);
		expect(needsLocalIdx).toBeGreaterThan(helpIdx);
	});
});

describe('Phase 3x M1 WWW character-action fail-closed', () => {
	it('core-www resolveCharacterAction catch returns system_busy without local retry', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/core-www.js'), 'utf8');
		const fnIdx = src.indexOf('async function resolveCharacterAction');
		expect(fnIdx).toBeGreaterThan(-1);
		const block = src.slice(fnIdx, fnIdx + 900);
		expect(block).toMatch(/no local retry/);
		expect(block).toMatch(/system_busy/);
		expect(block).toMatch(/rollWorkerClient\.isEnabled\(\)/);
		expect(block).toMatch(/return runCharacterAction/);
		const catchIdx = block.indexOf('} catch (error)');
		expect(catchIdx).toBeGreaterThan(-1);
		// Local runCharacterAction must not appear inside the catch block.
		const afterCatch = block.slice(catchIdx);
		const endCatch = afterCatch.indexOf('\n    }');
		const catchBody = afterCatch.slice(0, endCatch === -1 ? afterCatch.length : endCatch);
		expect(catchBody).not.toMatch(/runCharacterAction/);
	});
});

describe('Phase 3x M5 default timeout 120s', () => {
	it('client DEFAULT_TIMEOUT_MS is 120000', async () => {
		await jest.isolateModulesAsync(async () => {
			const prev = process.env.ROLL_WORKER_TIMEOUT_MS;
			delete process.env.ROLL_WORKER_TIMEOUT_MS;
			const { DEFAULT_TIMEOUT_MS, getConfig } = require('../modules/roll-worker/client');
			expect(DEFAULT_TIMEOUT_MS).toBe(120_000);
			process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
			expect(getConfig().timeoutMs).toBe(120_000);
			if (prev === undefined) delete process.env.ROLL_WORKER_TIMEOUT_MS;
			else process.env.ROLL_WORKER_TIMEOUT_MS = prev;
		});
	});
});

describe('Phase 3x H2 fail-closed mutators behavioral', () => {
	it.each([
		'z_schedule',
		'z_character',
		'z_saveCommand',
		'z_Level_system',
		'z_stop',
		'z_DDR_darkRollingToGM',
	])('%s workerError → system_busy and zero local parseInput', async (moduleName) => {
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
				findRollModuleName: jest.fn(() => moduleName),
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
					key === 'common.errors.system_busy' ? 'BUSY_FAIL_CLOSED' : key
				),
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: `.mutator-${moduleName}`,
				botname: 'Telegram',
				locale: 'zh-tw',
				userid: 'u',
				groupid: 'g',
			}, { keepProof: true });

			expect(parseInput).not.toHaveBeenCalled();
			expect(result.text).toBe('BUSY_FAIL_CLOSED');
		});
	});
});

describe('Phase 3x M13 nested needsLocal re-runs nested only', () => {
	it('Gateway parseInput uses nestedInputStr when nestedNeedsLocal', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: 'NESTED_LOCAL', type: 'text' }));
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({
					needsLocal: true,
					nestedNeedsLocal: true,
					nestedInputStr: '1d20',
					moduleName: 'z_character',
					parentResult: {
						characterReRoll: true,
						text: 'PARENT_ALREADY_MUTATED',
						characterName: 'Hero',
						characterReRollName: 'atk',
					},
					LevelUp: '',
					statue: '',
				})),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput,
				findRollModuleName: jest.fn(() => 'z_character'),
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
				createTranslator: () => (key, vars) => {
					if (key === 'character.reroll_combined') {
						return `COMBINED:${vars.original}|${vars.roll}`;
					}
					return key;
				},
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const result = await parseRouter.parseInput({
				inputStr: '.ch atk',
				botname: 'Discord',
				userid: 'u',
				groupid: 'g',
				discordClient: {},
				discordMessage: {},
			}, { keepProof: true });

			expect(parseInput).toHaveBeenCalledTimes(1);
			expect(parseInput).toHaveBeenCalledWith(expect.objectContaining({
				inputStr: '1d20',
				skipExp: true,
			}));
			expect(result.text).toBe('COMBINED:PARENT_ALREADY_MUTATED|NESTED_LOCAL');
		});
	});
});

describe('Phase 3x H4 level invalidate clears sticky tempSwitchV2', () => {
	it('invalidateGroupConfig source clears gpInfoCache and tempSwitchV2 splice', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/chat/level.js'), 'utf8');
		const idx = src.indexOf('function invalidateGroupConfig');
		expect(idx).toBeGreaterThan(-1);
		const block = src.slice(idx, idx + 400);
		expect(block).toMatch(/gpInfoCache\.delete\(groupid\)/);
		expect(block).toMatch(/tempSwitchV2\.splice/);
		expect(block).toMatch(/tempSwitchV2\[i\]\.groupid\s*==\s*groupid/);
	});

	it('parse-router calls invalidateGroupConfig after remoted z_Level_system', async () => {
		await jest.isolateModulesAsync(async () => {
			const invalidateGroupConfig = jest.fn();
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({
					text: 'level-on',
					type: 'text',
					_rollWorker: true,
					_rollWorkerModule: 'z_Level_system',
				})),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(() => 'z_Level_system'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/chat/level', () => ({
				invalidateGroupConfig,
				tempSwitchV2: [],
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
			await parseRouter.parseInput({
				inputStr: '.level config on',
				botname: 'Telegram',
				userid: 'u',
				groupid: 'g-level',
			}, { keepProof: true });

			expect(invalidateGroupConfig).toHaveBeenCalledWith('g-level');
		});
	});
});

describe('Phase 3x H3 Discord dark-roll uses getGroupGms', () => {
	it('privateMsgFinder delegates to darkRolling.getGroupGms', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
		const idx = src.indexOf('async function privateMsgFinder');
		expect(idx).toBeGreaterThan(-1);
		const block = src.slice(idx, idx + 250);
		expect(block).toMatch(/darkRolling\.getGroupGms\(channelid\)/);
		expect(block).not.toMatch(/TargetGM/);
	});
});

describe('Phase 3x M9–M11 artifact writers use getTempFilePath', () => {
	it('wheel / .st export / openai createFile call getTempFilePath', () => {
		const wheel = fs.readFileSync(path.join(ROOT, 'roll/wheel-animator.js'), 'utf8');
		const story = fs.readFileSync(path.join(ROOT, 'roll/z-story-teller.js'), 'utf8');
		const openai = fs.readFileSync(path.join(ROOT, 'roll/openai.js'), 'utf8');
		expect(wheel).toMatch(/getTempFilePath\(filename\)/);
		expect(story).toMatch(/getTempFilePath\(/);
		expect(openai).toMatch(/getTempFilePath\(name\)/);
	});

	it('getTempFilePath writes under ROLL_ARTIFACT_ROOT/temp', () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hktrpg-3x-art-'));
		const prev = process.env.ROLL_ARTIFACT_ROOT;
		process.env.ROLL_ARTIFACT_ROOT = tmpDir;
		try {
			jest.resetModules();
			const { getTempFilePath, assertArtifactReadable } = require('../modules/roll-worker/artifacts');
			const file = getTempFilePath('proof-3x.bin');
			expect(file.startsWith(path.join(tmpDir, 'temp'))).toBe(true);
			fs.writeFileSync(file, 'artifact-ok');
			expect(assertArtifactReadable(file)).toBe(path.resolve(file));
		} finally {
			if (prev === undefined) delete process.env.ROLL_ARTIFACT_ROOT;
			else process.env.ROLL_ARTIFACT_ROOT = prev;
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe('Phase 3x M7/M12 .bk / .cmd reload hooks', () => {
	it('invalidateCachesAfterRemote calls reloadFromDb for z_stop and z_saveCommand', async () => {
		await jest.isolateModulesAsync(async () => {
			const reloadStop = jest.fn(async () => {});
			const reloadCmd = jest.fn(async () => {});
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn()
					.mockResolvedValueOnce({
						text: 'bk-ok', type: 'text', _rollWorker: true, _rollWorkerModule: 'z_stop',
					})
					.mockResolvedValueOnce({
						text: 'cmd-ok', type: 'text', _rollWorker: true, _rollWorkerModule: 'z_saveCommand',
					}),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn()
					.mockReturnValueOnce('z_stop')
					.mockReturnValueOnce('z_saveCommand'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock(require.resolve('../roll/z_stop'), () => ({ reloadFromDb: reloadStop }));
			jest.doMock(require.resolve('../roll/z_saveCommand'), () => ({ reloadFromDb: reloadCmd }));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			await parseRouter.parseInput({
				inputStr: '.bk add x',
				botname: 'Telegram',
				userid: 'u',
				groupid: 'g',
			}, { keepProof: true });
			await parseRouter.parseInput({
				inputStr: '.cmd add x y',
				botname: 'Telegram',
				userid: 'u',
				groupid: 'g',
			}, { keepProof: true });

			await new Promise((r) => setImmediate(r));
			expect(reloadStop).toHaveBeenCalled();
			expect(reloadCmd).toHaveBeenCalled();
		});
	});
});

describe('Phase 3x M14 slashDeploy deferred', () => {
	it('z_admin sets gatewayAction slashDeploy; Discord bot applies it', () => {
		const admin = fs.readFileSync(path.join(ROOT, 'roll/z_admin.js'), 'utf8');
		const bot = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
		expect(admin).toMatch(/type:\s*'slashDeploy'/);
		expect(admin).toMatch(/slashDeployMeta\?\.deferred/);
		expect(bot).toMatch(/gatewayAction\?\.type === 'slashDeploy'/);
	});
});

describe('Phase 3x M15 schedule Agenda save errors surfaced', () => {
	it('z_schedule + lang keys expose at_save_error / cron_save_error', () => {
		const schedule = fs.readFileSync(path.join(ROOT, 'roll/z_schedule.js'), 'utf8');
		expect(schedule).toMatch(/schedule\.at_save_error/);
		expect(schedule).toMatch(/schedule\.cron_save_error/);
		for (const locale of ['zh-tw', 'zh-hans', 'en']) {
			const lang = JSON.parse(fs.readFileSync(path.join(ROOT, `lang/${locale}.json`), 'utf8'));
			expect(lang.schedule.at_save_error.length).toBeGreaterThan(5);
			expect(lang.schedule.cron_save_error.length).toBeGreaterThan(5);
		}
	});
});

describe('Phase 3x L14 statue ← status', () => {
	it('analytics assigns result.statue from tempEXPUP.status', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/analytics.js'), 'utf8');
		expect(src).toMatch(/result\.statue\s*=\s*tempEXPUP\?\.status/);
	});
});

describe('Phase 3x L1 Bearer timingSafeEqual', () => {
	it('server compares bearer with timingSafeEqual', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/server.js'), 'utf8');
		expect(src).toMatch(/function timingSafeTokenEqual/);
		expect(src).toMatch(/crypto\.timingSafeEqual/);
		expect(src).toMatch(/timingSafeTokenEqual\(token,\s*expectedToken\)/);
	});
});

describe('Phase 3x L11 VIP invalidate after remoted z_admin', () => {
	it('parse-router invalidates VIP cache after remoted z_admin', async () => {
		await jest.isolateModulesAsync(async () => {
			const invalidateCache = jest.fn();
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: 't', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({
					text: 'admin-ok',
					type: 'text',
					_rollWorker: true,
					_rollWorkerModule: 'z_admin',
				})),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(),
				findRollModuleName: jest.fn(() => 'z_admin'),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache: jest.fn(),
			}));
			jest.doMock('../modules/patreon/veryImportantPerson', () => ({
				invalidateCache,
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			await parseRouter.parseInput({
				inputStr: '.admin vip',
				botname: 'Telegram',
				userid: 'u',
				groupid: 'g',
			}, { keepProof: true });

			expect(invalidateCache).toHaveBeenCalled();
		});
	});
});

describe('Phase 3x M8 export prefetch skips denied read', () => {
	it('discord-prefetch skips history when !hasReadPermission', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/discord-prefetch.js'), 'utf8');
		expect(src).toMatch(/if\s*\(!hasReadPermission\)\s*\{/);
		expect(src).toMatch(/exportHistoryMeta:\s*\{\s*sum_messages:\s*\[\],\s*totalSize:\s*0\s*\}/);
	});
});
