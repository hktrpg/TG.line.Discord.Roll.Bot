/* eslint-disable n/no-process-exit */
"use strict";

if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}

const DELAY = 1000 * 10;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

const agenda = require('../modules/schedule')?.agenda;
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
require("./ds-deploy-commands");

// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;

// Graceful shutdown function (simplified as per attachment)
async function gracefulShutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('[Cluster] Starting graceful shutdown...');

    // Clear shutdown timeout
    if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
    }

    try {
        // Stop heartbeat manager
        if (manager.heartbeat) {
            console.log('[Cluster] Stopping heartbeat manager...');
            try {
                const hb = manager.heartbeat;
                if (hb && hb.clusters && typeof hb.clusters.values === 'function') {
                    for (const instance of hb.clusters.values()) {
                        try { instance.stop(); } catch (error) { void error; }
                    }
                    try { hb.clusters.clear(); } catch (error) { void error; }
                }
            } catch (error) {
                console.warn(`[Cluster] A non-critical error occurred while stopping the heartbeat manager: ${error.message}. Shutdown will continue.`);
            }
        }

        // Notify clusters and destroy client instances
        console.log('[Cluster] Notifying clusters and destroying clients...');
        try {
            manager.triggerMaintenance('Shutting down');
        } catch (error) {
            console.warn(`[Cluster] maintenance trigger failed: ${error.message}`);
        }

        try {
            await manager.broadcastEval(async (client) => {
                try {
                    if (client && typeof client.destroy === 'function') {
                        await client.destroy();
                    }
                } catch (error) { void error; }
                process.exit(0);
            }, { timeout: 15_000 });
        } catch (error) {
            console.warn('[Cluster] broadcastEval during shutdown encountered an error:', error);
        }

        console.log('[Cluster] Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('[Cluster] Error during shutdown:', error);
        process.exit(1);
    }
}

// Configuration options (simplified as per attachment)
const clusterOptions = {
    token: channelSecret,
    shardsPerClusters: 3,
    totalShards: 'auto',
    mode: 'process',
    spawnTimeout: -1,
    respawn: false, // Disable auto respawn, manually controlled (as per attachment)
    retry: {
        attempts: MAX_RETRY_ATTEMPTS,
        delay: RETRY_DELAY
    },
    // Add reconnection and backoff options
    fetchTimeout: 30_000,
    restarts: {
        max: 5,
        interval: 60_000 * 10 // 10 minutes
    }
};

const manager = new ClusterManager('./modules/discord_bot.js', clusterOptions);

// Improved event handling
let heartbeatStarted = false;
manager.on('clusterCreate', shard => {

    shard.on('ready', () => {
        // Get cluster configuration values
        const totalShards = shard.manager.totalShards;
        const totalClusters = shard.manager.totalClusters;
        const shardsPerCluster = shard.manager.shardsPerClusters ||
            (totalClusters > 0 ? Math.ceil(totalShards / totalClusters) : 3);

        console.log(`[Cluster ${shard.id}] Ready with ${totalShards} total shards. Max cluster: ${totalClusters}. Per cluster: ${shardsPerCluster}`);

        if (heartbeatStarted) return;

        // Ensure all clusters have been created before checking if they are ready
        if (shard.manager.clusters.size !== shard.manager.totalClusters) return;

        const allReady = [...shard.manager.clusters.values()].every(c => c.ready);

        if (allReady) {
            heartbeatStarted = true;
            console.log('[Cluster] All clusters are ready. Broadcasting startHeartbeat message.');
            shard.manager.broadcast({ type: 'startHeartbeat' });
        }
    });

    const errorHandler = (event, error) => {
        // Don't handle errors if shutting down
        if (isShuttingDown) return;

        console.error(`[Cluster ${shard.id}] ${event}:`, error);
        // Add retry logic (simplified as per attachment)
        if (event === 'death') {
            setTimeout(() => {
                if (!isShuttingDown) {
                    console.log(`[Cluster ${shard.id}] Attempting to respawn...`);
                    try {
                        shard.respawn({ timeout: 60_000 });
                    } catch (error_) {
                        console.error(`[Cluster ${shard.id}] Failed to respawn:`, error_);
                    }
                }
            }, RETRY_DELAY);
        }
    };

    shard.on('disconnect', () => {
        errorHandler('Disconnect');
    });

    shard.on('reconnecting', () => {
        // console.log(`[Cluster ${shard.id}] Reconnecting...`);
    });

    shard.on('death', (process) => {
        errorHandler('Death', `Exit code: ${process.exitCode}`);
    });

    shard.on('error', (error) => {
        console.error(`[Cluster] Cluster ${shard.id} error:`, error.message || error);
        if (error.stack) console.error(`[Cluster] Stack trace:\n${error.stack}`);
        errorHandler('Error', error);
    });
});

// Improved message handling
manager.on("clusterCreate", cluster => {
    // Handle IPC process errors (like EPIPE)
    if (cluster.process) {
        cluster.process.on('error', (error) => {
            if (error.code === 'EPIPE') {
                console.warn(`[Cluster ${cluster.id}] IPC EPIPE error (child process likely dead)`);
            } else {
                console.error(`[Cluster ${cluster.id}] Child process error:`, error);
            }
        });
    }

    cluster.on("message", async message => {
        // Don't handle respawn messages if shutting down
        if (isShuttingDown) return;

        if (message.respawn === true && message.id !== null && message.id !== undefined) {
            console.log(`[Cluster] Respawning cluster ${message.id}`);

            try {
                const targetCluster = manager.clusters.get(Number(message.id));
                if (targetCluster) {
                    await targetCluster.respawn({
                        delay: 1000,
                        timeout: 60_000
                    });
                    console.log(`[Cluster] Successfully respawned cluster ${message.id}`);
                } else {
                    console.error(`[Cluster] Cluster ${message.id} not found`);
                }
            } catch (error) {
                console.error(`[Cluster] Failed to respawn cluster ${message.id}:`, error);
            }
            return;
        }

        if (message.respawnall === true) {

            try {
                await manager.respawnAll({
                    clusterDelay: 1000 * 60 * 1, // 1 minutes between clusters
                    respawnDelay: 5000,          // 5 seconds
                    timeout: 1000 * 60 * 5       // 5 minutes timeout
                });
                console.log('[Cluster] Successfully initiated respawnAll for all clusters');
            } catch (error) {
                console.error('[Cluster] Failed to respawn all clusters:', error);
            }
        }
    });
});

// Improved scheduled tasks
if (agenda) {
    agenda.define('dailyDiscordMaintenance', async () => {
        if (isShuttingDown) return;

        const timestamp = new Date().toISOString();
        const stack = new Error('Daily maintenance stack trace').stack;
        const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';

        console.error('[Schedule] ========== DAILY MAINTENANCE RESPAWN TRIGGERED ==========');
        console.error(`[Schedule] Timestamp: ${timestamp}`);
        console.error(`[Schedule] Task: dailyDiscordMaintenance`);
        console.error(`[Schedule] Total Clusters: ${manager.clusters.size}`);
        console.error(`[Schedule] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error(`[Schedule] Stack Trace:\n${stackLines}`);
        console.error('[Schedule] ==========================================');
        console.log('[Schedule] Running daily Discord maintenance');

        try {
            await manager.respawnAll({
                clusterDelay: 1000 * 60,
                respawnDelay: 500,
                timeout: 1000 * 60 * 2
            });
            console.error('[Schedule] Daily maintenance respawnAll completed successfully');
        } catch (error) {
            console.error('[Schedule] ========== DAILY MAINTENANCE ERROR ==========');
            console.error(`[Schedule] Error Name: ${error && error.name}`);
            console.error(`[Schedule] Error Message: ${error && error.message}`);
            console.error(`[Schedule] Stack: ${error && error.stack}`);
            console.error('[Schedule] ==========================================');
            console.error('[Schedule] Failed to perform maintenance:', error);
        }
    });
}

// Heartbeat management (simplified as per attachment)
manager.extend(
    new HeartbeatManager({
        interval: 5000,           // Increased interval
        maxMissedHeartbeats: 5,   // Decreased tolerance
        onMissedHeartbeat: (cluster) => {
            if (!isShuttingDown) {
                console.warn(`[Heartbeat] Cluster ${cluster.id} missed a heartbeat`);
            }
        },
        onClusterReady: (cluster) => {
            console.log(`[Heartbeat] Cluster ${cluster.id} is now ready and sending heartbeats`);
        }
    })
);


// Start clusters (simplified as per attachment)
manager.spawn({
    timeout: -1,
    delay: DELAY,
    amount: 'auto'
}).catch(error => {
    console.error('[Cluster] Failed to spawn clusters:', error);
    process.exit(1);
});

// Export shutdown function for use by index.js when running as module
async function shutdown() {
    return gracefulShutdown(); // Simplified as per attachment
}

// Process signal handling (simplified as per attachment)
process.on('SIGTERM', async () => {
    console.log('[Cluster] Received SIGTERM signal');
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => {
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    await gracefulShutdown();
});

process.on('SIGINT', async () => {
    console.log('[Cluster] Received SIGINT signal');
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => {
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    await gracefulShutdown();
});

// Export functions for use when required as module
module.exports = {
    shutdown,
    manager
};