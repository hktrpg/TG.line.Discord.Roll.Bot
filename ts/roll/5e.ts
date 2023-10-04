// @ts-expect-error TS(6200): Definitions of the following identifiers conflict ... Remove this comment to see the full error message
"use strict";
const variables = {};
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
const rollbase = require('./rollbase.js');
// @ts-expect-error TS(2552): Cannot find name 'require'. Did you mean '_require... Remove this comment to see the full error message
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
    }];
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
const rollDiceCommand = async function(
    this: any,
    {
        mainMsg,
        inputStr
    }: any
) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]): {
            rply.text = this.getHelpMessage();
            // @ts-expect-error TS(2339): Property 'quotes' does not exist on type '{ defaul... Remove this comment to see the full error message
            rply.quotes = true;
            return rply;
        }
        case /^\.5eBuild+$/i.test(mainMsg[0]): {
            // @ts-expect-error TS(2322): Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
            rply.text = randomStats();
            // @ts-expect-error TS(2339): Property 'quotes' does not exist on type '{ defaul... Remove this comment to see the full error message
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
            // @ts-expect-error TS(2339): Property 'stats' does not exist on type '{ result:... Remove this comment to see the full error message
            roll[i] = { ...roll[i], mod: Math.floor((roll[i].stats - 10) / 2) };
            // @ts-expect-error TS(2339): Property 'stats' does not exist on type '{ result:... Remove this comment to see the full error message
            total += Number(roll[i].stats);
            // @ts-expect-error TS(2339): Property 'mod' does not exist on type '{ result: a... Remove this comment to see the full error message
            mod += Number(roll[i].mod);
        }
        // @ts-expect-error TS(2339): Property 'stats' does not exist on type '{ result:... Remove this comment to see the full error message
        roll.sort((b, a) => a.stats - b.stats);
        output += '5e 屬性產生器(.6 4D6dl1)\n==================\n';
        for (let i = 0; i < 6; i++) {
            // @ts-expect-error TS(2339): Property 'mod' does not exist on type '{ result: a... Remove this comment to see the full error message
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
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};