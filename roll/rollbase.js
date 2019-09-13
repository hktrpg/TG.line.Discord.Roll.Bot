const math = require('mathjs');
var rply = {
  default: 'on',
  type: 'text',
  text: ''
};

gameName = function () {
  return '基本擲骰'
}

gameType = function () {
  return 'rollbase:hktrpg'
}
prefixs = function () {
  let temp = /^(?=.*\d+d\d+)(?!.*[a-c])(?!.*[e-z])(?!.*(([d]|[+]|[-]|[*]|[/])([d]|[+]|[-]|[*]|[/])))(?!.*(^([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[)])))(?!.*([(][)]))(?!.*([<][<]))(?!.*([>][>]))(?!.*([<][>]))(?!.*([>][<]))(?!.*(\d+[d]+\d+[d])|([)]\d))(?!.*(([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[(])$))(?!.*([@]|[!]|[#]|[$]|[%]|[&]|[_]|[~]|[`]|[']|\.))(?!.*([\u4e00-\u9fa5]))(?!.*([=].*[=]))(?!.*([+]|[-]|[*]|[/])[=])(?!.*[=]([+]|[-]|[*]|[/]|[>]|[<]))(?!.*(\d)[=](\d))(?!.*(d)[(]).*$/ig
  return [
    temp, ,
    /(^[1-9]$)|(^[1-2][0-9]$)|(^[3][0]$)/i, temp
  ]
}



///^(?=.*he)(?!.*da).*$/ig
getHelpMessage = function () {
  return "【基本擲骰】1d100\
  \n 例如輸入(2d6+1)*2　攻撃！\
  \n 會輸出）(2d6+1)*2：攻撃！  (10[5+5]+1)2 = 22\
  \n 如上面一樣,在骰子數字後方隔空白位打字,可以進行發言。\
  \n 5 3D6 ：	分別骰出5次3d6 最多30次\
  \n ((2d6+1)*2)-5/2>=10 支援括號加減乘除及大於小於(>,<,>=,<=)計算\
  \n"
}
initialize = function () {
  return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
  rply.text = '';
  //let result = {};
  switch (true) {
    default:
      return nomalDiceRoller(mainMsg[0], mainMsg[1], mainMsg[2])
  }
}



// //////////////////////////////////////
// ////////////// 擲骰子運算
// //////////////////////////////////////
try {
  function Dice(diceSided) {
    return math.floor((math.random() * diceSided) + 1)
  }

  function sortNumber(a, b) {
    return a - b
  }

  function RollDice(inputStr) {
    // 先把inputStr變成字串（不知道為什麼非這樣不可）
    let comStr = inputStr.toString()
    let finalStr = '['
    let temp = 0
    var totally = 0
    for (let i = 1; i <= comStr.split('d')[0]; i++) {
      temp = Dice(comStr.split('d')[1])
      totally += temp
      finalStr = finalStr + temp + '+'
    }

    finalStr = finalStr.substring(0, finalStr.length - 1) + ']'
    finalStr = finalStr.replace('[', totally + '[')
    return finalStr
  }

  function FunnyDice(diceSided) {
    return math.floor((math.random() * diceSided)) // 猜拳，從0開始
  }

  function BuildDiceCal(inputStr) {

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
      if (tempMatch.toString().split('d')[0] > 200) return '欸欸，不支援200D以上擲骰；哪個時候會骰到兩百次以上？想被淨灘嗎？'
      if (tempMatch.toString().split('d')[1] == 1 || tempMatch.toString().split('d')[1] > 500) return '不支援D1和超過D500的擲骰；想被淨灘嗎？'
      equation = equation.replace(/\d+d\d+/i, BuildRollDice(tempMatch))
    }

    // 計算算式
    let answer = math.eval(equation.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗")
    finalStr = equation + ' = ' + answer

    return finalStr
  }

  function BuildRollDice(inputStr) {
    // 先把inputStr變成字串（不知道為什麼非這樣不可）
    let comStr = inputStr.toString().toLowerCase()
    let finalStr = '('

    for (let i = 1; i <= comStr.split('d')[0]; i++) {
      finalStr = finalStr + Dice(comStr.split('d')[1]) + '+'
    }

    finalStr = finalStr.substring(0, finalStr.length - 1) + ')'
    return finalStr
  }
  // //////////////////////////////////////
  // ////////////// 普通ROLL
  // //////////////////////////////////////
  function nomalDiceRoller(text0, text1, text2) {

    // 首先判斷是否是誤啟動（檢查是否有符合骰子格式）
    // if (inputStr.toLowerCase().match(/\d+d\d+/) == null) return undefined

    // 再來先把第一個分段拆出來，待會判斷是否是複數擲骰
    let mutiOrNot = text0.toLowerCase()

    // 排除小數點
    if (mutiOrNot.toString().match(/\./) != null) return

    // 先定義要輸出的Str
    let finalStr = ''

    // 是複數擲骰喔
    /*let mathcheck =
      /(([d]|[+]|[-]|[*]|[/])([d]|[+]|[-]|[*]|[/]))|(([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[(])$)|(\d+[d]+\d+[d])|([)]\d)|(^([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[)]))|([(][)])|([<][<])|([>][>])/ig
*/

    if (mutiOrNot.toString().match(/\D/i) == null && text1) {
      if (text1.replace(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]/ig, '')) return;
      let test1 = text1.match(/[(]/g) || '';
      let test2 = text1.match(/[)]/g) || '';
      if (test2.length != test1.length) return;
      if (text2 != null) {
        finalStr = text0 + '次擲骰：\n' + text1 + ' ' + text2 + '\n'
      } else {
        finalStr = text0 + '次擲骰：\n' + text1 + '\n'
      }
      if (mutiOrNot > 30) {
        rply.text = '不支援30次以上的複數擲骰。'
        return rply
      }
      for (i = 1; i <= mutiOrNot; i++) {
        let DiceToRoll = text1.toLowerCase()
        if (DiceToRoll.match('d') == null) return

        // 寫出算式
        let equation = DiceToRoll
        while (equation.match(/\d+d\d+/i) != null) {
          let tempMatch = equation.match(/\d+d\d+/i)
          if (tempMatch.toString().split('d')[0] > 500 || tempMatch.toString().split('d')[0] <= 0) return
          if (tempMatch.toString().split('d')[1] <= 1 || tempMatch.toString().split('d')[1] > 1000000) return
          equation = equation.replace(/\d+d\d+/i, RollDice(tempMatch))
        }

        // 計算算式
        let aaa = equation
        aaa = aaa.replace(/\d+[[]/ig, '(')
        aaa = aaa.replace(/]/ig, ')')
        // aaa = aaa.replace(/[[]\d+|]/ig, "")
        let answer = math.eval(aaa.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗").replace('false', '失敗')
        if (equation.match(/[\s\S]{1,400}/g).length > 1) {
          finalStr = finalStr + i + '# ' + ' = ' + answer + '（計算過程太長，僅顯示結果）\n'

        } else {
          finalStr = finalStr + i + '# ' + equation + ' = ' + answer + '\n'
        }
      }

    } else {
      // 一般單次擲骰
      let DiceToRoll = mutiOrNot.toString().toLowerCase()
      DiceToRoll = DiceToRoll.toLowerCase()
      if (DiceToRoll.match('d') == null) return
      if (text0.replace(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]/ig, '')) return;
      let test1 = text0.match(/[(]/g) || '';
      let test2 = text0.match(/[)]/g) || '';
      if (test2.length != test1.length) return;

      //if ((text0.match(/[(]/g) || text0.match(/[)]/g)) && text0.match(/[(]/g).length != text0.match(/[)]/g).length) return;
      // 寫出算式
      let equation = DiceToRoll
      while (equation.match(/\d+d\d+/i) != null) {
        // let totally = 0
        let tempMatch = equation.match(/\d+d\d+/i)
        if (tempMatch.toString().split('d')[0] > 500 || tempMatch.toString().split('d')[0] <= 0) return
        if (tempMatch.toString().split('d')[1] <= 1 || tempMatch.toString().split('d')[1] > 1000000) return
        equation = equation.replace(/\d+d\d+/i, RollDice(tempMatch))
      }

      // 計算算式
      let aaa = equation
      aaa = aaa.replace(/\d+[[]/ig, '(')
      aaa = aaa.replace(/]/ig, ')')
      let answer = math.eval(aaa.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗");

      if (text1 != null) {
        finalStr = text0 + '：' + text1 + '\n' + equation + ' = ' + answer
      } else {
        finalStr = text0 + '\n' + equation + ' = ' + answer
      }
      if (equation.match(/[\s\S]{1,400}/g).length > 1) {
        if (text1 != null) {
          finalStr = text0 + '：' + text1 + '\n' + ' = ' + answer
        } else {
          finalStr = text0 + '\n' + ' = ' + answer
        }
        finalStr = finalStr + '\n（計算過程太長，僅顯示結果）';
      }
    }

    rply.text = finalStr
    return rply
  }
} catch (e) {
  console.log('error: ' + e)
}
module.exports = {
  Dice: Dice,
  sortNumber: sortNumber,
  FunnyDice: FunnyDice,
  BuildDiceCal: BuildDiceCal,
  BuildRollDice: BuildRollDice,
  nomalDiceRoller: nomalDiceRoller,
  rollDiceCommand: rollDiceCommand,
  initialize: initialize,
  getHelpMessage: getHelpMessage,
  prefixs: prefixs,
  gameType: gameType,
  gameName: gameName
};