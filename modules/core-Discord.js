/* eslint-disable n/no-process-exit */
"use strict";

if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}

const DELAY = Number(process.env.DISCORDDELAY) || 1000 * 7;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

const agenda = require('../modules/schedule')?.agenda;
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
require("./ds-deploy-commands");

// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;

// Detailed signal tracking function
function logSignalDetails(signal, moduleName) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    const ppid = process.ppid;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Get stack trace (excluding this function and the signal handler)
    const stack = new Error('Signal stack trace').stack;
    const stackLines = stack ? stack.split('\n').slice(3).join('\n') : 'No stack trace available';
    
    // Try to get parent process information (with shorter timeout to avoid blocking)
    let parentInfo = 'Unable to read parent process info';
    try {
        const { execSync } = require('child_process');
        if (ppid && ppid !== 1) {
            try {
                // Try to get parent process command (Linux/Unix) with shorter timeout
                const parentCmd = execSync(`ps -p ${ppid} -o comm= 2>/dev/null || ps -p ${ppid} -o command= 2>/dev/null || echo "N/A"`, { encoding: 'utf8', timeout: 500, maxBuffer: 1024 }).trim();
                parentInfo = `Parent Process (${ppid}): ${parentCmd || 'N/A'}`;
            } catch (error) {
                // If timeout or error, just log the PPID
                parentInfo = `Parent Process (${ppid}): Read timeout/error (${error.code || error.message})`;
            }
        } else if (ppid === 1) {
            parentInfo = 'Parent Process (1): init/systemd (orphaned process or direct system management)';
        }
    } catch (error) {
        parentInfo = `Error reading parent info: ${error.message}`;
    }
    
    // Check PM2 environment variables
    const pm2Info = {
        PM2_HOME: process.env.PM2_HOME || 'N/A',
        PM2_INSTANCE_ID: process.env.pm_id || process.env.NODE_APP_INSTANCE || 'N/A',
        PM2_PUBLIC_KEY: process.env.PM2_PUBLIC_KEY ? 'SET' : 'N/A',
        PM2_SECRET_KEY: process.env.PM2_SECRET_KEY ? 'SET' : 'N/A',
        PM2_SERVE_PATH: process.env.PM2_SERVE_PATH || 'N/A',
        PM2_INTERACTOR_PID: process.env.PM2_INTERACTOR_PID || 'N/A'
    };
    
    // Additional PM2 diagnostic info
    const pm2Diagnostics = {
        isPM2: !!(process.env.PM2_HOME || process.env.pm_id),
        instanceId: process.env.pm_id || process.env.NODE_APP_INSTANCE || 'N/A',
        appName: process.env.name || 'N/A',
        execMode: process.env.exec_mode || 'N/A'
    };
    
    console.log(`[${moduleName}] ========== SIGNAL DETAILED LOG ==========`);
    console.log(`[${moduleName}] Signal: ${signal}`);
    console.log(`[${moduleName}] Timestamp: ${timestamp}`);
    console.log(`[${moduleName}] Process ID: ${pid}`);
    console.log(`[${moduleName}] Parent Process ID: ${ppid}`);
    console.log(`[${moduleName}] ${parentInfo}`);
    console.log(`[${moduleName}] PM2 Environment:`);
    console.log(`[${moduleName}]   - PM2_HOME: ${pm2Info.PM2_HOME}`);
    console.log(`[${moduleName}]   - PM2_INSTANCE_ID: ${pm2Info.PM2_INSTANCE_ID}`);
    console.log(`[${moduleName}]   - PM2_KEYS_SET: ${pm2Info.PM2_PUBLIC_KEY !== 'N/A' && pm2Info.PM2_SECRET_KEY !== 'N/A' ? 'YES' : 'NO'}`);
    console.log(`[${moduleName}]   - Is PM2 Managed: ${pm2Diagnostics.isPM2 ? 'YES' : 'NO'}`);
    console.log(`[${moduleName}]   - App Name: ${pm2Diagnostics.appName}`);
    console.log(`[${moduleName}]   - Exec Mode: ${pm2Diagnostics.execMode}`);
    console.log(`[${moduleName}]   - Instance ID: ${pm2Diagnostics.instanceId}`);
    console.log(`[${moduleName}] Uptime: ${uptime.toFixed(2)}s`);
    console.log(`[${moduleName}] Memory Usage: ${JSON.stringify({
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
    })}`);
    console.log(`[${moduleName}] Environment Variables:`);
    console.log(`[${moduleName}]   - SHARD_ID: ${process.env.SHARD_ID || 'N/A'}`);
    console.log(`[${moduleName}]   - CLUSTER_ID: ${process.env.CLUSTER_ID || 'N/A'}`);
    console.log(`[${moduleName}]   - NODE_ENV: ${process.env.NODE_ENV || 'N/A'}`);
    console.log(`[${moduleName}] Stack Trace:`);
    console.log(`[${moduleName}] ${stackLines}`);
    console.log(`[${moduleName}] ==========================================`);
    
    // Also log to stderr for better visibility
    console.error(`[${moduleName}] [ERROR] Received ${signal} signal at ${timestamp} (PID: ${pid}, PPID: ${ppid})`);
    console.error(`[${moduleName}] [ERROR] ${parentInfo}`);
}

// Graceful shutdown function
async function gracefulShutdown() {
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
        console.error('[Cluster] Shutdown error stack:', error.stack);
        process.exit(1);
    }
}

// Configuration options
const clusterOptions = {
    token: channelSecret,
    shardsPerClusters: 1,
    totalShards: 'auto',
    mode: 'process',
    respawn: false, // Disable auto respawn, manually controlled
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
    console.log(`[Cluster] Launched cluster #${shard.id}`);

    shard.on('ready', () => {
        const maxShard = Math.ceil(shard.manager.totalShards / 3);
        console.log(`[Cluster ${shard.id}] Ready with ${shard.manager.totalShards} total shards. Max shards per cluster: ${maxShard}`);

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
        // Add retry logic
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

    shard.on('disconnect', () => errorHandler('Disconnect'));
    shard.on('reconnecting', () => console.log(`[Cluster ${shard.id}] Reconnecting...`));
    shard.on('death', (process) => errorHandler('Death', `Exit code: ${process.exitCode}`));
    shard.on('error', (error) => errorHandler('Error', error));
});

// Improved message handling
manager.on("clusterCreate", cluster => {
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
            console.log('[Cluster] Initiating full cluster respawn');
            try {
                await manager.respawnAll({
                    clusterDelay: 1000 * 60 * 1, // 1 minutes between clusters
                    respawnDelay: 5000,          // 5 seconds
                    timeout: 1000 * 60 * 5       // 5 minutes timeout
                });
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

        console.log('[Schedule] Running daily Discord maintenance');
        try {
            await manager.respawnAll({
                clusterDelay: 1000 * 60,
                respawnDelay: 500,
                timeout: 1000 * 60 * 2
            });
        } catch (error) {
            console.error('[Schedule] Failed to perform maintenance:', error);
        }
    });
}

// Heartbeat management
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
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    await gracefulShutdown();
});

// Track process.exit calls
const originalExit = process.exit;
process.exit = function(code) {
    const timestamp = new Date().toISOString();
    const stack = new Error('Process exit stack trace').stack;
    const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';
    
    console.error('[Cluster] ========== PROCESS.EXIT CALLED ==========');
    console.error(`[Cluster] Exit Code: ${code}`);
    console.error(`[Cluster] Timestamp: ${timestamp}`);
    console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
    console.error(`[Cluster] Is Shutting Down: ${isShuttingDown}`);
    console.error(`[Cluster] Stack Trace:\n${stackLines}`);
    console.error('[Cluster] ==========================================');
    
    return originalExit.call(process, code);
};

// Track process exit event
process.on('exit', (code) => {
    console.error(`[Cluster] Process exiting with code: ${code} (PID: ${process.pid})`);
});

// Start clusters
manager.spawn({
    timeout: -1,
    delay: DELAY,
    amount: 'auto'
}).catch(error => {
    console.error('[Cluster] Failed to spawn clusters:', error);
    process.exit(1);
});