"use strict";
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (!process.env.TELEGRAM_CHANNEL_SECRET) {
// @ts-expect-error TS(1108): A 'return' statement can only be used within a fun... Remove this comment to see the full error message
	return;
}

// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const TelegramBot = require('node-telegram-bot-api');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'agenda'.
const agenda = require('../modules/schedule')
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'rollText'.
const rollText = require('./getRoll').rollText;
// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.analytics = require('./analytics');
// @ts-expect-error TS(2304): Cannot find name 'exports'.
exports.z_stop = require('../roll/z_stop');

// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const TGclient = new TelegramBot(process.env.TELEGRAM_CHANNEL_SECRET, { polling: true });
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'newMessage... Remove this comment to see the full error message
const newMessage = require('./message');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'channelKey... Remove this comment to see the full error message
const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || '';
//var TGcountroll = 0;
//var TGcounttext = 0;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'msgSplitor... Remove this comment to see the full error message
const msgSplitor = (((/\S+/ig)));

var robotName = ""


// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'EXPUP'.
const EXPUP = require('./level').EXPUP || function () { };
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'courtMessa... Remove this comment to see the full error message
const courtMessage = require('./logs').courtMessage || function () { };

// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('text', async (ctx) => {
	if (ctx.from.is_bot) return;
	let inputStr = ctx.text;
	let trigger = "",
		mainMsg = "",
		userid = "";
	if (!robotName) {
		let botInfo = await TGclient.getMe();
		robotName = botInfo.username;
	}
	if (ctx.from.id) userid = ctx.from.id;
	if (inputStr) {
		if (robotName && inputStr.match(/^[/]/))
			inputStr = inputStr
				.replace(new RegExp('@' + robotName + '$', 'i'), '')
				.replace(new RegExp('^/', 'i'), '');
		mainMsg = inputStr.match(msgSplitor); // 定義輸入字串
	}
	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	//指定啟動詞在第一個詞&把大階強制轉成細階
	let groupid = ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && userid && ctx.chat.id) ? ctx.chat.id : '';
	if ((trigger == ".me" || trigger == ".mee") && !z_stop(mainMsg, groupid)) {
		inputStr = inputStr.replace(/^\.mee\s*/i, ' ').replace(/^\.me\s*/i, ' ');
		if (inputStr.match(/^\s+$/)) {
			inputStr = `.me 或 /mee 可以令HKTRPG機械人重覆你的說話\n請輸入復述內容`
		}
		SendToId(ctx.chat.id || userid, inputStr);
		return;
	}
	let privatemsg = 0;

	(function privateMsg() {
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
	})();
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	let target = await exports.analytics.findRollList(inputStr.match(msgSplitor));
	if (!target) {
		await nonDice(ctx);
		return;
	}


	let displayname = '',
		membercount = 0,
		titleName = (ctx.message && ctx.chat && ctx.chat.title) ? ctx.chat.title : '';
// @ts-expect-error TS(7034): Variable 'TargetGMTempID' implicitly has type 'any... Remove this comment to see the full error message
	let TargetGMTempID = [];
// @ts-expect-error TS(7034): Variable 'TargetGMTempdiyName' implicitly has type... Remove this comment to see the full error message
	let TargetGMTempdiyName = [];
// @ts-expect-error TS(7034): Variable 'TargetGMTempdisplayname' implicitly has ... Remove this comment to see the full error message
	let TargetGMTempdisplayname = [];
	let tgDisplayname = (ctx.from.first_name) ? ctx.from.first_name : '';
	//得到暗骰的數據, GM的位置
	if (ctx.from.username) displayname = ctx.from.username;
	//是不是自己.ME 訊息
	//TRUE 即正常
	let displaynamecheck = true;
	let userrole = 1;
	//頻道人數
	if (ctx.chat && ctx.chat.id) {
		membercount = (await TGclient.getChatMemberCount(ctx.chat.id)) - 1;
	}
	//285083923223
	//userrole = 3

	if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
		(await isAdmin(groupid, userid)) ? userrole = 3 : null;
	}
	let rplyVal = {};

	// 訊息來到後, 會自動跳到analytics.js進行骰組分析
	// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
	if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
		(mainMsg as any).shift();
// @ts-expect-error TS(2304): Cannot find name 'exports'.
		rplyVal = await exports.analytics.parseInput({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			botname: "Telegram",
			displayname: displayname,
			channelid: "",
			membercount: membercount,
			titleName: titleName,
			tgDisplayname: tgDisplayname
		})
	} else {
		if (channelKeyword == '') {
// @ts-expect-error TS(2304): Cannot find name 'exports'.
			rplyVal = await exports.analytics.parseInput({
				inputStr: inputStr,
				groupid: groupid,
				userid: userid,
				userrole: userrole,
				botname: "Telegram",
				displayname: displayname,
				channelid: "",
				membercount: membercount,
				titleName: titleName,
				tgDisplayname: tgDisplayname
			})
		}
	}

	if ((rplyVal as any).sendNews) sendNewstoAll(rplyVal);
	if (!(rplyVal as any).text && !(rplyVal as any).LevelUp)
		return;
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
	if (process.env.mongoURL && (rplyVal as any).text && (await newMessage.newUserChecker(userid, "Telegram"))) {
		TGclient.sendMessage(userid, newMessage.firstTimeMessage());
	}

	//LevelUp功能
	if (groupid && rplyVal && (rplyVal as any).LevelUp) {
		let text = `@${displayname}${((rplyVal as any).statue) ? ' ' + (rplyVal as any).statue : ''}
		${(rplyVal as any).LevelUp}`;
		SendToId(groupid, text);

	}
	if (!(rplyVal as any).text) {
		return;
	}
	//TGcountroll++;
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = (await privateMsgFinder(groupid)) || [];
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
			if (ctx.chat.type != 'private') {
				SendToId(groupid, "@" + displayname + ' 暗骰給自己');
			}
			(rplyVal as any).text = "@" + displayname + " 的暗骰\n" + (rplyVal as any).text;
			SendToId(userid, (rplyVal as any).text);
			break;
		case privatemsg == 2:
			//輸入ddr(指令) 私訊GM及自己
			if (ctx.chat.type != 'private') {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempdiyName' implicitly has an '... Remove this comment to see the full error message
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}
			(rplyVal as any).text = "@" + displayname + " 的暗骰\n" + (rplyVal as any).text;
			SendToId(userid, (rplyVal as any).text);
			for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
				if (userid != TargetGMTempID[i])
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
					SendToId(TargetGMTempID[i], (rplyVal as any).text);
			}
			break;
		case privatemsg == 3:
			//輸入dddr(指令) 私訊GM
			if (ctx.chat.type != 'private') {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempdiyName' implicitly has an '... Remove this comment to see the full error message
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				SendToId(groupid, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp);
			}
			(rplyVal as any).text = "@" + displayname + " 的暗骰\n" + (rplyVal as any).text;
			for (let i = 0; i < TargetGMTempID.length; i++) {
// @ts-expect-error TS(7005): Variable 'TargetGMTempID' implicitly has an 'any[]... Remove this comment to see the full error message
				SendToId(TargetGMTempID[i], (rplyVal as any).text);
			}
			break;
		default:
			if (displaynamecheck && displayname) {
				//285083923223
displayname = "@" + ctx.from.username + ((rplyVal as any).statue) ? ' ' + (rplyVal as any).statue : '' + "\n";
				(rplyVal as any).text = displayname + (rplyVal as any).text;
			}
			SendToId(groupid || userid, (rplyVal as any).text);
			break;
	}

})

// @ts-expect-error TS(7006): Parameter 'targetid' implicitly has an 'any' type.
function SendToId(targetid, text) {
	for (var i = 0; i < text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
			TGclient.sendMessage(targetid, text.toString().match(/[\s\S]{1,2000}/g)[i]);
		}
	}
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'reconnectI... Remove this comment to see the full error message
const reconnectInterval = 1 * 1000 * 60;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'WebSocket'... Remove this comment to see the full error message
const WebSocket = require('ws');
// @ts-expect-error TS(7034): Variable 'ws' implicitly has type 'any' in some lo... Remove this comment to see the full error message
var ws;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'connect'.
var connect = function () {
	ws = new WebSocket('ws://127.0.0.1:53589');
	(ws as any).on('open', function open() {
    console.log('connected To core-www from Telegram!');
    // @ts-expect-error TS(7005): Variable 'ws' implicitly has an 'any' type.
    ws.send('connected To core-www from Telegram!');
});
// @ts-expect-error TS(7006): Parameter 'data' implicitly has an 'any' type.
	(ws as any).on('message', function incoming(data) {
    var object = JSON.parse(data);
    if (object.botname == 'Telegram') {
        if (!object.text)
            return;
        console.log('Telegram have message');
        TGclient.sendMessage(object.target.id, object.text);
        return;
    }
    if (object.botname == 'Line') {
        if (!object.text)
            return;
        console.log('Line have message');
        // @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
        process.emit('Line', object.message);
        return;
    }
});
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	(ws as any).on('error', (error) => {
    console.error('Telegram socket error', error);
});

	(ws as any).on('close', function () {
    console.log('Telegram socket close');
    setTimeout(connect, reconnectInterval);
});
};
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (process.env.BROADCAST) connect();



// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
async function nonDice(ctx) {
	await courtMessage({ result: "", botname: "Telegram", inputStr: "" })
	if ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && ctx.from.id && ctx.chat.id) {
		let groupid = (ctx.chat.id) ? ctx.chat.id.toString() : '',
			userid = (ctx.from.id) ? ctx.from.id.toString() : '',
			displayname = (ctx.from.username) ? ctx.from.username.toString() : '',
			membercount = null;
		let tgDisplayname = (ctx.from.first_name) ? ctx.from.first_name : '';
		if (ctx.chat && ctx.chat.id) {
			membercount = await TGclient.getChatMemberCount(ctx.chat.id);
		}
		let LevelUp = await EXPUP(groupid, userid, displayname, "", membercount, tgDisplayname);
		if (groupid && LevelUp && LevelUp.text) {
			SendToId(groupid, `@${displayname}  ${(LevelUp && LevelUp.statue) ? LevelUp.statue : ''}\n${LevelUp.text}`);
		}
	}
	return null;
}


// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('new_chat_members', async (ctx) => {
	let newUser = await TGclient.getMe();
	if (ctx.new_chat_member.username == newUser.username) {
		console.log("Telegram joined");
		SendToId(ctx.chat.id, newMessage.joinMessage());
	}
});

// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('group_chat_created', async (ctx) => {
	SendToId(ctx.chat.id, newMessage.joinMessage());
});
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('supergroup_chat_created', async (ctx) => {
	SendToId(ctx.chat.id, newMessage.joinMessage());
});


// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('audio', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
});
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('document', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('photo', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('sticker', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('video', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('voice', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
// @ts-expect-error TS(7006): Parameter 'ctx' implicitly has an 'any' type.
TGclient.on('forward', async (ctx) => {
	if (ctx.from.is_bot) return;
	await nonDice(ctx);
	return null;
})
// @ts-expect-error TS(7006): Parameter 'groupid' implicitly has an 'any' type.
async function privateMsgFinder(groupid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
// @ts-expect-error TS(7006): Parameter 'data' implicitly has an 'any' type.
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == groupid
	)
	if (groupInfo && groupInfo.trpgDarkRollingfunction)
		return groupInfo.trpgDarkRollingfunction
	else return [];
}

if (agenda && agenda.agenda) {
// @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
	agenda.agenda.define("scheduleAtMessageTelegram", async (job) => {
		//指定時間一次	
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		//SendToReply(ctx, text)
		SendToId(
			data.groupid, text
		)
		try {
			await job.remove();
		} catch (e) {
			console.error("TG Error removing job from collection:scheduleAtMessageTelegram", e);
		}

	});
// @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
	agenda.agenda.define("scheduleCronMessageTelegram", async (job) => {
		//指定時間
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		//SendToReply(ctx, text)
		SendToId(
			data.groupid, text
		)
		try {
// @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
			if ((new Date(Date.now()) - data.createAt) >= 30 * 24 * 60 * 60 * 1000 * 6) {
				await job.remove();
				SendToId(
					data.groupid, "已運行六個月, 移除此定時訊息"
				)
			}
		} catch (e) {
			console.error("Error removing job from collection:scheduleCronMessageTelegram", e);
		}

	});

}


// @ts-expect-error TS(7006): Parameter 'gpId' implicitly has an 'any' type.
async function isAdmin(gpId, chatid) {
	let member = await TGclient.getChatMember(gpId, chatid);
	if (member.status === "creator") return true
	if (member.status === "administrator") return true
	return false;
}

// @ts-expect-error TS(7006): Parameter 'rply' implicitly has an 'any' type.
function sendNewstoAll(rply) {
	for (let index = 0; index < rply.target.length; index++) {
		SendToId(rply.target[index].userID, rply.sendNews);
	}
}


function z_stop(mainMsg = "", groupid = "") {
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



/*
bot.command('pipe', (ctx) => ctx.replyWithPhoto({
	url: 'https://picsum.photos/200/300/?random'
}))
*/
