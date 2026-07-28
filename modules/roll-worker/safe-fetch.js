"use strict";

const { isSafeImageTarget } = require('../../utils/is-image-url');

/** Discord CDN / media hosts used for avatars and attachments. */
const DISCORD_HOST_RE = /^(?:[\w-]+\.)?(?:discordapp\.com|discordapp\.net)$/i;

function isDiscordCdnHost(hostname) {
	return DISCORD_HOST_RE.test(String(hostname || '').toLowerCase());
}

/**
 * SSRF guard for Worker-side URL fetches from prefetch meta.
 * Requires Discord CDN host + public DNS resolution (no private/link-local).
 * @param {string} url
 * @returns {Promise<{ ok: true, parsed: URL }|{ ok: false, error: string }>}
 */
async function assertSafeDiscordFetchUrl(url) {
	if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
		return { ok: false, error: 'invalid url' };
	}
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return { ok: false, error: 'invalid url' };
	}
	if (parsed.protocol !== 'https:') {
		return { ok: false, error: 'https required' };
	}
	if (parsed.username || parsed.password) {
		return { ok: false, error: 'credentials not allowed' };
	}
	if (!isDiscordCdnHost(parsed.hostname)) {
		return { ok: false, error: 'host not allowlisted' };
	}
	if (!(await isSafeImageTarget(parsed))) {
		return { ok: false, error: 'ssrf check failed' };
	}
	return { ok: true, parsed };
}

/**
 * Fetch text with Discord CDN + SSRF checks and a hard byte limit.
 * @param {string} url
 * @param {{ maxBytes?: number }} [options]
 */
async function safeFetchText(url, { maxBytes = 5 * 1024 * 1024 } = {}) {
	const gate = await assertSafeDiscordFetchUrl(url);
	if (!gate.ok) {
		const error = new Error(gate.error);
		error.code = 'UNSAFE_FETCH_URL';
		throw error;
	}
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.length > maxBytes) {
		const error = new Error(`download exceeds ${maxBytes} bytes`);
		error.code = 'FETCH_TOO_LARGE';
		throw error;
	}
	return {
		text: buffer.toString('utf8'),
		bytes: buffer.length,
		contentType: response.headers.get('content-type') || '',
	};
}

/**
 * Fetch binary with Discord CDN + SSRF checks and a hard byte limit.
 * @param {string} url
 * @param {{ maxBytes?: number }} [options]
 */
async function safeFetchBuffer(url, { maxBytes = 8 * 1024 * 1024 } = {}) {
	const gate = await assertSafeDiscordFetchUrl(url);
	if (!gate.ok) {
		const error = new Error(gate.error);
		error.code = 'UNSAFE_FETCH_URL';
		throw error;
	}
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.length > maxBytes) {
		const error = new Error(`download exceeds ${maxBytes} bytes`);
		error.code = 'FETCH_TOO_LARGE';
		throw error;
	}
	return {
		buffer,
		bytes: buffer.length,
		contentType: response.headers.get('content-type') || '',
	};
}

module.exports = {
	DISCORD_HOST_RE,
	isDiscordCdnHost,
	assertSafeDiscordFetchUrl,
	safeFetchText,
	safeFetchBuffer,
};
