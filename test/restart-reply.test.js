"use strict";

const i18n = require('../modules/i18n/i18n.js');
const {
	formatRootRestartText,
	formatRootStopText,
	mapRestartError,
} = require('../modules/roll-worker/restart-reply');

describe('restart-reply', () => {
	let t;

	beforeAll(async () => {
		await i18n.init();
		t = i18n.createTranslator('zh-tw');
	});

	it('maps standby unset to actionable reason/hint', () => {
		const mapped = mapRestartError(t, 'ROLL_STANDBY_URL unset (auto-spawn disabled?)');
		expect(mapped.reason).toMatch(/Standby|URL/i);
		expect(mapped.hint).toMatch(/SPAWN|standby/i);
	});

	it('formats failed standby restart', () => {
		const text = formatRootRestartText(t, 'standby', {
			ok: false,
			error: 'ROLL_STANDBY_URL unset (auto-spawn disabled?)',
		});
		expect(text).toContain('【.root restart standby】失敗');
		expect(text).toContain('目標範圍');
		expect(text).toContain('失敗原因');
		expect(text).not.toContain('ok=false');
	});

	it('formats successful primary restart', () => {
		const text = formatRootRestartText(t, 'primary', {
			ok: true,
			mode: 'self-restart',
			url: 'http://127.0.0.1:20612',
			pid: 1234,
		});
		expect(text).toContain('【.root restart primary】成功');
		expect(text).toContain('self-restart');
		expect(text).toContain('20612');
		expect(text).toContain('1234');
	});

	it('formats successful stop', () => {
		const text = formatRootStopText(t, 'standby', {
			ok: true,
			mode: 'stopped',
			url: 'http://127.0.0.1:20613',
			note: 'Standby stopped',
		});
		expect(text).toContain('【.root stop standby】成功');
		expect(text).toContain('stopped');
	});
});
