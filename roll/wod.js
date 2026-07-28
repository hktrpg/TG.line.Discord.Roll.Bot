"use strict";
const { SlashCommandBuilder } = require('discord.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/i18n/roll-i18n.js');
let rollbase = require('./rollbase.js');
let variables = {};

/** .5wd8 / .5wd10+2 / .5wd8-1+2 */
const WOD_REGEX = /^[.](\d+)(wd|wod)(\d{0,2})((?:[+-]\d+)*)$/i;

const gameName = function (params = {}) {
    return resolveGameName(params, 'wod.game_name', '【WOD黑暗世界】.xWDy');
}

const gameType = function () {
	return 'Dice:WOD:hktrpg'
}
const prefixs = function () {
	return [{
		first: WOD_REGEX,
		second: null
	}]
}
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'wod.help');
}
const initialize = function () {
	return variables;
}

const rollDiceCommand = async function ({ mainMsg, locale, t }) {
    const translate = getT({ locale, t });
	let rply = {
		default: 'on',
		type: 'text',
		text: ''
	};
	let matchwod = WOD_REGEX.exec(mainMsg[0]);
	if (matchwod && matchwod[1] >= 1 && matchwod[1] <= 600)
		rply.text = await wod(mainMsg[0], mainMsg[1], translate);
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
	discordCommand: discordCommand,
	WOD_REGEX
};
/**
 * WOD黑暗世界
 * @param {.5WD6} triggermsg 
 * @param {文字描述} text 
 */

async function wod(triggermsg, text, translate) {
    const t = translate || getT({});

	let returnStr = triggermsg + ' [';
	let varcou = 0;
	let varsu = 0;
	let match = WOD_REGEX.exec(triggermsg);
	let rerollMin = match[3] === '' ? 10 : Number(match[3]);
	if (rerollMin <= 3) {
		return t('wod.reroll_min');
	}

	for (let i = 0; i < Number(match[1]); i++) {
		varcou = rollbase.Dice(10)
		returnStr += varcou + ', ';
		if (varcou >= rerollMin) {
			i--
		}
		if (varcou >= 8) {
			varsu++;
		}
	}
	// Support multiple modifiers: .5wd8-1+2 → net +1
	const modifiers = match[4] ? match[4].match(/[+-]\d+/g) : null;
	if (modifiers) {
		for (const mod of modifiers) {
			varsu += Number(mod);
		}
	}
	const rolls = returnStr.replace(/[,][ ]$/, '').replace(triggermsg + ' [', '');
	const suffix = text != null ? ' ; ' + text : '';
	return t('wod.result', { cmd: triggermsg, rolls, count: varsu, suffix });
}
