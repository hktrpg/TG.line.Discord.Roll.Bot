'use strict';

const { WebSocketShard } = require('discord.js');
const { recoverClientShard, interpretShardRecoveryResults } = require('../modules/discord/shard-connection');

function client(shard) {
    return { cluster: { id: 0 }, ws: { shards: new Map([[0, shard]]) } };
}

test('installed discord.js shard without destroy requests escalation only when unhealthy', async () => {
    const shard = new WebSocketShard({}, 0);
    expect(typeof shard.destroy).toBe('undefined');
    await expect(recoverClientShard(client(shard), { clusterId: 0, shardId: 0 })).resolves.toBe('unsupported');
    shard.status = 0;
    await expect(recoverClientShard(client(shard), { clusterId: 0, shardId: 0 })).resolves.toBe('healthy');
});

test('missing and foreign shards cannot request escalation', async () => {
    await expect(recoverClientShard(client(), { clusterId: 0, shardId: 0 })).resolves.toBe('missing');
    await expect(recoverClientShard(client(), { clusterId: 1, shardId: 0 })).resolves.toBe('not-owner');
});

test('healthy and destroyed results do not escalate', () => {
    expect(interpretShardRecoveryResults(['not-owner', 'healthy'])).toEqual({ type: 'healthy' });
    expect(interpretShardRecoveryResults(['destroyed'])).toEqual({ type: 'destroyed' });
});

test('missing and unsupported shards escalate with distinct reasons', () => {
    expect(interpretShardRecoveryResults(['not-owner', 'missing'])).toEqual({
        type: 'respawn', reason: 'shard_missing',
    });
    expect(interpretShardRecoveryResults(['unsupported'])).toEqual({
        type: 'respawn', reason: 'shard_api_unsupported',
    });
    expect(interpretShardRecoveryResults(['not-owner'])).toEqual({ type: 'retry' });
    expect(interpretShardRecoveryResults()).toEqual({ type: 'retry' });
});

test('destroy completion and rejection are awaited', async () => {
    const shard = { status: 5, destroy: jest.fn().mockRejectedValue(new Error('failed')) };
    await expect(recoverClientShard(client(shard), { clusterId: 0, shardId: 0 })).rejects.toThrow('failed');
    shard.destroy.mockResolvedValue();
    await expect(recoverClientShard(client(shard), { clusterId: 0, shardId: 0 })).resolves.toBe('destroyed');
});
