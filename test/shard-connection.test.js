'use strict';

const { HealthMonitor } = require('../modules/runtime/health-monitor.js');
const {
	SHARD_STATUS,
	isShardResponsive,
	probeShardConnections,
	createMockShardMap,
	breakShardConnection,
	restoreShardConnection,
} = require('../modules/discord/shard-connection.js');

describe('shard-connection break / probe / restore', () => {
	it('probes all Ready shards as healthy', () => {
		const shards = createMockShardMap([0, 1, 2]);
		const report = probeShardConnections(shards, [0, 1, 2], { clusterId: 0 });
		expect(report.healthy).toBe(3);
		expect(report.unhealthy).toBe(0);
		expect(report.unresponsiveShardIds).toEqual([]);
		expect(report.shardDetails.every((d) => d.responsive)).toBe(true);
	});

	it('breakShardConnection makes probe report unhealthy', () => {
		const shards = createMockShardMap([25, 26, 27, 28, 29]);
		const { errorMessage } = breakShardConnection(shards.get(28), {
			message: 'Unexpected server response: 503',
		});

		expect(isShardResponsive(shards.get(28))).toBe(false);
		expect(shards.get(28).status).toBe(SHARD_STATUS.Disconnected);
		expect(errorMessage).toContain('503');

		const report = probeShardConnections(shards, [25, 26, 27, 28, 29], { clusterId: 5 });
		expect(report.healthy).toBe(4);
		expect(report.unhealthy).toBe(1);
		expect(report.unresponsiveShardIds).toEqual([28]);
		expect(report.shardDetails.find((d) => d.shardId === 28).responsive).toBe(false);
	});

	it('restoreShardConnection returns Ready and probe is healthy again', () => {
		const shards = createMockShardMap([16]);
		breakShardConnection(shards.get(16));
		expect(probeShardConnections(shards, [16]).unhealthy).toBe(1);

		restoreShardConnection(shards.get(16));
		expect(isShardResponsive(shards.get(16))).toBe(true);
		expect(probeShardConnections(shards, [16]).healthy).toBe(1);
	});

	it('missing shard IDs are unresponsive (never assumed healthy)', () => {
		const shards = createMockShardMap([0]);
		const report = probeShardConnections(shards, [0, 1], { clusterId: 0 });
		expect(report.shardDetails.find((d) => d.shardId === 1)).toMatchObject({
			status: 'missing',
			responsive: false,
		});
	});

	it('end-to-end: break → HealthMonitor incident → destroy → restore → resolved', () => {
		const hm = new HealthMonitor({
			skipInit: true,
			config: {
				recoveryMs: 1000,
				destroySettleMs: 60_000,
				reopenCooldownMs: 1000,
				adminDmCooldownMs: 1,
				checkIntervalMs: 1000,
				errorLogSummaryMs: 60_000,
				coordinatorClusterId: 0,
			},
		});
		hm.enableCoordinatorMode();

		const actions = [];
		const alerts = [];
		hm.on('recoveryAction', (a) => actions.push(a));
		hm.on('alert', (a) => alerts.push(a));

		const shards = createMockShardMap([28]);
		const clusterId = 5;
		const t0 = 2_000_000;

		const { errorMessage } = breakShardConnection(shards.get(28));
		hm.recordShardError({
			shardId: 28,
			clusterId,
			message: errorMessage,
			at: t0,
		});

		const brokenProbe = probeShardConnections(shards, [28], { clusterId });
		hm.applyHealthSnapshot(brokenProbe.shardDetails, t0 + 100);
		expect(hm.shardIncidents.has(28)).toBe(true);

		const destroyAction = hm.tick(t0 + 1000);
		expect(destroyAction).toMatchObject({ action: 'destroy', shardId: 28, clusterId });

		// Simulate recovery executor calling shard.destroy()
		shards.get(28).destroy();
		expect(shards.get(28).destroyCalls).toBe(1);
		expect(isShardResponsive(shards.get(28))).toBe(false);

		// Discord reconnect succeeds
		restoreShardConnection(shards.get(28));
		const healthyProbe = probeShardConnections(shards, [28], { clusterId });
		expect(healthyProbe.healthy).toBe(1);

		hm.applyHealthSnapshot(healthyProbe.shardDetails, t0 + 2000);
		hm.applyHealthSnapshot(healthyProbe.shardDetails, t0 + 3000);

		expect(hm.shardIncidents.has(28)).toBe(false);
		expect(alerts.some((a) => a.phase === 'open')).toBe(true);
		expect(alerts.some((a) => a.phase === 'resolved')).toBe(true);
		expect(actions).toHaveLength(1);
	});

	it('end-to-end: break stays down through settle → escalate clusterRespawn', () => {
		const hm = new HealthMonitor({
			skipInit: true,
			config: {
				recoveryMs: 500,
				destroySettleMs: 500,
				reopenCooldownMs: 10_000,
				adminDmCooldownMs: 1,
				checkIntervalMs: 1000,
				errorLogSummaryMs: 60_000,
				coordinatorClusterId: 0,
			},
		});
		hm.enableCoordinatorMode();
		const actions = [];
		hm.on('recoveryAction', (a) => actions.push(a));

		const shards = createMockShardMap([28]);
		const t0 = 3_000_000;
		const { errorMessage } = breakShardConnection(shards.get(28));
		hm.recordShardError({
			shardId: 28,
			clusterId: 5,
			message: errorMessage,
			at: t0,
		});
		hm.applyHealthSnapshot(
			probeShardConnections(shards, [28], { clusterId: 5 }).shardDetails,
			t0
		);

		expect(hm.tick(t0 + 500).action).toBe('destroy');
		shards.get(28).destroy();
		// Still broken after settle
		hm.applyHealthSnapshot(
			probeShardConnections(shards, [28], { clusterId: 5 }).shardDetails,
			t0 + 600
		);

		const escalate = hm.tick(t0 + 500 + 500);
		expect(escalate).toMatchObject({ action: 'clusterRespawn', shardId: 28 });
		expect(escalate.reason).toContain('still_unhealthy_after_destroy_settle');
		expect(actions.map((a) => a.action)).toEqual(['destroy', 'clusterRespawn']);
	});
});
