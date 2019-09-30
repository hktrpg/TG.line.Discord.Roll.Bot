if (process.env.TELEGRAM_CHANNEL_SECRET) {

	try {
		function timer(ms) {
			return new Promise(res => setTimeout(res, ms));
		}
		require('fs').readdirSync('./modules/').forEach(function (file) {
			if (file.match(/\.js$/) !== null && file !== 'index.js' && file.match(/^core-/) == null) {
				var name = file.replace('.js', '');
				exports[name] = require('../modules/' + file);
			}
		});
		const Telegraf = require('telegraf')
		const TGclient = new Telegraf(process.env.TELEGRAM_CHANNEL_SECRET)
		const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || ''
		var TGcountroll = 0;
		var TGcounttext = 0;
		const telegrafGetChatMembers = require('telegraf-getchatmembers')

		TGclient.use(telegrafGetChatMembers)

		TGclient.on('text', async (ctx) => {
			//console.log(ctx.getChatMembers(ctx.chat.id) //[Members]
			//	ctx.getChatMembers() //[Members]
			//	telegrafGetChatMembers.check(ctx.chat.id) //[Members]
			//	telegrafGetChatMembers.all //[Chats]
			let groupid, userid, displayname, channelid = ''
			let TargetGM = require('../roll/z_DDR_darkRollingToGM').initialize()
			//得到暗骰的數據, GM的位置
			if (ctx.message.from.username) displayname = ctx.message.from.username
			//是不是自己.ME 訊息
			//TRUE 即正常
			let displaynamecheck = true;
			let userrole = 1;
			//console.log('TG: ', message)


			if (ctx.message.chat.type == 'group') {
				groupid = ctx.message.chat.id
				if (ctx.chat && ctx.chat.id)
					if ((telegrafGetChatMembers.check(ctx.chat.id) && telegrafGetChatMembers.check(ctx.chat.id)[0] && telegrafGetChatMembers.check(ctx.chat.id)[0].status == ("creator" || "administrator")) || ctx.message.chat.all_members_are_administrators == true) {
						userrole = 3
						//console.log(telegrafGetChatMembers.check(ctx.chat.id))
					}
			}


			if (ctx.message.from.id) userid = ctx.message.from.id
			//285083923223
			//userrole = 3
			let rplyVal = {}
			let msgSplitor = (/\S+/ig)
			if (ctx.message.text && ctx.message.from.is_bot == false)
				var mainMsg = ctx.message.text.match(msgSplitor); // 定義輸入字串
			if (mainMsg && mainMsg[0])
				var trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階
			if (trigger == ".me") {
				displaynamecheck = false
			}
			// 訊息來到後, 會自動跳到analytics.js進行骰組分析
			// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

			let privatemsg = 0
			//設定私訊的模式 0-普通 1-自己 2-自己+GM 3-GM
			if (trigger.match(/^dr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 1
				ctx.message.text = ctx.message.text.replace(/^[d][r][ ]/i, '')
			}
			if (trigger.match(/^ddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 2
				ctx.message.text = ctx.message.text.replace(/^[d][d][r][ ]/i, '')
			}
			if (trigger.match(/^dddr$/i) && mainMsg && mainMsg[1]) {
				privatemsg = 3
				ctx.message.text = ctx.message.text.replace(/^[d][d][d][r][ ]/i, '')
			}
			if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
				mainMsg.shift()
				rplyVal = exports.analytics.parseInput(ctx.message.text, groupid, userid, userrole, "Telegram", displayname, channelid)
			} else {
				if (channelKeyword == '') {
					rplyVal = exports.analytics.parseInput(ctx.message.text, groupid, userid, userrole, "Telegram", displayname, channelid)

				}

			}

			if (rplyVal && rplyVal.text) {
				TGcountroll++;

				if (privatemsg >= 1) {
					//當是私訊模式1-3時
					var TargetGMTempID = []
					var TargetGMTempdiyName = []
					var TargetGMTempdisplayname = []
					if (TargetGM && TargetGM.trpgDarkRollingfunction)
						for (var i = 0; i < TargetGM.trpgDarkRollingfunction.length; i++) {
							if (TargetGM.trpgDarkRollingfunction[i].groupid == groupid) {
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
						if (ctx.chat.type == 'group')
							ctx.reply("@" + displayname + ' 暗骰給自己')

						SendToId(ctx.message.from.id);
						break;
					case privatemsg == 2:
						//輸入ddr(指令) 私訊GM及自己
						if (ctx.chat.type == 'group') {
							let targetGMNameTemp = "";
							for (var i = 0; i < TargetGMTempID.length; i++)
								targetGMNameTemp = targetGMNameTemp + ", " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i])
							ctx.reply("@" + displayname + ' 暗骰進行中 \n目標: 自己 ' + targetGMNameTemp)
						}
						rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
						SendToId(ctx.message.from.id);
						for (var i = 0; i < TargetGMTempID.length; i++) {
							if (ctx.message.from.id != TargetGMTempID[i])
								SendToId(TargetGMTempID[i]);
						}
						break;
					case privatemsg == 3:
						//輸入dddr(指令) 私訊GM
						if (ctx.chat.type == 'group') {
							let targetGMNameTemp = "";
							for (var i = 0; i < TargetGMTempID.length; i++)
								targetGMNameTemp = targetGMNameTemp + " " + (TargetGMTempdiyName[i] || "@" + TargetGMTempdisplayname[i])
							ctx.reply("@" + displayname + ' 暗骰進行中 \n目標: ' + targetGMNameTemp)
						}
						rplyVal.text = "@" + displayname + " 的暗骰\n" + rplyVal.text
						for (var i = 0; i < TargetGMTempID.length; i++) {
							if (ctx.message.from.id != TargetGMTempID[i])
								SendToId(TargetGMTempID[i]);
						}
						break;
					default:
						if (displaynamecheck && displayname) {
							//285083923223
							displayname = "@" + ctx.message.from.username + "\n";
							rplyVal.text = displayname + rplyVal.text
						}
						SendToReply();
						break;
				}

				async function SendToId(targetid) {
					for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
						if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 1)
							await ctx.telegram.sendMessage(targetid, rplyVal.text.toString().match(/[\s\S]{1,1900}/g)[i])
					}
				}
				async function SendToReply() {
					for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
						if (i == 0 || i == 1 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 2 || i == rplyVal.text.toString().match(/[\s\S]{1,1900}/g).length - 1)
							await ctx.reply(rplyVal.text.toString().match(/[\s\S]{1,1900}/g)[i])
					}
				}
				// console.log("rplyVal: " + rplyVal)
			} else {
				//console.log(rplyVal.text, " ")
				TGcounttext++;
				if (TGcounttext % 500 == 0)
					console.log('Telegram Roll: ' + TGcountroll + ', Telegram Text: ' + TGcounttext);
			}
			//  }

		})

		TGclient.launch()
	} catch (e) {
		console.log('catch error')
		console.log('Request error: ' + e.message)
	}
}