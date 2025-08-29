"use strict";
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const axios = require('axios').default;

// Optional persistence via Mongo (gracefully degrade if unavailable)
let db = {};
try {
    db = require('../modules/schema.js') || {};
} catch (error) {
    db = {};
}
let VIP = {};
try {
    VIP = require('../modules/veryImportantPerson');
} catch (_) {
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
╭────── 指令 ──────
│ .st start <alias|title>
│ .st pause
│ .st end
│ .st goto 1
│ .st set name 小花
│ .st goto 20
│ .st my [alias]（查看自己新增的劇本統計）
│ .st mylist（顯示自己所有新增的劇本）
│ .st import <alias> [title]（附加檔案上傳 .json 或 .txt）
│ .st exportfile <alias> <path>
│ .st verify <alias>
╰────────────────`;
}

const initialize = function () {
    return variables;
}

// ---- Story utilities ----
function getContextKey({ groupid, channelid, userid }) {
    if (groupid) return `g:${groupid}`;
    if (channelid) return `c:${channelid}`;
    return `u:${userid}`;
}

function interpolate(template, ctx) {
    if (typeof template !== 'string') return '';
    return template.replace(/\{([^}]+)\}/g, (m, p1) => {
        const key = String(p1).trim();
        return ctx[key] !== undefined && ctx[key] !== null ? String(ctx[key]) : m;
    });
}

function safeEvalCondition(expr, scope) {
    try {
        if (!expr) return true;
        if (/^true$/i.test(expr)) return true;
        if (/^false$/i.test(expr)) return false;
        // Very small evaluator: replace bare identifiers with scope values
        // Allow operators: <, >, <=, >=, ==, ===, !=, !==, &&, ||, +, -, *, /, %
        const allowed = /[A-Za-z_][A-Za-z0-9_]*|([<>]=?|==?=|!?=)|[()&|+\-*/%\s.\d]/g;
        const cleaned = (expr.match(allowed) || []).join('');
        // Build a function with scope via with()
        // eslint-disable-next-line no-new-func
        const fn = new Function('scope', 'with(scope){ return (' + cleaned + ') }');
        return !!fn(scope);
    } catch (e) {
        return false;
    }
}

// Evaluate arithmetic/identifier expressions against scope and return the value (not just truthy)
function evalExpressionValue(expr, scope) {
    try {
        if (expr === undefined || expr === null) return undefined;
        if (typeof expr === 'number') return expr;
        const str = String(expr).trim();
        if (str === '') return '';
        // Allow identifiers and basic operators
        const allowed = /[A-Za-z_][A-Za-z0-9_]*|([<>]=?|==?=|!?=)|[()&|+\-*/%\s.\d]/g;
        const cleaned = (str.match(allowed) || []).join('');
        // eslint-disable-next-line no-new-func
        const fn = new Function('scope', 'with(scope){ return (' + cleaned + ') }');
        return fn(scope);
    } catch (_) {
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
function readStory03() { return { title: '', type: 'story', introduction: '', playerVariables: [], variables: [], speakers: [], gameStats: [], ownerId: '', initialPage: '0', pages: {} }; }

async function loadStoryByAlias(ownerID, alias) {
    if (db.story && typeof db.story.findOne === 'function') {
        const doc = await db.story.findOne({ ownerID, alias }).lean();
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
        let doc = await db.story.findOne({ ownerID, alias: key });
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

// Removed auto-creation of demo story after test phase
async function loadOrCreateStory03() { return { storyDoc: null, story: null }; }

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
        endingId: '',
        endingText: ''
    };
    ensureRunDefaults(run, story);

    if (db.storyRun && typeof db.storyRun.create === 'function') {
        const doc = await db.storyRun.create(run);
        return doc;
    }
    const key = getContextKey(context);
    memoryRuns.set(key, run);
    return run;
}

async function getActiveRun(context) {
    const key = getContextKey(context);
    if (db.storyRun && typeof db.storyRun.findOne === 'function') {
        const query = { isEnded: false };
        if (context.groupid) query.groupID = context.groupid;
        else if (context.channelid) query.channelID = context.channelid;
        else query.starterID = context.userid;
        const run = await db.storyRun.findOne(query).sort({ createdAt: -1 });
        return run;
    }
    return memoryRuns.get(key) || null;
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
        } catch (_) {
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
            endingId: run.endingId || '',
            endingText: run.endingText || '',
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

function renderPageText(story, run, pageId) {
    const page = story.pages[pageId];
    if (!page) return '找不到此頁面。';
    const scope = buildEvalScope(run);
    const statKeySet = new Set(Array.isArray(story.gameStats) ? story.gameStats.map(s => s.key) : []);
    const varKeySet = new Set(Array.isArray(story.variables) ? story.variables.map(v => v.key) : []);
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
                        run.stats[k] = isNaN(num) ? (run.stats[k] ?? 0) : num;
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
        if (Array.isArray(page.endings)) {
            for (const ed of page.endings) {
                if (!ed.condition || safeEvalCondition(ed.condition, scope)) {
                    out += '\n' + interpolate(ed.text, ctx) + '\n';
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
        if ((m = line.match(/^\[stat_def\]\s*([^\s]+)\s+(\-?\d+)\s+(\-?\d+)(?:\s+"([\s\S]*?)")?$/i))) {
            story.gameStats.push({ key: m[1], min: Number(m[2]), max: Number(m[3]), label: m[4] || m[1] });
            continue;
        }
        if ((m = line.match(/^\[var_def\]\s*([^\s]+)\s+(\-?\d+)\s+(\-?\d+)(?:\s+"([\s\S]*?)")?$/i))) {
            story.variables.push({ key: m[1], min: Number(m[2]), max: Number(m[3]), label: m[4] || m[1] });
            continue;
        }
        if ((m = line.match(/^\[label\]\s*(.+)$/i))) { currentPageId = String(m[1]).trim(); ensurePage(currentPageId); inEnding = false; continue; }
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
        if ((m = line.match(/^\[set\]\s*([^=\s]+)\s*=\s*([\s\S]+)$/i))) {
            const page = ensurePage(currentPageId || '0');
            page.content.push({ setVariables: { [m[1]]: isNaN(Number(m[2])) ? m[2] : Number(m[2]) } });
            continue;
        }
        if (/^\[choice\]/i.test(line)) { continue; }
        if ((m = line.match(/^\-\>\s*([\s\S]+?)\s*\|\s*([^|\s]+)(?:\s*\|\s*if=([^|]+))?(?:\s*\|\s*stat=([\s\S]+))?$/))) {
            const page = ensurePage(currentPageId || '0');
            const choice = { text: m[1].trim(), action: m[2].trim() };
            if (m[3]) choice.condition = m[3].trim();
            if (m[4]) {
                const sc = {};
                String(m[4]).split(',').forEach(pair => {
                    const p = pair.trim(); if (!p) return; const mm = p.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*([+\-])\s*(\d+)$/);
                    if (mm) sc[mm[1]] = (mm[2] === '+') ? Number(mm[3]) : -Number(mm[3]);
                });
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
    const q = (s) => '"' + String(s || '').replace(/"/g, '\\"') + '"';
    lines.push('[meta] title ' + q(story.title || ''));
    if (story.introduction) {
        String(story.introduction).split(/\r?\n/).forEach(l => lines.push('[intro] ' + l));
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
        lines.push('[label] ' + pid);
        if (page.title) lines.push('[title] ' + page.title);
        if (Array.isArray(page.content)) {
            for (const item of page.content) {
                if (item.setVariables && typeof item.setVariables === 'object') {
                    for (const [k, v] of Object.entries(item.setVariables)) lines.push('[set] ' + k + '=' + v);
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
            lines.push('[ending]');
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
                    if (parts.length) segs.push('stat=' + parts.join(','));
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
    let text = '【角色設定】\n請先完成以下項目：\n';
    for (let i = 0; i < req.length; i++) {
        const item = req[i];
        const isSet = current[item.key] !== undefined && String(current[item.key]).trim() !== '';
        const prefix = isSet ? '✔️ 已設定' : (String(i + 1) + '.');
        text += prefix + ' ' + (item.prompt || ('設定 ' + item.key)) + '\n';
        if (!isSet && item.placeholder) text += '範例：' + item.placeholder + '\n';
        if (!isSet) text += '指令：.st set ' + item.key + ' 內容\n';
        else text += '目前：' + current[item.key] + '\n';
    }
    text += '\n全部設定完成後，請再次輸入 .st start 以開始。';
    return text;
}

function findChoiceFromCurrentPage(story, run, targetPageId) {
    const curr = story.pages[run.currentPageId];
    if (!curr || !Array.isArray(curr.choices)) return null;
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
    const unique = Array.from(new Set(buttons));
    return unique.slice(0, 20);
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
    run.currentPageId = String(targetPageId);
    run.history = run.history || [];
    run.history.push({
        pageId: String(targetPageId),
        choiceText: choice ? choice.text : '',
        choiceAction: String(targetPageId),
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
            } catch (_) { /* ignore */ }
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
        } catch (_) { /* ignore */ }
    }
    return null;
}

async function downloadText(url) {
    const resp = await axios({ url, responseType: 'arraybuffer', timeout: 15000 });
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
        /^\[stat_def\]\s*([^\s]+)\s+(\-?\d+)\s+(\-?\d+)(?:\s+"([\s\S]*?)")?$/i,
        /^\[var_def\]\s*([^\s]+)\s+(\-?\d+)\s+(\-?\d+)(?:\s+"([\s\S]*?)")?$/i,
        /^\[label\]\s*(.+)$/i,
        /^\[title\]\s*([\s\S]+)$/i,
        /^\[ending\]/i,
        /^\[text(?:\|[^\]]+)?\]\s*[\s\S]*$/i,
        /^\[random\]\s*(\d+)%$/i,
        /^\[set\]\s*([^=\s]+)\s*=\s*[\s\S]+$/i,
        /^\[choice\]/i,
        /^\-\>\s*[\s\S]+?\s*\|\s*([^|\s]+)(?:\s*\|\s*if=[^|]+)?(?:\s*\|\s*stat=[\s\S]+)?$/
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
    for (const pid of Object.keys(story.pages || {})) {
        const page = story.pages[pid];
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
    return { ok: true };
}

// ---- Command handler ----
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
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
            // .st import <alias> [title] with attachment
            const aliasArg = (mainMsg[2] || '').trim();
            const customTitle = (mainMsg.slice(3).join(' ') || '').trim();
            // Get attachment (Discord only)
            const att = await getAttachmentInfo(discordMessage, discordClient);
            if (!att || !att.url) {
                rply.text = '未偵測到附件。請附加 .json 或 .txt 檔案後再試。';
                return rply;
            }
            if (att.size && att.size > MAX_UPLOAD_BYTES) {
                rply.text = '檔案過大（上限約 ' + Math.round(MAX_UPLOAD_BYTES / 1024) + 'KB）。請縮小後再上傳。';
                return rply;
            }
            let rawText = '';
            try {
                rawText = await downloadText(att.url);
            } catch (e) {
                rply.text = '下載附件失敗：' + (e.message || '');
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
            } catch (err) {
                parseErrorLine = estimateJsonErrorLine(rawText, err);
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

            // Enforce per-user story limit (only counts new creations)
            let isUpdate = false;
            let currentCount = 0;
            try {
                if (db.story && typeof db.story.findOne === 'function') {
                    const existing = await db.story.findOne({ ownerID: userid, alias }).lean();
                    isUpdate = !!existing;
                    currentCount = await db.story.countDocuments({ ownerID: userid });
                } else {
                    // filesystem fallback: count files owned by this user
                    const dir = path.join(__dirname, 'storyTeller');
                    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.json$/i.test(f)) : [];
                    for (const f of files) {
                        try {
                            const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
                            if (obj && obj.ownerId === userid) currentCount++;
                            if (String(f).replace(/\.[^.]+$/, '') === alias) isUpdate = true;
                        } catch (_) { }
                    }
                }
            } catch (_) { /* ignore */ }
            if (!isUpdate) {
                let levelIndex = 0;
                try { levelIndex = (typeof VIP.viplevelCheckUser === 'function') ? await VIP.viplevelCheckUser(userid) : 0; } catch (_) { levelIndex = 0; }
                const limit = STORY_LIMIT_BY_LEVEL[Math.max(0, Math.min(STORY_LIMIT_BY_LEVEL.length - 1, Number(levelIndex) || 0))];
                if (currentCount >= limit) {
                    rply.text = '你目前的劇本數已達上限（' + limit + '）。若需新增更多，請升級會員或刪除既有劇本。';
                    return rply;
                }
            }

            // Persist
            if (db.story && typeof db.story.findOneAndUpdate === 'function') {
                await db.story.findOneAndUpdate(
                    { ownerID: userid, alias },
                    {
                        ownerID: userid,
                        ownerName: (typeof displayname === 'string' ? displayname : ''),
                        alias,
                        title: compiled.title,
                        type: 'story',
                        payload: compiled,
                        startPermission: 'AUTHOR_ONLY',
                        allowedGroups: [],
                        isActive: true
                    },
                    { upsert: true }
                );
            }
            try {
                const outPath = path.join(__dirname, 'storyTeller', alias + '.json');
                fs.mkdirSync(path.dirname(outPath), { recursive: true });
                fs.writeFileSync(outPath, JSON.stringify(compiled, null, 2), 'utf8');
            } catch (_) { /* ignore */ }

            rply.text = '已匯入劇本：' + (compiled.title || alias) + '（alias: ' + alias + '）';
            rply.buttonCreate = ['.st start ' + alias];
            return rply;
        }
        case /^start$/.test(sub): {
            const key = (mainMsg.slice(2).join(' ') || '').trim();
            let run = await getActiveRun(ctx);

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
                        rply.text = '目前有進行中的故事：' + (run.storyAlias || '-') + '。請先輸入 .st end 或 .st pause 後再啟動新劇本。';
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
                        rply.buttonCreate = buildButtonsForPage(story, run);
                    }
                    await saveRun(ctx, run);
                    return rply;
                }
                // Create new run for resolved story
                const storyDoc = resolved.storyDoc;
                const story = resolved.story;
                run = await createRun({ storyDoc, story, context: ctx, starterID: userid, starterName: displayname || '', botname });
                run.storyAlias = resolved.alias || (storyDoc ? storyDoc.alias : key);
                const missing = getMissingPlayerVariables(story, run);
                let text = '';
                if (missing.length > 0) text = renderPlayerSetupPrompt(story, run);
                else {
                    text = renderPageText(story, run, run.currentPageId);
                    rply.buttonCreate = buildButtonsForPage(story, run);
                }
                await saveRun(ctx, run);
                rply.text = text;
                return rply;
            }

            // No key provided: continue existing run if any, otherwise ask for key
            if (run && !run.isEnded) {
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
                    rply.buttonCreate = buildButtonsForPage(story, run);
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
            await saveRun(ctx, run);
            rply.text = '已暫停，使用 .st start 可繼續。';
            rply.buttonCreate = ['.st start'];
            return rply;
        }
        case /^end$/.test(sub): {
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            run.isEnded = true;
            run.endedAt = new Date();
            const { story } = await loadStoryByAlias(run.storyOwnerID || userid, run.storyAlias);
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
            const allowedActions = allowedChoices.map(c => String(c.action).toUpperCase());
            const targetUpper = String(target).toUpperCase();
            if (!allowedActions.includes(targetUpper)) {
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
                rply.buttonCreate = Array.from(new Set(btns)).slice(0, 20);
                return rply;
            }
            if (targetUpper !== 'END' && !story.pages[target]) { rply.text = '找不到此頁面ID。'; return rply; }
            await gotoPage({ story, run, targetPageId: target });
            const text = renderPageText(story, run, run.currentPageId);
            await saveRun(ctx, run);
            rply.text = text;
            rply.buttonCreate = buildButtonsForPage(story, run);
            return rply;
        }
        case /^set$/.test(sub): {
            const field = (mainMsg[2] || '').toLowerCase();
            const value = (mainMsg.slice(3).join(' ') || '').trim();
            if (!field || !value) { rply.text = '用法：.st set name 小花 或 .st set owner_name 阿明'; return rply; }
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '請先使用 .st start 開始故事。'; rply.buttonCreate = ['.st start']; return rply; }
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
            } catch (_) { storyRef = null; }
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
                const text = renderPageText(storyRef, run, run.currentPageId);
                rply.text = '已設定 ' + key + ' = ' + value + '\n\n' + text;
                // Persist any [set] effects applied during renderPageText (e.g., initial stats)
                await saveRun(ctx, run);
                rply.buttonCreate = buildButtonsForPage(storyRef, run);
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
                try { return JSON.stringify(obj || {}, null, 0); } catch (_) { return '{}'; }
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
            text += '- allowedUserIDs: ' + ((run.allowedUserIDs && run.allowedUserIDs.length) || 0) + '\n';
            text += '- startPermissionAtRun: ' + (run.startPermissionAtRun || '-') + '\n';
            text += '- variables: ' + safeJson(run.variables) + '\n';
            text += '- stats: ' + safeJson(run.stats) + '\n';
            text += '- playerVariables: ' + safeJson(run.playerVariables) + '\n';
            text += '- history length: ' + ((run.history && run.history.length) || 0) + '\n';
            rply.text = text;
            return rply;
        }
        // importfile deprecated above
        case /^exportfile$/.test(sub): {
            const alias = (mainMsg[2] || '').trim();
            const filePath = (mainMsg[3] || '').trim();
            if (!alias || !filePath) { rply.text = '用法：.st exportfile <alias> <path>'; return rply; }
            const { story } = await loadStoryByAlias(userid, alias);
            if (!story) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
            const txt = exportStoryToRunDesign(story);
            try {
                let resolved = filePath;
                const tmpMatch = /^@tmp(?:[\/]|$)/i.test(filePath);
                if (tmpMatch) {
                    const rest = filePath.replace(/^@tmp(?:[\/])?/i, '');
                    resolved = path.join(os.tmpdir(), rest || (alias + '.txt'));
                } else if (!path.isAbsolute(filePath)) {
                    resolved = path.join(process.cwd(), filePath);
                }
                fs.mkdirSync(path.dirname(resolved), { recursive: true });
                fs.writeFileSync(resolved, txt, 'utf8');
                const out2 = path.join(__dirname, 'storyTeller', alias);
                fs.writeFileSync(out2, txt, 'utf8');
            } catch (e) {
                rply.text = '輸出失敗：' + e.message;
                return rply;
            }
            rply.text = '已輸出 RUN_DESIGN 至：' + filePath;
            return rply;
        }
        case /^verify$/.test(sub): {
            const alias = (mainMsg[2] || '').trim();
            if (!alias) { rply.text = '用法：.st verify <alias>'; return rply; }
            const { story } = await loadStoryByAlias(userid, alias);
            if (!story) { rply.text = '找不到該劇本（alias: ' + alias + '）'; return rply; }
            const txt = exportStoryToRunDesign(story);
            const recompiled = compileRunDesignToStory(txt, { alias, title: story.title });
            const norm = (obj) => JSON.stringify(obj);
            const same = norm(story) === norm(recompiled);
            rply.text = same ? 'verify: OK（可逆）' : 'verify: 差異（可能存在未支援元素）';
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
                    rows.push({
                        title: s.title || '-',
                        alias: s.alias || '-',
                        startPermission: s.startPermission || '-',
                        isActive: !!s.isActive
                    });
                }
            } else {
                // memory fallback: infer from runs
                const byAlias = new Map();
                for (const run of memoryRuns.values()) {
                    if (!run || run.storyOwnerID !== ownerID) continue;
                    const alias = run.storyAlias || '-';
                    if (!byAlias.has(alias)) byAlias.set(alias, true);
                }
                for (const alias of byAlias.keys()) {
                    rows.push({ title: alias, alias, startPermission: 'ANYONE', isActive: true });
                }
            }
            if (rows.length === 0) {
                text += '(沒有資料)';
            } else {
                for (const r of rows) {
                    text += '- ' + r.title + ' (alias: ' + r.alias + ')\n';
                    text += '  - startPermission: ' + r.startPermission + '\n';
                    text += '  - active: ' + r.isActive + '\n';
                }
            }
            rply.text = text.trim();
            // Provide quick-start buttons for each alias
            const startButtons = Array.from(new Set(rows.map(r => '.st start ' + r.alias))).slice(0, 20);
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