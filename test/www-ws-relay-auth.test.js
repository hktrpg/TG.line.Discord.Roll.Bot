'use strict';

const {
	getWwwWsToken,
	isValidRelayToken,
	buildRegisterPayload,
	parseGatewayInject,
	normalizeBotname,
} = require('../modules/www/ws-relay-auth.js');

describe('www ws-relay-auth', () => {
	const prevWww = process.env.WWW_WS_TOKEN;
	const prevRoll = process.env.ROLL_WORKER_TOKEN;

	afterEach(() => {
		if (prevWww === undefined) delete process.env.WWW_WS_TOKEN;
		else process.env.WWW_WS_TOKEN = prevWww;
		if (prevRoll === undefined) delete process.env.ROLL_WORKER_TOKEN;
		else process.env.ROLL_WORKER_TOKEN = prevRoll;
	});

	test('normalizeBotname canonicalizes platforms', () => {
		expect(normalizeBotname('discord')).toBe('Discord');
		expect(normalizeBotname('Whatsapp')).toBe('Whatsapp');
	});

	test('legacy: empty token allows inject without token field', () => {
		delete process.env.WWW_WS_TOKEN;
		delete process.env.ROLL_WORKER_TOKEN;
		expect(getWwwWsToken()).toBe('');
		expect(isValidRelayToken('')).toBe(true);
		const parsed = parseGatewayInject(JSON.stringify({
			botname: 'Discord',
			message: { target: { id: 'ch1' }, text: 'hi' },
		}), 'Discord');
		expect(parsed.ok).toBe(true);
		expect(parsed.targetId).toBe('ch1');
	});

	test('with token: reject missing/wrong token', () => {
		process.env.WWW_WS_TOKEN = 'secret-relay';
		expect(isValidRelayToken('wrong')).toBe(false);
		expect(parseGatewayInject(JSON.stringify({
			botname: 'Discord',
			message: { target: { id: 'ch1' }, text: 'hi' },
		}), 'Discord').ok).toBe(false);
		expect(parseGatewayInject(JSON.stringify({
			botname: 'Discord',
			token: 'secret-relay',
			message: { target: { id: 'ch1' }, text: 'hi' },
		}), 'Discord').ok).toBe(true);
	});

	test('buildRegisterPayload includes token and botname', () => {
		process.env.WWW_WS_TOKEN = 'abc';
		const payload = JSON.parse(buildRegisterPayload('Whatsapp'));
		expect(payload.type).toBe('register');
		expect(payload.botname).toBe('Whatsapp');
		expect(payload.token).toBe('abc');
	});

	test('invalid JSON is rejected', () => {
		expect(parseGatewayInject('not-json', 'Discord').ok).toBe(false);
	});
});
