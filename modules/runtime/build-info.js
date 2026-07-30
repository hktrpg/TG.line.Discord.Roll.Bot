"use strict";

/**
 * Ops build identity for Gateway / Roll Worker.
 * Display: `{branch} · {YYYY-MM-DD} · {sha}` (not package.json semver).
 */

const { execFileSync } = require('node:child_process');

const PRODUCTION_BRANCHES = new Set(['master', 'main']);

/** @type {ReturnType<typeof compute> | null} */
let cached = null;

function readEnvFirst(...keys) {
	for (const key of keys) {
		const value = (process.env[key] || '').trim();
		if (value) return value;
	}
	return '';
}

function shortSha(raw) {
	const s = String(raw || '').trim();
	if (!s) return 'unknown';
	const cleaned = s.includes(':') ? s.split(':').at(-1) : s;
	return cleaned.length > 7 ? cleaned.slice(0, 7) : cleaned;
}

function tryGit(args) {
	try {
		return execFileSync('git', args, {
			encoding: 'utf8',
			timeout: 1500,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
	} catch {
		return '';
	}
}

function resolveBranch() {
	const fromEnv = readEnvFirst(
		'GIT_BRANCH',
		'GITHUB_REF_NAME',
		'BRANCH_NAME',
		'HEROKU_BRANCH',
	);
	if (fromEnv) {
		return fromEnv.replace(/^refs\/heads\//, '') || 'unknown';
	}
	const abbr = tryGit(['rev-parse', '--abbrev-ref', 'HEAD']);
	if (!abbr || abbr === 'HEAD') return 'detached';
	return abbr;
}

function resolveSha() {
	const fromEnv = readEnvFirst(
		'GITHUB_SHA',
		'SOURCE_VERSION',
		'GIT_COMMIT',
		'HEROKU_SLUG_COMMIT',
	);
	if (fromEnv) {
		return {
			gitSha: shortSha(fromEnv),
			gitShaFull: fromEnv.length >= 7 ? fromEnv : null,
		};
	}
	const full = tryGit(['rev-parse', 'HEAD']);
	const short = tryGit(['rev-parse', '--short', 'HEAD']) || shortSha(full);
	return {
		gitSha: short || 'unknown',
		gitShaFull: full || null,
	};
}

function resolveBuiltAt() {
	const fromEnv = readEnvFirst('BUILD_TIME', 'SOURCE_DATE');
	if (fromEnv) {
		const d = new Date(fromEnv);
		if (!Number.isNaN(d.getTime())) return d.toISOString();
		return fromEnv;
	}
	const gitDate = tryGit(['log', '-1', '--format=%cI']);
	if (gitDate) {
		const d = new Date(gitDate);
		if (!Number.isNaN(d.getTime())) return d.toISOString();
	}
	return new Date().toISOString();
}

function toBuiltDate(builtAt) {
	const d = new Date(builtAt);
	if (Number.isNaN(d.getTime())) return 'unknown';
	return d.toISOString().slice(0, 10);
}

function resolveRole() {
	return process.env.ROLL_WORKER_MODE === 'true' ? 'roll-worker' : 'gateway';
}

function formatDisplay(gitBranch, builtDate, gitSha) {
	return `${gitBranch} · ${builtDate} · ${gitSha}`;
}

function compute() {
	const gitBranch = resolveBranch();
	const { gitSha, gitShaFull } = resolveSha();
	const builtAt = resolveBuiltAt();
	const builtDate = toBuiltDate(builtAt);
	const role = resolveRole();
	return {
		gitBranch,
		gitSha,
		gitShaFull,
		builtAt,
		builtDate,
		role,
		node: process.version,
		pid: process.pid,
		display: formatDisplay(gitBranch, builtDate, gitSha),
		isProductionBranch: PRODUCTION_BRANCHES.has(gitBranch),
	};
}

function get() {
	if (!cached) cached = compute();
	return cached;
}

function getPublic() {
	const info = get();
	return {
		gitBranch: info.gitBranch,
		gitSha: info.gitSha,
		builtAt: info.builtAt,
		builtDate: info.builtDate,
		role: info.role,
		node: info.node,
		display: info.display,
	};
}

function getDisplay() {
	return get().display;
}

/** Test helper — clear cache so env changes take effect. */
function resetCache() {
	cached = null;
}

module.exports = {
	get,
	getPublic,
	getDisplay,
	resetCache,
	formatDisplay,
	shortSha,
	PRODUCTION_BRANCHES,
};
