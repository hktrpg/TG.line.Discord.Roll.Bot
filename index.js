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
    'Authorization': 'Bearer [LineAuthorization]'
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
  let type = event.type;
  let msgType = event.message.type;
  let msg = event.message.text;
  let rplyToken = event.replyToken;

  let rplyVal = null;
  console.log(msg);
  if (type == 'message' && msgType == 'text') {
    try {
      rplyVal = parseInput(rplyToken, msg); 
    } 
    catch(e) {
      rplyVal = randomReply();
    }
  }

  if (rplyVal) {
    replyMsgToLine(rplyToken, rplyVal); 
  } else {
    console.log('Do not trigger'); 
  }

  res.send('ok');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function replyMsgToLine(rplyToken, rplyVal) {
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
  request.on('error', function(e) {
    console.log('Request error: ' + e.message);
  })
  request.end(rplyJson);
}

function parseInput(rplyToken, inputStr) {
  console.log('InputStr: ' + inputStr);
  let msgSplitor = ' ';
  let comSplitor = 'd';

  let mainMsg = inputStr.split(msgSplitor);
  let trigger = mainMsg[0];
  console.log(trigger);
  if (trigger != '李孟儒') return null;

  _isNaN = function(obj) {
    return isNaN(parseInt(obj));
  }

  let commandArr = mainMsg[1].split(comSplitor);
  if (commandArr.length != 2 || _isNaN(commandArr[0]) || _isNaN(commandArr[1])) return randomReply();
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

function randomReply() {
  let rplyArr = ['幹你娘不要亂打好嗎？懂？', '你媽知道你在這裡發廢文嗎？', '啊啊啊啊～我要被玩壞惹', '幫QQ', '我看不到明天的陽光', '在非洲，每六十秒，就有一分鐘過去。認同請分享', '只要每天省下買一杯奶茶的錢，十天後就能買十杯奶茶', '當你的左臉被人打，那你的左臉就會痛', '誰能想的到，這名16歲少女，在四年前，只是一名12歲少女', '當蝴蝶在南半球拍了兩下翅膀，牠就會稍微飛高一點點', '台灣競爭力低落，在美國就連小學生都會說流利的英語', '每呼吸60秒，就減少一分鐘的壽命', '據統計，未婚生子的人數中有高機率為女性'];
  return rplyArr[Math.floor((Math.random() * (rplyArr.length - 1)) + 0)];
}
