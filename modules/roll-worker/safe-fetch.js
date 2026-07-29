"use strict";

const http = require('node:http');
const https = require('node:https');
const { isSafeImageTarget, resolvePublicFetchTarget } = require('../../utils/is-image-url');

/** Discord CDN / media hosts used for avatars and attachments (nested subdomains + discord.com). */
const DISCORD_HOST_RE = /^(?:[\w-]+\.)*(?:discordapp\.com|discordapp\.net|discord\.com)$/i;

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

function tooLargeError(maxBytes) {
	const error = new Error(`download exceeds ${maxBytes} bytes`);
	error.code = 'FETCH_TOO_LARGE';
	return error;
}

/**
 * Read response body with a hard byte cap without buffering the full payload first.
 * Prefers Content-Length reject + streaming getReader; falls back to arrayBuffer for mocks.
 * @param {Response} response
 * @param {number} maxBytes
 * @returns {Promise<Buffer>}
 */
async function readBodyWithByteLimit(response, maxBytes) {
	const contentLengthHeader = response.headers?.get?.('content-length');
	if (contentLengthHeader) {
		const contentLength = Number(contentLengthHeader);
		if (Number.isFinite(contentLength) && contentLength > maxBytes) {
			if (typeof response.body?.cancel === 'function') {
				try { await response.body.cancel(); } catch { /* ignore */ }
			}
			throw tooLargeError(maxBytes);
		}
	}

	if (response.body && typeof response.body.getReader === 'function') {
		const reader = response.body.getReader();
		const chunks = [];
		let total = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!value) continue;
			total += value.byteLength;
			if (total > maxBytes) {
				try { await reader.cancel(); } catch { /* ignore */ }
				throw tooLargeError(maxBytes);
			}
			chunks.push(Buffer.from(value));
		}
		return chunks.length === 0 ? Buffer.alloc(0) : Buffer.concat(chunks, total);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	if (buffer.length > maxBytes) {
		throw tooLargeError(maxBytes);
	}
	return buffer;
}

/**
 * IP-pinned HTTPS GET (no redirect follow) for Discord CDN downloads.
 * @param {URL} parsed
 * @param {number} maxBytes
 * @returns {Promise<{ buffer: Buffer, contentType: string, status: number }>}
 */
async function pinnedFetchBuffer(parsed, maxBytes) {
	const target = await resolvePublicFetchTarget(parsed);
	if (!target) {
		const error = new Error('ssrf check failed');
		error.code = 'UNSAFE_FETCH_URL';
		throw error;
	}

	return new Promise((resolve, reject) => {
		const lib = target.protocol === 'https:' ? https : http;
		const req = lib.request({
			host: target.address,
			port: target.port,
			path: target.path,
			method: 'GET',
			headers: {
				...target.headers,
				Accept: '*/*',
			},
			timeout: 30_000,
			servername: target.headers.Host.split(':')[0],
			// Node does not follow redirects for http.request by default.
		}, (res) => {
			const status = res.statusCode || 0;
			// Refuse redirects — Location could point off allowlist / private IP.
			if (status >= 300 && status < 400) {
				res.resume();
				reject(Object.assign(new Error(`redirect not allowed (${status})`), { code: 'FETCH_REDIRECT' }));
				return;
			}
			if (status < 200 || status >= 300) {
				res.resume();
				reject(new Error(`HTTP ${status}`));
				return;
			}

			const contentLength = Number(res.headers['content-length']);
			if (Number.isFinite(contentLength) && contentLength > maxBytes) {
				res.resume();
				reject(tooLargeError(maxBytes));
				return;
			}

			const chunks = [];
			let total = 0;
			res.on('data', (chunk) => {
				total += chunk.length;
				if (total > maxBytes) {
					req.destroy();
					reject(tooLargeError(maxBytes));
					return;
				}
				chunks.push(chunk);
			});
			res.on('end', () => {
				resolve({
					buffer: chunks.length === 0 ? Buffer.alloc(0) : Buffer.concat(chunks, total),
					contentType: res.headers['content-type'] || '',
					status,
				});
			});
			res.on('error', reject);
		});
		req.on('timeout', () => {
			req.destroy(new Error('timeout'));
		});
		req.on('error', reject);
		req.end();
	});
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
	const { buffer, contentType } = await pinnedFetchBuffer(gate.parsed, maxBytes);
	return {
		text: buffer.toString('utf8'),
		bytes: buffer.length,
		contentType,
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
	const { buffer, contentType } = await pinnedFetchBuffer(gate.parsed, maxBytes);
	return {
		buffer,
		bytes: buffer.length,
		contentType,
	};
}

module.exports = {
	DISCORD_HOST_RE,
	isDiscordCdnHost,
	assertSafeDiscordFetchUrl,
	readBodyWithByteLimit,
	pinnedFetchBuffer,
	safeFetchText,
	safeFetchBuffer,
};
