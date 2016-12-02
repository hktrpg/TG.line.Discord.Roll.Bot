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
    //巴獸
    //'Authorization': 'Bearer EA1/i9foINj2mS/xle59b1Jv9IWtjW8KImFrcG6iE2tUVBld6p13eyZXJrTjYYcw60U8LAXyrQ+fcuBW2V+Lo8mKJ7LtwsUex2diCcDXObgEME8gm3vTvZ7ZaYobjJL9E7L6UdsTujp7VSJwZq9PDwdB04t89/1O/w1cDnyilFU='
    //自用
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

        let mainMsg = inputStr.split(msgSplitor); //定義輸入字串，以空格切開
        let trigger = mainMsg[0]; //指定啟動詞在第一個詞
        
        

        

        _isNaN = function(obj) {
          return isNaN(parseInt(obj));
        }                   
        //鴨霸獸指令開始於此
        if (inputStr.match('鴨霸獸') != null && inputStr.match('說明') != null) return randomReply() + '\n' + '\
總之你要擲骰前就先打roll，後面接像是2d6，1d6+3，2d6+1d3之類的就好。  \
\n要多筆輸出就是先空一格再打像是 *5 之類的。  \
\n不要打成大寫D，不要逼我嗆你';
        if (inputStr.match('鴨霸獸') != null) return randomReply() ;
        
        //roll 指令開始於此
        if (trigger == 'roll'){        
                  
          if (inputStr.split(msgSplitor).length == 1) return '\
總之你要擲骰前就先打roll，後面接像是2d6，1d6+3，2d6+1d3之類的就好。  \
\n要多筆輸出就是先空一格再打像是 *5 之類的。  \
\n不要打成大寫D，不要逼我嗆你';
          if (inputStr.split(msgSplitor).length == 3){
            
            if (mainMsg[2].split('*').length == 2) {
              let tempArr = mainMsg[2].split('*');
               //secCommand = parseInt(tempArr[1]);
              return MutiRollDice(mainMsg[1],parseInt(tempArr[1]));
            }
            return NomalRollDice(mainMsg[1],mainMsg[2]);
          }
          if (inputStr.split(msgSplitor).length == 2){
            return NomalRollDice(mainMsg[1],mainMsg[2]);
          }
          
          
        }
        
        
        if (trigger != 'roll') return null;
        

        
        //先以加號分開彼此
        //let chackOnce = CuntArr[0].split(comSplitor);
        //return CuntArr[0];
        //return chackOnce;
        // return CuntArr.length;
        //if (chackOnce.length != 2 || _isNaN(chackOnce[0]) || _isNaN(chackOnce[1])) return randomReply(); //只檢查第一項看看是否打錯

       


      }


        
function MutiRollDice(DiceToCal,timesNum){
  let cuntSplitor = '+';
  let comSplitor = 'd';
  let CuntArr = DiceToCal.split(cuntSplitor);
  let numMax = CuntArr.length - 1 ; //設定要做的加法的大次數

  var count = 0;
  let countStr = '';
  if (DiceToCal.match('D') != null) return randomReply() + '\n格式錯啦，d要小寫！';
  
  for (let j = 1 ; j <= timesNum ; j++){
    count = 0;
      for (let i = 0; i <= numMax; i++) {
          
          let commandArr = CuntArr[i].split(comSplitor);
          let countOfNum = commandArr[0];
          let randomRange = commandArr[1];
          if (randomRange == null) {
              let temp = parseInt(countOfNum);
              //countStr = countStr + temp + '+';
              count += temp; 
            }
          else{
              
              for (let idx = 1; idx <= countOfNum; idx ++) {
                  let temp = Dice(randomRange);
                  //countStr = countStr + temp + '+';
                  count += temp; 
                }
            }
        }
    countStr = countStr + count + '；';
}
  countStr = countStr.substring(0, countStr.length - 1) ;
  return countStr;

}        
        
        
function NomalRollDice(DiceToCal,text){
    let cuntSplitor = '+';
    let comSplitor = 'd';
    let CuntArr = DiceToCal.split(cuntSplitor);
    let numMax = CuntArr.length - 1 ; //設定要做的加法的大次數

    var count = 0;
    let countStr = '';
  if (DiceToCal.match('D') != null) return randomReply() + '\n格式錯啦，d要小寫！';
    for (let i = 0; i <= numMax; i++) {
      
      let commandArr = CuntArr[i].split(comSplitor);
      let countOfNum = commandArr[0];
      let randomRange = commandArr[1];
      if (randomRange == null) {
        let temp = parseInt(countOfNum);
        countStr = countStr + temp + '+';
        count += temp; 
       }
       else{
          
        for (let idx = 1; idx <= countOfNum; idx ++) {
          let temp = Dice(randomRange);
          countStr = countStr + temp + '+';
          count += temp; 
        }      }
    }
  
    
  if (countStr.split(cuntSplitor).length == 2) {
    if (text == null ) countStr = count;
    else countStr = count + '；' + text;
  } 
  else {
    if (text == null ) countStr = countStr.substring(0, countStr.length - 1) + '=' + count;
    else countStr = countStr.substring(0, countStr.length - 1) + '=' + count + '；' + text;
  }
return countStr;
          
}


        function Dice(diceSided){          
          return Math.floor((Math.random() * diceSided) + 1)
        }              


        function randomReply() {
          let rplyArr = ['你們死定了呃呃呃不要糾結這些……所以是在糾結哪些？', '在澳洲，每過一分鐘就有一隻鴨嘴獸被拔嘴。 \n我到底在共三小。', '嗚噁噁噁噁噁噁，不要隨便叫我。', '幹，你這學不會的豬！', '嘎嘎嘎。', 'wwwwwwwwwwwwwwwww', '為什麼你們每天都可以一直玩；玩就算了還玩我。', '好棒，整點了！咦？不是嗎？', '不要打擾我挖坑！', '好棒，誤點了！', '在南半球，一隻鴨嘴獸拍打他的鰭，他的嘴就會掉下來。 \n我到底在共三小。', '什麼東西你共三小。', '哈哈哈哈哈哈哈哈！', '一直叫，你4不4想拔嘴人家？', '一直叫，你想被淨灘嗎？', '幫主你也敢嘴？'];
          return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
        }
