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
		const TeleBot = require('telebot')
		const TGclient = new TeleBot(process.env.TELEGRAM_CHANNEL_SECRET)
		const channelKeyword = process.env.TELEGRAM_CHANNEL_KEYWORD || ''
		var TGcountroll = 0;
		var TGcounttext = 0;
		TGclient.start(() => {
			console.log('Telegram is Ready!');
		});
		TGclient.on('text', message => {
			//console.log(message)
			let groupid, userid = ''
			if (message.chat.type) groupid = message.chat.id
			if (message.from.id) userid = message.from.id
			let rplyVal = {}
			let msgSplitor = (/\S+/ig)
			if (message.text && message.from.is_bot == false)
				var mainMsg = message.text.match(msgSplitor); // 定義輸入字串
			if (mainMsg && mainMsg[0])
				var trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

			// 訊息來到後, 會自動跳到analytics.js進行骰組分析
			// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.

			let privatemsg = 0
			if (trigger == 'dr' && mainMsg && mainMsg[1]) {
				privatemsg = 1
				mainMsg.shift()
				trigger = mainMsg[0].toString().toLowerCase()
			}
			if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
				mainMsg.shift()
				rplyVal = exports.analytics.parseInput(mainMsg.join(' '), groupid, userid)
			} else {
				if (channelKeyword == '') {
					rplyVal = exports.analytics.parseInput(mainMsg.join(' '), groupid, userid)

				}

			}

			if (rplyVal && rplyVal.text) {
				TGcountroll++;
				//console.log('rplyVal.text:' + rplyVal.text)
				//console.log('Telegram Roll: ' + TGcountroll + ', Telegram Text: ' + TGcounttext, " content: ", message.text);
				if (privatemsg == 1) {
					message.reply.text(message.from.first_name + ' 暗骰進行中')
					async function loada() {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
							await TGclient.sendMessage(message.from.id, rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
						}
					}
					loada();
				} else {

					async function loadb() {
						for (var i = 0; i < rplyVal.text.toString().match(/[\s\S]{1,2000}/g).length; i++) {
							await message.reply.text(rplyVal.text.toString().match(/[\s\S]{1,2000}/g)[i])
						}
					}
					loadb();

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

	} catch (e) {
		console.log('catch error')
		console.log('Request error: ' + e.message)
	}
}