"use strict";
const { SlashCommandBuilder } = require('discord.js');
const mathjs = require('mathjs')
const rollbase = require('./rollbase.js');
let variables = {};
const gameName = function () {
    return '【魔女狩獵之夜】.wn xDn+-y'
}

const gameType = function () {
    return 'Dice:witch-hunting-night:hktrpg'
}
const prefixs = function () {
    return [{
        first: /^.wn$/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【🌙魔女狩獵之夜】
╭────── 🎲標準擲骰 ──────
│ 指令格式:
│ 　• .wn [x]D[n]±[y]
│
│ 參數說明:
│ 　x: 骰池數量
│ 　n: 罪業值(成功判定值)
│ 　y: 調整值
│
│ 判定方式:
│ 　• 擲xD6，≧4為成功
│ 　• 預設成功值>3
│
├────── ⚔️進階擲骰 ──────
│ 成敗相抵:
│ 　• .wn [x]DD[n]±[y]
│ 　• 雙D模式：成功數-失敗數
│ 　• 結果可為負數
│
├────── ✨魔改規則 ──────
│ 指令格式:
│ 　• .wn [x]@D[n]±[y]
│
│ 判定方式:
│ 　• ≦罪業值視為失敗
│ 　• 可使用DD計算淨成功數
│
├────── 📝範例指令 ──────
│ 標準擲骰:
│ 　• .wn 3
│ 　  骰3次D6，≧4成功
│
│ 　• .wn 5D4+3
│ 　  骰5次D6，≧5成功，+3
│
│ 成敗相抵:
│ 　• .wn 3DD6+2
│ 　  計算淨成功數後+2
│
│ 魔改版:
│ 　• .wn 3@3+3
│ 　  ≦3失敗，計算後+3
│
│ 　• .wn 3@D3+2
│ 　  成敗相抵後+2
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
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]:
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        case /^\d/i.test(mainMsg[1]):
            if (mainMsg[1].replaceAll(/\d|[+]|[-]|[*]|[/]|[(]|[)]|[d]|[>]|[<]|[=]|[@]/ig, '')) return;

            rply.text = await WN(mainMsg[1]).then(async (result) => {
                return await WN2(result, mainMsg[2])
            });
            return rply;
        default:
            break;
    }
}

async function WN(message) {

    //x@n(+-y)(D)
    //xD(D)n(+-y)
    //4
    //5d6
    //5d6d
    //5dd6
    //5dd
    //5d6+5-5

    //5@6
    //5@5d
    //5@5-5
    //5@6-5D

    //[0]5 [1]^@|^D [2]D [3]!+-5 [4]+-5
    let key = [];
    let tempmessage = message;
    let regex = /^(\d+)/ig
    key[0] = tempmessage.match(regex) || 1
    tempmessage = tempmessage.replaceAll(regex, '')
    let regex1 = /^([@]|[d])/ig
    key[1] = tempmessage.match(regex1) || 'd'
    tempmessage = tempmessage.replaceAll(regex1, '')
    let regex999 = /\d+d\d+/ig;
    while (tempmessage.match(regex999) != null) {
        // let totally = 0
        let tempMatch = tempmessage.match(regex999)
        if (tempMatch[1] > 1000 || tempMatch[1] <= 0) return
        if (tempMatch[2] < 1 || tempMatch[2] > 9_000_000_000_000_000) return
        tempmessage = tempmessage.replace(/\d+d\d+/i, await Dice(tempmessage.match(/\d+d\d+/i)));
    }

    let regex2 = /d/ig
    key[2] = tempmessage.match(regex2) || ''
    tempmessage = tempmessage.replaceAll(regex2, '')
    let regex3 = /^\d+/
    key[3] = tempmessage.match(regex3) || '4'
    tempmessage = tempmessage.replace(regex3, '')
    key[4] = tempmessage || ''
    return key
}
async function Dice(msg) {
    if (msg)
        return rollbase.BuildRollDice(msg)
    else msg
}
async function WN2(key, message) {
    //[0]5 [1]^@|^D [2]D [3]!+-5 [4]+-5
    let result = [];
    let success = 0
    let False = 0;
    let time = key[0];
    let method = key[1] || "d";
    let special = key[2] || "";
    let betterthan = 3;
    let theSins = (key[3]) || 3
    if (method == "@") {
        betterthan = (key[3]) || 4
        if (betterthan >= 6)
            return "罪業6以上扣除5點罪業，增加一點代價"
    }
    if (method && method.toString().toLowerCase() == "d") {
        if (theSins >= 6)
            return "罪業超過6點時扣除6點罪業，轉化為一點代價"
        else
            if (theSins > 3)
                betterthan = (key[3])
    }
    let Adjustment = key[4] || "";

    if (time > 200) time = 200 //限制次數
    for (let i = 0; i < time; i++) {
        result[i] = rollbase.Dice(6);
        if (result[i] > betterthan)
            success++
        else
            False++
    }
    // time method special > betterthan ; 
    let temp = time + method + special + theSins + '>' + betterthan
    if (message)
        temp += '； ' + message
    temp += " \n[" + result + "]"
    let tempAdj = ''
    try {
        tempAdj = mathjs.evaluate(Adjustment)
    } catch {
        tempAdj = Adjustment
    }
    if (tempAdj)
        temp += ' ' + tempAdj + '修正'
    if (special) {
        //xD(D)n(+-y)
        temp += " -> " + mathjs.evaluate(success - False + Adjustment) + "成功"
        return temp
    }

    temp += " - > " + mathjs.evaluate(success + Adjustment) + "成功"
    return temp
    //export ->
    //6@6-5D
    //6D6D>3-5 -> X 成功
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('wn')
            .setDescription('【魔女狩獵之夜】標準擲骰')
            .addIntegerOption(option => option.setName('dice_count').setDescription('骰池數量 (1-200)').setRequired(true).setMinValue(1).setMaxValue(200))
            .addIntegerOption(option => option.setName('sin_value').setDescription('罪業值(成功判定值, 1-6)').setRequired(false).setMinValue(1).setMaxValue(6))
            .addStringOption(option => option.setName('adjustment').setDescription('調整值(如 +3, -2)').setRequired(false))
            .addStringOption(option => option.setName('comment').setDescription('備註').setRequired(false)),
        async execute(interaction) {
            const diceCount = interaction.options.getInteger('dice_count');
            const sinValue = interaction.options.getInteger('sin_value') || '';
            const adjustment = interaction.options.getString('adjustment') || '';
            const comment = interaction.options.getString('comment') || '';
            
            return `.wn ${diceCount}D${sinValue}${adjustment} ${comment}`.trim();
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('wndd')
            .setDescription('【魔女狩獵之夜】成敗相抵擲骰')
            .addIntegerOption(option => option.setName('dice_count').setDescription('骰池數量 (1-200)').setRequired(true).setMinValue(1).setMaxValue(200))
            .addIntegerOption(option => option.setName('sin_value').setDescription('罪業值(成功判定值, 1-6)').setRequired(false).setMinValue(1).setMaxValue(6))
            .addStringOption(option => option.setName('adjustment').setDescription('調整值(如 +3, -2)').setRequired(false))
            .addStringOption(option => option.setName('comment').setDescription('備註').setRequired(false)),
        async execute(interaction) {
            const diceCount = interaction.options.getInteger('dice_count');
            const sinValue = interaction.options.getInteger('sin_value') || '';
            const adjustment = interaction.options.getString('adjustment') || '';
            const comment = interaction.options.getString('comment') || '';

            return `.wn ${diceCount}DD${sinValue}${adjustment} ${comment}`.trim();
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('wnmod')
            .setDescription('【魔女狩獵之夜】魔改規則擲骰')
            .addIntegerOption(option => option.setName('dice_count').setDescription('骰池數量 (1-200)').setRequired(true).setMinValue(1).setMaxValue(200))
            .addIntegerOption(option => option.setName('sin_value').setDescription('罪業值(≦n失敗, 1-6)').setRequired(true).setMinValue(1).setMaxValue(6))
            .addStringOption(option => option.setName('adjustment').setDescription('調整值(如 +3, -2)').setRequired(false))
            .addBooleanOption(option => option.setName('use_dd').setDescription('是否使用成敗相抵').setRequired(false))
            .addStringOption(option => option.setName('comment').setDescription('備註').setRequired(false)),
        async execute(interaction) {
            const diceCount = interaction.options.getInteger('dice_count');
            const sinValue = interaction.options.getInteger('sin_value');
            const adjustment = interaction.options.getString('adjustment') || '';
            const useDD = interaction.options.getBoolean('use_dd') || false;
            const comment = interaction.options.getString('comment') || '';

            return `.wn ${diceCount}@${useDD ? 'D' : ''}${sinValue}${adjustment} ${comment}`.trim();
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