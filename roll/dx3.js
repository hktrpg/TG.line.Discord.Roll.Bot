"use strict";
const {
	DynamicLoader
} = require('bcdice');

async function calldice(gameType, message) {
	const loader = new DynamicLoader();
	const GameSystem = await loader.dynamicLoad(gameType);
	const result = GameSystem.eval(message);
	return (result && result.text) ? result.text : null;
}
async function callHelp(gameType) {
	const loader = new DynamicLoader();
	const GameSystem = await loader.dynamicLoad(gameType);
	const result = GameSystem.HELP_MESSAGE;
	return result;
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
var getHelpMessage = async function () {
	return '【Double Cross 2nd,3rd】\n' + await callHelp("DoubleCross");
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
			rply.text = '【Double Cross 2nd,3rd】\n' + await callHelp("DoubleCross");
			return rply;
		default:
			result = await calldice("DoubleCross", mainMsg[1])
			if (result)
				rply.text = mainMsg[1] + ' ' + result;
			return rply;
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