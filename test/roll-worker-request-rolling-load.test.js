"use strict";

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

/**
 * Split deploy: Roll Worker often has no DISCORD_CHANNEL_SECRET.
 * request-rolling / edit must still load under ROLL_WORKER_MODE (remote allowlist).
 * Jest+Babel cannot parse CommonJS top-level `return`, so load via real Node.
 */
describe('request-rolling / edit load on Roll Worker without Discord secret', () => {
	it('source gate matches export/forward ROLL_WORKER_MODE exception', () => {
		for (const rel of ['roll/request-rolling.js', 'roll/edit.js']) {
			const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
			expect(src).toMatch(
				/!process\.env\.DISCORD_CHANNEL_SECRET && process\.env\.ROLL_WORKER_MODE !== 'true'/
			);
		}
	});

	it('Node worker without secret can require and run .re', () => {
		const script = `
			process.env.ROLL_WORKER_MODE = 'true';
			delete process.env.DISCORD_CHANNEL_SECRET;
			const mod = require(${JSON.stringify(path.join(ROOT, 'roll/request-rolling.js'))});
			if (typeof mod.prefixs !== 'function') throw new Error('no prefixs');
			mod.rollDiceCommand({
				inputStr: '.re 1d100 哈哈,簽到',
				mainMsg: ['.re', '1d100', '哈哈,簽到'],
				locale: 'zh-tw',
			}).then((r) => {
				if (!r.requestRolling || r.requestRolling.join('|') !== '1d100 哈哈|簽到') {
					throw new Error('bad requestRolling: ' + JSON.stringify(r));
				}
				const edit = require(${JSON.stringify(path.join(ROOT, 'roll/edit.js'))});
				if (typeof edit.prefixs !== 'function') throw new Error('edit no prefixs');
				process.stdout.write('ok');
			}).catch((e) => {
				console.error(e);
				process.exit(1);
			});
		`;
		const env = { ...process.env, ROLL_WORKER_MODE: 'true' };
		delete env.DISCORD_CHANNEL_SECRET;
		const result = spawnSync(process.execPath, ['-e', script], {
			cwd: ROOT,
			encoding: 'utf8',
			env,
		});
		expect(result.status).toBe(0);
		expect(result.stdout).toContain('ok');
	});
});
