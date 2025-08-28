"use strict";
const path = require('node:path');
const fs = require('node:fs');

// Optional persistence via Mongo (gracefully degrade if unavailable)
let db = {};
try {
    db = require('../modules/schema.js') || {};
} catch (error) {
    db = {};
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
│ .st start 貓咪的一天
│ .st pause
│ .st end
│ .st goto 1
│ .st set name 小花
│ .st goto 20
│ .st my [alias]（查看自己新增的劇本統計）
│ .st mylist（顯示自己所有新增的劇本）
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
    // Initialize stats 1-10 randomly if not set
    if (story && Array.isArray(story.gameStats)) {
        for (const s of story.gameStats) {
            const k = s.key;
            if (run.stats[k] === undefined || run.stats[k] === null) {
                const min = Number(s.min) || 1;
                const max = Number(s.max) || 10;
                run.stats[k] = Math.floor(Math.random() * (max - min + 1)) + min;
            }
        }
    }
}

function readStory03() {
    const storyPath = path.join(__dirname, 'storyTeller', '03.json');
    const raw = fs.readFileSync(storyPath, 'utf8');
    return JSON.parse(raw);
}

async function loadOrCreateStory03(ownerID, ownerName) {
    const storyPayload = readStory03();
    if (db.story && typeof db.story.findOne === 'function') {
        let doc = await db.story.findOne({ ownerID, alias: '03' });
        if (!doc) {
            doc = await db.story.create({
                ownerID,
                ownerName,
                alias: '03',
                title: storyPayload.title || '貓咪的一天',
                type: 'story',
                payload: storyPayload,
                startPermission: 'ANYONE',
                allowedGroups: [],
                isActive: true
            });
        }
        return { storyDoc: doc, story: doc.payload };
    }
    return { storyDoc: null, story: storyPayload };
}

async function createRun({ storyDoc, story, context, starterID, starterName, botname }) {
    const run = {
        story: storyDoc ? storyDoc._id : null,
        storyOwnerID: storyDoc ? storyDoc.ownerID : context.userid,
        storyAlias: '03',
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
    if (db.storyRun && typeof db.storyRun.findByIdAndUpdate === 'function' && run && run._id) {
        await db.storyRun.findByIdAndUpdate(run._id, run, { new: true });
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
                    run.variables[k] = v;
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
                if (action === 'END') {
                    out += '- ' + c.text + '（.st end）\n';
                } else {
                    out += '- ' + c.text + '（.st goto ' + c.action + '）\n';
                }
            }
        }
    }
    return out.trim();
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

// ---- Command handler ----
const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid
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
            return rply;
        }
        case /^start$/.test(sub): {
            // Demo supports 03.json only
            const { storyDoc, story } = await loadOrCreateStory03(userid, displayname || '');
            let run = await getActiveRun(ctx);
            if (run && !run.isEnded) {
                ensureRunDefaults(run, story);
                const missing = getMissingPlayerVariables(story, run);
                if (missing.length > 0) {
                    rply.text = renderPlayerSetupPrompt(story, run);
                } else {
                    const text = renderPageText(story, run, run.currentPageId);
                    rply.text = '已載入當前進度：\n' + text;
                }
                return rply;
            }
            run = await createRun({ storyDoc, story, context: ctx, starterID: userid, starterName: displayname || '', botname });
            const missing = getMissingPlayerVariables(story, run);
            let text = '';
            if (missing.length > 0) {
                text = renderPlayerSetupPrompt(story, run);
            } else {
                text = renderPageText(story, run, run.currentPageId);
            }
            await saveRun(ctx, run);
            rply.text = text;
            return rply;
        }
        case /^pause$/.test(sub): {
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            await saveRun(ctx, run);
            rply.text = '已暫停，使用 .st start 可繼續。';
            return rply;
        }
        case /^end$/.test(sub): {
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '目前沒有進行中的故事。'; return rply; }
            run.isEnded = true;
            run.endedAt = new Date();
            const { story } = await loadOrCreateStory03(run.storyOwnerID || userid, run.starterName || '');
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
            return rply;
        }
        case /^goto$/.test(sub): {
            const target = (mainMsg[2] || '').trim();
            if (!target) { rply.text = '請提供頁面ID，例如 .st goto 1'; return rply; }
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '請先使用 .st start 開始故事。'; return rply; }
            const { story } = await loadOrCreateStory03(run.storyOwnerID || userid, run.starterName || '');
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
                return rply;
            }
            if (targetUpper !== 'END' && !story.pages[target]) { rply.text = '找不到此頁面ID。'; return rply; }
            await gotoPage({ story, run, targetPageId: target });
            const text = renderPageText(story, run, run.currentPageId);
            await saveRun(ctx, run);
            rply.text = text;
            return rply;
        }
        case /^set$/.test(sub): {
            const field = (mainMsg[2] || '').toLowerCase();
            const value = (mainMsg.slice(3).join(' ') || '').trim();
            if (!field || !value) { rply.text = '用法：.st set name 小花 或 .st set owner_name 阿明'; return rply; }
            const run = await getActiveRun(ctx);
            if (!run) { rply.text = '請先使用 .st start 開始故事。'; return rply; }
            // Map common aliases
            let key = field;
            if (field === 'name') key = 'cat_name';
            run.playerVariables = run.playerVariables || {};
            run.playerVariables[key] = value;
            const { story } = await loadOrCreateStory03(run.storyOwnerID || userid, run.starterName || '');
            ensureRunDefaults(run, story);
            await saveRun(ctx, run);
            const missing = getMissingPlayerVariables(story, run);
            if (missing.length > 0) {
                rply.text = '已設定 ' + key + ' = ' + value + '\n\n' + renderPlayerSetupPrompt(story, run);
            } else {
                const text = renderPageText(story, run, run.currentPageId);
                rply.text = '已設定 ' + key + ' = ' + value + '\n\n' + text;
            }
            return rply;
        }
        case /^debug$/.test(sub): {
            const run = await getActiveRun(ctx);
            const { story } = await loadOrCreateStory03(run && (run.storyOwnerID || userid) || userid, run && run.starterName || '');
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
            text += '- alias: 03\n';
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
                    if (!counter.has(alias)) counter.set(alias, { title: '貓咪的一天', ended: 0, ongoing: 0 });
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
                    let title = '-';
                    if (alias === '03') {
                        try { const s = readStory03(); title = s.title || title; } catch (_) {}
                    }
                    rows.push({ title, alias, startPermission: 'ANYONE', isActive: true });
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