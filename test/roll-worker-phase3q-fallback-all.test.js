"use strict";

/**
 * Phase 3q: Worker outage must not spam system_busy on non-Discord platforms.
 */

describe('Phase 3q non-Discord local fallback on worker outage', () => {
	it('defaults allowLocalFallback to true for all botnames', async () => {
		await jest.isolateModulesAsync(async () => {
			const parse = jest.fn(async () => {
				throw new Error('ECONNREFUSED');
			});
			jest.doMock('../modules/roll-worker/client', () => ({
				isEnabled: () => true,
				getConfig: () => ({ url: 'http://127.0.0.1:3950', token: '', timeoutMs: 30_000 }),
				parse,
			}));
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'local-dice', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
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
				createTranslator: () => (key) => (key === 'common.errors.system_busy' ? 'BUSY' : key),
			}));

			const parseRouter = require('../modules/roll-worker/parse-router');
			const analytics = require('../modules/analytics');

			for (const botname of ['Telegram', 'Line', 'Whatsapp', 'Plurk', 'WWW']) {
				analytics.parseInput.mockClear();
				const result = await parseRouter.parseInput({
					inputStr: '1d3',
					botname,
					locale: 'zh-tw',
				});
				expect(analytics.parseInput).toHaveBeenCalled();
				expect(result.text).toBe('local-dice');
				expect(result.text).not.toBe('BUSY');
			}
		});
	});
});
