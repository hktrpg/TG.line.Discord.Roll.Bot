"use strict";

const dns = require('node:dns').promises;
const net = require('node:net');
const axios = require('axios');

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
 * Sync checks for host/IP literals (used on redirects where async DNS is unavailable).
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
 * Check whether a URL points to an image (HEAD/GET content-type).
 * Replaces the deprecated image-url-validator (which depended on request).
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

	if (!(await isSafeImageTarget(parsed))) {
		return false;
	}

	const axiosOptions = {
		timeout: 5000,
		maxRedirects: 3,
		validateStatus: (status) => status >= 200 && status < 400,
		headers: { 'User-Agent': 'HKTRPG-ImageCheck/1.0' },
		// axios beforeRedirect is sync — block obvious unsafe hop targets
		beforeRedirect: (options) => {
			if (isClearlyUnsafeHostname(options.hostname)) {
				throw new Error('Redirect target blocked');
			}
		}
	};

	try {
		const response = await axios.head(url, axiosOptions);
		const contentType = response.headers['content-type'] || '';
		if (IMAGE_CONTENT_TYPE.test(contentType)) {
			return true;
		}
	} catch {
		// Some hosts reject HEAD; fall through to a ranged GET.
	}

	try {
		const response = await axios.get(url, {
			...axiosOptions,
			responseType: 'stream',
			headers: {
				...axiosOptions.headers,
				Range: 'bytes=0-0'
			}
		});
		const contentType = response.headers['content-type'] || '';
		if (response.data && typeof response.data.destroy === 'function') {
			response.data.destroy();
		}
		return IMAGE_CONTENT_TYPE.test(contentType);
	} catch {
		return false;
	}
}

module.exports = isImageURL;
module.exports.default = isImageURL;
module.exports.isSafeImageTarget = isSafeImageTarget;
module.exports.isPrivateOrReservedIp = isPrivateOrReservedIp;
