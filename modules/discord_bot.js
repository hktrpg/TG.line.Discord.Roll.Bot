"use strict";
exports.analytics = require('./analytics');
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const Discord = require("discord.js-light");
const { Client, Intents, Permissions } = Discord;
const rollText = require('./getRoll').rollText;
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
exports.z_stop = require('../roll/z_stop');


function channelFilter(channel) {
	return !channel.lastMessageId || Discord.SnowflakeUtil.deconstruct(channel.lastMessageId).timestamp < Date.now() - 3600000;
}
const client = new Client({
	makeCache: Discord.Options.cacheWithLimits({
		ApplicationCommandManager: 0, // guild.commands
		BaseGuildEmojiManager: 0, // guild.emojis
		GuildBanManager: 0, // guild.bans
		GuildInviteManager: 0, // guild.invites
		GuildMemberManager: 0, // guild.members
		GuildStickerManager: 0, // guild.stickers
		MessageManager: Infinity, // channel.messages
		PermissionOverwriteManager: 0, // channel.permissionOverwrites
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
	/**
		  cacheGuilds: true,
		cacheChannels: true,
		cacheOverwrites: false,
		cacheRoles: true,
		cacheEmojis: false,
		cachePresences: false
	 */
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS]
});

const msgSplitor = (/\S+/ig);
const link = process.env.WEB_LINK;
const port = process.env.PORT || 20721;
const mongo = process.env.mongoURL
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };

const newMessage = require('./message');

const reconnectInterval = 1 * 1000 * 60;
const shardids = client.shard.ids[0];

const WebSocket = require('ws');
var ws;
var connect = function () {
	ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log('connectd To core-www from discord!')
		ws.send('connectd To core-www from discord!');
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
				.catch(console.error);
			return;
		}
	});
	ws.on('error', (error) => {
		console.error('Discord socket error', error);
	});
	ws.on('close', function () {
		console.error('Discord socket close');
		setTimeout(connect, reconnectInterval);
	});
};

client.once('ready', async () => {
	if (process.env.BROADCAST) connect();
	//	if (shardids === 0) getSchedule();
});

client.on('messageCreate', async message => {
	if (message.author.bot) return;
	let hasSendPermission = true;
	//	await repeatMessage(message)
	/**
	if (message.guild && message.guild.me) {
		hasSendPermission = (message.channel && message.channel.permissionsFor(message.guild.me)) ? message.channel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) : false || message.guild.me.permissions.has(Permissions.FLAGS.ADMINISTRATOR);
	}
暫時取消，因不理解DISCORD 的權限檢查
反正失敗也沒什麼後果
	 */

	let inputStr = message.content;
	//DISCORD <@!USERID> <@!399923133368042763> <@!544563333488111636>
	//LINE @名字
	let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
	let trigger = (mainMsg && mainMsg[0]) ? mainMsg[0].toString().toLowerCase() : '';
	if (!trigger) {
		await nonDice(message)
		return null
	}


	let groupid = (message.guildId) ? message.guildId : '';
	//指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me" && !z_stop(mainMsg, groupid)) {
		inputStr = inputStr.replace(/^.me\s+/i, ' ');
		if (groupid) {
			try {
				await message.delete();
			} catch (error) {
				error;
			}
			await SendToReplychannel({ replyText: inputStr, channelid: message.channel.id });

		} else {
			SendToReply({ replyText: inputStr, message });
			try {
				await message.delete();
			} catch (error) {
				error
			}
		}
		return;
	}

	let checkPrivateMsg = privateMsg({ trigger, mainMsg, inputStr });
	inputStr = checkPrivateMsg.inputStr;
	let privatemsg = checkPrivateMsg.privatemsg;

	let target = await exports.analytics.findRollList(inputStr.match(msgSplitor));
	if (!target) {
		await nonDice(message)
		return null
	}
	if (!hasSendPermission) {
		return;
	}
	let userid = '',
		displayname = '',
		channelid = '',
		displaynameDiscord = '',
		membercount = null,
		titleName = '';
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];
	//得到暗骰的數據, GM的位置

	//檢查是不是有權限可以傳信訊
	//是不是自己.ME 訊息
	//TRUE 即正常
	let userrole = 1;

	if (message.channelId) {
		channelid = message.channelId;
	}
	if (message.guild && message.guild.name) {
		titleName += message.guild.name + ' ';
	}
	if (message.channel && message.channel.name)
		titleName += message.channel.name;

	if (message.author.id) {
		userid = message.author.id;
	}
	if (message.member && message.member.user && message.member.user.tag) {
		displayname = message.member.user.tag;
	}
	if (message.member && message.member.user && message.member.user.username) {
		displaynameDiscord = message.member.user.username;
	}
	////DISCORD: 585040823232320107


	if (groupid && message.channel.permissionsFor(client.user) && message.channel.permissionsFor(client.user).has(Permissions.FLAGS.MANAGE_CHANNELS)) {
		userrole = 2
	}

	if (message.member && message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
		userrole = 3
	}
	//userrole -1 ban ,0 nothing, 1 user, 2 dm, 3 admin 4 super admin
	membercount = (message.guild) ? message.guild.memberCount : 0;

	let rplyVal = {};

	//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
	//訊息來到後, 會自動跳到analytics.js進行骰組分析
	//如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

	if (channelKeyword != "" && trigger == channelKeyword.toString().toLowerCase()) {
		//mainMsg.shift();
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
		})
	} else {
		if (channelKeyword == "") {
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
		}
	}

	if (rplyVal.myName) repeatMessage(message, rplyVal);
	if (rplyVal.myNames) repeatMessages(message, rplyVal);

	if (rplyVal.sendNews) sendNewstoAll(rplyVal);

	if (!rplyVal.text && !rplyVal.LevelUp) {
		return;
	}
	if (process.env.mongoURL && rplyVal.text && await newMessage.newUserChecker(userid, "Discord")) {
		SendToId(userid, newMessage.firstTimeMessage(), true);
	}

	/**
	schedule 功能
	if (rplyVal.schedule && rplyVal.schedule.switch) {
		console.log('rplyVal.schedule', rplyVal.schedule)
			rplyVal.schedule.style == 'at' ? 
	}
	*/
	if (rplyVal.state) {
		rplyVal.text += '\n' + await count();
		rplyVal.text += '\nPing: ' + Number(Date.now() - message.createdTimestamp) + 'ms'
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
	}

	//Discordcountroll++;
	//簡單使用數字計算器
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = await privateMsgFinder(channelid) || [];
		groupInfo.forEach((item) => {
			TargetGMTempID.push(item.userid);
			TargetGMTempdiyName.push(item.diyName);
			TargetGMTempdisplayname.push(item.displayname);
		})
	}
	/*
						if (groupid && userid) {
							//DISCORD: 585040823232320107
							displayname = "<@" + userid + "> \n"
							if (displaynamecheck)
								rplyVal.text = displayname + rplyVal.text
						}
	*/
	switch (true) {
		case privatemsg == 1:
			// 輸入dr  (指令) 私訊自己
			//
			if (groupid) {
				await SendToReplychannel(
					{ replyText: "<@" + userid + '> 暗骰給自己', channelid })
			}
			if (userid) {
				rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text
				SendToReply(
					{ replyText: rplyVal.text, message });
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
				rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text;
			}
			SendToReply({ replyText: rplyVal.text, message });
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (userid != TargetGMTempID[i]) {
					SendToId(TargetGMTempID[i], rplyVal.text);
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
			rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text
			for (let i = 0; i < TargetGMTempID.length; i++) {
				SendToId(TargetGMTempID[i], rplyVal.text);
			}
			return;
		default:
			if (userid) {
				rplyVal.text = `<@${userid}> ${(rplyVal.statue) ? rplyVal.statue : ''}\n${rplyVal.text}`;
			}

			if (groupid) {
				await SendToReplychannel({ replyText: rplyVal.text, channelid, quotes: rplyVal.quotes });
			} else {
				SendToReply({ replyText: rplyVal.text, message, quotes: rplyVal.quotes });
			}
			return;
	}


});

function convQuotes(text) {
	return new Discord.MessageEmbed()
		.setColor('#0099ff')
		//.setTitle(rplyVal.title)
		//.setURL('https://discord.js.org/')
		.setAuthor('HKTRPG', 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png', 'https://www.patreon.com/HKTRPG')
		.setDescription(text)
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
					console.error(' GET ERROR:  SendtoID: ', e.message, replyText)
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
					message.author.send({ embeds: [convQuotes(sendText[i])] });
				} else
					message.author.send(sendText[i]);
			}
			catch (e) {
				if (e.message !== 'Cannot send messages to this user') {
					console.error(' GET ERROR:  SendToReply: ', e.message, replyText)
				}
			}
	}


	return;
}
async function SendToReplychannel({ replyText = "", channelid = "", quotes = false }) {
	if (!channelid) return;
	let channel = await client.channels.fetch(channelid);
	let sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
	for (let i = 0; i < sendText.length; i++) {
		if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
			try {
				if (quotes) {
					channel.send({ embeds: [convQuotes(sendText[i])] });
				} else
					channel.send(sendText[i]);
				//await message.channel.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
			catch (e) {
				if (e.message !== 'Missing Permissions') {
					console.error(' GET ERROR: SendToReplychannel: ', e.message, replyText, channelid);
				}
			}

	}
	return;
}

client.on('shardDisconnect', (event, shardID) => {
	console.log('shardDisconnect: ', event, shardID)
});

client.on('shardResume', (replayed, shardID) => console.log(`Shard ID ${shardID} resumed connection and replayed ${replayed} events.`));

client.on('shardReconnecting', id => console.log(`Shard with ID ${id} reconnected.`));

async function nonDice(message) {
	await courtMessage({ result: "", botname: "Discord", inputStr: "", shardids: shardids })
	let groupid = '',
		userid = '';
	if (message.guild && message.guild.id) {
		groupid = message.guild.id;
	}
	if (message.author && message.author.id) {
		userid = message.author.id;
	}
	if (!groupid || !userid) return;
	let displayname = '',
		membercount = null;
	if (message.member && message.member.user && message.member.user.username) {
		displayname = message.member.user.username;
	}
	membercount = (message.guild) ? message.guild.memberCount : 0;
	let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount);
	if (groupid && LevelUp && LevelUp.text) {
		await SendToReplychannel(
			{ replyText: `@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`, channelid: message.channel.id }
		);
	}

	return null;
}


//Set Activity 可以自定義正在玩什麼
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	if (shardids !== 0) return;
	client.user.setActivity('🌼bothelp | hktrpg.com🍎');

	var switchSetActivity = 0;

	setInterval(async () => {
		switch (switchSetActivity % 2) {
			case 1:
				client.user.setActivity('🌼bothelp | hktrpg.com🍎');
				break;
			default:
				client.user.setActivity(await count2());
				break;
		}
		switchSetActivity = (switchSetActivity % 2) ? 2 : 3;
	}, 60000);
});

function privateMsg({ trigger, mainMsg, inputStr }) {
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
	if (!client.shard) return;
	const promises = [
		client.shard.fetchClientValues('guilds.cache.size'),
		client.shard
			.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
	];

	return Promise.all(promises)
		.then(results => {
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
			const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
			return (`正在運行HKTRPG的Discord 群組數量: ${totalGuilds}\nDiscord 會員數量: ${totalMembers}`);
		})
		.catch(console.error);

}
async function count2() {
	if (!client.shard) return '🌼bothelp | hktrpg.com🍎';
	const promises = [
		client.shard.fetchClientValues('guilds.cache.size'),
		client.shard
			.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
	];

	return Promise.all(promises)
		.then(results => {
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
			const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
			return (` ${totalGuilds}群組📶-\n ${totalMembers}會員📶`);
		})
		.catch(() => {
			console.error
			return '🌼bothelp | hktrpg.com🍎';
		});
}

// handle the error event
process.on('unhandledRejection', error => {

	console.error('Unhandled promise rejection:', error);
});

client.on('guildCreate', async guild => {
	let channels = await guild.channels.fetch();
	let keys = Array.from(channels.values());
	let channel = keys.find(channel => {
		return channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')
	});

	if (channel) {
		//	let channelSend = await guild.channels.fetch(channel.id);
		let text = new Discord.MessageEmbed()
			.setColor('#0099ff')
			//.setTitle(rplyVal.title)
			//.setURL('https://discord.js.org/')
			.setAuthor('HKTRPG', 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png', 'https://www.patreon.com/HKTRPG')
			.setDescription(newMessage.joinMessage())
		await channel.send({ embeds: [text] });
	}


})

client.login(channelSecret);



(async function () {
	if (!agenda) return;
	agenda.define("scheduleAtMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		//指定時間一次	
		//if (shardids !== 0) return;
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		SendToReplychannel(
			{ replyText: text, channelid: data.channelid, quotes: data.quotes = true }
		)
		try {
			await job.remove();
		} catch (e) {
			console.error("Error removing job from collection:scheduleAtMessageDiscord", e);
		}
	});

	agenda.define("scheduleCronMessageDiscord", async (job) => {
		//const date = new Date(2012, 11, 21, 5, 30, 0);
		//const date = new Date(Date.now() + 5000);
		//指定時間一次	
		//if (shardids !== 0) return;
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		SendToReplychannel(
			{ replyText: text, channelid: data.channelid, quotes: data.quotes = true }
		)
		try {
			if ((new Date(Date.now()) - data.createAt) >= 30 * 24 * 60 * 60 * 1000 * 6) {
				await job.remove();
				SendToReplychannel(
					{ replyText: "已運行六個月, 移除此定時訊息", channelid: data.channelid, quotes: data.quotes = true }
				)
			}
		} catch (e) {
			console.error("Error removing job from collection:scheduleCronMessageDiscord", e);
		}

	});
}())


function sendNewstoAll(rply) {
	for (let index = 0; index < rply.target.length; index++) {
		SendToId(rply.target[index].userID, rply.sendNews);
	}
}

async function repeatMessage(discord, message) {
	try {
		await discord.delete();
	} catch (error) {
		error
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
		let pair = webhook.isThread ? { threadId: discord.channelId } : {};
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
			let pair = webhook.isThread ? { threadId: discord.channelId } : {};
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
		const isThread = channel.isThread();
		//	console.log('channel', await channel.guild.fetchWebhooks())
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
		error
		await SendToReplychannel({ replyText: '不能新增Webhook.\n 請檢查你有授權HKTRPG 管理Webhook的權限, \n此為本功能必須權限', channelid: discord.channel.id });
		return;
	}
}

function z_stop(mainMsg, groupid) {
	if (!Object.keys(exports.z_stop).length || !exports.z_stop.initialize().save) {
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

/**
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
