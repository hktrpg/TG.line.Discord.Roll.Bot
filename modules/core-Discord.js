"use strict";

let result;

(function() {
    if (!process.env.DISCORD_CHANNEL_SECRET) {
        result = undefined;
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
                    shard.respawn();
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
            if (message.respawn === true && message.id !== null) {
                console.log(`[Cluster] Respawning cluster ${message.id}`);
                try {
                    await manager.clusters.get(Number(message.id))?.respawn({
                        delay: 100,
                        timeout: 30000
                    });
                } catch (error) {
                    console.error(`[Cluster] Failed to respawn cluster ${message.id}:`, error);
                }
                return;
            }

            if (message.respawnall === true) {
                console.log('[Cluster] Initiating full cluster respawn');
                try {
                    await manager.respawnAll({
                        clusterDelay: 1000 * 60,
                        respawnDelay: 500,
                        timeout: 1000 * 60 * 2
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
            interval: 2000,
            maxMissedHeartbeats: 10,
            onMissedHeartbeat: (cluster) => {
                console.warn(`[Heartbeat] Cluster ${cluster.id} missed a heartbeat`);
            }
        })
    );

    // 啟動叢集
    manager.spawn({ timeout: -1, delay: DELAY }).catch(error => {
        console.error('[Cluster] Failed to spawn clusters:', error);
        process.exit(1);
    });

    result = manager;
})();

module.exports = result;