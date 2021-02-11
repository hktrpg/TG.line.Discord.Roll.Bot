"use strict";
const {
	DynamicLoader
} = require('bcdice');

async function calldice(gameType, message) {
	const loader = new DynamicLoader();
	const GameSystem = await loader.dynamicLoad(gameType);
	const result = GameSystem.eval(message);
	return result.text;
}
var variables = {};

var gameName = function () {
	return '【歌風】 .UK (nUK nUK@c or nUKc)'
}

var gameType = function () {
	return 'Dice:UK:hktrpg'
}
var prefixs = function () {
	return [{
		first: /^[.]UK$/i,
		second: null
	}]
}
var getHelpMessage = function () {
	return "【歌風】" + "\n\
・行為判定ロール（nUK）\n\
n個のサイコロで行為判定ロール。ゾロ目の最大個数を成功レベルとして表示。nを省略すると2UK扱い。\n\
例）3UK ：サイコロ3個で行為判定\n\
例）UK  ：サイコロ2個で行為判定\n\
不等号用いた成否判定は現時点では実装してません。\n\
・クリティカルコール付き行為判定ロール（nUK@c or nUKc）\n\
cに「龍のダイス目」を指定した行為判定ロール。\n\
ゾロ目ではなく、cと同じ値の出目数x2が成功レベルとなります。\n\
例）3UK@5 ：龍のダイス「月」でクリティカルコール宣言したサイコロ3個の行為判定\n\
 "
}
var initialize = function () {
	return variables;
}

var rollDiceCommand = async function ({
	mainMsg
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	let result = '';
	switch (true) {
		case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
			rply.text = this.getHelpMessage();
			return rply;
		case /.*UK.*/i.test(mainMsg[1]):
			result = await calldice("Utakaze", mainMsg[1])
			if (result)
				rply.text = mainMsg[1] + ' ' + result;
			return rply;
		default:
			break;
	}
}


module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};