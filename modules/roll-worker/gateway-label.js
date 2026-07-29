'use strict';

/** Header names (HTTP headers are lowercased by Node). */
const HEADER_GATEWAY = 'x-roll-gateway';
const HEADER_BOTNAME = 'x-roll-botname';

/**
 * Human label for this Gateway process (Worker CONNECTED logs).
 * Override: ROLL_GATEWAY_NAME=Discord-prod
 * Default: auto from enabled platform env secrets.
 */
function getGatewayLabel() {
	const named = String(process.env.ROLL_GATEWAY_NAME || '').trim();
	if (named) return named.slice(0, 80);

	const parts = [];
	if (process.env.DISCORD_CHANNEL_SECRET) parts.push('Discord');
	if (process.env.TELEGRAM_CHANNEL_SECRET) parts.push('Telegram');
	if (process.env.LINE_CHANNEL_ACCESSTOKEN && process.env.LINE_CHANNEL_SECRET) {
		parts.push('Line');
	}
	if (process.env.WHATSAPP_SWITCH) parts.push('Whatsapp');
	if (process.env.PLURK_SWITCH) parts.push('Plurk');
	if (process.env.mongoURL) parts.push('WWW');

	if (parts.length === 0) return 'Gateway';
	return parts.join('+').slice(0, 120);
}

/**
 * Headers identifying this Gateway on Worker requests.
 * @param {{ botname?: string }} [extra]
 */
function gatewayRequestHeaders(extra = {}) {
	const headers = {
		[HEADER_GATEWAY]: getGatewayLabel(),
	};
	const bot = String(extra.botname || '').trim();
	if (bot) headers[HEADER_BOTNAME] = bot.slice(0, 40);
	return headers;
}

function readGatewayFromRequest(req) {
	const headers = req?.headers || {};
	const gateway = String(headers[HEADER_GATEWAY] || '').trim() || 'unknown';
	const botname = String(headers[HEADER_BOTNAME] || '').trim() || '';
	return { gateway, botname };
}

module.exports = {
	HEADER_GATEWAY,
	HEADER_BOTNAME,
	getGatewayLabel,
	gatewayRequestHeaders,
	readGatewayFromRequest,
};
