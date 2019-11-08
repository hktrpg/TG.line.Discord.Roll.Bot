// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
require('fs').readdirSync('./roll/').forEach(function (file) {
	if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
		var name = file.replace('.js', '');
		exports[name] = require('../roll/' + file);
	}
});
var myDate = new Date();
let simpleCourt = 0;
var RollingLog = {
	RealTimeRollingLogfunction: {
		StartTime: "",
		LogTime: "",
		DiscordCountRoll: 0,
		DiscordCountText: 0,
		LineCountRoll: 0,
		LineCountText: 0,
		TelegramCountRoll: 0,
		TelegramCountText: 0
	},
	RollingLogfunction: [{
		LogTime: "",
		DiscordCountRoll: 0,
		DiscordCountText: 0,
		LineCountRoll: 0,
		LineCountText: 0,
		TelegramCountRoll: 0,
		TelegramCountText: 0
	}]
};
const records = require('../modules/records.js');

records.get('RollingLog', (msgs) => {
	console.log(msgs)
	if (msgs && msgs.RealTimeRollingLogfunction)
		RollingLog = msgs

})

const math = require('mathjs');
const BootTime = new Date(new Date().toLocaleString("en-US", {
	timeZone: "Asia/Shanghai"
}));
var CountTime = {};
//Log everyday 01:00
//Format: 
//TG
try {
	let result = {
		text: '',
		type: 'text',
		LevelUp: ''
	};

	//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫 
	//格式是 exports.骰組檔案名字.function名
	function parseInput(inputStr, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount) {
		//console.log('InputStr: ' + inputStr);
		_isNaN = function (obj) {
			return isNaN(parseInt(obj));
		}
		result = {
			text: '',
			type: 'text',
			LevelUp: ''
		};
		let trigger = ""
		let stopmark = 0;
		let msgSplitor = (/\S+/ig);
		let mainMsg = "";
		mainMsg[0] = ""
		mainMsg[1] = ""
		mainMsg[2] = ""
		mainMsg = inputStr.match(msgSplitor); //定義輸入字串
		if (mainMsg)
			trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
		//對比mongoose資料
		//console.log('stop')
		//檢查是不是要停止
		stopmark = z_stop(mainMsg, groupid);
		//檢查是不是開啓LV 功能

		//console.log('mainMsgAA',mainMsg)
		if (stopmark != 1) {
			result = rolldice(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount)
			//console.log("OK")
		}

		//z_saveCommand 功能
		if (mainMsg && mainMsg[0].toLowerCase() == ".cmd" && mainMsg[1] && mainMsg[1].toLowerCase() != "help" && mainMsg[1].toLowerCase() != "add" && mainMsg[1].toLowerCase() != "show" && mainMsg[1].toLowerCase() != "del" && result.text) {
			//console.log('result.text', result.text.toString().replace(mainMsg[1], ""))
			inputStr = result.text.toString().replace(mainMsg[1], "")
			//console.log(inputStr)
			mainMsg = inputStr.match(msgSplitor); //定義輸入字串
			trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
			//console.log('inputStr2: ', inputStr)
			result.text = ""
			//檢查是不是要停止
			z_stop(mainMsg, groupid);
			result = rolldice(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount)
			console.log('inputStr2: ', inputStr)
		}
		//LEVEL功能
		if (groupid)
			EXPUP();
		if (result && (result.text || result.LevelUp)) {
			if (result.text) {
				console.log('inputStr: ', inputStr)
				//SAVE THE LOG
				switch (botname) {
					case "Discord":
						RollingLog.RealTimeRollingLogfunction.DiscordCountRoll++

					case "Line":
						RollingLog.RealTimeRollingLogfunction.LineCountRoll++;

					case "Telegram":
						RollingLog.RealTimeRollingLogfunction.TelegramCountRoll++

					default:
						simpleCourt++;
						saveLog();
						break;
				}
			}
			if (result.LevelUp)
				console.log('LV UP')
			return result;

		} else {
			switch (botname) {
				case "Discord":
					RollingLog.RealTimeRollingLogfunction.DiscordCountText++

				case "Line":
					RollingLog.RealTimeRollingLogfunction.LineCountText++;

				case "Telegram":
					RollingLog.RealTimeRollingLogfunction.TelegramCountText++

				default:
					simpleCourt++;
					saveLog();
					break;
			}
		}

		return null;

		function saveLog() {
			//假如沒有StartTime 或過了一天則上載中途紀錄到MLAB
			if (!RollingLog.RealTimeRollingLogfunction.StartTime || Date.now() - RollingLog.RealTimeRollingLogfunction.StartTime >= (24 * 60 * 60 * 1000)) {
				RollingLog.RealTimeRollingLogfunction.StartTime = Date.now();
				//上傳中途紀錄MLAB
				//RollingLogfunction
			}
			RollingLog.RealTimeRollingLogfunction.LogTime = Date.now();
			//每50次上傳即時紀錄到MLAB
			if (simpleCourt % 50 == 0 || simpleCourt == 1) {
				//MLAB
				//RealTimeRollingLogfunction
			}
			console.log("RollingLog: ", RollingLog)
		}
		function EXPUP() {
			let tempEXPconfig = 0;
			let tempGPID = 0;
			let tempGPuserID = 0;
			let tempGPHidden = 0;
			//1. 檢查GROUP ID 有沒有開啓CONFIG 功能 1
			if (exports.z_Level_system && exports.z_Level_system.initialize() && exports.z_Level_system.initialize().trpgLevelSystemfunction && exports.z_Level_system.initialize().trpgLevelSystemfunction[0]) {
				for (let a = 0; a < exports.z_Level_system.initialize().trpgLevelSystemfunction.length; a++) {
					if (exports.z_Level_system.initialize().trpgLevelSystemfunction[a].groupid == groupid && exports.z_Level_system.initialize().trpgLevelSystemfunction[a].Switch == "1") {
						tempEXPconfig = 1;
						tempGPID = a;
					}
					//檢查CONFIG開啓
				}
			}

			if (tempEXPconfig == 1) {
				let tempIsUser = 0;
				//2. 有 -> 檢查有沒USER 資料
				for (let b = 0; b < exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.length; b++) {
					if (exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[b].userid == userid) {
						tempIsUser = userid;
						tempGPuserID = b;
					}
				}

				//3. 沒有 -> 新增
				if (tempIsUser == 0) {
					let temp = {
						groupid: groupid,
						trpgLevelSystemfunction: {
							userid: userid,
							name: displayname || '無名',
							EXP: math.floor(math.random() * 10) + 15,
							Level: "0",
							LastSpeakTime: Date.now()
						}
					}

					exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.push(temp.trpgLevelSystemfunction)

					records.settrpgLevelSystemfunctionNewUser('trpgLevelSystem', temp, () => {
						//records.get('trpgLevelSystem', (msgs) => {
						//	exports.z_Level_system.initialize().trpgLevelSystemfunction = msgs
						//  console.log(rply.trpgLevelSystemfunction)
						// console.log(rply);
						//})
					})

				} else if (tempIsUser != 0) {
					//4. 有-> 檢查上次紀錄的時間 超過60001 (1分鐘) 即增加1-10 經驗值
					if (new Date(Date.now()) - new Date(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].LastSpeakTime) > 60001) {
						exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP + math.floor(math.random() * 10) + 15;
						exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].LastSpeakTime = Date.now();
						exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].name = displaynameDiscord || displayname || '無名'
						//5. 檢查現LEVEL 需不需要上升. =5 / 6 * LVL * (2 * LVL * LVL + 27 * LVL + 91)
						if ((5 / 6 * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) * (2 * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) + 27 * (Number(exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level) + 1) + 91)) <= exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP) {
							//現EXP >於需求LV
							//LVUP
							exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level++;
							if (exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].Hidden == 1) {
								//6. 需要 -> 檢查有沒有開啓通知
								result.LevelUp = LevelUP(tempGPID, tempGPuserID);
							}
						}


						//8. 更新MLAB資料
						records.settrpgLevelSystemfunctionEXPup('trpgLevelSystem', exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID], exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction, () => {


						})

					}
				}

			}


		}

		function LevelUP(tempGPID, tempGPuserID) {
			//1. 讀取LEVELUP語
			let username = displaynameDiscord || displayname || "無名"
			let userlevel = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].Level;
			let userexp = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction[tempGPuserID].EXP;
			//console.log('rply.trpgLevelSystemfunction[i]',
			let usermember_count = membercount || exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction.length;
			let userRanking = ranking(userid, exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].trpgLevelSystemfunction);
			let userRankingPer = math.ceil(userRanking / usermember_count * 10000) / 100 + '%';
			let tempUPWord = exports.z_Level_system.initialize().trpgLevelSystemfunction[tempGPID].LevelUpWord || "恭喜 {user.name}，你的克蘇魯神話知識現在是 {user.level}點了！\n現在排名是{server.member_count}人中的第{user.Ranking}名！"
			return tempUPWord.replace(/{user.name}/ig, username).replace(/{user.level}/ig, userlevel).replace(/{user.exp}/ig, userexp).replace(/{user.Ranking}/ig, userRanking).replace(/{user.RankingPer}/ig, userRankingPer).replace(/{server.member_count}/ig, usermember_count)
			//2. 回應BOT

		}
	}

	function ranking(who, data) {
		var array = [];
		let answer = "0"
		for (var key in data) {
			array.push(data[key]);

		}

		array.sort(function (a, b) {
			return b.EXP - a.EXP;
		});

		var rank = 1;
		//console.log('array.length', array.length)
		//console.log('array', array)
		for (var i = 0; i < array.length; i++) {
			if (i > 0 && array[i].EXP < array[i - 1].EXP) {
				rank++;
			}
			array[i].rank = rank;
		}
		for (var b = 0; b < array.length; b++) {
			if (array[b].userid == who)
				answer = b + 1;
			//  document.write(b + 1);

		}
		//console.log('answer', answer)
		return answer;
	}



	function z_stop(mainMsg, groupid) {
		if (exports.z_stop && exports.z_stop.initialize() && exports.z_stop.initialize().save && exports.z_stop.initialize().save[0].blockfunction && exports.z_stop.initialize().save[0].blockfunction.length > 0 && mainMsg && mainMsg[0]) {
			for (var i = 0; i < exports.z_stop.initialize().save.length; i++) {
				if ((new RegExp(exports.z_stop.initialize().save[i].blockfunction.join("|"), "i")).test(mainMsg[0]) && exports.z_stop.initialize().save[i].groupid == groupid && exports.z_stop.initialize().save[i].blockfunction.length > 0) {
					console.log('Match AND STOP')
					return 1
				}
			}
		}
	}

	function rolldice(inputStr, groupid, userid, userrole, mainMsg, trigger, botname, displayname, channelid, displaynameDiscord, membercount) {
		//在下面位置開始分析trigger
		if (!groupid) groupid = 0
		var breakFlag = false;
		Object.keys(exports).forEach(v => {
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
			if (exports[v].prefixs()[0] && exports[v].prefixs()[0]) {
				for (var i = 0; i <= exports[v].prefixs().length - 1; i = i + 2) {
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
							breakFlag = true
						}
					}
				}
			}



			if (findprefixs == 1) {
				console.log('trigger: ', inputStr)
				let tempsave = exports[v].rollDiceCommand(inputStr, mainMsg, groupid, userid, userrole, botname, displayname, channelid, displaynameDiscord, membercount)
				if (tempsave)
					Object.keys(tempsave).forEach(v => {
						result[v] = tempsave[v]
					})
			}
		})

		return result

	}


} catch (e) {
	console.log('error: ' + e)
}

module.exports = {
	parseInput: parseInput,
	rolldice: rolldice
};