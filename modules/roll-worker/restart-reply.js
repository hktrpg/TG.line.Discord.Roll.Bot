"use strict";

/**
 * Human-readable replies for `.root restart` / `.root stop`.
 */

function mapRestartError(translate, error) {
	const e = String(error || '');
	if (/ROLL_LOCAL_WORKER_URL unset|Standby unavailable/i.test(e)) {
		return {
			reason: translate('admin.restart_reason_standby_unset'),
			hint: translate('admin.restart_hint_standby_unset'),
		};
	}
	if (/ROLL_WORKER_URL unset/i.test(e)) {
		return {
			reason: translate('admin.restart_reason_primary_unset'),
			hint: translate('admin.restart_hint_primary_unset'),
		};
	}
	if (/restart already in progress|reload already in progress/i.test(e)) {
		return {
			reason: translate('admin.restart_reason_busy'),
			hint: translate('admin.restart_hint_busy'),
		};
	}
	if (/health still OK/i.test(e)) {
		return {
			reason: translate('admin.restart_reason_still_up'),
			hint: translate('admin.restart_hint_still_up'),
		};
	}
	if (/did not come back|shut down and did not|did not return/i.test(e)) {
		return {
			reason: translate('admin.restart_reason_not_back'),
			hint: translate('admin.restart_hint_not_back'),
		};
	}
	return {
		reason: e || translate('admin.restart_reason_unknown'),
		hint: translate('admin.restart_hint_generic'),
	};
}

function modeDescription(translate, mode) {
	const key = `admin.restart_mode_${String(mode || '').replaceAll(/[^\w]/g, '_')}`;
	const text = translate(key);
	if (!text || text === key) {
		return translate('admin.restart_mode_unknown', { mode: mode || '—' });
	}
	return text;
}

/**
 * @param {(key: string, vars?: object) => string} translate
 * @param {string} target primary|standby
 * @param {object} result
 */
function formatRestartTarget(translate, target, result = {}) {
	const lines = [];
	const scopeKey = target === 'primary'
		? 'admin.restart_scope_primary'
		: 'admin.restart_scope_standby';

	if (result.ok) {
		lines.push(
			translate('admin.restart_ok_header', { target }),
			translate('admin.restart_scope_line', { scope: translate(scopeKey) }),
		);
		if (result.mode) {
			lines.push(translate('admin.restart_line_mode', {
				mode: result.mode,
				mode_detail: modeDescription(translate, result.mode),
			}));
		}
		if (result.url) {
			lines.push(translate('admin.restart_line_url', { url: result.url }));
		}
		if (result.pid != null) {
			lines.push(translate('admin.restart_line_pid', { pid: String(result.pid) }));
		}
		if (result.warning) {
			lines.push(translate('admin.restart_line_warning', { warning: result.warning }));
		}
		if (result.hint) {
			lines.push(translate('admin.restart_line_hint', { hint: result.hint }));
		}
		if (result.note) {
			lines.push(translate('admin.restart_line_note', { note: result.note }));
		}
		lines.push(
			translate('admin.restart_line_note_ok'),
			translate('admin.restart_line_vs_gateway'),
		);
		return lines.join('\n');
	}

	const mapped = mapRestartError(translate, result.error);
	lines.push(
		translate('admin.restart_fail_header', { target }),
		translate('admin.restart_scope_line', { scope: translate(scopeKey) }),
		translate('admin.restart_line_reason', { reason: mapped.reason }),
		translate('admin.restart_line_hint', { hint: result.hint || mapped.hint }),
	);
	if (result.url) {
		lines.push(translate('admin.restart_line_url', { url: result.url }));
	}
	if (result.status != null) {
		lines.push(translate('admin.restart_line_http_status', { status: String(result.status) }));
	}
	lines.push(
		translate('admin.restart_line_note_fail'),
		translate('admin.restart_line_vs_gateway'),
	);
	return lines.join('\n');
}

function formatStopTarget(translate, target, result = {}) {
	const lines = [];
	const scopeKey = target === 'primary'
		? 'admin.restart_scope_primary'
		: 'admin.restart_scope_standby';

	if (result.ok) {
		lines.push(
			translate('admin.stop_ok_header', { target }),
			translate('admin.restart_scope_line', { scope: translate(scopeKey) }),
		);
		if (result.mode) {
			lines.push(translate('admin.restart_line_mode', {
				mode: result.mode,
				mode_detail: modeDescription(translate, result.mode),
			}));
		}
		if (result.url) {
			lines.push(translate('admin.restart_line_url', { url: result.url }));
		}
		if (result.note) {
			lines.push(translate('admin.restart_line_note', { note: result.note }));
		}
		lines.push(translate('admin.stop_line_note_ok'));
		return lines.join('\n');
	}

	const mapped = mapRestartError(translate, result.error);
	lines.push(
		translate('admin.stop_fail_header', { target }),
		translate('admin.restart_scope_line', { scope: translate(scopeKey) }),
		translate('admin.restart_line_reason', { reason: mapped.reason }),
		translate('admin.restart_line_hint', { hint: result.hint || mapped.hint }),
	);
	return lines.join('\n');
}

/**
 * @param {(key: string, vars?: object) => string} translate
 * @param {string} target primary|standby
 * @param {object} result
 */
function formatRootRestartText(translate, target, result) {
	return formatRestartTarget(translate, String(target || 'standby').toLowerCase(), result || {});
}

function formatRootStopText(translate, target, result) {
	return formatStopTarget(translate, String(target || 'standby').toLowerCase(), result || {});
}

module.exports = {
	mapRestartError,
	modeDescription,
	formatRestartTarget,
	formatStopTarget,
	formatRootRestartText,
	formatRootStopText,
};
