"use strict";
// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.analytics = require('./analytics');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'debugMode'... Remove this comment to see the full error message
const debugMode = !!process.env.DEBUG;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('../modules/schema.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'isImageURL... Remove this comment to see the full error message
const isImageURL = require('image-url-validator').default;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'imageUrl'.
const imageUrl = (((/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)(\s?)$/igm)));
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelSec... Remove this comment to see the full error message
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'adminSecre... Remove this comment to see the full error message
const adminSecret = process.env.ADMIN_SECRET || '';
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'candle'.
const candle = require('../modules/candleDays.js');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const { ClusterClient, getInfo } = require('discord-hybrid-sharding');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Discord'.
const Discord = require('discord.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Client'.
const { Client, GatewayIntentBits, Partials, Options } = Discord;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'Permission... Remove this comment to see the full error message
const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder, PermissionsBitField, AttachmentBuilder, ChannelType } = Discord;

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'multiServe... Remove this comment to see the full error message
const multiServer = require('../modules/multi-server')
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'checkMongo... Remove this comment to see the full error message
const checkMongodb = require('../modules/dbWatchdog.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('node:fs');
const errorCount: any = [];
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rollText'.
const { rollText } = require('./getRoll');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'agenda'.
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.z_stop = require('../roll/z_stop');
const buttonStyles = [ButtonStyle.Danger, ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger]
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'SIX_MONTH'... Remove this comment to see the full error message
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const channelFilter = (channel: any) => !channel.lastMessageId || Discord.SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 36000;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'client'.
const client = new Client({
	sweepers: {
		...Options.DefaultSweeperSettings,
		messages: {
			interval: 1800, // Every hour...
			lifetime: 900,	// Remove messages older than 30 minutes.
		},
		users: {
			interval: 1800, // Every hour...
			lifetime: 900,	// Remove messages older than 30 minutes.
			filter: () => null,
		},
		threads: {
			interval: 1800, // Every hour...
			lifetime: 900,	// Remove messages older than 30 minutes.
		}
	},
	makeCache: Options.cacheWithLimits({
		ApplicationCommandManager: 0, // guild.commands
		BaseGuildEmojiManager: 0, // guild.emojis
		GuildBanManager: 0, // guild.bans
		GuildInviteManager: 0, // guild.invites
		GuildMemberManager: {
			maxSize: 200,
// @ts-expect-error TS(7006): Parameter 'member' implicitly has an 'any' type.
			keepOverLimit: (member) => member.id === client.user.id,
		}, // guild.members
		GuildStickerManager: 0, // guild.stickers
		MessageManager: 200, // channel.messages
		//PermissionOverwriteManager: 200, // channel.permissionOverwrites
		PresenceManager: 0, // guild.presences
		ReactionManager: 0, // message.reactions
		ReactionUserManager: 0, // reaction.users
		StageInstanceManager: 0, // guild.stageInstances
		ThreadManager: 0, // channel.threads
		ThreadMemberManager: 0, // threadchannel.members
		UserManager: 200, // client.users
		VoiceStateManager: 0,// guild.voiceStates

		//GuildManager: 200, // roles require guilds
		//RoleManager: 200, // cache all roles
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
	shards: getInfo().SHARD_LIST,  // An array of shards that will get spawned
	shardCount: getInfo().TOTAL_SHARDS, // Total number of shards
	restRequestTimeout: 45000, // Timeout for REST requests
	/**
		  cacheGuilds: true,
		cacheChannels: true,
		cacheOverwrites: false,
		cacheRoles: true,
		cacheEmojis: false,
		cachePresences: false
	 */
	intents: [GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.MessageContent], partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.cluster = new ClusterClient(client);
client.login(channelSecret);
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MESSAGE_SP... Remove this comment to see the full error message
const MESSAGE_SPLITOR = (((/\S+/ig)));
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'link'.
const link = process.env.WEB_LINK;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'port'.
const port = process.env.PORT || 20721;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const mongo = process.env.mongoURL
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'TargetGM'.
let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'EXPUP'.
const EXPUP = require('./level').EXPUP || function () { };
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'courtMessa... Remove this comment to see the full error message
const courtMessage = require('./logs').courtMessage || function () { };

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'newMessage... Remove this comment to see the full error message
const newMessage = require('./message');

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'RECONNECT_... Remove this comment to see the full error message
const RECONNECT_INTERVAL = 1 * 1000 * 60;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'shardid'.
const shardid = client.cluster.id;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'WebSocket'... Remove this comment to see the full error message
const WebSocket = require('ws');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'ws'.
let ws;

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
client.on('messageCreate', async message => {
	try {
		if (message.author.bot) return;
		if (!checkMongodb.isDbOnline() && checkMongodb.isDbRespawn()) {
			//checkMongodb.discordClientRespawn(client, shardid)
			respawnCluster2();
		}
		const result = await handlingResponMessage(message);
		await handlingMultiServerMessage(message);
		if (result && result.text)
			return handlingSendMessage(result);
		return;
	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('discord bot messageCreate #91 error', error, (error && error.name && error.message) & error.stack);
	}

});
// @ts-expect-error TS(7006): Parameter 'guild' implicitly has an 'any' type.
client.on('guildCreate', async guild => {
	try {
		const channels = await guild.channels.fetch();
		const keys = Array.from(channels.values());
		const channel = keys.find(channel => {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
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
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		await channel.send({ embeds: [text] });
	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		if (error.message === 'Missing Access') return;
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		if (error.message === 'Missing Permissions') return;
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('discord bot guildCreate  #114 error', (error && error.name), (error && error.message), (error && error.reson));
	}
})

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
client.on('interactionCreate', async message => {
	try {
		if (message.user && message.user.bot) return;
		return __handlingInteractionMessage(message);
	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('discord bot interactionCreate #123 error', (error && error.name), (error && error.message), (error && error.reson));
	}
});


// @ts-expect-error TS(7006): Parameter 'reaction' implicitly has an 'any' type.
client.on('messageReactionAdd', async (reaction, user) => {
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId })
		.cache(30)
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
		.catch(error => {
			console.error('discord_bot #802 mongoDB error: ', error.name, error.reson)
			checkMongodb.dbErrOccurs();
		})
	try {
		if (!list || list.length === 0) return;
		const detail = list.detail;
// @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
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
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('Discord bot messageReactionAdd #249 ', (error && error.name), (error && error.message), (error && error.reson))
	}

});

// @ts-expect-error TS(7006): Parameter 'reaction' implicitly has an 'any' type.
client.on('messageReactionRemove', async (reaction, user) => {
	if (!checkMongodb.isDbOnline()) return;
	if (reaction.me) return;
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
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
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		if (error.message === 'Unknown Member') return;
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('Discord bot messageReactionRemove #268 ', (error && error.name), (error && error.message), (error && error.reson))
	}
});

// @ts-expect-error TS(7006): Parameter 'minutes' implicitly has an 'any' type.
const sleep = async (minutes) => {
	await new Promise(resolve => {
		return setTimeout(resolve, minutes * 1000 * 60);
	});
};


client.once('ready', async () => {
	initInteractionCommands();
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
	if (process.env.BROADCAST) connect();
	//	if (shardid === 0) getSchedule();
	client.user.setActivity(`${candle.checker() || '🌼'}bothelp | hktrpg.com🍎`);
	console.log(`Discord: Logged in as ${client.user.tag}!`);
	let switchSetActivity = 0;
	// eslint-disable-next-line no-unused-vars
	//await sleep(6);
	const HEARTBEAT_CHECK_INTERVAL = 1000 * 60;
	const WARNING_THRESHOLD = 3;
	const CRITICAL_THRESHOLD = 5;
	const restartServer = () => {
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
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
// @ts-expect-error TS(2304): Cannot find name 'wakeup'.
			SendToId(adminSecret, `HKTRPG ID: ${wakeup.join(', ')} 可能下線了 請盡快檢查.`);
		}
		if (heartbeat > CRITICAL_THRESHOLD) {
			if (isAwake.length > 0)
				for (let i = 0; i < isAwake.length; i++)
					client.cluster.evalOnManager(`this.clusters.get(${isAwake[i]}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10000 });
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
	}, 180000);
});


// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function replilyMessage(message, result) {
	const displayname = (message.member && message.member.id) ? `<@${message.member.id}>${candle.checker()}\n` : '';
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
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
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
// @ts-expect-error TS(7006): Parameter 'content' implicitly has an 'any' type.
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
async function convQuotes(text = "") {
	let embeds = []
	let embed = new EmbedBuilder()
		.setColor('#0099ff')
		//.setTitle(rplyVal.title)
		//.setURL('https://discord.js.org/')
		.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
	const imageMatch = text.match(imageUrl) || null;
	if (imageMatch && imageMatch.length) {
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
	embed.setDescription(text)
	embeds.unshift(embed);
	return embeds;

}

// @ts-expect-error TS(7006): Parameter 'channelid' implicitly has an 'any' type... Remove this comment to see the full error message
async function privateMsgFinder(channelid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
// @ts-expect-error TS(7006): Parameter 'data' implicitly has an 'any' type.
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == channelid
	)
	if (groupInfo && groupInfo.trpgDarkRollingfunction)
		return groupInfo.trpgDarkRollingfunction
	else return [];
}
// @ts-expect-error TS(7006): Parameter 'targetid' implicitly has an 'any' type.
async function SendToId(targetid, replyText, quotes) {
	let user = await client.users.fetch(targetid);
	if (typeof replyText === "string") {
		let sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
// @ts-expect-error TS(2531): Object is possibly 'null'.
		for (let i = 0; i < sendText.length; i++) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
			if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
				try {
					if (quotes) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
						user.send({ embeds: await convQuotes(sendText[i]) });
// @ts-expect-error TS(2531): Object is possibly 'null'.
					} else { user.send(sendText[i]); }
				}
				catch (e) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
					console.error('Discord GET ERROR:  SendtoID: ', e.message, replyText)
				}
		}
	}
	else {
		user.send(replyText);
	}

}

// @ts-expect-error TS(7031): Binding element 'message' implicitly has an 'any' ... Remove this comment to see the full error message
async function SendToReply({ replyText = "", message, quotes = false }) {
	let sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
// @ts-expect-error TS(2531): Object is possibly 'null'.
	for (let i = 0; i < sendText.length; i++) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
		if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
			try {
				if (quotes) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
					message.author && message.author.send({ embeds: await convQuotes(sendText[i]) });
				} else
// @ts-expect-error TS(2531): Object is possibly 'null'.
					message.author && message.author.send(sendText[i]);
			}
			catch (e) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
				if (e.message !== 'Cannot send messages to this user') {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
					console.error('Discord  GET ERROR:  SendToReply: ', e.message, 'e', message, replyText)
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
		try {
			let guild = await client.guilds.fetch(groupid)
			channel = await guild.channels.fetch(channelid)
		} catch (error) {
			null
		}
	}
	if (!channel) return;
	//	console.error(`discord bot cant find channel #443 ${replyText}`)
	const sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
// @ts-expect-error TS(2531): Object is possibly 'null'.
	for (let i = 0; i < sendText.length; i++) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
		if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
			try {
				if (quotes) {
					for (let index = 0; index < buttonCreate.length || index === 0; index++) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
						channel.send({ embeds: await convQuotes(sendText[i]), components: buttonCreate[index] || null });
					}

				} else {
					for (let index = 0; index < buttonCreate.length || index === 0; index++) {
// @ts-expect-error TS(2531): Object is possibly 'null'.
						channel.send({ content: sendText[i], components: buttonCreate[index] || null });
					}
				}
				//await message.channel.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
			catch (e) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
				if (e.message !== 'Missing Permissions') {
					console.error('Discord  GET ERROR: SendToReplychannel: ', e, replyText, channelid);
				}
			}

	}
	return;
}


// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
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
			await SendToReplychannel(
				{ replyText: `@${displayname} ${candle.checker()} ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`, channelid: message.channel.id }
			);
		}
	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('await #534 EXPUP error', (error && error.name), (error && error.message), (error && error.reson));
	}
	return null;
}


//Set Activity 可以自定義正在玩什麼


// @ts-expect-error TS(7031): Binding element 'trigger' implicitly has an 'any' ... Remove this comment to see the full error message
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
// @ts-expect-error TS(7006): Parameter 'c' implicitly has an 'any' type.
			.broadcastEval(c => c.guilds.cache.filter((guild) => guild.available).reduce((acc, guild) => acc + guild.memberCount, 0))
	];
	return Promise.all(promises)
		.then(results => {
// @ts-expect-error TS(7006): Parameter 'acc' implicitly has an 'any' type.
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
// @ts-expect-error TS(7006): Parameter 'acc' implicitly has an 'any' type.
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
// @ts-expect-error TS(7006): Parameter 'c' implicitly has an 'any' type.
			.broadcastEval(c => c.guilds.cache.filter((guild) => guild.available).reduce((acc, guild) => acc + guild.memberCount, 0))
	];

	return Promise.all(promises)
		.then(results => {
// @ts-expect-error TS(7006): Parameter 'acc' implicitly has an 'any' type.
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
// @ts-expect-error TS(7006): Parameter 'acc' implicitly has an 'any' type.
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
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
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
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
	process.send({
		type: "process:msg",
		data: "discorderror"
	});
});




// @ts-expect-error TS(7006): Parameter 'err' implicitly has an 'any' type.
function respawnCluster(err) {
	if (!err.toString().match(/CLUSTERING_NO_CHILD_EXISTS/i)) return;
	let number = err.toString().match(/\d+$/i);
	if (!errorCount[number]) errorCount[number] = 0;
	errorCount[number]++;
	if (errorCount[number] > 3) {
		try {
			client.cluster.evalOnManager(`this.clusters.get(${client.cluster.id}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10000 });
		} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
			console.error('respawnCluster #480 error', (error && error.name), (error && error.message), (error && error.reson));
		}
	}
}
function respawnCluster2() {
	try {
		client.cluster.evalOnManager(`this.clusters.get(${client.cluster.id}).respawn({ delay: 7000, timeout: -1 })`, { timeout: 10000 });
	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('respawnCluster2 error', (error && error.name), (error && error.message), (error && error.reson));
	}
}

(async function () {
	if (!agenda) return;
// @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
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

// @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
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
// @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
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


// @ts-expect-error TS(7006): Parameter 'rply' implicitly has an 'any' type.
function sendNewstoAll(rply) {
	for (let index = 0; index < rply.target.length; index++) {
		SendToId(rply.target[index].userID, rply.sendNews);
	}
}

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingCommand(message) {
	try {
		const command = client.commands.get(message.commandName);
		if (!command) return;
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
		let answer = await command.execute(message).catch(error => {
			//console.error(error);
			//await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		})
		return answer;
	} catch (error) {
		return;
	}

}
// @ts-expect-error TS(7006): Parameter 'discord' implicitly has an 'any' type.
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
// @ts-expect-error TS(2532): Object is possibly 'undefined'.
		await webhook.webhook.send({ ...obj, ...pair });
	} catch (error) {
		await SendToReplychannel({ replyText: '不能成功發送扮演發言, 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
		return;
	}



}

// @ts-expect-error TS(7006): Parameter 'discord' implicitly has an 'any' type.
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
// @ts-expect-error TS(2532): Object is possibly 'undefined'.
			await webhook.webhook.send({ ...obj, ...pair });

		}

	} catch (error) {
		await SendToReplychannel({ replyText: '不能成功發送扮演發言, 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
		return;
	}

}
// @ts-expect-error TS(7006): Parameter 'discord' implicitly has an 'any' type.
async function manageWebhook(discord) {
	try {
		const channel = await client.channels.fetch(discord.channelId);
		const isThread = channel && channel.isThread();
		let webhooks = isThread ? await channel.guild.fetchWebhooks() : await channel.fetchWebhooks();
// @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
		let webhook = webhooks.find(v => {
			return (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
		})

		//type Channel Follower
		//'Incoming'
		if (!webhook) {
			const hooks = isThread ? await client.channels.fetch(channel.parentId) : channel;
			await hooks.createWebhook({ name: "HKTRPG .me Function", avatar: "https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png" })
			webhooks = await channel.fetchWebhooks();
// @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
			webhook = webhooks.find(v => {
				return (v.channelId == channel.parentId || v.channelId == channel.id) && v.token;
			})
		}
		return { webhook, isThread };
	} catch (error) {
		//	console.error(error)
		await SendToReplychannel({ replyText: '不能新增Webhook.\n 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: (discord.channel && discord.channel.id) || discord.channelId });
		return;
	}
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'roleReact'... Remove this comment to see the full error message
async function roleReact(channelid, message) {
	try {
		const detail = message.roleReactDetail
		const channel = await client.channels.fetch(channelid);
		const sendMessage = await channel.send(message.roleReactMessage);
		for (let index = 0; index < detail.length; index++) {
			sendMessage.react(detail[index].emoji);
		}
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
		await schema.roleReact.findByIdAndUpdate(message.roleReactMongooseId, { messageID: sendMessage.id }).catch(error => console.error('discord_bot #786 mongoDB error: ', error.name, error.reson))

	} catch (error) {
		await SendToReplychannel({ replyText: '不能成功增加ReAction, 請檢查你有授權HKTRPG 新增ReAction的權限, \n此為本功能必須權限', channelid });
		return;
	}



}

// @ts-expect-error TS(7006): Parameter 'channel' implicitly has an 'any' type.
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
	const promises = [
// @ts-expect-error TS(7006): Parameter 'c' implicitly has an 'any' type.
		client.cluster.broadcastEval(c => c.ws.status)
	];
	return Promise.all(promises)
		.then(results => {
// @ts-expect-error TS(7006): Parameter 'r' implicitly has an 'any' type.
			const indexes = results[0].reduce((r, n, i) => {
				n !== 0 && r.push(i);
				return r;
			}, []);
			if (indexes.length > 0) {
// @ts-expect-error TS(7006): Parameter 'index' implicitly has an 'any' type.
				indexes.forEach(index => {
					//checkMongodb.discordClientRespawn(client, index)
				})
				return indexes;
			}
			else return true;
			//if (results[0].length !== number || results[0].reduce((a, b) => a + b, 0) >= 1)
			//		return false
			//	else return true;
		})
		.catch(error => {
			console.error(`disocrdbot #836 error `, (error && error.name), (error && error.message), (error && error.reson))
			return false
		});

}

// @ts-expect-error TS(7006): Parameter 'mainMsg' implicitly has an 'any' type.
function z_stop(mainMsg, groupid) {
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	if (!Object.keys(exports.z_stop).length || !exports.z_stop.initialize().save || !mainMsg || !groupid) {
		return false;
	}
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	let groupInfo = exports.z_stop.initialize().save.find(e => e.groupid == groupid)
	if (!groupInfo || !groupInfo.blockfunction) return;
// @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
	let match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()))
	if (match) {
		return true;
	} else
		return false;
}

const discordPresenceStatus = ['online', 'idle', 'invisible', 'do not disturb']
async function getAllshardIds() {
	if (!client.cluster) {
		return;
	}
	const promises = [
		[...client.cluster.ids.keys()],
// @ts-expect-error TS(7006): Parameter 'c' implicitly has an 'any' type.
		client.cluster.broadcastEval(c => c.ws.status),
// @ts-expect-error TS(7006): Parameter 'c' implicitly has an 'any' type.
		client.cluster.broadcastEval(c => c.ws.ping),
		client.cluster.id,

	];
	return Promise.all(promises)
		.then(results => {
			return `\n現在的shard ID: ${results[3]}
			所有啓動中的shard ID:   ${results[0]} 
// @ts-expect-error TS(7006): Parameter 'ele' implicitly has an 'any' type.
			所有啓動中的shard online:   ${results[1].map(ele => discordPresenceStatus[ele]).join(', ').replace(/online/g, '在線')} 
// @ts-expect-error TS(7006): Parameter 'ele' implicitly has an 'any' type.
			所有啓動中的shard ping:   ${results[2].map(ele => ele.toFixed(0)).join(', ')}`;
		})
		.catch(error => {
			console.error(`disocrdbot #884 error `, (error && error.name), (error && error.message), (error && error.reson))
		});

}

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingButtonCreate(message, input) {
	const buttonsNames = input;
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
	const arrayRow = await splitArray(5, row)
	return arrayRow;
	//for (let index = 0; index < arrayRow.length; index++) {
	//	await message.reply({ content: ``, components: arrayRow[index] });
	//}

}

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingRequestRollingCharacter(message, input) {
	const buttonsNames = input[0];
	const characterName = input[1];
	const charMode = (input[2] == 'char') ? true : false;
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

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingRequestRolling(message, buttonsNames, displayname = '') {
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
	const arrayRow = await splitArray(5, row)
	for (let index = 0; index < arrayRow.length; index++) {
		try {
			await message.reply({ content: `${displayname}要求擲骰/點擊`, components: arrayRow[index] })
		} catch (error) {

		}

	}
}
// @ts-expect-error TS(7006): Parameter 'perChunk' implicitly has an 'any' type.
async function splitArray(perChunk, inputArray) {
	let myArray = [];
	for (let i = 0; i < inputArray.length; i += perChunk) {
		myArray.push(inputArray.slice(i, i + perChunk));
	}
	return myArray;
}

// @ts-expect-error TS(7006): Parameter 'num' implicitly has an 'any' type.
function buttonsStyle(num) {
	return buttonStyles[num % 5];
}

function initInteractionCommands() {
	client.commands = new Collection();
// @ts-expect-error TS(7006): Parameter 'file' implicitly has an 'any' type.
	const commandFiles = fs.readdirSync('./roll').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
		const command = require(`../roll/${file}`);
		if (command && command.discordCommand) {
			pushArrayInteractionCommands(command.discordCommand)
		}

	}
}
// @ts-expect-error TS(7006): Parameter 'arrayCommands' implicitly has an 'any' ... Remove this comment to see the full error message
function pushArrayInteractionCommands(arrayCommands) {
	for (const command of arrayCommands) {
		client.commands.set(command.data.name, command);
	}

}

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingResponMessage(message, answer = '') {
	try {
		let hasSendPermission = true;
		/**
				if (message.guild && message.guild.me) {
					hasSendPermission = (message.channel && message.channel.permissionsFor(message.guild.me)) ? message.channel.permissionsFor(message.guild.me).has(PermissionsBitField.Flags.SEND_MESSAGES) : false;
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
// @ts-expect-error TS(2304): Cannot find name 'exports'.
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

// @ts-expect-error TS(2304): Cannot find name 'exports'.
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
// @ts-expect-error TS(2339): Property 'requestRollingCharacter' does not exist ... Remove this comment to see the full error message
		if (rplyVal.requestRollingCharacter) await handlingRequestRollingCharacter(message, rplyVal.requestRollingCharacter);
// @ts-expect-error TS(2339): Property 'requestRolling' does not exist on type '... Remove this comment to see the full error message
		if (rplyVal.requestRolling) await handlingRequestRolling(message, rplyVal.requestRolling, displaynameDiscord);
// @ts-expect-error TS(2339): Property 'buttonCreate' does not exist on type '{}... Remove this comment to see the full error message
		if (rplyVal.buttonCreate) rplyVal.buttonCreate = await handlingButtonCreate(message, rplyVal.buttonCreate)
// @ts-expect-error TS(2339): Property 'roleReactFlag' does not exist on type '{... Remove this comment to see the full error message
		if (rplyVal.roleReactFlag) await roleReact(channelid, rplyVal)
// @ts-expect-error TS(2339): Property 'newRoleReactFlag' does not exist on type... Remove this comment to see the full error message
		if (rplyVal.newRoleReactFlag) await newRoleReact(message, rplyVal)
// @ts-expect-error TS(2339): Property 'discordEditMessage' does not exist on ty... Remove this comment to see the full error message
		if (rplyVal.discordEditMessage) await handlingEditMessage(message, rplyVal)

// @ts-expect-error TS(2339): Property 'myName' does not exist on type '{}'.
		if (rplyVal.myName) await repeatMessage(message, rplyVal);
// @ts-expect-error TS(2339): Property 'myNames' does not exist on type '{}'.
		if (rplyVal.myNames) await repeatMessages(message, rplyVal);

// @ts-expect-error TS(2339): Property 'sendNews' does not exist on type '{}'.
		if (rplyVal.sendNews) sendNewstoAll(rplyVal);

// @ts-expect-error TS(2339): Property 'sendImage' does not exist on type '{}'.
		if (rplyVal.sendImage) sendBufferImage(message, rplyVal, userid)
// @ts-expect-error TS(2339): Property 'fileLink' does not exist on type '{}'.
		if (rplyVal.fileLink?.length > 0) sendFiles(message, rplyVal, userid)
// @ts-expect-error TS(2339): Property 'respawn' does not exist on type '{}'.
		if (rplyVal.respawn) respawnCluster2();
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
		if (!rplyVal.text && !rplyVal.LevelUp) return;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
		if (process.env.mongoURL)
			try {

				const isNew = await newMessage.newUserChecker(userid, "Discord");
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
				if (process.env.mongoURL && rplyVal.text && isNew) {
					SendToId(userid, newMessage.firstTimeMessage(), true);
				}
			} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
				console.error(`discord bot error #236`, (error && error.name && error.message));
			}

// @ts-expect-error TS(2339): Property 'state' does not exist on type '{}'.
		if (rplyVal.state) {
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
			rplyVal.text += '\n' + (await count());
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
			rplyVal.text += '\nPing: ' + Number(Date.now() - message.createdTimestamp) + 'ms';
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
			rplyVal.text += await getAllshardIds();
		}

// @ts-expect-error TS(2339): Property 'LevelUp' does not exist on type '{}'.
		if (groupid && rplyVal && rplyVal.LevelUp) {
// @ts-expect-error TS(2339): Property 'LevelUp' does not exist on type '{}'.
			await SendToReplychannel({ replyText: `<@${userid}>\n${rplyVal.LevelUp}`, channelid });
		}

// @ts-expect-error TS(2339): Property 'discordExport' does not exist on type '{... Remove this comment to see the full error message
		if (rplyVal.discordExport) {
			message.author.send({
				content: '這是頻道 ' + message.channel.name + ' 的聊天紀錄',
				files: [
// @ts-expect-error TS(2339): Property 'discordExport' does not exist on type '{... Remove this comment to see the full error message
					new AttachmentBuilder("./tmp/" + rplyVal.discordExport + '.txt')
				]
			});
		}
// @ts-expect-error TS(2339): Property 'discordExportHtml' does not exist on typ... Remove this comment to see the full error message
		if (rplyVal.discordExportHtml) {
			if (!link || !mongo) {
				message.author.send(
					{
						content: '這是頻道 ' + message.channel.name + ' 的聊天紀錄\n 密碼: ' +
// @ts-expect-error TS(2339): Property 'discordExportHtml' does not exist on typ... Remove this comment to see the full error message
							rplyVal.discordExportHtml[1],
						files: [
// @ts-expect-error TS(2339): Property 'discordExportHtml' does not exist on typ... Remove this comment to see the full error message
							"./tmp/" + rplyVal.discordExportHtml[0] + '.html'
						]
					});

			} else {
				message.author.send('這是頻道 ' + message.channel.name + ' 的聊天紀錄\n 密碼: ' +
// @ts-expect-error TS(2339): Property 'discordExportHtml' does not exist on typ... Remove this comment to see the full error message
					rplyVal.discordExportHtml[1] + '\n請注意這是暫存檔案，會不定時移除，有需要請自行下載檔案。\n' +
// @ts-expect-error TS(2339): Property 'discordExportHtml' does not exist on typ... Remove this comment to see the full error message
					link + ':' + port + "/app/discord/" + rplyVal.discordExportHtml[0] + '.html')
			}
		}
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
		if (!rplyVal.text) {
			return;
		} else return {
			privatemsg: checkPrivateMsg.privatemsg, channelid,
			groupid,
			userid,
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
			text: rplyVal.text,
			message,
// @ts-expect-error TS(2339): Property 'statue' does not exist on type '{}'.
			statue: rplyVal.statue,
// @ts-expect-error TS(2339): Property 'quotes' does not exist on type '{}'.
			quotes: rplyVal.quotes,
// @ts-expect-error TS(2339): Property 'buttonCreate' does not exist on type '{}... Remove this comment to see the full error message
			buttonCreate: rplyVal.buttonCreate
		};

	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('handlingResponMessage Error: ', error, (error && error.name), (error && error.message), (error && error.reson))
	}
}
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
const sendBufferImage = async (message, rplyVal, userid) => {
	await message.channel.send({
		content: `<@${userid}>\n你的Token已經送到，現在輸入 .token 為方型，.token2 為圓型 .token3 為按名字決定的隨機顏色`, files: [
			new AttachmentBuilder(rplyVal.sendImage)
		]
	});
	fs.unlinkSync(rplyVal.sendImage);
	return;
}
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
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
	} catch (error) {
		console.error;
	}
	for (let index = 0; index < rplyVal.fileLink.length; index++) {
		try {
			fs.unlinkSync(files[index]);
		}
		catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
			console.error('discord bot error #1082', (error?.name, error?.message), files);
		}

	}

	return;
}

// @ts-expect-error TS(7006): Parameter 'input' implicitly has an 'any' type.
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
// @ts-expect-error TS(7034): Variable 'TargetGMTempID' implicitly has type 'any... Remove this comment to see the full error message
	let TargetGMTempID = [];
// @ts-expect-error TS(7034): Variable 'TargetGMTempdiyName' implicitly has type... Remove this comment to see the full error message
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = (await privateMsgFinder(channelid)) || [];
// @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
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
// @ts-expect-error TS(7005): Variable 'TargetGMTempdiyName' implicitly has an '... Remove this comment to see the full error message
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
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
				if (userid != TargetGMTempID[i]) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
					SendToId(TargetGMTempID[i], sendText);
				}
			}
			return;
		case privatemsg == 3:
			//輸入dddr(指令) 私訊GM
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempdiyName' implicitly has an '... Remove this comment to see the full error message
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "<@" + TargetGMTempID[i] + ">")
				}
				await SendToReplychannel(
					{ replyText: "<@" + userid + '> 暗骰進行中 \n目標:  ' + targetGMNameTemp, channelid })
			}
			sendText = "<@" + userid + "> 的暗骰\n" + sendText
			for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
				SendToId(TargetGMTempID[i], sendText);
			}
			return;
		default:
			if (userid) {
				sendText = `<@${userid}> ${(statue) ? statue : ''}${candle.checker()}\n${sendText}`;
			}
			if (groupid) {
				await SendToReplychannel({ replyText: sendText, channelid, quotes: quotes, buttonCreate: buttonCreate });
			} else {
// @ts-expect-error TS(2345): Argument of type '{ replyText: any; message: any; ... Remove this comment to see the full error message
				SendToReply({ replyText: sendText, message, quotes: quotes, buttonCreate: buttonCreate });
			}
			return;
	}
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'convertReg... Remove this comment to see the full error message
const convertRegex = function (str = "") {
	return new RegExp(str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"));
};

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'connect'.
const connect = function () {
	ws = new WebSocket('ws://127.0.0.1:53589');
// @ts-expect-error TS(2339): Property 'on' does not exist on type 'WebSocket'.
	ws.on('open', function open() {
		console.log(`connectd To core-www from discord! Shard#${shardid}`)
// @ts-expect-error TS(7005): Variable 'ws' implicitly has an 'any' type.
		ws.send(`connectd To core-www from discord! Shard#${shardid}`);
	});
// @ts-expect-error TS(2339): Property 'on' does not exist on type 'WebSocket'.
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
// @ts-expect-error TS(2571): Object is of type 'unknown'.
			console.error(`disocrdbot #99 error `, (error && error.name), (error && error.message), (error && error.reson))
		};
		return;

	});
// @ts-expect-error TS(2339): Property 'on' does not exist on type 'WebSocket'.
	ws.on('error', (error) => {
		console.error('Discord socket error', (error && error.name), (error && error.message), (error && error.reson));
	});
// @ts-expect-error TS(2339): Property 'on' does not exist on type 'WebSocket'.
	ws.on('close', function () {
		console.error('Discord socket close');
		setTimeout(connect, RECONNECT_INTERVAL);
	});
};

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
function handlingButtonCommand(message) {
	return message.component.label || ''
}
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingEditMessage(message, rplyVal) {
	try {
		//type = reply
		if (message.type !== 19) return message.reply({ content: '請Reply 你所想要修改的指定訊息' });
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
// @ts-expect-error TS(7006): Parameter 'wh' implicitly has an 'any' type.
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
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const togGGToken = process.env.TOPGG;
if (togGGToken) {
// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
	if (shardid !== (getInfo().TOTAL_SHARDS - 1)) return;
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
	const Topgg = require(`@top-gg/sdk`)
	const api = new Topgg.Api(togGGToken)
// @ts-expect-error TS(7017): Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
	this.interval = setInterval(async () => {
		const guilds = await client.cluster.fetchClientValues("guilds.cache.size");
		api.postStats({
// @ts-expect-error TS(7006): Parameter 'a' implicitly has an 'any' type.
			serverCount: parseInt(guilds.reduce((a, c) => a + c, 0)),
			shardCount: getInfo().TOTAL_SHARDS,
			shardId: client.cluster.id
		});
	}, 300000);
}

// @ts-expect-error TS(7031): Binding element 'channelid' implicitly has an 'any... Remove this comment to see the full error message
async function sendCronWebhook({ channelid, replyText, data }) {
	let webhook = await manageWebhook({ channelId: channelid })
	let obj = {
		content: replyText,
		username: data.roleName,
		avatarURL: data.imageLink
	};
	let pair = (webhook && webhook.isThread) ? { threadId: channelid } : {};
// @ts-expect-error TS(2532): Object is possibly 'undefined'.
	await webhook.webhook.send({ ...obj, ...pair });
}
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function handlingMultiServerMessage(message) {
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
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
// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
function multiServerTarget(message) {
	const obj = {
		content: message.content,
		username: message?._member?.nickname || message?._member?.displayName,
		avatarURL: message.author.displayAvatarURL()
	};
	return obj;
}

// @ts-expect-error TS(7006): Parameter 'groupid' implicitly has an 'any' type.
function __checkUserRole(groupid, message) {
	try {
		if (groupid && message.member && message.member.permissions.has(PermissionsBitField.Flags.Administrator))
			return 3;
		if (groupid && message.channel && message.channel.permissionsFor(message.member) && message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageChannels)) return 2;
		return 1;
	} catch (error) {
		//	console.log('error', error)
		return 1;
	}

}

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
async function __handlingReplyMessage(message, result) {
	const text = result.text;
	const sendTexts = text.toString().match(/[\s\S]{1,2000}/g);
	for (let index = 0; index < sendTexts.length; index++) {
		const sendText = sendTexts[index];
		if (sendText.length === 0) continue;
		try {
			//message.author && message.author.send({ embeds: await convQuotes(sendText[i]) });
			await message.reply({ embeds: await convQuotes(sendText), ephemeral: false })
		} catch (error) {
			try {
				await message.editReply({ embeds: await convQuotes(sendText), ephemeral: false })
			} catch (error) {
				return;
			}
		}
	}
}

// @ts-expect-error TS(7006): Parameter 'message' implicitly has an 'any' type.
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
					try {
						if (resultText) { return await message.reply({ content: `${displayname}${messageContent.replace(/的角色卡$/, '')}進行擲骰 \n${resultText}`, ephemeral: false }).catch(); }
						else {
							return await message.reply({ content: `${displayname}沒有反應，請檢查按鈕內容`, ephemeral: true }).catch()
						}
					} catch (error) {
						console.error();
					}
				}
				if (/的角色$/.test(messageContent)) {
					try {
						return await message.reply({ content: `${displayname}${resultText}`, ephemeral: false })
					} catch (error) {
						null;
					}

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
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
						.catch(error => console.error('discord bot #192  error: ', (error && (error.name || error.message || error.reson)), content));
				}
			}
		default:
			break;
	}
}

// @ts-expect-error TS(7031): Binding element 'message' implicitly has an 'any' ... Remove this comment to see the full error message
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

// @ts-expect-error TS(7006): Parameter 'event' implicitly has an 'any' type.
client.on('shardDisconnect', (event, shardID) => {
	console.log('shardDisconnect: ', event, shardID)
});

// @ts-expect-error TS(7006): Parameter 'replayed' implicitly has an 'any' type.
client.on('shardResume', (replayed, shardID) => console.log(`Shard ID ${shardID} resumed connection and replayed ${replayed} events.`));

// @ts-expect-error TS(7006): Parameter 'id' implicitly has an 'any' type.
client.on('shardReconnecting', id => console.log(`Shard with ID ${id} reconnected.`));


// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
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
