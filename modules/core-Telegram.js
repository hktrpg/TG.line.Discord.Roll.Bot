"use strict";
if (!process.env.TELEGRAM_CHANNEL_SECRET) {
	return;
}
exports.analytics = require('./core-analytics');
const {
	Telegraf
} = require('telegraf');
const TGclient = new Telegraf(process.env.TELEGRAM_CHANNEL_SECRET);
const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || '';
//var TGcountroll = 0;
//var TGcounttext = 0;
const msgSplitor = (/\S+/ig);
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const EXPUP = require('./level').EXPUP || function () { };
const courtMessage = require('./logs').courtMessage || function () { };
const joinMessage = `你剛剛添加了HKTRPG 骰子機械人! 
主要功能：暗骰, 各類TRPG骰子擲骰, 頻道經驗值, 占卜, 先攻表, TRPG角色卡, 搜圖, 翻譯, Discord 聊天紀錄匯出, 數學計算, 做筆記, 隨機抽選, 自定義抽選, wiki查詢, 資料庫快速查詢功能\
輸入 1D100 可以進行最簡單的擲骰.
到 (https://hktrpg.github.io/TG.line.Discord.Roll.Bot/) 或輸入 bothelp 觀看詳細使用說明.
						如果你需要幫助, 加入支援頻道.
						(http://bit.ly/HKTRPG_DISCORD)
						有關TRPG資訊, 可以到網站
						(http://www.hktrpg.com/)`;
TGclient.catch((err) => {
	console.error('bot error: ', err);
});
TGclient.on('text', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	let inputStr = ctx.message.text;
	let trigger = "",
		mainMsg = "",
		userid = "";
	//@bABD
	if (ctx.message.from.id) userid = ctx.message.from.id;
	if (inputStr) {
		if (ctx.botInfo && ctx.botInfo.username && inputStr.match(/^[/]/))
			inputStr = inputStr
				.replace(new RegExp('@' + ctx.botInfo.username + '$', 'i'), '')
				.replace(new RegExp('^/', 'i'), '');
		mainMsg = inputStr.match(msgSplitor); // 定義輸入字串
	}
	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	//指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me") {
		inputStr = inputStr.replace(/^.me\s+/i, '');
		ctx.reply(inputStr);
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
		await nonDice(ctx);
		return;
	}


	let groupid = ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && ctx.message.from.id && ctx.message.chat.id) ? ctx.message.chat.id : '';
	let displayname = '',
		channelid = '',
		membercount = 0,
		titleName = (ctx.message && ctx.message.chat && ctx.message.chat.title) ? ctx.message.chat.title : '';
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];
	//得到暗骰的數據, GM的位置
	if (ctx.message.from.username) displayname = ctx.message.from.username;
	//是不是自己.ME 訊息
	//TRUE 即正常
	let displaynamecheck = true;
	let userrole = 1;
	//console.log('TG: ', message)
	//console.log('ctx.chat.id', ctx.chat.id)
	//頻道人數
	if (ctx.chat && ctx.chat.id) {
		membercount = await ctx.getChatMembersCount(ctx.chat.id) - 1;
	}
	//285083923223
	//userrole = 3

	if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
		(await isAdmin(ctx, ctx.message.from.id, ctx.message.chat.id)) ? userrole = 3 : null;
	}
	let rplyVal = {};

	// 訊息來到後, 會自動跳到analytics.js進行骰組分析
	// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
	if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
		mainMsg.shift();
		rplyVal = await exports.analytics.parseInput({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			botname: "Telegram",
			displayname: displayname,
			channelid: channelid,
			membercount: membercount,
			titleName: titleName
		})
	} else {
		if (channelKeyword == '') {
			rplyVal = await exports.analytics.parseInput({
				inputStr: inputStr,
				groupid: groupid,
				userid: userid,
				userrole: userrole,
				botname: "Telegram",
				displayname: displayname,
				channelid: channelid,
				membercount: membercount,
				titleName: titleName
			})
		}
	}
	if (!rplyVal.text && !rplyVal.LevelUp)
		return;
	//LevelUp功能
	if (groupid && rplyVal && rplyVal.LevelUp) {
		let text = `@${displayname}${(rplyVal.statue) ? ' ' + rplyVal.statue : ''}
		${rplyVal.LevelUp}`
		ctx.reply(text);
	}
	if (!rplyVal.text) {
		return;
	}
	//TGcountroll++;
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = await privateMsgFinder(groupid) || [];
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
			//console.log('ctx.message.chat.type: ', ctx.message.chat.type)
			if (ctx.message.chat.type != 'private') {
				ctx.reply("@" + displayname + ' 暗骰給自己');
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
			await SendToId(ctx.message.from.id);
			break;
		case privatemsg == 2:
			//輸入ddr(指令) 私訊GM及自己
			if (ctx.message.chat.type != 'private') {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				ctx.reply("@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			SendToId(ctx.message.from.id);
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (ctx.message.from.id != TargetGMTempID[i])
					SendToId(TargetGMTempID[i]);
			}
			break;
		case privatemsg == 3:
			//輸入dddr(指令) 私訊GM
			if (ctx.message.chat.type != 'private') {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				ctx.reply("@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp);
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			for (let i = 0; i < TargetGMTempID.length; i++) {
				SendToId(TargetGMTempID[i]);
			}
			break;
		default:
			if (displaynamecheck && displayname) {
				//285083923223
				displayname = "@" + ctx.message.from.username + (rplyVal.statue) ? ' ' + rplyVal.statue : '' + "\n";
				rplyVal.text = displayname + rplyVal.text;
			}
			SendToReply();
			break;
	}

	async function SendToId(targetid) {
		for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
			if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
				ctx.telegram.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
		}
	}
	async function SendToReply() {
		for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
			if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
				ctx.reply(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
			}
		}
	}

	// console.log("rplyVal: " + rplyVal)

	//  }

})
const reconnectInterval = 1 * 1000 * 60;
const WebSocket = require('ws');
var ws;
var connect = function () {
	ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log('connected To core-www from Telegram!')
		ws.send('connected To core-www from Telegram!');
	});
	ws.on('message', function incoming(data) {
		var object = JSON.parse(data);
		if (object.botname == 'Telegram') {
			if (!object.message.text) return;
			console.log('Telegram have message')
			TGclient.telegram.sendMessage(object.message.target.id, object.message.text);
			return;
		}
		if (object.botname == 'Line') {
			if (!object.message.text) return;
			console.log('Line have message')
			process.emit('Line', object.message);
			return;
		}

	});
	ws.on('error', (error) => {
		console.error('Telegram socket error', error);
	});

	ws.on('close', function () {
		console.log('Telegram socket close');
		setTimeout(connect, reconnectInterval);
	});
};
if (process.env.BROADCAST)
	connect();



async function nonDice(ctx) {
	if ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && ctx.message.from.id && ctx.message.chat.id) {
		let groupid = '',
			userid = '',
			displayname = '',
			membercount = null;
		groupid = ctx.message.chat.id;
		if (ctx.message.from.username) {
			displayname = ctx.message.from.username;
		}
		if (ctx.message.from.id) {
			userid = ctx.message.from.id;
		}
		if (ctx.chat && ctx.chat.id) {
			membercount = await ctx.getChatMembersCount(ctx.chat.id);
		}
		let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount);
		await courtMessage("", "Telegram", "")
		if (groupid && LevelUp && LevelUp.text) {

			ctx.reply(`@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`);
		}
	}
	return null;
}


TGclient.on('message', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	if (ctx.message.new_chat_member && ctx.message.new_chat_member.username == ctx.me) {
		console.log("Telegram joined");
		ctx.reply(joinMessage);
	} else if (ctx.message.group_chat_created) {
		console.log("Telegram joined");
		ctx.reply(joinMessage);
	} else return null;
});

TGclient.on('audio', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
});
TGclient.on('document', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
TGclient.on('photo', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
TGclient.on('sticker', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
TGclient.on('video', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
TGclient.on('voice', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
TGclient.on('forward', async (ctx) => {
	if (ctx.message.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
async function privateMsgFinder(channelid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == channelid
	)
	if (groupInfo && groupInfo.trpgDarkRollingfunction)
		return groupInfo.trpgDarkRollingfunction
	else return [];
}

TGclient.launch();

async function isAdmin(ctx, gpId, chatid) {
	let member = await ctx.getChatMember(gpId, chatid);
	if (member.status === "creator") return true
	if (member.status === "administrator") return true
	return false;
}

/*
bot.command('pipe', (ctx) => ctx.replyWithPhoto({
	url: 'https://picsum.photos/200/300/?random'
}))
*/