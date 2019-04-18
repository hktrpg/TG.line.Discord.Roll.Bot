var rollbase = require('./rollbase.js');
var rply = {
	default: 'on',
	type: 'text',
	text: ''
};

gameName = function () {
	return 'WOD黑暗世界 .xWDy'
}

gameType = function () {
	return 'WOD:hktrpg'
}
prefixs = function () {
	return /^[.](\d+)(wd)(\d|)((\+|-)(\d+)|)$/i
}
getHelpMessage = function () {
	return "【WOD 黑暗世界擲骰】" + "\
	\n [.](骰數)Wd(加骰)(+成功數) (問題)\
	\n例子 .3wd8 .15wd9+2\
		\n "
}
initialize = function () {
	return rply;
}

rollDiceCommand = function (inputStr, mainMsg) {
	return wod(mainMsg[0], mainMsg[1]);
}


module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName
};

////////////////////////////////////////
//////////////// WOD黑暗世界
////////////////////////////////////////
function wod(triggermsg, text) {
	var returnStr = triggermsg + ' [';
	var varcou = 0;
	var varsu = 0;
	var match = /^[.](\d+)(wd|wod)(\d|)((\+|-)(\d+)|)$/i.exec(triggermsg);	//判斷式  [0]3wd8+10,[1]3,[2]wd,[3]8,[4]+10,[5]+,[6]10  
	if (match[3] == "") { match[3] = 10 }
	if (match[3] <= 2) {
		rply.text = '加骰最少比2高';
		return rply;
	}

	for (var i = 0; i < Number(match[1]); i++) {
		varcou = Math.floor(Math.random() * 10) + 1;
		returnStr += varcou + ', ';
		if (varcou >= match[3]) { i-- }
		if (varcou >= 8) {
			varsu++;
		}
	}
	if (match[5] == '+') {
		for (var i = 0; i < Number(match[6]); i++) {
			varsu++;
		}
	}
	if (match[5] == '-') {

		for (var i = 0; i < Number(match[6]); i++) {
			varsu--;
		}
	}
	returnStr = returnStr.replace(/[,][ ]$/, '] → ' + varsu + '成功');
	if (text != null) {
		returnStr += ' ; ' + text;
	}
	rply.text = returnStr;
	return rply;
}