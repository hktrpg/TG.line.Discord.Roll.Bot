"use strict";

const {
	isPrivateOrReservedIp,
	isSafeImageTarget
} = require('../utils/is-image-url.js');

describe('is-image-url SSRF guards', () => {
	it('flags private and reserved IPv4 addresses', () => {
		expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
		expect(isPrivateOrReservedIp('10.0.0.5')).toBe(true);
		expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
		expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
		expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
		expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
	});

	it('rejects localhost and private literal URLs', async () => {
		await expect(isSafeImageTarget('http://127.0.0.1/img.png')).resolves.toBe(false);
		await expect(isSafeImageTarget('http://localhost/img.png')).resolves.toBe(false);
		await expect(isSafeImageTarget('http://192.168.0.1/a.jpg')).resolves.toBe(false);
		await expect(isSafeImageTarget('file:///etc/passwd')).resolves.toBe(false);
	});
});
