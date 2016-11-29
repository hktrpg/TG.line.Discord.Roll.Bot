var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');  
var app = express();

var jsonParser = bodyParser.json();

var options = {
  host: 'api.line.me',
  port: 443,
  path: '/v2/bot/message/reply',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer [LineAccessToken]'
  }
}
app.set('port', (process.env.PORT || 5000));

// views is directory for all template files

app.get('/', function(req, res) {
//  res.send(parseInput(req.query.input));
  res.send('Hello');
});

app.post('/', jsonParser, function(req, res) {
  let event = req.body.events[0];
  let msg = event.message.text;
  let rplyToken = event.replyToken;

  let rplyVal = '';
  try {
    rplyVal = parseInput(msg); 
  } 
  catch(e) {
    rplyVal = '格式錯惹，正確格式如： 1d3, 5d200';
  }

  let rplyObj = {
    replyToken: rplyToken,
    messages: [
      {
        type: "text",
        text: rplyVal
      }
    ]
  }

  let rplyJson = JSON.stringify(rplyObj); 
  
  var request = https.request(options, function(response) {
    console.log('Status: ' + response.statusCode);
    console.log('Headers: ' + JSON.stringify(response.headers));
    response.setEncoding('utf8');
    response.on('data', function(body) {
      console.log(body); 
    });
  });
  console.log(rplyJson);
  request.on('error', function(e) {
    console.log('Request error: ' + e.message);
  })
  request.end(rplyJson);

  res.send('ok');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function parseInput(inputStr) {
  console.log('InputStr: ' + inputStr);
  let splitor = 'd';
  let commandArr = inputStr.split(splitor);
  if (commandArr.length != 2) return '格式錯惹，正確格式如： 1d3, 5d200';
  let countOfNum = commandArr[0];
  let randomRange = commandArr[1];
  
  let countStr = '';
  let count = 0;
  for (let idx = 1; idx <= countOfNum; idx ++) {
    let temp = random(1, randomRange);
    countStr = countStr + temp + '+';
    count += temp; 
  }
  
  if (countOfNum == 1) {
    countStr = count;
  } else {
    countStr = countStr.substring(0, countStr.length - 1) + '=' + count;
  }
  return countStr;
}

function random(min, max) {
  return Math.floor((Math.random() * max) + min);
}
