"use strict";
if (process.env.WHATSAPP_SWITCH) {
	const {
		Random,
		nodeCrypto
	} = require("random-js");
	const random = new Random(nodeCrypto);
	const joinMessage = "你剛剛添加了HKTRPG 骰子機械人! \
		\n輸入 1D100 可以進行最簡單的擲骰.\
		\n輸入 Bothelp 觀看詳細使用說明.\
		\n如果你需要幫助, 加入支援頻道.\
		\n(http://bit.ly/HKTRPG_DISCORD)\
		\n有關TRPG資訊, 可以到網站\
		\n(http://www.hktrpg.com/)";

	function timer(ms) {
		return new Promise(res => setTimeout(res, ms));
	}
	exports.analytics = require('./analytics');
	const {
		Client
	} = require('whatsapp-web.js');
	const client = new Client({
		puppeteer: {
			args: ['--no-sandbox']
		}
	});

	client.on('qr', (qr) => {
		// Generate and scan this code with your phone
		console.log('QR RECEIVED', qr);
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
		if (msg.body && !msg.fromMe && !msg.isForwarded) {
			let CAPTCHA = random.string(20);
			var groupid, userid, displayname, channelid, membercount, channelKeyword = '';
			//得到暗骰的數據, GM的位置
			let TargetGM = require('../roll/z_DDR_darkRollingToGM').initialize();
			//是不是自己.ME 訊息
			//TRUE 即正常
			let displaynamecheck = true;
			let userrole = 3;
			//console.log('TG: ', message)
			//console.log('ctx.chat.id', ctx.chat.id)
			//頻道人數
			//	if (ctx.chat && ctx.chat.id)
			//		membercount = await ctx.getChatMembersCount(ctx.chat.id);

			userid = msg.id.participant || msg.id.remote;
			//console.log('userid:', userid)
			displayname = await client.getContactById(userid).then(a => {
				return a.pushname
			})
			await client.getChatById(msg.from).then(async getChatDetail => {
				if (getChatDetail.isGroup) {
					groupid = getChatDetail.id._serialized;
					//console.log('groupid:', groupid)
					membercount = getChatDetail.participants.length - 1;
				}
			});
			let rplyVal = {};
			let msgSplitor = (/\S+/ig);
			let trigger = "";
			var mainMsg = msg.body.match(msgSplitor); // 定義輸入字串
			if (mainMsg && mainMsg[0])
				trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階
			if (trigger == ".me") {
				displaynamecheck = false;
			}
			// 訊息來到後, 會自動跳到analytics.js進行骰組分析
			// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

			let privatemsg = 0
			//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
			if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 1;
				msg.body = msg.body.replace(/^[d][r][ ]/i, '');
			}
			if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 2;
				msg.body = msg.body.replace(/^[d][d][r][ ]/i, '');
			}
			if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 3;
				msg.body = msg.body.replace(/^[d][d][d][r][ ]/i, '');
			}
			if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
				mainMsg.shift();
				rplyVal = await exports.analytics.parseInput(msg.body, groupid, userid, userrole, "Whatsapp", displayname, channelid, "", membercount);
			} else {
				if (channelKeyword == '') {
					rplyVal = await exports.analytics.parseInput(msg.body, groupid, userid, userrole, "Whatsapp", displayname, channelid, "", membercount, CAPTCHA);
				}
			}
			//LevelUp功能

			if (CAPTCHA != rplyVal.CAPTCHA) {
				console.log('Whatsapp CAPTCHA false', CAPTCHA, ' &&', rplyVal.CAPTCHA, 'text: ', msg.body, 'rplyVal: ', rplyVal);
				return;
			}
			if (groupid && rplyVal && rplyVal.LevelUp) {
				//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
				await client.sendMessage(msg.from, "@" + displayname + '\n' + rplyVal.LevelUp);
			}
			if (!rplyVal.text) {
				return;
			}
			//TGcountroll++;
			if (privatemsg >= 1) {
				//當是私訊模式1-3時
				var TargetGMTempID = [];
				var TargetGMTempdiyName = [];
				var TargetGMTempdisplayname = [];
				if (TargetGM && TargetGM.trpgDarkRollingfunction)
					for (var i = 0; i < TargetGM.trpgDarkRollingfunction.length; i++) {
						if (TargetGM.trpgDarkRollingfunction[i].groupid == groupid) {
							for (var a = 0; a < TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction.length; a++) {
								//checkifsamename = 1
								TargetGMTempID[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].userid
								TargetGMTempdiyName[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].diyName
								TargetGMTempdisplayname[a] = TargetGM.trpgDarkRollingfunction[i].trpgDarkRollingfunction[a].displayname
								//TargetGMTemp[a]. channelid displayname diyName userid
							};
						};
					};
			};
			switch (true) {
				case privatemsg == 1:
					// 輸入dr  (指令) 私訊自己
					//
					//console.log('ctx.message.chat.type: ', ctx.message.chat.type)
					if (groupid) {
						await SendDR("@" + displayname + '暗骰給自己');
					}
					rplyVal.text = "@" + displayname + "的暗骰\n" + rplyVal.text
					await SendToId(userid);
					break;
				case privatemsg == 2:
					//輸入ddr(指令) 私訊GM及自己
					if (groupid) {
						let targetGMNameTemp = "";
						for (var i = 0; i < TargetGMTempID.length; i++) {
							targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
						};
						await SendDR("@" + displayname + '暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
					}
					rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
					await SendToId(userid);
					for (var i = 0; i < TargetGMTempID.length; i++) {
						if (ctx.message.from.id != TargetGMTempID[i])
							await SendToId(TargetGMTempID[i]);
					}
					break;
				case privatemsg == 3:
					//輸入dddr(指令) 私訊GM
					if (groupid) {
						let targetGMNameTemp = "";
						for (var i = 0; i < TargetGMTempID.length; i++) {
							targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
						};
						await SendDR("@" + displayname + '暗骰進行中 \n目標: ' + targetGMNameTemp);
					}
					rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
					for (var i = 0; i < TargetGMTempID.length; i++) {
						await SendToId(TargetGMTempID[i]);
					}
					break;
				default:
					if (displaynamecheck == false) {
						console.log('displaynamecheck False')
						await SendToId(msg.from);
					} else
						await SendToReply();
					break;
			}

			async function SendDR(text) {
				return await msg.reply(text);
			}
			async function SendToId(targetid) {
				for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
					if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
						await client.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
					}
				}
			}
			async function SendToReply() {
				for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
					if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length - 1) {
						await msg.reply(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
					}
				}
			}



			//  }
		}
		await msg.delete();
	})
	client.on('message_ack', async (msg, ack) => {
		if (ack > 0) {
			const chat = await msg.getChat();
			chat.clearMessages();
		}
	});
	client.on('group_join', async (msg) => {
		console.log("Whatsapp joined");
		await msg.reply(joinMessage);
	});

	client.initialize();

}