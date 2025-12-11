/* eslint-disable n/no-process-exit */
"use strict";

if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}

const DELAY = Number(process.env.DISCORDDELAY) || 1000 * 30;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

const agenda = require('../modules/schedule')?.agenda;
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const { ClusterManager, HeartbeatManager, AutoResharderManager } = require('discord-hybrid-sharding');
require("./ds-deploy-commands");

// Initialize database protection layer for automatic health monitoring and recovery
// This initializes the singleton instance which starts health monitoring automatically
require('./db-protection-layer.js');  
console.log('[Core-Discord] Database protection layer initialized with automatic health monitoring');

// Import database connector for graceful shutdown
const dbConnector = require('./db-connector.js');

// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;

// Detailed signal tracking function (disabled to reduce noise)
function logSignalDetails() {
    // Function body commented out to reduce noise as per user request
}

// Graceful shutdown function
async function gracefulShutdown(exitProcess = true) {
    if (isShuttingDown) {
        console.log('[Cluster] Shutdown already in progress, ignoring duplicate call');
        return;
    }
    isShuttingDown = true;

    console.log('[Cluster] Starting graceful shutdown...');

    // Clear shutdown timeout
    if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
        shutdownTimeout = null;
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
            await manager.triggerMaintenance('Shutting down');
        } catch (error) {
            // Handle IPC and other expected errors during shutdown
            const errorCode = error.code || '';
            const errorMessage = error.message || String(error);
            if (errorCode === 'EPIPE' || errorCode === 'ERR_IPC_CHANNEL_CLOSED' ||
                errorCode === 'ERR_IPC_DISCONNECTED' || errorCode === 'ECONNRESET' ||
                errorMessage.includes('EPIPE') || errorMessage.includes('Channel closed') ||
                errorMessage.includes('IPC') || errorMessage.includes('disconnected') ||
                errorMessage.includes('Connection lost') || errorMessage.includes('socket hang up')) {
                console.log('[Cluster] Ignoring IPC channel errors during triggerMaintenance (expected behavior)');
            } else {
                console.warn(`[Cluster] maintenance trigger failed: ${error.message}`);
            }
        }

        // First, try to gracefully destroy all Discord clients
        try {
            console.log('[Cluster] Broadcasting destroy command to all clusters...');
            await manager.broadcastEval(async (client) => {
                try {
                    if (client && typeof client.destroy === 'function') {
                        console.log('[Cluster] Destroying Discord client...');
                        await client.destroy();
                        console.log('[Cluster] Discord client destroyed successfully');
                    }
                } catch (error) {
                    console.warn('[Cluster] Error destroying client:', error.message);
                }
                // Don't call process.exit here - let the manager handle it
            }, { timeout: 30_000 });
            console.log('[Cluster] All clients notified to destroy');
        } catch (error) {
            // Handle IPC and other expected errors during shutdown
            const errorCode = error.code || '';
            const errorMessage = error.message || String(error);
            if (errorCode === 'EPIPE' || errorCode === 'ERR_IPC_CHANNEL_CLOSED' ||
                errorCode === 'ERR_IPC_DISCONNECTED' || errorCode === 'ECONNRESET' ||
                errorMessage.includes('EPIPE') || errorMessage.includes('Channel closed') ||
                errorMessage.includes('IPC') || errorMessage.includes('disconnected') ||
                errorMessage.includes('Connection lost') || errorMessage.includes('socket hang up')) {
                console.log('[Cluster] Ignoring IPC channel errors during shutdown (expected behavior)');
            } else {
                console.warn('[Cluster] broadcastEval during shutdown encountered an error:', error);
            }
        }

        // Wait a bit for clients to finish destroying
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Now destroy the cluster manager itself
        try {
            console.log('[Cluster] Destroying cluster manager...');
            if (manager) {
                // Try different destroy methods based on the library version
                switch ('function') {
                case typeof manager.destroy: {
                    await manager.destroy();
                    console.log('[Cluster] Cluster manager destroyed successfully');
                
                break;
                }
                case typeof manager.close: {
                    await manager.close();
                    console.log('[Cluster] Cluster manager closed successfully');
                
                break;
                }
                case typeof manager.broadcastEval: {
                    // For hybrid sharding, try to broadcast exit command
                    console.log('[Cluster] Broadcasting exit command to all clusters...');
                    try {
                        await manager.broadcastEval(() => {
                            console.log('[Cluster] Received exit command, shutting down...');
                            process.exit(0);
                        }, { timeout: 10_000 });
                    } catch (broadcastError) {
                        // Handle IPC and other expected errors during shutdown
                        const errorCode = broadcastError.code || '';
                        const errorMessage = broadcastError.message || String(broadcastError);
                        if (errorCode === 'EPIPE' || errorCode === 'ERR_IPC_CHANNEL_CLOSED' ||
                            errorCode === 'ERR_IPC_DISCONNECTED' || errorCode === 'ECONNRESET' ||
                            errorMessage.includes('EPIPE') || errorMessage.includes('Channel closed') ||
                            errorMessage.includes('IPC') || errorMessage.includes('disconnected') ||
                            errorMessage.includes('Connection lost') || errorMessage.includes('socket hang up')) {
                            console.log('[Cluster] Ignoring IPC channel errors during broadcastEval exit (expected behavior)');
                        } else {
                            console.warn('[Cluster] Broadcast exit error:', broadcastError.message);
                        }
                    }

                break;
                }
                // No default
                }
            }
        } catch (error) {
            console.warn('[Cluster] Error destroying cluster manager:', error.message);
        }

        // Give a moment for everything to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Close database connection before exit
        try {
            console.log('[Cluster] Closing database connection...');
            await dbConnector.disconnect();
            console.log('[Cluster] Database connection closed.');
        } catch (error) {
            console.warn('[Cluster] Error closing database connection:', error.message);
        }

        if (exitProcess) {
            process.exit(0);
        }
    } catch (error) {
        console.error('[Cluster] Error during shutdown:', error);
        console.error('[Cluster] Shutdown error stack:', error.stack);
        process.exit(1);
    }
}

// Configuration options
const clusterOptions = {
    token: channelSecret,
    shardsPerClusters: 2,     // Increased from 1 to 2. Reduces process count from 56 to 28. Saves ~50% RAM and DB connections.
    totalShards: 'auto',
    mode: 'process',
    respawn: true, // Enable auto respawn to prevent CLUSTERING_NO_CHILD_EXISTS
    retry: {
        attempts: MAX_RETRY_ATTEMPTS,
        delay: RETRY_DELAY
    },
    // Add execArgv for Node.js command-line options (recommended by discord.js sharding guide)
    execArgv: ['--trace-warnings'],
    // Add reconnection and backoff options
    fetchTimeout: 30_000,
    restarts: {
        max: 3, // Reduced from 5 to prevent excessive restarts
        interval: 60_000 * 5 // Reduced from 10 minutes to 5 minutes
    },
    // Queue options for complex codebases
    queue: {
        auto: true, // Auto queue clusters, can be set to false for manual control
    }
};

const manager = new ClusterManager('./modules/discord_bot.js', clusterOptions);

// AutoResharder configuration for automatic re-sharding
manager.autoresharder = new AutoResharderManager(manager, {
    /* minimum amount of guilds each shard should contain */
    MinGuildsPerShard: 1400, // or auto

    /* maximum amount of guilds each shard should contain -> if exceeded it auto. "re-shards" the bot */
    MaxGuildsPerShard: 2400,

    /* OPTIONAL: RestartOptions which should be used for the ClusterManager */
    restartOptions: {
        /** The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed  */
        restartMode: 'rolling', // or 'gracefulSwitch'
        /** The delay to wait between each cluster spawn */
        delay: 7e3, // any number > 0 | above 7 prevents api ratelimit
        /** The readyTimeout to wait until the cluster spawn promise is rejected */
        timeout: -1,
    },
});

// Improved event handling
let heartbeatStarted = false;
manager.on('clusterCreate', shard => {

    shard.on('spawn', () => {
        const maxShard = Math.ceil(shard.manager.totalShards / 3);
        console.log(`[Cluster ${shard.id}] Ready with ${shard.manager.totalShards} total shards. Max shards per cluster: ${maxShard}`);

        if (heartbeatStarted) {
            return;
        }

        // For single cluster respawn, only check if this specific cluster is ready
        // During respawn, clusters.size might not equal totalClusters yet
        const activeClusters = [...shard.manager.clusters.values()].filter(c => c.ready);
        const allActiveReady = activeClusters.length === shard.manager.clusters.size;

        if (allActiveReady) {
            heartbeatStarted = true;
            shard.manager.broadcast({ type: 'startHeartbeat' });
        }
    });

    const errorHandler = (event, error) => {
        // Don't handle errors if shutting down
        if (isShuttingDown) return;

        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [Cluster] Cluster ${shard.id} ${event}:`, error);

        // Add detailed diagnostics for cluster death
        if (event === 'death') {
            const exitCode = error && typeof error === 'string' ? error.match(/Exit code: (\d+)/)?.[1] : 'unknown';
            console.error(`[${timestamp}] [Cluster] Cluster ${shard.id} death detected. Exit code: ${exitCode}`);

            // Log cluster state for debugging
            console.error(`[${timestamp}] [Cluster] Cluster ${shard.id} diagnostics:`, {
                ready: shard.ready,
                thread: !!shard.thread,
                totalClusters: shard.manager.totalClusters,
                activeClusters: [...shard.manager.clusters.values()].filter(c => c.ready).length,
                totalShards: shard.manager.totalShards,
                respawnEnabled: shard.manager.respawn
            });

            // Don't manually respawn if auto-respawn is enabled
            if (shard.manager.respawn) {
                console.log(`[${timestamp}] [Cluster] Auto-respawn enabled, letting ClusterManager handle respawn for cluster ${shard.id}`);
                return;
            }

            // Manual respawn for legacy compatibility (though auto-respawn is now enabled)
            setTimeout(() => {
                if (!isShuttingDown) {
                    console.log(`[${timestamp}] [Cluster] Attempting manual respawn for cluster ${shard.id} after ${RETRY_DELAY}ms delay`);
                    try {
                        shard.respawn({ timeout: 60_000 });
                        console.log(`[${timestamp}] [Cluster] Manual respawn command sent for cluster ${shard.id}`);
                    } catch (error_) {
                        console.error(`[${timestamp}] [Cluster] Manual respawn error for cluster ${shard.id}:`, error_?.message || error_);
                    }
                } else {
                    console.log(`[${timestamp}] [Cluster] Shutdown in progress, skipping respawn for cluster ${shard.id}`);
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

// Heartbeat management
manager.extend(
    new HeartbeatManager({
        interval: 15_000,          // Optimized interval to 15s to reduce load (increased from 10s)
        maxMissedHeartbeats: 10,  // Increased tolerance to 150s total (allows for 60s DB timeouts)
        onMissedHeartbeat: (cluster) => {
            if (!isShuttingDown) {
                console.warn(`[Heartbeat] Cluster ${cluster.id} missed a heartbeat (Tolerance: ${10 - cluster.missedHeartbeats} remaining)`);
                // If cluster consistently misses heartbeats, trigger respawn
                if (cluster.missedHeartbeats >= 8) { // After 80 seconds of missed heartbeats
                    console.error(`[Heartbeat] Cluster ${cluster.id} missed too many heartbeats, triggering respawn`);
                    try {
                        cluster.respawn({ delay: 7000, timeout: -1 });
                    } catch (error) {
                        console.error(`[Heartbeat] Failed to respawn cluster ${cluster.id}:`, error.message);
                    }
                }
            }
        },
        onClusterReady: (cluster) => {
            console.log(`[Heartbeat] Cluster ${cluster.id} is now ready and sending heartbeats`);
        }
    })
);


// Queue control system for complex codebases
if (clusterOptions.queue && clusterOptions.queue.auto === false) {
    // Manual queue control - spawn and then manually trigger next
    manager.on('clusterCreate', cluster => {
        cluster.on('ready', () => {
            // When a cluster is ready, spawn the next one in queue
            setTimeout(() => {
                if (!isShuttingDown) {
                    manager.queue.next();
                }
            }, 1000); // Small delay to prevent overwhelming
        });
    });
}

// Start clusters
manager.spawn({
    timeout: -1,
    delay: DELAY,
    amount: 'auto'
}).then(() => {
    // If manual queue control is enabled, start the queue
    if (clusterOptions.queue && clusterOptions.queue.auto === false) {
        setTimeout(() => {
            if (!isShuttingDown) {
                manager.queue.next();
            }
        }, DELAY);
    }
}).catch(error => {
    console.error('[Cluster] Failed to spawn clusters:', error);
    process.exit(1);
});

// Export shutdown function for use by index.js when running as module
async function shutdown() {
    return gracefulShutdown(false); // Don't exit process when called as module
}

// Only setup signal handlers when running standalone (not when required by index.js)
if (require.main === module) {
    // Process signal handling
    process.on('SIGTERM', async () => {
        logSignalDetails('SIGTERM', 'Cluster');

        // Prevent multiple simultaneous shutdowns
        if (isShuttingDown) {
            console.log('[Cluster] Shutdown already in progress, ignoring SIGTERM');
            return;
        }

        // Set force shutdown timeout
        shutdownTimeout = setTimeout(() => {
            const exitTimestamp = new Date().toISOString();
            const exitStack = new Error('Force shutdown timeout stack trace').stack;
            const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
            console.error('[Cluster] ========== FORCE SHUTDOWN TIMEOUT (SIGTERM) ==========');
            console.error(`[Cluster] Timestamp: ${exitTimestamp}`);
            console.error(`[Cluster] Reason: Graceful shutdown timeout (30 seconds)`);
            console.error(`[Cluster] Exit Code: 1 (Force shutdown)`);
            console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
            console.error(`[Cluster] Stack Trace:\n${exitStackLines}`);
            console.error('[Cluster] ==========================================');
            console.log('[Cluster] Force shutdown after timeout');
            process.exit(1);
        }, 30_000); // 30 second timeout

        await gracefulShutdown();
    });

    process.on('SIGINT', async () => {
        logSignalDetails('SIGINT', 'Cluster');

        // Prevent multiple simultaneous shutdowns
        if (isShuttingDown) {
            console.log('[Cluster] Shutdown already in progress, ignoring SIGINT');
            return;
        }

        // Set force shutdown timeout
        shutdownTimeout = setTimeout(() => {
            const exitTimestamp = new Date().toISOString();
            const exitStack = new Error('Force shutdown timeout stack trace').stack;
            const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
            console.error('[Cluster] ========== FORCE SHUTDOWN TIMEOUT (SIGINT) ==========');
            console.error(`[Cluster] Timestamp: ${exitTimestamp}`);
            console.error(`[Cluster] Reason: Graceful shutdown timeout (30 seconds)`);
            console.error(`[Cluster] Exit Code: 1 (Force shutdown)`);
            console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
            console.error(`[Cluster] Stack Trace:\n${exitStackLines}`);
            console.error('[Cluster] ==========================================');
            console.log('[Cluster] Force shutdown after timeout');
            process.exit(1);
        }, 30_000); // 30 second timeout

        await gracefulShutdown();
    });
}

// Export functions for use when required as module
module.exports = {
    shutdown,
    manager
};