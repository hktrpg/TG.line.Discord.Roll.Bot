"use strict";
const path = require('path');
const winston = require('winston');
const { format } = winston;
const schema = require('./schema.js');

// 常數配置
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
    HEALTH_CHECK_INTERVAL: 30 * 1000 // 30 seconds
};

// 建立自定義 logger
const createLogger = () => {
    const severityLevelOnly = format(info => {
        info.severityLevel = info.level;
        delete info.level;
        delete info.service;
        delete info.severityLevel;
        return info;
    });

    return winston.createLogger({
        level: 'info',
        format: format.combine(
            severityLevelOnly(),
            format.json()
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: path.join(__dirname, '..', 'log', 'hktrpg-mongod.log'),
                level: 'info',
                maxFiles: CONFIG.MAX_LOG_FILES,
                maxsize: CONFIG.LOG_FILE_SIZE
            })
        ]
    });
};

// 斷路器類別 - 防止連鎖故障
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
                console.log('[CircuitBreaker] 進入 HALF_OPEN 狀態，測試恢復');
            } else {
                throw new Error(`Circuit breaker is OPEN - 等待 ${Math.ceil((this.recoveryTimeout - (now - this.lastFailureTime)) / 1000)} 秒後重試`);
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
        console.log('[CircuitBreaker] 狀態變更為 CLOSED');
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.recoveryTimeout;
            console.log(`[CircuitBreaker] 狀態變更為 OPEN - ${this.failureCount} 次連續失敗`);
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
            responseTimes: []
        };
        this.connectionState = {
            isConnected: false,
            lastConnectionTime: null,
            lastDisconnectionTime: null,
            reconnectionAttempts: 0
        };
        this.init();
    }

    dbErrOccurs() {
        this.dbConnErr.retry++;
        this.dbConnErr.timeStamp = Date.now();
        console.error('dbConnectionError dbErrOccurs #17 error times#', this.dbConnErr.retry);
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
            console.error('dbConnectionError dbErrorReset #25 dbConnErr.retry Reset');
        }
    }

    async __updateRecords() {
        try {
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
        // 原有的錯誤重試邏輯
        setInterval(
            async () => {
                if (!this.isDbOnline()) {
                    await this.__updateRecords();
                }
            },
            CONFIG.RETRY_TIME
        );

        // 增強的健康檢查
        setInterval(
            async () => {
                try {
                    const healthReport = this.getHealthReport();

                    // 如果斷路器處於 OPEN 狀態，嘗試恢復
                    if (this.circuitBreaker.state === 'OPEN') {
                        const recovered = await this.attemptRecovery();
                        if (recovered) {
                            console.log('[DbWatchdog] 斷路器已從 OPEN 狀態恢復');
                        }
                    }

                    // 定期記錄健康狀態 - 只在發生錯誤時記錄
                    // if (healthReport.status !== 'healthy') {
                    //     this.logger.warn('Database health check', healthReport);
                    // }

                    // 更新最後健康檢查時間
                    this.healthMetrics.lastHealthCheck = new Date();

                } catch (error) {
                    this.logger.error(`Health check failed: ${error.message}`);
                }
            },
            CONFIG.HEALTH_CHECK_INTERVAL
        );

        // 原有的 MongoDB 狀態記錄
        setInterval(
            async () => {
                try {
                    let ans = await schema.mongodbState();
                    if (!ans) return;
                    const currentdate = new Date();
                    const datetime = "Time: " + currentdate.getDate() + "/"
                        + (currentdate.getMonth() + 1) + "/"
                        + currentdate.getFullYear() + " @ "
                        + currentdate.getHours() + ":"
                        + currentdate.getMinutes() + ":"
                        + currentdate.getSeconds();
                    try {
                        // Only log if there's an error or connection is not successful
                        if (!ans.ok || ans.status !== "connected") {
                            this.logger.error(`${datetime}  mongodbState: ${JSON.stringify(ans)}`);
                        }
                    } catch (error) {
                        this.logger.error(`Error logging MongoDB state: ${error.message}`);
                    }
                } catch (error) {
                    this.logger.error(`MongoDB state check failed: ${error.message}`);
                }
            },
            CONFIG.MONGOD_CHECK_INTERVAL
        );
    }

    discordClientRespawn(discordClient, id) {
        discordClient.cluster.send({ respawn: true, id });
    }

    // 增強的資料庫操作包裝器
    async executeDatabaseOperation(operation, operationName = 'unknown') {
        const startTime = Date.now();
        this.healthMetrics.totalOperations++;

        try {
            const result = await this.circuitBreaker.execute(operation);
            const duration = Date.now() - startTime;

            // 記錄成功指標
            this.healthMetrics.successfulOperations++;
            this.healthMetrics.consecutiveFailures = 0;
            this.healthMetrics.responseTimes.push(duration);

            // 保持最近 100 個響應時間
            if (this.healthMetrics.responseTimes.length > 100) {
                this.healthMetrics.responseTimes.shift();
            }

            // 更新平均響應時間
            this.healthMetrics.averageResponseTime = this.healthMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.healthMetrics.responseTimes.length;

            // 更新連線狀態
            if (!this.connectionState.isConnected) {
                this.connectionState.isConnected = true;
                this.connectionState.lastConnectionTime = new Date();
                console.log(`[DbWatchdog] 資料庫連線恢復 - 操作: ${operationName}`);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.healthMetrics.failedOperations++;
            this.healthMetrics.consecutiveFailures++;

            // 更新連線狀態
            if (this.connectionState.isConnected) {
                this.connectionState.isConnected = false;
                this.connectionState.lastDisconnectionTime = new Date();
                console.warn(`[DbWatchdog] 資料庫連線中斷 - 操作: ${operationName}, 錯誤: ${error.message}`);
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

    // 健康狀態報告
    getHealthReport() {
        const now = Date.now();
        const successRate = this.healthMetrics.totalOperations > 0
            ? (this.healthMetrics.successfulOperations / this.healthMetrics.totalOperations) * 100
            : 100;

        // 嘗試檢查 mongoose 連線狀態，避免循環依賴
        let mongooseReadyState = 0;
        let isActuallyConnected = false;

        try {
            // 動態檢查 mongoose 狀態，避免在模組載入時就建立依賴
            const mongoose = require('./db-connector.js').mongoose;
            mongooseReadyState = mongoose?.connection?.readyState ?? 0;
            isActuallyConnected = mongooseReadyState === 1; // 1 = connected
        } catch (error) {
            // 如果無法訪問 mongoose，使用手動追蹤的狀態
            isActuallyConnected = this.connectionState.isConnected;
            mongooseReadyState = isActuallyConnected ? 1 : 0;
        }

        let status = 'healthy';
        if (this.healthMetrics.consecutiveFailures > 3) status = 'degraded';
        if (this.circuitBreaker.state === 'OPEN') status = 'critical';
        if (!isActuallyConnected) status = 'disconnected';

        // 更新內部狀態以保持同步
        this.connectionState.isConnected = isActuallyConnected;

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
                lastHealthCheck: new Date().toISOString()
            },
            connection: {
                isConnected: isActuallyConnected,
                readyState: mongooseReadyState,
                readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongooseReadyState] || 'unknown',
                lastConnectionTime: this.connectionState.lastConnectionTime,
                lastDisconnectionTime: this.connectionState.lastDisconnectionTime,
                reconnectionAttempts: this.connectionState.reconnectionAttempts
            }
        };
    }

    // 自動恢復機制
    async attemptRecovery() {
        try {
            // 嘗試簡單的資料庫操作來測試連線
            await this.executeDatabaseOperation(async () => {
                if (schema && schema.mongodbState) {
                    return await schema.mongodbState.findOne({});
                }
                return { ok: 1 };
            }, 'health_check');

            console.log('[DbWatchdog] 自動恢復成功');
            return true;
        } catch (error) {
            console.warn(`[DbWatchdog] 自動恢復失敗: ${error.message}`);
            return false;
        }
    }
}

module.exports = new DbWatchdog();