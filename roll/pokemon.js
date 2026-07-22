"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const Fuse = require('fuse.js');
const { randomInt } = require('mathjs');
const i18n = require('../modules/i18n.js');
const { getT, resolveHelp, resolveGameName } = require('../modules/roll-i18n.js');
const gameName = function (params = {}) {
    return resolveGameName(params, 'pokemon.game_name', '【PokeRole】.poke ');
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
const getHelpMessage = function (params = {}) {
    return resolveHelp(params, 'pokemon.help');
}

const initialize = function () {
    return variables;
}

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
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage({ locale, t });
            rply.quotes = true;
            rply.buttonCreate = ['.poke', '.poke mon 超夢', '.poke move 火焰輪', '.poke vs 火之誓約 夢幻', '.poke vs 火 100', '.poke vs 火 超能力 水']
            return rply;
        }
        case /^vs$/.test(mainMsg[1]): {
            let text = commandVS(mainMsg, translate, { locale, t }).text;
            rply.quotes = true;
            rply.text = text;
            return rply;
        }
        case /^move$/.test(mainMsg[1]): {
            rply.quotes = true;
            rply.text = pokeMove.search(mainMsg.slice(2).join(' '), translate)
            return rply;
        }
        case /^mon$/.test(mainMsg[1]): {
            rply.quotes = true;
            let check = removeAndCheck(mainMsg)
            let detail = check.detail;
            let name = (!check.newMainMsg[2]) ? randomInt(1, 890).toString() : check.newMainMsg.slice(2).join(' ');
            rply.text = pokeDex.search(name, detail, translate)
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
        // 優化的 Fuse 配置：更精確的搜尋，減少無關結果
        this.fuse = new Fuse(this.pokemonData, {
            keys: [
                { name: 'name', weight: 0.5 },
                { name: 'id', weight: 0.3 },
                { name: 'alias', weight: 0.2 }
            ],
            includeScore: true,
            findAllMatches: false,
            threshold: 0.4,
            minMatchCharLength: 1,
            shouldSort: true,
            location: 0,
            distance: 100
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
    static findTypeByCht(value, translate) {
        const key = resolveTypeKeyLocalized(value, translate);
        return key ? [key] : [];
    }
    static findTypeByEng(value, translate) {
        let result = [];
        for (const key in typeName) {
            for (let i = 0; i < value.length; i++) {
                if (key === value[i]) {
                    result.push(formatTypeLabel(key, translate));
                }
            }
        }
        return result;
    }
    static showPokemon(pokemon, detail = false, translate) {
        const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
        let rply = '';
        try {
            const evoStage = (pokemon.evolution.stage) ? t('pokemon.evolution_stage', { stage: pokemon.evolution.stage }) + ' ' : '';
            const evoTime = (pokemon.evolution.time) ? t('pokemon.evolution_time', { time: pokemon.evolution.time }) : '';
            rply += `#${pokemon.id} 【${pokemon.name}】 ${pokemon.alias} ${formatTypesDisplay(pokemon.type, t)}
${pokemon.info.category} ${pokemon.info.height}m / ${pokemon.info.weight}kg
${t('pokemon.mon_stats', { rank: pokemon.rank, hp: pokemon.baseHP, ability: pokemon.ability })}
${t('pokemon.stat_str')} ${displayValue(pokemon.attr.str.value, pokemon.attr.str.max)}
${t('pokemon.stat_dex')} ${displayValue(pokemon.attr.dex.value, pokemon.attr.dex.max)}
${t('pokemon.stat_vit')} ${displayValue(pokemon.attr.vit.value, pokemon.attr.vit.max)}
${t('pokemon.stat_spe')} ${displayValue(pokemon.attr.spe.value, pokemon.attr.spe.max)}
${t('pokemon.stat_ins')} ${displayValue(pokemon.attr.ins.value, pokemon.attr.ins.max)}
${evoStage}${evoTime}
`
            const typeSep = t('pokemon.type_list_sep');
            const typeEffectiveness = getTypeEffectiveness(pokemon.type, t);
            rply += t('pokemon.type_matchup_header') + '\n';

            if (typeEffectiveness.superEffective.length > 0) {
                rply += t('pokemon.super_effective', { types: typeEffectiveness.superEffective.join(typeSep) }) + '\n';
            }
            if (typeEffectiveness.effective.length > 0) {
                rply += t('pokemon.effective', { types: typeEffectiveness.effective.join(typeSep) }) + '\n';
            }
            if (typeEffectiveness.notVeryEffective.length > 0) {
                rply += t('pokemon.not_very_effective', { types: typeEffectiveness.notVeryEffective.join(typeSep) }) + '\n';
            }
            if (typeEffectiveness.noEffect.length > 0) {
                rply += t('pokemon.no_effect', { types: typeEffectiveness.noEffect.join(typeSep) }) + '\n';
            }
            rply += '\n';

            if (detail) {
                rply += t('pokemon.moves_header') + '\n'
                for (let index = 0; index < pokemon.moves.length; index++) {
                    rply += t('pokemon.move_line', {
                        rank: pokemon.moves[index].rank,
                        name: pokemon.moves[index].name,
                        type: formatTypeLabel(pokemon.moves[index].type, t)
                    }) + '\n';
                }
            }
            rply += `https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/assets/pokemon/${pokemon.info.image}`;

        } catch (error) {
            console.error('pokemon #145 error', error)
        }
        return rply;
    }
    search(name, detail, translate) {
        const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
        try {
            // 優化搜尋策略：根據輸入類型調整搜尋參數
            let searchOptions = { limit: 12 };

            // 如果是數字 ID，使用更嚴格的搜尋
            if (/^\d+$/.test(name)) {
                searchOptions.threshold = 0.1; // 更嚴格的匹配
            } else if (name.length <= 2) {
                // 極短名稱使用更嚴格的搜尋，避免過多結果
                searchOptions.threshold = 0.3;
                searchOptions.limit = 5; // 限制結果數量
            } else if (name.length <= 4) {
                // 短名稱使用中等嚴格度
                searchOptions.threshold = 0.4;
                searchOptions.limit = 8;
            } else {
                // 長名稱使用較寬鬆的搜尋以包含更多結果
                searchOptions.threshold = 0.5;
            }

            // 先檢查完全匹配（不依賴Fuse搜尋結果）
            const nameLower = name.toLowerCase();

            // 檢查ID完全匹配
            if (/^\d+$/.test(name)) {
                const exactIdMatch = this.pokemonData.find(item => item.id === name);
                if (exactIdMatch) {
                    return Pokemon.showPokemon(exactIdMatch, detail, t);
                }
            }

            // 檢查名稱完全匹配
            const exactNameMatch = this.pokemonData.find(item =>
                item.name.toLowerCase() === nameLower
            );
            if (exactNameMatch) {
                return Pokemon.showPokemon(exactNameMatch, detail, t);
            }

            // 檢查別名完全匹配
            const exactAliasMatch = this.pokemonData.find(item =>
                item.alias && item.alias.toLowerCase() === nameLower
            );
            if (exactAliasMatch) {
                return Pokemon.showPokemon(exactAliasMatch, detail, t);
            }

            // 如果沒有完全匹配，使用Fuse搜尋
            let result = this.fuse.search(name, searchOptions);
            let rply = '';
            if (result.length === 0) return t('pokemon.not_found');
            
            // 檢查是否有高相似度的結果
            const highScoreResults = result.filter(item => 
                item.score && (1 - item.score) >= 0.9
            );
            
            // 如果有高相似度結果且數量不多，直接顯示
            if (highScoreResults.length > 0 && highScoreResults.length <= 5) {
                for (let i = 0; i < highScoreResults.length; i++) {
                    rply += Pokemon.showPokemon(highScoreResults[i].item, detail, t);
                    if (i < highScoreResults.length - 1) rply += '\n\n';
                }
                return rply;
            }
            
            // If 2 or fewer results, show all
            if (result.length <= 2) {
                for (let i = 0; i < result.length; i++) {
                    rply += Pokemon.showPokemon(result[i].item, detail, t);
                    if (i < result.length - 1) rply += '\n\n';
                }
                return rply;
            }
            
            // Too many results - show top matches with scores
            rply += t('pokemon.too_many') + '\n\n';
            for (let i = 0; i < Math.min(result.length, 8); i++) {
                const score = result[i].score ? t('pokemon.similarity', { score: (1 - result[i].score).toFixed(2) }) : '';
                rply += `${result[i].item.name}${score}\n`;
            }
            return rply;
        }
        catch (error) {
            console.error('pokemon error #166' + error);
            return t('pokemon.error');
        }
    }

    // 為自動完成功能提供搜尋方法
    searchForAutocomplete(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return this.getAllData().slice(0, limit);
        }
        
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        
        // 搜尋所有寶可夢
        for (const pokemon of this.pokemonData) {
            const name = pokemon.name || '';
            const alias = pokemon.alias || '';
            const id = pokemon.id || '';
            const type = pokemon.type || [];
            const category = pokemon.info?.category || '';
            
            // 多字段搜尋
            const searchableText = `${name} ${alias} ${id} ${type.join(' ')} ${category}`.toLowerCase();
            
            if (searchableText.includes(searchTerm)) {
                results.push({
                    id: pokemon.id,
                    display: name,
                    value: name,
                    metadata: {
                        alias: alias,
                        type: Pokemon.findTypeByEng(type),
                        category: category,
                        id: id
                    }
                });
            }
        }
        
        // 按相關性排序（名稱完全匹配優先）
        results.sort((a, b) => {
            const aExact = a.display.toLowerCase() === searchTerm;
            const bExact = b.display.toLowerCase() === searchTerm;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return a.display.localeCompare(b.display);
        });
        
        return results.slice(0, limit);
    }

    // 獲取所有數據（用於初始化）
    getAllData() {
        return this.pokemonData.map(pokemon => ({
            id: pokemon.id,
            display: pokemon.name,
            value: pokemon.name,
            metadata: {
                alias: pokemon.alias,
                type: Pokemon.findTypeByEng(pokemon.type),
                category: pokemon.info?.category,
                id: pokemon.id
            }
        }));
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
        // 優化的招式搜尋配置：更精確的匹配
        this.fuse = new Fuse(this.pokemonData, {
            keys: [
                { name: 'name', weight: 0.6 },
                { name: 'alias', weight: 0.4 }
            ],
            includeScore: true,
            findAllMatches: false,
            threshold: 0.3,
            minMatchCharLength: 1,
            shouldSort: true,
            location: 0,
            distance: 50
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
    static findTypeByCht(value, translate) {
        return resolveTypeKeyLocalized(value, translate);
    }
    static showMove(move, translate) {
        const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
        return t('pokemon.move_detail', {
            name: move.name,
            alias: move.alias,
            type: formatTypeLabel(move.type, t),
            power: move.power,
            accuracy: move.accuracy,
            damage: move.damage,
            effect: move.effect,
            desc: move.desc
        });
    }
    search(name, translate) {
        const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
        try {
            // 優化招式搜尋：根據輸入長度調整搜尋策略
            let searchOptions = { limit: 12 };
            
            if (name.length <= 2) {
                // 極短名稱使用更嚴格的搜尋，避免過多結果
                searchOptions.threshold = 0.3;
                searchOptions.limit = 5;
            } else if (name.length <= 4) {
                // 短名稱使用中等嚴格度
                searchOptions.threshold = 0.4;
                searchOptions.limit = 8;
            } else {
                // 長名稱使用更精確的搜尋
                searchOptions.threshold = 0.2;
            }
            
            let result = this.fuse.search(name, searchOptions);
            let rply = '';
            if (result.length === 0) return t('pokemon.not_found');
            
            // Check for exact name match (case insensitive)
            let exactNameMatch = result.find(item => 
                item.item.name.toLowerCase() === name.toLowerCase()
            );
            if (exactNameMatch) {
                rply = Moves.showMove(exactNameMatch.item, t);
                return rply;
            }
            
            // Check for exact alias match
            let exactAliasMatch = result.find(item => 
                item.item.alias && item.item.alias.toLowerCase().includes(name.toLowerCase())
            );
            if (exactAliasMatch) {
                rply = Moves.showMove(exactAliasMatch.item, t);
                return rply;
            }
            
            // 檢查是否有高相似度的結果
            const highScoreResults = result.filter(item => 
                item.score && (1 - item.score) >= 0.9
            );
            
            // 如果有高相似度結果且數量不多，直接顯示
            if (highScoreResults.length > 0 && highScoreResults.length <= 5) {
                for (let i = 0; i < highScoreResults.length; i++) {
                    rply += `${Moves.showMove(highScoreResults[i].item, t)}\n\n`;
                }
                return rply;
            }
            
            if (result.length <= 2) {
                for (let i = 0; i < result.length; i++) {
                    rply += `${Moves.showMove(result[i].item, t)}\n\n`;
                }
            }
            else {
                rply += t('pokemon.too_many') + '\n\n';
                for (let i = 0; i < Math.min(result.length, 8); i++) {
                    const score = result[i].score ? t('pokemon.similarity', { score: (1 - result[i].score).toFixed(2) }) : '';
                    rply += `${result[i].item.name}${score}\n`;
                }
            }
            return rply;
        }
        catch (error) {
            console.error('pokemon error #241', error);
            return t('pokemon.error');
        }
    }

    // 為自動完成功能提供搜尋方法
    searchForAutocomplete(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return this.getAllData().slice(0, limit);
        }
        
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        
        // 搜尋所有招式
        for (const move of this.pokemonData) {
            const name = move.name || '';
            const alias = move.alias || '';
            const type = move.type || '';
            const power = move.power || '';
            
            // 多字段搜尋
            const searchableText = `${name} ${alias} ${type} ${power}`.toLowerCase();
            
            if (searchableText.includes(searchTerm)) {
                results.push({
                    id: name, // 使用名稱作為ID
                    display: name,
                    value: name,
                    metadata: {
                        alias: alias,
                        type: Pokemon.findTypeByEng([type]),
                        power: power,
                        accuracy: move.accuracy
                    }
                });
            }
        }
        
        // 按相關性排序（名稱完全匹配優先）
        results.sort((a, b) => {
            const aExact = a.display.toLowerCase() === searchTerm;
            const bExact = b.display.toLowerCase() === searchTerm;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return a.display.localeCompare(b.display);
        });
        
        return results.slice(0, limit);
    }

    // 獲取所有數據（用於初始化）
    getAllData() {
        return this.pokemonData.map(move => ({
            id: move.name,
            display: move.name,
            value: move.name,
            metadata: {
                alias: move.alias,
                type: Pokemon.findTypeByEng([move.type]),
                power: move.power,
                accuracy: move.accuracy
            }
        }));
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
};

const TYPE_I18N_KEYS = {
    Normal: 'type_normal',
    Fight: 'type_fighting',
    Flying: 'type_flying',
    Poison: 'type_poison',
    Ground: 'type_ground',
    Rock: 'type_rock',
    Bug: 'type_bug',
    Ghost: 'type_ghost',
    Steel: 'type_steel',
    Fire: 'type_fire',
    Water: 'type_water',
    Grass: 'type_grass',
    Electric: 'type_electric',
    Psychic: 'type_psychic',
    Ice: 'type_ice',
    Dragon: 'type_dragon',
    Dark: 'type_dark',
    Fairy: 'type_fairy'
};

const EFFECT_I18N_KEYS = {
    1: 'effect_super_1',
    2: 'effect_super_2',
    0: 'effect_normal',
    '-1': 'effect_weak_1',
    '-2': 'effect_weak_2'
};

function formatTypeLabel(engKey, translate) {
    const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    const i18nKey = TYPE_I18N_KEYS[engKey];
    if (i18nKey) {
        const label = t(`pokemon.${i18nKey}`);
        if (label && !label.startsWith('pokemon.')) {
            return label;
        }
    }
    return typeName[engKey] || engKey;
}

function formatTypesDisplay(engTypes, translate) {
    const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    const sep = t('pokemon.type_list_sep');
    return Pokemon.findTypeByEng(engTypes, t).join(sep);
}

function resolveTypeKey(value) {
    if (!value) {
        return;
    }
    const trimmed = String(value).trim();
    for (const key in typeName) {
        if (typeName[key] === trimmed || key.toLowerCase() === trimmed.toLowerCase()) {
            return key;
        }
    }
}

function resolveTypeKeyLocalized(value, translate) {
    const direct = resolveTypeKey(value);
    if (direct) {
        return direct;
    }
    const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    for (const engKey of Object.keys(TYPE_I18N_KEYS)) {
        const label = t(`pokemon.${TYPE_I18N_KEYS[engKey]}`);
        if (label && label === value) {
            return engKey;
        }
    }
}

function getEffectScript(level, translate) {
    const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    const i18nKey = EFFECT_I18N_KEYS[String(level)];
    if (i18nKey) {
        const script = t(`pokemon.${i18nKey}`);
        if (script && !script.startsWith('pokemon.')) {
            return script;
        }
    }
    return effect[level];
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
function checkEffectiveness(moveType, enemyType, translate) {
    const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
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
        if (level == -999) return { effect: -999, script: t('pokemon.effect_immune') };
        effectiveness += level;
        if (enemyType2) {
            level = typeChart[moveType][enemyType2];
            if (level == -999) return { effect: -999, script: t('pokemon.effect_immune') };
            effectiveness += level;
        }
        let result = { value: effectiveness, script: getEffectScript(effectiveness, t) };
        return result;

    } catch (error) {
        console.error(error)
        return { value: -999, script: t('pokemon.effect_error') };
    }
}


function commandVS(mainMsg, translate, helpParams = {}) {
    const t = translate || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    let rply = {
        text: ''
    }
    try {

        //招式名,屬性  VS  POKEMON名,POKEMON NO,屬性1,屬性2
        let attackerType = Moves.findTypeByCht(mainMsg[2], t);
        let attacker = (attackerType) ? null : pokeMove.getVS(mainMsg[2]);
        if (attacker) {
            attackerType = attacker.type
        }
        let defenderType = Pokemon.findTypeByCht(mainMsg[3], t);
        let defender = (defenderType.length > 0) ? null : pokeDex.getVS(mainMsg[3]);
        if (defender) {
            defenderType = defender.type
        }

        if (mainMsg[4]) {
            let defenderType2 = Pokemon.findTypeByCht(mainMsg[4], t);
            if (defenderType2) defenderType = [...defenderType, ...defenderType2];
        }
        if (defenderType.length === 0 || !attackerType) {
            rply.text += (!attackerType) ? t('pokemon.vs_attacker_missing') : '';
            rply.text += (defenderType.length === 0) ? t('pokemon.vs_defender_missing') : '';
            return rply;

        }
        let typeEffect = checkEffectiveness(attackerType, defenderType, t);

        const typeSep = t('pokemon.type_list_sep');
        let attackerTypeChinese = Pokemon.findTypeByEng([attackerType], t).join(typeSep);
        let defenderTypeChinese = Pokemon.findTypeByEng(defenderType, t).join(typeSep);
        rply.text +=
            t('pokemon.vs_attacker_type', { type: attackerTypeChinese }) +
            t('pokemon.vs_defender_type', { type: defenderTypeChinese }) +
            t('pokemon.vs_effect', { effect: typeEffect.script });
        rply.text += (attacker) ?
            t('pokemon.vs_separator') +
            t('pokemon.vs_move_name', { name: attacker.name, power: attacker.power }) +
            t('pokemon.vs_move_accuracy', { accuracy: attacker.accuracy }) +
            t('pokemon.vs_move_damage', { damage: attacker.damage }) +
            t('pokemon.vs_move_effect', { effect: attacker.effect }) +
            t('pokemon.vs_move_desc', { desc: attacker.desc })
            : '';
        rply.text += (defender) ?
            t('pokemon.vs_separator') +
            t('pokemon.vs_defender_name', { name: defender.name }) +
            t('pokemon.vs_defender_image', { url: `https://github.com/hktrpg/TG.line.Discord.Roll.Bot/raw/master/assets/pokemon/${defender.info.image}` })
            : '';
        return rply;
    } catch {
        rply.text = t('pokemon.vs_input_error', { help: getHelpMessage(helpParams) });
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

function getTypeEffectiveness(pokemonTypes, translate) {
    /**
     * 分析寶可夢的屬性相刻
     * @param {Array} pokemonTypes - 寶可夢的屬性陣列
     * @returns {Object} 包含各種效果的屬性列表
     */
    const effectiveness = {
        superEffective: [], // 效果超級絕佳 (4倍)
        effective: [],      // 效果絕佳 (2倍)
        notVeryEffective: [], // 效果非常不好 (0.25倍)
        noEffect: []        // 完全沒有效果 (0倍)
    };

    // 遍歷所有攻擊屬性
    for (const attackType of Object.keys(typeChart)) {
        let totalEffect = 0;
        let hasNoEffect = false;

        // 計算對每個防禦屬性的效果
        for (const defenseType of pokemonTypes) {
            const effectValue = typeChart[attackType][defenseType];
            if (effectValue === -999) {
                hasNoEffect = true;
            } else {
                totalEffect += effectValue;
            }
        }

        // 如果任何屬性免疫，則完全沒有效果
        if (hasNoEffect) {
            effectiveness.noEffect.push(formatTypeLabel(attackType, translate));
        } else {
            // 根據總效果分類 (基於這個系統的傷害計算)
            // 2 = 效果絕佳 (額外2傷害 = 4倍傷害)
            // 1 = 效果絕佳 (額外1傷害 = 2倍傷害)
            // -2 = 效果非常不好 (減少2傷害 = 0.25倍傷害)
            // 其他值 = 普通效果
            switch (totalEffect) {
                case 2:
                    effectiveness.superEffective.push(formatTypeLabel(attackType, translate));
                    break;
                case 1:
                    effectiveness.effective.push(formatTypeLabel(attackType, translate));
                    break;
                case -2:
                    effectiveness.notVeryEffective.push(formatTypeLabel(attackType, translate));
                    break;
                // totalEffect === 0 或 -1 的情況不顯示（普通效果）
            }
        }
    }

    return effectiveness;
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
                    .addStringOption(option => {
                        const opt = option.setName('name')
                            .setDescription('寶可夢名稱或編號')
                            .setRequired(true);

                        // 網頁版自動完成配置 (Discord 端不使用 autocomplete)
                        opt.autocompleteModule = 'pokemon';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.alias', 'metadata.type', 'metadata.id'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsKey = 'pokemon.autocomplete_no_pokemon';

                        return opt;
                    })
                    .addBooleanOption(option =>
                        option.setName('detail')
                            .setDescription('是否顯示招式列表')
                            .setRequired(false)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('move')
                    .setDescription('查詢招式資料')
                    .addStringOption(option => {
                        const opt = option.setName('name')
                            .setDescription('招式名稱')
                            .setRequired(true);

                        // 網頁版自動完成配置 (Discord 端不使用 autocomplete)
                        opt.autocompleteModule = 'pokemon_moves';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.alias', 'metadata.type'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsKey = 'pokemon.autocomplete_no_move';

                        return opt;
                    }))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('vs')
                    .setDescription('對戰模擬')
                    .addStringOption(option => {
                        const opt = option.setName('attacker')
                            .setDescription('攻擊方(招式名稱或屬性)')
                            .setRequired(true);

                        // 網頁版自動完成配置 (Discord 端不使用 autocomplete)
                        opt.autocompleteModule = 'pokemon_moves';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.alias', 'metadata.type'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsKey = 'pokemon.autocomplete_no_move_or_type';

                        return opt;
                    })
                    .addStringOption(option => {
                        const opt = option.setName('defender')
                            .setDescription('防守方(寶可夢名稱/編號或屬性)')
                            .setRequired(true);

                        // 網頁版自動完成配置 (Discord 端不使用 autocomplete)
                        opt.autocompleteModule = 'pokemon';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.alias', 'metadata.type', 'metadata.id'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsKey = 'pokemon.autocomplete_no_pokemon_or_type';

                        return opt;
                    })
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

// 自動完成配置 - 寶可夢
const autocomplete = {
    moduleName: 'pokemon',
    getData: () => {
        const instance = Pokemon.init('pokedex-');
        return instance.getAllData();
    },
    search: (query, limit) => {
        const instance = Pokemon.init('pokedex-');
        return instance.searchForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

// 自動完成配置 - 寶可夢招式
const autocompleteMoves = {
    moduleName: 'pokemon_moves',
    getData: () => {
        const instance = Moves.init('moves-');
        return instance.getAllData();
    },
    search: (query, limit) => {
        const instance = Moves.init('moves-');
        return instance.searchForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

// 為了讓自動完成模組註冊系統識別，需要以 Autocomplete 結尾
const pokemonMovesAutocomplete = autocompleteMoves;

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand,
    autocomplete,
    autocompleteMoves,
    pokemonMovesAutocomplete,
    Pokemon,
    Moves,
    getTypeEffectiveness
};