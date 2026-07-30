"use strict";

const i18n = require('../modules/i18n/i18n.js');
const {
	formatRootReloadText,
	mapReloadError,
} = require('../modules/roll-worker/reload-reply');

describe('reload-reply', () => {
	let t;

	beforeAll(async () => {
		await i18n.init();
		t = i18n.createTranslator('zh-tw');
	});

	it('maps local unset to actionable reason/hint', () => {
		const mapped = mapReloadError(t, 'ROLL_LOCAL_WORKER_URL unset (start shared local worker or ROLL_LOCAL_WORKER_SPAWN=true)');
		expect(mapped.reason).toContain('ROLL_LOCAL_WORKER_URL');
		expect(mapped.hint).toContain('SPAWN');
		expect(mapped.hint).toContain('3951');
	});

	it('formats failed local reload with detailed sections', () => {
		const text = formatRootReloadText(t, 'local', {
			ok: false,
			error: 'ROLL_LOCAL_WORKER_URL unset (start shared local worker or ROLL_LOCAL_WORKER_SPAWN=true)',
		});
		expect(text).toContain('【.root reload local】失敗');
		expect(text).toContain('目標範圍');
		expect(text).toContain('失敗原因');
		expect(text).toContain('建議作法');
		expect(text).toContain('respawnall');
		expect(text).not.toContain('ok=false');
	});

	it('formats successful remote reload with mode detail', () => {
		const text = formatRootReloadText(t, 'remote', {
			ok: true,
			mode: 'self-restart',
			url: 'http://127.0.0.1:3950',
			pid: 1234,
		});
		expect(text).toContain('【.root reload remote】成功');
		expect(text).toContain('self-restart');
		expect(text).toContain('3950');
		expect(text).toContain('1234');
		expect(text).toMatch(/自我重啟|successor|self-restart/i);
	});

	it('formats all with intro, both sides, and footer', () => {
		const text = formatRootReloadText(t, 'all', {
			ok: true,
			local: { ok: false, error: 'ROLL_LOCAL_WORKER_URL unset' },
			remote: { ok: true, mode: 'self-restart', url: 'http://127.0.0.1:3950' },
		});
		expect(text).toContain('【.root reload all】合併結果');
		expect(text).toContain('依序嘗試');
		expect(text).toContain('【.root reload local】失敗');
		expect(text).toContain('【.root reload remote】成功');
		expect(text).toContain('總結');
	});
});
