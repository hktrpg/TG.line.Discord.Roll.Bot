/**
 * 重試管理器 - 統一處理所有重試邏輯
 * 提供指數退避、超時管理、內存清理等功能
 */
class RetryManager {
    constructor(options = {}) {
        // 默認配置
        this.config = {
            maxRetries: 50,
            baseDelay: 100,
            maxDelay: 10_000,
            fastRetries: 3,      // 前N次快速重試
            mediumRetries: 7,    // 中等速度重試次數 (fastRetries + mediumRetries = 慢速重試開始點)
            randomizationFactor: 0.1, // 隨機化因子，防止多個重試同時發生
            ...options
        };

        // 重試狀態存儲
        this.retryStates = new Map();
    }

    /**
     * 獲取或創建重試狀態
     * @param {string} key - 重試鍵
     * @returns {Object} 重試狀態
     */
    getRetryState(key) {
        if (!this.retryStates.has(key)) {
            this.retryStates.set(key, {
                count: 0,
                timeouts: [],
                lastRetryTime: 0,
                isActive: false
            });
        }
        return this.retryStates.get(key);
    }

    /**
     * 計算重試延遲時間（指數退避 + 隨機化）
     * @param {number} retryCount - 當前重試次數 (從0開始)
     * @returns {number} 延遲毫秒數
     */
    calculateRetryDelay(retryCount) {
        let delay;

        if (retryCount < this.config.fastRetries) {
            // 快速重試階段：100ms, 200ms, 400ms
            delay = Math.pow(2, retryCount) * this.config.baseDelay;
        } else if (retryCount < this.config.fastRetries + this.config.mediumRetries) {
            // 中等速度重試階段：800ms, 1600ms, 3200ms, 5000ms...
            delay = Math.min(
                Math.pow(2, retryCount - (this.config.fastRetries - 1)) * this.config.baseDelay,
                this.config.maxDelay / 2
            );
        } else {
            // 慢速重試階段：固定最大延遲
            delay = this.config.maxDelay;
        }

        // 添加隨機化因子
        const randomization = delay * this.config.randomizationFactor * (Math.random() * 2 - 1);
        delay = Math.max(this.config.baseDelay, delay + randomization);

        return Math.floor(delay);
    }

    /**
     * 執行重試操作
     * @param {string} key - 重試鍵
     * @param {Function} operation - 要重試的操作函數
     * @param {Object} options - 重試選項
     * @returns {Promise} 重試結果
     */
    async retry(key, operation, options = {}) {
        const state = this.getRetryState(key);
        const { onRetry, onMaxRetries, signal } = options;

        // 如果已經達到最大重試次數
        if (state.count >= this.config.maxRetries) {
            if (onMaxRetries) {
                onMaxRetries(state.count);
            }
            throw new Error(`Max retries (${this.config.maxRetries}) exceeded for key: ${key}`);
        }

        // 如果有中止信號且已中止
        if (signal && signal.aborted) {
            throw new Error(`Retry aborted for key: ${key}`);
        }

        state.count++;
        state.isActive = true;

        try {
            const result = await operation();

            // 成功後重置狀態
            this.resetRetryState(key);

            return result;
        } catch (error) {
            // 失敗時調用重試回調
            if (onRetry) {
                onRetry(state.count, error);
            }

            // 如果還有重試次數，安排下一次重試
            if (state.count < this.config.maxRetries) {
                const delay = this.calculateRetryDelay(state.count - 1);
                state.lastRetryTime = Date.now();

                return new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(async () => {
                        try {
                            const result = await this.retry(key, operation, options);
                            resolve(result);
                        } catch (retryError) {
                            reject(retryError);
                        }
                    }, delay);

                    // 存儲超時ID以便清理
                    state.timeouts.push(timeoutId);

                    // 如果有中止信號，監聽中止事件
                    if (signal) {
                        const abortHandler = () => {
                            clearTimeout(timeoutId);
                            this.removeTimeout(state, timeoutId);
                            reject(new Error(`Retry aborted for key: ${key}`));
                        };

                        signal.addEventListener('abort', abortHandler, { once: true });

                        // 存儲中止處理器以便清理
                        state.abortHandlers = state.abortHandlers || [];
                        state.abortHandlers.push(() => signal.removeEventListener('abort', abortHandler));
                    }
                });
            } else {
                // 達到最大重試次數
                if (onMaxRetries) {
                    onMaxRetries(state.count, error);
                }
                throw error;
            }
        } finally {
            state.isActive = false;
        }
    }

    /**
     * 立即執行操作（不重試）
     * @param {string} key - 重試鍵
     * @param {Function} operation - 要執行的操作
     * @returns {*} 操作結果
     */
    async executeOnce(key, operation) {
        const state = this.getRetryState(key);

        try {
            const result = await operation();

            // 成功後重置狀態
            this.resetRetryState(key);

            return result;
        } catch (error) {
            state.count++; // 仍然計數失敗次數
            throw error;
        }
    }

    /**
     * 重置特定鍵的重試狀態
     * @param {string} key - 重試鍵
     */
    resetRetryState(key) {
        const state = this.retryStates.get(key);
        if (state) {
            // 清理所有超時
            for (const timeoutId of state.timeouts) {
                clearTimeout(timeoutId);
            }

            // 清理中止處理器
            if (state.abortHandlers) {
                for (const cleanup of state.abortHandlers) {
                    cleanup();
                }
            }

            // 重置狀態
            state.count = 0;
            state.timeouts = [];
            state.lastRetryTime = 0;
            state.isActive = false;
            state.abortHandlers = [];
        }
    }

    /**
     * 重置所有重試狀態
     */
    resetAllRetryStates() {
        for (const key of this.retryStates.keys()) {
            this.resetRetryState(key);
        }
    }

    /**
     * 從狀態中移除超時ID
     * @param {Object} state - 重試狀態
     * @param {number} timeoutId - 超時ID
     */
    removeTimeout(state, timeoutId) {
        const index = state.timeouts.indexOf(timeoutId);
        if (index !== -1) {
            state.timeouts.splice(index, 1);
        }
    }

    /**
     * 獲取重試統計信息
     * @param {string} key - 重試鍵
     * @returns {Object} 統計信息
     */
    getRetryStats(key) {
        const state = this.retryStates.get(key);
        if (!state) {
            return { count: 0, isActive: false, lastRetryTime: 0 };
        }

        return {
            count: state.count,
            isActive: state.isActive,
            lastRetryTime: state.lastRetryTime,
            timeoutsCount: state.timeouts.length
        };
    }

    /**
     * 獲取所有重試統計信息
     * @returns {Object} 所有統計信息
     */
    getAllRetryStats() {
        const stats = {};
        for (const [key, state] of this.retryStates) {
            stats[key] = {
                count: state.count,
                isActive: state.isActive,
                lastRetryTime: state.lastRetryTime,
                timeoutsCount: state.timeouts.length
            };
        }
        return stats;
    }

    /**
     * 銷毀管理器，清理所有資源
     */
    destroy() {
        this.resetAllRetryStates();
        this.retryStates.clear();
    }
}

// 創建全局實例
window.retryManager = new RetryManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RetryManager;
}
