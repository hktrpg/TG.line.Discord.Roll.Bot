'use strict';

const { getInfo } = require('discord-hybrid-sharding');

/**
 * Total cluster count from hybrid-sharding client (not cluster.ids.size).
 * @param {object|null|undefined} client
 * @returns {number}
 */
function getTotalClusterCount(client) {
	if (!client?.cluster) return 0;
	if (typeof client.cluster.count === 'number') return client.cluster.count;
	try {
		const info = getInfo();
		if (typeof info?.CLUSTER_COUNT === 'number') return info.CLUSTER_COUNT;
	} catch {
		/* ignore */
	}
	return 0;
}

/**
 * Resolve total shard topology without guessing (no clusterCount * 3).
 * @param {object|null|undefined} client
 * @returns {{ totalShards: number, clusterCount: number, shardsPerCluster: number }|null}
 */
function resolveShardTopology(client) {
	let totalShards;
	const clusterCount = getTotalClusterCount(client) || 0;

	try {
		const info = getInfo();
		if (info?.TOTAL_SHARDS) {
			totalShards = info.TOTAL_SHARDS;
			if (totalShards < clusterCount && clusterCount > 1) {
				totalShards = undefined;
			}
		}

		if (!totalShards && client?.cluster?.manager) {
			const managerTotalShards = client.cluster.manager.totalShards;
			if (managerTotalShards && managerTotalShards !== 'auto') {
				totalShards = Number.parseInt(managerTotalShards, 10);
			}
		}

		if (!totalShards && client?.cluster?.clusters) {
			let calculatedTotal = 0;
			for (const cluster of client.cluster.clusters.values()) {
				if (cluster.shards) {
					calculatedTotal += cluster.shards.size || 0;
				}
			}
			if (calculatedTotal > 0) {
				totalShards = calculatedTotal;
			}
		}
	} catch {
		/* ignore */
	}

	if (!totalShards || !Number.isFinite(totalShards) || totalShards <= 0) {
		return null;
	}

	const effectiveClusterCount = clusterCount > 0 ? clusterCount : 1;
	const shardsPerCluster = Math.ceil(totalShards / effectiveClusterCount);

	return {
		totalShards,
		clusterCount: effectiveClusterCount,
		shardsPerCluster,
	};
}

module.exports = {
	getTotalClusterCount,
	resolveShardTopology,
};
