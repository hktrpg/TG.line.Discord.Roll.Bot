"use strict";

/**
 * ParseMode banner / quiet supervised-child boot contracts.
 */
jest.mock('../modules/roll-worker/client', () => ({
	isEnabled: jest.fn(() => true),
	isLocalEnabled: jest.fn(() => false),
	getConfig: jest.fn(() => ({
		url: 'http://127.0.0.1:20612',
		token: 'tok',
		timeoutMs: 120_000,
	})),
	getLocalConfig: jest.fn(() => ({
		url: '',
		token: 'tok',
		timeoutMs: 120_000,
	})),
	parse: jest.fn(),
	parseLocal: jest.fn(),
	beginLinkMonitor: jest.fn(),
	beginStandbyLinkMonitor: jest.fn(),
}));

jest.mock('../modules/analytics', () => ({
	parseInput: jest.fn(async () => ({ text: 'ok', type: 'text' })),
	findRollModuleName: jest.fn(() => '0-advroll'),
}));

jest.mock('../modules/i18n/i18n.js', () => ({
	DEFAULT_LOCALE: 'zh-tw',
	init: jest.fn(async () => {}),
	createTranslator: jest.fn(() => (key) => key),
}));

const fs = require('node:fs');
const path = require('node:path');
const client = require('../modules/roll-worker/client');
const parseRouter = require('../modules/roll-worker/parse-router');

const ROOT = path.join(__dirname, '..');

describe('logParseMode banner + monitors', () => {
	const prevUrl = process.env.ROLL_WORKER_URL;
	const prevMode = process.env.ROLL_WORKER_MODE;
	const prevRemote = process.env.ROLL_WORKER_REMOTE_ONLY;
	const prevSpawn = process.env.ROLL_WORKER_SPAWN;

	beforeEach(() => {
		jest.clearAllMocks();
		parseRouter.resetWorkersReadyForTests();
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:20612';
		delete process.env.ROLL_WORKER_MODE;
		delete process.env.ROLL_WORKER_REMOTE_ONLY;
		// Jest harness: ensureWorkersReady skips live health unless SPAWN=true
		delete process.env.ROLL_WORKER_SPAWN;
		client.isEnabled.mockReturnValue(true);
		client.isLocalEnabled.mockReturnValue(false);
		client.getConfig.mockReturnValue({
			url: 'http://127.0.0.1:20612',
			token: 'tok',
			timeoutMs: 120_000,
		});
	});

	afterEach(() => {
		parseRouter.resetWorkersReadyForTests();
		if (prevUrl === undefined) delete process.env.ROLL_WORKER_URL;
		else process.env.ROLL_WORKER_URL = prevUrl;
		if (prevMode === undefined) delete process.env.ROLL_WORKER_MODE;
		else process.env.ROLL_WORKER_MODE = prevMode;
		if (prevRemote === undefined) delete process.env.ROLL_WORKER_REMOTE_ONLY;
		else process.env.ROLL_WORKER_REMOTE_ONLY = prevRemote;
		if (prevSpawn === undefined) delete process.env.ROLL_WORKER_SPAWN;
		else process.env.ROLL_WORKER_SPAWN = prevSpawn;
	});

	it('prints [Gateway] Primary banner and starts link monitor (parent)', async () => {
		const lines = [];
		const spy = jest.spyOn(console, 'info').mockImplementation((m) => lines.push(String(m)));
		try {
			await parseRouter.logParseMode(console, { announceBanner: true });
			expect(lines.some((l) => l.startsWith('[Gateway] Primary http://127.0.0.1:20612'))).toBe(true);
			expect(lines.some((l) => /token=on/.test(l) && /timeout=120000ms/.test(l))).toBe(true);
			expect(client.beginLinkMonitor).toHaveBeenCalledTimes(1);
			const logger = client.beginLinkMonitor.mock.calls[0][0]?.logger;
			expect(logger).toBe(console);
		} finally {
			spy.mockRestore();
		}
	});

	it('announceBanner=false skips banner but still starts monitors (Discord clusters)', async () => {
		const lines = [];
		const spy = jest.spyOn(console, 'info').mockImplementation((m) => lines.push(String(m)));
		try {
			await parseRouter.logParseMode(console, { announceBanner: false });
			expect(lines.some((l) => /\[Gateway\]/.test(l))).toBe(false);
			expect(client.beginLinkMonitor).toHaveBeenCalledTimes(1);
			const logger = client.beginLinkMonitor.mock.calls[0][0]?.logger;
			expect(typeof logger.info).toBe('function');
			expect(logger).not.toBe(console);
		} finally {
			spy.mockRestore();
		}
	});

	it('logs banner only once per process even if called twice', async () => {
		const lines = [];
		const spy = jest.spyOn(console, 'info').mockImplementation((m) => lines.push(String(m)));
		try {
			await parseRouter.logParseMode(console, { announceBanner: true });
			await parseRouter.logParseMode(console, { announceBanner: true });
			expect(lines.filter((l) => /\[Gateway\] Primary/.test(l))).toHaveLength(1);
			expect(client.beginLinkMonitor).toHaveBeenCalledTimes(1);
		} finally {
			spy.mockRestore();
		}
	});

	it('skips entirely in ROLL_WORKER_MODE', async () => {
		process.env.ROLL_WORKER_MODE = 'true';
		const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
		try {
			await parseRouter.logParseMode(console, { announceBanner: true });
			expect(client.beginLinkMonitor).not.toHaveBeenCalled();
		} finally {
			spy.mockRestore();
		}
	});
});

describe('boot order + Discord announce contracts (source)', () => {
	it('index.js awaits logParseMode before loadModules', () => {
		const src = fs.readFileSync(path.join(ROOT, 'index.js'), 'utf8');
		const awaitIdx = src.indexOf('await require(\'./modules/roll-worker/parse-router\').logParseMode');
		const loadIdx = src.indexOf('await loadModules(moduleManager)');
		expect(awaitIdx).toBeGreaterThan(-1);
		expect(loadIdx).toBeGreaterThan(-1);
		expect(awaitIdx).toBeLessThan(loadIdx);
	});

	it('Discord bot.js disables banner for clustered workers', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
		expect(src).toMatch(/announceBanner/);
		expect(src).toMatch(/getInfo\(\)\?\.CLUSTER/);
		expect(src).toMatch(/announceBanner\s*=\s*false/);
	});

	it('supervised spawn sets ROLL_WORKER_GATEWAY_CHILD and parent Listening line', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/local-worker.js'), 'utf8');
		expect(src).toMatch(/ROLL_WORKER_GATEWAY_CHILD:\s*'true'/);
		expect(src).toMatch(/\[RollWorker\] Listening on \$\{url\}/);
		expect(src).toMatch(/supervised pid=/);
	});

	it('roll-worker.js preserves ROLL_WORKER_GATEWAY_CHILD across dotenv', () => {
		const src = fs.readFileSync(path.join(ROOT, 'roll-worker.js'), 'utf8');
		expect(src).toMatch(/ROLL_WORKER_GATEWAY_CHILD/);
	});

	it('server.js skips Listening + CONNECTED when ROLL_WORKER_GATEWAY_CHILD', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/roll-worker/server.js'), 'utf8');
		expect(src).toMatch(/ROLL_WORKER_GATEWAY_CHILD === 'true'/);
		expect(src).toMatch(/\[RollWorker\] Listening on/);
		// Quiet path returns before Listening / peer CONNECTED console.info
		expect(src).toMatch(/if \(process\.env\.ROLL_WORKER_GATEWAY_CHILD === 'true'\) \{\s*return;/);
	});
});
