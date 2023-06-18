"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const Fuse = require('fuse.js');
const { randomInt } = require('mathjs');
const gameName = function () {
    return '【PokeRole】.poke '
}
const gameType = function () {
    return 'Dice:pokerole:hktrpg'
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
    return [{
        first: /^\.poke$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【PokeRole】.poke
這是一個Pokemon的資料庫，
進行小精靈，招式的查詢以及 對戰的屬性相克結果，
.poke 可以查看更多指令
.poke mon (名稱/編號)  可以查看小精靈的資料
.poke mon (名稱/編號) (--d)  可以查看小精靈的招式表
.poke move (招式名稱)  可以查看招式的資料
.poke vs 攻方(招式名稱/屬性) 防方(小精靈名稱/編號/屬性1,2)  可以進行對戰模擬
--------------------
例子：
.poke mon 超夢
.poke mon 超夢 --d
.poke move 火焰輪
.poke vs 火之誓約 夢幻
.poke vs 火 100  
.poke vs 火 超能力 水
--------------------
資料來源：
https://hazmole.github.io/PokeRole/
及 免費開源TRPG中文化團隊
`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    mainMsg,

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
            rply.buttonCreate = ['.poke', '.poke mon 超夢', '.poke move 火焰輪', '.poke vs 火之誓約 夢幻', '.poke vs 火 100', '.poke vs 火 超能力 水']
            return rply;
        }
        case /^vs$/.test(mainMsg[1]): {
            let text = commandVS(mainMsg).text;
            rply.quotes = true;
            rply.text = text;
            return rply;
        }
        case /^move$/.test(mainMsg[1]): {
            rply.quotes = true;
            rply.text = pokeMove.search(mainMsg.slice(2).join(' '))
            return rply;
        }
        case /^mon$/.test(mainMsg[1]): {
            rply.quotes = true;
            let check = removeAndCheck(mainMsg)
            let detail = check.detail;
            let name = (!check.newMainMsg[2]) ? randomInt(1, 890).toString() : check.newMainMsg.slice(2).join(' ');
            rply.text = pokeDex.search(name, detail)
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
            threshold: 0.6
        });
    }

    static init(link) {
        let data = [];
        require('fs').readdirSync('./assets/pokemon/').forEach(function (file) {
            if (file.match(/\.js$/) && file.match(new RegExp('^' + link, 'i'))) {
                let importData = require('../assets/pokemon/' + file);
                data = data.concat(importData.Pokedex)
            }
        });
        return new Pokemon(data);
    }
    getVS(string) {
        if (typeof (string) === 'number') { string = ('000' + string).slice(-3) }
        let result = this.fuse.search(string, { limit: 1 })
        if (result.length) return result[0].item;
        return undefined;
    }
    static findTypeByCht(value) {
        for (const key in typeName) {
            if (typeName[key] === value) {
                return [key];
            }
        }
        return [];
    }
    static findTypeByEng(value) {
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
    static showPokemon(pokemon, detail = false) {
        let rply = '';
        try {
            rply += `#${pokemon.id} 【${pokemon.name}】 ${pokemon.alias} ${Pokemon.findTypeByEng(pokemon.type)} 
${pokemon.info.category} ${pokemon.info.height}m / ${pokemon.info.weight}kg
建議等級：${pokemon.rank}  基礎HP：${pokemon.baseHP}  特性：${pokemon.ability} 
力量 ${displayValue(pokemon.attr.str.value, pokemon.attr.str.max)}
靈巧 ${displayValue(pokemon.attr.dex.value, pokemon.attr.dex.max)}
活力 ${displayValue(pokemon.attr.vit.value, pokemon.attr.vit.max)}
特殊 ${displayValue(pokemon.attr.spe.value, pokemon.attr.spe.max)}
洞察 ${displayValue(pokemon.attr.ins.value, pokemon.attr.ins.max)}
${(pokemon.evolution.stage) ? `進化階段：${pokemon.evolution.stage}` : ''} ${(pokemon.evolution.time) ? `進化時間：${pokemon.evolution.time}` : ''}
`
            if (detail) {
                rply += '------招式------\n'
                for (let index = 0; index < pokemon.moves.length; index++) {
                    rply += `等級：${pokemon.moves[index].rank} 【${pokemon.moves[index].name}】 ${Pokemon.findTypeByEng([pokemon.moves[index].type])}
                    `
                }
            }
            rply += `https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/assets/pokemon/${pokemon.info.image}`;

        } catch (error) {
            console.error('pokemon #145 error', error)
        }
        return rply;
    }
    search(name, detail) {
        try {
            let result = this.fuse.search(name, { limit: 12 });
            let rply = '';
            if (result.length === 0) return '沒有找到相關資料';
            if (result.length <= 2 || result[0].item.name === name) {
                rply = Pokemon.showPokemon(result[0].item, detail);
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
            console.error('pokemon error #166' + error);
            return '發生錯誤';
        }
    }
}


function removeAndCheck(mainMsg) {
    const patternDetail = /^--[dD]$/;
    return {
        detail: mainMsg.some(function (element) {
            return patternDetail.test(element);
        }),
        newMainMsg: mainMsg.filter(function (element) {
            return !patternDetail.test(element);
        })
    };
}


class Moves {
    constructor(data) {
        this.pokemonData = data;
        this.fuse = new Fuse(this.pokemonData, {
            keys: ['name', 'id', 'alias'],
            includeScore: true,
            findAllMatches: false,
            threshold: 0.4
        });
    }

    static init(link) {
        let data = [];
        require('fs').readdirSync('./assets/pokemon/').forEach(function (file) {
            if (file.match(/\.js$/) && file.match(new RegExp('^' + link, 'i'))) {
                let importData = require('../assets/pokemon/' + file);
                data = data.concat(importData.MoveList)
            }
        });
        return new Moves(data);
    }
    getVS(string) {
        if (typeof (string) === 'number') { string = ('000' + string).slice(-3) }
        let result = this.fuse.search(string, { limit: 1 })
        if (result)
            return result[0].item;
    }
    static findTypeByCht(value) {
        for (const key in typeName) {
            if (typeName[key] === value) {
                return key;
            }
        }
        return undefined;
    }
    static showMove(move) {
        let result = '';
        result += `【${move.name}】 ${move.alias} ${Pokemon.findTypeByEng([move.type])} 威力：${move.power}
命中：${move.accuracy}
招式傷害：${move.damage}
招式內容：${move.effect}
招式描述：${move.desc}`
        return result;
    }
    search(name) {
        try {
            let result = this.fuse.search(name, { limit: 12 });
            let rply = '';
            if (result.length === 0) return '沒有找到相關資料';
            if (result[0].item.name === name) {
                rply = Moves.showMove(result[0].item);
                return rply;
            }
            if (result.length <= 2) {
                for (let i = 0; i < result.length; i++) {
                    rply += `${Moves.showMove(result[i].item)} \n
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
            console.error('pokemon error #241', error);
            return '發生錯誤';
        }
    }
}
const pokeDex = Pokemon.init('pokedex-');
const pokeMove = Moves.init('moves-');
/**
 * 無效 = 0 = -999 
 * 弱效 = 1 = -1
 * 普通 = 2 = 0
 * 克制 = 3 = 1
 */

const typeName = {
    Normal: '一般', Fight: '格鬥', Flying: '飛行', Poison: '毒', Ground: '地面', Rock: '岩石', Bug: '蟲', Ghost: '幽靈', Steel: '鋼', Fire: '火', Water: '水', Grass: '草', Electric: '電', Psychic: '超能力', Ice: '冰', Dragon: '龍', Dark: '惡', Fairy: '妖精'
}

const typeChart = {
    Normal: { Normal: 0, Fight: 0, Flying: 0, Poison: 0, Ground: 0, Rock: -1, Bug: 0, Ghost: -999, Steel: -1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 0 },
    Fight: { Normal: 1, Fight: 0, Flying: -1, Poison: -1, Ground: 0, Rock: 1, Bug: -1, Ghost: -999, Steel: 1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: -1, Ice: 1, Dragon: 0, Dark: 1, Fairy: -1 },
    Flying: { Normal: 0, Fight: 1, Flying: 0, Poison: 0, Ground: 0, Rock: -1, Bug: 1, Ghost: 0, Steel: -1, Fire: 0, Water: 0, Grass: 1, Electric: -1, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 0 },
    Poison: { Normal: 0, Fight: 0, Flying: 0, Poison: -1, Ground: -999, Rock: -1, Bug: 0, Ghost: -1, Steel: -999, Fire: 0, Water: 0, Grass: 1, Electric: 0, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 1 },
    Ground: { Normal: 0, Fight: 0, Flying: -999, Poison: 1, Ground: 0, Rock: 1, Bug: -1, Ghost: 0, Steel: 1, Fire: 1, Water: 0, Grass: -1, Electric: 1, Psychic: 0, Ice: 0, Dragon: 0, Dark: 0, Fairy: 0 },
    Rock: { Normal: 0, Fight: -1, Flying: 1, Poison: 0, Ground: -1, Rock: 0, Bug: 1, Ghost: 0, Steel: -1, Fire: 1, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 1, Dragon: 0, Dark: 0, Fairy: 0 },
    Bug: { Normal: 0, Fight: -1, Flying: -1, Poison: -1, Ground: 0, Rock: 0, Bug: 0, Ghost: -1, Steel: -1, Fire: -1, Water: 0, Grass: 1, Electric: 0, Psychic: 1, Ice: 0, Dragon: 0, Dark: 1, Fairy: -1 },
    Ghost: { Normal: -999, Fight: 0, Flying: 0, Poison: 0, Ground: 0, Rock: 0, Bug: 0, Ghost: 1, Steel: 0, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 1, Ice: 0, Dragon: 0, Dark: -1, Fairy: 0 },
    Steel: { Normal: 0, Fight: 0, Flying: 0, Poison: 0, Ground: 0, Rock: 1, Bug: 0, Ghost: 0, Steel: -1, Fire: -1, Water: -1, Grass: 0, Electric: -1, Psychic: 0, Ice: 1, Dragon: 0, Dark: 0, Fairy: 1 },
    Fire: { Normal: 0, Fight: 0, Flying: 0, Poison: 0, Ground: 0, Rock: -1, Bug: 1, Ghost: 0, Steel: 1, Fire: -1, Water: -1, Grass: 1, Electric: 0, Psychic: 0, Ice: 1, Dragon: -1, Dark: 0, Fairy: 0 },
    Water: { Normal: 0, Fight: 0, Flying: 0, Poison: 0, Ground: 1, Rock: 1, Bug: 0, Ghost: 0, Steel: 0, Fire: 1, Water: -1, Grass: -1, Electric: 0, Psychic: 0, Ice: 0, Dragon: -1, Dark: 0, Fairy: 0 },
    Grass: { Normal: 0, Fight: 0, Flying: -1, Poison: -1, Ground: 1, Rock: 1, Bug: -1, Ghost: 0, Steel: -1, Fire: -1, Water: 1, Grass: -1, Electric: 0, Psychic: 0, Ice: 0, Dragon: -1, Dark: 0, Fairy: 0 },
    Electric: { Normal: 0, Fight: 0, Flying: 1, Poison: 0, Ground: -999, Rock: 0, Bug: 0, Ghost: 0, Steel: 0, Fire: 0, Water: 1, Grass: -1, Electric: -1, Psychic: 0, Ice: 0, Dragon: -1, Dark: 0, Fairy: 0 },
    Psychic: { Normal: 0, Fight: 1, Flying: 0, Poison: 1, Ground: 0, Rock: 0, Bug: 0, Ghost: 0, Steel: -1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: -1, Ice: 0, Dragon: 0, Dark: -999, Fairy: 0 },
    Ice: { Normal: 0, Fight: 0, Flying: 1, Poison: 0, Ground: 1, Rock: 0, Bug: 0, Ghost: 0, Steel: 1, Fire: -1, Water: -1, Grass: 1, Electric: 0, Psychic: 0, Ice: -1, Dragon: 1, Dark: 0, Fairy: 0 },
    Dragon: { Normal: 0, Fight: 0, Flying: 0, Poison: 0, Ground: 0, Rock: 0, Bug: 0, Ghost: 0, Steel: -1, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 0, Dragon: 1, Dark: 0, Fairy: -999 },
    Dark: { Normal: 0, Fight: -1, Flying: 0, Poison: 0, Ground: 0, Rock: 0, Bug: 0, Ghost: 1, Steel: 0, Fire: 0, Water: 0, Grass: 0, Electric: 0, Psychic: 1, Ice: 0, Dragon: 0, Dark: -1, Fairy: -1 },
    Fairy: { Normal: 0, Fight: 1, Flying: 0, Poison: -1, Ground: 0, Rock: 0, Bug: 0, Ghost: 0, Steel: -1, Fire: -1, Water: 0, Grass: 0, Electric: 0, Psychic: 0, Ice: 0, Dragon: 1, Dark: 1, Fairy: 0 }
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
    try {

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

    } catch (error) {
        console.error(error)
        return { value: -999, script: '出錯，請回報問題或以後再試' };
    }
}


function commandVS(mainMsg) {
    try {
        let rply = {
            text: ''
        }
        //招式名,屬性  VS  POKEMON名,POKEMON NO,屬性1,屬性2
        let attackerType = Moves.findTypeByCht(mainMsg[2]);
        let attacker = (attackerType) ? null : pokeMove.getVS(mainMsg[2]);
        if (attacker) {
            attackerType = attacker.type
        }
        let defenderType = Pokemon.findTypeByCht(mainMsg[3]);
        let defender = (defenderType.length) ? null : pokeDex.getVS(mainMsg[3]);
        if (defender) {
            defenderType = defender.type
        }

        if (mainMsg[4]) {
            let defenderType2 = Pokemon.findTypeByCht(mainMsg[4]);
            if (defenderType2) defenderType = defenderType.concat(defenderType2);
        }
        if (!defenderType.length || !attackerType) {
            rply.text += (!attackerType) ? '找不到攻方屬性，請確認名稱，你可以輸入完整招式名稱或屬性\n' : '';
            rply.text += (!defenderType.length) ? '找不到防方屬性，請確認名稱，你可以輸入小精靈名稱，編號或屬性\n' : '';
            return rply;

        }
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

        let attackerTypeChinese = Pokemon.findTypeByEng([attackerType]);
        let defenderTypeChinese = Pokemon.findTypeByEng(defenderType);
        rply.text +=
            `攻方屬性：${attackerTypeChinese}
防方屬性：${defenderTypeChinese}
屬性效果：${typeEffect.script}
`
        rply.text += (attacker) ?
            `--------------------
攻方招式：【${attacker.name}】 威力：${attacker.power}
攻方命中：${attacker.accuracy}
攻方招式傷害：${attacker.damage}
攻方招式內容：${attacker.effect}
攻方招式描述：${attacker.desc}
`: '';
        rply.text += (defender) ?
            `--------------------
防方小精靈：${defender.name}
防方小精靈圖片：https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/assets/pokemon/${defender.info.image}
`: '';
        return rply;
    } catch (error) {
        rply.text = `輸入錯誤，請輸入正確的招式名稱或小精靈名稱\n${getHelpMessage()}`
        return rply;
    }
}

function displayValue(current, total) {
    let result = '';
    for (let i = 0; i < current; i++) {
        result += '●';
    }
    for (let i = 0; i < total - current; i++) {
        result += '○';
    }
    return result;
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