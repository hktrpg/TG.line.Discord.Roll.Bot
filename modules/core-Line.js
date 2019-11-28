'use strict';
if (process.env.LINE_CHANNEL_ACCESSTOKEN) {
	//	var channelSecret = process.env.LINE_CHANNEL_SECRET;
	// Load `*.js` under modules directory as properties
	//  i.e., `User.js` will become `exports['User']` or `exports.User`
	exports.analytics = require('../modules/analytics');
	//var Linecountroll = 0;
	//var Linecounttext = 0;
	const line = require('linebot');
	const express = require('express');

	// create LINE SDK config from env variables
	var bot = line({
		channelSecret: process.env.LINE_CHANNEL_SECRET,
		channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN
	});

	// create LINE SDK client

	const app = express();

	const linebotParser = bot.parser();

	app.post('/linewebhook', linebotParser);

	bot.on('message', function (event) {
		let HHH = {
			type: 'image',
			originalContentUrl:
				'http://abcletters.org/26alphabets/english-alphabet-letter-a.jpg',
			previewImageUrl:
				'http://abcletters.org/26alphabets/english-alphabet-letter-a.jpg'
		}
		event.reply(HHH).then(function (data) {
			console.log('Success', data);
		}).catch(function (error) {
			console.log('Error', error);
		});
	});


	module.exports = {
		app,
		express
	}

}

/*
{
	"type": "image",
	"originalContentUrl": "https://example.com/original.jpg",
	"previewImageUrl": "https://example.com/preview.jpg"
}
*/