"use strict";

/**
 * MongoDB Protection Layer
 * 提供安全的數據庫操作，當 MongoDB 不可用時自動降級到內存模式
 * 防止數據庫問題導致整個系統崩潰
 */

const EventEmitter = require('events');
const dbConnector = require('./db-connector.js');
const schema = require('./schema.js');

class DBProtectionLayer extends EventEmitter {
    constructor() {
        super();
        this.isDegradedMode = false;
        this.memoryCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5分鐘 TTL
        this.healthCheckInterval = 30 * 1000; // 30秒檢查一次
        this.lastHealthCheck = Date.now();
        this.consecutiveFailures = 0;
        this.maxConsecutiveFailures = 3; // 連續3次失敗進入降級模式

        this.startHealthMonitoring();
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 監聽數據庫連接狀態變化
        if (dbConnector.connectionEmitter) {
            dbConnector.connectionEmitter.on('connected', () => {
                console.log('[DB-Protection] MongoDB connection restored');
                this.exitDegradedMode();
            });

            dbConnector.connectionEmitter.on('disconnected', () => {
                console.warn('[DB-Protection] MongoDB connection lost');
                this.checkDegradedModeEntry();
            });
        }
    }

    /**
     * 開始健康監控
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, this.healthCheckInterval);
    }

    /**
     * 執行健康檢查
     */
    async performHealthCheck() {
        try {
            const isHealthy = await this.checkDBHealth();
            this.lastHealthCheck = Date.now();

            if (!isHealthy && !this.isDegradedMode) {
                this.consecutiveFailures++;
                if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                    this.enterDegradedMode();
                }
            } else if (isHealthy && this.isDegradedMode) {
                this.consecutiveFailures = 0;
                this.exitDegradedMode();
            } else if (isHealthy) {
                this.consecutiveFailures = 0;
            }
        } catch (error) {
            console.error('[DB-Protection] Health check error:', error.message);
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= this.maxConsecutiveFailures && !this.isDegradedMode) {
                this.enterDegradedMode();
            }
        }
    }

    /**
     * 檢查數據庫健康狀態
     */
    async checkDBHealth() {
        try {
            if (!dbConnector.mongoose || dbConnector.mongoose.connection.readyState !== 1) {
                return false;
            }

            // 嘗試一個簡單的數據庫操作
            await dbConnector.mongoose.connection.db.admin().ping();
            return true;
            } catch {
                return false;
            }
    }

    /**
     * 進入降級模式
     */
    enterDegradedMode() {
        if (this.isDegradedMode) return;

        this.isDegradedMode = true;
        console.warn('[DB-Protection] 🔴 ENTERING DEGRADED MODE - Using memory cache for database operations');

        this.emit('degraded-mode-entered', {
            timestamp: new Date(),
            reason: 'MongoDB connection failures',
            consecutiveFailures: this.consecutiveFailures
        });

        // 設置自動退出降級模式的定時器（5分鐘後檢查）
        setTimeout(() => {
            this.attemptExitDegradedMode();
        }, 5 * 60 * 1000);
    }

    /**
     * 退出降級模式
     */
    async exitDegradedMode() {
        if (!this.isDegradedMode) return;

        const isHealthy = await this.checkDBHealth();
        if (!isHealthy) {
            console.warn('[DB-Protection] Cannot exit degraded mode - DB still unhealthy');
            return;
        }

        this.isDegradedMode = false;
        this.consecutiveFailures = 0;
        console.log('[DB-Protection] 🟢 EXITING DEGRADED MODE - Database operations restored');

        this.emit('degraded-mode-exited', {
            timestamp: new Date(),
            restoredOperations: this.memoryCache.size
        });

        // 嘗試同步內存緩存到數據庫
        this.syncMemoryCacheToDB();
    }

    /**
     * 嘗試退出降級模式
     */
    async attemptExitDegradedMode() {
        if (!this.isDegradedMode) return;

        const isHealthy = await this.checkDBHealth();
        if (isHealthy) {
            await this.exitDegradedMode();
        } else {
            console.warn('[DB-Protection] Still in degraded mode - DB health check failed');
            // 設置下一次檢查
            setTimeout(() => {
                this.attemptExitDegradedMode();
            }, 2 * 60 * 1000); // 2分鐘後再檢查
        }
    }

    /**
     * 檢查是否應該進入降級模式
     */
    checkDegradedModeEntry() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxConsecutiveFailures && !this.isDegradedMode) {
            this.enterDegradedMode();
        }
    }

    /**
     * 安全的數據庫查找操作
     */
    async safeFind(collectionName, query = {}, options = {}) {
        if (this.isDegradedMode) {
            return this.memoryFind(collectionName, query, options);
        }

        try {
            if (!schema[collectionName] || typeof schema[collectionName].find !== 'function') {
                throw new Error(`Collection ${collectionName} not available`);
            }

            const results = await schema[collectionName].find(query, null, options);
            this.consecutiveFailures = 0; // 重置失敗計數
            return results;
        } catch (error) {
            console.error(`[DB-Protection] Find operation failed for ${collectionName}:`, error.message);
            this.checkDegradedModeEntry();
            return this.memoryFind(collectionName, query, options);
        }
    }

    /**
     * 安全的數據庫創建操作
     */
    async safeCreate(collectionName, data) {
        if (this.isDegradedMode) {
            return this.memoryCreate(collectionName, data);
        }

        try {
            if (!schema[collectionName] || typeof schema[collectionName].create !== 'function') {
                throw new Error(`Collection ${collectionName} not available`);
            }

            const result = await schema[collectionName].create(data);
            this.consecutiveFailures = 0;
            return result;
        } catch (error) {
            console.error(`[DB-Protection] Create operation failed for ${collectionName}:`, error.message);
            this.checkDegradedModeEntry();
            return this.memoryCreate(collectionName, data);
        }
    }

    /**
     * 安全的數據庫更新操作
     */
    async safeUpdate(collectionName, query, update, options = {}) {
        if (this.isDegradedMode) {
            return this.memoryUpdate(collectionName, query, update, options);
        }

        try {
            if (!schema[collectionName] || typeof schema[collectionName].findOneAndUpdate !== 'function') {
                throw new Error(`Collection ${collectionName} not available`);
            }

            const result = await schema[collectionName].findOneAndUpdate(query, update, options);
            this.consecutiveFailures = 0;
            return result;
        } catch (error) {
            console.error(`[DB-Protection] Update operation failed for ${collectionName}:`, error.message);
            this.checkDegradedModeEntry();
            return this.memoryUpdate(collectionName, query, update, options);
        }
    }

    /**
     * 內存模式的查找操作
     */
    memoryFind(collectionName, query, options = {}) {
        const cacheKey = `find_${collectionName}_${JSON.stringify(query)}_${JSON.stringify(options)}`;
        const cached = this.getFromCache(cacheKey);

        if (cached !== null) {
            return cached;
        }

        // 在降級模式下，返回空數組或默認值
        const defaultResult = [];
        this.setCache(cacheKey, defaultResult);
        return defaultResult;
    }

    /**
     * 內存模式的創建操作
     */
    memoryCreate(collectionName, data) {
        const cacheKey = `create_${collectionName}_${Date.now()}_${Math.random()}`;

        // 存儲到內存緩存，等待同步到數據庫
        this.setCache(cacheKey, data, true); // 永久緩存直到同步

        // 添加到待同步隊列
        this.addToSyncQueue(collectionName, 'create', data);

        return data;
    }

    /**
     * 內存模式的更新操作
     */
    memoryUpdate(collectionName, query, update, options = {}) {
        const cacheKey = `update_${collectionName}_${JSON.stringify(query)}`;

        // 在降級模式下，模擬更新但不實際執行
        const mockResult = { acknowledged: true, modifiedCount: 1 };
        this.setCache(cacheKey, mockResult);

        // 添加到待同步隊列
        this.addToSyncQueue(collectionName, 'update', { query, update, options });

        return mockResult;
    }

    /**
     * 從緩存獲取數據
     */
    getFromCache(key) {
        const cached = this.memoryCache.get(key);
        if (!cached) return null;

        // 檢查 TTL
        if (Date.now() - cached.timestamp > this.cacheTTL && !cached.permanent) {
            this.memoryCache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * 設置緩存
     */
    setCache(key, data, permanent = false) {
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            permanent
        });
    }

    /**
     * 添加到同步隊列
     */
    addToSyncQueue(collectionName, operation, data) {
        if (!this.syncQueue) {
            this.syncQueue = [];
        }

        this.syncQueue.push({
            collectionName,
            operation,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 同步內存緩存到數據庫
     */
    async syncMemoryCacheToDB() {
        if (!this.syncQueue || this.syncQueue.length === 0) return;

        console.log(`[DB-Protection] Syncing ${this.syncQueue.length} cached operations to database`);

        const syncPromises = this.syncQueue.map(async (item) => {
            try {
                switch (item.operation) {
                    case 'create':
                        await this.safeCreate(item.collectionName, item.data);
                        break;
                    case 'update':
                        await this.safeUpdate(item.collectionName, item.data.query, item.data.update, item.data.options);
                        break;
                }
            } catch (error) {
                console.error(`[DB-Protection] Failed to sync ${item.operation} operation:`, error.message);
            }
        });

        await Promise.allSettled(syncPromises);

        // 清空同步隊列
        this.syncQueue = [];
        console.log('[DB-Protection] Cache sync completed');
    }

    /**
     * 獲取狀態報告
     */
    getStatusReport() {
        return {
            isDegradedMode: this.isDegradedMode,
            consecutiveFailures: this.consecutiveFailures,
            lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
            cacheSize: this.memoryCache.size,
            pendingSyncOperations: this.syncQueue ? this.syncQueue.length : 0,
            dbConnectionState: dbConnector.mongoose ? dbConnector.mongoose.connection.readyState : -1
        };
    }
}

// 創建單例實例
const dbProtectionLayer = new DBProtectionLayer();

module.exports = dbProtectionLayer;
