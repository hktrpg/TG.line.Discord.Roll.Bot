"use strict";
const path = require('node:path');
const fs = require('node:fs');
const axios = require('axios').default;

// Optional persistence via Mongo (gracefully degrade if unavailable)
let db = {};
try {
    db = require('../modules/schema.js') || {};
} catch {
    db = {};
}
let VIP = {};
try {
    VIP = require('../modules/veryImportantPerson.js');
} catch {
    VIP = {};
}

// In-memory fallback for runs when DB is not configured
const memoryRuns = new Map();

const variables = {};

const gameName = function () {
    return '【StoryTeller】 .st';
}

const gameType = function () {
    return 'Tool:storyTeller';
}

const prefixs = function () {
    // mainMsg[0] matches .st
    return [{
        first: /^[.][s][t]$/i,
        second: null
    }]
}

const getHelpMessage = function () {
    return `【📖互動故事 StoryTeller】
╭────── 🚀快速開始 ──────
│ .st start <alias|title> [alone|all|poll x]
│ 　啟動劇本。alone 僅發起者可互動；all 任何人；poll x 啟用Discord投票x分鐘（預設3，僅Discord）。
│ .st list
│ 　顯示此處可啟動之劇本清單。
│ .st pause / .st continue [runId]
│ 　暫停或繼續目前進行中的劇本（跨裝置可用 runId 指定續玩）。
│ .st edit alone|all|poll x
│ 　發起者可切換參與權限；poll 啟用Discord投票（x分鐘，預設3，僅Discord）。
│ .st end
│ 　結束目前劇本。
├────── 🎯遊戲進行 ──────
│ .st goto <page>
│ 　跳至指定頁面/選項（通常由系統提示可用選項）。
│ .st set <var> <value>
│ 　設定變數（例：.st set name 小花 / .st set hp 12）。
├────── 🧰 劇本管理 ──────
│ .st my [alias]
│ 　查看自己新增之劇本統計（可加 alias 僅看單一劇本）。
│ .st mylist
│ 　顯示自己所有新增之劇本清單。
│ .st list <alias>
│ 　顯示該劇本簡介與可用資訊。
│ .st import <alias> [title]
│ 　上傳檔案以新增劇本，支援 .json 或 .txt（RUN_DESIGN 格式）。（僅Discord）
│ .st update <alias> [title]
│ 　上傳檔案以覆蓋既有劇本。（僅Discord）
│ .st delete <alias>
│ 　刪除自己擁有的劇本。
│ .st exportfile <alias>
│ 　將劇本以私訊傳送文字檔，並在頻道通知（需要有權限）。（僅Discord）
│ .st verify <alias>
│ 　檢查劇本內容格式是否正確。
├────── 🔐 啟動權限 ──────
│ .st allow <alias> AUTHOR (預設)
│ 　僅作者本人可在任何地方啟動。
│ .st allow <alias>
│ 　在本群組/頻道允許啟動。
│ .st allow <alias> <groupId...>
│ 　允許指定之群組/頻道啟動（可多個）。
│ .st allow <alias> all
│ 　任何人皆可啟動（公開）。
├────── 📊 狀態檢視 ──────
│ .st game
│ 　顯示目前運行與暫停中的遊戲。
├────── 📎 範例 ──────
│ .st start v002
│ .st set name 小花
│ .st goto 12
│ .st pause
│ .st continue
│ .st end
├────── 💡備註 ──────
│ - .txt 支援 RUN_DESIGN 語法。
│ - poll、import、exportfile、update 僅於Discord有效；未提供 x 時預設為 3 分鐘。
│ - runId 可於多處所使用以續玩同一劇本。
| - 編寫劇本請參考：https://bothelp.hktrpg.com/
╰────────────────`;
}

const initialize = function () {
    return variables;
}

// ---- Story utilities ----
function getContextKey({ groupid, channelid, userid }) {
    // Prefer channel scope when available; else group; else user
    if (channelid) return `c:${channelid}`;
    if (groupid) return `g:${groupid}`;
    return `u:${userid}`;
}

function interpolate(template, ctx) {
    if (typeof template !== 'string') return '';
    // Manual scan to avoid regex replace callback (and satisfy prefer-replaceAll linters)
    let result = '';
    let i = 0;
    while (i < template.length) {
        const open = template.indexOf('{', i);
        if (open === -1) {
            result += template.slice(i);
            break;
        }
        const close = template.indexOf('}', open + 1);
        if (close === -1) {
            result += template.slice(i);
            break;
        }
        result += template.slice(i, open);
        const key = template.slice(open + 1, close).trim();
        // Dice placeholder support: {xDy}
        let val;
        const diceMatch = key.match(/^\s*(\d+)\s*[dD]\s*(\d+)\s*$/);
        if (diceMatch) {
            const count = Math.max(1, Math.min(100, Number(diceMatch[1]) || 1));
            const sides = Math.max(1, Math.min(10_000, Number(diceMatch[2]) || 1));
            let sum = 0;
            for (let r = 0; r < count; r++) sum += Math.floor(Math.random() * sides) + 1;
            val = String(sum);
        } else if (Object.prototype.hasOwnProperty.call(ctx || {}, key) && ctx[key] !== null && ctx[key] !== undefined) {
            val = String(ctx[key]);
        } else {
            val = template.slice(open, close + 1);
        }
        result += val;
        i = close + 1;
    }
    return result;
}

// Replace all dice literals like `xDy` in a string with their rolled sum
// Example: "2d6 + 1" => "7 + 1" (value will vary per call)
function replaceDiceLiteralsWithSums(input) {
    const s = String(input || '');
    let out = '';
    let i = 0;
    const isIdent = (ch) => /[A-Za-z0-9_]/.test(ch);
    while (i < s.length) {
        const ch = s[i];
        if (/[0-9]/.test(ch)) {
            let j = i;
            while (j < s.length && /[0-9]/.test(s[j])) j++;
            const leftNum = s.slice(i, j);
            let k = j;
            // allow whitespace between number and d/D
            while (k < s.length && /\s/.test(s[k])) k++;
            if (k < s.length && (s[k] === 'd' || s[k] === 'D')) {
                let m = k + 1;
                while (m < s.length && /\s/.test(s[m])) m++;
                if (m < s.length && /[0-9]/.test(s[m])) {
                    let n = m;
                    while (n < s.length && /[0-9]/.test(s[n])) n++;
                    // boundary checks: ensure not part of identifier on either side
                    const prevCh = i > 0 ? s[i - 1] : '';
                    const nextCh = n < s.length ? s[n] : '';
                    if (!isIdent(prevCh) && !isIdent(nextCh)) {
                        const count = Math.max(1, Math.min(100, Number(leftNum) || 1));
                        const sides = Math.max(1, Math.min(10_000, Number(s.slice(m, n)) || 1));
                        let sum = 0;
                        for (let r = 0; r < count; r++) sum += Math.floor(Math.random() * sides) + 1;
                        out += String(sum);
                        i = n;
                        continue;
                    }
                }
            }
            // not a dice literal; emit the number as-is
            out += leftNum;
            i = j;
            continue;
        }
        out += ch;
        i++;
    }
    return out;
}

function safeEvalCondition(expr, scope) {
    try {
        if (!expr) return true;
        if (/^true$/i.test(expr)) return true;
        if (/^false$/i.test(expr)) return false;
        // Preprocess dice literals like 2d20 -> concrete number
        const raw = replaceDiceLiteralsWithSums(String(expr));
        // Block function calls and sensitive globals to avoid executing arbitrary code
        const hasCall = /(?:^|[^A-Za-z0-9_])(?:[A-Za-z_][A-Za-z0-9_]*\s*\(|\.\s*[A-Za-z_][A-Za-z0-9_]*\s*\()/.test(raw);
        if (hasCall) return false;
        const forbiddenIdents = /\b(?:globalThis|global|process|this|Function|constructor|require)\b/;
        if (forbiddenIdents.test(raw)) return false;
        // Very small evaluator: replace bare identifiers with scope values
        // Allow operators: <, >, <=, >=, ==, ===, !=, !==, &&, ||, +, -, *, /, %
        const allowed = /[A-Za-z_][A-Za-z0-9_]*|([<>]=?|==?=|!?=)|[()&|+\-*/%\s.\d]/g;
        const cleaned = (raw.match(allowed) || []).join('');
        // Build a function with scope via with()
        const fn = new Function('scope', 'with(scope){ return (' + cleaned + ') }');
        return !!fn(scope);
    } catch {
        return false;
    }
}

// Evaluate arithmetic/identifier expressions against scope and return the value (not just truthy)
function evalExpressionValue(expr, scope) {
    try {
        if (expr === undefined || expr === null) return void 0;
        if (typeof expr === 'number') return expr;
        const str = replaceDiceLiteralsWithSums(String(expr).trim());
        if (str === '') return '';
        // Block function calls and sensitive globals in value expressions
        const hasCall = /(?:^|[^A-Za-z0-9_])(?:[A-Za-z_][A-Za-z0-9_]*\s*\(|\.\s*[A-Za-z_][A-Za-z0-9_]*\s*\()/.test(str);
        const forbiddenIdents = /\b(?:globalThis|global|process|this|Function|constructor|require)\b/;
        if (hasCall || forbiddenIdents.test(str)) return expr;
        // Allow identifiers and basic operators
        const allowed = /[A-Za-z_][A-Za-z0-9_]*|([<>]=?|==?=|!?=)|[()&|+\-*/%\s.\d]/g;
        const cleaned = (str.match(allowed) || []).join('');
        const fn = new Function('scope', 'with(scope){ return (' + cleaned + ') }');
        return fn(scope);
    } catch {
        return expr;
    }
}

function pickRandomChance(item) {
    if (item && typeof item.randomChance === 'number') {
        return Math.random() < item.randomChance;
    }
    return true;
}

function ensureRunDefaults(run, story) {
    run.variables = run.variables || {};
    run.stats = run.stats || {};
    run.playerVariables = run.playerVariables || {};
    // Initialize stats 1-10 randomly if not set.
    // If stats have been explicitly set by the story (lock flag), do not randomize
    // missing keys anymore to avoid overriding authored values mid-run.
    const statsLocked = !!run.__statsLocked;
    if (story && Array.isArray(story.gameStats)) {
        for (const s of story.gameStats) {
            const k = s.key;
            if (run.stats[k] === undefined || run.stats[k] === null) {
                if (statsLocked) continue;
                const min = Number(s.min) || 1;
                const max = Number(s.max) || 10;
                run.stats[k] = Math.floor(Math.random() * (max - min + 1)) + min;
            }
        }
    }
}

// Deprecated: demo story direct link (03.json) removed after test phase
// function readStory03() { return { title: '', type: 'story', introduction: '', playerVariables: [], variables: [], speakers: [], gameStats: [], ownerId: '', initialPage: '0', pages: {} }; }

async function loadStoryByAlias(ownerID, alias) {
    if (db.story && typeof db.story.findOne === 'function') {
        // Prefer global alias (unique) lookup
        let doc = await db.story.findOne({ alias }).lean();
        // Backward compatibility: if not found globally, try owner-scoped
        if (!doc && ownerID) doc = await db.story.findOne({ ownerID, alias }).lean();
        if (doc && doc.payload) return { storyDoc: doc, story: doc.payload };
    }
    const fallbackPath = path.join(__dirname, 'storyTeller', alias + '.json');
    if (fs.existsSync(fallbackPath)) {
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        return { storyDoc: null, story: JSON.parse(raw) };
    }
    return { storyDoc: null, story: null };
}

function canStartStory(storyDoc, { userid, groupid }) {
    if (!storyDoc || !storyDoc.startPermission) return { ok: true };
    const perm = String(storyDoc.startPermission).toUpperCase();
    if (perm === 'ANYONE') return { ok: true };
    if (perm === 'AUTHOR_ONLY') return { ok: storyDoc.ownerID === userid, reason: '僅作者可啟動' };
    if (perm === 'GROUP_ONLY') {
        const groups = Array.isArray(storyDoc.allowedGroups) ? storyDoc.allowedGroups : [];
        if (!groupid) return { ok: false, reason: '僅指定群組可啟動' };
        return { ok: groups.includes(groupid), reason: '未在允許的群組內' };
    }
    return { ok: true };
}

async function resolveStoryForStart({ ownerID, aliasOrTitle }) {
    const key = String(aliasOrTitle || '').trim();
    if (!key) return { storyDoc: null, story: null, alias: null };
    if (db.story && typeof db.story.findOne === 'function') {
        // First try global alias (unique)
        let doc = await db.story.findOne({ alias: key });
        // If not found by alias, fallback to owner+title
        if (!doc) doc = await db.story.findOne({ ownerID, title: key });
        if (doc && doc.payload) return { storyDoc: doc, story: doc.payload, alias: doc.alias };
    }
    const fallbackPath = path.join(__dirname, 'storyTeller', key + '.json');
    if (fs.existsSync(fallbackPath)) {
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        return { storyDoc: null, story: JSON.parse(raw), alias: key };
    }
    return { storyDoc: null, story: null, alias: null };
}

// Removed legacy demo story helpers

async function createRun({ storyDoc, story, context, starterID, starterName, botname }) {
    const run = {
        story: storyDoc ? storyDoc._id : null,
        storyOwnerID: storyDoc ? storyDoc.ownerID : context.userid,
        storyAlias: storyDoc ? (storyDoc.alias || 'unknown') : 'unknown',
        starterID,
        starterName,
        botname,
        groupID: context.groupid,
        channelID: context.channelid,
        startPermissionAtRun: storyDoc ? storyDoc.startPermission : 'ANYONE',
        participantPolicy: 'ANYONE',
        allowedUserIDs: [],
        variables: {},
        stats: {},
        playerVariables: {},
        currentPageId: story.initialPage || '0',
        history: [],
        isEnded: false,
        isPaused: false,
        endingId: '',
        endingText: '',
        endingTitle: ''
    };
    ensureRunDefaults(run, story);

    if (db.storyRun && typeof db.storyRun.create === 'function') {
        const doc = await db.storyRun.create(run);
        return doc;
    }
    const key = getContextKey(context);
    // Assign a memory id for pause/continue
    if (!run._id) run._id = 'mem-' + Date.now() + '-' + Math.floor(Math.random() * 1_000_000);
    // Ensure timestamps for in-memory mode
    if (!run.createdAt) run.createdAt = new Date();
    memoryRuns.set(key, run);
    return run;
}

async function getActiveRun(context) {
    const key = getContextKey(context);
    if (db.storyRun && typeof db.storyRun.findOne === 'function') {
        const query = { isEnded: false, isPaused: { $ne: true } };
        if (context.channelid) query.channelID = context.channelid;
        else if (context.groupid) query.groupID = context.groupid;
        else query.starterID = context.userid;
        const run = await db.storyRun.findOne(query).sort({ createdAt: -1 });
        return run;
    }
    const run = memoryRuns.get(key) || null;
    if (run && run.isPaused) return null;
    return run;
}

async function countOpenRunsByStarter(starterID) {
    try {
        if (db.storyRun && typeof db.storyRun.countDocuments === 'function') {
            const n = await db.storyRun.countDocuments({ starterID, isEnded: false });
            return Number(n) || 0;
        }
    } catch { /* ignore */ }
    // Fallback to in-memory count
    let cnt = 0;
    try {
        for (const run of memoryRuns.values()) {
            if (run && String(run.starterID) === String(starterID) && !run.isEnded) cnt++;
        }
    } catch { /* ignore */ }
    return cnt;
}

async function saveRun(context, run) {
    if (run && typeof run.save === 'function' && run._id) {
        try {
            // Ensure Mongoose detects changes on Mixed paths
            run.markModified && run.markModified('variables');
            run.markModified && run.markModified('stats');
            run.markModified && run.markModified('playerVariables');
            run.markModified && run.markModified('history');
            await run.save();
            return;
        } catch {
            // Fallback to findByIdAndUpdate below
        }
    }
    if (db.storyRun && typeof db.storyRun.findByIdAndUpdate === 'function' && run && run._id) {
        const update = {
            variables: run.variables || {},
            stats: run.stats || {},
            playerVariables: run.playerVariables || {},
            currentPageId: run.currentPageId,
            history: run.history || [],
            isEnded: !!run.isEnded,
            isPaused: !!run.isPaused,
            pausedAt: run.pausedAt || undefined,
            endingId: run.endingId || '',
            endingText: run.endingText || '',
            endingTitle: run.endingTitle || '',
            endedAt: run.endedAt || undefined,
            participantPolicy: run.participantPolicy,
            allowedUserIDs: run.allowedUserIDs || []
        };
        await db.storyRun.findByIdAndUpdate(run._id, update, { new: true });
        return;
    }
    const key = getContextKey(context);
    memoryRuns.set(key, run);
}

function buildEvalScope(run) {
    return Object.assign({}, run.variables || {}, run.stats || {}, run.playerVariables || {});
}

function userCanActOnRun(run, userid) {
    const policy = String(run && run.participantPolicy || 'ANYONE').toUpperCase();
    if (policy !== 'ALONE') return true;
    return String(run && run.starterID) === String(userid);
}

function renderPageText(story, run, pageId) {
    const page = story.pages[pageId];
    if (!page) return '找不到此頁面。';
    const scope = buildEvalScope(run);
    const statKeySet = new Set(Array.isArray(story.gameStats) ? story.gameStats.map(s => s.key) : []);
    // const varKeySet = new Set(Array.isArray(story.variables) ? story.variables.map(v => v.key) : []);
    const ctx = Object.assign({}, scope);
    let out = '';
    if (page.title) out += '【' + page.title + '】\n';
    if (Array.isArray(page.content)) {
        for (const item of page.content) {
            if (item.condition && !safeEvalCondition(item.condition, scope)) continue;
            if (!pickRandomChance(item)) continue;
            if (item.setVariables && typeof item.setVariables === 'object') {
                run.variables = run.variables || {};
                for (const [k, v] of Object.entries(item.setVariables)) {
                    const val = evalExpressionValue(v, Object.assign({}, run.variables, run.stats, run.playerVariables));
                    // Decide destination: stat or variable
                    if (statKeySet.has(k)) {
                        const num = typeof val === 'number' ? val : Number(val);
                        run.stats = run.stats || {};
                        run.stats[k] = Number.isNaN(num) ? (run.stats[k] ?? 0) : num;
                        // Lock stats after first explicit authored assignment to prevent later randomization
                        if (!run.__statsLocked) run.__statsLocked = true;
                        scope[k] = run.stats[k];
                        ctx[k] = run.stats[k];
                    } else {
                        // If declared variable key, set; otherwise also allow dynamic variables
                        const resolved = (typeof val === 'number' || typeof val === 'string') ? val : String(val);
                        run.variables[k] = resolved;
                        scope[k] = resolved;
                        ctx[k] = resolved;
                    }
                }
            }
            if (typeof item.text === 'string') {
                out += interpolate(item.text, ctx) + '\n';
            }
        }
    }
    if (page.isEnding) {
        // Evaluate endings
        // Record ending id/title and final text when entering an ending page
        try {
            run.endingId = String(pageId || '');
            run.endingTitle = page && page.title ? String(page.title) : '';
        } catch { /* ignore */ }
        if (Array.isArray(page.endings)) {
            for (const ed of page.endings) {
                if (!ed.condition || safeEvalCondition(ed.condition, scope)) {
                    const chosen = interpolate(ed.text, ctx);
                    out += '\n' + chosen + '\n';
                    run.endingText = chosen;
                    break;
                }
            }
        }
    }
    if (Array.isArray(page.choices) && page.choices.length > 0) {
        const choices = page.choices.filter(c => !c.condition || safeEvalCondition(c.condition, scope));
        if (choices.length > 0) {
            out += '\n可用選項：\n';
            for (const c of choices) {
                const action = String(c.action || '').toUpperCase();
                const label = interpolate(c.text || '', ctx);
                if (action === 'END') out += '- ' + label + '（.st end）\n';
                else out += '- ' + label + '（.st goto ' + c.action + '）\n';
            }
        }
    }
    return out.trim();
}

// ---- RUN_DESIGN compiler (subset covering 03.json) ----
function compileRunDesignToStory(runDesignText, { alias, title }) {
    const lines = String(runDesignText || '').split(/\r?\n/);
    const story = {
        title: '',
        type: 'story',
        introduction: '',
        coverImage: '',
        playerVariables: [],
        variables: [],
        speakers: [],
        gameStats: [],
        ownerId: '',
        initialPage: '0',
        pages: {}
    };

    let currentPageId = null;
    let inEnding = false;

    function ensurePage(id) {
        if (!story.pages[id]) story.pages[id] = { id: String(id), title: '', content: [], choices: [] };
        return story.pages[id];
    }

    for (let raw of lines) {
        const line = String(raw).trim();
        if (!line) continue;
        if (/^\/\//.test(line)) continue;

        let m;
        if ((m = line.match(/^\[meta\]\s*title\s+"([\s\S]*?)"$/i))) { story.title = m[1]; continue; }
        if ((m = line.match(/^\[intro\]\s*(.*)$/i))) { story.introduction += (story.introduction ? '\n' : '') + m[1]; continue; }
        if ((m = line.match(/^\[player_var\]\s*([^\s]+)\s+"([\s\S]*?)"(?:\s+"([\s\S]*?)")?$/i))) {
            story.playerVariables.push({ key: m[1], prompt: m[2], placeholder: m[3] || '' });
            continue;
        }
        if ((m = line.match(/^\[stat_def\]\s*([^\s]+)\s+(-?\d+)\s+(-?\d+)(?:\s+"([\s\S]*?)")?$/i))) {
            story.gameStats.push({ key: m[1], min: Number(m[2]), max: Number(m[3]), label: m[4] || m[1] });
            continue;
        }
        if ((m = line.match(/^\[var_def\]\s*([^\s]+)\s+(-?\d+)\s+(-?\d+)(?:\s+"([\s\S]*?)")?$/i))) {
            story.variables.push({ key: m[1], min: Number(m[2]), max: Number(m[3]), label: m[4] || m[1] });
            continue;
        }
        if ((m = line.match(/^\[label\]\s*(\d+)$/i))) { currentPageId = String(m[1]).trim(); ensurePage(currentPageId); inEnding = false; continue; }
        if ((m = line.match(/^\[title\]\s*([\s\S]+)$/i))) { ensurePage(currentPageId || '0').title = m[1]; continue; }
        if (/^\[ending\]/i.test(line)) { inEnding = true; continue; }

        if ((m = line.match(/^\[text(?:\|([^\]]+))?\]\s*([\s\S]*)$/i))) {
            const opts = (m[1] || '').split(',').reduce((acc, kv) => {
                const seg = kv.trim(); if (!seg) return acc; const p = seg.split('='); acc[(p[0] || '').trim()] = (p[1] || '').trim(); return acc;
            }, {});
            const entry = { text: m[2] };
            if (opts.speaker) entry.speaker = opts.speaker;
            if (opts.if) entry.condition = opts.if;
            const page = ensurePage(currentPageId || '0');
            if (inEnding) {
                page.isEnding = true; page.endings = page.endings || [];
                page.endings.push({ condition: entry.condition || 'true', text: entry.text });
            } else {
                page.content.push(entry);
            }
            continue;
        }
        if ((m = line.match(/^\[random\]\s*(\d+)%$/i))) {
            ensurePage(currentPageId || '0').content.push({ randomChance: Math.min(100, Math.max(0, Number(m[1]))) / 100, text: '' });
            continue;
        }
        // [set] and [set|if=...] support
        if ((m = line.match(/^\[set(?:\|([^\]]+))?\]\s*([^=\s]+)\s*=\s*([\s\S]+)$/i))) {
            const page = ensurePage(currentPageId || '0');
            const opts = (m[1] || '').split(',').reduce((acc, kv) => {
                const seg = String(kv || '').trim(); if (!seg) return acc; const p = seg.split('='); acc[(p[0] || '').trim()] = (p[1] || '').trim(); return acc;
            }, {});
            const key = m[2];
            const rawVal = m[3];
            const val = Number.isNaN(Number(rawVal)) ? rawVal : Number(rawVal);
            const entry = { setVariables: { [key]: val } };
            if (opts.if) entry.condition = opts.if;
            page.content.push(entry);
            continue;
        }
        if (/^\[choice\]/i.test(line)) { continue; }
        if ((m = line.match(/^->\s*([\s\S]+?)\s*\|\s*([^|\s]+)(?:\s*\|\s*if=([^|]+))?(?:\s*\|\s*stat=([\s\S]+))?$/))) {
            const page = ensurePage(currentPageId || '0');
            const choice = { text: m[1].trim(), action: m[2].trim() };
            if (m[3]) choice.condition = m[3].trim();
            if (m[4]) {
                const sc = {};
                for (const pair of String(m[4]).split(',')) {
                    const p = pair.trim();
                    if (!p) continue;
                    const mm = p.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*([+-])\s*(\d+)$/);
                    if (mm) sc[mm[1]] = (mm[2] === '+') ? Number(mm[3]) : -Number(mm[3]);
                }
                choice.statChanges = sc;
            }
            page.choices.push(choice);
            continue;
        }
    }

    // Normalize: attach [random] to following text
    for (const pid of Object.keys(story.pages)) {
        const page = story.pages[pid];
        const fixed = [];
        for (let i = 0; i < page.content.length; i++) {
            const item = page.content[i];
            if (item.randomChance && item.text === '' && page.content[i + 1] && typeof page.content[i + 1].text === 'string') {
                const nxt = Object.assign({}, page.content[i + 1]);
                nxt.randomChance = item.randomChance;
                fixed.push(nxt); i++; continue;
            }
            fixed.push(item);
        }
        page.content = fixed;
    }

    if (!story.title) story.title = title || alias || 'Untitled';
    return story;
}

function exportStoryToRunDesign(story) {
    const lines = [];
    const q = (s) => '"' + JSON.stringify(String(s || '')).slice(1, -1) + '"';
    lines.push('[meta] title ' + q(story.title || ''));
    if (story.introduction) {
        for (const l of String(story.introduction).split(/\r?\n/)) lines.push('[intro] ' + l);
    }
    if (Array.isArray(story.playerVariables)) {
        for (const pv of story.playerVariables) {
            lines.push('[player_var] ' + pv.key + ' ' + q(pv.prompt || '') + (pv.placeholder ? (' ' + q(pv.placeholder)) : ''));
        }
    }
    if (Array.isArray(story.gameStats)) {
        for (const st of story.gameStats) {
            lines.push('[stat_def] ' + st.key + ' ' + (st.min ?? 1) + ' ' + (st.max ?? 10) + (st.label ? (' ' + q(st.label)) : ''));
        }
    }
    if (Array.isArray(story.variables)) {
        for (const v of story.variables) {
            lines.push('[var_def] ' + v.key + ' ' + (v.min ?? 0) + ' ' + (v.max ?? 1) + (v.label ? (' ' + q(v.label)) : ''));
        }
    }

    const pageIds = Object.keys(story.pages || {}).sort((a, b) => Number(a) - Number(b));
    for (const pid of pageIds) {
        const page = story.pages[pid];
        // Ensure a blank line before each [label]
        if (lines.length > 0 && lines.at(-1) !== '') lines.push('');
        lines.push('[label] ' + pid);
        // Place [ending] immediately under [label] when this page is an ending
        if (page.isEnding) lines.push('[ending]');
        if (page.title) lines.push('[title] ' + page.title);
        if (Array.isArray(page.content)) {
            for (const item of page.content) {
                if (item.setVariables && typeof item.setVariables === 'object') {
                    for (const [k, v] of Object.entries(item.setVariables)) {
                        if (item.condition) lines.push('[set|if=' + item.condition + '] ' + k + '=' + v);
                        else lines.push('[set] ' + k + '=' + v);
                    }
                }
                if (typeof item.randomChance === 'number') lines.push('[random] ' + Math.round(item.randomChance * 100) + '%');
                if (typeof item.text === 'string') {
                    const opts = [];
                    if (item.speaker) opts.push('speaker=' + item.speaker);
                    if (item.condition) opts.push('if=' + item.condition);
                    if (opts.length > 0) lines.push('[text|' + opts.join(',') + '] ' + item.text);
                    else lines.push('[text] ' + item.text);
                }
            }
        }
        if (page.isEnding && Array.isArray(page.endings)) {
            for (const ed of page.endings) {
                if (ed.condition && ed.condition !== 'true') lines.push('[text|if=' + ed.condition + '] ' + (ed.text || ''));
                else lines.push('[text] ' + (ed.text || ''));
            }
        }
        if (Array.isArray(page.choices) && page.choices.length > 0) {
            lines.push('[choice]');
            for (const ch of page.choices) {
                const segs = ['-> ' + ch.text, ch.action];
                if (ch.condition) segs.push('if=' + ch.condition);
                if (ch.statChanges) {
                    const parts = [];
                    for (const [k, v] of Object.entries(ch.statChanges)) parts.push(k + (v >= 0 ? '+' + v : v));
                    if (parts.length > 0) segs.push('stat=' + parts.join(','));
                }
                lines.push(segs.join(' | '));
            }
        }
    }
    return lines.join('\n');
}

function getMissingPlayerVariables(story, run) {
    const req = Array.isArray(story.playerVariables) ? story.playerVariables : [];
    const current = run.playerVariables || {};
    const missing = [];
    for (const item of req) {
        const k = item.key;
        const v = current[k];
        if (v === undefined || v === null || String(v).trim() === '') {
            missing.push(item);
        }
    }
    return missing;
}

function renderPlayerSetupPrompt(story, run) {
    const req = Array.isArray(story.playerVariables) ? story.playerVariables : [];
    const current = run.playerVariables || {};
    let text = '';
    try {
        if (story && typeof story.introduction === 'string' && story.introduction.trim() !== '') {
            text += '【簡介】\n' + String(story.introduction) + '\n\n';
        }
    } catch { /* ignore */ }
    text += '【角色設定】\n請先完成以下項目：\n';
    for (let i = 0; i < req.length; i++) {
        const item = req[i];
        const isSet = current[item.key] !== undefined && String(current[item.key]).trim() !== '';
        const prefix = isSet ? '✔️ 已設定' : (String(i + 1) + '.');
        text += prefix + ' ' + (item.prompt || ('設定 ' + item.key)) + '\n';
        if (!isSet && item.placeholder) text += '範例：' + item.placeholder + '\n';
        if (!isSet) text += '指令：.st set ' + item.key + '   內容\n';
        else text += '目前：' + current[item.key] + '\n';
    }
    text += '\n全部設定完成後，遊戲將自動開始。';
    return text;
}

function findChoiceFromCurrentPage(story, run, targetPageId) {
    const curr = story.pages[run.currentPageId];
    if (!curr || !Array.isArray(curr.choices)) return null;
    
    // Support for 2a, 2b, 2c format: extract base page number and suffix
    const targetStr = String(targetPageId || '');
    const basePageMatch = targetStr.match(/^(\d+)([a-z])?$/i);
    
    if (basePageMatch) {
        const basePage = basePageMatch[1];
        const suffix = basePageMatch[2] || '';
        
        // First try exact match
        for (const c of curr.choices) {
            if (String(c.action) === targetStr) return c;
        }
        
        // If no exact match and we have a suffix, try to find choice with matching base page + suffix
        if (suffix) {
            for (const c of curr.choices) {
                const choiceAction = String(c.action || '');
                const choiceMatch = choiceAction.match(/^(\d+)([a-z])?$/i);
                if (choiceMatch && choiceMatch[1] === basePage && choiceMatch[2] === suffix) {
                    return c;
                }
            }
        }
        
        // Fallback: try to find any choice that goes to the base page
        for (const c of curr.choices) {
            const choiceAction = String(c.action || '');
            const choiceMatch = choiceAction.match(/^(\d+)([a-z])?$/i);
            if (choiceMatch && choiceMatch[1] === basePage) {
                return c;
            }
        }
    }
    
    // Original logic for non-matching cases
    for (const c of curr.choices) {
        if (String(c.action) === String(targetPageId)) return c;
    }
    return null;
}

// Build quick-reply buttons from current page's available choices
function getAllowedChoicesForCurrentPage(story, run) {
    const currentPage = story.pages[run.currentPageId];
    if (!currentPage) return [];
    const scope = buildEvalScope(run);
    const allowedChoices = Array.isArray(currentPage.choices)
        ? currentPage.choices.filter(c => !c.condition || safeEvalCondition(c.condition, scope))
        : [];
    return allowedChoices;
}

function buildButtonsForPage(story, run) {
    const allowedChoices = getAllowedChoicesForCurrentPage(story, run);
    const buttons = [];
    for (const c of allowedChoices) {
        const actionUpper = String(c.action || '').toUpperCase();
        if (actionUpper === 'END') buttons.push('.st end');
        else buttons.push('.st goto ' + c.action);
    }
    // unique & limit to 20
    const unique = [...new Set(buttons)];
    return unique.slice(0, 20);
}

// Build poll payload for Discord reaction-based voting
function buildPollPayloadForPage(story, run) {
    const allowedChoices = getAllowedChoicesForCurrentPage(story, run);
    if (!allowedChoices || allowedChoices.length === 0) return null;
    const options = allowedChoices.map((c, i) => ({
        index: i,
        label: c.text || ('選項 ' + (i + 1)),
        action: String(c.action || '')
    }));
    const minutes = Number((run && run.pollMinutes) || (run && run.variables && run.variables.__pollMinutes)) || 3;
    return { options, minutes };
}

function attachChoicesOutput({ rply, story, run, botname }) {
    if (!rply || !story || !run) return;
    const isDiscord = String(botname || '').toLowerCase() === 'discord';
    const policy = String(run.participantPolicy || 'ANYONE').toUpperCase();
    if (isDiscord && policy === 'POLL') {
        const pollPayload = buildPollPayloadForPage(story, run);
        if (pollPayload) rply.discordCreatePoll = pollPayload;
        // Strip textual choices block for poll mode
        if (typeof rply.text === 'string') {
            rply.text = rply.text.replace(/\n可用選項：[\s\S]*$/m, '').trim();
        }
        return;
    }
    const buttons = buildButtonsForPage(story, run);
    if (buttons && buttons.length > 0) rply.buttonCreate = buttons;
}

async function gotoPage({ story, run, targetPageId }) {
    // Apply stat changes if target matches a defined choice
    const choice = findChoiceFromCurrentPage(story, run, targetPageId);
    if (choice && choice.statChanges) {
        for (const [k, v] of Object.entries(choice.statChanges)) {
            if (typeof v === 'number') {
                run.stats[k] = (Number(run.stats[k]) || 0) + v;
            }
        }
    }
    
    // Support for 2a, 2b, 2c format: extract base page number
    const targetStr = String(targetPageId || '');
    const basePageMatch = targetStr.match(/^(\d+)([a-z])?$/i);
    let actualPageId = targetPageId;
    
    if (basePageMatch) {
        const basePage = basePageMatch[1];
        const suffix = basePageMatch[2] || '';
        
        // If we have a suffix (like 2a), use the base page number (2) for actual navigation
        if (suffix) {
            actualPageId = basePage;
        }
    }
    
    run.currentPageId = String(actualPageId);
    run.history = run.history || [];
    run.history.push({
        pageId: String(actualPageId),
        choiceText: choice ? choice.text : '',
        choiceAction: String(targetPageId), // Keep original target for history
        variables: Object.assign({}, run.variables),
        stats: Object.assign({}, run.stats),
        timestamp: new Date()
    });
}

// ---- Attachment helpers & validation ----
const STORY_LIMIT_BY_LEVEL = [3, 10, 100, 100, 100, 100, 100, 100];
const MAX_PAGES = 400;
const MAX_TEXT_SEGMENT = 500; // per [text] or ending text
const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB

async function getAttachmentInfo(discordMessage, discordClient) {
    if (!discordMessage) return null;
    // Interaction style (slash commands)
    if (discordMessage.interaction) {
        if (discordMessage.attachments && discordMessage.attachments.size > 0) {
            const attachmentsArray = [...discordMessage.attachments.values()];
            const a = attachmentsArray[0];
            if (a && a.url) return { url: a.url, size: a.size || 0, filename: a.name || '', contentType: a.contentType || '' };
        }
        if (discordMessage.reference) {
            try {
                const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
                const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId);
                if (referenceMessage.attachments && referenceMessage.attachments.size > 0) {
                    const attachmentsArray = [...referenceMessage.attachments.values()];
                    const a = attachmentsArray[0];
                    if (a && a.url) return { url: a.url, size: a.size || 0, filename: a.name || '', contentType: a.contentType || '' };
                }
            } catch { /* ignore */ }
        }
        return null;
    }

    // Regular message
    if (discordMessage.type === 0 && discordMessage.attachments && discordMessage.attachments.size > 0) {
        const attachmentsArray = [...discordMessage.attachments.values()];
        const a = attachmentsArray[0];
        return (a && a.url) ? { url: a.url, size: a.size || 0, filename: a.name || '', contentType: a.contentType || '' } : null;
    }
    if (discordMessage.type === 19 && discordMessage.reference) { // reply
        try {
            const channel = await discordClient.channels.fetch(discordMessage.reference.channelId);
            const referenceMessage = await channel.messages.fetch(discordMessage.reference.messageId);
            if (referenceMessage.attachments && referenceMessage.attachments.size > 0) {
                const attachmentsArray = [...referenceMessage.attachments.values()];
                const a = attachmentsArray[0];
                return (a && a.url) ? { url: a.url, size: a.size || 0, filename: a.name || '', contentType: a.contentType || '' } : null;
            }
        } catch { /* ignore */ }
    }
    return null;
}

async function downloadText(url) {
    const resp = await axios({ url, responseType: 'arraybuffer', timeout: 15_000 });
    return Buffer.from(resp.data).toString('utf8');
}

function estimateJsonErrorLine(text, error) {
    const msg = String(error && error.message || '');
    const m = msg.match(/position\s+(\d+)/i);
    if (m) {
        const pos = Number(m[1]);
        const pre = text.slice(0, pos);
        return pre.split(/\r?\n/).length;
    }
    const m2 = msg.match(/at\s+line\s+(\d+)/i);
    if (m2) return Number(m2[1]);
    return null;
}

function validateRunDesignLines(rawText) {
    const lines = String(rawText || '').split(/\r?\n/);
    const patterns = [
        /^\s*$/,
        /^\/\//,
        /^\[meta\]\s*title\s+"([\s\S]*?)"$/i,
        /^\[intro\]\s*(.*)$/i,
        /^\[player_var\]\s*([^\s]+)\s+"([\s\S]*?)"(?:\s+"([\s\S]*?)")?$/i,
        /^\[stat_def\]\s*([^\s]+)\s+(-?\d+)\s+(-?\d+)(?:\s+"([\s\S]*?)")?$/i,
        /^\[var_def\]\s*([^\s]+)\s+(-?\d+)\s+(-?\d+)(?:\s+"([\s\S]*?)")?$/i,
        /^\[label\]\s*(\d+)$/i,
        /^\[title\]\s*([\s\S]+)$/i,
        /^\[ending\]/i,
        /^\[text(?:\|[^\]]+)?\]\s*[\s\S]*$/i,
        /^\[random\]\s*(\d+)%$/i,
        /^\[set(?:\|[^\]]+)?\]\s*([^=\s]+)\s*=\s*[\s\S]+$/i,
        /^\[choice\]/i,
        /^->\s*[\s\S]+?\s*\|\s*([^|\s]+)(?:\s*\|\s*if=[^|]+)?(?:\s*\|\s*stat=[\s\S]+)?$/
    ];
    for (let i = 0; i < lines.length; i++) {
        const line = String(lines[i]).trim();
        if (!patterns.some(re => re.test(line))) {
            return { ok: false, line: i + 1, message: '未知語法或格式錯誤' };
        }
    }
    return { ok: true };
}

function validateCompiledStory(story) {
    if (!story || typeof story !== 'object') return { ok: false, message: '故事結構不正確' };
    const pageCount = story && story.pages ? Object.keys(story.pages).length : 0;
    if (pageCount > MAX_PAGES) {
        return { ok: false, message: '頁數超過限制（最多 ' + MAX_PAGES + ' 頁）' };
    }
    // check text length per segment
    let hasEnding = false;
    for (const pid of Object.keys(story.pages || {})) {
        const page = story.pages[pid];
        if (page && page.isEnding) hasEnding = true;
        if (Array.isArray(page && page.content)) {
            for (const item of page.content) {
                if (typeof item.text === 'string' && item.text.length > MAX_TEXT_SEGMENT) {
                    return { ok: false, message: '第 ' + pid + ' 頁內文過長（每段最多 ' + MAX_TEXT_SEGMENT + ' 字）' };
                }
            }
        }
        if (page && page.isEnding && Array.isArray(page.endings)) {
            for (const ed of page.endings) {
                if (typeof ed.text === 'string' && ed.text.length > MAX_TEXT_SEGMENT) {
                    return { ok: false, message: '第 ' + pid + ' 頁結局文字過長（每段最多 ' + MAX_TEXT_SEGMENT + ' 字）' };
                }
            }
        }
    }
    if (!hasEnding) {
        return { ok: false, message: '必須至少包含一個結局頁（[ending]）。' };
    }
    return { ok: true };
}

// ---- Command handler ----
const rollDiceCommand = async function ({
    // inputStr,
    mainMsg,
    groupid,
    userid,
    // userrole,
    botname,
    displayname,
    channelid,
    discordClient,
    discordMessage
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };

    const sub = (mainMsg[1] || '').toLowerCase();
    const ctx = { groupid, channelid, userid };

    switch (true) {
        case !sub || /^help$/.test(sub): {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            rply.buttonCreate = ['.st mylist'];
            return rply;
        }
        case /^importfile$/.test(sub): {
            rply.text = '此指令已停用。請使用：.st import <alias> [title] 並附加檔案（.json 或 .txt）';
            return rply;
        }
        case /^import$/.test(sub): {
            // Discord only restriction
            if (String(botname || '').toLowerCase() !== 'discord') {
                rply.text = '此功能僅在 Discord 上可用。';
                return rply;
            }
            // .st import <alias> [title] with attachment
            const aliasArg = (mainMsg[2] || '').trim();
            const customTitle = (mainMsg.slice(3).join(' ') || '').trim();
            // Get attachment (Discord only)
            const att = await getAttachmentInfo(discordMessage, discordClient);
            if (!att || !att.url) {
                rply.text = '未偵測到附件。請附加 .json 或 .txt 檔案後再試。';
                return rply;
            }
            if (att.size > 0 && att.size > MAX_UPLOAD_BYTES) {
                rply.text = '檔案過大（上限約 ' + Math.round(MAX_UPLOAD_BYTES / 1024) + 'KB）。請縮小後再上傳。';
                return rply;
            }
            let rawText = '';
            try {
                rawText = await downloadText(att.url);
            } catch (error) {
                rply.text = '下載附件失敗：' + (error.message || '');
                return rply;
            }

            const filename = String(att.filename || '').toLowerCase();
            const isLikelyJson = /\.json$/.test(filename) || /json/i.test(att.contentType || '');
            let compiled = null;
            let parseErrorLine = null;
            try {
                if (isLikelyJson) {
                    const obj = JSON.parse(rawText);
                    compiled = obj && obj.type === 'story' ? obj : obj;
                } else {
                    // Validate RUN_DESIGN syntax lines first
                    const lineCheck = validateRunDesignLines(rawText);
                    if (!lineCheck.ok) {
                        rply.text = '上傳失敗：第 ' + lineCheck.line + ' 行格式有誤（' + lineCheck.message + '）';
                        return rply;
                    }
                    compiled = compileRunDesignToStory(rawText, { alias: aliasArg || (filename.replace(/\.[^.]+$/, '') || ''), title: customTitle });
                }
            } catch (error) {
                parseErrorLine = estimateJsonErrorLine(rawText, error);
                rply.text = '上傳失敗：無法解析檔案' + (parseErrorLine ? ('（第 ' + parseErrorLine + ' 行）') : '') + '。';
                return rply;
            }

            // Normalize title/alias
            const alias = (aliasArg || filename.replace(/\.[^.]+$/, '') || 'untitled').trim();
            if (!alias) {
                rply.text = '請提供 alias 或者將檔名設定為可作為 alias 的名稱。';
                return rply;
            }
            if (customTitle) compiled.title = customTitle;
            if (!compiled.title) compiled.title = alias;
            compiled.type = 'story';
            compiled.ownerId = userid;

            // Validation: pages and segment lengths
            const v = validateCompiledStory(compiled);
            if (!v.ok) { rply.text = '上傳失敗：' + v.message; return rply; }

            // Enforce alias uniqueness across all users
            let isUpdate = false;
            let currentCount = 0;
            let existingDoc = null;
            try {
                if (db.story && typeof db.story.findOne === 'function') {
                    existingDoc = await db.story.findOne({ alias }).lean();
                    if (existingDoc) {
                        if (String(existingDoc.ownerID) !== String(userid)) {
                            rply.text = '此 alias 已被其他使用者使用：' + alias;
                            return rply;
                        }
                        isUpdate = true;
                    }
                    currentCount = await db.story.countDocuments({ ownerID: userid });
                } else {
                    // filesystem fallback: count files owned by this user
                    const dir = path.join(__dirname, 'storyTeller');
                    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.json$/i.test(f)) : [];
                    for (const f of files) {
                        try {
                            const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
                            if (obj && obj.ownerId === userid) currentCount++;
                            if (String(f).replace(/\.[^.]+$/, '') === alias) {
                                if (obj && String(obj.ownerId) !== String(userid)) {
                                    rply.text = '此 alias 已被其他使用者使用：' + alias;
                                    return rply;
                                }
                                isUpdate = true;
                            }
                        } catch { }
                    }
                }
            } catch { /* ignore */ }
            if (!isUpdate) {
                let levelIndex = 0;
                try { levelIndex = (typeof VIP.viplevelCheckUser === 'function') ? await VIP.viplevelCheckUser(userid) : 0; } catch { levelIndex = 0; }
                const limit = STORY_LIMIT_BY_LEVEL[Math.max(0, Math.min(STORY_LIMIT_BY_LEVEL.length - 1, Number(levelIndex) || 0))];
                if (currentCount >= limit) {
                    rply.text = '你目前的劇本數已達上限（' + limit + '）。若需新增更多，請升級會員或刪除既有劇本。';
                    return rply;
                }
            }

            // Persist
            if (db.story && typeof db.story.findOneAndUpdate === 'function') {
                // If exists and belongs to user -> update; else create new
                const filter = { ownerID: userid, alias };
                const update = {
                    ownerID: userid,
                    ownerName: (typeof displayname === 'string' ? displayname : ''),
                    alias,
                    title: compiled.title,
                    type: 'story',
                    payload: compiled,
                    startPermission: 'AUTHOR_ONLY',
                    allowedGroups: [],
                    isActive: true
                };
                await db.story.findOneAndUpdate(filter, update, { upsert: !existingDoc });
            }
            try {
                const outPath = path.join(__dirname, 'storyTeller', alias + '.json');
                fs.mkdirSync(path.dirname(outPath), { recursive: true });
                fs.writeFileSync(outPath, JSON.stringify(compiled, null, 2), 'utf8');
            } catch { /* ignore */ }

            rply.text = '已匯入劇本：' + (compiled.title || alias) + '（alias: ' + alias + '）';
            rply.buttonCreate = ['.st start ' + alias];
            return rply;
        }
        case /^update$/.test(sub): {
            // Discord only restriction
            if (String(botname || '').toLowerCase() !== 'discord') {
                rply.text = '此功能僅在 Discord 上可用。';
                return rply;
            }
            // .st update <alias> [title] with attachment
            const alias = (mainMsg[2] || '').trim();
            const customTitle = (mainMsg.slice(3).join(' ') || '').trim();
            if (!alias) { rply.text = '用法：.st update <alias>（需附加檔案）'; return rply; }
            // Ensure alias exists and belongs to user
            if (db.story && typeof db.story.findOne === 'function') {
                const doc = await db.story.findOne({ alias }).lean();
                if (!doc) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
                if (String(doc.ownerID) !== String(userid)) { rply.text = '你沒有權限更新此劇本。'; return rply; }
            } else {
                const p = path.join(__dirname, 'storyTeller', alias + '.json');
                if (!fs.existsSync(p)) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
                try {
                    const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
                    if (obj && String(obj.ownerId) !== String(userid)) { rply.text = '你沒有權限更新此劇本。'; return rply; }
                } catch { /* ignore parse errors; allow overwrite if file exists and owner matches unknown */ }
            }

            // Attachment
            const att = await getAttachmentInfo(discordMessage, discordClient);
            if (!att || !att.url) { rply.text = '未偵測到附件。請附加 .json 或 .txt 檔案後再試。'; return rply; }
            if (att.size > 0 && att.size > MAX_UPLOAD_BYTES) { rply.text = '檔案過大（上限約 ' + Math.round(MAX_UPLOAD_BYTES / 1024) + 'KB）。請縮小後再上傳。'; return rply; }
            let rawText = '';
            try { rawText = await downloadText(att.url); } catch (error) { rply.text = '下載附件失敗：' + (error.message || ''); return rply; }
            const isLikelyJson = /\.json$/i.test(String(att.filename || '')) || /json/i.test(att.contentType || '');
            let compiled = null;
            try {
                if (isLikelyJson) {
                    const obj = JSON.parse(rawText);
                    compiled = obj && obj.type === 'story' ? obj : obj;
                } else {
                    const lineCheck = validateRunDesignLines(rawText);
                    if (!lineCheck.ok) { rply.text = '上傳失敗：第 ' + lineCheck.line + ' 行格式有誤（' + lineCheck.message + '）'; return rply; }
                    compiled = compileRunDesignToStory(rawText, { alias, title: customTitle });
                }
            } catch (error) {
                const parseErrorLine = estimateJsonErrorLine(rawText, error);
                rply.text = '上傳失敗：無法解析檔案' + (parseErrorLine ? ('（第 ' + parseErrorLine + ' 行）') : '') + '。';
                return rply;
            }
            if (customTitle) compiled.title = customTitle;
            if (!compiled.title) compiled.title = alias;
            compiled.type = 'story';
            compiled.ownerId = userid;
            const v = validateCompiledStory(compiled);
            if (!v.ok) { rply.text = '更新失敗：' + v.message; return rply; }

            // Persist strictly as update (no create)
            if (db.story && typeof db.story.findOneAndUpdate === 'function') {
                const updated = await db.story.findOneAndUpdate(
                    { ownerID: userid, alias },
                    {
                        ownerID: userid,
                        ownerName: (typeof displayname === 'string' ? displayname : ''),
                        alias,
                        title: compiled.title,
                        type: 'story',
                        payload: compiled,
                        isActive: true
                    },
                    { new: true }
                );
                if (!updated) { rply.text = '更新失敗：未找到可更新的劇本。'; return rply; }
            }
            try {
                const outPath = path.join(__dirname, 'storyTeller', alias + '.json');
                fs.mkdirSync(path.dirname(outPath), { recursive: true });
                fs.writeFileSync(outPath, JSON.stringify(compiled, null, 2), 'utf8');
            } catch { /* ignore */ }
            rply.text = '已更新劇本：' + (compiled.title || alias) + '（alias: ' + alias + '）';
            rply.buttonCreate = ['.st start ' + alias];
            return rply;
        }
        case /^delete$/.test(sub): {
            const alias = (mainMsg[2] || '').trim();
            if (!alias) { rply.text = '用法：.st delete <alias>'; return rply; }
            // Verify ownership
            if (db.story && typeof db.story.findOne === 'function') {
                const doc = await db.story.findOne({ alias }).lean();
                if (!doc) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
                if (String(doc.ownerID) !== String(userid)) { rply.text = '你沒有權限刪除此劇本。'; return rply; }
                if (typeof db.story.findOneAndDelete === 'function') {
                    await db.story.findOneAndDelete({ alias, ownerID: userid });
                }
            }
            // Delete filesystem copy
            try {
                const p1 = path.join(__dirname, 'storyTeller', alias + '.json');
                if (fs.existsSync(p1)) fs.unlinkSync(p1);
                const p2 = path.join(__dirname, 'storyTeller', alias);
                if (fs.existsSync(p2)) fs.unlinkSync(p2);
            } catch { /* ignore */ }
            rply.text = '已刪除劇本（alias: ' + alias + '）';
            rply.buttonCreate = ['.st mylist'];
            return rply;
        }
        case /^start$/.test(sub): {
            // Support optional policy arg: .st start <alias|title> [alone|all|poll x]
            const arg2 = (mainMsg[2] || '').trim();
            const rest = mainMsg.slice(3).map(s => String(s || '').trim());
            let key = '';
            let requestedPolicy = '';
            let requestedPollMinutes = 0;
            if (rest.length > 0 && (/^(alone|all|poll)$/i).test(rest[0])) {
                key = arg2;
                const p0 = rest[0].toLowerCase();
                if (p0 === 'alone' || p0 === 'all') requestedPolicy = p0;
                else if (p0 === 'poll') {
                    // Discord only restriction for poll mode
                    if (String(botname || '').toLowerCase() !== 'discord') {
                        rply.text = '投票模式僅在 Discord 上可用。';
                        return rply;
                    }
                    requestedPolicy = 'poll';
                    requestedPollMinutes = Number(rest[1]) || 3;
                }
            } else {
                key = (mainMsg.slice(2).join(' ') || '').trim();
            }
            let run = await getActiveRun(ctx);
            // Allow starting a new game even if there is a paused run in this context
            // Keep paused run intact and do not block starting

            if (key) {
                // Start requested with explicit story key
                const resolved = await resolveStoryForStart({ ownerID: userid, aliasOrTitle: key });
                if (!resolved.story) { rply.text = '找不到該劇本：' + key; return rply; }
                if (resolved.storyDoc) {
                    const allow = canStartStory(resolved.storyDoc, { userid, groupid });
                    if (!allow.ok) { rply.text = '無法啟動：' + (allow.reason || '權限不足'); return rply; }
                }
                if (run && !run.isEnded) {
                    if ((run.storyAlias || '').toLowerCase() !== (resolved.alias || '').toLowerCase()) {
                        rply.text = '目前此頻道已有進行中的故事：' + (run.storyAlias || '-') + '。請先輸入 .st end 或 .st pause 後再啟動新劇本。';
                        rply.buttonCreate = ['.st end', '.st pause'];
                        return rply;
                    }
                    // Same story: continue
                    const cur = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
                    const story = cur.story;
                    if (!story) { rply.text = '找不到故事內容，請重新開始。'; return rply; }
                    ensureRunDefaults(run, story);
                    const missing = getMissingPlayerVariables(story, run);
                    if (missing.length > 0) {
                        rply.text = renderPlayerSetupPrompt(story, run);
                    } else {
                        const text = renderPageText(story, run, run.currentPageId);
                        rply.text = '已載入當前進度：\n' + text;
                        attachChoicesOutput({ rply, story, run, botname });
                    }
                    await saveRun(ctx, run);
                    return rply;
                }
                // Create new run for resolved story
                const storyDoc = resolved.storyDoc;
                const story = resolved.story;
                // Enforce per-user open runs limit (including paused) only when creating a new run
                try {
                    let levelIndex = 0;
                    try { levelIndex = (typeof VIP.viplevelCheckUser === 'function') ? await VIP.viplevelCheckUser(userid) : 0; } catch { levelIndex = 0; }
                    const limit = STORY_LIMIT_BY_LEVEL[Math.max(0, Math.min(STORY_LIMIT_BY_LEVEL.length - 1, Number(levelIndex) || 0))];
                    const openCnt = await countOpenRunsByStarter(userid);
                    if (openCnt >= limit) {
                        rply.text = '你目前開啟中的遊戲局數（含暫停）已達上限（' + limit + '）。請先結束部分遊戲後再試或提升VIP等級。';
                        return rply;
                    }
                } catch { /* ignore and proceed */ }
                run = await createRun({ storyDoc, story, context: ctx, starterID: userid, starterName: displayname || '', botname });
                if (requestedPolicy) {
                    switch (requestedPolicy) {
                        case 'alone':
                            run.participantPolicy = 'ALONE';
                            break;
                        case 'all':
                            run.participantPolicy = 'ANYONE';
                            break;
                        case 'poll':
                            run.participantPolicy = 'POLL';
                            run.pollMinutes = requestedPollMinutes || 3;
                            run.variables = run.variables || {};
                            run.variables.__pollMinutes = run.pollMinutes;
                            break;
                        default:
                            break;
                    }
                }
                run.storyAlias = resolved.alias || (storyDoc ? storyDoc.alias : key);
                const missing = getMissingPlayerVariables(story, run);
                let text = '';
                if (missing.length > 0) text = renderPlayerSetupPrompt(story, run);
                else {
                    text = renderPageText(story, run, run.currentPageId);
                    attachChoicesOutput({ rply, story, run, botname });
                }
                await saveRun(ctx, run);
                rply.text = text;
                return rply;
            }

            // No key provided: continue existing run if any, otherwise ask for key
            if (run && !run.isEnded) {
                if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
                const cur = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
                const story = cur.story;
                if (!story) { rply.text = '找不到故事內容，請重新開始。'; return rply; }
                ensureRunDefaults(run, story);
                const missing = getMissingPlayerVariables(story, run);
                if (missing.length > 0) {
                    rply.text = renderPlayerSetupPrompt(story, run);
                } else {
                    const text = renderPageText(story, run, run.currentPageId);
                    rply.text = '已載入當前進度：\n' + text;
                    attachChoicesOutput({ rply, story, run, botname });
                }
                await saveRun(ctx, run);
                return rply;
            }
            rply.text = '請輸入 .st start <alias|title> 開始，或使用 .st mylist 檢視清單。';
            rply.buttonCreate = ['.st mylist'];
            return rply;
        }
        case /^pause$/.test(sub): {
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
            run.isPaused = true;
            run.pausedAt = new Date();
            await saveRun(ctx, run);
            rply.text = '已暫停（ID：' + (run._id || '-') + '），使用 .st continue ' + (run._id || '') + ' 可繼續。';
            // Provide a continue button for convenience
            rply.buttonCreate = ['.st continue ' + (run._id || '')];
            return rply;
        }
        case /^continue$/.test(sub): {
            const id = (mainMsg[2] || '').trim();
            const activeRun = await getActiveRun(ctx);
            if (id) {
                // Block resuming another game if one is already active in this context
                if (activeRun && !activeRun.isEnded && !activeRun.isPaused && String(activeRun._id) !== String(id)) {
                    rply.text = '目前此頻道已有進行中的故事：' + (activeRun.storyAlias || '-') + '。請先輸入 .st end 或 .st pause 後再繼續其他遊戲。';
                    rply.buttonCreate = ['.st end', '.st pause'];
                    return rply;
                }
                // If the requested id is the same as the active run, just re-render current output without changing state
                if (activeRun && String(activeRun._id) === String(id)) {
                    const { story } = await loadStoryByAlias(activeRun.storyOwnerID || userid, activeRun.storyAlias);
                    if (!story) { rply.text = '找不到故事內容，請重新開始。'; return rply; }
                    const text = renderPageText(story, activeRun, activeRun.currentPageId);
                    rply.text = '已載入當前進度：\n' + text;
                    attachChoicesOutput({ rply, story, run: activeRun, botname });
                    return rply;
                }
                // Resume by id
                let run = null;
                if (db.storyRun && typeof db.storyRun.findById === 'function') {
                    run = await db.storyRun.findById(id);
                    if (!run) { rply.text = '找不到該遊戲ID。'; return rply; }
                    // Enforce same channel/group
                    if ((channelid && String(run.channelID) !== String(channelid)) || (!channelid && groupid && String(run.groupID) !== String(groupid))) {
                        rply.text = '此遊戲不在目前頻道/群組中。';
                        return rply;
                    }
                    if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
                } else {
                    // memory fallback: only current context
                    run = memoryRuns.get(getContextKey(ctx));
                    if (!run || String(run._id) !== id) { rply.text = '找不到該遊戲ID於此頻道。'; return rply; }
                    if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
                }
                if (run.isEnded) { rply.text = '此遊戲已結束。'; return rply; }
                // Resume
                run.isPaused = false;
                const { story } = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
                if (!story) { rply.text = '找不到故事內容，請重新開始。'; return rply; }
                const text = renderPageText(story, run, run.currentPageId);
                await saveRun(ctx, run);
                rply.text = text;
                attachChoicesOutput({ rply, story, run, botname });
                return rply;
            }
            // Without id: show last output for active run without state changes
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            const { story } = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
            if (!story) { rply.text = '找不到故事內容，請重新開始。'; return rply; }
            // Create a minimal plain-object view to avoid mutating the active run and avoid cloning errors
            const runView = {
                variables: Object.assign({}, run.variables || {}),
                stats: Object.assign({}, run.stats || {}),
                playerVariables: Object.assign({}, run.playerVariables || {}),
                currentPageId: String(run.currentPageId || '0'),
                __statsLocked: !!run.__statsLocked
            };
            const text = renderPageText(story, runView, runView.currentPageId);
            rply.text = '已載入當前進度：\n' + text;
            attachChoicesOutput({ rply, story, run, botname });
            return rply;
        }
        case /^end$/.test(sub): {
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
            const { story } = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
            // If on an ending page, capture endingId/text
            try {
                const page = story && story.pages ? story.pages[run.currentPageId] : null;
                if (page && page.isEnding) {
                    run.endingId = String(run.currentPageId || '');
                    run.endingTitle = page && page.title ? String(page.title) : '';
                    const scope = buildEvalScope(run);
                    const ctx2 = Object.assign({}, scope);
                    if (Array.isArray(page.endings)) {
                        for (const ed of page.endings) {
                            if (!ed.condition || safeEvalCondition(ed.condition, scope)) {
                                run.endingText = interpolate(ed.text || '', ctx2);
                                break;
                            }
                        }
                    }
                } else if (!run.endingId) {
                    run.endingId = '';
                    run.endingTitle = '';
                }
            } catch { /* ignore */ }
            run.isEnded = true;
            run.endedAt = new Date();
            await saveRun(ctx, run);
            const title = story && story.title ? story.title : '故事';
            const started = run.createdAt ? new Date(run.createdAt) : new Date();
            const ended = run.endedAt ? new Date(run.endedAt) : new Date();
            const fmt = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
            };
            rply.text = '已結束本次故事。\n' +
                '標題：' + title + '\n' +
                '開始時間：' + fmt(started) + '\n' +
                '結束時間：' + fmt(ended);
            rply.buttonCreate = ['.st mylist'];
            return rply;
        }
        case /^goto$/.test(sub): {
            const target = (mainMsg[2] || '').trim();
            if (!target) { rply.text = '請提供頁面ID，例如 .st goto 1'; return rply; }
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '請先使用 .st start 開始故事。'; return rply; }
            if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
            const { story } = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
            const missing = getMissingPlayerVariables(story, run);
            if (missing.length > 0) { rply.text = renderPlayerSetupPrompt(story, run); return rply; }
            // Enforce allowed choices from current page only
            const currentPage = story.pages[run.currentPageId];
            if (!currentPage) { rply.text = '目前頁面不存在，請重新開始。'; return rply; }
            const scope = buildEvalScope(run);
            const allowedChoices = Array.isArray(currentPage.choices)
                ? currentPage.choices.filter(c => !c.condition || safeEvalCondition(c.condition, scope))
                : [];
            // Support for 2a, 2b, 2c format: check if target is valid
            const targetStr = String(target || '');
            const basePageMatch = targetStr.match(/^(\d+)([a-z])?$/i);
            let isValidTarget = false;
            let actualTargetPage = target;
            
            if (basePageMatch) {
                const basePage = basePageMatch[1];
                const suffix = basePageMatch[2] || '';
                
                // Check if the target matches any allowed choice
                for (const c of allowedChoices) {
                    const choiceAction = String(c.action || '');
                    const choiceMatch = choiceAction.match(/^(\d+)([a-z])?$/i);
                    
                    if (choiceMatch) {
                        const choiceBasePage = choiceMatch[1];
                        const choiceSuffix = choiceMatch[2] || '';
                        
                        // Exact match
                        if (choiceAction.toUpperCase() === targetStr.toUpperCase()) {
                            isValidTarget = true;
                            // For 2a, 2b, 2c format, use base page for actual navigation
                            if (suffix) {
                                actualTargetPage = basePage;
                            }
                            break;
                        }
                        
                        // Base page + suffix match
                        if (choiceBasePage === basePage && choiceSuffix === suffix) {
                            isValidTarget = true;
                            // For 2a, 2b, 2c format, use base page for actual navigation
                            if (suffix) {
                                actualTargetPage = basePage;
                            }
                            break;
                        }
                        
                        // Base page only match (for cases like 2a going to 2)
                        if (choiceBasePage === basePage && !suffix) {
                            isValidTarget = true;
                            actualTargetPage = basePage;
                            break;
                        }
                    }
                }
            } else {
                // For non-matching format, use original logic
                const allowedActions = allowedChoices.map(c => String(c.action).toUpperCase());
                const targetUpper = String(target).toUpperCase();
                isValidTarget = allowedActions.includes(targetUpper);
            }
            
            if (!isValidTarget) {
                let msg = '只能前往當前頁面的可選項目。\n\n可用選項：\n';
                for (const c of allowedChoices) {
                    const a = String(c.action || '').toUpperCase();
                    if (a === 'END') msg += '- ' + c.text + '（.st end）\n';
                    else msg += '- ' + c.text + '（.st goto ' + c.action + '）\n';
                }
                rply.text = msg.trim();
                const btns = [];
                for (const c of allowedChoices) {
                    const a = String(c.action || '').toUpperCase();
                    if (a === 'END') btns.push('.st end');
                    else btns.push('.st goto ' + c.action);
                }
                rply.buttonCreate = [...new Set(btns)].slice(0, 20);
                return rply;
            }
            
            // Check if the actual target page exists
            const targetUpper = String(actualTargetPage).toUpperCase();
            if (targetUpper !== 'END' && !story.pages[actualTargetPage]) { 
                rply.text = '找不到此頁面ID：' + actualTargetPage + '。可用頁面：' + Object.keys(story.pages).join(', '); 
                return rply; 
            }
            await gotoPage({ story, run, targetPageId: target });
            const text = renderPageText(story, run, run.currentPageId);
            await saveRun(ctx, run);
            rply.text = text;
            attachChoicesOutput({ rply, story, run, botname });
            return rply;
        }
        case /^set$/.test(sub): {
            const field = (mainMsg[2] || '').toLowerCase();
            const value = (mainMsg.slice(3).join(' ') || '').trim();
            if (!field || !value) { rply.text = '用法：.st set name 小花 或 .st set owner_name 阿明'; return rply; }
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '請先使用 .st start 開始故事。'; rply.buttonCreate = ['.st start']; return rply; }
            if (!userCanActOnRun(run, userid)) { rply.text = '此局設定為僅發起者可參與。'; return rply; }
            // Map common aliases
            let key = field;
            if (field === 'name') key = 'cat_name';
            run.playerVariables = run.playerVariables || {};
            run.playerVariables[key] = value;
            // Load the current story by alias instead of default 03, so prompts match the active story
            let storyRef = null;
            try {
                const cur = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
                storyRef = cur && cur.story ? cur.story : null;
            } catch { storyRef = null; }
            if (!storyRef) {
                await saveRun(ctx, run);
                rply.text = '已設定 ' + key + ' = ' + value + '\n\n目前沒有載入中的劇本內容，請使用 .st start <alias> 重新載入。';
                return rply;
            }
            ensureRunDefaults(run, storyRef);
            const missing = getMissingPlayerVariables(storyRef, run);
            if (missing.length > 0) {
                const prompt = renderPlayerSetupPrompt(storyRef, run);
                rply.text = '已設定 ' + key + ' = ' + value + '\n\n' + prompt;
                await saveRun(ctx, run);
            } else {
                // All player variables are set, automatically start the game
                const text = renderPageText(storyRef, run, run.currentPageId);
                rply.text = '已設定 ' + key + ' = ' + value + '\n\n遊戲開始！\n\n' + text;
                // Persist any [set] effects applied during renderPageText (e.g., initial stats)
                await saveRun(ctx, run);
                attachChoicesOutput({ rply, story: storyRef, run, botname });
            }
            return rply;
        }
        case /^debug$/.test(sub): {
            const run = await getActiveRun(ctx);
            const { story } = await loadStoryByAlias(run && (run.storyOwnerID || userid) || userid, run && run.storyAlias || '');
            const fmt = (d) => {
                if (!d) return '-';
                const date = new Date(d);
                const pad = (n) => String(n).padStart(2, '0');
                return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
            };
            const safeJson = (obj) => {
                try { return JSON.stringify(obj || {}, null, 0); } catch { return '{}'; }
            };
            let text = '【Debug】\n';
            text += 'Context:\n';
            text += '- groupID: ' + (groupid || '-') + '\n';
            text += '- channelID: ' + (channelid || '-') + '\n';
            text += '- userID: ' + (userid || '-') + '\n';
            text += '- botname: ' + (botname || '-') + '\n';
            text += '\nStory:\n';
            text += '- title: ' + ((story && story.title) || '-') + '\n';
            text += '- alias: ' + (run && run.storyAlias || '-') + '\n';
            text += '- ownerID: ' + ((run && run.storyOwnerID) || userid || '-') + '\n';
            if (!run) {
                text += '\nRun: (no active run)\n';
                rply.text = text;
                return rply;
            }
            text += '\nRun:\n';
            text += '- runId: ' + (run._id || '-') + '\n';
            text += '- starterID: ' + (run.starterID || '-') + '\n';
            text += '- starterName: ' + (run.starterName || '-') + '\n';
            text += '- createdAt: ' + fmt(run.createdAt) + '\n';
            text += '- endedAt: ' + fmt(run.endedAt) + '\n';
            text += '- isEnded: ' + (!!run.isEnded) + '\n';
            text += '- currentPageId: ' + (run.currentPageId || '-') + (story && story.pages && story.pages[run.currentPageId] && story.pages[run.currentPageId].title ? (' (' + story.pages[run.currentPageId].title + ')') : '') + '\n';
            text += '- participantPolicy: ' + (run.participantPolicy || '-') + '\n';
            text += '- allowedUserIDs: ' + ((run.allowedUserIDs && run.allowedUserIDs.length > 0) ? run.allowedUserIDs.length : 0) + '\n';
            text += '- startPermissionAtRun: ' + (run.startPermissionAtRun || '-') + '\n';
            text += '- variables: ' + safeJson(run.variables) + '\n';
            text += '- stats: ' + safeJson(run.stats) + '\n';
            text += '- playerVariables: ' + safeJson(run.playerVariables) + '\n';
            text += '- history length: ' + ((run.history && run.history.length > 0) ? run.history.length : 0) + '\n';
            rply.text = text;
            return rply;
        }
        // importfile deprecated above
        case /^exportfile$/.test(sub): {
            // Discord only restriction
            if (String(botname || '').toLowerCase() !== 'discord') {
                rply.text = '此功能僅在 Discord 上可用。';
                return rply;
            }
            const alias = (mainMsg[2] || '').trim();
            if (!alias) { rply.text = '用法：.st exportfile <alias>'; return rply; }
            const { story } = await loadStoryByAlias(userid, alias);
            if (!story) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
            if (story.ownerId && String(story.ownerId) !== String(userid)) { rply.text = '你沒有權限匯出此劇本。'; return rply; }
            const txt = exportStoryToRunDesign(story);
            try {
                const safeAlias = String(alias).replaceAll(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'story';
                const outDir = path.join(process.cwd(), 'temp');
                fs.mkdirSync(outDir, { recursive: true });
                const outFile = path.join(outDir, safeAlias + '_RUN_DESIGN.txt');
                fs.writeFileSync(outFile, txt, 'utf8');
                rply.text = `已將『${alias}』的 RUN_DESIGN 以私訊傳送給你。`;
                rply.dmFileText = `『${alias}』的 RUN_DESIGN`;
                rply.dmFileLink = [outFile];
            } catch (error) {
                rply.text = '輸出失敗：' + error.message;
                return rply;
            }
            return rply;
        }
        case /^verify$/.test(sub): {
            const alias = (mainMsg[2] || '').trim();
            if (!alias) { rply.text = '用法：.st verify <alias>'; return rply; }
            const { story } = await loadStoryByAlias(userid, alias);
            if (!story) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
            if (story.ownerId && String(story.ownerId) !== String(userid)) { rply.text = '你沒有權限驗證此劇本。'; return rply; }
            const txt = exportStoryToRunDesign(story);
            const recompiled = compileRunDesignToStory(txt, { alias, title: story.title });
            const norm = (obj) => JSON.stringify(obj);
            const same = norm(story) === norm(recompiled);
            rply.text = same ? 'verify: OK（可逆）' : 'verify: 差異（可能存在未支援元素）';
            return rply;
        }
        case /^list$/.test(sub): {
            const aliasFilter = (mainMsg[2] || '').trim();
            const rows = [];
            if (db.story && typeof db.story.find === 'function') {
                if (aliasFilter) {
                    const found = await db.story.findOne({ alias: aliasFilter, isActive: { $ne: false } }).lean();
                    if (found) rows.push({ title: found.title || '-', alias: found.alias || '-', introduction: found.payload && found.payload.introduction || '', startPermission: found.startPermission || '-' });
                } else {
                    const all = await db.story.find({ isActive: { $ne: false } }).lean();
                    for (const s of all) {
                        const allow = canStartStory(s, { userid, groupid });
                        if (allow.ok) rows.push({ title: s.title || '-', alias: s.alias || '-', introduction: s.payload && s.payload.introduction || '', startPermission: s.startPermission || '-' });
                    }
                }
            } else {
                const dir = path.join(__dirname, 'storyTeller');
                const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /(\.json)$/i.test(f)) : [];
                for (const f of files) {
                    const alias = f.replace(/\.[^.]+$/, '');
                    if (aliasFilter && alias !== aliasFilter) continue;
                    let intro = '';
                    try { const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); intro = obj && obj.introduction || ''; } catch { }
                    rows.push({ title: alias, alias, introduction: intro, startPermission: 'ANYONE' });
                }
            }
            if (aliasFilter) {
                if (rows.length === 0) { rply.text = '找不到該劇本（alias: ' + aliasFilter + '）'; return rply; }
                const item = rows[0];
                rply.text = '【' + item.title + '】\n' + (item.introduction || '(無簡介)');
                rply.buttonCreate = ['.st start ' + item.alias];
                return rply;
            }
            let text = '【可啟動的劇本】\n';
            if (rows.length === 0) text += '(沒有資料)';
            else {
                for (const r of rows) {
                    text += '- ' + r.title + ' (alias: ' + r.alias + ')\n';
                    try {
                        const intro = String(r.introduction || '').trim();
                        if (intro) {
                            const first = intro.split(/\r?\n/)[0] || '';
                            const preview = first.length > 80 ? (first.slice(0, 80) + '…') : first;
                            text += '  - ' + preview + '\n';
                        }
                    } catch { /* ignore */ }
                }
            }
            rply.text = text.trim();
            if (rows.length > 0) rply.buttonCreate = [...new Set(rows.map(r => '.st start ' + r.alias))].slice(0, 20);
            return rply;
        }
        case /^allow$/.test(sub): {
            const alias = (mainMsg[2] || '').trim();
            const arg3 = (mainMsg[3] || '').trim();
            const moreGroupIds = mainMsg.slice(3).filter(Boolean);
            if (!alias) { rply.text = '用法：.st allow <alias> AUTHOR|all|[在群組中空白]|<groupId...>'; return rply; }
            if (db.story && typeof db.story.findOneAndUpdate === 'function') {
                const doc = await db.story.findOne({ alias }).lean();
                if (!doc) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
                if (String(doc.ownerID) !== String(userid)) { rply.text = '你沒有權限變更此劇本設定。'; return rply; }
                if (/^author$/i.test(arg3)) {
                    await db.story.findOneAndUpdate({ alias }, { startPermission: 'AUTHOR_ONLY', allowedGroups: [] }, { new: true });
                    rply.text = '已設定僅作者可啟動（alias: ' + alias + '）';
                    return rply;
                }
                if (/^all$/i.test(arg3)) {
                    await db.story.findOneAndUpdate({ alias }, { startPermission: 'ANYONE', allowedGroups: [] }, { new: true });
                    rply.text = '已設定任何人可啟動（alias: ' + alias + '）';
                    return rply;
                }
                let groups = Array.isArray(doc.allowedGroups) ? [...doc.allowedGroups] : [];
                if (moreGroupIds.length > 0) {
                    for (const gid of moreGroupIds) if (!groups.includes(gid)) groups.push(gid);
                } else {
                    if (!groupid) { rply.text = '請在群組或頻道中使用 .st allow，或指定 groupId。'; return rply; }
                    if (!groups.includes(groupid)) groups.push(groupid);
                }
                await db.story.findOneAndUpdate({ alias }, { startPermission: 'GROUP_ONLY', allowedGroups: groups }, { new: true });
                rply.text = '已設定允許的群組/頻道（alias: ' + alias + '）：' + groups.join(', ');
                return rply;
            }
            // files fallback
            try {
                const p = path.join(__dirname, 'storyTeller', alias + '.json');
                if (!fs.existsSync(p)) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
                const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
                if (obj && String(obj.ownerId) !== String(userid)) { rply.text = '你沒有權限變更此劇本設定。'; return rply; }
                obj._meta = obj._meta || {};
                if (/^author$/i.test(arg3)) { obj._meta.startPermission = 'AUTHOR_ONLY'; obj._meta.allowedGroups = []; }
                else if (/^all$/i.test(arg3)) { obj._meta.startPermission = 'ANYONE'; obj._meta.allowedGroups = []; }
                else {
                    obj._meta.startPermission = 'GROUP_ONLY';
                    obj._meta.allowedGroups = Array.isArray(obj._meta.allowedGroups) ? obj._meta.allowedGroups : [];
                    if (moreGroupIds.length > 0) { for (const gid of moreGroupIds) if (!obj._meta.allowedGroups.includes(gid)) obj._meta.allowedGroups.push(gid); }
                    else { if (!groupid) { rply.text = '請在群組或頻道中使用 .st allow，或指定 groupId。'; return rply; } if (!obj._meta.allowedGroups.includes(groupid)) obj._meta.allowedGroups.push(groupid); }
                }
                fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
                rply.text = '已更新權限設定（alias: ' + alias + '）';
                return rply;
            } catch (error) { rply.text = '設定失敗：' + (error.message || ''); return rply; }
        }
        case /^game$/.test(sub): {
            // Show current running and paused games in this channel/group
            let text = '【當前遊戲】\n';
            const activeRun = await getActiveRun(ctx);
            if (activeRun) {
                const { story } = await loadStoryByAlias(activeRun.storyOwnerID || userid, activeRun.storyAlias);
                const fmt = (d) => {
                    const date = new Date(d);
                    const pad = (n) => String(n).padStart(2, '0');
                    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
                };
                text += '- 標題：' + ((story && story.title) || activeRun.storyAlias || '-') + '\n';
                text += '- alias：' + (activeRun.storyAlias || '-') + '\n';
                text += '- 發起人：' + (activeRun.starterName || activeRun.starterID || '-') + '\n';
                if (activeRun.createdAt) text += '- 發起時間：' + fmt(activeRun.createdAt) + '\n';
                text += '- 當前頁：' + (activeRun.currentPageId || '-') + '\n';
                text += (story && story.introduction) ? ('\n【簡介】\n' + story.introduction + '\n') : '';
            } else {
                text += '(無)\n';
            }
            text += '\n【暫停中的遊戲】\n';
            let paused = [];
            if (db.storyRun && typeof db.storyRun.find === 'function') {
                const query = { isEnded: false, isPaused: true };
                if (channelid) query.channelID = channelid; else if (groupid) query.groupID = groupid; else query.starterID = userid;
                const list = await db.storyRun.find(query).sort({ updatedAt: -1 }).lean();
                paused = list || [];
            } else {
                const r = memoryRuns.get(getContextKey(ctx));
                if (r && r.isPaused) paused = [r];
            }
            if (paused.length === 0) {
                text += '(無)';
            } else {
                const fmt = (d) => {
                    const date = new Date(d);
                    const pad = (n) => String(n).padStart(2, '0');
                    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
                };
                for (const p of paused) {
                    text += '- ID：' + (p._id || '-') + '，alias：' + (p.storyAlias || '-') + '\n';
                    text += '  - 發起人：' + (p.starterName || p.starterID || '-') + '\n';
                    if (p.createdAt) text += '  - 發起時間：' + fmt(p.createdAt) + '\n';
                    if (p.pausedAt) text += '  - 暫停時間：' + fmt(p.pausedAt) + '\n';
                }
            }
            rply.text = text.trim();
            // Build quick-reply buttons for all games
            const btns = [];
            if (activeRun) {
                const activeBtns = [];
                if (activeRun._id) activeBtns.push('.st continue ' + activeRun._id);
                activeBtns.push('.st end', '.st pause');
                btns.push.apply(btns, activeBtns);
            }
            if (paused && paused.length > 0) {
                const pausedBtns = [];
                for (const p of paused) {
                    if (p && p._id) pausedBtns.push('.st continue ' + p._id);
                }
                if (pausedBtns.length > 0) btns.push.apply(btns, pausedBtns);
            }
            if (btns.length > 0) rply.buttonCreate = [...new Set(btns)].slice(0, 20);
            return rply;
        }
        case /^edit$/.test(sub): {
            const mode = (mainMsg[2] || '').trim().toLowerCase();
            const maybeMinutes = Number(mainMsg[3]) || 0;
            if (mode !== 'alone' && mode !== 'all' && mode !== 'poll') { rply.text = '用法：.st edit alone|all|poll x'; return rply; }
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            if (String(run.starterID) !== String(userid)) { rply.text = '僅發起者可變更參與權限。'; return rply; }
            switch (mode) {
                case 'alone':
                    run.participantPolicy = 'ALONE';
                    break;
                case 'all':
                    run.participantPolicy = 'ANYONE';
                    break;
                case 'poll':
                    // Discord only restriction for poll mode
                    if (String(botname || '').toLowerCase() !== 'discord') {
                        rply.text = '投票模式僅在 Discord 上可用。';
                        return rply;
                    }
                    run.participantPolicy = 'POLL';
                    run.pollMinutes = maybeMinutes || run.pollMinutes || 3;
                    break;
                default:
                    break;
            }
            await saveRun(ctx, run);
            if (mode === 'poll') rply.text = '已設定參與權限為：投票（' + (run.pollMinutes || 3) + ' 分鐘）';
            else rply.text = '已設定參與權限為：' + (mode === 'alone' ? '僅發起者' : '所有人');
            return rply;
        }
        case /^my$/.test(sub): {
            const aliasFilter = (mainMsg[2] || '').trim();
            let text = '【我的劇本】\n';
            const ownerID = userid;
            const rows = [];
            if (db.story && typeof db.story.find === 'function' && db.storyRun && typeof db.storyRun.countDocuments === 'function') {
                const findQuery = { ownerID };
                if (aliasFilter) findQuery.alias = aliasFilter;
                const stories = await db.story.find(findQuery).lean();
                for (const s of stories) {
                    const ended = await db.storyRun.countDocuments({ story: s._id, isEnded: true });
                    const ongoing = await db.storyRun.countDocuments({ story: s._id, isEnded: false });
                    rows.push({ title: s.title || '-', alias: s.alias || '-', ended, ongoing });
                }
            } else {
                // memory fallback
                const counter = new Map(); // alias -> {title, ended, ongoing}
                for (const run of memoryRuns.values()) {
                    if (!run) continue;
                    if (run.storyOwnerID !== ownerID) continue;
                    const alias = run.storyAlias || '-';
                    if (aliasFilter && alias !== aliasFilter) continue;
                    if (!counter.has(alias)) counter.set(alias, { title: alias, ended: 0, ongoing: 0 });
                    const row = counter.get(alias);
                    if (run.isEnded) row.ended++; else row.ongoing++;
                }
                for (const [alias, row] of counter.entries()) {
                    rows.push({ title: row.title, alias, ended: row.ended, ongoing: row.ongoing });
                }
            }
            if (rows.length === 0) {
                text += '(沒有資料)';
            } else {
                for (const r of rows) {
                    text += '- ' + r.title + ' (alias: ' + r.alias + ')\n';
                    text += '  - Completed: ' + (r.ended || 0) + '\n';
                    text += '  - In progress: ' + (r.ongoing || 0) + '\n';
                }
            }
            rply.text = text.trim();
            return rply;
        }
        case /^mylist$/.test(sub): {
            const ownerID = userid;
            let text = '【我的劇本清單】\n';
            const rows = [];
            if (db.story && typeof db.story.find === 'function') {
                const stories = await db.story.find({ ownerID }).lean();
                for (const s of stories) {
                    let completed = 0;
                    let endingStats = [];
                    try {
                        if (db.storyRun && typeof db.storyRun.find === 'function') {
                            // Also fetch history to recover ending page when endingId/title are missing
                            const runs = await db.storyRun.find({ story: s._id, isEnded: true }, 'endingId endingTitle history').lean();
                            completed = runs ? runs.length : 0;
                            const counter = new Map();
                            for (const r of (runs || [])) {
                                // Prefer stored endingTitle; fallback to story page title by endingId; then endingId; finally try history's last page title; else 'unknown'
                                let label = '';
                                if (r && r.endingTitle && String(r.endingTitle).trim() !== '') {
                                    label = String(r.endingTitle);
                                } else {
                                    const eid = r && r.endingId ? String(r.endingId) : '';
                                    const storyPayload = s && s.payload ? s.payload : null;
                                    const pageTitleByEndingId = (storyPayload && storyPayload.pages && storyPayload.pages[eid] && storyPayload.pages[eid].title) ? String(storyPayload.pages[eid].title) : '';
                                    if (pageTitleByEndingId) {
                                        label = pageTitleByEndingId;
                                    } else if (eid) {
                                        label = eid;
                                    } else if (r && Array.isArray(r.history) && r.history.length > 0) {
                                        const last = r.history.at(-1);
                                        const lastPid = last && last.pageId ? String(last.pageId) : '';
                                        const titleFromHistory = (storyPayload && storyPayload.pages && storyPayload.pages[lastPid] && storyPayload.pages[lastPid].title) ? String(storyPayload.pages[lastPid].title) : '';
                                        label = titleFromHistory || lastPid || 'unknown';
                                    } else {
                                        label = 'unknown';
                                    }
                                }
                                const k = label;
                                counter.set(k, (counter.get(k) || 0) + 1);
                            }
                            endingStats = [...counter.entries()].map(([id, count]) => ({ id, count }));
                        }
                    } catch { /* ignore */ }
                    rows.push({
                        title: s.title || '-',
                        alias: s.alias || '-',
                        startPermission: s.startPermission || '-',
                        isActive: !!s.isActive,
                        introduction: s && s.payload && s.payload.introduction || '',
                        completed,
                        endingStats
                    });
                }
            } else {
                // memory fallback: infer from runs
                const byAlias = new Map(); // alias -> {completed, endings: Map<label,count>}
                const storyCache = new Map(); // alias -> story
                async function getStoryFor(alias, owner) {
                    if (storyCache.has(alias)) return storyCache.get(alias);
                    try {
                        const cur = await loadStoryByAlias(owner || ownerID, alias);
                        const story = cur && cur.story ? cur.story : null;
                        storyCache.set(alias, story);
                        return story;
                    } catch { storyCache.set(alias, null); return null; }
                }
                for (const run of memoryRuns.values()) {
                    if (!run || run.storyOwnerID !== ownerID) continue;
                    const alias = run.storyAlias || '-';
                    if (!byAlias.has(alias)) byAlias.set(alias, { completed: 0, endings: new Map() });
                    const stat = byAlias.get(alias);
                    if (run.isEnded) {
                        stat.completed++;
                        let label = '';
                        if (run.endingTitle && String(run.endingTitle).trim() !== '') {
                            label = String(run.endingTitle);
                        } else {
                            const story = await getStoryFor(alias, run.storyOwnerID);
                            const eid = run.endingId ? String(run.endingId) : '';
                            const titleFromStory = (story && story.pages && story.pages[eid] && story.pages[eid].title) ? String(story.pages[eid].title) : '';
                            if (titleFromStory) label = titleFromStory;
                            else if (eid) label = eid; else label = 'unknown';
                        }
                        stat.endings.set(label, (stat.endings.get(label) || 0) + 1);
                    }
                }
                for (const [alias, data] of byAlias.entries()) {
                    const story = await getStoryFor(alias, ownerID);
                    const intro = story && story.introduction || '';
                    rows.push({ title: alias, alias, startPermission: 'ANYONE', isActive: true, introduction: intro, completed: data.completed, endingStats: [...data.endings.entries()].map(([id, count]) => ({ id, count })) });
                }
            }
            if (rows.length === 0) {
                text += '(沒有資料)';
            } else {
                for (const r of rows) {
                    text += '- ' + r.title + ' (alias: ' + r.alias + ')\n';
                    try {
                        const intro = String(r.introduction || '').trim();
                        if (intro) {
                            const first = intro.split(/\r?\n/)[0] || '';
                            const preview = first.length > 80 ? (first.slice(0, 80) + '…') : first;
                            text += '  - 簡介：' + preview + '\n';
                        }
                    } catch { /* ignore */ }
                    text += '  - startPermission: ' + r.startPermission + '\n';
                    text += '  - active: ' + r.isActive + '\n';
                    if (typeof r.completed === 'number') text += '  - Completed: ' + r.completed + '\n';
                    if (Array.isArray(r.endingStats) && r.endingStats.length > 0) {
                        text += '  - Endings:\n';
                        for (const es of r.endingStats) text += '    • ' + (es.id || 'unknown') + ': ' + es.count + '\n';
                    }
                }
            }
            rply.text = text.trim();
            // Provide quick-start buttons for each alias
            const startButtons = [...new Set(rows.map(r => '.st start ' + r.alias))].slice(0, 20);
            if (startButtons.length > 0) rply.buttonCreate = startButtons;
            return rply;
        }
        default: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
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