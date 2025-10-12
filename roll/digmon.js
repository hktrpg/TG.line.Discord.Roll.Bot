"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const Fuse = require('fuse.js');
const { randomInt } = require('mathjs');
const gameName = function () {
    return '【Digimon】.digi '
}
const gameType = function () {
    return 'Funny:digimon:hktrpg'
}

const prefixs = function () {
    return [{
        first: /^\.digi$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【🎮數碼寶貝物語時空異客】
╭────── 📖基礎查詢 ──────
│ • .digi - 顯示完整指令列表
│
├────── 🔍數碼寶貝資料 ──────
│ 基本查詢:
│ 　• .digi [名稱/編號]
│ 　  例: .digi 亞古獸
│ 　  例: .digi 123
│
├────── 🔄進化路線查詢 ──────
│ 格式:
│ .digi [起始] [目標]
│
│ 範例:
│ 　• .digi 亞古獸 戰鬥暴龍獸
│ 　• .digi 123 456
│ 　• .digi 滾球獸 奧米加獸
│
├────── 📚進化階段說明 ──────
│ 1: 幼年期1
│ 2: 幼年期2  
│ 3: 成長期
│ 4: 成熟期
│ 5: 完全體
│ 6: 究極體
│ 7: 超究極體
│ 4a: 成熟期裝甲體
│ 4d/5d/6d: 混合體
│
├────── 📚資料來源 ──────
│ • 數碼寶貝物語時空異客
│ • 免費開源TRPG中文化團隊
╰──────────────`
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
    
    // Handle help or no arguments
    if (!mainMsg[1] || /^help$/i.test(mainMsg[1])) {
        rply.text = this.getHelpMessage();
        rply.quotes = true;
        rply.buttonCreate = ['.digi', '.digi 亞古獸', '.digi 123', '.digi 亞古獸 戰鬥暴龍獸', '.digi 滾球獸 奧米加獸']
        return rply;
    }
    
    // Two arguments: evolution path finding
    if (mainMsg[2]) {
        rply.quotes = true;
        rply.text = digimonDex.findEvolutionPath(mainMsg[1], mainMsg[2]);
        return rply;
    }
    
    // Single argument: show Digimon info
    rply.quotes = true;
    rply.text = digimonDex.search(mainMsg[1]);
    return rply;
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
        for (const file of require('fs').readdirSync('./assets/pokemon/')) {
            if (/\.js$/.test(file) && new RegExp('^' + link, 'i').test(file)) {
                let importData = require('../assets/pokemon/' + file);
                data = [...data, ...importData.Pokedex]
            }
        }
        return new Pokemon(data);
    }
    getVS(string) {
        if (typeof (string) === 'number') { string = ('000' + string).slice(-3) }
        let result = this.fuse.search(string, { limit: 1 })
        if (result.length > 0) return result[0].item;
        return;
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
        for (const file of require('fs').readdirSync('./assets/pokemon/')) {
            if (/\.js$/.test(file) && new RegExp('^' + link, 'i').test(file)) {
                let importData = require('../assets/pokemon/' + file);
                data = [...data, ...importData.MoveList]
            }
        }
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
        return;
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
    let rply = {
        text: ''
    }
    try {

        //招式名,屬性  VS  POKEMON名,POKEMON NO,屬性1,屬性2
        let attackerType = Moves.findTypeByCht(mainMsg[2]);
        let attacker = (attackerType) ? null : pokeMove.getVS(mainMsg[2]);
        if (attacker) {
            attackerType = attacker.type
        }
        let defenderType = Pokemon.findTypeByCht(mainMsg[3]);
        let defender = (defenderType.length > 0) ? null : pokeDex.getVS(mainMsg[3]);
        if (defender) {
            defenderType = defender.type
        }

        if (mainMsg[4]) {
            let defenderType2 = Pokemon.findTypeByCht(mainMsg[4]);
            if (defenderType2) defenderType = [...defenderType, ...defenderType2];
        }
        if (defenderType.length === 0 || !attackerType) {
            rply.text += (!attackerType) ? '找不到攻方屬性，請確認名稱，你可以輸入完整招式名稱或屬性\n' : '';
            rply.text += (defenderType.length === 0) ? '找不到防方屬性，請確認名稱，你可以輸入小精靈名稱，編號或屬性\n' : '';
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
    } catch {
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

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('poke')
            .setDescription('寶可夢PokeRole查詢系統')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('mon')
                    .setDescription('查詢寶可夢資料')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('寶可夢名稱或編號')
                            .setRequired(true))
                    .addBooleanOption(option =>
                        option.setName('detail')
                            .setDescription('是否顯示招式列表')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('move')
                    .setDescription('查詢招式資料')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('招式名稱')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('vs')
                    .setDescription('對戰模擬')
                    .addStringOption(option =>
                        option.setName('attacker')
                            .setDescription('攻擊方(招式名稱或屬性)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('defender')
                            .setDescription('防守方(寶可夢名稱/編號或屬性)')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('defender_type2')
                            .setDescription('防守方第二屬性(選填)')
                            .setRequired(false))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'mon': {
                    const name = interaction.options.getString('name');
                    const detail = interaction.options.getBoolean('detail');
                    return `.poke mon ${name}${detail ? ' --d' : ''}`;
                }
                case 'move': {
                    const name = interaction.options.getString('name');
                    return `.poke move ${name}`;
                }
                case 'vs': {
                    const attacker = interaction.options.getString('attacker');
                    const defender = interaction.options.getString('defender');
                    const defenderType2 = interaction.options.getString('defender_type2');
                    return `.poke vs ${attacker} ${defender}${defenderType2 ? ' ' + defenderType2 : ''}`;
                }
            }
        }
    }
];

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};