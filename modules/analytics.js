"use strict";
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const readdir = util.promisify(fs.readdir);

// Create an index of available roll modules
const rollModules = new Map();

// Initialize the module index
(async function () {
	try {
		const files = await readdir('./roll/');
		for (const file of files) {
			const name = path.basename(file, '.js');
			if ((name !== 'index' && name !== 'demo') && file.endsWith('.js')) {
				rollModules.set(name.toLowerCase(), {
					name,
					path: path.join(__dirname, '../roll/', file)
				});
			}
		}
	} catch (error) {
		console.error('[Analytics] Error initializing roll modules:', error);
	}
}());

// Lazy loading function for roll modules
function getRollModule(moduleName) {
	if (!moduleName) return null;

	const moduleInfo = rollModules.get(moduleName.toLowerCase());
	if (!moduleInfo) return null;

	// Only require the module when it's first accessed
	if (!exports[moduleInfo.name]) {
		try {
			exports[moduleInfo.name] = require(moduleInfo.path);
		} catch (error) {
			console.error(`[Analytics] Error loading module ${moduleInfo.name}:`, error);
			return null;
		}
	}

	return exports[moduleInfo.name];
}

const schema = require('./schema.js');
const debugMode = (process.env.DEBUG) ? true : false;
const MESSAGE_SPLITOR = (/\S+/ig);
const courtMessage = require('./logs').courtMessage || function () {};
const getState = require('./logs').getState || function () {};
const EXPUP = require('./level').EXPUP || function () {};

// 創建一個統一的上下文類來管理參數
class RollContext {
	constructor(params) {
		this.inputStr = params.inputStr || "";
		this.groupid = params.groupid || null;
		this.userid = params.userid || null;
		this.userrole = params.userrole || 1;
		this.botname = params.botname || null;
		this.displayname = params.displayname || null;
		this.channelid = params.channelid || null;
		this.displaynameDiscord = params.displaynameDiscord || null;
		this.membercount = params.membercount || 0;
		this.discordClient = params.discordClient || null;
		this.discordMessage = params.discordMessage || null;
		this.titleName = params.titleName || '';
		this.tgDisplayname = params.tgDisplayname || '';
		this.mainMsg = this.inputStr.replaceAll(/^\s/g, '').match(MESSAGE_SPLITOR);
	}

	toParams() {
		return {
			inputStr: this.inputStr,
			groupid: this.groupid,
			userid: this.userid,
			userrole: this.userrole,
			mainMsg: this.mainMsg,
			botname: this.botname,
			displayname: this.displayname,
			channelid: this.channelid,
			displaynameDiscord: this.displaynameDiscord,
			membercount: this.membercount,
			discordClient: this.discordClient,
			discordMessage: this.discordMessage,
			titleName: this.titleName,
			tgDisplayname: this.tgDisplayname
		};
	}
}

const parseInput = async (params) => {
	const context = new RollContext(params);
	let result = {
		text: '',
		type: 'text',
		LevelUp: '',
		statue: ''
	};

	// EXPUP 功能 + LevelUP 功能
	if (context.groupid) {
		let tempEXPUP = await EXPUP(
			context.groupid,
			context.userid,
			context.displayname,
			context.displaynameDiscord,
			context.membercount,
			context.tgDisplayname,
			context.discordMessage
		);
		result.LevelUp = tempEXPUP?.text || '';
		result.statue = tempEXPUP?.statue || '';
	}

	// 檢查是不是要停止 z_stop 功能
	if (context.groupid && context.mainMsg[0] && z_stop(context.mainMsg, context.groupid)) {
		return result;
	}

	// rolldice 擲骰功能
	try {
		let rollDiceResult = await rolldice(context);
		if (rollDiceResult) {
			result = { ...result, ...rollDiceResult };
		}
	} catch (error) {
		console.error(`[Analytics] rolldice GET ERROR:
			Stack: ${error.stack}
			Name: ${error.name}
			Input: ${context.inputStr}
			Botname: ${context.botname}
			Time: ${new Date()}`);
	}

	// cmdfunction .cmd 功能 z_saveCommand 功能
	if (result.cmd && result.text) {
		let cmdFunctionResult = await cmdfunction({
			...context.toParams(),
			result
		});
		if (cmdFunctionResult) {
			result = { ...result, ...cmdFunctionResult };
		}
	}

	// characterReRoll 功能
	if (result.characterReRoll) {
		let characterReRoll = await cmdfunction({
			...context.toParams(),
			result
		});
		if (result.text && characterReRoll.text) {
			result.text = `${result.characterName} 投擲 ${result.characterReRollName}\n${characterReRoll.text}\n======\n${result.text}`;
		} else {
			result.text = result.text || '';
			if (characterReRoll && characterReRoll.text) {
				result.text += `======\n${characterReRoll.text}`;
			}
		}
	}

	// state 功能
	if (result.state) {
		result.text = await stateText();
	}

	// courtMessage + saveLog
	await courtMessage({ result, botname: context.botname, inputStr: context.inputStr });
	return result;
}

const rolldice = async (context) => {
	if (!context.groupid) {
		context.groupid = '';
	}
	let target = findRollList(context.mainMsg);
	if (!target) return null;
	(debugMode) ? console.log('[analytics]            trigger:', context.inputStr) : '';

	let rollTimes = context.inputStr.match(/^\.(\d{1,2})\s/);
	
	rollTimes ? rollTimes = rollTimes[1] : rollTimes = 1;
	rollTimes > 10 ? rollTimes = 10 : null;
	context.inputStr = context.inputStr.replace(/^\.\d{1,2}\s/, '');

	/^\.(\d{1,2})$/.test(context.mainMsg[0]) ? context.mainMsg.shift() : null;
	context.mainMsg = context.mainMsg.filter(item => item !== '');

	let retext = '';
	let tempsave = {};
	for (let index = 0; index < rollTimes; index++) {
		if (rollTimes > 1 && /^dice|^funny/i.test(target.gameType())) {
			let result = await target.rollDiceCommand(context.toParams());
			if (result && result.text) {
				retext += `#${index + 1}： ${result.text.replaceAll('\n', '')}\n`;
				tempsave = result;
			}
		} else {
			let result = await target.rollDiceCommand(context.toParams());
			if (result) {
				tempsave = result;
			}
		}
	}

	if (retext && tempsave) {
		tempsave.text = retext;
	}

	return tempsave || {};
}

function findRollList(mainMsg) {
	// Return early if mainMsg is null/undefined or empty
	if (!mainMsg || !Array.isArray(mainMsg) || mainMsg.length === 0) return;

	// Check if first element matches pattern and shift if true
	if (mainMsg[0] && /^\.(\d{1,2})$/.test(mainMsg[0])) {
		mainMsg.shift();
	}

	// Set default empty string for mainMsg[1] if undefined
	if (!mainMsg[1]) mainMsg[1] = '';

	// Special handling for .me and .mee commands - make sure they go to z_myname
	if (mainMsg[0] && (mainMsg[0].toLowerCase() === '.me' || mainMsg[0].toLowerCase() === '.mee')) {
		const zMyname = getRollModule('z_myname');
		if (zMyname) return zMyname;
	}

	// Iterate through available modules
	for (const [moduleName] of rollModules) {
		const module = getRollModule(moduleName);
		if (!module || !module.prefixs || typeof module.prefixs !== 'function') continue;

		const prefixList = module.prefixs();
		if (!Array.isArray(prefixList)) continue;

		const match = prefixList.some(prefix => {
			// Check if mainMsg[0] exists and matches first prefix
			if (!mainMsg || !mainMsg[0] || !prefix || !prefix.first) return false;
			const firstMatch = mainMsg[0].match(prefix.first);
			if (!firstMatch) return false;

			// Check second prefix if it exists
			if (prefix.second === null) return true;
			return mainMsg[1] && mainMsg[1].match(prefix.second);
		});

		if (match) return module;
	}

	return null;
}

async function stateText() {
	let state = await getState() || '';
	if (Object.keys(state).length === 0 || !state.LogTime) return '';

	const cleanDateTime = (dateStr) => dateStr
		.replace(' GMT+0800 (Hong Kong Standard Time)', '')
		.replace(' GMT+0800 (GMT+08:00)', '');

	const formatNumber = (num) => num.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");

	// 使用 Promise.all 同時獲取所有統計數據
	const [levelSystemCount, characterCardCount, userCount] = await Promise.all([
		schema.trpgLevelSystem.countDocuments({ Switch: '1' })
			.catch(error => console.error('[Analytics] MongoDB error:', error.name, error.reason)),
		schema.characterCard.countDocuments({})
			.catch(error => console.error('[Analytics] MongoDB error:', error.name, error.reason)),
		schema.firstTimeMessage.countDocuments({})
			.catch(error => console.error('[Analytics] MongoDB error:', error.name, error.reason))
	]);

	return `【📊 HKTRPG系統狀態報告】
╭────── ⏰時間資訊 ──────
│ 系統啟動:
│   • ${cleanDateTime(state.StartTime)}
│ 現在時間:
│   • ${cleanDateTime(state.LogTime)}
│
├────── 🎲擲骰統計 ──────
│ 各平台使用次數:
│   • Line     ${formatNumber(state.LineCountRoll)}
│   • Discord  ${formatNumber(state.DiscordCountRoll)}
│   • Telegram ${formatNumber(state.TelegramCountRoll)}
│   • Whatsapp ${formatNumber(state.WhatsappCountRoll)}
│   • 網頁版   ${formatNumber(state.WWWCountRoll)}
│
├────── 📊系統數據 ──────
│ 功能使用統計:
│   • 經驗值群組 ${formatNumber(levelSystemCount)}
│   • 角色卡數量 ${formatNumber(characterCardCount)}
│   • 使用者總數 ${formatNumber(userCount)}
│
├────── ⚙️系統資訊 ──────
│ 隨機數生成:
│   • random-js  • nodeCrypto
╰──────────────`;
}

async function cmdfunction({ result, ...context }) {
	let newInputStr = result.characterReRollItem || result.text;
	let mainMsg = newInputStr.match(MESSAGE_SPLITOR);
	let tempResut = {};

	try {
		tempResut = await rolldice(new RollContext({
			...context,
			inputStr: newInputStr,
			mainMsg
		}));
	} catch (error) {
		console.error(`[Analytics] cmdfunction GET ERROR:
			Error: ${error}
			Input: ${newInputStr}
			Botname: ${context.botname}
			Time: ${new Date()}`);
	}

	(debugMode) ? console.log('[analytics]            inputStr2:', newInputStr) : '';
	if (typeof tempResut === 'object' && tempResut !== null) {
		if (result.characterName) tempResut.text = `${result.characterName} 進行 ${result.characterReRollName} 擲骰\n ${tempResut.text}`
		return tempResut;
	}
	return;
}

function z_stop(mainMsg, groupid) {
	const zStopModule = getRollModule('z_stop');
	if (!zStopModule || typeof zStopModule.initialize !== 'function') return false;

	const saveData = zStopModule.initialize();
	if (!saveData || !saveData.save) return false;

	const groupInfo = saveData.save.find(e => e.groupid == groupid);
	if (!groupInfo || !groupInfo.blockfunction) return false;

	const match = groupInfo.blockfunction.find(e => mainMsg[0].toLowerCase().includes(e.toLowerCase()));
	if (match) {
		if (debugMode) console.log('[analytics] Match AND STOP');
		return true;
	}
	return false;
}

module.exports.debugMode = debugMode;
module.exports.parseInput = parseInput;
module.exports.findRollList = findRollList;