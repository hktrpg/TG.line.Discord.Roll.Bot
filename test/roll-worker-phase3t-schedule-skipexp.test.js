"use strict";

jest.setTimeout(30_000);

/**
 * Phase 3t: Schedule [[dice]] must not award EXP even when groupid is present.
 */

describe('Phase 3t getRoll always sets skipExp', () => {
	it('passes skipExp:true with groupid to parseRouter', async () => {
		await jest.isolateModulesAsync(async () => {
			const parseInput = jest.fn(async () => ({ text: '4', type: 'text' }));
			jest.doMock('../modules/roll-worker/parse-router', () => ({ parseInput }));
			const { rollText } = require('../modules/chat/getRoll');
			const out = await rollText('hi [[1d6]]', {
				botname: 'Discord',
				groupid: 'g-schedule',
				userid: 'u-schedule',
			});
			expect(out).toBe('hi 4');
			expect(parseInput).toHaveBeenCalledWith(
				expect.objectContaining({
					inputStr: '1d6',
					groupid: 'g-schedule',
					skipExp: true,
				}),
				{ allowLocalFallback: true }
			);
		});
	});
});

describe('Phase 3t analytics honors skipExp', () => {
	it('does not call EXPUP when skipExp is true', async () => {
		await jest.isolateModulesAsync(async () => {
			const EXPUP = jest.fn(async () => ({ text: 'LEVELUP', statue: 'S' }));
			jest.doMock('../modules/chat/level', () => ({ EXPUP }));
			jest.doMock('../modules/chat/logs', () => ({
				courtMessage: jest.fn(),
				getState: jest.fn(),
			}));
			// Minimal roll path: avoid loading full roll modules when possible.
			const analytics = require('../modules/analytics');
			const result = await analytics.parseInput({
				inputStr: '1d3',
				botname: 'Schedule',
				groupid: 'g1',
				userid: 'u1',
				skipExp: true,
				locale: 'zh-tw',
			});
			expect(EXPUP).not.toHaveBeenCalled();
			expect(result.LevelUp || '').toBe('');
		});
	});
});

describe('Phase 3t client serializes skipExp', () => {
	it('includes skipExp in worker payload', () => {
		jest.resetModules();
		const client = require('../modules/roll-worker/client');
		// toSerializableContext is not exported — prove via axios mock on parse
		const axios = require('axios');
		const post = jest.spyOn(axios, 'post').mockResolvedValue({
			status: 200,
			data: { text: 'ok', type: 'text', _rollWorker: true },
		});
		const prevUrl = process.env.ROLL_WORKER_URL;
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		return client.parse({
			inputStr: '1d3',
			botname: 'Schedule',
			groupid: 'g1',
			skipExp: true,
		}).then(() => {
			expect(post).toHaveBeenCalledWith(
				'http://127.0.0.1:3950/v1/parse',
				expect.objectContaining({ skipExp: true, groupid: 'g1' }),
				expect.any(Object)
			);
		}).finally(() => {
			post.mockRestore();
			if (prevUrl === undefined) delete process.env.ROLL_WORKER_URL;
			else process.env.ROLL_WORKER_URL = prevUrl;
		});
	});
});
