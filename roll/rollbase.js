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
  MAX_DICE_SIDES: 90000000,    // 最大骰子面數
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

// 骰子表達式定義
const DICE_REGEX = {
  // 基本骰子表達式: XdY 可選擇性地帶有 kh/kl/dh/dl/k 和數字修飾符
  // 分組說明:
  // 1 - 骰子數量 (X)
  // 2 - 骰子面數 (Y)
  // 3 - 修飾符類型 (kh,kl,dh,dl,k)
  // 4 - 修飾符數值 (可為空)
  BASIC: /(\d+)d(\d+)(kh|kl|dh|dl|k|)(\d+|)/i,

  // 簡單的 d 表達式檢測
  SIMPLE: /\d+d\d+/i,

  // 數字與運算符檢測
  VALID_CHARS: /[\d+\-*\/()d><khl=]/i,
  VALID_CHARS_PATTERN: /\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]|[k]|[h]|[l]/ig,

  // 小數點檢測
  DECIMAL_POINT: /\./,

  // 括號檢查正則
  PARENTHESES: {
    OPEN: /[(]/g,
    CLOSE: /[)]/g
  },

  // 非數字檢測
  NON_DIGIT: /\D/i
};

//value = random.integer(1, 100);
//let Sided = [];
//Sided[10000] = [];
const variables = {};

/**
 * 回傳遊戲名稱
 * @returns {string} 遊戲名稱
 */
const gameName = function () {
  return '【基本擲骰】.z xDy kl dh'
}

/**
 * 回傳遊戲類型
 * @returns {string} 遊戲類型標識
 */
const gameType = function () {
  return 'dice:rollbase:hktrpg'
}

// 正則表達式定義區塊
// 骰子表達式 - 必須包含 "數字d數字" 格式
const DICE_PATTERN = DICE_REGEX.SIMPLE;

// 無效格式檢查 - 各種不合法的骰子表示法
const INVALID_PATTERNS = {
  // 骰子後接 l 或 h 沒有數字
  UNSUPPORTED_SUFFIX: /\d+(l|h)(?!\d)/i,
  // 單獨的 k 在結尾
  LONELY_K: /(k)$/i,
  // 無效的修飾詞組合
  INVALID_MODIFIER_PAIRS: [
    /(l|h)(l|h|k|d)/i,  // 如 hl, hk 等
    /(k|d)(k|d)/i       // 如 kk, dd 等
  ],
  // 非法開頭字符
  INVALID_START: /^[a-z]/i,
  // 非法字母
  INVALID_LETTERS: [
    /[a-c]/i,
    /[e-g]/i,
    /[i-j]/i,
    /[m-z]/i
  ],
  // 連續的運算符
  CONSECUTIVE_OPERATORS: /(([d+\-*/])([d+\-*/]))/i,
  // 以運算符開頭
  STARTS_WITH_OPERATOR: /^([d+\-*/]|[<>]|[=\)])/i,
  // 括號問題
  BRACKET_ISSUES: [
    /\(\)/i,     // 空括號
    /<<|>>|<>|></i // 連續比較符號
  ],
  // 非法的骰子組合
  INVALID_DICE_COMBO: /\d+d\d+d([^hl])|[)]\d/i,
  // 以運算符結尾
  ENDS_WITH_OPERATOR: /([d+\-*/]|[<>=\(])$/i,
  // 特殊字符
  SPECIAL_CHARS: /[@!#$%&_~`'?\.]/i,
  // 中文字符
  CHINESE_CHARS: /[\u4e00-\u9fa5]/i,
  // 等號相關問題
  EQUALS_ISSUES: [
    /=[^+\-*/><\d]/i,   // 等號後面接非法字符
    /[+\-*/]=/i,        // 運算符後直接接等號
    /=[+\-*/><]/i,      // 等號後直接接運算符
    /\d=\d/i            // 數字=數字，沒有運算符
  ],
  // 箭頭符號問題
  ARROW_ISSUES: /-[><]|[><]-/i,
  // d後接括號
  D_BRACKET: /d\(/i
};

// 組合成完整的表達式檢查
const TEMP_REGEX = new RegExp(
  `^(?=.*${DICE_PATTERN.source})` +
  `(?!.*${INVALID_PATTERNS.UNSUPPORTED_SUFFIX.source})` +
  `(?!.*${INVALID_PATTERNS.LONELY_K.source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_MODIFIER_PAIRS[0].source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_MODIFIER_PAIRS[1].source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_START.source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_LETTERS[0].source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_LETTERS[1].source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_LETTERS[2].source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_LETTERS[3].source})` +
  `(?!.*${INVALID_PATTERNS.CONSECUTIVE_OPERATORS.source})` +
  `(?!.*${INVALID_PATTERNS.STARTS_WITH_OPERATOR.source})` +
  `(?!.*${INVALID_PATTERNS.BRACKET_ISSUES[0].source})` +
  `(?!.*${INVALID_PATTERNS.BRACKET_ISSUES[1].source})` +
  `(?!.*${INVALID_PATTERNS.INVALID_DICE_COMBO.source})` +
  `(?!.*${INVALID_PATTERNS.ENDS_WITH_OPERATOR.source})` +
  `(?!.*${INVALID_PATTERNS.SPECIAL_CHARS.source})` +
  `(?!.*${INVALID_PATTERNS.CHINESE_CHARS.source})` +
  `(?!.*${INVALID_PATTERNS.EQUALS_ISSUES[0].source})` +
  `(?!.*${INVALID_PATTERNS.EQUALS_ISSUES[1].source})` +
  `(?!.*${INVALID_PATTERNS.EQUALS_ISSUES[2].source})` +
  `(?!.*${INVALID_PATTERNS.EQUALS_ISSUES[3].source})` +
  `(?!.*${INVALID_PATTERNS.ARROW_ISSUES.source})` +
  `(?!.*${INVALID_PATTERNS.D_BRACKET.source})` +
  `.*$`, 'i'
);

/**
 * 前綴判斷
 * @returns {Array} 前綴模式陣列
 */
const prefixs = function () {
  return [{
    first: TEMP_REGEX,
    second: null
  },
  {
    first: /(^[1-9]$)|(^[1-2][0-9]$)|(^[3][0]$)/i, // 1-30的數字
    second: TEMP_REGEX
  },
  {
    first: /^.rr$/i, // .rr 指令
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

/**
 * 初始化函數
 * @returns {Object} 變數物件
 */
const initialize = function () {
  return variables;
}

/**
 * 處理擲骰指令
 * @param {Object} options - 輸入參數
 * @param {Array} options.mainMsg - 主要訊息陣列
 * @param {string} options.inputStr - 輸入字串
 * @returns {Object} 回覆物件
 */
const rollDiceCommand = function ({
  mainMsg,
  inputStr
}) {
  let reply = {
    default: 'on',
    type: 'text',
    text: ''
  };
  switch (true) {
    case /^\.rr$/i.test(mainMsg[0]):
      {
        try {
          const roll = new DiceRoll(inputStr.replace(/^[.]rr\s+/i, ''));
          reply.text = roll.output;
        } catch (err) {
          reply.text += `${err.name}  \n ${err.message}`;
          reply.text += `\n 擲骰說明 https://dice-roller.github.io/documentation/guide/notation/dice.html#standard-d-n`
        }

        return reply;
      }

    default:
      try {
        reply.text = nomalDiceRoller(mainMsg[0], mainMsg[1], mainMsg[2]);
        return reply;
      } catch (error) {
        return reply;
      }
  }
}

/**
 * 擲骰子運算
 * @param {number} diceSided - 骰子面數
 * @returns {number} 擲骰結果
 */
const Dice = function (diceSided) {
  return random.integer(1, Math.floor(diceSided));
}

/**
 * 在指定範圍內擲骰
 * @param {number} start - 起始值
 * @param {number} end - 結束值
 * @returns {number} 擲骰結果
 */
const DiceINT = function (start, end) {
  let points = [Math.floor(start), Math.floor(end)];
  points.sort(function (a, b) {
    return a - b;
  });
  return random.integer(points[0], points[1]);
}

/**
 * 數字排序函數
 * @param {number} a - 第一個數字
 * @param {number} b - 第二個數字
 * @returns {number} 排序結果
 */
const sortNumber = function (a, b) {
  return a - b;
}

/**
 * 擲骰並處理保留/丟棄修飾符
 * @param {Array} inputStr - 骰子匹配結果
 * @returns {string} 處理後的擲骰字串
 */
const RollDice = function (inputStr) {
  // 先把inputStr變成字串（不知道為什麼非這樣不可）
  //kh kl dh dl
  //kh or khN Keeps highest N
  //kl or klN Keeps lowest N
  //dh or dhN Drops highest N
  //dl or dlN Drops lowest N
  let commandString = inputStr;
  //12d5kh5,12,5,kh,5
  let finalString = '[';
  let diceResults = [];
  let sortedResults = [];
  let totalValue = 0;
  if (!commandString[1] || !commandString[2]) return;

  for (let i = 0; i < commandString[1]; i++) {
    diceResults[i] = Dice(commandString[2]);
    sortedResults[i] = diceResults[i];
  }
  if (commandString[3]) {
    if (commandString[3].match(/^k$/i)) {
      commandString[3] = 'kh';
    }
    //由大至細
    sortedResults.sort(function (a, b) {
      return b - a;
    });
  }
  if (!commandString[4])
    commandString[4] = 1;
  switch (commandString[3].toLowerCase()) {
    case 'kh': //khN Keeps highest N
      for (let i = 0; i < sortedResults.length; i++) {
        if (i < commandString[4])
          totalValue += sortedResults[i];
      }
      break;
    case 'kl': //klN Keeps lowest N
      for (let i = 0; i < sortedResults.length; i++) {
        if (i >= sortedResults.length - commandString[4])
          totalValue += sortedResults[i];
      }
      break;
    case 'dh': //Drops highest N
      for (let i = 0; i < sortedResults.length; i++) {
        if (i >= commandString[4])
          totalValue += sortedResults[i];
      }
      break;
    case 'dl': //dlN Drops lowest N
      for (let i = 0; i < sortedResults.length; i++) {
        if (i < sortedResults.length - commandString[4])
          totalValue += sortedResults[i];
      }
      break;
    default:
      for (let i = 0; i < diceResults.length; i++) {
        totalValue += diceResults[i];
      }
      break;
  }
  //totalValue += diceResults
  //finalString = finalString + diceResults + '+'

  finalString = finalString + diceResults + '+';

  if (!commandString[3])
    finalString = finalString.replace(/,/ig, '+');
  finalString = finalString.substring(0, finalString.length - 1) + ']';
  finalString = finalString.replace('[', totalValue + '[');
  return finalString;
}

/**
 * 從零開始的擲骰函數（用於猜拳）
 * @param {number} diceSided - 骰子面數
 * @returns {number} 擲骰結果
 */
const FunnyDice = function (diceSided) {
  return random.integer(0, Math.floor(diceSided)); // 猜拳，從0開始
}

/**
 * 目標陣列洗牌
 * @param {Array} target - 目標陣列
 * @returns {Array} 洗牌後的陣列
 */
const shuffleTarget = function (target) {
  return random.shuffle(target);
}

/**
 * 建立骰子計算式
 * @param {string} inputStr - 輸入字串
 * @returns {string|undefined} 計算結果字串或 undefined（錯誤）
 */
const BuildDiceCal = function (inputStr) {
  // 首先判斷是否是誤啟動（檢查是否有符合骰子格式）
  if (inputStr.toLowerCase().match(DICE_REGEX.SIMPLE) == null) return undefined;
  // 排除小數點
  if (inputStr.toString().match(DICE_REGEX.DECIMAL_POINT) != null) return undefined;
  // 先定義要輸出的字串
  let finalString = '';
  // 一般單次擲骰
  let diceToRoll = inputStr.toString().toLowerCase();
  if (diceToRoll.match('d') == null) return undefined;
  // 寫出算式
  let equation = diceToRoll;
  while (equation.match(DICE_REGEX.SIMPLE) != null) {
    let tempMatch = equation.match(DICE_REGEX.SIMPLE);
    if (tempMatch.toString().split('d')[0] > DICE_LIMITS.MAX_EQUATION_DICE_COUNT) return;
    //不支援200D以上擲骰

    if (tempMatch.toString().split('d')[1] == 1 || tempMatch.toString().split('d')[1] > DICE_LIMITS.MAX_EQUATION_DICE_SIDES) return;
    equation = equation.replace(DICE_REGEX.SIMPLE, BuildRollDice(tempMatch));
  }

  // 計算算式
  let answer = math.evaluate(equation.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗");
  finalString = equation + ' = ' + answer;

  return finalString;
}

/**
 * 建立擲骰模式
 * @param {string} inputStr - 輸入字串
 * @returns {string} 骰子結果字串
 */
const BuildRollDice = function (inputStr) {
  // 先把inputStr變成字串（不知道為什麼非這樣不可）
  let commandString = inputStr.toString().toLowerCase();
  let finalString = '(';

  for (let i = 1; i <= commandString.split('d')[0]; i++) {
    finalString = finalString + Dice(commandString.split('d')[1]) + '+';
  }
  finalString = finalString.substring(0, finalString.length - 1) + ')';
  return finalString;
}

/**
 * 普通擲骰處理
 * @param {string} text0 - 第一參數，可能是骰子表達式或次數
 * @param {string} text1 - 第二參數，可能是描述文字或骰子表達式
 * @param {string} text2 - 第三參數，通常是描述文字
 * @returns {string} 擲骰結果字串
 */
const nomalDiceRoller = function (text0, text1, text2) {
  // 首先判斷是否是誤啟動（檢查是否有符合骰子格式）
  // if (inputStr.toLowerCase().match(/\d+d\d+/) == null) return undefined
  // 再來先把第一個分段拆出來，待會判斷是否是複數擲骰
  let multiOrNot = text0.toLowerCase();
  // 排除小數點
  if (multiOrNot.toString().match(DICE_REGEX.DECIMAL_POINT) != null) return;
  // 先定義要輸出的字串
  let finalString = '';
  let openParenCount = text0.match(DICE_REGEX.PARENTHESES.OPEN) || '';
  let closeParenCount = text0.match(DICE_REGEX.PARENTHESES.CLOSE) || '';
  if (closeParenCount.length != openParenCount.length) return;
  //d h k l 
  //for (i = 0; i < multiOrNot; i++) {
  if (multiOrNot.toString().match(DICE_REGEX.NON_DIGIT) == null && text1) {
    // 純數字，表示多次擲骰
    if (text1.replace(DICE_REGEX.VALID_CHARS_PATTERN, '')) return;
    finalString = text0 + '次擲骰：\n' + text1 + ' ' + (text2 || '') + '\n';
    for (let i = 0; i < multiOrNot; i++) {
      let answer = oneTimeRoll(text1);
      if (answer)
        finalString += i + 1 + '# ' + answer + '\n';
      else return;
    }
  } else {
    // 非純數字，一般骰子表達式
    if (text0.replace(DICE_REGEX.VALID_CHARS_PATTERN, '')) return;
    finalString = text0 + '：' + (text1 || '') + '\n';
    let answer = oneTimeRoll(text0);
    if (answer)
      finalString += answer;
    else return;
  }
  return finalString.replace(/[*]/g, ' * ');
}

/**
 * 單次擲骰處理
 * @param {string} text0 - 骰子表達式
 * @returns {string} 擲骰結果字串，或空字串（錯誤）
 */
function oneTimeRoll(text0) {
  try {
    let resultString = '';
    // 寫出算式
    let equation = text0;
    while (equation.match(DICE_REGEX.BASIC) != null) {
      // let totally = 0
      let tempMatch = equation.match(DICE_REGEX.BASIC);
      if (tempMatch[1] > DICE_LIMITS.MAX_DICE_COUNT || tempMatch[1] < DICE_LIMITS.MIN_DICE_COUNT) return ERROR_MESSAGES.DICE_COUNT_LIMIT;
      if (tempMatch[2] < DICE_LIMITS.MIN_DICE_SIDES || tempMatch[2] > DICE_LIMITS.MAX_DICE_SIDES) return ERROR_MESSAGES.DICE_SIDES_LIMIT;
      equation = equation.replace(DICE_REGEX.BASIC, RollDice(tempMatch));
    }
    // 計算算式
    let processedEquation = equation;
    processedEquation = processedEquation.replace(/\[.+?\]/ig, '');
    let answer = math.evaluate(processedEquation.toString()).toString().replace(/true/i, "成功").replace(/false/i, "失敗");
    // 使用動態生成的正則表達式
    const displayLengthRegex = new RegExp(`[\\s\\S]{1,${DICE_LIMITS.MAX_DISPLAY_LENGTH}}`, 'g');
    if (equation.match(displayLengthRegex).length > 1) {
      resultString = answer + ERROR_MESSAGES.DISPLAY_LIMIT;
    } else {
      resultString = equation + ' = ' + answer;
    }
    return resultString;
  } catch (error) {
    console.error('rollbase error: oneTimeRoll - inputstr', text0);
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