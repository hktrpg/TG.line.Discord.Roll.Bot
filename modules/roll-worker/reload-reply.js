"use strict";

/**
 * Human-readable replies for `.root reload` / respawn (ops-facing, detailed).
 */

function mapReloadError(translate, error) {
	const e = String(error || '');
	if (/ROLL_LOCAL_WORKER_URL unset/i.test(e)) {
		return {
			reason: translate('admin.reload_reason_local_unset'),
			hint: translate('admin.reload_hint_local_unset'),
		};
	}
	if (/ROLL_WORKER_URL unset/i.test(e)) {
		return {
			reason: translate('admin.reload_reason_remote_unset'),
			hint: translate('admin.reload_hint_remote_unset'),
		};
	}
	if (/reload already in progress/i.test(e)) {
		return {
			reason: translate('admin.reload_reason_busy'),
			hint: translate('admin.reload_hint_busy'),
		};
	}
	if (/health still OK/i.test(e)) {
		return {
			reason: translate('admin.reload_reason_still_up'),
			hint: translate('admin.reload_hint_still_up'),
		};
	}
	if (/did not come back|shut down and did not/i.test(e)) {
		return {
			reason: translate('admin.reload_reason_remote_not_back'),
			hint: translate('admin.reload_hint_remote_not_back'),
		};
	}
	if (/missing/i.test(e)) {
		return {
			reason: translate('admin.reload_reason_missing_part'),
			hint: translate('admin.reload_hint_generic'),
		};
	}
	return {
		reason: e || translate('admin.reload_reason_unknown'),
		hint: translate('admin.reload_hint_generic'),
	};
}

function modeDescription(translate, mode) {
	const key = `admin.reload_mode_${String(mode || '').replaceAll(/[^\w-]/g, '_')}`;
	const text = translate(key);
	// i18n may return the key itself when missing
	if (!text || text === key) {
		return translate('admin.reload_mode_unknown', { mode: mode || '—' });
	}
	return text;
}

/**
 * @param {(key: string, vars?: object) => string} translate
 * @param {string} target local|remote
 * @param {object} result reloadLocal/reloadRemote result
 */
function formatReloadTarget(translate, target, result = {}) {
	const lines = [];
	const scopeKey = target === 'remote'
		? 'admin.reload_scope_remote'
		: 'admin.reload_scope_local';

	if (result.ok) {
		lines.push(
			translate('admin.reload_ok_header', { target }),
			translate('admin.reload_scope_line', { scope: translate(scopeKey) }),
		);
		if (result.mode) {
			lines.push(translate('admin.reload_line_mode', {
				mode: result.mode,
				mode_detail: modeDescription(translate, result.mode),
			}));
		}
		if (result.url) {
			lines.push(translate('admin.reload_line_url', { url: result.url }));
		}
		if (result.pid != null) {
			lines.push(translate('admin.reload_line_pid', { pid: String(result.pid) }));
		}
		if (result.warning) {
			lines.push(translate('admin.reload_line_warning', { warning: result.warning }));
		}
		if (result.hint) {
			lines.push(translate('admin.reload_line_hint', { hint: result.hint }));
		}
		lines.push(
			translate('admin.reload_line_note_ok'),
			translate('admin.reload_line_vs_respawn'),
		);
		return lines.join('\n');
	}

	const mapped = mapReloadError(translate, result.error);
	lines.push(
		translate('admin.reload_fail_header', { target }),
		translate('admin.reload_scope_line', { scope: translate(scopeKey) }),
		translate('admin.reload_line_reason', { reason: mapped.reason }),
		translate('admin.reload_line_hint', { hint: result.hint || mapped.hint }),
	);
	if (result.url) {
		lines.push(translate('admin.reload_line_url', { url: result.url }));
	}
	if (result.status != null) {
		lines.push(translate('admin.reload_line_http_status', { status: String(result.status) }));
	}
	lines.push(
		translate('admin.reload_line_note_fail'),
		translate('admin.reload_line_vs_respawn'),
	);
	return lines.join('\n');
}

/**
 * @param {(key: string, vars?: object) => string} translate
 * @param {string} target local|remote|all
 * @param {object} result
 */
function formatRootReloadText(translate, target, result) {
	const t = String(target || 'local').toLowerCase();
	if (t === 'all') {
		return [
			translate('admin.reload_all_header'),
			translate('admin.reload_all_intro'),
			'',
			formatReloadTarget(translate, 'local', result?.local || { ok: false, error: 'missing' }),
			'',
			formatReloadTarget(translate, 'remote', result?.remote || { ok: false, error: 'missing' }),
			'',
			translate('admin.reload_all_footer'),
		].join('\n');
	}
	return formatReloadTarget(translate, t, result || {});
}

module.exports = {
	mapReloadError,
	modeDescription,
	formatReloadTarget,
	formatRootReloadText,
};
