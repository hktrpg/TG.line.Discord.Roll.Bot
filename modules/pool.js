"use strict";

// Simple semaphore-based concurrency pool with named registries
// Concurrency can be set by:
//  - POOL_<NAME>_CONCURRENCY (e.g. POOL_IMAGE_CONCURRENCY, POOL_HTML_CONCURRENCY)
//  - Specific legacy vars (IMAGE_POOL_CONCURRENCY, HTML_POOL_CONCURRENCY)
//  - POOL_DEFAULT_CONCURRENCY (fallback)
//  - default 1

function parseConcurrency(value, fallback = 1) {
    const n = Number.parseInt(value, 10);
    return Math.max(1, n || fallback || 1);
}

class Semaphore {
    constructor(limit) {
        this.limit = limit;
        this.activeCount = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.activeCount < this.limit) {
            this.activeCount++;
            return;
        }
        return new Promise(resolve => {
            this.queue.push(resolve);
        });
    }

    release() {
        this.activeCount--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.activeCount++;
            next();
        }
    }
}

class Pool {
    constructor(concurrency = parseConcurrency(process.env.POOL_DEFAULT_CONCURRENCY || 1)) {
        this.semaphore = new Semaphore(concurrency);
        this.concurrency = concurrency;
    }

    async run(taskFn) {
        await this.semaphore.acquire();
        try {
            return await taskFn();
        } finally {
            this.semaphore.release();
        }
    }
}

class PoolRegistry {
    constructor() {
        this.pools = new Map();
    }

    // Resolve concurrency for a given pool name with environment fallbacks
    resolveConcurrency(name) {
        if (!name) return parseConcurrency(process.env.POOL_DEFAULT_CONCURRENCY || 1);
        const upper = name.toUpperCase();
        // Named env e.g. POOL_IMAGE_CONCURRENCY
        const named = process.env[`POOL_${upper}_CONCURRENCY`];
        if (named) return parseConcurrency(named);
        // Legacy specific envs
        if (upper === 'IMAGE' && process.env.IMAGE_POOL_CONCURRENCY) {
            return parseConcurrency(process.env.IMAGE_POOL_CONCURRENCY);
        }
        if (upper === 'HTML' && process.env.HTML_POOL_CONCURRENCY) {
            return parseConcurrency(process.env.HTML_POOL_CONCURRENCY);
        }
        // Global default
        return parseConcurrency(process.env.POOL_DEFAULT_CONCURRENCY || 1);
    }

    get(name, overrideConcurrency) {
        const key = (name || 'default').toLowerCase();
        if (this.pools.has(key)) return this.pools.get(key);
        const concurrency = parseConcurrency(overrideConcurrency, this.resolveConcurrency(name));
        const pool = new Pool(concurrency);
        this.pools.set(key, pool);
        return pool;
    }
}

// Global singleton registry
const registry = new PoolRegistry();


function getPool(name, concurrency) {
    return registry.get(name, concurrency);
}

// Backward compatibility export names


module.exports = {
    // Core constructs
    Semaphore,
    Pool,
    PoolRegistry,
    // API
    getPool,
};


