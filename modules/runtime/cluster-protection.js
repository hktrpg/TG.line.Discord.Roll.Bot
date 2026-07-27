"use strict";

/**
 * Cluster Protection Layer
 * 提供安全的集群操作，防止單個分流問題影響整個集群統計
 */

class ClusterProtection {
    constructor() {
        this.unhealthyClusters = new Set();
        this.clusterHealthTimeout = 30_000; // 30秒健康超時
        this.maxRetries = 2;
        this.retryDelay = 1000;
    }

    /**
     * 安全的 broadcastEval 操作
     * 自動跳過不健康的集群，避免 CLUSTERING_NO_CHILD_EXISTS 錯誤
     */
    async safeBroadcastEval(client, evalFunction, options) {
        if (!client || !client.cluster) {
            throw new Error('Cluster client not available');
        }

        const timeout = (options && options.timeout) || 10_000;
        const retries = (options && options.retries) || this.maxRetries;
        const skipUnhealthy = (options && options.skipUnhealthy) !== false;
        const context = (options && options.context) || {};

        // For latency measurements, be more lenient with unhealthy clusters
        // as they might have recovered
        const isLatencyMeasurement = options && options.isLatencyMeasurement;

        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // 如果啟用跳過不健康集群，使用過濾後的集群列表
                // 但是對於延遲測量，即使有不健康集群也嘗試，因為它們可能已經恢復
                if (skipUnhealthy && this.unhealthyClusters.size > 0 && !isLatencyMeasurement) {
                    return await this.filteredBroadcastEval(client, evalFunction, timeout, isLatencyMeasurement, context);
                }

                // 標準 broadcastEval with context support
                const broadcastOptions = Object.keys(context).length > 0 ? { context } : {};
                const result = await this.withTimeout(
                    client.cluster.broadcastEval(evalFunction, broadcastOptions),
                    timeout
                );

                // 如果成功，重置不健康集群跟踪 (但對於延遲測量更保守)
                if (!isLatencyMeasurement) {
                    this.unhealthyClusters.clear();
                } else if (this.unhealthyClusters.size > 0) {
                    // 對於延遲測量，如果成功了，清除一些舊的不健康記錄
                    // 但保留最近的記錄，以防它是間歇性問題
                    console.log('[Cluster-Protection] Latency measurement succeeded, keeping some unhealthy cluster records for safety');
                }
                return result;

            } catch (error) {
                lastError = error;
                console.warn('[Cluster-Protection] broadcastEval attempt ' + (attempt + 1) + ' failed:', error.message);

                // Try to identify which cluster failed
                const failedClusterId = this.extractClusterIdFromError(error.message);
                if (failedClusterId !== null) {
                    console.warn(`[Cluster-Protection] Identified failed cluster: ${failedClusterId}`);
                    this.unhealthyClusters.add(failedClusterId);
                    console.warn('[Cluster-Protection] Marked cluster ' + failedClusterId + ' as unhealthy');
                } else {
                    // If we can't identify the specific cluster, try to find missing clusters
                    console.warn('[Cluster-Protection] Could not identify specific failed cluster, attempting to detect missing clusters');
                    this.detectMissingClusters(client);
                }

                // 如果不是最後一次嘗試，等待後重試
                if (attempt < retries) {
                const retryDelay = this.retryDelay;
                await new Promise(function(resolve) {
                    setTimeout(resolve, retryDelay * (attempt + 1));
                });
                }
            }
        }

        // 所有嘗試都失敗
        console.error('[Cluster-Protection] All broadcastEval attempts failed');
        if (lastError) {
            throw lastError;
        } else {
            throw new Error('All broadcastEval attempts failed');
        }
    }

    /**
     * 過濾後的 broadcastEval，只對健康的集群執行
     */
    async filteredBroadcastEval(client, evalFunction, timeout, isLatencyMeasurement, context = {}) {
        try {
            // 獲取所有集群 ID
            const clusterIds = client.cluster && client.cluster.ids ? client.cluster.ids.values() : [];
            const allClusterIds = [...clusterIds];

            if (allClusterIds.length === 0) {
                throw new Error('No clusters available');
            }

            // 過濾出健康的集群
            const unhealthyClusters = this.unhealthyClusters;
            let targetClusterIds;

            if (isLatencyMeasurement) {
                // 對於延遲測量，即使集群被標記為不健康也嘗試，因為它們可能已經恢復
                targetClusterIds = allClusterIds;
                console.log('[Cluster-Protection] Latency measurement: attempting all clusters (' + allClusterIds.length + ' total, ' + unhealthyClusters.size + ' marked unhealthy)');
            } else {
                targetClusterIds = allClusterIds.filter(function(id) {
                    return !unhealthyClusters.has(id);
                });

                if (targetClusterIds.length === 0) {
                    throw new Error('No healthy clusters available');
                }

                console.log('[Cluster-Protection] Using ' + targetClusterIds.length + '/' + allClusterIds.length + ' healthy clusters');
            }

            // 對每個目標集群執行評估函數
            const promises = targetClusterIds.map((clusterId) => {
                const broadcastOptions = Object.keys(context).length > 0
                    ? { cluster: clusterId, context }
                    : { cluster: clusterId };

                return this.withTimeout(
                    client.cluster.broadcastEval(evalFunction, broadcastOptions),
                    timeout
                ).catch((error) => {
                    if (isLatencyMeasurement) {
                        console.warn('[Cluster-Protection] Latency measurement failed for cluster ' + clusterId + ':', error.message);
                    } else {
                        console.warn('[Cluster-Protection] Cluster ' + clusterId + ' evaluation failed:', error.message);
                    }
                    return null; // 返回 null 表示該集群失敗
                });
            });

            const results = await Promise.allSettled(promises);

            // 過濾出成功的結果
            const successfulResults = results
                .filter(function(result) {
                    return result.status === 'fulfilled' && result.value !== null;
                })
                .map(function(result) {
                    return result.value;
                });

            if (successfulResults.length === 0) {
                throw new Error('All healthy clusters failed to respond');
            }

            return successfulResults;

        } catch (error) {
            console.error('[Cluster-Protection] Filtered broadcastEval failed:', error.message);
            throw error;
        }
    }

    /**
     * 帶超時的 Promise 包裝器
     */
    async withTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise(function(_, reject) {
                setTimeout(function() {
                    reject(new Error('Operation timed out after ' + timeoutMs + 'ms'));
                }, timeoutMs);
            })
        ]);
    }

    /**
     * 從錯誤消息中提取集群 ID
     */
    extractClusterIdFromError(errorMessage) {
        const match = errorMessage.match(/ClusterId:\s*(\d+)/);
        return match ? Number.parseInt(match[1], 10) : null;
    }

    /**
     * 檢查集群健康狀態
     */
    async checkClusterHealth(client) {
        if (!client || !client.cluster) {
            return { healthy: false, reason: 'No cluster client' };
        }

        try {
            // 簡單的健康檢查
            const healthCheck = await this.withTimeout(
                client.cluster.broadcastEval(function(c) {
                    return { clusterId: (c.cluster && c.cluster.id) || -1 };
                }),
                5000
            );

            const healthyClusters = healthCheck.filter(function(result) {
                return result && result.clusterId >= 0;
            });
            const clusterIds = client.cluster && client.cluster.ids;
            const totalClusters = (clusterIds && clusterIds.size > 0) ? clusterIds.size : 0;

            return {
                healthy: healthyClusters.length > 0,
                totalClusters: totalClusters,
                healthyClusters: healthyClusters.length,
                unhealthyClusters: this.unhealthyClusters.size,
                details: healthyClusters
            };

        } catch (error) {
            const clusterIds = client.cluster && client.cluster.ids;
            return {
                healthy: false,
                reason: error.message,
                totalClusters: (clusterIds && clusterIds.size > 0) ? clusterIds.size : 0,
                unhealthyClusters: this.unhealthyClusters.size
            };
        }
    }

    /**
     * 重置不健康集群跟踪
     */
    resetUnhealthyClusters() {
        const count = this.unhealthyClusters.size;
        this.unhealthyClusters.clear();
        console.log('[Cluster-Protection] Reset unhealthy cluster tracking (' + count + ' clusters cleared)');
    }

    /**
     * 檢測缺少的集群（沒有回應的集群）
     */
    async detectMissingClusters(client) {
        if (!client || !client.cluster) return;

        try {
            // 嘗試獲取所有集群 ID
            const allClusterIds = client.cluster.ids ? [...client.cluster.ids.keys()] : [];

            if (allClusterIds.length === 0) {
                console.warn('[Cluster-Protection] No cluster IDs available for detection');
                return;
            }

            // 嘗試簡單的健康檢查來識別哪些集群沒有回應
            const healthCheck = await this.withTimeout(
                client.cluster.broadcastEval(() => ({ clusterId: (client?.cluster) ? client.cluster.id : -1 })).catch(() => []),
                2000
            ).catch(() => []);

            const respondingClusterIds = healthCheck
                .filter(result => result && result.clusterId >= 0)
                .map(result => result.clusterId);

            const missingClusters = allClusterIds.filter(id => !respondingClusterIds.includes(id));

            if (missingClusters.length > 0) {
                console.warn(`[Cluster-Protection] Detected missing/unresponsive clusters: ${missingClusters.join(', ')}`);
                for (const clusterId of missingClusters) {
                    this.unhealthyClusters.add(clusterId);
                }
            } else {
                console.log(`[Cluster-Protection] All ${allClusterIds.length} clusters are responding`);
            }
        } catch (error) {
            console.warn('[Cluster-Protection] Failed to detect missing clusters:', error.message);
        }
    }

    /**
     * 獲取狀態報告
     */
    getStatusReport() {
        return {
            unhealthyClusters: [...this.unhealthyClusters],
            unhealthyCount: this.unhealthyClusters.size,
            healthTimeout: this.clusterHealthTimeout,
            maxRetries: this.maxRetries
        };
    }
}

// 創建單例實例
const clusterProtection = new ClusterProtection();

module.exports = clusterProtection;