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


	const BootTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));


	// create LINE SDK config from env variables
	const config = {
		channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN,
		channelSecret: process.env.LINE_CHANNEL_SECRET,
	};

	// create LINE SDK client
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
	let rplyVal = {};
	// event handler
	function handleEvent(event) {
		if (event.type !== 'message' || event.message.type !== 'text') {
			// ignore non-text-message event
			return Promise.resolve(null);
		}

		// create a echoing text message
		//exports.analytics.parseInput(event.message.text)

		rplyVal = exports.analytics.parseInput(event.message.text);

		if (rplyVal && rplyVal.text) {
			Linecountroll++;
			console.log('Line Roll: ' + Linecountroll + ', Line Text: ' + Linecounttext + ' Boot Time: ' + BootTime.toLocaleString());
			return client.replyMessage(event.replyToken, rplyVal);
		} else {
			Linecounttext++;
			console.log('Line Roll: ' + Linecountroll + ', Line Text: ' + Linecounttext + ' Boot Time: ' + BootTime.toLocaleString());
		}
		// use reply API

	}

	// listen on port
	const port = process.env.PORT || 5000;
	app.listen(port, () => {
		console.log(`Line BOT listening on ${port}`);
	});

	app.get('/', function (req, res) {
		//	res.send(parseInput(req.query.input));
		res.send('Hello');
	});

}

