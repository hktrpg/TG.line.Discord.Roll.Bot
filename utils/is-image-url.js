"use strict";

const dns = require('node:dns').promises;
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');

const IMAGE_CONTENT_TYPE = /^image\//i;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const BLOCKED_HOSTNAMES = new Set([
	'localhost',
	'metadata.google.internal',
	'metadata.google',
	'kubernetes.default',
	'kubernetes.default.svc'
]);

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isBlockedHostname(hostname) {
	if (!hostname) return true;
	const host = String(hostname).toLowerCase().replace(/\.$/, '');
	if (BLOCKED_HOSTNAMES.has(host)) return true;
	if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
		return true;
	}
	return false;
}

/**
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateOrReservedIp(ip) {
	if (!ip || !net.isIP(ip)) return true;

	const normalized = ip.toLowerCase();
	if (normalized === '::1' || normalized === '0.0.0.0') return true;

	// IPv4-mapped IPv6 (::ffff:a.b.c.d)
	const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
	if (mapped) {
		return isPrivateOrReservedIp(mapped[1]);
	}

	if (net.isIPv4(normalized)) {
		const parts = normalized.split('.').map(Number);
		const [a, b] = parts;
		if (a === 10) return true;
		if (a === 127) return true;
		if (a === 0) return true;
		if (a === 169 && b === 254) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
		if (a >= 224) return true; // multicast / reserved
		return false;
	}

	// IPv6 unique local / link-local / loopback / unspecified / multicast
	if (
		normalized.startsWith('fc') ||
		normalized.startsWith('fd') ||
		normalized.startsWith('fe80:') ||
		normalized === '::' ||
		normalized.startsWith('ff')
	) {
		return true;
	}

	return false;
}

/**
 * Sync checks for host/IP literals.
 * @param {string} hostname
 * @returns {boolean}
 */
function isClearlyUnsafeHostname(hostname) {
	if (isBlockedHostname(hostname)) return true;
	if (net.isIP(hostname) && isPrivateOrReservedIp(hostname)) return true;
	return false;
}

/**
 * Reject private/link-local/metadata targets before outbound fetch (SSRF guard).
 * @param {string|URL} urlOrParsed
 * @returns {Promise<boolean>} true if safe to fetch
 */
async function isSafeImageTarget(urlOrParsed) {
	let parsed;
	try {
		parsed = urlOrParsed instanceof URL ? urlOrParsed : new URL(urlOrParsed);
	} catch {
		return false;
	}

	if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false;
	if (parsed.username || parsed.password) return false;
	if (isClearlyUnsafeHostname(parsed.hostname)) return false;

	try {
		const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
		if (!records || records.length === 0) return false;
		for (const record of records) {
			if (isPrivateOrReservedIp(record.address)) {
				return false;
			}
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Build a fetch target pinned to a resolved public IP (avoids DNS rebinding / SSRF).
 * @param {URL} parsed
 * @returns {Promise<{ address: string, headers: Record<string, string>, path: string, port: number, protocol: string }|null>}
 */
async function resolvePublicFetchTarget(parsed) {
	if (!(await isSafeImageTarget(parsed))) {
		return null;
	}
	let records;
	try {
		records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
	} catch {
		return null;
	}
	const publicRecord = (records || []).find((record) => !isPrivateOrReservedIp(record.address));
	if (!publicRecord) {
		return null;
	}

	const isHttps = parsed.protocol === 'https:';
	const port = parsed.port
		? Number(parsed.port)
		: (isHttps ? 443 : 80);
	const pathWithQuery = `${parsed.pathname || '/'}${parsed.search || ''}`;

	return {
		address: publicRecord.address,
		protocol: parsed.protocol,
		port,
		path: pathWithQuery,
		headers: {
			Host: parsed.host,
			'User-Agent': 'HKTRPG-ImageCheck/1.0',
			Accept: 'image/*,*/*;q=0.8'
		}
	};
}

/**
 * @param {{ address: string, headers: Record<string, string>, path: string, port: number, protocol: string }} target
 * @param {'HEAD'|'GET'} method
 * @returns {Promise<string>} content-type header value
 */
function requestContentType(target, method) {
	return new Promise((resolve, reject) => {
		const lib = target.protocol === 'https:' ? https : http;
		const req = lib.request({
			host: target.address,
			port: target.port,
			path: target.path,
			method,
			headers: method === 'GET'
				? { ...target.headers, Range: 'bytes=0-0' }
				: target.headers,
			timeout: 5000,
			servername: target.headers.Host.split(':')[0]
		}, (res) => {
			const contentType = res.headers['content-type'] || '';
			res.resume();
			resolve(contentType);
		});
		req.on('timeout', () => {
			req.destroy(new Error('timeout'));
		});
		req.on('error', reject);
		req.end();
	});
}

/**
 * Check whether a URL points to an image (HEAD/GET content-type).
 * Replaces the deprecated image-url-validator (which depended on request).
 * Fetches via resolved public IP + Host header to mitigate SSRF / DNS rebinding.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isImageURL(url) {
	if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
		return false;
	}

	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}

	const target = await resolvePublicFetchTarget(parsed);
	if (!target) {
		return false;
	}

	try {
		const contentType = await requestContentType(target, 'HEAD');
		if (IMAGE_CONTENT_TYPE.test(contentType)) {
			return true;
		}
	} catch {
		// Some hosts reject HEAD; fall through to a ranged GET.
	}

	try {
		const contentType = await requestContentType(target, 'GET');
		return IMAGE_CONTENT_TYPE.test(contentType);
	} catch {
		return false;
	}
}

module.exports = isImageURL;
module.exports.default = isImageURL;
module.exports.isSafeImageTarget = isSafeImageTarget;
module.exports.isPrivateOrReservedIp = isPrivateOrReservedIp;
