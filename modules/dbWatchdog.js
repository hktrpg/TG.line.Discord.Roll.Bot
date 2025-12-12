"use strict";
const path = require('path');
const winston = require('winston');
const { format } = winston;
const schema = require('./schema.js');
const timerManager = require('./timer-manager');
const os = require('os');
const fs = require('fs').promises;

// Constant configuration
const CONFIG = {
    MAX_ERR_RETRY: 3,
    RETRY_TIME: 15 * 1000,
    MONGOD_CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutes
    MAX_ERR_RESPAWN: 10,
    LOG_FILE_SIZE: 5 * 1024 * 1024,
    MAX_LOG_FILES: 5,
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: 60 * 1000, // 1 minute
    CONNECTION_RETRY_ATTEMPTS: 5,
    CONNECTION_RETRY_DELAY: 5000, // 5 seconds
    HEALTH_CHECK_INTERVAL: 30 * 1000, // 30 seconds
    // System resource monitoring thresholds
    MEMORY_WARNING_THRESHOLD: 85, // Warn when memory usage > 85%
    MEMORY_CRITICAL_THRESHOLD: 95, // Critical when memory usage > 95%
    DISK_WARNING_THRESHOLD: 90, // Warn when disk usage > 90%
    DISK_CRITICAL_THRESHOLD: 95, // Critical when disk usage > 95%
    RESOURCE_CHECK_INTERVAL: 60 * 1000 // Check system resources every minute
};

// Create custom logger
const createLogger = () => {
    const severityLevelOnly = format(info => {
        info.severityLevel = info.level;
        delete info.level;
        delete info.service;
        delete info.severityLevel;
        return info;
    });

    return winston.createLogger({
        level: 'warn', // Increase log level, only record warnings and errors
        format: format.combine(
            severityLevelOnly(),
            format.json()
        ),
        transports: [
            // Remove Console transport to reduce console output
            new winston.transports.File({
                filename: path.join(__dirname, '..', 'log', 'hktrpg-mongod.log'),
                level: 'warn', // Only record warnings and errors to file
                maxFiles: CONFIG.MAX_LOG_FILES,
                maxsize: CONFIG.LOG_FILE_SIZE
            })
        ]
    });
};

// Circuit breaker class - prevent cascading failures
class CircuitBreaker {
    constructor(failureThreshold = CONFIG.CIRCUIT_BREAKER_FAILURE_THRESHOLD, recoveryTimeout = CONFIG.CIRCUIT_BREAKER_RECOVERY_TIMEOUT) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttemptTime = 0;
    }

    async execute(operation) {
        const now = Date.now();

        if (this.state === 'OPEN') {
            if (now - this.lastFailureTime > this.recoveryTimeout) {
                this.state = 'HALF_OPEN';
                console.log('[CircuitBreaker] Enter HALF_OPEN state, test recovery');
            } else {
                throw new Error(`Circuit breaker is OPEN - Wait ${Math.ceil((this.recoveryTimeout - (now - this.lastFailureTime)) / 1000)} seconds before retry`);
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
        console.log('[CircuitBreaker] State changed to CLOSED');
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.recoveryTimeout;
            console.log(`[CircuitBreaker] State changed to OPEN - ${this.failureCount} consecutive failures`);
        }
    }

    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            timeUntilRetry: Math.max(0, this.nextAttemptTime - Date.now())
        };
    }
}

class DbWatchdog {
    constructor() {
        this.dbConnErr = {
            timeStamp: Date.now(),
            retry: 0
        };
        this.logger = createLogger();
        this.circuitBreaker = new CircuitBreaker();
        this.healthMetrics = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            lastHealthCheck: null,
            consecutiveFailures: 0,
            averageResponseTime: 0,
            responseTimes: [],
            slowQueries: [], // Track slow queries (> 1 second)
            queryStats: new Map(), // Track query performance by operation name
            cacheHitRate: { hits: 0, misses: 0 } // Track cache performance
        };
        this.connectionState = {
            isConnected: false,
            lastConnectionTime: null,
            lastDisconnectionTime: null,
            reconnectionAttempts: 0
        };
        this.systemResources = {
            memoryUsage: null,
            diskUsage: null,
            lastResourceCheck: null,
            resourceWarnings: [],
            resourceCritical: []
        };
        this.init();
    }

    dbErrOccurs() {
        this.dbConnErr.retry++;
        this.dbConnErr.timeStamp = Date.now();
        console.error(`[dbWatchdog] Database connection error occurred. Error count: ${this.dbConnErr.retry}`);
    }

    isDbOnline() {
        return (this.dbConnErr.retry < CONFIG.MAX_ERR_RETRY);
    }

    isDbRespawn() {
        return (this.dbConnErr.retry > CONFIG.MAX_ERR_RESPAWN);
    }

    __dbErrorReset() {
        if (this.dbConnErr.retry > 0) {
            this.dbConnErr.retry = 0;
            console.log('[dbWatchdog] Database connection error counter reset');
        }
    }

    // System resource monitoring methods
    async checkMemoryUsage() {
        try {
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;

            this.systemResources.memoryUsage = {
                total: totalMemory,
                free: freeMemory,
                used: usedMemory,
                usagePercent: Math.round(memoryUsagePercent * 100) / 100,
                timestamp: new Date()
            };

            return this.systemResources.memoryUsage;
        } catch (error) {
            console.warn('[dbWatchdog] Failed to check memory usage:', error.message);
            return null;
        }
    }

    async checkDiskUsage() {
        try {
            // Check disk usage for the current working directory
            const cwd = process.cwd();
            const stats = await fs.statvfs(cwd);

            if (stats) {
                const totalSpace = stats.f_blocks * stats.f_frsize;
                const freeSpace = stats.f_available * stats.f_frsize;
                const usedSpace = totalSpace - freeSpace;
                const diskUsagePercent = (usedSpace / totalSpace) * 100;

                this.systemResources.diskUsage = {
                    total: totalSpace,
                    free: freeSpace,
                    used: usedSpace,
                    usagePercent: Math.round(diskUsagePercent * 100) / 100,
                    mountPoint: cwd,
                    timestamp: new Date()
                };
            } else {
                // Fallback for systems without statvfs
                this.systemResources.diskUsage = {
                    total: 0,
                    free: 0,
                    used: 0,
                    usagePercent: 0,
                    mountPoint: cwd,
                    timestamp: new Date(),
                    note: 'statvfs not available'
                };
            }

            return this.systemResources.diskUsage;
        } catch (error) {
            // Fallback for Windows or systems without statvfs
            try {
                // Simple fallback - just record that we attempted to check
                this.systemResources.diskUsage = {
                    total: 0,
                    free: 0,
                    used: 0,
                    usagePercent: 0,
                    mountPoint: process.cwd(),
                    timestamp: new Date(),
                    note: 'Disk check not available on this platform'
                };
            } catch (fallbackError) {
                console.warn('[dbWatchdog] Failed to check disk usage:', error.message);
            }
            return this.systemResources.diskUsage;
        }
    }

    async checkSystemResources() {
        try {
            const [memoryInfo, diskInfo] = await Promise.all([
                this.checkMemoryUsage(),
                this.checkDiskUsage()
            ]);

            this.systemResources.lastResourceCheck = new Date();

            // Check for resource warnings and critical levels
            const warnings = [];
            const critical = [];

            if (memoryInfo && memoryInfo.usagePercent >= CONFIG.MEMORY_CRITICAL_THRESHOLD) {
                critical.push(`Memory usage critical: ${memoryInfo.usagePercent}%`);
            } else if (memoryInfo && memoryInfo.usagePercent >= CONFIG.MEMORY_WARNING_THRESHOLD) {
                warnings.push(`Memory usage high: ${memoryInfo.usagePercent}%`);
            }

            if (diskInfo && diskInfo.usagePercent >= CONFIG.DISK_CRITICAL_THRESHOLD) {
                critical.push(`Disk usage critical: ${diskInfo.usagePercent}% (${diskInfo.mountPoint})`);
            } else if (diskInfo && diskInfo.usagePercent >= CONFIG.DISK_WARNING_THRESHOLD) {
                warnings.push(`Disk usage high: ${diskInfo.usagePercent}% (${diskInfo.mountPoint})`);
            }

            // Log warnings and critical alerts
            if (critical.length > 0) {
                console.error(`[dbWatchdog] CRITICAL SYSTEM RESOURCES: ${critical.join(', ')}`);
                this.systemResources.resourceCritical.push({
                    timestamp: new Date(),
                    issues: critical
                });
            }

            if (warnings.length > 0) {
                console.warn(`[dbWatchdog] SYSTEM RESOURCE WARNING: ${warnings.join(', ')}`);
                this.systemResources.resourceWarnings.push({
                    timestamp: new Date(),
                    issues: warnings
                });
            }

            // Keep only last 50 resource alerts
            if (this.systemResources.resourceWarnings.length > 50) {
                this.systemResources.resourceWarnings = this.systemResources.resourceWarnings.slice(-50);
            }
            if (this.systemResources.resourceCritical.length > 50) {
                this.systemResources.resourceCritical = this.systemResources.resourceCritical.slice(-50);
            }

            return {
                memory: memoryInfo,
                disk: diskInfo,
                warnings: warnings.length,
                critical: critical.length
            };
        } catch (error) {
            console.warn('[dbWatchdog] Failed to check system resources:', error.message);
            return null;
        }
    }

    async __updateRecords() {
        if (!schema || !schema.mongodbState) {
            console.warn('[dbWatchdog] Schema or mongodbState model not available, skipping update');
            return;
        }

        const dbConnector = require('./db-connector.js');
        const mongoose = dbConnector.mongoose;

        // Check if mongoose connection is actually ready before attempting update
        if (mongoose.connection.readyState !== 1) {
            console.warn('[dbWatchdog] MongoDB connection not ready, skipping error record update');
            return;
        }

        try {
            // Defensive check for schema availability due to circular dependency
            if (!schema || !schema.mongodbState) {
                console.warn('Schema not available for updateRecords');
                return;
            }

            await schema.mongodbState.updateOne(
                {},
                {
                    $set: {
                        errorDate: new Date(),
                        lastCheck: new Date(),
                        status: 'error',
                        lastError: 'Connection error detected'
                    },
                    $inc: {
                        consecutiveErrors: 1,
                        totalErrors: 1
                    }
                },
                {
                    upsert: true
                }
            );

            this.__dbErrorReset();
        } catch (error) {
            console.error('dbConnectionError updateRecords #36 error:', error?.name || error?.message || error);
            this.dbErrOccurs();
        }
    }

    init() {
        // Listen to connection events from db-connector
        try {
            const { connectionEmitter } = require('./db-connector.js');
            connectionEmitter.on('connected', (data) => {
                this.connectionState.isConnected = data.isConnected;
                this.connectionState.lastConnectionTime = data.lastConnectionTime;
                this.connectionState.reconnectionAttempts = data.reconnectionAttempts;
            });

            connectionEmitter.on('reconnected', (data) => {
                this.connectionState.isConnected = data.isConnected;
                this.connectionState.lastConnectionTime = data.lastConnectionTime;
                this.connectionState.reconnectionAttempts = data.reconnectionAttempts;
            });

            connectionEmitter.on('disconnected', (data) => {
                this.connectionState.isConnected = data.isConnected;
                this.connectionState.lastDisconnectionTime = data.lastDisconnectionTime;
            });
        } catch (error) {
            console.warn('Failed to setup connection event listeners:', error.message);
        }

        // Original error retry logic
        this.retryInterval = timerManager.setInterval(
            async () => {
                if (!this.isDbOnline()) {
                    await this.__updateRecords();
                }
            },
            CONFIG.RETRY_TIME
        );

        // Enhanced health check
        this.healthCheckInterval = timerManager.setInterval(
            async () => {
                try {
                    // If circuit breaker is in OPEN state, try recovery
                    if (this.circuitBreaker.state === 'OPEN') {
                        const recovered = await this.attemptRecovery();
                        if (recovered) {
                            console.log('[DbWatchdog] Circuit breaker has recovered from OPEN state');
                        }
                    }

                    // Periodically record health status - only record when errors occur
                    // if (healthReport.status !== 'healthy') {
                    //     this.logger.warn('Database health check', healthReport);
                    // }

                    // Update last health check time
                    this.healthMetrics.lastHealthCheck = new Date();

                } catch (error) {
                    this.logger.error(`Health check failed: ${error.message}`);
                }
            },
            CONFIG.HEALTH_CHECK_INTERVAL
        );

        // System resource monitoring
        // this.resourceCheckInterval = timerManager.setInterval(
        //     async () => {
        //         try {
        //             await this.checkSystemResources();
        //         } catch (error) {
        //             console.warn(`[dbWatchdog] System resource check failed: ${error.message}`);
        //         }
        //     },
        //     CONFIG.RESOURCE_CHECK_INTERVAL
        // );

        // Original MongoDB status recording - disabled to reduce log output
        // MongoDB state check disabled to reduce log noise
    }

    discordClientRespawn(discordClient, id) {
        discordClient.cluster.send({ respawn: true, id });
    }

    // Enhanced database operation wrapper with query performance monitoring
    async executeDatabaseOperation(operation, operationName = 'unknown') {
        const startTime = Date.now();
        this.healthMetrics.totalOperations++;

        try {
            const result = await this.circuitBreaker.execute(operation);
            const duration = Date.now() - startTime;

            // Record success metrics
            this.healthMetrics.successfulOperations++;
            this.healthMetrics.consecutiveFailures = 0;
            this.healthMetrics.responseTimes.push(duration);

            // Keep the last 100 response times
            if (this.healthMetrics.responseTimes.length > 100) {
                this.healthMetrics.responseTimes.shift();
            }

            // Update average response time
            this.healthMetrics.averageResponseTime = this.healthMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.healthMetrics.responseTimes.length;

            // Track slow queries (> 1 second)
            if (duration > 1000) {
                const slowQuery = {
                    operation: operationName,
                    duration,
                    timestamp: new Date()
                };
                this.healthMetrics.slowQueries.push(slowQuery);
                // Keep last 50 slow queries
                if (this.healthMetrics.slowQueries.length > 50) {
                    this.healthMetrics.slowQueries.shift();
                }
                console.warn(`[DbWatchdog] Slow query detected: ${operationName} took ${duration}ms`);
            }

            // Track query stats by operation name
            if (!this.healthMetrics.queryStats.has(operationName)) {
                this.healthMetrics.queryStats.set(operationName, {
                    count: 0,
                    totalDuration: 0,
                    minDuration: Infinity,
                    maxDuration: 0,
                    slowQueries: 0
                });
            }
            const stats = this.healthMetrics.queryStats.get(operationName);
            stats.count++;
            stats.totalDuration += duration;
            stats.minDuration = Math.min(stats.minDuration, duration);
            stats.maxDuration = Math.max(stats.maxDuration, duration);
            if (duration > 1000) stats.slowQueries++;

            // Update connection status
            if (!this.connectionState.isConnected) {
                this.connectionState.isConnected = true;
                this.connectionState.lastConnectionTime = new Date();
                //console.log(`[DbWatchdog] Database connection restored - operation: ${operationName}`);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.healthMetrics.failedOperations++;
            this.healthMetrics.consecutiveFailures++;

            // Update connection status
            if (this.connectionState.isConnected) {
                this.connectionState.isConnected = false;
                this.connectionState.lastDisconnectionTime = new Date();
                console.warn(`[DbWatchdog] Database connection interrupted - operation: ${operationName}, error: ${error.message}`);
            }

            this.logger.error(`Database operation failed: ${operationName}`, {
                error: error.message,
                duration,
                consecutiveFailures: this.healthMetrics.consecutiveFailures,
                circuitBreakerState: this.circuitBreaker.state
            });

            throw error;
        }
    }

    // Health status report
    getHealthReport() {
        const successRate = this.healthMetrics.totalOperations > 0
            ? (this.healthMetrics.successfulOperations / this.healthMetrics.totalOperations) * 100
            : 100;

        // Try to check mongoose connection status, avoid circular dependency
        let mongooseReadyState = 0;
        let isActuallyConnected = false;
        let connectionPoolInfo = null;

        try {
            // Dynamically check mongoose status, avoid creating dependencies during module loading
            const mongoose = require('./db-connector.js').mongoose;
            mongooseReadyState = mongoose?.connection?.readyState ?? 0;
            isActuallyConnected = mongooseReadyState === 1; // 1 = connected

            // Get connection pool information
            if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
                const client = mongoose.connection.getClient();
                if (client && client.topology) {
                    // Try to get pool stats
                    connectionPoolInfo = {
                        readyState: mongooseReadyState,
                        host: mongoose.connection.host,
                        name: mongoose.connection.name,
                        // Note: Detailed pool stats require MongoDB driver API access
                    };
                }
            }
        } catch {
            // If unable to access mongoose, use manually tracked status
            isActuallyConnected = this.connectionState.isConnected;
            mongooseReadyState = isActuallyConnected ? 1 : 0;
        }

        let status = 'healthy';
        if (this.healthMetrics.consecutiveFailures > 3) status = 'degraded';
        if (this.circuitBreaker.state === 'OPEN') status = 'critical';
        if (!isActuallyConnected) status = 'disconnected';

        // Update internal status to maintain synchronization
        this.connectionState.isConnected = isActuallyConnected;

        // Calculate cache hit rate
        const totalCacheOps = this.healthMetrics.cacheHitRate.hits + this.healthMetrics.cacheHitRate.misses;
        const cacheHitRate = totalCacheOps > 0
            ? (this.healthMetrics.cacheHitRate.hits / totalCacheOps) * 100
            : 0;

        // Get query performance stats
        const queryStats = {};
        for (const [opName, stats] of this.healthMetrics.queryStats.entries()) {
            queryStats[opName] = {
                count: stats.count,
                avgDuration: Math.round(stats.totalDuration / stats.count),
                minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration,
                maxDuration: stats.maxDuration,
                slowQueries: stats.slowQueries
            };
        }

        return {
            status,
            successRate: Math.round(successRate * 100) / 100,
            circuitBreaker: this.circuitBreaker.getStatus(),
            metrics: {
                totalOperations: this.healthMetrics.totalOperations,
                successfulOperations: this.healthMetrics.successfulOperations,
                failedOperations: this.healthMetrics.failedOperations,
                consecutiveFailures: this.healthMetrics.consecutiveFailures,
                averageResponseTime: Math.round(this.healthMetrics.averageResponseTime),
                slowQueriesCount: this.healthMetrics.slowQueries.length,
                recentSlowQueries: this.healthMetrics.slowQueries.slice(-10), // Last 10 slow queries
                queryStats: queryStats,
                cacheHitRate: Math.round(cacheHitRate * 100) / 100,
                cacheStats: {
                    hits: this.healthMetrics.cacheHitRate.hits,
                    misses: this.healthMetrics.cacheHitRate.misses,
                    total: totalCacheOps
                },
                lastHealthCheck: new Date().toISOString()
            },
            connection: {
                isConnected: isActuallyConnected,
                readyState: mongooseReadyState,
                readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongooseReadyState] || 'unknown',
                lastConnectionTime: this.connectionState.lastConnectionTime,
                lastDisconnectionTime: this.connectionState.lastDisconnectionTime,
                reconnectionAttempts: this.connectionState.reconnectionAttempts,
                poolInfo: connectionPoolInfo
            },
            systemResources: {
                memory: this.systemResources.memoryUsage,
                disk: this.systemResources.diskUsage,
                lastResourceCheck: this.systemResources.lastResourceCheck,
                resourceWarnings: this.systemResources.resourceWarnings.slice(-10), // Last 10 warnings
                resourceCritical: this.systemResources.resourceCritical.slice(-10), // Last 10 critical alerts
                thresholds: {
                    memoryWarning: CONFIG.MEMORY_WARNING_THRESHOLD,
                    memoryCritical: CONFIG.MEMORY_CRITICAL_THRESHOLD,
                    diskWarning: CONFIG.DISK_WARNING_THRESHOLD,
                    diskCritical: CONFIG.DISK_CRITICAL_THRESHOLD
                }
            }
        };
    }

    // Automatic recovery mechanism
    async attemptRecovery() {
        try {
            // Try simple database operation to test connection
            await this.executeDatabaseOperation(async () => {
                if (schema && schema.mongodbState) {
                    return await schema.mongodbState.findOne({});
                }
                return { ok: 1 };
            }, 'health_check');

            console.log('[DbWatchdog] Automatic recovery successful');
            return true;
        } catch (error) {
            console.warn(`[DbWatchdog] Automatic recovery failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = new DbWatchdog();