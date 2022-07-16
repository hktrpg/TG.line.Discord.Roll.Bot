"use strict";
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
(function () {
	require('fs').readdirSync('./roll/').forEach(function (file) {
		if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
			const name = file.replace('.js', '');
			exports[name] = require('../roll/' + file);
		}
	})
}())


const schema = require('./schema.js');
const debugMode = (process.env.DEBUG) ? true : false;
const MESSAGE_SPLITOR = (/\S+/ig);
const courtMessage = require('./logs').courtMessage || function () { };
const getState = require('./logs').getState || function () { };
const EXPUP = require('./level').EXPUP || function () { };

//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫
//格式是 exports.骰組檔案名字.function名
var parseInput = async function ({
	inputStr = "",
	groupid = null,
	userid = null,
	userrole = 1,
	botname = null,
	displayname = null,
	channelid = null,
	displaynameDiscord = null,
	membercount = 0,
	discordClient,
	discordMessage,
	titleName = '',
	tgDisplayname = ''
}) {
	let result = {
		text: '',
		type: 'text',
		LevelUp: '',
		statue: ''
	};

	let mainMsg = [];
	inputStr = inputStr.replace(/^\s/g, '')
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
		console.error('rolldice GET ERROR:', error.name, ' inputStr: ', inputStr, ' botname: ', botname, ' Time: ', new Date());

	}
	if (rollDiceResult) {
		result = JSON.parse(JSON.stringify(Object.assign({}, result, rollDiceResult)));
	}

	//cmdfunction  .cmd 功能   z_saveCommand 功能
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
			result.text = result.text = `${result.characterName}  投擲  ${result.characterReRollName} 
			${characterReRoll.text} 
			======
			${result.text}`;
		} else {
			(result && result.text) ? null : result.text = "";
			result.text += (characterReRoll && characterReRoll.text) ? '======\n' + characterReRoll.text : "";
		}

	}

	if (result.state) {
		result.text = await stateText();
	}
	//courtMessage + saveLog
	await courtMessage({ result, botname, inputStr })
	return result;
}



var rolldice = async function ({
	inputStr,
	groupid,
	userid,
	userrole,
	mainMsg,
	botname,
	displayname,
	channelid,
	displaynameDiscord,
	membercount,
	discordClient,
	discordMessage,
	titleName,
	tgDisplayname
}) {
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
		if (rollTimes > 1 && /^dice/i.test(target.gameType())) {
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
			if (tempsave && tempsave.text) {
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
		tempsave.text = retext;
	}
	return tempsave;
}

function findRollList(mainMsg) {
	if (!mainMsg || !mainMsg[0]) return;
	mainMsg[0].match(/^\.(\d{1,2})$/) ? mainMsg.shift() : null;
	if (!mainMsg[1]) mainMsg[1] = '';
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
	idList = null;
	return findTarget;
}

async function stateText() {
	let state = await getState() || '';
	if (!Object.keys(state).length || !state.LogTime) return;
	let text = "";
	text = '系統開始紀錄時間: ' + state.StartTime.replace(' GMT+0800 (Hong Kong Standard Time)', '');
	text += '\n 現在時間: ' + state.LogTime.replace(' GMT+0800 (GMT+08:00)', '');
	text += '\n Line總擲骰次數: ' + state.LineCountRoll;
	text += '\n Discord總擲骰次數: ' + state.DiscordCountRoll;
	text += '\n Telegram總擲骰次數: ' + state.TelegramCountRoll;
	text += '\n Whatsapp總擲骰次數: ' + state.WhatsappCountRoll;
	text += '\n 網頁版總擲骰次數: ' + state.WWWCountRoll;
	text += '\n 使用經驗值功能的群組: ' + await schema.trpgLevelSystem.countDocuments({ Switch: '1' }).catch(error => console.error('analytics #266 mongoDB error: ', error.name, error.reson));
	text += '\n 已新增的角色卡: ' + await schema.characterCard.countDocuments({}).catch(error => console.error('analytics #267 mongoDB error: ', error.name, error.reson));
	text += '\n HKTRPG使用者數量: ' + await schema.firstTimeMessage.countDocuments({}).catch(error => console.error('analytics #268 mongoDB error: ', error.name, error.reson));
	text += '\n 擲骰系統使用的隨機方式: random-js nodeCrypto';
	return text;
}



async function cmdfunction({
	groupid,
	userid,
	userrole,
	botname,
	displayname,
	channelid,
	displaynameDiscord,
	membercount,
	result,
	titleName,
	tgDisplayname
}) {
	let newInputStr = result.characterReRollItem || result.text;
	let mainMsg = newInputStr.match(MESSAGE_SPLITOR); //定義輸入字串
	//檢查是不是要停止
	let tempResut = {};
	try {
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
		if (result.characterName) tempResut.text = `${result.characterName} 進行 ${result.characterReRollName} 擲骰\n ${tempResut.text}`
		return tempResut;
	}
	return;
}


function z_stop(mainMsg, groupid) {
	if (!Object.keys(exports.z_stop).length || !exports.z_stop.initialize().save) {
		return false;
	}
	let groupInfo = exports.z_stop.initialize().save.find(e => e.groupid == groupid)
	if (!groupInfo || !groupInfo.blockfunction) return;
	let match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()))
	if (match) {
		(debugMode) ? console.log('Match AND STOP') : '';
		return true;
	} else
		return false;
}



module.exports.debugMode = debugMode;
module.exports.parseInput = parseInput;
module.exports.findRollList = findRollList
