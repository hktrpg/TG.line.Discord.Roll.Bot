if (process.env.GAMER_CHANNEL_SECRET) {
	try {
		require('fs').readdirSync('./modules/').forEach(function (file) {
			if (file.match(/\.js$/) !== null && file !== 'index.js' && file.match(/^core-/) == null) {
				var name = file.replace('.js', '');
				exports[name] = require('../modules/' + file);
			}
		});
		const port = process.env.PORT || 5000;
		var channelKeyword = process.env.GAMER_CHANNEL_KEYWORD || "";
		var key = {

			accessToken: process.env.GAMER_CHANNEL_TOKEN,
			appSecret: process.env.GAMER_CHANNEL_SECRET

		}
		const GamerBot = require('hahamut.js');
		const client = new GamerBot.HahamutBot(key);
		const BootTime = new Date(new Date().toLocaleString("en-US", {
			timeZone: "Asia/Shanghai"
		}));
		// Load `*.js` under modules directory as properties
		//  i.e., `User.js` will become `exports['User']` or `exports.User`
		var GamerBotcountroll = 0;
		var GamerBotcounttext = 0;

		client.once('ready', () => {
			console.log('GamerBot is Ready!');
		});

		//client.login(channelSecret);
		// handle the error event
		client.on('error', console.error);
		client.on('unhandledRejection', error => {
			// Will print "unhandledRejection err is not defined"
			console.log('unhandledRejection: ', error.message);
		});


		client.on('message', message => {
			console.log(message)
			//	if (message.author.bot === false && message.text != "") {
			//	console.log('message.text ' + message.text);
			//	console.log('channelKeyword ' + channelKeyword);
			let groupid, userid, displayname = ''
			let displaynamecheck = true;
			let userrole = 1;
			//console.log(message.guild)
			//if (message.guild && message.guild.id) groupid = message.guild.id
			//if (message.author.id) userid = message.author.id
			////GamerBot: 585040823232320107
			//if (message.member && message.member.hasPermission("ADMINISTRATOR")) userrole = 3
			//userrole -1 ban ,0 nothing, 1 user, 2 dm, 3 admin 4 super admin 
			let rplyVal = {};
			let msgSplitor = (/\S+/ig);
			let mainMsg = message.text.match(msgSplitor); //定義輸入字串
			if (mainMsg && mainMsg[0])
				var trigger = mainMsg[0].toString().toLowerCase()
			//指定啟動詞在第一個詞&把大階強制轉成細階
			if (trigger == ".me") {
				displaynamecheck = false
			}
			let privatemsg = 0;
			//訊息來到後, 會自動跳到analytics.js進行骰組分析
			//如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.


			if (trigger.match(/^dr/i) && mainMsg && mainMsg[1]) {
				privatemsg = 1;
				message.text = message.text.replace(/^[d][r][ ]/i, '')
				//mainMsg.shift();
				//trigger = mainMsg[0].toString().toLowerCase();
			}
			if (channelKeyword != "" && trigger == channelKeyword.toString().toLowerCase()) {
				//mainMsg.shift();
				rplyVal = exports.analytics.parseInput(message.text, groupid, userid, userrole, exports.analytics.stop);
			} else {
				if (channelKeyword == "") {
					rplyVal = exports.analytics.parseInput(message.text, groupid, userid, userrole, exports.analytics.stop);
				}
			}

			if (rplyVal && rplyVal.text) {
				GamerBotcountroll++;
				if (groupid && userid) {
					//GamerBot: 585040823232320107
					displayname = "<@" + userid + "> "
					if (displaynamecheck)
						rplyVal.text = displayname + rplyVal.text
				}


				//console.log('GamerBot Roll: ' + GamerBotcountroll + ', GamerBot Text: ' + GamerBotcounttext + ' Boot Time: ' + BootTime.toLocaleString(), " text: ", message.text);

				if (privatemsg == 1) {
					message.sendMessage(displayname + " 暗骰進行中");
					async function loada() {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
							await message.sendMessage(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
						}
					}
					loada();
				} else {
					async function loadb() {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
							await message.sendMessage(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
						}
					}
					loadb();
				}
				//console.log("rplyVal: " + rplyVal);
			} else {
				GamerBotcounttext++;
				if (GamerBotcounttext % 500 == 0)
					console.log('GamerBot Roll: ' + GamerBotcountroll + ', GamerBot Text: ' + GamerBotcounttext + ' Boot Time: ' + BootTime.toLocaleString());
			}
			//	}
		});
		//Set Activity 可以自定義正在玩什麼  
		client.boot();
	} catch (e) {
		console.log('catch error');
		console.log('Request error: ' + e.message);

	}
}