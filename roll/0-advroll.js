"use strict";
const mathjs = require('mathjs');
const { SlashCommandBuilder } = require('discord.js');
const rollbase = require('./rollbase.js');
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
    return `【🎲進階擲骰指南】
╭────── 📐數學計算 ──────
│ 指令: .ca (不支援擲骰)
│ 
│ 🔢 基本運算: .ca 1.2 * (2 + 4.5)
│ 📏 單位轉換: 12.7 米 to inch 
│ 📊 進階算式: sin(45 deg) ^ 2
│ ⚖️ 重量換算: 5磅轉斤
│ 📐 長度換算: 10米轉呎 10米=吋
├────── 🎲特殊擲骰 ──────
│ D66系列:
│ 　D66   - 一般D66
│ 　D66s  - 小數字在前
│ 　D66n  - 大數字在前
├────── 🎯進階擲骰 ──────
│ 基本骰組:
│ 　5B10   - 不加總的擲骰
│ 　5B10S  - 不加總並排序
│
│ 比較判定:
│ 　5B10<>=x  - 計算大於小於x的數目
│ 　5B10 (D)x - 空格=大於，D=小於
│ 　如: 5B10 5 = 5B10>=5
│ 　　 5B10 D5 = 5B10<=5
│
│ 獎勵骰組:
│ 　5U10 8   - 每骰出8獲得獎勵骰
│ 　5U10 8 9 - 計算大於9的數目
├────── 🎯快速範圍 ──────
│ .int 20 50 - 立即骰出20-50
╰──────────────`
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
			if (/[=]/ig.test(inputStr))
				if (/^((?!(>=|<=|=>|=<|\d=|[)]=)).)*$/ig.test(inputStr)) {
					inputStr = inputStr.replaceAll(/[=]/g, ' to ');
				}
			try {
				rply.text = mathjs.evaluate(inputStr.toLowerCase().replace(/\.ca/i, '').replaceAll('磅', 'lb').replaceAll('公斤', 'kg').replaceAll('盎司', 'oz').replaceAll('英吋', 'inch').replaceAll('公分', 'cm').replaceAll('公釐', 'mm').replaceAll('克', 'g').replaceAll('公尺', 'm').replaceAll('碼', 'yd').replaceAll('桿', 'rd').replaceAll('英里', 'mi').replaceAll('千米', 'km').replaceAll('厘米', 'cm').replaceAll('毫米', 'mm').replaceAll('微米', 'µm').replaceAll('毫克', 'mg').replaceAll('公克', 'hg').replaceAll('斤', 'kg').replaceAll('米', 'm').replaceAll('英尺', 'ft').replaceAll('尺', 'ft').replaceAll('角度', 'deg').replaceAll('度', 'deg').replaceAll('呎', 'ft').replaceAll('吋', 'inch').replaceAll('轉換', ' to ').replaceAll('轉', ' to ').replaceAll('換', ' to ').replaceAll('√', 'sqrt').replaceAll('π', 'pi'));
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
			if (matchxby && matchxby[4] > 1 && matchxby[4] < 10_000 && matchxby[2] > 0 && matchxby[2] <= 600)
				rply.text = xBy(mainMsg[0].replace(/S/i, ""), mainMsg[1], mainMsg[2], sortMode, botname);
			return rply;
		}
		case regexxUy.test(mainMsg[0]) && mainMsg[1] <= 10_000:
			matchxuy = regexxUy.exec(mainMsg[0]); //判斷式  ['5U10',  '5', 'U', '10']
			if (matchxuy && matchxuy[1] > 0 && matchxuy[1] <= 600 && matchxuy[3] > 0 && matchxuy[3] <= 10_000) {
				rply.text = xUy(matchxuy, mainMsg[1], mainMsg[2], mainMsg[3]);
			}
			return rply;
		case /^[.][i][n][t]$/i.test(mainMsg[0]) && mainMsg[1] <= 100_000 && mainMsg[2] <= 100_000:
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
	},
	{
		data: new SlashCommandBuilder()
			.setName('d66')
			.setDescription('D66 擲骰')
			.addStringOption(option => option.setName('text').setDescription('附加說明').setRequired(false)),
		async execute(interaction) {
			const text = interaction.options.getString('text');
			return text ? `d66 ${text}` : 'd66';
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('d66s')
			.setDescription('D66s 擲骰（小者在前）')
			.addStringOption(option => option.setName('text').setDescription('附加說明').setRequired(false)),
		async execute(interaction) {
			const text = interaction.options.getString('text');
			return text ? `d66s ${text}` : 'd66s';
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('d66n')
			.setDescription('D66n 擲骰（大者在前）')
			.addStringOption(option => option.setName('text').setDescription('附加說明').setRequired(false)),
		async execute(interaction) {
			const text = interaction.options.getString('text');
			return text ? `d66n ${text}` : 'd66n';
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('broll')
			.setDescription('進階B骰，如 5B10, 5B10S, 5B10>=5')
			.addStringOption(option => option.setName('expression').setDescription('例如 5B10、5B10S>=5').setRequired(true))
			.addStringOption(option => option.setName('arg1').setDescription('可選: 額外參數或說明').setRequired(false))
			.addStringOption(option => option.setName('arg2').setDescription('可選: 額外參數或說明').setRequired(false)),
		async execute(interaction) {
			const expression = interaction.options.getString('expression');
			const arg1 = interaction.options.getString('arg1');
			const arg2 = interaction.options.getString('arg2');
			let cmd = expression;
			if (arg1) cmd += ` ${arg1}`;
			if (arg2) cmd += ` ${arg2}`;
			return cmd;
		}
	},
	{
		data: new SlashCommandBuilder()
			.setName('uroll')
			.setDescription('進階U骰，如 5U10 8 或 5U10 8 9')
			.addStringOption(option => option.setName('expression').setDescription('例如 5U10').setRequired(true))
			.addStringOption(option => option.setName('threshold').setDescription('觸發加骰的數字，如 8').setRequired(true))
			.addStringOption(option => option.setName('target').setDescription('可選: 成功門檻，如 9').setRequired(false)),
		async execute(interaction) {
			const expression = interaction.options.getString('expression');
			const threshold = interaction.options.getString('threshold');
			const target = interaction.options.getString('target');
			let cmd = `${expression} ${threshold}`;
			if (target) cmd += ` ${target}`;
			return cmd;
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
	if (temptriggermsg.replaceAll(/\d/ig, '').replaceAll(/[+]|[-]|[*]|[/]/ig, '')) {
		return;
	}
	if (match02 && match02[4].replaceAll(/\d/ig, '').replaceAll(/[+]|[-]|[*]|[/]/ig, '')) {
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
	if (!match[5] && match01 && match01[2] && !Number.isNaN(match01[3])) {
		match[5] = "<=";
		match[7] = "<";
		match[8] = "=";
		match[9] = match01[3];
		triggermsg += "<=" + match01[3];
		//match = /^((\d+)(b)(\d+))(|(([<]|[>]|)(|[=]))(\d+))$/i.exec(triggermsg);
		text = "";
		if (text02) text = text02;
	}
	if (!match[5] && match01 && !match01[2] && !Number.isNaN(match01[3])) {
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
	returnStr = returnStr.replaceAll(/, $/ig, '');

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
		return [...text.toString()]
			.map(char => '\u0336' + char + '\u0336')
			.join('')
}