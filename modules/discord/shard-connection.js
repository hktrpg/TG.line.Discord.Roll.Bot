'use strict';

/**
 * Shard WebSocket connection helpers for health checks and tests.
 * discord.js WebSocketShard.Status: Ready=0, Disconnected=5, …
 */

const SHARD_STATUS = {
	Ready: 0,
	Connecting: 1,
	Reconnecting: 2,
	Idle: 3,
	Nearly: 4,
	Disconnected: 5,
	WaitingForGuilds: 6,
	Identifying: 7,
	Resuming: 8,
};

/**
 * @param {object|null|undefined} shardLike
 * @returns {boolean}
 */
function isShardResponsive(shardLike) {
	if (!shardLike) return false;
	const status = shardLike.status;
	return status === SHARD_STATUS.Ready || status === 'ready';
}

/**
 * Resolve WebSocketShard collection from a Discord Client (broadcastEval `c`).
 * Prefer client.ws.shards; hybrid-sharding also exposes client.cluster.shards.
 * @param {object|null|undefined} client
 * @returns {{ get: (id: number) => object|undefined }|null}
 */
function resolveWsShards(client) {
	if (!client) return null;
	return client.ws?.shards ?? client.cluster?.shards ?? null;
}

/**
 * Shard IDs owned by this cluster client.
 * @param {object|null|undefined} client
 * @param {number[]} [fallbackIds]
 * @returns {number[]}
 */
function resolveShardList(client, fallbackIds = []) {
	const fromCluster = client?.cluster?.shardList;
	if (Array.isArray(fromCluster) && fromCluster.length > 0) {
		return fromCluster.map(Number).filter((id) => Number.isFinite(id) && id >= 0);
	}
	const fromInfo = client?.info?.SHARD_LIST;
	if (Array.isArray(fromInfo) && fromInfo.length > 0) {
		return fromInfo.map(Number).filter((id) => Number.isFinite(id) && id >= 0);
	}
	return fallbackIds;
}

/**
 * Probe a list of shard IDs against a Map/Collection getter.
 * @param {{ get: (id: number) => object|undefined }} shards
 * @param {number[]} shardIds
 * @param {{ clusterId?: number }} [options]
 */
function probeShardConnections(shards, shardIds, options = {}) {
	const clusterId = options.clusterId ?? 0;
	const details = [];
	for (const shardId of shardIds) {
		const id = Number(shardId);
		const shard = shards?.get?.(id) ?? shards?.get?.(shardId);
		const responsive = isShardResponsive(shard);
		details.push({
			clusterId,
			shardId: id,
			status: shard ? (shard.status ?? 'unknown') : 'missing',
			ping: typeof shard?.ping === 'number' ? shard.ping : -1,
			ready: Boolean(shard?.readyTimestamp),
			responsive,
		});
	}
	return {
		timestamp: new Date().toISOString(),
		total: details.length,
		healthy: details.filter((d) => d.responsive).length,
		unhealthy: details.filter((d) => !d.responsive).length,
		unresponsiveShardIds: details.filter((d) => !d.responsive).map((d) => d.shardId),
		shardDetails: details,
	};
}

/**
 * Computed shard id range for a cluster (fallback when shardList unavailable).
 * @param {number} clusterId
 * @param {number} totalShards
 * @param {number} shardsPerCluster
 * @returns {number[]}
 */
function assignedShardRange(clusterId, totalShards, shardsPerCluster) {
	const id = Number(clusterId) || 0;
	const total = Number(totalShards) || 0;
	const per = Number(shardsPerCluster) || 0;
	if (total <= 0 || per <= 0) return [];
	const startShard = id * per;
	const endShard = Math.min((id + 1) * per, total);
	const ids = [];
	for (let i = startShard; i < endShard; i++) {
		ids.push(i);
	}
	return ids;
}

/**
 * Probe shard health for one Discord Client as seen inside broadcastEval(`c`).
 * Must use Client shape (`c.ws.shards`), never `c.client.ws` (that path caused false unhealthies).
 *
 * @param {object} client Discord Client (hybrid-sharding broadcastEval argument)
 * @param {{ totalShards: number, shardsPerCluster: number }} options
 * @returns {object[]} shardDetails rows
 */
function probeClusterClientHealth(client, options = {}) {
	const totalShards = options.totalShards;
	const shardsPerCluster = options.shardsPerCluster;
	const clusterId = Number(client?.cluster?.id) || 0;
	const fallbackIds = assignedShardRange(clusterId, totalShards, shardsPerCluster);
	const shardsToCheck = resolveShardList(client, fallbackIds);
	const shards = resolveWsShards(client);
	if (!shards) {
		return probeShardConnections({ get: () => {} }, shardsToCheck, { clusterId }).shardDetails;
	}
	return probeShardConnections(shards, shardsToCheck, { clusterId }).shardDetails;
}

/**
 * Find a WebSocketShard on a Discord Client (broadcastEval `c`).
 * @param {object} client
 * @param {number|string} shardId
 * @returns {object|undefined}
 */
function findClientShard(client, shardId) {
	const shards = resolveWsShards(client);
	if (!shards) return;
	return shards.get?.(Number(shardId)) ?? shards.get?.(shardId);
}

/**
 * Destroy one shard on a Client if this cluster owns it.
 * @param {object} client
 * @param {{ shardId: number, clusterId: number, reason?: string }} data
 * @returns {boolean} true if destroy() was called
 */
function tryDestroyClientShard(client, data = {}) {
	if (Number(client?.cluster?.id) !== Number(data.clusterId)) return false;
	const shard = findClientShard(client, data.shardId);
	if (!shard || typeof shard.destroy !== 'function') return false;
	shard.destroy();
	return true;
}

/**
 * Test double: mutable fake WebSocketShard.
 * @param {{ id: number, status?: number|string, ping?: number }} opts
 */
function createMockShard({ id, status = SHARD_STATUS.Ready, ping = 42 } = {}) {
	const ready = status === SHARD_STATUS.Ready || status === 'ready';
	return {
		id,
		status,
		ping,
		readyTimestamp: ready ? Date.now() : null,
		destroyCalls: 0,
		destroy() {
			this.destroyCalls += 1;
			this.status = SHARD_STATUS.Disconnected;
			this.readyTimestamp = null;
		},
	};
}

/**
 * Break a mock (or real-shaped) shard connection for tests.
 * @param {object} shard
 * @param {{ status?: number, message?: string }} [opts]
 * @returns {{ shard: object, errorMessage: string }}
 */
function breakShardConnection(shard, opts = {}) {
	if (!shard) {
		throw new TypeError('breakShardConnection requires a shard');
	}
	const status = opts.status ?? SHARD_STATUS.Disconnected;
	shard.status = status;
	shard.readyTimestamp = null;
	const errorMessage = opts.message || 'Unexpected server response: 503';
	return { shard, errorMessage };
}

/**
 * Restore a mock shard to Ready (simulates successful reconnect).
 * @param {object} shard
 */
function restoreShardConnection(shard) {
	if (!shard) {
		throw new TypeError('restoreShardConnection requires a shard');
	}
	shard.status = SHARD_STATUS.Ready;
	shard.readyTimestamp = Date.now();
	return shard;
}

/**
 * Build a Map of mock shards for assigned IDs (all Ready by default).
 * @param {number[]} shardIds
 */
function createMockShardMap(shardIds) {
	const map = new Map();
	for (const id of shardIds) {
		map.set(id, createMockShard({ id }));
	}
	return map;
}

module.exports = {
	SHARD_STATUS,
	isShardResponsive,
	resolveWsShards,
	resolveShardList,
	assignedShardRange,
	probeShardConnections,
	probeClusterClientHealth,
	findClientShard,
	tryDestroyClientShard,
	createMockShard,
	createMockShardMap,
	breakShardConnection,
	restoreShardConnection,
};
