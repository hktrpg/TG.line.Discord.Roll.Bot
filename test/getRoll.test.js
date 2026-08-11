"use strict";

jest.mock('../modules/roll-worker/parse-router', () => ({
	parseInput: jest.fn(),
}));

jest.mock('../modules/i18n/i18n.js', () => ({
	DEFAULT_LOCALE: 'zh-tw',
	init: jest.fn(async () => {}),
	createTranslator: jest.fn(() => (key) => {
		if (key === 'common.errors.system_busy') return '系統忙碌中，請稍後再試。';
		return key;
	}),
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

	it('keeps original segment when dice parse returns empty', async () => {
		parseRouter.parseInput.mockResolvedValue({ text: '', type: 'text' });
		const out = await rollText('x [[2d6]] y');
		expect(out).toBe('x [[2d6]] y');
	});

	it('matches multi-line [[.ai]] prompts', async () => {
		parseRouter.parseInput.mockResolvedValue({ text: 'AI reply', type: 'text' });
		const out = await rollText('prefix [[.ai\nlong prompt\nline2]] suffix', { botname: 'Schedule' });
		expect(out).toBe('prefix AI reply suffix');
		expect(parseRouter.parseInput).toHaveBeenCalledWith(
			expect.objectContaining({ inputStr: '.ai\nlong prompt\nline2' }),
			expect.objectContaining({ allowLocalFallback: true, timeoutMs: expect.any(Number) })
		);
	});

	it('does not echo raw [[.ai]] when parse times out / returns empty', async () => {
		parseRouter.parseInput.mockResolvedValue({ text: '', type: 'text' });
		const longPrompt = `.ai ${'x'.repeat(500)}`;
		const out = await rollText(`[[${longPrompt}]]`, { locale: 'zh-tw' });
		expect(out).toBe('系統忙碌中，請稍後再試。');
		expect(out).not.toContain('.ai');
		expect(out).not.toContain('[[');
	});
});
