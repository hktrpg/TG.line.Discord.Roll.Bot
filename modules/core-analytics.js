"use strict";
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
const start = async () => {
	await require('fs').readdirSync('./roll/').forEach(async function (file) {
		if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
			const name = file.replace('.js', '');
			exports[name] = await require('../roll/' + file);
		}
	})
}

start();
var debugMode = false;
const msgSplitor = (/\S+/ig);
const courtMessage = require('./logs').courtMessage || function () {};
const EXPUP = require('./level').EXPUP || function () {};


//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫
//格式是 exports.骰組檔案名字.function名
var parseInput = async function (inputStr, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
	//console.log('InputStr: ' + inputStr);
	let result = {
		text: '',
		type: 'text',
		LevelUp: ''
	};
	let trigger = ""
	let stopmark = 0;
	let mainMsg = {};
	inputStr = inputStr.replace(/^\s/g, '')
	mainMsg = inputStr.match(msgSplitor); //定義輸入字串
	if (mainMsg)
		trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階

	//EXPUP 功能 + LevelUP 功能
	if (groupid) {
		let tempEXPUP = await EXPUP(groupid, userid, displayname, displaynameDiscord, membercount);
		if (tempEXPUP) {
			result.LevelUp = tempEXPUP;
		}
	}

	//檢查是不是要停止  z_stop功能
	if (groupid) {
		stopmark = await z_stop(mainMsg, groupid);
		if (stopmark == 1) return result;
	}


	//rolldice 擲骰功能
	let rollDiceResult = {};
	try {
		rollDiceResult = await rolldice(inputStr, groupid, userid, userrole, mainMsg, botname, displayname, channelid, displaynameDiscord, membercount)

	} catch (error) {
		console.log('rolldice GET ERROR:', error);
		console.log('inputStr: ', inputStr);
		console.log('botname: ', botname);
		console.log('Time: ', new Date());
	}
	if (rollDiceResult) {
		result = await JSON.parse(JSON.stringify(Object.assign({}, result, rollDiceResult)));
	} else {
		result.text = "";
	}

	//cmdfunction  .cmd 功能   z_saveCommand 功能
	if (mainMsg && mainMsg[0].toLowerCase() == ".cmd" && mainMsg[1] && mainMsg[1].toLowerCase() != "help" && mainMsg[1].toLowerCase() != "add" && mainMsg[1].toLowerCase() != "show" && mainMsg[1].toLowerCase() != "del" && result.text) {
		let cmdFunctionResult = await cmdfunction(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount, result);
		if (typeof cmdFunctionResult === 'object' && cmdFunctionResult !== null) {
			result = await Object.assign({}, result, cmdFunctionResult)
		} else {
			result.text = "";
		}

	}
	if (result.characterReRoll) {
		let characterReRoll = await cmdfunction(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount, result)
		result = await Object.assign({}, result, characterReRoll)
		if (result.text && result.characterName) {
			result.text = result.characterName + ' 投擲 ' + result.characterReRollName + ':\n' + result.text
		}
	}
	//courtMessage + saveLog
	await courtMessage(result, botname, inputStr)
	//return result
	return result;
}



var rolldice = async function (inputStr, groupid, userid, userrole, mainMsg, botname, displayname, channelid, displaynameDiscord, membercount) {
	//	console.log(exports)
	//在下面位置開始分析trigger
	if (!groupid) {
		groupid = 0
	}
	if (mainMsg && !mainMsg[1]) mainMsg[1] = '';
	//把exports objest => Array
	let idList = await Object.keys(exports).map(i => exports[i]);
	let findTarget = await idList.find(item => {
		if (item.prefixs && item.prefixs()) {
			for (let index = 0; index < item.prefixs().length; index++) {
				if (mainMsg[0].match(item.prefixs()[index].first) && (mainMsg[1].match(item.prefixs()[index].second) || item.prefixs()[index].second == null)) {
					return true
				}
			}
		}
	});
	if (!findTarget) {
		return null;
	} else {
		(debugMode) ? console.log('            trigger: ', inputStr): '';
		let tempsave = await findTarget.rollDiceCommand(inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount);
		//console.log('tempsave: ', tempsave)
		return tempsave;
	}

}



async function cmdfunction(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount, result) {
	let msgSplitor = (/\S+/ig);
	//console.log('result.text', result.text.toString().replace(mainMsg[1], ""))
	inputStr = result.text.toString().replace(mainMsg[1], "");
	//console.log(inputStr)
	mainMsg = inputStr.match(msgSplitor); //定義輸入字串
	trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
	//console.log('inputStr2: ', inputStr)
	result.text = "";
	//檢查是不是要停止
	let tempResut = {};
	try {
		tempResut = await rolldice(inputStr, groupid, userid, userrole, mainMsg, botname, displayname, channelid, displaynameDiscord, membercount)
	} catch (error) {
		console.log('rolldice GET ERROR:', error);
		console.log('inputStr: ', inputStr);
		console.log('botname: ', botname);
		console.log('Time: ', new Date());
	}

	if (typeof tempResut === 'object' && tempResut !== null) {
		return tempResut;
	}

	(debugMode) ? console.log('inputStr2: ', inputStr): '';
}




async function z_stop(mainMsg, groupid) {
	if (!Object.keys(exports.z_stop).length) {
		return 0;
	}

	if (exports.z_stop.initialize() && exports.z_stop.initialize().save && exports.z_stop.initialize().save[0] && exports.z_stop.initialize().save[0].blockfunction && exports.z_stop.initialize().save[0].blockfunction.length > 0 && mainMsg && mainMsg[0]) {
		for (let i = 0; i < exports.z_stop.initialize().save.length; i++) {
			if ((new RegExp(exports.z_stop.initialize().save[i].blockfunction.join("|"), "i")).test(mainMsg[0]) && exports.z_stop.initialize().save[i].groupid == groupid && exports.z_stop.initialize().save[i].blockfunction.length > 0) {
				(debugMode) ? console.log('Match AND STOP'): '';
				return 1;
			}
		}
	}
}



module.exports.debugMode = debugMode;
module.exports.parseInput = parseInput;