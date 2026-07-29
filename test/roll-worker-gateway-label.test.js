'use strict';

const {
	getGatewayLabel,
	gatewayRequestHeaders,
	readGatewayFromRequest,
	HEADER_GATEWAY,
	HEADER_BOTNAME,
} = require('../modules/roll-worker/gateway-label');

describe('gateway-label', () => {
	const keys = [
		'ROLL_GATEWAY_NAME',
		'DISCORD_CHANNEL_SECRET',
		'TELEGRAM_CHANNEL_SECRET',
		'LINE_CHANNEL_ACCESSTOKEN',
		'LINE_CHANNEL_SECRET',
		'WHATSAPP_SWITCH',
		'PLURK_SWITCH',
		'mongoURL',
	];
	const prev = {};

	beforeEach(() => {
		for (const key of keys) {
			prev[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(() => {
		for (const key of keys) {
			if (prev[key] === undefined) delete process.env[key];
			else process.env[key] = prev[key];
		}
	});

	it('ROLL_GATEWAY_NAME overrides auto label', () => {
		process.env.ROLL_GATEWAY_NAME = 'Discord-prod';
		process.env.DISCORD_CHANNEL_SECRET = 'x';
		expect(getGatewayLabel()).toBe('Discord-prod');
	});

	it('auto-detects Discord+Telegram+WWW', () => {
		process.env.DISCORD_CHANNEL_SECRET = 'd';
		process.env.TELEGRAM_CHANNEL_SECRET = 't';
		process.env.mongoURL = 'mongodb://x';
		expect(getGatewayLabel()).toBe('Discord+Telegram+WWW');
	});

	it('gatewayRequestHeaders sets X-Roll-Gateway and optional botname', () => {
		process.env.ROLL_GATEWAY_NAME = 'TG-only';
		const h = gatewayRequestHeaders({ botname: 'Telegram' });
		expect(h[HEADER_GATEWAY]).toBe('TG-only');
		expect(h[HEADER_BOTNAME]).toBe('Telegram');
	});

	it('readGatewayFromRequest reads headers (case-insensitive via Node)', () => {
		const { gateway, botname } = readGatewayFromRequest({
			headers: {
				[HEADER_GATEWAY]: 'Discord+Line',
				[HEADER_BOTNAME]: 'Discord',
			},
		});
		expect(gateway).toBe('Discord+Line');
		expect(botname).toBe('Discord');
	});

	it('unknown when header missing', () => {
		expect(readGatewayFromRequest({ headers: {} }).gateway).toBe('unknown');
	});
});
