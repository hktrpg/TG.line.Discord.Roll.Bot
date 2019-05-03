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
			//console.log('TG: ', message)

			/*
			2019-05-03T14:57:17.095268+00:00 app[web.1]: TG:  { message_id: 3563,
			2019-05-03T14:57:17.095287+00:00 app[web.1]:   from:
			2019-05-03T14:57:17.095289+00:00 app[web.1]:    { id: 398728508,
			2019-05-03T14:57:17.095290+00:00 app[web.1]:      is_bot: false,
			2019-05-03T14:57:17.095292+00:00 app[web.1]:      first_name: 'Art',
			2019-05-03T14:57:17.095294+00:00 app[web.1]:      username: 'sssss',
			2019-05-03T14:57:17.095296+00:00 app[web.1]:      language_code: 'zh-hans' },
			2019-05-03T14:57:17.095298+00:00 app[web.1]:   chat:
			2019-05-03T14:57:17.095300+00:00 app[web.1]:    { id: 398728508,
			2019-05-03T14:57:17.095301+00:00 app[web.1]:      first_name: 'wer',
			2019-05-03T14:57:17.095303+00:00 app[web.1]:      username: 'sssss',
			2019-05-03T14:57:17.095305+00:00 app[web.1]:      type: 'private' },
			2019-05-03T14:57:17.095306+00:00 app[web.1]:   date: 23233,
			2019-05-03T14:57:17.095308+00:00 app[web.1]:   text: '.block add 100',
			2019-05-03T14:57:17.095310+00:00 app[web.1]:   reply:
			2019-05-03T14:57:17.095311+00:00 app[web.1]:    { text: [Function],
			2019-05-03T14:57:17.095312+00:00 app[web.1]:      photo: [Function],
			2019-05-03T14:57:17.095314+00:00 app[web.1]:      video: [Function],
			2019-05-03T14:57:17.095315+00:00 app[web.1]:      videoNote: [Function],
			2019-05-03T14:57:17.095316+00:00 app[web.1]:      file: [Function],
			2019-05-03T14:57:17.095317+00:00 app[web.1]:      sticker: [Function],
			2019-05-03T14:57:17.095319+00:00 app[web.1]:      audio: [Function],
			2019-05-03T14:57:17.095321+00:00 app[web.1]:      voice: [Function],
			2019-05-03T14:57:17.095322+00:00 app[web.1]:      game: [Function],
			2019-05-03T14:57:17.095323+00:00 app[web.1]:      action: [Function],
			2019-05-03T14:57:17.095324+00:00 app[web.1]:      location: [Function],
			2019-05-03T14:57:17.095326+00:00 app[web.1]:      place: [Function: bound place] } }
			*/


			if (message.chat.type == 'group') groupid = message.chat.id
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