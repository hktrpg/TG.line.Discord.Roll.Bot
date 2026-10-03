(async function () {
    'use strict';
    const M = window.CardaModel;
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const root = document.getElementById('atelier-root');
    const dialog = document.getElementById('atelier-dialog');
    const params = new URLSearchParams(location.search);
    const live = window.CardtLive || null;
    const pathId = Number(location.pathname.match(/^\/card[at](\d+)\/?$/)?.[1] || params.get('design') || 1);
    let id = Number.isInteger(pathId) && pathId >= 1 && pathId <= 20 ? pathId : 1;
    let theme = window.CardaThemes[id];
    const state = { system: live ? (['auto', 'coc', 'dnd', 'generic'].includes(params.get('system')) ? params.get('system') : 'auto') : params.get('system') === 'dnd' ? 'dnd' : 'coc', density: params.get('density') === 'open' ? 'open' : 'summary', mode: 'normal', action: 'all', spell: 'all', feature: 'all', activeSection: 'skills', activeGroup: 'core', displayMode: 'single', selectedSections: ['skills'], search: '', history: [] };
    const dataCache = {};
    let data, original, undo = [], toastTimer, loadToken = 0;
    const labels = { attributes: ['屬性', 'ABILITY'], saves: ['豁免', 'SAVES'], senses: ['感官', 'SENSES'], training: ['熟練與語言', 'TRAINING'], skills: ['技能', 'SKILLS'], actions: ['行動與戰鬥', 'ACTIONS'], powers: ['法術', 'SPELLS'], features: ['特性與專長', 'FEATURES'], inventory: ['裝備與財產', 'INVENTORY'], background: ['背景與人物', 'BACKGROUND'], notes: ['筆記與額外資料', 'NOTES'], status: ['防禦與狀態', 'CONDITIONS'] };
    const symbols = { dice: '◇', arrow: '↗', plus: '+', minus: '−', undo: '↶', search: '⌕', star: '✧' };
    const icon = name => `<span class="a-icon" aria-hidden="true">${symbols[name] || '·'}</span>`;
    const button = (text, action, extra = '', className = '') => `<button type="button" class="${className}" data-act="${action}" ${extra}>${text}</button>`;
    const rollButton = (text, value, name, extra = '') => `<button type="button" class="a-roll" data-roll="${esc(value)}" data-roll-name="${esc(name)}" ${extra}>${esc(text)}</button>`;
    const keyValue = (label, value) => `<div class="a-kv"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
    const resource = key => data.resources.find(r => r.key === key);
    const short = (value, max = 100) => { const text = String(value ?? ''); return text.length > max ? text.slice(0, max) + '…' : text; };
    const sectionOrder = () => live ? live.sectionOrder() : theme.order;
    const total = key => live ? live.count(key) : ({ skills: data.skills.length, actions: data.actions.length, powers: data.system === 'dnd' ? data.spells.length : (data.unfilledSkillSlots?.length || 0), features: data.features.length, inventory: data.inventory.length, background: data.background.length, notes: data.notes.length })[key];
    function sectionLabel(key) {
        if (live) return live.sectionLabel(key);
        if (data.system === 'coc') return ({ saves: ['三段判定', 'CHECKS'], senses: ['理智與感知', 'SANITY'], training: ['職業與成長', 'DEVELOPMENT'], powers: ['神話與專長', 'MYTHOS'], features: ['特徵與年齡', 'TRAITS'] })[key] || labels[key];
        return labels[key];
    }
    function notice(title, detail = '') {
        const el = document.getElementById('atelier-toast');
        el.innerHTML = `<span class="a-toast-die">◇</span><div><strong>${esc(title)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div>${button('×', 'close-toast', 'aria-label="關閉通知"')}`;
        el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 6000);
    }
    function save() {
        if (live) return false;
        try { localStorage.setItem('hktrpg.carda.shared.v1.' + state.system, JSON.stringify(data)); return true; }
        catch { notice('本機保存未成功', '瀏覽器儲存空間不足或未允許保存，目前內容仍在此頁。'); return false; }
    }
    function checkpoint() { undo.push(M.clone(data)); if (undo.length > 30) undo.shift(); }
    function changed(message) { const ok = save(); render(); if (message && ok) notice(message, '同系統的 20 款設計共用這份本機資料。'); }
    function links() { return Object.entries(window.CardaThemes).map(([n, t]) => `<a class="${Number(n) === id ? 'is-active' : ''}" ${live ? `data-live-design="${n}"` : ''} href="/card${live ? 't' : 'a'}${n}?system=${state.system}&density=${state.density}" title="${esc(t.name)}" ${Number(n) === id ? 'aria-current="page"' : ''}><span>${String(n).padStart(2, '0')}</span><b>${esc(t.name)}</b></a>`).join(''); }
    function toolbar() {
        if (live) return live.toolbar({ state, links: links(), button });
        return `<header class="a-toolbar"><a class="a-brand" href="/card">◇ <strong>HKTRPG</strong><span>CHARACTER LAB / A</span></a><div class="a-toolbar-controls"><div class="a-segment" aria-label="遊戲系統">${button('CoC 7e', 'system', `data-value="coc" aria-pressed="${state.system === 'coc'}"`)}${button('D&D 5e', 'system', `data-value="dnd" aria-pressed="${state.system === 'dnd'}"`)}</div><div class="a-segment" aria-label="資料密度">${button('總結版', 'density', `data-value="summary" aria-pressed="${state.density === 'summary'}"`)}${button('開放版', 'density', `data-value="open" aria-pressed="${state.density === 'open'}"`)}</div>${button('20 款總覽', 'gallery', '', 'a-gallery-button')}${button('資料來源', 'sources', '', 'a-source-button')}</div></header><nav class="a-design-nav" aria-label="角色卡設計">${links()}</nav>`;
    }
    const portrait = (cls = '') => `<img class="a-portrait ${cls}" src="${esc(data.portrait)}" alt="${esc(data.name)}角色肖像" width="72" height="72">`;
    const identityFields = (count = 3) => `<dl class="a-id-facts">${data.identity.slice(0, count).map(i => `<div><dt>${esc(i.label)}</dt><dd>${esc(i.value || '—')}</dd></div>`).join('')}</dl>`;
    function identityTools() {
        if (live) return live.identityTools(button);
        return `<div class="a-identity-tools">${button('編輯資料', 'edit')}${button(state.system === 'dnd' ? '短休' : '調整資源', state.system === 'dnd' ? 'short-rest' : 'resources')}${state.system === 'dnd' ? button('長休', 'long-rest') : ''}${button('↶', 'undo', 'aria-label="復原上次修改" title="復原上次修改"')}</div><small class="a-local-status"><i></i>${state.density === 'summary' ? '總結版 · 資料可展開' : '開放版 · 完整資料'}</small>`;
    }
    function identity() {
        const no = String(id).padStart(2, '0');
        const field = (label, value) => `<span class="a-id-tag"><small>${esc(label)}</small><b>${esc(value || '—')}</b></span>`;
        const identityBody = (() => {
            switch (id) {
                case 1: return `<div class="a-id-dossier"><div class="a-id-photo">${portrait()}</div><div class="a-id-copy"><span class="a-id-stamp">CASE FILE / ${esc(data.edition)} / ${no}</span><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p>${identityFields(4)}</div><aside>${field('PLAYER', data.player)}<b class="a-id-seal">FILED</b></aside></div>`;
                case 2: return `<div class="a-id-cockpit"><div class="a-id-pilot">${portrait()}<span>OPERATOR ${no}</span></div><div class="a-id-readout"><small>CHARACTER SIGNAL · ${esc(data.edition)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)} <i>／ ${esc(data.player)}</i></p></div><div class="a-id-frequency">${field('ROLE', data.identity.find(x => /職業|class/i.test(x.label))?.value || data.subtitle)}${field('LINK', 'CONNECTED')}</div></div>`;
                case 3: return `<div class="a-id-ledger"><div class="a-id-ledger-no">${no}<small>ACCOUNT</small></div><div><span>角色總帳 / ${esc(data.edition)}</span><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)} · ${esc(data.player)}</p></div>${identityFields(4)}</div>`;
                case 4: return `<div class="a-id-index"><div class="a-id-index-number">A${no}</div><div><small>PERSON INDEX / ${esc(data.edition)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p></div>${portrait('is-index-mark')}${identityFields(3)}</div>`;
                case 5: return `<div class="a-id-gazette"><div class="a-id-paper-mark">THE PLAYER'S GAZETTE <b>VOL. ${no}</b></div><h1>${esc(data.name)}</h1><div class="a-id-deck"><span>${esc(data.subtitle)}</span><span>記錄者 ${esc(data.player)}</span><span>${esc(data.edition)}</span></div><div class="a-id-gazette-photo">${portrait()}</div>${identityFields(3)}</div>`;
                case 6: return `<div class="a-id-manuscript"><div class="a-id-illuminated">${portrait()}</div><div class="a-id-script"><span>LIBER PERSONAE · ${no}</span><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p><blockquote>${esc(data.identity.find(x => /年齡|age/i.test(x.label))?.value || data.player)} <i>— ${esc(data.edition)}</i></blockquote></div><div class="a-id-colophon">抄錄<br>${esc(data.player)}</div></div>`;
                case 7: return `<div class="a-id-transit"><span class="a-id-route-origin">START / ${no}</span><div class="a-id-station">${portrait()}<span><small>TRAVELLER</small><h1>${esc(data.name)}</h1><b>${esc(data.subtitle)}</b></span></div><div class="a-id-route-meta">${field('PLAYER', data.player)}${field('EDITION', data.edition)}</div><span class="a-id-route-dest">NEXT →</span></div>`;
                case 8: return `<div class="a-id-blueprint"><div class="a-id-blueprint-title"><span>DWG. ${no} / ${esc(data.edition)}</span><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p></div><div class="a-id-blueprint-photo">${portrait()}</div><div class="a-id-blueprint-meta">${identityFields(4)}<small>DESIGN AUTHOR / ${esc(data.player)}</small></div></div>`;
                case 9: return `<div class="a-id-lab"><div class="a-id-specimen"><span>SAMPLE</span>${portrait()}<b>${no}</b></div><div class="a-id-assay"><small>SUBJECT PROFILE · ${esc(data.edition)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p>${identityFields(3)}</div><div class="a-id-lab-state"><i></i> VERIFIED<br><b>${esc(data.player)}</b></div></div>`;
                case 10: return `<div class="a-id-terminal"><span class="a-id-terminal-prompt">hktrpg@character:~$ cat /records/${no}</span><div class="a-id-terminal-person">${portrait()}<div><small>NAME =</small><h1>${esc(data.name)}</h1><p>CLASS = ${esc(data.subtitle)}</p><p>OWNER = ${esc(data.player)}</p><p>EDITION = ${esc(data.edition)}</p></div></div><span class="a-id-terminal-cursor">█</span></div>`;
                case 11: return `<div class="a-id-atlas"><div class="a-id-atlas-coordinate">N<br><b>＋</b><small>MAP ${no}</small></div><div class="a-id-atlas-title">${portrait()}<span><small>FIELD SUBJECT / ${esc(data.edition)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)} · ${esc(data.player)}</p></span></div>${identityFields(3)}</div>`;
                case 12: return `<div class="a-id-observatory"><div class="a-id-orbit">${portrait()}<span>${no}</span></div><div class="a-id-celestial"><small>OBSERVATION LOG / ${esc(data.edition)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p><span>RECORDED BY ${esc(data.player)}</span></div>${identityFields(3)}</div>`;
                case 13: return `<div class="a-id-dispatch"><div class="a-id-dispatch-head"><span>PERSONNEL DISPATCH / ${no}</span><b>READY</b></div><div class="a-id-dispatch-main">${portrait()}<div><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p></div><div class="a-id-dispatch-owner"><small>ASSIGNED TO</small><b>${esc(data.player)}</b></div></div><div class="a-id-dispatch-foot">${identityFields(4)}</div></div>`;
                case 14: return `<div class="a-id-folio"><div class="a-id-folio-side">PERSONAE<br>${no}<br>·<br>${esc(data.edition)}</div><div class="a-id-folio-center"><small>MEMORIA / CHARACTER PORTRAIT</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p><span>✦</span><i>${esc(data.player)}</i></div><div class="a-id-folio-photo">${portrait()}</div></div>`;
                case 15: return `<div class="a-id-catalog"><div class="a-id-catalog-photo">${portrait()}</div><div class="a-id-catalog-ref"><small>CATALOGUE RECORD</small><b>A-${no}-${String(data.name.length).padStart(2, '0')}</b><div class="a-id-barcode">▥ ▥ ▤ ▥ ▥ ▤ ▥ ▤</div></div><div class="a-id-catalog-title"><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p>${identityFields(4)}</div></div>`;
                case 16: return `<div class="a-id-manual"><div class="a-id-spine">FIELD NOTES / ${no}</div><div class="a-id-manual-mark">${portrait()}<span>SUBJECT FILE</span></div><div class="a-id-manual-copy"><small>${esc(data.edition)} · ${esc(data.player)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p>${identityFields(3)}</div><div class="a-id-manual-index">USE / RECORD / SURVIVE</div></div>`;
                case 17: return `<div class="a-id-monolith"><div class="a-id-monolith-image">${portrait()}</div><div class="a-id-monolith-copy"><span>CHARACTER ${no} / ${esc(data.edition)}</span><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p><b>${esc(data.player)}</b></div><div class="a-id-monolith-mark">${no}</div></div>`;
                case 18: return `<div class="a-id-air"><div class="a-id-air-top"><span>${no} / ${esc(data.edition)}</span>${portrait()}</div><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)} <i>— ${esc(data.player)}</i></p><div class="a-id-air-rule"></div>${identityFields(3)}</div>`;
                case 19: return `<div class="a-id-circuit"><div class="a-id-status-light"><i></i><span>ONLINE</span><b>${no}</b></div><div class="a-id-circuit-person">${portrait()}<div><small>NODE ID / ${esc(data.edition)}</small><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p></div></div><div class="a-id-circuit-owner"><span>USER</span><b>${esc(data.player)}</b></div></div>`;
                default: return `<div class="a-id-archive"><div class="a-id-archive-label">ARCHIVE / PERSON ${no} / ${esc(data.edition)}</div><div class="a-id-archive-photo">${portrait()}</div><div class="a-id-archive-main"><h1>${esc(data.name)}</h1><p>${esc(data.subtitle)}</p><span>註冊玩家：${esc(data.player)}</span></div>${identityFields(4)}<div class="a-id-archive-seal">保存<br>中</div></div>`;
            }
        })();
        return `<header class="a-identity a-identity-${id}">${identityBody}<div class="a-identity-utility">${identityTools()}<span class="a-theme-name">${esc(theme.name)} · ${live ? 'T' : 'A'}${no}</span></div></header>`;
    }
    function resourceStrip() {
        if (live) return live.resourceStrip({ button });
        const resources = data.resources.map(r => `<div class="a-resource"><span>${esc(r.label)}</span><div class="a-resource-value">${button('−', 'adjust', `data-key="${r.key}" data-delta="-1" aria-label="${esc(r.label)}減少 1" ${r.current <= 0 ? 'disabled' : ''}`)}<strong>${r.current}<small>${r.key === 'temp' ? '' : '/' + r.max}</small></strong>${button('+', 'adjust', `data-key="${r.key}" data-delta="1" aria-label="${esc(r.label)}增加 1" ${r.current >= r.max ? 'disabled' : ''}`)}</div><div class="a-resource-track" role="meter" aria-label="${esc(r.label)}" aria-valuemin="0" aria-valuemax="${r.max}" aria-valuenow="${r.current}"><i style="width:${r.max ? r.current / r.max * 100 : 0}%"></i></div></div>`).join('');
        const combat = data.combatStats.map(s => keyValue(s.label, s.value)).join('');
        return `<section class="a-resource-strip a-resource-form-${id}" aria-label="角色資源" data-resource-form="${id}">${resources}<div class="a-combat-strip">${combat}</div></section>`;
    }
    function attributes() {
        return `<div class="a-attributes a-attributes-${id}" data-attribute-form="${id}">${data.attributes.map((a, index) => `<button type="button" class="a-attribute" data-roll="${M.notation(data, state.system === 'coc' ? a.value : M.modifier(data, a.key))}" data-roll-name="${esc(a.name)}檢定" aria-label="擲${esc(a.name)}檢定"><span>${esc(a.key)} <small>${esc(a.name)}</small></span><strong>${a.value}</strong><em>${state.system === 'coc' ? `${Math.floor(a.value / 2)} / ${Math.floor(a.value / 5)}` : M.signed(M.modifier(data, a.key))}</em><i class="a-attribute-gauge" style="--attribute-fill:${Math.max(0, Math.min(100, state.system === 'coc' ? a.value : a.value * 5))}%" aria-hidden="true">${String(index + 1).padStart(2, '0')}</i></button>`).join('')}</div>`;
    }
    function saves() {
        if (state.system === 'coc') return `<div class="a-check-guide"><span>一般 <b>≤ 技能值</b></span><span>困難 <b>≤ ½</b></span><span>極難 <b>≤ ⅕</b></span></div><div class="a-small-copy">属性及技能同時列出一般／困難／極難。◇ 點數值擲骰；☑ 標記成長。</div><div class="a-check-shortcuts">${rollButton('幸運 ' + resource('luck').current, 'cc:' + resource('luck').current, '幸運檢定')}${rollButton('SAN ' + resource('san').current, 'cc:' + resource('san').current, '理智檢定')}</div>`;
        return `<div class="a-save-grid">${data.saves.map(s => { const val = M.modifier(data, s.key) + (s.proficient ? data.proficiency : 0); return `<div class="a-row"><span class="a-prof ${s.proficient ? 'trained' : ''}" title="${s.proficient ? '熟練' : '未熟練'}">${s.proficient ? '●' : '○'}</span><span>${esc(s.key)} ${esc(s.name)}</span>${rollButton(M.signed(val), '1d20' + M.signed(val), s.name + '豁免')}</div>`; }).join('')}</div><p class="a-footnote">對抗魅惑的豁免具有優勢。</p>`;
    }
    function senses() { return `<div class="a-kv-grid">${data.senses.map(s => keyValue(s.label, s.value)).join('')}</div>${state.system === 'coc' ? `<div class="a-small-copy">SAN 初始 ${data.sanity?.initial ?? '—'} · 每日損失 ${data.sanity?.dailyLoss ?? 0}<br>⅕ 損失線 ${data.sanity?.oneFifth ?? '—'} · 神話 ${data.sanity?.mythos ?? 0}</div>` : ''}`; }
    function training(full) { return `<div class="a-training">${data.training.map(t => `<div class="a-training-row"><strong>${esc(t.label)}</strong><span${!full ? ' class="a-clip-line"' : ''} title="${esc(t.value)}">${esc(t.value)}</span></div>`).join('')}</div>`; }
    function skills(full) {
        const list = data.skills.map((s, index) => ({ ...s, index }));
        const head = `<div class="a-table-caption"><span>${state.system === 'coc' ? '成長／技能' : '熟練／屬性／技能'}</span><span>${state.system === 'coc' ? '一般　½　⅕' : '加值'}</span></div>`;
        return `${full ? `<label class="a-search">${icon('search')}<input type="search" data-search="skills" placeholder="搜尋全部 ${data.skills.length} 項技能" aria-label="搜尋技能"></label>` : ''}${head}<div class="a-skill-grid a-skill-grid-${id}" data-skill-form="${id}">${list.map((s, rank) => { const val = M.skillValue(data, s); const ability = state.system === 'coc' ? '<span class="a-ability-key is-empty" aria-hidden="true"></span>' : `<span class="a-ability-key">${esc(s.key)}</span>`; const pct = Math.max(0, Math.min(100, val)); return `<div class="a-skill" data-rank="${rank + 1}" data-search-text="${esc(s.name + ' ' + (s.group || s.key || ''))}" title="${esc(state.system === 'coc' ? `${s.group} · 初始 ${s.base} · 職業 ${s.occupationPoints || 0} · 興趣 ${s.interestPoints || 0} · 成長 ${s.growthPoints || 0}` : s.name)}"><i class="a-skill-meter" aria-hidden="true" style="--skill-fill:${pct}%"></i>${state.system === 'coc' ? `<input type="checkbox" data-growth="${s.index}" aria-label="${esc(s.name)}成長標記" ${s.developmentChecked ? 'checked' : ''}>` : `<span class="a-prof ${s.proficient ? 'trained' : ''}">${s.proficient ? '●' : '○'}</span>`}${ability}<span class="a-skill-name">${esc(s.name)}${s.occupation ? '<small>★</small>' : ''}</span>${rollButton(state.system === 'coc' ? val : M.signed(val), M.notation(data, val), s.name)}${state.system === 'coc' ? `<span class="a-fractions">${Math.floor(val / 2)}<i>/</i>${Math.floor(val / 5)}</span>` : ''}<small class="a-skill-origin">${esc(s.group || s.key || (s.proficient ? '熟練' : '一般'))}</small></div>`; }).join('')}</div><p class="a-search-empty" hidden>沒有符合的技能。</p>${state.system === 'coc' ? `<p class="a-footnote">★ 本職技能；${data.unfilledSkillSlots.length} 個未填專長欄位保留在「神話與專長」。${full ? '滑鼠停在行上可看初始與分配點數。' : ''}</p>` : ''}`;
    }
    function actions(full) {
        const filters = [['all', '全部'], ['attack', '攻擊'], ['action', '動作'], ['bonus', '附贈'], ['reaction', '反應'], ['other', '其他']];
        const all = data.actions.map((a, index) => ({ ...a, index, hit: M.actionHitValue(data, a) }));
        const list = state.action === 'all' ? all : all.filter(a => a.type === state.action);
        const shown = full ? list : all;
        return `${state.system === 'dnd' && full ? `<div class="a-filter">${filters.map(([key, name]) => button(name, 'filter-action', `data-value="${key}" aria-pressed="${state.action === key}"`)).join('')}</div>` : ''}<div class="a-actions">${shown.map(a => `<div class="a-action"><div class="a-action-primary">${button(esc(a.name), 'action-detail', `data-index="${a.index}"`, 'a-item-name')}<span class="a-range">${esc(a.range)}</span>${a.hit !== '—' ? rollButton(String(a.hit) + (state.system === 'coc' ? '%' : ''), M.notation(data, a.hit), a.name + '命中') : '<span class="a-muted">—</span>'}${/^[\dd+\-]+$/i.test(a.damage) ? rollButton(a.damage, a.damage, a.name + '傷害', 'data-kind="damage"') : `<span class="a-effect">${esc(a.damage)}</span>`}</div>${full ? `<div class="a-action-description">${esc(a.notes)}${state.system === 'coc' ? `<br>攻擊／回合 ${esc(a.uses)} · 彈數 ${esc(a.ammo)} · 故障 ${esc(a.malfunction)} · 貫穿 ${a.impale ? '是' : '否'}` : ''}</div>` : ''}</div>`).join('')}</div>${full && data.combatOptions ? `<details class="a-rule-reference"><summary>Actions in Combat · 通用戰鬥行動</summary><p>${esc(data.combatOptions.join(' · '))}</p></details>` : ''}`;
    }
    function slots() { return `<div class="a-slots">${data.slots.map(slot => `<div><span>${slot.level}環</span><div>${Array.from({ length: slot.max }, (_, index) => button(index < slot.current ? '●' : '○', 'slot', `data-level="${slot.level}" data-value="${index < slot.current ? index : index + 1}" aria-label="${slot.level}環法術位設為 ${index < slot.current ? index : index + 1}"`, 'a-slot-dot')).join('')}</div><small>${slot.current}/${slot.max}</small></div>`).join('')}</div>`; }
    function powers(full) {
        if (state.system === 'coc') return `<div class="a-kv-grid">${keyValue('克蘇魯神話', data.sanity?.mythos ?? 0)}${keyValue('已知法術', data.spells.length)}${keyValue('未填專長欄', data.unfilledSkillSlots?.length || 0)}</div><p class="a-small-copy">來源未填已知法術，保留空欄。未命名的學問、語言、駕駛與專長欄位可在完整資料查看。</p><div class="a-template-slots">${(data.unfilledSkillSlots || []).map((s, i) => keyValue(`${s.group} ${i + 1}`, `${s.value}%`)).join('')}</div>`;
        let spells = data.spells.map((s, index) => ({ ...s, index }));
        if (full && state.spell !== 'all') spells = spells.filter(s => s.level === Number(state.spell));
        return `<div class="a-spell-metrics"><span>WIS <b>+4</b></span><span>攻擊 <b>+7</b></span><span>DC <b>15</b></span></div>${slots()}${full ? `<label class="a-search">${icon('search')}<input type="search" data-search="spells" placeholder="搜尋法術、時間、效果、標籤" aria-label="搜尋法術"></label><div class="a-filter">${[['all', '全部'], ['0', '戲法'], ['1', '1 環'], ['2', '2 環'], ['3', '3 環']].map(([val, label]) => button(label, 'filter-spell', `data-value="${val}" aria-pressed="${state.spell === val}"`)).join('')}</div>` : ''}<div class="a-spell-list ${full ? 'is-full' : ''}">${spells.map(s => `<div class="a-power" data-search-text="${esc([s.name, s.zh, s.time, s.effect, s.notes].join(' '))}"><span class="a-spell-level">${s.level || '○'}</span>${button(esc(s.name), 'spell-detail', `data-index="${s.index}"`, 'a-item-name')}<span class="a-spell-time">${esc(s.time)}</span><span class="a-spell-tags">${s.concentration ? '<abbr title="專注 Concentration">C</abbr>' : ''}${s.ritual ? '<abbr title="儀式 Ritual">R</abbr>' : ''}</span>${full ? `<span class="a-spell-range">${esc(s.range)}</span><span class="a-spell-effect">${esc(s.effect)}</span>${button(s.level ? '施放' : '隨意', 'spell-detail', `data-index="${s.index}"`, 'a-cast-button')}<small>${esc(s.zh)} · ${esc(s.hit)} · ${esc(s.notes)}</small>` : ''}</div>`).join('')}</div><p class="a-search-empty" hidden>沒有符合的法術。</p>`;
    }
    function features(full) {
        const all = data.features.map((f, index) => ({ ...f, index }));
        const list = full && state.feature !== 'all' ? all.filter(f => f.category === state.feature) : all;
        return `${full && state.system === 'dnd' ? `<div class="a-filter">${[['all', '全部'], ['class', '職業'], ['species', '種族'], ['feat', '專長']].map(([key, label]) => button(label, 'filter-feature', `data-value="${key}" aria-pressed="${state.feature === key}"`)).join('')}</div>` : ''}<div class="a-feature-list">${list.map(f => `<div class="a-feature">${button(esc(f.name), 'feature-detail', `data-index="${f.index}"`, 'a-item-name')}${full ? `<span class="a-feature-category">${esc(f.category)} · ${esc(f.source)}</span><p>${esc(f.text)}</p>` : `<small title="${esc(f.summary || f.text)}">${esc(short(f.summary || f.text, 90))}</small>`}</div>`).join('')}</div>`;
    }
    function inventory(full) {
        return `<div class="a-inventory-list">${data.inventory.map(item => `<div class="a-row"><strong>${esc(item.name)}</strong><span>× ${esc(item.quantity ?? '—')}</span>${full ? `<small>${esc(item.detail)}</small>` : ''}</div>`).join('')}</div><div class="a-wealth">${data.wealth.map(w => keyValue(w.label, w.value)).join('')}</div>`;
    }
    function background(full) {
        if (full) return `<dl class="a-background-full">${data.identity.map(i => `<div><dt>${esc(i.label)}</dt><dd>${esc(i.value)}</dd></div>`).join('')}${data.background.map(b => `<div><dt>${esc(b.label)}</dt><dd>${esc(b.text)}</dd></div>`).join('')}</dl>`;
        return `<dl class="a-background-summary">${data.identity.map(i => `<div><dt>${esc(i.label)}</dt><dd>${esc(i.value || '—')}</dd></div>`).join('')}${data.background.map(b => `<div title="${esc(b.text)}"><dt>${esc(b.label)}</dt><dd>${esc(short(b.text, 90))}</dd></div>`).join('')}</dl>`;
    }
    function notes(full) {
        if (full) return `<div class="a-notes-editor">${data.notes.map((n, index) => `<label class="a-note-edit"><span>${esc(n.title)}</span><textarea rows="${Math.min(12, Math.max(3, Math.ceil(n.text.length / 100)))}" maxlength="12000" data-note="${index}" aria-label="${esc(n.title)}">${esc(n.text)}</textarea></label>`).join('')}${button('+ 新增筆記', 'add-note', '', 'a-primary')}<p class="a-footnote">輸入時自動保存在此瀏覽器；所有 A 系列設計共用。</p></div>`;
        return `<div class="a-note-summaries">${data.notes.map(n => `<div class="a-mini-note"><strong>${esc(n.title)}</strong><p>${esc(short(n.text || '點開新增本次冒險紀錄。', 70))}</p></div>`).join('')}${button(`編輯全部 ${data.notes.length} 則筆記 ↗`, 'expand', 'data-section="notes"', 'a-more')}</div>`;
    }
    function status(full) {
        return `<div class="a-defense">${(data.defenses || []).map(d => `<span>◇ ${esc(d)}</span>`).join('')}</div><div class="a-conditions">${data.conditions.length ? data.conditions.map(c => button(esc(c) + ' ×', 'remove-condition', `data-value="${esc(c)}"`)).join('') : '<span class="a-clear-condition">目前無異常狀態</span>'}${button('+ 狀態', 'conditions')}</div>${state.system === 'dnd' ? `<label class="a-inspiration"><input type="checkbox" data-inspiration ${data.inspiration ? 'checked' : ''}> Heroic Inspiration</label><div class="a-death-saves"><span>死亡豁免</span><span>成功 ${[0, 1, 2].map(i => `<input type="checkbox" data-death="${i}" aria-label="死亡豁免成功 ${i + 1}" ${data.death?.[i] ? 'checked' : ''}>`).join('')}</span><span>失敗 ${[3, 4, 5].map(i => `<input type="checkbox" data-death="${i}" aria-label="死亡豁免失敗 ${i - 2}" ${data.death?.[i] ? 'checked' : ''}>`).join('')}</span></div>` : `<div class="a-small-copy">重傷、瀕死、昏迷及瘋狂狀態由玩家手動記錄。</div>`}${full ? history() : ''}`;
    }
    function history() { return `<div class="a-history"><h3>本次試擲</h3>${state.history.length ? state.history.slice(0, 20).map(r => `<div><strong>${esc(r.name)} <b>${r.value}</b></strong><small>${esc(r.detail)}</small></div>`).join('') : '<p class="a-muted">尚未擲骰。</p>'}</div>`; }
    const renderers = { attributes, saves, senses, training, skills, actions, powers, features, inventory, background, notes, status, other: notes };
    if (live) for (const key of Object.keys(renderers)) renderers[key] = full => live.section(key, full, { id, esc, button });
    function block(key, placeInThemeGrid = false) {
        if (live && !sectionOrder().includes(key)) return '';
        const [title, en] = sectionLabel(key);
        const placement = placeInThemeGrid ? ` style="grid-area:${key}"` : '';
        return `<section class="a-block block-${key} a-block-${id}" data-record-form="${id}" data-section-key="${key}"${placement} aria-labelledby="heading-${id}-${key}"><header class="a-block-head"><h2 id="heading-${id}-${key}"><span class="a-section-index">${String(sectionOrder().indexOf(key) + 1).padStart(2, '0')}</span>${title}<small>${en}</small></h2>${total(key) !== undefined ? `<span class="a-count">${total(key)}</span>` : ''}${button('↗', 'expand', `data-section="${key}" aria-label="展開${title}"`)}</header><div class="a-block-body">${renderers[key](state.density === 'open')}</div></section>`;
    }
    const sectionGroups = {
        core: ['attributes', 'saves', 'senses', 'status'],
        play: ['actions', 'powers'],
        build: ['skills', 'training'],
        story: ['features', 'inventory', 'background', 'notes', 'other']
    };
    const viewGroups = () => Object.fromEntries(Object.entries(sectionGroups).map(([key, keys]) => [key, keys.filter(item => sectionOrder().includes(item))]).filter(([, keys]) => keys.length));
    function visibleSections(keys = sectionOrder()) {
        if (state.displayMode === 'all') return keys;
        if (state.displayMode === 'multi') return keys.filter(key => state.selectedSections.includes(key));
        return [keys.includes(state.activeSection) ? state.activeSection : keys[0]].filter(Boolean);
    }
    function terminalCommand() {
        if (state.displayMode === 'all') return 'open --all';
        if (state.displayMode === 'multi') return 'open ' + (visibleSections().join(' + ') || '--empty');
        return 'open ' + state.activeSection;
    }
    function sectionIsPressed(key) {
        return state.displayMode === 'all' || (state.displayMode === 'multi' ? state.selectedSections.includes(key) : key === state.activeSection);
    }
    function selectedPanels(keys = sectionOrder()) {
        const selected = visibleSections(keys);
        return selected.length ? selected.map(key => block(key)).join('') : '<p class="a-multi-empty">尚未選擇內容；點目錄加入資料。</p>';
    }
    function stageDisplayControls(keys = sectionOrder(), top = false) {
        if (live && !top) return '';
        const scope = keys.join(',');
        const modes = [['single', '單項'], ['multi', '多選'], ['all', '全部顯示']];
        const controls = `<div class="a-display-controls ${top ? 't-top-display-controls' : ''}" role="group" aria-label="內容顯示方式"><span>內容顯示</span>${modes.map(([key, label]) => button(label, 'display-mode', `data-value="${key}" data-scope="${scope}" aria-pressed="${state.displayMode === key}"`)).join('')}${live ? '' : `<small>${visibleSections(keys).length} / ${keys.length}</small>`}</div>`;
        return live && top ? `<div class="t-view-navigation">${controls}<nav class="t-section-picker" aria-label="角色資料分類">${sectionButtons(keys, state.activeSection, 'view-section', 't-section-chip')}</nav></div>` : controls;
    }
    function sectionButtons(keys, active = state.activeSection, action = 'view-section', className = 'a-section-button') {
        return keys.filter(key => sectionOrder().includes(key)).map((key, index) => { const [title] = sectionLabel(key); const pressed = state.displayMode === 'all' || (state.displayMode === 'multi' ? state.selectedSections.includes(key) : key === active); return button(`<small>${String(index + 1).padStart(2, '0')}</small><span>${title}</span>`, action, `data-section="${key}" data-index-entry data-index-label="${esc(title + ' ' + key)}" aria-pressed="${pressed}"`, className); }).join('');
    }
    function stageGroupButtons(active = state.activeGroup) {
        const names = { core: '身心狀況', play: '行動法術', build: '技能訓練', story: '人物紀錄' };
        return Object.entries(viewGroups()).map(([key, keys]) => button(`${names[key]}<small>${keys.length}</small>`, 'view-group', `data-group="${key}" aria-pressed="${key === active}"`, 'a-group-button')).join('');
    }
    function stagePageControls(label = '頁') {
        const index = Math.max(0, sectionOrder().indexOf(state.activeSection));
        return `<div class="a-page-controls">${button('← 上一' + label, 'page-step', 'data-delta="-1"') }<span>${String(index + 1).padStart(2, '0')} / ${String(sectionOrder().length).padStart(2, '0')}　${sectionLabel(state.activeSection)[0]}</span>${button('下一' + label + ' →', 'page-step', 'data-delta="1"')}</div>`;
    }
    function chooseSection(key) {
        if (live) state.activeGroup = Object.keys(viewGroups()).find(group => viewGroups()[group].includes(key)) || state.activeGroup;
        if (state.displayMode === 'multi') {
            const index = state.selectedSections.indexOf(key);
            if (index >= 0) state.selectedSections.splice(index, 1);
            else state.selectedSections.push(key);
            if (state.selectedSections.length) state.activeSection = state.selectedSections.includes(key) ? key : state.selectedSections[0];
            else state.activeSection = key;
        } else {
            state.displayMode = 'single';
            state.selectedSections = [key];
            state.activeSection = key;
        }
        render();
    }
    function chooseDisplayMode(mode, scope) {
        const keys = scope.split(',').filter(key => sectionOrder().includes(key));
        const current = visibleSections(keys);
        if (!keys.length || !['single', 'multi', 'all'].includes(mode)) return;
        if (mode === 'all') state.selectedSections = keys.slice();
        else if (mode === 'single') {
            state.activeSection = current.includes(state.activeSection) ? state.activeSection : (current[0] || keys[0]);
            state.selectedSections = [state.activeSection];
        } else state.selectedSections = live && state.displayMode === 'all' ? [state.activeSection] : current.length ? current : (keys.includes(state.activeSection) ? [state.activeSection] : []);
        state.displayMode = mode;
        render();
    }
    function radarGraphic() {
        if (live && state.system === 'generic') return `<div class="a-kv-grid">${data.attributes.map(a => keyValue(a.name, a.value)).join('')}</div>`;
        const cx = 110, cy = 96, radius = 62, count = data.attributes.length;
        const points = data.attributes.map((a, index) => { const angle = Math.PI * 2 * index / count - Math.PI / 2; const raw = state.system === 'coc' ? a.value / 100 : Math.max(0, a.value / 20); const scale = Math.max(.07, Math.min(1, raw)); return { x: cx + Math.cos(angle) * radius * scale, y: cy + Math.sin(angle) * radius * scale, tx: cx + Math.cos(angle) * (radius + 19), ty: cy + Math.sin(angle) * (radius + 19), name: a.key, value: a.value }; });
        const ring = [1, 2, 3, 4].map(i => `<circle cx="${cx}" cy="${cy}" r="${radius * i / 4}"/>`).join('');
        const spokes = points.map(p => `<line x1="${cx}" y1="${cy}" x2="${cx + (p.x - cx) / Math.max(.07, Math.min(1, state.system === 'coc' ? Number(p.value) / 100 : Math.max(0, Number(p.value) / 20)))}" y2="${cy + (p.y - cy) / Math.max(.07, Math.min(1, state.system === 'coc' ? Number(p.value) / 100 : Math.max(0, Number(p.value) / 20)))}"/>`).join('');
        return `<svg class="a-radar" viewBox="0 0 220 192" role="img" aria-label="角色六項能力雷達圖">${ring}${spokes}<polygon points="${points.map(p => `${p.x},${p.y}`).join(' ')}"/><circle class="a-radar-core" cx="${cx}" cy="${cy}" r="3"/>${points.map(p => `<text x="${p.tx}" y="${p.ty}" text-anchor="middle">${esc(p.name)}</text>`).join('')}</svg>`;
    }
    function designStage() {
        const all = sectionOrder();
        if (live && !all.length) return '<div class="t-no-fields">這張角色卡暫無欄位；可在「管理角色」新增資料。</div>';
        if (live && state.density === 'summary') return `<div class="t-summary-layout" aria-label="角色資料速查">${selectedPanels(all)}</div>`;
        const shown = live ? visibleSections(all) : all;
        const visibleBlock = key => shown.includes(key) ? block(key) : '';
        const support = ['skills', 'training', 'features', 'inventory', 'background', 'notes', 'other'].filter(key => all.includes(key));
        const cards = keys => keys.map(key => block(key)).join('');
        const indexList = (keys = all, cls = 'a-index-list') => `<nav class="${cls}" aria-label="角色資料目錄">${sectionButtons(keys)}</nav>`;
        switch (id) {
            case 1: return `<div class="a-stage a-stage-dossier"><div class="a-dossier-kicker"><span>CASE FILE / ${esc(data.edition)}</span><span>已記錄 ${data.skills.length} 項技能 · ${data.actions.length} 項行動</span></div><div class="a-layout">${shown.map(key => block(key, true)).join('')}</div></div>`;
            case 2: {
                const columns = [
                    ['a-cockpit-score', ['attributes', 'saves']],
                    ['a-cockpit-main', ['actions', 'powers']],
                    ['a-cockpit-side', ['status', 'senses']]
                ].filter(([, keys]) => keys.some(key => shown.includes(key)));
                const top = columns.map(([className, keys]) => `<div class="${className}">${keys.filter(key => shown.includes(key)).map(key => block(key)).join('')}</div>`).join('');
                const deck = !live || support.some(key => shown.includes(key)) ? `<div class="a-cockpit-deck"><div class="a-cockpit-label">SUPPORT SYSTEMS <span>選擇面板，切換工作區</span></div>${stageDisplayControls(support)}${indexList(support, 'a-command-keys')}<main class="a-cockpit-support">${selectedPanels(support)}</main></div>` : '';
                return `<div class="a-stage a-stage-cockpit">${top ? `<div class="a-cockpit-top${live ? ' t-cockpit-top' : ''}">${top}</div>` : ''}${deck}</div>`;
            }
            case 3: return `<div class="a-stage a-stage-ledger"><div class="a-ledger-caption"><span>角色帳簿 / ${esc(data.name)}</span><span>逐行核對 · 點數值擲骰 · ${live ? '長文可展開' : '↗ 開全文'}</span></div><div class="a-ledger-table">${shown.map(key => `<div class="a-ledger-entry"><span class="a-ledger-no">${String(all.indexOf(key) + 1).padStart(2, '0')}</span>${block(key)}</div>`).join('')}</div></div>`;
            case 4: return `<div class="a-stage a-stage-index"><aside class="a-index-sidebar"><span class="a-index-heading">INDEX / ${all.length} 條目</span>${indexList(all)}<small>選一項，右側即時切換內容</small></aside><main class="a-index-reader">${stageDisplayControls(all)}${selectedPanels(all)}</main></div>`;
            case 5: return `<div class="a-stage a-stage-gazette"><div class="a-gazette-masthead"><span>THE ADVENTURER'S GAZETTE</span><span>EDITION ${String(id).padStart(2, '0')} · ${esc(data.edition)}</span></div>${shown.some(key => ['background', 'attributes'].includes(key)) ? `<div class="a-gazette-lead">${visibleBlock('background')}${visibleBlock('attributes')}</div>` : ''}<div class="a-layout a-gazette-columns">${shown.filter(key => !['background', 'attributes'].includes(key)).map(key => block(key)).join('')}</div></div>`;
            case 6: return `<div class="a-stage a-stage-manuscript"><aside class="a-book-contents"><span>CONTENTS / 卷目</span>${indexList(all, 'a-chapter-list')}</aside><main class="a-manuscript-page">${stageDisplayControls(all)}<div class="a-manuscript-meta">旅人抄本 · ${esc(data.edition)} · 第 ${sectionOrder().indexOf(state.activeSection) + 1} 章</div>${selectedPanels(all)}${stagePageControls('章節')}</main></div>`;
            case 7: return `<div class="a-stage a-stage-transit"><div class="a-route-line"><span class="a-route-start">你在這裏</span>${sectionButtons(all, state.activeSection, 'view-section', 'a-route-stop')}<span class="a-route-end">記錄完畢</span></div><main class="a-route-destination"><div class="a-route-coordinates">ROUTE / ${String(all.indexOf(state.activeSection) + 1).padStart(2, '0')} · ${esc(theme.english)}</div>${stageDisplayControls(all)}${selectedPanels(all)}</main></div>`;
            case 8: return `<div class="a-stage a-stage-blueprint"><div class="a-blueprint-ruler"><span>REF. CHARACTER STRUCTURE</span><span>1 UNIT = 1 RECORD</span></div><div class="a-blueprint-grid">${shown.map(key => { const index = all.indexOf(key); return `<div class="a-blueprint-cell"><span class="a-coordinate">${String.fromCharCode(65 + index % 4)}-${String(Math.floor(index / 4) + 1).padStart(2, '0')}</span>${block(key)}</div>`; }).join('')}</div><div class="a-blueprint-footer">測繪完成　/　${all.length} 個模組・${data.skills.length} 項技能</div></div>`;
            case 9: return `<div class="a-stage a-stage-lab"><aside class="a-lab-rack"><div class="a-lab-label">LAB / MODULE SELECT</div>${stageGroupButtons()}</aside><main class="a-lab-bench"><div class="a-lab-readout"><span>ACTIVE MODULE</span><strong>${live && state.displayMode === 'all' ? '全部資料' : ({ core: '生理與狀態', play: '操作與能力', build: '技能與訓練', story: '人物檔案' })[state.activeGroup]}</strong><i>${live ? shown.length : viewGroups()[state.activeGroup].length} 個檢測項目</i></div><div class="a-lab-modules">${cards(live ? shown : viewGroups()[state.activeGroup])}</div></main></div>`;
            case 10: return `<div class="a-stage a-stage-terminal"><div class="a-terminal-bar"><span>CHARACTER SHELL / ${esc(data.edition)}</span><span>SESSION READY</span></div><div class="a-terminal-layout"><nav class="a-terminal-prompts" aria-label="輸入資料指令"><label><b>&gt;_</b><input type="search" data-index-search placeholder="搜尋模組或輸入名稱" aria-label="搜尋終端模組"></label>${sectionButtons(all, state.activeSection, 'view-section', 'a-terminal-command')}</nav><main class="a-terminal-output"><p> hktrpg@character:~$ ${esc(terminalCommand())}</p>${stageDisplayControls(all)}${selectedPanels(all)}</main></div><div class="a-terminal-status">${live ? 'LIVE CHARACTER' : 'LOCAL RECORD'} · ${esc(data.name)} · ${data.skills.length} SKILLS · ${data.actions.length} ACTIONS</div></div>`;
            case 11: return `<div class="a-stage a-stage-atlas"><div class="a-atlas-map"><div class="a-contour contour-one"></div><div class="a-contour contour-two"></div><div class="a-atlas-gridlines"></div><div class="a-map-compass">N<span>+</span></div><div class="a-map-stops">${sectionButtons(all, state.activeSection, 'view-section', 'a-map-pin')}</div><span class="a-map-caption">FIELD MAP / ${esc(data.name)}</span></div><main class="a-atlas-record"><div class="a-atlas-coordinate">COORDINATES ${String(all.indexOf(state.activeSection) + 1).padStart(2, '0')} · ${sectionLabel(state.activeSection)[1]}</div>${stageDisplayControls(all)}${selectedPanels(all)}</main></div>`;
            case 12: return `<div class="a-stage a-stage-observatory"><aside class="a-observatory-dial"><span class="a-observatory-title">能力星圖 / PROFILE</span>${radarGraphic()}<div class="a-observatory-legend">${data.attributes.map(a => `<span><b>${esc(a.key)}</b> ${a.value}</span>`).join('')}</div></aside><main class="a-observatory-console"><div class="a-orbit-nav">${sectionButtons(all, state.activeSection, 'view-section', 'a-orbit-point')}</div><div class="a-observatory-detail">${stageDisplayControls(all)}${selectedPanels(all)}</div></main></div>`;
            case 13: {
                const lane = (className, number, title, keys) => shown.some(key => keys.includes(key)) ? `<section class="a-dispatch-lane ${className}"><header><b>${number}</b> ${title}</header>${keys.map(visibleBlock).join('')}</section>` : '';
                const overview = shown.some(key => ['attributes', 'status'].includes(key)) ? `<div class="a-dispatch-order"><span>部署概要</span>${visibleBlock('attributes')}${visibleBlock('status')}</div>` : '';
                return `<div class="a-stage a-stage-dispatch">${overview}<div class="a-dispatch-board">${lane('lane-act', '01', '主動行動', ['actions', 'powers'])}${lane('lane-check', '02', '判定與觀察', ['saves', 'senses', 'skills'])}${lane('lane-support', '03', '支援與紀錄', ['training', 'features', 'inventory', 'background', 'notes', 'other'])}</div></div>`;
            }
            case 14: return `<div class="a-stage a-stage-folio"><header class="a-folio-spreadhead"><span>PERSONAE / ${esc(data.edition)}</span><span>人物誌　·　${esc(data.name)}</span></header><div class="a-folio-spread"><aside class="a-folio-margin"><span>頁 ${String(all.indexOf(state.activeSection) + 1).padStart(2, '0')}</span><strong>${sectionLabel(state.activeSection)[1]}</strong><small>${esc(theme.description)}</small></aside><main class="a-folio-page">${stageDisplayControls(all)}${selectedPanels(all)}${stagePageControls('頁')}</main></div></div>`;
            case 15: return `<div class="a-stage a-stage-catalog"><aside class="a-catalog-drawer"><label class="a-catalog-search">⌕<input type="search" data-index-search placeholder="搜尋目錄" aria-label="搜尋角色卡目錄"></label>${indexList(all, 'a-catalog-list')}<small>${all.length} 個資料夾 · 選取以開啟</small></aside><main class="a-catalog-card"><div class="a-catalog-cardno">CAT. ${String(all.indexOf(state.activeSection) + 1).padStart(3, '0')} / ${esc(data.edition)}</div>${stageDisplayControls(all)}${selectedPanels(all)}</main></div>`;
            case 16: return `<div class="a-stage a-stage-fieldmanual"><header class="a-manual-header"><span>FIELD MANUAL / ${esc(data.edition)}</span><span>使用目錄或前後頁閱讀</span></header><div class="a-manual-spread"><nav class="a-manual-tabs" aria-label="手冊章節">${sectionButtons(all, state.activeSection, 'view-section', 'a-manual-tab')}</nav><main class="a-manual-leaf"><div class="a-manual-page-no">${String(all.indexOf(state.activeSection) + 1).padStart(2, '0')} — ${all.length}</div>${stageDisplayControls(all)}${selectedPanels(all)}${stagePageControls('頁')}</main></div></div>`;
            case 17: return `<div class="a-stage a-stage-monolith">${shown.includes('attributes') ? `<section class="a-monolith-hero"><div class="a-monolith-deck"><span>ATTRIBUTE MONOLITH / ${esc(data.edition)}</span><p>${data.attributes.length} 項核心能力 · ${data.resources.length} 項可調資源</p></div>${block('attributes')}</section>` : ''}<div class="a-layout a-monolith-grid">${shown.filter(key => key !== 'attributes').map(key => block(key)).join('')}</div></div>`;
            case 18: return `<div class="a-stage a-stage-air"><div class="a-air-contents">${sectionButtons(all, state.activeSection, 'jump-section', 'a-air-link')}</div><div class="a-air-prose">${shown.map(key => `<section class="a-air-chapter" id="air-${key}"><span>${sectionLabel(key)[1]}</span>${block(key)}</section>`).join('')}</div></div>`;
            case 19: return `<div class="a-stage a-stage-circuit"><aside class="a-circuit-console"><div class="a-circuit-title">◉ LIVE CHARACTER CIRCUIT</div><div class="a-circuit-quick">${sectionButtons(['attributes', 'saves', 'actions', 'powers'], state.activeSection, 'view-section', 'a-circuit-key')}</div><div class="a-circuit-subnav">${sectionButtons(['skills', 'senses', 'status', 'training', 'features', 'inventory', 'background', 'notes', 'other'], state.activeSection)}</div></aside><main class="a-circuit-board"><div class="a-circuit-live"><i></i> INPUT / ${sectionLabel(state.activeSection)[1]}</div>${stageDisplayControls(all)}${selectedPanels(all)}</main></div>`;
            case 20: return `<div class="a-stage a-stage-archive"><aside class="a-archive-index"><div class="a-archive-stamp">ARCHIVE INDEX / ${all.length} RECORDS</div><div class="a-archive-timeline">${all.map((key, index) => button(`<time>${String(index + 1).padStart(2, '0')}</time>${sectionLabel(key)[0]}`, 'view-section', `data-section="${key}" aria-pressed="${sectionIsPressed(key)}"`, 'a-archive-event')).join('')}</div></aside><main class="a-archive-record"><div class="a-archive-recordhead"><span>RECORD ${String(all.indexOf(state.activeSection) + 1).padStart(2, '0')} / ${esc(data.edition)}</span><span>${live ? '角色資料庫紀錄' : '保存於本機試玩資料'}</span></div>${stageDisplayControls(all)}${selectedPanels(all)}${stagePageControls('條目')}</main></div>`;
            default: return `<div class="a-layout">${shown.map(key => block(key, true)).join('')}</div>`;
        }
    }
    function render() {
        document.body.dataset.design = String(id); document.body.dataset.density = state.density; document.body.dataset.system = live ? (data?.system || 'generic') : state.system;
        if (live) {
            const order = sectionOrder();
            if (!order.includes(state.activeSection)) state.activeSection = order[0];
            state.selectedSections = state.selectedSections.filter(key => order.includes(key));
            if (!viewGroups()[state.activeGroup]) state.activeGroup = Object.keys(viewGroups())[0];
            const focused = document.activeElement;
            const focusData = focused && root.contains(focused) && focused.dataset.act === 'adjust' ? { ...focused.dataset } : null;
            document.title = `T${id} ${theme.name} · ${data.name || '角色卡'} · HKTRPG`;
            root.innerHTML = toolbar() + (live.isSelected() ? `<article class="a-shell" id="character-sheet">${identity()}${resourceStrip()}${live.context(button)}${stageDisplayControls(order, true)}${designStage()}${live.footer(button, theme, id)}</article>` : live.empty());
            if (focusData) Array.from(root.querySelectorAll('[data-act="adjust"]')).find(button => button.dataset.key === focusData.key && button.dataset.delta === focusData.delta)?.focus({ preventScroll: true });
            return;
        }
        document.title = `A${id} ${theme.name} · ${state.system === 'coc' ? 'CoC' : 'D&D'} · ${state.density === 'open' ? '開放版' : '總結版'} · HKTRPG`;
        root.innerHTML = toolbar() + `<article class="a-shell" id="character-sheet">${identity()}${resourceStrip()}<div class="a-sheet-context a-sheet-context-${id}"><span>${state.density === 'summary' ? 'SUMMARY VIEW' : 'FULL CHARACTER RECORD'} <b>${data.skills.length}</b> 技能 · <b>${data.actions.length}</b> 行動 · <b>${data.spells.length || data.features.length}</b> ${data.spells.length ? '法術' : '特徵'} · 點數值擲骰，點 ↗ 展開全文</span><div class="a-roll-mode"><span>${state.system === 'coc' ? '百分骰' : 'D20'}</span>${[['normal', '正常'], ['advantage', state.system === 'coc' ? '獎勵' : '優勢'], ['disadvantage', state.system === 'coc' ? '懲罰' : '劣勢']].map(([key, name]) => button(name, 'mode', `data-value="${key}" aria-pressed="${state.mode === key}"`)).join('')}</div></div>${designStage()}<footer class="a-footer"><span>A${String(id).padStart(2, '0')} — ${esc(theme.name)} <i>／ ${esc(theme.description)}</i></span><div>${button('擲骰紀錄', 'history')}${button('資料來源', 'sources')}${button('匯出資料', 'export')}${button('重設試玩', 'reset')}</div></footer></article>`;
    }
    function open(title, html, type = '') {
        dialog.dataset.section = type;
        dialog.innerHTML = `<header class="a-dialog-head"><div><span>HKTRPG / ${esc(data.name)}</span><h2 id="atelier-dialog-title">${esc(title)}</h2></div>${button('×', 'close-dialog', 'aria-label="關閉視窗"')}</header><div class="a-dialog-body">${html}</div>`;
        if (!dialog.open) dialog.showModal();
    }
    function expand(key) { if (renderers[key]) open(sectionLabel(key)[0], renderers[key](true), key); }
    function refreshDialog() { if (dialog.open && renderers[dialog.dataset.section]) { const scroll = dialog.querySelector('.a-dialog-body').scrollTop; const key = dialog.dataset.section; expand(key); dialog.querySelector('.a-dialog-body').scrollTop = scroll; } }
    function random() { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
    function executeRoll(el) {
        if (live) { live.roll(el.dataset.rollName); return; }
        try {
            const result = M.roll(el.dataset.roll, state.mode, random);
            if (el.dataset.kind === 'damage') result.value = Math.max(0, result.value);
            state.history.unshift({ ...result, name: el.dataset.rollName || '擲骰' }); state.history = state.history.slice(0, 40);
            notice(`${el.dataset.rollName} → ${result.value}${result.outcome ? ' · ' + result.outcome : ''}`, result.detail + ' · 本機試擲，不發送至群組');
        } catch (error) { notice('無法試擲', error.message); }
    }
    function edit() {
        open('編輯共用角色資料', `<form id="a-edit-form"><div class="a-edit-grid"><label>角色名稱<input name="name" value="${esc(data.name)}" maxlength="80" required></label><label>人物簡介<input name="subtitle" value="${esc(data.subtitle)}" maxlength="160"></label></div><h3>資源</h3><div class="a-edit-resources">${data.resources.map(r => `<label>${esc(r.label)} / ${r.max}<input type="number" name="resource-${r.key}" min="0" max="${r.max}" value="${r.current}" required></label>`).join('')}</div><h3>${state.system === 'coc' ? '技能最終值' : '技能熟練'}</h3><div class="a-edit-skills">${data.skills.map((s, i) => `<label>${esc(s.name)}${state.system === 'coc' ? `<input type="number" name="skill-${i}" min="0" max="100" value="${s.value}" required>` : `<input type="checkbox" name="skill-${i}" ${s.proficient ? 'checked' : ''}>`}</label>`).join('')}</div><p class="a-footnote">這些修改只保存在本機；切換任何 A 系列設計都會讀到相同資料。</p><button type="submit" class="a-primary">儲存共用資料</button></form>`);
    }
    function spellDialog(index) {
        const s = data.spells[index]; if (!s) return;
        open(s.name + ' · ' + s.zh, `<div class="a-detail-meta">${keyValue('環級', s.level ? s.level + ' 環' : '戲法')}${keyValue('施法時間', s.time)}${keyValue('距離', s.range)}${keyValue('命中／DC', s.hit)}${keyValue('效果', s.effect)}</div><p class="a-detail-copy">${esc(s.text)}</p><p class="a-footnote">${esc(s.notes)} ${s.concentration ? ' · 專注' : ''}${s.ritual ? ' · 儀式' : ''}</p><form id="a-cast-form" data-index="${index}">${s.level ? `<label>以哪一環施放<select name="level">${data.slots.filter(slot => slot.level >= s.level).map(slot => `<option value="${slot.level}" ${slot.current === 0 ? 'disabled' : ''}>${slot.level} 環 · 剩餘 ${slot.current}/${slot.max}</option>`).join('')}${s.ritual ? '<option value="ritual">儀式施放 · 不消耗法術位</option>' : ''}</select></label>` : '<p>戲法不消耗法術位。</p>'}<button type="submit" class="a-primary">${s.level ? '施放並扣除法術位' : '施放戲法'}</button></form>`);
    }
    async function loadSystem(system) {
        if (live) { state.system = system; data = live.project(system); updateUrl(); render(); return; }
        const token = ++loadToken;
        if (!dataCache[system]) { const response = await fetch('/common/carda/' + system + '.json'); if (!response.ok) throw new Error('角色資料載入失敗 (' + response.status + ')'); dataCache[system] = await response.json(); }
        if (token !== loadToken) return;
        state.system = system; original = dataCache[system]; let saved;
        try { saved = JSON.parse(localStorage.getItem('hktrpg.carda.shared.v1.' + system) || 'null'); } catch { saved = null; }
        data = M.applyPatch(original, saved); undo = []; state.action = 'all'; state.spell = 'all'; state.feature = 'all'; state.history = [];
        updateUrl(); render();
    }
    function updateUrl() { const url = new URL(location.href); url.searchParams.set('system', state.system); url.searchParams.set('density', state.density); window.history.replaceState({}, '', url); }
    document.addEventListener('click', async event => {
        const designLink = event.target.closest('[data-live-design]');
        if (live && designLink && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            id = Number(designLink.dataset.liveDesign); theme = window.CardaThemes[id];
            window.history.pushState({}, '', designLink.href); render(); return;
        }
        const el = event.target.closest('button'); if (!el) return;
        if (live && !root.contains(el) && !dialog.contains(el)) return;
        if (el.dataset.roll) { executeRoll(el); return; }
        const action = el.dataset.act;
        try {
            if (live && live.handle(action, el, { open, notice, render, state })) return;
            switch (action) {
                case 'system': await loadSystem(el.dataset.value); break;
                case 'density':
                    state.density = el.dataset.value;
                    if (live) state.displayMode = state.density === 'summary' ? 'all' : 'single';
                    updateUrl(); render(); break;
                case 'mode': state.mode = el.dataset.value; render(); break;
                case 'expand': expand(el.dataset.section); break;
                case 'view-section': if (sectionOrder().includes(el.dataset.section)) chooseSection(el.dataset.section); break;
                case 'display-mode': chooseDisplayMode(el.dataset.value, el.dataset.scope || sectionOrder().join(',')); break;
                case 'jump-section': if (sectionOrder().includes(el.dataset.section)) { state.activeSection = el.dataset.section; render(); requestAnimationFrame(() => document.getElementById('air-' + state.activeSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' })); } break;
                case 'view-group': if (viewGroups()[el.dataset.group]) { state.activeGroup = el.dataset.group; state.activeSection = viewGroups()[state.activeGroup][0]; if (live) { state.displayMode = 'multi'; state.selectedSections = viewGroups()[state.activeGroup].slice(); } render(); } break;
                case 'page-step': { const current = Math.max(0, sectionOrder().indexOf(state.activeSection)); const next = (current + Number(el.dataset.delta) + sectionOrder().length) % sectionOrder().length; state.activeSection = sectionOrder()[next]; state.displayMode = 'single'; state.selectedSections = [state.activeSection]; render(); break; }
                case 'close-dialog': dialog.close(); break;
                case 'close-toast': document.getElementById('atelier-toast').hidden = true; break;
                case 'edit': case 'resources': edit(); break;
                case 'adjust': { const r = resource(el.dataset.key); if (!r) break; checkpoint(); r.current = Math.min(r.max, Math.max(0, r.current + Number(el.dataset.delta))); changed(); root.querySelector(`[data-key="${el.dataset.key}"][data-delta="${el.dataset.delta}"]:not(:disabled)`)?.focus({ preventScroll: true }); break; }
                case 'slot': { const slot = data.slots.find(s => s.level === Number(el.dataset.level)); if (!slot) break; checkpoint(); slot.current = Math.max(0, Math.min(slot.max, Number(el.dataset.value))); changed(); refreshDialog(); break; }
                case 'undo': if (undo.length) { data = undo.pop(); changed('已復原上一項修改'); refreshDialog(); } else notice('沒有可復原的修改'); break;
                case 'history': open('本次擲骰紀錄', history()); break;
                case 'gallery': open('20 種密集角色卡設計', `<p class="a-detail-copy">每款都使用相同的 CoC／D&D 角色資料。總結版呈現開團常用資訊，開放版展開完整資料。</p><div class="a-gallery">${Object.entries(window.CardaThemes).map(([n, t]) => `<a href="/carda${n}?system=${state.system}&density=${state.density}"><span>A${String(n).padStart(2, '0')}</span><strong>${esc(t.name)}</strong><small>${esc(t.description)}</small></a>`).join('')}</div>`); break;
                case 'sources': open('資料來源與保留項目', `<div class="a-source-summary">${keyValue('角色', data.name)}${keyValue('系統', data.edition)}${keyValue('技能', data.skills.length)}${keyValue('行動', data.actions.length)}${keyValue('法術', data.spells.length)}${keyValue('背景欄位', data.background.length)}</div><ol class="a-source-notes">${data.sourceNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ol><p class="a-detail-copy">20 款設計只改呈現方式，共用同一份資料。總結版的 ↗ 可查看完整欄位；開放版直接展開所有技能、法術、特性、裝備和背景。未提供的內容明確標示，沒有補造正式角色資料。</p><p class="a-footnote">僅本機試玩；不連接正式角色卡、不發送群組擲骰。資料匯出是此試玩版的 JSON，並非 D&D Beyond 或 Foundry 匯入格式。</p>`); break;
                case 'conditions': open('目前狀態', `<div class="a-condition-options">${data.conditionOptions.map((c, i) => `<label><input type="checkbox" data-condition="${i}" ${data.conditions.includes(c) ? 'checked' : ''}>${esc(c)}</label>`).join('')}</div>`); break;
                case 'remove-condition': checkpoint(); data.conditions = data.conditions.filter(c => c !== el.dataset.value); changed(); break;
                case 'short-rest': checkpoint(); if (resource('wildshape')) resource('wildshape').current = resource('wildshape').max; changed('短休：荒野形態已恢復'); notice('短休：荒野形態已恢復', '生命值及法術位未自動改動；生命骰可在資源欄記錄。'); break;
                case 'long-rest': open('完成長休', `<p class="a-detail-copy">此試玩操作會回滿生命、法術位、荒野形態，並恢復一半最大生命骰（向下取整、至少 1）。可用「復原」撤回。</p>${button('完成長休', 'confirm-long-rest', '', 'a-primary')}`); break;
                case 'confirm-long-rest': checkpoint(); for (const r of data.resources) { if (['hp', 'wildshape'].includes(r.key)) r.current = r.max; if (r.key === 'hitdice') r.current = Math.min(r.max, r.current + Math.max(1, Math.floor(r.max / 2))); } data.slots.forEach(s => { s.current = s.max; }); dialog.close(); changed('長休資源已恢復'); break;
                case 'filter-action': state.action = el.dataset.value; render(); refreshDialog(); break;
                case 'action-category': state.action = el.dataset.value; expand('actions'); break;
                case 'filter-spell': state.spell = el.dataset.value; render(); refreshDialog(); break;
                case 'filter-feature': state.feature = el.dataset.value; render(); refreshDialog(); break;
                case 'action-detail': { const source = data.actions[Number(el.dataset.index)]; const a = source && { ...source, hit: M.actionHitValue(data, source) }; if (a) open(a.name, `<div class="a-detail-meta">${Object.entries(a).filter(([key]) => !['name', 'notes', 'index', 'sourceLine'].includes(key)).map(([key, value]) => keyValue(({ type: '類型', range: '範圍', hit: '命中', damage: '傷害', uses: '每回合／次數', ammo: '彈數', malfunction: '故障值', skill: '技能', baseDamage: '基本傷害', damageBonus: '傷害加值', impale: '貫穿', price: '價格' })[key] || key, value)).join('')}</div><p class="a-detail-copy">${esc(a.notes)}</p>`); break; }
                case 'spell-detail': spellDialog(Number(el.dataset.index)); break;
                case 'feature-detail': { const f = data.features[Number(el.dataset.index)]; if (f) open(f.name, `<p class="a-footnote">${esc(f.category)} · ${esc(f.source)}</p><p class="a-detail-copy">${esc(f.text)}</p>`); break; }
                case 'add-note': if (data.notes.length < 40) { checkpoint(); data.notes.push({ title: '新的冒險紀錄', text: '' }); changed(); expand('notes'); dialog.querySelector('textarea:last-of-type')?.focus(); } break;
                case 'reset': open('重設此系統的試玩資料', `<p class="a-detail-copy">恢復最初提供的${state.system === 'coc' ? ' CoC' : ' D&D'} 資料。這會重設本機改過的資源、筆記、技能及狀態；另一系統不受影響。可用復原撤回。</p>${button('重設目前系統', 'confirm-reset', '', 'a-primary')}`); break;
                case 'confirm-reset': checkpoint(); data = M.clone(original); dialog.close(); changed('已恢復原始試玩資料'); break;
                case 'export': { const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'hktrpg-carda-preview-v1', character: data }, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `hktrpg-carda-${state.system}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('已準備試玩資料下載'); break; }
            }
        } catch (error) { notice('操作未完成', error.message); }
    });
    document.addEventListener('input', event => {
        const el = event.target;
        if (live && el.dataset.note !== undefined) return;
        if (el.dataset.note !== undefined) { const note = data.notes[Number(el.dataset.note)]; if (note) { note.text = el.value.slice(0, 12000); save(); } }
        if (el.dataset.indexSearch !== undefined) { const query = el.value.trim().toLocaleLowerCase(); root.querySelectorAll('[data-index-entry]').forEach(entry => { entry.hidden = !entry.dataset.indexLabel.toLocaleLowerCase().includes(query); }); }
        if (el.dataset.search) {
            const scope = el.closest('.a-block-body, .a-dialog-body'); const query = el.value.trim().toLocaleLowerCase(); let count = 0;
            scope.querySelectorAll('[data-search-text]').forEach(row => { row.hidden = !row.dataset.searchText.toLocaleLowerCase().includes(query); if (!row.hidden) count++; });
            const empty = scope.querySelector('.a-search-empty'); if (empty) empty.hidden = count !== 0;
        }
    });
    document.addEventListener('focusin', event => { if (event.target.dataset.note !== undefined) checkpoint(); });
    document.addEventListener('change', event => {
        const el = event.target;
        if (live) { live.change(el); return; }
        if (el.dataset.growth !== undefined) { checkpoint(); data.skills[Number(el.dataset.growth)].developmentChecked = el.checked; save(); }
        if (el.hasAttribute('data-inspiration')) { checkpoint(); data.inspiration = el.checked; save(); }
        if (el.dataset.death !== undefined) { checkpoint(); data.death = data.death || [false, false, false, false, false, false]; data.death[Number(el.dataset.death)] = el.checked; save(); }
        if (el.dataset.condition !== undefined) { checkpoint(); const value = data.conditionOptions[Number(el.dataset.condition)]; if (el.checked && !data.conditions.includes(value)) data.conditions.push(value); else if (!el.checked) data.conditions = data.conditions.filter(c => c !== value); save(); render(); }
    });
    document.addEventListener('submit', event => {
        const form = event.target;
        if (form.id === 'a-edit-form') {
            event.preventDefault(); const values = new FormData(form); const name = String(values.get('name') || '').trim(); if (!name) return;
            checkpoint(); data.name = name; data.subtitle = String(values.get('subtitle') || '');
            data.resources.forEach(r => { r.current = Math.max(0, Math.min(r.max, Number(values.get('resource-' + r.key)))); });
            data.skills.forEach((s, i) => { if (state.system === 'coc') s.value = Math.max(0, Math.min(100, Number(values.get('skill-' + i)))); else s.proficient = values.has('skill-' + i); });
            dialog.close(); changed('共用資料已更新');
        }
        if (form.id === 'a-cast-form') {
            event.preventDefault(); const spell = data.spells[Number(form.dataset.index)]; const level = new FormData(form).get('level');
            if (spell.level && level !== 'ritual') { const slot = data.slots.find(s => s.level === Number(level)); if (!slot || slot.current <= 0) { notice('沒有可用的法術位'); return; } checkpoint(); slot.current--; }
            if (spell.concentration && !data.conditions.includes('Concentrating 專注')) { if (!spell.level || level === 'ritual') checkpoint(); data.conditions.push('Concentrating 專注'); }
            dialog.close(); changed(`${spell.name} 已${level === 'ritual' ? '以儀式' : ''}施放`);
        }
    });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
    dialog.addEventListener('close', () => { if (data) render(); });
    window.addEventListener('storage', event => { if (!live && event.key === 'hktrpg.carda.shared.v1.' + state.system && !dialog.open) { try { data = M.applyPatch(original, JSON.parse(event.newValue)); render(); } catch { /* Ignore incomplete external storage. */ } } });
    if (live) {
        await live.ready;
        data = live.project(state.system);
        state.activeSection = live.sectionOrder()[0] || 'skills';
        state.activeGroup = Object.keys(viewGroups()).find(group => viewGroups()[group].includes(state.activeSection)) || 'core';
        state.selectedSections = [state.activeSection];
        state.displayMode = state.density === 'summary' ? 'all' : 'single';
        live.subscribe(() => { data = live.project(state.system); render(); refreshDialog(); }, notice);
        window.addEventListener('popstate', () => {
            const route = Number(location.pathname.match(/^\/cardt(\d+)\/?$/)?.[1]);
            if (route >= 1 && route <= 20) { id = route; theme = window.CardaThemes[id]; }
            const query = new URLSearchParams(location.search);
            state.system = ['auto', 'coc', 'dnd', 'generic'].includes(query.get('system')) ? query.get('system') : 'auto';
            state.density = query.get('density') === 'open' ? 'open' : 'summary';
            state.displayMode = state.density === 'summary' ? 'all' : 'single';
            data = live.project(state.system); render();
        });
    }
    try { await loadSystem(state.system); }
    catch (error) { root.innerHTML = `<div class="a-load-error"><h1>角色資料暫未載入</h1><p>${esc(error.message)}</p><a href="${esc(location.href)}">重新載入</a></div>`; }
}());
