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
	function parseInput(inputStr, groupid, userid, userrole, callback) {
		//console.log('InputStr: ' + inputStr);
		_isNaN = function (obj) {
			return isNaN(parseInt(obj));
		}
		result = {
			text: '',
			type: 'text'
		};

		let msgSplitor = (/\S+/ig);
		let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
		let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階

		//在下面位置開始分析trigger
		Object.keys(exports).forEach(v => {
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
				for (i = 0; i <= exports[v].prefixs().length - 1; i = i + 2) {
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
							i = 99999;
						}
					}
				}
			}



			if (findprefixs == 1) {
				console.log('trigger: ', trigger, ' v: ', v)
				let temp = exports[v].rollDiceCommand(inputStr, mainMsg, groupid, userid, userrole)
				if (temp)
					Object.keys(temp).forEach(v => {
						result[v] = temp[v]
					})
			}
		})




		if (!process.env.mongoURL) {
			if (result && result.text) {
				console.log('inputStr: ', inputStr)
				return result
			}
		} else return callback(mainMsg, groupid, result);

	}

	function stop(mainMsg, groupid) {
		//對比mongoose資料
		//console.log('stop')
		if (process.env.mongoURL) {
			Object.keys(exports).forEach(v => {

				if (exports[v].initialize().save && exports[v].initialize().save[0].blockfunction && exports[v].initialize().save[0].blockfunction.length > 0) {
					for (var i = 0; i < exports[v].initialize().save.length; i++) {
						if ((new RegExp(exports[v].initialize().save[i].blockfunction.join("|"), "i")).test(mainMsg[0]) && exports[v].initialize().save[i].groupid == groupid && exports[v].initialize().save[i].blockfunction.length > 0) {
							console.log('Done?')
							result.text = '';

						}
					}
				}
			})
			return result
		}
	}


} catch (e) {
	console.log('error: ' + e)
}

module.exports = {
	parseInput: parseInput,
	stop: stop
};