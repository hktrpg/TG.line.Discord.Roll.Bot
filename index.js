var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jsonParser = bodyParser.json();
var analytics = require('./modules/analytics.js');
var replyMsgToLine = require('./modules/replyMsgToLine.js');
var options = {
	host: 'api.line.me',
	port: 443,
	path: '/v2/bot/message/reply',
	method: 'POST',
	headers: {
	'Content-Type': 'application/json',
	   'Authorization': 'Bearer [LineAuthorization]'
	}
}
app.set('port', (process.env.PORT || 5000));

// views is directory for all template files

app.get('/', function(req, res) {
//	res.send(parseInput(req.query.input));
	res.send('Hello');
});

app.post('/', jsonParser, function(req, res) {
	let event = req.body.events[0];
	let type = event.type;
	let msgType = event.message.type;
	let msg = event.message.text;
	let rplyToken = event.replyToken;
	let rplyVal = {};
	//如果有訊息,掉到analytics.js 分析需不要 自動回應
	if (type == 'message' && msgType == 'text') {
	try {
		rplyVal = analytics.parseInput(rplyToken, msg); 
	} 
	catch(e) {
		console.log('catch error');
		console.log('Request error: ' + e.message);
	}
	}
	//把回應的內容,掉到replyMsgToLine.js傳出去
	if (rplyVal) {
	replyMsgToLine.replyMsgToLine(rplyToken, rplyVal.text, options, rplyVal.type); 
	} else {
	//console.log('Do not trigger'); 
	}
	res.send('ok');
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});


////////////////////////////////////////
///////// 骰組分析放到analytics.js 
////////////////////////////////////////		