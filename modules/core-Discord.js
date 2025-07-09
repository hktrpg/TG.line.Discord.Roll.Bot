"use strict";

if (!process.env.DISCORD_CHANNEL_SECRET) {
    return;
}

const DELAY = Number(process.env.DISCORDDELAY) || 1000 * 7;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

const agenda = require('../modules/schedule')?.agenda;
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
require("./ds-deploy-commands");

// 配置選項
const clusterOptions = {
    token: channelSecret,
    shardsPerClusters: 2,
    totalShards: 'auto',
    mode: 'process',
    spawnTimeout: -1,
    respawn: true,
    retry: {
        attempts: MAX_RETRY_ATTEMPTS,
        delay: RETRY_DELAY
    },
    // Add reconnection and backoff options
    fetchTimeout: 30_000,
    restarts: {
        max: 5,
        interval: 60_000 * 10 // 10 minutes
    }
};

const manager = new ClusterManager('./modules/discord_bot.js', clusterOptions);

// 改進的事件處理
manager.on('clusterCreate', shard => {
    console.log(`[Cluster] Launched cluster #${shard.id}`);

    shard.on('ready', () => {
        const maxShard = Math.ceil(shard.manager.totalShards / 3);
        console.log(`[Cluster ${shard.id}] Ready with ${shard.manager.totalShards} total shards. Max shards per cluster: ${maxShard}`);
    });

    const errorHandler = (event, error) => {
        console.error(`[Cluster ${shard.id}] ${event}:`, error);
        // 添加重試邏輯
        if (event === 'death') {
            setTimeout(() => {
                console.log(`[Cluster ${shard.id}] Attempting to respawn...`);
                try {
                    shard.respawn({ timeout: 60_000 });
                } catch (error_) {
                    console.error(`[Cluster ${shard.id}] Failed to respawn:`, error_);
                }
            }, RETRY_DELAY);
        }
    };

    shard.on('disconnect', () => errorHandler('Disconnect'));
    shard.on('reconnecting', () => console.log(`[Cluster ${shard.id}] Reconnecting...`));
    shard.on('death', (process) => errorHandler('Death', `Exit code: ${process.exitCode}`));
    shard.on('error', (error) => errorHandler('Error', error));
});

// 改進的消息處理
manager.on("clusterCreate", cluster => {
    cluster.on("message", async message => {
        if (message.respawn === true && message.id !== null && message.id !== undefined) {
            console.log(`[Cluster] Respawning cluster ${message.id}`);
            try {
                const targetCluster = manager.clusters.get(Number(message.id));
                if (targetCluster) {
                    await targetCluster.respawn({
                        delay: 1000,
                        timeout: 60_000
                    });
                    console.log(`[Cluster] Successfully respawned cluster ${message.id}`);
                } else {
                    console.error(`[Cluster] Cluster ${message.id} not found`);
                }
            } catch (error) {
                console.error(`[Cluster] Failed to respawn cluster ${message.id}:`, error);
            }
            return;
        }

        if (message.respawnall === true) {
            console.log('[Cluster] Initiating full cluster respawn');
            try {
                await manager.respawnAll({
                    clusterDelay: 1000 * 60 * 2, // 2 minutes between clusters
                    respawnDelay: 5000,          // 5 seconds
                    timeout: 1000 * 60 * 5       // 5 minutes timeout
                });
            } catch (error) {
                console.error('[Cluster] Failed to respawn all clusters:', error);
            }
        }
    });
});

// 改進的排程任務
if (agenda) {
    agenda.define('dailyDiscordMaintenance', async () => {
        console.log('[Schedule] Running daily Discord maintenance');
        try {
            await manager.respawnAll({
                clusterDelay: 1000 * 60,
                respawnDelay: 500,
                timeout: 1000 * 60 * 2
            });
        } catch (error) {
            console.error('[Schedule] Failed to perform maintenance:', error);
        }
    });
}

// 心跳管理
manager.extend(
    new HeartbeatManager({
        interval: 5000,           // Increased interval
        maxMissedHeartbeats: 5,   // Decreased tolerance
        onMissedHeartbeat: (cluster) => {
            console.warn(`[Heartbeat] Cluster ${cluster.id} missed a heartbeat`);
        },
        onClusterReady: (cluster) => {
            console.log(`[Heartbeat] Cluster ${cluster.id} is now ready and sending heartbeats`);
        }
    })
);

// 啟動叢集
manager.spawn({
    timeout: -1,
    delay: DELAY,
    amount: 'auto'
}).catch(error => {
    console.error('[Cluster] Failed to spawn clusters:', error);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
});