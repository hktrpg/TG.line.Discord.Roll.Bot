"use strict";
const BCDice = require('bcdice-js').BCDice; // CommonJS
const bcdice = new BCDice();
const rollbase = require('./rollbase.js');


function calldice(gameType, message) {
	bcdice.setGameByTitle(gameType)
	bcdice.setMessage(message)
	return bcdice.dice_command()
}

var variables = {};

var gameName = function () {
	return '【DX2nd,3rd】 .dx (xDX+y@c ET)'
}

var gameType = function () {
	return 'Dx2,3:hktrpg'
}
var prefixs = function () {
	return [{
		first: /^[.]dx$/i,
		second: null
	}]
}
var getHelpMessage = function () {
	return "【Double Cross 2nd,3rd】" + "\n\
・啓動語 .dx (指令) 如 .dx xDX+y\n\
・判定コマンド　(.dx xDX+y@c or xDXc+y)\n\
(個数)DX(修正)@(クリティカル値) もしくは (個数)DX(クリティカル値)(修正)で指定します。\n\
加算減算のみ修正値も付けられます。\n\
内部で読み替えています。\n\
例）.dx 10dx 10dx+5@8(OD tool式) 5DX7+7-3(疾風怒濤式)\n\
\n\
・各種表\n\
・感情表(.dx ET)\n\
ポジティブとネガティブの両方を振って、表になっている側に○を付けて表示します。もちろん任意で選ぶ部分は変更して構いません。\n"
}
var initialize = function () {
	return variables;
}

var rollDiceCommand = async function (inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid) {
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
		case /(\d+dx|ET)/i.test(mainMsg[1]):
			result = calldice("DoubleCross", mainMsg[1])
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



//Dx3 指令開始於此
//	if (trigger.match(/^(\d+)(dx)(\d|)(((\+|-)(\d+)|)((\+|-)(\d+)|))$/i) != null) return exports.dx3.dx(trigger);

/**
 * 自己寫的DX指令, 已放棄, 轉用凍豆版
 * @param {指令} triggermsg 
 */
function dx(triggermsg) {
	//var varcou = 0;
	var finallynum = 0;
	var returnStr = triggermsg + ' → ';
	var match = /^(\d+)(dx)(\d|)(((\+|-)(\d+)|)((\+|-)(\d+)|))$/i.exec(triggermsg); //判斷式  [0]2dx8-2+10,[1]2,[2]dx,[3]8,[4]-2+10,[5]-2,[6]-,[7]2,[8]+10,[9]+,[10]10  
	//	console.log(match);
	if (match[3] == "") {
		match[3] = 10
	}
	if (match[3] <= 2) {
		rply.text = '加骰最少比2高';
		return rply;
	}

	for (var round = 1; round > 0; round--) {
		[match, round, returnStr, finallynum] = dxroll(match, round, returnStr, finallynum);
	}
	returnStr = returnStr.replace(/[,][ ]+]/ig, ']');
	if (match[6] == '+') {
		for (let i = 0; i < Number(match[7]); i++) {
			finallynum++;
		}
	}
	if (match[6] == '-') {
		for (let i = 0; i < Number(match[7]); i++) {
			finallynum--;
		}
	}
	if (match[9] == '+') {
		for (let i = 0; i < Number(match[10]); i++) {
			finallynum++;
		}
	}
	if (match[9] == '-') {
		for (let i = 0; i < Number(match[10]); i++) {
			finallynum--;
		}
	}
	returnStr += match[4] + ' → ' + finallynum;
	rply.text = returnStr;
	return rply;

}

async function dxroll(match, round, returnStr, finallynum) {
	var result = 0;
	var rollnum = match[1];
	match[1] = 0;
	var varcou = "";
	var varsu = "";
	for (var i = 0; i < rollnum; i++) {
		//varcou = Math.floor(Math.random() * 10) + 1;
		varcou = await rollbase.Dice(10)
		if (varcou > result) {
			result = varcou
		}
		if (varcou >= Number(match[3])) {
			result = 10;
			match[1]++;
		}
		varsu += varcou + ', ';
	}
	returnStr += result + '[' + varsu + '] ';
	finallynum += Number(result);
	if (match[1] >= 1) {
		round++;
		returnStr += '+ ';
	}
	return [match, round, returnStr, finallynum];
}