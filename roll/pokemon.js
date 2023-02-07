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
        first: /^\.poke$/i,
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
        case /^vs$/.test(mainMsg[1] || ''): {
            let text = commandVS(mainMsg).text;
            console.log('text', text)
            rply.text = text;
            return rply;
        }
        case /^sh$/.test(mainMsg[1] || ''): {
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
            keys: ['name', 'id', 'alias'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0
        });
    }

    static init(link) {
        let data = [];
        console.log('init')
        require('fs').readdirSync('./assets/pokemon/').forEach(function (file) {
            if (file.match(/\.js$/) && file.match(new RegExp('^' + link, 'i'))) {
                //   console.log('file', file)
                let importData = require('../assets/pokemon/' + file);
                //   console.log('importData', importData)
                data = data.concat(importData.Pokedex)
            }
        });
        console.log('data', data[0])
        return new Pokemon(data);
    }
    getVS(string) {
        /**
         * 
         */
        if (typeof (string) === 'number') { string = ('000' + string).slice(-3) }
        let result = this.fuse.search(string, { limit: 1 })
        console.log('result1', result)
        if (result.length) return result[0].item;
        return undefined;
    }
    static findKeyByValue(value) {
        for (const key in typeName) {
            if (typeName[key] === value) {
                return [key];
            }
        }
        return [];
    }
    static findKeyByKey(value) {
        let result = [];
        for (const key in typeName) {
            for (let i = 0; i < value.length; i++) {
                if (key === value[i]) {
                    result.push(typeName[key])
                }
            }
        }
        return result;
    }
    search(name) {
        try {
            let result = this.fuse.search(name, { findAllMatches: true, limit: 5 });
            console.log('search:\n', result)
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


class Moves {
    constructor(data) {
        this.pokemonData = data;
        this.fuse = new Fuse(this.pokemonData, {
            keys: ['name', 'id', 'alias'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0
        });
    }

    static init(link) {
        let data = [];
        console.log('initMoves')
        require('fs').readdirSync('./assets/pokemon/').forEach(function (file) {
            if (file.match(/\.js$/) && file.match(new RegExp('^' + link, 'i'))) {
                //   console.log('file', file)
                let importData = require('../assets/pokemon/' + file);
                //console.log('importData', importData)
                data = data.concat(importData.MoveList)
            }
        });
        console.log('data', data[0])
        return new Pokemon(data);
    }
    getVS(string) {
        /**
         * 
         */
        if (typeof (string) === 'number') { string = ('000' + string).slice(-3) }
        let result = this.fuse.search(string, { limit: 1 })
        console.log('result1', result)
        if (result)
            return result[0].item;
    }
    static findKeyByValue(value) {
        for (const key in typeName) {
            if (typeName[key] === value) {
                return key;
            }
        }
        return undefined;
    }
    search(name) {
        try {
            let result = this.fuse.search(name, { findAllMatches: true, limit: 5 });
            console.log('search:\n', result)
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
const pokedex = Pokemon.init('pokedex-');
const pokeMove = Moves.init('moves-');
/**
 * 無效 = 0 = -999 
 * 弱效 = 1 = -1
 * 普通 = 2 = 0
 * 克制 = 3 = 1
 */

const typeName = {
    Normal: '一般', Fighting: '格鬥', Flying: '飛行', Poison: '毒', Ground: '地面', Rock: '岩石', Bug: '蟲', Ghost: '幽靈', Steel: '鋼', Fire: '火', Water: '水', Grass: '草', Electric: '電', Psychic: '超能力', Ice: '冰', Dragon: '龍', Dark: '惡', Fairy: '妖精'
}

const typeChart = {
    Normal: { Normal: 0, Fighting: 0, Flying: 0, Poison: 0, Ground: 0, Rock: -1, Bug: 0, Ghost: -999, Steel: -1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 0 },
    Fighting: { Normal: 1, Fighting: 0, Flying: -1, Poison: -1, Ground: 0, Rock: 1, Bug: -1, Ghost: -999, Steel: 1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: -1, Ice: 1, Dragon: 0, Dark: 1, Fairy: -1 },
    Flying: { Normal: 0, Fighting: 1, Flying: 0, Poison: 0, Ground: 0, Rock: -1, Bug: 1, Ghost: 0, Steel: -1, Fire: 0, Water: 0, Grass: 1, Electric: -1, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 0 },
    Poison: { Normal: 0, Fighting: 0, Flying: 0, Poison: -1, Ground: -999, Rock: -1, Bug: 0, Ghost: -1, Steel: -999, Fire: 0, Water: 0, Grass: 1, Electric: 0, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 1 },
    Ground: { Normal: 0, Fighting: 0, Flying: -999, Poison: 1, Ground: 0, Rock: 1, Bug: -1, Ghost: 0, Steel: 1, Fire: 1, Water: 0, Grass: -1, Electric: 1, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 0 },
    Rock: { Normal: 0, Fighting: -1, Flying: 1, Poison: 0, Ground: -1, Rock: 0, Bug: 1, Ghost: 0, Steel: -1, Fire: 1, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 1, Dragon: 0, Dark: 0, Fairy: 0 },
    Bug: { Normal: 0, Fighting: -1, Flying: -1, Poison: -1, Ground: 0, Rock: 0, Bug: 0, Ghost: -1, Steel: -1, Fire: -1, Water: 0, Grass: 1, Electric: 0, Psychic: 1, Ice: 0, Dragon: 0, Dark: 1, Fairy: -1 },
    Ghost: { Normal: -999, Fighting: 0, Flying: 0, Poison: 0, Ground: 0, Rock: 0, Bug: 0, Ghost: 1, Steel: 0, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 1, Ice: 0, Dragon: 0, Dark: -1, Fairy: 0 },
    Steel: { Normal: 0, Fighting: 0, Flying: 0, Poison: 0, Ground: 0, Rock: 1, Bug: 0, Ghost: 0, Steel: -1, Fire: -1, Water: -1, Grass: 0, Electric: -1, Psychic: 0, Ice: 1, Dragon: 0, Dark: 0, Fairy: 1 },
    Fire: { Normal: 0, Fighting: 0, Flying: 0, Poison: 0, Ground: 0, Rock: -1, Bug: 1, Ghost: 0, Steel: 1, Fire: -1, Water: -1, Grass: 1, Electric: 0, Psychic: 0, Ice: 1, Dragon: -1, Dark: 0, Fairy: 0 },
    Water: { Normal: 0, Fighting: 0, Flying: 0, Poison: 0, Ground: 1, Rock: 1, Bug: 0, Ghost: 0, Steel: 0, Fire: 1, Water: -1, Grass: -1, Electric: 0, Psychic: 0, Ice: 0, Dragon: -1, Dark: 0, Fairy: 0 },
    Grass: { Normal: 0, Fighting: 0, Flying: -1, Poison: -1, Ground: 1, Rock: 1, Bug: -1, Ghost: 0, Steel: -1, Fire: -1, Water: 1, Grass: -1, Electric: 0, Psychic: 0, Ice: 0, Dragon: -1, Dark: 0, Fairy: 0 },
    Electric: { Normal: 0, Fighting: 0, Flying: 1, Poison: 0, Ground: -999, Rock: 0, Bug: 0, Ghost: 0, Steel: 0, Fire: 0, Water: 1, Grass: -1, Electric: -1, Psychic: 0, Ice: 0, Dragon: -1, Dark: 0, Fairy: 0 },
    Psychic: { Normal: 0, Fighting: 1, Flying: 0, Poison: 1, Ground: 0, Rock: 0, Bug: 0, Ghost: 0, Steel: -1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: -1, Ice: 0, Dragon: 0, Dark: -999, Fairy: 0 },
    Ice: { Normal: 0, Fighting: 0, Flying: 1, Poison: 0, Ground: 1, Rock: 0, Bug: 0, Ghost: 0, Steel: 1, Fire: -1, Water: -1, Grass: 1, Electric: 0, Psychic: 0, Ice: -1, Dragon: 1, Dark: 0, Fairy: 0 },
    Dragon: { Normal: 0, Fighting: 0, Flying: 0, Poison: 0, Ground: 0, Rock: 0, Bug: 0, Ghost: 0, Steel: -1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 0, Dragon: 1, Dark: 0, Fairy: -999 },
    Dark: { Normal: 0, Fighting: -1, Flying: 0, Poison: 0, Ground: 0, Rock: 0, Bug: 0, Ghost: 1, Steel: 0, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 1, Ice: 0, Dragon: 0, Dark: -1, Fairy: -1 },
    Fairy: { Normal: 0, Fighting: 1, Flying: 0, Poison: -1, Ground: 0, Rock: 0, Bug: 0, Ghost: 0, Steel: -1, Fire: -1, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 0, Dragon: 1, Dark: 1, Fairy: 0 }
};

const effect = {
    1: '效果絕佳，承受額外 1 點來自該攻擊的傷害',
    2: '效果絕佳，承受額外 2 點來自該攻擊的傷害',
    0: '正常',
    '-1': '效果不佳，減少 1 點受到的傷害',
    '-2': '效果不佳，減少 2 點受到的傷害',

}
// 定義函式
function checkEffectiveness(moveType, enemyType) {
    /**
     * @param {string} moveType - 技能的屬性
     * @param {Array} enemyType - 敵人的兩個屬性
     * @return {number} effectiveness - 技能的威力
     * 
     * @example
     * effectiveness = 0 表示技能的威力為 正常
     * effectiveness = -999 表示技能的威力為 免疫
     * effectiveness = 1,2 表示技能的威力為 效果絕佳
     * effectiveness = -1,-2 表示技能的威力為 效果絕佳
     */
    let enemyType1 = enemyType[0];
    let enemyType2 = enemyType[1];
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
console.log(checkEffectiveness("Fire", ["Grass", "Ice"])); // 輸出 0.25
console.log(checkEffectiveness("Electric", ["Water"])); // 輸出 2
console.log(checkEffectiveness("Poison", ["Steel"])); // 輸出 0

function commandVS(mainMsg) {
    try {
        let rply = {
            text: ''
        }
        //招式名,屬性  VS  POKEMON名,POKEMON NO,屬性1,屬性2
        let attackerType = Moves.findKeyByValue(mainMsg[2]);
        console.log('attackerType', attackerType)
        let attacker = (attackerType) ? null : pokeMove.getVS(mainMsg[2]);
        if (attacker) {
            attackerType = attacker.type
        }
        let defenderType = Pokemon.findKeyByValue(mainMsg[3]);
        let defender = (defenderType.length) ? null : pokedex.getVS(mainMsg[3]);
        if (defender) {
            defenderType = defender.type
        }

        console.log('defenderType', defenderType, defender)
        if (mainMsg[4]) {
            let defenderType2 = Pokemon.findKeyByValue(mainMsg[4]);
            console.log('defenderType2', defenderType2)
            if (defenderType2) defenderType = defenderType.concat(defenderType2);
        }
        if (!defenderType || !attackerType) {
            rply.text += (!attackerType) ? '找不到攻方屬性，請確認名稱，你可以輸入完整招式名稱或屬性\n' : '';
            rply.text += (!defenderType) ? '找不到防方屬性，請確認名稱，你可以輸入小精靈名稱，編號或屬性\n' : '';
            return rply;

        }
        console.log('attacker', attacker, attackerType)
        console.log('defender', defender, defenderType)
        let typeEffect = checkEffectiveness(attackerType, defenderType);
        /**
         * 攻方屬性：attackerType
         * 防方屬性：defenderType
         * 屬性效果：typeEffect.script
         * --------------------
         * 攻方招式：attacker.name
         * 攻方招式內容：attacker.effect desc
         * 攻方招式傷害：attacker.damage
         * --------------------
         * 防方小精靈：defender.name
         * 防方小精靈圖片：defender.info.image
         */
        let attackerTypeChinese = Pokemon.findKeyByKey([attackerType]);
        let defenderTypeChinese = Pokemon.findKeyByKey(defenderType);
        rply.text +=
            `攻方屬性：${attackerTypeChinese}
防方屬性：${defenderTypeChinese}
屬性效果：${typeEffect.script}
`
        rply.text += (attacker) ?
            `--------------------
攻方招式：${attacker.name}
攻方招式內容：${attacker.effect}
${attacker.desc}
攻方招式傷害：${attacker.damage}
`: '';
        rply.text += (defender) ?
            `--------------------
防方小精靈：${defender.name}
防方小精靈圖片：${defender.info.image}
`: '';
        return rply;
    } catch (error) {
        console.error(error)
        rply.text = `輸入錯誤，請輸入正確的招式名稱或小精靈名稱\n${getHelpMessage()}`
        return rply;
    }
}

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