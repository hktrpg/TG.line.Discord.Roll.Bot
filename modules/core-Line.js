'use strict';
if (!process.env.LINE_CHANNEL_ACCESSTOKEN) {
	return;
}
exports.analytics = require('./core-analytics');
const EXPUP = require('./level').EXPUP || function () {};
const line = require('@line/bot-sdk');
const express = require('express');
// create LINE SDK config from env variables
const config = {
	channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN,
	channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const courtMessage = require('./logs').courtMessage || function () {};
// create LINE SDK client
const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/', line.middleware(config), (req, res) => {
	Promise
		.all(req.body.events.map(handleEvent))
		.then((result) => res.json(result))
		.catch((err) => {
			console.error(err);
			res.status(500).end();
		});
});
// event handler
const joinMessage = "你剛剛添加了HKTRPG 骰子機械人! \
						\n輸入 1D100 可以進行最簡單的擲骰.\
						\n輸入 Bothelp 觀看詳細使用說明.\
						\n如果你需要幫助, 加入支援頻道.\
						\n(http://bit.ly/HKTRPG_DISCORD)\
						\n有關TRPG資訊, 可以到網站\
						\n(http://www.hktrpg.com/)\
						\n\n骰子機械人意見調查問卷\
						\n引言: 我是HKTRPG骰子機械人的製作者，這份問卷的目的，是蒐集對骰子機械人的意見及HKTRPG的滿意度，改進使用體驗。\
						\n另外, 最近因為資料庫開始爆滿，所以對關鍵字功能進行限制，每個GP 30個上限，\
						\n如果完成問卷,可以提升上限半年WW\
						\nhttps://forms.gle/JnHdGs4oRMd9SQhM6";


var handleEvent = async function (event) {
	//event {"type":"message","replyToken":"232132133","source":{"userId":"U1a17e51fSDADASD0293d","groupId":"C6432427423847234cd3","type":"group"},"timestamp":323232323,"message":{"type":"text","id":"232131233123","text":"5!@@!"}}
	let roomorgroupid, userid, displayname, channelid, membercount = '';
	if (event.source.groupId) {
		roomorgroupid = event.source.groupId;
	}
	if (event.source.roomId) {
		roomorgroupid = event.source.roomId;
	}
	if (event.source.userId) {
		userid = event.source.userId;
	}
	let TargetGM = (process.env.mongoURL) ? require('../roll/z_DDR_darkRollingToGM').initialize() : '';

	client.getProfile(userid).then(async function (profile) {
			//	在GP 而有加好友的話,得到名字
			displayname = profile.displayName;
			//console.log(displayname)
			await AfterCheckName();
		},
		async function () {
			await AfterCheckName();
			//如果對方沒加朋友,會出現 UnhandledPromiseRejectionWarning, 就跳到這裡
		})

	async function AfterCheckName() {
		let displaynamecheck = true;
		let userrole = 3;
		if (event.type !== 'message' || event.message.type !== 'text') {
			if (event.type == "join" && roomorgroupid) {
				// 新加入群組時, 傳送MESSAGE
				console.log("Line joined");
				await replyMessagebyReplyToken(roomorgroupid, joinMessage);
			} else
				// ignore non-text-message event
				if (roomorgroupid && userid) {
					await EXPUP(roomorgroupid, userid, displayname, "", membercount);
					await courtMessage("", "Line", "")
				}
			return Promise.resolve(null);
		}
		//是不是自己.ME 訊息
		//TRUE 即正常
		let rplyVal = {};
		let msgSplitor = (/\S+/ig);
		let trigger = "";
		if (event.message.text)
			var mainMsg = event.message.text.match(msgSplitor); // 定義輸入字串
		if (mainMsg && mainMsg[0])
			trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

		// 訊息來到後, 會自動跳到analytics.js進行骰組分析
		// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
		if (trigger == ".me") {
			displaynamecheck = false;
		}

		let privatemsg = 0;
		//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
		if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
			privatemsg = 1;
			event.message.text = event.message.text.replace(/^[d][r][ ]/i, '');
		}
		if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
			//設定私訊的模式2
			privatemsg = 2;
			event.message.text = event.message.text.replace(/^[d][d][r][ ]/i, '');
		}
		if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
			privatemsg = 3;
			event.message.text = event.message.text.replace(/^[d][d][d][r][ ]/i, '');
		}

		if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
			//mainMsg.shift()
			rplyVal = await exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole, "Line", displayname, channelid, "");
		} else {
			if (channelKeyword == '') {
				rplyVal = await exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole, "Line", displayname, channelid, "");
				//console.log('channelKeyword', rplyVal)
			}

		}
		//LevelUp功能
		if (!rplyVal.text && !rplyVal.LevelUp)
			return;


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
		if (privatemsg >= 1) {
			//當是私訊模式1-3時
			var TargetGMTempID = [];
			var TargetGMTempdiyName = [];
			var TargetGMTempdisplayname = [];
			if (TargetGM && TargetGM.trpgDarkRollingfunction && roomorgroupid) {
				for (var i = 0; i < TargetGM.trpgDarkRollingfunction.length; i++) {
					if (TargetGM.trpgDarkRollingfunction[i].groupid == roomorgroupid) {
						for (var a = 0; a < TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
							//checkifsamename = 1
							TargetGMTempID[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid
							TargetGMTempdiyName[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName
							TargetGMTempdisplayname[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname
							//TargetGMTemp[a]. channelid displayname diyName userid

						}
					}
				}
			}
		}

		switch (true) {
			case privatemsg == 1:
				// 輸入dr  (指令) 私訊自己
				if (roomorgroupid && userid && displaynamecheck)
					if (displayname)
						await replyMessagebyReplyToken(roomorgroupid, "@" + displayname + ' 暗骰給自己');
					else
						await replyMessagebyReplyToken(roomorgroupid, '正在暗骰給自己');
				if (userid)
					if (displayname && displaynamecheck)
						await SendToId(userid, "@" + displayname + '的暗骰\n' + rplyVal.text);
					else
						await SendToId(userid, rplyVal.text);
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
						await replyMessagebyReplyToken(roomorgroupid, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
					} else
						await replyMessagebyReplyToken(roomorgroupid, ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
				}

				//有名字就顯示
				if (displayname) {
					rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
				}
				//傳給自己
				await SendToId(userid, rplyVal.text);
				for (let i = 0; i < TargetGMTempID.length; i++) {
					if (userid != TargetGMTempID[i]) {
						await SendToId(TargetGMTempID[i], rplyVal.text);
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
						await replyMessagebyReplyToken(roomorgroupid, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
					} else {
						await replyMessagebyReplyToken(roomorgroupid, ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
					}
				}
				if (displayname)
					rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
				for (let i = 0; i < TargetGMTempID.length; i++) {
					await SendToId(TargetGMTempID[i], rplyVal.text);
				}
				break;
			default:
				if (displaynamecheck && displayname && rplyVal && rplyVal.type != 'image') {
					//285083923223
					displayname = "@" + displayname + "\n";
					rplyVal.text = displayname + rplyVal.text;
				}
				//	console.log('rplyVal: ', rplyVal)
				if (roomorgroupid) {
					return await replyMessagebyReplyToken(roomorgroupid, rplyVal);
				} else if (userid) {
					return await replyMessagebyReplyToken(userid, rplyVal);
				}
				break;
		}
		return;


		//rplyVal.text
		async function SendToId(targetid, Reply) {
			let temp = await HandleMessage(Reply);
			//console.log('SendToId: ', temp)
			return await client.pushMessage(targetid, temp);
		}
		async function replyMessagebyReplyToken(targetid, Reply) {
			let temp = await HandleMessage(Reply);
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
		async function HandleMessage(message) {
			let temp = [];
			switch (true) {
				case message.type == 'text' && message.text != '':
					for (var i = 0; i < message.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
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
app.on('UnhandledPromiseRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.log('UnhandledPromiseRejection: ', error.message);
});
app.on('unhandledRejection', error => {
	// Will print "unhandledRejection err is not defined"
	console.log('unhandledRejection: ', error.message);
});
module.exports = {
	app,
	express
};




/*
	return {
	type: 'text',
	text: message
}


console.log(Reply)
let messages = [{
	"type": "text",
	"text": "Hello, user001"
},
{
	"type": "text",
	"text": "May I help you?002"
}
]
client.replyMessage(event.replyToken, messages)
client.pushMessage(targetid, {
	type: 'text',
	text: 'hello, world003',
})
client.pushMessage(targetid, {
	"type": "image",
	"originalContentUrl": "https://developers.line.biz/assets/images/common/logo-black.png",
	"previewImageUrl": "https://developers.line.biz/assets/images/common/logo-black.png"
})
*/