var rollbase = require('./rollbase.js');
var rply ={type : 'text'}; //type是必需的,但可以更改

////////////////////////////////////////
//////////////// DX3
////////////////////////////////////////
function dx(triggermsg) {
	//var varcou = 0;
	var finallynum = 0;
	var returnStr = triggermsg + ' → ';
	var match = /^(\d+)(dx)(\d|)(((\+|-)(\d+)|)((\+|-)(\d+)|))$/i.exec(triggermsg);	//判斷式  [0]2dx8-2+10,[1]2,[2]dx,[3]8,[4]-2+10,[5]-2,[6]-,[7]2,[8]+10,[9]+,[10]10  
//	console.log(match);
	if (match[3] == "") { match[3] = 10 }
	if (match[3] <= 2) {
		rply.text = '加骰最少比2高';
		return rply;
	}

	for (var round = 1; round > 0; round--) {
		[match, round, returnStr, finallynum] = dxroll(match, round, returnStr, finallynum);
	}
	returnStr = returnStr.replace(/[,][ ]+]/ig, ']');
	if (match[6] == '+') {
		for (var i = 0; i < Number(match[7]); i++) {
			finallynum++;
		}
	}
	if (match[6] == '-') {
		for (var i = 0; i < Number(match[7]); i++) {
			finallynum--;
		}
	}
	if (match[9] == '+') {
		for (var i = 0; i < Number(match[10]); i++) {
			finallynum++;
		}
	}
	if (match[9] == '-') {
		for (var i = 0; i < Number(match[10]); i++) {
			finallynum--;
		}
	}
	returnStr += match[4] + ' → ' + finallynum;
	rply.text = returnStr;
	return rply;

}

function dxroll(match, round, returnStr, finallynum) {
	var result = 0;
	var rollnum = match[1];
	match[1] = 0;
	var varcou = "";
	var varsu = "";
	for (var i = 0; i < rollnum; i++) {
		varcou = Math.floor(Math.random() * 10) + 1;
		if (varcou > result) { result = varcou }
		if (varcou >= Number(match[3])) {
			result = 10;
			match[1]++;
		}
		varsu += varcou + ', ';
	}
	returnStr += result + '[' + varsu + '] ';
	finallynum += Number(result);
	if (match[1] >= 1) {
		round++;
		returnStr += '+ ';
	}
	return [match, round, returnStr, finallynum];
}

module.exports = {
	dx:dx
};