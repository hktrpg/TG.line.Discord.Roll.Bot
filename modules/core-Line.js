'use strict';
if (!process.env.LINE_CHANNEL_ACCESSTOKEN || !process.env.LINE_CHANNEL_SECRET) {
	return;
}
const port = process.env.LINEPORT || 20_831;
const fs = require('fs');
const line = require('@line/bot-sdk');
const candle = require('../modules/candleDays.js');
const mainLine = Boolean(process.env.DISCORD_CHANNEL_SECRET);
const lineAgenda = Boolean(process.env.LINE_AGENDA)
exports.analytics = require('./analytics');
const EXPUP = require('./level').EXPUP || function () {};

const MESSAGE_SPLITOR = (/\S+/ig);
const SIX_MONTH = 30 * 24 * 60 * 60 * 1000 * 6;
const agenda = require('../modules/schedule');
const rollText = require('./getRoll').rollText;
// create LINE SDK config from env variables
const config = {
	channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN,
	channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const courtMessage = require('./logs').courtMessage || function () {};
// create LINE SDK client
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const client = new line.Client(config);
const newMessage = require('./message');

// Helper function to get user profile based on context
async function getUserProfile(event, userid) {
	try {
		let profile;
		if (event.source.groupId) {
			profile = await client.getGroupMemberProfile(event.source.groupId, userid);
		} else if (event.source.roomId) {
			profile = await client.getRoomMemberProfile(event.source.roomId, userid);
		} else {
			profile = await client.getProfile(userid);
		}
		return profile;
	} catch (error) {
		if (error.statusCode === 404) {
			console.error(`LINE getProfile error: User profile not accessible (${userid})`);
		} else {
			console.error('LINE getProfile error:', error.message);
		}
		return null;
	}
}
// create Express app
// about Express itself: https://expressjs.com/
const app = require('./core-www.js').app;

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/', (req, res, next) => {
	try {
		line.middleware(config)(req, res, next);
	} catch (error) {
		// Handle signature verification errors gracefully
		if (error.message === 'no signature' || error.message.includes('signature')) {
			console.error('LINE webhook signature verification failed');
			return res.status(401).json({ error: 'Invalid signature' });
		}
		next(error);
	}
}, async (req, res) => {
	try {
		const result = await Promise.all(req.body.events.map(handleEvent));
		res.json(result);
	} catch (error) {
		console.error('LINE event processing error:', error.message);
		res.status(500).end();
	}
});

// Global error handler for this module
app.use((error, req, res) => {
	console.error('Unhandled error in LINE webhook:', error.message);
	res.status(500).json({ error: 'Internal server error' });
});
// event handler
process.on("Line", message => {
	if (!message.text || !mainLine) return;
	SendToId(message.target.id, message.text);
	return;
});

let handleEvent = async function (event) {
	try {
		let inputStr = (event.message && event.message.text) ? event.message.text : "";

		let trigger = "";
		let roomorgroupid = event.source.groupId || event.source.roomId || '';
		let mainMsg = (inputStr) ? inputStr.match(MESSAGE_SPLITOR) : {}; //定義輸入字串
		if (mainMsg && mainMsg[0]) {
			trigger = mainMsg[0].toString().toLowerCase();
		}
		//指定啟動詞在第一個詞&把大階強制轉成細階
		let privatemsg = 0;

	(function privateMsg() {
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
	})();
	if (event.type !== 'message' || event.message.type !== 'text') {
		if (event.type == "join" && roomorgroupid) {
			// 新加入群組時, 傳送MESSAGE
			console.log("Line joined");
			replyMessagebyReplyToken(event, newMessage.joinMessage());
		}
		await nonDice(event);
		return null;
	}
	let target = '';
	if (inputStr) target = await exports.analytics.findRollList(inputStr.match(MESSAGE_SPLITOR));
	if (!target) {
		await nonDice(event);
		return null;
	}
	let userid = event.source.userId || '',
		displayname = '',
		titleName = '';
	let TargetGMTempID = [];
	let TargetGMTempdiyName = [];
	let TargetGMTempdisplayname = [];
	if (userid) {
		const profile = await getUserProfile(event, userid);
		displayname = (profile && profile.displayName) ? profile.displayName : '';
	}

	if (event.source && event.source.groupId) {
		try {
			let gpProfile = await client.getGroupSummary(roomorgroupid);
			titleName = (gpProfile && gpProfile.groupName) ? gpProfile.groupName : '';
		} catch {
			//
		}
	}

	let rplyVal = {};
	if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
		//mainMsg.shift()
		rplyVal = await exports.analytics.parseInput({
			inputStr: inputStr,
			groupid: roomorgroupid,
			userid: userid,
			userrole: 3,
			botname: "Line",
			displayname: displayname,
			titleName: titleName
		})
	} else {
		if (channelKeyword == '') {
			rplyVal = await exports.analytics.parseInput({
				inputStr: inputStr,
				groupid: roomorgroupid,
				userid: userid,
				userrole: 3,
				botname: "Line",
				displayname: displayname,
				titleName: titleName
			});
		}
	}

	if (rplyVal.sendNews) sendNewstoAll(rplyVal);
	//LevelUp功能
	if (rplyVal.myspeck) {
		return await __sendMeMessage({ event, rplyVal, roomorgroupid });
	}
	if (!rplyVal.text && !rplyVal.LevelUp)
		return;
	if (process.env.mongoURL && rplyVal.text && await newMessage.newUserChecker(userid, "Line")) {
		SendToId(userid, newMessage.firstTimeMessage());
	}

	if (roomorgroupid && rplyVal && rplyVal.LevelUp) {
		rplyVal.text = displayname ? rplyVal.LevelUp + '\n' + rplyVal.text : rplyVal.LevelUp + '\n' + rplyVal.text;
	}

	//Linecountroll++;
	if (!rplyVal.text) {
		return;
	}
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = await privateMsgFinder(roomorgroupid) || [];
		for (const item of groupInfo) {
			TargetGMTempID.push(item.userid);
			TargetGMTempdiyName.push(item.diyName);
			TargetGMTempdisplayname.push(item.displayname);
		}
		//當是私訊模式1-3時
	}


	switch (true) {
		case privatemsg == 1: {
			// 輸入dr  (指令) 私訊自己
			if (roomorgroupid && userid)
				if (displayname)
					replyMessagebyReplyToken(event, "@" + displayname + ' 暗骰給自己');
				else
					replyMessagebyReplyToken(event, '正在暗骰給自己');
			if (userid)
				if (displayname)
					SendToId(userid, "@" + displayname + '的暗骰\n' + rplyVal.text);
				else
					SendToId(userid, rplyVal.text);
			break;
		}
		case privatemsg == 2: {
			//輸入ddr(指令) 私訊GM及自己
			//房間訊息
			if (roomorgroupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				if (displayname) {
					replyMessagebyReplyToken(event, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
				} else
					replyMessagebyReplyToken(event, ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}

			//有名字就顯示
			if (displayname) {
				rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			}
			//傳給自己
			SendToId(userid, rplyVal.text);
			for (const element of TargetGMTempID) {
				if (userid != element) {
					SendToId(element, rplyVal.text);
				}
			}
			break;
		}
		case privatemsg == 3: {
			//輸入dddr(指令) 私訊GM
			//如在房中
			if (roomorgroupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i])
				}
				if (displayname) {
					replyMessagebyReplyToken(event, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
				} else {
					replyMessagebyReplyToken(event, ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
				}
			}
			if (displayname)
				rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
			for (const element of TargetGMTempID) {
				SendToId(element, rplyVal.text);
			}
			break;
		}
		default: {
			if (displayname && rplyVal && rplyVal.type != 'image') {
				//285083923223
				displayname = "@" + displayname;
				displayname += (candle.checker(userid)) ? ' ' + candle.checker(userid) : '';
				displayname += (rplyVal.statue) ? ' ' + rplyVal.statue + '\n' : "\n";
				rplyVal.text = displayname + rplyVal.text;
			}
			if (roomorgroupid) {
				return replyMessagebyReplyToken(event, rplyVal);
			} else if (userid) {
				return replyMessagebyReplyToken(event, rplyVal);
			}
			break;
		}
	}
	return;
	} catch (error) {
		console.error('LINE handleEvent error:', error.message);
		// Don't re-throw the error to prevent it from bubbling up to Promise.all
	}
}

async function __sendMeMessage({ event, rplyVal, roomorgroupid }) {
	if (roomorgroupid) {
		let temp = HandleMessage(rplyVal.myspeck.content);
		await client.replyMessage(event.replyToken, temp).catch((error) => {
			console.error('#60 line err', error.statusCode);
		});
	} else {
		SendToId(event.source.userId, rplyVal.myspeck.content);
	}
	return;
}

let replyMessagebyReplyToken = function (event, Reply) {
	let temp = HandleMessage(Reply);
	return client.replyMessage(event.replyToken, temp).catch((error) => {
		// Handle reply message errors
		const statusCode = error.statusCode;
		if (statusCode === 404) {
			console.error('LINE replyMessage 404: Invalid reply token or user blocked bot');
		} else if (statusCode === 400) {
			console.error('LINE replyMessage 400: Invalid message format');
		} else {
			console.error(`LINE replyMessage error (${statusCode})`);
		}

		// Fallback for image messages
		if (temp.type === 'image') {
			const tempB = {
				type: 'text',
				text: temp.originalContentUrl
			};
			client.replyMessage(event.replyToken, tempB).catch((fallbackError) => {
				console.error(`LINE replyMessage fallback error (${fallbackError.statusCode})`);
			});
		}
	});
}

function HandleMessage(message) {
	let temp = [];
	switch (true) {
		case message.type == 'text' && message.text != '': {
			for (let i = 0; i < message.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
				if (i == 0 || i == 1 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 1)
					temp.push({
						type: 'text',
						text: message.text.toString().match(/[\s\S]{1,2000}/g)[i]
					})
			}
			return temp;
		}
		case message.type == 'image' && message.text != '': {
			return {
				"type": "image",
				"originalContentUrl": message.text.replace('http://', 'https://'),
				"previewImageUrl": message.text.replace('http://', 'https://')
			};
		}

		case typeof message == 'string': {
			for (let i = 0; i < message.toString().match(/[\s\S]{1,2000}/g).length; i++) {
				if (i == 0 || i == 1 || i == message.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == message.toString().match(/[\s\S]{1,2000}/g).length - 1)
					temp.push({
						type: 'text',
						text: message.toString().match(/[\s\S]{1,2000}/g)[i]
					});
			}
			return temp;
		}
		case message.text != '': {
			for (let i = 0; i < message.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
				if (i == 0 || i == 1 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 1)
					temp.push({
						type: 'text',
						text: message.text.toString().match(/[\s\S]{1,2000}/g)[i]
					})
			}
			return temp;
		}
		default: {
			break;
		}
	}
}
// listen on port
const privateKey = (process.env.KEY_PRIKEY) ? process.env.KEY_PRIKEY : null;
const certificate = (process.env.KEY_CERT) ? process.env.KEY_CERT : null;
const ca = (process.env.KEY_CA) ? process.env.KEY_CA : null;
let options = {};
async function read() {
	if (!privateKey) return;
	try {
		options = {
			key: (fs.readFileSync(privateKey)) ? fs.readFileSync(privateKey) : null,
			cert: (fs.readFileSync(certificate)) ? fs.readFileSync(certificate) : null,
			ca: (fs.readFileSync(ca)) ? fs.readFileSync(ca) : null
		};
	} catch (error) {
		console.error('[error of key]:', error)
	}
}

(async () => {
	await read()
})();
require('https').createServer(options, app).listen(port, () => {
	console.log(`Line BOT listening on ${port}`);
});





async function sendNewstoAll(rply) {
	for (let index = 0; index < rply.target.length; index++) {
		SendToId(rply.target[index].userID, rply.sendNews);
	}
}
if (agenda && agenda.agenda && lineAgenda) {
	agenda.agenda.define("scheduleAtMessageLine", async (job) => {
		//指定時間一次	
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		//SendToReply(ctx, text)
		SendToId(
			data.groupid, text
		)
		try {
			await job.remove();
		} catch (error) {
			console.error("LINE: Error removing job from collection:scheduleAtMessageLine", error);
		}
	});

	agenda.agenda.define("scheduleCronMessageLine", async (job) => {
		//指定時間一次	
		let data = job.attrs.data;
		let text = await rollText(data.replyText);
		//SendToReply(ctx, text)
		SendToId(
			data.groupid, text
		)
		try {
			if ((new Date(Date.now()) - data.createAt) >= SIX_MONTH) {
				await job.remove();
				SendToId(
					data.groupid, "已運行六個月, 移除此定時訊息"
				)
			}
		} catch (error) {
			console.error("Line Error removing job from collection:scheduleCronMessageLine", error);
		}
	});
}


app.on('UnhandledPromiseRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.error('Line UnhandledPromiseRejection:', error.message);
});
app.on('unhandledRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.error('Line unhandledRejection:', error.message);
});
function SendToId(targetid, Reply) {
	const temp = HandleMessage(Reply);
	client.pushMessage(targetid, temp).catch((error) => {
		const statusCode = error.statusCode;
		if (statusCode === 429) return; // Rate limit, ignore

		if (statusCode === 404) {
			console.error(`LINE pushMessage 404: User not found or blocked bot (${targetid})`);
		} else if (statusCode === 400) {
			console.error('LINE pushMessage 400: Invalid message format');
		} else {
			console.error(`LINE pushMessage error (${statusCode}): ${targetid}`);
		}
	});
}
async function privateMsgFinder(channelid) {
	if (!TargetGM || !TargetGM.trpgDarkRollingfunction) return;
	let groupInfo = TargetGM.trpgDarkRollingfunction.find(data =>
		data.groupid == channelid
	)
	return groupInfo && groupInfo.trpgDarkRollingfunction ? groupInfo.trpgDarkRollingfunction : [];
}
async function nonDice(event) {
	try {
		await courtMessage({ result: "", botname: "Line", inputStr: "" });
		const roomorgroupid = event.source.groupId || event.source.roomId || '';
		const userid = event.source.userId || '';
		if (!roomorgroupid || !userid) return;

		const profile = await getUserProfile(event, userid);
		const displayname = (profile && profile.displayName) ? profile.displayName : '';

		const LevelUp = await EXPUP(roomorgroupid, userid, displayname, "", null);
		if (roomorgroupid && LevelUp && LevelUp.text) {
			replyMessagebyReplyToken(event, LevelUp.text);
		}
	} catch (error) {
		console.error('LINE nonDice processing error:', error.message);
	}
	return null;
}

