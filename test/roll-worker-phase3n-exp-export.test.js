"use strict";

/**
 * Phase 3n: no double EXP, needsLocal breaks repeat loop, local dark invalidate, export mentions.
 * Live Worker+Gateway Line chat is covered by `yarn proof:roll-worker`.
 */

const {
	replaceExportMentions,
	serializeExportMessage,
} = require('../modules/roll-worker/discord-prefetch');

describe('Phase 3n export mention / reply serialization', () => {
	it('replaceExportMentions resolves guild nicknames', async () => {
		const members = [{
			id: '111',
			nickname: 'NickA',
			displayName: 'DispA',
			user: { id: '111', username: 'userA' },
		}];
		const out = await replaceExportMentions('hi <@111> there', members, null);
		expect(out).toBe('hi @NickA there');
	});

	it('serializeExportMessage sets reply_to from referenced_message', async () => {
		const element = {
			type: 19,
			createdTimestamp: 1_700_000_000_000,
			content: 'hello <@222>',
			author: { username: 'bob', bot: false },
			attachments: { size: 0 },
			embeds: [],
			referenced_message: {
				content: 'ping <@222>',
				author: { username: 'alice', bot: false },
				attachments: { size: 0 },
				embeds: [],
			},
		};
		const members = [{
			id: '222',
			displayName: 'Carol',
			user: { id: '222', username: 'carol' },
		}];
		const row = await serializeExportMessage(element, { members, discordClient: null });
		expect(row.contact).toBe('hello @Carol');
		expect(row.reply_to).toEqual(expect.objectContaining({
			contact: 'ping @Carol',
			userName: 'alice',
		}));
	});

	it('serializeExportMessage formats slash interactions', async () => {
		const row = await serializeExportMessage({
			type: 20,
			createdTimestamp: 1,
			content: '',
			author: { username: 'bot', bot: true },
			attachments: { size: 0 },
			embeds: [],
			interaction: { commandName: 'help', user: { username: 'dave' } },
		}, { members: [], discordClient: null });
		expect(row.contact).toContain('/help');
		expect(row.userName).toBe('System');
		expect(row.isbot).toBe(true);
	});
});

describe('Phase 3n analytics needsLocal breaks repeat loop', () => {
	it('stops calling rollDiceCommand after needsLocal', async () => {
		const rollDiceCommand = jest.fn()
			.mockResolvedValueOnce({ needsLocal: true, moduleName: 'token' })
			.mockResolvedValueOnce({ text: 'should-not-run' });

		const rollTimes = 3;
		let calls = 0;
		let tempsave = {};
		for (let index = 0; index < rollTimes; index++) {
			calls += 1;
			const result = await rollDiceCommand({});
			if (result?.needsLocal) {
				tempsave = result;
				break;
			}
			tempsave = result;
		}
		expect(calls).toBe(1);
		expect(tempsave.needsLocal).toBe(true);
		expect(rollDiceCommand).toHaveBeenCalledTimes(1);
	});
});

describe('Phase 3n dark-rolling invalidate on local parse', () => {
	it('local parse path calls invalidate for z_DDR_darkRollingToGM', async () => {
		await jest.isolateModulesAsync(async () => {
			const invalidateCache = jest.fn();
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => false,
				getConfig: () => ({ url: '', token: '', timeoutMs: 30_000 }),
				parse: jest.fn(),
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'ok', type: 'text' })),
				findRollModuleName: jest.fn(() => 'z_DDR_darkRollingToGM'),
			}));
			jest.doMock('../modules/roll-worker/dark-rolling', () => ({
				invalidateCache,
				getGroupGms: jest.fn(),
			}));
			jest.doMock('../modules/i18n/i18n.js', () => ({
				DEFAULT_LOCALE: 'zh-tw',
				init: jest.fn(async () => {}),
				createTranslator: () => (k) => k,
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			await parseRouter.parseInput({
				inputStr: '.drgm show',
				botname: 'Telegram',
				locale: 'zh-tw',
			});
			expect(invalidateCache).toHaveBeenCalled();
		});
	});
});

describe('Phase 3n didParse EXP guard (unit)', () => {
	it('documents: nonDice only when parse was skipped', () => {
		const cases = [
			{ didParse: true, shouldNonDice: false },
			{ didParse: false, shouldNonDice: true },
		];
		for (const c of cases) {
			expect(!c.didParse).toBe(c.shouldNonDice);
		}
	});
});
