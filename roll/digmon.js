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
│ 　• 出現地點(locations)
│ 　• 完整進化退化路線
│
├────── 🎯進化階段 ──────
│ 1: 幼年期1    2: 幼年期2
│ 3: 成長期     4: 成熟期
│ 5: 完全體     6: 究極體
│ 7: 超究極體   a: 成熟期裝甲體
│ d: 混合體(成熟期)
│
├────── 📚資料來源 ──────
│ • Digimon Story: Cyber Sleuth
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
            rply.text = this.getHelpMessage();
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
            rply.text = this.getHelpMessage();
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
            keys: ['name', 'id'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0.6
        });
    }

    static init() {
        const data = require('../assets/digmonsts/digimonSTS.json');
        const digimon = new Digimon(data);
        
        // Find world data and stages info
        const worldDataIndex = data.findIndex(item => item.id === 'world_data');
        if (worldDataIndex !== -1) {
            digimon.worldData = data[worldDataIndex];
            digimon.stagesName = data[0].stages_name;
        }
        
        // Filter out non-digimon entries
        digimon.digimonData = data.filter(item => 
            typeof item.id === 'number' && 
            item.name && 
            item.stage
        );
        
        // Recreate fuse with filtered data
        digimon.fuse = new Fuse(digimon.digimonData, {
            keys: ['name', 'id'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0.6
        });
        
        return digimon;
    }

    findByNameOrId(query) {
        // Try to find by ID first if it's a number
        if (!Number.isNaN(query)) {
            const byId = this.digimonData.find(d => d.id === Number.parseInt(query));
            if (byId) return byId;
        }
        
        // Search by name using fuse
        const result = this.fuse.search(query, { limit: 1 });
        if (result.length > 0) return result[0].item;
        
        return null;
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
        
        return stageMap[stage] || stage;
    }

    getPersonalities(digimonName) {
        if (!this.worldData || !this.worldData.locations) return [];
        
        const personalities = new Set();
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
        
        return [...personalities];
    }

    getLocations(digimonName) {
        if (!this.worldData || !this.worldData.locations) return [];
        
        const locations = [];
        for (const location in this.worldData.locations) {
            const digimonList = this.worldData.locations[location].digimon;
            if (digimonList.some(d => d.name === digimonName)) {
                locations.push(location);
            }
        }
        
        return locations;
    }

    static showDigimon(digimon, digimonInstance) {
        let rply = '';
        try {
            rply += `#${digimon.id} 【${digimon.name}】\n`;
            rply += `進化階段：${digimonInstance.getStageName(digimon.stage)}\n`;
            
            if (digimon.personality) {
                rply += `基礎個性：${digimon.personality}\n`;
            }
            
            // Get possible personalities from world data
            const personalities = digimonInstance.getPersonalities(digimon.name);
            if (personalities.length > 0) {
                rply += `可能基礎系譜：${personalities.join(', ')}\n`;
            }
            
            // Get locations
            const locations = digimonInstance.getLocations(digimon.name);
            if (locations.length > 0) {
                rply += `出現地點：${locations.join(', ')}\n`;
            }
            
            if (digimon.mix_evolution) {
                rply += `特殊進化：合體進化\n`;
            }
            
            rply += '\n------進化路線------\n';
            
            // Show evolution line from stage 1
            const evolutionLine = digimonInstance.getEvolutionLineFromStage1(digimon);
            rply += evolutionLine;

        } catch (error) {
            console.error('digimon display error', error);
        }
        return rply;
    }

    getEvolutionLineFromStage1(targetDigimon) {
        // Find a simple path from stage 1 to target with performance limits
        const path = this.findSimplePathFromStage1(targetDigimon);
        
        if (path.length === 0) {
            return '無法找到從幼年期1的進化路線';
        }
        
        let result = '';
        for (let i = 0; i < path.length; i++) {
            const digimon = path[i];
            result += `${i + 1}. ${digimon.name} (${this.getStageName(digimon.stage)})\n`;
        }
        
        return result;
    }

    findSimplePathFromStage1(targetDigimon) {
        const maxDepth = 8; // Reduced depth
        const startTime = Date.now();
        const maxTime = 2000; // 2 second timeout
        const maxSearches = 500; // Increased search limit
        
        const findPath = (current, target, currentPath = [], visited = new Set(), depth = 0, searchCount = { count: 0 }) => {
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
        const paths = [];
        const maxDepth = 8; // Reduced depth limit
        const startTime = Date.now();
        const maxTime = 2000; // 2 second timeout
        let searchCount = 0;
        const maxSearches = 200; // Reduced search limit
        
        // First, check for direct evolution/devolutions
        if (fromDigimon.evolutions && fromDigimon.evolutions.includes(toDigimon.name)) {
            paths.push([fromDigimon, toDigimon]);
        }
        if (fromDigimon.devolutions && fromDigimon.devolutions.includes(toDigimon.name)) {
            paths.push([fromDigimon, toDigimon]);
        }
        
        // If we found direct paths, return them
        if (paths.length > 0) {
            return paths.slice(0, maxPaths);
        }
        
        const findPaths = (current, target, currentPath = [], visited = new Set(), depth = 0) => {
            // Timeout check
            if (Date.now() - startTime > maxTime) return;
            
            // Search count limit
            if (++searchCount > maxSearches) return;
            
            // Prevent infinite recursion and excessive depth
            if (depth > maxDepth || visited.has(current.id)) return;
            
            // If we found the target
            if (current.id === target.id) {
                paths.push([...currentPath, current]);
        return;
            }
            
            // If we already have enough paths, stop searching
            if (paths.length >= maxPaths) return;
            
            // Add current to visited
            const newVisited = new Set(visited);
            newVisited.add(current.id);
            
            // Get next digimon with balanced search
            const nextDigimon = [];
            
            // Check evolutions (limit to first 4)
            if (current.evolutions) {
                for (let i = 0; i < Math.min(current.evolutions.length, 4); i++) {
                    const evolutionName = current.evolutions[i];
                    const evolutionDigimon = this.digimonData.find(d => d.name === evolutionName);
                    if (evolutionDigimon && !newVisited.has(evolutionDigimon.id)) {
                        nextDigimon.push(evolutionDigimon);
                    }
                }
            }
            
            // Check devolutions (limit to first 4)
            if (current.devolutions) {
                for (let i = 0; i < Math.min(current.devolutions.length, 4); i++) {
                    const devolutionName = current.devolutions[i];
                    const devolutionDigimon = this.digimonData.find(d => d.name === devolutionName);
                    if (devolutionDigimon && !newVisited.has(devolutionDigimon.id)) {
                        nextDigimon.push(devolutionDigimon);
                    }
                }
            }
            
            // Recursively search with limited branching (2 paths per level)
            for (let i = 0; i < Math.min(nextDigimon.length, 2); i++) {
                const next = nextDigimon[i];
                findPaths(next, target, [...currentPath, current], newVisited, depth + 1);
                
                // Early exit if we have enough paths or timeout
                if (paths.length >= maxPaths || Date.now() - startTime > maxTime) break;
            }
        };
        
        findPaths(fromDigimon, toDigimon);
        
        // Sort by path length and return up to maxPaths
        return paths.sort((a, b) => a.length - b.length).slice(0, maxPaths);
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
            }
            result += '\n';
        }
        
        return result;
    }

    search(name) {
        try {
            const digimon = this.findByNameOrId(name);
            if (!digimon) return '沒有找到相關資料';
            
            return Digimon.showDigimon(digimon, this);
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