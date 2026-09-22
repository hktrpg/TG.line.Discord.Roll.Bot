'use strict';

jest.mock('discord-hybrid-sharding', () => ({
	getInfo: jest.fn(() => ({})),
}));

const { resolveShardTopology, getTotalClusterCount } = require('../modules/discord/shard-topology.js');

describe('shard-topology', () => {
	it('getTotalClusterCount prefers cluster.count', () => {
		expect(getTotalClusterCount({ cluster: { count: 12 } })).toBe(12);
		expect(getTotalClusterCount(null)).toBe(0);
	});

	it('resolveShardTopology returns null when shard count cannot be resolved', () => {
		expect(resolveShardTopology({ cluster: { count: 12 } })).toBeNull();
	});

	it('resolveShardTopology uses cluster.manager.totalShards', () => {
		const topology = resolveShardTopology({
			cluster: {
				count: 12,
				manager: { totalShards: 60 },
			},
		});
		expect(topology).toEqual({
			totalShards: 60,
			clusterCount: 12,
			shardsPerCluster: 5,
		});
	});
});
