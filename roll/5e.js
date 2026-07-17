"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const rollbase = require('./rollbase.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const gameName = function (params = {}) {
    return resolveGameName(params, 'dnd5e.game_name', '【5E工具 - .5ebuild】');
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
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'dnd5e.help');
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
    locale,
    t
}) {
    const translate = getT({ locale, t });
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]): {
            rply.text = getHelpMessage({ locale, t });
            rply.quotes = true;
            return rply;
        }
        case /^\.5eBuild+$/i.test(mainMsg[0]): {
            rply.text = randomStats(translate);
            rply.quotes = true;
            return rply;
        }
        default: {
            break;
        }
    }
}

const randomStats = function (translate) {
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
        output += translate('dnd5e.stats_header');
        for (let i = 0; i < 6; i++) {
            output += translate('dnd5e.stat_line', {
                num: i + 1,
                result: roll[i].result,
                mod: `${roll[i].mod > 0 ? '+' : ''}${roll[i].mod}`
            });
        }
        output += translate('dnd5e.total_line', {
            total,
            mod: `${mod > 0 ? '+' : ''}${mod}`
        });
        return output;
    } catch (error) {
        console.error('#5E工具 - .5ebuild - randomStats Error: ' + error);
    }
}

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('5ebuild')
            .setDescription('DnD 5e屬性產生器')
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