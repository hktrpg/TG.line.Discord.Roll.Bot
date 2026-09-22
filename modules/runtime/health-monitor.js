"use strict";

const EventEmitter = require('events');
const dbWatchdog = require('../db/watchdog.js');
const { parsePositiveIntEnv, parseNonNegativeIntEnv } = require('../../utils/env-int.js');
const { isShardResponsive } = require('../discord/shard-connection.js');
const timerManager = require('./timer-manager');

const GATEWAY_5XX_PATTERN = /^http_5\d\d$|^gateway_5xx$/;

function loadHealthConfig() {
	return {
		recoveryMs: parsePositiveIntEnv('HEALTH_SHARD_ERROR_RECOVERY_MS', 180_000),
		destroySettleMs: parsePositiveIntEnv('HEALTH_SHARD_DESTROY_SETTLE_MS', 180_000),
		reopenCooldownMs: parsePositiveIntEnv('HEALTH_SHARD_REOPEN_COOLDOWN_MS', 600_000),
		adminDmCooldownMs: parsePositiveIntEnv('HEALTH_ADMIN_DM_COOLDOWN_MS', 600_000),
		checkIntervalMs: parsePositiveIntEnv('HEALTH_SHARD_CHECK_INTERVAL_MS', 90_000),
		errorLogSummaryMs: parsePositiveIntEnv('HEALTH_ERROR_LOG_SUMMARY_MS', 600_000),
		coordinatorClusterId: parseNonNegativeIntEnv('HEALTH_COORDINATOR_CLUSTER_ID', 0),
		gatewayOutageWindowMs: parsePositiveIntEnv('HEALTH_GATEWAY_OUTAGE_WINDOW_MS', 90_000),
		gatewayOutageMinShards: parsePositiveIntEnv('HEALTH_GATEWAY_OUTAGE_MIN_SHARDS', 5),
		gatewayOutageMs: parsePositiveIntEnv('HEALTH_GATEWAY_OUTAGE_MS', 600_000),
		destroyRetryBackoffMs: parsePositiveIntEnv('HEALTH_DESTROY_RETRY_BACKOFF_MS', 600_000),
	};
}

function normalizeErrorPattern(message) {
	const text = String(message || 'unknown');
	const m = text.match(/Unexpected server response:\s*(\d+)/i);
	if (m) return `http_${m[1]}`;
	if (/502|503|504|520|521|522|523|524/.test(text)) return 'gateway_5xx';
	return text.slice(0, 80);
}

class HealthMonitor extends EventEmitter {
	constructor(options = {}) {
		super();
		this.config = options.config || loadHealthConfig();
		this.alerts = new Map();
		this.metrics = {
			startTime: new Date(),
			totalInteractions: 0,
			failedInteractions: 0,
			slowResponses: 0,
			clusterHealth: new Map(),
			lastHealthCheck: null,
			memoryHistory: [],
			mapSizes: {},
			connectionPoolUsage: null
		};
		this.alertThresholds = {
			maxFailedInteractions: 10,
			maxSlowResponses: 5,
			maxUnhealthyClusters: 2,
			alertCooldown: this.config.adminDmCooldownMs
		};

		/** @type {Map<number, object>} */
		this.shardIncidents = new Map();
		/** @type {Map<string, object>} */
		this.errorLogThrottle = new Map();
		/** @type {Map<number, number>} */
		this.reopenCooldownUntil = new Map();
		this.activeRecovery = null;
		this.coordinatorMode = false;
		this.gatewayOutageUntil = 0;
		this._gatewayOutageActive = false;

		if (options.skipInit) {
			return;
		}
		this.init();
	}

	init() {
		this.healthCheckInterval = timerManager.setInterval(() => this.performHealthCheck(), 60 * 1000);
		this.memoryMonitorInterval = timerManager.setInterval(() => this.collectMemoryMetrics(), 5 * 60 * 1000);
		this.on('interactionProcessed', this.handleInteractionProcessed.bind(this));
		this.on('clusterHealthChange', this.handleClusterHealthChange.bind(this));
		this.on('databaseError', this.handleDatabaseError.bind(this));
	}

	isCoordinator(clusterId) {
		return Number(clusterId) === Number(this.config.coordinatorClusterId);
	}

	enableCoordinatorMode() {
		this.coordinatorMode = true;
	}

	recordShardError({ shardId, clusterId, message, at = Date.now() } = {}) {
		const id = Number(shardId);
		const pattern = normalizeErrorPattern(message);
		const logDecision = this._throttleErrorLog(id, pattern, message, at);

		// Non-coordinator: throttle logs only; forward signal to Health Coordinator via IPC.
		if (!this.coordinatorMode) {
			return {
				...logDecision,
				shouldForwardToCoordinator: true,
				incident: null
			};
		}

		this._touchIncident(id, {
			clusterId: Number(clusterId),
			lastErrorAt: at,
			lastErrorMessage: String(message || ''),
			errorPattern: pattern,
			source: 'shardError'
		}, at);

		return {
			...logDecision,
			shouldForwardToCoordinator: false,
			incident: this.shardIncidents.get(id) || null
		};
	}

	recordShardDisconnect({ shardId, clusterId, at = Date.now() } = {}) {
		const id = Number(shardId);

		if (!this.coordinatorMode) {
			return {
				shouldForwardToCoordinator: true,
				incident: null
			};
		}

		this._touchIncident(id, {
			clusterId: Number(clusterId),
			lastDisconnectAt: at,
			source: 'shardDisconnect'
		}, at);
		return {
			shouldForwardToCoordinator: false,
			incident: this.shardIncidents.get(id) || null
		};
	}

	ingestRemoteShardReport(report = {}) {
		if (!this.coordinatorMode) return null;
		const at = report.at || Date.now();
		const kind = report.kind || 'error';
		if (kind === 'disconnect') {
			this._touchIncident(Number(report.shardId), {
				clusterId: Number(report.clusterId),
				lastDisconnectAt: at,
				source: 'ipc_disconnect'
			}, at);
			return this.shardIncidents.get(Number(report.shardId)) || null;
		}
		this._touchIncident(Number(report.shardId), {
			clusterId: Number(report.clusterId),
			lastErrorAt: at,
			lastErrorMessage: String(report.message || ''),
			errorPattern: normalizeErrorPattern(report.message),
			source: 'ipc_error'
		}, at);
		return this.shardIncidents.get(Number(report.shardId)) || null;
	}

	applyHealthSnapshot(shardDetails = [], at = Date.now()) {
		for (const row of shardDetails) {
			if (!row || !Number.isFinite(Number(row.shardId)) || Number(row.shardId) < 0) {
				continue;
			}
			const shardId = Number(row.shardId);
			const healthy = row.responsive === true;
			const incident = this.shardIncidents.get(shardId);

			if (!healthy) {
				this._touchIncident(shardId, {
					clusterId: row.clusterId === undefined ? incident?.clusterId : Number(row.clusterId),
					lastUnhealthyCheckAt: at,
					status: row.status,
					source: 'healthCheck'
				}, at);
				const open = this.shardIncidents.get(shardId);
				if (open) {
					open.consecutiveHealthyChecks = 0;
				}
				continue;
			}

			if (!incident) continue;
			incident.consecutiveHealthyChecks = (incident.consecutiveHealthyChecks || 0) + 1;
			incident.lastHealthyCheckAt = at;
			if (incident.consecutiveHealthyChecks >= 2 && incident.phase !== 'resolved') {
				this._resolveIncident(shardId, at, 'two_consecutive_healthy_checks');
			}
		}
	}

	_evaluateGatewayOutage(at = Date.now()) {
		const windowStart = at - this.config.gatewayOutageWindowMs;
		const recentShardIds = new Set();

		for (const incident of this.shardIncidents.values()) {
			if (incident.phase === 'resolved') continue;
			if (!incident.errorPattern || !GATEWAY_5XX_PATTERN.test(incident.errorPattern)) continue;
			if ((incident.lastErrorAt || 0) < windowStart) continue;
			recentShardIds.add(incident.shardId);
		}

		const wasInOutage = this._gatewayOutageActive && at < this.gatewayOutageUntil;

		if (recentShardIds.size >= this.config.gatewayOutageMinShards) {
			this.gatewayOutageUntil = at + this.config.gatewayOutageMs;
			if (!this._gatewayOutageActive) {
				console.warn(
					`[HealthMonitor] gatewayOutageMode=on shards=${recentShardIds.size} ` +
					`window=${this.config.gatewayOutageWindowMs}ms until=${this.gatewayOutageUntil}`
				);
				this._gatewayOutageActive = true;
			}
			return true;
		}

		if (wasInOutage) {
			return true;
		}

		if (this._gatewayOutageActive) {
			console.warn('[HealthMonitor] gatewayOutageMode=off');
			this._gatewayOutageActive = false;
			for (const incident of this.shardIncidents.values()) {
				if (incident.phase !== 'resolved') {
					incident.openedAt = at;
				}
			}
		}
		this.gatewayOutageUntil = 0;
		return false;
	}

	backoffIncidentRetry(shardId, at = Date.now(), ms = this.config.destroyRetryBackoffMs) {
		const incident = this.shardIncidents.get(Number(shardId));
		if (!incident || incident.phase === 'resolved') return;
		incident.phase = 'open';
		delete incident.destroyAt;
		this.reopenCooldownUntil.set(Number(shardId), at + ms);
		this.clearActiveRecovery(shardId);
	}

	noteRecoveryHealthy(shardId, at = Date.now()) {
		this._resolveIncident(Number(shardId), at, 'healthy_on_recheck');
	}

	tick(at = Date.now()) {
		if (!this.coordinatorMode) return null;

		if (this._evaluateGatewayOutage(at)) {
			return null;
		}

		if (this.activeRecovery) {
			const active = this.activeRecovery;
			const incident = this.shardIncidents.get(active.shardId);
			if (!incident || incident.phase === 'resolved') {
				this.activeRecovery = null;
			} else if (active.action === 'destroy' && incident.phase === 'waiting_settle') {
				if (at - (incident.destroyAt || active.startedAt) >= this.config.destroySettleMs) {
					if ((incident.consecutiveHealthyChecks || 0) >= 2) {
						this._resolveIncident(active.shardId, at, 'healthy_after_destroy');
						this.activeRecovery = null;
					} else {
						const reason = `still_unhealthy_after_destroy_settle_${this.config.destroySettleMs}ms`;
						incident.phase = 'recovering_respawn';
						incident.upgradeReason = reason;
						console.warn(
							`[HealthMonitor] clusterRespawn shard=${active.shardId} cluster=${incident.clusterId} reason=${reason}`
						);
						this.activeRecovery = {
							shardId: active.shardId,
							clusterId: incident.clusterId,
							action: 'clusterRespawn',
							startedAt: at,
							reason
						};
						// Escalation is a distinct Admin Alert; bypass periodic cooldown.
						this._emitShardAlert(incident, 'update', at, { force: true });
						this.emit('recoveryAction', { ...this.activeRecovery });
						return this.activeRecovery;
					}
				}
				return null;
			} else if (active.action === 'clusterRespawn') {
				return null;
			}
			return null;
		}

		const candidates = [...this.shardIncidents.values()]
			.filter((inc) => inc.phase === 'open' || inc.phase === 'unhealthy')
			.sort((a, b) => a.openedAt - b.openedAt);

		for (const incident of candidates) {
			const cooldownUntil = this.reopenCooldownUntil.get(incident.shardId) || 0;
			if (at < cooldownUntil) continue;
			if (at - incident.openedAt < this.config.recoveryMs) continue;

			const clusterBusy = [...this.shardIncidents.values()].some((other) =>
				other.shardId !== incident.shardId &&
				Number(other.clusterId) === Number(incident.clusterId) &&
				['recovering_destroy', 'waiting_settle', 'recovering_respawn'].includes(other.phase)
			);
			if (clusterBusy) continue;

			incident.phase = 'recovering_destroy';
			incident.destroyAt = at;
			this.activeRecovery = {
				shardId: incident.shardId,
				clusterId: incident.clusterId,
				action: 'destroy',
				startedAt: at,
				reason: `incident_open_for_${this.config.recoveryMs}ms`
			};
			// First Admin Alert only after sustained unhealthiness (recovery threshold).
			this._emitShardAlert(incident, 'open', at);
			this.emit('recoveryAction', { ...this.activeRecovery });
			incident.phase = 'waiting_settle';
			return this.activeRecovery;
		}

		for (const incident of this.shardIncidents.values()) {
			if (incident.phase === 'resolved') continue;
			// Do not DM while still waiting for recoveryMs (no open alert yet).
			if ((incident.adminAlertCount || 0) === 0) continue;
			this._emitShardAlert(incident, 'update', at);
		}

		return null;
	}

	markClusterRespawnSent(shardId, at = Date.now()) {
		const incident = this.shardIncidents.get(Number(shardId));
		if (!incident) return;
		incident.clusterRespawnAt = at;
		incident.phase = 'recovering_respawn';
	}

	clearActiveRecovery(shardId) {
		if (this.activeRecovery && this.activeRecovery.shardId === Number(shardId)) {
			this.activeRecovery = null;
		}
	}

	forceOpenIncidents(entries = [], at = Date.now()) {
		for (const entry of entries) {
			const shardId = typeof entry === 'number' ? entry : Number(entry.shardId);
			const clusterId = typeof entry === 'number' ? undefined : entry.clusterId;
			const existing = this.shardIncidents.get(shardId);
			if (existing && ['recovering_destroy', 'waiting_settle', 'recovering_respawn'].includes(existing.phase)) {
				continue;
			}
			this._touchIncident(shardId, {
				clusterId: clusterId === undefined ? existing?.clusterId : Number(clusterId),
				source: 'manual_fixshard'
			}, at);
			const incident = this.shardIncidents.get(shardId);
			if (incident) {
				incident.openedAt = at - this.config.recoveryMs;
				incident.phase = 'open';
			}
		}
	}

	getIncidentSnapshot() {
		return {
			activeRecovery: this.activeRecovery,
			incidents: [...this.shardIncidents.values()].map((inc) => ({ ...inc })),
			config: { ...this.config }
		};
	}

	_throttleErrorLog(shardId, pattern, message, at) {
		const key = `${shardId}:${pattern}`;
		const prev = this.errorLogThrottle.get(key);
		if (!prev) {
			this.errorLogThrottle.set(key, {
				shardId,
				pattern,
				count: 1,
				firstAt: at,
				lastAt: at,
				lastMessage: String(message || ''),
				lastSummaryAt: at
			});
			return { shouldLogFull: true, shouldLogSummary: false, suppressedCount: 0 };
		}

		prev.count += 1;
		prev.lastAt = at;
		prev.lastMessage = String(message || '');

		if (at - prev.lastSummaryAt >= this.config.errorLogSummaryMs) {
			const suppressedCount = prev.count - 1;
			prev.lastSummaryAt = at;
			prev.count = 1;
			return { shouldLogFull: false, shouldLogSummary: true, suppressedCount, pattern, shardId };
		}

		return { shouldLogFull: false, shouldLogSummary: false, suppressedCount: prev.count - 1 };
	}

	_touchIncident(shardId, patch, at) {
		const id = Number(shardId);
		if (!Number.isFinite(id) || id < 0) return;

		const cooldownUntil = this.reopenCooldownUntil.get(id) || 0;
		let incident = this.shardIncidents.get(id);

		if (!incident || incident.phase === 'resolved') {
			if (at < cooldownUntil) {
				return;
			}
			incident = {
				shardId: id,
				clusterId: patch.clusterId,
				phase: 'open',
				openedAt: at,
				consecutiveHealthyChecks: 0,
				lastAdminAlertAt: 0,
				adminAlertCount: 0
			};
			this.shardIncidents.set(id, incident);
			Object.assign(incident, patch);
			// Admin Alert deferred until recoveryMs / destroy start (sustained unhealthiness).
			return;
		}

		Object.assign(incident, patch);
		if (patch.clusterId !== undefined && Number.isFinite(Number(patch.clusterId))) {
			incident.clusterId = Number(patch.clusterId);
		}
	}

	_resolveIncident(shardId, at, reason) {
		const incident = this.shardIncidents.get(Number(shardId));
		if (!incident || incident.phase === 'resolved') return;
		incident.phase = 'resolved';
		incident.resolvedAt = at;
		incident.resolveReason = reason;
		this.reopenCooldownUntil.set(Number(shardId), at + this.config.reopenCooldownMs);
		this.clearActiveRecovery(shardId);
		// Skip resolved DM if Admin never got an open alert (transient blip).
		if ((incident.adminAlertCount || 0) > 0) {
			this._emitShardAlert(incident, 'resolved', at);
		}
		this.shardIncidents.delete(Number(shardId));
	}

	_emitShardAlert(incident, phase, at = Date.now(), options = {}) {
		const cooldownKey = `shardIncident:${incident.shardId}`;
		if (!options.force && phase !== 'resolved' && phase !== 'open') {
			const last = this.alerts.get(cooldownKey);
			if (last && (at - last.timestamp) < this.config.adminDmCooldownMs) {
				return;
			}
		}
		if (phase === 'open' && incident.adminAlertCount > 0) {
			return;
		}

		const alert = {
			type: 'shardIncident',
			phase,
			severity: 'critical',
			timestamp: at,
			data: {
				shardId: incident.shardId,
				clusterId: incident.clusterId,
				phase: incident.phase,
				openedAt: incident.openedAt,
				lastErrorMessage: incident.lastErrorMessage || null,
				upgradeReason: incident.upgradeReason || null,
				resolveReason: incident.resolveReason || null,
				activeRecovery: this.activeRecovery
			}
		};

		this.alerts.set(cooldownKey, { timestamp: at, alert });
		incident.lastAdminAlertAt = at;
		incident.adminAlertCount = (incident.adminAlertCount || 0) + 1;
		this.emit('alert', alert);
	}

	async performHealthCheck() {
		try {
			const healthReport = this.generateHealthReport();
			this.metrics.lastHealthCheck = new Date();
			await this.checkAlertConditions(healthReport);
			this.emit('healthReport', healthReport);
		} catch (error) {
			console.error('[HealthMonitor] Health check failed:', error);
		}
	}

	collectMemoryMetrics() {
		try {
			const memUsage = process.memoryUsage();
			const timestamp = Date.now();

			const memoryData = {
				timestamp,
				rss: Math.round(memUsage.rss / 1024 / 1024),
				heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
				heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
				external: Math.round(memUsage.external / 1024 / 1024)
			};

			this.metrics.memoryHistory.push(memoryData);
			if (this.metrics.memoryHistory.length > 100) {
				this.metrics.memoryHistory.shift();
			}

			try {
				const dbConnector = require('../db/connector.js');
				const mongoose = dbConnector.mongoose;
				if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
					this.metrics.connectionPoolUsage = {
						timestamp,
						readyState: mongoose.connection.readyState,
						host: mongoose.connection.host,
						name: mongoose.connection.name
					};
				}
			} catch {
				// Ignore if MongoDB connection info is not available
			}

			if (this.metrics.memoryHistory.length >= 10) {
				const recent = this.metrics.memoryHistory.slice(-10);
				const oldest = recent[0].rss;
				const newest = recent.at(-1).rss;
				const growth = newest - oldest;

				if (growth > 100) {
					this.raiseAlert('memoryGrowth', {
						growthMB: growth,
						currentRSS: newest,
						timeWindow: '50 minutes'
					});
				}
			}
		} catch (error) {
			console.error('[HealthMonitor] Memory metrics collection failed:', error);
		}
	}

	getMemoryReport() {
		const latest = this.metrics.memoryHistory.at(-1);
		const oldest = this.metrics.memoryHistory[0];

		return {
			current: latest || null,
			peak: this.metrics.memoryHistory.length > 0
				? this.metrics.memoryHistory.reduce((max, entry) => entry.rss > max.rss ? entry : max, this.metrics.memoryHistory[0])
				: null,
			trend: oldest && latest ? {
				rssChange: latest.rss - oldest.rss,
				heapUsedChange: latest.heapUsed - oldest.heapUsed,
				timeSpan: latest.timestamp - oldest.timestamp
			} : null,
			historyLength: this.metrics.memoryHistory.length,
			connectionPool: this.metrics.connectionPoolUsage
		};
	}

	handleInteractionProcessed(data) {
		this.metrics.totalInteractions++;

		if (data.success === false) {
			this.metrics.failedInteractions++;
		}

		if (data.duration > 5000) {
			this.metrics.slowResponses++;
		}

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

		const unhealthyClusters = [...this.metrics.clusterHealth.values()]
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
		if (healthReport.interactions.successRate < 90) {
			this.raiseAlert('highInteractionFailureRate', {
				failureRate: (100 - healthReport.interactions.successRate).toFixed(1) + '%',
				totalInteractions: healthReport.interactions.total,
				failedInteractions: healthReport.interactions.failed
			});
		}

		if (healthReport.database.status !== 'healthy') {
			this.raiseAlert('databaseError', {
				status: healthReport.database.status,
				circuitBreakerState: healthReport.database.circuitBreaker.state
			});
		}

		const unhealthyClusters = healthReport.clusters.unhealthy;
		if (unhealthyClusters > 0) {
			this.raiseAlert('multipleUnhealthyClusters', {
				unhealthyCount: unhealthyClusters,
				totalClusters: healthReport.clusters.total
			});
		}
	}

	raiseAlert(alertType, data, options = {}) {
		const lastAlert = this.alerts.get(alertType);
		const cooldown = options.cooldownMs ?? this.alertThresholds.alertCooldown;

		if (!options.force && lastAlert && (Date.now() - lastAlert.timestamp) < cooldown) {
			return;
		}

		const alert = {
			type: alertType,
			data,
			timestamp: Date.now(),
			severity: this.getAlertSeverity(alertType)
		};

		this.alerts.set(alertType, alert);
		this.emit('alert', alert);
	}

	getAlertSeverity(alertType) {
		const severityMap = {
			highInteractionFailureRate: 'critical',
			multipleUnhealthyClusters: 'warning',
			databaseError: 'critical',
			mongodbDisconnected: 'critical',
			memoryGrowth: 'warning',
			shardIncident: 'critical'
		};
		return severityMap[alertType] || 'info';
	}

	generateHealthReport() {
		const uptime = Date.now() - this.metrics.startTime.getTime();
		const dbHealth = dbWatchdog.getHealthReport();

		return {
			timestamp: new Date().toISOString(),
			uptime: Math.floor(uptime / 1000),
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
				unhealthy: [...this.metrics.clusterHealth.values()]
					.filter(c => c.status !== 'healthy').length,
				details: [...this.metrics.clusterHealth.entries()].map(([id, health]) => ({
					id,
					status: health.status,
					lastUpdate: health.lastUpdate,
					consecutiveFailures: health.consecutiveFailures
				}))
			},
			shardIncidents: this.getIncidentSnapshot(),
			database: dbHealth,
			alerts: {
				active: [...this.alerts.keys()],
				recent: [...this.alerts.values()].slice(-5)
			},
			system: {
				memory: process.memoryUsage(),
				memoryReport: this.getMemoryReport(),
				cpu: process.cpuUsage(),
				nodeVersion: process.version
			}
		};
	}

	getStatusSummary() {
		const report = this.generateHealthReport();
		const alerts = report.alerts.active.length;
		const criticalAlerts = report.alerts.recent.filter(a => a.severity === 'critical').length;

		let status = '🟢';
		if (criticalAlerts > 0) status = '🔴';
		else if (alerts > 0) status = '🟡';
		else if (report.database.status !== 'healthy') status = '🟠';

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

	cleanupOldAlerts() {
		const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
		for (const [key, alert] of this.alerts.entries()) {
			if (alert.timestamp < cutoffTime) {
				this.alerts.delete(key);
			}
		}
	}
}

const healthMonitor = new HealthMonitor();

timerManager.setInterval(() => healthMonitor.cleanupOldAlerts(), 60 * 60 * 1000);

module.exports = healthMonitor;
module.exports.HealthMonitor = HealthMonitor;
module.exports.loadHealthConfig = loadHealthConfig;
module.exports.isShardResponsive = isShardResponsive;
module.exports.normalizeErrorPattern = normalizeErrorPattern;
