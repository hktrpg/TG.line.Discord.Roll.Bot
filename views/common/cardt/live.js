(function () {
    'use strict';
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const labels = {
        attributes: ['屬性', 'ABILITY'], saves: ['豁免與檢定', 'SAVES'], senses: ['感官與被動值', 'SENSES'],
        training: ['熟練與語言', 'TRAINING'], skills: ['技能與擲骰', 'SKILLS'], actions: ['行動與戰鬥', 'ACTIONS'],
        powers: ['法術與施法', 'SPELLS'], features: ['特性與專長', 'FEATURES'], inventory: ['裝備與財產', 'INVENTORY'],
        background: ['身分與背景', 'BACKGROUND'], notes: ['筆記與自訂欄位', 'NOTES'], status: ['資源與狀態', 'STATUS'],
        other: ['其他原始資料', 'SOURCE DATA']
    };
    const sectionMap = { Abilities: 'attributes', 屬性: 'attributes', Vitals: 'status', 生命: 'status', Saves: 'saves', 豁免: 'saves', Passives: 'senses', 被動: 'senses',
        Skills: 'skills', 技能: 'skills', Combat: 'actions', 戰鬥: 'actions', Spellcasting: 'powers', 施法: 'powers', Spells: 'powers', 法術: 'powers', Equipment: 'inventory', 裝備: 'inventory',
        Features: 'features', 特性: 'features', Identity: 'background', 身份: 'background', 身分: 'background' };
    const dndAbilityNames = new Set(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', '力量', '敏捷', '體質', '智力', '感知', '魅力']);
    const dndSkillNames = new Set(['ACROBATICS', 'ANIMAL HANDLING', 'ARCANA', 'ATHLETICS', 'DECEPTION', 'HISTORY', 'INSIGHT', 'INTIMIDATION', 'INVESTIGATION', 'MEDICINE', 'NATURE', 'PERCEPTION', 'PERFORMANCE', 'PERSUASION', 'RELIGION', 'SLEIGHT OF HAND', 'STEALTH', 'SURVIVAL', '特技', '馴獸', '奧秘', '運動', '欺瞞', '歷史', '洞悉', '威嚇', '調查', '醫藥', '自然', '察覺', '表演', '遊說', '宗教', '巧手', '隱匿', '求生']);
    const cocAbilityNames = new Set(['STR', 'DEX', 'CON', 'INT', 'POW', 'APP', 'EDU', 'SIZ', '力量', '敏捷', '體質', '智力', '意志', '外貌', '教育', '體型']);
    const cocSkillNames = new Set(['ACCOUNTING', 'ANTHROPOLOGY', 'ARCHAEOLOGY', 'APPRAISE', 'CHARM', 'CLIMB', 'CREDIT RATING', 'CTHULHU MYTHOS', 'DISGUISE', 'DODGE', 'DRIVE AUTO', 'ELEC. REPAIR', 'FAST TALK', 'FIRST AID', 'HISTORY', 'INTIMIDATE', 'JUMP', 'LAW', 'LIBRARY USE', 'LISTEN', 'LOCKSMITH', 'MECH. REPAIR', 'MEDICINE', 'NATURAL WORLD', 'NAVIGATE', 'OCCULT', 'PERSUADE', 'PSYCHOANALYSIS', 'PSYCHOLOGY', 'RIDE', 'SLEIGHT OF HAND', 'SPOT HIDDEN', 'STEALTH', 'SURVIVAL', 'SWIM', 'THROW', 'TRACK', '會計', '人類學', '考古學', '估價', '魅惑', '攀爬', '信用評級', '信譽', '克蘇魯神話', '喬裝', '偽裝', '閃避', '汽車駕駛', '駕駛汽車', '電氣維修', '電器維修', '話術', '急救', '歷史', '恐嚇', '跳躍', '法律', '圖書館使用', '圖書館', '聆聽', '聽力', '開鎖', '鎖匠', '機械維修', '醫學', '博物學', '自然學', '導航', '神秘學', '說服', '精神分析', '心理學', '騎術', '妙手', '巧手', '偵查', '偵察', '潛行', '生存', '游泳', '投擲', '追蹤']);
    const profiles = {
        coc: {
            order: ['attributes', 'status', 'skills', 'actions', 'powers', 'inventory', 'background', 'notes', 'other'],
            labels: { attributes: ['調查員特徵', 'CHARACTERISTICS'], status: ['生命、理智與幸運', 'VITALS'], skills: ['調查技能', 'SKILLS'], actions: ['戰鬥與武器', 'COMBAT'], powers: ['典籍與法術', 'ARCANE'], inventory: ['裝備與財產', 'POSSESSIONS'], background: ['調查員背景', 'BACKSTORY'], notes: ['經歷與自訂紀錄', 'RECORDS'] },
            fold: { saves: 'skills', senses: 'status', training: 'background', features: 'background' }
        },
        dnd: { order: ['attributes', 'saves', 'skills', 'status', 'actions', 'powers', 'features', 'senses', 'training', 'inventory', 'background', 'notes', 'other'], labels: { attributes: ['能力值', 'ABILITIES'], status: ['生命、生命骰與狀態', 'VITALS'], skills: ['技能與熟練', 'SKILLS'], powers: ['施法、法術與法術位', 'SPELLCASTING'] }, fold: {} },
        generic: { order: ['attributes', 'skills', 'notes', 'background', 'other'], labels: { attributes: ['屬性與資源', 'FIELDS'], skills: ['擲骰指令', 'ROLLS'], notes: ['筆記與自訂資料', 'NOTES'], background: ['人物資料', 'PROFILE'] }, fold: {} }
    };
    let presentation = 'generic';
    const profile = () => profiles[presentation];
    let current, notify = () => {}, feedback = () => {}, resolveReady, editTarget;
    const expandedNotes = new WeakSet();
    const ready = new Promise(resolve => { resolveReady = resolve; });
    const selected = () => !!(current?._id && current._id !== '_test_' && current.isLoggedIn);
    const normalizedName = entry => String(entry?.name || '').trim().toUpperCase();
    const isCocSkill = name => cocSkillNames.has(name) || /^(ART\s*\/\s*CRAFT|FIGHTING|FIREARMS|LANGUAGE|PILOT|SCIENCE|藝術|工藝|格鬥|鬥毆|射擊|火器|語言|科學|駕駛|操作)(?:\s*[（(:/]|$)/.test(name);
    const legacySection = section => !section || ['General', '未分類'].includes(section);
    function detectSystem() {
        const entries = [...(current?.state || []), ...(current?.roll || []), ...(current?.notes || [])];
        let coc = 0, dnd = 0, cocStrong = 0, dndStrong = 0;
        for (const entry of entries) {
            const name = normalizedName(entry), section = String(entry?.section || '');
            if (/^(SAN|POW|SIZ|APP|EDU|MP|理智|意志|體型|教育|幸運)$/.test(name)) { coc += 2; cocStrong++; }
            if (/^CC(?:\s|$)/i.test(String(entry?.itemA || ''))) { coc++; cocStrong++; }
            else if (isCocSkill(name)) coc++;
            if (/^(PB|AC|SPELL DC|SPELL ATTACK|HIT DICE|PROFICIENCY BONUS|熟練加值|護甲等級|生命骰)$/.test(name)) { dnd += 2; dndStrong++; }
            if (/^(SAVE\s|PASSIVE\s)/.test(name) || /^(Saves|Passives|Spellcasting|豁免|被動|施法)$/.test(section)) { dnd++; dndStrong++; }
        }
        return cocStrong && coc >= 3 && coc > dnd * 2 ? 'coc' : dndStrong && dnd >= 3 && dnd > coc * 2 ? 'dnd' : 'generic';
    }
    function classify(entry, bucket) {
        if (presentation === 'generic') return ({ state: 'attributes', roll: 'skills', notes: 'notes' })[bucket];
        const sourceSection = String(entry.section || '').trim();
        const sectionKey = sectionMap[sourceSection];
        if (sectionKey) return profile().fold[sectionKey] || sectionKey;
        const kind = String(entry.kind || '').trim().toLowerCase();
        const kindKey = ({ ability: 'attributes', attribute: 'attributes', resource: 'status', vital: 'status', skill: 'skills', save: 'saves', attack: 'actions', action: 'actions', spell: 'powers', feature: 'features', equipment: 'inventory', item: 'inventory', identity: 'background', background: 'background', note: 'notes' })[kind];
        if (kindKey) return profile().fold[kindKey] || kindKey;
        if (!legacySection(sourceSection)) return 'other';
        const name = normalizedName(entry);
        const abilityNames = presentation === 'coc' ? cocAbilityNames : dndAbilityNames;
        if (bucket === 'state') {
            if (abilityNames.has(name)) return 'attributes';
            if (/^(HP|MP|SAN|LUCK|MOV|DB|BUILD|AC|PB|SPEED|INITIATIVE|HIT DICE|生命值?|魔法值?|理智值?|幸運|移動|體格|傷害加值|護甲)$/.test(name)) return 'status';
            if (presentation === 'coc' && isCocSkill(name)) return 'skills';
            if (presentation === 'dnd' && dndSkillNames.has(name)) return 'skills';
            return 'other';
        }
        if (bucket === 'roll') {
            if (/^(SAVE\s|豁免)/.test(name)) return presentation === 'dnd' ? 'saves' : 'skills';
            if (presentation === 'coc' && (isCocSkill(name) || /^CC(?:\s|$)/i.test(String(entry.itemA || '')))) return 'skills';
            if (presentation === 'dnd' && dndSkillNames.has(name)) return 'skills';
            if (/^(ATTACK|攻擊|傷害|FIGHTING|FIREARMS)/.test(name)) return 'actions';
            return 'other';
        }
        return 'notes';
    }
    function groups() {
        const result = Object.fromEntries(Object.keys(labels).map(key => [key, []]));
        for (const bucket of ['state', 'roll', 'notes']) {
            const source = Array.isArray(current?.[bucket]) ? current[bucket] : [];
            for (let index = 0; index < source.length; index++) {
                const entry = source[index];
                if (!entry) continue;
                const key = classify(entry, bucket);
                result[key].push({ entry, index, bucket, section: entry.section || 'General', sources: [{ entry, index, bucket }], sort: Number.isFinite(entry.order) ? entry.order : index });
            }
        }
        if (presentation !== 'generic') {
            const scores = new Map(result.skills.filter(row => row.bucket === 'state').map(row => [normalizedName(row.entry), row]));
            result.skills = result.skills.filter(row => {
                if (row.bucket !== 'roll') return true;
                const score = scores.get(normalizedName(row.entry));
                if (!score || score.sources.length > 1) return true;
                score.sources.push({ entry: row.entry, index: row.index, bucket: row.bucket });
                return false;
            });
        }
        for (const rows of Object.values(result)) rows.sort((a, b) => a.sort - b.sort || a.index - b.index);
        return result;
    }
    function project(system) {
        presentation = system === 'auto' ? detectSystem() : profiles[system] ? system : 'generic';
        const grouped = groups();
        const list = key => grouped[key];
        const resources = (current?.state || []).flatMap((entry, index) => {
            const a = String(entry.itemA ?? '').trim(), b = String(entry.itemB ?? '').trim();
            if (cocAbilityNames.has(normalizedName(entry)) || dndAbilityNames.has(normalizedName(entry))) return [];
            if (presentation !== 'generic' && classify(entry, 'state') !== 'status') return [];
            if (!a || !b || !Number.isFinite(Number(a)) || !Number.isFinite(Number(b)) || Number(b) <= 0) return [];
            return [{ key: 'state-' + index, label: entry.name, current: Number(a), max: Number(b), index }];
        });
        const identity = (current?.headerBadges || []).map(({ label, value }) => ({ label, value }));
        for (const { entry } of list('background').filter(row => row.bucket === 'state')) {
            if (!identity.some(field => field.label === entry.name && field.value === entry.itemA)) identity.push({ label: entry.name, value: entry.itemA });
        }
        const image = current?.isSafeImageUrl(current.image) ? current.image : '/image/favicon.ico';
        return {
            name: selected() ? current.name : '', portrait: image, player: '', subtitle: identity.map(x => x.value).filter(Boolean).slice(0, 2).join(' · '),
            system: presentation, edition: ({ dnd: 'D&D', coc: 'CoC 7e', generic: '泛用角色卡' })[presentation], identity, resources, combatStats: [],
            attributes: list('attributes').filter(row => row.bucket === 'state' && String(row.entry.itemA ?? '').trim() !== '' && Number.isFinite(Number(row.entry.itemA))).map(({ entry }) => ({ key: entry.name, name: entry.name, value: Number(entry.itemA) })),
            skills: list('skills'), actions: list('actions'), spells: list('powers'), features: list('features'),
            inventory: list('inventory'), background: list('background'), notes: list('notes'), sourceNotes: [], slots: [],
            conditions: [], conditionOptions: [], training: list('training'), senses: list('senses'), saves: list('saves'), wealth: [], unfilledSkillSlots: []
        };
    }
    function toolbar({ state, links, button }) {
        return `<header class="a-toolbar"><a class="a-brand" href="/card">◇ <strong>HKTRPG</strong><span>CHARACTER / T</span></a><div class="a-toolbar-controls"><div class="a-segment" aria-label="角色卡呈現系統">${['auto', 'generic', 'coc', 'dnd'].map(key => button(({ auto: '自動', generic: '泛用', coc: 'CoC', dnd: 'D&D' })[key], 'system', `data-value="${key}" aria-pressed="${state.system === key}"`)).join('')}</div><div class="a-segment" aria-label="資料密度">${button('總結版', 'density', `data-value="summary" aria-pressed="${state.density === 'summary'}"`)}${button('開放版', 'density', `data-value="open" aria-pressed="${state.density === 'open'}"`)}</div>${button('選擇角色', 'live-select')}${button(selected() ? '登出' : '登入', selected() ? 'live-logout' : 'live-login')}${button('管理角色', 'live-manage')}</div></header><nav class="a-design-nav" aria-label="角色卡設計">${links}</nav>`;
    }
    function identityTools(button) {
        return `<div class="a-identity-tools">${button(current?.editMode ? '完成編輯' : '編輯角色', 'edit', `aria-pressed="${!!current?.editMode}"`)}${button('儲存', 'live-save', '', 'a-primary')}${button('撤回未儲存修改', 'live-revert')}${button('匯入／匯出', 'live-manage')}${button(current?.public ? '公開角色' : '私人角色', 'live-public')}</div><small class="a-local-status">${current?.editMode ? '編輯模式 · ' : ''}${current?.hasUnsavedChanges ? '有未儲存修改' : '已載入角色資料'}</small>`;
    }
    function context(button) {
        const channels = current.gpList || [];
        return `<div class="a-sheet-context"><span>${socketManager.isConnected() ? '已連線' : '連線中斷'} · ${current.state?.length || 0} 屬性／狀態 · ${current.roll?.length || 0} 擲骰 · ${current.notes?.length || 0} 筆記</span><label class="t-channel">擲骰目的地 <select data-live-channel aria-label="擲骰目的地"><option value="">只在網頁擲骰</option>${channels.map((gp, i) => `<option value="${esc(gp._id)}" ${String(current.selectedGroupId) === String(gp._id) ? 'selected' : ''}>${esc([gp.botname, gp.titleName].filter(Boolean).join(' · ') || ('群組 ' + (i + 1)))}</option>`).join('')}</select></label>${button('頻道設定', 'live-channels')}</div>`;
    }
    function resourceStrip({ button }) {
        const data = project(presentation);
        if (!data.resources.length) return '';
        return `<section class="a-resource-strip a-resource-form-${document.body.dataset.design}" aria-label="角色資源">${data.resources.map(r => `<div class="a-resource"><span>${esc(r.label)}</span><div class="a-resource-value">${button('−', 'adjust', `data-key="${r.key}" data-delta="-1" aria-label="${esc(r.label)}減少 1"`)}<strong>${esc(r.current)}<small>/${esc(r.max)}</small></strong>${button('+', 'adjust', `data-key="${r.key}" data-delta="1" aria-label="${esc(r.label)}增加 1"`)}</div><div class="a-resource-track"><i style="width:${Math.max(0, Math.min(100, r.current / r.max * 100))}%"></i></div></div>`).join('')}</section>`;
    }
    function section(key, full, { id, button }) {
        const rows = groups()[key];
        const details = key === 'background' ? (current.characterDetails || []).map(detail => `<div class="a-row"><strong>${esc(detail.label)}</strong><span class="t-entry-value">${esc(detail.value)}</span></div>`).join('') : '';
        const add = current.editMode && key !== 'other' ? button('+ 新增欄位', 'live-add', `data-section="${key}"`, 'a-more') : '';
        if (!rows.length) return `${details || '<p class="a-muted">這張角色卡未記錄此分類。</p>'}${add}`;
        const search = `<label class="a-search">⌕ <input type="search" data-search="${key}" placeholder="搜尋 ${rows.length} 項資料" aria-label="搜尋${esc((profile().labels[key] || labels[key])[0])}"></label>`;
        const body = rows.map(({ entry, index, bucket, section: sourceSection, sources }) => {
            const attrs = `data-bucket="${bucket}" data-index="${index}"`;
            const numeric = bucket === 'state' && String(entry.itemA ?? '').trim() !== '' && Number.isFinite(Number(entry.itemA));
            const fractions = presentation === 'coc' && numeric && ['attributes', 'skills'].includes(key) ? `<em class="t-check-values" aria-label="困難與極難">½ ${Math.floor(Number(entry.itemA) / 2)} · ⅕ ${Math.floor(Number(entry.itemA) / 5)}</em>` : '';
            const dndAbility = presentation === 'dnd' && numeric && key === 'attributes' && dndAbilityNames.has(normalizedName(entry));
            const modifier = dndAbility && (entry.itemB === undefined || entry.itemB === '') ? Math.floor((Number(entry.itemA) - 10) / 2) : null;
            const mod = modifier === null ? '' : `<em class="t-check-values">調整值 ${modifier >= 0 ? '+' : ''}${modifier}</em>`;
            const linkedRoll = sources.find(source => source.bucket === 'roll' && source.entry !== entry);
            const rollValue = linkedRoll ? button('擲骰 ' + esc(linkedRoll.entry.itemA), 'live-roll', `data-bucket="roll" data-index="${linkedRoll.index}" aria-label="擲${esc(linkedRoll.entry.name)}：${esc(linkedRoll.entry.itemA)}"`, 'a-roll t-linked-roll') : '';
            const longNote = bucket === 'notes' && String(entry.itemA || '').length > 130;
            const expanded = expandedNotes.has(entry);
            const content = longNote && !full && !expanded ? String(entry.itemA).slice(0, 130) + '…' : entry.itemA;
            const secondValue = entry.itemB !== undefined && entry.itemB !== '' ? `<small>${dndAbility ? ' · 修正 ' : ' / '}${esc(entry.itemB)}</small>` : '';
            const value = bucket === 'roll' ? button(esc(entry.itemA), 'live-roll', `${attrs} aria-label="擲${esc(entry.name)}：${esc(entry.itemA)}"`, 'a-roll') : `<strong class="t-entry-value">${esc(content)}${secondValue}</strong>${rollValue}`;
            const cls = key === 'attributes' ? 'a-attribute' : key === 'skills' ? 'a-skill' : key === 'features' ? 'a-feature' : key === 'powers' ? 'a-power' : key === 'actions' ? 'a-action' : 'a-row';
            const expand = longNote ? button(expanded ? '收起' : '展開', 'live-expand-note', attrs + ` aria-expanded="${expanded}"`, 't-inline-expand') : '';
            const tools = expand + (current.editMode ? button('編輯', 'live-entry', attrs, 't-edit-entry') : '');
            const move = current.editMode ? `<div class="t-drag-tools"><button type="button" class="t-drag-handle" ${attrs} data-section-key="${key}" aria-label="拖動${esc(entry.name)}排序；方向鍵可上移或下移" title="拖動排序；方向鍵可上移或下移">⠿</button>${button('↑', 'live-move-up', `${attrs} data-section-key="${key}" aria-label="${esc(entry.name)}上移"`, 't-move')}${button('↓', 'live-move-down', `${attrs} data-section-key="${key}" aria-label="${esc(entry.name)}下移"`, 't-move')}</div>` : '';
            const sourceCaption = key === 'other' ? `${({ state: '狀態', roll: '擲骰', notes: '筆記' })[bucket]} · ${sourceSection}` : sourceSection === 'General' ? '' : sourceSection;
            return `<div class="t-entry ${cls} ${full ? 't-entry-open' : ''} ${longNote && !expanded ? 't-long-copy' : ''}" ${attrs} data-section-key="${key}" data-card-id="${esc(current._id)}" data-search-text="${esc([entry.name, entry.itemA, entry.itemB, sourceSection].join(' '))}">${move}<span class="t-entry-name">${esc(entry.name || '未命名欄位')}</span>${value}${fractions}${mod}${tools ? `<div class="t-entry-tools">${tools}</div>` : ''}${sourceCaption ? `<small class="t-entry-source">${esc(sourceCaption)}</small>` : ''}</div>`;
        }).join('');
        const cls = key === 'attributes' ? `a-attributes a-attributes-${id}` : key === 'skills' ? `a-skill-grid a-skill-grid-${id}` : key === 'features' ? 'a-feature-list' : key === 'powers' ? 'a-spell-list' : key === 'actions' ? 'a-actions' : 't-entry-list';
        return `${details}${search}<div class="${cls} t-entries" data-${key === 'attributes' ? 'attribute' : 'skill'}-form="${id}">${body}</div><p class="a-search-empty" hidden>沒有符合的資料。</p>${add}`;
    }
    function manage(edit = false) {
        const panel = document.getElementById('cardt-management');
        panel.open = true;
        if (edit && !current.editMode) current.toggleEditMode();
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function item(el) { return current?.[el.dataset.bucket]?.[Number(el.dataset.index)]; }
    function projectedRow(grouped, { bucket, index }) {
        for (const [key, rows] of Object.entries(grouped)) {
            const row = rows.find(candidate => candidate.bucket === bucket && candidate.index === index);
            if (row) return { key, row };
        }
        return null;
    }
    function canPlace(grouped, from, to) {
        const origin = projectedRow(grouped, from), destination = projectedRow(grouped, to);
        if (!origin || !destination || origin.row === destination.row) return false;
        if (origin.key === destination.key) return true;
        return origin.row.sources.every(source => {
            const peer = destination.row.sources.find(candidate => candidate.bucket === source.bucket);
            const mapped = peer && sectionMap[peer.entry.section];
            return mapped && (profile().fold[mapped] || mapped) === destination.key;
        });
    }
    let lastReordered = null;
    function reorder(from, to, side = 'before') {
        if (!selected() || !current.editMode || !['state', 'roll', 'notes'].includes(from.bucket) || !['state', 'roll', 'notes'].includes(to.bucket)) return false;
        const grouped = groups();
        if (!canPlace(grouped, from, to)) return false;
        const origin = projectedRow(grouped, from), destination = projectedRow(grouped, to);
        const crossing = origin.key !== destination.key;
        const targetSections = {};
        for (const source of origin.row.sources) {
            const peer = destination.row.sources.find(candidate => candidate.bucket === source.bucket);
            if (crossing && (!peer || !sectionMap[peer.entry.section])) return false;
            targetSections[source.bucket] = crossing ? peer.entry.section : source.entry.section;
        }
        const sourceRows = grouped[origin.key].filter(row => row !== origin.row);
        const targetRows = crossing ? grouped[destination.key].slice() : sourceRows;
        const targetIndex = targetRows.indexOf(destination.row) + (side === 'after' ? 1 : 0);
        if (targetIndex < 0) return false;
        targetRows.splice(targetIndex, 0, origin.row);
        const desired = crossing ? [...sourceRows, ...targetRows] : targetRows;
        const updates = {};
        let nextPrimaryIndex = null;
        for (const bucket of [...new Set(origin.row.sources.map(source => source.bucket))]) {
            const affected = desired.flatMap((row, order) => row.sources.filter(source => source.bucket === bucket).map(source => ({ entry: source.entry, order })));
            const affectedSet = new Set(affected.map(source => source.entry));
            const old = current[bucket];
            const positions = old.flatMap((entry, index) => affectedSet.has(entry) ? [index] : []);
            if (positions.length !== affected.length) return false;
            const next = old.slice();
            positions.forEach((position, index) => {
                const { entry, order } = affected[index];
                const moved = origin.row.sources.some(source => source.entry === entry);
                if (moved && bucket === from.bucket && entry === origin.row.entry) nextPrimaryIndex = position;
                next[position] = { ...entry, order, section: moved ? targetSections[bucket] : entry.section };
            });
            updates[bucket] = next;
        }
        const changed = Object.entries(updates).some(([bucket, next]) => next.some((entry, index) => JSON.stringify(entry) !== JSON.stringify(current[bucket][index])));
        if (!changed) return false;
        for (const [bucket, next] of Object.entries(updates)) current[bucket] = next;
        lastReordered = { bucket: from.bucket, index: nextPrimaryIndex };
        current.markAsChanged();
        notify();
        return true;
    }
    let drag = null;
    const locator = element => ({ bucket: element.dataset.bucket, index: Number(element.dataset.index) });
    function clearDrag() {
        if (!drag) return;
        if (drag.scrollFrame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(drag.scrollFrame);
        drag.hover?.classList.remove('t-drop-before', 't-drop-after');
        drag.source?.classList.remove('t-drag-origin');
        for (const block of drag.zones || []) block.classList.remove('t-drop-zone', 't-drop-zone-active');
        drag.ghost?.remove();
        if (drag.handle?.hasPointerCapture?.(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
        drag = null;
    }
    function candidateAt(x, y) {
        if (!drag || String(current?._id) !== drag.cardId || !current.editMode) return null;
        const under = document.elementFromPoint(x, y);
        const block = under?.closest?.('.a-block');
        if (!block) return null;
        const grouped = groups();
        const rows = Array.from(block.querySelectorAll('.t-entry[data-bucket]'))
            .filter(row => row.dataset.cardId === drag.cardId && canPlace(grouped, drag.from, locator(row)) && row.getBoundingClientRect().height > 0);
        if (!rows.length) return null;
        const direct = under.closest?.('.t-entry[data-bucket]');
        const row = direct && rows.includes(direct) ? direct : rows.reduce((best, item) => {
            const rect = item.getBoundingClientRect();
            const distance = Math.hypot(x - Math.max(rect.left, Math.min(x, rect.right)), y - Math.max(rect.top, Math.min(y, rect.bottom)));
            return !best || distance < best.distance ? { row: item, distance } : best;
        }, null).row;
        const rect = row.getBoundingClientRect();
        return { row, block, side: y >= rect.top + rect.height / 2 ? 'after' : 'before' };
    }
    function hoverDrag(x, y) {
        if (!drag) return;
        const next = candidateAt(x, y);
        if (drag.hover === next?.row && drag.side === next?.side) return;
        drag.hover?.classList.remove('t-drop-before', 't-drop-after');
        for (const block of drag.zones || []) block.classList.remove('t-drop-zone-active');
        drag.hover = next?.row || null;
        drag.side = next?.side || 'before';
        if (next) {
            next.row.classList.add(next.side === 'after' ? 't-drop-after' : 't-drop-before');
            next.block.classList.add('t-drop-zone-active');
        }
    }
    function scrollWhileDragging() {
        if (!drag?.active) return;
        if (document.contains?.(drag.handle) === false) { clearDrag(); return; }
        const { x, y } = drag.pointer;
        const delta = y < 48 ? -16 : y > window.innerHeight - 48 ? 16 : 0;
        if (delta && typeof window.scrollBy === 'function') {
            window.scrollBy(0, delta);
            hoverDrag(x, y);
        }
        drag.scrollFrame = requestAnimationFrame(scrollWhileDragging);
    }
    function beginDrag() {
        const source = drag.sourceRow || Array.from(document.querySelectorAll('.t-entry[data-bucket]')).find(row => row.dataset.cardId === drag.cardId && row.dataset.bucket === drag.from.bucket && Number(row.dataset.index) === drag.from.index);
        if (!source) { clearDrag(); return false; }
        drag.active = true;
        drag.source = source;
        source.classList.add('t-drag-origin');
        drag.ghost = document.createElement('div');
        drag.ghost.className = 't-drag-preview';
        const name = document.createElement('strong');
        name.textContent = source.querySelector('.t-entry-name')?.textContent || '角色欄位';
        const value = document.createElement('span');
        value.textContent = (source.querySelector('.t-entry-value, .a-roll')?.textContent || '').slice(0, 80);
        drag.ghost.append(name, value);
        document.body.append(drag.ghost);
        const grouped = groups();
        drag.zones = Array.from(document.querySelectorAll('.a-block')).filter(block =>
            Array.from(block.querySelectorAll('.t-entry[data-bucket]')).some(row => row.dataset.cardId === drag.cardId && canPlace(grouped, drag.from, locator(row))));
        for (const block of drag.zones) block.classList.add('t-drop-zone');
        if (typeof requestAnimationFrame === 'function') drag.scrollFrame = requestAnimationFrame(scrollWhileDragging);
        return true;
    }
    document.addEventListener('pointerdown', event => {
        const handle = event.target.closest?.('.t-drag-handle');
        if (!handle || !selected() || !current.editMode || (event.pointerType === 'mouse' && event.button !== 0)) return;
        clearDrag();
        drag = { from: locator(handle), sourceRow: handle.closest?.('.t-entry[data-bucket]'), cardId: String(current._id), hover: null, side: 'before', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false, handle };
        handle.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    });
    document.addEventListener('pointermove', event => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
        drag.pointer = { x: event.clientX, y: event.clientY };
        if (!drag.active && !beginDrag()) return;
        event.preventDefault();
        drag.ghost.style.left = `${event.clientX + 12}px`;
        drag.ghost.style.top = `${event.clientY + 12}px`;
        hoverDrag(event.clientX, event.clientY);
    });
    document.addEventListener('pointerup', event => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        if (drag.active) {
            hoverDrag(event.clientX, event.clientY);
            if (drag.hover) {
                const preview = drag.ghost;
                const fromRect = preview?.getBoundingClientRect?.();
                const toRect = drag.hover.getBoundingClientRect();
                const moved = reorder(drag.from, locator(drag.hover), drag.side);
                if (moved && fromRect && preview?.animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
                    drag.ghost = null;
                    const animation = preview.animate([
                        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                        { transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(.86)`, opacity: 0 }
                    ], { duration: 190, easing: 'ease-out', fill: 'forwards' });
                    animation.onfinish = () => preview.remove();
                    animation.oncancel = () => preview.remove();
                }
            }
        }
        clearDrag();
    });
    document.addEventListener('pointercancel', event => { if (drag?.pointerId === event.pointerId) clearDrag(); });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && drag) { clearDrag(); return; }
        const handle = event.target.closest?.('.t-drag-handle');
        if (!handle || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        handleAction(event.key === 'ArrowUp' ? 'live-move-up' : 'live-move-down', handle);
    });
    function handleAction(action, element) {
        const rows = groups()[element.dataset.sectionKey] || [];
        const position = rows.findIndex(row => row.bucket === element.dataset.bucket && row.index === Number(element.dataset.index));
        const step = action === 'live-move-up' ? -1 : 1;
        let target = position + step;
        while (target >= 0 && target < rows.length && !rows[target].sources.some(source => source.bucket === element.dataset.bucket)) target += step;
        if (position >= 0 && target >= 0 && target < rows.length && reorder({ bucket: element.dataset.bucket, index: Number(element.dataset.index) }, { bucket: rows[target].bucket, index: rows[target].index }, step > 0 ? 'after' : 'before') && typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => document.querySelector(`.t-drag-handle[data-bucket="${lastReordered.bucket}"][data-index="${lastReordered.index}"]`)?.focus({ preventScroll: true }));
        }
    }
    function handle(action, el, ui) {
        // Only presentation/navigation actions reach the fictional preview handlers.
        if (['system', 'density', 'expand', 'view-section', 'display-mode', 'jump-section', 'view-group', 'page-step', 'close-dialog', 'close-toast'].includes(action)) return false;
        if (action === 'live-login') { $('#loginModalCenter').modal('show'); return true; }
        if (action === 'live-logout') { current.showLogoutModal(); return true; }
        if (action === 'live-select') { selectCard(); return true; }
        if (action === 'live-manage') { manage(); return true; }
        if (!selected()) return true;
        switch (action) {
            case 'live-expand-note': {
                const entry = item(el);
                if (entry) { if (expandedNotes.has(entry)) expandedNotes.delete(entry); else expandedNotes.add(entry); notify(); }
                break;
            }
            case 'live-move-up': case 'live-move-down': handleAction(action, el); break;
            case 'edit': current.toggleEditMode(); break;
            case 'resources': manage(true); break;
            case 'live-save': current.updateCard(); break;
            case 'live-revert': current.revertChanges(); break;
            case 'live-public': current.requestTogglePublic(); break;
            case 'live-channels': current.config(); break;
            case 'adjust': {
                const index = Number(el.dataset.key?.replace('state-', ''));
                if (project(ui.state.system).resources.some(r => r.index === index)) current.adjustValue(index, 'current', Number(el.dataset.delta));
                break;
            }
            case 'live-roll': { const entry = item(el); if (entry && el.dataset.bucket === 'roll') current.rolling(entry.name); break; }
            case 'live-detail': { const entry = item(el); if (entry) ui.open(entry.name, `<p class="a-detail-copy">${esc(entry.itemA)}</p>`); break; }
            case 'live-entry': case 'live-add': {
                if (!current.editMode) break;
                const key = el.dataset.section;
                const bucket = action === 'live-add' ? (['skills', 'actions'].includes(key) ? 'roll' : ['notes', 'features', 'inventory', 'background', 'training', 'powers'].includes(key) ? 'notes' : 'state') : el.dataset.bucket;
                const entry = action === 'live-add' ? { name: '', itemA: '', itemB: '', section: presentation === 'generic' ? 'General' : Object.keys(sectionMap).find(name => sectionMap[name] === key) || 'General' } : item(el);
                if (!entry) break;
                editTarget = { cardId: current._id, bucket, entry: action === 'live-add' ? null : entry };
                ui.open(action === 'live-add' ? '新增角色欄位' : '編輯 ' + entry.name, `<form id="t-entry-form"><label>名稱<input name="name" maxlength="50" required value="${esc(entry.name)}"></label><label>${bucket === 'roll' ? '擲骰指令' : '內容'}<textarea name="itemA" rows="${bucket === 'notes' ? 8 : 2}" maxlength="${bucket === 'notes' ? 4000 : bucket === 'roll' ? 200 : 50}">${esc(entry.itemA)}</textarea></label>${bucket === 'state' ? `<label>最大值／第二值<input name="itemB" maxlength="50" value="${esc(entry.itemB)}"></label>` : ''}<label>分類<input name="section" list="t-section-options" value="${esc(entry.section || 'General')}"></label><datalist id="t-section-options">${CARD_SECTION.SECTION_ORDER.map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist><p class="a-footnote">套用後按「儲存」更新角色資料。</p><button type="submit" class="a-primary">套用修改</button>${action === 'live-entry' ? uiButton('移除欄位', 'live-delete') : ''}</form>`);
                break;
            }
            case 'live-help': showDetailedHelp(); break;
            case 'live-sources': ui.open('官方角色卡參考', '<p class="a-detail-copy">CoC 參考調查員特徵、百分比技能、生命／理智／幸運、武器、裝備及背景；D&D 參考能力值、豁免、熟練、生命骰、攻擊、施法及法術位。泛用模式直接呈現角色原有欄位。</p><p><a href="https://downloads.chaosium.com/call-of-cthulhu/cha2300-investigator-sheets/CoC7_Investigator_Sheet_Standard_autocalc.pdf" target="_blank" rel="noopener noreferrer">Chaosium 官方 CoC 7e 調查員角色卡</a></p><p><a href="https://media.dndbeyond.com/compendium-images/free-rules/ph/character-sheet.pdf" target="_blank" rel="noopener noreferrer">D&D 官方 2024 角色卡</a></p>'); break;
            case 'live-delete': {
                if (!editTarget?.entry || editTarget.cardId !== current._id) break;
                ui.open('移除欄位', `<p class="a-detail-copy">移除「${esc(editTarget.entry.name)}」？儲存前可撤回修改。</p>${uiButton('移除這個欄位', 'live-confirm-delete')}`);
                break;
            }
            case 'live-confirm-delete': {
                if (!editTarget?.entry || editTarget.cardId !== current._id) break;
                const index = current[editTarget.bucket].indexOf(editTarget.entry);
                if (index < 0) break;
                current.removeItem({ state: 0, roll: 1, notes: 2 }[editTarget.bucket], index);
                current.markAsChanged(); editTarget = null;
                document.getElementById('atelier-dialog').close();
                break;
            }
        }
        return true;
    }
    function uiButton(label, action) { return `<button type="button" class="a-primary" data-act="${action}">${label}</button>`; }
    document.addEventListener('submit', event => {
        if (event.target.id !== 't-entry-form') return;
        event.preventDefault();
        if (!selected() || !editTarget || current._id !== editTarget.cardId) return;
        const { bucket, entry } = editTarget;
        const index = entry ? current[bucket].indexOf(entry) : -1;
        if (entry && index < 0) return;
        const values = new FormData(event.target);
        const next = { ...(entry || {}), name: String(values.get('name')).trim(), itemA: String(values.get('itemA') || ''), section: String(values.get('section') || 'General').trim() || 'General' };
        if (bucket === 'state') next.itemB = String(values.get('itemB') || '');
        const candidate = { ...current.$data, [bucket]: [...current[bucket]] };
        if (entry) candidate[bucket][index] = next; else candidate[bucket].push(next);
        const error = validateClientCardPayload(candidate);
        if (error) { uiManager.showError(error); return; }
        if (entry) Object.assign(entry, next); else current[bucket].push(next);
        current.markAsChanged(); editTarget = null;
        document.getElementById('atelier-dialog').close();
    });
    window.CardtLive = {
        ready, project, toolbar, identityTools, resourceStrip, context, section, handle, reorder,
        sectionLabel: key => profile().labels[key] || labels[key], isSelected: selected,
        sectionOrder: () => {
            const grouped = groups();
            return profile().order.filter(key => grouped[key]?.length || (key === 'background' && current?.characterDetails?.length));
        },
        count: key => (groups()[key]?.length || 0) + (key === 'background' ? current?.characterDetails?.length || 0 : 0),
        readyCard(card) {
            current = card;
            current.$watch(() => [current._id, current.name, current.image, current.state, current.roll, current.notes, current.characterDetails, current.public, current.gpList, current.selectedGroupId, current.hasUnsavedChanges, current.isLoggedIn, current.editMode], () => notify(), { deep: true });
            socketManager.getSocket().on('connect', () => notify()); socketManager.getSocket().on('disconnect', () => notify());
            socketManager.getSocket().on('updateCard', result => {
                if (!socketManager.lastHandledUpdateCardRequestId) return;
                const ok = result && typeof result === 'object' ? result.ok === true : result === true;
                feedback(ok ? '角色資料已儲存' : '角色資料儲存失敗', ok ? '其他設計及聊天平台會使用這份角色資料。' : '目前修改仍保留在頁面，請稍後重試。');
            });
            resolveReady();
        },
        subscribe(callback, onFeedback) { notify = callback; if (onFeedback) feedback = onFeedback; },
        change(el) { if (selected() && el.hasAttribute('data-live-channel')) { current.selectedGroupId = el.value; current.saveSelectedGroupId(); } },
        roll(name) { if (selected() && current.roll.some(entry => entry.name === name)) current.rolling(name); },
        empty() { return '<section class="a-shell t-empty"><h1>開啟你的角色卡</h1><p>登入後選擇角色，20 款設計均會讀取相同角色資料。</p><button type="button" data-act="live-login">登入</button><button type="button" data-act="live-select">選擇角色</button></section>'; },
        footer(button, theme, id) { return `<footer class="a-footer"><span>T${id} · ${esc(theme.name)}</span><div>${button('完整管理功能', 'live-manage')}${button('官方角色卡參考', 'live-sources')}${button('使用說明', 'live-help')}</div></footer>`; }
    };
}());
