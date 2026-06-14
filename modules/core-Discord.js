/* eslint-disable n/no-process-exit */
"use strict";

if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}

const DELAY = 1000 * 10;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;
/** discord-hybrid-sharding respawn: allow slow startup (many shards / DB / login). */
const CLUSTER_RESPAWN_READY_MS = 120_000;

/** Parse positive int from env; invalid or missing uses fallback. */
function parsePositiveIntEnv(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return fallback;
    }

    const n = Number.parseInt(String(raw), 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Cluster IPC heartbeat (discord-hybrid-sharding HeartbeatManager on parent).
 * Too aggressive defaults cause false respawns under GC / DB / CPU spikes → mass Discord reconnects.
 * Tune: DISCORD_HEARTBEAT_INTERVAL_MS, DISCORD_HEARTBEAT_MAX_MISSED
 */
const HEARTBEAT_INTERVAL_MS = parsePositiveIntEnv('DISCORD_HEARTBEAT_INTERVAL_MS', 12_000);
const HEARTBEAT_MAX_MISSED = parsePositiveIntEnv('DISCORD_HEARTBEAT_MAX_MISSED', 24);
const EVENT_LOOP_MONITOR_INTERVAL_MS = Number.parseInt(process.env.DISCORD_EVENT_LOOP_MONITOR_INTERVAL_MS ?? '5000', 10);
const EVENT_LOOP_LAG_WARN_MS = Number.parseInt(process.env.DISCORD_EVENT_LOOP_LAG_WARN_MS ?? '1500', 10);
const rawEventLoopSummaryMs = process.env.DISCORD_EVENT_LOOP_SUMMARY_INTERVAL_MS;
const EVENT_LOOP_SUMMARY_INTERVAL_MS = rawEventLoopSummaryMs === '0'
    ? 0
    : parsePositiveIntEnv('DISCORD_EVENT_LOOP_SUMMARY_INTERVAL_MS', 600_000);
// DEBUG_LOG is a *separate* flag from the general DEBUG.
// Use DEBUG_LOG=true only when you need the heavy cluster lifecycle traces
// (full runtime + stacks for respawnAll, child_process.kill, detailed event loop summaries, and cluster debug messages).
// It is intentionally more verbose and should stay off in normal operation.
const DEBUG_LOG = process.env.DEBUG_LOG === 'true';
const HEARTBEAT_DEBUG_LOG = DEBUG_LOG || process.env.DISCORD_HEARTBEAT_DEBUG === 'true';
/** Always log hybrid-sharding heartbeat-miss / respawn attempts unless set to false. */
const HEARTBEAT_MISSING_LOG = String(process.env.DISCORD_HEARTBEAT_MISSING_LOG ?? 'true').trim().toLowerCase() !== 'false';

const agenda = require('../modules/schedule')?.agenda;
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const childProcess = require('node:child_process');
const { AsyncLocalStorage } = require('node:async_hooks');
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
require("./ds-deploy-commands");
const clusterOptions = {
    token: channelSecret,
    shardsPerClusters: 5,
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
    },
    execArgv: [
        "--optimize-for-size",
        "--gc-interval=100"
    ],
};
// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;
let eventLoopMonitorTimer = null;
let eventLoopLagLastMs = 0;
let eventLoopLagMaxMs = 0;
let eventLoopLagWarnCount = 0;
const clusterLastState = new Map();

function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch (error) {
        return `{"serializationError":"${error && error.message ? error.message : 'unknown'}"}`;
    }
}

function getRuntimeMeta() {
    const uptimeSeconds = Number(process.uptime().toFixed(2));
    return {
        pid: process.pid,
        ppid: process.ppid,
        uptimeSeconds,
        memory: process.memoryUsage()
    };
}

function stackWithoutHeader(rawStack) {
    if (!rawStack) return 'No stack trace available';
    return rawStack.split('\n').slice(2).join('\n');
}

function getCompactMemoryMeta() {
    const memory = process.memoryUsage();
    return {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external
    };
}

function updateClusterLastState(clusterId, state, detail = {}) {
    clusterLastState.set(Number(clusterId), {
        state,
        at: new Date().toISOString(),
        detail
    });
}

function getClusterLastState(clusterId) {
    return clusterLastState.get(Number(clusterId)) || null;
}

function startEventLoopMonitor() {
    if (eventLoopMonitorTimer) return;

    let expectedAt = Date.now() + EVENT_LOOP_MONITOR_INTERVAL_MS;
    let maxLagSinceSummary = 0;
    let lagWarnSinceSummary = 0;

    eventLoopMonitorTimer = setInterval(() => {
        const now = Date.now();
        const lagMs = Math.max(0, now - expectedAt);
        expectedAt = now + EVENT_LOOP_MONITOR_INTERVAL_MS;

        eventLoopLagLastMs = lagMs;
        if (lagMs > eventLoopLagMaxMs) {
            eventLoopLagMaxMs = lagMs;
        }

        if (lagMs > maxLagSinceSummary) {
            maxLagSinceSummary = lagMs;
        }

        if (!isShuttingDown && lagMs >= EVENT_LOOP_LAG_WARN_MS) {
            eventLoopLagWarnCount += 1;
            lagWarnSinceSummary += 1;
            const base = {
                lagMs,
                warnThresholdMs: EVENT_LOOP_LAG_WARN_MS,
                monitorIntervalMs: EVENT_LOOP_MONITOR_INTERVAL_MS
            };
            console.warn('[Perf] Event loop lag spike detected', DEBUG_LOG ? { ...base, runtime: getRuntimeMeta() } : base);
        }
    }, EVENT_LOOP_MONITOR_INTERVAL_MS);

    if (typeof eventLoopMonitorTimer.unref === 'function') {
        eventLoopMonitorTimer.unref();
    }

    console.log('[Perf] Event loop monitor started', {
        monitorIntervalMs: EVENT_LOOP_MONITOR_INTERVAL_MS,
        warnThresholdMs: EVENT_LOOP_LAG_WARN_MS,
        summaryIntervalMs: EVENT_LOOP_SUMMARY_INTERVAL_MS
    });

    if (EVENT_LOOP_SUMMARY_INTERVAL_MS > 0) {
        setInterval(() => {
            if (isShuttingDown) {
                return;
            }

            const summaryAnomaly =
                lagWarnSinceSummary > 0 ||
                maxLagSinceSummary >= EVENT_LOOP_LAG_WARN_MS;

            if (summaryAnomaly) {
                const summary = {
                    clusterHeartbeat: {
                        intervalMs: HEARTBEAT_INTERVAL_MS,
                        maxMissedHeartbeats: HEARTBEAT_MAX_MISSED
                    },
                    parentEventLoop: {
                        lastLagMs: eventLoopLagLastMs,
                        maxLagMsInWindow: maxLagSinceSummary,
                        lagWarningsInWindow: lagWarnSinceSummary,
                        warnThresholdMs: EVENT_LOOP_LAG_WARN_MS,
                        windowMs: EVENT_LOOP_SUMMARY_INTERVAL_MS
                    }
                };
                if (DEBUG_LOG) {
                    summary.runtime = getRuntimeMeta();
                }
                console.warn('[Perf] Event loop summary (ClusterManager parent)', summary);
            }

            maxLagSinceSummary = 0;
            lagWarnSinceSummary = 0;
        }, EVENT_LOOP_SUMMARY_INTERVAL_MS);
    }
}

let lifecycleTraceSeq = 0;
const lifecycleTraceStore = new AsyncLocalStorage();

function createTraceId(prefix = 'trace') {
    lifecycleTraceSeq += 1;
    return `${prefix}-${Date.now()}-${lifecycleTraceSeq}`;
}

function traceLifecycle(event, detail = {}) {
    if (!DEBUG_LOG) return;
    const traceContext = lifecycleTraceStore.getStore();
    const traceId = detail.traceId || traceContext?.traceId || null;
    console.error(`[ClusterTrace] ${event}`, {
        runtime: getRuntimeMeta(),
        traceId,
        detail
    });
}

function isRoutineIpcMessage(message) {
    // discord-hybrid-sharding routine telemetry payload
    // _type 22 + shardData is high-frequency and usually not actionable.
    return Boolean(
        message &&
        message._type === 22 &&
        message.data &&
        Number.isInteger(message.data.clusterId) &&
        Array.isArray(message.data.shardData)
    );
}

async function withLifecycleTrace(prefix, detail, operation) {
    const traceId = createTraceId(prefix);
    const context = { traceId };
    traceLifecycle(`${prefix}_start`, { traceId, ...detail });
    return lifecycleTraceStore.run(context, async () => {
        try {
            const result = await operation(traceId);
            traceLifecycle(`${prefix}_success`, { traceId, ...detail });
            return result;
        } catch (error) {
            traceLifecycle(`${prefix}_error`, {
                traceId,
                ...detail,
                error: error?.message || String(error)
            });
            throw error;
        }
    });
}

function installChildKillTrace() {
    if (installChildKillTrace.installed) return;
    installChildKillTrace.installed = true;

    if (!DEBUG_LOG) return; // only patch and trace kills when detailed debug is enabled

    const originalKill = childProcess.ChildProcess.prototype.kill;
    childProcess.ChildProcess.prototype.kill = function patchedKill(signal, ...rest) {
        const stack = stackWithoutHeader(new Error('ChildProcess.kill trace').stack);
        const traceContext = lifecycleTraceStore.getStore();
        traceLifecycle('child_process.kill_called', {
            traceId: traceContext?.traceId || null,
            targetPid: this.pid,
            signal: signal || 'SIGTERM',
            connected: this.connected,
            killed: this.killed,
            spawnfile: this.spawnfile,
            spawnargs: this.spawnargs,
            stack
        });
        return originalKill.call(this, signal, ...rest);
    };
}

function logClusterShutdownTrigger({ signal = 'unknown', source = 'unknown', detail = null } = {}) {
    const timestamp = new Date().toISOString();
    const stack = new Error('Cluster shutdown trigger stack').stack;
    const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';
    const detailText = detail ? safeStringify(detail) : '{}';

    console.error('[Cluster] ========== SHUTDOWN TRIGGERED ==========');
    console.error(`[Cluster] Timestamp: ${timestamp}`);
    console.error(`[Cluster] Signal: ${signal}`);
    console.error(`[Cluster] Source: ${source}`);
    console.error(`[Cluster] Detail: ${detailText}`);
    console.error(`[Cluster] PID: ${process.pid}, PPID: ${process.ppid}`);
    console.error(`[Cluster] Stack Trace:\n${stackLines}`);
    console.error('[Cluster] =======================================');
}

// Graceful shutdown function (simplified as per attachment)
async function gracefulShutdown({ signal = 'unknown', source = 'unknown', detail = null } = {}) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    const detailText = detail ? safeStringify(detail) : '{}';
    console.log(`[Cluster] Starting graceful shutdown (signal: ${signal}, source: ${source}, detail: ${detailText})...`);

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


const manager = new ClusterManager('./modules/discord_bot.js', clusterOptions);
if (DEBUG_LOG) {
    installChildKillTrace();
}
startEventLoopMonitor();
traceLifecycle('manager_initialized', {
    clusterOptions: {
        shardsPerClusters: clusterOptions.shardsPerClusters,
        totalShards: clusterOptions.totalShards,
        mode: clusterOptions.mode,
        restarts: clusterOptions.restarts,
        retry: clusterOptions.retry,
        heartbeat: {
            intervalMs: HEARTBEAT_INTERVAL_MS,
            maxMissedHeartbeats: HEARTBEAT_MAX_MISSED
        }
    }
});

/** clusterId from discord-hybrid-sharding debug is undefined for manager-level messages. */
function formatClusterDebugId(clusterId) {
    if (clusterId == null) return 'manager';
    const id = Number(clusterId);
    return Number.isFinite(id) ? id : clusterId;
}

manager.on('debug', (message, clusterId) => {
    const messageStr = typeof message === 'string' ? message : (message == null ? '' : String(message));
    if (HEARTBEAT_MISSING_LOG && messageStr.includes('[Heartbeat_MISSING]')) {
        const id = clusterId == null ? null : Number(clusterId);
        console.warn('[Cluster][Heartbeat_MISSING]', {
            message: messageStr,
            clusterId: formatClusterDebugId(clusterId),
            clusterLastState: Number.isFinite(id) ? getClusterLastState(id) : null,
            parentEventLoop: {
                lastLagMs: eventLoopLagLastMs,
                maxLagMsSinceProcessStart: eventLoopLagMaxMs,
                lagWarningsSinceProcessStart: eventLoopLagWarnCount
            },
            heartbeat: {
                intervalMs: HEARTBEAT_INTERVAL_MS,
                maxMissedHeartbeats: HEARTBEAT_MAX_MISSED
            },
            runtime: getRuntimeMeta()
        });
    }

    if (!HEARTBEAT_DEBUG_LOG) {
        return;
    }

    console.log('[Cluster Debug]', {
        message: messageStr,
        clusterId: formatClusterDebugId(clusterId),
        runtime: getRuntimeMeta()
    });
});

const originalRespawnAll = manager.respawnAll.bind(manager);
manager.respawnAll = async (...args) => {
    if (!DEBUG_LOG) {
        return originalRespawnAll(...args);
    }
    return withLifecycleTrace('respawnAll', {
        args,
        stack: stackWithoutHeader(new Error('manager.respawnAll caller').stack)
    }, async () => {
        traceLifecycle('manager_respawnAll_called', {
            args,
            stack: stackWithoutHeader(new Error('manager.respawnAll caller').stack)
        });
        return originalRespawnAll(...args);
    });
};

// Improved event handling
let heartbeatStarted = false;
manager.on('clusterCreate', shard => {
    console.log(`[Cluster ${shard.id}] Created`, getRuntimeMeta());
    updateClusterLastState(shard.id, 'created', { pid: shard.process?.pid || null });

    shard.on('ready', () => {
        // Get cluster configuration values
        const totalShards = shard.manager.totalShards;
        const totalClusters = shard.manager.totalClusters;
        const shardsPerCluster = shard.manager.shardsPerClusters ||
            (totalClusters > 0 ? Math.ceil(totalShards / totalClusters) : 3);

        console.log(`[Cluster ${shard.id}] Ready with ${totalShards} total shards. Max cluster: ${totalClusters}. Per cluster: ${shardsPerCluster}`);
        updateClusterLastState(shard.id, 'ready', {
            totalShards,
            totalClusters,
            shardsPerCluster
        });

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

        console.error(`[Cluster ${shard.id}] ${event}:`, error, getRuntimeMeta());
        // Add retry logic (simplified as per attachment)
        if (event === 'death') {
            setTimeout(async () => {
                if (!isShuttingDown) {
                    console.log(`[Cluster ${shard.id}] Attempting to respawn...`, getRuntimeMeta());
                    try {
                        await withLifecycleTrace('clusterRespawn', {
                            clusterId: shard.id,
                            source: 'error_handler_death',
                            stack: stackWithoutHeader(new Error('cluster.respawn caller').stack)
                        }, async () => {
                            traceLifecycle('cluster_respawn_called', {
                                clusterId: shard.id,
                                source: 'error_handler_death',
                                stack: stackWithoutHeader(new Error('cluster.respawn caller').stack)
                            });
                            await shard.respawn({ timeout: CLUSTER_RESPAWN_READY_MS });
                        });
                    } catch (error_) {
                        console.error(`[Cluster ${shard.id}] Failed to respawn:`, error_, getRuntimeMeta());
                    }
                }
            }, RETRY_DELAY);
        }
    };

    shard.on('disconnect', () => {
        updateClusterLastState(shard.id, 'disconnect');
        errorHandler('Disconnect', {
            reason: 'Cluster disconnect event',
            runtime: getRuntimeMeta()
        });
    });

    shard.on('reconnecting', () => {
        updateClusterLastState(shard.id, 'reconnecting');
        console.warn(`[Cluster ${shard.id}] Reconnecting...`, getRuntimeMeta());
    });

    shard.on('death', (childProcess) => {
        updateClusterLastState(shard.id, 'death', {
            exitCode: childProcess.exitCode,
            signalCode: childProcess.signalCode,
            killed: childProcess.killed
        });
        errorHandler('Death', {
            message: 'Cluster child process died',
            exitCode: childProcess.exitCode,
            signalCode: childProcess.signalCode,
            killed: childProcess.killed,
            runtime: getRuntimeMeta()
        });
    });

    shard.on('error', (error) => {
        console.error(`[Cluster] Cluster ${shard.id} error:`, error.message || error, getRuntimeMeta());
        if (error.stack) console.error(`[Cluster] Stack trace:\n${error.stack}`);
        errorHandler('Error', error);
    });
});

// Improved message handling
manager.on("clusterCreate", cluster => {
    // Handle IPC process errors (like EPIPE)
    if (cluster.process) {
        cluster.process.on('exit', (code, signal) => {
            console.warn(`[Cluster ${cluster.id}] Child process exit`, {
                code,
                signal,
                runtime: getRuntimeMeta()
            });
        });

        cluster.process.on('error', (error) => {
            if (error.code === 'EPIPE') {
                console.warn(`[Cluster ${cluster.id}] IPC EPIPE error (child process likely dead)`, getRuntimeMeta());
            } else {
                console.error(`[Cluster ${cluster.id}] Child process error:`, error, getRuntimeMeta());
            }
        });
    }

    cluster.on("message", async message => {
        // Don't handle respawn messages if shutting down
        if (isShuttingDown) return;
        const verboseIpc = process.env.LOG_VERBOSE_IPC === 'true';
        const routineIpc = isRoutineIpcMessage(message);
        const actionableIpc = message?.respawn === true || message?.respawnall === true;
        const shouldLogIpc = verboseIpc || actionableIpc || !routineIpc;

        if (shouldLogIpc) {
            console.log(`[Cluster ${cluster.id}] IPC message received`, {
                runtime: getRuntimeMeta(),
                message
            });
        }

        if (message.respawn === true && message.id !== null && message.id !== undefined) {
            const meta = message.meta || {};
            console.log(`[Cluster] Respawning cluster ${message.id} (source: ${meta.source || 'cluster_ipc'}, detail: ${safeStringify(meta)})`);

            try {
                const targetCluster = manager.clusters.get(Number(message.id));
                if (targetCluster) {
                    await withLifecycleTrace('clusterRespawn', {
                        clusterId: Number(message.id),
                        source: 'ipc_message_respawn',
                        meta,
                        stack: stackWithoutHeader(new Error('cluster.respawn via IPC caller').stack)
                    }, async () => {
                        traceLifecycle('cluster_respawn_called', {
                            clusterId: Number(message.id),
                            source: 'ipc_message_respawn',
                            meta,
                            stack: stackWithoutHeader(new Error('cluster.respawn via IPC caller').stack)
                        });
                        await targetCluster.respawn({
                            delay: 1000,
                            timeout: CLUSTER_RESPAWN_READY_MS
                        });
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
            const meta = message.meta || {};
            console.log(`[Cluster] Respawning all clusters (source: ${meta.source || 'cluster_ipc'}, detail: ${safeStringify(meta)})`);

            try {
                await manager.respawnAll({
                    // Faster but still safe rollout for manual respawnall.
                    clusterDelay: 1000 * 15,     // 15 seconds between clusters
                    respawnDelay: 1000,          // 1 second between shard respawns
                    timeout: 1000 * 60 * 3       // 3 minutes timeout per cluster
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
                clusterDelay: 1000 * 15,
                respawnDelay: 1000,
                timeout: 1000 * 60 * 3
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
        interval: HEARTBEAT_INTERVAL_MS,
        // Keep heartbeat cadence, but allow short stalls (GC/IO spikes) without false respawn.
        maxMissedHeartbeats: HEARTBEAT_MAX_MISSED,
        // discord-hybrid-sharding HeartbeatManager does not call these before respawn; kept for API compatibility / future library updates.
        onMissedHeartbeat: (cluster) => {
            if (!isShuttingDown) {
                updateClusterLastState(cluster.id, 'missed_heartbeat');
                console.warn(`[Heartbeat] Cluster ${cluster.id} missed a heartbeat`, {
                    heartbeat: {
                        intervalMs: HEARTBEAT_INTERVAL_MS,
                        maxMissedHeartbeats: HEARTBEAT_MAX_MISSED
                    },
                    eventLoop: {
                        lastLagMs: eventLoopLagLastMs,
                        maxLagMs: eventLoopLagMaxMs,
                        lagWarnCount: eventLoopLagWarnCount
                    },
                    clusterLastState: getClusterLastState(cluster.id),
                    runtime: {
                        pid: process.pid,
                        uptimeSeconds: Number(process.uptime().toFixed(2)),
                        memory: getCompactMemoryMeta()
                    }
                });
            }
        },
        onClusterReady: (cluster) => {
            updateClusterLastState(cluster.id, 'heartbeat_ready');
            console.log(`[Heartbeat] Cluster ${cluster.id} is now ready and sending heartbeats`);
        }
    })
);

console.log('[Cluster] Hybrid-sharding IPC heartbeat (parent process)', {
    intervalMs: HEARTBEAT_INTERVAL_MS,
    maxMissedHeartbeats: HEARTBEAT_MAX_MISSED,
    env: {
        DISCORD_HEARTBEAT_INTERVAL_MS: process.env.DISCORD_HEARTBEAT_INTERVAL_MS ?? '(default)',
        DISCORD_HEARTBEAT_MAX_MISSED: process.env.DISCORD_HEARTBEAT_MAX_MISSED ?? '(default)'
    },
    note: 'Library respawns a cluster child when heartbeat acks pile up; worker lag logs: [Perf][DiscordClusterWorker].'
});

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
    logClusterShutdownTrigger({
        signal: 'internal',
        source: 'module_shutdown',
        detail: { handler: 'shutdown() export' }
    });
    return gracefulShutdown({
        signal: 'internal',
        source: 'module_shutdown',
        detail: { handler: 'shutdown() export' }
    }); // Simplified as per attachment
}

// Process signal handling (simplified as per attachment)
process.on('SIGTERM', async () => {
    console.log('[Cluster] Received SIGTERM signal');
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => {
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    logClusterShutdownTrigger({
        signal: 'SIGTERM',
        source: 'process_signal',
        detail: { handler: 'process.on(SIGTERM)' }
    });
    await gracefulShutdown({
        signal: 'SIGTERM',
        source: 'process_signal',
        detail: { handler: 'process.on(SIGTERM)' }
    });
});

process.on('SIGINT', async () => {
    console.log('[Cluster] Received SIGINT signal');
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => {
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    logClusterShutdownTrigger({
        signal: 'SIGINT',
        source: 'process_signal',
        detail: { handler: 'process.on(SIGINT)' }
    });
    await gracefulShutdown({
        signal: 'SIGINT',
        source: 'process_signal',
        detail: { handler: 'process.on(SIGINT)' }
    });
});

// Export functions for use when required as module
module.exports = {
    shutdown,
    manager
};