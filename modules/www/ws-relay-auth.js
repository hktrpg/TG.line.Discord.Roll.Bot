'use strict';

const crypto = require('node:crypto');

/**
 * Shared secret for www ↔ platform gateway WebSocket relay (BROADCAST / MASTER).
 * Prefer WWW_WS_TOKEN; fall back to ROLL_WORKER_TOKEN when unset.
 */
function getWwwWsToken() {
	return String(process.env.WWW_WS_TOKEN || process.env.ROLL_WORKER_TOKEN || '').trim();
}

function timingSafeEqualString(a, b) {
	const left = Buffer.from(String(a ?? ''), 'utf8');
	const right = Buffer.from(String(b ?? ''), 'utf8');
	if (left.length !== right.length) return false;
	if (left.length === 0) return true;
	return crypto.timingSafeEqual(left, right);
}

/** When no token is configured, auth checks pass (loopback-only deploy legacy). */
function isValidRelayToken(token) {
	const expected = getWwwWsToken();
	if (!expected) return true;
	return timingSafeEqualString(token, expected);
}

/**
 * Non-local WS relay must have a shared secret.
 * @param {boolean} allowNonLocal
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function assertRelayAuthForDeploy(allowNonLocal) {
	if (!allowNonLocal) return { ok: true };
	if (getWwwWsToken()) return { ok: true };
	return {
		ok: false,
		error: 'WWW_WS_ALLOW_NON_LOCAL=true requires WWW_WS_TOKEN or ROLL_WORKER_TOKEN',
	};
}

function buildRegisterPayload(botname) {
	return JSON.stringify({
		type: 'register',
		botname: String(botname || ''),
		token: getWwwWsToken(),
	});
}

/**
 * Parse an inject envelope destined for a platform gateway.
 * @returns {{ ok: true, targetId: string, text: string } | { ok: false, reason?: string }}
 */
function parseGatewayInject(raw, expectedBotname) {
	let object;
	try {
		object = JSON.parse(typeof raw === 'string' ? raw : String(raw));
	} catch {
		return { ok: false, reason: 'invalid_json' };
	}
	if (!object || typeof object !== 'object') {
		return { ok: false, reason: 'invalid_json' };
	}
	if (object.type === 'register' || object.type === 'hello') {
		return { ok: false, reason: 'not_inject' };
	}
	if (String(object.botname || '') !== String(expectedBotname || '')) {
		return { ok: false, reason: 'botname' };
	}
	if (!isValidRelayToken(object.token)) {
		return { ok: false, reason: 'auth' };
	}
	const targetId = object.message?.target?.id;
	const text = object.message?.text;
	if (targetId == null || text == null || typeof text !== 'string' || text.length === 0) {
		return { ok: false, reason: 'schema' };
	}
	const idStr = String(targetId);
	if (idStr.length > 128 || text.length > 4000) {
		return { ok: false, reason: 'size' };
	}
	return { ok: true, targetId: idStr, text };
}

function normalizeBotname(raw) {
	const s = String(raw || '').trim();
	if (!s) return '';
	const lower = s.toLowerCase();
	if (lower === 'discord') return 'Discord';
	if (lower === 'whatsapp') return 'Whatsapp';
	if (lower === 'telegram') return 'Telegram';
	if (lower === 'line') return 'Line';
	return s;
}

module.exports = {
	getWwwWsToken,
	isValidRelayToken,
	assertRelayAuthForDeploy,
	buildRegisterPayload,
	parseGatewayInject,
	normalizeBotname,
	timingSafeEqualString,
};
