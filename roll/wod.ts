// @ts-expect-error TS(6200): Definitions of the following identifiers conflict ... Remove this comment to see the full error message
"use strict";
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
let rollbase = require('./rollbase.js');
let variables = {};

const gameName = function () {
	return '【WOD黑暗世界】.xWDy'
}

const gameType = function () {
	return 'Dice:WOD:hktrpg'
}
const prefixs = function () {
	return [{
		first: /^[.](\d+)(wd)(\d|)((\+|-)(\d+)|)$/i,
		second: null
	}];
}
const getHelpMessage = async function () {
	return `【WOD 黑暗世界擲骰】
[.](骰數)Wd(加骰)(+成功數) (問題)
例子 .3wd8 .15wd9+2`
}
const initialize = function () {
	return variables;
}

// @ts-expect-error TS(7031): Binding element 'mainMsg' implicitly has an 'any' ... Remove this comment to see the full error message
const rollDiceCommand = async function ({ mainMsg }) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	let matchwod = /^[.](\d+)(wd|wod)(\d|)((\+|-)(\d+)|)$/i.exec(mainMsg[0]); //判斷式  [0]3wd8+10,[1]3,[2]wd,[3]8,[4]+10,[5]+,[6]10  
// @ts-expect-error TS(2365): Operator '>=' cannot be applied to types 'string' ... Remove this comment to see the full error message
	if (matchwod && matchwod[1] >= 1 && matchwod[1] <= 600)
		rply.text = await wod(mainMsg[0], mainMsg[1]);
	return rply;
}


// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};
/**
 * WOD黑暗世界
 * @param {.5WD6} triggermsg 
 * @param {文字描述} text 
 */

// @ts-expect-error TS(7006): Parameter 'triggermsg' implicitly has an 'any' typ... Remove this comment to see the full error message
async function wod(triggermsg, text) {

	let returnStr = triggermsg + ' [';
	let varcou = 0;
	let varsu = 0;
	let match = /^[.](\d+)(wd|wod)(\d|)((\+|-)(\d+)|)$/i.exec(triggermsg); //判斷式  [0]3wd8+10,[1]3,[2]wd,[3]8,[4]+10,[5]+,[6]10  
// @ts-expect-error TS(2531): Object is possibly 'null'.
	if (match[3] == "") {
// @ts-expect-error TS(2531): Object is possibly 'null'.
		match[3] = 10
	}
// @ts-expect-error TS(2531): Object is possibly 'null'.
	if (match[3] <= 3) {
		return '加骰最少比3高';
	}

// @ts-expect-error TS(2531): Object is possibly 'null'.
	for (let i = 0; i < Number(match[1]); i++) {
		//varcou = Math.floor(Math.random() * 10) + 1;
		varcou = rollbase.Dice(10)
		returnStr += varcou + ', ';
// @ts-expect-error TS(2365): Operator '>=' cannot be applied to types 'number' ... Remove this comment to see the full error message
		if (varcou >= match[3]) {
			i--
		}
		if (varcou >= 8) {
			varsu++;
		}
	}
// @ts-expect-error TS(2531): Object is possibly 'null'.
	if (match[5] == '+') {
// @ts-expect-error TS(2531): Object is possibly 'null'.
		for (let i = 0; i < Number(match[6]); i++) {
			varsu++;
		}
	}
// @ts-expect-error TS(2531): Object is possibly 'null'.
	if (match[5] == '-') {

// @ts-expect-error TS(2531): Object is possibly 'null'.
		for (let i = 0; i < Number(match[6]); i++) {
			varsu--;
		}
	}
	returnStr = returnStr.replace(/[,][ ]$/, '] → ' + varsu + '成功');
	if (text != null) {
		returnStr += ' ; ' + text;
	}
	return returnStr;
}