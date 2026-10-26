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
		// Use Axios/Node's default certificate verification, without a TLS bypass.
		expect(opts.httpsAgent).toBeUndefined();
		expect(opts.timeout).toBe(15_000);
	});

	it('propagates TLS certificate validation failures', async () => {
		const error = Object.assign(new Error('certificate has expired'), { code: 'CERT_HAS_EXPIRED' });
		axios.get.mockRejectedValue(error);
		const astro = new TwelveAstro();
		await expect(astro.fetchAstroHtml('https://example.com/x')).rejects.toBe(error);
		expect(axios.get.mock.calls.every(([, opts]) => opts.httpsAgent === undefined)).toBe(true);
	});

	it('rejects empty body', async () => {
		axios.get.mockResolvedValue({ status: 200, data: '   ' });
		const astro = new TwelveAstro();
		await expect(astro.fetchAstroHtml('https://example.com/x')).rejects.toThrow(/empty/i);
	});
});
