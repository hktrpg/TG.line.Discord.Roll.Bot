"use strict";

jest.mock('../modules/roll-worker/client', () => {
	const actual = jest.requireActual('../modules/roll-worker/client');
	return {
		...actual,
		isEnabled: jest.fn(() => false),
		isLocalEnabled: jest.fn(() => false),
		getLocalConfig: jest.fn(() => ({ url: '' })),
		health: jest.fn(),
		healthAt: jest.fn(),
	};
});

const i18n = require('../modules/i18n/i18n.js');
const buildInfo = require('../modules/runtime/build-info');
const rollWorkerClient = require('../modules/roll-worker/client');
const {
	attachGatewayAuth,
	verifyGatewayAuth,
	stripGatewayAuth,
} = require('../modules/roll-worker/request-auth');
const { toSerializableContext } = require('../modules/roll-worker/client');
const { buildStateVersionSection } = require('../modules/runtime/state-version');

describe('buildStateVersionSection', () => {
	const saved = {};
	let t;

	beforeAll(async () => {
		await i18n.init();
		t = i18n.createTranslator('en');
	});

	beforeEach(() => {
		for (const key of [
			'ROLL_WORKER_MODE', 'ROLL_WORKER_URL', 'ROLL_STANDBY_URL',
			'GIT_BRANCH', 'GITHUB_SHA', 'BUILD_TIME',
		]) {
			saved[key] = process.env[key];
			delete process.env[key];
		}
		process.env.GIT_BRANCH = 'Distributed-';
		process.env.GITHUB_SHA = 'abcdef1234567890';
		process.env.BUILD_TIME = '2026-07-30T08:00:00.000Z';
		buildInfo.resetCache();
		jest.clearAllMocks();
		rollWorkerClient.isEnabled.mockReturnValue(false);
		rollWorkerClient.isLocalEnabled.mockReturnValue(false);
	});

	afterEach(() => {
		for (const [key, value] of Object.entries(saved)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
		buildInfo.resetCache();
	});

	it('on Primary includes Gateway from gatewayBuildInfo prefetch', async () => {
		process.env.ROLL_WORKER_MODE = 'true';
		buildInfo.resetCache();

		const lines = await buildStateVersionSection(t, {
			gatewayBuildInfo: {
				display: 'Distributed- · 2026-07-30 · gateway1',
				role: 'gateway',
			},
		});

		const text = lines.join('\n');
		expect(text).toContain('Gateway');
		expect(text).toContain('Distributed- · 2026-07-30 · gateway1');
		expect(text).toContain('Primary');
		expect(text).toContain('Distributed- · 2026-07-30 · abcdef1');
		expect(text).toContain('link=self');
		expect(text).not.toContain('unreachable');
		expect(text).not.toMatch(/Parse\s+/);
	});

	it('on Primary probes Standby via standbyWorkerUrl from Gateway', async () => {
		process.env.ROLL_WORKER_MODE = 'true';
		buildInfo.resetCache();
		rollWorkerClient.healthAt.mockResolvedValue({
			ok: true,
			version: { display: 'Distributed- · 2026-07-30 · standby1' },
		});

		const lines = await buildStateVersionSection(t, {
			gatewayBuildInfo: {
				display: 'Distributed- · 2026-07-30 · gateway1',
				role: 'gateway',
			},
			standbyWorkerUrl: 'http://127.0.0.1:3951',
		});

		const text = lines.join('\n');
		expect(text).toContain('Standby');
		expect(text).toContain('Distributed- · 2026-07-30 · standby1');
		expect(text).toContain('link=up');
		expect(text).not.toMatch(/Parse\s+/);
		expect(rollWorkerClient.healthAt).toHaveBeenCalledWith('http://127.0.0.1:3951', { withAuth: true });
	});

	it('on Primary without prefetch shows Gateway unreachable', async () => {
		process.env.ROLL_WORKER_MODE = 'true';
		buildInfo.resetCache();

		const lines = await buildStateVersionSection(t, {});
		const text = lines.join('\n');
		expect(text).toContain('Gateway');
		expect(text).toContain('unreachable');
		expect(text).toContain('Primary');
		expect(text).toContain('link=self');
	});

	it('on Gateway shows self and probes Primary + Standby when enabled', async () => {
		delete process.env.ROLL_WORKER_MODE;
		buildInfo.resetCache();
		rollWorkerClient.isEnabled.mockReturnValue(true);
		rollWorkerClient.isLocalEnabled.mockReturnValue(true);
		rollWorkerClient.getLocalConfig.mockReturnValue({ url: 'http://127.0.0.1:3951' });
		rollWorkerClient.health.mockResolvedValue({
			ok: true,
			version: { display: 'Distributed- · 2026-07-30 · worker01' },
		});
		rollWorkerClient.healthAt.mockResolvedValue({
			ok: true,
			version: { display: 'Distributed- · 2026-07-30 · local001' },
		});

		const lines = await buildStateVersionSection(t, {});
		const text = lines.join('\n');
		expect(text).toContain('Gateway');
		expect(text).toContain('Distributed- · 2026-07-30 · abcdef1');
		expect(text).toContain('Primary');
		expect(text).toContain('Distributed- · 2026-07-30 · worker01');
		expect(text).toContain('link=up');
		expect(text).toContain('Standby');
		expect(text).toContain('Distributed- · 2026-07-30 · local001');
		expect(text).not.toMatch(/Parse\s+/);
		expect(rollWorkerClient.health).toHaveBeenCalled();
		expect(rollWorkerClient.healthAt).toHaveBeenCalledWith('http://127.0.0.1:3951', { withAuth: true });
	});

	it('on Gateway marks Primary unreachable when health fails', async () => {
		delete process.env.ROLL_WORKER_MODE;
		buildInfo.resetCache();
		rollWorkerClient.isEnabled.mockReturnValue(true);
		rollWorkerClient.health.mockRejectedValue(new Error('ECONNREFUSED'));

		const lines = await buildStateVersionSection(t, {});
		const text = lines.join('\n');
		expect(text).toContain('Primary');
		expect(text).toContain('unreachable');
		expect(text).toContain('link=down');
	});
});

describe('gatewayBuildInfo remote round-trip', () => {
	const savedMode = process.env.ROLL_WORKER_MODE;

	afterEach(() => {
		if (savedMode === undefined) delete process.env.ROLL_WORKER_MODE;
		else process.env.ROLL_WORKER_MODE = savedMode;
		buildInfo.resetCache();
	});

	it('serializes, signs, and strips auth while keeping gatewayBuildInfo', () => {
		delete process.env.ROLL_WORKER_MODE;
		process.env.GIT_BRANCH = 'Distributed-';
		process.env.GITHUB_SHA = 'feedface';
		process.env.BUILD_TIME = '2026-07-30T00:00:00.000Z';
		buildInfo.resetCache();

		const body = attachGatewayAuth(toSerializableContext({
			inputStr: '.admin state',
			botname: 'Discord',
			userid: 'u1',
		}), 'test-token');

		expect(body.gatewayBuildInfo?.display).toContain('Distributed-');
		expect(verifyGatewayAuth(body, 'test-token').ok).toBe(true);

		const cleaned = stripGatewayAuth(body);
		expect(cleaned.gatewayBuildInfo.display).toBe(body.gatewayBuildInfo.display);
		expect(cleaned._gatewayAuth).toBeUndefined();
	});
});
