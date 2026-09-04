'use strict';

/**
 * Contract tests: hybrid-sharding broadcastEval passes the Discord Client as `c`.
 * The old bug used `c.client?.ws?.shards` and always saw missing shards → false destroy/respawn.
 */

const {
	SHARD_STATUS,
	createMockShardMap,
	breakShardConnection,
	probeClusterClientHealth,
	findClientShard,
	tryDestroyClientShard,
	resolveWsShards,
	probeShardConnections,
} = require('../modules/discord/shard-connection.js');

/** Shape of `c` inside client.cluster.broadcastEval(c => …) */
function createHybridBroadcastClient({ shardIds = [0], clusterId = 0 } = {}) {
	const shards = createMockShardMap(shardIds);
	return {
		ws: { shards },
		cluster: {
			id: clusterId,
			shardList: [...shardIds],
			shards,
		},
		// Deliberately no top-level `.client` — real Discord Client does not nest itself this way.
	};
}

/** Wrong accessor that caused production false positives */
function wrongProbeViaClientNest(c, shardIds) {
	const shards = c.client?.ws?.shards;
	return probeShardConnections(shards || { get: () => {} }, shardIds, {
		clusterId: c.cluster?.id || 0,
	});
}

describe('broadcastEval Discord Client shape (regression)', () => {
	it('probeClusterClientHealth sees Ready shards on hybrid Client (no .client nest)', () => {
		const c = createHybridBroadcastClient({ shardIds: [0], clusterId: 0 });
		expect(c.client).toBeUndefined();
		expect(resolveWsShards(c)).toBe(c.ws.shards);

		const details = probeClusterClientHealth(c, { totalShards: 1, shardsPerCluster: 1 });
		expect(details).toHaveLength(1);
		expect(details[0]).toMatchObject({
			shardId: 0,
			clusterId: 0,
			responsive: true,
			status: SHARD_STATUS.Ready,
		});
	});

	it('legacy c.client?.ws?.shards probe falsely marks healthy Client as missing', () => {
		const c = createHybridBroadcastClient({ shardIds: [0], clusterId: 0 });
		const wrong = wrongProbeViaClientNest(c, [0]);
		expect(wrong.healthy).toBe(0);
		expect(wrong.unhealthy).toBe(1);
		expect(wrong.shardDetails[0].status).toBe('missing');
		expect(wrong.shardDetails[0].responsive).toBe(false);

		const correct = probeClusterClientHealth(c, { totalShards: 1, shardsPerCluster: 1 });
		expect(correct[0].responsive).toBe(true);
	});

	it('uses cluster.shardList even when assigned range fallback would differ', () => {
		const c = createHybridBroadcastClient({ shardIds: [5, 6], clusterId: 1 });
		// fallback range for cluster 1 with per=5 total=60 would be 5..9; shardList wins.
		const details = probeClusterClientHealth(c, { totalShards: 60, shardsPerCluster: 5 });
		expect(details.map((d) => d.shardId)).toEqual([5, 6]);
		expect(details.every((d) => d.responsive)).toBe(true);
	});

	it('tryDestroyClientShard destroys on matching cluster; wrong nest finds nothing', () => {
		const c = createHybridBroadcastClient({ shardIds: [0], clusterId: 0 });
		const shard = findClientShard(c, 0);
		expect(shard).toBeTruthy();

		const nestedOnly = { client: { ws: { shards: c.ws.shards } }, cluster: { id: 0 } };
		expect(findClientShard(nestedOnly, 0)).toBeUndefined();
		expect(tryDestroyClientShard(nestedOnly, { shardId: 0, clusterId: 0 })).toBe(false);

		expect(tryDestroyClientShard(c, { shardId: 0, clusterId: 0 })).toBe(true);
		expect(shard.destroyCalls).toBe(1);
		expect(shard.status).toBe(SHARD_STATUS.Disconnected);
	});

	it('tryDestroyClientShard returns false for other cluster id', () => {
		const c = createHybridBroadcastClient({ shardIds: [0], clusterId: 0 });
		expect(tryDestroyClientShard(c, { shardId: 0, clusterId: 5 })).toBe(false);
		expect(c.ws.shards.get(0).destroyCalls).toBe(0);
	});

	it('probeClusterClientHealth reports broken shard as unresponsive', () => {
		const c = createHybridBroadcastClient({ shardIds: [0, 1], clusterId: 0 });
		breakShardConnection(c.ws.shards.get(1), { message: 'Unexpected server response: 503' });
		const details = probeClusterClientHealth(c, { totalShards: 2, shardsPerCluster: 2 });
		expect(details.find((d) => d.shardId === 0).responsive).toBe(true);
		expect(details.find((d) => d.shardId === 1).responsive).toBe(false);
	});
});
