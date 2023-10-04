"use strict";
const rollbase = require('./rollbase.js');
const mathjs = require('mathjs');
const { SlashCommandBuilder } = require('discord.js');
const variables = {};
const regexxBy = /^((\d+)(b)(\d+))(S?)/i
const regexxUy = /^(\d+)(u)(\d+)/i
const gameName = function () {
	return '【進階擲骰】 .ca (計算)|D66(sn)|5B10 Dx|5U10 x y|.int x y'
}

const gameType = function () {
	return 'Dice:advRoll'
}
const prefixs = function () {
	return [{
		first: /^[.][c][a]$/i,
		second: null
	},
	{
		first: /^d66s$|^d66$|^d66n$/i,
		second: null
	},
	{
		first: /^(\d+)(u)(\d+)$/i,
		second: /\d+/
	},
	{
		first: regexxBy,
		second: null
	},
	{
		first: /^[.][i][n][t]$/i,
		second: /\d+/
	}
	]
}
const getHelpMessage = function () {
	return `【進階擲骰】

【數學計算】.ca： (不支援擲骰) 
例如: .ca 1.2 * (2 + 4.5) ， 12.7 米 to inch 
sin(45 deg) ^ 2  5磅轉斤 10米轉呎 10米=吋

D66 D66s D66n：	骰出D66 s數字小在前 n大在前

5B10：	不加總的擲骰 
5B10S：	不加總的擲骰，並按大至小排序 
5B10<>=x ：	如上,另外計算其中有多少粒大於小於X 
5B10 (D)x ：	如上,用空格取代, 即大於, 使用D即小於
即 5B10 5 相當於 5B10>=5 5B10 D5 相當於 5B10<=5  

5U10 8：	進行5D10 每骰出一粒8會有一粒獎勵骰 
5U10 8 9：	如上,另外計算其中有多少粒大於9 

.int 20 50: 立即骰出20-50
`
}

const initialize = function () {
	return variables;
}

const rollDiceCommand = async function ({
	inputStr,
	mainMsg,
	botname
}) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	} //let result = {};
	let matchxby = {},
		matchxuy = {}
	switch (true) {
		case /^[.][c][a]$/i.test(mainMsg[0]) && (/^help$/i.test(mainMsg[1]) || !mainMsg[1]):
			rply.text = this.getHelpMessage();
			rply.quotes = true;
			return rply;
		case /^[.][c][a]$/i.test(mainMsg[0]):
			//為了令= 轉TO 功能正常, 又不會影響常規計數如 1*5+4>=5
			if (inputStr.match(/[=]/ig))
				if (inputStr.match(/^((?!(>=|<=|=>|=<|\d=|[)]=)).)*$/ig)) {
					inputStr = inputStr.replace(/[=]/g, ' to ');
				}
			try {
				rply.text = mathjs.evaluate(inputStr.toLowerCase().replace(/\.ca/i, '').replace(/磅/g, 'lb').replace(/公斤/g, 'kg').replace(/盎司/g, 'oz').replace(/英吋/g, 'inch').replace(/公分/g, 'cm').replace(/公釐/g, 'mm').replace(/克/g, 'g').replace(/公尺/g, 'm').replace(/碼/g, 'yd').replace(/桿/g, 'rd').replace(/英里/g, 'mi').replace(/千米/g, 'km').replace(/厘米/g, 'cm').replace(/毫米/g, 'mm').replace(/微米/g, 'µm').replace(/毫克/g, 'mg').replace(/公克/g, 'hg').replace(/斤/g, 'kg').replace(/米/g, 'm').replace(/英尺/g, 'ft').replace(/尺/g, 'ft').replace(/角度/g, 'deg').replace(/度/g, 'deg').replace(/呎/g, 'ft').replace(/吋/g, 'inch').replace(/轉換/g, ' to ').replace(/轉/g, ' to ').replace(/換/g, ' to ').replace(/√/g, 'sqrt').replace(/π/g, 'pi'));
			} catch (error) {
				//console.error('.ca ERROR FUNCTION', inputStr, error.message);
				rply.text = inputStr.replace(/\.ca\s+/i, '') + '\n→ ' + error.message;
				rply.text += `\n注: 本功能只為進行數學計算,不支援擲骰。
				例如: .ca 1.2 * (2 + 4.5) ， 12.7 米 to inch 
				sin(45 deg) ^ 2  5磅轉斤 10米轉呎 10米=吋
				5.08 cm + 2 inch   √(9)`
				return rply;
			}
			rply.text = inputStr.replace(/\.ca/i, '') + '\n→ ' + rply.text;
			return rply;
		case /^d66$/i.test(mainMsg[0]):
			rply.text = d66(mainMsg[1])
			return rply;
		case /^d66n$/i.test(mainMsg[0]):
			rply.text = d66n(mainMsg[1])
			return rply;
		case /^d66s$/i.test(mainMsg[0]):
			rply.text = d66s(mainMsg[1])
			return rply;
		case regexxBy.test(mainMsg[0]): {
			matchxby = regexxBy.exec(mainMsg[0]);
			//判斷式 0:"5b10<=80" 1:"5b10" 2:"5" 3:"b" 4:"10" 5:"<=80" 6:"<=" 	7:"<" 8:"=" 	9:"80"
			let sortMode = (matchxby[5]) ? true : false;
			if (matchxby && matchxby[4] > 1 && matchxby[4] < 10000 && matchxby[2] > 0 && matchxby[2] <= 600)
				rply.text = xBy(mainMsg[0].replace(/S/i, ""), mainMsg[1], mainMsg[2], sortMode, botname);
			return rply;
		}
		case regexxUy.test(mainMsg[0]) && mainMsg[1] <= 10000:
			matchxuy = regexxUy.exec(mainMsg[0]); //判斷式  ['5U10',  '5', 'U', '10']
			if (matchxuy && matchxuy[1] > 0 && matchxuy[1] <= 600 && matchxuy[3] > 0 && matchxuy[3] <= 10000) {
				rply.text = xUy(matchxuy, mainMsg[1], mainMsg[2], mainMsg[3]);
			}
			return rply;
		case /^[.][i][n][t]$/i.test(mainMsg[0]) && mainMsg[1] <= 100000 && mainMsg[2] <= 100000:
			rply.text = '投擲 ' + mainMsg[1] + ' - ' + mainMsg[2] + '：\n→ ' + rollbase.DiceINT(mainMsg[1], mainMsg[2]);
			return rply
		default:
			break;
	}
}
//name execute
const discordCommand = [
	{
		data: new SlashCommandBuilder()
			.setName('ca')
			.setDescription('【數學計算】 (不支援擲骰) ')
			.addStringOption(option => option.setName('text').setDescription('輸入內容').setRequired(true)),
		async execute(interaction) {
			const text = interaction.options.getString('text')
			if (text !== null)
				return `.ca ${text}`
			else return `需要輸入內容\n 如 .ca 1.2 * (2 + 4.5) ， 12.7 米 to inch 
			sin(45 deg) ^ 2  5磅轉斤 10米轉呎 10米=吋`

		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('int')
			.setDescription('int 20 50: 立即骰出20-50')
			.addStringOption(option => option.setName('minnum').setDescription('輸入第一個數字').setRequired(true))
			.addStringOption(option => option.setName('maxnum').setDescription('輸入第二個數字').setRequired(true))
		,
		async execute(interaction) {
			const minNum = interaction.options.getString('minnum')
			const maxNum = interaction.options.getString('maxnum');
			if (minNum !== null && maxNum !== null)
				return `.int ${minNum} ${maxNum}`
			else return `需要輸入兩個數字\n 如 .int 20 50`

		}
	}
];

module.exports = {
	rollDiceCommand,
	initialize,
	getHelpMessage,
	prefixs,
	gameType,
	gameName,
	discordCommand
};
/*
 \n D66 D66s：	骰出D66 s小者固定在前\
  \n 5B10：	不加總的擲骰 會進行小至大排序 \
  \n 5B10 9：	如上,另外計算其中有多少粒大於9 \
  \n 5U10 8：	進行5D10 每骰出一粒8會有一粒獎勵骰 \
  \n 5U10 8 9：	如上,另外計算其中有多少粒大於9 \  
  */

/**
 * D66 
 */
function d66(text) {
	text = (text) ? '：' + text : '：';
	let returnStr = '';
	returnStr = 'D66' + text + '\n' + rollbase.Dice(6) + rollbase.Dice(6);
	return returnStr;
}
/**
 * 
 * D66S 
 */
function d66s(text) {
	text = (text) ? '：' + text : '：';
	let temp0 = rollbase.Dice(6);
	let temp1 = rollbase.Dice(6);
	let returnStr = '';
	if (temp0 >= temp1) {
		let temp2 = temp0;
		temp0 = temp1;
		temp1 = temp2;
	}
	returnStr = 'D66s' + text + '\n' + temp0 + temp1;
	return returnStr;
}
/**
 * D66N 
 */
function d66n(text) {
	text = (text) ? '：' + text : '：';
	let temp0 = rollbase.Dice(6);
	let temp1 = rollbase.Dice(6);
	let returnStr = '';
	if (temp0 <= temp1) {
		let temp2 = temp0;
		temp0 = temp1;
		temp1 = temp2;
	}

	returnStr = 'D66n' + text + '\n' + temp0 + temp1;
	return returnStr;
}
/***
 *	xBy 
 *  xBy<>=z  成功數1
 *  xBy Dz   成功數1
 */
function xBy(triggermsg, text01, text02, sortMode, botname) {
	let regex2 = /(([<]|[>])(|[=]))(\d+.*)/i;

	let temptriggermsg = triggermsg;
	let match = regexxBy.exec(temptriggermsg);
	//判斷式 0:"5b10+3<=6" 1:"5b10" 2:"5" 3:"b" 4:"10" 5:"<=80" 6:"<=" 	7:"<" 8:"=" 	9:"6"
	temptriggermsg = temptriggermsg.replace(regexxBy, '');
	let match02 = temptriggermsg.match(regex2);
	//["<=1+1", "<=", "<", "=", "1+1"]
	temptriggermsg = temptriggermsg.replace(regex2, '');
	if (temptriggermsg.replace(/\d/ig, '').replace(/[+]|[-]|[*]|[/]/ig, '')) {
		return;
	}
	if (match02 && match02[4].replace(/\d/ig, '').replace(/[+]|[-]|[*]|[/]/ig, '')) {
		return;
	}
	if (match02) {
		match[5] = match02[0] || ""
		match[6] = match02[1] || ""
		match[7] = match02[2] || ""
		match[8] = match02[3] || ""
		match[9] = mathjs.evaluate(match02[4]) || ""
	}

	let match01 = /^((|d)(\d+))$/i.exec(text01);
	//判斷式 0:"d5"  1:"d5" 2:"d" 3:"5" 
	let text = "";
	if (text01) text = text01;
	if (!match[5] && match01 && match01[2] && !isNaN(match01[3])) {
		match[5] = "<=";
		match[7] = "<";
		match[8] = "=";
		match[9] = match01[3];
		triggermsg += "<=" + match01[3];
		//match = /^((\d+)(b)(\d+))(|(([<]|[>]|)(|[=]))(\d+))$/i.exec(triggermsg);
		text = "";
		if (text02) text = text02;
	}
	if (!match[5] && match01 && !match01[2] && !isNaN(match01[3])) {
		match[5] = ">=";
		match[7] = ">";
		match[8] = "=";
		match[9] = match01[3];
		triggermsg += ">=" + match01[3];
		//match = /^((\d+)(b)(\d+))(|(([<]|[>]|)(|[=]))(\d+))$/i.exec(triggermsg);
		text = "";
		if (text02) text = text02;
	}
	let returnStr = '(' + triggermsg + ')';
	let varcou = new Array();
	let varsu = 0;
	for (let i = 0; i < Number(match[2]); i++) {
		varcou[i] = rollbase.Dice(match[4]);
	}
	if (sortMode) {
		varcou.sort((a, b) => b - a);
	}
	//varcou.sort(rollbase.sortNumber);
	//(5B7>6) → 7,5,6,4,4 → 

	for (let i = 0; i < varcou.length; i++) {
		switch (true) {
			case (match[7] == "<" && !match[8]):
				if (varcou[i] < match[9]) { varsu++; }
				else {
					varcou[i] = strikeThrough(varcou[i], botname);
				}
				break;
			case (match[7] == ">" && !match[8]):
				if (varcou[i] > match[9]) {
					varsu++;
				}
				else {
					varcou[i] = strikeThrough(varcou[i], botname);
				}
				break;
			case (match[7] == "<" && match[8] == "="):
				if (varcou[i] < match[9] || varcou[i] == match[9]) {
					varsu++;
				}
				else {
					varcou[i] = strikeThrough(varcou[i], botname);
				}
				break;
			case (match[7] == ">" && match[8] == "="):
				if (varcou[i] > match[9] || varcou[i] == match[9]) {
					varsu++;
				}
				else {
					varcou[i] = strikeThrough(varcou[i], botname);
				}
				break;
			case (match[7] == "" && match[8] == "="):
				if (varcou[i] == match[9]) {
					varsu++;
				}
				else {
					varcou[i] = strikeThrough(varcou[i], botname);
				}
				break;
			default:
				break;
		}
	}
	returnStr += ' → ' + varcou.join(', ');
	if (match[5]) returnStr += ' \n→ 成功數' + mathjs.evaluate(Number(varsu) + (temptriggermsg || 0));
	if (text) returnStr += ' ；　' + text;
	return returnStr;
}
/**
 * 
 * @param {xUy} triggermsg  
 * @param {*} text01 
 * @param {*} text02 
 * @param {*} text03
 * xUy
 * (5U10[8]) → 17[10,7],4,5,7,4 → 17/37(最大/合計)
 * (5U10[8]>8) → 1,30[9,8,8,5],1,3,4 → 成功數1 
 */

function xUy(triggermsg, text01, text02, text03) {

	let match = triggermsg //判斷式  5u19,5,u,19, 
	let returnStr = '(' + triggermsg + '[' + text01 + ']';
	if (Number(text02) <= Number(match[3]) && text02 != undefined) {
		returnStr += '>' + text02 + ') → ';
		if (text03 != undefined) returnStr += text03 + ' → ';
	} else {
		returnStr += ') → ';
		if (text02 != undefined) returnStr += text02 + ' → ';
	}
	let varcou = new Array();
	let varcouloop = new Array();
	let varcounew = new Array();
	if (text01 <= 2) {
		returnStr = '加骰最少比2高';
		return returnStr;
	}

	for (let i = 0; i < Number(match[1]); i++) {
		varcou[i] = rollbase.Dice(match[3]);
		varcounew[i] = varcou[i];
		varcouloop[i] = varcounew[i];
		for (; varcounew[i] >= text01;) {
			varcounew[i] = rollbase.Dice(match[3]);
			varcouloop[i] += ', ' + varcounew[i];
			varcou[i] += varcounew[i];
		}

	}
	for (let i = 0; i < varcouloop.length; i++) {
		if (varcouloop[i] == varcou[i]) {
			returnStr += varcou[i] + ', ';
		} else returnStr += varcou[i] + '[' + varcouloop[i] + '], ';

	}
	returnStr = returnStr.replace(/, $/ig, '');

	if (Number(text02) <= Number(match[3])) {
		let suc = 0;

		// (5U10[8]>8) → 1,30[9,8,8,5],1,3,4 → 成功數1
		for (let i = 0; i < varcou.length; i++) {
			if (Number(varcou[i]) >= Number(text02)) suc++;
		}
		returnStr += ' → 成功數' + suc;
	} else
	//  (5U10[8]) → 17[10,7],4,5,7,4 → 17/37(最大/合計)

	{
		returnStr += '\n → ' + Math.max.apply(null, varcou);
		returnStr += '/' + varcou.reduce(function (previousValue, currentValue) {
			return previousValue + currentValue;
		}) + '(最大/合計)';
	}
	return returnStr;
}

// eslint-disable-next-line no-unused-vars
function strikeThrough(text, botname) {
	if (text)
		return text.toString()
			.split('')
			.map(char => '\u0336' + char + '\u0336')
			.join('')
}