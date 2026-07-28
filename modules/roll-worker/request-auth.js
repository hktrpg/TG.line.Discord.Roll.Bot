"use strict";

const crypto = require('node:crypto');

/** Fields that affect authorization / Discord gates / SSRF surface. */
const SIGNED_CLAIM_KEYS = [
	'inputStr',
	'groupid',
	'userid',
	'userrole',
	'botname',
	'channelid',
	'channelType',
	'avatarUrl',
	'attachmentsMeta',
	'replyAttachmentsMeta',
	'replyContent',
	'storyAttachmentMeta',
	'storyGroupNamesMeta',
	'forwardSourceMeta',
	'chatroomChannelMeta',
	'exportMeta',
	'exportHistoryMeta',
	'clusterHealthMeta',
	'clusterMemMeta',
	'csvAttachmentMeta',
	'fixShardMeta',
	'slashDeployMeta',
	'skipExp',
	'doc',
	'item',
	'locale',
];

const DEFAULT_MAX_AGE_MS = 120_000;

function stableStringify(value) {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map((item) => stableStringify(item)).join(',')}]`;
	}
	const keys = Object.keys(value).sort();
	return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function pickClaims(params = {}) {
	const claims = {};
	for (const key of SIGNED_CLAIM_KEYS) {
		if (Object.hasOwn(params, key) && params[key] !== undefined) {
			claims[key] = params[key];
		}
	}
	return claims;
}

function signClaims(params, token, now = Date.now()) {
	const secret = String(token || '').trim();
	if (!secret) {
		return null;
	}
	const ts = Number(now);
	const payload = `${ts}.${stableStringify(pickClaims(params))}`;
	const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
	return { ts, sig, v: 1 };
}

function attachGatewayAuth(params, token, now = Date.now()) {
	const auth = signClaims(params, token, now);
	if (!auth) return { ...params };
	return { ...params, _gatewayAuth: auth };
}

function verifyGatewayAuth(params, token, {
	maxAgeMs = DEFAULT_MAX_AGE_MS,
	now = Date.now(),
	required = true,
} = {}) {
	const secret = String(token || '').trim();
	if (!secret) {
		return required ? { ok: false, error: 'token required' } : { ok: true, skipped: true };
	}

	const auth = params?._gatewayAuth;
	if (!auth || typeof auth !== 'object') {
		return { ok: false, error: 'missing gateway auth' };
	}
	const ts = Number(auth.ts);
	const sig = String(auth.sig || '');
	if (!Number.isFinite(ts) || !sig) {
		return { ok: false, error: 'invalid gateway auth' };
	}
	if (Math.abs(now - ts) > maxAgeMs) {
		return { ok: false, error: 'gateway auth expired' };
	}

	const expected = signClaims(params, secret, ts);
	const a = Buffer.from(sig, 'utf8');
	const b = Buffer.from(expected.sig, 'utf8');
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
		return { ok: false, error: 'gateway auth mismatch' };
	}
	return { ok: true };
}

function stripGatewayAuth(params = {}) {
	if (!params || typeof params !== 'object') return params;
	const cleaned = { ...params };
	delete cleaned._gatewayAuth;
	return cleaned;
}

module.exports = {
	SIGNED_CLAIM_KEYS,
	DEFAULT_MAX_AGE_MS,
	stableStringify,
	pickClaims,
	signClaims,
	attachGatewayAuth,
	verifyGatewayAuth,
	stripGatewayAuth,
};
