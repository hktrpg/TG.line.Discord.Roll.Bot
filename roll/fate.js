"use strict";
const { SlashCommandBuilder } = require('discord.js');
const mathjs = require('mathjs');
let rollbase = require('./rollbase.js');
let variables = {};
const gameName = function () {
    return '【命運Fate】 .4df(m|-)(加值)'
}

const gameType = function () {
    return 'Dice:fate'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^[.]4df(\d+|(\+|m|-)(\d+)|)/i,
        second: null
    }]
}
const getHelpMessage = async function () {
    return `【🎲命運Fate骰系統】
╭────── 🎯骰子說明 ──────
│ 命運骰(Fate Dice)組成:
│ 　• ⊞ 「＋」兩面 (+1)
│ 　• ⊟ 「－」兩面 (-1)
│ 　• ▉ 空白兩面 (0)
│
├────── 🎲擲骰指令 ──────
│ 基本指令:
│ 　• .4df - 擲四顆命運骰
│
│ 加入修正值:
│ 　• .4df3   → 結果+3
│ 　• .4df+3  → 結果+3
│ 　• .4dfm4  → 結果-4
│ 　• .4df-4  → 結果-4
╰──────────────`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]):
            rply.text = await this.getHelpMessage();
            rply.quotes = true;
            return rply;
        default: {
            //.4dfm23,m23,m,23
            //＋∎－
            let random = '',
                temp = '';
            let ans = 0

            for (let i = 0; i < 4; i++) {
                random = (rollbase.Dice(3) - 2)
                ans += random
                temp += random
                temp = temp.replace('-1', '－').replace('0', '▉').replace('1', '＋')
            }
            try {
                rply.text = 'Fate ' + inputStr.toString().replace(/\r/g, " ").replace(/\n/g, " ") + '\n' + temp + ' = ' + ans;
                let mod = mainMsg[0].replace(/^\.4df/ig, '').replace(/^(\d)/, '+$1').replace(/m/ig, '-').replace(/-/g, ' - ').replace(/\+/g, ' + ');
                if (mod) {
                    rply.text += ` ${mod} = ${mathjs.evaluate(ans + mod)}`.replace(/\*/g, ' * ')

                }
            } catch (error) {
                rply.text = `.4df 輸入出錯 \n${error.message}`
            }


            return rply;
        }
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('4df')
            .setDescription('擲四顆命運骰')
            .addStringOption(option => 
                option.setName('modifier')
                .setDescription('修正值 (例如: 3, +3, -4, m4)')
                .setRequired(false)),
        async execute(interaction) {
            const modifier = interaction.options.getString('modifier') || '';
            return `.4df${modifier}`;
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
    discordCommand
};