"use strict";
var rollbase = require('./rollbase.js');
var variables = {};
const mathjs = require('mathjs');
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
    return `【命運Fate】
命運骰，又稱胡扯骰，是由兩面「＋」號、兩面「－」號，以及兩面空白▉組成的六面骰
「＋」號代表＋１，「－」號－１，▉則代表０
.4df(+|m|-)(加值) 指令: .4df 如常骰出四粒命運骰
.4df3 .4df+3  四粒命運骰結果+3  .4dfm4 或.4df-4  四粒命運骰結果-4`
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
            var random = '',
                temp = '';
            var ans = 0

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


module.exports = {
    rollDiceCommand: rollDiceCommand,
    initialize: initialize,
    getHelpMessage: getHelpMessage,
    prefixs: prefixs,
    gameType: gameType,
    gameName: gameName
};