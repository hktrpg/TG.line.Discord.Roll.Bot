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
async function callHelp(gameType) {
	const loader = new DynamicLoader();
	const GameSystem = await loader.dynamicLoad(gameType);
	const result = GameSystem.HELP_MESSAGE;
	return result;
}
var rollbase = require('./rollbase.js');
var variables = {};

var gameName = function () {
	return '【永遠的後日談】 .nc (NM xNC+m xNA+m)'
}

var gameType = function () {
	return 'Dice:Nechronica'
}
var prefixs = function () {
	return [{
		first: /(^[.]nc$)$/i,
		second: null
	}]
}
var getHelpMessage = function () {
	return null
}
var initialize = function () {
	return variables;
}
//nc指令開始於此 來自Rainsting/TarotLineBot 
//if (trigger.match(/^[1-4]n[c|a][+|-][1-99]$|^[1-4]n[c|a]$/) != null) return exports.nc.nechronica(trigger, mainMsg[1]);

//依戀
//if (trigger.match(/(^nm$)/) != null) return exports.nc.nechronica_mirenn(mainMsg[1]);

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
			rply.text = await callHelp("Nechronica");
			return rply;
		case /(^nm$)/i.test(mainMsg[1]):
			rply.text = await nechronica_mirenn(mainMsg[2]);
			return rply;
		default:
			result = await calldice("Nechronica", mainMsg[1])
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

/**
 * nechronica (NM依戀)
 * @param {描述} text 
 */

async function nechronica_mirenn(text) {
	let returnStr = '';
	var dicenew = 0;
	dicenew = await rollbase.Dice(10) - 1;
	// 產生格式
	if (text != null)
		returnStr = text + ': \n' + '依戀 (' + (dicenew + 1) + '[' + (dicenew + 1) + ']) → ' + nechronica_mirenn_table(dicenew);
	else
		returnStr = '依戀 (' + (dicenew + 1) + '[' + (dicenew + 1) + ']) → ' + nechronica_mirenn_table(dicenew);
	return returnStr;
}

/* 這邊預留 mode 以便未來可以加入其他依戀 */
function nechronica_mirenn_table(mode) {
	let returnStr;
	if (mode == 0) returnStr = '【嫌惡】\n[發狂：敵對認識] 戰鬥中，沒有命中敵方的攻擊，全部都會擊中嫌惡的對象。(如果有在射程內的話)';
	if (mode == 1) returnStr = '【獨占】\n[發狂：獨占衝動] 戰鬥開始與戰鬥結束，各別選擇損傷1個對象的部件。';
	if (mode == 2) returnStr = '【依存】\n[發狂：幼兒退行] 妳的最大行動值減少2。';
	if (mode == 3) returnStr = '【執著】\n[發狂：跟蹤監視] 戰鬥開始與戰鬥結束時，對象對妳的依戀精神壓力點數各增加1點。(如果已經處在精神崩壞狀態，可以不用作此處理)';
	if (mode == 4) returnStr = '【戀心】\n[發狂：自傷行為] 戰鬥開始與戰鬥結束時，各別選擇損傷1個自己的部件。';
	if (mode == 5) returnStr = '【對抗】\n[發狂：過度競爭] 戰鬥開始與戰鬥結束時，各別選擇任意依戀，增加1點精神壓力點數。(如果已經處在精神崩壞狀態，可以不用作此處理)';
	if (mode == 6) returnStr = '【友情】\n[發狂：共鳴依存] 單元結束時，對象的損傷部件比妳還要多的時候，妳的部件損傷數，要增加到與對方相同。';
	if (mode == 7) returnStr = '【保護】\n[發狂：過度保護] 戰鬥當中，妳跟「依戀的對象」處於不同區域的時候，無法宣告「移動以外的戰鬥宣言」，此外妳沒有辦法把「自身」與「依戀對象」以外的單位當成移動對象。';
	if (mode == 8) returnStr = '【憧憬】\n[發狂：贗作妄想] 戰鬥當中，妳跟「依戀的對象」處於同樣區域的時候，無法宣告「移動以外的戰鬥宣言」，此外妳沒有辦法把「自身」與「依戀對象」以外的單位當成移動對象。';
	if (mode == 9) returnStr = '【信賴】\n[發狂：疑心暗鬼] 除了妳以外的所有姊妹，最大行動值減少1。';

	return returnStr;
}