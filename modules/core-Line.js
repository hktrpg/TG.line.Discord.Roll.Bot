'use strict';
if (!process.env.LINE_CHANNEL_ACCESSTOKEN) {
	return;
}
exports.analytics = require('./analytics');
const EXPUP = require('./level').EXPUP || function () { };
const line = require('@line/bot-sdk');
const express = require('express');
const msgSplitor = (/\S+/ig);
const agenda = require('../modules/schedule');
const rollText = require('./getRoll').rollText;
exports.z_stop = require('../roll/z_stop');
// create LINE SDK config from env variables
const config = {
	channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN,
	channelSecret: process.env.LINE_CHANNEL_SECRET,
};
var TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';
const courtMessage = require('./logs').courtMessage || function () { };
// create LINE SDK client
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const client = new line.Client(config);
const newMessage = require('./message');
// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/', line.middleware(config), (req, res) => {
	Promise
		.all(req.body.events.map(handleEvent))
		.then((result) => res.json(result))
		.catch(() => {
			//	console.error(err);
			res.status(500).end();
		});
});
// event handler
process.on("Line", message => {
	if (!message.text) return;
	SendToId(message.target.id, message.text);
	return;
});

var handleEvent = async function (event) {
	let inputStr = (event.message && event.message.text) ? event.message.text : "";
	let trigger = "";
	let roomorgroupid = event.source.groupId || event.source.roomId || '';
	let mainMsg = (inputStr) ? inputStr.match(msgSplitor) : {}; //定義輸入字串
	if (mainMsg && mainMsg[0]) {
		trigger = mainMsg[0].toString().toLowerCase();
	}
	//指定啟動詞在第一個詞&把大階強制轉成細階
	if (trigger == ".me" && !z_stop(mainMsg, roomorgroupid)) {
		inputStr = inputStr.replace(/^.me\s+/i, '');
		if (roomorgroupid) {
			let temp = HandleMessage(inputStr);
			client.replyMessage(event.replyToken, temp);
		} else {
			SendToId(event.source.userId, inputStr);
		}
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
	if (event.type !== 'message' || event.message.type !== 'text') {
		if (event.type == "join" && roomorgroupid) {
			// 新加入群組時, 傳送MESSAGE
			console.log("Line joined");
			await replyMessagebyReplyToken(event, newMessage.joinMessage());
		}
		await nonDice(event);
		return Promise.resolve(null);
	}
	let target = '';
	if (inputStr) target = await exports.analytics.findRollList(inputStr.match(msgSplitor));
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
		try {
			let profile = await client.getProfile(userid);
			displayname = (profile && profile.displayName) ? profile.displayName : '';
		} catch (error) {
			//
		}


	}


	if (event.source && event.source.groupId) {
		try {
			let gpProfile = await client.getGroupSummary(roomorgroupid);
			titleName = (gpProfile && gpProfile.groupName) ? gpProfile.groupName : '';
		} catch (error) {
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
			//console.log('channelKeyword', rplyVal)
		}

	}

	if (rplyVal.sendNews) sendNewstoAll(rplyVal);
	//LevelUp功能
	if (!rplyVal.text && !rplyVal.LevelUp)
		return;
	if (process.env.mongoURL && rplyVal.text && await newMessage.newUserChecker(userid, "Line")) {
		SendToId(userid, newMessage.firstTimeMessage());
	}


	if (roomorgroupid && rplyVal && rplyVal.LevelUp) {
		//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
		if (displayname) {
			rplyVal.text = rplyVal.LevelUp + '\n' + rplyVal.text;
			//await SendToId(roomorgroupid, "@" + displayname + ' \n' + rplyVal.LevelUp
		} else {
			//await SendToId(roomorgroupid, rplyVal.LevelUp)
			rplyVal.text = rplyVal.LevelUp + '\n' + rplyVal.text;
		}
	}
	//Linecountroll++;
	if (!rplyVal.text) {
		return;
	}
	if (privatemsg > 1 && TargetGM) {
		let groupInfo = await privateMsgFinder(roomorgroupid) || [];
		groupInfo.forEach((item) => {
			TargetGMTempID.push(item.userid);
			TargetGMTempdiyName.push(item.diyName);
			TargetGMTempdisplayname.push(item.displayname);
		})
		//當是私訊模式1-3時
	}

	switch (true) {
		case privatemsg == 1:
			// 輸入dr  (指令) 私訊自己
			if (roomorgroupid && userid)
				if (displayname)
					await replyMessagebyReplyToken(event, "@" + displayname + ' 暗骰給自己');
				else
					await replyMessagebyReplyToken(event, '正在暗骰給自己');
			if (userid)
				if (displayname)
					SendToId(userid, "@" + displayname + '的暗骰\n' + rplyVal.text);
				else
					SendToId(userid, rplyVal.text);
			break;
		case privatemsg == 2:
			//輸入ddr(指令) 私訊GM及自己
			//房間訊息
			if (roomorgroupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
				}
				if (displayname) {
					await replyMessagebyReplyToken(event, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
				} else
					await replyMessagebyReplyToken(event, ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
			}

			//有名字就顯示
			if (displayname) {
				rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
			}
			//傳給自己
			SendToId(userid, rplyVal.text);
			for (let i = 0; i < TargetGMTempID.length; i++) {
				if (userid != TargetGMTempID[i]) {
					SendToId(TargetGMTempID[i], rplyVal.text);
				}
			}
			break;
		case privatemsg == 3:
			//輸入dddr(指令) 私訊GM
			//如在房中
			if (roomorgroupid) {
				let targetGMNameTemp = "";
				for (let i = 0; i < TargetGMTempID.length; i++) {
					targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i])
				}
				if (displayname) {
					await replyMessagebyReplyToken(event, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
				} else {
					await replyMessagebyReplyToken(event, ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
				}
			}
			if (displayname)
				rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
			for (let i = 0; i < TargetGMTempID.length; i++) {
				SendToId(TargetGMTempID[i], rplyVal.text);
			}
			break;
		default:
			if (displayname && rplyVal && rplyVal.type != 'image') {
				//285083923223
				displayname = "@" + displayname;
				displayname += (rplyVal.statue) ? ' ' + rplyVal.statue + '\n' : "\n";
				rplyVal.text = displayname + rplyVal.text;
			}
			//	console.log('rplyVal: ', rplyVal)
			if (roomorgroupid) {
				return await replyMessagebyReplyToken(event, rplyVal);
			} else if (userid) {
				return await replyMessagebyReplyToken(event, rplyVal);
			}
			break;
	}
	return;


	//rplyVal.text



	/**pushMessage
	 * client.pushImage(USER_ID, {
		  originalContentUrl: 'https://example.com/original.jpg',
		  previewImageUrl: 'https://example.com/preview.jpg',
	 });
	 */
	// create a echoing text message
	//await exports.analytics.parseInput(event.message.text)

	// use reply API
	//Reply Max: 2000 characters

}
var replyMessagebyReplyToken = async function (event, Reply) {
	let temp = HandleMessage(Reply);
	return await client.replyMessage(event.replyToken, temp).catch(() => {
		if (temp.type == 'image') {
			let tempB = {
				type: 'text',
				text: temp.originalContentUrl
			};
			client.replyMessage(event.replyToken, tempB);
			//	}
		}
	});
}
function HandleMessage(message) {
	let temp = [];
	switch (true) {
		case message.type == 'text' && message.text != '':
			for (let i = 0; i < message.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
				if (i == 0 || i == 1 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 1)
					temp.push({
						type: 'text',
						text: message.text.toString().match(/[\s\S]{1,2000}/g)[i]
					})
			}
			return temp;
		case message.type == 'image' && message.text != '':
			return {
				"type": "image",
				"originalContentUrl": message.text.replace('http://', 'https://'),
				"previewImageUrl": message.text.replace('http://', 'https://')
			};

		case typeof message == 'string' || message instanceof String:
			for (let i = 0; i < message.toString().match(/[\s\S]{1,2000}/g).length; i++) {
				if (i == 0 || i == 1 || i == message.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == message.toString().match(/[\s\S]{1,2000}/g).length - 1)
					temp.push({
						type: 'text',
						text: message.toString().match(/[\s\S]{1,2000}/g)[i]
					});
			}
			return temp;
		case message.text != '':
			for (let i = 0; i < message.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
				if (i == 0 || i == 1 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == message.text.toString().match(/[\s\S]{1,2000}/g).length - 1)
					temp.push({
						type: 'text',
						text: message.text.toString().match(/[\s\S]{1,2000}/g)[i]
					})
			}
			return temp;
		default:
			break;
	}
}
// listen on port
/*	app.listen(port, () => {
		console.log(`Line BOT listening on ${port}`);
	});

	app.get('/aa', function (req, res) {
		//	res.send(parseInput(req.query.input));
		res.send('Hello');
	});
*/

async function sendNewstoAll(rply) {
	for (let index = 0; index < rply.target.length; index++) {
		SendToId(rply.target[index].userID, rply.sendNews);
	}
}
if (agenda && agenda.agenda) {
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
		} catch (e) {
			console.error("LINE: Error removing job from collection:scheduleAtMessageLine", e);
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
			if ((new Date(Date.now()) - data.createAt) >= 30 * 24 * 60 * 60 * 1000 * 6) {
				await job.remove();
				SendToId(
					data.groupid, "已運行六個月, 移除此定時訊息"
				)
			}
		} catch (e) {
			console.error("Line Error removing job from collection:scheduleCronMessageLine", e);
		}
	});
}


app.on('UnhandledPromiseRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.error('UnhandledPromiseRejection: ', error.message);
});
app.on('unhandledRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.error('unhandledRejection: ', error.message);
});
function SendToId(targetid, Reply) {
	let temp = HandleMessage(Reply);
	//console.log('SendToId: ', temp)
	return client.pushMessage(targetid, temp);
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
async function nonDice(event) {
	await courtMessage({ result: "", botname: "Line", inputStr: "" })
	let roomorgroupid = event.source.groupId || event.source.roomId || '',
		userid = event.source.userId || '',
		displayname = '';
	if (!roomorgroupid || !userid) return;
	let profile = await client.getProfile(userid);

	//	在GP 而有加好友的話,得到名字
	if (profile && profile.displayName) {
		displayname = profile.displayName;
	}
	//console.log(displayname)
	let LevelUp = await EXPUP(roomorgroupid, userid, displayname, "", null);
	if (roomorgroupid && LevelUp && LevelUp.text) {
		return await replyMessagebyReplyToken(event, LevelUp.text);
	}
	//如果對方沒加朋友,會出現 UnhandledPromiseRejectionWarning, 就跳到這裡

	return null;
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

module.exports = {
	app,
	express
};