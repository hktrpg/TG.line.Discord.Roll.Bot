"use strict";
const { SlashCommandBuilder } = require('discord.js');
const rollbase = require('./rollbase.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
let variables = {};

const gameName = function (params = {}) {
    return resolveGameName(params, 'kc.game_name', '【貓貓鬼差】.kc xDy z');
}

const gameType = function () {
    return 'Dice:yumingkueichai:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^[.]KC$/i,
        second: /^(|4|5)d+((\d+)|)$/i
    }, {
        first: /^[.]KC$/i,
        second: null
    }]
}
const getHelpMessage = async function (params = {}) {
    return resolveHelp(params, 'kc.help', () => getT({ locale: 'zh-tw' })('kc.help'));
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    mainMsg,
    locale,
    t
}) {
    const translate = getT({ locale, t });
    const i18nParams = { locale, t };
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await getHelpMessage(i18nParams);
            return rply;
        case /^(|4|5)d+((\d+)|)$/i.test(mainMsg[1]):
            rply.text = await compareAllValues(mainMsg[1], mainMsg[2] || "", translate);
            return rply;
        default:
            break;
    }
}

async function compareAllValues(triggermsg, msg, translate) {
    const t = translate || getT({});
    let result = ""
    let rollresult = []
    let match = /^(|4|5)(d)(\d+|)$/i.exec(triggermsg);
    let x = match[1] || 4;
    let y = match[3] || 0
    let z = msg || 0
    if (y > 20) y = 20
    if (z > 20) z = 20
    if (z >= 1) {
        result = t('kc.target_header', { target: z });
    }
    for (let i = 0; i < x; i++) {
        rollresult[i] = rollbase.Dice(6)
    }
    result += t('kc.roll_line', { dice: rollresult.toString() });
    let temp = rollresult
    temp.sort(function (a, b) {
        return a - b
    });

    let first = true;
    for (let i = 0; i < temp.length; i++) {
        for (let j = 0; j < i; j++) {
            if (temp[j] == temp[i] && first == true) {
                first = false
                let tempresult = 0;
                let tempa = 0;
                let tempb = 0;
                let sum = 0;
                for (let a = temp.length; a >= 0; a--) {
                    if ((a != i && a != j && sum < 2) && temp[a] > 0) {
                        sum++
                        tempresult += temp[a]
                        if (sum == 1) {
                            tempa = temp[a]
                        }
                        if (sum == 2) {
                            tempb = temp[a]
                        }
                    }
                }
                if (x == 5 && tempa == 2 && tempb == 1 && temp[0] == 1 && temp[1] == 1 && temp[2] == 1 && temp[3] == 1 && temp[4] == 2) {
                    tempa = 1;
                    tempb = 1
                    tempresult = 2
                }
                if (y > 0) {
                    tempresult = Number(tempresult) + Number(y)
                }
                result += t('kc.achievement', { total: tempresult, a: tempa, b: tempb });
                if (y > 0) result += t('kc.modifier', { mod: y });
                if (tempa == 2 && tempb == 1) {
                    result += t('kc.dramatic_failure');
                } else if (z >= 1) {
                    result += z > tempresult ? t('kc.outcome_fail') : t('kc.outcome_success');
                }
            }
        }
    }
    if (first == true) {
        result += t('kc.fail_no_pair');
    }
    if (Number.isNaN(z)) {
        result += t('kc.note_suffix', { note: z });
    }
    return result;
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('kc')
            .setDescription('貓貓鬼差系統 - 擲骰判定')
            .addIntegerOption(option =>
                option.setName('target')
                    .setDescription('目標值 (1-20)')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('dice_count')
                    .setDescription('骰子數量 (4或5，預設為4)')
                    .setRequired(false)
                    .addChoices(
                        { name: '4顆骰子', value: 4 },
                        { name: '5顆骰子', value: 5 }
                    ))
            .addIntegerOption(option =>
                option.setName('modifier')
                    .setDescription('修正值 (1-20)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(20)),
        async execute(interaction) {
            const diceCount = interaction.options.getInteger('dice_count') || 4;
            const modifier = interaction.options.getInteger('modifier');
            const target = interaction.options.getInteger('target');
            
            let command = `.kc ${diceCount}D`;
            
            if (modifier) {
                command += `${modifier}`;
            }
            
            if (target) {
                command += ` ${target}`;
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
