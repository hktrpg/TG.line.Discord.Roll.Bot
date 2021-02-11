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
	return '【DX2nd,3rd】 .dx (xDX+y@c ET)'
}

var gameType = function () {
	return 'Dice:Dx2,3:hktrpg'
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
・判定コマンド (.dx xDX+y@c or xDXc+y)\n\
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
		case /(\d+dx|ET)/i.test(mainMsg[1]):
			result = await calldice("DoubleCross", mainMsg[1])
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