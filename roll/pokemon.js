"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const gameName = function () {
    return '【Demo】'
}

const gameType = function () {
    return 'Demo:Demo:hktrpg'
}
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
    normal: { normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1, rock: 0.5, bug: 1, ghost: 0, steel: 0.5, fire: 1, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 1, dark: 1, fairy: 1 },
    fighting: { normal: 2, fighting: 1, flying: 0.5, poison: 0.5, ground: 1, rock: 2, bug: 0.5, ghost: 0, steel: 2, fire: 1, water: 1, grass: 1, electric: 1, psychic: 0.5, ice: 2, dragon: 1, dark: 2, fairy: 0.5 },
    flying: { normal: 1, fighting: 2, flying: 1, poison: 1, ground: 1, rock: 0.5, bug: 2, ghost: 1, steel: 0.5, fire: 1, water: 1, grass: 2, electric: 0.5, psychic: 1, ice: 1, dragon: 1, dark: 1, fairy: 1 },
    poison: { normal: 1, fighting: 1, flying: 1, poison: 0.5, ground: 0, rock: 0.5, bug: 1, ghost: 0.5, steel: 0, fire: 1, water: 1, grass: 2, electric: 1, psychic: 1, ice: 1, dragon: 1, dark: 1, fairy: 2 },
    ground: { normal: 1, fighting: 1, flying: 0, poison: 2, ground: 1, rock: 2, bug: 0.5, ghost: 1, steel: 2, fire: 2, water: 1, grass: 0.5, electric: 2, psychic: 1, ice: 1, dragon: 1, dark: 1, fairy: 1 },
    rock: { normal: 1, fighting: 0.5, flying: 2, poison: 1, ground: 0.5, rock: 1, bug: 2, ghost: 1, steel: 0.5, fire: 2, water: 1, grass: 1, electric: 1, psychic: 1, ice: 2, dragon: 1, dark: 1, fairy: 1 },
    bug: { normal: 1, fighting: 0.5, flying: 0.5, poison: 0.5, ground: 1, rock: 1, bug: 1, ghost: 0.5, steel: 0.5, fire: 0.5, water: 1, grass: 2, electric: 1, psychic: 2, ice: 1, dragon: 1, dark: 2, fairy: 0.5 },
    ghost: { normal: 0, fighting: 1, flying: 1, poison: 1, ground: 1, rock: 1, bug: 1, ghost: 2, steel: 1, fire: 1, water: 1, grass: 1, electric: 1, psychic: 2, ice: 1, dragon: 1, dark: 0.5, fairy: 1 },
    steel: { normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1, rock: 2, bug: 1, ghost: 1, steel: 0.5, fire: 0.5, water: 0.5, grass: 1, electric: 0.5, psychic: 1, ice: 2, dragon: 1, dark: 1, fairy: 2 },
    fire: { normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1, rock: 0.5, bug: 2, ghost: 1, steel: 2, fire: 0.5, water: 0.5, grass: 2, electric: 1, psychic: 1, ice: 2, dragon: 0.5, dark: 1, fairy: 1 },
    water: { normal: 1, fighting: 1, flying: 1, poison: 1, ground: 2, rock: 2, bug: 1, ghost: 1, steel: 1, fire: 2, water: 0.5, grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5, dark: 1, fairy: 1 },
    grass: { normal: 1, fighting: 1, flying: 0.5, poison: 0.5, ground: 2, rock: 2, bug: 0.5, ghost: 1, steel: 0.5, fire: 0.5, water: 2, grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5, dark: 1, fairy: 1 },
    electric: { normal: 1, fighting: 1, flying: 2, poison: 1, ground: 0, rock: 1, bug: 1, ghost: 1, steel: 1, fire: 1, water: 2, grass: 0.5, electric: 0.5, psychic: 1, ice: 1, dragon: 0.5, dark: 1, fairy: 1 },
    psychic: { normal: 1, fighting: 2, flying: 1, poison: 2, ground: 1, rock: 1, bug: 1, ghost: 1, steel: 0.5, fire: 1, water: 1, grass: 1, electric: 1, psychic: 0.5, ice: 1, dragon: 1, dark: 0, fairy: 1 },
    ice: { normal: 1, fighting: 1, flying: 2, poison: 1, ground: 2, rock: 1, bug: 1, ghost: 1, steel: 2, fire: 0.5, water: 0.5, grass: 2, electric: 1, psychic: 1, ice: 0.5, dragon: 2, dark: 1, fairy: 1 },
    dragon: { normal: 1, fighting: 1, flying: 1, poison: 1, ground: 1, rock: 1, bug: 1, ghost: 1, steel: 0.5, fire: 1, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 2, dark: 1, fairy: 0 },
    dark: { normal: 1, fighting: 0.5, flying: 1, poison: 1, ground: 1, rock: 1, bug: 1, ghost: 2, steel: 1, fire: 1, water: 1, grass: 1, electric: 1, psychic: 2, ice: 1, dragon: 1, dark: 0.5, fairy: 0.5 },
    fairy: { normal: 1, fighting: 2, flying: 1, poison: 0.5, ground: 1, rock: 1, bug: 1, ghost: 1, steel: 0.5, fire: 0.5, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 2, dark: 2, fairy: 1 }
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