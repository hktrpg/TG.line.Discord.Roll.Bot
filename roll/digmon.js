"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const Fuse = require('fuse.js');
const gameName = function () {
    return '【Digimon Story: Cyber Sleuth】.digi '
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
    return `【🎮數碼寶貝物語時空異客】(測試中)
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
│ 進化路線:
│ 　• .digi [起始] [目標]
│ 　  例: .digi 123 323
│ 　  例: .digi 亞古獸 戰鬥暴龍獸
│
│ 功能說明:
│ 　• 顯示從起始數碼寶貝到目標的進化路線
│ 　• 最多顯示4條最短路線
│ 　• 支援退化與進化混合路線
│ 　• 包含特殊進化(合體進化、裝甲進化)
│
├────── 📊資料顯示 ──────
│ 單一查詢顯示:
│ 　• 基礎個性(personality)
│ 　• 可能基礎系譜
│ 　• 屬性抗性
│ 　• 受該數碼寶貝特殊技能克制
│ 　• 出現地點(locations)
│ 　• 完整進化退化路線
│
├────── 🎯進化階段 ──────
│ 1: 幼年期1    2: 幼年期2
│ 3: 成長期     4: 成熟期
│ 5: 完全體     6: 究極體
│ 7: 超究極體   a: 裝甲體
│ d: 混合體
│
├────── 📚資料來源 ──────
│ • 數碼寶貝物語時空異客
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

    // Initialize digimon data if not already done
    if (!variables.digimonDex) {
        variables.digimonDex = Digimon.init();
    }

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = getHelpMessage();
            rply.quotes = true;
            rply.buttonCreate = ['.digi', '.digi 亞古獸', '.digi 123', '.digi 123 323', '.digi 亞古獸 戰鬥暴龍獸']
            return rply;
        }
        case mainMsg.length >= 3: {
            // Two parameters: evolution path finding
            rply.quotes = true;
            const fromDigimon = variables.digimonDex.findByNameOrId(mainMsg[1]);
            const toDigimon = variables.digimonDex.findByNameOrId(mainMsg[2]);

            if (!fromDigimon) {
                rply.text = `找不到起始數碼寶貝：${mainMsg[1]}`;
                return rply;
            }

            if (!toDigimon) {
                rply.text = `找不到目標數碼寶貝：${mainMsg[2]}`;
                return rply;
            }

            rply.text = variables.digimonDex.showEvolutionPaths(fromDigimon, toDigimon);
            return rply;
        }
        case mainMsg.length >= 2: {
            // Single parameter: show digimon info
            rply.quotes = true;
            const name = mainMsg[1];
            rply.text = variables.digimonDex.search(name);
            return rply;
        }
        default: {
            rply.text = getHelpMessage();
            rply.quotes = true;
            return rply;
        }
    }
}

class Digimon {
    constructor(data) {
        this.digimonData = data;
        this.worldData = null;
        this.stagesName = [];
        this.fuse = new Fuse(this.digimonData, {
            keys: ['name', 'zh-cn-name', 'id'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0.6
        });
    }

    static init() {
        const data = require('../assets/digmonsts/digimonSTS.json');
        const digimon = new Digimon(data);

        // Find world data and stages info (support id:0 or id:'world_data' or name:'基礎系譜')
        let worldEntry = null;
        if (Array.isArray(data)) {
            worldEntry = data.find(item => item && (item.id === 0 || item.id === 'world_data' || item.name === '基礎系譜')) || null;
        }
        if (worldEntry) {
            digimon.worldData = worldEntry;
            if (worldEntry.stages_name) {
                digimon.stagesName = worldEntry.stages_name;
            }
        }

        // Filter out non-digimon entries
        digimon.digimonData = data.filter(item =>
            typeof item.id === 'number' &&
            item.name &&
            item.stage
        );

        // Recreate fuse with filtered data
        digimon.fuse = new Fuse(digimon.digimonData, {
            keys: ['name', 'zh-cn-name', 'id'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0.6
        });

        return digimon;
    }

    ensureWorldDataLoaded() {
        if (this.worldData && this.worldData.locations) return;
        try {
            const data = require('../assets/digmonsts/digimonSTS.json');
            if (Array.isArray(data)) {
                const worldEntry = data.find(item => item && (item.id === 0 || item.id === 'world_data' || item.name === '基礎系譜')) || null;
                if (worldEntry) {
                    this.worldData = worldEntry;
                    if (worldEntry.stages_name) {
                        this.stagesName = worldEntry.stages_name;
                    }
                }
            }
        } catch {
            // ignore
        }
    }

    // Prefer base_personality; fallback to personality; otherwise '-'
    getDisplayPersonality(digimon) {
        if (!digimon) return '-';
        if (digimon.base_personality) return digimon.base_personality;
        if (digimon.personality) return digimon.personality;
        return '-';
    }

    // Table-level short label for stage in counter list
    getLevelLabelForTable(stage) {
        if (!stage) return '-';
        const s = String(stage);
        if (s === '5') return '完全';
        if (s === '6' || s === '7') return '究極';
        if (s === '4') return '成熟';
        if (s === '3') return '成長';
        if (s === '2') return '幼2';
        if (s === '1') return '幼1';
        return this.getStageName(s);
    }

    padEnd(str, len) {
        return String(str || '').padEnd(len, ' ');
    }

    padStart(str, len) {
        return String(str || '').padStart(len, ' ');
    }

    formatCounterTable(counterDigimon) {
        if (!Array.isArray(counterDigimon) || counterDigimon.length === 0) return '';
        let text = '';
        text += `[受其特殊技能克制]\n`;
        // headers
        const h1 = this.padEnd('等級', 4);
        const h2 = this.padEnd('名稱', 12);
        const h3 = this.padEnd('倍率', 6);
        const h4 = this.padEnd('傷害(次×力=總)', 16);
        const h5 = this.padEnd('範圍', 4);
        text += `${h1}  ${h2}  ${h3}  ${h4}  ${h5}\n`;
        for (const c of counterDigimon) {
            const level = this.padEnd(this.getLevelLabelForTable(c.stage), 4);
            const name = this.padEnd(c.name, 12);
            const mult = this.padEnd(`×${c.counterValue}`, 6);
            const hitInfo = (typeof c.hits === 'number' && typeof c.power === 'number' && c.hits > 0 && c.power > 0)
                ? `${c.hits}×${c.power}=${c.hitPower}`
                : '-';
            const hit = this.padEnd(hitInfo, 16);
            const range = this.padEnd(c.isAoE ? '全體' : '-', 4);
            text += `${level}  ${name}  ${mult}  ${hit}  ${range}\n`;
        }
        return text;
    }

    /**
     * Detailed search with preference order:
     * 1) Exact by id
     * 2) Exact by name
     * 3) Exact by zh-cn-name
     * 4) Fuzzy by name, zh-cn-name, id (Fuse)
     * Returns { match, isFuzzy, candidates }
     */
    findByNameOrIdDetailed(query) {
        if (query === undefined || query === null) return { match: null, isFuzzy: false, candidates: [] };
        const q = String(query).trim();
        // 1) Exact by id (numeric string allowed)
        if (!Number.isNaN(query) || /^\d+$/.test(q)) {
            const id = Number.parseInt(q);
            if (!Number.isNaN(id)) {
                const byId = this.digimonData.find(d => d.id === id);
                if (byId) return { match: byId, isFuzzy: false, candidates: [] };
            }
        }
        // 2) Exact by name
        const byName = this.digimonData.find(d => d.name === q);
        if (byName) return { match: byName, isFuzzy: false, candidates: [] };
        // 3) Exact by zh-cn-name
        const byZhCN = this.digimonData.find(d => d['zh-cn-name'] && d['zh-cn-name'] === q);
        if (byZhCN) return { match: byZhCN, isFuzzy: false, candidates: [] };
        // 4) Fuzzy search across name and zh-cn-name
        const results = this.fuse.search(q, { limit: 5 });
        if (results.length > 0) {
            return { match: results[0].item, isFuzzy: true, candidates: results.map(r => r.item) };
        }
        return { match: null, isFuzzy: false, candidates: [] };
    }

    findByNameOrId(query) {
        const detailed = this.findByNameOrIdDetailed(query);
        return detailed.match;
    }

    getStageName(stage) {
        if (this.stagesName.length === 0) return stage;

        const stageMap = {
            '1': this.stagesName[0], // 幼年期1
            '2': this.stagesName[1], // 幼年期2
            '3': this.stagesName[2], // 成長期
            '4': this.stagesName[3], // 成熟期
            '5': this.stagesName[4], // 完全體
            '6': this.stagesName[5], // 究極體
            '7': this.stagesName[6], // 超究極體
            'a': '成熟期裝甲體',
            'd': '混合體(成熟期)'
        };

        // Handle composite stages like "4a", "4d", etc.
        if (stage.length > 1) {
            const baseStage = stage[0];
            const suffix = stage[1];

            if (suffix === 'a') {
                // Get the base stage name and add 裝甲體
                const baseStageName = stageMap[baseStage] || baseStage;
                return baseStageName + '裝甲體';
            } else if (suffix === 'd') {
                // Get the base stage name and add 混合體
                const baseStageName = stageMap[baseStage] || baseStage;
                return '混合體(' + baseStageName + ')';
            }
        }

        return stageMap[stage] || stage;
    }

    getPersonalities(digimonName) {
        this.ensureWorldDataLoaded();
        if (!this.worldData || !this.worldData.locations) return [];

        const personalities = new Set();

        // First, check if the digimon exists directly in world data
        for (const location in this.worldData.locations) {
            const digimonList = this.worldData.locations[location].digimon;
            for (const digimon of digimonList) {
                if (digimon.name === digimonName) {
                    for (const p of digimon.personalities) {
                        personalities.add(p);
                    }
                }
            }
        }

        // If not found directly, check if it's a stage 1 digimon and derive personality lineage
        if (personalities.size === 0) {
            const digimon = this.digimonData.find(d => d.name === digimonName);
            if (digimon && digimon.stage === '1') {
                // For stage 1 digimon, create personality lineage name
                const personalityLineage = `${digimonName}系譜`;
                personalities.add(personalityLineage);
            }
        }

        return [...personalities];
    }

    getLocations(digimonName) {
        this.ensureWorldDataLoaded();
        if (!this.worldData || !this.worldData.locations) return [];

        const locations = [];
        for (const location in this.worldData.locations) {
            const digimonList = this.worldData.locations[location].digimon;
            if (digimonList.some(d => d.name === digimonName)) {
                locations.push(location);
            }
        }

        // Fallback for stage-1 lineage-based appearance: infer via personalities
        if (locations.length === 0) {
            const lineage = `${digimonName}系譜`;
            for (const location in this.worldData.locations) {
                const digimonList = this.worldData.locations[location].digimon;
                if (digimonList.some(d => Array.isArray(d.personalities) && d.personalities.includes(lineage))) {
                    locations.push(location);
                }
            }
        }

        return locations;
    }

    getLocationsByPersonality(personality) {
        this.ensureWorldDataLoaded();
        if (!this.worldData || !this.worldData.locations) return [];

        const locationDetails = [];
        for (const location in this.worldData.locations) {
            const digimonList = this.worldData.locations[location].digimon;
            const matchingDigimon = digimonList.filter(d =>
                d.personalities && d.personalities.includes(personality)
            );

            if (matchingDigimon.length > 0) {
                const digimonNames = matchingDigimon.map(d => d.name);
                locationDetails.push({
                    location: location,
                    digimon: digimonNames
                });
            }
        }

        return locationDetails;
    }

    getFusionComponents(digimon) {
        if (!digimon || !digimon.mix_evolution) return [];
        if (Array.isArray(digimon.devolutions) && digimon.devolutions.length >= 2) {
            return digimon.devolutions.slice(0, 2);
        }
        return [];
    }

    formatElementalResistances(elementalResistances) {
        if (!elementalResistances) return [];

        const resistances = [];
        for (const [element, value] of Object.entries(elementalResistances)) {
            if (value !== 1) { // Only show non-neutral resistances
                const elementName = this.getElementalName(element);
                const sign = value > 1 ? '+' : '';
                resistances.push(`${elementName}${sign}${value}`);
            }
        }
        return resistances;
    }

    getElementalName(element) {
        // Get elemental name from world data if available
        if (this.worldData && this.worldData.elemental_name && this.worldData.elemental_name[element]) {
            return this.worldData.elemental_name[element];
        }
        return element;
    }

    // Combine attribute and elemental resistances using additive levels mapping
    // Levels: 0.5 -> -1, 1 -> 0, 1.5 -> +1, 2 -> +2
    // Sum -> multiplier mapping: -2:0.3, -1:0.5, 0:1, 1:1.5, 2:2, 3:3, 4:4
    combineResistanceValues(attributeValue, elementalValue) {
        const toLevel = (v) => {
            if (v <= 0.5) return -1;
            if (v >= 2) return 2;
            if (v >= 1.5) return 1;
            return 0;
        };
        const levelSum = toLevel(attributeValue) + toLevel(elementalValue);
        const clamped = Math.max(-2, Math.min(4, levelSum));
        const levelToMultiplier = {
            [-2]: 0.3,
            [-1]: 0.5,
            0: 1,
            1: 1.5,
            2: 2,
            3: 3,
            4: 4
        };
        return levelToMultiplier[clamped];
    }

    // Map Chinese attribute name to resistance key
    getAttributeKeyFromCN(attributeCN) {
        if (!attributeCN) return null;
        const map = {
            // Traditional
            '疫苗種': 'Vaccine',
            '數據種': 'Data',
            '病毒種': 'Virus',
            // English passthrough
            'Vaccine': 'Vaccine',
            'Data': 'Data',
            'Virus': 'Virus',
            'No Data': null
        };
        return map[attributeCN] || null;
    }

    // Get elemental multiplier on target for a given skill element
    getElementMultiplierOnTarget(targetDigimon, skillElement) {
        if (!targetDigimon || !targetDigimon.elemental_resistances) return 1;
        if (!skillElement || skillElement === '-') skillElement = 'Null';
        return targetDigimon.elemental_resistances[skillElement] ?? 1;
    }

    // Get attribute multiplier on target for an attacker's attribute
    getAttributeMultiplierOnTarget(targetDigimon, attackerAttributeCN) {
        if (!targetDigimon || !targetDigimon.attribute_resistances) return 1;
        const key = this.getAttributeKeyFromCN(attackerAttributeCN);
        if (!key) return 1;
        return targetDigimon.attribute_resistances[key] ?? 1;
    }

    // Get targetType numeric codes from world data (id 0), with safe defaults
    getTargetTypeCodes() {
        const defaults = { self: 10, 'all enemies': 5, '1 enemy': 1, 'all allies': 6, '1 ally': 2 };
        if (this.worldData && this.worldData.targetType) {
            return this.worldData.targetType;
        }
        return defaults;
    }

    // Prefer targetType to decide if a skill targets enemy; fall back to description when missing
    isSkillTargetsEnemy(skill) {
        if (!skill) return false;
        const codes = this.getTargetTypeCodes();
        if (typeof skill.targetType === 'number') {
            return skill.targetType === codes['1 enemy'] || skill.targetType === codes['all enemies'];
        }
        if (typeof skill.description === 'string') {
            const re = /Target\s*:\s*\d*\s*(enemy|enemies)/i;
            return re.test(skill.description);
        }
        return false;
    }

    // Prefer targetType to decide if a skill targets multiple enemies (AoE); fall back to description when missing
    isSkillTargetsEnemies(skill) {
        if (!skill) return false;
        const codes = this.getTargetTypeCodes();
        if (typeof skill.targetType === 'number') {
            return skill.targetType === codes['all enemies'];
        }
        if (typeof skill.description === 'string') {
            const re = /Target\s*:\s*\d*\s*enemies/i;
            return re.test(skill.description);
        }
        return false;
    }

    getCounterDigimon(targetDigimon) {
        if (!targetDigimon || !targetDigimon.attribute_resistances || !targetDigimon.elemental_resistances) {
            return [];
        }
        // Consider stage 5 and 6 attackers that have at least one valid offensive skill
        const hasValidSkill = (d) => Array.isArray(d.special_skills) && d.special_skills.some(s => this.isSkillTargetsEnemy(s));
        const stage5Digimon = this.digimonData.filter(d => d.stage === '5' && hasValidSkill(d));
        const stage6Digimon = this.digimonData.filter(d => (d.stage === '6' || d.stage === '7') && hasValidSkill(d));
        let tempCounterValue = 0;

        const counters = [];

        const evaluate = (list, stageLabel) => {
            for (const attacker of list) {
                const result = this.calculateCounterValue(targetDigimon, attacker);
                const counterValue = result.value;
                if (counterValue >= 2) {
                    if (counterValue > tempCounterValue) {
                        tempCounterValue = counterValue;
                    }
                    counters.push({
                        ...attacker,
                        counterValue,
                        isAoE: result.isAoE,
                        stage: stageLabel,
                        hitPower: result.hitPower,
                        hits: result.hits,
                        power: result.power
                    });
                }
            }
        };

        evaluate(stage5Digimon, '5');
        evaluate(stage6Digimon, '6');

        // Sort: 1) highest damage multiplier 2) AoE first 3) highest maxHits*power 4) random order if tie
        counters.sort((a, b) => {
            if (b.counterValue !== a.counterValue) return b.counterValue - a.counterValue;
            if (!!b.isAoE !== !!a.isAoE) return b.isAoE ? 1 : -1;
            if (b.hitPower !== a.hitPower) return b.hitPower - a.hitPower;
            return (Math.random() < 0.5) ? -1 : 1;
        });

        // deterministically take top 2 from each stage
        const result = [];
        const stage5Top = counters.filter(c => c.stage === '5').slice(0, Math.max(tempCounterValue, 2));
        const stage6Top = counters.filter(c => c.stage === '6').slice(0, Math.max(tempCounterValue, 2));
        result.push(...stage5Top, ...stage6Top);
        return result;
    }

    calculateCounterValue(targetDigimon, counterDigimon) {
        if (!counterDigimon || !Array.isArray(counterDigimon.special_skills) || counterDigimon.special_skills.length === 0) {
            return { value: 0, isAoE: false, hitPower: 0, hits: 0, power: 0 };
        }
        // Attribute multiplier based on attacker's attribute vs target's attribute resistances
        const attrMult = this.getAttributeMultiplierOnTarget(targetDigimon, counterDigimon.attribute);
        let best = 0;
        let bestIsAoE = false;
        let bestHitPower = 0;
        let bestHits = 0;
        let bestPower = 0;
        for (const skill of counterDigimon.special_skills) {
            if (!this.isSkillTargetsEnemy(skill)) continue;
            const element = (skill && skill.element) ? skill.element : 'Null';
            const elemMult = this.getElementMultiplierOnTarget(targetDigimon, element);
            const total = attrMult * elemMult;
            const hits = (skill && typeof skill.maxHits === 'number') ? skill.maxHits : 1;
            const pow = (skill && typeof skill.power === 'number') ? skill.power : 0;
            const hitPower = hits * pow;
            if (total > best || (total === best && hitPower > bestHitPower)) {
                best = total;
                bestIsAoE = this.isSkillTargetsEnemies(skill);
                bestHitPower = hitPower;
                bestHits = hits;
                bestPower = pow;
            }
        }
        return { value: best, isAoE: bestIsAoE, hitPower: bestHitPower, hits: bestHits, power: bestPower };
    }

    randomSelect(array, count) {
        if (array.length <= count) {
            return array;
        }

        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    static showDigimon(digimon, digimonInstance) {
        let rply = '';
        try {
            // Header line
            const headerLine = `#${digimon.id} 【${digimon.name}】｜${digimonInstance.getStageName(digimon.stage)}｜${(digimon.attribute && digimon.attribute !== 'No Data') ? digimon.attribute : '-'}`;
            rply += `${headerLine}\n`;
            // Personality
            const displayPersonality = digimonInstance.getDisplayPersonality(digimon);
            rply += `個性：${displayPersonality}\n`;
            // Resistances
            if (digimon.elemental_resistances) {
                const resistances = digimonInstance.formatElementalResistances(digimon.elemental_resistances);
                if (resistances.length > 0) {
                    rply += `抗性：${resistances.join(', ')}\n`;
                }
            }

            // Locations (if any)
            const locations = digimonInstance.getLocations(digimon.name);
            if (locations.length > 0) {
                rply += `出現地點：${locations.join(', ')}\n`;
            }

            // Fusion info (if any)
            if (digimon.mix_evolution) {
                rply += `特殊進化：合體進化\n`;
                const comps = digimonInstance.getFusionComponents(digimon);
                if (comps.length === 2) {
                    rply += `合體來源：${comps[0]} + ${comps[1]}\n`;
                }
            }

            // Counter list in table format
            const counterDigimon = digimonInstance.getCounterDigimon(digimon);
            if (counterDigimon.length > 0) {
                rply += `\n`;
                rply += digimonInstance.formatCounterTable(counterDigimon);
            }

            rply += '\n[進化路線]\n';
            rply += digimonInstance.getEvolutionLinesWithTwoPaths(digimon);

        } catch (error) {
            console.error('digimon display error', error);
        }
        return rply;
    }

    getEvolutionLineFromStage1(targetDigimon) {
        const path = this.findSimplePathFromStage1(targetDigimon);
        if (path.length === 0) {
            return '無法找到從幼年期1的進化路線';
        }
        return this.formatEvolutionPath(path);
    }

    // Format one evolution path into text lines
    formatEvolutionPath(path, headerMarker = '#\uFE0F\u20E3') { // default '#️⃣'
        let result = '';
        // Optional lineage header for stage-1 start
        if (path.length > 0 && path[0].stage === '1') {
            const start = path[0];
            const lineage = `${start.name}系譜`;
            const personalities = this.getPersonalities(start.name);
            const chosen = personalities.length > 0 ? personalities[0] : lineage;
            const details = this.getLocationsByPersonality(chosen);
            result += `${headerMarker}${lineage}：出現地點\n`;
            for (const detail of details) {
                result += `${detail.location}(${detail.digimon.join(', ')})\n`;
            }
        }

        for (let i = 0; i < path.length; i++) {
            const d = path[i];
            const stageLabel = this.getStageName(d.stage);
            const personality = this.getDisplayPersonality(d);
            const num = this.numberToEmoji(i + 1);
            result += `${num}${this.padEnd(d.name, 8)}｜${stageLabel}｜基礎個性：${personality}\n`;
            if (d.stage === '1') {
                // lineage details are shown in the header; skip per-item lineage block
            }
            if (d.mix_evolution) {
                const comps = this.getFusionComponents(d);
                if (comps.length === 2) {
                    result += `   合體來源：${comps[0]} + ${comps[1]}\n`;
                }
            }
            if (d.stage !== '1') { // Skip summary line for stage-1 to avoid duplication
                const locs = this.getLocations(d.name);
                if (locs.length > 0) {
                    result += `   出現地點：${locs.join(', ')}\n`;
                }
            }
        }
        return result;
    }

    // Find up to two best evolution paths starting from different stage-1 Digimon
    getEvolutionLinesWithTwoPaths(targetDigimon) {
        // Collect shortest path from each stage-1 start
        const startTime = Date.now();
        const maxTime = 3500;
        const stage1Digimon = this.digimonData.filter(d => d.stage === '1');
        const candidates = [];

        for (const start of stage1Digimon) {
            if (Date.now() - startTime > maxTime) break;
            const path = this.findShortestPathFromStart(start, targetDigimon, 10, maxTime - (Date.now() - startTime));
            if (path.length > 0) {
                const score = this.scorePathByPersonality(path);
                candidates.push({ startId: start.id, path, score });
            }
        }

        if (candidates.length === 0) {
            // Fallback to legacy single-path logic
            return this.getEvolutionLineFromStage1(targetDigimon);
        }

        // Sort by personality score desc, then by path length asc
        candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.path.length - b.path.length;
        });

        const first = candidates[0];
        // Find second with different stage-1 start
        const second = candidates.find(c => c.startId !== first.startId);

        // If there is no second with different start, show only one as per rule (a)
        if (!second) {
            return this.formatEvolutionPath(first.path, '#\uFE0F\u20E3');
        }

        // Show up to two paths
        let out = '';
        out += this.formatEvolutionPath(first.path, '#\uFE0F\u20E3');
        out += '\n';
        out += this.formatEvolutionPath(second.path, '*\uFE0F\u20E3');
        return out;
    }

    // BFS shortest path from a specific start to target
    findShortestPathFromStart(startDigimon, targetDigimon, maxDepth = 10, maxTime = 2000) {
        const startTime = Date.now();
        const queue = [{ digimon: startDigimon, path: [startDigimon] }];
        const visited = new Set();

        while (queue.length > 0) {
            if (Date.now() - startTime > maxTime) break;
            const { digimon: current, path } = queue.shift();
            if (visited.has(current.id)) continue;
            visited.add(current.id);

            if (current.id === targetDigimon.id) {
                return path;
            }

            if (path.length > maxDepth) continue;

            if (current.evolutions) {
                for (const evolutionName of current.evolutions) {
                    const evolutionDigimon = this.digimonData.find(d => d.name === evolutionName);
                    if (evolutionDigimon && !visited.has(evolutionDigimon.id)) {
                        queue.push({ digimon: evolutionDigimon, path: [...path, evolutionDigimon] });
                    }
                }
            }

            if (current.devolutions) {
                for (const devolutionName of current.devolutions) {
                    const devolutionDigimon = this.digimonData.find(d => d.name === devolutionName);
                    if (devolutionDigimon && !visited.has(devolutionDigimon.id)) {
                        queue.push({ digimon: devolutionDigimon, path: [...path, devolutionDigimon] });
                    }
                }
            }
        }

        return [];
    }

    // Score a path by the largest count of the same base personality appearing
    scorePathByPersonality(path) {
        const counter = new Map();
        for (const d of path) {
            const p = this.getDisplayPersonality(d);
            const key = String(p || '-');
            counter.set(key, (counter.get(key) || 0) + 1);
        }
        let best = 0;
        for (const v of counter.values()) {
            if (v > best) best = v;
        }
        return best;
    }

    numberToEmoji(n) {
        const map = {
            0: '0\uFE0F\u20E3',
            1: '1\uFE0F\u20E3',
            2: '2\uFE0F\u20E3',
            3: '3\uFE0F\u20E3',
            4: '4\uFE0F\u20E3',
            5: '5\uFE0F\u20E3',
            6: '6\uFE0F\u20E3',
            7: '7\uFE0F\u20E3',
            8: '8\uFE0F\u20E3',
            9: '9\uFE0F\u20E3',
            10: '\uD83D\uDD1F' // keycap 10
        };
        return map[n] || `${n}. `;
    }

    findSimplePathFromStage1(targetDigimon) {
        const maxDepth = 8; // Reduced depth
        const startTime = Date.now();
        const maxTime = 2000; // 2 second timeout
        const maxSearches = 500; // Increased search limit

        const findPath = (current, target, currentPath = [], visited = new Set(), depth = 0, searchCount) => {
            // Timeout check
            if (Date.now() - startTime > maxTime) return [];

            // Search count limit
            if (++searchCount.count > maxSearches) return [];

            // Prevent infinite recursion and excessive depth
            if (depth > maxDepth || visited.has(current.id)) return [];

            // If we found the target
            if (current.id === target.id) {
                return [...currentPath, current];
            }

            // Add current to visited
            const newVisited = new Set(visited);
            newVisited.add(current.id);

            // Get next digimon with limited search
            const nextDigimon = [];

            // Check evolutions (limit to first 6)
            if (current.evolutions) {
                for (let i = 0; i < Math.min(current.evolutions.length, 6); i++) {
                    const evolutionName = current.evolutions[i];
                    const evolutionDigimon = this.digimonData.find(d => d.name === evolutionName);
                    if (evolutionDigimon && !newVisited.has(evolutionDigimon.id)) {
                        nextDigimon.push(evolutionDigimon);
                    }
                }
            }

            // Check devolutions (limit to first 6)
            if (current.devolutions) {
                for (let i = 0; i < Math.min(current.devolutions.length, 6); i++) {
                    const devolutionName = current.devolutions[i];
                    const devolutionDigimon = this.digimonData.find(d => d.name === devolutionName);
                    if (devolutionDigimon && !newVisited.has(devolutionDigimon.id)) {
                        nextDigimon.push(devolutionDigimon);
                    }
                }
            }

            // Try each next digimon (limit to 4)
            for (let i = 0; i < Math.min(nextDigimon.length, 4); i++) {
                const next = nextDigimon[i];
                const result = findPath(next, target, [...currentPath, current], newVisited, depth + 1, searchCount);
                if (result.length > 0) {
                    return result;
                }

                // Early exit if timeout
                if (Date.now() - startTime > maxTime) break;
            }

            return [];
        };

        // Start from all stage 1 digimon and find the shortest path
        const stage1Digimon = this.digimonData.filter(d => d.stage === '1');
        let shortestPath = [];
        let shortestLength = Infinity;

        for (const digimon of stage1Digimon) {
            const searchCount = { count: 0 };
            const path = findPath(digimon, targetDigimon, [], new Set(), 0, searchCount);
            if (path.length > 0 && path.length < shortestLength) {
                shortestPath = path;
                shortestLength = path.length;

                // If we found a very short path (2-4 steps), return it immediately
                if (path.length <= 4) {
                    return path;
                }
            }

            // Early exit if timeout
            if (Date.now() - startTime > maxTime) break;
        }

        // Always try comprehensive search to find the shortest path
        const comprehensivePath = this.findComprehensivePath(targetDigimon);
        if (comprehensivePath.length > 0 && comprehensivePath.length < shortestLength) {
            return comprehensivePath;
        }

        return shortestPath;
    }

    findComprehensivePath(targetDigimon) {
        // Use BFS for more reliable path finding
        const startTime = Date.now();
        const maxTime = 3000;
        const maxDepth = 10;

        const stage1Digimon = this.digimonData.filter(d => d.stage === '1');
        let shortestPath = [];
        let shortestLength = Infinity;

        for (const startDigimon of stage1Digimon) {
            if (Date.now() - startTime > maxTime) break;

            const visited = new Set();
            const queue = [{ digimon: startDigimon, path: [startDigimon] }];

            while (queue.length > 0) {
                if (Date.now() - startTime > maxTime) break;

                const { digimon: current, path } = queue.shift();

                if (visited.has(current.id)) continue;
                visited.add(current.id);

                if (current.id === targetDigimon.id) {
                    if (path.length < shortestLength) {
                        shortestPath = path;
                        shortestLength = path.length;

                        // If we found a very short path, return immediately
                        if (path.length <= 4) {
                            return path;
                        }
                    }
                    continue;
                }

                if (path.length > maxDepth) continue;

                // Check evolutions
                if (current.evolutions) {
                    for (const evolutionName of current.evolutions) {
                        const evolutionDigimon = this.digimonData.find(d => d.name === evolutionName);
                        if (evolutionDigimon && !visited.has(evolutionDigimon.id)) {
                            queue.push({ digimon: evolutionDigimon, path: [...path, evolutionDigimon] });
                        }
                    }
                }

                // Check devolutions
                if (current.devolutions) {
                    for (const devolutionName of current.devolutions) {
                        const devolutionDigimon = this.digimonData.find(d => d.name === devolutionName);
                        if (devolutionDigimon && !visited.has(devolutionDigimon.id)) {
                            queue.push({ digimon: devolutionDigimon, path: [...path, devolutionDigimon] });
                        }
                    }
                }
            }
        }

        return shortestPath;
    }

    findEvolutionPaths(fromDigimon, toDigimon, maxPaths = 4) {
        const startTime = Date.now();
        const maxTime = 5000; // Reasonable timeout

        // Check for null/undefined inputs
        if (!fromDigimon || !toDigimon) {
            return [];
        }

        // Check if it's the same Digimon
        if (fromDigimon.id === toDigimon.id) {
            return [[fromDigimon]];
        }

        // First, check for direct evolution/devolutions
        if (fromDigimon.evolutions && fromDigimon.evolutions.includes(toDigimon.name)) {
            return [[fromDigimon, toDigimon]];
        }
        if (fromDigimon.devolutions && fromDigimon.devolutions.includes(toDigimon.name)) {
            return [[fromDigimon, toDigimon]];
        }

        // Use bidirectional BFS for more efficient path finding
        return this.bidirectionalBFS(fromDigimon, toDigimon, maxPaths, startTime, maxTime);
    }

    bidirectionalBFS(fromDigimon, toDigimon, maxPaths, startTime, maxTime) {
        const paths = [];
        const foundPaths = new Set();

        // Initialize two queues for bidirectional search
        const forwardQueue = [{ digimon: fromDigimon, path: [fromDigimon], visited: new Set([fromDigimon.id]) }];
        const backwardQueue = [{ digimon: toDigimon, path: [toDigimon], visited: new Set([toDigimon.id]) }];

        // Track visited nodes from both directions
        const forwardVisited = new Map(); // digimonId -> path
        const backwardVisited = new Map(); // digimonId -> path

        forwardVisited.set(fromDigimon.id, [fromDigimon]);
        backwardVisited.set(toDigimon.id, [toDigimon]);

        let searchCount = 0;
        const maxSearches = 1000; // Reduced but more efficient

        while ((forwardQueue.length > 0 || backwardQueue.length > 0) && paths.length < maxPaths) {
            // Timeout check
            if (Date.now() - startTime > maxTime) break;
            if (++searchCount > maxSearches) break;

            // Alternate between forward and backward search
            const searchForward = forwardQueue.length > 0 && (backwardQueue.length === 0 || searchCount % 2 === 0);

            if (searchForward) {
                const result = this.expandBidirectionalSearch(
                    forwardQueue, backwardVisited, forwardVisited,
                    paths, foundPaths, 'forward'
                );
                if (result.found) continue;
            } else if (backwardQueue.length > 0) {
                const result = this.expandBidirectionalSearch(
                    backwardQueue, forwardVisited, backwardVisited,
                    paths, foundPaths, 'backward'
                );
                if (result.found) continue;
            }
        }

        return paths.sort((a, b) => a.length - b.length).slice(0, maxPaths);
    }

    expandBidirectionalSearch(queue, otherVisited, currentVisited, paths, foundPaths, direction) {
        const { digimon: current, path, visited } = queue.shift();

        // Check if we've met the other search direction
        if (otherVisited.has(current.id)) {
            const otherPath = otherVisited.get(current.id);
            const fullPath = direction === 'forward'
                ? [...path, ...[...otherPath].reverse()]
                : [...otherPath, ...[...path].reverse()];

            // Remove duplicates in the middle
            const cleanPath = this.removeDuplicateInPath(fullPath);
            const pathKey = cleanPath.map(d => d.id).join('-');

            if (!foundPaths.has(pathKey) && cleanPath.length > 1) {
                paths.push(cleanPath);
                foundPaths.add(pathKey);
                return { found: true };
            }
        }

        // If path is too long, skip
        if (path.length >= 8) return { found: false };

        // Get next digimon with stage-based heuristics
        const nextDigimon = this.getNextDigimonWithHeuristics(current, visited, direction);

        // Add to queue with priority
        for (const next of nextDigimon.slice(0, 8)) { // Limit to 8 per expansion
            if (!visited.has(next.id)) {
                const newVisited = new Set(visited);
                newVisited.add(next.id);
                const newPath = [...path, next];

                queue.push({ digimon: next, path: newPath, visited: newVisited });
                currentVisited.set(next.id, newPath);
            }
        }

        return { found: false };
    }

    getNextDigimonWithHeuristics(current, visited, direction) {

        // Get all possible next digimon
        const allNext = [];

        if (current.evolutions) {
            for (const evolutionName of current.evolutions) {
                const evolutionDigimon = this.digimonData.find(d => d.name === evolutionName);
                if (evolutionDigimon && !visited.has(evolutionDigimon.id)) {
                    allNext.push({ digimon: evolutionDigimon, stage: Number.parseInt(evolutionDigimon.stage), type: 'evolution' });
                }
            }
        }

        if (current.devolutions) {
            for (const devolutionName of current.devolutions) {
                const devolutionDigimon = this.digimonData.find(d => d.name === devolutionName);
                if (devolutionDigimon && !visited.has(devolutionDigimon.id)) {
                    allNext.push({ digimon: devolutionDigimon, stage: Number.parseInt(devolutionDigimon.stage), type: 'devolution' });
                }
            }
        }

        // Sort by stage proximity and type preference
        allNext.sort((a, b) => {
            // Prefer evolutions for forward search, devolutions for backward
            if (direction === 'forward' && a.type !== b.type) {
                return a.type === 'evolution' ? -1 : 1;
            } else if (direction === 'backward' && a.type !== b.type) {
                return a.type === 'devolution' ? -1 : 1;
            }

            // Then sort by stage (prefer middle stages for better connectivity)
            const aScore = Math.abs(a.stage - 4); // 4 is mature stage, good connectivity
            const bScore = Math.abs(b.stage - 4);
            return aScore - bScore;
        });

        return allNext.map(item => item.digimon);
    }

    removeDuplicateInPath(path) {
        const seen = new Set();
        const result = [];

        for (const digimon of path) {
            if (!seen.has(digimon.id)) {
                seen.add(digimon.id);
                result.push(digimon);
            }
        }

        return result;
    }

    showEvolutionPaths(fromDigimon, toDigimon) {
        const paths = this.findEvolutionPaths(fromDigimon, toDigimon);

        if (paths.length === 0) {
            return `無法找到從 ${fromDigimon.name} 到 ${toDigimon.name} 的進化路線`;
        }

        let result = `從 ${fromDigimon.name} 到 ${toDigimon.name} 的進化路線：\n\n`;

        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            result += `路線 ${i + 1} (${path.length} 步)：\n`;

            for (let j = 0; j < path.length; j++) {
                const digimon = path[j];
                const stageName = this.getStageName(digimon.stage);
                result += `${j + 1}. ${digimon.name} (${stageName})`;

                if (digimon.mix_evolution) {
                    result += ' [合體進化]';
                }

                result += '\n';
                if (digimon.mix_evolution) {
                    const comps = this.getFusionComponents(digimon);
                    if (comps.length === 2) {
                        result += `   合體來源：${comps[0]} + ${comps[1]}\n`;
                    }
                }
            }
            result += '\n';
        }

        return result;
    }

    search(name) {
        try {
            const detailed = this.findByNameOrIdDetailed(name);
            const digimon = detailed.match;
            if (!digimon) return '沒有找到相關資料';
            let output = Digimon.showDigimon(digimon, this);
            // If fuzzy, append up to 4 suggestions (excluding the top match)
            if (detailed.isFuzzy && detailed.candidates.length > 1) {
                const suggestions = detailed.candidates
                    .filter(c => c.id !== digimon.id)
                    .slice(0, 4)
                    .map(c => {
                        const zh = c['zh-cn-name'] && c['zh-cn-name'] !== c.name ? ` / ${c['zh-cn-name']}` : '';
                        return `${c.name}${zh}`;
                    });
                if (suggestions.length > 0) {
                    output += `\n可能的其他名稱：${suggestions.join(', ')}`;
                }
            }
            return output;
        } catch (error) {
            console.error('digimon search error', error);
            return '發生錯誤';
        }
    }
}



const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('digi')
            .setDescription('數碼寶貝物語時空異客查詢系統')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('search')
                    .setDescription('查詢數碼寶貝資料')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('數碼寶貝名稱或編號')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('path')
                    .setDescription('查詢進化路線')
                    .addStringOption(option =>
                        option.setName('from')
                            .setDescription('起始數碼寶貝名稱或編號')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('to')
                            .setDescription('目標數碼寶貝名稱或編號')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'search': {
                    const name = interaction.options.getString('name');
                    return `.digi ${name}`;
                }
                case 'path': {
                    const from = interaction.options.getString('from');
                    const to = interaction.options.getString('to');
                    return `.digi ${from} ${to}`;
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
    discordCommand,
    Digimon
};