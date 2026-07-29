"use strict";

const deferQueue = require('../modules/roll-worker/defer-queue');

describe('roll-worker defer-queue', () => {
	const prev = {};

	beforeEach(() => {
		for (const key of [
			'ROLL_WORKER_REMOTE_ONLY',
			'ROLL_WORKER_URL',
			'ROLL_WORKER_DEFER_BUSY',
			'ROLL_WORKER_DEFER_MAX',
			'ROLL_WORKER_DEFER_PER_USER',
			'ROLL_WORKER_DEFER_TTL_MS',
		]) {
			prev[key] = process.env[key];
		}
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:3950';
		delete process.env.ROLL_WORKER_DEFER_BUSY;
		process.env.ROLL_WORKER_DEFER_MAX = '5';
		process.env.ROLL_WORKER_DEFER_PER_USER = '2';
		process.env.ROLL_WORKER_DEFER_TTL_MS = '60000';
		deferQueue.resetDeferQueue();
		deferQueue.setReplayFn(null);
	});

	afterEach(() => {
		deferQueue.resetDeferQueue();
		deferQueue.setReplayFn(null);
		for (const [key, value] of Object.entries(prev)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	});

	it('isDeferBusyActive only when remote-only + URL', () => {
		expect(deferQueue.isDeferBusyActive()).toBe(true);
		delete process.env.ROLL_WORKER_REMOTE_ONLY;
		expect(deferQueue.isDeferBusyActive()).toBe(false);
		process.env.ROLL_WORKER_REMOTE_ONLY = 'true';
		process.env.ROLL_WORKER_DEFER_BUSY = 'false';
		expect(deferQueue.isDeferBusyActive()).toBe(false);
	});

	it('does not enqueue without replyTarget', () => {
		const r = deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d100', userid: 'u1', botname: 'Telegram' },
		});
		expect(r.ok).toBe(false);
		expect(deferQueue.size()).toBe(0);
	});

	it('enqueues and respects per-user cap', () => {
		const target = { botname: 'Telegram', chatId: 'c1', userid: 'u1' };
		expect(deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d3', userid: 'u1', botname: 'Telegram' },
			replyTarget: target,
		}).ok).toBe(true);
		expect(deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d4', userid: 'u1', botname: 'Telegram' },
			replyTarget: target,
		}).ok).toBe(true);
		expect(deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d5', userid: 'u1', botname: 'Telegram' },
			replyTarget: target,
		}).ok).toBe(false);
		expect(deferQueue.size()).toBe(2);
	});

	it('does not defer mutator-style reasons', () => {
		expect(deferQueue.isDeferrableReason('workerErrorNoFallback')).toBe(false);
		expect(deferQueue.enqueue({
			reason: 'workerErrorNoFallback',
			params: { inputStr: '.discord html', userid: 'u1' },
			replyTarget: { botname: 'Discord', channelId: 'c', userid: 'u1' },
		}).ok).toBe(false);
	});

	it('drains with replay + deliverer', async () => {
		const delivered = [];
		deferQueue.registerDeliverer('Telegram', async (job, result) => {
			delivered.push({ id: job.id, text: result.text });
		});
		deferQueue.setReplayFn(async () => ({ text: 'ok-later', type: 'text' }));
		deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d100', userid: 'u2', botname: 'Telegram' },
			replyTarget: { botname: 'Telegram', chatId: 'c2', userid: 'u2' },
		});
		const r = await deferQueue.tryDrain({ batch: 10 });
		expect(r.drained).toBe(1);
		expect(delivered).toEqual([{ id: expect.any(Number), text: 'ok-later' }]);
		expect(deferQueue.size()).toBe(0);
	});

	it('isTransportSafeError detects connection failures', () => {
		expect(deferQueue.isTransportSafeError(new Error('connect ECONNREFUSED 127.0.0.1:3950'))).toBe(true);
		expect(deferQueue.isTransportSafeError(new Error('timeout of 120000ms exceeded'))).toBe(true);
		expect(deferQueue.isTransportSafeError(new Error('Unauthorized'))).toBe(false);
	});
});
