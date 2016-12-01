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
    'Authorization': 'Bearer 5jaJz9O+Kf3hFiQSRD3LxFdBW6MNlJDoOZDgADH91+TFRw5fYoeLV1g3yDWt0ePExIygLzmvdkL0RRAAqbWhulZtkQuVVRuMRvgl1g/QqFAPkmJlwAyFDwewx3fgqpbNIGnmnVr9w7KZdfpmvfFI7AdB04t89/1O/w1cDnyilFU='
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
        let cuntSplitor = '+';
        let comSplitor = 'd';
        

        let mainMsg = inputStr.split(msgSplitor); //定義輸入字串，以空格切開
        let trigger = mainMsg[0]; //指定啟動詞在第一個詞
        //console.log(trigger);
        let secCommand = mainMsg[2]; //第三個詞是第二控制項
        console.log('2nd Command = ' + secCommand);
        if (trigger != 'roll') return null;

        _isNaN = function(obj) {
          return isNaN(parseInt(obj));
        }

        let CuntArr = mainMsg[1].split(cuntSplitor); //先以加號分開彼此
        let chackOnce = CuntArr[0].split(comSplitor);
        //return CuntArr[0];
        //return chackOnce;
       // return CuntArr.length;
        if (chackOnce.length != 2 || _isNaN(chackOnce[0]) || _isNaN(chackOnce[1])) return randomReply(); //只檢查第一項看看是否打錯

        let numMax = CuntArr.length - 1 ; //設定要做的加法的大次數
        
        var count = 0;
        let countStr = '';
        
        for (let i = 0; i <= numMax; i++) {
          let commandArr = CuntArr[i].split(comSplitor);
            if (commandArr.length != 2) {
              var ttemp = parseInt(commandArr[0]);
                countStr = countStr + ttemp + '+';
                
                count += ttemp;
              }
          else
            {
          let countOfNum = commandArr[0];
          let randomRange = commandArr[1];
        


            for (let idx = 1; idx <= countOfNum; idx ++) {
              let temp = random(1, randomRange);
              countStr = countStr + temp + '+';
              count += temp; 
            }
          }
        }
        
        
        // if ( mainMsg[2].split(comSplitor) != null) {
        //      let timesSplit = '*';
        //      let timesArr = mainMsg[2].split(timesSplit);
        //      let timesNum = timesArr[1];
        //  }





        
        
        //if (countOfNum == 1) {
       //   countStr = count;
       //  // countStr = count + '|2c=' + secCommand;
          
       // } else {
          countStr = countStr.substring(0, countStr.length - 1) + '=' + count;
         // countStr = countStr.substring(0, countStr.length - 1) + '=' + count + '|2c=' + secCommand;
      //  }
        return countStr;


      }

      function random(min, max) {
        return Math.floor((Math.random() * max) + min);
      }

      function randomReply() {
        let rplyArr = ['格式錯啦，d要小寫！', '幹，你這學不會的豬！d要小寫！', '誒誒，你這學不會的X，d要小寫。'];
        return rplyArr[Math.floor((Math.random() * (rplyArr.length - 1)) + 0)];
      }
