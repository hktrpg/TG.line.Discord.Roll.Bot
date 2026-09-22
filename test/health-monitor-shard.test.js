"use strict";

const {
	HealthMonitor,
	isShardResponsive,
	normalizeErrorPattern,
	loadHealthConfig,
} = require('../modules/runtime/health-monitor.js');

describe('health-monitor shard recovery', () => {
	function createMonitor(overrides = {}) {
		return new HealthMonitor({
			skipInit: true,
			config: {
				...loadHealthConfig(),
				...overrides,
			},
		});
	}

	it('isShardResponsive only accepts Ready (0 / ready)', () => {
		expect(isShardResponsive(null)).toBe(false);
		expect(isShardResponsive({ status: 0 })).toBe(true);
		expect(isShardResponsive({ status: 'ready' })).toBe(true);
		expect(isShardResponsive({ status: 5 })).toBe(false);
		expect(isShardResponsive({ status: 'unknown' })).toBe(false);
	});

	it('normalizeErrorPattern groups Unexpected server response 503', () => {
		expect(normalizeErrorPattern('Unexpected server response: 503')).toBe('http_503');
	});

	it('throttles 503 storm logs: first full, then summary after window', () => {
		const hm = createMonitor({ errorLogSummaryMs: 10_000 });
		hm.enableCoordinatorMode();
		const t0 = 1_000_000;
		const first = hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0,
		});
		expect(first.shouldLogFull).toBe(true);

		const mid = hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0 + 1000,
		});
		expect(mid.shouldLogFull).toBe(false);
		expect(mid.shouldLogSummary).toBe(false);

		const summary = hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0 + 10_000,
		});
		expect(summary.shouldLogSummary).toBe(true);
		expect(summary.suppressedCount).toBeGreaterThan(0);
	});

	it('non-coordinator only forwards; coordinator opens incident', () => {
		const local = createMonitor();
		const r = local.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
		});
		expect(r.shouldForwardToCoordinator).toBe(true);
		expect(local.shardIncidents.size).toBe(0);

		const coord = createMonitor();
		coord.enableCoordinatorMode();
		coord.ingestRemoteShardReport({
			kind: 'error',
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: 1_000_000,
		});
		expect(coord.shardIncidents.has(28)).toBe(true);
	});

	it('emits destroy after T1, then clusterRespawn after T2 with upgrade reason', () => {
		const hm = createMonitor({
			recoveryMs: 3000,
			destroySettleMs: 3000,
			adminDmCooldownMs: 1,
		});
		hm.enableCoordinatorMode();
		const actions = [];
		hm.on('recoveryAction', (a) => actions.push(a));

		const t0 = 1_000_000;
		hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0,
		});

		expect(hm.tick(t0 + 2999)).toBeNull();
		const destroy = hm.tick(t0 + 3000);
		expect(destroy).toMatchObject({ action: 'destroy', shardId: 28, clusterId: 5 });

		const escalate = hm.tick(t0 + 3000 + 3000);
		expect(escalate).toMatchObject({ action: 'clusterRespawn', shardId: 28 });
		expect(escalate.reason).toContain('still_unhealthy_after_destroy_settle');
		expect(actions).toHaveLength(2);
	});

	it('defers Admin open alert until recovery starts; skips resolved if never alerted', () => {
		const hm = createMonitor({ recoveryMs: 5000, adminDmCooldownMs: 1 });
		hm.enableCoordinatorMode();
		const alerts = [];
		hm.on('alert', (a) => alerts.push(a));

		const t0 = 1_000_000;
		hm.recordShardError({
			shardId: 16,
			clusterId: 3,
			message: 'Unexpected server response: 503',
			at: t0,
		});
		expect(hm.shardIncidents.has(16)).toBe(true);
		expect(alerts).toHaveLength(0);

		hm.tick(t0 + 1000);
		expect(alerts).toHaveLength(0);

		hm.applyHealthSnapshot([{ shardId: 16, clusterId: 3, status: 0, responsive: true }], t0 + 2000);
		hm.applyHealthSnapshot([{ shardId: 16, clusterId: 3, status: 0, responsive: true }], t0 + 3000);
		expect(hm.shardIncidents.has(16)).toBe(false);
		expect(alerts).toHaveLength(0);
	});

	it('emits open Admin alert when destroy starts after recoveryMs', () => {
		const hm = createMonitor({
			recoveryMs: 3000,
			destroySettleMs: 60_000,
			adminDmCooldownMs: 1,
		});
		hm.enableCoordinatorMode();
		const alerts = [];
		hm.on('alert', (a) => alerts.push(a));

		const t0 = 1_000_000;
		hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0,
		});

		expect(hm.tick(t0 + 2999)).toBeNull();
		expect(alerts).toHaveLength(0);

		const destroy = hm.tick(t0 + 3000);
		expect(destroy).toMatchObject({ action: 'destroy', shardId: 28 });
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toMatchObject({ type: 'shardIncident', phase: 'open' });
	});

	it('resolves after two consecutive healthy checks and emits resolved if Admin was alerted', () => {
		const hm = createMonitor({ recoveryMs: 1000, adminDmCooldownMs: 1 });
		hm.enableCoordinatorMode();
		const alerts = [];
		hm.on('alert', (a) => alerts.push(a));

		const t0 = 1_000_000;
		hm.recordShardError({
			shardId: 16,
			clusterId: 3,
			message: 'Unexpected server response: 503',
			at: t0,
		});

		hm.tick(t0 + 1000);
		expect(alerts.some((a) => a.phase === 'open')).toBe(true);

		hm.applyHealthSnapshot([{ shardId: 16, clusterId: 3, status: 0, responsive: true }], t0 + 2000);
		expect(hm.shardIncidents.has(16)).toBe(true);

		hm.applyHealthSnapshot([{ shardId: 16, clusterId: 3, status: 0, responsive: true }], t0 + 3000);
		expect(hm.shardIncidents.has(16)).toBe(false);

		const resolved = alerts.filter((a) => a.type === 'shardIncident' && a.phase === 'resolved');
		expect(resolved.length).toBe(1);
		expect(resolved[0].data.resolveReason).toBe('two_consecutive_healthy_checks');
	});

	it('gatewayOutageMode skips recovery when >=5 shards report 503 via IPC', () => {
		const hm = createMonitor({
			recoveryMs: 1000,
			gatewayOutageWindowMs: 90_000,
			gatewayOutageMinShards: 5,
			gatewayOutageMs: 600_000,
		});
		hm.enableCoordinatorMode();
		const actions = [];
		const alerts = [];
		hm.on('recoveryAction', (a) => actions.push(a));
		hm.on('alert', (a) => alerts.push(a));

		const t0 = 1_000_000;
		const tickAt = t0 + 5000;
		for (let shardId = 0; shardId < 5; shardId++) {
			hm.ingestRemoteShardReport({
				kind: 'error',
				shardId,
				clusterId: 0,
				message: 'Unexpected server response: 503',
				at: tickAt - 1000,
			});
		}
		for (const incident of hm.shardIncidents.values()) {
			incident.openedAt = tickAt - 200_000;
		}

		expect(hm.tick(tickAt)).toBeNull();
		expect(actions).toHaveLength(0);
		expect(alerts).toHaveLength(0);
		expect(hm._gatewayOutageActive).toBe(true);
	});

	it('rolling outage extends gatewayOutageUntil while 503 continues', () => {
		const hm = createMonitor({
			gatewayOutageWindowMs: 90_000,
			gatewayOutageMinShards: 5,
			gatewayOutageMs: 60_000,
		});
		hm.enableCoordinatorMode();

		const t0 = 1_000_000;
		for (let shardId = 0; shardId < 5; shardId++) {
			hm.ingestRemoteShardReport({
				kind: 'error',
				shardId,
				clusterId: 0,
				message: 'Unexpected server response: 503',
				at: t0,
			});
		}
		hm.tick(t0);
		const firstUntil = hm.gatewayOutageUntil;

		hm.ingestRemoteShardReport({
			kind: 'error',
			shardId: 0,
			clusterId: 0,
			message: 'Unexpected server response: 503',
			at: t0 + 30_000,
		});
		hm.tick(t0 + 30_000);
		expect(hm.gatewayOutageUntil).toBeGreaterThan(firstUntil);
	});

	it('backoffIncidentRetry prevents tick selection until cooldown expires', () => {
		const hm = createMonitor({
			recoveryMs: 1000,
			destroyRetryBackoffMs: 600_000,
		});
		hm.enableCoordinatorMode();
		const t0 = 1_000_000;

		hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0,
		});
		expect(hm.tick(t0 + 1000)).toMatchObject({ action: 'destroy' });
		hm.backoffIncidentRetry(28, t0 + 1001);

		expect(hm.shardIncidents.get(28).phase).toBe('open');
		expect(hm.activeRecovery).toBeNull();
		expect(hm.tick(t0 + 2000)).toBeNull();
	});

	it('backoffIncidentRetry resets waiting_settle after failed destroy', () => {
		const hm = createMonitor({ recoveryMs: 1000 });
		hm.enableCoordinatorMode();
		const t0 = 1_000_000;

		hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: 'Unexpected server response: 503',
			at: t0,
		});
		hm.tick(t0 + 1000);
		expect(hm.shardIncidents.get(28).phase).toBe('waiting_settle');

		hm.backoffIncidentRetry(28, t0 + 1001);
		expect(hm.shardIncidents.get(28).phase).toBe('open');
		expect(hm.activeRecovery).toBeNull();
	});

	it('applyHealthSnapshot still resolves incidents during gateway outage', () => {
		const hm = createMonitor({
			recoveryMs: 1000,
			gatewayOutageMinShards: 5,
		});
		hm.enableCoordinatorMode();
		const t0 = 1_000_000;

		for (let shardId = 0; shardId < 5; shardId++) {
			hm.ingestRemoteShardReport({
				kind: 'error',
				shardId,
				clusterId: 0,
				message: 'Unexpected server response: 503',
				at: t0,
			});
		}
		hm.tick(t0);
		expect(hm._gatewayOutageActive).toBe(true);

		hm.applyHealthSnapshot([{ shardId: 0, clusterId: 0, status: 0, responsive: true }], t0 + 1000);
		hm.applyHealthSnapshot([{ shardId: 0, clusterId: 0, status: 0, responsive: true }], t0 + 2000);
		expect(hm.shardIncidents.has(0)).toBe(false);
	});

	it('does not start a second destroy on the same cluster while recovery is active', () => {
		const hm = createMonitor({ recoveryMs: 1000, destroySettleMs: 60_000 });
		hm.enableCoordinatorMode();
		const t0 = 1_000_000;

		hm.recordShardError({ shardId: 25, clusterId: 5, message: '503', at: t0 });
		hm.recordShardError({ shardId: 26, clusterId: 5, message: '503', at: t0 });

		const first = hm.tick(t0 + 1000);
		expect(first.shardId).toBe(25);

		const second = hm.tick(t0 + 2000);
		expect(second).toBeNull();
		expect(hm.shardIncidents.get(26).phase).toBe('open');
	});

	it('healthy recheck resolves the incident instead of applying failure backoff', () => {
		const hm = createMonitor({ reopenCooldownMs: 1000, destroyRetryBackoffMs: 600_000 });
		hm.enableCoordinatorMode();
		hm.forceOpenIncidents([{ shardId: 3, clusterId: 1 }], 10_000);
		hm.activeRecovery = { shardId: 3, action: 'destroy' };
		hm.noteRecoveryHealthy(3, 11_000);
		expect(hm.shardIncidents.has(3)).toBe(false);
		expect(hm.activeRecovery).toBeNull();
		expect(hm.reopenCooldownUntil.get(3)).toBe(12_000);
	});
});
