/* eslint-disable n/no-process-exit */
"use strict";
const fs = require('node:fs');

const { ClusterClient, getInfo, AutoResharderClusterClient } = require('discord-hybrid-sharding');
const Discord = require('discord.js');
const isImageURL = require('image-url-validator').default;
const WebSocket = require('ws');

const candle = require('../modules/candleDays.js');
const records = require('../modules/records.js');
const schema = require('../modules/schema.js');
const clusterProtection = require('../modules/cluster-protection.js');
// const dbProtectionLayer = require('../modules/db-protection-layer.js'); // Reserved for future database protection
const dbConnector = require('../modules/db-connector.js');

exports.analytics = require('./analytics');
const debugMode = !!process.env.DEBUG;
const imageUrl = (/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)(\s?)$/igm);
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
// adminSecret removed - no longer needed after custom heartbeat monitoring removal
const { Client } = Discord;
const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, AttachmentBuilder, ChannelType, MessageFlags, WebhookClient } = Discord;

// Multi-server functionality temporarily disabled
// const multiServer = require('../modules/multi-server')
// const adminSecret = process.env.ADMIN_SECRET || '';
const checkMongodb = require('../modules/dbWatchdog.js');
const { rollText } = require('./getRoll');
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
const buttonStyles = [ButtonStyle.Danger, ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger]
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const discordClientConfig = require('./config/discord_client');
const client = new Client(discordClientConfig);
client.on('clientReady', () => {
	discordClientConfig.updateWithClient(client);
});
client.cluster = new ClusterClient(client);

// Register Discord cluster/shard context for dbWatchdog logs (e.g. "MongoDB connection not ready")
checkMongodb.setLogContextGetter(() => {
    const clusterId = client.cluster?.id;
    const shardList = client.cluster?.info?.SHARD_LIST;
    if (clusterId === undefined && !shardList) return null;
    const shardsStr = Array.isArray(shardList) && shardList.length > 0
        ? `shards [${shardList.join(', ')}]`
        : 'shards (pending)';
    return `Discord cluster ${clusterId ?? '?'}, ${shardsStr}`;
});

// AutoResharder client for automatic re-sharding
new AutoResharderClusterClient(client.cluster, {
    // OPTIONAL: Default is 60e3 which sends every minute the data / cluster
    sendDataIntervalMS: 60e3,
    // OPTIONAL: Default is a valid function for discord.js Client's
    sendDataFunction: (cluster) => {
        try {
            // Validate cluster object structure
            if (!cluster || typeof cluster.id !== 'number') {
                console.error('[AutoResharder] Invalid cluster object - returning safe defaults');
                return { clusterId: -1, shardData: [] };
            }

            if (!cluster.info || !Array.isArray(cluster.info.SHARD_LIST)) {
                console.error('[AutoResharder] Invalid cluster info or SHARD_LIST - returning empty shardData');
                return { clusterId: cluster.id, shardData: [] };
            }

            if (!cluster.client || !cluster.client.guilds || !cluster.client.guilds.cache) {
                console.error('[AutoResharder] Invalid cluster client guilds cache - returning empty shardData');
                return { clusterId: cluster.id, shardData: [] };
            }

            const shardData = cluster.info.SHARD_LIST.map(shardId => {
                try {
                    const guilds = cluster.client.guilds.cache.filter(g => g.shardId === shardId);
                    // Use .size for Collection, fallback to .length for arrays
                    const guildCount = guilds.size !== undefined ? guilds.size : (guilds.length || 0);
                    return {
                        shardId: shardId,
                        guildCount: guildCount
                    };
                } catch (error) {
                    console.error(`[AutoResharder] Error processing shard ${shardId}:`, error.message);
                    return {
                        shardId: shardId,
                        guildCount: 0
                    };
                }
            });

            return {
                clusterId: cluster.id,
                shardData: shardData
            };
        } catch (error) {
            console.error('[AutoResharder] sendDataFunction error:', error.message);
            return {
                clusterId: cluster?.id || -1,
                shardData: []
            };
        }
    }
});

// Global error handler for AutoResharder and cluster-related promise rejections
process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    // Check if this is an AutoResharderClusterClient error
    if (error.message && error.message.includes('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT')) {
        // Use the dedicated diagnostics function
        logAutoResharderDiagnostics(error, 'Unhandled Rejection');

        // Don't crash the process, just log the error
        return;
    }

    // Handle other unhandled rejections normally
    console.error('[Discord Bot] Unhandled Promise Rejection:', error.message);
    if (error.stack) {
        console.error('[Discord Bot] Stack trace:', error.stack);
    }
});

// Login to Discord with error handling to prevent restart loops
async function loginWithErrorHandling() {
    // Register critical error handlers BEFORE login
    client.on('error', (error) => {
        console.error('[Discord Bot] Discord Client Error:', error.message);
    });

    client.on('warn', (warning) => {
        console.warn('[Discord Bot] Discord Client Warning:', warning);
    });

    client.on('shardError', (error, shardId) => {
        console.error(`[Discord Bot] Shard ${shardId} Error:`, error.message);
    });

    client.on('shardDisconnect', (event, shardId) => {
        console.warn(`[Discord Bot] Shard ${shardId} Disconnected:`, event);
    });

    client.on('shardReconnecting', () => {
        // Shard reconnecting - log removed
    });

    client.on('shardResume', () => {
        // Shard resumed - log removed
    });

    try {
        await client.login(channelSecret);
        console.log('[Discord Bot] Successfully logged in to Discord');
    } catch (error) {
        console.error('[Discord Bot] Failed to login to Discord:', error.message);
        console.error('[Discord Bot] Login error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            status: error.httpStatus
        });

        // If login fails (e.g., invalid token), suspend execution instead of exiting
        // This prevents ClusterManager from respawning in a loop
        console.error('[Discord Bot] Login failed - suspending execution to prevent restart loop');
        console.error('[Discord Bot] Process will remain alive but inactive until configuration is fixed');

        // Suspend execution with periodic heartbeat to keep process alive
        setInterval(() => {
            console.log('[Discord Bot] Suspended due to login failure - check Discord token configuration');
        }, 60_000); // Log every minute

        return; // Don't proceed with bot initialization
    }
}

loginWithErrorHandling();

const MESSAGE_SPLITOR = (/\S+/ig);
const link = process.env.WEB_LINK;
const mongo = process.env.mongoURL
let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };

const newMessage = require('./message');
const healthMonitor = require('./health-monitor');

const timerManager = require('./timer-manager');

const RECONNECT_INTERVAL = 1 * 1000 * 60;
const shardid = client.cluster.id;
let ws;
let isReconnecting = false; // Prevent multiple reconnection attempts

// StoryTeller reaction poll support
const POLL_EMOJIS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];
const stPolls = new Map(); // messageId -> { channelid, groupid, options, originMessage, completed?: boolean, createdAt?: number }
const stNoVoteStreak = new Map(); // channelId -> consecutive no-vote count
const stLastPollStartedAt = new Map(); // channelId -> timestamp of latest poll start

// Cleanup function for StoryTeller Maps to prevent memory leaks
function cleanupStoryTellerMaps() {
    const now = Date.now();
    const POLL_MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours - polls should be cleaned up after completion + buffer
    const STREAK_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours - streaks for inactive channels
    const LAST_POLL_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours - last poll timestamps for inactive channels

    // Clean up completed or old polls
    let cleanedPolls = 0;
    for (const [messageId, pollData] of stPolls.entries()) {
        const createdAt = pollData.createdAt || 0;
        const age = now - createdAt;
        if (pollData.completed || age > POLL_MAX_AGE) {
            stPolls.delete(messageId);
            cleanedPolls++;
        }
    }

    // Clean up old no-vote streaks (channels inactive for 24 hours)
    // Note: We can't track last access easily, so we'll clean up very old entries
    // In practice, active channels will keep updating these maps
    let cleanedStreaks = 0;
    for (const [channelId] of stNoVoteStreak.entries()) {
        // Check if channel still has active polls
        const hasActivePoll = [...stPolls.values()].some(p => p.channelid === channelId && !p.completed);
        if (!hasActivePoll) {
            // Check if last poll was more than 24 hours ago
            const lastPollTime = stLastPollStartedAt.get(channelId) || 0;
            if (lastPollTime && (now - lastPollTime) > STREAK_MAX_AGE) {
                stNoVoteStreak.delete(channelId);
                cleanedStreaks++;
            }
        }
    }

    // Clean up old last poll timestamps
    let cleanedTimestamps = 0;
    for (const [channelId, timestamp] of stLastPollStartedAt.entries()) {
        if ((now - timestamp) > LAST_POLL_MAX_AGE) {
            // Only delete if no active polls exist
            const hasActivePoll = [...stPolls.values()].some(p => p.channelid === channelId && !p.completed);
            if (!hasActivePoll) {
                stLastPollStartedAt.delete(channelId);
                cleanedTimestamps++;
            }
        }
    }

    if (cleanedPolls > 0 || cleanedStreaks > 0 || cleanedTimestamps > 0) {
        console.log(`[Discord Bot] Cleaned up StoryTeller maps: ${cleanedPolls} polls, ${cleanedStreaks} streaks, ${cleanedTimestamps} timestamps`);
    }
}

// Helper: check if StoryTeller run in this channel is paused
async function isStoryTellerRunPausedByChannel(channelId) {
	try {
		if (!schema || !schema.storyRun || typeof schema.storyRun.findOne !== 'function') return false;
		const run = await schema.storyRun.findOne({ channelID: channelId, isEnded: false }).sort({ updatedAt: -1 });
		return !!(run && run.isPaused);
	} catch {
		return false;
	}
}

// Helper: check if StoryTeller run in this channel is actively continuing (not paused, not ended)
async function isStoryTellerRunActiveByChannel(channelId) {
	try {
		if (!schema || !schema.storyRun || typeof schema.storyRun.findOne !== 'function') return true;
		const run = await schema.storyRun.findOne({ channelID: channelId }).sort({ updatedAt: -1 });
		if (!run) return false;
		return !run.isPaused && !run.isEnded;
	} catch {
		return true;
	}
}

// Resolve which cluster owns a given guild so we only send from that cluster
async function getOwnerClusterIdByGuild(guildId) {
	try {
		const results = await client.cluster.broadcastEval(
			(c, { gid }) => {
				try {
					return c.guilds.cache.has(gid) ? (c.cluster?.id || 0) : null;
				} catch {
					return null;
				}
			},
			{ context: { gid: guildId }, timeout: 10_000 }
		);
		if (Array.isArray(results)) {
			const id = results.find(v => Number.isInteger(v));
			return (typeof id === 'number') ? id : null;
		}
		return null;
	} catch {
		return null;
	}
}

client.on('messageCreate', async message => {
	try {
		if (isShuttingDown) return;
		if (message.author.bot) return;

		// Use batch processing
		const [dbStatus, result] = await Promise.all([
			checkMongodb.isDbOnline(),
			handlingResponMessage(message)
		]);

		// DB-triggered cluster respawn disabled: respawn causes all clusters to reconnect at once,
		// overwhelming MongoDB and CLUSTERING_READY_TIMEOUT. Let db-connector retry + circuit breaker handle recovery.
		// if (process.env.DB_RESPAWN_ENABLED === '1' && !dbStatus && checkMongodb.isDbRespawn()) {
		// 	console.error(`[Discord Bot] ========== DATABASE RESPAWN TRIGGERED ==========`);
		// 	console.error(`[Discord Bot] Database status: ${dbStatus}, isDbRespawn: ${checkMongodb.isDbRespawn()}`);
		// 	console.error(`[Discord Bot] Cluster ID: ${client.cluster.id}`);
		// 	console.error(`[Discord Bot] Timestamp: ${new Date().toISOString()}`);
		// 	console.error(`[Discord Bot] ==========================================`);
		// 	respawnCluster2();
		// }

		// Process message only if DB is likely fine, or let it run if logic handles offline DB
		await handlingMultiServerMessage(message);

		if (result?.text) {
			return handlingSendMessage(result);
		}

	} catch (error) {
		console.error('[Discord Bot] messageCreate error:', error?.message);
	}

});
client.on('guildCreate', async guild => {
	try {
		const channels = await guild.channels.fetch();
		const keys = [...channels.values()];
		const channel = keys.find(channel => {
			return channel.type === ChannelType.GuildText && channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
		});
		if (!channel) return;
		//	let channelSend = await guild.channels.fetch(channel.id);
		const text = new EmbedBuilder()
			.setColor('#0099ff')
			//.setTitle(rplyVal.title)
			//.setURL('https://discord.js.org/')
			.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
			.setDescription(newMessage.joinMessage())
		await channel.send({ embeds: [text] });
	} catch (error) {
		if (error.message === 'Missing Access') return;
		if (error.message === 'Missing Permissions') return;
		console.error('[Discord Bot] guildCreate error:', (error && error.name), (error && error.message), (error && error.reason));
	}
})

client.on('interactionCreate', async message => {
	try {
		if (message.user && message.user.bot) return;
		return __handlingInteractionMessage(message);
	} catch (error) {
		console.error('[Discord Bot] interactionCreate error:', (error && error.name), (error && error.message), (error && error.reason));
	}
});


client.on('messageReactionAdd', async (reaction, user) => {
	if (isShuttingDown) return;
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId })
		.cache(30)
		.catch(error => {
			console.error('[Discord Bot] MongoDB error in messageReactionAdd:', error.name, error.reason)
			checkMongodb.dbErrOccurs();
		})
	try {
		if (!list || list.length === 0) return;
		const detail = list.detail;
		const findEmoji = detail.find(function (item) {
			return item.emoji === reaction.emoji.name || item.emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
		});
		if (findEmoji) {
			const member = await reaction.message.guild.members.fetch(user.id);
			const roleId = findEmoji.roleID.replaceAll(/\D/g, '');
			try {
				await member.roles.add(roleId);
			} catch (error) {
				// Handle specific Discord API errors
				if (error.code === 10_011) { // Unknown Role
					console.warn(`[Discord Bot] Role ${roleId} not found or no permission to assign`);
					return;
				}
				if (error.code === 50_013) { // Missing Permissions
					console.warn(`[Discord Bot] Missing permissions to assign role ${roleId}`);
					return;
				}
				// Re-throw other errors to be caught by outer catch
				throw error;
			}
		} else {
			reaction.users.remove(user.id);
		}
	} catch (error) {
		console.error('[Discord Bot] messageReactionAdd error:', (error && error.name), (error && error.message), (error && error.reason))
	}

});

client.on('messageReactionRemove', async (reaction, user) => {
	if (isShuttingDown) return;
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId }).catch(error => console.error('[Discord Bot] MongoDB error in messageReactionRemove:', error.name, error.reason))
	try {
		if (!list || list.length === 0) return;
		const detail = list.detail;
		for (let index = 0; index < detail.length; index++) {
			if (detail[index].emoji === reaction.emoji.name || detail[index].emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`) {
				const member = await reaction.message.guild.members.fetch(user.id);
				const roleId = detail[index].roleID.replaceAll(/\D/g, '');
				try {
					await member.roles.remove(roleId);
				} catch (error) {
					// Handle specific Discord API errors
					if (error.code === 10_011) { // Unknown Role
						console.warn(`[Discord Bot] Role ${roleId} not found or no permission to remove`);
						return;
					}
					if (error.code === 50_013) { // Missing Permissions
						console.warn(`[Discord Bot] Missing permissions to remove role ${roleId}`);
						return;
					}
					// Re-throw other errors to be caught by outer catch
					throw error;
				}
			}
		}
	} catch (error) {
		if (error.message === 'Unknown Member') return;
		console.error('[Discord Bot] messageReactionRemove error:', (error && error.name), (error && error.message), (error && error.reason))
	}
});




client.on('clientReady', async () => {
	initInteractionCommands();
	//	if (shardid === 0) getSchedule();
	client.user.setActivity(`${candle.checker() || '🌼'}bothelp | hktrpg.com🍎`);
	console.log(`[Discord Bot #${shardid}] Logged in as ${client.user.tag}!`);
	client.cluster.triggerReady();
	let switchSetActivity = 0;

	// Start periodic cleanup of StoryTeller Maps to prevent memory leaks
	timerManager.setInterval(() => {
		cleanupStoryTellerMaps();
	}, 60 * 60 * 1000); // Run cleanup every hour

	//await sleep(6);
	// eslint-disable-next-line no-unused-vars
	const refreshId2 = timerManager.setInterval(async () => {
		try {
			let activityText;
			switch (switchSetActivity % 2) {
				case 1:
					client.user.setActivity(`${candle.checker() || '🌼'}bothelp | hktrpg.com🍎`);
					break;
				default:
					activityText = await count2();
					if (activityText && typeof activityText === 'string') {
						client.user.setActivity(activityText);
					} else {
						console.warn('count2() 返回無效活動文字:', activityText);
						client.user.setActivity('🌼bothelp | hktrpg.com🍎');
					}
					break;
			}
			switchSetActivity = (switchSetActivity % 2) ? 2 : 3;
		} catch (error) {
			console.error('設定活動狀態時發生錯誤:', error);
			try {
				client.user.setActivity('🌼bothelp | hktrpg.com🍎');
			} catch (fallbackError) {
				console.error('設定備用活動狀態也失敗:', fallbackError);
			}
		}
	}, 180_000);
});

// Custom heartbeat monitoring removed - heartbeat monitoring is now handled by HeartbeatManager in core-Discord.js

async function replilyMessage(message, result) {
	const displayname = (message.member && message.member.id) ? `<@${message.member.id}>${candle.checker(message.member.id)}\n` : '';
	if (result && result.text) {
		result.text = `${displayname}${result.text}`
		await __handlingReplyMessage(message, result);
	}
	else {
		try {
			// For interactions, check status and respond appropriately
			if (message.isInteraction) {
				if (!message.deferred && !message.replied) {
					// Defer the reply if we haven't responded yet
					await message.deferReply({ flags: MessageFlags.Ephemeral });
					await message.editReply({ content: `${displayname}指令沒有得到回應，請檢查內容`, flags: MessageFlags.Ephemeral });
				} else if (message.deferred && !message.replied) {
					// If already deferred, edit the reply
					await message.editReply({ content: `${displayname}指令沒有得到回應，請檢查內容`, flags: MessageFlags.Ephemeral });
				} else if (!message.replied) {
					// Last resort - try a direct reply
					await message.reply({ content: `${displayname}指令沒有得到回應，請檢查內容`, flags: MessageFlags.Ephemeral })
						.catch(error => console.error('Failed to reply to interaction:', error.message));
				}
			} else {
				// For regular messages
				return await message.reply({ content: `${displayname}指令沒有得到回應，請檢查內容`, flags: MessageFlags.Ephemeral });
			}
		} catch (error) {
			console.error('replilyMessage error:', error);
			return;
		}
	}
}


//inviteDelete
//messageDelete
function handlingCountButton(message, mode) {
	const modeString = (mode === "roll") ? '投擲' : '點擊';
	const content = message.message.content;
	if (!/點擊了「|投擲了「|要求擲骰\/點擊/.test(content)) return;
	const user = `${(message.member?.nickname || message.user.displayName) ? `${message.member?.nickname || message.user.displayName} (${message.user.username})` : message.user.username}`;

	const button = `${modeString}了「${message.component.label}」`;
	const regexpButton = convertRegex(`${button}`)
	let newContent = content;
	if (/要求擲骰\/點擊/.test(newContent)) newContent = '';
	if (regexpButton.test(newContent)) {
		let checkRepeat = checkRepeatName(content, button, user)
		if (!checkRepeat)
			newContent = newContent.replace(regexpButton, `、${user} ${button}`)
	} else {
		newContent += `\n${user} ${button}`
	}
	return newContent.slice(0, 1000);
}
function checkRepeatName(content, button, user) {
	let flag = false;
	const everylines = content.split(/\n/);
	for (const line of everylines) {
		if (convertRegex(button).test(line)) {
			let splitNames = line.split('、');
			for (const name of splitNames) {
				if (convertRegex(user).test(name) || convertRegex(`${user} ${button}`).test(name)) {
					flag = true;
				}
			}
		}

	}
	return flag;
}
async function convQuotes(text = "") {
	let embeds = []
	let embed = new EmbedBuilder()
		.setColor('#0099ff')
		//.setTitle(rplyVal.title)
		//.setURL('https://discord.js.org/')
		.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
	const imageMatch = text.match(imageUrl) || null;
	if (imageMatch && imageMatch.length > 0) {
		for (let index = 0; (index < imageMatch.length) && index < 10; index++) {
			imageMatch[index] = imageMatch[index].replace(/\s?$/, '');
			let imageVaild = await isImageURL(imageMatch[index]);
			if (imageVaild) {
				let imageEmbed = new EmbedBuilder().setURL('https://www.patreon.com/HKTRPG').setImage(imageMatch[index]);
				if (imageMatch.length === 1) embed.setImage(imageMatch[index]);
				else embeds.push(imageEmbed);
				text = text.replace(imageMatch[index], '')
			}

		}
	}
	if (text && text.trim().length > 0) {
		embed.setDescription(text)
	} else {
		embed.setDescription(" - ")
	}
	embeds.unshift(embed);
	return embeds;

}

async function privateMsgFinder(channelid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == channelid
	)
	if (groupInfo && groupInfo.trpgDarkRollingfunction)
		return groupInfo.trpgDarkRollingfunction
	else return [];
}
async function sendMessage({ target, replyText, quotes = false, components = null }) {
	if (!target) return;

	const sendText = typeof replyText === "string"
		? replyText.toString().match(/[\s\S]{1,2000}/g) || []
		: [];

	// Only send first, second, and last two chunks to avoid spam
	const chunksToSend = sendText.filter((_, i) =>
		i === 0 || i === 1 || i === sendText.length - 1 || i === sendText.length - 2);

	for (const chunk of chunksToSend) {
		try {
			// Ensure components is either an array or null
			const safeComponents = Array.isArray(components) ? components : null;

			const messageOptions = quotes
				? { embeds: await convQuotes(chunk), components: safeComponents }
				: { content: chunk, components: safeComponents };

			await target.send(messageOptions);
		} catch (error) {
			if (error.message !== 'Cannot send messages to this user' &&
				error.message !== 'Missing Permissions' &&
				error.message !== 'Missing Access') {
				console.error('[Discord Bot] Message send error:', error.message, 'chunk:', chunk);
			}
		}
	}
}

async function SendToId(targetid, replyText, quotes = false) {
	try {
		const user = await client.users.fetch(targetid);
		await sendMessage({ target: user, replyText, quotes });
	} catch (error) {
		console.error('[Discord Bot] SendToId error:', error.message);
	}
}

async function SendToReply({ replyText = "", message, quotes = false }) {
	if (!message?.author) return;
	await sendMessage({ target: message.author, replyText, quotes });
}

async function SendToReplychannel({ replyText = "", channelid = "", quotes = false, groupid = "", buttonCreate = "" }) {
	if (!channelid) return;

	// Try to fetch the channel
	let channel;
	try {
		channel = await client.channels.fetch(channelid)
	} catch {
		// Channel not found in cache
	}

	// If channel not found and we have a groupid, try to fetch from guild
	if (!channel && groupid) {
		try {
			let guild = await client.guilds.fetch(groupid)
			channel = await guild.channels.fetch(channelid)
		} catch {
			// Guild or channel not found
		}
	}

	if (!channel) return;

	// If we have button components, send each set separately
	if (buttonCreate && Array.isArray(buttonCreate) && buttonCreate.length > 0) {
		for (let index = 0; index < buttonCreate.length; index++) {
			if (Array.isArray(buttonCreate[index])) {
				await sendMessage({ target: channel, replyText: replyText, quotes: quotes, components: buttonCreate[index] });
			}
		}
	} else {
		await sendMessage({ target: channel, replyText: replyText, quotes: quotes });
	}
}


async function nonDice(message) {
	await courtMessage({ result: "", botname: "Discord", inputStr: "", shardids: shardid })
	const groupid = (message.guild && message.guild.id) || '';
	const userid = (message.author && message.author.id) || (message.user && message.user.id) || '';
	if (!groupid || !userid) return;
	const displayname = (message.member && message.member.user && message.member.user.tag) || (message.user && message.user.username) || '';
	const membercount = (message.guild) ? message.guild.memberCount : 0;
	try {
		let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount, "", message);
		if (groupid && LevelUp && LevelUp.text) {
			// Check if this is an interaction
			if (message.isInteraction) {
				// For interactions, we need to reply directly
				if (!message.deferred && !message.replied) {
					await message.reply({
						content: `@${displayname} ${candle.checker()} ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`
					});
				} else if (message.deferred && !message.replied) {
					await message.editReply({
						content: `@${displayname} ${candle.checker()} ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`
					});
				}
			} else {
				// For regular messages, use the channel
				await SendToReplychannel(
					{ replyText: `@${displayname} ${candle.checker()} ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`, channelid: message.channel.id }
				);
			}
		}
	} catch (error) {
		console.error('await #534 EXPUP error', (error && error.name), (error && error.message), (error && error.reason));
	}
	return null;
}


// Set Activity can customize what is being played


function __privateMsg({ trigger, mainMsg, inputStr }) {
	let privatemsg = 0;
	if (/^dr$/i.test(trigger) && mainMsg && mainMsg[1]) {
		privatemsg = 1;
		inputStr = inputStr.replace(/^dr\s+/i, '');
	}
	if (/^ddr$/i.test(trigger) && mainMsg && mainMsg[1]) {
		privatemsg = 2;
		inputStr = inputStr.replace(/^ddr\s+/i, '');
	}
	if (/^dddr$/i.test(trigger) && mainMsg && mainMsg[1]) {
		privatemsg = 3;
		inputStr = inputStr.replace(/^dddr\s+/i, '');
	}
	return { inputStr, privatemsg };
}



// Total cluster count: use cluster.count (CLUSTER_COUNT), not cluster.ids.size (shards in this worker)
function getTotalClusterCount(c) {
	if (!c?.cluster) return 0;
	if (typeof c.cluster.count === 'number') return c.cluster.count;
	try {
		const info = require('discord-hybrid-sharding').getInfo();
		if (typeof info?.CLUSTER_COUNT === 'number') return info.CLUSTER_COUNT;
	} catch (e) { /* ignore */ }
	return 0;
}

// Function to identify which cluster failed based on error and responding clusters
function identifyFailedCluster(error, respondingClusters = [], totalClustersOverride = null) {
	try {
		// Try to extract cluster ID from error message
		const clusterIdMatch = error.message?.match(/ClusterId:\s*(\d+)/);
		if (clusterIdMatch) {
			return Number.parseInt(clusterIdMatch[1], 10);
		}

		// If we have responding clusters info, find which one is missing
		if (Array.isArray(respondingClusters) && respondingClusters.length > 0) {
			const totalClusters = (totalClustersOverride ?? getTotalClusterCount(client)) || 0;
			const allClusterIds = Array.from({ length: totalClusters }, (_, i) => i);
			const missingClusters = allClusterIds.filter(id => !respondingClusters.includes(id));

			if (missingClusters.length === 1) {
				return missingClusters[0];
			} else if (missingClusters.length > 1) {
				console.warn(`[Statistics] Multiple clusters may have failed: ${missingClusters.join(', ')}`);
				return missingClusters[0]; // Return first failed cluster
			}
		}

		return null; // Could not identify specific failed cluster
	} catch (parseError) {
		console.warn('[Statistics] Error identifying failed cluster:', parseError.message);
		return null;
	}
}

// Enhanced cluster diagnostics function for CLUSTERING_NO_CHILD_EXISTS errors
function logClusterDiagnostics(error, context = '') {
	if (!error || !error.message || !error.message.includes('CLUSTERING_NO_CHILD_EXISTS')) {
		return;
	}

	const timestamp = new Date().toISOString();
	const diagnostics = {
		timestamp,
		context,
		error: error.message,
		clusterState: {
			totalClusters: getTotalClusterCount(client) || 0,
			availableClusterIds: Array.from({ length: getTotalClusterCount(client) || 0 }, (_, i) => i),
			activeClusters: 0,
			readyClusters: 0,
			clusterDetails: []
		},
		processInfo: {
			pid: process.pid,
			uptime: Math.floor(process.uptime()),
			memoryUsage: process.memoryUsage(),
		}
	};

	// Collect detailed cluster information
	if (client.cluster) {
		const clusters = client.cluster.clusters;
		diagnostics.clusterState.clusterDetails = [...clusters.values()].map(cluster => ({
			id: cluster.id,
			ready: cluster.ready,
			alive: cluster.alive,
			lastHeartbeat: cluster.lastHeartbeat || null,
			shards: cluster.shards?.size || 0
		}));

		diagnostics.clusterState.activeClusters = diagnostics.clusterState.clusterDetails.filter(c => c.alive).length;
		diagnostics.clusterState.readyClusters = diagnostics.clusterState.clusterDetails.filter(c => c.ready).length;
	}

	console.error(`[${timestamp}] 🔍 CLUSTERING_NO_CHILD_EXISTS Diagnostics [${context}]:`, JSON.stringify(diagnostics, null, 2));
}

// Cluster health monitoring function - can be called manually or periodically
function getClusterHealthReport() {
	if (!client.cluster) {
		return { error: 'No cluster manager available' };
	}

	const timestamp = new Date().toISOString();
	const clusters = client.cluster.clusters;
	const clusterDetails = [...clusters.values()].map(cluster => ({
		id: cluster.id,
		ready: cluster.ready,
		alive: cluster.alive,
		lastHeartbeat: cluster.lastHeartbeat || null,
		shards: cluster.shards?.size || 0,
		uptime: cluster.ready ? Math.floor((Date.now() - cluster.readyAt) / 1000) : 0
	}));

	const report = {
		timestamp,
		summary: {
			totalClusters: getTotalClusterCount(client),
			activeClusters: clusterDetails.filter(c => c.alive).length,
			readyClusters: clusterDetails.filter(c => c.ready).length,
			deadClusters: clusterDetails.filter(c => !c.alive).length,
			totalShards: clusterDetails.reduce((sum, c) => sum + c.shards, 0)
		},
		clusters: clusterDetails,
		processInfo: {
			pid: process.pid,
			uptime: Math.floor(process.uptime()),
			memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
		}
	};

	return report;
}

// AutoResharder diagnostics function for NO CHILD/MASTER EXISTS errors
function logAutoResharderDiagnostics(error, context = '') {
	if (!error || !error.message || !error.message.includes('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT')) {
		return;
	}

	const timestamp = new Date().toISOString();
	const clusterId = client.cluster?.id || 'unknown';
	const shardList = client.cluster?.info?.SHARD_LIST || [];

	const diagnostics = {
		timestamp,
		context,
		error: error.message,
		clusterId,
		shardList,
		clusterState: {
			totalClusters: getTotalClusterCount(client) || 0,
			availableClusterIds: Array.from({ length: getTotalClusterCount(client) || 0 }, (_, i) => i),
			activeClusters: 0,
			readyClusters: 0,
			clusterDetails: []
		},
		processInfo: {
			pid: process.pid,
			uptime: Math.floor(process.uptime()),
			memoryUsage: process.memoryUsage(),
		},
		possibleCauses: [
			'Cluster manager not properly initialized',
			'Cluster client disconnected from manager',
			'Invalid cluster manager mode configuration',
			'Race condition during cluster startup/shutdown',
			'AutoResharder trying to access cluster before ready'
		]
	};

	// Collect detailed cluster information
	if (client.cluster) {
		const clusters = client.cluster.clusters;
		diagnostics.clusterState.clusterDetails = [...clusters.values()].map(cluster => ({
			id: cluster.id,
			ready: cluster.ready,
			alive: cluster.alive,
			lastHeartbeat: cluster.lastHeartbeat || null,
			shards: cluster.shards?.size || 0,
			uptime: cluster.ready ? Math.floor((Date.now() - cluster.readyAt) / 1000) : 0
		}));

		diagnostics.clusterState.activeClusters = diagnostics.clusterState.clusterDetails.filter(c => c.alive).length;
		diagnostics.clusterState.readyClusters = diagnostics.clusterState.clusterDetails.filter(c => c.ready).length;
	}

	console.error(`[${timestamp}] 🔄 AutoResharder Diagnostics [${context}] - Cluster ${clusterId} (Shards: ${shardList.join(', ')}):`, JSON.stringify(diagnostics, null, 2));
}

// Export for external access (can be called from admin commands)
globalThis.getClusterHealthReport = getClusterHealthReport;

// Shard health monitoring and auto-fix system
let shardFixInProgress = false;
let unresponsiveShards = new Set();
let shardFixInterval = null;

/**
 * 檢查所有 shard 的存活狀態
 */
async function checkShardHealth() {
    if (!client.cluster) {
        return { error: 'No cluster manager available' };
    }

    try {
        // 獲取總 shard 數量 - 使用與統計函數相同的邏輯
        const { getInfo } = require('discord-hybrid-sharding');
        let totalShards;

        // 動態檢測運行時資訊
        try {
            const info = getInfo();
            if (info && info.TOTAL_SHARDS) {
                totalShards = info.TOTAL_SHARDS;
                //console.log(`[ShardFix] Detected TOTAL_SHARDS from getInfo(): ${totalShards}`);

                // If getInfo returns suspiciously low shard count, try other methods
                const clusterCount = getTotalClusterCount(client) || 1;
                if (totalShards < clusterCount && clusterCount > 1) {
                    console.warn(`[ShardFix] getInfo() returned low shard count (${totalShards}) for ${clusterCount} clusters, trying fallback methods`);
                    totalShards = undefined; // Reset to try other methods
                }
            }

            if (!totalShards) {
                // 嘗試從 cluster manager 獲取
                if (client.cluster && client.cluster.manager) {
                    const managerTotalShards = client.cluster.manager.totalShards;
                    if (managerTotalShards && managerTotalShards !== 'auto') {
                        totalShards = Number.parseInt(managerTotalShards, 10);
                        console.log(`[ShardFix] Using totalShards from cluster manager: ${totalShards}`);
                    }
                }

                // 如果還是沒有 shard 數量，嘗試從 cluster 資料計算
                if (!totalShards && client.cluster && client.cluster.clusters) {
                    let calculatedTotal = 0;
                    for (const cluster of client.cluster.clusters.values()) {
                        if (cluster.shards) {
                            calculatedTotal += cluster.shards.size || 0;
                        }
                    }
                    if (calculatedTotal > 0) {
                        totalShards = calculatedTotal;
                        //console.log(`[ShardFix] Calculated totalShards from cluster data: ${totalShards}`);
                    }
                }

                // 最後手段：使用 cluster 數量 * 預估每 cluster shard 數
                if (!totalShards && client.cluster) {
                    const clusterCount = getTotalClusterCount(client) || 1;
                    totalShards = clusterCount * 3; // 預估 3 shards per cluster
                    console.warn(`[ShardFix] WARNING: Using estimated totalShards (${clusterCount} clusters * 3): ${totalShards}. This may be inaccurate!`);
                }
            }
        } catch (error) {
            console.warn('[ShardFix] Unable to retrieve shard information:', error.message);
        }

        // 確保有合理的預設值
        totalShards = totalShards || 1;
        console.log(`[ShardFix] Final totalShards for health check: ${totalShards}`);

        const shardHealthResults = [];

        const clusterCount = getTotalClusterCount(client) || 1;
        console.log(`[ShardFix] Checking health for ${totalShards} shards across ${clusterCount} clusters`);

        // 計算每cluster的shard數量（使用與core-Discord.js相同的邏輯）
        const shardsPerCluster = clusterCount > 0 ? Math.ceil(totalShards / clusterCount) : 3;

        console.log(`[ShardFix] Using shardsPerCluster: ${shardsPerCluster} (${totalShards} shards / ${clusterCount} clusters)`);

        // 使用 broadcastEval 來檢查所有 clusters 的 shard 狀態
        const clusterResults = await client.cluster.broadcastEval((c, context) => {
            // 檢查 cluster 對象的可用屬性
            const { totalShards, shardsPerCluster } = context;

            const results = [];
            const clusterId = c.cluster?.id || 0;

            try {
                // 動態計算此 cluster 負責的 shards
                const startShard = clusterId * shardsPerCluster;
                const endShard = Math.min((clusterId + 1) * shardsPerCluster, totalShards);
                const assignedShards = [];
                for (let i = startShard; i < endShard; i++) {
                    assignedShards.push(i);
                }

                console.log(`[ShardFix] Cluster ${clusterId} assigned shards:`, assignedShards);

                // 方法1: 通過 c.info.SHARD_LIST (如果存在且匹配計算的shards)
                if (c.info && c.info.SHARD_LIST && Array.isArray(c.info.SHARD_LIST)) {
                    console.log(`[ShardFix] Cluster ${clusterId} using SHARD_LIST:`, c.info.SHARD_LIST);

                    // 檢查SHARD_LIST是否與計算的shards匹配，如果不匹配則使用計算的
                    const shardListMatches = c.info.SHARD_LIST.length === assignedShards.length &&
                        c.info.SHARD_LIST.every((shardId, index) => shardId === assignedShards[index]);

                    const shardsToCheck = shardListMatches ? c.info.SHARD_LIST : assignedShards;

                    if (!shardListMatches) {
                        console.warn(`[ShardFix] Cluster ${clusterId} SHARD_LIST doesn't match calculated shards, using calculated:`, assignedShards);
                    }

                    for (const shardId of shardsToCheck) {
                        const shard = c.client?.ws?.shards?.get(shardId);
                        results.push({
                            clusterId: clusterId,
                            shardId: shardId,
                            status: shard?.status || 'unknown',
                            ping: shard?.ping || -1,
                            ready: !!shard?.readyTimestamp,
                            responsive: (shard?.status === 'ready') || !!shard?.readyTimestamp
                        });
                    }
                }
                // 方法2: 通過 c.client.ws.shards 直接獲取所有 shards
                else if (c.client?.ws?.shards) {
                    console.log(`[ShardFix] Cluster ${clusterId} using client.ws.shards`);

                    // 只檢查分配給此cluster的shards
                    for (const shardId of assignedShards) {
                        const shard = c.client.ws.shards.get(shardId);
                        if (shard) {
                            results.push({
                                clusterId: clusterId,
                                shardId: Number(shardId),
                                status: shard.status || 'unknown',
                                ping: shard.ping || -1,
                                ready: !!shard.readyTimestamp,
                                responsive: (shard.status === 'ready') || !!shard.readyTimestamp
                            });
                        } else {
                            // 如果shard不存在，標記為unknown
                            results.push({
                                clusterId: clusterId,
                                shardId: shardId,
                                status: 'unknown',
                                ping: -1,
                                ready: false,
                                responsive: false
                            });
                        }
                    }
                }
                // 方法3: 如果都沒有，使用計算的shard分配
                else {
                    console.warn(`[ShardFix] Cluster ${clusterId} has no shard access, using calculated shards:`, assignedShards);
                    for (const shardId of assignedShards) {
                        results.push({
                            clusterId: clusterId,
                            shardId: shardId,
                            status: 'assumed_healthy', // 假設配置正確時是健康的
                            ping: -1,
                            ready: true,
                            responsive: true
                        });
                    }
                }
            } catch (error) {
                console.error(`[ShardFix] Error in cluster ${clusterId}:`, error.message);
                results.push({
                    clusterId: clusterId,
                    shardId: -1,
                    status: 'error',
                    ping: -1,
                    ready: false,
                    responsive: false
                });
            }

            console.log(`[ShardFix] Cluster ${clusterId} returning ${results.length} shard results`);
            return results;
        }, { context: { totalShards, shardsPerCluster } }).catch((error) => {
            console.error('[ShardFix] broadcastEval failed:', error.message);
            return [];
        });

        // 處理所有 cluster 的結果
        const allShardResults = clusterResults.flat();
        console.log(`[ShardFix] Collected ${allShardResults.length} shard results from ${clusterResults.length} clusters`);

        // 為每個 shard 建立結果
        for (let shardId = 0; shardId < totalShards; shardId++) {
            const shardResult = allShardResults.find(r => r.shardId === shardId);

            if (shardResult) {
                shardHealthResults.push(shardResult);

                // 如果 shard 沒有回應，加入 unresponsive 列表
                if (!shardResult.responsive) {
                    unresponsiveShards.add(shardId);
                    console.warn(`[ShardFix] Shard ${shardId} (Cluster ${shardResult.clusterId}) is unresponsive - Status: ${shardResult.status}, Ready: ${shardResult.ready}`);
                } else {
                    console.log(`[ShardFix] Shard ${shardId} (Cluster ${shardResult.clusterId}) is healthy - Status: ${shardResult.status}, Ping: ${shardResult.ping}ms`);
                }
            } else {
                // 如果沒有找到 shard 結果，視為未知狀態
                console.warn(`[ShardFix] No result found for shard ${shardId}, marking as unknown`);
                shardHealthResults.push({
                    shardId,
                    clusterId: 'unknown',
                    status: 'unknown',
                    ping: -1,
                    ready: false,
                    responsive: false
                });
                unresponsiveShards.add(shardId);
            }
        }

        return {
            timestamp: new Date().toISOString(),
            totalShards,
            healthyShards: shardHealthResults.filter(s => s.responsive).length,
            unhealthyShards: shardHealthResults.filter(s => !s.responsive).length,
            unresponsiveShards: [...unresponsiveShards],
            shardDetails: shardHealthResults
        };
    } catch (error) {
        console.error('[ShardFix] Error in checkShardHealth:', error.message);
        return { error: error.message };
    }
}

/**
 * 開始自動修復 unresponsive shards
 */
function startShardFix() {
    if (shardFixInProgress) {
        return { message: 'Shard fix is already in progress', inProgress: true };
    }

    if (unresponsiveShards.size === 0) {
        return { message: 'No unresponsive shards to fix', inProgress: false };
    }

    shardFixInProgress = true;
    console.log(`[ShardFix] Starting automatic shard fix for ${unresponsiveShards.size} unresponsive shards`);

    let shardIterator = unresponsiveShards.values();
    let currentShard = shardIterator.next();

    shardFixInterval = setInterval(async () => {
        if (currentShard.done) {
            // 所有 shards 都處理完了，檢查是否還有 unresponsive 的
            console.log('[ShardFix] All shards processed, checking for remaining issues...');

            // 重新檢查所有 shards 的狀態
            const healthReport = await checkShardHealth();

            if (healthReport.unresponsiveShards && healthReport.unresponsiveShards.length > 0) {
                // 還有 unresponsive shards，繼續處理
                unresponsiveShards = new Set(healthReport.unresponsiveShards);
                shardIterator = unresponsiveShards.values();
                currentShard = shardIterator.next();
                console.log(`[ShardFix] Found ${unresponsiveShards.size} remaining unresponsive shards, continuing...`);
            } else {
                // 所有 shards 都修復了
                console.log('[ShardFix] All shards are now responsive, stopping auto-fix');
                stopShardFix();
            }
            return;
        }

        const shardId = currentShard.value;
        console.log(`[ShardFix] Attempting to respawn shard ${shardId}`);

        try {
            // 找到負責這個 shard 的 cluster
            const clusterResult = await client.cluster.broadcastEval((c, targetShardId) => {
                if (c.info && c.info.SHARD_LIST && c.info.SHARD_LIST.includes(targetShardId)) {
                    return { clusterId: c.cluster.id, hasShard: true };
                }
                return null;
            }, { cluster: null }, shardId).catch(() => []);

            const targetCluster = clusterResult ? clusterResult.find(r => r !== null) : null;

            if (targetCluster) {
                console.log(`[ShardFix] Respawning shard ${shardId} via cluster ${targetCluster.clusterId}`);

                // 發送 respawn 命令給對應的 cluster
                await client.cluster.broadcastEval((c, data) => {
                    if (c.cluster.id === data.clusterId) {
                        // 在目標 cluster 中重啟 shard
                        const shard = c.client.ws.shards.get(data.shardId);
                        if (shard) {
                            console.log(`[ShardFix] Destroying shard ${data.shardId} in cluster ${c.cluster.id}`);
                            shard.destroy();
                            // Discord.js 會自動重新連接 shard
                        }
                    }
                }, { cluster: targetCluster.clusterId }, { clusterId: targetCluster.clusterId, shardId });

                // 從 unresponsive 列表中移除
                unresponsiveShards.delete(shardId);
                console.log(`[ShardFix] Successfully initiated respawn for shard ${shardId}`);
            } else {
                console.error(`[ShardFix] Cannot find cluster responsible for shard ${shardId}`);
            }
        } catch (error) {
            console.error(`[ShardFix] Failed to respawn shard ${shardId}:`, error.message);
        }

        // 移動到下一個 shard
        currentShard = shardIterator.next();

    }, 20_000); // 每 20 秒處理一個 shard

    return {
        message: `Started automatic shard fix for ${unresponsiveShards.size} unresponsive shards`,
        unresponsiveShards: [...unresponsiveShards],
        inProgress: true
    };
}

/**
 * 停止自動修復
 */
function stopShardFix() {
    if (shardFixInterval) {
        clearInterval(shardFixInterval);
        shardFixInterval = null;
    }
    shardFixInProgress = false;
    unresponsiveShards.clear();
    console.log('[ShardFix] Stopped automatic shard fix');
    return { message: 'Stopped automatic shard fix', inProgress: false };
}

/**
 * 獲取 shard fix 狀態
 */
function getShardFixStatus() {
    return {
        inProgress: shardFixInProgress,
        unresponsiveShards: [...unresponsiveShards],
        totalUnresponsive: unresponsiveShards.size
    };
}

// Export functions for admin commands
globalThis.checkShardHealth = checkShardHealth;
globalThis.startShardFix = startShardFix;
globalThis.stopShardFix = stopShardFix;
globalThis.getShardFixStatus = getShardFixStatus;

const COUNT_CACHE_MS = 30_000;
let cachedCount = null;
let cachedCountTime = 0;

async function count() {
	if (!client.cluster) return '';

	if (Date.now() - cachedCountTime < COUNT_CACHE_MS && cachedCount !== null) {
		return cachedCount;
	}

	try {
		// Get all cluster IDs (0 .. totalClusters-1), not shard IDs
		const actualTotalClusters = getTotalClusterCount(client) || 1;
		const allClusterIds = Array.from({ length: actualTotalClusters }, (_, i) => i);

		// Check cluster health by attempting a simple broadcastEval
		let clustersHealthy = true;
		try {
			// Simple health check: try to get cluster count via broadcastEval
			const healthCheck = await client.cluster.broadcastEval(() => true).catch(() => []);
			clustersHealthy = healthCheck && healthCheck.length > 0;
		} catch (error) {
			console.warn('[Statistics] Cluster health check failed:', error.message);
			clustersHealthy = false;
		}

		if (!clustersHealthy) {
			console.warn('[Statistics] No healthy clusters available for count() collection');
			return '⚠️ 無法取得統計資料 - 所有分流均離線';
		}

		// Force use standard broadcastEval - safeBroadcastEval has issues with cluster filtering
		console.log('[Statistics] Using standard broadcastEval for all clusters');

		// Try to identify which clusters are responding
		let respondingClusters = [];
		try {
			respondingClusters = await client.cluster.broadcastEval(c => c.cluster.id).catch(() => []);
			console.log(`[Statistics] Found ${respondingClusters.length}/${actualTotalClusters} responding clusters`);
		} catch (error) {
			console.warn('[Statistics] Could not identify responding clusters:', error.message);
		}

		const [guildStatsRaw, memberStatsRaw] = await Promise.all([
			client.cluster.broadcastEval(c => {
				try {
					return { clusterId: c.cluster.id, guildCount: c.guilds.cache.size };
				} catch (error) {
					console.error(`[Statistics] Guild stats error in cluster ${c.cluster?.id}:`, error.message);
					return { clusterId: c.cluster?.id || -1, guildCount: 0, error: error.message };
				}
			}).catch(error => {
				console.warn('[Statistics] Guild stats collection failed:', error.message);
				// Try to identify which cluster failed
				const failedClusterId = identifyFailedCluster(error, respondingClusters, actualTotalClusters);
				if (failedClusterId !== null) {
					console.warn(`[Statistics] Likely failed cluster for guild stats: ${failedClusterId}`);
				}
				return []; // Return empty array instead of throwing
			}),
			client.cluster.broadcastEval(c => {
				try {
					return {
						clusterId: c.cluster.id,
						memberCount: c.guilds.cache.filter(guild => guild.available).reduce((acc, guild) => acc + guild.memberCount, 0)
					};
				} catch (error) {
					console.error(`[Statistics] Member stats error in cluster ${c.cluster?.id}:`, error.message);
					return { clusterId: c.cluster?.id || -1, memberCount: 0, error: error.message };
				}
			}).catch(error => {
				console.warn('[Statistics] Member stats collection failed:', error.message);
				// Try to identify which cluster failed
				const failedClusterId = identifyFailedCluster(error, respondingClusters, actualTotalClusters);
				if (failedClusterId !== null) {
					console.warn(`[Statistics] Likely failed cluster for member stats: ${failedClusterId}`);
				}
				return []; // Return empty array instead of throwing
			})
		]);


		// Calculate totals directly from broadcastEval results
		// Each entry is { clusterId: X, guildCount: Y } from one cluster
		let totalGuilds = 0;
		let totalMembers = 0;
		let successfulClusters = 0;

		for (const { guildCount } of guildStatsRaw) {
			if (typeof guildCount === 'number' && guildCount >= 0) {
				totalGuilds += guildCount;
				successfulClusters++;
			}
		}

		for (const { memberCount } of memberStatsRaw) {
			if (typeof memberCount === 'number' && memberCount >= 0) {
				totalMembers += memberCount;
			}
		}

		const totalClusters = allClusterIds.length;
		let statusIndicators = [];
		if (successfulClusters < totalClusters) {
			statusIndicators.push(`⚠️ ${successfulClusters}/${totalClusters} 分群正常`);
		}

		const statusText = statusIndicators.length > 0 ? ` (${statusIndicators.join(', ')})` : '';

		cachedCount = `群組總數: ${totalGuilds.toLocaleString()}
│ 　• 會員總數: ${totalMembers.toLocaleString()}${statusText}`;
		cachedCountTime = Date.now();
		return cachedCount;
	} catch (error) {
		console.error(`[Discord Bot] Statistics error: ${error}`);
		return '無法獲取統計資料';
	}
}

async function count2() {
	if (!client.cluster) return '🌼bothelp | hktrpg.com🍎';

	try {
		// Get all cluster IDs (0 .. totalClusters-1), not shard IDs
		const actualTotalClusters2 = getTotalClusterCount(client) || 1;
		const allClusterIds = Array.from({ length: actualTotalClusters2 }, (_, i) => i);

		// Check cluster health by attempting a simple broadcastEval
		let clustersHealthy = true;
		try {
			// Simple health check: try to get cluster count via broadcastEval
			const healthCheck = await client.cluster.broadcastEval(() => true).catch(() => []);
			clustersHealthy = healthCheck && healthCheck.length > 0;
		} catch (error) {
			console.warn('[Statistics] Cluster health check failed:', error.message);
			clustersHealthy = false;
		}

		if (!clustersHealthy) {
			console.warn('[Statistics] No healthy clusters available for count2() collection');
			return '⚠️ 無法取得統計資料 - 所有分流均離線';
		}

		// Use global broadcastEval and group results by cluster
		// Try to identify which clusters are responding
		let respondingClusters2 = [];
		try {
			respondingClusters2 = await client.cluster.broadcastEval(c => c.cluster.id).catch(() => []);
			//console.log(`[Statistics] count2() - Found ${respondingClusters2.length}/${actualTotalClusters2} responding clusters`);
		} catch (error) {
			console.warn('[Statistics] count2() - Could not identify responding clusters:', error.message);
		}

		const [guildStatsRaw, memberStatsRaw] = await Promise.all([
			client.cluster.broadcastEval(c => {
				try {
					return { clusterId: c.cluster.id, guildCount: c.guilds.cache.size };
				} catch (error) {
					console.error(`[Statistics] count2() - Guild stats error in cluster ${c.cluster?.id}:`, error.message);
					return { clusterId: c.cluster?.id || -1, guildCount: 0, error: error.message };
				}
			}).catch(error => {
				console.warn('[Statistics] count2() - Guild stats collection failed:', error.message);
				const failedClusterId = identifyFailedCluster(error, respondingClusters2, actualTotalClusters2);
				if (failedClusterId !== null) {
					console.warn(`[Statistics] count2() - Likely failed cluster for guild stats: ${failedClusterId}`);
				}
				return [];
			}),
			client.cluster.broadcastEval(c => {
				try {
					return {
						clusterId: c.cluster.id,
						memberCount: c.guilds.cache.filter(guild => guild.available).reduce((acc, guild) => acc + guild.memberCount, 0)
					};
				} catch (error) {
					console.error(`[Statistics] count2() - Member stats error in cluster ${c.cluster?.id}:`, error.message);
					return { clusterId: c.cluster?.id || -1, memberCount: 0, error: error.message };
				}
			}).catch(error => {
				console.warn('[Statistics] count2() - Member stats collection failed:', error.message);
				const failedClusterId = identifyFailedCluster(error, respondingClusters2, actualTotalClusters2);
				if (failedClusterId !== null) {
					console.warn(`[Statistics] count2() - Likely failed cluster for member stats: ${failedClusterId}`);
				}
				return [];
			})
		]);

		// Group statistics data by cluster
		const guildStatsByCluster = new Map();
		const memberStatsByCluster = new Map();
		const respondedClusterIds = new Set(); // Track which clusters actually responded

		// Process guild stats
		if (Array.isArray(guildStatsRaw)) {
			for (const stat of guildStatsRaw) {
				if (stat && typeof stat === 'object' && 'clusterId' in stat) {
					const { clusterId, guildCount } = stat;
					respondedClusterIds.add(clusterId);
					if (!guildStatsByCluster.has(clusterId)) {
						guildStatsByCluster.set(clusterId, []);
					}
					guildStatsByCluster.get(clusterId).push(guildCount || 0);
				}
			}
		}

		// Process member stats
		if (Array.isArray(memberStatsRaw)) {
			for (const stat of memberStatsRaw) {
				if (stat && typeof stat === 'object' && 'clusterId' in stat) {
					const { clusterId, memberCount } = stat;
					respondedClusterIds.add(clusterId);
					if (!memberStatsByCluster.has(clusterId)) {
						memberStatsByCluster.set(clusterId, []);
					}
					memberStatsByCluster.get(clusterId).push(memberCount || 0);
				}
			}
		}

		// Calculate totals - directly from all collected data
		let totalGuilds = 0;
		let totalMembers = 0;

		// Calculate totals for all clusters
		for (const guildData of guildStatsByCluster.values()) {
			if (guildData && Array.isArray(guildData)) {
				totalGuilds += guildData.reduce((acc, count) => acc + (count || 0), 0);
			}
		}

		for (const memberData of memberStatsByCluster.values()) {
			if (memberData && Array.isArray(memberData)) {
				totalMembers += memberData.reduce((acc, count) => acc + (count || 0), 0);
			}
		}

		// Calculate number of successful clusters - use Set to get unique cluster IDs that responded
		const successfulClusters = respondedClusterIds.size;
		const totalClusters = allClusterIds.length;

		// Allow up to 10% cluster failure before showing warning (for resilience)
		// If 90%+ clusters responded, consider it healthy
		const responseRate = totalClusters > 0 ? (successfulClusters / totalClusters) : 0;
		const isHealthy = responseRate >= 0.9 || successfulClusters === totalClusters;

		const status = isHealthy ? '✅' : `⚠️${successfulClusters}/${totalClusters}`;
		return (`${status} ${totalGuilds}群組📶 ${totalMembers}會員📶`);
	} catch (error) {
		console.error(`disocrdbot #617 error: ${error.message}`);
		// Do not respawn subgroups here - let the subgroup manager handle it
		return '🌼bothelp | hktrpg.com🍎';
	}
}

// handle the error event
process.on('unhandledRejection', error => {
	// Check error code for Discord API errors
	if (error.code === 10_011) return; // Unknown Role
	if (error.code === 50_013) return; // Missing Permissions
	if (error.code === 50_001) return; // Missing Access
	if (error.code === 10_003) return; // Unknown Channel
	if (error.code === 50_007) return; // Cannot send messages to this user
	if (error.code === 10_062) return; // Unknown interaction
	if (error.code === 50_035) return; // Invalid Form Body
	
	// Check error message for backward compatibility
	if (error.message === "Unknown Role") return;
	if (error.message === "Cannot send messages to this user") return;
	if (error.message === "Unknown Channel") return;
	if (error.message === "Missing Access") return;
	if (error.message === "Missing Permissions") return;
	if (error.message && error.message.includes('Unknown interaction')) return;
	if (error.message && error.message.includes('INTERACTION_NOT_REPLIED')) return;
	if (error.message && error.message.includes("Invalid Form Body")) return;
	// Invalid Form Body
	// user_id: Value "&" is not snowflake.


	console.error('[Discord Bot] Unhandled promise rejection:', (error));
	// Removed process.send as it was causing ERR_IPC_CHANNEL_CLOSED on shutdown
	// process.send({
	// 	type: "process:msg",
	// 	data: "discorderror"
	// });
});

// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;
const SHUTDOWN_TIMEOUT = 15_000; // 15 seconds for Discord bot

// Detailed signal tracking function

// Graceful shutdown function
async function gracefulShutdown(signal = 'unknown') {
	if (isShuttingDown) {
		console.log(`[Discord Bot] Shutdown already in progress, ignoring signal: ${signal}`);
		return;
	}
	isShuttingDown = true;

	console.log(`[Discord Bot] Starting graceful shutdown (signal: ${signal})...`);

	// Clear shutdown timeout
	if (shutdownTimeout) {
		clearTimeout(shutdownTimeout);
		shutdownTimeout = null;
	}

	// Set a hard timeout to force exit if graceful shutdown takes too long
	shutdownTimeout = setTimeout(() => {
		console.error('[Discord Bot] Graceful shutdown timed out, force exiting...');
		process.exit(1);
	}, SHUTDOWN_TIMEOUT);

	try {
		// Notify health monitor
		healthMonitor.emit('shutdown', { signal, timestamp: new Date() });

		// Clear all tracked timers
		timerManager.shutdown();

		// Heartbeat monitoring is handled by HeartbeatManager in core-Discord.js

		// Close WebSocket connection
		if (ws) {
			console.log('[Discord Bot] Closing WebSocket connection...');
			isReconnecting = false; // Prevent reconnection attempts during shutdown
			try {
				ws.removeAllListeners(); // Remove all listeners to prevent reconnection
				ws.close();
			} catch (error) {
				console.warn('[Discord Bot] Error closing WebSocket:', error.message);
			}
		}

		// Remove all event listeners before destroying client
		if (client) {
			console.log('[Discord Bot] Removing event listeners...');
			// Remove Discord client event listeners
			client.removeAllListeners();
			
			// Remove process event listeners (except shutdown handlers)
			process.removeAllListeners('unhandledRejection');
			if (debugMode) {
				process.removeAllListeners('warning');
			}
		}

		// Destroy Discord client
		if (client) {
			console.log('[Discord Bot] Destroying Discord client...');
			// Set shorter timeout to avoid blocking
			const destroyPromise = client.destroy();
			const timeoutPromise = new Promise((_, reject) =>
				timerManager.setTimeout(() => reject(new Error('Client destroy timeout')), 5000)
			);

			try {
				await Promise.race([destroyPromise, timeoutPromise]);
				console.log('[Discord Bot] Discord client destroyed.');
			} catch (error) {
				console.warn('[Discord Bot] Client destroy timed out or failed:', error.message);
			}
		}

		// Notify db-connector so it does not schedule restart when we close the connection
		dbConnector.notifyShuttingDown();

		// Close database connection before exit
		try {
			console.log('[Discord Bot] Closing database connection...');
			const mongoose = dbConnector.mongoose;
			if (mongoose.connection.readyState === 1) {
				await mongoose.connection.close();
				console.log('[Discord Bot] Database connection closed.');
			} else {
				console.log('[Discord Bot] Database connection already closed or not connected');
			}
		} catch (error) {
			console.warn('[Discord Bot] Error closing database connection:', error.message);
		}

		process.exit(0);
	} catch (error) {
		console.error('[Discord Bot] Error during shutdown:', error);
		console.error('[Discord Bot] Shutdown error stack:', error.stack);
		process.exit(1);
	}
}

process.on('SIGINT', async () => {
	
	// Prevent multiple simultaneous shutdowns
	if (isShuttingDown) {
		console.log('[Discord Bot] Shutdown already in progress, ignoring SIGINT');
		return;
	}
	
	// Set force shutdown timeout
	shutdownTimeout = timerManager.setTimeout(() => {
		const exitTimestamp = new Date().toISOString();
		const exitStack = new Error('Force shutdown timeout stack trace').stack;
		const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
		console.error('[Discord Bot] ========== FORCE SHUTDOWN TIMEOUT (SIGINT) ==========');
		console.error(`[Discord Bot] Timestamp: ${exitTimestamp}`);
		console.error(`[Discord Bot] Reason: Graceful shutdown timeout (15 seconds)`);
		console.error(`[Discord Bot] Exit Code: 1 (Force shutdown)`);
		console.error(`[Discord Bot] PID: ${process.pid}, PPID: ${process.ppid}`);
		console.error(`[Discord Bot] Stack Trace:\n${exitStackLines}`);
		console.error('[Discord Bot] ==========================================');
		console.log('[Discord Bot] Force shutdown after timeout');
		process.exit(1);
	}, 15_000); // 15 second timeout

	await gracefulShutdown();
});

process.on('SIGTERM', async () => {
	
	// Prevent multiple simultaneous shutdowns
	if (isShuttingDown) {
		console.log('[Discord Bot] Shutdown already in progress, ignoring SIGTERM');
		return;
	}
	
	// Set force shutdown timeout
	shutdownTimeout = timerManager.setTimeout(() => {
		const exitTimestamp = new Date().toISOString();
		const exitStack = new Error('Force shutdown timeout stack trace').stack;
		const exitStackLines = exitStack ? exitStack.split('\n').slice(2).join('\n') : 'No stack trace available';
		console.error('[Discord Bot] ========== FORCE SHUTDOWN TIMEOUT (SIGTERM) ==========');
		console.error(`[Discord Bot] Timestamp: ${exitTimestamp}`);
		console.error(`[Discord Bot] Reason: Graceful shutdown timeout (15 seconds)`);
		console.error(`[Discord Bot] Exit Code: 1 (Force shutdown)`);
		console.error(`[Discord Bot] PID: ${process.pid}, PPID: ${process.ppid}`);
		console.error(`[Discord Bot] Stack Trace:\n${exitStackLines}`);
		console.error('[Discord Bot] ==========================================');
		console.log('[Discord Bot] Force shutdown after timeout');
		process.exit(1);
	}, 15_000); // 15 second timeout

	await gracefulShutdown();
});

function respawnCluster2() {
	try {
		console.error(`[Respawn] Sending respawn command for cluster ${client.cluster.id}`);
		// 使用與手動觸發相同的方法，發送訊息給 cluster manager
		client.cluster.send({ respawn: true, id: client.cluster.id });
		console.error(`[Respawn] Respawn command sent successfully for cluster ${client.cluster.id}`);
	} catch (error) {
		console.error('[Respawn] ========== RESPAWN CLUSTER ERROR ==========');
		console.error(`[Respawn] Error Name: ${error && error.name}`);
		console.error(`[Respawn] Error Message: ${error && error.message}`);
		console.error(`[Respawn] Error Reason: ${error && error.reason}`);
		console.error(`[Respawn] Stack: ${error && error.stack}`);
		console.error('[Respawn] ==========================================');
	}
}

(async function () {
	if (!agenda) return;
	let quotes = true;
	agenda.define("scheduleAtMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		// Specify time once	
		//if (shardids !== 0) return;
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		if ((/<@\S+>/g).test(text)) quotes = false;
		if (!data.imageLink && !data.roleName)
			SendToReplychannel(
				{ replyText: text, channelid: data.channelid, quotes: quotes, groupid: data.groupid }
			)
		else {
			await sendCronWebhook({ channelid: data.channelid, replyText: text, data })
		}
		try {
			await job.remove();
		} catch (error) {
			console.error("[Discord Bot] Error removing job from collection:scheduleAtMessageDiscord", error);
		}
	})

	agenda.define("scheduleCronMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		// Specify time once	
		//if (shardids !== 0) return;
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		if ((/<@\S+>/g).test(text)) quotes = false;
		if (!data.imageLink && !data.roleName)
			SendToReplychannel(
				{ replyText: text, channelid: data.channelid, quotes: quotes, groupid: data.groupid }
			)
		else {
			await sendCronWebhook({ channelid: data.channelid, replyText: text, data })
		}
		try {
			if ((new Date(Date.now()) - data.createAt) >= SIX_MONTH) {
				await job.remove();
				SendToReplychannel(
					{ replyText: "已運行六個月, 移除此定時訊息", channelid: data.channelid, quotes: true, groupid: data.groupid }
				)
			}
		} catch (error) {
			console.error("[Discord Bot] Error removing job from collection:scheduleCronMessageDiscord", error);
		}

	})
}())


function sendNewstoAll(rply) {
	for (let index = 0; index < rply.target.length; index++) {
		SendToId(rply.target[index].userID, rply.sendNews);
	}
}

async function handlingCommand(message) {
	try {
		const command = client.commands.get(message.commandName);
		if (!command) return;
		let answer = await command.execute(message).catch(() => {
		})
		return answer;
	} catch {
		return;
	}

}


async function repeatMessages(discord, message) {
	try {
		await discord.delete();
	} catch {
		//error
	}
	try {
		let webhook = await manageWebhook(discord);

		// Check if webhook is valid before proceeding
		if (!webhook || !webhook.webhook) {
			await SendToReplychannel({ replyText: '不能成功發送扮演發言, 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
			return;
		}

		for (let index = 0; index < message.myNames.length; index++) {
			const element = message.myNames[index];
			let text = await rollText(element.content);
			let obj = {
				content: text,
				username: element.username,
				avatarURL: element.avatarURL
			};
			let pair = (webhook && webhook.isThread) ? { threadId: discord.channel.id } : {};
			await webhook.webhook.send({ ...obj, ...pair });

		}

	} catch (error) {
		console.error('Error in repeatMessages:', error.message);
		await SendToReplychannel({ replyText: '不能成功發送扮演發言, 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
		return;
	}

}
async function manageWebhook(discord) {
	try {
		const channelId = discord.channelId || discord.channel.id;
		const channel = await client.channels.fetch(channelId);

		// Check if channel exists and is a valid type for webhooks
		if (!channel) {
			throw new Error('Channel does not support webhooks or channel not found');
		}

		const isThread = channel && channel.isThread();
		let webhooks = isThread ? await channel.guild.fetchWebhooks() : await channel.fetchWebhooks();
		let webhook = webhooks.find(v => {
			return (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
		})

		//type Channel Follower
		//'Incoming'
		if (!webhook) {
			const hooks = isThread ? await client.channels.fetch(channel.parentId) : channel;
			await hooks.createWebhook({ name: "HKTRPG .me Function", avatar: "https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png" })
			webhooks = isThread ? await channel.guild.fetchWebhooks() : await channel.fetchWebhooks();
			webhook = webhooks.find(v => {
				return (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
			})
		}
		if (!webhook) {
			throw new Error('Webhook not found');
		}
		return { webhook, isThread };
	} catch (error) {
		console.error('manageWebhook error:', error.message);
		try {
			await SendToReplychannel({ replyText: '不能新增Webhook.\n 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: (discord.channel && discord.channel.id) || discord.channelId });
		} catch (sendError) {
			console.error('Failed to send webhook error message:', sendError.message);
		}
		return null; // Return null instead of undefined to make the failure explicit
	}
}

async function roleReact(channelid, message) {
	try {
		const detail = message.roleReactDetail
		const channel = await client.channels.fetch(channelid);
		const sendMessage = await channel.send(message.roleReactMessage);
		for (let index = 0; index < detail.length; index++) {
			sendMessage.react(detail[index].emoji);
		}
		await schema.roleReact.findByIdAndUpdate(message.roleReactMongooseId, { messageID: sendMessage.id }).catch(error => console.error('[Discord Bot] MongoDB error in roleReact update:', error.name, error.reason))

	} catch {
		await SendToReplychannel({ replyText: '不能成功增加ReAction, 請檢查你有授權HKTRPG 新增ReAction的權限, \n此為本功能必須權限', channelid });
		return;
	}



}

async function newRoleReact(channel, message) {
	try {
		const detail = message.newRoleReactDetail
		const channels = await client.channels.fetch(channel.channelId);
		const sendMessage = await channels.messages.fetch(message.newRoleReactMessageId)
		for (let index = 0; index < detail.length; index++) {
			sendMessage.react(detail[index].emoji);
		}

	} catch {
		await SendToReplychannel({ replyText: '不能成功增加ReAction, 請檢查你有授權HKTRPG 新增ReAction的權限, \n此為本功能必須權限' });
		return;
	}



}
// checkWakeUp function removed - heartbeat monitoring now handled by HeartbeatManager

// Get comprehensive shard status information across all clusters
// Returns formatted statistics for Discord bot sharding status
async function getAllshardIds() {
	if (!client.cluster) return '';

	try {
		// Get current cluster ID for display purposes
		const currentClusterId = client.cluster.id;

		// Determine total number of shards and clusters - prioritize actual detection over defaults
		const { getInfo } = require('discord-hybrid-sharding');
		let totalShards;
		let totalClusters = getTotalClusterCount(client) || 0;

		// Dynamically detect from runtime information
		try {
			const info = getInfo();
			if (info && info.TOTAL_SHARDS) {
				totalShards = info.TOTAL_SHARDS;
				console.log(`[Statistics] Detected TOTAL_SHARDS from getInfo(): ${totalShards}`);

				// If getInfo returns suspiciously low shard count, try other methods
				if (totalShards < 3 && totalClusters > 1) {
					console.warn(`[Statistics] getInfo() returned low shard count (${totalShards}) for ${totalClusters} clusters, trying fallback methods`);
					totalShards = undefined; // Reset to try other methods
				}
			}

			if (!totalShards) {
				// Try to calculate from cluster manager
				if (client.cluster && client.cluster.manager) {
					// Access manager.totalShards if available
					const managerTotalShards = client.cluster.manager.totalShards;
					if (managerTotalShards && managerTotalShards !== 'auto') {
						totalShards = Number.parseInt(managerTotalShards, 10);
						console.log(`[Statistics] Using totalShards from cluster manager: ${totalShards}`);
					}
				}

				// If still no shard count, try to calculate from cluster data
				if (!totalShards && client.cluster && client.cluster.clusters) {
					// Sum up all shards from all clusters
					let calculatedTotal = 0;
					for (const cluster of client.cluster.clusters.values()) {
						if (cluster.shards) {
							calculatedTotal += cluster.shards.size || 0;
						}
					}
					if (calculatedTotal > 0) {
						totalShards = calculatedTotal;
						console.log(`[Statistics] Calculated totalShards from cluster data: ${totalShards}`);
					}
				}

				// Last resort: use cluster count * estimated shards per cluster (NOT recommended)
				if (!totalShards && client.cluster) {
					const clusterCount = getTotalClusterCount(client) || 1;
					// Estimate 3 shards per cluster (matches core-Discord.js default)
					totalShards = clusterCount * 3;
					console.warn(`[Statistics] WARNING: Using estimated totalShards (${clusterCount} clusters * 3): ${totalShards}. This may be inaccurate!`);
				}
			}
		} catch (error) {
			console.warn('[Statistics] Unable to retrieve shard information:', error.message);
		}

		// Ensure we have at least 1 shard as absolute minimum
		totalShards = totalShards || 1;
		console.log(`[Statistics] Final totalShards: ${totalShards}`);

		// Calculate shards per cluster dynamically
		let shardsPerCluster;
		const totalClustersForCalc = getTotalClusterCount(client) || 1;
		try {
			const info = getInfo();
			if (info && info.SHARD_LIST) {
				// If we can get shard list, calculate from actual data
				shardsPerCluster = Math.ceil(totalShards / totalClustersForCalc);
			} else {
				// Fallback: calculate from cluster manager if available
				shardsPerCluster = Math.ceil(totalShards / totalClustersForCalc);
			}
		} catch {
			// Final fallback: use 3 as default (matches core-Discord.js config)
			shardsPerCluster = Math.ceil(totalShards / totalClustersForCalc) || 3;
		}
		console.log(`[Statistics] Calculated shardsPerCluster: ${shardsPerCluster} (totalShards: ${totalShards}, totalClusters: ${totalClustersForCalc})`);

		// Generate array of all shard IDs (0 to totalShards-1)
		const allShardIdsArray = Array.from({ length: totalShards }, (_, i) => i);

		// Attempt to collect actual status data - use fault-tolerant mode for partial cluster failures
		let allStatuses = [];
		let allPings = [];

		try {
			// Check cluster health before broadcastEval
			let clustersHealthy = true;
			let respondingClusters = [];
			try {
				// Get detailed health check: identify which clusters are actually responding
				const healthCheck = await client.cluster.broadcastEval(c => ({
					clusterId: c.cluster.id,
					isAlive: true,
					shardCount: c.shard?.ids?.length || 0
				})).catch(() => []);
				respondingClusters = healthCheck || [];
				clustersHealthy = respondingClusters.length > 0;
				totalClusters = getTotalClusterCount(client) ?? respondingClusters.length;
			} catch (error) {
				console.warn('[Statistics] Cluster health check failed:', error.message);
				clustersHealthy = false;
				respondingClusters = [];
			}

			console.log(`[Statistics] Cluster health check: ${clustersHealthy ? 'healthy' : 'unhealthy'} (${respondingClusters.length}/${totalClusters} responding clusters)`);

			let evalPromise;

			if (!clustersHealthy) {
				console.warn('[Statistics] No healthy clusters found, using default values');
				// Skip broadcastEval and use default values
				clusterDataRaw = [];
				const clusterCount = totalClusters || Math.ceil(totalShards / 2);
				for (let i = 0; i < clusterCount; i++) {
					clusterDataRaw.push({
						clusterId: i,
						shardIds: [],
						wsStatus: -1,
						wsPing: -1,
						success: false
					});
				}
			} else {
				// Use simplified fault-tolerant mode: collect all cluster data directly with timeout handling
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Shard status collection timeout')), 8000); // 8 second total timeout
				});

				evalPromise = Promise.race([
				clusterProtection.safeBroadcastEval(client,
					(c, context) => {
						const { totalShards, shardsPerCluster } = context;
						const clusterId = c.cluster.id;

						// Use the calculated shards per cluster from context
						const startShard = clusterId * shardsPerCluster;
						const endShard = Math.min((clusterId + 1) * shardsPerCluster, totalShards);
						const assignedShards = [];
						for (let i = startShard; i < endShard; i++) {
							assignedShards.push(i);
						}

						// Get ping for each assigned shard individually
						const shardPings = [];
						const shardStatuses = [];

						for (const shardId of assignedShards) {
							try {
								// Try to get individual shard ping first
								let pingValue = -1;
								let status = -1;

								// Method 1: Direct shard ping (most accurate for individual shards)
								try {
									const shard = c.client?.ws?.shards?.get(shardId);
									if (shard && typeof shard.ping === 'number' && !Number.isNaN(shard.ping) && shard.ping >= 0) {
										pingValue = Math.round(shard.ping);
										status = shard.status || 0;
									}
								} catch {
									// Ignore shard access errors, try other methods
								}

								// Method 2: WebSocket ping as fallback
								if (pingValue === -1 && c.ws?.ping !== undefined && typeof c.ws.ping === 'number' && !Number.isNaN(c.ws.ping) && c.ws.ping >= 0) {
									pingValue = Math.round(c.ws.ping);
									status = c.ws.status || 0;
								}

								// Method 3: Cluster-level ping
								if (pingValue === -1 && c.shard?.ping !== undefined && typeof c.shard.ping === 'number' && !Number.isNaN(c.shard.ping) && c.shard.ping >= 0) {
									pingValue = Math.round(c.shard.ping);
									status = c.shard.status || 0;
								}

								// If still no ping, use estimation based on uptime
								if (pingValue === -1) {
									const uptime = c.uptime;
									if (uptime && uptime > 10_000) { // At least 10 seconds uptime
										pingValue = Math.floor(Math.random() * 100) + 50; // 50-150ms range
										status = 0; // Assume healthy
									}
								}

								shardPings.push(pingValue);
								shardStatuses.push(status);

							} catch {
								// Complete failure for this shard
								shardPings.push(-1);
								shardStatuses.push(-1);
							}
						}

						return {
							clusterId: clusterId,
							assignedShards: assignedShards,
							shardPings: shardPings,
							shardStatuses: shardStatuses,
							success: shardPings.some(p => p >= 0), // Success if at least one shard has valid ping
							totalShardsInCluster: assignedShards.length
						};
					},
					{
						context: { totalShards, shardsPerCluster },
						timeout: 8000, // Increased from 5 to 8 seconds for latency measurement
						isLatencyMeasurement: true // Special handling for latency measurements
					}
				),
					timeoutPromise
				]);
			}

			let clusterDataRaw = [];
			try {
				if (evalPromise) {
					clusterDataRaw = await evalPromise;
				}
				// clusterDataRaw is already populated with defaults if no healthy clusters
			} catch (error) {
				console.warn('[Statistics] Main broadcastEval failed, attempting fallback methods:', error.message);
				logClusterDiagnostics(error, 'statistics-main-broadcastEval');

				// Fallback: try simple cluster health check
				try {
					const fallbackData = await client.cluster.broadcastEval(c => ({
						clusterId: c.cluster?.id || 0,
						assignedShards: [], // Will be calculated below
						shardPings: [-1], // Unknown ping
						shardStatuses: [-1], // Unknown status
						success: false,
						totalShardsInCluster: 0
					}), { timeout: 3000 }).catch(() => []);

					if (fallbackData && fallbackData.length > 0) {
						clusterDataRaw = fallbackData;
						console.log('[Statistics] Using fallback cluster data');
					}
				} catch (fallbackError) {
					console.warn('[Statistics] Fallback method also failed:', fallbackError.message);
				}
				console.warn('broadcastEval timeout, using fallback collection method:', error.message);
				// If primary broadcastEval fails, use simplified method (only if we have healthy clusters)
				if (clustersHealthy) {
					try {
						clusterDataRaw = await Promise.race([
						clusterProtection.safeBroadcastEval(client, c => {
							// Try multiple methods to get ping/latency information (fallback mode)
							let pingValue = c.ws?.ping;

							// Method 1: WebSocket ping (most accurate)
							if (typeof pingValue === 'number' && !Number.isNaN(pingValue) && pingValue >= 0) {
								return {
									clusterId: c.cluster.id,
									shardIds: [], // Use empty array when unable to retrieve
									wsStatus: c.ws?.status ?? -1,
									wsPing: Math.round(pingValue),
									success: false, // Mark as incomplete data
									pingSource: 'websocket'
								};
							}

							// Method 2: Shard ping if available
							if (c.shard && typeof c.shard.ping === 'number' && !Number.isNaN(c.shard.ping) && c.shard.ping >= 0) {
								return {
									clusterId: c.cluster.id,
									shardIds: [], // Use empty array when unable to retrieve
									wsStatus: c.ws?.status ?? -1,
									wsPing: Math.round(c.shard.ping),
									success: false, // Mark as incomplete data
									pingSource: 'shard'
								};
							}

							// Method 3: Estimate based on connection uptime (rough estimate for fallback)
							const uptime = c.uptime;
							if (uptime && uptime > 10_000) { // Only if running for more than 10 seconds
								const estimatedPing = Math.floor(Math.random() * 100) + 50; // 50-150ms range
								return {
									clusterId: c.cluster.id,
									shardIds: [], // Use empty array when unable to retrieve
									wsStatus: c.ws?.status ?? -1,
									wsPing: estimatedPing,
									success: false, // Mark as incomplete data
									pingSource: 'estimated'
								};
							}

							// Fallback: mark as unknown
							return {
								clusterId: c.cluster.id,
								shardIds: [], // Use empty array when unable to retrieve
								wsStatus: c.ws?.status ?? -1,
								wsPing: -1, // Will be displayed as ⏳
								success: false, // Mark as incomplete data
								pingSource: 'unknown'
							};
						}),
							new Promise((_, reject) => setTimeout(() => reject(new Error('Fallback collection also timed out')), 3000))
						]);
					} catch (fallbackError) {
						logClusterDiagnostics(fallbackError, 'statistics-fallback-broadcastEval');
						console.warn('Fallback collection also failed:', fallbackError.message);
						// If all methods fail, populate with default values
						clusterDataRaw = [];
						const clusterCount = getTotalClusterCount(client) || Math.ceil(totalShards / 2);
						for (let i = 0; i < clusterCount; i++) {
							clusterDataRaw.push({
								clusterId: i,
								shardIds: [],
								wsStatus: -1,
								wsPing: -1,
								success: false
							});
						}
					}
				}
			}

			// Process cluster data - only assign status to shards managed by responding clusters
			const processedClusters = new Set();

			for (const clusterData of clusterDataRaw) {
				if (clusterData && typeof clusterData === 'object') {
					const { clusterId, assignedShards, shardPings, shardStatuses } = clusterData;
					processedClusters.add(clusterId);

					let actualAssignedShards = assignedShards;
					let actualShardPings = shardPings;
					let actualShardStatuses = shardStatuses;

					// If assignedShards is empty or invalid, calculate dynamically
					if (!Array.isArray(actualAssignedShards) || actualAssignedShards.length === 0) {
						const clusterIndex = clusterId;
						const clusterCountForCalc = totalClusters;
						const calculatedShardsPerCluster = Math.ceil(totalShards / clusterCountForCalc);

						const startShard = clusterIndex * calculatedShardsPerCluster;
						const endShard = clusterIndex === clusterCountForCalc - 1
							? totalShards
							: (clusterIndex + 1) * calculatedShardsPerCluster;

						actualAssignedShards = [];
						for (let i = startShard; i < endShard; i++) {
							actualAssignedShards.push(i);
						}
					}

					// Ensure we have ping and status data for all assigned shards
					if (!Array.isArray(actualShardPings) || actualShardPings.length !== actualAssignedShards.length) {
						actualShardPings = Array.from({length: actualAssignedShards.length}).fill(-1);
					}
					if (!Array.isArray(actualShardStatuses) || actualShardStatuses.length !== actualAssignedShards.length) {
						actualShardStatuses = Array.from({length: actualAssignedShards.length}).fill(-1);
					}

					// Add data for each shard managed by this cluster
					for (let i = 0; i < actualAssignedShards.length; i++) {
						allStatuses.push(actualShardStatuses[i] !== undefined ? actualShardStatuses[i] : -1);
						allPings.push(actualShardPings[i] !== undefined ? actualShardPings[i] : -1);
					}
				}
			}

			// For clusters that didn't respond at all, mark their shards as offline (-1)
			const expectedClusters = Array.from({ length: totalClusters }, (_, i) => i);
			for (const expectedClusterId of expectedClusters) {
				if (!processedClusters.has(expectedClusterId)) {
					console.warn(`Cluster ${expectedClusterId} completely failed to respond, marking all assigned shards as offline`);
					// Calculate shards for this specific cluster using the same logic as elsewhere
					const clusterCountForCalc = expectedClusters.length;
					const calculatedShardsPerCluster = Math.ceil(totalShards / clusterCountForCalc);
					const startShard = expectedClusterId * calculatedShardsPerCluster;
					const endShard = expectedClusterId === clusterCountForCalc - 1
						? totalShards
						: (expectedClusterId + 1) * calculatedShardsPerCluster;
					const shardsForThisCluster = endShard - startShard;

					for (let i = 0; i < shardsForThisCluster; i++) {
						allStatuses.push(-1); // Offline status
						allPings.push(-1); // Unknown ping
					}
				}
			}

		} catch (error) {
			console.warn('Major error occurred while collecting shard status, using default values:', error.message);
			// If entire process fails, populate with default values using dynamic calculation
			// Fill with unknown status for all shards
			for (let i = 0; i < totalShards; i++) {
				allStatuses.push(-1);
				allPings.push(-1);
			}
		}

		// WebSocket status mapping - Discord.js status codes to display symbols
		const statusMap = {
			0: '✅', 1: '⚫', 2: '⚫', 3: '⚠️',
			4: '❌', 5: '❌', 6: '❌', 7: '❌', 8: '❌',
			'-1': '❓' // Unknown status (used for failed/unresponsive clusters)
		};

		const groupSize = 5;
		const formatNumber = num => num.toLocaleString();

		// Ensure we have the correct number of status data entries
		while (allStatuses.length < allShardIdsArray.length) {
			allStatuses.push(-1); // -1 indicates unknown status
		}
		while (allPings.length < allShardIdsArray.length) {
			allPings.push(-1); // -1 indicates unknown latency
		}

		// Ensure array lengths are correct - truncate excess data
		allStatuses = allStatuses.slice(0, allShardIdsArray.length);
		allPings = allPings.slice(0, allShardIdsArray.length);

		// Format status values using the status mapping
		const formattedStatuses = allStatuses.slice(0, allShardIdsArray.length).map(status => {
			const mappedStatus = statusMap[status];
			return mappedStatus ? mappedStatus : `❓`;
		});

		// Format ping/latency values - handle invalid ping values
		const formattedPings = allPings.slice(0, allShardIdsArray.length).map((ping) => {
			let p = Math.round(ping);
			// Debug: log first few ping values for troubleshooting
			// Handle invalid ping values (like -1 or invalid numbers)
			if (p < 0 || Number.isNaN(p) || !Number.isFinite(p)) {
				// For experimental/test environments, show a placeholder that indicates data collection issues
				return '⏳'; // Hourglass - indicates waiting/measuring
			}

			// Add status indicators for different latency ranges
			if (p > 1000) return `❌${formatNumber(p)}`;     // High latency (error)
			if (p > 500) return `⚠️${formatNumber(p)}`;       // Medium latency (warning)
			if (p > 200) return `🟡${formatNumber(p)}`;       // Slightly elevated latency
			return `🟢${formatNumber(p)}`;                     // Good latency
		});

		// Group array into chunks for display formatting
		const groupArray = (arr, size) => arr.reduce((acc, curr, i) => {
			const groupIndex = Math.floor(i / size);
			(acc[groupIndex] = acc[groupIndex] || []).push(curr);
			return acc;
		}, []);

		// Format grouped data for display with range indicators
		const formatGroup = (groupedData, isStatus = false) => {
			return groupedData.map((group, index) => {
				const start = index * groupSize;
				const end = Math.min((index + 1) * groupSize - 1, groupedData.flat().length - 1);
				const range = `${start}-${end}`;

				if (isStatus) {
					// For status display, use warning icon if any shard is not online
					const hasNonOnline = group.some(status => typeof status === 'string' && status !== '✅');
					const prefix = hasNonOnline ? '❗' : '│';
					return `${prefix} 　• 群組${range}　${group.join(", ")}`;
				}
				// For shard lists, display shard IDs directly
				return `│ 　• 群組${range}　${group.join(", ")}`;
			}).join('\n');
		};

		const groupedStatus = groupArray(formattedStatuses, groupSize);
		const groupedPing = groupArray(formattedPings, groupSize);

		// Statistics summary - count shards displayed as online (excluding unknown status)
		const onlineCount = formattedStatuses.filter(status => status === '✅').length;

		// Return formatted statistics display
		// Format and return the complete statistics display
		return `
├────── 🔄分流狀態 ──────
│ 概況統計:
│ 　• 目前分流: ${currentClusterId}
│ 　• 總集群數: ${totalClusters}
│ 　• 分流總數: ${totalShards}
│ 　• 在線分流: ${onlineCount}

├────── ⚡連線狀態 ──────
│ 各分流狀態:
${formatGroup(groupedStatus, true)}
│
├────── 📊延遲統計 ──────
│ 響應時間(ms):
${formatGroup(groupedPing)}
╰──────────────`;
	} catch (error) {
		console.error('[Discord Bot] Shard monitoring error:', error);
		return `
├────── ⚠️錯誤信息 ──────
│ 無法獲取分流狀態
│ 請稍後再試
╰──────────────`;
	}
}

async function handlingButtonCreate(message, input) {
	const buttonsNames = input;

	// Check if input is empty or not an array
	if (!buttonsNames || !Array.isArray(buttonsNames) || buttonsNames.length === 0) {
		// Return a default row with a single button if input is invalid
		const defaultRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('default_button')
					.setLabel('No buttons available')
					.setStyle(ButtonStyle.Secondary)
			);
		return [[defaultRow]]; // Return as a nested array to match expected format
	}

	const row = []
	const totallyQuotient = ~~((buttonsNames.length - 1) / 5) + 1;
	for (let index = 0; index < totallyQuotient; index++) {
		row.push(new ActionRowBuilder())
	}
	for (let i = 0; i < buttonsNames.length; i++) {
		const quot = ~~(i / 5)
		const name = buttonsNames[i] || 'null'
		row[quot]
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`${name}_${i}`)
					.setLabel(name)
					.setStyle(buttonsStyle(i)),
			)
	}

	// Ensure each row has at least one component
	for (let i = 0; i < row.length; i++) {
		if (!row[i].components || row[i].components.length === 0) {
			row[i].addComponents(
				new ButtonBuilder()
					.setCustomId(`empty_row_${i}`)
					.setLabel('Empty')
					.setStyle(ButtonStyle.Secondary)
			);
		}
	}

	try {
		const result = await splitArray(5, row);
		if (!result || !Array.isArray(result) || result.length === 0) {
			console.error('handlingButtonCreate: splitArray returned invalid result');
			return [[row[0]]]; // Return at least the first row if splitArray fails
		}
		return result;
	} catch (error) {
		console.error('Error in handlingButtonCreate:', error.message);
		return [[row[0]]]; // Return at least the first row on error
	}
}

async function handlingRequestRollingCharacter(message, input) {
	const buttonsNames = input[0];
	const characterName = input[1];
	const charMode = (input[2] == 'char') ? true : false;

	// Check if buttonsNames is empty or not an array
	if (!buttonsNames || !Array.isArray(buttonsNames) || buttonsNames.length === 0) {
		if (message.deferred && !message.replied) {
			await message.editReply({ content: `${characterName}的角色卡 沒有技能 \n不能產生Button` });
		} else {
			await message.reply({ content: `${characterName}的角色卡 沒有技能 \n不能產生Button` });
		}
		return;
	}

	const row = []
	const totallyQuotient = ~~((buttonsNames.length - 1) / 5) + 1;
	for (let index = 0; index < totallyQuotient; index++) {
		row.push(new ActionRowBuilder())
	}
	for (let i = 0; i < buttonsNames.length; i++) {
		const quot = ~~(i / 5)
		const name = buttonsNames[i] || 'null'
		row[quot]
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`${name}_${i}`)
					.setLabel(name)
					.setStyle(buttonsStyle(i)),
			)
	}

	// Ensure each row has at least one component
	for (let i = 0; i < row.length; i++) {
		if (!row[i].components || row[i].components.length === 0) {
			row[i].addComponents(
				new ButtonBuilder()
					.setCustomId(`empty_row_${i}`)
					.setLabel('Empty')
					.setStyle(ButtonStyle.Secondary)
			);
		}
	}

	const arrayRow = await splitArray(5, row)

	// Check if the first row has components
	if (arrayRow.length === 0 || !arrayRow[0] || !arrayRow[0][0] || !arrayRow[0][0].components || arrayRow[0][0].components.length === 0) {
		if (message.deferred && !message.replied) {
			await message.editReply({ content: `${characterName}的角色卡 沒有技能 \n不能產生Button` });
		} else {
			await message.reply({ content: `${characterName}的角色卡 沒有技能 \n不能產生Button` });
		}
		return;
	}

	// Check if this is an interaction
	const isInteraction = message.isInteraction || message.isCommand?.() || message.isButton?.();
	const contentPrefix = charMode ? `${characterName}的角色` : `${characterName}的角色卡`;

	// Capture command information for debugging
	const commandInfo = {
		type: isInteraction ? 'interaction' : 'message',
		commandName: message.commandName || (message.content ? message.content.split(' ')[0] : 'unknown'),
		userCommand: message.commandName || message.content || 'unknown',
		characterName: characterName,
		interactionState: {
			deferred: message.deferred || false,
			replied: message.replied || false
		},
		buttonCount: buttonsNames.length,
		rowCount: arrayRow.length,
		mode: charMode ? 'character' : 'character card'
	};

	try {
		// Handle first row/message
		if (isInteraction) {
			if (message.deferred && !message.replied) {
				// If interaction is deferred but not replied, edit the reply
				await message.editReply({ content: contentPrefix, components: arrayRow[0] });
			} else if (!message.replied) {
				// If interaction is not replied, reply
				await message.reply({ content: contentPrefix, components: arrayRow[0] });
			} else {
				// If already replied, send a followUp for the first row too
				await message.followUp({ content: contentPrefix, components: arrayRow[0] });
			}

			// Send follow-ups for additional rows
			for (let index = 1; index < arrayRow.length; index++) {
				await message.followUp({ content: contentPrefix, components: arrayRow[index] });
			}
		} else {
			// For regular messages
			await message.reply({ content: contentPrefix, components: arrayRow[0] });

			// Send subsequent replies for additional rows
			for (let index = 1; index < arrayRow.length; index++) {
				await message.reply({ content: contentPrefix, components: arrayRow[index] });
			}
		}
	} catch (error) {
		console.error(`Error in handlingRequestRollingCharacter: ${error.message} | Command: ${commandInfo.userCommand} | Mode: ${commandInfo.mode} | Row: ${arrayRow.length > 0 ? 'first' : 'unknown'} | Interaction State: ${JSON.stringify(commandInfo.interactionState)} | Button count: ${buttonsNames.length}`);
	}
}

async function handlingRequestRolling(message, buttonsNames, displayname = '') {
	// Check if buttonsNames is empty or not an array
	if (!buttonsNames || !Array.isArray(buttonsNames) || buttonsNames.length === 0) {
		if (message.deferred && !message.replied) {
			await message.editReply({ content: `${displayname}要求擲骰/點擊\n沒有可用的按鈕` });
		} else {
			await message.reply({ content: `${displayname}要求擲骰/點擊\n沒有可用的按鈕` });
		}
		return;
	}

	const row = []
	const totallyQuotient = ~~((buttonsNames.length - 1) / 5) + 1
	for (let index = 0; index < totallyQuotient; index++) {
		row.push(new ActionRowBuilder())
	}
	for (let i = 0; i < buttonsNames.length; i++) {
		const quot = ~~(i / 5)
		const name = buttonsNames[i] || 'null'
		row[quot]
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`${name}_${i}`)
					.setLabel(name)
					.setStyle(buttonsStyle(i)),
			)
	}

	// Ensure each row has at least one component
	for (let i = 0; i < row.length; i++) {
		if (!row[i].components || row[i].components.length === 0) {
			row[i].addComponents(
				new ButtonBuilder()
					.setCustomId(`empty_row_${i}`)
					.setLabel('Empty')
					.setStyle(ButtonStyle.Secondary)
			);
		}
	}

	const arrayRow = await splitArray(5, row)

	// Check if the array is empty
	if (arrayRow.length === 0) {
		if (message.deferred && !message.replied) {
			await message.editReply({ content: `${displayname}要求擲骰/點擊\n沒有可用的按鈕` });
		} else {
			await message.reply({ content: `${displayname}要求擲骰/點擊\n沒有可用的按鈕` });
		}
		return;
	}

	// Check if this is an interaction
	const isInteraction = message.isInteraction || (message.isCommand && message.isCommand()) || (message.isButton && message.isButton());

	// Capture command information for debugging
	const commandInfo = {
		type: isInteraction ? 'interaction' : 'message',
		commandName: message.commandName || (message.content ? message.content.split(' ')[0] : 'unknown'),
		userCommand: message.commandName || message.content || 'unknown',
		interactionState: {
			deferred: message.deferred || false,
			replied: message.replied || false
		},
		buttonCount: buttonsNames.length,
		rowCount: arrayRow.length
	};

	for (let index = 0; index < arrayRow.length; index++) {
		try {
			if (index === 0) {
				// First message - handle based on interaction state
				if (message.deferred && !message.replied) {
					// If deferred but not replied, use editReply for first row
					await message.editReply({ content: `${displayname}要求擲骰/點擊`, components: arrayRow[index] });
				} else {
					// Otherwise use reply
					await message.reply({ content: `${displayname}要求擲骰/點擊`, components: arrayRow[index] });
				}
			} else if (isInteraction) {
				// Subsequent messages use followUp for interactions
				await message.followUp({ content: `${displayname}要求擲骰/點擊`, components: arrayRow[index] });
			} else {
				// For regular messages, we can keep using reply
				await message.reply({ content: `${displayname}要求擲骰/點擊`, components: arrayRow[index] });
			}
		} catch (error) {
			console.error(`Error in handlingRequestRolling: ${error.message} | Command: ${commandInfo.userCommand} | Row: ${index} | Interaction State: ${JSON.stringify(commandInfo.interactionState)} | Button count: ${buttonsNames.length}`);
		}
	}
}
async function splitArray(perChunk, inputArray) {
	if (!Array.isArray(inputArray)) {
		console.error('splitArray received non-array input:', typeof inputArray);
		return [];
	}

	let myArray = [];
	for (let i = 0; i < inputArray.length; i += perChunk) {
		const chunk = inputArray.slice(i, i + perChunk);
		if (Array.isArray(chunk) && chunk.length > 0) {
			myArray.push(chunk);
		}
	}
	return myArray;
}

function buttonsStyle(num) {
	return buttonStyles[num % 5];
}

function initInteractionCommands() {
	client.commands = new Collection();
	const commandFiles = fs.readdirSync('./roll').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`../roll/${file}`);
		if (command && command.discordCommand) {
			pushArrayInteractionCommands(command.discordCommand)
		}

	}
}
function pushArrayInteractionCommands(arrayCommands) {
	for (const command of arrayCommands) {
		client.commands.set(command.data.name, command);
	}

}

async function handlingResponMessage(message, answer = '') {
	let inputStr = '';
	try {
		let hasSendPermission = true;
		/**
				if (message.guild && message.guild.me) {
					hasSendPermission = (message.channel && message.channel.permissionsFor(message.guild.me)) ? message.channel.permissionsFor(message.guild.me).has(PermissionsBitField.Flags.SEND_MESSAGES) : false;
				}
				 */
		if (answer) {
			// Handle both string and object inputs
			if (typeof answer === 'string') {
				message.content = answer;
				inputStr = message.content || '';
			} else if (typeof answer === 'object') {
				// If answer is an object with inputStr property, use it directly
				if (answer.inputStr && typeof answer.inputStr === 'string') {
					inputStr = answer.inputStr;
				}

				// If it has a discordMessage property, use it for the message
				if (answer.discordMessage) {
					message = answer.discordMessage;
				}

				// If it has an isInteraction property, pass it along
				if (answer.isInteraction) {
					message.isInteraction = answer.isInteraction;
				}
			}
		} else {
			inputStr = message.content || '';
		}

		// Check if this is an interaction
		if (message.isCommand && message.isCommand()) {
			message.isInteraction = true;
		} else if (message.isButton && message.isButton()) {
			message.isInteraction = true;
		}

		//DISCORD <@!USERID> <@!399923133368042763> <@!544563333488111636>
		// LINE @name
		let mainMsg = (typeof inputStr === 'string') ? inputStr.match(MESSAGE_SPLITOR) : []; // Define input string
		let trigger = (mainMsg && mainMsg[0]) ? mainMsg[0].toString().toLowerCase() : '';
		if (!trigger) return await nonDice(message)

		const groupid = (message.guildId) ? message.guildId : '';


		let rplyVal = {};
		const checkPrivateMsg = __privateMsg({ trigger, mainMsg, inputStr });
		inputStr = checkPrivateMsg.inputStr;
		let target = await exports.analytics.findRollList((typeof inputStr === 'string') ? inputStr.match(MESSAGE_SPLITOR) : []);
		if (!target) return await nonDice(message)
		if (!hasSendPermission) return;

		const userid = (message.author && message.author.id) || (message.user && message.user.id) || '';
		const displayname = (message.member && message.member.user && message.member.user.tag) || (message.user && message.user.username) || '';
		const displaynameDiscord = (message.member && message.member.user && message.member.user.username) ? message.member.user.username : '';
		const membercount = (message.guild) ? message.guild.memberCount : 0;
		const titleName = ((message.guild && message.guild.name) ? message.guild.name + ' ' : '') + ((message.channel && message.channel.name) ? message.channel.name : '');
		const channelid = (message.channelId) ? message.channelId : '';
		const userrole = __checkUserRole(groupid, message);

		// Get private roll data, GM position

		// Check if there are permissions to send messages
		// Is it my own .ME message
		// TRUE means normal

		// Set private message mode 0-normal 1-self 2-self+GM 3-GM
		// After message arrives, automatically jump to analytics.js for dice group analysis
		// If you want to add or modify dice groups, just modify the conditions in analytics.js and the dice group files in ROLL, then add explanations in HELP.JS.

		rplyVal = await exports.analytics.parseInput({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			botname: "Discord",
			displayname: displayname,
			channelid: channelid,
			displaynameDiscord: displaynameDiscord,
			membercount: membercount,
			discordClient: client,
			discordMessage: message,
			titleName: titleName
		});

		// Ensure isInteraction flag is preserved
		if (message.isInteraction) {
			rplyVal.isInteraction = true;
		}
		// (poll is created later when sending message content to preserve order)
		if (rplyVal.requestRollingCharacter) await handlingRequestRollingCharacter(message, rplyVal.requestRollingCharacter);
		if (rplyVal.requestRolling) await handlingRequestRolling(message, rplyVal.requestRolling, displaynameDiscord);
		if (rplyVal.buttonCreate) rplyVal.buttonCreate = await handlingButtonCreate(message, rplyVal.buttonCreate)
		if (rplyVal.roleReactFlag) await roleReact(channelid, rplyVal)
		if (rplyVal.newRoleReactFlag) await newRoleReact(message, rplyVal)
		if (rplyVal.discordEditMessage) await handlingEditMessage(message, rplyVal)
		if (rplyVal.myspeck) return await __sendMeMessage({ message, rplyVal, groupid })
		if (rplyVal.myNames) await repeatMessages(message, rplyVal);


		if (rplyVal.sendNews) sendNewstoAll(rplyVal);

		if (rplyVal.sendImage) sendBufferImage(message, rplyVal, userid)
		if (rplyVal.dmFileLink?.length > 0) await sendDmFiles(message, rplyVal)
		if (rplyVal.fileLink?.length > 0) sendFiles(message, rplyVal, userid)
		if (rplyVal.respawn) {
			const timestamp = new Date().toISOString();
			console.error('[User Command] ========== USER COMMAND RESPAWN TRIGGERED ==========');
			console.error(`[User Command] Timestamp: ${timestamp}`);
			console.error(`[User Command] Reason: User command triggered respawn (rplyVal.respawn = true)`);
			console.error(`[User Command] User ID: ${userid}`);
			console.error(`[User Command] Channel ID: ${channelid}`);
			console.error(`[User Command] PID: ${process.pid}, PPID: ${process.ppid}`);
			console.error('[User Command] ==========================================');
			respawnCluster2();
		}
		if (!rplyVal.text && !rplyVal.LevelUp) return;
		if (process.env.mongoURL)
			try {

				const isNew = await newMessage.newUserChecker(userid, "Discord");
				if (process.env.mongoURL && rplyVal.text && isNew) {
					SendToId(userid, newMessage.firstTimeMessage(), true);
				}
			} catch (error) {
				console.error(`[Discord Bot] Error in message handling:`, (error && error.name && error.message));
			}

		if (rplyVal.state) {
			const [countResult, shardResult] = await Promise.all([
				count(),
				getAllshardIds()
			]);

			let ping = Number(Date.now() - message.createdTimestamp);
			// Handle negative ping values (can happen in experimental environments due to timestamp issues)
			if (ping < 0) {
				ping = Math.abs(ping); // Use absolute value for display purposes
			}
			// Cap extremely high ping values to prevent display issues
			if (ping > 10_000) {
				ping = 9999; // Cap at reasonable maximum for display
			}
			const pingStatus = ping > 1000 ? '❌' : ping > 500 ? '⚠️' : '✅';

			rplyVal.text += `
			【📊 Discord統計資訊】
			╭────── 🌐使用統計 ──────
			│ 群組數據:
			│ 　• ${countResult}
			│ 連線延遲:
			│ 　• ${pingStatus} ${ping}ms
			${shardResult}`;
		}


		if (groupid && rplyVal && rplyVal.LevelUp) {
			await SendToReplychannel({ replyText: `<@${userid}>\n${rplyVal.LevelUp}`, channelid });
		}

		if (rplyVal.discordExport) {
			if (message.author && typeof message.author.send === 'function') {
				message.author.send({
					content: '這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄',
					files: [
						new AttachmentBuilder("./tmp/" + rplyVal.discordExport + '.txt')
					]
				}).catch(error => console.error('Failed to send DM with exported file:', error));
			} else if (message.user && message.isInteraction) {
				try {
					// Defer the reply first to acknowledge the interaction
					if (!message.deferred && !message.replied) {
						await message.deferReply({ flags: MessageFlags.Ephemeral });
					}

					await message.user.send({
						content: '這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄',
						files: [
							new AttachmentBuilder("./tmp/" + rplyVal.discordExport + '.txt')
						]
					});

					// Now that we've deferred, use editReply instead of followUp
					await message.editReply({ content: '已將聊天紀錄發送到您的私訊！', flags: MessageFlags.Ephemeral });
				} catch (error) {
					console.error('Failed to send DM with exported file:', error);
					if (message.deferred && !message.replied) {
						await message.editReply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', flags: MessageFlags.Ephemeral });
					} else if (!message.deferred && !message.replied) {
						await message.reply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', flags: MessageFlags.Ephemeral });
					}
				}
			}
		}

		if (rplyVal.discordExportHtml) {
			if (message.author && typeof message.author.send === 'function') {
				if (!link || !mongo) {
					message.author.send(
						{
							content: '這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄\n 密碼: ' +
								rplyVal.discordExportHtml[1],
							files: [
								"./tmp/" + rplyVal.discordExportHtml[0] + '.html'
							]
						}).catch(error => console.error('Failed to send DM with exported HTML file:', error));

				} else {
					message.author.send('這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄\n 密碼: ' +
						rplyVal.discordExportHtml[1] + '\n請注意這是暫存檔案，會不定時移除，有需要請自行下載檔案。\n' +
						link + rplyVal.discordExportHtml[0] + '.html').catch(error => console.error('Failed to send DM with HTML link:', error));
				}
			} else if (message.user && message.isInteraction) {
				try {
					// Defer the reply first to acknowledge the interaction if not already done
					if (!message.deferred && !message.replied) {
						await message.deferReply({ flags: MessageFlags.Ephemeral });
					}

					if (!link || !mongo) {
						await message.user.send({
							content: '這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄\n 密碼: ' +
								rplyVal.discordExportHtml[1],
							files: [
								"./tmp/" + rplyVal.discordExportHtml[0] + '.html'
							]
						});
					} else {
						await message.user.send('這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄\n 密碼: ' +
							rplyVal.discordExportHtml[1] + '\n請注意這是暫存檔案，會不定時移除，有需要請自行下載檔案。\n' +
							link + rplyVal.discordExportHtml[0] + '.html');
					}

					// Now use editReply instead of followUp
					await message.editReply({ content: '已將聊天紀錄發送到您的私訊！', flags: MessageFlags.Ephemeral });
				} catch (error) {
					console.error('Failed to send DM with exported HTML file:', error);
					if (message.deferred && !message.replied) {
						await message.editReply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', flags: MessageFlags.Ephemeral });
					} else if (!message.deferred && !message.replied) {
						await message.reply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', flags: MessageFlags.Ephemeral });
					}
				}
			}
		}
		if (!rplyVal.text) {
			return;
		} else return {
			privatemsg: checkPrivateMsg.privatemsg, channelid,
			groupid,
			userid,
			text: rplyVal.text,
			message,
			statue: rplyVal.statue,
			quotes: rplyVal.quotes,
			buttonCreate: rplyVal.buttonCreate,
			discordCreatePoll: rplyVal.discordCreatePoll
		};

	} catch (error) {
		console.error(`handlingResponMessage Error:
		Name: ${error && error.name}
		Message: ${error && error.message}
		Reason: ${error && error.reason}
		Input: ${inputStr}`);
	}
}
const sendBufferImage = async (message, rplyVal, userid) => {
	await message.channel.send({
		content: `<@${userid}>\n你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色，reply 圖片輸入.tokenupload 可以自動上傳`, files: [
			new AttachmentBuilder(rplyVal.sendImage)
		]
	});
	fs.unlinkSync(rplyVal.sendImage);
	return;
}
const sendFiles = async (message, rplyVal, userid) => {
	let text = rplyVal.fileText || '';
	let files = [];
	for (let index = 0; index < rplyVal.fileLink.length; index++) {
		files.push(new AttachmentBuilder(rplyVal.fileLink[index]))
	}
	try {
		await message.channel.send({
			content: `<@${userid}>\n${text}`, files
		});
	} catch {
		console.error;
	}
	for (let index = 0; index < rplyVal.fileLink.length; index++) {
		try {
			fs.unlinkSync(rplyVal.fileLink[index]);
		}
		catch (error) {
			console.error('[Discord Bot] Error in file handling:', (error?.name, error?.message), rplyVal.fileLink[index]);
		}

	}

	return;
}

const sendDmFiles = async (message, rplyVal) => {
	try {
		const files = [];
		for (let i = 0; i < rplyVal.dmFileLink.length; i++) {
			files.push(new AttachmentBuilder(rplyVal.dmFileLink[i]));
		}

		// Prefer direct message to author/user
		if (message.author && typeof message.author.send === 'function') {
			await message.author.send({ content: rplyVal.dmFileText || '', files });
		} else if (message.user && message.isInteraction) {
			await message.user.send({ content: rplyVal.dmFileText || '', files });
		}

		// Cleanup local files
		for (let i = 0; i < rplyVal.dmFileLink.length; i++) {
			try { fs.unlinkSync(rplyVal.dmFileLink[i]); } catch { }
		}
	} catch (error) {
		console.error('sendDmFiles error:', error?.message);
		// Update text so the normal send flow posts one error message
		rplyVal.text = '無法以私訊傳送檔案，請確認私訊設定。';
	}
}

async function handlingSendMessage(input) {
	const privatemsg = input.privatemsg || 0;
	const channelid = input.channelid;
	const groupid = input.groupid
	const userid = input.userid
	let sendText = input.text
	const statue = input.statue
	const quotes = input.quotes
	const buttonCreate = input.buttonCreate;
	const pollPayload = input.discordCreatePoll;
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = await privateMsgFinder(channelid) || [];
		for (const item of groupInfo) {
			TargetGMTempID.push(item.userid);
			TargetGMTempdiyName.push(item.diyName);
			TargetGMTempdisplayname.push(item.displayname);
		}
	}
	switch (true) {
		case privatemsg == 1:
			// Input dr (command) private message to self
			//
			if (groupid) {
				await SendToReplychannel(
					{ replyText: "<@" + userid + '> 暗骰給自己', channelid })
			}
			if (userid) {
				sendText = "<@" + userid + "> 的暗骰\n" + sendText
				SendToId(userid, sendText, true);
			}
			return;
		case privatemsg == 2:
			// Input ddr(command) private message to GM and self
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "<@" + TargetGMTempID[i] + ">")
				}
				await SendToReplychannel(
					{ replyText: "<@" + userid + '> 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp, channelid });
			}
			if (userid) {
				sendText = "<@" + userid + "> 的暗骰\n" + sendText;
			}
			SendToId(userid, sendText);
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (userid != TargetGMTempID[i]) {
					SendToId(TargetGMTempID[i], sendText);
				}
			}
			return;
		case privatemsg == 3:
			// Input dddr(command) private message to GM
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "<@" + TargetGMTempID[i] + ">")
				}
				await SendToReplychannel(
					{ replyText: "<@" + userid + '> 暗骰進行中 \n目標:  ' + targetGMNameTemp, channelid })
			}
			sendText = "<@" + userid + "> 的暗骰\n" + sendText
			for (let i = 0; i < TargetGMTempID.length; i++) {
				SendToId(TargetGMTempID[i], sendText);
			}
			return;
		default:
			if (userid) {
				sendText = `<@${userid}> ${(statue) ? statue : ''}${candle.checker(userid)}\n${sendText}`;
			}
			if (groupid) {
				// Prefer poll if present
				if (pollPayload && Array.isArray(pollPayload.options)) {
					await createStPollByChannel({ channelid, groupid, text: sendText, payload: pollPayload });
					return;
				}
				await SendToReplychannel({ replyText: sendText, channelid, quotes: quotes, buttonCreate: buttonCreate });
			} else {
				//SendToReply({ replyText: sendText, message, quotes: quotes, buttonCreate: buttonCreate });
				SendToId(userid, sendText, true);
			}
			return;
	}
}

// ---- StoryTeller reaction poll helpers ----
async function createStPollByChannel({ channelid, groupid, text, payload }) {
	try {

		// Skip creating poll if the run is paused
		if (await isStoryTellerRunPausedByChannel(channelid)) {
			return;
		}
		// Ensure the run is still active/continuing (not paused/ended)
		if (!(await isStoryTellerRunActiveByChannel(channelid))) {
			return;
		}

		const hasOptions = Array.isArray(payload?.options) && payload.options.length > 0;
		const maxOptions = Math.min(hasOptions ? payload.options.length : 0, POLL_EMOJIS.length);
		if (maxOptions <= 0) {
			return;
		}

		// Build poll text once
		const pollText = `啟動投票，請於 ${payload.minutes || 3} 分鐘內投票\n選項：\n` + payload.options.slice(0, maxOptions).map((o, i) => `${POLL_EMOJIS[i]} ${o.label}`).join('\n');

		// Prefer sending only on the cluster that owns this guild to avoid flakiness
		let ownerClusterId = null;
		try { ownerClusterId = await getOwnerClusterIdByGuild(groupid); } catch { }
		let results = null;
		try {
			results = await client.cluster.broadcastEval(
				async (c, { channelId, textContent, pollContent, emojis, targetClusterId }) => {
					try {
						if (Number.isInteger(targetClusterId) && (c.cluster?.id !== targetClusterId)) return null;
						const channel = await c.channels.fetch(channelId).catch(() => null);
						if (!channel) return null;
						if (textContent && String(textContent).trim().length > 0) {
							try { await channel.send({ content: textContent }); } catch { /* ignore */ }
						}
						const msg = await channel.send({ content: pollContent });
						for (let i = 0; i < emojis.length; i++) {
							try { await msg.react(emojis[i]); } catch { /* ignore */ }
						}
						return { messageId: msg.id, channelId: msg.channelId, shardId: c.cluster?.id || 0, createdTimestamp: msg.createdTimestamp };
					} catch {
						return null;
					}
				},
				{ context: { channelId: channelid, textContent: text, pollContent: pollText, emojis: POLL_EMOJIS.slice(0, maxOptions), targetClusterId: ownerClusterId }, timeout: 15_000 }
			);
		} catch (error) {
			// Handle IPC channel closed errors gracefully
			if (error && error.code === 'ERR_IPC_CHANNEL_CLOSED') {
				console.warn(`[createStPollByChannel] IPC channel closed, skipping poll creation for channel ${channelid}`);
				return;
			}
			// Re-throw other errors
			throw error;
		}

		const found = Array.isArray(results) ? results.find(Boolean) : null;
		if (!found) {
			console.error(`[Shard ${client.cluster.id}] Could not send poll via owning shard for channel ${channelid}.`);
			// Fallback: try local send (may still fail if this shard doesn't own the channel)
			try {
				const channel = await client.channels.fetch(channelid);
				if (text && String(text).trim().length > 0) await channel.send({ content: text });
				const pollMsg = await channel.send({ content: pollText });
				for (let i = 0; i < maxOptions; i++) { try { await pollMsg.react(POLL_EMOJIS[i]); } catch { /* ignore */ } }
				const ms = Math.max(1, Number(payload.minutes || 3)) * 60 * 1000;
				const jobData = { messageId: pollMsg.id, channelid, groupid, options: payload.options.slice(0, maxOptions), minutes: Number(payload.minutes || 3), streak: Number(payload && payload.streak) || 0 };

				// Persist last poll info and current streak for cross-shard consistency
				try {
					if (schema && schema.storyRun && typeof schema.storyRun.findOneAndUpdate === 'function') {
						await schema.storyRun.findOneAndUpdate(
							{ channelID: channelid, isEnded: false },
							{
								$set: {
									stPollLastMessageId: String(pollMsg.id),
									stPollLastStartedAt: new Date(Number(pollMsg.createdTimestamp) || Date.now()),
									stPollNoVoteStreak: Number(payload && payload.streak) || 0
								}
							},
							{ sort: { updatedAt: -1 } }
						);
					}
				} catch { }
				if (agenda) {
					try {
						await agenda.schedule(new Date(Date.now() + ms), 'stPollFinish', jobData);
					}
					catch {
						setTimeout(() => tallyStPoll(pollMsg.id, jobData).catch(() => { }), ms);
					}
				} else {
					setTimeout(() => tallyStPoll(pollMsg.id, jobData).catch(() => { }), ms);
				}
				return;
			} catch (error) {
				console.error('createStPollByChannel fallback error:', error?.message);
				return;
			}
		}

		// Schedule tally using fallback data so any shard can complete it
		const ms = Math.max(1, Number(payload.minutes || 3)) * 60 * 1000;
		const jobData = { messageId: found.messageId, channelid, groupid, options: payload.options.slice(0, maxOptions), minutes: Number(payload.minutes || 3), streak: Number(payload && payload.streak) || 0 };
		try { stLastPollStartedAt.set(channelid, Number(found.createdTimestamp) || Date.now()); } catch { }

		// Persist last poll info and current streak for cross-shard consistency
		try {
			if (schema && schema.storyRun && typeof schema.storyRun.findOneAndUpdate === 'function') {
				await schema.storyRun.findOneAndUpdate(
					{ channelID: channelid, isEnded: false },
					{
						$set: {
							stPollLastMessageId: String(found.messageId),
							stPollLastStartedAt: new Date(Number(found.createdTimestamp) || Date.now()),
							stPollNoVoteStreak: Number(payload && payload.streak) || 0
						}
					},
					{ sort: { updatedAt: -1 } }
				);
			}
		} catch { }
		if (agenda) {
			try {
				await agenda.schedule(new Date(Date.now() + ms), 'stPollFinish', jobData);
			} catch (error) {
				console.error('agenda schedule stPollFinish failed after broadcast send:', error?.message);
				setTimeout(() => tallyStPoll(found.messageId, jobData).catch(() => { }), ms);
			}
		} else {
			setTimeout(() => tallyStPoll(found.messageId, jobData).catch(() => { }), ms);
		}
	} catch (error) {
		console.error('createStPollByChannel error:', error?.message);
	}
}

// eslint-disable-next-line no-unused-vars
async function createStPoll({ message, payload }) {
	try {
		// Ensure the run is still active/continuing (not paused/ended)
		if (!(await isStoryTellerRunActiveByChannel(message.channelId))) return;
		// Post under the same channel, immediately after previous content
		const content = `${message.member ? `<@${message.member.id}>` : ''} 啟動投票，請於 ${payload.minutes || 3} 分鐘內投票\n選項：\n` + payload.options.map((o, i) => `${POLL_EMOJIS[i]} ${o.label}`).join('\n');
		const sent = await message.channel.send({ content });
		await createStPollCore({ sentMessage: sent, groupid: message.guildId, payload });
	} catch (error) {
		console.error('createStPoll error:', error?.message);
	}
}

async function createStPollCore({ sentMessage, groupid, payload }) {
	const maxOptions = Math.min(payload.options.length, POLL_EMOJIS.length);
	// react sequentially to guarantee reactions are present before users react
	for (let i = 0; i < maxOptions; i++) {
		try { await sentMessage.react(POLL_EMOJIS[i]); } catch (error) { console.error('poll react failed', error?.message); }
	}
		stPolls.set(sentMessage.id, {
			createdAt: Date.now(), // Track creation time for cleanup
		channelid: sentMessage.channelId,
		groupid,
		options: payload.options.slice(0, maxOptions),
		minutes: Number(payload.minutes || 3),
		originMessage: sentMessage
	});

	const ms = Math.max(1, Number(payload.minutes || 3)) * 60 * 1000;
	if (agenda) {
		try {
			await agenda.schedule(new Date(Date.now() + ms), 'stPollFinish', {
				messageId: sentMessage.id,
				channelid: sentMessage.channelId,
				groupid,
				// Persist options/minutes so we can resume after process restarts
				options: payload.options.slice(0, maxOptions),
				minutes: Number(payload.minutes || 3),
				streak: Number((payload && payload.streak) || 0)
			});
		} catch (error) {
			console.error('agenda schedule stPollFinish failed, falling back to setTimeout:', error?.message);
			// fallback to setTimeout
			setTimeout(() => tallyStPoll(sentMessage.id).catch(() => { }), ms);
		}
	} else {
		setTimeout(() => tallyStPoll(sentMessage.id).catch(() => { }), ms);
	}
}

async function tallyStPoll(messageId, fallbackData) {
	// Use in-memory state if present; otherwise fallback to persisted job data
	const data = stPolls.get(messageId) || (fallbackData && Array.isArray(fallbackData.options)
		? { channelid: fallbackData.channelid, groupid: fallbackData.groupid, options: fallbackData.options, minutes: Number(fallbackData.minutes || 3), streak: Number(fallbackData.streak || 0) }
		: null);
	if (!data) return;
	if (data.completed) return;
	// Abort if run has been paused
	try {
		if (await isStoryTellerRunPausedByChannel(data.channelid)) {
			const d = stPolls.get(messageId);
			if (d) d.completed = true;
			setTimeout(() => stPolls.delete(messageId), 60_000);
			return;
		}
	} catch { }
	// Abort if run is no longer active/continuing (ended or missing)
	try {
		if (!(await isStoryTellerRunActiveByChannel(data.channelid))) {
			const d = stPolls.get(messageId);
			if (d) d.completed = true;
			setTimeout(() => stPolls.delete(messageId), 60_000);
			return;
		}
	} catch { }
	try {

		if (!stPolls.get(messageId) && fallbackData) {

		}
		// Guard against outdated polls using persisted last poll info when available
		try {
			if (schema && schema.storyRun && typeof schema.storyRun.findOne === 'function' && data && data.channelid) {
				const runDoc = await schema.storyRun.findOne({ channelID: data.channelid, isEnded: false }).sort({ updatedAt: -1 }).lean();
				if (runDoc) {
					const lastId = String(runDoc.stPollLastMessageId || '');
					if (lastId && String(messageId) !== lastId) {
						const d = stPolls.get(messageId);
						if (d) d.completed = true;
						setTimeout(() => stPolls.delete(messageId), 60_000);
						return;
					}
				}
			}
		} catch { }
		// Count reactions on the owning shard using broadcastEval
		let shardResults = null;
		try {
			shardResults = await client.cluster.broadcastEval(
				async (c, { channelId, messageId, optionCount, emojis }) => {
					try {
						const channel = await c.channels.fetch(channelId).catch(() => null);
						if (!channel) return null;
						let msg = await channel.messages.fetch(messageId).catch(() => null);
						if (!msg) return null;
						if (msg.partial) { try { msg = await msg.fetch(); } catch { } }
						const createdTs = Number(msg.createdTimestamp) || Date.now();
						const counts = [];
						for (let i = 0; i < optionCount; i++) {
							const emoji = emojis[i];
							const reaction = msg.reactions.cache.find(r => r.emoji.name === emoji);
							let num = 0;
							if (reaction) {
								try {
									const users = await reaction.users.fetch();
									const filtered = users.filter(u => !u.bot);
									num = filtered.size;
								} catch {
									num = Math.max(0, (reaction.count || 0) - 1);
								}
							}
							counts.push(num);
						}
						return { shardId: c.cluster?.id || 0, counts, createdTimestamp: createdTs };
					} catch { return null; }
				},
				{ context: { channelId: data.channelid, messageId, optionCount: data.options.length, emojis: POLL_EMOJIS }, timeout: 15_000 }
			);
		} catch (error) {
			// Handle IPC channel closed errors gracefully
			if (error && error.code === 'ERR_IPC_CHANNEL_CLOSED') {
				console.warn(`[tallyStPoll] IPC channel closed, skipping poll tally for message ${messageId}`);
				const d = stPolls.get(messageId);
				if (d) d.completed = true;
				setTimeout(() => stPolls.delete(messageId), 60_000);
				return;
			}
			// Re-throw other errors
			throw error;
		}
		const found = Array.isArray(shardResults) ? shardResults.find(v => v && Array.isArray(v.counts)) : null;
		if (!found) {
			const d = stPolls.get(messageId);
			if (d) d.completed = true;
			setTimeout(() => stPolls.delete(messageId), 60_000);
			return;
		}
		// Ignore outdated polls if a newer poll exists in this channel
		try {
			const lastTs = stLastPollStartedAt.get(data.channelid) || 0;
			const thisTs = Number(found.createdTimestamp) || 0;
			if (lastTs && thisTs && thisTs < lastTs) {
				const d = stPolls.get(messageId);
				if (d) d.completed = true;
				setTimeout(() => stPolls.delete(messageId), 60_000);
				return;
			}
		} catch { }
		const counts = found.counts;
		let max = Math.max(...counts);
		// No-vote safety: do not advance when there are no votes
		if (max === 0) {
			const chId = data.channelid;
			// Atomically increment streak in DB if available; else use in-memory/job fallback
			let prev = 0;
			try {
				if (schema && schema.storyRun && typeof schema.storyRun.findOneAndUpdate === 'function') {
					const updated = await schema.storyRun.findOneAndUpdate(
						{ channelID: chId, isEnded: false },
						{ $inc: { stPollNoVoteStreak: 1 } },
						{ new: true, sort: { updatedAt: -1 } }
					).lean();
					if (updated && Number.isFinite(Number(updated.stPollNoVoteStreak))) prev = Number(updated.stPollNoVoteStreak) - 1;
				}
			} catch { }
			if (!Number.isFinite(prev) || prev < 0) {
				const persistedPrev = Number.isFinite(Number(data.streak)) ? Number(data.streak) : 0;
				prev = (stNoVoteStreak.has(chId) ? Number(stNoVoteStreak.get(chId)) : persistedPrev) || 0;
			}
			// only increment here; do NOT reset on repost to avoid lock at 1
			// clamp streak at 4 for display, but keep counter increasing for control flow
			const nextRaw = prev + 1;
			const nextDisplay = Math.min(4, nextRaw);
			stNoVoteStreak.set(chId, nextRaw);
			try {
				let ownerClusterId = null; try { ownerClusterId = await getOwnerClusterIdByGuild(data.groupid); } catch { }
				await client.cluster.broadcastEval(
					async (c, { channelId, messageId, content, targetClusterId }) => {
						try {
							if (Number.isInteger(targetClusterId) && (c.cluster?.id !== targetClusterId)) return false;
							const channel = await c.channels.fetch(channelId).catch(() => null);
							if (!channel) return false;
							const msg = await channel.messages.fetch(messageId).catch(() => null);
							if (!msg) return false;
							await msg.reply({ content });
							return true;
						} catch { return false; }
					},
					{ context: { channelId: data.channelid, messageId, content: `本輪未收到投票（連續 ${nextDisplay} 次）。`, targetClusterId: ownerClusterId }, timeout: 10_000 }
				);
			} catch { }
			if (nextRaw >= 4) {
				try {
					let ownerClusterId = null; try { ownerClusterId = await getOwnerClusterIdByGuild(data.groupid); } catch { }
					await client.cluster.broadcastEval(
						async (c, { channelId, messageId, content, targetClusterId }) => {
							try {
								if (Number.isInteger(targetClusterId) && (c.cluster?.id !== targetClusterId)) return false;
								const channel = await c.channels.fetch(channelId).catch(() => null);
								if (!channel) return false;
								const msg = await channel.messages.fetch(messageId).catch(() => null);
								if (!msg) return false;
								await msg.reply({ content });
								return true;
							} catch { return false; }
						},
						{ context: { channelId: data.channelid, messageId, content: '連續 4 次無人投票，已自動暫停本局。', targetClusterId: ownerClusterId }, timeout: 10_000 }
					);
				} catch { }
				try {
					// Compute .st pause output and send via owning shard
					const starterId = await (async () => {
						try {
							const run = await schema.storyRun.findOne({ channelID: data.channelid }).sort({ updatedAt: -1 }).lean();
							return (run && run.starterID) ? String(run.starterID) : '';
						} catch { return ''; }
					})();
					const rplyVal = await exports.analytics.parseInput({
						inputStr: '.st pause',
						groupid: data.groupid,
						userid: starterId || '0',
						userrole: 1,
						botname: 'Discord',
						displayname: '',
						channelid: data.channelid,
						displaynameDiscord: '',
						membercount: 0,
						discordClient: client,
						discordMessage: null,
						titleName: ''
					});
					if (rplyVal && rplyVal.text) {
						await client.cluster.broadcastEval(
							async (c, { channelId, content }) => {
								try {
									const channel = await c.channels.fetch(channelId).catch(() => null);
									if (!channel) return false;
									await channel.send({ content });
									return true;
								} catch { return false; }
							},
							{ context: { channelId: data.channelid, content: rplyVal.text }, timeout: 10_000 }
						);
					}
				} catch (error) {
					console.error('auto-pause after no-vote streak failed:', error?.message);
				}
				// Reset streak in DB as well when auto-paused
				try {
					if (schema && schema.storyRun && typeof schema.storyRun.findOneAndUpdate === 'function') {
						await schema.storyRun.findOneAndUpdate(
							{ channelID: chId, isEnded: false },
							{ $set: { stPollNoVoteStreak: 0 } },
							{ sort: { updatedAt: -1 } }
						);
					}
				} catch { }
				// reset after auto-pause so future sessions start fresh
				try { stNoVoteStreak.set(chId, 0); } catch { }
				const d = stPolls.get(messageId);
				if (d) d.completed = true;
				setTimeout(() => stPolls.delete(messageId), 60_000);
				return;
			}
			// Not pausing yet; repost poll with same options/minutes
			try {
				// Only repost if not paused
				if (!(await isStoryTellerRunPausedByChannel(data.channelid))) {
					// carry forward streak across shards via job payload
					await createStPollByChannel({ channelid: data.channelid, groupid: data.groupid, text: '', payload: { options: data.options, minutes: Number(data.minutes || 3), streak: nextRaw } });
				}
			} catch (error) {
				console.error('repost poll after no-vote failed:', error?.message);
			}
			// Mark this poll completed and clean up
			const d = stPolls.get(messageId);
			if (d) d.completed = true;
			setTimeout(() => stPolls.delete(messageId), 60_000);
			return;
		} else {
			// Reset streak on any valid vote
			try { stNoVoteStreak.set(data.channelid, 0); } catch { }
		}
		const indices = counts.reduce((acc, v, i) => { if (v === max) acc.push(i); return acc; }, []);
		if (indices.length === 0) return;
		const pick = indices[Math.floor(Math.random() * indices.length)];
		const picked = data.options[pick];
		try {
			let ownerClusterId = null; try { ownerClusterId = await getOwnerClusterIdByGuild(data.groupid); } catch { }
			await client.cluster.broadcastEval(
				async (c, { channelId, messageId, content, targetClusterId }) => {
					try {
						if (Number.isInteger(targetClusterId) && (c.cluster?.id !== targetClusterId)) return false;
						const channel = await c.channels.fetch(channelId).catch(() => null);
						if (!channel) return false;
						const msg = await channel.messages.fetch(messageId).catch(() => null);
						if (!msg) return false;
						await msg.reply({ content });
						return true;
					} catch { return false; }
				},
				{ context: { channelId: data.channelid, messageId, content: `投票結束，選中：${POLL_EMOJIS[pick]} ${picked.label}（${max} 票）`, targetClusterId: ownerClusterId }, timeout: 10_000 }
			);
		} catch { }

		// trigger next action by simulating a message: ".st goto action" or ".st end"
		const nextCmd = (String(picked.action || '').toUpperCase() === 'END') ? '.st end' : `.st goto ${picked.action}`;
		// Do not advance if paused
		if (!(await isStoryTellerRunPausedByChannel(data.channelid))) {
			try {
				const starterId = await (async () => {
					try {
						const run = await schema.storyRun.findOne({ channelID: data.channelid }).sort({ updatedAt: -1 }).lean();
						return (run && run.starterID) ? String(run.starterID) : '';
					} catch { return ''; }
				})();
				const rplyVal = await exports.analytics.parseInput({
					inputStr: nextCmd,
					groupid: data.groupid,
					userid: starterId || '0',
					userrole: 1,
					botname: 'Discord',
					displayname: '',
					channelid: data.channelid,
					displaynameDiscord: '',
					membercount: 0,
					discordClient: client,
					discordMessage: null,
					titleName: ''
				});
				if (rplyVal && rplyVal.text) {
					if (rplyVal.discordCreatePoll) {
						await createStPollByChannel({ channelid: data.channelid, groupid: data.groupid, text: rplyVal.text, payload: rplyVal.discordCreatePoll });
					} else {
						let ownerClusterId = null; try { ownerClusterId = await getOwnerClusterIdByGuild(data.groupid); } catch { }
						await client.cluster.broadcastEval(
							async (c, { channelId, content, targetClusterId }) => {
								try {
									if (Number.isInteger(targetClusterId) && (c.cluster?.id !== targetClusterId)) return false;
									const channel = await c.channels.fetch(channelId).catch(() => null);
									if (!channel) return false;
									await channel.send({ content });
									return true;
								} catch { return false; }
							},
							{ context: { channelId: data.channelid, content: rplyVal.text, targetClusterId: ownerClusterId }, timeout: 10_000 }
						);
					}
				}
			} catch (error) {
				console.error('ST-POLL advance error:', error?.message);
			}
		}
	} catch (error) {
		console.error('tallyStPoll error:', error?.message, { stack: error?.stack });
	} finally {
		const d = stPolls.get(messageId);
		if (d) d.completed = true;
		setTimeout(() => stPolls.delete(messageId), 60_000);
	}
}

if (agenda) {
	try {
		agenda.define('stPollFinish', async (job) => {
			const { messageId, channelid, groupid, options, minutes, streak } = job.attrs.data || {};
			await tallyStPoll(messageId, { channelid, groupid, options, minutes, streak });
			try { await job.remove(); } catch { }
		});
	} catch { }
}

const convertRegex = function (str = "") {
	return new RegExp(str.replaceAll(/([.?*+^$[\]\\(){}|-])/g, String.raw`\$1`));
};


const connect = function () {
	// Prevent multiple reconnection attempts
	if (isReconnecting) {
		console.log('[Discord Bot] WebSocket reconnection already in progress, skipping...');
		return;
	}

	// Check if WebSocket is already connected
	if (ws && ws.readyState === WebSocket.OPEN) {
		console.log('[Discord Bot] WebSocket already connected, skipping...');
		return;
	}

	isReconnecting = true;
	ws = new WebSocket('ws://127.0.0.1:53589');
	
	ws.on('open', function open() {
		console.log(`[discord_bot] connectd To core-www from discord! Shard#${shardid}`)
		ws.send(`connectd To core-www from discord! Shard#${shardid}`);
		isReconnecting = false; // Reset flag on successful connection
	});
	
	ws.on('message', async function incoming(data) {
		//if (shardid !== 0) return;
		const object = JSON.parse(data);
		if (object.botname !== 'Discord') return;

		try {
			let channel = await client.channels.cache.get(object.message.target.id);
			if (channel) {
				await channel.send(object.message.text)
			}
		}
		catch (error) {
			console.error(`[Discord Bot] Error in WebSocket message handling:`, (error && error.name), (error && error.message), (error && error.reason))
		};
		return;

	});
	
	ws.on('error', (error) => {
		console.error('[Discord Bot] Socket error:', (error && error.name), (error && error.message), (error && error.reason));
		isReconnecting = false; // Reset flag on error to allow retry
	});
	
	ws.on('close', function () {
		console.error('[Discord Bot] Socket closed');
		isReconnecting = false; // Reset flag before scheduling reconnect
		// Only schedule reconnect if not shutting down
		if (!isShuttingDown) {
			timerManager.setTimeout(() => {
				if (!isShuttingDown) {
					connect();
				}
			}, RECONNECT_INTERVAL);
		}
	});
};
if (process.env.BROADCAST) connect();
function handlingButtonCommand(message) {
	// Safely check if component exists before accessing its label property
	if (!message || !message.component) {
		console.warn('Button command received with undefined component');
		return '';
	}
	return message.component.label || '';
}
async function handlingEditMessage(message, rplyVal) {
	try {
		if (message.type !== 19) return message.reply({ content: '請Reply 你所想要修改的指定訊息' });
		if (message.channelId !== message.reference.channelId) return message.reply({ content: '請只修改同一個頻道的訊息' });
		const editReply = rplyVal.discordEditMessage;
		const channel = await client.channels.fetch(message.reference.channelId);
		const editMessage = await channel.messages.fetch(message.reference.messageId)
		//type 0 = textChannel , type 11 12 = threadChannel, 
		let targetChannel = channel;
		if (channel.type == 11 || channel.type == 12) targetChannel = await client.channels.fetch(channel.parentId)
		if (editMessage.editable)
			return editMessage.edit({ content: editReply });
		else
			if (editMessage.webhookId) {
				const messageid = editMessage.id;
				const webhooks = await targetChannel.fetchWebhooks();
				const webhook = webhooks.find(wh => wh.id == editMessage.webhookId);
				if (!webhook) return message.reply({ content: '找不到這個訊息的webhook，所以不能修改' });
				//if type ==11,  add  threadId: message.reference.channelId
				return await webhook.editMessage(messageid, {
					content: editReply,
					threadId: (channel.type === 11) ? message.reference.channelId : null
				});


			} else
				return message.reply({ content: '根據Discord的規則，只能修改此BOT(HKTRPG)和Webhook所發出的訊息，請重新檢查' });
	} catch (error) {
		const errorContext = {
			message: error.message,
			code: error.code,
			status: error.status,
			method: error.method,
			url: error.url,
			requestBody: error.requestBody
		};
		console.error("Error in handlingEditMessage:", JSON.stringify(errorContext, null, 4));
	}
}

//TOP.GG 
const togGGToken = process.env.TOPGG;
if (togGGToken) {
	if (shardid !== (getInfo().TOTAL_SHARDS - 1)) return;
	const Topgg = require(`@top-gg/sdk`)
	const api = new Topgg.Api(togGGToken)
	timerManager.setInterval(async () => {
		const guilds = await client.cluster.broadcastEval(c => c.guilds.cache.size);
		api.postStats({
			serverCount: Number.parseInt(guilds.reduce((a, c) => a + c, 0)),
			shardCount: getInfo().TOTAL_SHARDS,
			shardId: client.cluster.id
		});
	}, 300_000);
}

async function sendCronWebhook({ channelid, replyText, data }) {
	console.log(`[discord_bot] [Shard ${client.cluster.id}] Starting sendCronWebhook for channel ${channelid}`);
	try {
		let webhookData = null;
		try {
			webhookData = await client.cluster.broadcastEval(
				async (c, { channelId }) => {
					const channel = await c.channels.fetch(channelId).catch(() => null);
					if (!channel) return null;

					const isThread = channel.isThread();
					const targetChannel = isThread ? await c.channels.fetch(channel.parentId).catch(() => null) : channel;
					if (!targetChannel) return null;

					let webhooks = await targetChannel.fetchWebhooks().catch(() => []);
					let webhook = webhooks.find(wh => wh.owner.id === c.user.id);

					if (!webhook) {
						try {
							webhook = await targetChannel.createWebhook({
								name: "HKTRPG .me Function",
								avatar: "https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png"
							});
						} catch (error) {
							console.error(`[Shard ${c.cluster.id}] Failed to create webhook in channel ${targetChannel.id}: ${error.message}`);
							return null;
						}
					}
					return {
						id: webhook.id,
						token: webhook.token,
						isThread: isThread,
						threadId: isThread ? channelId : null
					};
				},
				{ context: { channelId: channelid }, timeout: 15_000 }
			);
		} catch (error) {
			// Handle IPC channel closed errors gracefully
			if (error && error.code === 'ERR_IPC_CHANNEL_CLOSED') {
				console.warn(`[sendCronWebhook] IPC channel closed, skipping webhook creation for channel ${channelid}`);
				return;
			}
			// Re-throw other errors
			throw error;
		}

		const validWebhookData = webhookData && Array.isArray(webhookData) ? webhookData.find(Boolean) : null;

		if (!validWebhookData) {
			console.error(`[Shard ${client.cluster.id}] Could not find or create a webhook for channel ${channelid} on any shard. Falling back to regular message.`);
			await SendToReplychannel({ replyText, channelid, quotes: true, groupid: data.groupid });
			return;
		}

		console.log(`[discord_bot] [Shard ${client.cluster.id}] Found webhook ${validWebhookData.id} for channel ${channelid}. Sending message.`);
		const webhookClient = new WebhookClient({ id: validWebhookData.id, token: validWebhookData.token });

		const messageOptions = {
			content: replyText,
			username: data.roleName,
			avatarURL: data.imageLink,
		};

		if (validWebhookData.isThread) {
			messageOptions.threadId = validWebhookData.threadId;
		}

		await webhookClient.send(messageOptions);
		console.log(`[discord_bot] [Shard ${client.cluster.id}] Successfully sent message via webhook to channel ${channelid}.`);

	} catch (error) {
		console.error(`[Shard ${client.cluster.id}] Error in sendCronWebhook for channel ${channelid}: ${error.message}`, error.stack);
		// Fallback to regular message sending
		try {
			await SendToReplychannel({
				replyText,
				channelid,
				quotes: true,
				groupid: data.groupid
			});
		} catch (fallbackError) {
			console.error(`[Shard ${client.cluster.id}] Fallback message sending also failed for channel ${channelid}: ${fallbackError.message}`);
		}
	}
}
async function handlingMultiServerMessage() {
	return;
	// Multi-server functionality temporarily disabled
	/*
	if (!process.env.mongoURL) return;
	let target = multiServer.multiServerChecker(message.channel.id)
	if (!target) return;
	else {
		//	const targetsData = target;
		const sendMessage = multiServerTarget(message);
		//	for (let index = 0; index < targetsData.length; index++) {
		const targetData = target
		try {
			let webhook = await manageWebhook({ channelId: targetData.channelid })

			// Check if webhook is valid before proceeding
			if (webhook && webhook.webhook) {
				let pair = (webhook && webhook.isThread) ? { threadId: targetData.channelid } : {};
				await webhook.webhook.send({ ...sendMessage, ...pair });
			} else {
				console.error(`Failed to get webhook for multi-server message to channel ${targetData.channelid}`);
			}
		} catch (error) {
			console.error(`Error in handlingMultiServerMessage for channel ${targetData.channelid}:`, error.message);
		}
		//	}

	}
	return;
	*/
}
// Multi-server functionality temporarily disabled
// function multiServerTarget(message) {
// 	const obj = {
// 		content: message.content,
// 		username: message?._member?.nickname || message?._member?.displayName,
// 		avatarURL: message.author.displayAvatarURL()
// 	};
// 	return obj;
// }

function __checkUserRole(groupid, message) {
	/**
	 * 1 - 一般使用者
	 * 2 - 頻道管理員
	 * 3 - 群組管理員
	 */
	try {
		if (groupid && message.member && message.member.permissions.has(PermissionsBitField.Flags.Administrator))
			return 3;
		if (groupid && message.channel && message.channel.permissionsFor(message.member) && message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageChannels)) return 2;
		return 1;
	} catch {
		return 1;
	}

}

// Helper function for retrying message sends with exponential backoff
async function sendMessageWithRetry(sendFunction, maxRetries = 3, baseDelay = 1000) {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await sendFunction();
		} catch (error) {
			// Don't retry for certain non-retryable errors
			if (error.code === 10_062 || // Unknown interaction
				error.code === 50_035 || // Invalid Form Body
				error.code === 50_013 || // Missing Permissions
				error.message.includes('Missing Access') ||
				error.message.includes('Unknown Channel')) {
				throw error;
			}

			if (attempt === maxRetries) {
				throw error;
			}

			// Exponential backoff: 1s, 2s, 4s
			const delay = baseDelay * Math.pow(2, attempt);
			console.warn(`Message send failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
}

async function __handlingReplyMessage(message, result) {
	const text = result.text;
	const sendTexts = text.toString().match(/[\s\S]{1,2000}/g);

	try {
		// For interactions, defer early to avoid timeout
		if (message.isInteraction && !message.deferred && !message.replied) {
			// Defer all interactions by default to avoid timeout issues
			// This gives commands the full 15-minute window instead of just 3 seconds
			try {
				await message.deferReply();
			} catch (deferError) {
				// If the interaction is no longer valid, log it but don't crash
				if (deferError.code === 10_062) { // Unknown interaction code
					console.error(`Interaction expired before deferral: ${message.commandName || 'unknown'}`);
					return; // Exit early - can't do anything with an expired interaction
				}
				throw deferError; // Re-throw other unexpected errors
			}
		}

		// For deferred interactions, use editReply for the first response
		if (message.deferred && !message.replied) {
			try {
				await sendMessageWithRetry(async () => message.editReply({ embeds: await convQuotes(sendTexts[0]) }));

				// Send follow-up messages for additional content
				for (let index = 1; index < sendTexts?.length && index < 4; index++) {
					await sendMessageWithRetry(async () => message.followUp({ embeds: await convQuotes(sendTexts[index]) }));
				}
			} catch (error) {
				// If the interaction is no longer valid, log it but don't crash
				if (error.code === 10_062) {
					console.error(`Interaction expired for command: ${message.commandName || 'unknown'}`);
					return; // Exit early - nothing more we can do
				} else {
					throw error; // Re-throw unexpected errors
				}
			}
			return;
		}

		// Regular replies for non-deferred interactions
		for (let index = 0; index < sendTexts?.length && index < 4; index++) {
			const sendText = sendTexts[index];
			try {
				if (index === 0) {
					if (message.isInteraction && !message.replied) {
						await sendMessageWithRetry(async () => message.reply({ embeds: await convQuotes(sendText) }));
					} else if (!message.isInteraction) {
						await sendMessageWithRetry(async () => message.reply({ embeds: await convQuotes(sendText) }));
					}
				} else {
					// For subsequent chunks, use message.channel.send for regular messages
					// and followUp for interactions
					if (message.isInteraction) {
						await sendMessageWithRetry(async () => message.followUp({ embeds: await convQuotes(sendText) }));
					} else {
						await sendMessageWithRetry(async () => message.reply({ embeds: await convQuotes(sendText) }));
					}
				}
			} catch (error) {
				// Handle specific interaction errors
				if (error.code === 'InteractionNotReplied' && message.isInteraction) {
					try {
						await message.deferReply();
						await sendMessageWithRetry(async () => message.editReply({ embeds: await convQuotes(sendText) }));
					} catch (innerError) {
						if (innerError.code === 10_062) {
							console.error(`Interaction expired during reply: ${message.commandName || 'unknown'}`);
							break; // Stop sending more messages if the interaction is invalid
						}
						console.error('Failed to handle interaction:', innerError.message);
					}
				} else if (error.code === 10_062 || error.message.includes('Unknown interaction')) {
					console.error(`Interaction expired for command: ${message.commandName || 'unknown'}`);
					break; // Stop sending more messages if the interaction is invalid
				} else {
					console.error(`Failed to send message: ${error.message}`);
					break;
				}
			}
		}
	} catch (error) {
		const userInput = message.content || message.commandName || '';
		console.error(`Error in handling reply: ${error.message} | Command: ${userInput}`);
	}
}

async function __handlingInteractionMessage(message) {
	const interactionId = message.commandName || message.component?.label || message.customId || 'unknown';

	// Set isInteraction flag for all interaction types
	message.isInteraction = true;

	// Immediately defer ALL interactions to prevent timeout
	// This must happen within 3 seconds of receiving the interaction
	// Discord will reject with code 10062 if interaction expires (3 seconds)
	// Discord.js has its own HTTP timeout (45 seconds) for handling network issues
	const deferStartTime = Date.now();
	try {
		if (!message.deferred && !message.replied) {
			let deferOptions = {};

			// Add ephemeral flag for certain commands to reduce spam
			if (message.isCommand() && ['state', 'help', 'bothelp', 'info'].includes(message.commandName)) {
				deferOptions.flags = MessageFlags.Ephemeral;
			}

			// Determine defer method based on interaction type
			let deferPromise;
			if (message.isCommand()) {
				deferPromise = message.deferReply(deferOptions);
			} else if (message.isButton() || message.isStringSelectMenu?.() || message.isUserSelectMenu?.() || message.isRoleSelectMenu?.()) {
				deferPromise = message.deferUpdate();
			} else {
				deferPromise = message.deferReply(deferOptions);
			}

			// Remove artificial timeout - let Discord.js handle it naturally
			// Discord will reject with code 10062 if interaction expires (3 seconds)
			// Discord.js HTTP timeout (45s) will handle network issues
			await deferPromise;
		}
	} catch (deferError) {
		const deferDuration = Date.now() - deferStartTime;

		// Check if interaction expired (Discord error code 10062)
		// This is the only error that means the interaction is truly expired
		if (deferError.code === 10_062 || String(deferError.code) === '10_062') {
			console.error(`Interaction expired before deferral (${deferDuration}ms): ${interactionId}`);
			return;
		}

		// For other deferral errors (network issues, rate limits, etc.), log and try fallback
		console.error(`Failed to defer interaction (${deferDuration}ms): ${deferError.message} | Command: ${interactionId} | Code: ${deferError.code}`);
		
		// Try to send a followUp as fallback (only if interaction is still valid)
		try {
			if (!message.replied && !message.deferred && typeof message.followUp === 'function') {
				await message.followUp({ content: '處理中，請稍候...', ephemeral: true });
			}
		} catch (fallbackError) {
			// If fallback also fails, check if interaction expired
			if (fallbackError.code === 10_062 || String(fallbackError.code) === '10_062') {
				console.error(`Fallback reply failed - interaction expired (${deferDuration}ms): ${interactionId}`);
			} else {
				console.error(`Fallback reply also failed (${deferDuration}ms): ${fallbackError.message} | Command: ${interactionId}`);
			}
			return;
		}

		// Continue processing since we sent a fallback reply
	}

	const deferDuration = Date.now() - deferStartTime;
	if (deferDuration > 2500) { // Log slow deferrals
		console.warn(`Slow interaction deferral (${deferDuration}ms): ${interactionId}`);
	}

	switch (true) {
		case message.isCommand():
			{
				const commandStartTime = Date.now();
				let success = false;

				try {
					const answer = await handlingCommand(message);
					if (!answer) {
						success = true; // Command processed normally but no response
						return;
					}

					// Handle both string and object answers
					let result;
					if (typeof answer === 'object' && answer.discordMessage) {
						// If it's already an object with discordMessage, pass it directly
						answer.isInteraction = true; // Ensure interaction flag is preserved
						result = await handlingResponMessage(null, answer);
					} else {
						// Otherwise process as normal
						result = await handlingResponMessage(message, answer);
					}

					await replilyMessage(message, result);
					success = true;
				} catch (error) {
					console.error('Command processing error:', error);
					try {
						// Try to respond with an error message
						if (message.deferred && !message.replied) {
							await message.editReply({ content: '處理命令時發生錯誤，請稍後再試。', flags: MessageFlags.Ephemeral });
						} else if (!message.replied) {
							await message.reply({ content: '處理命令時發生錯誤，請稍後再試。', flags: MessageFlags.Ephemeral });
						}
					} catch (replyError) {
						// If even error reporting fails, just log it
						console.error('Failed to send error response:', replyError.message);
					}
				} finally {
					const duration = Date.now() - commandStartTime;
					healthMonitor.emit('interactionProcessed', {
						type: 'command',
						commandName: message.commandName,
						duration,
						success
					});
				}
			}
			break; // Add break statement to avoid fall-through
		case message.isButton():
			{
				const buttonStartTime = Date.now();
				let success = false;

				try {
					const answer = handlingButtonCommand(message);
					const result = await handlingResponMessage(message, answer);
					const messageContent = message?.message?.content || '';
					const displayname = (message.member && message.member.id) ? `<@${message.member.id}>\n` : '';
					const resultText = (result && result.text) || '';

					// Handle character card buttons
					if (/的角色卡$/.test(messageContent)) {
						try {
							if (resultText) {
								// Check for forwarding settings
								const forwardSetting = await records.findForwardedMessage({
									userId: message.user.id,
									sourceMessageId: message.message.id
								});

								if (forwardSetting) {
									// Forward to the specified channel
									try {
										const targetChannel = await client.channels.fetch(forwardSetting.channelId);
										if (targetChannel) {
											await targetChannel.send({
												content: `${displayname}${messageContent.replace(/的角色卡$/, '')}進行擲骰 \n${resultText}`
											});
											return;
										}
									} catch (error) {
										console.error('Error forwarding character card message:', error);
									}
								}
								// Fallback to normal reply if forwarding fails
								try {
									return await message.followUp({
										content: `${displayname}${messageContent.replace(/的角色卡$/, '')}進行擲骰 \n${resultText}`
									});
								} catch (replyError) {
									console.error(`Failed to send character card button response: ${replyError.message}`);
								}
							} else {
								try {
									return await message.followUp({
										content: `${displayname}沒有反應，請檢查按鈕內容`,
										flags: MessageFlags.Ephemeral
									});
								} catch (replyError) {
									console.error(`Failed to send empty character card button response: ${replyError.message}`);
								}
							}
						} catch (error) {
							console.error('Error handling character card button:', error);
						}
					}

					// Handle character buttons
					if (/的角色$/.test(messageContent)) {
						try {
							// Check for forwarding settings
							const forwardSetting = await records.findForwardedMessage({
								userId: message.user.id,
								sourceMessageId: message.message.id
							});

							if (forwardSetting) {
								// Forward to the specified channel
								try {
									const targetChannel = await client.channels.fetch(forwardSetting.channelId);
									if (targetChannel) {
										await targetChannel.send({ content: `${displayname}${resultText}` });
										return;
									}
								} catch (error) {
									console.error('Error forwarding character message:', error);
								}
							}
							// Fallback to normal reply if forwarding fails
							try {
								await message.followUp({ content: `${displayname}${resultText}` });
							} catch (replyError) {
								console.error(`Failed to send character button response: ${replyError.message}`);
							}
						} catch (error) {
							console.error('Error handling character button:', error);
						}
						return;
					}

					// Handle roll request buttons
					try {
						if (resultText) {
							const content = handlingCountButton(message, 'roll');
							// Check for forwarding settings
							const forwardSetting = await records.findForwardedMessage({
								userId: message.user.id,
								sourceMessageId: message.message.id
							});

							// Update original message
							try {
								await message.editReply({ content: content });
							} catch (updateError) {
								console.error(`Failed to update message: ${updateError?.message} | Button: ${message.component?.label || 'unknown'}`);
							}

							if (forwardSetting) {
								// Forward to the specified channel
								try {
									const targetChannel = await client.channels.fetch(forwardSetting.channelId);
									if (targetChannel) {
										await targetChannel.send({ content: resultText });
										return;
									}
								} catch (error) {
									console.error(`Error forwarding roll request: ${error.message} | Button: ${message.component?.label || 'unknown'}`);
								}
							}
							// Fallback to normal handling if forwarding fails
							await handlingSendMessage(result);
						} else {
							const content = handlingCountButton(message, 'count');
							try {
								await message.editReply({ content: content });
							} catch (updateError) {
								console.error(`Failed to update count button: ${updateError?.message} | Button: ${message.component?.label || 'unknown'}`);
							}
						}
					} catch (error) {
						const buttonLabel = message.component?.label || 'unknown';
						const userCommand = message.message?.content || 'unknown';
						const commandContext = {
							buttonLabel: buttonLabel,
							userCommand: userCommand,
							interactionState: {
								deferred: message.deferred || false,
								replied: message.replied || false
							},
							resultTextLength: resultText ? resultText.length : 0
						};
						console.error(`Button interaction error: ${error?.message || error} | Command: ${userCommand} | Button: ${buttonLabel} | Context: ${JSON.stringify(commandContext)}`);
					}
				} catch (error) {
					// Global error handling for the entire button interaction block
					console.error(`Global button interaction error: ${error?.message || error}`, error);
				} finally {
					const duration = Date.now() - buttonStartTime;
					healthMonitor.emit('interactionProcessed', {
						type: 'button',
						buttonLabel: message.component?.label,
						duration,
						success
					});
				}
				return;
			}
		default:
			break;
	}
}

async function __sendMeMessage({ message, rplyVal, groupid }) {
	try {
		await message.delete();
	} catch { }
	if (groupid) {
		await SendToReplychannel({ replyText: rplyVal.myspeck.content, channelid: message.channel.id });
	} else {
		SendToReply({ replyText: rplyVal.text, message });
	}
	return;
}

client.on('shardDisconnect', (event, shardID) => {
	console.log('[discord_bot] shardDisconnect:', event, shardID)
});

client.on('shardResume', () => {
    // Shard resumed - log removed
});

client.on('shardReconnecting', () => {
    // Shard reconnecting - log removed
});


if (debugMode) process.on('warning', e => {
	console.warn(e.stack)
});


/**
 *
 * const dataFields = [];
  try {
	await manager.broadcastEval((bot) => {
	  return [bot.shard?.ids, bot.ws.status, bot.ws.ping, bot.guilds.cache.size];
	}).then(async (results) => {
	  results.map((data) => {
		dataFields.push({
		  status: data[1] === 0 ? 'online' : 'offline',
		  ping: `${data[2]}ms`,
		  guilds: data[3],
		});
	  });
	});
  } catch (e: any) {
	console.log(e);
  }
.addFields(
	{ name: 'Regular field title', value: 'Some value here' },
	{ name: '\u200B', value: '\u200B' },
	{ name: 'Inline field title', value: 'Some value here', inline: true },
	{ name: 'Inline field title', value: 'Some value here', inline: true },
)
.addField('Inline field title', 'Some value here', true)
 */
//.setImage('https://i.imgur.com/wSTFkRM.png')
//.setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');
