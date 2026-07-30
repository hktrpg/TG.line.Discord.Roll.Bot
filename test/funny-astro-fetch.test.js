"use strict";

jest.mock('axios', () => {
	const actual = jest.requireActual('axios');
	return {
		...actual,
		get: jest.fn(),
		default: actual,
	};
});

const axios = require('axios');
const { TwelveAstro } = require('../roll/1-funny');

describe('TwelveAstro fetchAstroHtml', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('uses axios (not curl.exe) and returns HTML body', async () => {
		axios.get.mockResolvedValue({
			status: 200,
			data: '<html><body>星座運勢 test</body></html>',
		});
		const astro = new TwelveAstro();
		const html = await astro.fetchAstroHtml(
			'https://astro.click108.com.tw/daily_2.php?iAstro=2&iType=0&iAcDay=2026-08-01'
		);
		expect(html).toContain('星座運勢');
		expect(axios.get).toHaveBeenCalledTimes(1);
		const [url, opts] = axios.get.mock.calls[0];
		expect(url).toContain('click108.com.tw');
		expect(opts.httpsAgent).toBeDefined();
		expect(opts.timeout).toBe(15_000);
	});

	it('rejects empty body', async () => {
		axios.get.mockResolvedValue({ status: 200, data: '   ' });
		const astro = new TwelveAstro();
		await expect(astro.fetchAstroHtml('https://example.com/x')).rejects.toThrow(/empty/i);
	});
});
