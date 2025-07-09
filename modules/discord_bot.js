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
const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, AttachmentBuilder, ChannelType } = Discord;

const multiServer = require('../modules/multi-server')
const checkMongodb = require('../modules/dbWatchdog.js');
const errorCount = [];
const { rollText } = require('./getRoll');
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
const buttonStyles = [ButtonStyle.Danger, ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger]
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const discordClientConfig = require('./config/discord_client');
const client = new Client(discordClientConfig);
client.on('ready', () => {
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




client.once('ready', async () => {
	initInteractionCommands();
	if (process.env.BROADCAST) connect();
	//	if (shardid === 0) getSchedule();
	client.user.setActivity(`${candle.checker() || '🌼'}bothelp | hktrpg.com🍎`);
	console.log(`Discord: Logged in as ${client.user.tag}!`);
	let switchSetActivity = 0;

	//await sleep(6);
	const HEARTBEAT_CHECK_INTERVAL = 1000 * 60;
	const WARNING_THRESHOLD = 3;
	const CRITICAL_THRESHOLD = 5;
	const restartServer = () => {
		require('child_process').exec('sudo reboot');
	}
	let heartbeat = 0;
	console.log('Discord Heartbeat: Ready...')
	setInterval(async () => {
		const isAwake = await checkWakeUp();
		if (isAwake) {
			heartbeat = 0;
			return;
		}
		if (!isAwake || isAwake.length > 0) {
			heartbeat++;
			console.log(`Discord Heartbeat: ID: ${isAwake.length} - ${heartbeat}... `)
		}
		if (heartbeat > WARNING_THRESHOLD && adminSecret) {
			SendToId(adminSecret, `HKTRPG ID: ${isAwake.join(', ')} 可能下線了 請盡快檢查.`);
		}
		if (heartbeat > CRITICAL_THRESHOLD) {
			if (isAwake.length > 0)
				for (let i = 0; i < isAwake.length; i++)
					client.cluster.evalOnManager(`this.clusters.get(${isAwake[i]}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10_000 });
		}

		if (heartbeat > 20) {
			restartServer();
		}

	}, HEARTBEAT_CHECK_INTERVAL);
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
					await message.deferReply({ ephemeral: true });
					await message.editReply({ content: `${displayname}指令沒有得到回應，請檢查內容`, ephemeral: true });
				} else if (message.deferred && !message.replied) {
					// If already deferred, edit the reply
					await message.editReply({ content: `${displayname}指令沒有得到回應，請檢查內容`, ephemeral: true });
				} else if (!message.replied) {
					// Last resort - try a direct reply
					await message.reply({ content: `${displayname}指令沒有得到回應，請檢查內容`, ephemeral: true })
						.catch(error => console.error('Failed to reply to interaction:', error.message));
				}
			} else {
				// For regular messages
				return await message.reply({ content: `${displayname}指令沒有得到回應，請檢查內容` });
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
						content: `@${displayname} ${candle.checker()} ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`,
						ephemeral: false
					});
				} else if (message.deferred && !message.replied) {
					await message.editReply({
						content: `@${displayname} ${candle.checker()} ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`,
						ephemeral: false
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
	process.send({
		type: "process:msg",
		data: "discorderror"
	});
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
			//console.error(error);
			//await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
		for (let index = 0; index < message.myNames.length; index++) {
			const element = message.myNames[index];
			let text = await rollText(element.content);
			let obj = {
				content: text,
				username: element.username,
				avatarURL: element.avatarURL
			};
			let pair = (webhook && webhook.isThread) ? { threadId: discord.channelId } : {};
			await webhook.webhook.send({ ...obj, ...pair });

		}

	} catch {
		await SendToReplychannel({ replyText: '不能成功發送扮演發言, 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
		return;
	}

}
async function manageWebhook(discord) {
	try {
		const channel = await client.channels.fetch(discord.channelId);
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
			webhooks = await channel.fetchWebhooks();
			webhook = webhooks.find(v => {
				return (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
			})
		}
		return { webhook, isThread };
	} catch {
		//	console.error(error)
		await SendToReplychannel({ replyText: '不能新增Webhook.\n 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: (discord.channel && discord.channel.id) || discord.channelId });
		return;
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

const discordPresenceStatus = ['online', 'idle', 'invisible', 'do not disturb']
async function getAllshardIds() {
	if (!client.cluster) return '';

	try {
		const [shardIds, wsStatus, wsPing, clusterId] = await Promise.all([
			[...client.cluster.ids.keys()],
			client.cluster.broadcastEval(c => c.ws.status),
			client.cluster.broadcastEval(c => c.ws.ping),
			client.cluster.id
		]);

		const statusMap = {
			'online': '✅在線',
			'idle': '⚠️閒置',
			'dnd': '🔴勿擾',
			'offline': '❌離線',
			'invisible': '⚫隱身'
		};

		const groupSize = 5;
		const formatNumber = num => num.toLocaleString();

		// 轉換狀態和延遲
		const onlineStatus = wsStatus.map(status =>
			statusMap[discordPresenceStatus[status]] || status);
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
					const hasNonOnline = group.some(status => !status.includes('✅'));
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
		const onlineCount = onlineStatus.filter(s => s.includes('✅')).length;

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
						await message.deferReply({ ephemeral: true });
					}

					await message.user.send({
						content: '這是頻道 ' + (message.channel ? message.channel.name : '頻道') + ' 的聊天紀錄',
						files: [
							new AttachmentBuilder("./tmp/" + rplyVal.discordExport + '.txt')
						]
					});

					// Now that we've deferred, use editReply instead of followUp
					await message.editReply({ content: '已將聊天紀錄發送到您的私訊！', ephemeral: true });
				} catch (error) {
					console.error('Failed to send DM with exported file:', error);
					if (message.deferred && !message.replied) {
						await message.editReply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', ephemeral: true });
					} else if (!message.deferred && !message.replied) {
						await message.reply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', ephemeral: true });
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
						await message.deferReply({ ephemeral: true });
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
					await message.editReply({ content: '已將聊天紀錄發送到您的私訊！', ephemeral: true });
				} catch (error) {
					console.error('Failed to send DM with exported HTML file:', error);
					if (message.deferred && !message.replied) {
						await message.editReply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', ephemeral: true });
					} else if (!message.deferred && !message.replied) {
						await message.reply({ content: '無法發送私訊，請確保您沒有封鎖私訊。', ephemeral: true });
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
			buttonCreate: rplyVal.buttonCreate
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
			fs.unlinkSync(files[index]);
		}
		catch (error) {
			console.error('discord bot error #1082', (error?.name, error?.message), files);
		}

	}

	return;
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
				await SendToReplychannel({ replyText: sendText, channelid, quotes: quotes, buttonCreate: buttonCreate });
			} else {
				//SendToReply({ replyText: sendText, message, quotes: quotes, buttonCreate: buttonCreate });
				SendToId(userid, sendText, true);
			}
			return;
	}
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
	let webhook = await manageWebhook({ channelId: channelid })
	let obj = {
		content: replyText,
		username: data.roleName,
		avatarURL: data.imageLink
	};
	let pair = (webhook && webhook.isThread) ? { threadId: channelid } : {};
	await webhook.webhook.send({ ...obj, ...pair });
}
async function handlingMultiServerMessage(message) {
	if (!process.env.mongoURL) return;
	let target = multiServer.multiServerChecker(message.channel.id)
	if (!target) return;
	else {
		//	const targetsData = target;
		const sendMessage = multiServerTarget(message);
		//	for (let index = 0; index < targetsData.length; index++) {
		const targetData = target
		let webhook = await manageWebhook({ channelId: targetData.channelid })
		let pair = (webhook && webhook.isThread) ? { threadId: targetData.channelid } : {};
		await webhook?.webhook.send({ ...sendMessage, ...pair });
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

async function __handlingReplyMessage(message, result) {
	const text = result.text;
	const sendTexts = text.toString().match(/[\s\S]{1,2000}/g);

	try {
		// For interactions, defer early to avoid timeout
		if (message.isInteraction && !message.deferred && !message.replied) {
			// Defer all interactions by default to avoid timeout issues
			// This gives commands the full 15-minute window instead of just 3 seconds
			try {
				await message.deferReply({ ephemeral: false });
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
				await message.editReply({ embeds: await convQuotes(sendTexts[0]) });

				// Send follow-up messages for additional content
				for (let index = 1; index < sendTexts?.length && index < 4; index++) {
					await message.followUp({ embeds: await convQuotes(sendTexts[index]) });
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
						await message.reply({ embeds: await convQuotes(sendText) });
					} else if (!message.isInteraction) {
						await message.reply({ embeds: await convQuotes(sendText) });
					}
				} else {
					// For subsequent chunks, use message.channel.send for regular messages
					// and followUp for interactions
					if (message.isInteraction) {
						await message.followUp({ embeds: await convQuotes(sendText) });
					} else {
						await message.reply({ embeds: await convQuotes(sendText), ephemeral: false });
					}
				}
			} catch (error) {
				// Handle specific interaction errors
				if (error.code === 'InteractionNotReplied' && message.isInteraction) {
					try {
						await message.deferReply();
						await message.editReply({ embeds: await convQuotes(sendText) });
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

	switch (true) {
		case message.isCommand():
			{
				try {
					// Defer all commands by default - this gives them the full 15-minute window instead of just 3 seconds
					// This is a better approach than hardcoding specific command names
					if (!message.deferred && !message.replied) {
						try {
							await message.deferReply({ ephemeral: false });
						} catch (deferError) {
							// If interaction has expired, log and return early
							if (deferError.code === 10_062) { // Unknown interaction code
								console.error(`Interaction expired before deferral: ${message.commandName || 'unknown'}`);
								return;
							}
							throw deferError; // Re-throw other errors
						}
					}

					const answer = await handlingCommand(message);
					if (!answer) return;

					// Early defer for export commands
					if (typeof answer === 'object' && answer.inputStr &&
						answer.inputStr.startsWith('.discord') && !message.deferred && !message.replied) {
						try {
							await message.deferReply({ ephemeral: true });
						} catch (deferError) {
							if (deferError.code === 10_062) {
								console.error(`Interaction expired before export deferral: ${message.commandName || 'unknown'}`);
								return;
							}
							throw deferError;
						}
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

					return replilyMessage(message, result);
				} catch (error) {
					console.error('Command processing error:', error);
					try {
						// Try to respond with an error message
						if (!message.replied && !message.deferred) {
							await message.reply({ content: '處理命令時發生錯誤，請稍後再試。', ephemeral: true });
						} else if (message.deferred && !message.replied) {
							await message.editReply({ content: '處理命令時發生錯誤，請稍後再試。', ephemeral: true });
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
					// Defer update to prevent "Unknown interaction" errors
					if (!message.deferred && !message.replied) {
						try {
							await message.deferUpdate();
						} catch (deferError) {
							if (deferError.code === 10_062) {
								console.error(`Button interaction expired before processing: ${message.component?.label || 'unknown'}`);
								return;
							}
							throw deferError;
						}
					}

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
										content: `${displayname}${messageContent.replace(/的角色卡$/, '')}進行擲骰 \n${resultText}`,
										ephemeral: false
									});
								} catch (replyError) {
									console.error(`Failed to send character card button response: ${replyError.message}`);
								}
							} else {
								try {
									return await message.followUp({
										content: `${displayname}沒有反應，請檢查按鈕內容`,
										ephemeral: true
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
								await message.followUp({ content: `${displayname}${resultText}`, ephemeral: false });
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
