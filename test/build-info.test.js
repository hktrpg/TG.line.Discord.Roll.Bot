"use strict";

const buildInfo = require('../modules/runtime/build-info');

describe('build-info', () => {
	const saved = {};

	beforeEach(() => {
		for (const key of [
			'GIT_BRANCH', 'GITHUB_REF_NAME', 'BRANCH_NAME', 'HEROKU_BRANCH',
			'GITHUB_SHA', 'SOURCE_VERSION', 'GIT_COMMIT', 'HEROKU_SLUG_COMMIT',
			'BUILD_TIME', 'SOURCE_DATE', 'ROLL_WORKER_MODE',
		]) {
			saved[key] = process.env[key];
			delete process.env[key];
		}
		buildInfo.resetCache();
	});

	afterEach(() => {
		for (const [key, value] of Object.entries(saved)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
		buildInfo.resetCache();
	});

	it('uses env branch, sha, and BUILD_TIME for display', () => {
		process.env.GIT_BRANCH = 'Distributed-';
		process.env.GITHUB_SHA = 'abcdef1234567890';
		process.env.BUILD_TIME = '2026-07-30T08:00:00.000Z';
		process.env.ROLL_WORKER_MODE = 'true';

		const info = buildInfo.get();
		expect(info.gitBranch).toBe('Distributed-');
		expect(info.gitSha).toBe('abcdef1');
		expect(info.builtDate).toBe('2026-07-30');
		expect(info.role).toBe('roll-worker');
		expect(info.display).toBe('Distributed- · 2026-07-30 · abcdef1');
		expect(info.isProductionBranch).toBe(false);
		expect(buildInfo.getPublic().display).toBe(info.display);
	});

	it('strips refs/heads/ and marks master as production branch', () => {
		process.env.GITHUB_REF_NAME = 'refs/heads/master';
		process.env.GIT_COMMIT = 'deadbeefcafebabe';
		process.env.BUILD_TIME = '2026-01-15T12:00:00Z';

		const info = buildInfo.get();
		expect(info.gitBranch).toBe('master');
		expect(info.isProductionBranch).toBe(true);
		expect(info.role).toBe('gateway');
		expect(info.display).toBe('master · 2026-01-15 · deadbee');
	});

	it('shortSha handles heroku-style values', () => {
		expect(buildInfo.shortSha('v99:abcdef12')).toBe('abcdef1');
		expect(buildInfo.shortSha('abc')).toBe('abc');
		expect(buildInfo.shortSha('')).toBe('unknown');
	});

	it('caches until resetCache', () => {
		process.env.GIT_BRANCH = 'a';
		process.env.GITHUB_SHA = '1111111';
		process.env.BUILD_TIME = '2026-07-01T00:00:00.000Z';
		expect(buildInfo.getDisplay()).toContain('a ·');
		process.env.GIT_BRANCH = 'b';
		expect(buildInfo.getDisplay()).toContain('a ·');
		buildInfo.resetCache();
		expect(buildInfo.getDisplay()).toContain('b ·');
	});

	it('reads branch and sha from .git without env', () => {
		const info = buildInfo.get();
		// This repo checkout should expose a real branch/sha via git or FS fallback.
		expect(info.gitBranch).not.toBe('detached');
		expect(info.gitSha).not.toBe('unknown');
		expect(info.gitSha.length).toBeGreaterThanOrEqual(7);
		expect(info.display).toMatch(/· \d{4}-\d{2}-\d{2} ·/);
	});

	it('findGitDir / FS helpers resolve this repository', () => {
		const gitDir = buildInfo.findGitDir();
		expect(gitDir).toBeTruthy();
		const branch = buildInfo.readBranchFromFs();
		const sha = buildInfo.readShaFromFs();
		// Branch may be empty only in true detached HEAD; sha should still resolve.
		expect(sha).toMatch(/^[0-9a-f]{7,40}$/i);
		if (branch) expect(branch).not.toBe('HEAD');
	});
});
