(function () {
    'use strict';

    // Design studies use fictional data only. Never read auth keys or contact the bot.
    const STORE_KEY = 'hktrpg.card-design-studies.v1';
    const designs = [
        { name: '人物誌', en: 'The Character Issue', idea: '以角色為主角的雜誌。大幅肖像、留白與編輯式層次，先認識人物，再讀數據。' },
        { name: '戰術台', en: 'In the Moment', idea: '為當前回合而設。資源、攻擊、優劣勢及擲骰紀錄放在同一視線內。' },
        { name: '冒險手帳', en: 'A Traveller’s Journal', idea: '像翻閱旅人的筆記。用章節、頁邊註記及雙頁排版串連能力與故事。' },
        { name: '角色索引', en: 'The Character Index', idea: '用索引管理資訊。搜尋、精準數值與清晰列表，適合資料多、查閱頻密的角色。' },
        { name: '靈魂之境', en: 'The Living Character', idea: '以人物與世界營造代入感。角色立繪主導畫面，操作沿邊緣與底部展開。' }
    ];
    const samples = {
        ranger: {
            id: 'ranger', name: '艾菈・霧行', latin: 'AELRA MISTWALKER', system: 'D&D 5e', role: '半精靈 · 幽域追獵者', level: 7,
            quote: '森林記得每一個離開的人。',
            bio: '在北境的薄霧中長大，習慣循著星光辨路。她追尋失蹤姊姊留下的銀色羽毛，從長青林一路走到沒有名字的海岸。',
            location: '長青林 · 北境邊陲', hp: 38, maxHp: 52, mp: 3, maxMp: 4, resourceLabel: '一環法術位', ac: 16, speed: 30, initiative: '+4', proficiency: '+3',
            attrs: [
                { key: 'STR', name: '力量', value: 12, mod: '+1' }, { key: 'DEX', name: '敏捷', value: 18, mod: '+4' },
                { key: 'CON', name: '體質', value: 14, mod: '+2' }, { key: 'INT', name: '智力', value: 10, mod: '+0' },
                { key: 'WIS', name: '感知', value: 16, mod: '+3' }, { key: 'CHA', name: '魅力', value: 8, mod: '−1' }
            ],
            skills: [
                { name: '察覺', value: '+6', notation: '1d20+6' }, { name: '隱匿', value: '+7', notation: '1d20+7' },
                { name: '求生', value: '+6', notation: '1d20+6' }, { name: '洞悉', value: '+3', notation: '1d20+3' },
                { name: '調查', value: '+0', notation: '1d20' }, { name: '運動', value: '+1', notation: '1d20+1' }
            ],
            actions: [
                { name: '長弓', tag: '遠程攻擊', detail: '150 / 600 呎 · 穿刺', notation: '1d20+7', damage: '1d8+4' },
                { name: '雙刃短劍', tag: '近戰攻擊', detail: '5 呎 · 穿刺', notation: '1d20+7', damage: '1d6+4' },
                { name: '獵人印記', tag: '法術', detail: '專注 · 額外傷害', notation: '1d6', damage: '' }
            ],
            notes: [
                { title: '霧中的銀羽', text: '旅店老闆見過相同的羽毛。他說，上一次出現是在北方的廢棄瞭望塔。明早出發前，記得補充箭矢。' },
                { title: '與隊友的約定', text: '答應洛恩：無論找到甚麼，都不獨自進入森林深處。' }
            ],
            inventory: [{ name: '灰木長弓', detail: '已裝備 · 2 磅' }, { name: '磨損的銀色羽毛', detail: '重要物品 · 姊姊留下的線索' }, { name: '治療藥水 × 2', detail: '消耗品 · 2d4+2' }, { name: '旅人背包', detail: '繩索、火絨、乾糧 × 5' }],
            conditions: ['專注中'], inspiration: false
        },
        investigator: {
            id: 'investigator', name: '沈雨生', latin: 'SHUM YU SANG', system: 'CoC 7e', role: '保險調查員 · 野外活動愛好者', level: 0,
            quote: '所有巧合，都有尚未被發現的原因。',
            bio: '一宗沒有受益人的保險索償，將他帶到海邊的舊旅館。記錄顯示，這棟建築早在三十年前就已經被大火燒毀。',
            location: '海濱旅館 · 第三號房', hp: 9, maxHp: 11, mp: 13, maxMp: 16, resourceLabel: '魔法值 MP', ac: 0, speed: 8, initiative: '65', proficiency: '60',
            attrs: [
                { key: 'STR', name: '力量', value: 60, mod: '60' }, { key: 'CON', name: '體質', value: 50, mod: '50' },
                { key: 'DEX', name: '敏捷', value: 65, mod: '65' }, { key: 'INT', name: '智力', value: 75, mod: '75' },
                { key: 'POW', name: '意志', value: 80, mod: '80' }, { key: 'EDU', name: '教育', value: 70, mod: '70' }
            ],
            skills: [
                { name: '偵查', value: '65%', notation: 'cc:65' }, { name: '心理學', value: '60%', notation: 'cc:60' },
                { name: '聆聽', value: '55%', notation: 'cc:55' }, { name: '圖書館使用', value: '70%', notation: 'cc:70' },
                { name: '潛行', value: '40%', notation: 'cc:40' }, { name: '幸運', value: '60%', notation: 'cc:60' }
            ],
            actions: [
                { name: '鬥毆', tag: '近戰', detail: '成功率 49% · 傷害加值 +1d4', notation: 'cc:49', damage: '1d3+1d4' },
                { name: '小刀', tag: '近戰', detail: '成功率 49% · 穿刺武器', notation: 'cc:49', damage: '1d4+1d4+2' },
                { name: '理智檢定', tag: '理智', detail: '當前 SAN 80 · 本次僅試擲', notation: 'cc:80', damage: '' }
            ],
            notes: [
                { title: '沒有寄件人的信', text: '信封沒有郵戳，卻放在上鎖的信箱裡。內容只有一個地址，以及一句「不要相信第三次鐘聲」。' },
                { title: '訪談備忘', text: '旅館職員堅稱昨晚没有客人入住，但三樓走廊上仍放著兩份早餐。' }
            ],
            inventory: [{ name: '皮面筆記本', detail: '調查紀錄 · 12 頁' }, { name: '手電筒', detail: '電池剩餘一半' }, { name: '折疊小刀', detail: '已裝備' }, { name: '房間鑰匙 303', detail: '重要物品 · 黃銅' }],
            conditions: ['保持警覺'], inspiration: false
        }
    };
    const clone = value => JSON.parse(JSON.stringify(value));
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch { /* Demo works without storage. */ }
    if (typeof stored !== 'object' || Array.isArray(stored)) stored = {};
    let sampleId = Object.hasOwn(samples, stored.sample) ? stored.sample : 'ranger';
    const pathMatch = location.pathname.match(/^\/card([1-5])\/?$/);
    const queryDesign = Number(new URLSearchParams(location.search).get('design'));
    const design = pathMatch ? Number(pathMatch[1]) : (queryDesign >= 1 && queryDesign <= 5 ? queryDesign : 1);
    const state = { tab: 'overview', search: '', advantage: 'normal', round: 1, rolls: [] };
    let c;
    let undo = [];
    let toastTimer;
    const root = document.getElementById('design-root');
    const dialog = document.getElementById('sheet-dialog');

    function loadSample() {
        c = clone(samples[sampleId]);
        const saved = stored.characters?.[sampleId];
        if (!saved || typeof saved !== 'object') return;
        for (const key of ['hp', 'mp']) if (Number.isFinite(saved[key])) c[key] = Math.max(0, Math.min(c[key === 'hp' ? 'maxHp' : 'maxMp'], saved[key]));
        for (const key of ['name', 'bio', 'quote']) if (typeof saved[key] === 'string') c[key] = saved[key].slice(0, key === 'name' ? 60 : 1500);
        if (Array.isArray(saved.notes)) c.notes = saved.notes.slice(0, 20).filter(n => n && typeof n.title === 'string' && typeof n.text === 'string').map(n => ({ title: n.title.slice(0, 80), text: n.text.slice(0, 3000) }));
        c.inspiration = saved.inspiration === true;
    }
    function persist() {
        stored.sample = sampleId;
        if (!stored.characters || typeof stored.characters !== 'object' || Array.isArray(stored.characters)) stored.characters = {};
        stored.characters[sampleId] = { hp: c.hp, mp: c.mp, name: c.name, bio: c.bio, quote: c.quote, notes: c.notes, inspiration: c.inspiration };
        try { localStorage.setItem(STORE_KEY, JSON.stringify(stored)); return true; } catch { return false; }
    }
    function remember() { undo.push(clone(c)); if (undo.length > 20) undo.shift(); }
    function toast(message, detail = '') {
        const el = document.getElementById('roll-result');
        el.innerHTML = `<span class="toast-mark">${icon('dice')}</span><div><strong>${esc(message)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div><button type="button" data-close-toast aria-label="關閉結果">${icon('close')}</button>`;
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.hidden = true; }, 6500);
    }
    const iconPaths = {
        dice: '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7 4.8l10 5.6"/>',
        arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', book: '<path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 1z"/>',
        edit: '<path d="m15 5 4 4M4 20l4-1L21 6l-4-4L4 15z"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
        heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
        shield: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z"/>', search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
        moon: '<path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13z"/>', check: '<path d="m5 12 4 4L20 5"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
        compass: '<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>', pack: '<path d="M8 6V4a4 4 0 0 1 8 0v2M5 6h14v15H5zM5 12h14M9 15h6"/>',
        chevron: '<path d="m9 5 7 7-7 7"/>', undo: '<path d="M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12"/>', star: '<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>'
    };
    function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.dice}</svg>`; }
    const ui = {
        icon,
        portrait: (className = '') => `<img class="character-portrait ${esc(className)}" src="/common/card-designs/${c.id === 'ranger' ? 'portrait' : 'investigator'}.svg" alt="${esc(c.name)}的角色插畫" width="600" height="840">`,
        editButton: () => `<button type="button" class="sheet-button" data-action="edit">${icon('edit')}<span>編輯人物</span></button>`,
        characterButton: () => `<button type="button" class="sheet-button" data-action="character">${icon('compass')}<span>切換角色</span></button>`,
        resources: () => `<div class="resources">${[['hp', '生命值 HP', c.hp, c.maxHp], ['mp', c.resourceLabel, c.mp, c.maxMp]].map(([key, label, value, max]) => `<div class="resource resource-${key}"><div class="resource-head"><span>${esc(label)}</span><span class="resource-value"><strong>${value}</strong><span> / ${max}</span></span></div><div class="resource-track" role="meter" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><span class="resource-fill" style="width:${value / max * 100}%"></span></div><div class="resource-buttons"><button type="button" data-adjust="${key}" data-delta="-1" aria-label="${esc(label)}減少 1" ${value <= 0 ? 'disabled' : ''}>${icon('minus')}</button><span>${key === 'hp' ? '調整生命' : '消耗 / 恢復'}</span><button type="button" data-adjust="${key}" data-delta="1" aria-label="${esc(label)}增加 1" ${value >= max ? 'disabled' : ''}>${icon('plus')}</button></div></div>`).join('')}</div>`,
        attrs: () => `<div class="attributes">${c.attrs.map(a => `<button type="button" class="attribute" data-roll="${esc(c.id === 'investigator' ? 'cc:' + a.value : '1d20' + a.mod.replace('−', '-'))}" data-roll-name="${esc(a.name)}檢定" aria-label="擲${esc(a.name)}檢定"><span class="attribute-key">${esc(a.key)}</span><span class="attribute-name">${esc(a.name)}</span><strong class="attribute-mod">${esc(a.mod)}</strong><span class="attribute-value">${c.id === 'ranger' ? '數值 ' + a.value : '困難 ' + Math.floor(a.value / 2)}</span></button>`).join('')}</div>`,
        actions: () => `<div class="action-list">${c.actions.map(a => `<div class="action-row" data-search-text="${esc(a.name + ' ' + a.tag)}"><div class="action-info"><span class="action-tag">${esc(a.tag)}</span><strong class="action-name">${esc(a.name)}</strong><span class="action-meta">${esc(a.detail)}</span></div><div class="action-buttons"><button type="button" class="action-roll" data-roll="${esc(a.notation)}" data-roll-name="${esc(a.name)}">${icon('dice')}<span>${esc(a.notation.startsWith('cc:') ? a.notation.slice(3) + '%' : a.notation)}</span></button>${a.damage ? `<button type="button" class="damage-roll" data-roll="${esc(a.damage)}" data-roll-name="${esc(a.name)}傷害" aria-label="擲${esc(a.name)}傷害">${esc(a.damage)}<small>傷害</small></button>` : ''}</div></div>`).join('')}</div>`,
        skills: () => `<div class="skill-list">${c.skills.map(s => `<button type="button" class="skill-row" data-search-text="${esc(s.name)}" data-roll="${esc(s.notation)}" data-roll-name="${esc(s.name)}"><span>${esc(s.name)}</span><strong>${esc(s.value)}</strong>${icon('dice')}</button>`).join('')}</div>`,
        inventory: () => `<div class="inventory-list">${c.inventory.map((item, i) => `<div class="inventory-row"><span class="inventory-number">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(item.name)}</strong><small>${esc(item.detail)}</small></div>${icon('pack')}</div>`).join('')}</div>`,
        notes: () => `<div class="notes-list">${c.notes.map((n, i) => `<article class="note-entry"><label for="note-${i}"><span>${String(i + 1).padStart(2, '0')}</span> ${esc(n.title)}</label><textarea id="note-${i}" data-note-index="${i}" rows="4" maxlength="3000" aria-label="${esc(n.title)}">${esc(n.text)}</textarea></article>`).join('')}<button type="button" class="sheet-button" data-action="add-note">${icon('plus')} 新增筆記</button><p class="local-note">筆記只保存在此瀏覽器的範例角色。</p></div>`,
        tabs: tabs => `<nav class="sheet-tabs" aria-label="角色內容">${tabs.map(t => `<button type="button" class="sheet-tab ${state.tab === t.id ? 'is-active' : ''}" data-tab="${esc(t.id)}" aria-current="${state.tab === t.id ? 'page' : 'false'}">${esc(t.label)}</button>`).join('')}</nav>`,
        rollLog: () => `<div class="roll-log" aria-label="本次擲骰紀錄">${state.rolls.length ? state.rolls.slice(0, 6).map(r => `<div class="roll-entry"><span>${esc(r.name)}<small>${esc(r.detail)}</small></span><strong>${esc(r.result)}</strong></div>`).join('') : `<div class="roll-empty">${icon('dice')}<span>第一個擲骰，會在這裡留下紀錄。</span></div>`}</div>`
    };
    function switcher() {
        document.getElementById('design-switcher').innerHTML = `<a class="study-brand" href="/card" aria-label="返回原版角色卡"><span class="study-logo">${icon('dice')}</span><span>HKTRPG<small>CHARACTER STUDIES</small></span></a><nav class="design-links" aria-label="五種設計">${designs.map((d, i) => `<a href="/card${i + 1}" class="${design === i + 1 ? 'selected' : ''}" ${design === i + 1 ? 'aria-current="page"' : ''}><span>0${i + 1}</span>${d.name}</a>`).join('')}</nav><div class="study-tools"><label class="sample-picker"><span class="sample-indicator"></span><span class="sr-only">範例角色</span><select id="sample-select" aria-label="範例角色"><option value="ranger" ${sampleId === 'ranger' ? 'selected' : ''}>D&D 遊俠</option><option value="investigator" ${sampleId === 'investigator' ? 'selected' : ''}>CoC 調查員</option></select></label><button type="button" class="study-about" data-action="about" aria-label="設計理念及試玩說明">試玩說明 ${icon('arrow')}</button></div>`;
    }
    function render() {
        const active = document.activeElement;
        const focusData = active?.dataset?.adjust ? { adjust: active.dataset.adjust, delta: active.dataset.delta } : active?.dataset?.tab ? { tab: active.dataset.tab } : null;
        document.body.className = `design-${design}`;
        document.title = `${designs[design - 1].name} · 角色卡 ${design} · HKTRPG`;
        switcher();
        const renderer = window.CardDesigns?.[design];
        root.innerHTML = renderer ? renderer({ c, ui, esc, state }) : '<p class="loading">這個設計正在準備中，請稍後重新整理。</p>';
        if (focusData?.adjust) root.querySelector(`[data-adjust="${focusData.adjust}"][data-delta="${focusData.delta}"]:not(:disabled)`)?.focus({ preventScroll: true });
        if (focusData?.tab) root.querySelector(`[data-tab="${focusData.tab}"]`)?.focus({ preventScroll: true });
        if (state.search) applySearch(state.search);
    }
    function die(sides) { const buffer = new Uint32Array(1); crypto.getRandomValues(buffer); return Math.floor(buffer[0] / 4294967296 * sides) + 1; }
    function roll(notation, name) {
        let result, detail;
        const check = /^cc:(\d{1,3})$/.exec(notation);
        if (check) {
            const target = Math.min(100, Number(check[1]));
            result = die(100);
            const label = result === 1 ? '大成功' : result === 100 || (target < 50 && result >= 96) ? '大失敗' : result <= Math.floor(target / 5) ? '極難成功' : result <= Math.floor(target / 2) ? '困難成功' : result <= target ? '成功' : '失敗';
            detail = `1d100 → ${result} / ${target} · ${label}`;
        } else {
            const clean = notation.replace(/\s/g, '');
            if (!/^(?:\d{1,2}d\d{1,3}|\d{1,3})(?:[+-](?:\d{1,2}d\d{1,3}|\d{1,3}))*$/i.test(clean)) { toast('這個試玩版暫未支援此算式'); return; }
            const terms = clean.match(/[+-]?(?:\d+d\d+|\d+)/gi);
            let total = 0;
            const steps = [];
            for (const term of terms) {
                const m = /^([+-]?)(\d+)d(\d+)$/i.exec(term);
                if (!m) { total += Number(term); steps.push(term); continue; }
                const count = Number(m[2]), sides = Number(m[3]);
                if (count > 20 || sides < 2 || sides > 100) { toast('試玩版支援最多 20 粒、2–100 面骰'); return; }
                const values = Array.from({ length: count }, () => die(sides));
                if (count === 1 && sides === 20 && state.advantage !== 'normal') {
                    const second = die(20);
                    const chosen = state.advantage === 'advantage' ? Math.max(values[0], second) : Math.min(values[0], second);
                    steps.push(`${state.advantage === 'advantage' ? '優勢' : '劣勢'}[${values[0]}, ${second}]→${chosen}`);
                    total += (m[1] === '-' ? -1 : 1) * chosen;
                } else {
                    total += (m[1] === '-' ? -1 : 1) * values.reduce((a, b) => a + b, 0);
                    steps.push(`${m[1]}[${values.join(', ')}]`);
                }
            }
            result = total;
            detail = `${notation} · ${steps.join(' ')} = ${total}`;
        }
        state.rolls.unshift({ name, result, detail });
        state.rolls = state.rolls.slice(0, 30);
        render();
        toast(`${name} → ${result}`, `${detail} · 本機試擲`);
    }
    function openDialog(title, content) {
        dialog.innerHTML = `<header><div><span class="dialog-eyebrow">HKTRPG · DESIGN STUDIES</span><h2 id="dialog-title">${esc(title)}</h2></div><button type="button" data-dialog-close aria-label="關閉視窗">${icon('close')}</button></header>${content}`;
        dialog.showModal();
    }
    function applySearch(value) {
        const search = value.trim().toLocaleLowerCase();
        let matches = 0;
        root.querySelectorAll('[data-search-text]').forEach(el => { el.hidden = !el.dataset.searchText.toLocaleLowerCase().includes(search); if (!el.hidden) matches++; });
        let empty = root.querySelector('.search-empty');
        if (!empty && root.querySelector('[data-skill-search]')) { empty = document.createElement('p'); empty.className = 'search-empty'; empty.setAttribute('role', 'status'); root.querySelector('[data-skill-search]').closest('label, .search-field, .index-search')?.insertAdjacentElement('afterend', empty); }
        if (empty) { empty.textContent = search && !matches ? '沒有符合的技能或行動，試試另一個關鍵字。' : ''; empty.hidden = !search || matches > 0; }
    }
    document.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-dialog-close')) { dialog.close(); return; }
        if (button.hasAttribute('data-close-toast')) { document.getElementById('roll-result').hidden = true; return; }
        if (button.dataset.tab) { state.tab = button.dataset.tab; state.search = ''; render(); return; }
        if (button.dataset.roll) { roll(button.dataset.roll, button.dataset.rollName || '擲骰'); return; }
        if (button.dataset.adjust && ['hp', 'mp'].includes(button.dataset.adjust)) {
            remember(); const key = button.dataset.adjust;
            c[key] = Math.max(0, Math.min(c[key === 'hp' ? 'maxHp' : 'maxMp'], c[key] + Number(button.dataset.delta)));
            persist(); render(); return;
        }
        if (button.dataset.advantage) { state.advantage = button.dataset.advantage; render(); return; }
        switch (button.dataset.action) {
            case 'about':
                openDialog('同一個角色，五種閱讀方式', `<p class="dialog-intro">這是獨立的設計試玩。可調整生命與資源、試擲骰、編輯人物、寫筆記。內容只保存在這個瀏覽器，不會更新正式角色卡或發送到聊天頻道。</p><div class="concept-list">${designs.map((d, i) => `<a href="/card${i + 1}"><span>0${i + 1}</span><div><strong>${d.name}</strong><small>${esc(d.idea)}</small></div>${icon('arrow')}</a>`).join('')}</div><button type="button" class="sheet-button" data-action="reset">重設目前範例</button>`); break;
            case 'edit':
                openDialog('編輯範例人物', `<form id="character-edit"><label>角色名稱<input name="name" value="${esc(c.name)}" maxlength="60" required></label><label>一句話<textarea name="quote" maxlength="300" rows="2">${esc(c.quote)}</textarea></label><label>角色故事<textarea name="bio" maxlength="1500" rows="5">${esc(c.bio)}</textarea></label><p class="local-note">只修改此瀏覽器的範例，五款設計共用同一份資料。</p><button type="submit" class="sheet-button primary">儲存範例</button></form>`); break;
            case 'character': document.getElementById('sample-select').focus(); document.getElementById('sample-select').showPicker?.(); break;
            case 'rest': remember(); c.hp = c.maxHp; c.mp = c.maxMp; persist(); render(); toast('範例資源已回滿', '生命值及主要資源已恢復；可按復原撤回。'); break;
            case 'undo': if (undo.length) { c = undo.pop(); persist(); render(); toast('已復原上一個範例修改'); } else toast('目前沒有可復原的修改'); break;
            case 'next-turn': state.round++; render(); toast(`第 ${state.round} 回合`, '戰術台的回合標記已前進。'); break;
            case 'toggle-inspiration': remember(); c.inspiration = !c.inspiration; persist(); render(); toast(c.inspiration ? '已標記激勵' : '已移除激勵'); break;
            case 'add-note': if (c.notes.length >= 20) { toast('範例最多可保存 20 則筆記'); break; } remember(); c.notes.push({ title: '新的旅途紀錄', text: '' }); persist(); render(); root.querySelector(`#note-${c.notes.length - 1}`)?.focus(); break;
            case 'reset': remember(); c = clone(samples[sampleId]); persist(); if (dialog.open) dialog.close(); render(); toast('目前範例已重設', '可按復原撤回。'); break;
        }
    });
    document.addEventListener('change', event => {
        if (event.target.id === 'sample-select') { sampleId = event.target.value; state.tab = 'overview'; state.search = ''; state.rolls = []; state.round = 1; state.advantage = 'normal'; undo = []; loadSample(); persist(); render(); }
        if (event.target.hasAttribute('data-note-index')) { const index = Number(event.target.dataset.noteIndex); if (c.notes[index]) { remember(); c.notes[index].text = event.target.value.slice(0, 3000); const saved = persist(); toast(saved ? '筆記已儲存' : '筆記已更新，但瀏覽器未允許保存', '只儲存在此瀏覽器的範例角色。'); } }
    });
    document.addEventListener('input', event => { if (event.target.hasAttribute('data-skill-search')) { state.search = event.target.value; applySearch(state.search); } });
    document.addEventListener('submit', event => {
        if (event.target.id !== 'character-edit') return;
        event.preventDefault();
        const form = new FormData(event.target);
        const name = String(form.get('name')).trim();
        if (!name) { event.target.elements.name.setCustomValidity('請輸入角色名稱'); event.target.elements.name.reportValidity(); return; }
        remember(); c.name = name.slice(0, 60); c.quote = String(form.get('quote')).slice(0, 300); c.bio = String(form.get('bio')).slice(0, 1500);
        const saved = persist(); dialog.close(); render(); toast(saved ? '範例人物已儲存' : '範例已更新，但瀏覽器未允許保存');
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    loadSample(); render();
}());
