"use strict";
const math = require('mathjs');
const {
  Random,
  nodeCrypto
} = require("random-js");
const { DiceRoller, DiceRoll } = require('@dice-roller/rpg-dice-roller');
const random = new Random(nodeCrypto);
const { SlashCommandBuilder } = require('discord.js');

// 常數定義區塊
const DICE_LIMITS = {
  MAX_DICE_COUNT: 1000,        // 最大骰子數量
  MIN_DICE_COUNT: 1,           // 最小骰子數量
  MAX_DICE_SIDES: 90000000, // 最大骰子面數
  MIN_DICE_SIDES: 1,           // 最小骰子面數
  MAX_EQUATION_DICE_COUNT: 200,// 算式中最大骰子數量
  MAX_EQUATION_DICE_SIDES: 500,// 算式中最大骰子面數
  MAX_ROLL_TIMES: 30,          // 最大擲骰次數
  MAX_DISPLAY_LENGTH: 250      // 最大顯示長度
};

// 錯誤訊息常數
const ERROR_MESSAGES = {
  DICE_COUNT_LIMIT: `不支援${DICE_LIMITS.MIN_DICE_COUNT - 1}顆以下及${DICE_LIMITS.MAX_DICE_COUNT}顆以上骰子`,
  DICE_SIDES_LIMIT: `不支援${DICE_LIMITS.MIN_DICE_SIDES - 1}以下及${DICE_LIMITS.MAX_DICE_SIDES}以上面數`,
  DISPLAY_LIMIT: '（計算過程太長，僅顯示結果）'
};

// 基本表達式定義
const BASIC_ROLL_REGEX = /(\d+)d(\d+)(kh|kl|dh|dl|k|)(\d+|)/i;

//value = random.integer(1, 100);
//let Sided = [];
//Sided[10000] = [];
const variables = {};

const gameName = function () {
  return '【基本擲骰】.z xDy kl dh'
}

const gameType = function () {
  return 'dice:rollbase:hktrpg'
}
const TEMP_REGEX = /^(?=.*\d+d\d+)(?!.*\d+(l|h))(?!.*(k)$)(?!.*(l|h)(l|h|k|d))(?!.*(k|d)(k|d))(?!.*^[a-z])(?!.*[a-c])(?!.*[e-g])(?!.*[i-j])(?!.*[m-z])(?!.*(([d]|[+]|[-]|[*]|[/])([d]|[+]|[-]|[*]|[/])))(?!.*(^([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[)])))(?!.*([(][)]))(?!.*([<][<]))(?!.*([>][>]))(?!.*([<][>]))(?!.*([>][<]))(?!.*(\d+[d]+\d+[d]([^h|l]))|([)]\d))(?!.*(([d]|[+]|[-]|[*]|[/]|[<]|[>]|[=]|[(])$))(?!.*([@]|[!]|[#]|[$]|[%]|[&]|[_]|[~]|[`]|[']|[?]|\.))(?!.*([\u4e00-\u9fa5]))(?!.*([=].*[=]))(?!.*([+]|[-]|[*]|[/])[=])(?!.*[=]([+]|[-]|[*]|[/]|[>]|[<]))(?!.*(\d)[=](\d))(?!.*([-][>])|([-][<])|([<][-])|([>][-]))(?!.*(d)[(]).*$/ig
const prefixs = function () {
  return [{
    first: TEMP_REGEX,
    second: null
  },
  {
    first: /(^[1-9]$)|(^[1-2][0-9]$)|(^[3][0]$)/i,
    second: TEMP_REGEX
  },
  {
    first: /^.rr$/i,
    second: null
  }
  ]
}



///^(?=.*he)(?!.*da).*$/ig
const getHelpMessage = function () {
  // 使用函數而非樣板字符串，確保每次調用都會獲取最新的常數值
  const helpText = `【🎲基本擲骰系統】
╭────── 🎯基本格式 ──────
│ • [骰子]d[面數][運算符][數值]
│ • 可在指令後方空格加入描述文字
│
├────── 🔢進階運算 ──────
│ 數學運算:
│ 　• 支援 + - * / ( )
│ 　• 支援 > < >= <=
│ 　例: ((2d6+1)*2)-5/2>=10
│
├────── ✨特殊擲骰 ──────
│ 多次擲骰:
│ 　• [次數] [擲骰指令]
│ 　• 最多${DICE_LIMITS.MAX_ROLL_TIMES}次
│ 　例: 5 3D6
│
│ 保留/放棄骰值:
│ 　• kh[N] - 保留最高N個
│ 　• kl[N] - 保留最低N個
│ 　• dh[N] - 放棄最高N個
│ 　• dl[N] - 放棄最低N個
│
├────── 📝範例指令 ──────
│ • (2d6+1)*2 攻撃！
│ 　結果：(10[5+5]+1)2 = 22
│
│ • 3d6kh1
│ 　保留最高1顆
│
│ • 3d6dl2
│ 　放棄最低2顆
╰──────────────`;

  return helpText;
}
const initialize = function () {
  return variables;
}

const rollDiceCommand = function ({
  mainMsg,
  inputStr
}) {
  let rply = {
    default: 'on',
    type: 'text',
    text: ''
  };
  switch (true) {
    case /^\.rr$/i.test(mainMsg[0]):
      {
        try {
          const roll = new DiceRoll(inputStr.replace(/^[.]rr\s+/i, ''));
          rply.text = roll.output;
        } catch (err) {
          rply.text += `${err.name}  \n ${err.message}`;
          rply.text += `\n 擲骰說明 https://dice-roller.github.io/documentation/guide/notation/dice.html#standard-d-n`
        }

        return rply;
      }

    default:
      try {
        rply.text = nomalDiceRoller(mainMsg[0], mainMsg[1], mainMsg[2]);
        return rply;
      } catch (error) {
        return rply;
      }
  }

}



/**
 * 擲骰子運算
 * @param {純數字, 10即骰出1D100} diceSided 
 */

const Dice = function (diceSided) {
  let result = '';
  result = random.integer(1, Math.floor(diceSided))
  return result
}

const DiceINT = function (start, end) {
  let result = '';
  let points = [Math.floor(start), Math.floor(end)]
  points.sort(function (a, b) {
    return a - b
  });
  result = random.integer(points[0], points[1]);
  return result
}

const sortNumber = function (a, b) {
  return a - b
}

const RollDice = function (inputStr) {
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
  let totally = 0
  if (!comStr[1] || !comStr[2]) return;

  for (let i = 0; i < comStr[1]; i++) {
    temp[i] = Dice(comStr[2])
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
  switch (comStr[3].toLowerCase()) {
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

const FunnyDice = function (diceSided) {
  return random.integer(0, Math.floor(diceSided)) // 猜拳，從0開始
}

const BuildDiceCal = function (inputStr) {
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
    if (tempMatch.toString().split('d')[0] > DICE_LIMITS.MAX_EQUATION_DICE_COUNT) return
    //不支援200D以上擲骰

    if (tempMatch.toString().split('d')[1] == 1 || tempMatch.toString().split('d')[1] > DICE_LIMITS.MAX_EQUATION_DICE_SIDES) return;
    equation = equation.replace(/\d+d\d+/i, BuildRollDice(tempMatch))
  }

  // 計算算式
  let answer = math.evaluate(equation.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗")
  finalStr = equation + ' = ' + answer

  return finalStr
}

const shuffleTarget = function (target) {
  return random.shuffle(target)
}

const BuildRollDice = function (inputStr) {
  // 先把inputStr變成字串（不知道為什麼非這樣不可）
  let comStr = inputStr.toString().toLowerCase()
  let finalStr = '('

  for (let i = 1; i <= comStr.split('d')[0]; i++) {
    finalStr = finalStr + Dice(comStr.split('d')[1]) + '+'
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
const nomalDiceRoller = function (text0, text1, text2) {
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
      let answer = onetimeroll(text1)
      if (answer)
        finalStr += i + 1 + '# ' + answer + '\n'
      else return;
    }
  } else {
    if (text0.replace(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]|[k]|[h]|[l]/ig, '')) return;
    finalStr = text0 + '：' + (text1 || '') + '\n'
    let answer = onetimeroll(text0)
    if (answer)
      finalStr += answer;
    else return;

  }
  return finalStr.replace(/[*]/g, ' * ');
}

// 單次擲骰
function onetimeroll(text0) {
  try {
    let Str = ''
    // 寫出算式
    let equation = text0
    while (equation.match(BASIC_ROLL_REGEX) != null) {
      // let totally = 0
      let tempMatch = equation.match(BASIC_ROLL_REGEX)
      if (tempMatch[1] > DICE_LIMITS.MAX_DICE_COUNT || tempMatch[1] < DICE_LIMITS.MIN_DICE_COUNT) return ERROR_MESSAGES.DICE_COUNT_LIMIT;
      if (tempMatch[2] < DICE_LIMITS.MIN_DICE_SIDES || tempMatch[2] > DICE_LIMITS.MAX_DICE_SIDES) return ERROR_MESSAGES.DICE_SIDES_LIMIT;
      equation = equation.replace(BASIC_ROLL_REGEX, RollDice(tempMatch))
    }
    // 計算算式
    let aaa = equation
    aaa = aaa.replace(/\[.+?\]/ig, '')
    let answer = math.evaluate(aaa.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗");
    // 使用動態生成的正則表達式
    const displayLengthRegex = new RegExp(`[\\s\\S]{1,${DICE_LIMITS.MAX_DISPLAY_LENGTH}}`, 'g');
    if (equation.match(displayLengthRegex).length > 1) {
      Str = answer + ERROR_MESSAGES.DISPLAY_LIMIT;
    } else {
      Str = equation + ' = ' + answer
    }
    return Str;
  } catch (error) {
    console.error('rollbase error: onetimeroll - inputstr', text0)
    return '';
  }
}
const discordCommand = [
  {
    data: new SlashCommandBuilder()
      .setName('hk')
      .setDescription('最基本指令模式')
      .addStringOption(option => option.setName('text').setDescription('輸入平日的HKTRPG文字指令').setRequired(true)),
    async execute(interaction) {
      const text = interaction.options.getString('text')
      return `${text}`
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('rr')
      .setDescription('使用RPG Dice Roller擲骰')
      .addStringOption(option =>
        option.setName('notation')
          .setDescription(' 例如: 2d(1*10), 1d(1+2+3)')
          .setRequired(true)),
    async execute(interaction) {
      const notation = interaction.options.getString('notation');
      try {
        const roll = new DiceRoll(notation);
        await interaction.reply(roll.output);
      } catch (err) {
        await interaction.reply({
          content: `${err.name}\n${err.message}\n擲骰說明 https://dice-roller.github.io/documentation/guide/notation/dice.html#standard-d-n`,
          ephemeral: true
        });
      }
    }
  }
];
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
  gameName: gameName,
  discordCommand
};