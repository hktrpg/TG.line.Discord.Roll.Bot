if (process.env.DISCORD_CHANNEL_SECRET) {
	try {
		require('fs').readdirSync('./modules/').forEach(function (file) {
			if (file.match(/\.js$/) !== null && file !== 'index.js' && file.match(/^core-/) == null) {
				var name = file.replace('.js', '');
				exports[name] = require('../modules/' + file);
			}
		});
		var channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
		var channelSecret = process.env.DISCORD_CHANNEL_SECRET;
		const Discord = require('discord.js');
		const client = new Discord.Client();
		const BootTime = new Date(new Date().toLocaleString("en-US", {
			timeZone: "Asia/Shanghai"
		}));
		// Load `*.js` under modules directory as properties
		//  i.e., `User.js` will become `exports['User']` or `exports.User`
		var Discordcountroll = 0;
		var Discordcounttext = 0;

		client.once('ready', () => {
			console.log('Discord is Ready!');
		});

		client.login(channelSecret);
		// handle the error event
		client.on('error', console.error);
		client.on('unhandledRejection', error => {
			// Will print "unhandledRejection err is not defined"
			console.log('unhandledRejection: ', error.message);
		});


		client.on('message', message => {
			if (message.author.bot === false && message.content != "") {
				//	console.log('message.content ' + message.content);
				//	console.log('channelKeyword ' + channelKeyword);
				let groupid, userid = ''
				if (message && message.TextChannel && message.TextChannel.id) groupid = message.TextChannel.id
				if (message.author.id) userid = message.author.id
				let rplyVal = {};
				let msgSplitor = (/\S+/ig);
				let mainMsg = message.content.match(msgSplitor); //定義輸入字串
				if (mainMsg && mainMsg[0])
					var trigger = mainMsg[0].toString().toLowerCase()
				//指定啟動詞在第一個詞&把大階強制轉成細階
				let privatemsg = 0;
				//訊息來到後, 會自動跳到analytics.js進行骰組分析
				//如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.


				if (trigger == "dr" && mainMsg && mainMsg[1]) {
					privatemsg = 1;
					mainMsg.shift();
					trigger = mainMsg[0].toString().toLowerCase();
				}
				if (channelKeyword != "" && trigger == channelKeyword.toString().toLowerCase()) {
					mainMsg.shift();
					rplyVal = exports.analytics.parseInput(mainMsg.join(' '), groupid, userid);
				} else {
					if (channelKeyword == "") {
						rplyVal = exports.analytics.parseInput(mainMsg.join(' '), groupid, userid);
					}
				}
				if (rplyVal && rplyVal.text) {
					Discordcountroll++;

					//console.log('Discord Roll: ' + Discordcountroll + ', Discord Text: ' + Discordcounttext + ' Boot Time: ' + BootTime.toLocaleString(), " content: ", message.content);

					if (privatemsg == 1) {
						message.channel.send("暗骰進行中");
						async function loada() {
							for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
								await message.author.send(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i]);
							}
						}
						loada();
					} else {
						async function loadb() {
							for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
								await message.channel.send(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
							}
						}
						loadb();
					}
					//console.log("rplyVal: " + rplyVal);
				} else {
					Discordcounttext++;
					if (Discordcounttext % 500 == 0)
						console.log('Discord Roll: ' + Discordcountroll + ', Discord Text: ' + Discordcounttext + ' Boot Time: ' + BootTime.toLocaleString());
				}
			}
		});
		//Set Activity 可以自定義正在玩什麼  
		client.on('ready', () => {
			client.user.setGame('bothelp |運氣占卜「運勢」')
		})
	} catch (e) {
		console.log('catch error');
		console.log('Request error: ' + e.message);

	}
}