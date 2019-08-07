// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
require('fs').readdirSync('./roll/').forEach(function (file) {
	if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
		var name = file.replace('.js', '');
		exports[name] = require('../roll/' + file);
	}
});
try {
	let result = {
		text: '',
		type: 'text'
	};

	//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫 
	//格式是 exports.骰組檔案名字.function名
	function parseInput(inputStr, groupid, userid, userrole, name) {
		//console.log('InputStr: ' + inputStr);
		_isNaN = function (obj) {
			return isNaN(parseInt(obj));
		}
		result = {
			text: '',
			type: 'text'
		};
		let stopmark = 0;
		let msgSplitor = (/\S+/ig);
		let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
		let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
		//對比mongoose資料
		//console.log('stop')
		//檢查是不是要停止
		stopmark = z_stop(mainMsg, groupid);
		//console.log('mainMsgAA',mainMsg)
		if (stopmark != 1) {
			result = rolldice(inputStr, groupid, userid, userrole, mainMsg, trigger, stopmark)
			console.log("OK")
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
			z_stop();
			result = rolldice(inputStr, groupid, userid, userrole, mainMsg, trigger)
			console.log('inputStr2: ', inputStr)
		}
		if (result && result.text) {
			console.log('inputStr: ', inputStr)
			return result;

		}


	}


	function z_stop(mainMsg, groupid) {
		if (exports.z_stop && exports.z_stop.initialize() && exports.z_stop.initialize().save && exports.z_stop.initialize().save[0].blockfunction && exports.z_stop.initialize().save[0].blockfunction.length > 0) {
			for (var i = 0; i < exports.z_stop.initialize().save.length; i++) {
				if ((new RegExp(exports.z_stop.initialize().save[i].blockfunction.join("|"), "i")).test(mainMsg[0]) && exports.z_stop.initialize().save[i].groupid == groupid && exports.z_stop.initialize().save[i].blockfunction.length > 0) {
					console.log('Match AND STOP')
					return 1
				}
			}
		}
	}

	function rolldice(inputStr, groupid, userid, userrole, mainMsg, trigger) {
		//在下面位置開始分析trigger
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
			if (!mainMsg[1]) mainMsg[1] = '';
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
						if (exports[v].prefixs()[i] && exports[v].prefixs()[i].test(mainMsg[0])) {
							checkmainMsg0 = 1;
						}
						if (exports[v].prefixs()[i + 1] && exports[v].prefixs()[i + 1].test(mainMsg[1])) {
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
				console.log('trigger: ', trigger)
				let tempsave = exports[v].rollDiceCommand(inputStr, mainMsg, groupid, userid, userrole)
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