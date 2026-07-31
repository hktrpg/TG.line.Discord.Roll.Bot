"use strict";

jest.mock('../modules/roll-worker/parse-router', () => ({
	parseInput: jest.fn(),
}));

const parseRouter = require('../modules/roll-worker/parse-router');
const { rollText } = require('../modules/chat/getRoll');

describe('getRoll.rollText via parseRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('replaces [[expr]] using parseRouter result text', async () => {
		parseRouter.parseInput.mockResolvedValue({ text: '42', type: 'text' });
		const out = await rollText('roll [[1d100]] now', { botname: 'Telegram', locale: 'zh-tw' });
		expect(out).toBe('roll 42 now');
		expect(parseRouter.parseInput).toHaveBeenCalledWith(expect.objectContaining({
			inputStr: '1d100',
			botname: 'Telegram',
			locale: 'zh-tw',
			skipExp: true,
		}), { allowLocalFallback: true });
	});

	it('keeps original segment when parse returns empty', async () => {
		parseRouter.parseInput.mockResolvedValue({ text: '', type: 'text' });
		const out = await rollText('x [[2d6]] y');
		expect(out).toBe('x [[2d6]] y');
	});
});
