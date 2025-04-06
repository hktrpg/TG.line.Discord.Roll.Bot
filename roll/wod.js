"use strict";
let rollbase = require('./rollbase.js');
let variables = {};
const { SlashCommandBuilder } = require('discord.js');

const gameName = function () {
	return '【WOD黑暗世界】.xWDy'
}

const gameType = function () {
	return 'Dice:WOD:hktrpg'
}
const prefixs = function () {
	return [{
		first: /^[.](\d+)(wd)(\d|)((\+|-)(\d+)|)$/i,
		second: null
	}]
}
const getHelpMessage = async function () {
    return `【🌑世界of黑暗擲骰系統】
╭────── 🎲基本格式 ──────
│ • .[骰數]Wd[加骰值][+額外成功數]
│ • 可在指令後方空格加入描述文字
│
├────── 🎯判定規則 ──────
│ • 骰出8-10為成功
│ • 10會額外再骰一次
│ • 加骰值可調整重骰數值
│ • 可加入固定成功數
│
├────── 📊參數說明 ──────
│ [骰數]:
│ 　• 要擲骰的D10數量
│ 　• 1-100之間
│
│ [加骰值]:
│ 　• 決定重骰的最小值
│ 　• 預設為10
│ 　• 8-10之間
│
│ [額外成功數]:
│ 　• 加入固定成功數
│ 　• 可為正負值
│
├────── 📝範例指令 ──────
│ • .3wd8
│ 　- 擲3顆D10
│ 　- 8以上成功
│ 　- 10重骰
│
│ • .15wd9+2
│ 　- 擲15顆D10
│ 　- 9以上成功
│ 　- 10重骰
│ 　- 總成功數+2
╰──────────────`
}
const initialize = function () {
	return variables;
}

const rollDiceCommand = async function ({ mainMsg }) {
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	let matchwod = /^[.](\d+)(wd|wod)(\d|)((\+|-)(\d+)|)$/i.exec(mainMsg[0]); //判斷式  [0]3wd8+10,[1]3,[2]wd,[3]8,[4]+10,[5]+,[6]10  
	if (matchwod && matchwod[1] >= 1 && matchwod[1] <= 600)
		rply.text = await wod(mainMsg[0], mainMsg[1]);
	return rply;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('wd')
            .setDescription('世界of黑暗擲骰系統')
            .addIntegerOption(option => 
                option.setName('dice_count')
                    .setDescription('要擲骰的D10數量 (1-100)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(100))
            .addIntegerOption(option => 
                option.setName('reroll_value')
                    .setDescription('決定重骰的最小值 (8-10，預設為10)')
                    .setRequired(false)
                    .setMinValue(8)
                    .setMaxValue(10))
            .addIntegerOption(option => 
                option.setName('bonus_success')
                    .setDescription('額外成功數 (可為正負值)')
                    .setRequired(false))
            .addStringOption(option => 
                option.setName('description')
                    .setDescription('描述文字')
                    .setRequired(false)),
        async execute(interaction) {
            const diceCount = interaction.options.getInteger('dice_count');
            const rerollValue = interaction.options.getInteger('reroll_value');
            const bonusSuccess = interaction.options.getInteger('bonus_success');
            const description = interaction.options.getString('description');
            
            let command = `.${diceCount}wd`;
            
            if (rerollValue) {
                command += `${rerollValue}`;
            }
            
            if (bonusSuccess !== null) {
                const sign = bonusSuccess >= 0 ? '+' : '';
                command += `${sign}${bonusSuccess}`;
            }
            
            if (description) {
                command += ` ${description}`;
            }
            
            return command;
        }
    }
];

module.exports = {
	rollDiceCommand: rollDiceCommand,
	initialize: initialize,
	getHelpMessage: getHelpMessage,
	prefixs: prefixs,
	gameType: gameType,
	gameName: gameName,
	discordCommand: discordCommand
};
/**
 * WOD黑暗世界
 * @param {.5WD6} triggermsg 
 * @param {文字描述} text 
 */

async function wod(triggermsg, text) {

	let returnStr = triggermsg + ' [';
	let varcou = 0;
	let varsu = 0;
	let match = /^[.](\d+)(wd|wod)(\d|)((\+|-)(\d+)|)$/i.exec(triggermsg); //判斷式  [0]3wd8+10,[1]3,[2]wd,[3]8,[4]+10,[5]+,[6]10  
	if (match[3] == "") {
		match[3] = 10
	}
	if (match[3] <= 3) {
		return '加骰最少比3高';
	}

	for (let i = 0; i < Number(match[1]); i++) {
		//varcou = Math.floor(Math.random() * 10) + 1;
		varcou = rollbase.Dice(10)
		returnStr += varcou + ', ';
		if (varcou >= match[3]) {
			i--
		}
		if (varcou >= 8) {
			varsu++;
		}
	}
	if (match[5] == '+') {
		for (let i = 0; i < Number(match[6]); i++) {
			varsu++;
		}
	}
	if (match[5] == '-') {

		for (let i = 0; i < Number(match[6]); i++) {
			varsu--;
		}
	}
	returnStr = returnStr.replace(/[,][ ]$/, '] → ' + varsu + '成功');
	if (text != null) {
		returnStr += ' ; ' + text;
	}
	return returnStr;
}