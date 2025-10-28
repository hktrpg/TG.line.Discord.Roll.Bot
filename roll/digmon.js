"use strict";
const variables = {};
const { SlashCommandBuilder } = require('discord.js');
const Fuse = require('fuse.js');
const chineseConv = require('chinese-conv');
const gameName = function () {
    return '【數碼寶貝物語時空異客】.digi '
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
├────── ⚔️招式查詢 ──────
│ 招式搜尋:
│ 　• .digi -m [關鍵字]
│ 　  例: .digi -m 火
│ 　  例: .digi -m 全體
│ 　  例: .digi -m 病毒種
│ 功能說明:
│ 　• 根據關鍵字模糊搜尋招式
│ 　• 結果按威力排序，最多顯示10筆
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

    const isMoveSearch = mainMsg.some(arg => /^-m$/i.test(arg) || /^-move$/i.test(arg));

    if (isMoveSearch) {
        // Move search
        rply.quotes = true;

        const filters = {
            has_crit: mainMsg.some(arg => /^--crit$/i.test(arg)),
            always_hits: mainMsg.some(arg => /^--hits$/i.test(arg)),
            hp_drain: mainMsg.some(arg => /^--hp$/i.test(arg)),
            sp_drain: mainMsg.some(arg => /^--sp$/i.test(arg)),
            has_recoil: mainMsg.some(arg => /^--recoil$/i.test(arg))
        };

        const filterFlagsRegex = /^(-m|-move|--crit|--hits|--hp|--sp|--recoil)$/i;
        const queryParts = mainMsg.slice(1).filter(arg => !filterFlagsRegex.test(arg));
        const query = queryParts.join(' ') || '';

        const hasFilters = Object.values(filters).some(Boolean);

        if (!query && !hasFilters) {
            rply.text = '請提供招式關鍵字';
            return rply;
        }

        rply.text = variables.digimonDex.searchMoves(query, filters);
        return rply;
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
            // Call both direct and detailed lookups: direct to preserve legacy/test calls,
            // detailed to detect fuzziness and build suggestions.
            const fromDigimonDirect = variables.digimonDex.findByNameOrId(mainMsg[1]);
            const toDigimonDirect = variables.digimonDex.findByNameOrId(mainMsg[2]);

            const fromDetailed = variables.digimonDex.findByNameOrIdDetailed(mainMsg[1]);
            const toDetailed = variables.digimonDex.findByNameOrIdDetailed(mainMsg[2]);

            const fromDigimon = fromDigimonDirect || (fromDetailed ? fromDetailed.match : null);
            const toDigimon = toDigimonDirect || (toDetailed ? toDetailed.match : null);

            if (!fromDigimon || !toDigimon) {
                // Build suggestion hints for both sides
                const buildSuggestions = (detailed) => {
                    if (!detailed || !detailed.isFuzzy || !Array.isArray(detailed.candidates)) return '';
                    const chosen = detailed.match;
                    const suggestions = detailed.candidates
                        .filter(c => !chosen || c.id !== chosen.id)
                        .slice(0, 6)
                        .map(c => {
                            const zh = c['zh-cn-name'] && c['zh-cn-name'] !== c.name ? ` / ${c['zh-cn-name']}` : '';
                            return `${c.name}${zh}`;
                        });
                    return suggestions.length > 0 ? suggestions.join(', ') : '';
                };

                const fromDetailedForSugs = fromDetailed;
                const toDetailedForSugs = toDetailed;
                const fromSugs = buildSuggestions(fromDetailedForSugs);
                const toSugs = buildSuggestions(toDetailedForSugs);

                let msg = '';
                if (!fromDigimon) msg += `找不到起始數碼寶貝：${mainMsg[1]}\n`;
                if (!toDigimon) msg += `找不到目標數碼寶貝：${mainMsg[2]}\n`;
                const sugLines = [];
                if (fromSugs) sugLines.push(`可能的其他名稱(起始)：${fromSugs}`);
                if (toSugs) sugLines.push(`可能的其他名稱(目標)：${toSugs}`);
                if (sugLines.length > 0) msg += sugLines.join('\n');
                rply.text = msg.trim();
                return rply;
            }

            let text = variables.digimonDex.showEvolutionPaths(fromDigimon, toDigimon);

            // Append suggestions if fuzzy matched inputs
            const buildSuggestions = (detailed) => {
                if (!detailed || !detailed.isFuzzy || !Array.isArray(detailed.candidates)) return '';
                const chosen = detailed.match;
                const suggestions = detailed.candidates
                    .filter(c => c && chosen && c.id !== chosen.id)
                    .slice(0, 4)
                    .map(c => {
                        const zh = c['zh-cn-name'] && c['zh-cn-name'] !== c.name ? ` / ${c['zh-cn-name']}` : '';
                        return `${c.name}${zh}`;
                    });
                return suggestions.length > 0 ? suggestions.join(', ') : '';
            };

            const fromSugs = buildSuggestions(fromDetailed);
            const toSugs = buildSuggestions(toDetailed);
            const sugLines = [];
            if (fromSugs) sugLines.push(`可能的其他名稱(起始)：${fromSugs}`);
            if (toSugs) sugLines.push(`可能的其他名稱(目標)：${toSugs}`);
            if (sugLines.length > 0) {
                text += `\n${sugLines.join('\n')}`;
            }

            rply.text = text;
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
        this.dmgTypes = {};
        this.reverseDmgTypes = {};
        // Fast lookup indexes (built in init):
        this.byId = new Map();
        this.byName = new Map();
        this.byZhName = new Map();
        this.byNameLower = new Map();
        this.byZhNameLower = new Map();
        // Cached moves search structures
        this._movesAugmented = null;
        this._movesFuse = null;
        this.fuse = new Fuse(this.digimonData, {
            keys: ['name', 'zh-cn-name', 'id'],
            includeScore: true,
            findAllMatches: true,
            threshold: 0.6
        });

		// Ensure indices exist even when constructed directly (e.g., in tests)
		this.buildIndices();
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
            if (worldEntry.dmgTypes) {
                digimon.dmgTypes = worldEntry.dmgTypes;
                digimon.reverseDmgTypes = {};
                for (const [name, id] of Object.entries(worldEntry.dmgTypes)) {
                    digimon.reverseDmgTypes[id] = name;
                }
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

        // Build quick-lookup indexes
        digimon.buildIndices();

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

    buildIndices() {
        this.byId.clear();
        this.byName.clear();
        this.byZhName.clear();
        this.byNameLower.clear();
        this.byZhNameLower.clear();
        for (const d of this.digimonData) {
            if (typeof d.id === 'number') this.byId.set(d.id, d);
            if (d && typeof d.name === 'string') this.byName.set(d.name, d);
            if (d && typeof d['zh-cn-name'] === 'string') this.byZhName.set(d['zh-cn-name'], d);
            if (d && typeof d.name === 'string') this.byNameLower.set(d.name.toLowerCase(), d);
            if (d && typeof d['zh-cn-name'] === 'string') this.byZhNameLower.set(String(d['zh-cn-name']).toLowerCase(), d);
        }
    }

    getByName(name) {
        if (!name) return null;
        const direct = this.byName.get(name);
        if (direct) return direct;
        const lower = String(name).toLowerCase();
        return this.byNameLower.get(lower) || null;
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
        if (s === '6') return '究極';
        if (s === '7') return '超究';
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

    padWide(str, length) {
        let s = String(str || '');
        let currentWidth = 0;
        for (const ch of s) {
            // CJK and full-width characters
            const cp = ch.codePointAt(0);
            if (cp > 0xFF) {
                currentWidth += 2;
            } else {
                currentWidth += 1;
            }
        }
        const padding = Math.max(0, length - currentWidth);
        return s + ' '.repeat(padding);
    }

    getWideWidth(str) {
        let s = String(str || '');
        let currentWidth = 0;
        for (const ch of s) {
            const cp = ch.codePointAt(0);
            if (cp > 0xFF) {
                currentWidth += 2;
            } else {
                currentWidth += 1;
            }
        }
        return currentWidth;
    }

    formatCounterTable(counterDigimon) {
        if (!Array.isArray(counterDigimon) || counterDigimon.length === 0) return '';
        let text = '';
        text += `[受其特殊技能克制]\n`;
        // headers
        const h1 = this.padWide('等級', 6);
        const h2 = this.padWide('名稱', 12);
        const h3 = this.padWide('倍率', 6);
        const h4 = this.padWide('傷害(次×力=總)', 16);
        const h5 = this.padWide('範圍', 6);
        text += `${h1}  ${h2}  ${h3}  ${h4}  ${h5}\n`;
        for (const c of counterDigimon) {
            const level = this.padWide(this.getLevelLabelForTable(c.stage), 6);
            const name = this.padWide(c.name, 12);
            const mult = this.padWide(`×${c.counterValue}`, 6);
            const hitInfo = (typeof c.hits === 'number' && typeof c.power === 'number' && c.hits > 0 && c.power > 0)
                ? `${c.hits}×${c.power}=${c.hitPower}`
                : '-';
            const hit = this.padWide(hitInfo, 16);
            const range = this.padWide(c.isAoE ? '全體' : '-', 6);
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
        const qLower = q.toLowerCase();
        // Build variant for Simplified/Traditional when single CJK char
        let qSimplified = null;
        if (q.length === 1) {
            try {
                qSimplified = chineseConv.sify(q);
                if (qSimplified === q) qSimplified = null;
            } catch {}
        }
        // 1) Exact by id (numeric string allowed)
        if (!Number.isNaN(query) || /^\d+$/.test(q)) {
            const id = Number.parseInt(q);
            if (!Number.isNaN(id)) {
                const byId = this.byId.get(id);
                if (byId) return { match: byId, isFuzzy: false, candidates: [] };
            }
        }
        // 2) Exact by name
        const byName = this.byName.get(q) || this.byNameLower.get(qLower);
        if (byName) return { match: byName, isFuzzy: false, candidates: [] };
        // 3) Exact by zh-cn-name
        const byZhCN = this.byZhName.get(q) || this.byZhNameLower.get(qLower);
        if (byZhCN) return { match: byZhCN, isFuzzy: false, candidates: [] };
        // Guard: empty string should not yield a match
        if (q.length === 0) return { match: null, isFuzzy: false, candidates: [] };
        // 3.5) Strong preference: full substring containment on display names
        // If any Digimon's display name contains the full query (including ASCII), prioritize them
        const substringCandidates = this.digimonData.filter(d => {
            const name = typeof d.name === 'string' ? d.name : '';
            const zhName = typeof d['zh-cn-name'] === 'string' ? d['zh-cn-name'] : '';
            const nameLower = name.toLowerCase();
            const zhLower = zhName.toLowerCase();
            return (
                name.includes(q) || zhName.includes(q) ||
                nameLower.includes(qLower) || zhLower.includes(qLower) ||
                (qSimplified && (name.includes(qSimplified) || zhName.includes(qSimplified)))
            );
        });
        if (substringCandidates.length > 0) {
            const aSet = this.extractAsciiCharSet(q);
            const qCjkSet = this.extractCjkCharSet(q);
            if (qSimplified) {
                const sSet = this.extractCjkCharSet(qSimplified);
                for (const ch of sSet) qCjkSet.add(ch);
            }
            const ranked = substringCandidates.map(item => {
                const name = item.name || '';
                const zhName = item['zh-cn-name'] || '';
                const nameLower = name.toLowerCase();
                const zhLower = zhName.toLowerCase();
                const startsWithName = name.startsWith(q) ? 1 : 0;
                const startsWithZh = zhName.startsWith(q) || (qSimplified && zhName.startsWith(qSimplified)) ? 1 : 0;
                const startsWithFull = (startsWithName === 1 || startsWithZh === 1) ? 1 : 0;
                const asciiOverlap = this.countAsciiOverlap(aSet, nameLower) + this.countAsciiOverlap(aSet, zhLower);
                const cjkOverlap = this.countCjkOverlap(qCjkSet, this.extractCjkCharSet(name)) + this.countCjkOverlap(qCjkSet, this.extractCjkCharSet(zhName));
                const idxName = (name.indexOf(q) >= 0) ? name.indexOf(q) : nameLower.indexOf(qLower);
                const idxZh = (zhName.indexOf(q) >= 0) ? zhName.indexOf(q) : zhLower.indexOf(qLower);
                const idxNameS = qSimplified ? name.indexOf(qSimplified) : -1;
                const idxZhS = qSimplified ? zhName.indexOf(qSimplified) : -1;
                let bestIndex = Number.POSITIVE_INFINITY;
                for (const v of [idxName, idxZh, idxNameS, idxZhS]) {
                    if (v >= 0 && v < bestIndex) bestIndex = v;
                }
                const displayLen = Math.min(name.length || Infinity, zhName.length || Infinity);
                return { item, startsWithFull, startsWithName, startsWithZh, asciiOverlap, displayLen, cjkOverlap, bestIndex };
            });
            // Prefer candidates that start with the full query first
            const startPool = ranked.filter(r => r.startsWithFull === 1);
            const pool = startPool.length > 0 ? startPool : ranked;
            pool.sort((a, b) => {
                if (a.startsWithName !== b.startsWithName) return b.startsWithName - a.startsWithName; // prefer traditional name prefix
                if ((a.bestIndex || Infinity) !== (b.bestIndex || Infinity)) return (a.bestIndex || Infinity) - (b.bestIndex || Infinity);
                if (qCjkSet.size > 0) {
                    if ((b.cjkOverlap || 0) !== (a.cjkOverlap || 0)) return (b.cjkOverlap || 0) - (a.cjkOverlap || 0);
                }
                if (b.asciiOverlap !== a.asciiOverlap) return b.asciiOverlap - a.asciiOverlap;
                return a.displayLen - b.displayLen;
            });
            const ordered = startPool.length > 0 ? [...pool, ...ranked.filter(r => r.startsWithFull !== 1)] : pool;
            return { match: ordered[0].item, isFuzzy: true, candidates: ordered.map(r => r.item) };
        }
        // Special handling: single CJK character queries - prioritize any names containing this char
        const qCjkSetQuick = this.extractCjkCharSet(q);
        if (q.length === 1 && qCjkSetQuick.size === 1) {
            const charMatches = this.digimonData.filter(d => {
                const name = typeof d.name === 'string' ? d.name : '';
                const zhName = typeof d['zh-cn-name'] === 'string' ? d['zh-cn-name'] : '';
                return (
                    name.includes(q) ||
                    zhName.includes(q) ||
                    (qSimplified && (name.includes(qSimplified) || zhName.includes(qSimplified)))
                );
            });
            if (charMatches.length > 0) {
                const ranked = charMatches.map(item => {
                    const name = item.name || '';
                    const zhName = item['zh-cn-name'] || '';
                    const startsWithFull = (name.startsWith(q) || zhName.startsWith(q) || (qSimplified && (name.startsWith(qSimplified) || zhName.startsWith(qSimplified)))) ? 1 : 0;
                const nameLower = name.toLowerCase();
                const zhLower = zhName.toLowerCase();
                const idxName = (name.indexOf(q) >= 0) ? name.indexOf(q) : nameLower.indexOf(qLower);
                const idxZh = (zhName.indexOf(q) >= 0) ? zhName.indexOf(q) : zhLower.indexOf(qLower);
                    const idxNameS = qSimplified ? name.indexOf(qSimplified) : -1;
                    const idxZhS = qSimplified ? zhName.indexOf(qSimplified) : -1;
                    let bestIndex = Number.POSITIVE_INFINITY;
                    for (const v of [idxName, idxZh, idxNameS, idxZhS]) {
                        if (v >= 0 && v < bestIndex) bestIndex = v;
                    }
                    const displayLen = Math.min(name.length || Infinity, zhName.length || Infinity);
                    return { item, startsWithFull, bestIndex, displayLen };
                });
                ranked.sort((a, b) => {
                    if (b.startsWithFull !== a.startsWithFull) return b.startsWithFull - a.startsWithFull;
                    if ((a.bestIndex || Infinity) !== (b.bestIndex || Infinity)) return (a.bestIndex || Infinity) - (b.bestIndex || Infinity);
                    return a.displayLen - b.displayLen;
                });
                return { match: ranked[0].item, isFuzzy: true, candidates: ranked.map(r => r.item) };
            }
        }

        // 4) Fuzzy search across name and zh-cn-name
        const results = this.fuse.search(q, { limit: 12 });
        if (results.length > 0) {
            // Prefer candidates that share a longer common suffix with the query (e.g., "獅子獸")
            // and, if tied, prefer longer names overall; finally fall back to Fuse score.
            const coreCjk = this.extractCoreCjkSuffix(q);
            const longestCjk = this.extractLongestCjkToken(q) || coreCjk || q;
            const qCjkSet = this.extractCjkCharSet(q);
            if (qSimplified) {
                const sSet = this.extractCjkCharSet(qSimplified);
                for (const ch of sSet) qCjkSet.add(ch);
            }
            const enriched = results.map(r => {
                const name = r.item.name || '';
                const zhName = r.item['zh-cn-name'] || '';
                const nameLower = name.toLowerCase();
                const zhLower = zhName.toLowerCase();
                const suffixLen = Math.max(this.commonSuffixLength(name, q), this.commonSuffixLength(zhName, q));
                const prefixLen = Math.max(this.commonPrefixLength(name, q), this.commonPrefixLength(zhName, q));
                const contains = (
                    name.includes(q) || zhName.includes(q) ||
                    nameLower.includes(qLower) || zhLower.includes(qLower) ||
                    (qSimplified && (name.includes(qSimplified) || zhName.includes(qSimplified)))
                ) ? 1 : 0; // full substring containment
                const startsWithName = name.startsWith(q) ? 1 : 0;
                const startsWithZh = zhName.startsWith(q) || (qSimplified && zhName.startsWith(qSimplified)) ? 1 : 0;
                const startsWithFull = (startsWithName === 1 || startsWithZh === 1) ? 1 : 0;
                const hasCore = coreCjk && (name.includes(coreCjk) || zhName.includes(coreCjk)) ? 1 : 0;
                const startsWithToken = (!!longestCjk && (name.startsWith(longestCjk) || zhName.startsWith(longestCjk))) ? 1 : 0;
                const tokenLen = longestCjk ? longestCjk.length : 0;
                const minDisplayLen = Math.min(name.length || Infinity, zhName.length || Infinity);
                const lengthGap = (startsWithToken ? Math.max(0, minDisplayLen - tokenLen) : Number.POSITIVE_INFINITY);
                const displayLen = minDisplayLen === Infinity ? Math.max(name.length, zhName.length) : minDisplayLen;
                const aSet = this.extractAsciiCharSet(q);
                const asciiOverlap = this.countAsciiOverlap(aSet, nameLower) + this.countAsciiOverlap(aSet, zhLower);
                const cjkOverlap = this.countCjkOverlap(qCjkSet, this.extractCjkCharSet(name)) + this.countCjkOverlap(qCjkSet, this.extractCjkCharSet(zhName));
                const idxName = (name.indexOf(q) >= 0) ? name.indexOf(q) : nameLower.indexOf(qLower);
                const idxZh = (zhName.indexOf(q) >= 0) ? zhName.indexOf(q) : zhLower.indexOf(qLower);
                const idxNameS = qSimplified ? name.indexOf(qSimplified) : -1;
                const idxZhS = qSimplified ? zhName.indexOf(qSimplified) : -1;
                let bestIndex = Number.POSITIVE_INFINITY;
                for (const v of [idxName, idxZh, idxNameS, idxZhS]) {
                    if (v >= 0 && v < bestIndex) bestIndex = v;
                }
                return { ...r, suffixLen, prefixLen, contains, startsWithFull, startsWithName, startsWithZh, hasCore, startsWithToken, lengthGap, displayLen, asciiOverlap, cjkOverlap, bestIndex };
            });
            // Prefer entries whose name or zhName starts with the query when present
            const startPool = enriched.filter(e => e.startsWithFull === 1);
            const pool = startPool.length > 0 ? startPool : enriched;
            pool.sort((a, b) => {
                // Highest priority: exact match
                if (a.item.name === q || a.item['zh-cn-name'] === q) return -1;
                if (b.item.name === q || b.item['zh-cn-name'] === q) return 1;
                
                if (a.startsWithName !== b.startsWithName) return b.startsWithName - a.startsWithName; // prefer traditional name prefix
                if ((a.bestIndex || Infinity) !== (b.bestIndex || Infinity)) return (a.bestIndex || Infinity) - (b.bestIndex || Infinity);
                // If query contains CJK, prioritize candidates sharing CJK chars first
                if (qCjkSet.size > 0 && (b.cjkOverlap || 0) !== (a.cjkOverlap || 0)) return (b.cjkOverlap || 0) - (a.cjkOverlap || 0);
                // Highest priority: full query containment
                if (b.contains !== a.contains) return b.contains - a.contains;
                // Then: ASCII token overlap (e.g., 'V' in "究極V龍")
                if (b.asciiOverlap !== a.asciiOverlap) return b.asciiOverlap - a.asciiOverlap;
                // Then: names containing core CJK suffix
                if (b.hasCore !== a.hasCore) return b.hasCore - a.hasCore; // prioritize names containing core CJK suffix (e.g., 獅子獸)
                if (b.startsWithToken !== a.startsWithToken) return b.startsWithToken - a.startsWithToken; // then names that start with the core token (e.g., 亞古)
                if (a.lengthGap !== b.lengthGap) return a.lengthGap - b.lengthGap; // prefer shorter extra length beyond the token (e.g., 亞古獸 over 亞古獸勇氣的羈絆)
                if (b.prefixLen !== a.prefixLen) return b.prefixLen - a.prefixLen; // then stronger prefix match against full query
                if (b.suffixLen !== a.suffixLen) return b.suffixLen - a.suffixLen; // then common suffix
                if (a.displayLen !== b.displayLen) return a.displayLen - b.displayLen; // prefer shorter names
                const as = (a.score ?? 1);
                const bs = (b.score ?? 1);
                return as - bs; // lower Fuse score is better
            });
            const orderedEnriched = startPool.length > 0 ? [...pool, ...enriched.filter(e => e.startsWithFull !== 1)] : pool;
            // Acceptance gating for very short queries: avoid false positives with no shared characters
            const top = orderedEnriched[0];
            const cjkSet = this.extractCjkCharSet(q);
            const isSingleCjk = (cjkSet.size === 1 && q.length === 1);
            const isVeryShort = q.length <= 2;
            const hasCjkOverlapTop = ((top && (top.cjkOverlap || 0)) >= 1);
            const accept = (
                top.contains === 1 ||
                top.startsWithFull === 1 ||
                top.asciiOverlap >= 2 ||
                (isSingleCjk && hasCjkOverlapTop) ||
                (!isSingleCjk && !isVeryShort && (top.hasCore === 1 || top.startsWithToken === 1 || top.prefixLen >= 2 || top.suffixLen >= 2 || hasCjkOverlapTop))
            );
            const candidatesAll = orderedEnriched.map(e => e.item);
            if (!accept) {
                return { match: null, isFuzzy: true, candidates: candidatesAll.slice(0, 8) };
            }
            return { match: top.item, isFuzzy: true, candidates: candidatesAll };
        }

        // 5) Fallback: try CJK token containment matching when Fuse yields nothing
        const token = this.extractLongestCjkToken(q);
        if (token && token.length >= 2) {
            let matches = this.digimonData.filter(d =>
                (d.name && d.name.includes(token)) ||
                (d['zh-cn-name'] && d['zh-cn-name'].includes(token))
            );
            // If still empty, try sliding window substrings length 2-3
            if (matches.length === 0 && token.length > 2) {
                const windows = [];
                for (let len = Math.min(3, token.length); len >= 2; len--) {
                    for (let i = 0; i + len <= token.length; i++) {
                        windows.push(token.slice(i, i + len));
                    }
                }
                const set = new Set();
                for (const w of windows) {
                    for (const d of this.digimonData) {
                        const nm = d.name || '';
                        const zh = d['zh-cn-name'] || '';
                        if ((nm.includes(w) || zh.includes(w)) && !set.has(d.id)) {
                            set.add(d.id);
                            matches.push(d);
                        }
                    }
                }
            }
            if (matches.length > 0) {
                const fauxResults = matches.map(item => ({ item, score: 1 }));
                const coreCjk = this.extractCoreCjkSuffix(q);
                const longestCjk = this.extractLongestCjkToken(q) || coreCjk || q;
                const enriched = fauxResults.map(r => {
                const name = r.item.name || '';
                const zhName = r.item['zh-cn-name'] || '';
                const nameLower = name.toLowerCase();
                const zhLower = zhName.toLowerCase();
                    const suffixLen = Math.max(this.commonSuffixLength(name, q), this.commonSuffixLength(zhName, q));
                    const prefixLen = Math.max(this.commonPrefixLength(name, q), this.commonPrefixLength(zhName, q));
                const contains = (name.includes(q) || zhName.includes(q) || nameLower.includes(qLower) || zhLower.includes(qLower)) ? 1 : 0; // full substring containment
                    const startsWithFull = (name.startsWith(q) || zhName.startsWith(q)) ? 1 : 0;
                    const hasCore = coreCjk && (name.includes(coreCjk) || zhName.includes(coreCjk)) ? 1 : 0;
                    const startsWithToken = (!!longestCjk && (name.startsWith(longestCjk) || zhName.startsWith(longestCjk))) ? 1 : 0;
                    const tokenLen = longestCjk ? longestCjk.length : 0;
                    const minDisplayLen = Math.min(name.length || Infinity, zhName.length || Infinity);
                    const lengthGap = (startsWithToken ? Math.max(0, minDisplayLen - tokenLen) : Number.POSITIVE_INFINITY);
                    const displayLen = minDisplayLen === Infinity ? Math.max(name.length, zhName.length) : minDisplayLen;
                    const aSet = this.extractAsciiCharSet(q);
                    const asciiOverlap = this.countAsciiOverlap(aSet, nameLower) + this.countAsciiOverlap(aSet, zhLower);
                    return { ...r, suffixLen, prefixLen, contains, startsWithFull, hasCore, startsWithToken, lengthGap, displayLen, asciiOverlap };
                });
                enriched.sort((a, b) => {
                    if (b.contains !== a.contains) return b.contains - a.contains;
                    if (b.startsWithFull !== a.startsWithFull) return b.startsWithFull - a.startsWithFull;
                    if (b.asciiOverlap !== a.asciiOverlap) return b.asciiOverlap - a.asciiOverlap;
                    if (b.hasCore !== a.hasCore) return b.hasCore - a.hasCore;
                    if (b.startsWithToken !== a.startsWithToken) return b.startsWithToken - a.startsWithToken;
                    if (a.lengthGap !== b.lengthGap) return a.lengthGap - b.lengthGap;
                    if (b.prefixLen !== a.prefixLen) return b.prefixLen - a.prefixLen;
                    if (b.suffixLen !== a.suffixLen) return b.suffixLen - a.suffixLen;
                    if (a.displayLen !== b.displayLen) return a.displayLen - b.displayLen;
                    const as = (a.score ?? 1);
                    const bs = (b.score ?? 1);
                    return as - bs;
                });
                return { match: enriched[0].item, isFuzzy: true, candidates: enriched.map(e => e.item) };
            }
        }

        // 6) Broad fallback: suggest by CJK character overlap when nothing else matched
        const qSet = this.extractCjkCharSet(q);
        if (qSet.size > 0) {
            const scored = [];
            for (const d of this.digimonData) {
                const name = d.name || '';
                const zh = d['zh-cn-name'] || '';
                const overlap = this.countCjkOverlap(qSet, this.extractCjkCharSet(name)) +
                                this.countCjkOverlap(qSet, this.extractCjkCharSet(zh));
                if (overlap > 0) {
                    const displayLen = Math.max(name.length, zh.length);
                    scored.push({ item: d, overlap, displayLen, name, zh });
                }
            }
            if (scored.length > 0) {
                // Refine by ASCII overlap and containment for mixed queries like 'V仔EX'
                const aSet = this.extractAsciiCharSet(q);
                const refined = scored.map(s => {
                    const nameLower = s.name.toLowerCase();
                    const zhLower = s.zh.toLowerCase();
                    const asciiOverlap = this.countAsciiOverlap(aSet, nameLower) + this.countAsciiOverlap(aSet, zhLower);
                    const contains = (s.name.includes(q) || s.zh.includes(q) || nameLower.includes(qLower) || zhLower.includes(qLower)) ? 1 : 0;
                    const startsWithFull = (s.name.startsWith(q) || s.zh.startsWith(q)) ? 1 : 0;
                    return { ...s, asciiOverlap, contains, startsWithFull };
                });
                refined.sort((a, b) => {
                    if (b.contains !== a.contains) return b.contains - a.contains;
                    if (b.startsWithFull !== a.startsWithFull) return b.startsWithFull - a.startsWithFull;
                    if (b.asciiOverlap !== a.asciiOverlap) return b.asciiOverlap - a.asciiOverlap;
                    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
                    return a.displayLen - b.displayLen;
                });
                const best = refined[0];
                const candidates = refined.slice(0, 8).map(s => s.item);
                if (best.contains || best.startsWithFull || best.asciiOverlap >= 2) {
                    return { match: best.item, isFuzzy: true, candidates };
                }
                return { match: null, isFuzzy: true, candidates };
            }
        }

        // 7) ASCII fallback: suggest by ASCII character overlap (case-insensitive) and pick top candidate
        const aSet = this.extractAsciiCharSet(q);
        if (aSet.size > 0) {
            const scored = [];
            for (const d of this.digimonData) {
                const name = (d.name || '').toLowerCase();
                const zh = (d['zh-cn-name'] || '').toLowerCase();
                const overlap = this.countAsciiOverlap(aSet, name) + this.countAsciiOverlap(aSet, zh);
                if (overlap > 0) {
                    const displayLen = Math.max((d.name || '').length, (d['zh-cn-name'] || '').length);
                    scored.push({ item: d, overlap, displayLen });
                }
            }
            if (scored.length > 0) {
                scored.sort((a, b) => {
                    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
                    return b.displayLen - a.displayLen;
                });
                const best = scored[0];
                const candidates = scored.slice(0, 8).map(s => s.item);
                // Require at least 2 ASCII overlaps to accept a match; otherwise suggest only
                if (best.overlap >= 2) {
                    return { match: best.item, isFuzzy: true, candidates };
                }
                return { match: null, isFuzzy: true, candidates };
            }
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
            'a': '裝甲體',
            'd': '混合體'
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
        // '-' means no element (neutral), distinct from 'Null' which is a real element
        if (!skillElement || skillElement === '-') return 1;
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

        const evaluate = (list) => {
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
                        stage: attacker.stage,
                        hitPower: result.hitPower,
                        hits: result.hits,
                        power: result.power
                    });
                }
            }
        };

        evaluate(stage5Digimon);
        evaluate(stage6Digimon);

        // Sort: 1) highest damage multiplier 2) AoE first 3) highest maxHits*power 4) random order if tie
        counters.sort((a, b) => {
            if (b.counterValue !== a.counterValue) return b.counterValue - a.counterValue;
            if (!!b.isAoE !== !!a.isAoE) return b.isAoE ? 1 : -1;
            if (b.hitPower !== a.hitPower) return b.hitPower - a.hitPower;
            return (Math.random() < 0.5) ? -1 : 1;
        });

        // Build top candidates per stage with special rule:
        // If the first 3 for a stage are all AoE, force add a 4th single-target if available
        const result = [];

        const pickWithRule = (stageLabel) => {
            const list = counters.filter(c => c.stage === stageLabel);
            const topThree = list.slice(0, 3);
            const allThreeAoE = topThree.length === 3 && topThree.every(c => !!c.isAoE);
            if (allThreeAoE) {
                const singleTargets = list.slice(3).filter(c => !c.isAoE).slice(0, 3);
                return singleTargets.length > 0 ? [...topThree, ...singleTargets] : topThree;
            }
            const nonAoE = topThree.filter(c => !c.isAoE);
            if (nonAoE.length < 2) {
                const more = list.slice(3).filter(c => !c.isAoE).slice(0, 2 - nonAoE.length);
                return [...topThree, ...more];
            }
            return topThree;
        };

        const stage5Top = pickWithRule('5');

        // Combine stages 6 and 7 for selection, but keep their own labels for display
        const highStagesList = counters.filter(c => c.stage === '6' || c.stage === '7');
        const highTopThree = highStagesList.slice(0, 3);
        const highAllThreeAoE = highTopThree.length === 3 && highTopThree.every(c => !!c.isAoE);
        const highSingles = highAllThreeAoE ? highStagesList.slice(3).filter(c => !c.isAoE).slice(0, 3) : [];
        const highStageTop = highSingles.length > 0 ? [...highTopThree, ...highSingles] : highTopThree;

        result.push(...stage5Top, ...highStageTop);
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
            // Use '-' (neutral) when element is missing; 'Null' stays as a distinct element when present
            const element = (skill && typeof skill.element === 'string') ? skill.element : '-';
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
			// Official link and image url (will auto-embed in web UI if supported)
			if (digimon.link) {
				rply += `連結：${digimon.link}\n`;
			}
			if (digimon.img) {
				rply += `圖像：${digimon.img}\n`;
			}
            // Personality
            const displayPersonality = digimonInstance.getDisplayPersonality(digimon);
            let personalityLine = `個性：${displayPersonality}`;
            if (digimon.rider !== undefined) {
                personalityLine += ` ｜ 騎乘：${digimon.rider ? '⭕' : '❌'}`;
            }
            const primarySkill = digimonInstance.getPrimarySkill(digimon);
            if (primarySkill) {
                const power = primarySkill.power || 0;
                const maxHits = primarySkill.maxHits || 1;
                const totalPower = power * maxHits;
                const elementEmoji = digimonInstance.getElementEmoji(primarySkill.element);
                const powerString = maxHits > 1 ? `${maxHits}×${power}=${totalPower}` : `${totalPower}`;
                let extras = [];
                if (primarySkill.critRate > 0) {
                    extras.push(`CR:${primarySkill.critRate}`);
                }
                if (primarySkill.alwaysHits) {
                    extras.push('必中');
                }
                const extrasString = extras.length > 0 ? ` (${extras.join(' ')})` : '';
                personalityLine += ` ｜ 威力：${elementEmoji} ${powerString}${extrasString}`;
            }
            if (Array.isArray(digimon.special_skills) && digimon.special_skills.length > 0) {
                const skillsLines = [];
                for (const skill of digimon.special_skills) {
                    const power = skill.power || 0;
                    const maxHits = skill.maxHits || 1;
                    const totalPower = power * maxHits;
                    const elementEmoji = digimonInstance.getElementEmoji(skill.element);
                    const powerString = maxHits > 1 ? `${maxHits}×${power}=${totalPower}` : `${totalPower}`;
                    let extras = [];
                    if (skill.critRate > 0) {
                        extras.push(`CR:${skill.critRate}`);
                    }
                    if (skill.alwaysHits) {
                        extras.push('必中');
                    }
                    const extrasString = extras.length > 0 ? ` (${extras.join(' ')})` : '';
                    skillsLines.push(`${elementEmoji} ${powerString}${extrasString}`);
                }
                personalityLine += ` ｜ 威力：${skillsLines.join(' ')}`;
            }
            rply += personalityLine + '\n';
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

            // Immediate evolutions available from this Digimon
            if (Array.isArray(digimon.evolutions) && digimon.evolutions.length > 0) {
                const nextDigimon = digimon.evolutions
                    .map(name => digimonInstance.getByName(name))
                    .filter(Boolean);
                if (nextDigimon.length > 0) {
                    rply += `可進化：\n`;
                    for (let i = 0; i < nextDigimon.length; i++) {
                        const nd = nextDigimon[i];
                        const stageLabel = digimonInstance.getStageName(nd.stage);
                        const personality = digimonInstance.getDisplayPersonality(nd);

                        const primarySkill = digimonInstance.getPrimarySkill(nd);
                        const elem = primarySkill ? primarySkill.element : '-';
                        const emoji = digimonInstance.getElementEmoji(elem);

                        let line = ` ${emoji} ${digimonInstance.padWide(nd.name, 12)}｜${stageLabel}｜${personality}`;

                        if (nd.rider !== undefined) {
                            line += ` ｜ ${nd.rider ? '🏇' : '➖'}`;
                        }

                        if (Array.isArray(nd.special_skills) && nd.special_skills.length > 0) {
                            const skillsLines = [];
                            for (const skill of nd.special_skills) {
                                const power = skill.power || 0;
                                const maxHits = skill.maxHits || 1;
                                const totalPower = power * maxHits;

                                let powerString;
                                if (maxHits > 1) {
                                    powerString = `${maxHits}×${power}=${totalPower}`;
                                } else {
                                    powerString = `${totalPower}`;
                                }

                                let extras = [];
                                if (skill.critRate > 0) {
                                    extras.push(`CR:${skill.critRate}`);
                                }
                                if (skill.alwaysHits) {
                                    extras.push('必中');
                                }
                                const extrasString = extras.length > 0 ? ` (${extras.join(' ')})` : '';
                                skillsLines.push(`${digimonInstance.getElementEmoji(skill.element)} ${powerString}${extrasString}`);
                            }
                            line += ` ｜ ${skillsLines.join(' ')}`;
                        }

                        rply += line + '\n';
                    }
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
            let line = `${num}${this.padWide(d.name, 12)}｜${stageLabel}｜${personality}`;
            if (d.rider !== undefined) {
                line += d.rider ? ' ｜ 🏇' : ' ｜ ➖';
            }
            const primarySkill = this.getPrimarySkill(d);
            if (primarySkill) {
                const power = primarySkill.power || 0;
                const maxHits = primarySkill.maxHits || 1;
                const totalPower = power * maxHits;
                const elementEmoji = this.getElementEmoji(primarySkill.element);
                line += ` ｜ ${elementEmoji} ${totalPower}`;
            }
            result += line + '\n';
            if (d.stage === '1') {
                // lineage details are shown in the header; skip per-item lineage block
            }
            if (d.mix_evolution) {
                const comps = this.getFusionComponents(d);
                if (comps.length === 2) {
                    result += `   合體來源：${comps[0]} + ${comps[1]}\n`;
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
        const targetPersonality = this.getDisplayPersonality(targetDigimon);

        for (const start of stage1Digimon) {
            if (Date.now() - startTime > maxTime) break;
            const path = this.findShortestPathFromStart(start, targetDigimon, 10, maxTime - (Date.now() - startTime));
            if (path.length > 0) {
                const evoScore = this.scoreEvolutionPersonality(path, path[0], targetPersonality);
                const overallScore = this.scoreOverallPersonality(path, targetPersonality);
                candidates.push({ startId: start.id, path, evoScore, overallScore });
            }
        }

        if (candidates.length === 0) {
            // Fallback to legacy single-path logic
            return this.getEvolutionLineFromStage1(targetDigimon);
        }

        // Sort by shortest path first, then by evolution-step personality matches (desc), then overall (desc)
        candidates.sort((a, b) => {
            if (a.path.length !== b.path.length) return a.path.length - b.path.length;
            if (b.evoScore !== a.evoScore) return b.evoScore - a.evoScore;
            return b.overallScore - a.overallScore;
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
                    const evolutionDigimon = this.getByName(evolutionName);
                    if (evolutionDigimon && !visited.has(evolutionDigimon.id)) {
                        queue.push({ digimon: evolutionDigimon, path: [...path, evolutionDigimon] });
                    }
                }
            }

            if (current.devolutions) {
                for (const devolutionName of current.devolutions) {
                    const devolutionDigimon = this.getByName(devolutionName);
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

    // Compute length of common suffix between two strings
    commonSuffixLength(a, b) {
        const sa = String(a || '');
        const sb = String(b || '');
        let i = sa.length - 1;
        let j = sb.length - 1;
        let len = 0;
        while (i >= 0 && j >= 0 && sa[i] === sb[j]) {
            len++;
            i--;
            j--;
        }
        return len;
    }

    // Compute length of common prefix between two strings
    commonPrefixLength(a, b) {
        const sa = String(a || '');
        const sb = String(b || '');
        const max = Math.min(sa.length, sb.length);
        let k = 0;
        while (k < max && sa[k] === sb[k]) {
            k++;
        }
        return k;
    }

    // Extract the longest trailing run of CJK (full-width) characters from query
    extractCoreCjkSuffix(text) {
        const s = String(text || '');
        let i = s.length - 1;
        let chars = [];
        while (i >= 0) {
            const ch = s[i];
            const cp = ch.codePointAt(0);
            if (cp > 0xFF) {
                chars.push(ch);
                i--;
            } else {
                break;
            }
        }
        if (chars.length >= 2) {
            return chars.reverse().join('');
        }
        return '';
    }

    // Extract the longest continuous CJK (full-width) token from text
    extractLongestCjkToken(text) {
        const s = String(text || '');
        let best = '';
        let curr = '';
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            const cp = ch.codePointAt(0);
            if (cp > 0xFF) {
                curr += ch;
                if (curr.length > best.length) best = curr;
            } else {
                curr = '';
            }
        }
        return best;
    }

    // Build a set of CJK characters from a string
    extractCjkCharSet(text) {
        const s = String(text || '');
        const set = new Set();
        for (const ch of s) {
            const cp = ch.codePointAt(0);
            if (cp > 0xFF) set.add(ch);
        }
        return set;
    }

    // Count overlap between a query CJK set and another set
    countCjkOverlap(qSet, otherSet) {
        let c = 0;
        for (const ch of otherSet) {
            if (qSet.has(ch)) c++;
        }
        return c;
    }

    // Extract lowercase ASCII alphanumerics as a set
    extractAsciiCharSet(text) {
        const s = String(text || '').toLowerCase();
        const set = new Set();
        for (const ch of s) {
            if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) {
                set.add(ch);
            }
        }
        return set;
    }

    // Count overlap of ascii characters present in the target string
    countAsciiOverlap(aSet, targetLower) {
        let c = 0;
        for (const ch of aSet) {
            if (targetLower.includes(ch)) c++;
        }
        return c;
    }

    // Map 0-based index to regional indicator letter emoji (A=🇦, B=🇧, ...)
    letterIndexToEmoji(index) {
        if (typeof index !== 'number' || index < 0) return '';
        const A_CODEPOINT = 0x1_F1_E6; // Regional Indicator Symbol Letter A
        const idx = Math.floor(index) % 26;
        const codePoint = A_CODEPOINT + idx;
        try {
            return String.fromCodePoint(codePoint);
        } catch {
            return '';
        }
    }

    // Choose a representative emoji for an element keyword
    getElementEmoji(element) {
        switch (element) {
            case 'Fire': return '🔥';
            case 'Water': return '💧';
            case 'Plant': return '🌱';
            case 'Ice': return '🧊';
            case 'Elec': return '⚡️';
            case 'Earth': return '⛰️';
            case 'Steel': return '⚙️';
            case 'Wind': return '🌪️';
            case 'Light': return '🌟';
            case 'Dark': return '🌑';
            case 'Null': return '🈳';
            default:
                return '➖';
        }
    }

    // Get a digimon's primary skill object for display
    getPrimarySkill(digimon) {
        if (!digimon || !Array.isArray(digimon.special_skills) || digimon.special_skills.length === 0) return null;
        // Prefer first offensive skill targeting enemies
        const offensive = digimon.special_skills.find(s => this.isSkillTargetsEnemy(s));
        if (offensive) {
            return offensive;
        }
        // Fallback to first listed skill
        return digimon.special_skills[0];
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
                        const evolutionDigimon = this.getByName(evolutionName);
                        if (evolutionDigimon && !visited.has(evolutionDigimon.id)) {
                            queue.push({ digimon: evolutionDigimon, path: [...path, evolutionDigimon] });
                        }
                    }
                }

                // Check devolutions
                if (current.devolutions) {
                    for (const devolutionName of current.devolutions) {
                        const devolutionDigimon = this.getByName(devolutionName);
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
        const paths = this.bidirectionalBFS(fromDigimon, toDigimon, maxPaths, startTime, maxTime);

        // Sort paths by priority: 1) shortest 2) most matching personality in evolutions 3) most matching overall
        const targetPersonality = this.getDisplayPersonality(toDigimon);
        paths.sort((a, b) => {
            // Priority 1: Shortest path
            if (a.length !== b.length) return a.length - b.length;

            // Priority 2: Most matching personality in evolution steps only
            const aEvolutionScore = this.scoreEvolutionPersonality(a, fromDigimon, targetPersonality);
            const bEvolutionScore = this.scoreEvolutionPersonality(b, fromDigimon, targetPersonality);
            if (bEvolutionScore !== aEvolutionScore) return bEvolutionScore - aEvolutionScore;

            // Priority 3: Most matching personality overall
            const aOverallScore = this.scoreOverallPersonality(a, targetPersonality);
            const bOverallScore = this.scoreOverallPersonality(b, targetPersonality);
            return bOverallScore - aOverallScore;
        });

        return paths.slice(0, maxPaths);
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
        const maxSearches = 2000; // Increase to find more paths

        while ((forwardQueue.length > 0 || backwardQueue.length > 0) && paths.length < maxPaths * 3) {
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

        return paths;
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
                const evolutionDigimon = this.getByName(evolutionName);
                if (evolutionDigimon && !visited.has(evolutionDigimon.id)) {
                    allNext.push({ digimon: evolutionDigimon, stage: Number.parseInt(evolutionDigimon.stage), type: 'evolution' });
                }
            }
        }

        if (current.devolutions) {
            for (const devolutionName of current.devolutions) {
                const devolutionDigimon = this.getByName(devolutionName);
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

    // Check if a step is evolution (stage increases or stays same)
    isEvolutionStep(fromDigimon, toDigimon) {
        if (!fromDigimon || !toDigimon) return false;
        const fromStage = Number.parseInt(fromDigimon.stage) || 0;
        const toStage = Number.parseInt(toDigimon.stage) || 0;
        return toStage >= fromStage;
    }

    // Score evolution steps only (ignore devolution steps)
    scoreEvolutionPersonality(path, fromDigimon, targetPersonality) {
        if (!path || path.length < 2) return 0;
        let score = 0;

        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];

            // Only count if this is an evolution step
            if (this.isEvolutionStep(prev, curr)) {
                const currPersonality = this.getDisplayPersonality(curr);
                if (currPersonality === targetPersonality && targetPersonality !== '-') {
                    score++;
                }
            }
        }

        return score;
    }

    // Score overall personality matches (including devolution)
    scoreOverallPersonality(path, targetPersonality) {
        if (!path || path.length < 2 || targetPersonality === '-') return 0;
        let score = 0;

        for (let i = 1; i < path.length; i++) {
            const currPersonality = this.getDisplayPersonality(path[i]);
            if (currPersonality === targetPersonality) {
                score++;
            }
        }

        return score;
    }

    showEvolutionPaths(fromDigimon, toDigimon) {
        const paths = this.findEvolutionPaths(fromDigimon, toDigimon);

        if (paths.length === 0) {
            return `無法找到從 ${fromDigimon.name} 到 ${toDigimon.name} 的進化路線`;
        }

        let result = `從 ${fromDigimon.name} 到 ${toDigimon.name} 的進化路線：\n\n`;

        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];

            for (let j = 0; j < path.length; j++) {
                const digimon = path[j];
                const stageName = this.getStageName(digimon.stage);
                const personality = this.getDisplayPersonality(digimon);
                const num = this.numberToEmoji(j + 1);
                result += `${num}${this.padEnd(digimon.name, 8)}｜${stageName}｜基礎個性：${personality}\n`;

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
            if (!digimon) {
                if (Array.isArray(detailed.candidates) && detailed.candidates.length > 0) {
                    const suggestions = detailed.candidates
                        .slice(0, 6)
                        .map(c => {
                            const zh = c['zh-cn-name'] && c['zh-cn-name'] !== c.name ? ` / ${c['zh-cn-name']}` : '';
                            return `${c.name}${zh}`;
                        });
                    return `沒有找到相關資料\n可能的其他名稱：${suggestions.join(', ')}`;
                }
                return '沒有找到相關資料';
            }
            let output = Digimon.showDigimon(digimon, this);
            // If not an exact (100%) match, ALWAYS show possible alternative names
            if (detailed.isFuzzy) {
                let suggestions = [];
                if (Array.isArray(detailed.candidates)) {
                    suggestions = detailed.candidates
                        .filter(c => c && c.id !== digimon.id)
                        .slice(0, 6)
                        .map(c => {
                            const zh = c['zh-cn-name'] && c['zh-cn-name'] !== c.name ? ` / ${c['zh-cn-name']}` : '';
                            return `${c.name}${zh}`;
                        });
                    // Fallback: if excluding the chosen leaves no suggestions, include from full candidate list
                    if (suggestions.length === 0) {
                        suggestions = detailed.candidates
                            .slice(0, 6)
                            .map(c => {
                                const zh = c['zh-cn-name'] && c['zh-cn-name'] !== c.name ? ` / ${c['zh-cn-name']}` : '';
                                return `${c.name}${zh}`;
                            });
                    }
                }
                output += `\n可能的其他名稱：${suggestions.length > 0 ? suggestions.join(', ') : '-'}`;
            }
            return output;
        } catch (error) {
            console.error('digimon search error', error);
            return '發生錯誤';
        }
    }

    getTargetTypeName(skill) {
        if (!skill) return '';
        const codes = this.getTargetTypeCodes();
        const typeMap = {
            [codes['1 enemy']]: '單體敵人',
            [codes['all enemies']]: '全體敵人',
            [codes['1 ally']]: '單體隊友',
            [codes['all allies']]: '全體隊友',
            [codes.self]: '自己'
        };
        if (typeof skill.targetType === 'number' && typeMap[skill.targetType]) {
            return typeMap[skill.targetType];
        }

        // Fallback for text-based description
        if (typeof skill.description === 'string') {
            const desc = skill.description.toLowerCase();
            if (desc.includes('all enemies')) return '全體敵人';
            if (desc.includes('enemy')) return '單體敵人';
            if (desc.includes('all allies')) return '全體隊友';
            if (desc.includes('ally')) return '單體隊友';
            if (desc.includes('self')) return '自己';
        }
        return '未知';
    }

    getSkillTypeName(skillType) {
        if (skillType === null || skillType === undefined) return '';

        // If it's a number, look it up in the reverse map
        if (typeof skillType === 'number' && this.reverseDmgTypes[skillType]) {
            skillType = this.reverseDmgTypes[skillType];
        }
        const map = {
            'Physical': '物理',
            'Magic': '魔法',
            'HP Damage': 'HP%',
            'Buff': '輔助',
            'Debuff': 'Debuff',
            'Recovery': '回復',
        };
        return map[skillType] || skillType;
    }

    ensureMovesIndex() {
        if (this._movesAugmented && this._movesFuse) return;
        this.ensureWorldDataLoaded();
        // Flatten and augment once
        const allSkills = [];
        for (const digimon of this.digimonData) {
            if (digimon.special_skills) {
                for (const skill of digimon.special_skills) {
                    allSkills.push({ skill, digimon });
                }
            }
        }
        const augmentedSkills = allSkills.map(({ skill, digimon }) => {
            const elementName = this.getElementalName(skill.element);
            const targetTypeName = this.getTargetTypeName(skill);
            const stageName = this.getStageName(digimon.stage);
            const digimonName = digimon.name || '';
            const searchText = [
                skill.name || '',
                skill.description || '',
                elementName,
                targetTypeName,
                digimon.attribute || '',
                stageName,
                digimonName,
                digimon['zh-cn-name'] || ''
            ].join(' ');
            const searchTextLower = searchText.toLowerCase();
            return { skill, digimon, searchText, searchTextLower, elementName, targetTypeName, stageName, digimonName, digimonId: digimon.id };
        });
        this._movesAugmented = augmentedSkills;
        this._movesFuse = new Fuse(augmentedSkills, {
            keys: ['searchTextLower'],
            threshold: 0.4,
            includeScore: true,
            findAllMatches: true,
            useExtendedSearch: true
        });
    }

    searchMoves(query, filters = {}) {
        this.ensureMovesIndex();
        // 1. Flatten all skills
        const augmentedSkills = this._movesAugmented;
        const fuse = this._movesFuse;

        const stages = ['幼年期1', '幼年期2', '成長期', '成熟期', '完全體', '究極體', '超究極體'];
        const skillTypes = ['Physical', 'Magic', 'Buff', 'HP Damage', 'Debuff', 'Recovery'];
        const queryLower = (query || '').toLowerCase();
        const queryTerms = queryLower.split(/\s+/).filter(Boolean);

        const stageTerm = queryTerms.find(term => stages.includes(term));
        const skillTypeTerm = queryTerms.find(term => skillTypes.map(s => s.toLowerCase()).includes(term));
        const otherTerms = queryTerms.filter(term => !stages.includes(term) && !skillTypes.map(s => s.toLowerCase()).includes(term));

        let results;

        if (otherTerms.length > 0) {
            const fuseQuery = otherTerms.map(term => `'${term}`).join(' ');
            results = fuse.search(fuseQuery).map(r => r.item);
        } else {
            // If only a stage (or nothing) is provided, start with all skills
            results = augmentedSkills;
        }

        // Post-filter for exact stage match
        if (stageTerm) {
            results = results.filter(item => item.stageName === stageTerm);
        }

        // Post-filter for skill type
        if (skillTypeTerm) {
            const numericType = this.dmgTypes[skillTypeTerm];
            results = results.filter(item => {
                const typeStr = (typeof item.skill.type === 'string') ? item.skill.type : item.skill.type;
                return (typeof typeStr === 'string' && typeStr.toLowerCase() === skillTypeTerm) || (numericType !== undefined && item.skill.type === numericType);
            });
        }

        // Add filtering for special properties
        if (filters.has_crit) {
            results = results.filter(item => item.skill.critRate > 0);
        }
        if (filters.always_hits) {
            results = results.filter(item => item.skill.alwaysHits);
        }
        if (filters.hp_drain) {
            results = results.filter(item => item.skill.HPDrain > 0);
        }
        if (filters.sp_drain) {
            results = results.filter(item => item.skill.SPDrain > 0);
        }
        if (filters.has_recoil) {
            results = results.filter(item => item.skill.recoil > 0);
        }

        // 3. Sort by power
        results.sort((a, b) => {
            const powerA = (a.skill.power || 0) * (a.skill.maxHits || 1);
            const powerB = (b.skill.power || 0) * (b.skill.maxHits || 1);
            return powerB - powerA;
        });

        // 4. Take top 10 and format
        const top10 = results.slice(0, 10);

        if (top10.length === 0) {
            return `找不到與 "${query}" 相關的招式。`;
        }

        // Find max widths for alignment
        let maxNameWidth = 0;
        let maxPowerWidth = 0;
        let maxDigimonNameWidth = 0;

        const processedResults = top10.map(item => {
            const { skill, digimon } = item;
            const power = skill.power || 0;
            const maxHits = skill.maxHits || 1;
            const totalPower = power * maxHits;
            const powerString = maxHits > 1 ? `${maxHits}×${power}=${totalPower}` : String(totalPower);

            const extras = [];
            if (skill.critRate > 0) extras.push(`CR:${skill.critRate}`);
            if (skill.alwaysHits) extras.push('必中');
            if (skill.HPDrain > 0) extras.push(`HP回復:${skill.HPDrain}%`);
            if (skill.SPDrain > 0) extras.push(`SP回復:${skill.SPDrain}%`);
            if (skill.recoil > 0) extras.push(`反作用力:${skill.recoil}%`);
            const extrasString = extras.length > 0 ? ` (${extras.join(' ')})` : '';
            const powerWithExtras = powerString + extrasString;

            const skillNameWidth = this.getWideWidth(skill.name);
            if (skillNameWidth > maxNameWidth) maxNameWidth = skillNameWidth;

            const powerStringWidth = this.getWideWidth(powerWithExtras);
            if (powerStringWidth > maxPowerWidth) maxPowerWidth = powerStringWidth;

            const digimonNameWidth = this.getWideWidth(digimon.name);
            if (digimonNameWidth > maxDigimonNameWidth) maxDigimonNameWidth = digimonNameWidth;

            return { ...item, powerString, extrasString, powerWithExtras };
        });

        let output = `查詢 "${query}" 的招式結果：\n`;
        for (const [index, item] of processedResults.entries()) {
            const { skill, digimon, elementName, targetTypeName, stageName, powerWithExtras } = item;
            const elementEmoji = this.getElementEmoji(skill.element);
            const skillType = this.getSkillTypeName(skill.type);
            const num = this.numberToEmoji(index + 1);

            let line1 = `${num} ${this.padWide(skill.name, maxNameWidth)} | ${elementEmoji}${elementName} | ${targetTypeName}`;
            if (skill.sp_cost) {
                line1 += ` | SP:${skill.sp_cost}`;
            }
            if (skillType) {
                line1 += ` | ${skillType}`;
            }

            const numWidth = (index + 1 >= 10) ? 4 : 3;
            const line2 = `${' '.repeat(numWidth)}威力: ${this.padWide(powerWithExtras, maxPowerWidth)} | ${this.padWide(digimon.name, maxDigimonNameWidth)} (${stageName} | ${digimon.attribute})`;

            output += `${line1}\n${line2}\n`;
        }

        return output;
    }

    // 新增：為自動完成功能提供搜尋方法（優化版）
    searchForAutocomplete(query, limit = 10) {
        const startTime = Date.now();
        
        try {
            if (!query || query.trim().length === 0) {
                return this.digimonData.slice(0, limit).map(digimon => ({
                    id: digimon.id,
                    display: digimon.name,
                    value: digimon.name,
                    metadata: {
                        stage: this.getStageName(digimon.stage),
                        attribute: digimon.attribute,
                        'zh-cn-name': digimon['zh-cn-name']
                    }
                }));
            }

            const trimmedQuery = query.trim().toLowerCase();
            const results = [];
            const seenIds = new Set();
            
            // 1. 精確匹配（優先級最高）
            for (const digimon of this.digimonData) {
                if (results.length >= limit) break;
                
                const nameMatch = digimon.name.toLowerCase() === trimmedQuery;
                const zhNameMatch = digimon['zh-cn-name'] && digimon['zh-cn-name'].toLowerCase() === trimmedQuery;
                const idMatch = !Number.isNaN(Number(trimmedQuery)) && digimon.id === Number.parseInt(trimmedQuery, 10);
                
                if ((nameMatch || zhNameMatch || idMatch) && !seenIds.has(digimon.id)) {
                    results.push(digimon);
                    seenIds.add(digimon.id);
                }
            }
            
            // 2. 開頭匹配（優先級次之）
            if (results.length < limit) {
                for (const digimon of this.digimonData) {
                    if (results.length >= limit) break;
                    
                    const nameStartsWith = digimon.name.toLowerCase().startsWith(trimmedQuery);
                    const zhNameStartsWith = digimon['zh-cn-name'] && digimon['zh-cn-name'].toLowerCase().startsWith(trimmedQuery);
                    
                    if ((nameStartsWith || zhNameStartsWith) && !seenIds.has(digimon.id)) {
                        results.push(digimon);
                        seenIds.add(digimon.id);
                    }
                }
            }
            
            // 3. 包含匹配（優先級最低）
            if (results.length < limit) {
                for (const digimon of this.digimonData) {
                    if (results.length >= limit) break;
                    
                    const nameContains = digimon.name.toLowerCase().includes(trimmedQuery);
                    const zhNameContains = digimon['zh-cn-name'] && digimon['zh-cn-name'].toLowerCase().includes(trimmedQuery);
                    const stageContains = digimon.stage && digimon.stage.toLowerCase().includes(trimmedQuery);
                    const attributeContains = digimon.attribute && digimon.attribute.toLowerCase().includes(trimmedQuery);
                    
                    if ((nameContains || zhNameContains || stageContains || attributeContains) && !seenIds.has(digimon.id)) {
                        results.push(digimon);
                        seenIds.add(digimon.id);
                    }
                }
            }
            
            // 轉換結果格式
            const transformedResults = results.map(digimon => ({
                id: digimon.id,
                display: digimon.name,
                value: digimon.name,
                metadata: {
                    stage: this.getStageName(digimon.stage),
                    attribute: digimon.attribute,
                    'zh-cn-name': digimon['zh-cn-name']
                }
            }));
            
            // 記錄搜尋時間（用於監控）
            const searchTime = Date.now() - startTime;
            if (searchTime > 100) { // 如果搜尋時間超過100ms，記錄警告
                console.warn(`Slow autocomplete search for "${query}": ${searchTime}ms`);
            }
            
            return transformedResults;
        } catch (error) {
            console.error('Autocomplete search error:', error);
            return [];
        }
    }

    // 新增：獲取所有數碼寶貝名稱（用於初始化）
    getAllDigimonNames() {
        return this.digimonData.map(digimon => ({
            id: digimon.id,
            display: digimon.name,
            value: digimon.name,
            metadata: {
                stage: this.getStageName(digimon.stage),
                attribute: digimon.attribute,
                'zh-cn-name': digimon['zh-cn-name']
            }
        }));
    }

    // 新增：為招式關鍵字自動完成提供搜尋方法
    searchMovesForAutocomplete(query, limit = 10) {
        this.ensureMovesIndex();
        const augmentedSkills = this._movesAugmented;
        
        if (!query || query.trim().length === 0) {
            return augmentedSkills.slice(0, limit).map(skill => ({
                id: `${skill.digimonId}_${skill.skill.name}`,
                display: skill.skill.name,
                value: skill.skill.name,
                metadata: {
                    digimon: skill.digimonName,
                    stage: skill.stageName,
                    element: skill.skill.element,
                    type: skill.skill.type,
                    power: skill.skill.power
                }
            }));
        }

        const searchTerm = query.toLowerCase().trim();
        const results = [];
        
        // 檢查是否為數碼寶貝ID搜尋
        const isIdSearch = !Number.isNaN(Number(searchTerm)) && searchTerm.length > 0;
        let targetDigimon = null;
        
        if (isIdSearch) {
            // 根據ID找到對應的數碼寶貝
            const digimonId = Number.parseInt(searchTerm, 10);
            targetDigimon = this.digimonData.find(d => d.id === digimonId);
        }
        
        // 搜尋所有招式
        for (const skillData of augmentedSkills) {
            const skill = skillData.skill;
            const digimonName = skillData.digimonName;
            const stageName = skillData.stageName;
            const digimonId = skillData.digimonId;
            
            let shouldInclude = false;
            let score = 0;
            
            if (isIdSearch && targetDigimon) {
                // ID搜尋：只顯示該數碼寶貝的招式
                if (digimonId === targetDigimon.id) {
                    shouldInclude = true;
                    score = 100; // ID完全匹配得分最高
                }
            } else {
                // 關鍵字搜尋：招式名稱、數碼寶貝名稱、階段、屬性、元素、ID
                const searchableText = [
                    skill.name,
                    digimonName,
                    stageName,
                    skill.element || '',
                    skill.type || '',
                    digimonId.toString() // 添加ID到搜尋字段
                ].join(' ').toLowerCase();
                
                if (searchableText.includes(searchTerm)) {
                    shouldInclude = true;
                    const skillName = skill.name.toLowerCase();
                    const digimon = digimonName.toLowerCase();
                    
                    // 招式名稱完全匹配得分最高
                    if (skillName === searchTerm) score += 100;
                    else if (skillName.startsWith(searchTerm)) score += 80;
                    else if (skillName.includes(searchTerm)) score += 60;
                    
                    // 數碼寶貝名稱匹配
                    if (digimon.includes(searchTerm)) score += 30;
                    
                    // ID匹配
                    if (digimonId.toString() === searchTerm) score += 50;
                    else if (digimonId.toString().includes(searchTerm)) score += 20;
                }
            }
            
            if (shouldInclude) {
                results.push({
                    id: `${skillData.digimonId}_${skill.name}`,
                    display: skill.name,
                    value: skill.name,
                    metadata: {
                        digimon: digimonName,
                        stage: stageName,
                        element: skill.element,
                        type: skill.type,
                        power: skill.power,
                        digimonId: digimonId // 添加ID到元數據
                    },
                    score: score
                });
            }
        }
        
        // 按相關性排序
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, limit);
    }

    // 新增：獲取所有招式（用於初始化）
    getAllMoves() {
        this.ensureMovesIndex();
        const augmentedSkills = this._movesAugmented;
        
        return augmentedSkills.map(skillData => ({
            id: `${skillData.digimonId}_${skillData.skill.name}`,
            display: skillData.skill.name,
            value: skillData.skill.name,
            metadata: {
                digimon: skillData.digimonName,
                stage: skillData.stageName,
                element: skillData.skill.element,
                type: skillData.skill.type,
                power: skillData.skill.power,
                digimonId: skillData.digimonId
            }
        }));
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
                    .addStringOption(option => {
                        const opt = option.setName('name')
                            .setDescription('數碼寶貝名稱或編號')
                            .setRequired(true)
                            .setAutocomplete(true);
                        
                        // 添加自動完成配置到選項對象
                        opt.autocompleteModule = 'digimon';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.zh-cn-name'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsText = '找不到相關的數碼寶貝';
                        
                        return opt;
                    }))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('path')
                    .setDescription('查詢進化路線')
                    .addStringOption(option => {
                        const opt = option.setName('from')
                            .setDescription('起始數碼寶貝名稱或編號')
                            .setRequired(true)
                            .setAutocomplete(true);
                        
                        opt.autocompleteModule = 'digimon';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.zh-cn-name'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsText = '找不到相關的數碼寶貝';
                        
                        return opt;
                    })
                    .addStringOption(option => {
                        const opt = option.setName('to')
                            .setDescription('目標數碼寶貝名稱或編號')
                            .setRequired(true)
                            .setAutocomplete(true);
                        
                        opt.autocompleteModule = 'digimon';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.zh-cn-name'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsText = '找不到相關的數碼寶貝';
                        
                        return opt;
                    }))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('move')
                    .setDescription('查詢招式')
                    .addStringOption(option => {
                        const opt = option.setName('keyword')
                            .setDescription('招式或數碼寶貝名稱關鍵字')
                            .setRequired(false)
                            .setAutocomplete(true);
                        
                        // 添加自動完成配置到選項對象
                        opt.autocompleteModule = 'digimon_moves';
                        opt.autocompleteSearchFields = ['display', 'value', 'metadata.digimon', 'metadata.element', 'metadata.type', 'metadata.digimonId'];
                        opt.autocompleteLimit = 8;
                        opt.autocompleteMinQueryLength = 1;
                        opt.autocompleteNoResultsText = '找不到相關的招式';
                        
                        return opt;
                    })
                    .addStringOption(option =>
                        option.setName('attribute')
                            .setDescription('數碼寶貝屬性')
                            .setRequired(false)
                            .addChoices(
                                { name: '數據種', value: '數據種' },
                                { name: '疫苗種', value: '疫苗種' },
                                { name: '病毒種', value: '病毒種' }
                            ))
                    .addStringOption(option =>
                        option.setName('element')
                            .setDescription('招式屬性')
                            .setRequired(false)
                            .addChoices(
                                { name: '火', value: '火' },
                                { name: '水', value: '水' },
                                { name: '草木', value: '草木' },
                                { name: '冰', value: '冰' },
                                { name: '電', value: '電' },
                                { name: '地面', value: '地面' },
                                { name: '鋼', value: '鋼' },
                                { name: '風', value: '風' },
                                { name: '光', value: '光' },
                                { name: '闇', value: '闇' },
                                { name: '無', value: '無' },
                                { name: '-', value: '-' }
                            ))
                    .addStringOption(option =>
                        option.setName('target_type')
                            .setDescription('招式目標類型')
                            .setRequired(false)
                            .addChoices(
                                { name: '全體(敵)', value: '全體敵人' },
                                { name: '單體(敵)', value: '單體敵人' },
                                { name: '全體(友)', value: '全體隊友' },
                                { name: '單體(友)', value: '單體隊友' },
                                { name: '自己', value: '自己' }
                            ))
                    .addStringOption(option =>
                        option.setName('stage')
                            .setDescription('數碼寶貝進化階段')
                            .setRequired(false)
                            .addChoices(
                                { name: '幼年期1', value: '幼年期1' },
                                { name: '幼年期2', value: '幼年期2' },
                                { name: '成長期', value: '成長期' },
                                { name: '成熟期', value: '成熟期' },
                                { name: '完全體', value: '完全體' },
                                { name: '究極體', value: '究極體' },
                                { name: '超究極體', value: '超究極體' }
                            ))
                    .addStringOption(option =>
                        option.setName('skill_type')
                            .setDescription('招式類型')
                            .setRequired(false)
                            .addChoices(
                                { name: '物理', value: 'Physical' },
                                { name: '魔法', value: 'Magic' },
                                { name: '輔助', value: 'Buff' },
                                { name: 'HP%', value: 'HP Damage' },
                                { name: 'Debuff', value: 'Debuff' },
                                { name: '回復', value: 'Recovery' }
                            ))
                    .addBooleanOption(option =>
                        option.setName('has_crit')
                            .setDescription('CR招式'))
                    .addBooleanOption(option =>
                        option.setName('always_hits')
                            .setDescription('必中招式'))
                    .addBooleanOption(option =>
                        option.setName('hp_drain')
                            .setDescription('HP回復招式'))
                    .addBooleanOption(option =>
                        option.setName('sp_drain')
                            .setDescription('SP回復招式'))
                    .addBooleanOption(option =>
                        option.setName('has_recoil')
                            .setDescription('反作用力招式'))
            ),
        flagMap: {
            has_crit: '--crit',
            always_hits: '--hits',
            hp_drain: '--hp',
            sp_drain: '--sp',
            has_recoil: '--recoil'
        },
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
                case 'move': {
                    const keyword = interaction.options.getString('keyword');
                    const attribute = interaction.options.getString('attribute');
                    const element = interaction.options.getString('element');
                    const target_type = interaction.options.getString('target_type');
                    const stage = interaction.options.getString('stage');
                    const skill_type = interaction.options.getString('skill_type');

                    const has_crit = interaction.options.getBoolean('has_crit');
                    const always_hits = interaction.options.getBoolean('always_hits');
                    const hp_drain = interaction.options.getBoolean('hp_drain');
                    const sp_drain = interaction.options.getBoolean('sp_drain');
                    const has_recoil = interaction.options.getBoolean('has_recoil');

                    const queryParts = [keyword, attribute, element, target_type, stage, skill_type].filter(Boolean);

                    if (has_crit) queryParts.push('--crit');
                    if (always_hits) queryParts.push('--hits');
                    if (hp_drain) queryParts.push('--hp');
                    if (sp_drain) queryParts.push('--sp');
                    if (has_recoil) queryParts.push('--recoil');

                    return `.digi -m ${queryParts.join(' ')}`;
                }
            }
        }
    }
];

// 自動完成模組配置
const autocomplete = {
    moduleName: 'digimon',
    getData: () => {
        const instance = Digimon.init();
        return instance.getAllDigimonNames();
    },
    search: (query, limit) => {
        const instance = Digimon.init();
        return instance.searchForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

// 招式自動完成模組配置
const movesAutocomplete = {
    moduleName: 'digimon_moves',
    getData: () => {
        const instance = Digimon.init();
        return instance.getAllMoves();
    },
    search: (query, limit) => {
        const instance = Digimon.init();
        return instance.searchMovesForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand,
    Digimon,
    autocomplete,
    movesAutocomplete
};