// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
require('fs').readdirSync('./roll/').forEach(function (file) {
	if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
		var name = file.replace('.js', '');
		exports[name] = require('../roll/' + file);
	}
});
const records = require('./records.js'); // 新增這行
try {

	//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫 
	//格式是 exports.骰組檔案名字.function名
	function parseInput(inputStr) {
		//console.log('InputStr: ' + inputStr);
		_isNaN = function (obj) {
			return isNaN(parseInt(obj));
		}

		let msgSplitor = (/\S+/ig);
		let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
		let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
		let result = {
			text: '',
			type: 'text'
		};
		//在下面位置開始分析trigger


		Object.keys(exports).forEach(v => {
			if (exports[v].prefixs && trigger.match(exports[v].prefixs()) != null) {
				console.log('trigger: ', trigger, ' v: ', v)
				let temp = exports[v].rollDiceCommand(inputStr, mainMsg)
				if (temp)
					Object.keys(temp).forEach(v => {
						result[v] = temp[v]
					})
			}
		})
		if (result && result.text) {
			records.push(result);
			return result;
		}



	}

} catch (e) {
	console.log('error: ' + e)
}

module.exports = {
	parseInput: parseInput
};