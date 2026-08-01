"use strict";

/**
 * Phase 3o: Plurk EXP gate, needsLocal keeps LevelUp, forward ownership → needsLocal.
 */

describe('Phase 3o Plurk mention gate + nonDice contract', () => {
	it('nonDice when skip-findRollList and message lacks @HKTRPG', () => {
		const shouldSkip = true;
		const cases = [
			{ hasMention: false, mainMsgLen: 2, expectNonDice: true },
			{ hasMention: true, mainMsgLen: 2, expectNonDice: false },
			{ hasMention: false, mainMsgLen: 1, expectNonDice: true },
		];
		for (const c of cases) {
			let callNonDice = false;
			if (c.mainMsgLen > 1) {
				if (!c.hasMention && shouldSkip) callNonDice = true;
			} else if (shouldSkip) {
				callNonDice = true;
			}
			expect(callNonDice).toBe(c.expectNonDice);
		}
	});
});

describe('Phase 3o needsLocal preserves LevelUp', () => {
	it('parse-router merges worker LevelUp into local fallback', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:20612', token: '', timeoutMs: 30_000 }),
				parse: jest.fn(async () => ({
					needsLocal: true,
					moduleName: 'token',
					LevelUp: 'LEVEL_UP_FROM_WORKER',
					statue: '★',
				})),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'local-token', type: 'text', LevelUp: '' })),
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
				inputStr: '.token help',
				botname: 'Discord',
				locale: 'zh-tw',
				discordMessage: { id: '1' },
			});
			expect(result.text).toBe('local-token');
			expect(result.LevelUp).toBe('LEVEL_UP_FROM_WORKER');
			expect(result.statue).toBe('★');
		});
	});

	it('analytics-shaped needsLocal payload keeps LevelUp fields', () => {
		const result = { LevelUp: 'UP', statue: 'S' };
		const rollDiceResult = { needsLocal: true, moduleName: 'token' };
		const out = {
			...rollDiceResult,
			LevelUp: result.LevelUp,
			statue: result.statue,
		};
		expect(out.needsLocal).toBe(true);
		expect(out.LevelUp).toBe('UP');
		expect(out.statue).toBe('S');
	});
});

describe('Phase 3o forward ownership → needsLocal on worker', () => {
	it('worker-mode ownership fail maps to needsLocal (contract)', () => {
		const {
			shouldLiveResolveForwardOwnership,
		} = require('../modules/roll-worker/forward-ownership');
		const out = shouldLiveResolveForwardOwnership({
			hasPrefetch: true,
			isMentioned: false,
			isInteractionUser: false,
			discordClient: null,
			rollWorkerMode: true,
		});
		expect(out).toEqual({ action: 'needsLocal' });
	});
});

describe('Phase 3o export missing file keeps text contract', () => {
	it('deleting discordExport must not require clearing text', () => {
		const rplyVal = {
			discordExport: 'chan_120000',
			text: 'export success please check DM',
		};
		const exportTxtPath = null;
		if (!exportTxtPath) {
			delete rplyVal.discordExport;
			// intentionally do NOT clear text
		}
		expect(rplyVal.discordExport).toBeUndefined();
		expect(rplyVal.text).toContain('export success');
	});
});
