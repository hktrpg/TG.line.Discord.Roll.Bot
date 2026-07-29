"use strict";

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
	findRollModuleName: jest.fn(() => '0-advroll'),
}));

jest.mock('../modules/roll-worker/character-action', () => ({
	runCharacterAction: jest.fn(),
}));

const request = require('node:http');
const { createRollWorkerApp } = require('../modules/roll-worker/server');

function listen(app) {
	return new Promise((resolve) => {
		const server = app.listen(0, '127.0.0.1', () => {
			const { port } = server.address();
			resolve({ server, port });
		});
	});
}

function httpJson(port, method, path, body, extraHeaders = {}) {
	return new Promise((resolve, reject) => {
		const data = body ? JSON.stringify(body) : null;
		const req = request.request({
			hostname: '127.0.0.1',
			port,
			path,
			method,
			headers: {
				'Content-Type': 'application/json',
				...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
				...extraHeaders,
			},
		}, (res) => {
			let raw = '';
			res.on('data', (chunk) => { raw += chunk; });
			res.on('end', () => {
				let json = null;
				try { json = raw ? JSON.parse(raw) : null; } catch { json = raw; }
				resolve({ status: res.statusCode, body: json });
			});
		});
		req.on('error', reject);
		if (data) req.write(data);
		req.end();
	});
}

describe('roll-worker HTTP server', () => {
	let server;
	let port;

	beforeAll(async () => {
		process.env.ROLL_WORKER_MODE = 'true';
		delete process.env.ROLL_WORKER_TOKEN;
		const app = createRollWorkerApp({ allowNoToken: true });
		({ server, port } = await listen(app));
	});

	afterAll(async () => {
		await new Promise((resolve) => server.close(resolve));
		delete process.env.ROLL_WORKER_MODE;
	});

	it('GET /health returns ok with counters', async () => {
		const res = await httpJson(port, 'GET', '/health');
		expect(res.status).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.role).toBe('roll-worker');
		expect(typeof res.body.parseCount).toBe('number');
	});

	it('CONNECTED log includes gateway label; health echoes gateway', async () => {
		const lines = [];
		const spy = jest.spyOn(console, 'info').mockImplementation((m) => lines.push(String(m)));
		const res = await httpJson(port, 'GET', '/health', null, {
			'X-Roll-Gateway': 'Discord+Telegram',
		});
		spy.mockRestore();
		expect(res.status).toBe(200);
		expect(res.body.gateway).toBe('Discord+Telegram');
		expect(res.body.peers['Discord+Telegram']).toBe('up');
		expect(lines.some((l) => /CONNECTED/.test(l) && /gateway=Discord\+Telegram/.test(l))).toBe(true);

		// Same gateway: no second CONNECTED edge
		const lines2 = [];
		const spy2 = jest.spyOn(console, 'info').mockImplementation((m) => lines2.push(String(m)));
		await httpJson(port, 'GET', '/health', null, { 'X-Roll-Gateway': 'Discord+Telegram' });
		spy2.mockRestore();
		expect(lines2.some((l) => /CONNECTED/.test(l))).toBe(false);

		// Different gateway process label logs separately
		const lines3 = [];
		const spy3 = jest.spyOn(console, 'info').mockImplementation((m) => lines3.push(String(m)));
		await httpJson(port, 'GET', '/health', null, { 'X-Roll-Gateway': 'Whatsapp' });
		spy3.mockRestore();
		expect(lines3.some((l) => /CONNECTED/.test(l) && /gateway=Whatsapp/.test(l))).toBe(true);
	});

	it('POST /v1/parse returns analytics result with proof marker', async () => {
		const res = await httpJson(port, 'POST', '/v1/parse', {
			inputStr: '1d3',
			botname: 'Telegram',
			locale: 'zh-tw',
		});
		expect(res.status).toBe(200);
		expect(res.body.text).toBe('1');
		expect(res.body._rollWorker).toBe(true);
	});

	it('POST /v1/parse returns needsLocal when analytics asks for it (nested)', async () => {
		const analytics = require('../modules/analytics');
		analytics.findRollModuleName.mockReturnValueOnce('z_admin');
		analytics.parseInput.mockResolvedValueOnce({
			needsLocal: true,
			moduleName: 'z_admin',
			LevelUp: 'LV UP!',
			statue: '★',
		});
		const res = await httpJson(port, 'POST', '/v1/parse', {
			inputStr: '.admin clusterhealth',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		expect(res.status).toBe(503);
		expect(res.body.needsLocal).toBe(true);
		expect(res.body.LevelUp).toBe('LV UP!');
		expect(res.body.statue).toBe('★');
		expect(res.body.moduleName).toBe('z_admin');
	});

	it('POST /v1/parse allows Discord token module through to analytics (Phase 3)', async () => {
		const analytics = require('../modules/analytics');
		analytics.findRollModuleName.mockReturnValueOnce('token');
		analytics.parseInput.mockResolvedValueOnce({ text: 'token-help', type: 'text' });
		const res = await httpJson(port, 'POST', '/v1/parse', {
			inputStr: '.token help',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		expect(res.status).toBe(200);
		expect(res.body._rollWorker).toBe(true);
		expect(res.body._rollWorkerModule).toBe('token');
		expect(res.body.text).toBe('token-help');
	});

	it('POST /v1/parse allows Discord openai module through to analytics (Phase 3b)', async () => {
		const analytics = require('../modules/analytics');
		analytics.findRollModuleName.mockReturnValueOnce('openai');
		analytics.parseInput.mockResolvedValueOnce({ text: 'ai-help', type: 'text' });
		const res = await httpJson(port, 'POST', '/v1/parse', {
			inputStr: '.ai help',
			botname: 'Discord',
			locale: 'zh-tw',
		});
		expect(res.status).toBe(200);
		expect(res.body._rollWorker).toBe(true);
		expect(res.body._rollWorkerModule).toBe('openai');
	});
});
