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
                const exitTimestamp = new Date().toISOString();
                const exitStack = new Error('Process exit stack trace').stack;
                const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
                console.error('[Cluster] ========== PROCESS.EXIT(0) CALLED (BROADCAST EVAL) ==========');
                console.error(`[Cluster] Timestamp: ${exitTimestamp}`);
                console.error(`[Cluster] Exit Code: 0 (Normal shutdown after broadcastEval)`);
                console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
                console.error(`[Cluster] Stack Trace:\n${exitStackLines}`);
                console.error('[Cluster] ==========================================');
                process.exit(0);
            }, { timeout: 15_000 });
        } catch (error) {
            // Ignore IPC channel errors during shutdown (expected when clusters are already closed)
            const errorCode = error.code || (error.message && error.message.includes('EPIPE') ? 'EPIPE' : null);
            const errorMessage = error.message || String(error);
            if (errorCode === 'EPIPE' || errorCode === 'ERR_IPC_CHANNEL_CLOSED' || 
                errorMessage.includes('EPIPE') || errorMessage.includes('Channel closed')) {
                console.log('[Cluster] Ignoring IPC channel errors during shutdown (expected behavior)');
            } else {
                console.warn('[Cluster] broadcastEval during shutdown encountered an error:', error);
            }
        }

        console.log('[Cluster] Graceful shutdown completed');
        const exitTimestamp = new Date().toISOString();
        const exitStack = new Error('Process exit stack trace').stack;
        const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
        console.error('[Cluster] ========== PROCESS.EXIT(0) CALLED ==========');
        console.error(`[Cluster] Timestamp: ${exitTimestamp}`);
        console.error(`[Cluster] Exit Code: 0 (Normal shutdown)`);
        console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error(`[Cluster] Stack Trace:\n${exitStackLines}`);
        console.error('[Cluster] ==========================================');
        process.exit(0);
    } catch (error) {
        console.error('[Cluster] Error during shutdown:', error);
        console.error('[Cluster] Shutdown error stack:', error.stack);
        const exitTimestamp = new Date().toISOString();
        const exitStack = new Error('Process exit stack trace').stack;
        const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
        console.error('[Cluster] ========== PROCESS.EXIT(1) CALLED (ERROR) ==========');
        console.error(`[Cluster] Timestamp: ${exitTimestamp}`);
        console.error(`[Cluster] Exit Code: 1 (Error during shutdown)`);
        console.error(`[Cluster] Error: ${error.message}`);
        console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error(`[Cluster] Stack Trace:\n${exitStackLines}`);
        console.error('[Cluster] ==========================================');
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
    const timestamp = new Date().toISOString();
    console.error('[Cluster Manager] ========== CLUSTER CREATED ==========');
    console.error(`[Cluster Manager] Timestamp: ${timestamp}`);
    console.error(`[Cluster Manager] Cluster ID: ${shard.id}`);
    console.error(`[Cluster Manager] Total Clusters: ${shard.manager.clusters.size}/${shard.manager.totalClusters}`);
    console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
    console.error('[Cluster Manager] ==========================================');
    console.log(`[Cluster] Launched cluster #${shard.id}`);

    shard.on('ready', () => {
        const timestamp = new Date().toISOString();
        const maxShard = Math.ceil(shard.manager.totalShards / 3);
        console.error('[Cluster Manager] ========== CLUSTER READY ==========');
        console.error(`[Cluster Manager] Timestamp: ${timestamp}`);
        console.error(`[Cluster Manager] Cluster ID: ${shard.id}`);
        console.error(`[Cluster Manager] Total Shards: ${shard.manager.totalShards}`);
        console.error(`[Cluster Manager] Max Shards per Cluster: ${maxShard}`);
        console.error(`[Cluster Manager] Ready Clusters: ${[...shard.manager.clusters.values()].filter(c => c.ready).length}/${shard.manager.clusters.size}`);
        console.error(`[Cluster Manager] Total Clusters: ${shard.manager.clusters.size}/${shard.manager.totalClusters}`);
        console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error('[Cluster Manager] ==========================================');
        console.log(`[Cluster ${shard.id}] Ready with ${shard.manager.totalShards} total shards. Max shards per cluster: ${maxShard}`);

        if (heartbeatStarted) {
            console.error(`[Cluster Manager] Heartbeat already started, skipping for cluster ${shard.id}`);
            return;
        }

        // Ensure all clusters have been created before checking if they are ready
        if (shard.manager.clusters.size !== shard.manager.totalClusters) {
            console.error(`[Cluster Manager] Waiting for all clusters to be created. Current: ${shard.manager.clusters.size}, Expected: ${shard.manager.totalClusters}`);
            return;
        }

        const allReady = [...shard.manager.clusters.values()].every(c => c.ready);

        if (allReady) {
            heartbeatStarted = true;
            console.error('[Cluster Manager] ========== ALL CLUSTERS READY ==========');
            console.error(`[Cluster Manager] Timestamp: ${new Date().toISOString()}`);
            console.error(`[Cluster Manager] Broadcasting startHeartbeat message`);
            console.error('[Cluster Manager] ==========================================');
            console.log('[Cluster] All clusters are ready. Broadcasting startHeartbeat message.');
            shard.manager.broadcast({ type: 'startHeartbeat' });
        } else {
            const readyCount = [...shard.manager.clusters.values()].filter(c => c.ready).length;
            console.error(`[Cluster Manager] Not all clusters ready yet. Ready: ${readyCount}/${shard.manager.clusters.size}`);
        }
    });

    const errorHandler = (event, error) => {
        // Don't handle errors if shutting down
        if (isShuttingDown) return;

        const timestamp = new Date().toISOString();
        const stack = new Error('Error handler stack trace').stack;
        const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';
        
        console.error(`[Cluster ${shard.id}] ${event}:`, error);
        console.error(`[Cluster ${shard.id}] Error Handler - Timestamp: ${timestamp}`);
        console.error(`[Cluster ${shard.id}] Error Handler - PID: ${process.pid}, PPID: ${process.ppid}`);
        
        // Add retry logic
        if (event === 'death') {
            const exitCode = error && typeof error === 'string' ? error.match(/Exit code: (\d+)/)?.[1] : 'unknown';
            console.error('[Cluster Death] ========== CLUSTER DEATH RESPAWN TRIGGERED ==========');
            console.error(`[Cluster Death] Timestamp: ${timestamp}`);
            console.error(`[Cluster Death] Cluster ID: ${shard.id}`);
            console.error(`[Cluster Death] Exit Code: ${exitCode}`);
            console.error(`[Cluster Death] Error: ${error}`);
            console.error(`[Cluster Death] PID: ${process.pid}, PPID: ${process.ppid}`);
            console.error(`[Cluster Death] Stack Trace:\n${stackLines}`);
            console.error('[Cluster Death] ==========================================');
            
            setTimeout(() => {
                if (!isShuttingDown) {
                    console.error(`[Cluster Death] Attempting to respawn cluster ${shard.id} after ${RETRY_DELAY}ms delay`);
                    try {
                        shard.respawn({ timeout: 60_000 });
                        console.error(`[Cluster Death] Respawn command sent for cluster ${shard.id}`);
                    } catch (error_) {
                        console.error('[Cluster Death] ========== CLUSTER DEATH RESPAWN ERROR ==========');
                        console.error(`[Cluster Death] Error Name: ${error_ && error_.name}`);
                        console.error(`[Cluster Death] Error Message: ${error_ && error_.message}`);
                        console.error(`[Cluster Death] Stack: ${error_ && error_.stack}`);
                        console.error('[Cluster Death] ==========================================');
                    }
                } else {
                    console.error(`[Cluster Death] Shutdown in progress, skipping respawn for cluster ${shard.id}`);
                }
            }, RETRY_DELAY);
        }
    };

    shard.on('disconnect', () => {
        const timestamp = new Date().toISOString();
        console.error('[Cluster Manager] ========== CLUSTER DISCONNECT ==========');
        console.error(`[Cluster Manager] Timestamp: ${timestamp}`);
        console.error(`[Cluster Manager] Cluster ID: ${shard.id}`);
        console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error('[Cluster Manager] ==========================================');
        errorHandler('Disconnect');
    });
    
    shard.on('reconnecting', () => {
        const timestamp = new Date().toISOString();
        console.error('[Cluster Manager] ========== CLUSTER RECONNECTING ==========');
        console.error(`[Cluster Manager] Timestamp: ${timestamp}`);
        console.error(`[Cluster Manager] Cluster ID: ${shard.id}`);
        console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error('[Cluster Manager] ==========================================');
        console.log(`[Cluster ${shard.id}] Reconnecting...`);
    });
    
    shard.on('death', (process) => {
        const timestamp = new Date().toISOString();
        console.error('[Cluster Manager] ========== CLUSTER DEATH EVENT ==========');
        console.error(`[Cluster Manager] Timestamp: ${timestamp}`);
        console.error(`[Cluster Manager] Cluster ID: ${shard.id}`);
        console.error(`[Cluster Manager] Exit Code: ${process.exitCode}`);
        console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error('[Cluster Manager] ==========================================');
        errorHandler('Death', `Exit code: ${process.exitCode}`);
    });
    
    shard.on('error', (error) => {
        const timestamp = new Date().toISOString();
        console.error('[Cluster Manager] ========== CLUSTER ERROR EVENT ==========');
        console.error(`[Cluster Manager] Timestamp: ${timestamp}`);
        console.error(`[Cluster Manager] Cluster ID: ${shard.id}`);
        console.error(`[Cluster Manager] Error: ${error.message || error}`);
        console.error(`[Cluster Manager] Error Stack: ${error.stack}`);
        console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
        console.error('[Cluster Manager] ==========================================');
        errorHandler('Error', error);
    });
});

// Improved message handling
manager.on("clusterCreate", cluster => {
    cluster.on("message", async message => {
        // Don't handle respawn messages if shutting down
        if (isShuttingDown) return;

        if (message.respawn === true && message.id !== null && message.id !== undefined) {
            const timestamp = new Date().toISOString();
            const stack = new Error('Respawn message stack trace').stack;
            const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';
            
            console.error('[Cluster Message] ========== RESPAWN MESSAGE RECEIVED ==========');
            console.error(`[Cluster Message] Timestamp: ${timestamp}`);
            console.error(`[Cluster Message] Target Cluster ID: ${message.id}`);
            console.error(`[Cluster Message] PID: ${process.pid}, PPID: ${process.ppid}`);
            console.error(`[Cluster Message] Stack Trace:\n${stackLines}`);
            console.error('[Cluster Message] ==========================================');
            console.log(`[Cluster] Respawning cluster ${message.id}`);
            
            try {
                const targetCluster = manager.clusters.get(Number(message.id));
                if (targetCluster) {
                    console.error(`[Cluster Message] Found target cluster ${message.id}, initiating respawn`);
                    await targetCluster.respawn({
                        delay: 1000,
                        timeout: 60_000
                    });
                    console.error(`[Cluster Message] Successfully respawned cluster ${message.id}`);
                    console.log(`[Cluster] Successfully respawned cluster ${message.id}`);
                } else {
                    console.error(`[Cluster Message] Cluster ${message.id} not found in manager.clusters`);
                    console.error(`[Cluster Message] Available clusters: ${[...manager.clusters.keys()].join(', ')}`);
                    console.error(`[Cluster] Cluster ${message.id} not found`);
                }
            } catch (error) {
                console.error('[Cluster Message] ========== RESPAWN MESSAGE ERROR ==========');
                console.error(`[Cluster Message] Error Name: ${error && error.name}`);
                console.error(`[Cluster Message] Error Message: ${error && error.message}`);
                console.error(`[Cluster Message] Stack: ${error && error.stack}`);
                console.error('[Cluster Message] ==========================================');
                console.error(`[Cluster] Failed to respawn cluster ${message.id}:`, error);
            }
            return;
        }

        if (message.respawnall === true) {
            const timestamp = new Date().toISOString();
            const stack = new Error('RespawnAll message stack trace').stack;
            const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';
            
            console.error('[Cluster Message] ========== RESPAWN ALL MESSAGE RECEIVED ==========');
            console.error(`[Cluster Message] Timestamp: ${timestamp}`);
            console.error(`[Cluster Message] Total Clusters: ${manager.clusters.size}`);
            console.error(`[Cluster Message] PID: ${process.pid}, PPID: ${process.ppid}`);
            console.error(`[Cluster Message] Stack Trace:\n${stackLines}`);
            console.error('[Cluster Message] ==========================================');
            console.log('[Cluster] Initiating full cluster respawn');
            
            try {
                await manager.respawnAll({
                    clusterDelay: 1000 * 60 * 1, // 1 minutes between clusters
                    respawnDelay: 5000,          // 5 seconds
                    timeout: 1000 * 60 * 5       // 5 minutes timeout
                });
                console.error('[Cluster Message] Successfully initiated respawnAll for all clusters');
            } catch (error) {
                console.error('[Cluster Message] ========== RESPAWN ALL ERROR ==========');
                console.error(`[Cluster Message] Error Name: ${error && error.name}`);
                console.error(`[Cluster Message] Error Message: ${error && error.message}`);
                console.error(`[Cluster Message] Stack: ${error && error.stack}`);
                console.error('[Cluster Message] ==========================================');
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
console.error('[Cluster Manager] ========== STARTING CLUSTER SPAWN ==========');
console.error(`[Cluster Manager] Timestamp: ${new Date().toISOString()}`);
console.error(`[Cluster Manager] PID: ${process.pid}, PPID: ${process.ppid}`);
console.error(`[Cluster Manager] Spawn Options: timeout=-1, delay=${DELAY}ms, amount=auto`);
console.error('[Cluster Manager] ==========================================');

manager.spawn({
    timeout: -1,
    delay: DELAY,
    amount: 'auto'
}).then(() => {
    console.error('[Cluster Manager] ========== CLUSTER SPAWN INITIATED ==========');
    console.error(`[Cluster Manager] Timestamp: ${new Date().toISOString()}`);
    console.error(`[Cluster Manager] Total Clusters to spawn: ${manager.totalClusters}`);
    console.error(`[Cluster Manager] Total Shards: ${manager.totalShards}`);
    console.error('[Cluster Manager] ==========================================');
}).catch(error => {
    const exitTimestamp = new Date().toISOString();
    const exitStack = new Error('Spawn error stack trace').stack;
    const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
    console.error('[Cluster] ========== PROCESS.EXIT(1) CALLED (SPAWN FAILED) ==========');
    console.error(`[Cluster] Timestamp: ${exitTimestamp}`);
    console.error(`[Cluster] Exit Code: 1 (Failed to spawn clusters)`);
    console.error(`[Cluster] Error: ${error.message}`);
    console.error(`[Cluster] Error Stack: ${error.stack}`);
    console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
    console.error(`[Cluster] Stack Trace:\n${exitStackLines}`);
    console.error('[Cluster] ==========================================');
    console.error('[Cluster] Failed to spawn clusters:', error);
    process.exit(1);
});