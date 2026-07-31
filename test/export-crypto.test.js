'use strict';

const {
	V2_PREFIX,
	minifyExportMessages,
	encryptExportPayload,
	decryptExportPayload,
	encryptExportPayloadLegacy,
	decryptExportPayloadLegacy,
} = require('../modules/roll-worker/export-crypto');

describe('export-crypto', () => {
	const sample = [
		{
			timestamp: 1_700_000_000_000,
			contact: 'hello world',
			userName: 'Alice',
			isbot: false,
			attachments: [{ url: 'https://example.com/a.png', name: 'a.png', id: 'drop-me' }],
			embeds: [{
				title: 'Embed title',
				description: 'Embed body',
				url: 'https://example.com',
				fields: [{ name: 'x', value: 'y' }],
			}],
			reply_to: {
				contact: 'quoted',
				userName: 'Bob',
				isbot: true,
				attachments: [],
				embeds: [{ title: 'R', description: 'D' }],
			},
		},
		{
			timestamp: 1_700_000_000_100,
			contact: 'bot line',
			userName: 'HKTRPG',
			isbot: true,
			attachments: [],
			embeds: [],
			reply_to: null,
		},
	];

	it('minifies attachments and embeds', () => {
		const min = minifyExportMessages(sample);
		expect(min[0].a).toEqual([{ url: 'https://example.com/a.png', name: 'a.png' }]);
		expect(min[0].e).toEqual([{ title: 'Embed title', description: 'Embed body' }]);
		expect(min[0].r).toEqual({
			c: 'quoted',
			u: 'Bob',
			b: true,
			a: [],
			e: [{ title: 'R', description: 'D' }],
		});
	});

	it('v2g round-trip encrypt/decrypt', () => {
		const password = 'Abcdefghijklmnop';
		const payload = encryptExportPayload(sample, password);
		expect(payload.startsWith(V2_PREFIX)).toBe(true);
		const decoded = decryptExportPayload(payload, password);
		expect(decoded).toHaveLength(2);
		expect(decoded[0].contact).toBe('hello world');
		expect(decoded[0].userName).toBe('Alice');
		expect(decoded[0].attachments).toEqual([{ url: 'https://example.com/a.png', name: 'a.png' }]);
		expect(decoded[0].embeds).toEqual([{ title: 'Embed title', description: 'Embed body' }]);
		expect(decoded[0].reply_to).toEqual({
			contact: 'quoted',
			userName: 'Bob',
			isbot: true,
			attachments: [],
			embeds: [{ title: 'R', description: 'D' }],
		});
		expect(decoded[1].isbot).toBe(true);
	});

	it('rejects wrong password for v2g', () => {
		const payload = encryptExportPayload(sample, 'correct-password!');
		expect(decryptExportPayload(payload, 'wrong-password!!!')).toBeNull();
	});

	it('legacy CBC round-trip still decrypts', () => {
		const password = 'legacyKey1234567';
		const payload = encryptExportPayloadLegacy(sample, password);
		expect(payload.startsWith(V2_PREFIX)).toBe(false);
		const decoded = decryptExportPayloadLegacy(payload, password);
		expect(decoded).toHaveLength(2);
		expect(decoded[0].contact).toBe('hello world');
		expect(decoded[0].reply_to.userName).toBe('Bob');
		expect(decryptExportPayload(payload, password)[0].contact).toBe('hello world');
	});

	it('export.js uses encryptExportPayload', () => {
		const fs = require('node:fs');
		const path = require('node:path');
		const source = fs.readFileSync(path.join(__dirname, '..', 'roll', 'export.js'), 'utf8');
		expect(source).toContain('encryptExportPayload');
		expect(source).not.toContain('function lightEncrypt');
	});
});
