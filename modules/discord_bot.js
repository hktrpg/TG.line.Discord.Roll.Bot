"use strict";
exports.analytics = require('./analytics');
const schema = require('../modules/schema.js');
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const adminSecret = process.env.ADMIN_SECRET || '';
const Discord = require("discord.js");
const { Client, Intents, Permissions } = Discord;
const rollText = require('./getRoll').rollText;
const agenda = require('../modules/schedule') && require('../modules/schedule').agenda;
const imageUrl = /^(?:(?:(?<protocol>(?:http|https)):\/\/)?(?:(?<authority>(?:[A-Za-z](?:[A-Za-z\d\-]*[A-Za-z\d])?)(?:\.[A-Za-z][A-Za-z\d\-]*[A-Za-z\d])*)(?:\:(?<port>[0-9]+))?\/)(?:(?<path>[^\/][^\?\#\;]*\/))?)?(?<file>[^\?\#\/\\]*\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\?(?<query>[^\#]*))?(?:\#(?<fragment>.*))?$/gm;
exports.z_stop = require('../roll/z_stop');


const client = new Client(
	{
		intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS], partials: ['MESSAGE', 'CHANNEL', 'REACTION']
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
				//console.log(`discord bot error #105`, error)
			}
			await SendToReplychannel({ replyText: inputStr, channelid: message.channel.id });

		} else {
			SendToReply({ replyText: inputStr, message });
			try {
				await message.delete();
			} catch (error) {
				//console.log(`discord bot error #114`, error)
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

	if (rplyVal.roleReactFlag) roleReact(channelid, rplyVal)
	if (rplyVal.newRoleReactFlag) newRoleReact(message, rplyVal)

	if (rplyVal.myName) repeatMessage(message, rplyVal);
	if (rplyVal.myNames) repeatMessages(message, rplyVal);

	if (rplyVal.sendNews) sendNewstoAll(rplyVal);
	if (!rplyVal.text && !rplyVal.LevelUp) {
		return;
	}
	try {
		let isNew = await newMessage.newUserChecker(userid, "Discord");
		if (process.env.mongoURL && rplyVal.text && isNew) {
			SendToId(userid, newMessage.firstTimeMessage(), true);
		}
	} catch (error) {
		console.log(`discord bot error #236`, error)
	}

	/**
	schedule 功能
	if (rplyVal.schedule && rplyVal.schedule.switch) {
		console.log('rplyVal.schedule', rplyVal.schedule)
			rplyVal.schedule.style == 'at' ? 
	}
	*/
	if (rplyVal.state) {
		console.log('01')
		rplyVal.text += '\n' + await count();
		console.log('02')
		rplyVal.text += '\nPing: ' + Number(Date.now() - message.createdTimestamp) + 'ms';
		rplyVal.text += await getAllshardIds();
		console.log('03')
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


//inviteDelete
//messageDelete


function convQuotes(text = "") {
	const imageMatch = text.match(imageUrl);
	return new Discord.MessageEmbed()
		.setColor('#0099ff')
		//.setTitle(rplyVal.title)
		//.setURL('https://discord.js.org/')
		.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
		.setDescription(text)
		.setImage((imageMatch && imageMatch.length > 0) ? imageMatch[0] : '')
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
					message.author.send({ embeds: [convQuotes(sendText[i])] });
				} else
					message.author.send(sendText[i]);
			}
			catch (e) {
				if (e.message !== 'Cannot send messages to this user') {
					console.error('Discord  GET ERROR:  SendToReply: ', e.message, replyText)
				}
			}
	}


	return;
}
async function SendToReplychannel({ replyText = "", channelid = "", quotes = false }) {
	if (!channelid) return;
	const channel = await client.channels.fetch(channelid);
	if (!channel) return;
	const sendText = replyText.toString().match(/[\s\S]{1,2000}/g);
	for (let i = 0; i < sendText.length; i++) {
		if (i == 0 || i == 1 || i == sendText.length - 1 || i == sendText.length - 2)
			try {
				if (quotes) {
					channel.send({ embeds: [convQuotes(sendText[i])] });
				} else {
					channel.send(sendText[i]);
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
	try {
		let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount);
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
client.on('ready', async () => {
	client.user.setActivity('🌼bothelp | hktrpg.com🍎');
	console.log(`Discord: Logged in as ${client.user.tag}!`);
	var switchSetActivity = 0;
	const refreshId = setInterval(async () => {
		if (shardids !== (client.shard.client.options.shardCount - 1)) return;
		if (adminSecret) {
			let check = await checkWakeUp();
			if (!check) {
				SendToId(adminSecret, 'HKTRPG可能下線了');
			}
		}
	}, 60000);
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
		.catch(err => {
			console.error(`disocrdbot #596 error ${err}`)
		});

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
		.catch((err) => {
			console.error(`disocrdbot #617 error ${err}`)
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
	
	console.error('Discord Unhandled promise rejection:', error.message);

	process.send({
		type: "process:msg",
		data: "discorderror"
	});
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
			.setAuthor({ name: 'HKTRPG', url: 'https://www.patreon.com/HKTRPG', iconURL: 'https://user-images.githubusercontent.com/23254376/113255717-bd47a300-92fa-11eb-90f2-7ebd00cd372f.png' })
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
			console.error("Discord Error removing job from collection:scheduleCronMessageDiscord", e);
		}

	})
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
	const number = client.shard.client.options.shardCount;
	const promises = [
		client.shard.broadcastEval(c => c.shard?.ids[0]),
		client.shard.broadcastEval(c => c.ws.status),
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
client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.me) return;
	/** 
	name: '22',
		id: '947051740547645500',
		*/
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId }).catch(error => console.error('discord_bot #802 mongoDB error: ', error.name, error.reson))
	if (!list || list.length === 0) return;
	const detail = list.detail;
	const findEmoji = detail.find(function (item) {
		return item.emoji === reaction.emoji.name || item.emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
	});
	if (findEmoji) {
		const member = await reaction.message.guild.members.fetch(user.id);
		member.roles.add(findEmoji.roleID)
	} else {
		reaction.users.remove(user.id);
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (reaction.me) return;
	const list = await schema.roleReact.findOne({ messageID: reaction.message.id, groupid: reaction.message.guildId }).catch(error => console.error('discord_bot #817 mongoDB error: ', error.name, error.reson))
	if (!list || list.length === 0) return;
	const detail = list.detail;
	for (let index = 0; index < detail.length; index++) {
		if (detail[index].emoji === reaction.emoji.name || detail[index].emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`) {
			const member = await reaction.message.guild.members.fetch(user.id);
			member.roles.remove(detail[index].roleID)
		}
	}
});



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


async function getAllshardIds() {
	if (!client.shard) {
		return;
	}
	console.log('02-1')
	const promises = [
		client.shard.broadcastEval(c => c.shard?.ids[0]),
		client.shard.broadcastEval(c => c.ws.status),
		client.shard.broadcastEval(c => c.ws.ping)
	];
	return Promise.all(promises)
		.then(results => {
			return '\n所有啓動中的server ID: ' + results[0].join(', ') + '\n所有啓動中的server online?: ' + results[1].join(', ') + '\n所有啓動中的server ping?: ' + results[2].join(', ');
		})
		.catch(err => {
			console.error(`disocrdbot #884 error ${err}`)
		});

}



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
