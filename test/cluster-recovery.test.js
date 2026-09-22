'use strict';

const { ClusterRecovery } = require('../modules/discord/cluster-recovery');

describe('parent cluster recovery queue', () => {
    afterEach(() => jest.useRealTimers());

    test('deduplicates a cluster and serializes different clusters until completion', async () => {
        const queue = new ClusterRecovery({ cooldownMs: 0 });
        let finish;
        const first = jest.fn(() => new Promise(resolve => { finish = resolve; }));
        const second = jest.fn().mockResolvedValue('ready');
        const a = queue.request(0, first);
        expect(queue.request(0, first)).toBe(a);
        const b = queue.request(1, second);
        for (let i = 0; i < 10 && first.mock.calls.length === 0; i += 1) {
            await Promise.resolve();
        }
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();
        finish();
        await Promise.all([a, b]);
        expect(second).toHaveBeenCalledTimes(1);
    });

    test('bounded retries release the queue after timeout failures', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ retryMs: 10, cooldownMs: 0 });
        const fail = jest.fn().mockRejectedValue(new Error('ready timeout'));
        const a = queue.request(0, fail);
        const rejection = expect(a).rejects.toThrow('ready timeout');
        const next = jest.fn().mockResolvedValue('ready');
        const b = queue.request(1, next);
        await jest.runAllTimersAsync();
        await rejection;
        await b;
        expect(fail).toHaveBeenCalledTimes(3);
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('shutdown cancels backoff and does not start another attempt', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ retryMs: 100, cooldownMs: 0 });
        const fail = jest.fn().mockRejectedValue(new Error('offline'));
        const a = queue.request(0, fail);
        await jest.advanceTimersByTimeAsync(0);
        expect(fail).toHaveBeenCalledTimes(1);
        queue.stop();
        await expect(a).rejects.toThrow('stopped');
        expect(fail).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    test('retry backoff does not block another cluster', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ retryMs: 1000, cooldownMs: 0 });
        const fail = jest.fn().mockRejectedValue(new Error('offline'));
        const a = queue.request(0, fail);
        const other = jest.fn().mockResolvedValue('ready');
        const b = queue.request(1, other);
        await jest.advanceTimersByTimeAsync(0);
        await b;
        expect(other).toHaveBeenCalledTimes(1);
        expect(fail).toHaveBeenCalledTimes(1);
        queue.stop();
        await expect(a).rejects.toThrow('stopped');
    });

    test('cluster adapter preserves options and return value', async () => {
        const queue = new ClusterRecovery();
        const cluster = { id: 2, respawn: jest.fn().mockResolvedValue('ready') };
        const original = cluster.respawn;
        queue.attach(cluster);
        await expect(cluster.respawn({ timeout: 120_000 })).resolves.toBe('ready');
        expect(original).toHaveBeenCalledWith({ timeout: 120_000 });
    });

    test('shutdown between admission and execution cannot start a child', async () => {
        const queue = new ClusterRecovery();
        const run = jest.fn();
        const task = queue.request(0, run);
        await Promise.resolve();
        queue.stop();
        await expect(task).rejects.toThrow('stopped');
        expect(run).not.toHaveBeenCalled();
    });

    test('new requests cannot reset a cluster failure budget', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ cooldownMs: 0, maxAttempts: 1, clusterLimit: 1, windowMs: 1000 });
        const fail = jest.fn().mockRejectedValue(new Error('down'));
        await expect(queue.request(0, fail)).rejects.toThrow('down');
        const next = queue.request(0, fail);
        const rejection = expect(next).rejects.toThrow('down');
        await jest.advanceTimersByTimeAsync(999);
        expect(fail).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(1);
        await rejection;
        expect(fail).toHaveBeenCalledTimes(2);
    });

    test('one cluster waiting on its failure budget does not block another', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ cooldownMs: 0, maxAttempts: 1, clusterLimit: 1, windowMs: 1000 });
        const fail = jest.fn().mockRejectedValue(new Error('down'));
        await expect(queue.request(0, fail)).rejects.toThrow('down');
        const blocked = queue.request(0, fail);
        const other = jest.fn().mockResolvedValue('ready');
        await queue.request(1, other);
        expect(other).toHaveBeenCalledTimes(1);
        expect(fail).toHaveBeenCalledTimes(1);
        queue.stop();
        await expect(blocked).rejects.toThrow('stopped');
    });

    test('successful restarts do not consume the failure budget', async () => {
        const queue = new ClusterRecovery({ cooldownMs: 0, globalLimit: 1, windowMs: 60_000 });
        const run = jest.fn().mockResolvedValue('ready');
        await queue.request(0, run);
        await queue.request(1, run);
        expect(run).toHaveBeenCalledTimes(2);
    });

    test('cluster cooldown does not block another cluster', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ cooldownMs: 60_000 });
        const run = jest.fn().mockResolvedValue('ready');
        await queue.request(0, run);
        const again = queue.request(0, run);
        const other = queue.request(1, run);
        await jest.advanceTimersByTimeAsync(0);
        await other;
        expect(run).toHaveBeenCalledTimes(2);
        await jest.advanceTimersByTimeAsync(60_000);
        await again;
        expect(run).toHaveBeenCalledTimes(3);
    });

    test('different clusters share a global failure budget', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ cooldownMs: 0, maxAttempts: 1, globalLimit: 1, windowMs: 1000 });
        const fail = jest.fn().mockRejectedValue(new Error('down'));
        await expect(queue.request(0, fail)).rejects.toThrow('down');
        const next = queue.request(1, fail);
        await jest.advanceTimersByTimeAsync(999);
        expect(fail).toHaveBeenCalledTimes(1);
        queue.stop();
        await expect(next).rejects.toThrow('stopped');
        expect(fail).toHaveBeenCalledTimes(1);
    });

    test('failures across clusters pause recovery and a successful probe clears outage', async () => {
        jest.useFakeTimers();
        const queue = new ClusterRecovery({ maxAttempts: 1, cooldownMs: 0, failureThreshold: 2, outagePauseMs: 1000 });
        const fail = () => Promise.reject(new Error('network'));
        await expect(queue.request(0, fail)).rejects.toThrow('network');
        await expect(queue.request(1, fail)).rejects.toThrow('network');
        const run = jest.fn().mockResolvedValue('ready');
        const probe = queue.request(2, run);
        await jest.advanceTimersByTimeAsync(999);
        expect(run).not.toHaveBeenCalled();
        await jest.advanceTimersByTimeAsync(1);
        await probe;
        await queue.request(3, run);
        expect(run).toHaveBeenCalledTimes(2);
    });

    test('heartbeat replaces a non-positive Ready timeout', async () => {
        const { HeartbeatManager } = require('discord-hybrid-sharding');
        const queue = new ClusterRecovery({ cooldownMs: 0 });
        const original = jest.fn().mockResolvedValue('ready');
        const cluster = { id: 0, respawn: original, restarts: { current: 0, max: 5 } };
        queue.attach(cluster);
        queue.attach(cluster); // accidental duplicate attachment must not recurse
        const wrapped = cluster.respawn;
        const pending = [];
        cluster.respawn = (...args) => {
            const task = wrapped(...args);
            pending.push(task);
            return task;
        };
        const heartbeat = new HeartbeatManager();
        heartbeat.manager = { spawnOptions: { delay: 7000, timeout: -1 }, _debug: jest.fn() };
        heartbeat.clusters.set(0, { stop: jest.fn() });
        heartbeat.stop(cluster, 'missing');
        await pending[0];
        expect(original).toHaveBeenCalledTimes(1);
        expect(original).toHaveBeenCalledWith({ delay: 7000, timeout: 120_000 });
    });

    test('respawnAll keeps its delay and uses a finite Ready timeout', async () => {
        const { ClusterManager } = require('discord-hybrid-sharding');
        const queue = new ClusterRecovery({ cooldownMs: 0 });
        const original = jest.fn().mockResolvedValue('ready');
        const cluster = { id: 0, respawn: original, restarts: { current: 0, max: 5 } };
        queue.attach(cluster);
        const manager = {
            clusters: new Map([[0, cluster]]),
            spawnOptions: { delay: 7000, timeout: -1 },
            promise: { nonce: new Map() },
            shardClusterList: [[0]],
            _debug: jest.fn(),
        };
        await ClusterManager.prototype.respawnAll.call(manager, {
            clusterDelay: 0,
            respawnDelay: 1000,
            timeout: -1,
        });
        expect(original).toHaveBeenCalledTimes(1);
        expect(original).toHaveBeenCalledWith({ delay: 1000, timeout: 120_000 });
    });
});
