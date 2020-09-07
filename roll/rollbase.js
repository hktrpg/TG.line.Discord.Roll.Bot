"use strict";
const math = require('mathjs');
const {
  Random,
  nodeCrypto
} = require("random-js");
const random = new Random(nodeCrypto);
//value = random.integer(1, 100);
const regex = /(\d+)d(\d+)(kh|kl|dh|dl|k|)(\d+|)/i;
//var Sided = [];
//Sided[10000] = [];
var variables = {};

var gameName = function () {
  return '基本擲骰'
}

var gameType = function () {
  return 'rollbase:hktrpg'
}
var prefixs = function () {
  const tempregex = /^(?=.*\d+d\d+)(?!.*\d+(l|h))(?!.*(k)$)(?!.*(l|h)(l|h|k|d))(?!.*(k|d)(k|d))(?!.*^[a-z])(?!.*[a-c])(?!.*[e-g])(?!.*[i-j])(?!.*[m-z])(?!.*(([d]|[+]|[-]|[*]|[/])([d]|[+]|[-]|[*]|[/])))(?!.*(^([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[)])))(?!.*([(][)]))(?!.*([<][<]))(?!.*([>][>]))(?!.*([<][>]))(?!.*([>][<]))(?!.*(\d+[d]+\d+[d]([^h|l]))|([)]\d))(?!.*(([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[(])$))(?!.*([@]|[!]|[#]|[$]|[%]|[&]|[_]|[~]|[`]|[']|[?]|\.))(?!.*([\u4e00-\u9fa5]))(?!.*([=].*[=]))(?!.*([+]|[-]|[*]|[/])[=])(?!.*[=]([+]|[-]|[*]|[/]|[>]|[<]))(?!.*(\d)[=](\d))(?!.*([-][>])|([-][<])|([<][-])|([>][-]))(?!.*(d)[(]).*$/ig
  return [{
      first: tempregex,
      second: null
    },
    {
      first: /(^[1-9]$)|(^[1-2][0-9]$)|(^[3][0]$)/i,
      second: tempregex
    }
  ]
}



///^(?=.*he)(?!.*da).*$/ig
const getHelpMessage = function () {
  return "【基本擲骰】1d100(khN|klN|dhN|dlN)\n\
例如輸入(2d6+1)*2　攻撃！\n\
會輸出）(2d6+1)*2：攻撃！  (10[5+5]+1)2 = 22\n\
如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。\n\
5 3D6 ：	分別骰出5次3d6 最多30次\n\
((2d6+1)*2)-5/2>=10 支援括號加減乘除及大於小於(>,<,>=,<=)計算\n\
支援kh|kl|dh|dl，k keep保留，d drop 放棄，h highest最高，l lowest最低\n\
如3d6kh 保留最大的1粒骰，3d6dl2 放棄最小的2粒骰"
}
var initialize = function () {
  return variables;
}

const rollDiceCommand = async function (inputStr, mainMsg) {
  let rply = {
    default: 'on',
    type: 'text',
    text: ''
  };
  rply.text = await nomalDiceRoller(mainMsg[0], mainMsg[1], mainMsg[2])
  return rply;
}



/**
 * 擲骰子運算
 * @param {純數字, 10即骰出1D100} diceSided 
 */

var Dice = async function (diceSided) {
  let result = '';
  //result = math.floor((math.random() * diceSided) + 1)
  result = await random.integer(1, Math.floor(diceSided))
  return result
}

var DiceINT = async function (start, end) {
  let result = '';
  //result = math.floor((math.random() * diceSided) + 1)
  result = await random.integer(start, end)
  return result
}

var sortNumber = async function (a, b) {
  return a - b
}

var RollDice = async function (inputStr) {
  // 先把inputStr變成字串（不知道為什麼非這樣不可）
  //kh kl dh dl
  //kh or khN Keeps highest N
  //kl or klN Keeps lowest N
  //dh or dhN Drops highest N
  //dl or dlN Drops lowest N
  let comStr = inputStr
  //12d5kh5,12,5,kh,5
  let finalStr = '['
  let temp = []
  let temp2 = []
  var totally = 0
  if (!comStr[1] || !comStr[2]) return;

  for (let i = 0; i < comStr[1]; i++) {
    temp[i] = await Dice(comStr[2])
    temp2[i] = temp[i]
  }
  if (comStr[3]) {
    if (comStr[3].match(/^k$/i)) {
      comStr[3] = 'kh'
    }
    //由大至細
    temp2.sort(function (a, b) {
      return b - a
    });
  }
  if (!comStr[4])
    comStr[4] = 1
  switch (comStr[3]) {
    case 'kh': //khN Keeps highest N
      for (let i = 0; i < temp2.length; i++) {
        if (i < comStr[4])
          totally += temp2[i]
      }
      break;
    case 'kl': //klN Keeps lowest N
      for (let i = 0; i < temp2.length; i++) {
        if (i >= temp2.length - comStr[4])
          totally += temp2[i]
      }
      break;
    case 'dh': //Drops highest N
      for (let i = 0; i < temp2.length; i++) {
        if (i >= comStr[4])
          totally += temp2[i]
      }
      break;
    case 'dl': //dlN Drops lowest N
      for (let i = 0; i < temp2.length; i++) {
        if (i < temp2.length - comStr[4])
          totally += temp2[i]
      }
      break;
    default:
      for (let i = 0; i < temp.length; i++) {
        totally += temp[i]
      }
      break;
  }
  //totally += temp
  //finalStr = finalStr + temp + '+'

  finalStr = finalStr + temp + '+';

  if (!comStr[3])
    finalStr = finalStr.replace(/,/ig, '+')
  finalStr = finalStr.substring(0, finalStr.length - 1) + ']'
  finalStr = finalStr.replace('[', totally + '[')
  return finalStr
}

var FunnyDice = async function (diceSided) {
  return await random.integer(0, Math.floor(diceSided)) // 猜拳，從0開始
}

var BuildDiceCal = async function (inputStr) {
  // 首先判斷是否是誤啟動（檢查是否有符合骰子格式）
  if (inputStr.toLowerCase().match(/\d+d\d+/i) == null) return undefined
  // 排除小數點
  if (inputStr.toString().match(/\./) != null) return undefined
  // 先定義要輸出的Str
  let finalStr = ''
  // 一般單次擲骰
  let DiceToRoll = inputStr.toString().toLowerCase()
  if (DiceToRoll.match('d') == null) return undefined
  // 寫出算式
  let equation = DiceToRoll
  while (equation.match(/\d+d\d+/i) != null) {
    let tempMatch = equation.match(/\d+d\d+/i)
    if (tempMatch.toString().split('d')[0] > 200) return
    //不支援200D以上擲骰

    if (tempMatch.toString().split('d')[1] == 1 || tempMatch.toString().split('d')[1] > 500) return;
    equation = equation.replace(/\d+d\d+/i, await BuildRollDice(tempMatch))
  }

  // 計算算式
  let answer = math.eval(equation.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗")
  finalStr = equation + ' = ' + answer

  return finalStr
}

var shuffleTarget = async function (target) {
  return await random.shuffle(target)
}

var BuildRollDice = async function (inputStr) {
  // 先把inputStr變成字串（不知道為什麼非這樣不可）
  let comStr = inputStr.toString().toLowerCase()
  let finalStr = '('

  for (let i = 1; i <= comStr.split('d')[0]; i++) {
    finalStr = finalStr + await Dice(comStr.split('d')[1]) + '+'
  }
  finalStr = finalStr.substring(0, finalStr.length - 1) + ')'
  return finalStr
}

/**
 * 普通ROLL
 * @param {1D100 || 5} text0 
 * @param {文字描述 || 1D100} text1 
 * @param {文字描述} text2 
 */
var nomalDiceRoller = async function (text0, text1, text2) {
  // 首先判斷是否是誤啟動（檢查是否有符合骰子格式）
  // if (inputStr.toLowerCase().match(/\d+d\d+/) == null) return undefined
  // 再來先把第一個分段拆出來，待會判斷是否是複數擲骰
  let mutiOrNot = text0.toLowerCase()
  // 排除小數點
  if (mutiOrNot.toString().match(/\./) != null) return
  // 先定義要輸出的Str
  let finalStr = ''
  let test1 = text0.match(/[(]/g) || '';
  let test2 = text0.match(/[)]/g) || '';
  if (test2.length != test1.length) return;
  //d h k l 
  //for (i = 0; i < mutiOrNot; i++) {
  if (mutiOrNot.toString().match(/\D/i) == null && text1) {
    if (text1.replace(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]|[k]|[h]|[l]/ig, '')) return;
    finalStr = text0 + '次擲骰：\n' + text1 + ' ' + (text2 || '') + '\n'
    for (let i = 0; i < mutiOrNot; i++) {
      finalStr += i + 1 + '# ' + await onetimeroll(text1) + '\n'
    }
  } else {
    if (text0.replace(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]|[k]|[h]|[l]/ig, '')) return;
    finalStr = text0 + '：' + (text1 || '') + '\n'
    finalStr += await onetimeroll(text0)
  }
  return finalStr;
}

// 單次擲骰
async function onetimeroll(text0) {
  let Str = ''
  //let DiceToRoll = mutiOrNot.toString().toLowerCase()
  //DiceToRoll = DiceToRoll.toLowerCase()
  //if (DiceToRoll.match('d') == null) return
  //if (text0.replace(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]|[h]|[k]|[l]/ig, '')) return;
  //if ((text0.match(/[(]/g) || text0.match(/[)]/g)) && text0.match(/[(]/g).length != text0.match(/[)]/g).length) return;
  // 寫出算式
  let equation = text0
  while (equation.match(regex) != null) {
    // let totally = 0
    let tempMatch = equation.match(regex)
    if (tempMatch[1] > 1000 || tempMatch[1] <= 0) return '不支援零顆以下及一千顆骰以上'
    if (tempMatch[2] < 1 || tempMatch[2] > 9000000000000000) return '不支援一以下及九千兆以上'
    equation = equation.replace(regex, await RollDice(tempMatch))
  }
  // 計算算式
  let aaa = equation
  aaa = aaa.replace(/\[.+?\]/ig, '')
  let answer = math.eval(aaa.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗");
  if (equation.match(/[\s\S]{1,250}/g).length > 1) {
    Str = answer + '（計算過程太長，僅顯示結果）';
  } else {
    Str = equation + ' = ' + answer
  }
  return Str
}
module.exports = {
  Dice: Dice,
  sortNumber: sortNumber,
  FunnyDice: FunnyDice,
  BuildDiceCal: BuildDiceCal,
  BuildRollDice: BuildRollDice,
  nomalDiceRoller: nomalDiceRoller,
  DiceINT: DiceINT,
  shuffleTarget: shuffleTarget,
  rollDiceCommand: rollDiceCommand,
  initialize: initialize,
  getHelpMessage: getHelpMessage,
  prefixs: prefixs,
  gameType: gameType,
  gameName: gameName
};