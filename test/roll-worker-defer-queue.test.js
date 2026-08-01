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
		process.env.ROLL_WORKER_URL = 'http://127.0.0.1:20612';
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

	it('defers primaryStopped for REMOTE_ONLY replay after restart', () => {
		expect(deferQueue.isDeferrableReason('primaryStopped')).toBe(true);
		expect(deferQueue.enqueue({
			reason: 'primaryStopped',
			params: { inputStr: '1d6', userid: 'u1', botname: 'Telegram' },
			replyTarget: { botname: 'Telegram', chatId: 'c1', userid: 'u1' },
		}).ok).toBe(true);
		expect(deferQueue.size()).toBe(1);
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
		expect(deferQueue.isTransportSafeError(new Error('connect ECONNREFUSED 127.0.0.1:20612'))).toBe(true);
		expect(deferQueue.isTransportSafeError(new Error('timeout of 120000ms exceeded'))).toBe(true);
		expect(deferQueue.isTransportSafeError(new Error('Unauthorized'))).toBe(false);
	});

	it('isPreFlightConnectError excludes timeouts', () => {
		expect(deferQueue.isPreFlightConnectError(new Error('connect ECONNREFUSED 127.0.0.1:20612'))).toBe(true);
		expect(deferQueue.isPreFlightConnectError(new Error('getaddrinfo ENOTFOUND host'))).toBe(true);
		expect(deferQueue.isPreFlightConnectError(new Error('timeout of 120000ms exceeded'))).toBe(false);
		expect(deferQueue.isPreFlightConnectError(new Error('ETIMEDOUT'))).toBe(false);
		expect(deferQueue.isPreFlightConnectError(new Error('Unauthorized'))).toBe(false);
	});

	it('purgeExpired notifies deliverer for expired jobs', async () => {
		const delivered = [];
		deferQueue.registerDeliverer('Telegram', async (job, result) => {
			delivered.push({ id: job.id, text: result.text, dropped: result._deferDropped });
		});
		process.env.ROLL_WORKER_DEFER_TTL_MS = '1';
		const enq = deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d6', userid: 'u-exp', botname: 'Telegram', locale: 'en' },
			replyTarget: { botname: 'Telegram', chatId: 'c-exp', userid: 'u-exp' },
		});
		expect(enq.ok).toBe(true);
		await new Promise((r) => setTimeout(r, 5));
		const n = await deferQueue.purgeExpired();
		expect(n).toBe(1);
		expect(deferQueue.size()).toBe(0);
		await new Promise((r) => setTimeout(r, 50));
		expect(delivered).toHaveLength(1);
		expect(delivered[0].dropped).toBe('expire');
		expect(delivered[0].text).toBeTruthy();
	});

	it('queue-full drop notifies deliverer for oldest job', async () => {
		const delivered = [];
		deferQueue.registerDeliverer('Telegram', async (job, result) => {
			delivered.push({ id: job.id, dropped: result._deferDropped, text: result.text });
		});
		process.env.ROLL_WORKER_DEFER_MAX = '2';
		process.env.ROLL_WORKER_DEFER_PER_USER = '10';
		const target = (uid) => ({ botname: 'Telegram', chatId: `c-${uid}`, userid: uid });
		expect(deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d1', userid: 'a', botname: 'Telegram' },
			replyTarget: target('a'),
		}).ok).toBe(true);
		expect(deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d2', userid: 'b', botname: 'Telegram' },
			replyTarget: target('b'),
		}).ok).toBe(true);
		expect(deferQueue.enqueue({
			reason: 'transport',
			params: { inputStr: '1d3', userid: 'c', botname: 'Telegram' },
			replyTarget: target('c'),
		}).ok).toBe(true);
		expect(deferQueue.size()).toBe(2);
		await new Promise((r) => setTimeout(r, 50));
		expect(delivered.some((d) => d.dropped === 'full')).toBe(true);
		expect(delivered.find((d) => d.dropped === 'full').text).toBeTruthy();
	});
});
