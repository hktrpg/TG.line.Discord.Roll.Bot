"use strict";
exports.analytics = require('../modules/analytics');
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const Discord = require('discord.js');
const client = new Discord.Client();
const {
	Random,
	nodeCrypto
} = require("random-js");
const random = new Random(nodeCrypto);
//const BootTime = new Date(new Date().toLocaleString("en-US", {
//	timeZone: "Asia/Shanghai"
//}));
// Load `*.js` under modules directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
//var Discordcountroll = 0;
//var Discordcounttext = 0;
const joinMessage = "你剛剛添加了HKTRPG 骰子機械人! \
		\n輸入 1D100 可以進行最簡單的擲骰.\
		\n輸入 Bothelp 觀看詳細使用說明.\
		\n如果你需要幫助, 加入支援頻道.\
		\n(http://bit.ly/HKTRPG_DISCORD)\
		\n有關TRPG資訊, 可以到網站\
		\n(http://www.hktrpg.com/)";

client.once('ready', () => {
	console.log('Discord is Ready!');
});


// handle the error event
client.on('error', error => {
	console.error(error);
});
client.on('Missing Permissions', error => {
	// Will print "unhandledRejection err is not defined"

	console.log('It is Missing Permissions: ', error.message);
});

client.on('guildCreate', guild => {
	console.log("Discord joined");
	let channel = guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'));
	if (channel)
		channel.send(joinMessage);
})

client.on('message', async (message) => {
	if (message.author.bot) return;
	//	console.log('message.content ' + message.content);
	//	console.log('channelKeyword ' + channelKeyword);
	let groupid, userid, displayname, channelid, displaynameDiscord, membercount = '';
	let TargetGM = require('../roll/z_DDR_darkRollingToGM').initialize();
	//得到暗骰的數據, GM的位置
	let displaynamecheck = true;
	let hasSendPermission = true;
	//檢查是不是有權限可以傳信訊
	//是不是自己.ME 訊息
	//TRUE 即正常
	let userrole = 1;
	//console.log(message.guild)
	if (message.guild && message.guild.me) {
		hasSendPermission = message.guild.me.hasPermission("SEND_MESSAGES");
	}
	if (message.channel.type !== "dm") {
		hasSendPermission = message.channel.permissionsFor(client.user).has("SEND_MESSAGES")
	}
	if (message.channel && message.channel.id) {
		channelid = message.channel.id;
	}
	if (message.guild && message.guild.id) {
		groupid = message.guild.id;
	}
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
	if (message.member && message.member.hasPermission("ADMINISTRATOR")) {
		userrole = 3
	}
	//userrole -1 ban ,0 nothing, 1 user, 2 dm, 3 admin 4 super admin
	if (message.guild && message.guild.members) {
		//membercount = await message.guild.members.cache.filter(member => !member.user.bot).size;
		//membercount = message.guild.channels.cache.filter(m => m.type === 'text').size
		membercount = await message.guild.members.fetch().then(member => {
			// The member is available here.
			return member.filter(member => !member.user.bot).size;
		});
	}

	if (!message.content) {
		if (groupid && userid) {
			await exports.analytics.EXPUP(groupid, userid, displayname, displaynameDiscord, membercount);
		}
		return null;
	}
	let CAPTCHA = random.string(20);
	let rplyVal = {};
	let trigger = "";
	let msgSplitor = (/\S+/ig);
	let mainMsg = message.content.match(msgSplitor); //定義輸入字串
	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	//指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me") {
		displaynamecheck = false;
	}
	let privatemsg = 0;
	//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
	//訊息來到後, 會自動跳到analytics.js進行骰組分析
	//如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.


	if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
		privatemsg = 1;
		message.content = message.content.replace(/^[d][r][ ]/i, '');
	}
	if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
		privatemsg = 2;
		message.content = message.content.replace(/^[d][d][r][ ]/i, '');
	}
	if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
		privatemsg = 3;
		message.content = message.content.replace(/^[d][d][d][r][ ]/i, '');
	}

	if (channelKeyword != "" && trigger == channelKeyword.toString().toLowerCase()) {
		//mainMsg.shift();
		rplyVal = await exports.analytics.parseInput(message.content, groupid, userid, userrole, "Discord", displayname, channelid, displaynameDiscord, membercount, CAPTCHA);
	} else {
		if (channelKeyword == "") {
			rplyVal = await exports.analytics.parseInput(message.content, groupid, userid, userrole, "Discord", displayname, channelid, displaynameDiscord, membercount, CAPTCHA);
		}
	}
	if (!rplyVal.text && !rplyVal.LevelUp) {
		return;
	}
	if (!hasSendPermission) {
		return;
	}
	if (CAPTCHA != rplyVal.CAPTCHA) {
		console.log('Discord CAPTCHA false', CAPTCHA, ' &&', rplyVal.CAPTCHA, "TEXT", message.content, 'rplyVal: ', rplyVal);
		return;
	}
	if (groupid && rplyVal && rplyVal.LevelUp) {
		//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
		await SendToReplychannel("<@" + userid + '>\n' + rplyVal.LevelUp);
	}

	if (!rplyVal.text) {
		return;
	}
	//Discordcountroll++;
	//簡單使用數字計算器
	if (privatemsg >= 1) {
		//當是私訊模式1-3時
		var TargetGMTempID = [];
		var TargetGMTempdiyName = [];
		var TargetGMTempdisplayname = [];
		if (TargetGM && TargetGM.trpgDarkRollingfunction)
			for (let i = 0; i < TargetGM.trpgDarkRollingfunction.length; i++) {
				if (TargetGM.trpgDarkRollingfunction[i].groupid == channelid) {
					for (let a = 0; a < TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
						//checkifsamename = 1
						TargetGMTempID[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid;
						TargetGMTempdiyName[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName;
						TargetGMTempdisplayname[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname;
						//TargetGMTemp[a]. channelid displayname diyName userid
					}
				}
			}
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
			if (groupid)
				await SendToReplychannel("<@" + userid + '> 暗骰給自己')
			if (userid)
				rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text
			return await SendToReply(rplyVal.text);
		case privatemsg == 2:
			//輸入ddr(指令) 私訊GM及自己
			//console.log('AAA', TargetGMTempID)
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "<@" + TargetGMTempID[i] + ">")
				}
				await SendToReplychannel("<@" + userid + '> 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}
			if (userid) {
				rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text;
			}
			await SendToReply(rplyVal.text);
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (userid != TargetGMTempID[i]) {
					await SendToId(TargetGMTempID[i], rplyVal.text);
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
				await SendToReplychannel("<@" + userid + '> 暗骰進行中 \n目標:  ' + targetGMNameTemp)
			}
			rplyVal.text = "<@" + userid + "> 的暗骰\n" + rplyVal.text
			for (let i = 0; i < TargetGMTempID.length; i++) {
				await SendToId(TargetGMTempID[i], rplyVal.text);
			}
			return;
		default:
			async function displayname() {
				//285083923223
				displayname = "<@" + userid + ">\n";
				rplyVal.text = displayname + rplyVal.text
				return rplyVal;
			}
			if (displaynamecheck && userid)
				rplyVal = await displayname();
			if (groupid)
				return await SendToReplychannel(rplyVal.text);
			else
				return await SendToReply(rplyVal.text);
	}


	//console.log('Discord Roll: ' + Discordcountroll + ', Discord Text: ' + Discordcounttext + ' Boot Time: ' + BootTime.toLocaleString(), " content: ", message.content);

	//console.log("rplyVal: " + rplyVal);


	async function SendToId(targetid, replyText) {
		for (let i = 0; i < replyText.toString().match(/[\s\S]{1,2000}/g).length; i++) {
			if (i == 0 || i == 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 2)
				try {
					//V12ERROR return await client.users.get(targetid).send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
					await client.users.cache.get(targetid).send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);

				}
			catch (e) {
				console.log('error SendtoID: ', e.message)
			}
		}

	}

	async function SendToReply(replyText) {
		for (let i = 0; i < replyText.toString().match(/[\s\S]{1,2000}/g).length; i++) {
			if (i == 0 || i == 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 2)
				try {
					await message.author.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);

				}
			catch (e) {
				console.log('error SendToReply: ', e.message)
			}
		}
	}
	async function SendToReplychannel(replyText) {
		for (let i = 0; i < replyText.toString().match(/[\s\S]{1,2000}/g).length; i++) {
			if (i == 0 || i == 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 1 || i == replyText.toString().match(/[\s\S]{1,2000}/g).length - 2)
				try {
					await message.channel.send(replyText.toString().match(/[\s\S]{1,2000}/g)[i]);
				}
			catch (e) {
				console.log('error SendToReplychannel: ', e.message);
			}
		}
	}
});
//Set Activity 可以自定義正在玩什麼
client.on('ready', () => {
	client.user.setActivity('bothelp | hktrpg.com');
});
client.login(channelSecret);
/*
 *client.on('ready', () => {
 *client.user.setActivity(actvs[Math.floor(Math.random() * (actvs.length - 1) + 1)]);
 *setInterval(() => {
 *	client.user.setActivity(actvs[Math.floor(Math.random() * (actvs.length - 1) + 1)]);
 *}, 10000);
 *});
 */



/**
 *
 * bot.on('message'
 	message => {
 		message.channel.send("My Bot's message", {
 			files: ["https://i.imgur.com/XxxXxXX.jpg"]
 		});
 	});
 */