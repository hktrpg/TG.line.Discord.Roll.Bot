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
        let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
                       
        _isNaN = function(obj) {
          return isNaN(parseInt(obj));
        }                   
        //鴨霸獸指令開始於此

        if (trigger.match('鴨霸獸') != null) return randomReply() ;        
        if (trigger.match('運氣') != null || trigger.match('運勢') != null) return randomLuck(mainMsg) ; //占卜運氣        
        
        if (trigger == 'help') return randomReply() + '\n' + '\
【擲骰BOT】你可以在聊天中進行自定義的擲骰 \
\n 例如輸入）r 2d6+1　攻撃！\
\n 會輸出）2d6+1 → 4+3+1=8；攻擊\
\n 如上面一樣,在骰子數字後方隔空白位打字,就可以進行發言。\
\n 以下還有其他例子\
\n 3D6 *5 ：分別骰出5次3d6\
\n ・六版判定　CCb （目標値）：做出成功或失敗的判定\
\n例）CCb 30　CCb 80\
\n ・七版判定　CCx（目標値）\
\n　x：獎勵骰/懲罰骰：Bonus/Penalty Dice (2～n2)。沒有的話可以省略。\
\n　大失敗：Fumble／失敗：Failure／通常成功：Regular success／\
\n　困難成功：Hard success／極限成功：Extreme success／\
\n　大成功：Critical success　\
\n例）CC 30　CC1 50　CCn2 75\
\n・占卜運氣功能\
';
        
        //roll 指令開始於此
        if (trigger == 'r' || trigger == 'ccb' || trigger == 'cc'|| trigger == 'ccn1'|| trigger == 'cc1'|| trigger == 'cc2'|| trigger == 'ccn2' ){        
                  
          if (inputStr.split(msgSplitor).length == 1) return '\
擲骰前請先打r 或cc，後面接像是2d6，1d6+3，2d6+1d3就好。  \
\n詳情請打help\
          ';
          //ccb指令開始於此
       if (trigger == 'ccb') return coc6(mainMsg[1],mainMsg[2]);
          
        //cc指令開始於此
        if (trigger == 'cc') return coc7(mainMsg[1],mainMsg[2]);
        
        //獎懲骰設定於此    
          if (trigger == 'cc1') return coc7bp(mainMsg[1],'1',mainMsg[2]);        
          if (trigger == 'cc2') return coc7bp(mainMsg[1],'2',mainMsg[2]);   
          if (trigger == 'ccn1') return coc7bp(mainMsg[1],'-1',mainMsg[2]);   
          if (trigger == 'ccn2') return coc7bp(mainMsg[1],'-2',mainMsg[2]);   
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
        
        
        if (trigger != 'r') return null;
        
      }

function coc6(chack,text){
          let temp = Dice(100);


          if (text == null ) {
            if (temp == 100) return 'ccb<=' + chack  + ' ' + temp + ' → 啊！大失敗！';
            if (temp <= chack) return 'ccb<=' + chack + ' '  + temp + ' → 成功';
            else return 'ccb<=' + chack  + ' ' + temp + ' → 失敗' ;
          }
          else
    {
            if (temp == 100) return 'ccb<=' + chack + ' ' + temp + ' → 啊！大失敗！；' + text;
            if (temp <= chack) return 'ccb<=' + chack +  ' ' + temp + ' → 成功；' + text;
            else return 'ccb<=' + chack  + ' ' +  temp + ' → 失敗；' + text;
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
            return DiceToCal + ' → ' +countStr;
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
return DiceToCal + ' → ' + countStr;
          
}


        function Dice(diceSided){          
          return Math.floor((Math.random() * diceSided) + 1)
        }              


        function randomReply() {
          let rplyArr = ['你們死定了呃呃呃不要糾結這些……所以是在糾結哪些？', '在澳洲，每過一分鐘就有一隻鴨嘴獸被拔嘴。 \n我到底在共三小。', '嗚噁噁噁噁噁噁，不要隨便叫我。', '幹，你這學不會的豬！', '嘎嘎嘎。', 'wwwwwwwwwwwwwwwww', '為什麼你們每天都可以一直玩；玩就算了還玩我。', '好棒，整點了！咦？不是嗎？', '不要打擾我挖坑！', '好棒，誤點了！', '在南半球，一隻鴨嘴獸拍打他的鰭，他的嘴就會掉下來。 \n我到底在共三小。', '什麼東西你共三小。', '哈哈哈哈哈哈哈哈！', '一直叫，你4不4想拔嘴人家？', '一直叫，你想被淨灘嗎？', '幫主你也敢嘴？'];
          return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
        }
       function randomLuck(TEXT) {
          let rplyArr = ['大吉','吉','中吉','小吉','末吉','中吉','小吉','末吉','吉','中吉','小吉','末吉','吉','中吉','小吉','末吉','中吉','小吉','小吉','末吉','小吉','末吉','中吉','小吉','凶','小凶','沒凶','大凶','很凶'];
          return TEXT[0] + ' ： ' + rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
        }
