"use strict";
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);

(async function () {
	const files = await readdir('./roll/');
	files.forEach((file) => {
		const name = path.basename(file, '.js');
		if ((name !== 'index' || name !== 'demo') && file.endsWith('.js')) {
			exports[name] = require(path.join(__dirname, '../roll/', file));
		}
	});
}());


const schema = require('./schema.js');
const debugMode = (process.env.DEBUG) ? true : false;
const MESSAGE_SPLITOR = (/\S+/ig);
const courtMessage = require('./logs').courtMessage || function () { };
const getState = require('./logs').getState || function () { };
const EXPUP = require('./level').EXPUP || function () { };

//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫
//格式是 exports.骰組檔案名字.function名
const parseInput = async (params) => {
	const {
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
	} = params;

	let result = {
		text: '',
		type: 'text',
		LevelUp: '',
		statue: ''
	};

	let mainMsg = inputStr.replace(/^\s/g, '').match(MESSAGE_SPLITOR); // 定義輸入字串

	// EXPUP 功能 + LevelUP 功能
	if (groupid) {
		let tempEXPUP = await EXPUP(groupid, userid, displayname, displaynameDiscord, membercount, tgDisplayname, discordMessage);
		result.LevelUp = tempEXPUP?.text || '';
		result.statue = tempEXPUP?.statue || '';
	}

	// 檢查是不是要停止 z_stop 功能
	if (groupid && mainMsg[0] && z_stop(mainMsg, groupid)) {
		return result;
	}

	// rolldice 擲骰功能
	try {
		let rollDiceResult = await rolldice({
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
		});
		if (rollDiceResult) {
			result = { ...result, ...rollDiceResult };
		}
	} catch (error) {
		console.error('rolldice GET ERROR:', error.stack, error.name, ' inputStr: ', inputStr, ' botname: ', botname, ' Time: ', new Date());
	}

	// cmdfunction .cmd 功能 z_saveCommand 功能
	if (result.cmd && result.text) {
		let cmdFunctionResult = await cmdfunction({
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
			result,
			titleName,
			tgDisplayname
		});
		if (cmdFunctionResult) {
			result = { ...result, ...cmdFunctionResult };
		}
	}

	// characterReRoll 功能
	if (result.characterReRoll) {
		let characterReRoll = await cmdfunction({
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
			result,
			titleName,
			tgDisplayname
		});
		if (result.text && characterReRoll.text) {
			result.text = `${result.characterName} 投擲 ${result.characterReRollName}\n${characterReRoll.text}\n======\n${result.text}`;
		} else {
			result.text = result.text || '';
			result.text += characterReRoll.text ? `======\n${characterReRoll.text}` : '';
		}
	}

	// state 功能
	if (result.state) {
		result.text = await stateText();
	}

	// courtMessage + saveLog
	await courtMessage({ result, botname, inputStr });
	return result;
}



const rolldice = async ({
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
	// Return early if mainMsg is null/undefined or empty
	if (!mainMsg || !Array.isArray(mainMsg) || mainMsg.length === 0) return;

	// Check if first element matches pattern and shift if true
	if (mainMsg[0] && mainMsg[0].match(/^\.(\d{1,2})$/)) {
		mainMsg.shift();
	}

	// Set default empty string for mainMsg[1] if undefined
	if (!mainMsg[1]) mainMsg[1] = '';

	const idList = Object.values(exports);
	const findTarget = idList.find(item => {
		if (item && item.prefixs && typeof item.prefixs === 'function') {
			const prefixList = item.prefixs();
			if (!Array.isArray(prefixList)) return false;

			return prefixList.some(prefix => {
				// Check if mainMsg[0] exists and matches first prefix
				if (!mainMsg || !mainMsg[0] || !prefix || !prefix.first) return false;
				const firstMatch = mainMsg[0].match(prefix.first);
				if (!firstMatch) return false;

				// Check second prefix if it exists
				if (prefix.second === null) return true;
				return mainMsg[1] && mainMsg[1].match(prefix.second);
			});
		}
		return false;
	});

	return findTarget;
}

async function stateText() {
    let state = await getState() || '';
    if (!Object.keys(state).length || !state.LogTime) return;

    const cleanDateTime = (dateStr) => dateStr
        .replace(' GMT+0800 (Hong Kong Standard Time)', '')
        .replace(' GMT+0800 (GMT+08:00)', '');

    const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // 使用 Promise.all 同時獲取所有統計數據
    const [levelSystemCount, characterCardCount, userCount] = await Promise.all([
        schema.trpgLevelSystem.countDocuments({ Switch: '1' })
            .catch(error => console.error('analytics #266 mongoDB error: ', error.name, error.reason)),
        schema.characterCard.countDocuments({})
            .catch(error => console.error('analytics #267 mongoDB error: ', error.name, error.reason)),
        schema.firstTimeMessage.countDocuments({})
            .catch(error => console.error('analytics #268 mongoDB error: ', error.name, error.reason))
    ]);

    return `【📊 HKTRPG系統狀態報告】
╭────── ⏰時間資訊 ──────
│ 系統啟動:
│ 　• ${cleanDateTime(state.StartTime)}
│ 現在時間:
│ 　• ${cleanDateTime(state.LogTime)}
│
├────── 🎲擲骰統計 ──────
│ 各平台使用次數:
│ 　• Line　　 ${formatNumber(state.LineCountRoll)}
│ 　• Discord　${formatNumber(state.DiscordCountRoll)}
│ 　• Telegram ${formatNumber(state.TelegramCountRoll)}
│ 　• Whatsapp ${formatNumber(state.WhatsappCountRoll)}
│ 　• 網頁版　 ${formatNumber(state.WWWCountRoll)}
│
├────── 📊系統數據 ──────
│ 功能使用統計:
│ 　• 經驗值群組 ${formatNumber(levelSystemCount)}
│ 　• 角色卡數量 ${formatNumber(characterCardCount)}
│ 　• 使用者總數 ${formatNumber(userCount)}
│
├────── ⚙️系統資訊 ──────
│ 隨機數生成:
│ 　• random-js	• nodeCrypto
╰──────────────`;
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
	const zStopData = exports.z_stop.initialize().save;
	if (!zStopData) return false;

	const groupInfo = zStopData.find(e => e.groupid == groupid);
	if (!groupInfo || !groupInfo.blockfunction) return false;

	const match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()));
	if (match) {
		if (debugMode) console.log('Match AND STOP');
		return true;
	}
	return false;
}



module.exports.debugMode = debugMode;
module.exports.parseInput = parseInput;
module.exports.findRollList = findRollList