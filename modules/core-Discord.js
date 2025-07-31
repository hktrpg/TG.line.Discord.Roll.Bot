/* eslint-disable n/no-process-exit */
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

// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;

// Graceful shutdown function
async function gracefulShutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('[Cluster] Starting graceful shutdown...');

    // Clear shutdown timeout
    if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
    }

    try {
        // Stop heartbeat manager
        if (manager.heartbeat) {
            console.log('[Cluster] Stopping heartbeat manager...');
            manager.heartbeat.stop();
        }

        // Destroy all clusters
        console.log('[Cluster] Destroying all clusters...');
        await manager.destroy();

        console.log('[Cluster] Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('[Cluster] Error during shutdown:', error);
        process.exit(1);
    }
}

// Configuration options
const clusterOptions = {
    token: channelSecret,
    shardsPerClusters: 2,
    totalShards: 'auto',
    mode: 'process',
    spawnTimeout: -1,
    respawn: false, // Disable auto respawn, manually controlled
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

// Improved event handling
manager.on('clusterCreate', shard => {
    console.log(`[Cluster] Launched cluster #${shard.id}`);

    shard.on('ready', () => {
        const maxShard = Math.ceil(shard.manager.totalShards / 3);
        console.log(`[Cluster ${shard.id}] Ready with ${shard.manager.totalShards} total shards. Max shards per cluster: ${maxShard}`);
    });

    const errorHandler = (event, error) => {
        // Don't handle errors if shutting down
        if (isShuttingDown) return;

        console.error(`[Cluster ${shard.id}] ${event}:`, error);
        // Add retry logic
        if (event === 'death') {
            setTimeout(() => {
                if (!isShuttingDown) {
                    console.log(`[Cluster ${shard.id}] Attempting to respawn...`);
                    try {
                        shard.respawn({ timeout: 60_000 });
                    } catch (error_) {
                        console.error(`[Cluster ${shard.id}] Failed to respawn:`, error_);
                    }
                }
            }, RETRY_DELAY);
        }
    };

    shard.on('disconnect', () => errorHandler('Disconnect'));
    shard.on('reconnecting', () => console.log(`[Cluster ${shard.id}] Reconnecting...`));
    shard.on('death', (process) => errorHandler('Death', `Exit code: ${process.exitCode}`));
    shard.on('error', (error) => errorHandler('Error', error));
});

// Improved message handling
manager.on("clusterCreate", cluster => {
    cluster.on("message", async message => {
        // Don't handle respawn messages if shutting down
        if (isShuttingDown) return;

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
                    clusterDelay: 1000,
                    respawnDelay: 5000,          // 5 seconds
                    timeout: 1000 * 60 * 5       // 5 minutes timeout
                });
            } catch (error) {
                console.error('[Cluster] Failed to respawn all clusters:', error);
            }
        }

        // Handle webhook message sending across shards
        if (message.type === 'sendWebhookMessage') {
            console.log(`[Cluster] Received webhook message request for channel ${message.channelId}`);
            console.log(`[Cluster] Message details:`, {
                channelId: message.channelId,
                text: message.text ? 'present' : 'missing',
                roleName: message.roleName,
                imageLink: message.imageLink,
                shardId: message.shardId
            });
            try {
                // Forward the message to the target cluster for processing
                const targetCluster = manager.clusters.get(Number(message.shardId));
                if (!targetCluster) {
                    console.log(`[Cluster] Target cluster ${message.shardId} not found`);
                    return { success: false, error: 'Target cluster not found' };
                }

                // Send the webhook request to the target cluster
                const result = await targetCluster.eval(async (client, context) => {
                    console.log(`[Cluster] Received context:`, context);
                    const { channelId, text, roleName, imageLink } = context;
                    try {
                        console.log(`[Cluster] Processing webhook request for channelId: ${channelId}`);
                        const channel = await client.channels.fetch(channelId);
                        if (!channel) {
                            console.log(`[Cluster] Channel ${channelId} not found on this shard`);
                            return { success: false, error: 'Channel not found' };
                        }

                        const isThread = channel.isThread();
                        console.log(`[Cluster] Channel found, isThread: ${isThread}`);

                        // Try to get webhooks
                        let webhooks;
                        try {
                            webhooks = isThread ? await channel.guild.fetchWebhooks() : await channel.fetchWebhooks();
                            console.log(`[Cluster] Found ${webhooks.size} webhooks`);
                        } catch (webhookError) {
                            console.log(`[Cluster] Webhook fetch failed: ${webhookError.message}`);
                            return { success: false, error: webhookError.message };
                        }

                        console.log(`[Cluster] Searching through ${webhooks.size} webhooks for channel ${channel.id}`);
                        let webhook = webhooks.find(v => {
                            const matches = (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
                            console.log(`[Cluster] Checking webhook ${v.id}: channelId=${v.channelId}, matches=${matches}`);
                            return matches;
                        });
                        console.log(`[Cluster] Webhook search: found ${webhook ? 'webhook' : 'no webhook'}, channel.parentId=${channel.parentId}, channel.id=${channel.id}`);
                        if (webhook) {
                            console.log(`[Cluster] Found webhook: channelId=${webhook.channelId}, id=${webhook.id}`);
                        }

                        // Create webhook if not found
                        if (!webhook) {
                            console.log(`[Cluster] No webhook found, creating new one`);
                            try {
                                const hooks = isThread ? await client.channels.fetch(channel.parentId) : channel;
                                console.log(`[Cluster] Creating webhook for ${isThread ? 'thread' : 'channel'}, parentId: ${channel.parentId}, channelId: ${channel.id}`);
                                
                                // Validate the hooks object before creating webhook
                                if (!hooks) {
                                    console.log(`[Cluster] Failed to get hooks object for webhook creation`);
                                    return { success: false, error: 'Failed to get hooks object' };
                                }
                                
                                console.log(`[Cluster] Hooks object details:`, {
                                    id: hooks.id,
                                    type: hooks.type,
                                    guildId: hooks.guildId
                                });
                                
                                console.log(`[Cluster] Creating webhook with name: "HKTRPG .me Function"`);
                                const createdWebhook = await hooks.createWebhook({ 
                                    name: "HKTRPG .me Function", 
                                    avatar: "https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png" 
                                });
                                console.log(`[Cluster] Webhook created successfully:`, {
                                    id: createdWebhook.id,
                                    channelId: createdWebhook.channelId,
                                    name: createdWebhook.name
                                });
                                webhooks = await channel.fetchWebhooks();
                                console.log(`[Cluster] Fetched ${webhooks.size} webhooks after creation`);
                                
                                webhook = webhooks.find(v => {
                                    return (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
                                });
                                console.log(`[Cluster] Created webhook: ${webhook ? 'success' : 'failed'}`);
                                if (webhook) {
                                    console.log(`[Cluster] Webhook details: channelId=${webhook.channelId}, id=${webhook.id}, name=${webhook.name}`);
                                } else {
                                    console.log(`[Cluster] No webhook found after creation. Available webhooks:`, 
                                        [...webhooks.values()].map(w => ({ id: w.id, channelId: w.channelId, name: w.name }))
                                    );
                                }
                            } catch (createError) {
                                console.log(`[Cluster] Webhook creation failed: ${createError.message}`);
                                return { success: false, error: createError.message };
                            }
                        }

                        if (!webhook) {
                            console.log(`[Cluster] No webhook available after creation attempt`);
                            return { success: false, error: 'No webhook available' };
                        }

                        // Send the message
                        let obj = {
                            content: text,
                            username: roleName,
                            avatarURL: imageLink
                        };
                        
                        // Validate channelId before using it
                        if (isThread && (!channelId || channelId === 'undefined')) {
                            console.log(`[Cluster] Invalid channelId for thread: ${channelId}`);
                            return { success: false, error: 'Invalid channel ID for thread' };
                        }
                        
                        let pair = (webhook && isThread) ? { threadId: channelId } : {};
                        console.log(`[Cluster] Sending webhook with:`, {
                            content: obj.content ? 'present' : 'missing',
                            username: obj.username,
                            avatarURL: obj.avatarURL,
                            threadId: pair.threadId,
                            webhookChannelId: webhook.channelId,
                            isThread: isThread
                        });
                        
                        // Validate webhook before sending
                        if (!webhook.channelId) {
                            console.log(`[Cluster] Webhook has no channelId:`, webhook);
                            return { success: false, error: 'Webhook has no channel ID' };
                        }
                        
                        await webhook.send({ ...obj, ...pair });

                        console.log(`[Cluster] Successfully sent webhook message`);
                        return { success: true };
                    } catch (error) {
                        console.error(`[Cluster] Error sending webhook message: ${error.message}`);
                        return { success: false, error: error.message };
                    }
                }, { context: { 
                    channelId: message.channelId, 
                    text: message.text, 
                    roleName: message.roleName, 
                    imageLink: message.imageLink 
                }});
                
                console.log(`[Cluster] Sent eval with context:`, {
                    channelId: message.channelId,
                    text: message.text ? 'present' : 'missing',
                    roleName: message.roleName,
                    imageLink: message.imageLink
                });

                return result;
            } catch (error) {
                console.error(`[Cluster] Error in webhook message handler: ${error.message}`);
                return { success: false, error: error.message };
            }
        }
    });
});

// Improved scheduled tasks
if (agenda) {
    agenda.define('dailyDiscordMaintenance', async () => {
        if (isShuttingDown) return;

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

// Heartbeat management
manager.extend(
    new HeartbeatManager({
        interval: 5000,           // Increased interval
        maxMissedHeartbeats: 5,   // Decreased tolerance
        onMissedHeartbeat: (cluster) => {
            if (!isShuttingDown) {
                console.warn(`[Heartbeat] Cluster ${cluster.id} missed a heartbeat`);
            }
        },
        onClusterReady: (cluster) => {
            console.log(`[Heartbeat] Cluster ${cluster.id} is now ready and sending heartbeats`);
        }
    })
);

// Process signal handling
process.on('SIGTERM', async () => {
    console.log('[Cluster] Received SIGTERM signal');
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => {
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    await gracefulShutdown();
});

process.on('SIGINT', async () => {
    console.log('[Cluster] Received SIGINT signal');
    // Set force shutdown timeout
    shutdownTimeout = setTimeout(() => {
        console.log('[Cluster] Force shutdown after timeout');
        process.exit(1);
    }, 30_000); // 30 second timeout

    await gracefulShutdown();
});

// Start clusters
manager.spawn({
    timeout: -1,
    delay: DELAY,
    amount: 'auto'
}).catch(error => {
    console.error('[Cluster] Failed to spawn clusters:', error);
    process.exit(1);
});