'use strict';
// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
const start = async () => {
	await require('fs').readdirSync('./roll/').forEach(async function (file) {
		if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
			const name = file.replace('.js', '');
			exports[name] = await require('../roll/' + file);
		}
	});
};
start();
const messageTimethenUpload = 50;
//50次 多少條訊息會上傳一次LOG
const oneDay = 24 * 60 * 60 * 1000;
//一日 多久會上傳一次LOG紀錄
const oneMinuts = 1;
//60000 多久可以升級及增加經驗
const RollingLog = {
	RealTimeRollingLogfunction: {
		LastTimeLog: '',
		StartTime: '',
		LogTime: '',
		DiscordCountRoll: 0,
		DiscordCountText: 0,
		LineCountRoll: 0,
		LineCountText: 0,
		TelegramCountRoll: 0,
		TelegramCountText: 0,
		WWWCountRoll: 0,
		WWWCountText: 0,
		WhatsappCountRoll: 0,
		WhatsappCountText: 0
	}
};
const records = require('../modules/records.js');
var simpleCourt = 0;
records.get('RealTimeRollingLog', (msgs) => {
	if (msgs && msgs[0] && msgs[0].RealTimeRollingLogfunction)
		RollingLog.RealTimeRollingLogfunction = {
			LastTimeLog: msgs[0].RealTimeRollingLogfunction.LastTimeLog || '',
			StartTime: msgs[0].RealTimeRollingLogfunction.StartTime || '',
			LogTime: msgs[0].RealTimeRollingLogfunction.LogTime || '',
			DiscordCountRoll: msgs[0].RealTimeRollingLogfunction.DiscordCountRoll || 0,
			DiscordCountText: msgs[0].RealTimeRollingLogfunction.DiscordCountText || 0,
			LineCountRoll: msgs[0].RealTimeRollingLogfunction.LineCountRoll || 0,
			LineCountText: msgs[0].RealTimeRollingLogfunction.LineCountText || 0,
			TelegramCountRoll: msgs[0].RealTimeRollingLogfunction.TelegramCountRoll || 0,
			TelegramCountText: msgs[0].RealTimeRollingLogfunction.TelegramCountText || 0,
			WWWCountRoll: msgs[0].RealTimeRollingLogfunction.WWWCountRoll || 0,
			WWWCountText: msgs[0].RealTimeRollingLogfunction.WWWCountText || 0,
			WhatsappCountRoll: msgs[0].RealTimeRollingLogfunction.WhatsappCountRoll || 0,
			WhatsappCountText: msgs[0].RealTimeRollingLogfunction.WhatsappCountText || 0

		};
	//console.log('RollingLog', RollingLog)
	simpleCourt = 0;
});
const msgSplitor = (/\S+/ig);

//Log everyday 01:00

let result = {
	text: '',
	type: 'text',
	LevelUp: ''
};

//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫
//格式是 exports.骰組檔案名字.function名
var parseInput = async function (inputStr, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount, CAPTCHA) {
	//console.log('InputStr: ' + inputStr);
	result = {
		text: '',
		type: 'text',
		LevelUp: ''
	};
	let trigger = '';
	let stopmark = 0;

	let mainMsg = {};
	inputStr = inputStr.replace(/^\s/g, '');
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
	stopmark = await z_stop(mainMsg, groupid);
	if (stopmark == 1) return result;
	if (!inputStr) return result;

	//rolldice
	let rollDiceResult = await rolldice(inputStr, groupid, userid, userrole, mainMsg, botname, displayname, channelid, displaynameDiscord, membercount);
	if (rollDiceResult) {
		result = await JSON.parse(JSON.stringify(Object.assign({}, result, rollDiceResult)));
	} else {
		result.text = '';
	}

	//cmdfunction  .cmd 功能   z_saveCommand 功能
	if (mainMsg && mainMsg[0].toLowerCase() == '.cmd' && mainMsg[1] && mainMsg[1].toLowerCase() != 'help' && mainMsg[1].toLowerCase() != 'add' && mainMsg[1].toLowerCase() != 'show' && mainMsg[1].toLowerCase() != 'del' && result.text) {
		let cmdFunctionResult = await cmdfunction(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount, result);
		if (typeof cmdFunctionResult === 'object' && cmdFunctionResult !== null) {
			result = await Object.assign({}, result, cmdFunctionResult);
		} else {
			result.text = '';
		}

	}
	if (result.characterReRoll) {
		let characterReRoll = await cmdfunction(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount, result);
		result = await Object.assign({}, result, characterReRoll);
		if (result.text && result.characterName) {
			result.text = result.characterName + ' 投擲 ' + result.characterReRollName + ':\n' + result.text;
		}
	}

	//courtMessage + saveLog
	await courtMessage(result, botname, inputStr);

	//return result
	result.CAPTCHA = CAPTCHA;
	return result;
};

async function courtMessage(result, botname, inputStr) {
	if (result && result.text) {
		//SAVE THE LOG
		if (simpleCourt != null) {
			switch (botname) {
				case 'Discord':
					console.log('Discord \'s inputStr: ', inputStr);
					RollingLog.RealTimeRollingLogfunction.DiscordCountRoll++;
					break;
				case 'Line':
					console.log('   Line \'s inputStr: ', inputStr);
					RollingLog.RealTimeRollingLogfunction.LineCountRoll++;
					break;
				case 'Telegram':
					console.log('Telegram\'s inputStr: ', inputStr);
					RollingLog.RealTimeRollingLogfunction.TelegramCountRoll++;
					break;
				case 'Whatsapp':
					console.log('Whatsapp\'s inputStr: ', inputStr);
					RollingLog.RealTimeRollingLogfunction.WhatsappCountRoll++;
					break;
				case 'www':
					console.log('     WWW\'s inputStr: ', inputStr);
					RollingLog.RealTimeRollingLogfunction.WhatsappCountRoll++;
					break;
				default:
					break;
			}
			simpleCourt++;
			//await saveLog();
		}



		return result;
	} else {
		if (simpleCourt != null) {
			switch (botname) {
				case 'Discord':
					RollingLog.RealTimeRollingLogfunction.DiscordCountText++;
					break;
				case 'Line':
					RollingLog.RealTimeRollingLogfunction.LineCountText++;
					break;
				case 'Telegram':
					RollingLog.RealTimeRollingLogfunction.TelegramCountText++;
					break;
				case 'Whatsapp':
					RollingLog.RealTimeRollingLogfunction.WhatsappCountText++;
					break;
				case 'WWW':
					RollingLog.RealTimeRollingLogfunction.WWWCountText++;
					break;
				default:
					break;
			}
			simpleCourt++;

		}

	}
	await saveLog();
	return null;
}

async function cmdfunction(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount, result) {
	let msgSplitor = (/\S+/ig);
	//console.log('result.text', result.text.toString().replace(mainMsg[1], ""))
	inputStr = result.text.toString().replace(mainMsg[1], '');
	//console.log(inputStr)
	mainMsg = inputStr.match(msgSplitor); //定義輸入字串
	trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
	//console.log('inputStr2: ', inputStr)
	result.text = '';
	//檢查是不是要停止
	let tempResut = await rolldice(inputStr, groupid, userid, userrole, mainMsg, botname, displayname, channelid, displaynameDiscord, membercount);
	if (typeof tempResut === 'object' && tempResut !== null) {
		return tempResut;
	}
	console.log('inputStr2: ', inputStr);
}


//上傳用
async function saveLog() {
	//假如沒有StartTime 或過了一天則上載中途紀錄到MLAB
	//console.log(Date.now() - RollingLog.RealTimeRollingLogfunction.StartTime)
	if (!RollingLog.RealTimeRollingLogfunction.StartTime) {
		RollingLog.RealTimeRollingLogfunction.StartTime = Date(Date.now()).toLocaleString('en-US', {
			timeZone: 'Asia/HongKong'
		});
	}

	if (!RollingLog.RealTimeRollingLogfunction.LastTimeLog || Date.now() - RollingLog.RealTimeRollingLogfunction.LastTimeLog >= (oneDay)) {
		RollingLog.RealTimeRollingLogfunction.LastTimeLog = Date.now();
		//上傳中途紀錄MLAB
		//RollingLogfunction
		//PUSH 推送
		let temp = {
			LogTime: Date(Date.now()).toLocaleString('en-US', {
				timeZone: 'Asia/HongKong'
			}),
			DiscordCountRoll: RollingLog.RealTimeRollingLogfunction.DiscordCountRoll,
			DiscordCountText: RollingLog.RealTimeRollingLogfunction.DiscordCountText,
			LineCountRoll: RollingLog.RealTimeRollingLogfunction.LineCountRoll,
			LineCountText: RollingLog.RealTimeRollingLogfunction.LineCountText,
			TelegramCountRoll: RollingLog.RealTimeRollingLogfunction.TelegramCountRoll,
			TelegramCountText: RollingLog.RealTimeRollingLogfunction.TelegramCountText,
			WWWCountRoll: RollingLog.RealTimeRollingLogfunction.WWWCountRoll,
			WWWCountText: RollingLog.RealTimeRollingLogfunction.WWWCountText,
			WhatsappCountRoll: RollingLog.RealTimeRollingLogfunction.WhatsappCountRoll,
			WhatsappCountText: RollingLog.RealTimeRollingLogfunction.WhatsappCountText
		};
		records.pushtrpgSaveLogfunction('RollingLog', temp, () => {
			//console.log('SAVE LOG')
		});
	}
	//每50次上傳即時紀錄到MLAB
	if (!RollingLog.RealTimeRollingLogfunction.LastTimeLog || Date.now() - RollingLog.RealTimeRollingLogfunction.LastTimeLog >= (oneDay) || simpleCourt % messageTimethenUpload == 0 || simpleCourt == 1) {
		//simpleCourt % 50 == 0 || simpleCourt == 1
		//MLAB
		//RealTimeRollingLogfunction
		//SET 紀錄
		let temp = {
			LogTime: Date(Date.now()).toLocaleString('en-US', {
				timeZone: 'Asia/HongKong'
			}),
			StartTime: RollingLog.RealTimeRollingLogfunction.StartTime,
			LastTimeLog: RollingLog.RealTimeRollingLogfunction.LastTimeLog,
			DiscordCountRoll: RollingLog.RealTimeRollingLogfunction.DiscordCountRoll,
			DiscordCountText: RollingLog.RealTimeRollingLogfunction.DiscordCountText,
			LineCountRoll: RollingLog.RealTimeRollingLogfunction.LineCountRoll,
			LineCountText: RollingLog.RealTimeRollingLogfunction.LineCountText,
			TelegramCountRoll: RollingLog.RealTimeRollingLogfunction.TelegramCountRoll,
			TelegramCountText: RollingLog.RealTimeRollingLogfunction.TelegramCountText,
			WWWCountRoll: RollingLog.RealTimeRollingLogfunction.WWWCountRoll,
			WWWCountText: RollingLog.RealTimeRollingLogfunction.WWWCountText,
			WhatsappCountRoll: RollingLog.RealTimeRollingLogfunction.WhatsappCountRoll,
			WhatsappCountText: RollingLog.RealTimeRollingLogfunction.WhatsappCountText
		};
		records.settrpgSaveLogfunctionRealTime('RealTimeRollingLog', temp, () => {
			//console.log('SAVE REAL TIME LOG')
		});

	}
	//console.log("RollingLog: ", RollingLog)
	return null;
}

async function EXPUP(groupid, userid, displayname, displaynameDiscord, membercount) {
	let levelSys = exports.z_Level_system;
	let isConfigEnable = false;
	let isUpdateMLAB = false;
	let gid = 0;
	let uid = 0;
	let uidx = 0;
	//EXP: math.floor(math.random() * 10) + 15,
	let expEarn = await exports.rollbase.Dice(9) + 15;

	if (!levelSys) {
		return;
	}

	if (!levelSys.initialize()) {
		return;
	}

	let levelSysFunc = levelSys.initialize().trpgLevelSystemfunction;
	if (!levelSysFunc) return;
	levelSysFunc.forEach(function (val, idx) {
		//1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
		if ((val.groupid == groupid) && (val.Switch == '1')) {
			isConfigEnable = true;
			gid = idx;
		}
	});

	if (!isConfigEnable) {
		return;
	}

	let usrLevelSysFunc = levelSysFunc[gid].trpgLevelSystemfunction;
	usrLevelSysFunc.some(async function (val, idx) {
		//2. 有 -> 檢查有沒USER 資料
		if (val.userid == userid) {
			uid = userid;
			uidx = idx;
			//4. 有-> 檢查上次紀錄的時間 超過60000 (1分鐘) 即增加1-10 經驗值
			if (new Date(Date.now()) - new Date(val.LastSpeakTime) <= oneMinuts) {
				return true;
			}
			isUpdateMLAB = true;
			val.EXP = val.EXP + expEarn;
			val.LastSpeakTime = Date.now();
			val.name = displaynameDiscord || displayname || '無名';
			//5. 檢查現LEVEL 需不需要上升. =5 / 6 * LVL * (2 * LVL * LVL + 27 * LVL + 91)
			let cLevel = (Number(val.Level) + 1);
			if ((5 / 6 * cLevel * (2 * cLevel * cLevel + 27 * cLevel + 91)) <= val.EXP) {
				//現EXP >於需求LV
				//LVUP
				val.Level++;
			}
			return true;
		}
	});

	if (uid) {
		if (isUpdateMLAB) {
			//8. 更新MLAB資料
			records.settrpgLevelSystemfunctionEXPup('trpgLevelSystem', levelSysFunc[gid], usrLevelSysFunc, () => {});
			if (levelSysFunc[gid].Hidden == 1) {
				return await LevelUP(userid, displayname, displaynameDiscord, membercount, gid, uidx);
			}
		}
		return;
	}

	//3. 沒有 -> 新增
	let temp = {
		groupid: groupid,
		trpgLevelSystemfunction: {
			userid: userid,
			name: displayname || '無名',
			EXP: expEarn,
			Level: '0',
			LastSpeakTime: Date.now()
		}
	};

	usrLevelSysFunc.push(temp.trpgLevelSystemfunction);
	records.settrpgLevelSystemfunctionNewUser('trpgLevelSystem', temp, () => {});
}

async function LevelUP(userid, displayname, displaynameDiscord, membercount, tempGPID, tempGPuserID) {
	//1. 讀取LEVELUP語
	let username = displaynameDiscord || displayname || '無名';
	let userlevel = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level;
	let userexp = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP;
	//console.log('rply.trpgLevelSystemfunction[i]',
	let usermember_count = membercount || exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.length;
	let userRanking = await ranking(userid, exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction);

	let userRankingPer = Math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
	let userTitle = await exports.z_Level_system.checkTitle(userlevel, exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].Title);
	let tempUPWord = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].LevelUpWord || '恭喜 {user.name}《{user.title}》，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！';
	return tempUPWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count).replace(/{user.title}/ig, userTitle);

	//2. 回應BOT

}

async function ranking(who, data) {
	let array = [];
	let answer = '0';
	for (let key in data) {
		await array.push(data[key]);
	}

	array.sort(function (a, b) {
		return b.EXP - a.EXP;
	});

	let rank = 1;
	//console.log('array.length', array.length)
	//console.log('array', array)
	for (let i = 0; i < array.length; i++) {
		if (i > 0 && array[i].EXP < array[i - 1].EXP) {
			rank++;
		}
		array[i].rank = rank;
	}
	for (let b = 0; b < array.length; b++) {
		if (array[b].userid == who)
			answer = b + 1;
		//  document.write(b + 1);

	}
	//console.log('answer', answer)
	return answer;
}



async function z_stop(mainMsg, groupid) {
	if (exports.z_stop && exports.z_stop.initialize() && exports.z_stop.initialize().save && exports.z_stop.initialize().save[0] && exports.z_stop.initialize().save[0].blockfunction && exports.z_stop.initialize().save[0].blockfunction.length > 0 && mainMsg && mainMsg[0]) {
		for (let i = 0; i < exports.z_stop.initialize().save.length; i++) {
			if ((new RegExp(exports.z_stop.initialize().save[i].blockfunction.join('|'), 'i')).test(mainMsg[0]) && exports.z_stop.initialize().save[i].groupid == groupid && exports.z_stop.initialize().save[i].blockfunction.length > 0) {
				console.log('Match AND STOP');
				return 1;
			}
		}
	}
}

var rolldice = async function (inputStr, groupid, userid, userrole, mainMsg, botname, displayname, channelid, displaynameDiscord, membercount) {
	//	console.log(exports)
	//在下面位置開始分析trigger
	if (!groupid) {
		groupid = 0;
	}
	/*
			[{
				prefixs: [{
					first: /^[.]al$/i,
					second: /\d+/
				}, {
					first: /^[.]al$/i,
					second: /\abc\d+/
				}],
				name: 'Alevel'
			}, {
				prefixs: [{
					first: /^[.]CC$/i,
					second: /\d+/
				}, {
					first: /^[.]ef$/i,
					second: /bc\d+/
				}],
				name: 'CC'
			}]
			*/
	if (mainMsg && !mainMsg[1]) mainMsg[1] = '';
	//把exports objest => Array
	let idList = await Object.keys(exports).map(i => exports[i]);
	let findTarget = await idList.find(item => {
		if (item.prefixs && item.prefixs()) {
			for (let index = 0; index < item.prefixs().length; index++) {
				if (mainMsg[0].match(item.prefixs()[index].first) && (mainMsg[1].match(item.prefixs()[index].second) || item.prefixs()[index].second == null)) {
					return true;
				}
			}
		}
	});
	if (!findTarget) {
		return null;
	} else {
		console.log('            trigger: ', inputStr);
		let tempsave = await findTarget.rollDiceCommand(inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount);
		//console.log('tempsave: ', tempsave)
		return tempsave;
	}



	/*
		let breakFlag = false;
		for (let v in exports) {
			//console.log('v: ', v)
			if (exports.hasOwnProperty(v)) {
				if (breakFlag === true) {
					return false;
				}
				//0 = 不存在
				//1 = 符合
				//2 = 不符合
				//以下是分析每組rolling prefixs的資料
				//以每次同步檢查第一第二個
				//例如第一組是 cc  第二組是 80
				//那條件式就是 /^cc$/i 和/^\d+$/
				if (mainMsg && !mainMsg[1]) mainMsg[1] = '';
				let checkmainMsg0 = 0;
				let checkmainMsg1 = 0;
				let findprefixs = 0;
				if (exports[v].prefixs && exports[v].prefixs()[0]) {
					for (let i = 0; i <= exports[v].prefixs().length - 1; i = i + 2) {
						checkmainMsg0 = 0;
						checkmainMsg1 = 0;
						if (exports[v].prefixs()[i] && exports[v].prefixs()[i]) {
							checkmainMsg0 = 2;
							if (exports[v].prefixs()[i + 1] && exports[v].prefixs()[i + 1]) {
								checkmainMsg1 = 2;
							}
							if (mainMsg && exports[v].prefixs()[i] && exports[v].prefixs()[i].test(mainMsg[0])) {
								checkmainMsg0 = 1;
							}
							if (mainMsg && exports[v].prefixs()[i + 1] && exports[v].prefixs()[i + 1].test(mainMsg[1])) {
								checkmainMsg1 = 1;
							}
							if (checkmainMsg0 <= 1 && checkmainMsg1 <= 1 && checkmainMsg0 + checkmainMsg1 >= 1) {
								findprefixs = 1;
								i = exports[v].prefixs().length + 1;
								breakFlag = true;
							}
						}
					}
				}



				if (findprefixs == 1) {
					console.log('             trigger: ', inputStr);
					let tempsave = await exports[v].rollDiceCommand(inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount);
					//console.log('tempsave: ', tempsave)
					return await tempS();

					async function tempS() {
						if (tempsave) {
							for (let key in tempsave) {
								if (tempsave.hasOwnProperty(key)) {
									result[key] = tempsave[key];
								}
							}

						}

						if (result.text)
							return result;
					}
				}
			}
		}

*/

};


module.exports.EXPUP = EXPUP;
module.exports.parseInput = parseInput;
module.exports.rolldice = rolldice;