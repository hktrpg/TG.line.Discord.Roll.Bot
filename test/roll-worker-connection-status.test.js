"use strict";

const {
	markWorkerUp,
	markWorkerDown,
	getState,
	resetConnectionStatus,
	probeWorkerLink,
} = require('../modules/roll-worker/connection-status');

describe('roll-worker connection-status', () => {
	beforeEach(() => {
		resetConnectionStatus();
	});

	afterEach(() => {
		resetConnectionStatus();
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
});
