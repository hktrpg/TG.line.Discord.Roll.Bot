"use strict";

jest.mock('node:dns', () => ({
	promises: {
		lookup: jest.fn()
	}
}));

jest.mock('node:http', () => ({
	request: jest.fn()
}));

jest.mock('node:https', () => ({
	request: jest.fn()
}));

const dns = require('node:dns').promises;
const http = require('node:http');
const https = require('node:https');
const {
	isPrivateOrReservedIp,
	isSafeImageTarget,
	isClearlyUnsafeHostname,
	resolvePublicFetchTarget,
	default: isImageURL
} = require('../utils/is-image-url.js');

function mockRequestOnce(lib, { contentType = 'image/png', error = null, timeout = false } = {}) {
	lib.request.mockImplementationOnce((_options, callback) => {
		const handlers = {};
		const req = {
			on(event, fn) {
				handlers[event] = fn;
				return req;
			},
			destroy(err) {
				if (handlers.error) handlers.error(err || new Error('destroyed'));
			},
			end() {
				if (timeout) {
					if (handlers.timeout) handlers.timeout();
					return;
				}
				if (error) {
					if (handlers.error) handlers.error(error);
					return;
				}
				const res = {
					headers: { 'content-type': contentType },
					resume() { /* drain */ }
				};
				callback(res);
			}
		};
		return req;
	});
}

describe('is-image-url SSRF guards', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('isPrivateOrReservedIp', () => {
		it('flags private and reserved IPv4 addresses', () => {
			expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
			expect(isPrivateOrReservedIp('10.0.0.5')).toBe(true);
			expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
			expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
			expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
			expect(isPrivateOrReservedIp('100.64.1.1')).toBe(true);
			expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true);
			expect(isPrivateOrReservedIp('224.0.0.1')).toBe(true);
			expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
			expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
		});

		it('flags IPv6 loopback, ULA, link-local and mapped IPv4', () => {
			expect(isPrivateOrReservedIp('::1')).toBe(true);
			expect(isPrivateOrReservedIp('::')).toBe(true);
			expect(isPrivateOrReservedIp('fc00::1')).toBe(true);
			expect(isPrivateOrReservedIp('fd12::1')).toBe(true);
			expect(isPrivateOrReservedIp('fe80::1')).toBe(true);
			expect(isPrivateOrReservedIp('ff02::1')).toBe(true);
			expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true);
			expect(isPrivateOrReservedIp('::ffff:8.8.8.8')).toBe(false);
			expect(isPrivateOrReservedIp('2001:4860:4860::8888')).toBe(false);
		});

		it('rejects invalid values', () => {
			expect(isPrivateOrReservedIp('')).toBe(true);
			expect(isPrivateOrReservedIp(null)).toBe(true);
			expect(isPrivateOrReservedIp('not-an-ip')).toBe(true);
		});
	});

	describe('isClearlyUnsafeHostname', () => {
		it('blocks localhost-like and private IP literals', () => {
			expect(isClearlyUnsafeHostname('localhost')).toBe(true);
			expect(isClearlyUnsafeHostname('foo.localhost')).toBe(true);
			expect(isClearlyUnsafeHostname('x.local')).toBe(true);
			expect(isClearlyUnsafeHostname('svc.internal')).toBe(true);
			expect(isClearlyUnsafeHostname('metadata.google.internal')).toBe(true);
			expect(isClearlyUnsafeHostname('127.0.0.1')).toBe(true);
			expect(isClearlyUnsafeHostname('example.com')).toBe(false);
		});
	});

	describe('isSafeImageTarget', () => {
		it('rejects localhost, private literals, bad protocols and credentials', async () => {
			await expect(isSafeImageTarget('http://127.0.0.1/img.png')).resolves.toBe(false);
			await expect(isSafeImageTarget('http://localhost/img.png')).resolves.toBe(false);
			await expect(isSafeImageTarget('http://192.168.0.1/a.jpg')).resolves.toBe(false);
			await expect(isSafeImageTarget('file:///etc/passwd')).resolves.toBe(false);
			await expect(isSafeImageTarget('ftp://example.com/a.png')).resolves.toBe(false);
			await expect(isSafeImageTarget('http://user:pass@example.com/a.png')).resolves.toBe(false);
			await expect(isSafeImageTarget('not a url')).resolves.toBe(false);
		});

		it('accepts URL object for public host when DNS is public', async () => {
			dns.lookup.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }]);
			await expect(isSafeImageTarget(new URL('https://example.com/a.png'))).resolves.toBe(true);
		});

		it('rejects when DNS resolves to a private address', async () => {
			dns.lookup.mockResolvedValueOnce([{ address: '10.0.0.9', family: 4 }]);
			await expect(isSafeImageTarget('https://evil.example/a.png')).resolves.toBe(false);
		});

		it('rejects when DNS lookup fails or returns empty', async () => {
			dns.lookup.mockRejectedValueOnce(new Error('ENOTFOUND'));
			await expect(isSafeImageTarget('https://missing.example/a.png')).resolves.toBe(false);
			dns.lookup.mockResolvedValueOnce([]);
			await expect(isSafeImageTarget('https://empty.example/a.png')).resolves.toBe(false);
		});
	});

	describe('resolvePublicFetchTarget', () => {
		it('returns null for unsafe targets', async () => {
			await expect(resolvePublicFetchTarget(new URL('http://127.0.0.1/x'))).resolves.toBeNull();
		});

		it('builds a pinned public IP target with default https port', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			const target = await resolvePublicFetchTarget(new URL('https://cdn.example/img.png?x=1'));
			expect(target).toEqual({
				address: '1.2.3.4',
				protocol: 'https:',
				port: 443,
				path: '/img.png?x=1',
				headers: expect.objectContaining({
					Host: 'cdn.example',
					'User-Agent': 'HKTRPG-ImageCheck/1.0'
				})
			});
		});

		it('uses explicit port when provided', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			const target = await resolvePublicFetchTarget(new URL('http://cdn.example:8080/a.jpg'));
			expect(target.port).toBe(8080);
			expect(target.protocol).toBe('http:');
		});
	});

	describe('isImageURL', () => {
		it('rejects invalid inputs without network', async () => {
			await expect(isImageURL('')).resolves.toBe(false);
			await expect(isImageURL(null)).resolves.toBe(false);
			await expect(isImageURL('notaurl')).resolves.toBe(false);
			await expect(isImageURL(`http://example.com/${'a'.repeat(3000)}`)).resolves.toBe(false);
			await expect(isImageURL('http://127.0.0.1/x.png')).resolves.toBe(false);
		});

		it('returns true when HEAD reports an image content-type', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			mockRequestOnce(https, { contentType: 'image/jpeg' });
			await expect(isImageURL('https://cdn.example/photo.jpg')).resolves.toBe(true);
			expect(https.request).toHaveBeenCalled();
		});

		it('falls back to GET when HEAD fails and accepts image content-type', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			mockRequestOnce(https, { error: new Error('HEAD blocked') });
			mockRequestOnce(https, { contentType: 'image/png' });
			await expect(isImageURL('https://cdn.example/photo.png')).resolves.toBe(true);
		});

		it('returns false when neither HEAD nor GET yields an image type', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			mockRequestOnce(http, { contentType: 'text/html' });
			mockRequestOnce(http, { contentType: 'application/json' });
			await expect(isImageURL('http://cdn.example/page')).resolves.toBe(false);
		});

		it('returns false when both HEAD and GET fail', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			mockRequestOnce(https, { error: new Error('fail') });
			mockRequestOnce(https, { error: new Error('fail') });
			await expect(isImageURL('https://cdn.example/x')).resolves.toBe(false);
		});

		it('returns false when request times out then GET fails', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }]);
			mockRequestOnce(https, { timeout: true });
			mockRequestOnce(https, { error: new Error('fail') });
			await expect(isImageURL('https://cdn.example/slow.png')).resolves.toBe(false);
		});
	});

	describe('resolvePublicFetchTarget DNS edge cases', () => {
		it('returns null when second DNS lookup fails or has no public address', async () => {
			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockRejectedValueOnce(new Error('temporary failure'));
			await expect(resolvePublicFetchTarget(new URL('https://cdn.example/a.png'))).resolves.toBeNull();

			dns.lookup
				.mockResolvedValueOnce([{ address: '1.2.3.4', family: 4 }])
				.mockResolvedValueOnce([{ address: '10.0.0.1', family: 4 }]);
			await expect(resolvePublicFetchTarget(new URL('https://cdn.example/b.png'))).resolves.toBeNull();
		});
	});
});
