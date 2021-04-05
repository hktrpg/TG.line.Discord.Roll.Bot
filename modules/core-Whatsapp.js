"use strict";
if (!process.env.WHATSAPP_SWITCH) {
	return;
}
if (process.env.BROADCAST) {
	const WebSocket = require('ws');
	const ws = new WebSocket('ws://127.0.0.1:53589');
	ws.on('open', function open() {
		console.log('connected To core-www from Whatsapp!')
		ws.send('connected To core-www from Whatsapp!');
	});
	ws.on('message', function incoming(data) {
		var object = JSON.parse(data);
		if (object.botname == 'Whatsapp') {
			if (!object.message.text) return;
			console.log('connect To core-www from Whatsapp!')
			SendToId(object.message.target.id, object.message.text);
			return;
		}
	});
}
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const joinMessage = "你剛剛添加了HKTRPG 骰子機械人! \
\n主要功能：暗骰, 擲骰, 頻道經驗值, 占卜, TRPG骰子, 先攻表, TRPG角色卡, 搜圖, 翻譯, Discord 聊天紀錄匯出, 數學計算, 做筆記, 隨機抽選, 自定抽選\
\n輸入 1D100 可以進行最簡單的擲骰.\
\n到 (https://hktrpg.github.io/TG.line.Discord.Roll.Bot/) 或輸入 bothelp 觀看詳細使用說明.\
		\n如果你需要幫助, 加入支援頻道.\
		\n(http://bit.ly/HKTRPG_DISCORD)\
		\n有關TRPG資訊, 可以到網站\
		\n(http://www.hktrpg.com/)";

exports.analytics = require('./core-analytics');
const {
	Client
} = require('whatsapp-web.js');
const msgSplitor = (/\S+/ig);
const qrcode = require('qrcode-terminal');
// Path where the session data will be stored
const SESSION_FILE_PATH = './modules/whatsapp-session.json';

// Load the session data if it has been previously saved
let sessionData;
if (require('fs').existsSync(SESSION_FILE_PATH)) {
	sessionData = JSON.parse(require('fs').readFileSync(SESSION_FILE_PATH).toString());
}

const client = new Client({
	session: sessionData,
	puppeteer: {
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	}
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
	sessionData = session;
	require('fs').writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
		if (err) {
			console.error(err);
		}
	});
});


client.on('qr', (qr) => {
	// Generate and scan this code with your phone
	console.log('QR RECEIVED\n', qr);
	qrcode.generate(qr, {
		small: true
	});
});

client.on('ready', () => {
	console.log('Client is ready!');
});
/*
	__proto__:Object {constructor: , __defineGetter__: , __defineSetter__: , …}
	isForwarded:false
	author:undefined
body:"1e"
broadcast:false
from:"85********@c.us"
fromMe:false
hasMedia:false
hasQuotedMsg:false
	location:undefined
	mediaKey:undefined
	mentionedIds:Array(0) []
	timestamp:33333
	to:"852******@c.us"
	type:"chat"
	*/
client.on('message', async msg => {
	if (!msg.body || msg.fromMe || msg.isForwarded) return;
	let displaynamecheck = true;
	let inputStr = msg.body;
	let membercount, groupid, trigger = "";
	await client.getChatById(msg.from).then(async getChatDetail => {
		if (getChatDetail.isGroup) {
			groupid = getChatDetail.id._serialized;
			//console.log('groupid:', groupid)
			membercount = getChatDetail.participants.length - 1;
		}
		return;
	});
	let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	//指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me") {
		displaynamecheck = false;
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
	if (!target) return null;
	var userid, displayname, channelid, channelKeyword = '';
	//得到暗骰的數據, GM的位置
	//是不是自己.ME 訊息
	//TRUE 即正常

	let userrole = 3;
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];

	userid = msg.id.participant || msg.id.remote;
	//console.log('userid:', userid)
	displayname = await client.getContactById(userid).then(a => {
		return a.pushname
	})

	let rplyVal = {};
	if (mainMsg && mainMsg[0])
		trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me") {
		displaynamecheck = false;
	}
	// 訊息來到後, 會自動跳到analytics.js進行骰組分析
	// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

	//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM

	if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
		mainMsg.shift();
		rplyVal = await exports.analytics.parseInput({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			botname: "Whatsapp",
			displayname: displayname,
			channelid: channelid,
			membercount: membercount
		})
	} else {
		if (channelKeyword == '') {
			rplyVal = await exports.analytics.parseInput({
				inputStr: inputStr,
				groupid: groupid,
				userid: userid,
				userrole: userrole,
				botname: "Whatsapp",
				displayname: displayname,
				channelid: channelid,
				membercount: membercount
			})
		}
	}
	//LevelUp功能
	if (groupid && rplyVal && rplyVal.LevelUp) {
		//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
		client.sendMessage(msg.from, "@" + displayname + '\n' + rplyVal.LevelUp);
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
			if (groupid) {
				SendDR(msg, "@" + displayname + '暗骰給自己');
			}
			rplyVal.text = "@" + displayname + "的暗骰\n" + rplyVal.text
			SendToId(userid, rplyVal, client);
			break;
		case privatemsg == 2:
			//輸入ddr(指令) 私訊GM及自己
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				SendDR(msg, "@" + displayname + '暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			SendToId(userid, rplyVal, client);
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (userid != TargetGMTempID[i])
					SendToId(TargetGMTempID[i], rplyVal, client);
			}
			break;
		case privatemsg == 3:
			//輸入dddr(指令) 私訊GM
			if (groupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				SendDR(msg, "@" + displayname + '暗骰進行中 \n目標: ' + targetGMNameTemp);
			}
			rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			for (let i = 0; i < TargetGMTempID.length; i++) {
				SendToId(TargetGMTempID[i], rplyVal, client);
			}
			break;
		default:
			if (displaynamecheck == false) {
				console.log('displaynamecheck False')
				SendToId(msg.from, rplyVal, client);
			} else
				SendToReply(msg, rplyVal);
			break;
	}
	// msg.delete();
})

client.on('message_ack', async (msg, ack) => {
	if (ack > 0) {
		const chat = await msg.getChat();
		chat.clearMessages();
	}
});

client.on('group_join', async (msg) => {
	console.log("Whatsapp joined");
	if (msg.client.info.me._serialized == msg.id.participant)
		await msg.reply(joinMessage);
});

client.initialize();





async function SendDR(msg, text) {
	return msg.reply(text);
}
async function SendToId(targetid, rplyVal, client) {
	for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
			await client.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
		}
	}
}
async function SendToReply(msg, rplyVal) {
	for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
		if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
			await msg.reply(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
		}
	}
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