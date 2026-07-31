"use strict";

/**
 * Ops build identity for Gateway / Roll Worker.
 * Display: `{branch} · {YYYY-MM-DD} · {sha}` (not package.json semver).
 *
 * Docker note: bind-mounted repos are often owned by a host uid (e.g. hktrpgbot)
 * while the process runs as `node` (uid 1000). Modern git refuses that with
 * "dubious ownership" — we pass `safe.directory=*` and fall back to reading
 * `.git/HEAD` + refs from the filesystem (no env vars required).
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

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

/**
 * Resolve `.git` directory (supports plain dir and `gitdir:` file).
 * @param {string} [start]
 * @returns {string|null}
 */
function findGitDir(start = process.cwd()) {
	let dir = path.resolve(start);
	for (let i = 0; i < 10; i++) {
		const gitPath = path.join(dir, '.git');
		try {
			const st = fs.statSync(gitPath);
			if (st.isDirectory()) return gitPath;
			if (st.isFile()) {
				const content = fs.readFileSync(gitPath, 'utf8');
				const match = content.match(/^gitdir:\s*(.+)$/m);
				if (match) return path.resolve(dir, match[1].trim());
			}
		} catch {
			/* walk up */
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

function readRefSha(gitDir, ref) {
	const refPath = path.join(gitDir, ref);
	try {
		return fs.readFileSync(refPath, 'utf8').trim();
	} catch {
		/* packed-refs */
	}
	try {
		const packed = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8');
		for (const line of packed.split('\n')) {
			if (!line || line.startsWith('#') || line.startsWith('^')) continue;
			const [sha, name] = line.trim().split(/\s+/);
			if (name === ref && sha) return sha.trim();
		}
	} catch {
		/* ignore */
	}
	return '';
}

/** Branch from `.git/HEAD` when it is a symbolic ref. */
function readBranchFromFs() {
	const gitDir = findGitDir();
	if (!gitDir) return '';
	try {
		const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
		if (!head.startsWith('ref: ')) return '';
		const ref = head.slice(5).trim();
		const match = ref.match(/^refs\/heads\/(.+)$/);
		return match ? match[1] : '';
	} catch {
		return '';
	}
}

/** Full commit sha from `.git/HEAD` / refs (works without git binary). */
function readShaFromFs() {
	const gitDir = findGitDir();
	if (!gitDir) return '';
	try {
		const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
		if (head.startsWith('ref: ')) {
			return readRefSha(gitDir, head.slice(5).trim());
		}
		if (/^[0-9a-f]{7,40}$/i.test(head)) return head;
	} catch {
		/* ignore */
	}
	return '';
}

function tryGit(args) {
	try {
		// Allow bind-mounts owned by a different uid than the container user.
		return execFileSync('git', ['-c', 'safe.directory=*', ...args], {
			encoding: 'utf8',
			timeout: 1500,
			stdio: ['ignore', 'pipe', 'ignore'],
			cwd: process.cwd(),
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
	if (abbr && abbr !== 'HEAD') return abbr;
	const fromFs = readBranchFromFs();
	if (fromFs) return fromFs;
	if (abbr === 'HEAD') return 'detached';
	return fromFs || 'detached';
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
	const full = tryGit(['rev-parse', 'HEAD']) || readShaFromFs();
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
	findGitDir,
	readBranchFromFs,
	readShaFromFs,
	PRODUCTION_BRANCHES,
};
