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

        let mainMsg = inputStr.split(msgSplitor); //定義輸入字串，以空格切開
        let trigger = mainMsg[0]; //指定啟動詞在第一個詞
        
        

        

        _isNaN = function(obj) {
          return isNaN(parseInt(obj));
        }                   
        //鴨霸獸指令開始於此
        if (inputStr.match('鴨霸獸') != null && inputStr.match('說明') != null) return randomReply() + '\n' + '\
總之你要擲骰前就先打roll，後面接像是2d6，1d6+3，2d6+1d3之類的就好。  \
\n要多筆輸出就是先空一格再打像是 *5 之類的。  \
\n不要打成大寫D，不要逼我嗆你 \
\n如果是CoC系的話，有初步支援cc擲骰了，獎懲骰也支援了。 \
';
        if (inputStr.match('鴨霸獸') != null) return randomReply() ;
        
        //cc指令開始於此
        if (inputStr.split('=')[0] == 'cc<') 
        {
          let cctext = null;
          if (mainMsg[1] != undefined ) cctext = mainMsg[1];
          return coc7(parseInt(inputStr.split('=')[1]),cctext);
        }
        
        //獎懲骰設定於此
        if (inputStr.split('=')[0] == 'cc(1)<'||inputStr.split('=')[0] == 'cc(2)<'||inputStr.split('=')[0] == 'cc(-1)<'||inputStr.split('=')[0] == 'cc(-2)<') 
        {
          let cctext = null;
          if (mainMsg[1] != undefined ) cctext = mainMsg[1];
          return coc7bp(parseInt(inputStr.split('=')[1]),parseInt(inputStr.split('(')[1]),cctext);
        }
        
        //ccb指令開始於此
       if (inputStr.split('=')[0] == 'ccb<') 
        {
          let cctext = null;
          if (mainMsg[1] != undefined ) cctext = mainMsg[1];
          return coc6(parseInt(inputStr.split('=')[1]),cctext);
        }

        
        //roll 指令開始於此
        if (trigger == 'roll'){        
                  
          if (inputStr.split(msgSplitor).length == 1) return '\
總之你要擲骰前就先打roll，後面接像是2d6，1d6+3，2d6+1d3之類的就好。  \
\n要多筆輸出就是先空一格再打像是 *5 之類的。  \
\n不要打成大寫D，不要逼我嗆你';
          if (inputStr.split(msgSplitor).length >= 3){
            
            if (mainMsg[2].split('*').length == 2) {
              let tempArr = mainMsg[2].split('*');
              let text = inputStr.split(msgSplitor)[3];
              //secCommand = parseInt(tempArr[1]);
              return MutiRollDice(mainMsg[1],parseInt(tempArr[1]),text);
            }
            return NomalRollDice(mainMsg[1],mainMsg[2]);
          }
          if (inputStr.split(msgSplitor).length == 2){
            return NomalRollDice(mainMsg[1],mainMsg[2]);
          }
          
          
        }
        
        
        if (trigger != 'roll') return null;
        
      }

function coc6(chack,text){
          let temp = Dice(100);


          if (text == null ) {
            if (temp == 100) return temp + ' → 啊！大失敗！';
            if (temp <= chack) return temp + ' → 成功';
            else return temp + ' → 失敗' ;
          }
          else
    {
            if (temp == 100) return temp + ' → 啊！大失敗！；' + text;
            if (temp <= chack) return temp + ' → 成功；' + text;
            else return temp + ' → 失敗；' + text;
    }
}        
        
function coc7(chack,text){
  let temp = Dice(100);  
  if (text == null ) {
    if (temp == 1) return temp + ' → 恭喜！大成功！';
    if (temp == 100) return temp + ' → 啊！大失敗！';
    if (temp <= chack/5) return temp + ' → 極限成功';
    if (temp <= chack/2) return temp + ' → 困難成功';
    if (temp <= chack) return temp + ' → 通常成功';
    else return temp + ' → 失敗' ;
  }
  else
  {
  if (temp == 1) return temp + ' → 恭喜！大成功！；' + text;
  if (temp == 100) return temp + ' → 啊！大失敗！；' + text;
  if (temp <= chack/5) return temp + ' → 極限成功；' + text;
  if (temp <= chack/2) return temp + ' → 困難成功；' + text;
  if (temp <= chack) return temp + ' → 通常成功；' + text;
  else return temp + ' → 失敗；' + text;
  }
}
        
function coc7chack(temp,chack,text){
  if (text == null ) {
    if (temp == 1) return temp + ' → 恭喜！大成功！';
    if (temp == 100) return temp + ' → 啊！大失敗！';
    if (temp <= chack/5) return temp + ' → 極限成功';
    if (temp <= chack/2) return temp + ' → 困難成功';
    if (temp <= chack) return temp + ' → 通常成功';
    else return temp + ' → 失敗' ;
  }
else
  {
    if (temp == 1) return temp + ' → 恭喜！大成功！；' + text;
    if (temp == 100) return temp + ' → 啊！大失敗！；' + text;
    if (temp <= chack/5) return temp + ' → 極限成功；' + text;
    if (temp <= chack/2) return temp + ' → 困難成功；' + text;
    if (temp <= chack) return temp + ' → 通常成功；' + text;
    else return temp + ' → 失敗；' + text;
  }
}


function coc7bp (chack,bpdiceNum,text){
  let temp0 = Dice(10) - 1;
  let countStr = '';
  
  if (bpdiceNum > 0){
  for (let i = 0; i <= bpdiceNum; i++ ){
    let temp = Dice(10);
    let temp2 = temp.toString() + temp0.toString();
    if (temp2 > 100) temp2 = parseInt(temp2) - 100;  
    countStr = countStr + temp2 + '、';
  }
  countStr = countStr.substring(0, countStr.length - 1) 
    let countArr = countStr.split('、'); 
    
  countStr = countStr + ' → ' + coc7chack(Math.min(...countArr),chack,text);
  return countStr;
  }
  
  if (bpdiceNum < 0){
    bpdiceNum = Math.abs(bpdiceNum);
    for (let i = 0; i <= bpdiceNum; i++ ){
      let temp = Dice(10);
      let temp2 = temp.toString() + temp0.toString();
      if (temp2 > 100) temp2 = parseInt(temp2) - 100;  
      countStr = countStr + temp2 + '、';
    }
    countStr = countStr.substring(0, countStr.length - 1) 
    let countArr = countStr.split('、'); 

    countStr = countStr + ' → ' + coc7chack(Math.max(...countArr),chack,text);
    return countStr;
  }
  
}
        
function ArrMax (Arr){
  var max = this[0];
  this.forEach (function(ele,index,arr){
    if(ele > max) {
      max = ele;
    }
  })
  return max;
}
        

        function MutiRollDice(DiceToCal,timesNum,text){
          let cuntSplitor = '+';
          let comSplitor = 'd';
          let CuntArr = DiceToCal.split(cuntSplitor);
          let numMax = CuntArr.length - 1 ; //設定要做的加法的大次數

          var count = 0;
          let countStr = '';
          if (DiceToCal.match('D') != null) return randomReply() + '\n格式錯啦，d要小寫！';

          if (text == null) {
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
              countStr = countStr + count + '、';
            }
            countStr = countStr.substring(0, countStr.length - 1) ;
            return countStr;
          }

          if (text != null) {
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
              countStr = countStr + count + '、';
            }
            countStr = countStr.substring(0, countStr.length - 1) + '；' + text;
            return countStr;
          }
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
