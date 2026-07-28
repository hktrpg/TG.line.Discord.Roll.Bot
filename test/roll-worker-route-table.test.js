"use strict";

const {
	isRemoteAllowed,
	isDiscordLocalOnly,
	REMOTE_ALLOWLIST,
	LOCAL_DISCORD_ONLY,
} = require('../modules/roll-worker/route-table');

describe('roll-worker route-table', () => {
	it('LOCAL_DISCORD_ONLY is empty after Phase 3c', () => {
		expect(LOCAL_DISCORD_ONLY.size).toBe(0);
		expect(isDiscordLocalOnly('z_admin')).toBe(false);
		expect(isDiscordLocalOnly('z-story-teller')).toBe(false);
	});

	it('allows token and forward on Discord (Phase 3 remote)', () => {
		expect(REMOTE_ALLOWLIST.has('token')).toBe(true);
		expect(REMOTE_ALLOWLIST.has('forward')).toBe(true);
		expect(isRemoteAllowed('token', 'Discord')).toBe(true);
		expect(isRemoteAllowed('forward', 'Discord')).toBe(true);
	});

	it('allows openai, export, z_multi-server on Discord (Phase 3b)', () => {
		expect(isRemoteAllowed('openai', 'Discord')).toBe(true);
		expect(isRemoteAllowed('export', 'Discord')).toBe(true);
		expect(isRemoteAllowed('z_multi-server', 'Discord')).toBe(true);
	});

	it('allows z_admin and z-story-teller on Discord (Phase 3c)', () => {
		expect(REMOTE_ALLOWLIST.has('z_admin')).toBe(true);
		expect(REMOTE_ALLOWLIST.has('z-story-teller')).toBe(true);
		expect(isRemoteAllowed('z_admin', 'Discord')).toBe(true);
		expect(isRemoteAllowed('z-story-teller', 'Discord')).toBe(true);
	});

	it('allows pure dice modules for Discord', () => {
		expect(REMOTE_ALLOWLIST.has('2-coc')).toBe(true);
		expect(isRemoteAllowed('2-coc', 'Discord')).toBe(true);
		expect(isRemoteAllowed('0-advroll', 'Discord')).toBe(true);
		expect(isRemoteAllowed('lang', 'Discord')).toBe(true);
		expect(isRemoteAllowed('z_character', 'Discord')).toBe(true);
	});

	it('allows non-Discord platforms for unknown modules', () => {
		expect(isRemoteAllowed(null, 'Telegram')).toBe(true);
		expect(isRemoteAllowed('anything', 'Line')).toBe(true);
		expect(isRemoteAllowed(null, 'WWW')).toBe(true);
	});

	it('does not allow unknown modules for Discord', () => {
		expect(isRemoteAllowed('not-a-real-module', 'Discord')).toBe(false);
	});

	it('does not allow empty module id for Discord (stay local until matched)', () => {
		expect(isRemoteAllowed('', 'Discord')).toBe(false);
		expect(isRemoteAllowed(null, 'Discord')).toBe(false);
	});
});
