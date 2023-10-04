"use strict";
const variables = {};
const rollbase = require('./rollbase.js');
const { SlashCommandBuilder } = require('discord.js');
const gameName = function () {
    return '【5E工具 - .5ebuild】'
}

const gameType = function () {
    return 'dnd5e:Dice:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.5ebuild$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【5E 工具】
    .5eBuild: 5e角色建立器`
}
const initialize = function () {
    return variables;
}



/**
 * 格式化輸出	
 * 
 * 	5E角色屬性擲骰
 *  4d6dl1 * 6
 * ==================
 * 屬性1: [x] (+-y)
 * 屬性2: [x] (+-y)
 * 屬性3: [x] (+-y)
 * 屬性4: [x] (+-y)
 * 屬性5: [x] (+-y)
 * 屬性6: [x] (+-y)
 * ==================
 * 總合 [x] (+-y)
 * 
 * 
 * **/
const rollDiceCommand = async function ({
    mainMsg,
    inputStr,
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]): {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\.5eBuild+$/i.test(mainMsg[0]): {
            rply.text = randomStats();
            rply.quotes = true;
            return rply;
        }
        default: {
            break;
        }
    }
}

const randomStats = function () {
    try {
        let roll = [];
        let mod = 0;
        let total = 0;
        let output = '';
        for (let i = 0; i < 6; i++) {
            roll[i] = { result: rollbase.nomalDiceRoller('4d6dl1').replace('4d6dl1：\n', '') }
            roll[i] = { ...roll[i], stats: roll[i].result.match(/\d+$/) }
            roll[i] = { ...roll[i], mod: Math.floor((roll[i].stats - 10) / 2) };
            total += Number(roll[i].stats);
            mod += Number(roll[i].mod);
        }
        roll.sort((b, a) => a.stats - b.stats);
        output += '5e 屬性產生器(.6 4D6dl1)\n==================\n';
        for (let i = 0; i < 6; i++) {
            output += `**屬性${i + 1}**: ${roll[i].result} (${roll[i].mod > 0 ? '+' : ''}${roll[i].mod})\n`;
        }
        output += '==================\n';
        output += `總合 \`[${total}] (${mod > 0 ? '+' : ''}${mod})\``;
        return output;
    } catch (error) {
        console.log('#5E工具 - .5ebuild - randomStats Error: ' + error);
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('5ebuild')
            .setDescription('5e屬性產生器')
        ,
        async execute() {
            return `.5ebuild`
        }
    }
]
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};