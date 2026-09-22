'use strict';

const { createProblemDebug } = require('../runtime/problem-debug');

// One parent-owned queue for every cluster.respawn caller, including respawnAll.
class ClusterRecovery {
    constructor({ retryMs = 5000, maxAttempts = 3, cooldownMs = 60_000,
        windowMs = 600_000, globalLimit = 12, clusterLimit = 3,
        failureThreshold = 3, outagePauseMs = 300_000, readyTimeoutMs = 120_000 } = {}) {
        for (const [name, value] of Object.entries({ retryMs, cooldownMs })) {
            if (!Number.isFinite(value) || value < 0) throw new TypeError(`Invalid ${name}`);
        }
        for (const [name, value] of Object.entries({ maxAttempts, windowMs, globalLimit,
            clusterLimit, failureThreshold, outagePauseMs, readyTimeoutMs })) {
            if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`Invalid ${name}`);
        }
        this.retryMs = retryMs;
        this.maxAttempts = maxAttempts;
        this.cooldownMs = cooldownMs;
        this.windowMs = windowMs;
        this.globalLimit = globalLimit;
        this.clusterLimit = clusterLimit;
        this.failureThreshold = failureThreshold;
        this.outagePauseMs = outagePauseMs;
        this.readyTimeoutMs = readyTimeoutMs;
        this.attempts = [];
        this.failedClusters = new Set();
        this.pauseUntil = 0;
        this.attached = new WeakSet();
        this.pending = new Map();
        this.lastFinished = new Map();
        this.tail = Promise.resolve();
        this.stopped = false;
        this.waits = new Set();
        this.debug = createProblemDebug({ role: 'discord-parent' });
    }

    // Cooldown, failure budget, outage pause and retry backoff wait outside the
    // execution lock so one cluster cannot hold up restarts that are ready to run.
    nextEligibleAt(id, now = Date.now()) {
        this.attempts = this.attempts.filter(entry => entry.at > now - this.windowMs);
        const own = this.attempts.filter(entry => entry.id === id);
        return Math.max(this.pauseUntil,
            (this.lastFinished.get(id) || 0) + this.cooldownMs,
            this.attempts.length >= this.globalLimit ? this.attempts[0].at + this.windowMs : 0,
            own.length >= this.clusterLimit ? own[0].at + this.windowMs : 0);
    }

    canStart(id) {
        const now = Date.now();
        return this.nextEligibleAt(id, now) <= now;
    }

    noteFailure(id) {
        const now = Date.now();
        this.attempts.push({ id, at: now });
        this.failedClusters.add(id);
        if (this.failedClusters.size >= this.failureThreshold) {
            this.pauseUntil = now + this.outagePauseMs;
        }
    }

    async waitUntilEligible(id) {
        while (!this.stopped) {
            const now = Date.now();
            const eligibleAt = this.nextEligibleAt(id, now);
            if (eligibleAt <= now) return;
            console.warn(`[ClusterRecovery] paused cluster=${id} waitMs=${eligibleAt - now}`);
            await this.wait(eligibleAt - now);
        }
        throw new Error('Cluster recovery stopped');
    }

    stop() {
        this.stopped = true;
        while (this.waits.size > 0) {
            const finish = this.waits.values().next().value;
            finish();
        }
    }

    wait(ms) {
        return new Promise(resolve => {
            const finish = () => {
                clearTimeout(timer);
                this.waits.delete(finish);
                resolve();
            };
            const timer = setTimeout(finish, ms);
            this.waits.add(finish);
        });
    }

    enqueue(run) {
        const task = this.tail.then(run);
        this.tail = task.catch(() => {});
        return task;
    }

    request(id, run, source = 'cluster.respawn') {
        if (this.stopped) return Promise.reject(new Error('Cluster recovery stopped'));
        if (this.pending.has(id)) {
            this.debug('recovery_merged', { clusterId: id, source, pending: this.pending.size });
            return this.pending.get(id);
        }
        const queuedAt = Date.now();
        const task = (async () => {
            let attempt = 1;
            while (attempt <= this.maxAttempts) {
                await this.waitUntilEligible(id);
                const outcome = await this.enqueue(async () => {
                    if (this.stopped) throw new Error('Cluster recovery stopped');
                    if (!this.canStart(id)) return { deferred: true };
                    await Promise.resolve();
                    if (this.stopped) throw new Error('Cluster recovery stopped');
                    const startedAt = Date.now();
                    try {
                        this.debug('recovery_attempt', { clusterId: id, source, attempt,
                            queuedMs: startedAt - queuedAt }, null, { force: true });
                        console.warn(`[ClusterRecovery] starting cluster=${id} attempt=${attempt}/${this.maxAttempts}`);
                        const result = await run();
                        this.failedClusters.clear();
                        this.pauseUntil = 0;
                        this.debug('recovery_ready', { clusterId: id, source, attempt,
                            durationMs: Date.now() - startedAt }, null, { force: true });
                        return { done: true, value: result };
                    } catch (error) {
                        this.debug('recovery_failed', { clusterId: id, source, attempt,
                            durationMs: Date.now() - startedAt }, error, { force: true });
                        this.noteFailure(id);
                        return { error };
                    }
                });
                if (outcome.deferred) continue;
                if (outcome.done) return outcome.value;
                if (attempt === this.maxAttempts || this.stopped) throw outcome.error;
                await this.wait(this.retryMs * 2 ** (attempt - 1));
                if (this.stopped) throw new Error('Cluster recovery stopped');
                attempt += 1;
            }
            throw new Error('Cluster recovery attempts exhausted');
        })().finally(() => {
            this.pending.delete(id);
            this.lastFinished.set(id, Date.now());
        });
        this.pending.set(id, task);
        return task;
    }

    attach(cluster) {
        if (this.attached.has(cluster)) return;
        this.attached.add(cluster);
        const respawn = cluster.respawn.bind(cluster);
        cluster.respawn = (options = {}) => {
            const timeout = Number.isFinite(options.timeout) && options.timeout > 0
                ? options.timeout : this.readyTimeoutMs;
            const savedOptions = { ...options, timeout };
            // Caller frame identifies heartbeat, IPC, schedule or death without
            // logging options, tokens, message payloads or environment variables.
            const source = new Error('cluster.respawn caller').stack?.split('\n')[2]?.trim() || 'cluster.respawn';
            const task = this.request(cluster.id, () => respawn(savedOptions), source);
            // HeartbeatManager invokes respawn without awaiting/catching it.
            // Observe rejection here while preserving it for callers that await.
            void task.catch(error => console.error(`[ClusterRecovery] cluster=${cluster.id}: ${error.message}`));
            return task;
        };
    }
}

module.exports = { ClusterRecovery };
