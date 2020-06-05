"use strict";
const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();

function calldice(gameType, message) {
	bcdice.setGameByTitle(gameType)
	bcdice.setMessage(message)
	return bcdice.dice_command()
}

var rply = {
	default: 'on',
	type: 'text',
	text: ''
};

var gameName = function () {
	return '【歌風】 .UK (nUK nUK@c or nUKc)'
}

var gameType = function () {
	return 'UK:hktrpg'
}
var prefixs = function () {
	return [{
		first: /^[.]UK$/i,
		second: null
	}]
}
var getHelpMessage = function () {
	return "【歌風】" + "\
	\n・行為判定ロール（nUK）\
	\nn個のサイコロで行為判定ロール。ゾロ目の最大個数を成功レベルとして表示。nを省略すると2UK扱い。\
	\n例）3UK ：サイコロ3個で行為判定\
	\n例）UK  ：サイコロ2個で行為判定\
	\n不等号用いた成否判定は現時点では実装してません。\
	\n・クリティカルコール付き行為判定ロール（nUK@c or nUKc）\
	　\ncに「龍のダイス目」を指定した行為判定ロール。\
	\nゾロ目ではなく、cと同じ値の出目数x2が成功レベルとなります。\
	\n例）3UK@5 ：龍のダイス「月」でクリティカルコール宣言したサイコロ3個の行為判定\
		\n "
}
var initialize = function () {
	return rply;
}

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
	rply.text = '';
	let result = '';
	switch (true) {
		case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
			rply.text = this.getHelpMessage();
			return rply;
		case /.*UK.*/i.test(mainMsg[1]):
			result = calldice("Utakaze", mainMsg[1])
			if (result && result[0] != 1)
				rply.text = mainMsg[1] + result[0];
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