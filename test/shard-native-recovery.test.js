'use strict';

const { HealthMonitor, loadHealthConfig } = require('../modules/runtime/health-monitor');

function observingMonitor(overrides = {}) {
    const monitor = new HealthMonitor({ skipInit: true, config: { ...loadHealthConfig(),
        recoveryMs: 180_000, destroySettleMs: 180_000, checkIntervalMs: 90_000, ...overrides } });
    monitor.enableCoordinatorMode();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 1000);
    expect(monitor.tick(181_000).action).toBe('destroy');
    monitor.observeNativeRecovery({ ...monitor.activeRecovery }, 181_000);
    return monitor;
}

test('native recovery after 90 seconds resolves without cluster restart', () => {
    const monitor = observingMonitor();
    const actions = [];
    monitor.on('recoveryAction', action => actions.push(action));
    expect(monitor.activeRecovery.action).toBe('observe');
    expect(monitor.shardIncidents.get(5).destroyAt).toBeUndefined();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 0, responsive: true }], 271_000);
    expect(monitor.tick(271_000)).toBeNull();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 0, responsive: true }], 361_000);
    expect(monitor.tick(361_000)).toBeNull();
    expect(monitor.shardIncidents.has(5)).toBe(false);
    expect(actions).toEqual([]);
});

test('observation deadline alone cannot escalate without fresh evidence', () => {
    const monitor = observingMonitor();
    expect(monitor.tick(361_000)).toBeNull();
    for (const status of ['unknown', 'missing', 'error']) {
        monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status, responsive: false }], 361_000);
        expect(monitor.tick(361_000)).toBeNull();
        expect(monitor.activeRecovery.action).toBe('observe');
        expect(monitor.shardIncidents.get(5).phase).toBe('waiting_settle');
        expect(monitor.reopenCooldownUntil.has(5)).toBe(false);
    }
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 361_000);
    expect(monitor.tick(451_001)).toBeNull();
});

test('fresh unhealthy check after observation window permits escalation', () => {
    const monitor = observingMonitor();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 360_999);
    expect(monitor.tick(360_999)).toBeNull();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 361_000);
    expect(monitor.tick(361_000)).toMatchObject({ action: 'clusterRespawn',
        reason: 'still_unhealthy_after_observation_180000ms' });
});

test('a newer healthy sample blocks escalation while awaiting second confirmation', () => {
    const monitor = observingMonitor();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 361_000);
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 0, responsive: true }], 361_001);
    expect(monitor.tick(361_002)).toBeNull();
});

test.each([1, 7])('inconclusive observation releases global and cluster locks for cluster %s', clusterId => {
    const monitor = observingMonitor();
    const diagnostics = [];
    monitor.on('recoveryDiagnostic', event => diagnostics.push(event));
    monitor.applyHealthSnapshot([
        { shardId: 5, clusterId: 1, status: 'unknown', responsive: false },
        { shardId: 6, clusterId, status: 2, responsive: false },
    ], 200_000);
    const next = monitor.tick(541_000);
    expect(next).toMatchObject({ shardId: 6, action: 'destroy' });
    expect(monitor.shardIncidents.get(5)).toMatchObject({ phase: 'open',
        lastRecoveryOutcome: 'observation_inconclusive' });
    expect(monitor.reopenCooldownUntil.get(5)).toBeGreaterThan(541_000);
    expect(diagnostics).toHaveLength(1);
});

test('expired observation releases the slot even during a gateway outage', () => {
    const monitor = observingMonitor();
    monitor._gatewayOutageActive = true;
    monitor.gatewayOutageUntil = 900_000;
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 541_000);
    expect(monitor.tick(541_000)).toBeNull();
    expect(monitor.activeRecovery).toBeNull();
    expect(monitor.shardIncidents.get(5).phase).toBe('open');
});

test.each([541_000, 550_000])('fresh evidence on deadline tick %s escalates instead of backing off', at => {
    const monitor = observingMonitor();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], at);
    expect(monitor.tick(at)).toMatchObject({ action: 'clusterRespawn', shardId: 5 });
    expect(monitor.shardIncidents.get(5).lastRecoveryOutcome).toBeUndefined();
    expect(monitor.reopenCooldownUntil.has(5)).toBe(false);
});

test.each([180_000, 1])('maximum %s clamped to settle accepts evidence at the boundary', observationMaxMs => {
    const monitor = observingMonitor({ observationMaxMs });
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 2, responsive: false }], 361_000);
    expect(monitor.tick(361_000)).toMatchObject({ action: 'clusterRespawn' });
});

test.each(['unknown', 'missing', 'error', 'stale'])('deadline without conclusive evidence (%s) releases', status => {
    const monitor = observingMonitor();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1,
        status: status === 'stale' ? 2 : status, responsive: false }], status === 'stale' ? 400_000 : 541_000);
    expect(monitor.tick(541_000)).toBeNull();
    expect(monitor.activeRecovery).toBeNull();
    expect(monitor.shardIncidents.get(5).lastRecoveryOutcome).toBe('observation_inconclusive');
});

test('only one healthy sample at deadline is inconclusive, not resolved or escalated', () => {
    const monitor = observingMonitor();
    monitor.applyHealthSnapshot([{ shardId: 5, clusterId: 1, status: 0, responsive: true }], 541_000);
    expect(monitor.tick(541_000)).toBeNull();
    expect(monitor.activeRecovery).toBeNull();
    expect(monitor.shardIncidents.get(5)).toMatchObject({ phase: 'open', lastRecoveryOutcome: 'observation_inconclusive' });
});

test.each([false, true])('tick alone prioritizes two healthy checks over expiry, outage=%s', outage => {
    const monitor = observingMonitor();
    monitor.shardIncidents.get(5).consecutiveHealthyChecks = 2;
    monitor._gatewayOutageActive = outage;
    monitor.gatewayOutageUntil = outage ? 900_000 : 0;
    const events = [];
    monitor.on('recoveryDiagnostic', event => events.push(event));
    expect(monitor.tick(541_000)).toBeNull();
    expect(monitor.shardIncidents.has(5)).toBe(false);
    expect(events).toEqual([]);
});

test('late unsupported result cannot replace an already escalated action', () => {
    const monitor = new HealthMonitor({ skipInit: true, config: loadHealthConfig() });
    monitor.enableCoordinatorMode();
    monitor.recordShardError({ shardId: 5, clusterId: 1, message: 'network', at: 1000 });
    const oldAction = { ...monitor.tick(181_000) };
    const escalation = monitor.tick(361_000);
    expect(escalation.action).toBe('clusterRespawn');
    expect(monitor.observeNativeRecovery(oldAction, 361_001)).toBe(false);
    expect(monitor.activeRecovery).toEqual(escalation);
    expect(monitor.isCurrentRecovery(oldAction)).toBe(false);
});

test('previous generation cannot change a new destroy attempt for the same shard', () => {
    const monitor = new HealthMonitor({ skipInit: true, config: loadHealthConfig() });
    monitor.enableCoordinatorMode();
    monitor.recordShardError({ shardId: 5, clusterId: 1, message: 'network', at: 1000 });
    const oldAction = { ...monitor.tick(181_000) };
    monitor.backoffIncidentRetry(5, 181_001, 1);
    const newAction = { ...monitor.tick(181_002) };
    expect(newAction.recoveryId).not.toBe(oldAction.recoveryId);
    expect(monitor.isCurrentRecovery(oldAction)).toBe(false);
    expect(monitor.observeNativeRecovery(oldAction, 181_003)).toBe(false);
    expect(monitor.activeRecovery).toEqual(newAction);
    expect(monitor.observeNativeRecovery(newAction, 181_003)).toBe(true);
    expect(monitor.observeNativeRecovery(newAction, 181_004)).toBe(false);
});
