"use strict";

const {
	isRemoteAllowed,
	isDiscordLocalOnly,
	REMOTE_ALLOWLIST,
	LOCAL_DISCORD_ONLY,
} = require('../modules/roll-worker/route-table');

describe('roll-worker route-table', () => {
	it('keeps Discord-coupled modules local', () => {
		expect(isDiscordLocalOnly('z_admin')).toBe(true);
		expect(isRemoteAllowed('z_admin', 'Discord')).toBe(false);
		expect(isRemoteAllowed('export', 'Discord')).toBe(false);
		expect(isRemoteAllowed('token', 'Discord')).toBe(false);
	});

	it('allows pure dice modules for Discord', () => {
		expect(REMOTE_ALLOWLIST.has('2-coc')).toBe(true);
		expect(isRemoteAllowed('2-coc', 'Discord')).toBe(true);
		expect(isRemoteAllowed('0-advroll', 'Discord')).toBe(true);
	});

	it('allows non-Discord platforms for unknown modules', () => {
		expect(isRemoteAllowed(null, 'Telegram')).toBe(true);
		expect(isRemoteAllowed('anything', 'Line')).toBe(true);
	});

	it('does not allow unknown modules for Discord', () => {
		expect(isRemoteAllowed('not-a-real-module', 'Discord')).toBe(false);
		expect(LOCAL_DISCORD_ONLY.has('openai')).toBe(true);
	});
});
