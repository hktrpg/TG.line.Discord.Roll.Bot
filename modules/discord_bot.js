"use strict";
exports.analytics = require('./analytics');
const schema = require('../modules/schema.js');
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const adminSecret = process.env.ADMIN_SECRET || '';
const Cluster = require('discord-hybrid-sharding');
const Discord = require("discord.js-light");
const multiServer = require('../modules/multi-server')
const checkMongodb = require('../modules/dbWatchdog.js');
const fs = require('node:fs');
const errorCount = [];
const { Client, Intents, Permissions, Collection, MessageActionRow, MessageButton, WebhookClient, MessageAttachment } = Discord;
const rollText = require('./getRoll').rollText;
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
exports.z_stop = require('../roll/z_stop');
const buttonStyles = ['DANGER', 'PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER']
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
function channelFilter(channel) {
	return !channel.lastMessageId || Discord.SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 3600000;
}
const client = new Discord.Client({
	makeCache: Discord.Options.cacheWithLimits({
		ApplicationCommandManager: 0, // guild.commands
		BaseGuildEmojiManager: 0, // guild.emojis
		GuildBanManager: 0, // guild.bans
		GuildInviteManager: 0, // guild.invites
		GuildMemberManager: 0, // guild.members
		GuildStickerManager: 0, // guild.stickers
		MessageManager: Infinity, // channel.messages
		PermissionOverwriteManager: Infinity, // channel.permissionOverwrites
		PresenceManager: 0, // guild.presences
		ReactionManager: 0, // message.reactions
		ReactionUserManager: 0, // reaction.users
		StageInstanceManager: 0, // guild.stageInstances
		ThreadManager: 0, // channel.threads
		ThreadMemberManager: 0, // threadchannel.members
		UserManager: Infinity, // client.users
		VoiceStateManager: 0,// guild.voiceStates

		GuildManager: Infinity, // roles require guilds
		RoleManager: Infinity, // cache all roles
		PermissionOverwrites: 0, // cache all PermissionOverwrites. It only costs memory if the channel it belongs to is cached
		ChannelManager: {
			maxSize: Infinity, // prevent automatic caching
			sweepFilter: () => channelFilter, // remove manually cached channels according to the filter
			sweepInterval: 3600
		},
		GuildChannelManager: {
			maxSize: Infinity, // prevent automatic caching
			sweepFilter: () => channelFilter, // remove manually cached channels according to the filter
			sweepInterval: 3600
		},
	}),
	shards: Cluster.data.SHARD_LIST, // An array of shards that will get spawned
	shardCount: Cluster.data.TOTAL_SHARDS, // Total number of shards
	restRequestTimeout: 45000, // Timeout for REST requests
	/**
		  cacheGuilds: true,
		cacheChannels: true,
		cacheOverwrites: false,
		cacheRoles: true,
		cacheEmojis: false,
		cachePresences: false
	 */
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS], partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
client.cluster = new Cluster.Client(client);
client.login(channelSecret);
const MESSAGE_SPLITOR = (/\S+/ig);
const link = process.env.WEB_LINK;
const port = process.env.PORT || 20721;
const mongo = process.env.mongoURL
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };

const newMessage = require('./message');

const RECONNECT_INTERVAL = 1 * 1000 * 60;
const shardids = client.cluster.id;
const WebSocket = require('ws');
var ws;

client.on('messageCreate', async message => {
	try {
		if (message.author.bot) return;
		const result = await handlingResponMessage(message);
		await handlingMultiServerMessage(message);
		if (result && result.text)
			return handlingSendMessage(result);
		return;
	} catch (error) {
		console.error('discord bot messageCreate #91 error', error);
	}

});
client.on('guildCreate', async guild => {
	try {


		const channels = await guild.channels.fetch();
		const keys = Array.from(channels.values());
		const channel = keys.find(channel => {
			return channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')
		});
		if (!channel) return;
		//	let channelSend = await guild.channels.fetch(channel.id);
		const text = new Discord.MessageEmbed()
			.setColor('#0099ff')
			//.setTitle(rplyVal.title)
			//.setURL('https://discord.js.org/')
			.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
			.setDescription(newMessage.joinMessage())
		await channel.send({ embeds: [text] });
	} catch (error) {
		if (error.message === 'Missing Access') return;
		if (error.message === 'Missing Permissions') return;
		console.error('discord bot guildCreate  #114 error', error);
	}
})

client.on('interactionCreate', async message => {
	try {
		if (message.user && message.user.bot) return;
		return __handlingInteractionMessage(message);
	} catch (error) {
		console.log('discord bot interactionCreate #123 error', error)
	}
});


client.on('messageReactionAdd', async (reaction, user) => {
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId }).catch(error => {
		console.error('discord_bot #802 mongoDB error: ', error.name, error.reson)
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
			member.roles.add(findEmoji.roleID.replace(/\D/g, ''))
		} else {
			reaction.users.remove(user.id);
		}
	} catch (error) {
		console.log('Discord bot messageReactionAdd #249 ', error)
	}

});

client.on('messageReactionRemove', async (reaction, user) => {
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId }).catch(error => console.error('discord_bot #817 mongoDB error: ', error.name, error.reson))
	try {
		if (!list || list.length === 0) return;
		const detail = list.detail;
		for (let index = 0; index < detail.length; index++) {
			if (detail[index].emoji === reaction.emoji.name || detail[index].emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`) {
				const member = await reaction.message.guild.members.fetch(user.id);
				member.roles.remove(detail[index].roleID.replace(/\D/g, ''))
			}
		}
	} catch (error) {
		if (error.message === 'Unknown Member') return;
		console.error('Discord bot messageReactionRemove #268 ', error)
	}
});


client.once('ready', async () => {
	initInteractionCommands();
	if (process.env.BROADCAST) connect();
	//	if (shardids === 0) getSchedule();
});

client.on('ready', async () => {
	client.user.setActivity('🌼bothelp | hktrpg.com🍎');
	console.log(`Discord: Logged in as ${client.user.tag}!`);
	var switchSetActivity = 0;
	// eslint-disable-next-line no-unused-vars
	const refreshId = setInterval(async () => {
		if (shardids !== (Cluster.data.TOTAL_SHARDS - 1)) return;
		if (adminSecret) {
			let check = await checkWakeUp();
			if (!check) {
				SendToId(adminSecret, 'HKTRPG可能下線了');
			}
		}
	}, 180000);
	// eslint-disable-next-line no-unused-vars
	const refreshId2 = setInterval(async () => {
		switch (switchSetActivity % 2) {
			case 1:
				client.user.setActivity('🌼bothelp | hktrpg.com🍎');
				break;
			default:
				client.user.setActivity(await count2());
				break;
		}
		switchSetActivity = (switchSetActivity % 2) ? 2 : 3;
	}, 180000);
});

async function replilyMessage(message, result) {
	const displayname = (message.member && message.member.id) ? `<@${message.member.id}>\n` : '';
	if (result && result.text) {
		result.text = `${displayname}${result.text}`
		await __handlingReplyMessage(message, result);
	}
	else {
		try {
			return await message.reply({ content: `${displayname}指令沒有得到回應，請檢查內容`, ephemeral: true })
		} catch (error) {
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
	const user = `${message.user.username}`
	const button = `${modeString}了「${message.component.label}」`;
	const regexpButton = convertRegex(`${button}`)
	let newContent = content;
	if (newContent.match(/要求擲骰\/點擊/)) newContent = '';
	if (newContent.match(regexpButton)) {
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
		if (line.match(convertRegex(button))) {
			let splitNames = line.split('、');
			for (const name of splitNames) {
				if (name.match(convertRegex(user)) || name.match(convertRegex(`${user} ${button}`))) {
					flag = true;
				}
			}
		}

	}
	return flag;
}
function convQuotes(text = "") {
	//const imageMatch = text.match(imageUrl);
	return new Discord.MessageEmbed()
		.setColor('#0099ff')
		//.setTitle(rplyVal.title)
		//.setURL('https://discord.js.org/')
		.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
		.setDescription(text)
	//.setImage((imageMatch && imageMatch.length > 0) ? imageMatch[0] : '')
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
async function SendToId(targetid, replyText, quotes) {
	let user = await client.users.fetch(targetid);
	if (typeof replyText === "string") {
		let sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
		for (let i = 0; i < sendText.length; i++) {
			if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
				try {
					if (quotes) {
						user.send({ embeds: [convQuotes(sendText[i])] });
					} else { user.send(sendText[i]); }
				}
				catch (e) {
					console.error('Discord GET ERROR:  SendtoID: ', e.message, replyText)
				}
		}
	}
	else {
		user.send(replyText);
	}

}

function SendToReply({ replyText = "", message, quotes = false }) {
	let sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
	for (let i = 0; i < sendText.length; i++) {
		if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
			try {
				if (quotes) {
					message.author && message.author.send({ embeds: [convQuotes(sendText[i])] });
				} else
					message.author && message.author.send(sendText[i]);
			}
			catch (e) {
				if (e.message !== 'Cannot send messages to this user') {
					console.error('Discord  GET ERROR:  SendToReply: ', e.message, 'e', e, message, replyText)
				}
			}
	}


	return;
}
async function SendToReplychannel({ replyText = "", channelid = "", quotes = false, groupid = "", buttonCreate = "" }) {
	if (!channelid) return;
	let channel;
	try {
		channel = await client.channels.fetch(channelid)
	} catch (error) {
		null
	}
	if (!channel && groupid) {
		let guild = await client.guilds.fetch(groupid)
		channel = await guild.channels.fetch(channelid)
	}
	if (!channel) return;
	//	console.error(`discord bot cant find channel #443 ${replyText}`)
	const sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
	for (let i = 0; i < sendText.length; i++) {
		if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
			try {
				if (quotes) {
					for (let index = 0; index < buttonCreate.length || index === 0; index++) {
						channel.send({ embeds: [convQuotes(sendText[i])], components: buttonCreate[index] || null });
					}

				} else {
					for (let index = 0; index < buttonCreate.length || index === 0; index++) {
						channel.send({ content: sendText[i], components: buttonCreate[index] || null });
					}
				}
				//await message.channel.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
			catch (e) {
				if (e.message !== 'Missing Permissions') {
					console.error('Discord  GET ERROR: SendToReplychannel: ', e.message, replyText, channelid);
				}
			}

	}
	return;
}


async function nonDice(message) {
	await courtMessage({ result: "", botname: "Discord", inputStr: "", shardids: shardids })
	const groupid = (message.guild && message.guild.id) || '';
	const userid = (message.author && message.author.id) || (message.user && message.user.id) || '';
	if (!groupid || !userid) return;
	const displayname = (message.member && message.member.user && message.member.user.tag) || (message.user && message.user.username) || '';
	const membercount = (message.guild) ? message.guild.memberCount : 0;
	try {
		let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount, "", message);
		if (groupid && LevelUp && LevelUp.text) {
			await SendToReplychannel(
				{ replyText: `@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`, channelid: message.channel.id }
			);
		}
	} catch (error) {
		console.error('await #534 EXPUP error', error);
	}
	return null;
}


//Set Activity 可以自定義正在玩什麼


function __privateMsg({ trigger, mainMsg, inputStr }) {
	let privatemsg = 0;
	if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
		privatemsg = 1;
		inputStr = inputStr.replace(/^dr\s+/i, '');
	}
	if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
		privatemsg = 2;
		inputStr = inputStr.replace(/^ddr\s+/i, '');
	}
	if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
		privatemsg = 3;
		inputStr = inputStr.replace(/^dddr\s+/i, '');
	}
	return { inputStr, privatemsg };
}


async function count() {
	if (!client.cluster) return;
	const promises = [
		client.cluster.fetchClientValues('guilds.cache.size'),
		client.cluster
			.broadcastEval(c => c.guilds.cache.filter((guild) => guild.available).reduce((acc, guild) => acc + guild.memberCount, 0))
	];

	return Promise.all(promises)
		.then(results => {
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
			const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
			return (`正在運行HKTRPG的Discord 群組數量: ${totalGuilds}\nDiscord 會員數量: ${totalMembers}`);
		})
		.catch(err => {
			console.error(`disocrdbot #596 error ${err}`)
		});

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
		.catch((err) => {
			console.error(`disocrdbot #617 error ${err}`)
			respawnCluster(err);
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
	if (error.message && error.message.includes('INTERACTION_NOT_REPLIED')) return;
	if (error.message && error.message.includes("Invalid Form Body")) return;
	// Invalid Form Body
	// user_id: Value "&" is not snowflake.


	console.error('Discord Unhandled promise rejection:', error);
	process.send({
		type: "process:msg",
		data: "discorderror"
	});
});




function respawnCluster(err) {
	if (err.toString().match(/CLUSTERING_NO_CHILD_EXISTS/i)) {
		let number = err.toString().match(/\d+$/i);
		if (!number) return;
		if (!errorCount[number]) errorCount[number] = 0;
		errorCount[number]++;
		if (errorCount[number] > 3) {
			client.cluster.evalOnManager(this.clusters.get(number).respawn())
		}

	}
}

(async function () {
	if (!agenda) return;
	agenda.define("scheduleAtMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		//指定時間一次	
		//if (shardids !== 0) return;
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		if (!data.imageLink && !data.roleName)
			SendToReplychannel(
				{ replyText: text, channelid: data.channelid, quotes: data.quotes = true, groupid: data.groupid }
			)
		else {
			await sendCronWebhook({ channelid: data.channelid, replyText: text, data })
		}
		try {
			await job.remove();
		} catch (e) {
			console.error("Discord Error removing job from collection:scheduleAtMessageDiscord", e);
		}
	})

	agenda.define("scheduleCronMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		//指定時間一次	
		//if (shardids !== 0) return;
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		if (!data.imageLink && !data.roleName)
			SendToReplychannel(
				{ replyText: text, channelid: data.channelid, quotes: data.quotes = true, groupid: data.groupid }
			)
		else {
			await sendCronWebhook({ channelid: data.channelid, replyText: text, data })
		}
		try {
			if ((new Date(Date.now()) - data.createAt) >= SIX_MONTH) {
				await job.remove();
				SendToReplychannel(
					{ replyText: "已運行六個月, 移除此定時訊息", channelid: data.channelid, quotes: data.quotes = true, groupid: data.groupid }
				)
			}
		} catch (e) {
			console.error("Discord Error removing job from collection:scheduleCronMessageDiscord", e);
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
		let answer = await command.execute(message).catch(error => {
			//console.error(error);
			//await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		})
		return answer;
	} catch (error) {
		return;
	}

}
async function repeatMessage(discord, message) {
	try {
		await discord.delete();
	} catch (error) {
		//error
	}
	let webhook = await manageWebhook(discord);
	try {
		let text = await rollText(message.myName.content);
		//threadId: discord.channelId,
		let obj = {
			content: text,
			username: message.myName.username,
			avatarURL: message.myName.avatarURL
		};
		let pair = (webhook && webhook.isThread) ? { threadId: discord.channelId } : {};
		await webhook.webhook.send({ ...obj, ...pair });
	} catch (error) {
		await SendToReplychannel({ replyText: '不能成功發送扮演發言, 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
		return;
	}



}

async function repeatMessages(discord, message) {
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

	} catch (error) {
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
			return v.name == 'HKTRPG .me Function' && v.type == "Incoming" && ((v.channelId == channel.parentId) || !isThread);
		})
		//type Channel Follower
		//'Incoming'
		if (!webhook) {
			const hooks = isThread ? await client.channels.fetch(channel.parentId) : channel;
			await hooks.createWebhook("HKTRPG .me Function", { avatar: "https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png" })
			webhooks = await channel.fetchWebhooks();
			webhook = webhooks.find(v => {
				return v.name == 'HKTRPG .me Function' && v.type == "Incoming";
			})
		}
		return { webhook, isThread };
	} catch (error) {
		//console.error(error)
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
		await schema.roleReact.findByIdAndUpdate(message.roleReactMongooseId, { messageID: sendMessage.id }).catch(error => console.error('discord_bot #786 mongoDB error: ', error.name, error.reson))

	} catch (error) {
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

	} catch (error) {
		await SendToReplychannel({ replyText: '不能成功增加ReAction, 請檢查你有授權HKTRPG 新增ReAction的權限, \n此為本功能必須權限' });
		return;
	}



}
async function checkWakeUp() {
	const number = Cluster.data.TOTAL_SHARDS;
	const promises = [
		client.cluster.broadcastEval(c => c.shard?.ids[0]),
		client.cluster.broadcastEval(c => c.ws.status),
	];
	return Promise.all(promises)
		.then(results => {
			if (results[0].length !== number || results[1].reduce((a, b) => a + b, 0) >= 1)
				return false
			else return true;
		})
		.catch(err => {
			console.error(`disocrdbot #836 error ${err}`)
			return false
		});

}

function z_stop(mainMsg, groupid) {
	if (!Object.keys(exports.z_stop).length || !exports.z_stop.initialize().save || !mainMsg || !groupid) {
		return false;
	}
	let groupInfo = exports.z_stop.initialize().save.find(e => e.groupid == groupid)
	if (!groupInfo || !groupInfo.blockfunction) return;
	let match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()))
	if (match) {
		return true;
	} else
		return false;
}


async function getAllshardIds() {
	if (!client.cluster) {
		return;
	}
	const promises = [
		client.cluster.broadcastEval(c => c.shard?.ids[0]),
		client.cluster.broadcastEval(c => c.ws.status),
		client.cluster.broadcastEval(c => c.ws.ping)
	];
	return Promise.all(promises)
		.then(results => {
			return '\n所有啓動中的server ID: ' + results[0].join(', ') + '\n所有啓動中的server online?: ' + results[1].join(', ') + '\n所有啓動中的server ping?: ' + results[2].join(', ');
		})
		.catch(err => {
			console.error(`disocrdbot #884 error ${err}`)
		});

}

async function handlingButtonCreate(message, input) {
	const buttonsNames = input;
	const row = []
	const totallyQuotient = ~~((buttonsNames.length - 1) / 5) + 1;
	for (let index = 0; index < totallyQuotient; index++) {
		row.push(new MessageActionRow())
	}
	for (let i = 0; i < buttonsNames.length; i++) {
		const quot = ~~(i / 5)
		const name = buttonsNames[i] || 'null'
		row[quot]
			.addComponents(
				new MessageButton()
					.setCustomId(`${name}_${i}`)
					.setLabel(name)
					.setStyle(buttonsStyle(i)),
			)
	}
	const arrayRow = await splitArray(5, row)
	return arrayRow;
	//for (let index = 0; index < arrayRow.length; index++) {
	//	await message.reply({ content: ``, components: arrayRow[index] });
	//}

}

async function handlingRequestRollingCharacter(message, input) {
	const buttonsNames = input[0];
	const characterName = input[1];
	const charMode = (input[2] == 'char') ? true : false;
	const row = []
	const totallyQuotient = ~~((buttonsNames.length - 1) / 5) + 1;
	for (let index = 0; index < totallyQuotient; index++) {
		row.push(new MessageActionRow())
	}
	for (let i = 0; i < buttonsNames.length; i++) {
		const quot = ~~(i / 5)
		const name = buttonsNames[i] || 'null'
		row[quot]
			.addComponents(
				new MessageButton()
					.setCustomId(`${name}_${i}`)
					.setLabel(name)
					.setStyle(buttonsStyle(i)),
			)
	}
	const arrayRow = await splitArray(5, row)
	for (let index = 0; index < arrayRow.length; index++) {
		if (arrayRow[0][0].components.length == 0) {
			await message.reply({ content: `${characterName}的角色卡 沒有技能 \n不能產生Button`, })
			continue;
		}
		try {
			if (charMode)
				await message.reply({ content: `${characterName}的角色卡`, components: arrayRow[index] });
			else
				await message.reply({ content: `${characterName}的角色`, components: arrayRow[index] });
		} catch (error) {
			console.error(`error discord_bot handlingRequestRollingCharacter  #781 ${characterName} ${JSON.stringify(arrayRow)}`)
		}

	}

}

async function handlingRequestRolling(message, buttonsNames, displayname = '') {
	const row = []
	const totallyQuotient = ~~((buttonsNames.length - 1) / 5) + 1
	for (let index = 0; index < totallyQuotient; index++) {
		row.push(new MessageActionRow())
	}
	for (let i = 0; i < buttonsNames.length; i++) {
		const quot = ~~(i / 5)
		const name = buttonsNames[i] || 'null'
		row[quot]
			.addComponents(
				new MessageButton()
					.setCustomId(`${name}_${i}`)
					.setLabel(name)
					.setStyle(buttonsStyle(i)),
			)
	}
	const arrayRow = await splitArray(5, row)
	for (let index = 0; index < arrayRow.length; index++) {
		await message.reply({ content: `${displayname}要求擲骰/點擊`, components: arrayRow[index] }).catch();
	}
}
async function splitArray(perChunk, inputArray) {
	var myArray = [];
	for (var i = 0; i < inputArray.length; i += perChunk) {
		myArray.push(inputArray.slice(i, i + perChunk));
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
	try {
		let hasSendPermission = true;
		/**
				if (message.guild && message.guild.me) {
					hasSendPermission = (message.channel && message.channel.permissionsFor(message.guild.me)) ? message.channel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) : false;
				}
				 */
		if (answer) message.content = answer;
		let inputStr = message.content || '';
		//DISCORD <@!USERID> <@!399923133368042763> <@!544563333488111636>
		//LINE @名字
		let mainMsg = inputStr.match(MESSAGE_SPLITOR); //定義輸入.字串
		let trigger = (mainMsg && mainMsg[0]) ? mainMsg[0].toString().toLowerCase() : '';
		if (!trigger) return await nonDice(message)

		const groupid = (message.guildId) ? message.guildId : '';
		if ((trigger == ".me" || trigger == ".mee") && !z_stop(mainMsg, groupid)) return await __sendMeMessage({ message, inputStr, groupid })

		let rplyVal = {};
		const checkPrivateMsg = __privateMsg({ trigger, mainMsg, inputStr });
		inputStr = checkPrivateMsg.inputStr;
		let target = await exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
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
		if (rplyVal.requestRollingCharacter) await handlingRequestRollingCharacter(message, rplyVal.requestRollingCharacter);
		if (rplyVal.requestRolling) await handlingRequestRolling(message, rplyVal.requestRolling, displaynameDiscord);
		if (rplyVal.buttonCreate) rplyVal.buttonCreate = await handlingButtonCreate(message, rplyVal.buttonCreate)
		if (rplyVal.roleReactFlag) await roleReact(channelid, rplyVal)
		if (rplyVal.newRoleReactFlag) await newRoleReact(message, rplyVal)
		if (rplyVal.discordEditMessage) await handlingEditMessage(message, rplyVal)

		if (rplyVal.myName) await repeatMessage(message, rplyVal);
		if (rplyVal.myNames) await repeatMessages(message, rplyVal);

		if (rplyVal.sendNews) sendNewstoAll(rplyVal);

		if (rplyVal.sendImage) sendBufferImage(message, rplyVal, userid)

		if (!rplyVal.text && !rplyVal.LevelUp) return;
		try {
			let isNew = await newMessage.newUserChecker(userid, "Discord");
			if (process.env.mongoURL && rplyVal.text && isNew) {
				SendToId(userid, newMessage.firstTimeMessage(), true);
			}
		} catch (error) {
			console.error(`discord bot error #236`, error)
		}

		if (rplyVal.state) {
			rplyVal.text += '\n' + await count();
			rplyVal.text += '\nPing: ' + Number(Date.now() - message.createdTimestamp) + 'ms';
			rplyVal.text += await getAllshardIds();
		}

		if (groupid && rplyVal && rplyVal.LevelUp) {
			await SendToReplychannel({ replyText: `<@${userid}>\n${rplyVal.LevelUp}`, channelid });
		}

		if (rplyVal.discordExport) {
			message.author.send({
				content: '這是頻道 ' + message.channel.name + ' 的聊天紀錄',
				files: [
					"./tmp/" + rplyVal.discordExport + '.txt'
				]
			});
		}
		if (rplyVal.discordExportHtml) {
			if (!link || !mongo) {
				message.author.send(
					{
						content: '這是頻道 ' + message.channel.name + ' 的聊天紀錄\n 密碼: ' +
							rplyVal.discordExportHtml[1],
						files: [
							"./tmp/" + rplyVal.discordExportHtml[0] + '.html'
						]
					});

			} else {
				message.author.send('這是頻道 ' + message.channel.name + ' 的聊天紀錄\n 密碼: ' +
					rplyVal.discordExportHtml[1] + '\n請注意這是暫存檔案，會不定時移除，有需要請自行下載檔案。\n' +
					link + ':' + port + "/app/discord/" + rplyVal.discordExportHtml[0] + '.html')
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
		console.error('handlingResponMessage Error: ', error)
	}
}
const sendBufferImage = async (message, rplyVal, userid) => {
	await message.channel.send({ content: `<@${userid}>\n你的Token 已經送到`, files: [{ attachment: rplyVal.sendImage }] });
	fs.unlinkSync(rplyVal.sendImage);
	return;
}

async function handlingSendMessage(input) {
	const privatemsg = input.privatemsg || 0;
	const channelid = input.channelid;
	const groupid = input.groupid
	const userid = input.userid
	let sendText = input.text
	const message = input.message
	const statue = input.statue
	const quotes = input.quotes
	const buttonCreate = input.buttonCreate;
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = await privateMsgFinder(channelid) || [];
		groupInfo.forEach((item) => {
			TargetGMTempID.push(item.userid);
			TargetGMTempdiyName.push(item.diyName);
			TargetGMTempdisplayname.push(item.displayname);
		})
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
				SendToReply(
					{ replyText: sendText, message });
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
			SendToReply({ replyText: sendText, message });
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
				sendText = `<@${userid}> ${(statue) ? statue : ''}\n${sendText}`;
			}
			if (groupid) {
				await SendToReplychannel({ replyText: sendText, channelid, quotes: quotes, buttonCreate: buttonCreate });
			} else {
				SendToReply({ replyText: sendText, message, quotes: quotes, buttonCreate: buttonCreate });
			}
			return;
	}
}

const convertRegex = function (str = "") {
	return new RegExp(str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"));
};

const connect = function () {
	ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log(`connectd To core-www from discord! Shard#${shardids}`)
		ws.send(`connectd To core-www from discord! Shard#${shardids}`);
	});
	ws.on('message', function incoming(data) {
		if (shardids !== 0) return;
		var object = JSON.parse(data);
		if (object.botname == 'Discord') {
			const promises = [
				object,
				//client.shard.broadcastEval(client => client.channels.fetch(object.message.target.id)),
			];
			Promise.all(promises)
				.then(async results => {
					let channel = await client.channels.fetch(results[0].message.target.id);
					if (channel)
						channel.send(results[0].message.text)
				})
				.catch(err => {
					console.error(`disocrdbot #99 error ${err}`)
				});
			return;
		}
	});
	ws.on('error', (error) => {
		console.error('Discord socket error', error);
	});
	ws.on('close', function () {
		console.error('Discord socket close');
		setTimeout(connect, RECONNECT_INTERVAL);
	});
};

function handlingButtonCommand(message) {
	return message.component.label || ''
}
async function handlingEditMessage(message, rplyVal) {
	try {
		if (message.type !== 'REPLY') return message.reply({ content: '請Reply 你所想要修改的指定訊息' });
		if (message.channelId !== message.reference.channelId) return message.reply({ content: '請只修改同一個頻道的訊息' });
		const editReply = rplyVal.discordEditMessage;
		const channel = await client.channels.fetch(message.reference.channelId);
		const editMessage = await channel.messages.fetch(message.reference.messageId)
		if (editMessage.editable)
			return editMessage.edit({ content: editReply });
		else
			if (editMessage.webhookId) {
				const messageid = editMessage.id;
				const webhooks = await channel.fetchWebhooks();
				const webhook = webhooks.find(wh => wh.id == editMessage.webhookId);
				if (!webhook) return message.reply({ content: '找不到這個訊息的webhook，所以不能修改' });
				return await webhook.editMessage(messageid, {
					content: editReply
				});
			} else
				return message.reply({ content: '根據Discord的規則，只能修改此BOT(HKTRPG)和Webhook所發出的訊息，請重新檢查' });
	} catch (error) {
		console.error();
	}
}

//TOP.GG 
const togGGToken = process.env.TOPGG;
if (togGGToken) {
	if (shardids !== (Cluster.data.TOTAL_SHARDS - 1)) return;
	const Topgg = require(`@top-gg/sdk`)
	const api = new Topgg.Api(togGGToken)
	this.interval = setInterval(async () => {
		const guilds = await client.cluster.fetchClientValues("guilds.cache.size");
		api.postStats({
			serverCount: parseInt(guilds.reduce((a, c) => a + c, 0)),
			shardCount: Cluster.data.TOTAL_SHARDS,
			shardId: client.cluster.id
		});
	}, 300000);
}

async function sendCronWebhook({ channelid, replyText, data }) {
	let webhook = await manageWebhook({ channelId: channelid })
	//threadId: discord.channelId,
	let obj = {
		content: replyText,
		username: data.roleName,
		avatarURL: data.imageLink
	};
	let pair = (webhook && webhook.isThread) ? { threadId: channelid } : {};
	await webhook.webhook.send({ ...obj, ...pair });
}
async function handlingMultiServerMessage(message) {
	let target = multiServer.multiServerChecker(message.channel.id)
	if (!target) return;
	else {
		//	const targetsData = target;
		const sendMessage = multiServerTarget(message);
		//	for (let index = 0; index < targetsData.length; index++) {
		const targetData = target
		let webhook = await manageWebhook({ channelId: targetData.channelid })
		let pair = (webhook && webhook.isThread) ? { threadId: targetData.channelid } : {};
		await webhook.webhook.send({ ...sendMessage, ...pair });
		//	}

	}
	return;
}
function multiServerTarget(message) {
	const obj = {
		content: message.content,
		username: message._member.nickname || message._member.displayName,
		avatarURL: message.author.displayAvatarURL()
	};
	return obj;
}

function __checkUserRole(groupid, message) {
	if (groupid && message.member && message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
		return 3;
	if (groupid && message.channel.permissionsFor(message.member) && message.channel.permissionsFor(message.member).has(Permissions.FLAGS.MANAGE_CHANNELS)) return 2;

	return 1;
}

async function __handlingReplyMessage(message, result) {
	const text = result.text;
	const sendTexts = text.toString().match(/[\s\S]{1,2000}/g);
	for (let index = 0; index < sendTexts.length; index++) {
		const sendText = sendTexts[index];
		if (sendText.length === 0) continue;
		try {
			await message.reply({ content: `${sendText}`, ephemeral: false })
		} catch (error) {
			try {
				await message.editReply({ content: `${sendText}`, ephemeral: false })
			} catch (error) {
				return;
			}
		}
	}
}

async function __handlingInteractionMessage(message) {
	switch (true) {
		case message.isCommand():
			{
				const answer = await handlingCommand(message)
				if (!answer) return;
				const result = await handlingResponMessage(message, answer);
				return replilyMessage(message, result)
			}
		case message.isButton():
			{
				const answer = handlingButtonCommand(message)
				const result = await handlingResponMessage(message, answer);
				const messageContent = message.message.content;
				const displayname = (message.member && message.member.id) ? `<@${message.member.id}>\n` : '';
				const resultText = (result && result.text) || '';
				if (/的角色卡$/.test(messageContent)) {
					if (resultText) { return await message.reply({ content: `${displayname}${messageContent.replace(/的角色卡$/, '')}進行擲骰 \n${resultText}`, ephemeral: false }).catch() }
					else {
						return await message.reply({ content: `${displayname}沒有反應，請檢查按鈕內容`, ephemeral: true }).catch()
					}
				}
				if (/的角色$/.test(messageContent)) {
					return await message.reply({ content: `${displayname}${resultText}`, ephemeral: false }).catch();
				}
				if (resultText) {
					const content = handlingCountButton(message, 'roll');
					handlingSendMessage(result);
					try {
						return await message.update({ content: content })
					} catch (error) {
						return
					}
				}
				else {
					const content = handlingCountButton(message, 'count');
					return await message.update({ content: content })
						.catch(error => console.error('discord bot #192  error: ', error, content));
				}
			}
		default:
			break;
	}
}

async function __sendMeMessage({ message, inputStr, groupid }) {
	inputStr = inputStr.replace(/^\.mee\s*/i, ' ').replace(/^\.me\s*/i, ' ');
	if (inputStr.match(/^\s+$/)) {
		inputStr = `.me 或 /mee 可以令HKTRPG機械人重覆你的說話\n請輸入復述內容`
	}
	if (groupid) {
		await SendToReplychannel({ replyText: inputStr, channelid: message.channel.id });
	} else {
		SendToReply({ replyText: inputStr, message });
	}
	return;
}

client.on('shardDisconnect', (event, shardID) => {
	console.log('shardDisconnect: ', event, shardID)
});

client.on('shardResume', (replayed, shardID) => console.log(`Shard ID ${shardID} resumed connection and replayed ${replayed} events.`));

client.on('shardReconnecting', id => console.log(`Shard with ID ${id} reconnected.`));



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
