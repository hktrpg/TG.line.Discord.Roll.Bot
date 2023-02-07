"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【Demo】'
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}

/*
 * 輸入方式，
攻方  VS 防方
攻 (招式名，屬性)  VS  防 (POKEMON名，POKEMON NO，屬性1，屬性2)
 * @returns 
 * 
 */
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^Demo$/i,
        second: /^啊$/i
    }]
}
const getHelpMessage = function () {
    return `【示範】
只是一個Demo的第一行
只是一個Demo末行`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        case /^\d+$/i.test(mainMsg[1]): {
            rply.text = 'Demo' + mainMsg[1] + inputStr + groupid + userid + userrole + botname + displayname + channelid + displaynameDiscord + membercount;
            return rply;
        }
        case /^\S/.test(mainMsg[1] || ''): {
            rply.text = 'Demo'
            return rply;
        }
        default: {
            break;
        }
    }
}

const typeChart = {
    normal: { normal: '普通', fighting: '普通', flying: '普通', poison: '普通', ground: '普通', rock: '弱效', bug: '普通', ghost: '無效', steel: '弱效', fire: '普通', water: '普通', grass: '普通', electric: '普通', psychic: '普通', ice: '普通', dragon: '普通', dark: '普通', fairy: '普通' },
    fighting: { normal: '克制', fighting: '普通', flying: '弱效', poison: '弱效', ground: '普通', rock: '克制', bug: '弱效', ghost: '無效', steel: '克制', fire: '普通', water: '普通', grass: '普通', electric: '普通', psychic: '弱效', ice: '克制', dragon: '普通', dark: '克制', fairy: '弱效' },
    flying: { normal: '普通', fighting: '克制', flying: '普通', poison: '普通', ground: '普通', rock: '弱效', bug: '克制', ghost: '普通', steel: '弱效', fire: '普通', water: '普通', grass: '克制', electric: '弱效', psychic: '普通', ice: '普通', dragon: '普通', dark: '普通', fairy: '普通' },
    poison: { normal: '普通', fighting: '普通', flying: '普通', poison: '弱效', ground: '無效', rock: '弱效', bug: '普通', ghost: '弱效', steel: '無效', fire: '普通', water: '普通', grass: '克制', electric: '普通', psychic: '普通', ice: '普通', dragon: '普通', dark: '普通', fairy: '克制' },
    ground: { normal: '普通', fighting: '普通', flying: '無效', poison: '克制', ground: '普通', rock: '克制', bug: '弱效', ghost: '普通', steel: '克制', fire: '克制', water: '普通', grass: '弱效', electric: '克制', psychic: '普通', ice: '普通', dragon: '普通', dark: '普通', fairy: '普通' },
    rock: { normal: '普通', fighting: '弱效', flying: '克制', poison: '普通', ground: '弱效', rock: '普通', bug: '克制', ghost: '普通', steel: '弱效', fire: '克制', water: '普通', grass: '普通', electric: '普通', psychic: '普通', ice: '克制', dragon: '普通', dark: '普通', fairy: '普通' },
    bug: { normal: '普通', fighting: '弱效', flying: '弱效', poison: '弱效', ground: '普通', rock: '普通', bug: '普通', ghost: '弱效', steel: '弱效', fire: '弱效', water: '普通', grass: '克制', electric: '普通', psychic: '克制', ice: '普通', dragon: '普通', dark: '克制', fairy: '弱效' },
    ghost: { normal: '無效', fighting: '普通', flying: '普通', poison: '普通', ground: '普通', rock: '普通', bug: '普通', ghost: '克制', steel: '普通', fire: '普通', water: '普通', grass: '普通', electric: '普通', psychic: '克制', ice: '普通', dragon: '普通', dark: '弱效', fairy: '普通' },
    steel: { normal: '普通', fighting: '普通', flying: '普通', poison: '普通', ground: '普通', rock: '克制', bug: '普通', ghost: '普通', steel: '弱效', fire: '弱效', water: '弱效', grass: '普通', electric: '弱效', psychic: '普通', ice: '克制', dragon: '普通', dark: '普通', fairy: '克制' },
    fire: { normal: '普通', fighting: '普通', flying: '普通', poison: '普通', ground: '普通', rock: '弱效', bug: '克制', ghost: '普通', steel: '克制', fire: '弱效', water: '弱效', grass: '克制', electric: '普通', psychic: '普通', ice: '克制', dragon: '弱效', dark: '普通', fairy: '普通' },
    water: { normal: '普通', fighting: '普通', flying: '普通', poison: '普通', ground: '克制', rock: '克制', bug: '普通', ghost: '普通', steel: '普通', fire: '克制', water: '弱效', grass: '弱效', electric: '普通', psychic: '普通', ice: '普通', dragon: '弱效', dark: '普通', fairy: '普通' },
    grass: { normal: '普通', fighting: '普通', flying: '弱效', poison: '弱效', ground: '克制', rock: '克制', bug: '弱效', ghost: '普通', steel: '弱效', fire: '弱效', water: '克制', grass: '弱效', electric: '普通', psychic: '普通', ice: '普通', dragon: '弱效', dark: '普通', fairy: '普通' },
    electric: { normal: '普通', fighting: '普通', flying: '克制', poison: '普通', ground: '無效', rock: '普通', bug: '普通', ghost: '普通', steel: '普通', fire: '普通', water: '克制', grass: '弱效', electric: '弱效', psychic: '普通', ice: '普通', dragon: '弱效', dark: '普通', fairy: '普通' },
    psychic: { normal: '普通', fighting: '克制', flying: '普通', poison: '克制', ground: '普通', rock: '普通', bug: '普通', ghost: '普通', steel: '弱效', fire: '普通', water: '普通', grass: '普通', electric: '普通', psychic: '弱效', ice: '普通', dragon: '普通', dark: '無效', fairy: '普通' },
    ice: { normal: '普通', fighting: '普通', flying: '克制', poison: '普通', ground: '克制', rock: '普通', bug: '普通', ghost: '普通', steel: '克制', fire: '弱效', water: '弱效', grass: '克制', electric: '普通', psychic: '普通', ice: '弱效', dragon: '克制', dark: '普通', fairy: '普通' },
    dragon: { normal: '普通', fighting: '普通', flying: '普通', poison: '普通', ground: '普通', rock: '普通', bug: '普通', ghost: '普通', steel: '弱效', fire: '普通', water: '普通', grass: '普通', electric: '普通', psychic: '普通', ice: '普通', dragon: '克制', dark: '普通', fairy: '無效' },
    dark: { normal: '普通', fighting: '弱效', flying: '普通', poison: '普通', ground: '普通', rock: '普通', bug: '普通', ghost: '克制', steel: '普通', fire: '普通', water: '普通', grass: '普通', electric: '普通', psychic: '克制', ice: '普通', dragon: '普通', dark: '弱效', fairy: '弱效' },
    fairy: { normal: '普通', fighting: '克制', flying: '普通', poison: '弱效', ground: '普通', rock: '普通', bug: '普通', ghost: '普通', steel: '弱效', fire: '弱效', water: '普通', grass: '普通', electric: '普通', psychic: '普通', ice: '普通', dragon: '克制', dark: '克制', fairy: '普通' }
};

// 定義函式
function checkEffectiveness(moveType, enemyType1, enemyType2) {
    let effectiveness = 1;
    effectiveness *= typeChart[moveType][enemyType1];
    if (enemyType2) {
        effectiveness *= typeChart[moveType][enemyType2];
    }
    return effectiveness;
}

// 測試程式
console.log(checkEffectiveness("fire", "grass", "ice")); // 輸出 0.25
console.log(checkEffectiveness("electric", "water")); // 輸出 2

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};