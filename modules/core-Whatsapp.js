"use strict";
try {
	const {
		Random,
		nodeCrypto
	} = require("random-js");
	const random = new Random(nodeCrypto);

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
		//console.log('msg: ', msg)

		//msg.body
		//msg.reply('pong');
		if (msg.body && !msg.fromMe && !msg.isForwarded) {
			let CAPTCHA = random.string(20);
			//console.log(ctx.getChatMembers(ctx.chat.id) //[Members]
			//	ctx.getChatMembers() //[Members]
			//	telegrafGetChatMembers.check(ctx.chat.id) //[Members]
			//	telegrafGetChatMembers.all //[Chats]
			let groupid, userid, displayname, channelid, membercount, channelKeyword = '';
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
			await client.getChats().then(async getChatDetail => {
				//console.log('getChatDetail: ', getChatDetail)
				if (getChatDetail[0].isGroup) {
					groupid = getChatDetail[0].groupMetadata.creation;
					//console.log('groupid:', groupid)
					//displayname = getChatDetail[1].name;
					membercount = getChatDetail[0].participants.length;


				}
			});

			//285083923223
			//userrole = 3
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
			if (rplyVal) {
				if (CAPTCHA != rplyVal.CAPTCHA) {
					console.log('Whatsapp CAPTCHA false', CAPTCHA, ' &&', rplyVal.CAPTCHA, 'text: ', msg.body, 'rplyVal: ', rplyVal);
					return;
				}
				if (groupid && rplyVal && rplyVal.LevelUp) {
					//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
					await client.sendMessage(msg.from, "@" + displayname + '\n' + rplyVal.LevelUp);
				}
				if (rplyVal.text) {
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
							await SendToReply();
							break;
					}

					async function SendDR(text) {
						return await msg.reply(text);
					}
					async function SendToId(targetid) {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
							if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 1) {
								await client.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,1900}/g)[i]);
							}
						}
					}
					async function SendToReply() {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
							if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 1) {
								await msg.reply(rplyVal.text.toString().match(/[\s\S]{1,1900}/g)[i]);
							}
						}
					}
				}
				// console.log("rplyVal: " + rplyVal)
			} else {
				//console.log(rplyVal.text, " ")
				//TGcounttext++;
				//if (TGcounttext % 500 == 0)
				//console.log('Telegram Roll: ' + TGcountroll + ', Telegram Text: ' + TGcounttext);
				return;
			}
			//  }

		}
	});

	client.initialize();
	/*
		TGclient.on('text', async (ctx) => {
			let count = 0;
			let CAPTCHA = random.string(20);
			//console.log(ctx.getChatMembers(ctx.chat.id) //[Members]
			//	ctx.getChatMembers() //[Members]
			//	telegrafGetChatMembers.check(ctx.chat.id) //[Members]
			//	telegrafGetChatMembers.all //[Chats]
			let groupid, userid, displayname, channelid, membercount = '';
			let TargetGM = require('../roll/z_DDR_darkRollingToGM').initialize();
			//得到暗骰的數據, GM的位置
			if (ctx.message.from.username) displayname = ctx.message.from.username;
			//是不是自己.ME 訊息
			//TRUE 即正常
			let displaynamecheck = true;
			let userrole = 1;
			//console.log('TG: ', message)
			//console.log('ctx.chat.id', ctx.chat.id)
			//頻道人數
			if (ctx.chat && ctx.chat.id)
				membercount = await ctx.getChatMembersCount(ctx.chat.id);
			if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
				groupid = ctx.message.chat.id;
				if (ctx.chat && ctx.chat.id)
					if ((await telegrafGetChatMembers.check(ctx.chat.id) && telegrafGetChatMembers.check(ctx.chat.id)[0] && await telegrafGetChatMembers.check(ctx.chat.id)[0].status == ("creator" || "administrator")) || ctx.message.chat.all_members_are_administrators == true) {
						userrole = 3;
						//console.log(userrole)
						//console.log(telegrafGetChatMembers.check(ctx.chat.id))
					}
			}


			if (ctx.message.from.id) userid = ctx.message.from.id;
			//285083923223
			//userrole = 3
			let rplyVal = {};
			let msgSplitor = (/\S+/ig);
			let trigger = "";
			if (ctx.message.text && ctx.message.from.is_bot == false) {
				if (ctx.botInfo && ctx.botInfo.username && ctx.message.text.match(/^[/]/))
					ctx.message.text = ctx.message.text
					.replace(new RegExp('\@' + ctx.botInfo.username + '$', 'i'), '')
					.replace(new RegExp('^\/', 'i'), '');
				var mainMsg = ctx.message.text.match(msgSplitor); // 定義輸入字串

			}
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
				ctx.message.text = ctx.message.text.replace(/^[d][r][ ]/i, '');
			}
			if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 2;
				ctx.message.text = ctx.message.text.replace(/^[d][d][r][ ]/i, '');
			}
			if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 3;
				ctx.message.text = ctx.message.text.replace(/^[d][d][d][r][ ]/i, '');
			}
			if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
				mainMsg.shift();
				rplyVal = await exports.analytics.parseInput(ctx.message.text, groupid, userid, userrole, "Telegram", displayname, channelid, "", membercount);
			} else {
				if (channelKeyword == '') {
					rplyVal = await exports.analytics.parseInput(ctx.message.text, groupid, userid, userrole, "Telegram", displayname, channelid, "", membercount, CAPTCHA);

				}
				count++;

			}
			if (count >= 2) {
				console.log('TG count false count=', count, 'rplyVal: ', rplyVal);
				return;
			}
			//LevelUp功能
			if (rplyVal && count == 1) {
				if (CAPTCHA != rplyVal.CAPTCHA) {
					console.log('TG CAPTCHA false', CAPTCHA, ' &&', rplyVal.CAPTCHA, 'text: ', ctx.message.text, 'rplyVal: ', rplyVal);
					return;
				}
				if (groupid && rplyVal && rplyVal.LevelUp) {
					//	console.log('result.LevelUp 2:', rplyVal.LevelUp)
					await ctx.reply("@" + displayname + '\n' + rplyVal.LevelUp);
				}
				if (rplyVal.text) {
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
								for (var i = 0; i < TargetGMTempID.length; i++) {
									targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
								};
								ctx.reply("@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp);
							}
							rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
							await SendToId(ctx.message.from.id);
							for (var i = 0; i < TargetGMTempID.length; i++) {
								if (ctx.message.from.id != TargetGMTempID[i])
									await SendToId(TargetGMTempID[i]);
							}
							break;
						case privatemsg == 3:
							//輸入dddr(指令) 私訊GM
							if (ctx.message.chat.type != 'private') {
								let targetGMNameTemp = "";
								for (var i = 0; i < TargetGMTempID.length; i++) {
									targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i]);
								};
								await ctx.reply("@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp);
							}
							rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text;
							for (var i = 0; i < TargetGMTempID.length; i++) {
								await SendToId(TargetGMTempID[i]);
							}
							break;
						default:
							if (displaynamecheck && displayname) {
								//285083923223
								displayname = "@" + ctx.message.from.username + "\n";
								rplyVal.text = displayname + rplyVal.text;
							}
							await SendToReply();
							break;
					}

					async function SendToId(targetid) {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
							if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 1) {
								await ctx.telegram.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,1900}/g)[i]);
							}
						}
					}
					async function SendToReply() {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
							if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 1) {
								await ctx.reply(rplyVal.text.toString().match(/[\s\S]{1,1900}/g)[i]);
							}
						}
					}
				}
				// console.log("rplyVal: " + rplyVal)
			} else {
				//console.log(rplyVal.text, " ")
				//TGcounttext++;
				//if (TGcounttext % 500 == 0)
				//console.log('Telegram Roll: ' + TGcountroll + ', Telegram Text: ' + TGcounttext);
				return;
			}
			//  }

		})

	*/
} catch (e) {
	console.log('catch error');
	console.log('Request error: ' + e.message);
}

/*
bot.command('pipe', (ctx) => ctx.replyWithPhoto({
	url: 'https://picsum.photos/200/300/?random'
}))
*/