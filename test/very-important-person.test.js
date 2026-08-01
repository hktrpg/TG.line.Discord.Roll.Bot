'use strict';

const mockFind = jest.fn();

jest.mock('../modules/db/schema.js', () => ({
	veryImportantPerson: {
		find: (...args) => mockFind(...args),
	},
}));

jest.mock('../utils/env-flag.js', () => ({
	isEnvEnabled: () => false,
}));

const VIP = require('../modules/patreon/veryImportantPerson.js');

describe('veryImportantPerson platform isolation', () => {
	beforeEach(() => {
		VIP.invalidateCache();
		mockFind.mockResolvedValue([
			{ id: 'same-id', level: 3, switch: true, platform: 'discord' },
			{ id: 'same-id', level: 1, switch: true, platform: 'telegram' },
			{ id: 'legacy-id', level: 2, switch: true, platform: '' },
			{ gpid: 'g1', level: 4, switch: true, platform: 'discord' },
		]);
	});

	test('normalizeVipPlatform lowercases botname', () => {
		expect(VIP.normalizeVipPlatform('Discord')).toBe('discord');
		expect(VIP.normalizeVipPlatform('')).toBe('');
	});

	test('user check with platform ignores other platform rows', async () => {
		await expect(VIP.viplevelCheckUser('same-id', 'Discord')).resolves.toBe(3);
		await expect(VIP.viplevelCheckUser('same-id', 'telegram')).resolves.toBe(1);
	});

	test('legacy empty-platform rows still match when platform requested', async () => {
		await expect(VIP.viplevelCheckUser('legacy-id', 'Discord')).resolves.toBe(2);
	});

	test('without platform, max across platforms (legacy callers)', async () => {
		await expect(VIP.viplevelCheckUser('same-id')).resolves.toBe(3);
	});

	test('group check respects platform', async () => {
		await expect(VIP.viplevelCheckGroup('g1', 'discord')).resolves.toBe(4);
		await expect(VIP.viplevelCheckGroup('g1', 'telegram')).resolves.toBe(0);
	});
});
