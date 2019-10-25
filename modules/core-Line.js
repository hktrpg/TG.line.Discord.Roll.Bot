'use strict';
if (process.env.LINE_CHANNEL_ACCESSTOKEN) {
	//	var channelSecret = process.env.LINE_CHANNEL_SECRET;
	// Load `*.js` under modules directory as properties
	//  i.e., `User.js` will become `exports['User']` or `exports.User`
	require('fs').readdirSync('./modules/').forEach(function (file) {
		if (file.match(/\.js$/) !== null && file !== 'index.js' && file.match(/^core-/) == null) {
			var name = file.replace('.js', '');
			exports[name] = require('../modules/' + file);
		}
	});
	var Linecountroll = 0;
	var Linecounttext = 0;
	const line = require('@line/bot-sdk');
	const express = require('express');

	function replymessage(message) {
		return {
			type: 'text',
			text: message
		}
	};
	//event.source.userId
	//event.source.groupId
	/*
	client.pushMessage('<to>', message)
		.then(() => {

		})
		.catch((err) => {
			// error handling
		});

	*/
	const BootTime = new Date(new Date().toLocaleString("en-US", {
		timeZone: "Asia/Shanghai"
	}));


	// create LINE SDK config from env variables
	const config = {
		channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN,
		channelSecret: process.env.LINE_CHANNEL_SECRET,
	};

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


	function handleEvent(event) {
		let roomorgroupid, userid, displayname, channelid = ''
		if (event.source.groupId) roomorgroupid = event.source.groupId
		if (event.source.roomId) roomorgroupid = event.source.roomId
		if (event.source.userId) userid = event.source.userId
		let TargetGM = require('../roll/z_DDR_darkRollingToGM').initialize()

		client.getProfile(userid).then(function (profile) {
			//	在GP 而有加好友的話,得到名字
			displayname = profile.displayName;
			AfterCheckName();
		}, function () {
			AfterCheckName();
			//如果對方沒加朋友,會出現 UnhandledPromiseRejectionWarning, 就跳到這裡
		})

		function AfterCheckName() {
			if (event.type !== 'message' || event.message.type !== 'text') {
				// ignore non-text-message event
				return Promise.resolve(null);
			}
			//是不是自己.ME 訊息
			//TRUE 即正常
			let displaynamecheck = true;
			let userrole = 2;

			//Ub23daads22a2131312334645349a3 
			let rplyVal = {};
			let msgSplitor = (/\S+/ig)
			if (event.message.text)
				var mainMsg = event.message.text.match(msgSplitor); // 定義輸入字串
			if (mainMsg && mainMsg[0])
				var trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

			// 訊息來到後, 會自動跳到analytics.js進行骰組分析
			// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
			if (trigger == ".me") {
				displaynamecheck = false
			}

			let privatemsg = 0
			//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
			if (trigger.match(/^dr/i) && mainMsg && mainMsg[1]) {
				privatemsg = 1
				event.message.text = event.message.text.replace(/^[d][r][ ]/i, '')
			}
			if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
				//設定私訊的模式2
				privatemsg = 2
				event.message.text = event.message.text.replace(/^[d][d][r][ ]/i, '')
			}
			if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 3
				event.message.text = event.message.text.replace(/^[d][d][d][r][ ]/i, '')
			}

			if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
				//mainMsg.shift()
				rplyVal = exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole, "Line", displayname, channelid)
			} else {
				if (channelKeyword == '') {
					rplyVal = exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole, "Line", displayname, channelid)

				}

			}
			//LevelUp功能
			if (roomorgroupid && rplyVal && rplyVal.LevelUp) {
				console.log('result.LevelUp 2:', rplyVal.LevelUp)
				if (displayname)
					SendToId(roomorgroupid, "@" + displayname + ' \n' + rplyVal.LevelUp)
				else
					SendToId(roomorgroupid, rplyVal.LevelUp)
			}

			if (rplyVal && rplyVal.text) {
				Linecountroll++;
				if (privatemsg >= 1) {
					//當是私訊模式1-3時
					var TargetGMTempID = []
					var TargetGMTempdiyName = []
					var TargetGMTempdisplayname = []
					if (TargetGM && TargetGM.trpgDarkRollingfunction && roomorgroupid)
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

				switch (true) {
					case privatemsg == 1:
						// 輸入dr  (指令) 私訊自己
						//
						if (roomorgroupid && userid && displaynamecheck)
							if (displayname)
								SendToId(roomorgroupid, "@" + displayname + ' 暗骰給自己')
							else
								SendToId(roomorgroupid, '正在暗骰給自己')
						if (userid)
							if (displayname && displaynamecheck)
								SendToId(userid, "@" + displayname + '的暗骰\n' + rplyVal.text);
							else
								SendToId(userid, rplyVal.text);

						break;
					case privatemsg == 2:
						//輸入ddr(指令) 私訊GM及自己
						//房間訊息
						if (roomorgroupid) {
							let targetGMNameTemp = "";
							for (var i = 0; i < TargetGMTempID.length; i++)
								targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i])
							if (displayname)
								SendToId(roomorgroupid, "@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp)
							else
								SendToId(roomorgroupid, ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp)
						}

						//有名字就顯示
						if (displayname)
							rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
						//傳給自己
						SendToId(userid, rplyVal.text);
						for (var i = 0; i < TargetGMTempID.length; i++) {
							if (userid != TargetGMTempID[i])
								SendToId(TargetGMTempID[i], rplyVal.text);
						}
						break;
					case privatemsg == 3:
						//輸入dddr(指令) 私訊GM
						//如在房中
						if (roomorgroupid) {
							let targetGMNameTemp = "";
							for (var i = 0; i < TargetGMTempID.length; i++)
								targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i])
							if (displayname)
								SendToId(roomorgroupid, "@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
							else
								SendToId(roomorgroupid, ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
						}
						if (displayname)
							rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
						for (var i = 0; i < TargetGMTempID.length; i++) {
							SendToId(TargetGMTempID[i], rplyVal.text);
						}
						break;
					default:
						if (displaynamecheck && displayname) {
							//285083923223
							displayname = "@" + displayname + "\n";
							rplyVal.text = displayname + rplyVal.text
						}
						//console.log(privatemsg)
						if (roomorgroupid)
							SendToId(roomorgroupid, rplyVal.text);
						else if (userid)
							SendToId(userid, rplyVal.text);
						break;
				}
			} else {
				Linecounttext++;
				if (Linecounttext % 500 == 0)
					console.log('Line Roll: ' + Linecountroll + ', Line Text: ' + Linecounttext);
			}
			//rplyVal.text
			async function SendToId(targetid, ReplyText) {
				for (var i = 0; i < ReplyText.toString().match(/[\s\S]{1,1900}/g).length; i++) {
					if (i == 0 || i == 1 || i == ReplyText.toString().match(/[\s\S]{1,1900}/g).length - 1 || i == ReplyText.toString().match(/[\s\S]{1,1900}/g).length - 2)
						await client.pushMessage(targetid, replymessage(ReplyText.toString().match(/[\s\S]{1,1900}/g)[i]))
							.then(() => { })
							.catch((err) => {
								// error handling
							});
				}
			}
			// create a echoing text message
			//exports.analytics.parseInput(event.message.text)

			// use reply API
			//Reply Max: 1900 characters
		}
	}
	// listen on port
	const port = process.env.PORT || 5000;
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
	}

}