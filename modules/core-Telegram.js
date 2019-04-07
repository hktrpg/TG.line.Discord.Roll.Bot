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
		TGclient.start();
		TGclient.on('text', message => {
			//console.log(message);
			// if (message.User.is_bot === false && message.text != '') {
			//	console.log('message.content ' + message.content)
			//	console.log('channelKeyword ' + channelKeyword)
			let rplyVal = {}
			let msgSplitor = (/\S+/ig)
			let mainMsg = message.text.match(msgSplitor); // 定義輸入字串
			let trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階
			let privatemsg = 0
			// 訊息來到後, 會自動跳到analytics.js進行骰組分析
			// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.


			if (trigger == 'dr') {
				privatemsg = 1
				mainMsg.shift()
				trigger = mainMsg[0].toString().toLowerCase()
			}
			if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
				mainMsg.shift()
				rplyVal = exports.analytics.parseInput(mainMsg.join(' '))
			} else {
				if (channelKeyword == '') {
					rplyVal = exports.analytics.parseInput(mainMsg.join(' '))
				}
			}

			if (rplyVal && rplyVal.text) {
				TGcountroll++;
				console.log('TG Roll: ' + TGcountroll);

				if (privatemsg == 1) {
					message.reply.text(message.from.first_name + ' 暗骰進行中')
					async function load() {
						for (var i = 0; i < rplyVal.text.match(/.{1,1000}/g).length; i++) {
							await TGclient.sendMessage(message.from.id, rplyVal.text.match(/.{1,1000}/g)[i])

						}
					}
					load();
				}
				else {
					async function load() {
						for (var i = 0; i < rplyVal.text.match(/.{1,1000}/g).length; i++) {
							await message.reply.text(rplyVal.text.match(/.{1,1000}/g)[i])

						}
					}
					load();

				}

				// console.log("rplyVal: " + rplyVal)
			} else {
				TGcounttext++;
				console.log('TG Text: ' + TGcounttext);
			}
			//  }
		})

	} catch (e) {
		console.log('catch error')
		console.log('Request error: ' + e.message)
	}
}