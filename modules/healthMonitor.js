"use strict";

const EventEmitter = require('events');
const dbWatchdog = require('./dbWatchdog.js');

class HealthMonitor extends EventEmitter {
    constructor() {
        super();
        this.alerts = new Map();
        this.metrics = {
            startTime: new Date(),
            totalInteractions: 0,
            failedInteractions: 0,
            slowResponses: 0,
            clusterHealth: new Map(),
            lastHealthCheck: null
        };
        this.alertThresholds = {
            maxFailedInteractions: 10,
            maxSlowResponses: 5,
            maxUnhealthyClusters: 2,
            alertCooldown: 5 * 60 * 1000 // 5 minutes
        };
        this.init();
    }

    init() {
        // 定期健康檢查
        setInterval(() => this.performHealthCheck(), 60 * 1000); // 每分鐘檢查一次

        // 監聽各種事件
        this.on('interactionProcessed', this.handleInteractionProcessed.bind(this));
        this.on('clusterHealthChange', this.handleClusterHealthChange.bind(this));
        this.on('databaseError', this.handleDatabaseError.bind(this));
    }

    async performHealthCheck() {
        try {
            const healthReport = this.generateHealthReport();
            this.metrics.lastHealthCheck = new Date();

            // 檢查是否需要發出警報
            await this.checkAlertConditions(healthReport);

            // 發出健康報告事件
            this.emit('healthReport', healthReport);

        } catch (error) {
            console.error('[HealthMonitor] Health check failed:', error);
        }
    }

    handleInteractionProcessed(data) {
        this.metrics.totalInteractions++;

        if (data.success === false) {
            this.metrics.failedInteractions++;
        }

        if (data.duration > 5000) { // 超過 5 秒的響應
            this.metrics.slowResponses++;
        }

        // 檢查互動失敗率
        if (this.metrics.failedInteractions > this.alertThresholds.maxFailedInteractions) {
            this.raiseAlert('highInteractionFailureRate', {
                failedCount: this.metrics.failedInteractions,
                totalCount: this.metrics.totalInteractions,
                failureRate: (this.metrics.failedInteractions / this.metrics.totalInteractions) * 100
            });
        }
    }

    handleClusterHealthChange(data) {
        this.metrics.clusterHealth.set(data.clusterId, {
            status: data.status,
            lastUpdate: new Date(),
            consecutiveFailures: data.consecutiveFailures || 0
        });

        // 檢查不健康的集群數量
        const unhealthyClusters = Array.from(this.metrics.clusterHealth.values())
            .filter(cluster => cluster.status !== 'healthy').length;

        if (unhealthyClusters > this.alertThresholds.maxUnhealthyClusters) {
            this.raiseAlert('multipleUnhealthyClusters', {
                unhealthyCount: unhealthyClusters,
                totalClusters: this.metrics.clusterHealth.size
            });
        }
    }

    handleDatabaseError(data) {
        this.raiseAlert('databaseError', data);
    }

    async checkAlertConditions(healthReport) {
        // 檢查互動失敗率
        if (healthReport.interactions.successRate < 90) {
            this.raiseAlert('highInteractionFailureRate', {
                failureRate: (100 - healthReport.interactions.successRate).toFixed(1) + '%',
                totalInteractions: healthReport.interactions.total,
                failedInteractions: healthReport.interactions.failed
            });
        }

        // 檢查資料庫狀態
        if (healthReport.database.status !== 'healthy') {
            this.raiseAlert('databaseError', {
                status: healthReport.database.status,
                circuitBreakerState: healthReport.database.circuitBreaker.state
            });
        }

        // 檢查集群健康狀態
        const unhealthyClusters = healthReport.clusters.unhealthy;
        if (unhealthyClusters > 0) {
            this.raiseAlert('multipleUnhealthyClusters', {
                unhealthyCount: unhealthyClusters,
                totalClusters: healthReport.clusters.total
            });
        }
    }

    raiseAlert(alertType, data) {
        const alertKey = `${alertType}_${Date.now()}`;
        const lastAlert = this.alerts.get(alertType);

        // 檢查是否在冷卻期間內
        if (lastAlert && (Date.now() - lastAlert.timestamp) < this.alertThresholds.alertCooldown) {
            return; // 跳過重複警報
        }

        const alert = {
            type: alertType,
            data,
            timestamp: Date.now(),
            severity: this.getAlertSeverity(alertType)
        };

        this.alerts.set(alertType, alert);
        console.error(`[ALERT] ${alertType}:`, data);

        // 發出警報事件
        this.emit('alert', alert);
    }

    getAlertSeverity(alertType) {
        const severityMap = {
            highInteractionFailureRate: 'critical',
            multipleUnhealthyClusters: 'warning',
            databaseError: 'critical',
            mongodbDisconnected: 'critical'
        };
        return severityMap[alertType] || 'info';
    }

    generateHealthReport() {
        const uptime = Date.now() - this.metrics.startTime.getTime();
        const dbHealth = dbWatchdog.getHealthReport();

        return {
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime / 1000), // 秒數
            interactions: {
                total: this.metrics.totalInteractions,
                failed: this.metrics.failedInteractions,
                slow: this.metrics.slowResponses,
                successRate: this.metrics.totalInteractions > 0
                    ? ((this.metrics.totalInteractions - this.metrics.failedInteractions) / this.metrics.totalInteractions) * 100
                    : 100
            },
            clusters: {
                total: this.metrics.clusterHealth.size,
                unhealthy: Array.from(this.metrics.clusterHealth.values())
                    .filter(c => c.status !== 'healthy').length,
                details: Array.from(this.metrics.clusterHealth.entries()).map(([id, health]) => ({
                    id,
                    status: health.status,
                    lastUpdate: health.lastUpdate,
                    consecutiveFailures: health.consecutiveFailures
                }))
            },
            database: dbHealth,
            alerts: {
                active: Array.from(this.alerts.keys()),
                recent: Array.from(this.alerts.values()).slice(-5) // 最近 5 個警報
            },
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                nodeVersion: process.version
            }
        };
    }

    // 獲取簡化的狀態摘要
    getStatusSummary() {
        const report = this.generateHealthReport();
        const alerts = report.alerts.active.length;
        const criticalAlerts = report.alerts.recent.filter(a => a.severity === 'critical').length;

        let status = '🟢'; // 健康
        if (criticalAlerts > 0) status = '🔴'; // 嚴重問題
        else if (alerts > 0) status = '🟡'; // 警告
        else if (report.database.status !== 'healthy') status = '🟠'; // 資料庫問題

        return {
            status,
            summary: `${status} 系統狀態正常`,
            details: {
                interactions: `${report.interactions.successRate.toFixed(1)}% 成功率`,
                clusters: `${report.clusters.unhealthy}/${report.clusters.total} 集群異常`,
                database: report.database.status,
                alerts: alerts > 0 ? `${alerts} 個活躍警報` : '無警報'
            }
        };
    }

    // 清理舊的警報
    cleanupOldAlerts() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 小時前
        for (const [key, alert] of this.alerts.entries()) {
            if (alert.timestamp < cutoffTime) {
                this.alerts.delete(key);
            }
        }
    }
}

// 創建全域實例
const healthMonitor = new HealthMonitor();

// 定期清理舊警報
setInterval(() => healthMonitor.cleanupOldAlerts(), 60 * 60 * 1000); // 每小時清理一次

module.exports = healthMonitor;
