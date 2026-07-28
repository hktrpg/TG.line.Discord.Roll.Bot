"use strict";

jest.mock('../modules/roll-worker/client', () => ({
	isEnabled: jest.fn(),
	getConfig: jest.fn(() => ({
		url: 'http://127.0.0.1:3950',
		token: '',
		timeoutMs: 30_000,
	})),
	parse: jest.fn(),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async () => ({ text: 'local-ok', type: 'text' })),
	findRollModuleName: jest.fn(() => '2-coc'),
}));

jest.mock('../modules/i18n/i18n.js', () => {
	const DEFAULT_LOCALE = 'zh-tw';
	return {
		DEFAULT_LOCALE,
		init: jest.fn(async () => {}),
		createTranslator: jest.fn(() => (key) => {
			if (key === 'common.errors.system_busy') {
				return 'SYSTEM_BUSY_I18N';
			}
			return key;
		}),
	};
});

const client = require('../modules/roll-worker/client');
const analytics = require('../modules/analytics');
const parseRouter = require('../modules/roll-worker/parse-router');

describe('roll-worker parse-router', () => {
	const originalEnv = process.env.ROLL_WORKER_URL;

	beforeEach(() => {
		jest.clearAllMocks();
		delete process.env.ROLL_WORKER_URL;
		client.isEnabled.mockReturnValue(false);
		analytics.findRollModuleName.mockReturnValue('2-coc');
		analytics.parseInput.mockResolvedValue({ text: 'local-ok', type: 'text' });
	});

	afterAll(() => {
		if (originalEnv === undefined) {
			delete process.env.ROLL_WORKER_URL;
		} else {
			process.env.ROLL_WORKER_URL = originalEnv;
		}
	});

	it('uses local analytics when worker URL is unset', async () => {
		const result = await parseRouter.parseInput({
			inputStr: 'cc 50',
			botname: 'Telegram',
			locale: 'zh-tw',
		});
		expect(analytics.parseInput).toHaveBeenCalled();
		expect(client.parse).not.toHaveBeenCalled();
		expect(result.text).toBe('local-ok');
	});

	it('routes Telegram allowlisted rolls to worker', async () => {
		client.isEnabled.mockReturnValue(true);
		client.parse.mockResolvedValue({ text: 'remote-ok', type: 'text' });

		const result = await parseRouter.parseInput({
			inputStr: 'cc 50',
			botname: 'Telegram',
			locale: 'zh-tw',
		});

		expect(client.parse).toHaveBeenCalled();
		expect(result.text).toBe('remote-ok');
	});

	it('falls back to local for Discord when worker errors (ops only)', async () => {
		client.isEnabled.mockReturnValue(true);
		client.parse.mockRejectedValue(new Error('ECONNREFUSED'));

		const result = await parseRouter.parseInput({
			inputStr: 'cc 50',
			botname: 'Discord',
			locale: 'zh-tw',
		});

		expect(analytics.parseInput).toHaveBeenCalled();
		expect(result.text).toBe('local-ok');
		expect(result.text).not.toContain('SYSTEM_BUSY');
	});

	it('returns i18n busy text for non-Discord when worker errors', async () => {
		client.isEnabled.mockReturnValue(true);
		client.parse.mockRejectedValue(new Error('ECONNREFUSED'));

		const result = await parseRouter.parseInput({
			inputStr: 'cc 50',
			botname: 'Telegram',
			locale: 'zh-tw',
		});

		expect(result.text).toBe('SYSTEM_BUSY_I18N');
		expect(analytics.parseInput).not.toHaveBeenCalled();
	});

	it('Phase 3j: Discord remotes matched modules even if not on legacy allowlist', async () => {
		client.isEnabled.mockReturnValue(true);
		client.parse.mockResolvedValue({ text: 'remote-ok', type: 'text', _rollWorker: true });
		analytics.findRollModuleName.mockReturnValue('future-new-module');

		const result = await parseRouter.parseInput({
			inputStr: '.futurecmd',
			botname: 'Discord',
			locale: 'zh-tw',
		}, { keepProof: true });

		expect(client.parse).toHaveBeenCalled();
		expect(result.text).toBe('remote-ok');
	});

	it('Phase 3j: Discord unmatched (null module) stays local', async () => {
		client.isEnabled.mockReturnValue(true);
		analytics.findRollModuleName.mockReturnValue(null);

		const result = await parseRouter.parseInput({
			inputStr: 'hello unrelated chat',
			botname: 'Discord',
			locale: 'zh-tw',
		});

		expect(client.parse).not.toHaveBeenCalled();
		expect(analytics.parseInput).toHaveBeenCalled();
		expect(result.text).toBe('local-ok');
	});
});
