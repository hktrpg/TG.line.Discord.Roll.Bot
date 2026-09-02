"use strict";

const {
	HealthMonitor,
	isShardResponsive,
	normalizeErrorPattern,
} = require('../modules/runtime/health-monitor.js');

describe('health-monitor shard recovery', () => {
	function createMonitor(overrides = {}) {
		return new HealthMonitor({
			skipInit: true,
			config: {
				recoveryMs: 180_000,
				destroySettleMs: 180_000,
				reopenCooldownMs: 600_000,
				adminDmCooldownMs: 600_000,
				checkIntervalMs: 90_000,
				errorLogSummaryMs: 600_000,
				coordinatorClusterId: 0,
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

	it('resolves after two consecutive healthy checks and emits resolved alert', () => {
		const hm = createMonitor({ adminDmCooldownMs: 1 });
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

		hm.applyHealthSnapshot([{ shardId: 16, clusterId: 3, status: 0, responsive: true }], t0 + 1000);
		expect(hm.shardIncidents.has(16)).toBe(true);

		hm.applyHealthSnapshot([{ shardId: 16, clusterId: 3, status: 0, responsive: true }], t0 + 2000);
		expect(hm.shardIncidents.has(16)).toBe(false);

		const resolved = alerts.filter((a) => a.type === 'shardIncident' && a.phase === 'resolved');
		expect(resolved.length).toBe(1);
		expect(resolved[0].data.resolveReason).toBe('two_consecutive_healthy_checks');
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
});
