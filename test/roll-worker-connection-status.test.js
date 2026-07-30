"use strict";

const {
	markWorkerUp,
	markWorkerDown,
	getState,
	resetConnectionStatus,
	probeWorkerLink,
	markStandbyUp,
	markStandbyDown,
	getStandbyState,
	resetStandbyConnectionStatus,
	probeStandbyLink,
} = require('../modules/roll-worker/connection-status');

describe('roll-worker connection-status', () => {
	beforeEach(() => {
		resetConnectionStatus();
		resetStandbyConnectionStatus();
	});

	afterEach(() => {
		resetConnectionStatus();
		resetStandbyConnectionStatus();
	});

	it('logs CONNECTED only on edge up', () => {
		const lines = [];
		const logger = { info: (m) => lines.push(m), warn: () => {}, log: () => {} };
		expect(markWorkerUp({ url: 'http://127.0.0.1:3950', logger })).toBe(true);
		expect(markWorkerUp({ url: 'http://127.0.0.1:3950', logger })).toBe(false);
		expect(getState()).toBe('up');
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatch(/CONNECTED/);
	});

	it('logs DISCONNECTED only on edge down', () => {
		const lines = [];
		const logger = {
			info: () => {},
			warn: (m) => lines.push(m),
			log: () => {},
		};
		markWorkerUp({ logger: { info: () => {}, warn: () => {}, log: () => {} } });
		expect(markWorkerDown({ url: 'http://x', reason: 'ECONNREFUSED', logger })).toBe(true);
		expect(markWorkerDown({ url: 'http://x', reason: 'again', logger })).toBe(false);
		expect(getState()).toBe('down');
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatch(/DISCONNECTED/);
		expect(lines[0]).toMatch(/ECONNREFUSED/);
	});

	it('probeWorkerLink marks up/down from healthFn', async () => {
		const lines = [];
		const logger = {
			info: (m) => lines.push(`I:${m}`),
			warn: (m) => lines.push(`W:${m}`),
			log: () => {},
		};
		await probeWorkerLink({
			healthFn: async () => ({ ok: true, auth: 'required' }),
			getUrl: () => 'http://127.0.0.1:3950',
			logger,
		});
		expect(getState()).toBe('up');
		expect(lines.some((l) => /CONNECTED/.test(l))).toBe(true);

		await probeWorkerLink({
			healthFn: async () => { throw new Error('connect ECONNREFUSED'); },
			getUrl: () => 'http://127.0.0.1:3950',
			logger,
		});
		expect(getState()).toBe('down');
		expect(lines.some((l) => /DISCONNECTED/.test(l))).toBe(true);
	});

	it('Standby recovery CONNECTED is visible even when info logger is silenced', () => {
		const warns = [];
		const infos = [];
		const logger = {
			info: () => {},
			warn: (m) => warns.push(m),
			log: () => {},
		};
		const spy = jest.spyOn(console, 'info').mockImplementation((m) => infos.push(m));
		try {
			markStandbyDown({ url: 'http://127.0.0.1:3951', reason: 'ECONNREFUSED', logger });
			expect(warns.some((l) => /DISCONNECTED/.test(l))).toBe(true);
			expect(markStandbyUp({
				url: 'http://127.0.0.1:3951',
				detail: 'health ok',
				logger,
			})).toBe(true);
			expect(getStandbyState()).toBe('up');
			expect(infos.some((l) => /\[StandbyLink\] CONNECTED/.test(l) && /was=down/.test(l))).toBe(true);
		} finally {
			spy.mockRestore();
		}
	});
});
