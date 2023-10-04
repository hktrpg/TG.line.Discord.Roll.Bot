// @ts-expect-error TS(6200): Definitions of the following identifiers conflict ... Remove this comment to see the full error message
"use strict";
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('fs');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'path'.
const path = require('path');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const util = require('util');
const readdir = util.promisify(fs.readdir);

(async function () {
	const files = await readdir('./roll/');
// @ts-expect-error TS(7006): Parameter 'file' implicitly has an 'any' type.
	files.forEach((file) => {
		const name = path.basename(file, '.js');
		if ((name !== 'index' || name !== 'demo') && file.endsWith('.js')) {
// @ts-expect-error TS(2304): Cannot find name 'exports'.
			exports[name] = require(path.join(__dirname, '../roll/', file));
		}
	})
}())


// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'schema'.
const schema = require('./schema.js');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'debugMode'... Remove this comment to see the full error message
const debugMode = (process.env.DEBUG) ? true : false;
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'MESSAGE_SP... Remove this comment to see the full error message
const MESSAGE_SPLITOR = (((/\S+/ig)));
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'courtMessa... Remove this comment to see the full error message
const courtMessage = require('./logs').courtMessage || function () { };
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'getState'.
const getState = require('./logs').getState || function () { };
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'EXPUP'.
const EXPUP = require('./level').EXPUP || function () { };

//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫
//格式是 exports.骰組檔案名字.function名
const parseInput = async ({
	inputStr = "",
	groupid = null,
	userid = null,
	userrole = 1,
	botname = null,
	displayname = null,
	channelid = null,
	displaynameDiscord = null,
	membercount = 0,
// @ts-expect-error TS(7031): Binding element 'discordClient' implicitly has an ... Remove this comment to see the full error message
	discordClient,
// @ts-expect-error TS(7031): Binding element 'discordMessage' implicitly has an... Remove this comment to see the full error message
	discordMessage,
	titleName = '',
	tgDisplayname = ''
}) => {
	let result = {
		text: '',
		type: 'text',
		LevelUp: '',
		statue: ''
	};

	let mainMsg = [];
	inputStr = inputStr.replace(/^\s/g, '')
// @ts-expect-error TS(2322): Type 'RegExpMatchArray | null' is not assignable t... Remove this comment to see the full error message
	mainMsg = inputStr.match(MESSAGE_SPLITOR); //定義輸入字串
	//EXPUP 功能 + LevelUP 功能
	if (groupid) {
		let tempEXPUP = await EXPUP(groupid, userid, displayname, displaynameDiscord, membercount, tgDisplayname, discordMessage);
		result.LevelUp = (tempEXPUP && tempEXPUP.text) ? tempEXPUP.text : '';
		result.statue = (tempEXPUP && tempEXPUP.statue) ? tempEXPUP.statue : '';
	}

	//檢查是不是要停止  z_stop功能
	if (groupid && mainMsg[0] && z_stop(mainMsg, groupid)) {
		return result;
	}

	//rolldice 擲骰功能
	let rollDiceResult = {};

	try {
// @ts-expect-error TS(2322): Type '{} | null' is not assignable to type '{}'.
		rollDiceResult = await rolldice({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			mainMsg: mainMsg,
			botname: botname,
			displayname: displayname,
			channelid: channelid,
			displaynameDiscord: displaynameDiscord,
			membercount: membercount,
			discordClient: discordClient,
			discordMessage: discordMessage,
			titleName: titleName,
			tgDisplayname: tgDisplayname
		})

	} catch (error) {
// @ts-expect-error TS(2571): Object is of type 'unknown'.
		console.error('rolldice GET ERROR:', error.stack, error.name, ' inputStr: ', inputStr, ' botname: ', botname, ' Time: ', new Date());

	}
	if (rollDiceResult) {
		result = JSON.parse(JSON.stringify(Object.assign({}, result, rollDiceResult)));
	}

	//cmdfunction  .cmd 功能   z_saveCommand 功能
// @ts-expect-error TS(2339): Property 'cmd' does not exist on type '{ text: str... Remove this comment to see the full error message
	if (result.cmd && result.text) {
		let cmdFunctionResult = await cmdfunction({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			mainMsg: mainMsg,
			botname: botname,
			displayname: displayname,
			channelid: channelid,
			displaynameDiscord: displaynameDiscord,
			membercount: membercount,
			result: result,
			titleName: titleName,
			tgDisplayname: tgDisplayname
		});
		if (typeof cmdFunctionResult === 'object' && cmdFunctionResult !== null) {
			result = Object.assign({}, result, cmdFunctionResult)
		}
	}


// @ts-expect-error TS(2339): Property 'characterReRoll' does not exist on type ... Remove this comment to see the full error message
	if (result.characterReRoll) {
		let characterReRoll = await cmdfunction({
			inputStr: inputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			mainMsg: mainMsg,
			botname: botname,
			displayname: displayname,
			channelid: channelid,
			displaynameDiscord: displaynameDiscord,
			membercount: membercount,
			result: result,
			titleName: titleName,
			tgDisplayname: tgDisplayname
		});
		if (result.text && characterReRoll.text) {
// @ts-expect-error TS(2339): Property 'characterName' does not exist on type '{... Remove this comment to see the full error message
			result.text = result.text = `${result.characterName}  投擲  ${result.characterReRollName} 
			${characterReRoll.text} 
			======
			${result.text}`;
		} else {
			(result && result.text) ? null : result.text = "";
			result.text += (characterReRoll && characterReRoll.text) ? '======\n' + characterReRoll.text : "";
		}

	}

// @ts-expect-error TS(2551): Property 'state' does not exist on type '{ text: s... Remove this comment to see the full error message
	if (result.state) {
		result.text = await stateText();
	}
	//courtMessage + saveLog
	await courtMessage({ result, botname, inputStr })
	return result;
}



const rolldice = async ({
// @ts-expect-error TS(7031): Binding element 'inputStr' implicitly has an 'any'... Remove this comment to see the full error message
	inputStr,
// @ts-expect-error TS(7031): Binding element 'groupid' implicitly has an 'any' ... Remove this comment to see the full error message
	groupid,
// @ts-expect-error TS(7031): Binding element 'userid' implicitly has an 'any' t... Remove this comment to see the full error message
	userid,
// @ts-expect-error TS(7031): Binding element 'userrole' implicitly has an 'any'... Remove this comment to see the full error message
	userrole,
// @ts-expect-error TS(7031): Binding element 'mainMsg' implicitly has an 'any' ... Remove this comment to see the full error message
	mainMsg,
// @ts-expect-error TS(7031): Binding element 'botname' implicitly has an 'any' ... Remove this comment to see the full error message
	botname,
// @ts-expect-error TS(7031): Binding element 'displayname' implicitly has an 'a... Remove this comment to see the full error message
	displayname,
// @ts-expect-error TS(7031): Binding element 'channelid' implicitly has an 'any... Remove this comment to see the full error message
	channelid,
// @ts-expect-error TS(7031): Binding element 'displaynameDiscord' implicitly ha... Remove this comment to see the full error message
	displaynameDiscord,
// @ts-expect-error TS(7031): Binding element 'membercount' implicitly has an 'a... Remove this comment to see the full error message
	membercount,
// @ts-expect-error TS(7031): Binding element 'discordClient' implicitly has an ... Remove this comment to see the full error message
	discordClient,
// @ts-expect-error TS(7031): Binding element 'discordMessage' implicitly has an... Remove this comment to see the full error message
	discordMessage,
// @ts-expect-error TS(7031): Binding element 'titleName' implicitly has an 'any... Remove this comment to see the full error message
	titleName,
// @ts-expect-error TS(7031): Binding element 'tgDisplayname' implicitly has an ... Remove this comment to see the full error message
	tgDisplayname
}) => {
	//在下面位置開始分析trigger
	if (!groupid) {
		groupid = '';
	}
	//把exports objest => Array
	let target = findRollList(mainMsg);
	if (!target) return null;
	(debugMode) ? console.log('            trigger: ', inputStr) : '';

	let rollTimes = inputStr.match(/^\.(\d{1,2})\s/);
	rollTimes ? rollTimes = rollTimes[1] : rollTimes = 1;
	rollTimes > 10 ? rollTimes = 10 : null;
	inputStr = inputStr.replace(/^\.\d{1,2}\s/, '');

	mainMsg[0].match(/^\.(\d{1,2})$/) ? mainMsg.shift() : null;

	let retext = '';
	let tempsave = {};
	for (let index = 0; index < rollTimes; index++) {
		if (rollTimes > 1 && /^dice|^funny/i.test(target.gameType())) {
			tempsave = await target.rollDiceCommand({
				inputStr: inputStr,
				mainMsg: mainMsg,
				groupid: groupid,
				userid: userid,
				userrole: userrole,
				botname: botname,
				displayname: displayname,
				channelid: channelid,
				displaynameDiscord: displaynameDiscord,
				membercount: membercount,
				discordClient: discordClient,
				discordMessage: discordMessage,
				titleName: titleName,
				tgDisplayname: tgDisplayname
			});
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
			if (tempsave && tempsave.text) {
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
				retext += `#${index + 1}： ${tempsave.text.replace(/\n/g, '')}\n`
			}
		} else {
			tempsave = await target.rollDiceCommand({
				inputStr: inputStr,
				mainMsg: mainMsg,
				groupid: groupid,
				userid: userid,
				userrole: userrole,
				botname: botname,
				displayname: displayname,
				channelid: channelid,
				displaynameDiscord: displaynameDiscord,
				membercount: membercount,
				discordClient: discordClient,
				discordMessage: discordMessage,
				titleName: titleName,
				tgDisplayname: tgDisplayname
			});
		}

	}



	if (retext) {
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
		tempsave.text = retext;
	}
	return tempsave;
}

// @ts-expect-error TS(2393): Duplicate function implementation.
function findRollList(mainMsg) {
	if (!mainMsg || !mainMsg[0]) return;
	mainMsg[0].match(/^\.(\d{1,2})$/) ? mainMsg.shift() : null;
	if (!mainMsg[1]) mainMsg[1] = '';
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	let idList = Object.keys(exports).map(i => exports[i]);
	let findTarget = idList.find(item => {
		if (item.prefixs && item.prefixs()) {
			for (let index = 0; index < item.prefixs().length; index++) {
				if (mainMsg && mainMsg[0] && mainMsg[0].match(item.prefixs()[index].first) && (mainMsg[1] && mainMsg[1].match(item.prefixs()[index].second) || item.prefixs()[index].second == null)) {
					return true
				}
			}
		}
	});
// @ts-expect-error TS(2322): Type 'null' is not assignable to type 'any[]'.
	idList = null;
	return findTarget;
}

// @ts-expect-error TS(2393): Duplicate function implementation.
async function stateText() {
	let state = (await getState()) || '';
	if (!Object.keys(state).length || !state.LogTime) return;
	let text = "";
	text = '系統開始紀錄時間: ' + state.StartTime.replace(' GMT+0800 (Hong Kong Standard Time)', '');
	text += '\n 現在時間: ' + state.LogTime.replace(' GMT+0800 (GMT+08:00)', '');
	text += '\n Line總擲骰次數: ' + state.LineCountRoll;
	text += '\n Discord總擲骰次數: ' + state.DiscordCountRoll;
	text += '\n Telegram總擲骰次數: ' + state.TelegramCountRoll;
	text += '\n Whatsapp總擲骰次數: ' + state.WhatsappCountRoll;
	text += '\n 網頁版總擲骰次數: ' + state.WWWCountRoll;
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	text += '\n 使用經驗值功能的群組: ' + (await schema.trpgLevelSystem.countDocuments({ Switch: '1' }).catch(error => console.error('analytics #266 mongoDB error: ', error.name, error.reson)));
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	text += '\n 已新增的角色卡: ' + (await schema.characterCard.countDocuments({}).catch(error => console.error('analytics #267 mongoDB error: ', error.name, error.reson)));
// @ts-expect-error TS(7006): Parameter 'error' implicitly has an 'any' type.
	text += '\n HKTRPG使用者數量: ' + (await schema.firstTimeMessage.countDocuments({}).catch(error => console.error('analytics #268 mongoDB error: ', error.name, error.reson)));
	text += '\n 擲骰系統使用的隨機方式: random-js nodeCrypto';
	return text;
}



// @ts-expect-error TS(2393): Duplicate function implementation.
async function cmdfunction({
// @ts-expect-error TS(7031): Binding element 'groupid' implicitly has an 'any' ... Remove this comment to see the full error message
	groupid,
// @ts-expect-error TS(7031): Binding element 'userid' implicitly has an 'any' t... Remove this comment to see the full error message
	userid,
// @ts-expect-error TS(7031): Binding element 'userrole' implicitly has an 'any'... Remove this comment to see the full error message
	userrole,
// @ts-expect-error TS(7031): Binding element 'botname' implicitly has an 'any' ... Remove this comment to see the full error message
	botname,
// @ts-expect-error TS(7031): Binding element 'displayname' implicitly has an 'a... Remove this comment to see the full error message
	displayname,
// @ts-expect-error TS(7031): Binding element 'channelid' implicitly has an 'any... Remove this comment to see the full error message
	channelid,
// @ts-expect-error TS(7031): Binding element 'displaynameDiscord' implicitly ha... Remove this comment to see the full error message
	displaynameDiscord,
// @ts-expect-error TS(7031): Binding element 'membercount' implicitly has an 'a... Remove this comment to see the full error message
	membercount,
// @ts-expect-error TS(7031): Binding element 'result' implicitly has an 'any' t... Remove this comment to see the full error message
	result,
// @ts-expect-error TS(7031): Binding element 'titleName' implicitly has an 'any... Remove this comment to see the full error message
	titleName,
// @ts-expect-error TS(7031): Binding element 'tgDisplayname' implicitly has an ... Remove this comment to see the full error message
	tgDisplayname
}) {
	let newInputStr = result.characterReRollItem || result.text;
	let mainMsg = newInputStr.match(MESSAGE_SPLITOR); //定義輸入字串
	//檢查是不是要停止
	let tempResut = {};
	try {
// @ts-expect-error TS(2322): Type '{} | null' is not assignable to type '{}'.
		tempResut = await rolldice({
			inputStr: newInputStr,
			groupid: groupid,
			userid: userid,
			userrole: userrole,
			mainMsg: mainMsg,
			botname: botname,
			displayname: displayname,
			channelid: channelid,
			displaynameDiscord: displaynameDiscord,
			membercount: membercount,
			titleName: titleName,
			tgDisplayname: tgDisplayname
		})
	} catch (error) {
		console.error('cmdfunction GET ERROR:', error, ' inputStr: ', newInputStr, ' botname: ', botname, ' Time: ', new Date());
	}
	(debugMode) ? console.log('            inputStr2: ', newInputStr) : '';
	if (typeof tempResut === 'object' && tempResut !== null) {
// @ts-expect-error TS(2339): Property 'text' does not exist on type '{}'.
		if (result.characterName) tempResut.text = `${result.characterName} 進行 ${result.characterReRollName} 擲骰\n ${tempResut.text}`
		return tempResut;
	}
	return;
}


// @ts-expect-error TS(2393): Duplicate function implementation.
function z_stop(mainMsg, groupid) {
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	if (!Object.keys(exports.z_stop).length || !exports.z_stop.initialize().save) {
		return false;
	}
// @ts-expect-error TS(2304): Cannot find name 'exports'.
	let groupInfo = exports.z_stop.initialize().save.find(e => e.groupid == groupid)
	if (!groupInfo || !groupInfo.blockfunction) return;
// @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
	let match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()))
	if (match) {
		(debugMode) ? console.log('Match AND STOP') : '';
		return true;
	} else
		return false;
}



// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.debugMode = debugMode;
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.parseInput = parseInput;
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports.findRollList = findRollList
