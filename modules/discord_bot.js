/* eslint-disable n/no-process-exit */
"use strict";
const fs = require('node:fs');

const { ClusterClient, getInfo } = require('discord-hybrid-sharding');
const Discord = require('discord.js');
const isImageURL = require('image-url-validator').default;
const WebSocket = require('ws');

const candle = require('../modules/candleDays.js');
const records = require('../modules/records.js');
const schema = require('../modules/schema.js');

exports.analytics = require('./analytics');
const debugMode = !!process.env.DEBUG;
const imageUrl = (/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)(\s?)$/igm);
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const adminSecret = process.env.ADMIN_SECRET || '';
const { Client } = Discord;
const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, AttachmentBuilder, ChannelType, MessageFlags, WebhookClient } = Discord;

const multiServer = require('../modules/multi-server')
const checkMongodb = require('../modules/dbWatchdog.js');
const errorCount = [];
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
client.login(channelSecret);
const MESSAGE_SPLITOR = (/\S+/ig);
const link = process.env.WEB_LINK;
const mongo = process.env.mongoURL
let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };

const newMessage = require('./message');

const RECONNECT_INTERVAL = 1 * 1000 * 60;
const shardid = client.cluster.id;
let ws;

// StoryTeller reaction poll support
const POLL_EMOJIS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];
const stPolls = new Map(); // messageId -> { channelid, groupid, options, originMessage, completed?: boolean }
const stNoVoteStreak = new Map(); // channelId -> consecutive no-vote count
const stLastPollStartedAt = new Map(); // channelId -> timestamp of latest poll start

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
			{ context: { gid: guildId } }
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
		if (message.author.bot) return;

		// 使用批次處理
		const [dbStatus, result] = await Promise.all([
			checkMongodb.isDbOnline(),
			handlingResponMessage(message)
		]);

		if (!dbStatus && checkMongodb.isDbRespawn()) {
			respawnCluster2();
		}

		await handlingMultiServerMessage(message);

		if (result?.text) {
			return handlingSendMessage(result);
		}

	} catch (error) {
		console.error('Discord messageCreate error:', error?.message);
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
		console.error('discord bot guildCreate  #114 error', (error && error.name), (error && error.message), (error && error.reason));
	}
})

client.on('interactionCreate', async message => {
	try {
		if (message.user && message.user.bot) return;
		return __handlingInteractionMessage(message);
	} catch (error) {
		console.error('discord bot interactionCreate #123 error', (error && error.name), (error && error.message), (error && error.reason));
	}
});


client.on('messageReactionAdd', async (reaction, user) => {
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId })
		.cache(30)
		.catch(error => {
			console.error('discord_bot #802 mongoDB error:', error.name, error.reason)
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
			member.roles.add(findEmoji.roleID.replaceAll(/\D/g, ''))
		} else {
			reaction.users.remove(user.id);
		}
	} catch (error) {
		console.error('Discord bot messageReactionAdd #249', (error && error.name), (error && error.message), (error && error.reason))
	}

});

client.on('messageReactionRemove', async (reaction, user) => {
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId }).catch(error => console.error('discord_bot #817 mongoDB error:', error.name, error.reason))
	try {
		if (!list || list.length === 0) return;
		const detail = list.detail;
		for (let index = 0; index < detail.length; index++) {
			if (detail[index].emoji === reaction.emoji.name || detail[index].emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`) {
				const member = await reaction.message.guild.members.fetch(user.id);
				member.roles.remove(detail[index].roleID.replaceAll(/\D/g, ''))
			}
		}
	} catch (error) {
		if (error.message === 'Unknown Member') return;
		console.error('Discord bot messageReactionRemove #268', (error && error.name), (error && error.message), (error && error.reason))
	}
});




client.once('clientReady', async () => {
	initInteractionCommands();
	if (process.env.BROADCAST) connect();
	//	if (shardid === 0) getSchedule();
	client.user.setActivity(`${candle.checker() || '🌼'}bothelp | hktrpg.com🍎`);
	console.log(`Discord: Logged in as ${client.user.tag}!`);
	let switchSetActivity = 0;

	//await sleep(6);
	// eslint-disable-next-line no-unused-vars
	const refreshId2 = setInterval(async () => {
		switch (switchSetActivity % 2) {
			case 1:
				client.user.setActivity(`${candle.checker() || '🌼'}bothelp | hktrpg.com🍎`);
				break;
			default:
				client.user.setActivity(await count2());
				break;
		}
		switchSetActivity = (switchSetActivity % 2) ? 2 : 3;
	}, 180_000);
});


let heartbeatInterval = null;
client.cluster.on('message', message => {
	if (message?.type === 'startHeartbeat') {
		if (client.cluster.id === 0) {
			console.log('[Cluster 0] Received startHeartbeat signal. Starting heartbeat monitor.');
			startHeartbeatMonitor();
		}
	}
});

function startHeartbeatMonitor() {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
	}

	const HEARTBEAT_CHECK_INTERVAL = 1000 * 60;
	const WARNING_THRESHOLD = 3;
	const CRITICAL_THRESHOLD = 5;
	const restartServer = () => {
		require('child_process').exec('sudo reboot');
	}
	let heartbeat = 0;

	console.log('Discord Heartbeat Monitor Started on Cluster 0.');

	heartbeatInterval = setInterval(async () => {
		const isAwake = await checkWakeUp();
		if (isAwake === true) {
			heartbeat = 0;
			return;
		}

		heartbeat++;

		if (Array.isArray(isAwake) && isAwake.length > 0) {
			console.log(`Discord Heartbeat: Down Shards: ${isAwake.join(',')} - Heartbeat: ${heartbeat}`);
			if (heartbeat > WARNING_THRESHOLD && adminSecret) {
				SendToId(adminSecret, `HKTRPG ID: ${isAwake.join(', ')} 可能下線了 請盡快檢查.`);
			}
			if (heartbeat > CRITICAL_THRESHOLD) {
				for (const shardId of isAwake) {
					client.cluster.evalOnManager(`this.clusters.get(${shardId}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10_000 });
				}
			}
		} else {
			console.log(`Discord Heartbeat: checkWakeUp failed. Heartbeat: ${heartbeat}`);
			if (heartbeat > WARNING_THRESHOLD && adminSecret) {
				SendToId(adminSecret, 'HKTRPG Heartbeat check failed. 可能有部份服務下線了 請盡快檢查.');
			}
		}

		if (heartbeat > 20) {
			restartServer();
		}
	}, HEARTBEAT_CHECK_INTERVAL);
}

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
				console.error('Discord message send error:', error.message, 'chunk:', chunk);
			}
		}
	}
}

async function SendToId(targetid, replyText, quotes = false) {
	try {
		const user = await client.users.fetch(targetid);
		await sendMessage({ target: user, replyText, quotes });
	} catch (error) {
		console.error('Discord SendToId error:', error.message);
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


//Set Activity 可以自定義正在玩什麼


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


async function count() {
	if (!client.cluster) return '';

	try {
		const [guildSizes, memberCounts] = await Promise.all([
			client.cluster.fetchClientValues('guilds.cache.size'),
			client.cluster.broadcastEval(c =>
				c.guilds.cache
					.filter(guild => guild.available)
					.reduce((acc, guild) => acc + guild.memberCount, 0)
			)
		]);

		const totalGuilds = guildSizes.reduce((acc, count) => acc + count, 0);
		const totalMembers = memberCounts.reduce((acc, count) => acc + count, 0);

		return `群組總數: ${totalGuilds.toLocaleString()}
│ 　• 會員總數: ${totalMembers.toLocaleString()}`;
	} catch (error) {
		console.error(`Discord統計錯誤: ${error}`);
		return '無法獲取統計資料';
	}
}

async function count2() {
	if (!client.cluster) return '🌼bothelp | hktrpg.com🍎';
	const promises = [
		client.cluster.fetchClientValues('guilds.cache.size'),
		client.cluster
			.broadcastEval(c => c.guilds.cache.filter((guild) => guild.available).reduce((acc, guild) => acc + guild.memberCount, 0))
	];

	return Promise.all(promises)
		.then(results => {
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
			const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
			return (` ${totalGuilds}群組📶-\n ${totalMembers}會員📶`);
		})
		.catch((error) => {
			console.error(`disocrdbot #617 error ${error}`)
			respawnCluster(error);
			return '🌼bothelp | hktrpg.com🍎';
		});
}

// handle the error event
process.on('unhandledRejection', error => {
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


	console.error('Discord Unhandled promise rejection:', (error));
	// Removed process.send as it was causing ERR_IPC_CHANNEL_CLOSED on shutdown
	// process.send({
	// 	type: "process:msg",
	// 	data: "discorderror"
	// });
});

// Global variables to track shutdown status
let isShuttingDown = false;
let shutdownTimeout = null;

// Detailed signal tracking function
function logSignalDetails(signal, moduleName) {
	const timestamp = new Date().toISOString();
	const pid = process.pid;
	const ppid = process.ppid;
	const uptime = process.uptime();
	const memoryUsage = process.memoryUsage();
	
	// Get stack trace (excluding this function and the signal handler)
	const stack = new Error('Signal stack trace').stack;
	const stackLines = stack ? stack.split('\n').slice(3).join('\n') : 'No stack trace available';
	
	// Try to get parent process information
	let parentInfo = 'Unable to read parent process info';
	try {
		const { execSync } = require('child_process');
		if (ppid && ppid !== 1) {
			try {
				// Try to get parent process command (Linux/Unix)
				const parentCmd = execSync(`ps -p ${ppid} -o comm= 2>/dev/null || ps -p ${ppid} -o command= 2>/dev/null || echo "N/A"`, { encoding: 'utf8', timeout: 1000 }).trim();
				parentInfo = `Parent Process (${ppid}): ${parentCmd || 'N/A'}`;
			} catch (error) {
				parentInfo = `Parent Process (${ppid}): Unable to read (${error.message})`;
			}
		} else if (ppid === 1) {
			parentInfo = 'Parent Process (1): init/systemd (orphaned process or direct system management)';
		}
	} catch (error) {
		parentInfo = `Error reading parent info: ${error.message}`;
	}
	
	// Check PM2 environment variables
	const pm2Info = {
		PM2_HOME: process.env.PM2_HOME || 'N/A',
		PM2_INSTANCE_ID: process.env.pm_id || process.env.NODE_APP_INSTANCE || 'N/A',
		PM2_PUBLIC_KEY: process.env.PM2_PUBLIC_KEY ? 'SET' : 'N/A',
		PM2_SECRET_KEY: process.env.PM2_SECRET_KEY ? 'SET' : 'N/A'
	};
	
	console.log(`[${moduleName}] ========== SIGNAL DETAILED LOG ==========`);
	console.log(`[${moduleName}] Signal: ${signal}`);
	console.log(`[${moduleName}] Timestamp: ${timestamp}`);
	console.log(`[${moduleName}] Process ID: ${pid}`);
	console.log(`[${moduleName}] Parent Process ID: ${ppid}`);
	console.log(`[${moduleName}] ${parentInfo}`);
	console.log(`[${moduleName}] PM2 Environment:`);
	console.log(`[${moduleName}]   - PM2_HOME: ${pm2Info.PM2_HOME}`);
	console.log(`[${moduleName}]   - PM2_INSTANCE_ID: ${pm2Info.PM2_INSTANCE_ID}`);
	console.log(`[${moduleName}]   - PM2_KEYS_SET: ${pm2Info.PM2_PUBLIC_KEY !== 'N/A' && pm2Info.PM2_SECRET_KEY !== 'N/A' ? 'YES' : 'NO'}`);
	console.log(`[${moduleName}] Uptime: ${uptime.toFixed(2)}s`);
	console.log(`[${moduleName}] Memory Usage: ${JSON.stringify({
		rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
		heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
		heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
	})}`);
	console.log(`[${moduleName}] Environment Variables:`);
	console.log(`[${moduleName}]   - SHARD_ID: ${process.env.SHARD_ID || 'N/A'}`);
	console.log(`[${moduleName}]   - CLUSTER_ID: ${process.env.CLUSTER_ID || 'N/A'}`);
	console.log(`[${moduleName}]   - NODE_ENV: ${process.env.NODE_ENV || 'N/A'}`);
	console.log(`[${moduleName}] Stack Trace:`);
	console.log(`[${moduleName}] ${stackLines}`);
	console.log(`[${moduleName}] ==========================================`);
	
	// Also log to stderr for better visibility
	console.error(`[${moduleName}] [ERROR] Received ${signal} signal at ${timestamp} (PID: ${pid}, PPID: ${ppid})`);
	console.error(`[${moduleName}] [ERROR] ${parentInfo}`);
}

// Graceful shutdown function
async function gracefulShutdown() {
	if (isShuttingDown) {
		console.log('[Discord Bot] Shutdown already in progress, ignoring duplicate call');
		return;
	}
	isShuttingDown = true;

	console.log('[Discord Bot] Starting graceful shutdown...');

	// Clear shutdown timeout
	if (shutdownTimeout) {
		clearTimeout(shutdownTimeout);
		shutdownTimeout = null;
	}

	try {
		// Close WebSocket connection
		if (ws) {
			console.log('[Discord Bot] Closing WebSocket connection...');
			ws.close();
		}

		// Destroy Discord client
		if (client) {
			console.log('[Discord Bot] Destroying Discord client...');
			await client.destroy();
			console.log('[Discord Bot] Discord client destroyed.');
		}

		console.log('[Discord Bot] Graceful shutdown completed');
		process.exit(0);
	} catch (error) {
		console.error('[Discord Bot] Error during shutdown:', error);
		console.error('[Discord Bot] Shutdown error stack:', error.stack);
		process.exit(1);
	}
}

process.on('SIGINT', async () => {
	logSignalDetails('SIGINT', 'Discord Bot');
	
	// Prevent multiple simultaneous shutdowns
	if (isShuttingDown) {
		console.log('[Discord Bot] Shutdown already in progress, ignoring SIGINT');
		return;
	}
	
	// Set force shutdown timeout
	shutdownTimeout = setTimeout(() => {
		console.log('[Discord Bot] Force shutdown after timeout');
		process.exit(1);
	}, 15_000); // 15 second timeout

	await gracefulShutdown();
});

process.on('SIGTERM', async () => {
	logSignalDetails('SIGTERM', 'Discord Bot');
	
	// Prevent multiple simultaneous shutdowns
	if (isShuttingDown) {
		console.log('[Discord Bot] Shutdown already in progress, ignoring SIGTERM');
		return;
	}
	
	// Set force shutdown timeout
	shutdownTimeout = setTimeout(() => {
		console.log('[Discord Bot] Force shutdown after timeout');
		process.exit(1);
	}, 15_000); // 15 second timeout

	await gracefulShutdown();
});

// Track process.exit calls
const originalExit = process.exit;
process.exit = function(code) {
	const timestamp = new Date().toISOString();
	const stack = new Error('Process exit stack trace').stack;
	const stackLines = stack ? stack.split('\n').slice(2).join('\n') : 'No stack trace available';
	
	console.error('[Discord Bot] ========== PROCESS.EXIT CALLED ==========');
	console.error(`[Discord Bot] Exit Code: ${code}`);
	console.error(`[Discord Bot] Timestamp: ${timestamp}`);
	console.error(`[Discord Bot] PID: ${process.pid}, PPID: ${process.ppid}`);
	console.error(`[Discord Bot] Is Shutting Down: ${isShuttingDown}`);
	console.error(`[Discord Bot] Stack Trace:\n${stackLines}`);
	console.error('[Discord Bot] ==========================================');
	
	return originalExit.call(process, code);
};

// Track process exit event
process.on('exit', (code) => {
	console.error(`[Discord Bot] Process exiting with code: ${code} (PID: ${process.pid})`);
});

function respawnCluster(err) {
	if (!/CLUSTERING_NO_CHILD_EXISTS/i.test(err.toString())) return;
	let number = err.toString().match(/\d+$/i);
	if (!errorCount[number]) errorCount[number] = 0;
	errorCount[number]++;
	if (errorCount[number] > 3) {
		try {
			client.cluster.evalOnManager(`this.clusters.get(${client.cluster.id}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10_000 });
		} catch (error) {
			console.error('respawnCluster #480 error', (error && error.name), (error && error.message), (error && error.reason));
		}
	}
}
function respawnCluster2() {
	try {
		client.cluster.evalOnManager(`this.clusters.get(${client.cluster.id}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10_000 });
	} catch (error) {
		console.error('respawnCluster2 error', (error && error.name), (error && error.message), (error && error.reason));
	}
}

(async function () {
	if (!agenda) return;
	let quotes = true;
	agenda.define("scheduleAtMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		//指定時間一次	
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
			console.error("Discord Error removing job from collection:scheduleAtMessageDiscord", error);
		}
	})

	agenda.define("scheduleCronMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		//指定時間一次	
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
			console.error("Discord Error removing job from collection:scheduleCronMessageDiscord", error);
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
		await schema.roleReact.findByIdAndUpdate(message.roleReactMongooseId, { messageID: sendMessage.id }).catch(error => console.error('discord_bot #786 mongoDB error:', error.name, error.reason))

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
async function checkWakeUp() {
	const promises = [
		client.cluster.broadcastEval(c => c.ws.status)
	];
	return Promise.all(promises)
		.then(results => {
			const indexes = results[0].reduce((r, n, i) => {
				n !== 0 && r.push(i);
				return r;
			}, []);
			if (indexes.length > 0) {
				// Would call checkMongodb.discordClientRespawn for each index if needed
				return indexes;
			}
			else return true;
			//if (results[0].length !== number || results[0].reduce((a, b) => a + b, 0) >= 1)
			//		return false
			//	else return true;
		})
		.catch(error => {
			console.error(`disocrdbot #836 error`, (error && error.name), (error && error.message), (error && error.reason))
			return false
		});

}

async function getAllshardIds() {
	if (!client.cluster) return '';

	try {
		const [shardIds, wsStatus, wsPing, clusterId] = await Promise.all([
			[...client.cluster.ids.keys()],
			client.cluster.broadcastEval(c => c.ws.status),
			client.cluster.broadcastEval(c => c.ws.ping),
			client.cluster.id
		]);

		// WebSocket status mapping - Discord.js uses numeric status codes
		const statusMap = {
			0: '✅在線',     // READY
			1: '⚫隱身',     // CONNECTING
			2: '⚫隱身',     // RECONNECTING
			3: '⚠️閒置',     // IDLE
			4: '❌離線',     // NEARLY
			5: '❌離線',     // DISCONNECTED
			6: '❌離線',     // WAITING_FOR_GUILDS
			7: '❌離線',     // IDENTIFYING
			8: '❌離線'      // RESUMING
		};

		const groupSize = 5;
		const formatNumber = num => num.toLocaleString();

		// 轉換狀態和延遲
		const onlineStatus = wsStatus.map(status => {
			const mappedStatus = statusMap[status];
			return mappedStatus ? mappedStatus : `❓未知(${status})`;
		});
		const pingTimes = wsPing.map(ping => {
			const p = Math.round(ping);
			return p > 1000 ? `❌${formatNumber(p)}` :
				p > 500 ? `⚠️${formatNumber(p)}` :
					formatNumber(p);
		});

		// 分組函數
		const groupArray = (arr, size) => arr.reduce((acc, curr, i) => {
			const groupIndex = Math.floor(i / size);
			(acc[groupIndex] = acc[groupIndex] || []).push(curr);
			return acc;
		}, []);

		// 格式化分組
		const formatGroup = (groupedData, isStatus = false) => {
			return groupedData.map((group, index) => {
				const start = index * groupSize;
				const end = Math.min((index + 1) * groupSize - 1, groupedData.flat().length - 1);
				const range = `${start}-${end}`;

				if (isStatus) {
					const hasNonOnline = group.some(status => typeof status === 'string' && !status.includes('✅'));
					const prefix = hasNonOnline ? '❗' : '│';
					return `${prefix} 　• 群組${range}　${group.join(", ")}`;
				}
				return `│ 　• 群組${range}　${group.join(", ")}`;
			}).join('\n');
		};

		const groupedIds = groupArray(shardIds, groupSize);
		const groupedStatus = groupArray(onlineStatus, groupSize);
		const groupedPing = groupArray(pingTimes, groupSize);

		// 統計摘要
		const totalShards = onlineStatus.length;
		const onlineCount = onlineStatus.filter(s => typeof s === 'string' && s.includes('✅')).length;

		return `
├────── 🔄分流狀態 ──────
│ 概況統計:
│ 　• 目前分流: ${clusterId}
│ 　• 分流總數: ${totalShards}
│ 　• 在線分流: ${onlineCount}
│
├────── 🔍分流列表 ──────
│ 已啟動分流:
${formatGroup(groupedIds)}
│
├────── ⚡連線狀態 ──────
│ 各分流狀態:
${formatGroup(groupedStatus, true)}
│
├────── 📊延遲統計 ──────
│ 響應時間(ms):
${formatGroup(groupedPing)}
╰──────────────`;
	} catch (error) {
		console.error('Discord分流監控錯誤:', error);
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
		//LINE @名字
		let mainMsg = (typeof inputStr === 'string') ? inputStr.match(MESSAGE_SPLITOR) : []; //定義輸入.字串
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

		//得到暗骰的數據, GM的位置

		//檢查是不是有權限可以傳信訊
		//是不是自己.ME 訊息
		//TRUE 即正常

		//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
		//訊息來到後, 會自動跳到analytics.js進行骰組分析
		//如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

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
		if (rplyVal.respawn) respawnCluster2();
		if (!rplyVal.text && !rplyVal.LevelUp) return;
		if (process.env.mongoURL)
			try {

				const isNew = await newMessage.newUserChecker(userid, "Discord");
				if (process.env.mongoURL && rplyVal.text && isNew) {
					SendToId(userid, newMessage.firstTimeMessage(), true);
				}
			} catch (error) {
				console.error(`discord bot error #236`, (error && error.name && error.message));
			}

		if (rplyVal.state) {
			const [countResult, shardResult] = await Promise.all([
				count(),
				getAllshardIds()
			]);

			const ping = Number(Date.now() - message.createdTimestamp);
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
			console.error('discord bot error #1082', (error?.name, error?.message), rplyVal.fileLink[index]);
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
			// 輸入dr  (指令) 私訊自己
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
			//輸入ddr(指令) 私訊GM及自己
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
			//輸入dddr(指令) 私訊GM
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
				{ context: { channelId: channelid, textContent: text, pollContent: pollText, emojis: POLL_EMOJIS.slice(0, maxOptions), targetClusterId: ownerClusterId } }
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
				{ context: { channelId: data.channelid, messageId, optionCount: data.options.length, emojis: POLL_EMOJIS } }
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
					{ context: { channelId: data.channelid, messageId, content: `本輪未收到投票（連續 ${nextDisplay} 次）。`, targetClusterId: ownerClusterId } }
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
						{ context: { channelId: data.channelid, messageId, content: '連續 4 次無人投票，已自動暫停本局。', targetClusterId: ownerClusterId } }
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
							{ context: { channelId: data.channelid, content: rplyVal.text } }
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
				{ context: { channelId: data.channelid, messageId, content: `投票結束，選中：${POLL_EMOJIS[pick]} ${picked.label}（${max} 票）`, targetClusterId: ownerClusterId } }
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
							{ context: { channelId: data.channelid, content: rplyVal.text, targetClusterId: ownerClusterId } }
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
	ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log(`connectd To core-www from discord! Shard#${shardid}`)
		ws.send(`connectd To core-www from discord! Shard#${shardid}`);
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
			console.error(`disocrdbot #99 error`, (error && error.name), (error && error.message), (error && error.reason))
		};
		return;

	});
	ws.on('error', (error) => {
		console.error('Discord socket error', (error && error.name), (error && error.message), (error && error.reason));
	});
	ws.on('close', function () {
		console.error('Discord socket close');
		setTimeout(connect, RECONNECT_INTERVAL);
	});
};

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
	this.interval = setInterval(async () => {
		const guilds = await client.cluster.fetchClientValues("guilds.cache.size");
		api.postStats({
			serverCount: Number.parseInt(guilds.reduce((a, c) => a + c, 0)),
			shardCount: getInfo().TOTAL_SHARDS,
			shardId: client.cluster.id
		});
	}, 300_000);
}

async function sendCronWebhook({ channelid, replyText, data }) {
	console.log(`[Shard ${client.cluster.id}] Starting sendCronWebhook for channel ${channelid}`);
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
				{ context: { channelId: channelid } }
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

		console.log(`[Shard ${client.cluster.id}] Found webhook ${validWebhookData.id} for channel ${channelid}. Sending message.`);
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
		console.log(`[Shard ${client.cluster.id}] Successfully sent message via webhook to channel ${channelid}.`);

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
async function handlingMultiServerMessage(message) {
	return;
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
}
function multiServerTarget(message) {
	const obj = {
		content: message.content,
		username: message?._member?.nickname || message?._member?.displayName,
		avatarURL: message.author.displayAvatarURL()
	};
	return obj;
}

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
		//	console.log('error', error)
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
	// Set isInteraction flag for all interaction types
	message.isInteraction = true;

	// Immediately defer ALL interactions to prevent timeout
	// This must happen within 3 seconds of receiving the interaction
	try {
		if (!message.deferred && !message.replied) {
			if (message.isCommand()) {
				await message.deferReply();
			} else if (message.isButton()) {
				await message.deferUpdate();
			} else {
				// For other interaction types, use deferReply as fallback
				await message.deferReply();
			}
		}
	} catch (deferError) {
		// If interaction has already expired, log and return early
		if (deferError.code === 10_062) { // Unknown interaction code
			console.error(`Interaction expired before immediate deferral: ${message.commandName || message.component?.label || 'unknown'}`);
			return;
		}
		// Handle other deferral errors
		console.error(`Failed to defer interaction: ${deferError.message} | Command: ${message.commandName || message.component?.label || 'unknown'} | Code: ${deferError.code}`);
		// Try to respond with an error message if possible
		try {
			if (!message.replied && !message.deferred) {
				await message.reply({ content: '處理請求時發生錯誤，請稍後再試。', ephemeral: true });
			}
		} catch (replyError) {
			console.error(`Failed to send error reply: ${replyError.message}`);
		}
		return;
	}

	switch (true) {
		case message.isCommand():
			{
				try {
					const answer = await handlingCommand(message);
					if (!answer) return;

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

					return replilyMessage(message, result);
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
				}
			}
			break; // Add break statement to avoid fall-through
		case message.isButton():
			{
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
	console.log('shardDisconnect:', event, shardID)
});

client.on('shardResume', (replayed, shardID) => console.log(`Shard ID ${shardID} resumed connection and replayed ${replayed} events.`));

client.on('shardReconnecting', id => console.log(`Shard with ID ${id} reconnected.`));


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
