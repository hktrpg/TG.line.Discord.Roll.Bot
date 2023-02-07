"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const Fuse = require('fuse.js')
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
用name, alias XX|YY  得出type 
如用前者 輸出相克及 accuracy ,damage ,effect,desc
----
POKEMON名=name |alias
POKEMON NO = id
image = info.image

 * @returns 
 * 
 */
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^poke$/i,
        second: null
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
            rply.button = ['']
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


class Pokemon {
    constructor(data) {
        this.pokemonData = data;
        this.fuse = new Fuse(this.pokemonData, {
            keys: ['name'],
            includeScore: true,
            threshold: 0.3
        });
    }

    static init() {
        let data = [];
        for (let i = 0; i < datalink.length; i++) {
            let temp = require(datalink[i]);
            data = data.concat(Pokemon.objectToArray(temp.helpdoc))
        }

        return new Pokemon(data);
    }
    static objectToArray(input) {
        let data = [];
        for (let i = 0; i < Object.keys(input).length; i++) {
            data.push({
                name: Object.keys(input)[i],
                desc: Object.values(input)[i]
            });
        }
        return data;
    }
    search(name) {
        try {
            let result = this.fuse.search(name);
            let rply = '';
            if (result.length === 0) return '沒有找到相關資料';
            if (result[0].item.name === name) {
                return `【${result[0].item.name}】
        ${result[0].item.desc} \n
         `;
            }
            if (result.length <= 2) {
                for (let i = 0; i < result.length; i++) {
                    rply += `【${result[i].item.name}】
${result[i].item.desc} \n
 `;
                }
            }
            else {
                rply += '找到太多相關資料，請更精確的查詢\n\n';
                for (let i = 0; i < result.length; i++) {
                    rply += `${result[i].item.name}\n`;
                }
            }
            return rply;
        }
        catch (error) {
            console.log(error);
            return '發生錯誤';
        }
    }
}
const pokedex = Pokemon.init('../assets/pokedex-');
const pokeMove = Pokemon.init('../assets/moves-');
/**
 * 無效 = 0 = -999 
 * 弱效 = 1 = -1
 * 普通 = 2 = 0
 * 克制 = 3 = 1
 */

const typeChart = {
    normal: { normal: 0, fighting: 0, flying: 0, poison: 0, ground: 0, rock: -1, bug: 0, ghost: -999, steel: -1, fire: 0, water: 0, grass: 0, electric: 0, psychic: 0, ice: 0, dragon: 0, dark: 0, fairy: 0 },
    fighting: { normal: 1, fighting: 0, flying: -1, poison: -1, ground: 0, rock: 1, bug: -1, ghost: -999, steel: 1, fire: 0, water: 0, grass: 0, electric: 0, psychic: -1, ice: 1, dragon: 0, dark: 1, fairy: -1 },
    flying: { normal: 0, fighting: 1, flying: 0, poison: 0, ground: 0, rock: -1, bug: 1, ghost: 0, steel: -1, fire: 0, water: 0, grass: 1, electric: -1, psychic: 0, ice: 0, dragon: 0, dark: 0, fairy: 0 },
    poison: { normal: 0, fighting: 0, flying: 0, poison: -1, ground: -999, rock: -1, bug: 0, ghost: -1, steel: -999, fire: 0, water: 0, grass: 1, electric: 0, psychic: 0, ice: 0, dragon: 0, dark: 0, fairy: 1 },
    ground: { normal: 0, fighting: 0, flying: -999, poison: 1, ground: 0, rock: 1, bug: -1, ghost: 0, steel: 1, fire: 1, water: 0, grass: -1, electric: 1, psychic: 0, ice: 0, dragon: 0, dark: 0, fairy: 0 },
    rock: { normal: 0, fighting: -1, flying: 1, poison: 0, ground: -1, rock: 0, bug: 1, ghost: 0, steel: -1, fire: 1, water: 0, grass: 0, electric: 0, psychic: 0, ice: 1, dragon: 0, dark: 0, fairy: 0 },
    bug: { normal: 0, fighting: -1, flying: -1, poison: -1, ground: 0, rock: 0, bug: 0, ghost: -1, steel: -1, fire: -1, water: 0, grass: 1, electric: 0, psychic: 1, ice: 0, dragon: 0, dark: 1, fairy: -1 },
    ghost: { normal: -999, fighting: 0, flying: 0, poison: 0, ground: 0, rock: 0, bug: 0, ghost: 1, steel: 0, fire: 0, water: 0, grass: 0, electric: 0, psychic: 1, ice: 0, dragon: 0, dark: -1, fairy: 0 },
    steel: { normal: 0, fighting: 0, flying: 0, poison: 0, ground: 0, rock: 1, bug: 0, ghost: 0, steel: -1, fire: -1, water: -1, grass: 0, electric: -1, psychic: 0, ice: 1, dragon: 0, dark: 0, fairy: 1 },
    fire: { normal: 0, fighting: 0, flying: 0, poison: 0, ground: 0, rock: -1, bug: 1, ghost: 0, steel: 1, fire: -1, water: -1, grass: 1, electric: 0, psychic: 0, ice: 1, dragon: -1, dark: 0, fairy: 0 },
    water: { normal: 0, fighting: 0, flying: 0, poison: 0, ground: 1, rock: 1, bug: 0, ghost: 0, steel: 0, fire: 1, water: -1, grass: -1, electric: 0, psychic: 0, ice: 0, dragon: -1, dark: 0, fairy: 0 },
    grass: { normal: 0, fighting: 0, flying: -1, poison: -1, ground: 1, rock: 1, bug: -1, ghost: 0, steel: -1, fire: -1, water: 1, grass: -1, electric: 0, psychic: 0, ice: 0, dragon: -1, dark: 0, fairy: 0 },
    electric: { normal: 0, fighting: 0, flying: 1, poison: 0, ground: -999, rock: 0, bug: 0, ghost: 0, steel: 0, fire: 0, water: 1, grass: -1, electric: -1, psychic: 0, ice: 0, dragon: -1, dark: 0, fairy: 0 },
    psychic: { normal: 0, fighting: 1, flying: 0, poison: 1, ground: 0, rock: 0, bug: 0, ghost: 0, steel: -1, fire: 0, water: 0, grass: 0, electric: 0, psychic: -1, ice: 0, dragon: 0, dark: -999, fairy: 0 },
    ice: { normal: 0, fighting: 0, flying: 1, poison: 0, ground: 1, rock: 0, bug: 0, ghost: 0, steel: 1, fire: -1, water: -1, grass: 1, electric: 0, psychic: 0, ice: -1, dragon: 1, dark: 0, fairy: 0 },
    dragon: { normal: 0, fighting: 0, flying: 0, poison: 0, ground: 0, rock: 0, bug: 0, ghost: 0, steel: -1, fire: 0, water: 0, grass: 0, electric: 0, psychic: 0, ice: 0, dragon: 1, dark: 0, fairy: -999 },
    dark: { normal: 0, fighting: -1, flying: 0, poison: 0, ground: 0, rock: 0, bug: 0, ghost: 1, steel: 0, fire: 0, water: 0, grass: 0, electric: 0, psychic: 1, ice: 0, dragon: 0, dark: -1, fairy: -1 },
    fairy: { normal: 0, fighting: 1, flying: 0, poison: -1, ground: 0, rock: 0, bug: 0, ghost: 0, steel: -1, fire: -1, water: 0, grass: 0, electric: 0, psychic: 0, ice: 0, dragon: 1, dark: 1, fairy: 0 }
};

const effect = {
    1: '效果絕佳，承受額外 1 點來自該攻擊的傷害',
    2: '效果絕佳，承受額外 2 點來自該攻擊的傷害',
    0: '正常',
    '-1': '效果不佳，減少 1 點受到的傷害',
    '-2': '效果不佳，減少 2 點受到的傷害',

}
// 定義函式
function checkEffectiveness(moveType, enemyType1, enemyType2) {
    /**
     * @param {string} moveType - 技能的屬性
     * @param {string} enemyType1 - 敵人的第一個屬性
     * @param {string} enemyType2 - 敵人的第二個屬性
     * @return {number} effectiveness - 技能的威力
     * 
     * @example
     * effectiveness = 0 表示技能的威力為 正常
     * effectiveness = -999 表示技能的威力為 免疫
     * effectiveness = 1,2 表示技能的威力為 效果絕佳
     * effectiveness = -1,-2 表示技能的威力為 效果絕佳
     */
    let effectiveness = 0;
    let level = typeChart[moveType][enemyType1];
    if (level == -999) return { effect: -999, script: "免疫該攻擊傷害" };
    effectiveness += level;
    if (enemyType2) {
        level = typeChart[moveType][enemyType2];
        if (level == -999) return { effect: -999, script: "免疫該攻擊傷害" };
        effectiveness += level;
    }
    let result = { value: effectiveness, script: effect[effectiveness] };
    return result;
}



// 測試程式
console.log(checkEffectiveness("fire", "grass", "ice")); // 輸出 0.25
console.log(checkEffectiveness("electric", "water")); // 輸出 2
console.log(checkEffectiveness("poison", "steel")); // 輸出 0

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