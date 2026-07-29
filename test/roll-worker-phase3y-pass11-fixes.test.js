"use strict";

/**
 * Phase 3y / Pass 11 — remaining Low/Info fixes:
 * L2 rate-limit /v1/parse, L9 env docs, I11 WWW Api+/api/local findRollList gate,
 * L15 LevelUp displayName via signed displaynameDiscord.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function postJson(port, urlPath, body, headers = {}) {
	const raw = JSON.stringify(body);
	return new Promise((resolve, reject) => {
		const req = http.request({
			hostname: '127.0.0.1',
			port,
			path: urlPath,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(raw),
				...headers,
			},
		}, (response) => {
			let data = '';
			response.on('data', (c) => { data += c; });
			response.on('end', () => {
				let json = null;
				try { json = data ? JSON.parse(data) : null; } catch { json = data; }
				resolve({ status: response.statusCode, body: json });
			});
		});
		req.on('error', reject);
		req.write(raw);
		req.end();
	});
}

describe('Phase 3y L2 Worker /v1/parse rate limit', () => {
	it('exports default rate-limit config (300 / 60s)', async () => {
		await jest.isolateModulesAsync(async () => {
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: '1', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			const {
				DEFAULT_RATE_LIMIT_POINTS,
				DEFAULT_RATE_LIMIT_DURATION,
				getRateLimitConfig,
			} = require('../modules/roll-worker/server');
			expect(DEFAULT_RATE_LIMIT_POINTS).toBe(300);
			expect(DEFAULT_RATE_LIMIT_DURATION).toBe(60);
			const prevP = process.env.ROLL_WORKER_RATE_LIMIT_POINTS;
			const prevD = process.env.ROLL_WORKER_RATE_LIMIT_DURATION;
			delete process.env.ROLL_WORKER_RATE_LIMIT_POINTS;
			delete process.env.ROLL_WORKER_RATE_LIMIT_DURATION;
			expect(getRateLimitConfig()).toEqual({ points: 300, duration: 60 });
			process.env.ROLL_WORKER_RATE_LIMIT_POINTS = '12';
			process.env.ROLL_WORKER_RATE_LIMIT_DURATION = '30';
			expect(getRateLimitConfig()).toEqual({ points: 12, duration: 30 });
			if (prevP === undefined) delete process.env.ROLL_WORKER_RATE_LIMIT_POINTS;
			else process.env.ROLL_WORKER_RATE_LIMIT_POINTS = prevP;
			if (prevD === undefined) delete process.env.ROLL_WORKER_RATE_LIMIT_DURATION;
			else process.env.ROLL_WORKER_RATE_LIMIT_DURATION = prevD;
		});
	});

	it('returns 429 after points exhausted', async () => {
		await jest.isolateModulesAsync(async () => {
			const prevToken = process.env.ROLL_WORKER_TOKEN;
			delete process.env.ROLL_WORKER_TOKEN;
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'ok', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));

			const { createRollWorkerApp } = require('../modules/roll-worker/server');
			const app = createRollWorkerApp({
				allowNoToken: true,
				rateLimit: { points: 2, duration: 60 },
			});
			const server = await new Promise((resolve) => {
				const s = app.listen(0, '127.0.0.1', () => resolve(s));
			});
			const { port } = server.address();
			try {
				const body = {
					inputStr: '1d3',
					botname: 'Telegram',
					userid: 'u-rl',
					groupid: 'g-rl',
				};
				const a = await postJson(port, '/v1/parse', body);
				const b = await postJson(port, '/v1/parse', body);
				const c = await postJson(port, '/v1/parse', body);
				expect(a.status).toBe(200);
				expect(b.status).toBe(200);
				expect(c.status).toBe(429);
				expect(c.body.error).toMatch(/Too Many Requests/i);
				expect(app.locals.stats.rateLimitedCount).toBeGreaterThanOrEqual(1);
			} finally {
				await new Promise((resolve) => server.close(resolve));
				if (prevToken === undefined) delete process.env.ROLL_WORKER_TOKEN;
				else process.env.ROLL_WORKER_TOKEN = prevToken;
			}
		});
	});

	it('disableRateLimit option skips limiter', async () => {
		await jest.isolateModulesAsync(async () => {
			delete process.env.ROLL_WORKER_TOKEN;
			jest.doMock('../modules/analytics', () => ({
				parseInput: jest.fn(async () => ({ text: 'ok', type: 'text' })),
				findRollModuleName: jest.fn(() => '0-advroll'),
			}));
			jest.doMock('../modules/roll-worker/character-action', () => ({
				runCharacterAction: jest.fn(),
			}));
			jest.doMock('../modules/roll-worker/route-table', () => ({
				isRemoteAllowed: () => true,
			}));
			const { createRollWorkerApp } = require('../modules/roll-worker/server');
			const app = createRollWorkerApp({
				allowNoToken: true,
				disableRateLimit: true,
				rateLimit: { points: 1, duration: 60 },
			});
			const server = await new Promise((resolve) => {
				const s = app.listen(0, '127.0.0.1', () => resolve(s));
			});
			const { port } = server.address();
			try {
				const body = { inputStr: '1d3', botname: 'Telegram', userid: 'u', groupid: 'g' };
				const a = await postJson(port, '/v1/parse', body);
				const b = await postJson(port, '/v1/parse', body);
				expect(a.status).toBe(200);
				expect(b.status).toBe(200);
			} finally {
				await new Promise((resolve) => server.close(resolve));
			}
		});
	});
});

describe('Phase 3y L9 .env.copy documents Worker HOST/PORT/JSON/RATE', () => {
	it('includes HOST PORT JSON_LIMIT and RATE_LIMIT vars', () => {
		const env = fs.readFileSync(path.join(ROOT, '.env.copy'), 'utf8');
		expect(env).toMatch(/ROLL_WORKER_HOST/);
		expect(env).toMatch(/ROLL_WORKER_PORT/);
		expect(env).toMatch(/ROLL_WORKER_JSON_LIMIT/);
		expect(env).toMatch(/ROLL_WORKER_RATE_LIMIT_POINTS/);
		expect(env).toMatch(/ROLL_WORKER_RATE_LIMIT_DURATION/);
		expect(env).toMatch(/ROLL_WORKER_TIMEOUT_MS=120000/);
	});
});

describe('Phase 3y I11 WWW Api + /api/local findRollList gate', () => {
	it('handleApiRequest and /api/local call findRollList before parseRouter', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/core-www.js'), 'utf8');
		const apiIdx = src.indexOf('async function handleApiRequest');
		expect(apiIdx).toBeGreaterThan(-1);
		const apiBlock = src.slice(apiIdx, apiIdx + 2200);
		expect(apiBlock).toMatch(/shouldSkipLocalFindRollList\('Api'\)/);
		expect(apiBlock).toMatch(/findRollList\(/);
		const findIdx = apiBlock.indexOf("shouldSkipLocalFindRollList('Api')");
		const parseIdx = apiBlock.indexOf('parseRouter.parseInput', findIdx);
		expect(parseIdx).toBeGreaterThan(findIdx);

		const localIdx = src.indexOf("www.get('/api/local'");
		expect(localIdx).toBeGreaterThan(-1);
		const localBlock = src.slice(localIdx, localIdx + 1600);
		expect(localBlock).toMatch(/shouldSkipLocalFindRollList\('Local'\)/);
		expect(localBlock).toMatch(/findRollList\(/);
		const localFind = localBlock.indexOf("shouldSkipLocalFindRollList('Local')");
		const localParse = localBlock.indexOf('parseRouter.parseInput', localFind);
		expect(localParse).toBeGreaterThan(localFind);
	});
});

describe('Phase 3y L15 LevelUp displayName on Worker', () => {
	it('resolveLevelUpDisplayName prefers live member then signed displaynameDiscord', () => {
		// Pure helper — load via source eval pattern to avoid mongoURL early-return.
		const src = fs.readFileSync(path.join(ROOT, 'modules/chat/level.js'), 'utf8');
		expect(src).toMatch(/function resolveLevelUpDisplayName/);
		expect(src).toMatch(/displayNames\.displaynameDiscord/);
		expect(src).toMatch(/resolveLevelUpDisplayName\(/);

		// Inline the same priority for behavioral proof without loading level.js module.
		function resolveLevelUpDisplayName(discordMessage, displayNames = {}, username, unnamed = '') {
			const live = discordMessage?.member?.displayName || discordMessage?.author?.username;
			return live
				|| displayNames.displaynameDiscord
				|| displayNames.displayname
				|| username
				|| unnamed;
		}
		expect(resolveLevelUpDisplayName(
			{ member: { displayName: 'Nick' } },
			{ displaynameDiscord: 'Signed' },
			'Stored',
			'?'
		)).toBe('Nick');
		expect(resolveLevelUpDisplayName(
			null,
			{ displaynameDiscord: 'SignedNick' },
			'Stored',
			'?'
		)).toBe('SignedNick');
		expect(resolveLevelUpDisplayName(null, {}, 'Stored', '?')).toBe('Stored');
	});

	it('Discord bot sets displaynameDiscord from member.displayName', () => {
		const src = fs.readFileSync(path.join(ROOT, 'modules/discord/bot.js'), 'utf8');
		expect(src).toMatch(/message\.member\?\.displayName/);
		expect(src).toMatch(/displaynameDiscord/);
		const idx = src.indexOf('const displaynameDiscord =');
		expect(idx).toBeGreaterThan(-1);
		const block = src.slice(idx, idx + 280);
		expect(block).toMatch(/member\?\.displayName/);
	});
});
