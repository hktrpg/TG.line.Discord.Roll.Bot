"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var variables = {};

var _require = require('@discordjs/builders'),
    SlashCommandBuilder = _require.SlashCommandBuilder;

var gameName = function gameName() {
  return '【選擇叢書】';
};

var gameType = function gameType() {
  return 'StoryTeller:Funny:hktrpg';
};

var prefixs = function prefixs() {
  //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
  //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
  //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
  ///^(?=.*he)(?!.*da).*$/ig
  return [{
    first: /^\.ST$/i,
    second: null
  }];
};

var getHelpMessage = function getHelpMessage() {
  return "\u3010\u9078\u64C7\u53E2\u66F8\u3011\n\u9019\u88E1\u662F\u66F8\u672C\u7684\u4E16\u754C\uFF0C\u4F60\u53EF\u4EE5\u9078\u64C7\u4E00\u672C\u66F8\uFF0C\u4E26\u4E14\u958B\u5C55\u5B83\u7684\u5167\u5BB9\u3002\n\u8F38\u5165 .ST bothelp - \u986F\u793A\u8AAA\u660E\n\u8F38\u5165 .ST start - \u958B\u59CB\u904A\u6232\n\u8F38\u5165 .ST end - \u7D50\u675F\u904A\u6232\n\u8F38\u5165 .ST book - \u9078\u64C7\u66F8\u672C\n\u8F38\u5165 .ST setting - \u8A2D\u5B9A\u904A\u6232\n-------\n\u8F38\u5165 .StoryMaker create - \u5275\u5EFA\u6545\u4E8B\n\u8F38\u5165 .StoryMaker delete - \u522A\u9664\u6545\u4E8B\n\u8F38\u5165 .StoryMaker list - \u5217\u51FA\u6545\u4E8B\n\u8F38\u5165 .StoryMaker edit - \u7DE8\u8F2F\u6545\u4E8B\n\u8F38\u5165 .StoryMaker help - \u6545\u4E8B\u8AAA\u660E\n-------\n\n";
};

var initialize = function initialize() {
  return variables;
};

var rollDiceCommand = function rollDiceCommand(_ref) {
  var inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount, rply;
  return regeneratorRuntime.async(function rollDiceCommand$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          inputStr = _ref.inputStr, mainMsg = _ref.mainMsg, groupid = _ref.groupid, userid = _ref.userid, userrole = _ref.userrole, botname = _ref.botname, displayname = _ref.displayname, channelid = _ref.channelid, displaynameDiscord = _ref.displaynameDiscord, membercount = _ref.membercount;
          rply = {
            "default": 'on',
            type: 'text',
            text: ''
          };
          _context.t0 = true;
          _context.next = _context.t0 === (/^help$/i.test(mainMsg[1]) || !mainMsg[1]) ? 5 : _context.t0 === /^\d+$/i.test(mainMsg[1]) ? 8 : _context.t0 === /^\S/.test(mainMsg[1] || '') ? 10 : 12;
          break;

        case 5:
          rply.text = this.getHelpMessage();
          rply.quotes = true;
          return _context.abrupt("return", rply);

        case 8:
          rply.text = 'Demo' + mainMsg[1] + inputStr + groupid + userid + userrole + botname + displayname + channelid + displaynameDiscord + membercount;
          return _context.abrupt("return", rply);

        case 10:
          rply.text = 'Demo';
          return _context.abrupt("return", rply);

        case 12:
          return _context.abrupt("break", 13);

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, this);
};

var discordCommand = [];
module.exports = {
  rollDiceCommand: rollDiceCommand,
  initialize: initialize,
  getHelpMessage: getHelpMessage,
  prefixs: prefixs,
  gameType: gameType,
  gameName: gameName,
  discordCommand: discordCommand
};
/**
{show: XXXX} 顯示某變數
{ask: XXXX} 開啓可以輸入變數
{cal: Var 算式+-/*} 計算變數
{title} 標題
{content} 內容
{MAX 10} ? 最大可以按的次數
{time: XXYYDD HH:MM} <--- 顯示時間
{image: link=XXXX title=XXX content=XXX } 顯示圖片
輸入格式 
=====================
#setting
{cal: hp 100}
{cal: mp 20}
{cal: name none}
=====================
#1
{title} 這是標題(可留空)
{image:} 這是內容
{content} {ask: name} 你現在的HP是{show: HP}這是內容 現在可以輸入名字: .st set name [名字]
{choice1} 選項1 {goto: #2} {cal: HP +1} {cal: SAN -2} {cal: MP *2}
{choice2} 選項2 {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice3} 選項3 {goto: #end} 
=====================
#2
{title} 這是標題(可留空)
{content} 這是內容
{choice2} 選項2 {if: HP >=10} {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}
{choice3} 選項3 {goto: #end} 
=====================
#end
{title} 這是標題(可留空)
{content} 這是內容 {show: HP} {show: MP} {show: varA}

=====================
 */

var input = "#setting\n{cal: hp 100}\n{cal: mp 20}\n{cal: name none}\n#1\n{title:\u9019\u662F\u6A19\u984C(\u53EF\u7559\u7A7A)} \n{image:} \u9019\u662F\u5167\u5BB9\n{content} {ask: name} \u4F60\u73FE\u5728\u7684HP\u662F{show: HP}\u9019\u662F\u5167\u5BB9 \u73FE\u5728\u53EF\u4EE5\u8F38\u5165\u540D\u5B57: .st set name [\u540D\u5B57]\n{choice} \u9078\u98051 {goto: #2} {cal: HP +1} {cal: SAN -2} {cal: MP *2}\n{choice} \u9078\u98052 {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}\n{choice} \u9078\u98053 {goto: #end}\n#2\n{title:\u9019\u662F\u6A19\u984C(\u53EF\u7559\u7A7A)} \n{content} \u9019\u662F\u5167\u5BB9\n{choice} \u9078\u98052 {if: HP >=10} {goto: #3} {cal: varA +1} {cal: varA -2} {cal: varA *2}\n{choice} \u9078\u98053 {goto: #end}\n#end\n{title:\u9019\u662F\u6A19\u984C(\u53EF\u7559\u7A7A)} \n{content} \u9019\u662F\u5167\u5BB9 {show: HP} {show: MP} {show: varA}";
var lines = input.split('\n');
var data = [];
var currentBlock = {};

for (var i = 0; i < lines.length; i++) {
  var line = lines[i];

  if (line.startsWith('#')) {
    if (currentBlock.id) {
      data.push(currentBlock);
    }

    currentBlock = {
      id: line.slice(1),
      other: [],
      choices: [],
      content: {}
    };
  } else {
    var _parseLine = parseLine(line),
        _parseLine2 = _slicedToArray(_parseLine, 2),
        type = _parseLine2[0],
        value = _parseLine2[1];

    console.log('type', type, value);
    if (!value) continue;

    if (type === 'other') {
      currentBlock.other.push(value);
    } else if (type === 'choice') {
      //console.log('choice block', value)
      currentBlock.choices.push(value);
    } else if (type === 'content') {
      //console.log('choice block', value)
      currentBlock.content = value;
    }
  }
}

if (currentBlock.id) {
  data.push(currentBlock);
}

console.log('rusult: ', data, JSON.stringify(data, null, 2));

function parseLine(line) {
  // console.log('line', line)
  //console.log('/xx', line.slice(1, -1))
  var linePurpose = line.match(/\{(.*?)\}/); // console.log('linePurpose', linePurpose)

  if (linePurpose[1].match(/choice/i)) {
    line = line.replace(/\{choice\}/i, '');
    return ['choice', analyzieChoice(line)];
  } else if (linePurpose[1].match(/content/i)) {
    line = line.replace(/\{content\}/i, '');
    return ['content', analyzieContent(line)];
  } else {
    //if()
    return ['other', analyzieOther(line)];
  }
}

function analyzieOther(line) {
  var result = {
    content: ''
  };

  do {
    var object = line.match(/\{(.*?)\}/);

    if (object[1].match(/.*:.*/)) {
      var objectDetail = object[1].match(/(.*):(.*)/);
      result[objectDetail[1].replace(/^\s+/, '').replace(/\s+$/, '')] = objectDetail[2].replace(/^\s+/, '').replace(/\s+$/, '');
    } else {
      result[object] = null;
    }

    line = line.replace(/\{(.*?)\}/, ''); // console.log('X', line)
  } while (line.match(/\{.*?\}/));

  result.content = line.replace(/^\s+/, '').replace(/\s+$/, '');
  console.log('return Other', result);
  return result;
}

function analyzieContent(line) {
  var content = {
    content: '',
    ask: ''
  };
  var object = line.match(/\{ask:(.*?)\}/i);

  if (object && object[1]) {
    content.ask = object[1].replace(/^\s+/, '').replace(/\s+$/, '');
    line = line.replace(/\{ask:(.*?)\}/i, '');
  } // console.log('X', line)


  content.content = line.replace(/^\s+/, '').replace(/\s+$/, '');
  return content;
}

function analyzieChoice(line) {
  var choice = {
    content: '',
    object: []
  };

  do {
    var object = line.match(/\{(.*?)\}/);

    if (object[1].match(/.*:.*/)) {
      var objectDetail = object[1].match(/(.*):(.*)/);
      choice.object[objectDetail[1].replace(/^\s+/, '').replace(/\s+$/, '')] = objectDetail[2].replace(/^\s+/, '').replace(/\s+$/, '');
    } else {
      choice.object[object] = null;
    }

    line = line.replace(/\{(.*?)\}/, ''); // console.log('X', line)
  } while (line.match(/\{.*?\}/));

  choice.content = line.replace(/^\s+/, '').replace(/\s+$/, '');
  console.log('return choice', choice);
  return choice;
}
/**
 * 
 * 1 幻想現在你即將要走入一片森林，如果你可以帶一隻動物陪你，那是甚麼？形容一下牠。

2 步入森林，你覺得現在是白天還是夜晚呢？

3 進入森林後，你看見的第一隻動物會是甚麼？形容一下牠。

4 途中你看見地上有一條鑰匙，你會把它撿起來嗎？

5 突然有隻大灰熊慢慢地朝著你走過來，你會怎樣？

6 此時你看見有間屋在正前方，你認為那是一間小木屋還是豪宅？

7 你走到屋前，屋門正在打開還是關上？

8 進了屋裡，你看見枱上有杯水，裡面有幾多水？

9 枱上還有一個花瓶，裡面有多少支花呢？

10 除了枱外，還有椅子，你認為有多少張？

11 屋裡有幾間房，你覺得有多少間？

12 房裡有個老人家，你覺得他會是一個怎樣的人？

13 走出屋外，有個小女孩在賣花，你正打算買100支送給愛人，你會選擇多少支紅玫瑰和白玫瑰？

14 你發現屋旁邊有一個湖，這個湖被一片草原還是樹林圍繞著？

15 湖的旁邊有一個正在釣魚的漁夫，他打算送你一條魚，你會選擇收下嗎？

16 你正準備離開這個森林，你會跟剛才陪在身邊的動物再次回來遊逛嗎？
 */