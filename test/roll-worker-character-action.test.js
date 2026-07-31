"use strict";

jest.mock('../modules/i18n/i18n.js', () => ({
	DEFAULT_LOCALE: 'zh-tw',
	init: jest.fn(async () => {}),
	createTranslator: jest.fn(() => (key) => key),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async ({ inputStr }) => ({
		text: `rolled:${inputStr}`,
		type: 'text',
	})),
}));

jest.mock('../roll/z_character', () => ({
	mainCharacter: jest.fn(async (_doc, _mainMsg, _inputStr) => ({
		characterReRoll: true,
		characterReRollItem: '1d3',
		characterReRollName: 'ATK',
	})),
}));

const analytics = require('../modules/analytics');
const { mainCharacter } = require('../roll/z_character');
const { runCharacterAction } = require('../modules/roll-worker/character-action');

describe('roll-worker character-action', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns error when doc/item missing', async () => {
		const result = await runCharacterAction({ doc: null, item: 'ATK' });
		expect(result.error).toBeTruthy();
	});

	it('runs mainCharacter then nested parseInput', async () => {
		const doc = { roll: [{ name: 'ATK', value: '1d3' }] };
		const result = await runCharacterAction({
			doc,
			item: 'ATK',
			locale: 'zh-tw',
			botname: 'WWW',
		});

		expect(mainCharacter).toHaveBeenCalled();
		expect(analytics.parseInput).toHaveBeenCalledWith(expect.objectContaining({
			inputStr: '1d3',
			botname: 'WWW',
		}));
		expect(result.characterResult.characterReRollName).toBe('ATK');
		expect(result.rplyVal.text).toBe('rolled:1d3');
	});
});
