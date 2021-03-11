"use strict";
exports.analytics = require('./core-analytics');
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const Discord = require('discord.js');
const client = new Discord.Client();
const DBL = require("dblapi.js");
//TOP.GG 
const togGGToken = process.env.TOPGG;
const dbl = (togGGToken) ? new DBL(togGGToken, client) : null;
const msgSplitor = (/\S+/ig);
const link = process.env.WEB_LINK;
const port = process.env.PORT || 20721;
const mongo = process.env.mongoURL
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () {};
const courtMessage = require('./logs').courtMessage || function () {};
const joinMessage = "你剛剛添加了HKTRPG 骰子機械人! \
		\n輸入 1D100 可以進行最簡單的擲骰.\
		\n輸入 Bothelp 觀看詳細使用說明.\
		\n如果你需要幫助, 加入支援頻道.\
		\n(http://bit.ly/HKTRPG_DISCORD)\
		\n有關TRPG資訊, 可以到網站\
		\n(http://www.hktrpg.com/)";
const reconnectInterval = 1 * 1000 * 60;
const WebSocket = require('ws');
var ws;
var connect = function () {
	ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log('connectd To core-www from discord!')
		ws.send('connectd To core-www from discord!');
	});
	ws.on('message', function incoming(data) {
		var object = JSON.parse(data);
		if (object.botname == 'Discord') {
			console.log('discord have message')
			let text = 'let result = this.channels.cache.get("' + object.message.target.id + '");if (result) {result.send("' + object.message.text.replace(/\r\n|\n/g, "\\n") + '");}'
			client.shard.broadcastEval(text);
			return;
		}
	});
	ws.on('error', (error) => {
		console.log('Discord socket error', error);
	});
	ws.on('close', function () {
		console.log('Discord socket close');
		setTimeout(connect, reconnectInterval);
	});
};

client.once('ready', async () => {
	if (process.env.BROADCAST)
		connect();
});

async function count() {
	if (!client.shard) return;
	const promises = [
		client.shard.fetchClientValues('guilds.cache.size'),
		client.shard.broadcastEval('this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)'),
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
	if (!client.shard) return 'bothelp | hktrpg.com';
	const promises = [
		client.shard.fetchClientValues('guilds.cache.size'),
		client.shard.broadcastEval('this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)'),
	];

	return Promise.all(promises)
		.then(results => {
			const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
			const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
			return (` ${totalGuilds}群組📶-\n ${totalMembers}會員📶`);
		})
		.catch(() => {
			console.error
			return 'bothelp | hktrpg.com';
		});
}

// handle the error event
process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

client.on('guildCreate', guild => {
	console.log("Discord joined");
	let channel = guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'));
	if (channel) {
		channel.send(joinMessage);
	}
})

client.on('message', async (message) => {
	if (message.author.bot) return;
	let inputStr = message.content;
	let trigger = "";
	let groupid = (message.guild && message.guild.id) ? message.guild.id : '';
	let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	//指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me") {
		inputStr = inputStr.replace(/^.me\s+/i, '');
		if (groupid) {
			SendToReplychannel(inputStr, message);
		} else {
			SendToReply(inputStr, message);
		}
		return;
	}
	let privatemsg = 0;

	function privateMsg() {
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
	}
	privateMsg();


	let target = await exports.analytics.findRollList(inputStr.match(msgSplitor));

	if (!target) {
		await nonDice(message)
		return null
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
	let hasSendPermission = true;
	//檢查是不是有權限可以傳信訊
	//是不是自己.ME 訊息
	//TRUE 即正常
	let userrole = 1;
	//console.log(message.guild)
	if (message.guild && message.guild.me) {
		hasSendPermission = message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES") || message.guild.me.hasPermission("ADMINISTRATOR");
	}
	if (message.channel && message.channel.id) {
		channelid = message.channel.id;
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
	if (groupid && message.channel && message.channel.permissionsFor(client.user) && message.channel.permissionsFor(client.user).has("MANAGE_CHANNELS")) {
		userrole = 2
	}
	if (message.member && message.member.hasPermission("ADMINISTRATOR")) {
		userrole = 3
	}
	//userrole -1 ban ,0 nothing, 1 user, 2 dm, 3 admin 4 super admin
	if (message.guild && message.guild.members) {
		membercount = message.guild.members.cache.filter(member => !member.user.bot).size;
	}
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
	if (!rplyVal.text && !rplyVal.LevelUp) {
		return;
	}
	if (!hasSendPermission) {
		return;
	}

	if (rplyVal.state) {
		rplyVal.text += '\n' + await count();
		rplyVal.text += '\nPing: ' + Number(Date.now() - message.createdTimestamp) + 'ms'
	}

	if (groupid && rplyVal && rplyVal.LevelUp) {
		//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
		SendToReplychannel("<@" + userid + '>\n' + rplyVal.LevelUp, message);
	}
	if (rplyVal.discordExport) {
		message.author.send('這是頻道 ' + message.channel.name + ' 的聊天紀錄', {
			files: [
				"./tmp/" + rplyVal.discordExport + '.txt'
			]
		});
	}
	if (rplyVal.discordExportHtml) {
		if (!link || !mongo) {
			message.author.send('這是頻道 ' + message.channel.name + ' 的聊天紀錄\n 密碼: ' +
				rplyVal.discordExportHtml[1], {
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
				SendToReplychannel("<@" + userid + '> 暗骰給自己', message)
			}
			if (userid) {
				rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text
				SendToReply(rplyVal.text, message);
			}
			return;
		case privatemsg == 2:
			//輸入ddr(指令) 私訊GM及自己
			//console.log('AAA', TargetGMTempID)
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "<@" + TargetGMTempID[i] + ">")
				}
				SendToReplychannel("<@" + userid + '> 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp, message);
			}
			if (userid) {
				rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text;
			}
			SendToReply(rplyVal.text, message);
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (userid != TargetGMTempID[i]) {
					SendToId(TargetGMTempID[i], rplyVal.text, client);
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
				SendToReplychannel("<@" + userid + '> 暗骰進行中 \n目標:  ' + targetGMNameTemp, message)
			}
			rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text
			for (let i = 0; i < TargetGMTempID.length; i++) {
				SendToId(TargetGMTempID[i], rplyVal.text);
			}
			return;
		default:
			if (userid) {
				rplyVal.text = "<@" + userid + ">\n" + rplyVal.text;
			}
			if (groupid) {
				SendToReplychannel(rplyVal.text, message);
			} else {
				SendToReply(rplyVal.text, message);
			}
			return;
	}


});

async function privateMsgFinder(channelid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == channelid
	)
	if (groupInfo && groupInfo.trpgDarkRollingfunction)
		return groupInfo.trpgDarkRollingfunction
	else return [];
}
async function SendToId(targetid, replyText) {
	for (let i = 0; i < replyText.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 2)
			try {
				//V12ERROR return await client.users.get(targetid).send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
				client.users.cache.get(targetid).send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
		catch (e) {
			console.log(' GET ERROR:  SendtoID: ', e.message, replyText)
		}
	}

}

async function SendToReply(replyText, message) {
	for (let i = 0; i < replyText.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 2)
			try {
				await message.author.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
		catch (e) {
			console.log(' GET ERROR:  SendToReply: ', e.message, replyText, message)
		}
	}
}
async function SendToReplychannel(replyText, message) {
	for (let i = 0; i < replyText.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 2)
			try {
				await message.channel.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
		catch (e) {
			console.log(' GET ERROR: SendToReplychannel: ', e.message, replyText, message);
		}
	}
}

client.on('shardDisconnect', (event, shardID) => {
	console.log('shardDisconnect: ', event, shardID)
});

client.on('shardResume', (replayed, shardID) => console.log(`Shard ID ${shardID} resumed connection and replayed ${replayed} events.`));

client.on('shardReconnecting', id => console.log(`Shard with ID ${id} reconnected.`));

async function nonDice(message) {
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
	if (message.guild && message.guild.members) {
		membercount = message.guild.members.cache.filter(member => !member.user.bot).size;
	}
	let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount);
	await courtMessage("", "Discord", "")
	if (groupid && LevelUp) {
		//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
		await SendToReplychannel("@" + displayname + '\n' + LevelUp, message);
	}

	return null;
}


//Set Activity 可以自定義正在玩什麼
client.on('ready', async () => {
	client.user.setActivity('bothelp | hktrpg.com');
	if (togGGToken) {
		setInterval(() => {
			dbl.postStats(client.guilds.size);
		}, 1800000);
	}
	var switchSetActivity = 0;

	setInterval(async () => {
		switch (switchSetActivity % 2) {
			case 1:
				client.user.setActivity('bothelp | hktrpg.com');
				break;
			default:
				client.user.setActivity(await count2());
				break;
		}
		switchSetActivity = (switchSetActivity % 2) ? 2 : 3;
	}, 60000);

});
if (togGGToken) {
	dbl.on('error', e => {
		console.log(`dbl Top.GG get Error! ${e}`);
	})
}

client.login(channelSecret);