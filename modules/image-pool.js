"use strict";

// Simple semaphore-based concurrency pool for image-related workloads
// Concurrency is controlled via env IMAGE_POOL_CONCURRENCY (default 2)

const DEFAULT_CONCURRENCY = Math.max(1, Number.parseInt(process.env.IMAGE_POOL_CONCURRENCY || "1", 10) || 1);

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

class ImagePool {
    constructor(concurrency = DEFAULT_CONCURRENCY) {
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

// Singleton instance so all modules share the same pool
const sharedPool = new ImagePool(DEFAULT_CONCURRENCY);

module.exports = {
    sharedPool,
    ImagePool
};


