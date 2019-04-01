if (process.env.LINE_CHANNEL_ACCESSTOKEN) {
	try {
		require('fs').readdirSync('./modules/').forEach(function (file) {
			if (file.match(/\.js$/) !== null && file !== 'index.js') {
				var name = file.replace('.js', '');
				exports[name] = require('../modules/' + file);
			}
		});
		const express = require('express');
		const bodyParser = require('body-parser');
		var app = express();
		var jsonParser = bodyParser.json();
		const channelAccessToken = process.env.LINE_CHANNEL_ACCESSTOKEN;
		const channelKeyword = process.env.LINE_CHANNEL_KEYWORD.toString().toLowerCase() || '';
		//	var channelSecret = process.env.LINE_CHANNEL_SECRET;
		// Load `*.js` under modules directory as properties
		//  i.e., `User.js` will become `exports['User']` or `exports.User`
		var Linecountroll = 0;
		var Linecounttext = 0;
		var options = {
			host: 'api.line.me',
			port: 443,
			path: '/v2/bot/message/reply',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + channelAccessToken
			}
		}
		app.set('port', (process.env.PORT || 5000));
		// views is directory for all template files
		app.get('/', function (req, res) {
			//	res.send(parseInput(req.query.input));
			res.send('Hello');
		});
		app.post('/', jsonParser, function (req, res) {
			let event = req.body.events[0];
			let type = event.type;
			let msgType = event.message.type;
			let msg = event.message.text;
			let rplyToken = event.replyToken;
			let rplyVal = {};
			let msgSplitor = (/\S+/ig);
			let mainMsg = event.message.text.match(msgSplitor); //定義輸入字串
			let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
			if (channelKeyword != "" && trigger == channelKeyword) {
				mainMsg.shift();
				event.message.text = mainMsg.join(' ');
				rplyVal = handleEvent(event);
			} else {
				if (channelKeyword == "") {
					rplyVal = handleEvent(event);
				}
			}

			//console.log(msg);
			//訊息來到後, 會自動呼叫handleEvent 分類,然後跳到analytics.js進行骰組分析
			//如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.



			//把回應的內容,掉到replyMsgToLine.js傳出去
			if (rplyVal) {
				Linecountroll++;
				console.log('Line Roll: ' + Linecountroll);
				exports.replyMsgToLine.replyMsgToLine(rplyToken, rplyVal, options);
			} else {
				Linecounttext++;
				console.log('Line Text: ' + Linecounttext);
			}
			res.send('ok');
		});

		app.listen(app.get('port'), function () {
			console.log('Node app is running on port', app.get('port'));
		});

		function handleEvent(event) {
			switch (event.type) {
				case 'message':
					const message = event.message;
					switch (message.type) {
						case 'text':
							return exports.analytics.parseInput(event.message.text);
						default:
							break;
					}
				case 'follow':
					break;
				case 'unfollow':
					break;
				case 'join':
					break;
				case 'leave':
					break;
				case 'postback':
					break;
				case 'beacon':
					break;
				default:
					break;
			}
		}

	} catch (e) {
		console.log('catch error');
		console.log('Request error: ' + e.message);
		console.log(event);

	}
}