'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(overrides = {}) {
    const listeners = {};
    const current = {
        _id: 'fixture-only', isLoggedIn: true, name: 'Fixture', image: '',
        state: [
            { name: 'STR', itemA: '55', section: 'Abilities' },
            { name: 'HP', itemA: '8', itemB: '12', section: 'Vitals' },
            { name: '自訂狀態', itemA: '非數值', section: 'Custom' }
        ],
        roll: [{ name: '聆聽', itemA: 'CC {聆聽}', section: 'Skills' }, { name: '攻擊', itemA: '1d20+4', section: 'Combat' }],
        notes: [{ name: '長筆記', itemA: '正文'.repeat(1000), section: 'Unknown' }],
        characterDetails: [], headerBadges: [], gpList: [], selectedGroupId: '', hasUnsavedChanges: false, editMode: true,
        isSafeImageUrl: () => false, $watch: jest.fn(), rolling: jest.fn(), adjustValue: jest.fn(), removeItem: jest.fn(), markAsChanged: jest.fn(),
        ...overrides
    };
    const close = jest.fn();
    const context = {
        window: {}, document: { body: { dataset: { system: 'coc', design: '11' } }, addEventListener: (event, fn) => { listeners[event] = fn; }, getElementById: () => ({ close }) },
        socketManager: { getSocket: () => ({ on: jest.fn() }), isConnected: () => true },
        uiManager: { showError: jest.fn() },
        validateClientCardPayload: jest.fn(() => null),
        FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key]; } }
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../views/common/card-section-grouping.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../views/common/cardt/live.js'), 'utf8'), context);
    const live = context.window.CardtLive;
    live.readyCard(current);
    live.project('coc');
    return { live, current, listeners, context, close };
}
const esc = value => String(value ?? '');
const button = (label, action, attrs = '', cls = '') => `<button class="${cls}" data-act="${action}" ${attrs}>${label}</button>`;

describe('Cardt shared live-card adapter', () => {
    test('system presentations use distinct sections without changing source data', () => {
        const { live, current } = setup();
        const before = JSON.stringify([current.state, current.roll, current.notes]);
        live.project('generic');
        expect(live.sectionOrder()).toEqual(['attributes', 'skills', 'notes']);
        expect(live.count('attributes')).toBe(current.state.length);
        expect(live.count('skills')).toBe(current.roll.length);
        expect(live.count('notes')).toBe(current.notes.length);
        live.project('coc');
        expect(live.sectionOrder()).toEqual(['attributes', 'status', 'skills', 'actions', 'other']);
        expect(live.sectionOrder()).not.toContain('saves');
        expect(live.sectionLabel('status')[0]).toContain('理智');
        live.project('dnd');
        expect(live.sectionOrder()).toEqual(['attributes', 'skills', 'status', 'actions', 'other']);
        expect(live.sectionLabel('powers')[0]).toContain('法術位');
        expect(JSON.stringify([current.state, current.roll, current.notes])).toBe(before);
    });
    test('reading hides per-entry editing and adding while retaining rolls and inline note expansion', () => {
        const { live, current } = setup({ editMode: false });
        const ui = { open: jest.fn() };
        expect(live.section('skills', true, { id: 16, button })).toContain('live-roll');
        expect(live.section('skills', true, { id: 16, button })).not.toContain('live-entry');
        expect(live.section('skills', true, { id: 16, button })).not.toContain('live-add');
        expect(live.section('other', true, { id: 16, button })).toContain('正文'.repeat(1000));
        expect(live.section('other', false, { id: 16, button })).toContain('live-expand-note');
        expect(live.section('other', false, { id: 16, button })).not.toContain('全文');
        live.handle('live-entry', { dataset: { bucket: 'roll', index: '0' } }, ui);
        expect(ui.open).not.toHaveBeenCalled();
        current.editMode = true;
        expect(live.section('skills', true, { id: 16, button })).toContain('live-entry');
        expect(live.section('skills', true, { id: 16, button })).toContain('live-add');
        expect(live.section('skills', true, { id: 16, button })).not.toContain('draggable="true"');
    });
    test('shows every canonical entry, including legacy and unknown sections', () => {
        const { live, current } = setup();
        const count = live.sectionOrder().reduce((n, key) => n + live.count(key), 0);
        expect(count).toBe(current.state.length + current.roll.length + current.notes.length);
        expect(live.count('other')).toBe(2);
        expect(live.count('status')).toBe(1);
    });
    test('legacy exact ability names are presented without rewriting the source', () => {
        const { live, current } = setup({ state: [{ name: '力量', itemA: '50' }, { name: '專注', itemA: '10' }] });
        const before = JSON.stringify(current.state);
        expect(live.project('coc').attributes[0].value).toBe(50);
        expect(live.count('other')).toBe(2);
        expect(JSON.stringify(current.state)).toBe(before);
    });
    test('presentation changes never create fictional skills or resources', () => {
        const { live, current } = setup({ state: [], roll: [], notes: [] });
        expect(live.project('dnd').resources).toHaveLength(0);
        expect(live.project('coc').skills).toHaveLength(0);
        expect(current.state).toHaveLength(0);
    });
    test('D&D ability modifiers do not become adjustable resources', () => {
        const { live } = setup({ state: [{ name: 'DEX', itemA: '15', itemB: '2', section: 'Abilities' }, { name: 'HP', itemA: '30', itemB: '38', section: 'Vitals' }], roll: [], notes: [] });
        expect(live.project('dnd').resources.map(resource => resource.label)).toEqual(['HP']);
        expect(live.section('attributes', false, { id: 1, button })).toContain('修正 2');
    });
    test('all 20 styles include full skill names and full note bodies in their DOM', () => {
        const name = '一個非常長的技能名稱'.repeat(4);
        const { live } = setup({ roll: [{ name, itemA: 'CC 40' }] });
        for (let id = 1; id <= 20; id++) {
            expect(live.section('skills', false, { id, button, esc })).toContain(name);
            expect(live.section('other', true, { id, button, esc })).toContain('正文'.repeat(1000));
        }
    });
    test('resource adjustment calls the original current-value method, not maximum', () => {
        const { live, current } = setup();
        live.handle('adjust', { dataset: { key: 'state-1', delta: '-1' } }, { state: { system: 'coc' } });
        expect(current.adjustValue).toHaveBeenCalledWith(1, 'current', -1);
    });
    test('rolling uses the original named-entry operation and preserves variable syntax', () => {
        const { live, current } = setup();
        live.handle('live-roll', { dataset: { bucket: 'roll', index: '0' } }, {});
        expect(current.rolling).toHaveBeenCalledWith('聆聽');
        expect(current.roll[0].itemA).toBe('CC {聆聽}');
    });
    test('unsigned users cannot change resources or roll loaded data', () => {
        const { live, current } = setup({ isLoggedIn: false });
        expect(live.isSelected()).toBe(false);
        live.handle('adjust', { dataset: { key: 'state-1', delta: '1' } }, { state: { system: 'dnd' } });
        live.roll('聆聽');
        expect(current.adjustValue).not.toHaveBeenCalled();
        expect(current.rolling).not.toHaveBeenCalled();
    });
    test('the original demo card cannot be presented as a database character', () => {
        const { live } = setup({ _id: '_test_' });
        expect(live.isSelected()).toBe(false);
    });
    test('fictional reset/rest/local-save handlers cannot execute on T pages', () => {
        const { live } = setup();
        for (const action of ['confirm-reset', 'confirm-long-rest', 'short-rest', 'export', 'slot']) {
            expect(live.handle(action, { dataset: {} }, {})).toBe(true);
        }
        expect(live.handle('density', { dataset: {} }, {})).toBe(false);
    });
    test('editing preserves kind/order and applies only to the selected source entry', () => {
        const { live, current, listeners, close } = setup();
        Object.assign(current.notes[0], { kind: 'custom-kind', order: 7 });
        current.$data = current;
        live.handle('live-entry', { dataset: { bucket: 'notes', index: '0' } }, { open: jest.fn() });
        listeners.submit({ preventDefault: jest.fn(), target: { id: 't-entry-form', values: { name: '改名', itemA: '新正文', section: 'Custom' } } });
        expect(current.notes[0]).toMatchObject({ name: '改名', itemA: '新正文', kind: 'custom-kind', order: 7 });
        expect(current.markAsChanged).toHaveBeenCalled();
        expect(close).toHaveBeenCalled();
    });
    test('a stale edit dialog cannot change another character', () => {
        const { live, current, listeners } = setup();
        live.handle('live-entry', { dataset: { bucket: 'notes', index: '0' } }, { open: jest.fn() });
        current._id = 'another-fixture';
        listeners.submit({ preventDefault: jest.fn(), target: { id: 't-entry-form', values: { name: '錯誤', itemA: '錯誤' } } });
        expect(current.notes[0].name).toBe('長筆記');
        expect(current.markAsChanged).not.toHaveBeenCalled();
    });
    test('all 20 complete layouts initialize with actual bucket-shaped data in both densities', async () => {
        for (let id = 1; id <= 20; id++) for (const system of ['auto', 'generic', 'coc', 'dnd']) for (const density of ['summary', 'open']) {
            const { context } = setup();
            const root = { innerHTML: '', dataset: {}, contains: () => false, querySelector: () => null };
            const dialog = { addEventListener: () => {}, open: false, dataset: {} };
            context.document.getElementById = key => key === 'atelier-root' ? root : dialog;
            context.location = new URL(`http://localhost/cardt${id}?system=${system}&density=${density}`);
            context.URL = URL;
            context.URLSearchParams = URLSearchParams;
            context.window.addEventListener = () => {};
            context.window.history = { replaceState: () => {} };
            for (const file of ['themes-a.js', 'themes-b.js', 'model.js']) {
                vm.runInContext(fs.readFileSync(path.join(__dirname, '../views/common/carda/', file), 'utf8'), context);
            }
            await vm.runInContext(fs.readFileSync(path.join(__dirname, '../views/common/carda/app.js'), 'utf8'), context);
            expect(root.innerHTML).toContain('Fixture');
            expect(root.innerHTML).toContain('character-sheet');
            expect(root.innerHTML).toContain('t-view-navigation');
            expect(root.innerHTML).toContain('t-section-picker');
            expect(root.innerHTML.includes('t-summary-layout')).toBe(density === 'summary');
            expect(root.innerHTML).not.toContain('t-open-workspace');
            expect(root.innerHTML).not.toContain('角色資料暫未載入');
            expect(context.document.body.dataset.design).toBe(String(id));
            expect(context.document.body.dataset.density).toBe(density);
        }
    });
    test('deleting a field requires the dialog confirmation and only changes the draft', () => {
        const { live, current } = setup();
        const ui = { open: jest.fn() };
        live.handle('live-entry', { dataset: { bucket: 'notes', index: '0' } }, ui);
        live.handle('live-delete', { dataset: {} }, ui);
        expect(current.removeItem).not.toHaveBeenCalled();
        live.handle('live-confirm-delete', { dataset: {} }, ui);
        expect(current.removeItem).toHaveBeenCalledWith(2, 0);
        expect(current.markAsChanged).toHaveBeenCalled();
    });
    test('automatic presentation uses strong system signals and falls back on conflict', () => {
        const { live, current } = setup({ state: [{ name: 'SAN', itemA: '70' }, { name: 'POW', itemA: '60' }], roll: [], notes: [] });
        expect(live.project('auto').system).toBe('coc');
        current.state = [{ name: 'PB', itemA: '3' }, { name: 'AC', itemA: '15' }];
        current.roll = [{ name: 'Save STR', itemA: '1d20+2' }];
        expect(live.project('auto').system).toBe('dnd');
        current.state.push({ name: 'SAN', itemA: '50' }, { name: 'POW', itemA: '55' });
        expect(live.project('auto').system).toBe('generic');
    });
    test('known kind can classify a custom section without losing its original label', () => {
        const { live } = setup({ state: [{ name: '自訂技能', itemA: '35', section: 'My Section', kind: 'skill' }], roll: [], notes: [] });
        expect(live.count('skills')).toBe(1);
        expect(live.section('skills', false, { id: 1, button })).toContain('My Section');
    });
    test('same-category order changes the draft array and order fields', () => {
        const { live, current } = setup({ state: [{ name: 'STR', itemA: '50', section: 'Abilities' }, { name: 'DEX', itemA: '60', section: 'Abilities' }], roll: [], notes: [] });
        expect(live.reorder({ bucket: 'state', index: 0 }, { bucket: 'state', index: 1 }, 'after')).toBe(true);
        expect(current.state.map(entry => entry.name)).toEqual(['DEX', 'STR']);
        expect(current.state.map(entry => entry.order)).toEqual([0, 1]);
        expect(current.markAsChanged).toHaveBeenCalledTimes(1);
    });
    test('compatible cross-category move updates section while an incompatible target leaves the draft intact', () => {
        const { live, current } = setup({ state: [{ name: 'HP', itemA: '8', section: 'Vitals' }, { name: 'STR', itemA: '55', section: 'Abilities' }], roll: [], notes: [{ name: '秘密', itemA: '內容', section: 'Unknown' }] });
        expect(live.reorder({ bucket: 'state', index: 0 }, { bucket: 'state', index: 1 }, 'after')).toBe(true);
        expect(current.state.find(entry => entry.name === 'HP').section).toBe('Abilities');
        const before = JSON.stringify([current.state, current.notes]);
        expect(live.reorder({ bucket: 'notes', index: 0 }, { bucket: 'state', index: 0 })).toBe(false);
        expect(JSON.stringify([current.state, current.notes])).toBe(before);
    });
    test('custom section with a recognized kind is not an ambiguous cross-category drop target', () => {
        const { live, current } = setup({ state: [{ name: 'HP', itemA: '8', section: 'Vitals' }, { name: '自訂技能', itemA: '35', section: 'My Section', kind: 'skill' }], roll: [], notes: [] });
        const before = JSON.stringify(current.state);
        expect(live.reorder({ bucket: 'state', index: 0 }, { bucket: 'state', index: 1 })).toBe(false);
        expect(JSON.stringify(current.state)).toBe(before);
        expect(current.markAsChanged).not.toHaveBeenCalled();
    });
    test('linked skill score and roll move as one row without merging source records', () => {
        const { live, current } = setup({
            state: [{ name: '聆聽', itemA: '45', section: 'Skills' }, { name: '心理學', itemA: '10', section: 'Skills' }],
            roll: [{ name: '聆聽', itemA: 'CC 45', section: 'Skills' }, { name: '心理學', itemA: 'CC 10', section: 'Skills' }], notes: []
        });
        expect(live.count('skills')).toBe(2);
        expect(live.section('skills', false, { id: 1, button })).toContain('t-linked-roll');
        expect(live.reorder({ bucket: 'state', index: 0 }, { bucket: 'state', index: 1 }, 'after')).toBe(true);
        expect(current.state.map(entry => entry.name)).toEqual(['心理學', '聆聽']);
        expect(current.roll.map(entry => entry.name)).toEqual(['心理學', '聆聽']);
        expect(current.state.map(entry => entry.order)).toEqual([0, 1]);
        expect(current.roll.map(entry => entry.order)).toEqual([0, 1]);
    });
    test('keyboard arrows reorder only the selected card draft', () => {
        const { current, listeners } = setup({ state: [{ name: 'STR', itemA: '50', section: 'Abilities' }, { name: 'DEX', itemA: '60', section: 'Abilities' }], roll: [], notes: [] });
        const handle = { dataset: { bucket: 'state', index: '0', sectionKey: 'attributes' } };
        const preventDefault = jest.fn();
        listeners.keydown({ key: 'ArrowDown', target: { closest: () => handle }, preventDefault });
        expect(preventDefault).toHaveBeenCalled();
        expect(current.state.map(entry => entry.name)).toEqual(['DEX', 'STR']);
    });
    test.each(['mouse', 'touch'])('%s drag accepts category whitespace, shows insertion feedback, and reorders on release', pointerType => {
        const { current, listeners, context } = setup({ state: [{ name: 'STR', itemA: '50', section: 'Abilities' }, { name: 'DEX', itemA: '60', section: 'Abilities' }], roll: [], notes: [] });
        const classes = () => ({ add: jest.fn(), remove: jest.fn() });
        const source = { dataset: { bucket: 'state', index: '0', cardId: 'fixture-only' }, classList: classes(),
            getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 40, height: 40 }), querySelector: () => ({ textContent: 'STR' }) };
        const target = { dataset: { bucket: 'state', index: '1', cardId: 'fixture-only' }, classList: classes(),
            getBoundingClientRect: () => ({ left: 0, right: 100, top: 50, bottom: 90, height: 40 }), querySelector: () => ({ textContent: 'DEX' }) };
        const block = { classList: classes(), querySelectorAll: () => [source, target] };
        context.document.querySelectorAll = selector => selector === '.a-block' ? [block] : [source, target];
        context.document.elementFromPoint = () => ({ closest: selector => selector === '.a-block' ? block : null });
        context.document.createElement = () => ({ style: {}, append: jest.fn(), remove: jest.fn() });
        context.document.body.append = jest.fn();
        const handle = { dataset: { bucket: 'state', index: '0' }, setPointerCapture: jest.fn(), releasePointerCapture: jest.fn(), hasPointerCapture: () => true };
        listeners.pointerdown({ pointerType, button: 0, pointerId: 7, clientX: 0, clientY: 0, target: { closest: () => handle }, preventDefault: jest.fn() });
        listeners.pointermove({ pointerId: 7, clientX: 20, clientY: 78, preventDefault: jest.fn() });
        expect(source.classList.add).toHaveBeenCalledWith('t-drag-origin');
        expect(block.classList.add).toHaveBeenCalledWith('t-drop-zone-active');
        expect(target.classList.add).toHaveBeenCalledWith('t-drop-after');
        listeners.pointerup({ pointerId: 7, clientX: 20, clientY: 78 });
        expect(current.state.map(entry => entry.name)).toEqual(['DEX', 'STR']);
        expect(current.markAsChanged).toHaveBeenCalledTimes(1);
        expect(handle.releasePointerCapture).toHaveBeenCalledWith(7);
    });
    test('touch drag cancellation or switching cards leaves the draft unchanged', () => {
        const { current, listeners, context } = setup({ state: [{ name: 'STR', itemA: '50', section: 'Abilities' }, { name: 'DEX', itemA: '60', section: 'Abilities' }], roll: [], notes: [] });
        const classes = { add: jest.fn(), remove: jest.fn() };
        const handle = { dataset: { bucket: 'state', index: '0' } };
        const source = { dataset: { bucket: 'state', index: '0', cardId: 'fixture-only' }, classList: classes,
            getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 40, height: 40 }), querySelector: () => ({ textContent: 'STR' }) };
        const row = { dataset: { bucket: 'state', index: '1', cardId: 'fixture-only' }, classList: classes,
            getBoundingClientRect: () => ({ left: 0, right: 100, top: 50, bottom: 90, height: 40 }), querySelector: () => ({ textContent: 'DEX' }) };
        const block = { classList: classes, querySelectorAll: () => [source, row] };
        context.document.querySelectorAll = selector => selector === '.a-block' ? [block] : [source, row];
        context.document.elementFromPoint = () => ({ closest: selector => selector === '.a-block' ? block : row });
        context.document.createElement = () => ({ style: {}, append: jest.fn(), remove: jest.fn() });
        context.document.body.append = jest.fn();
        const down = () => listeners.pointerdown({ pointerType: 'touch', pointerId: 1, clientX: 0, clientY: 0, target: { closest: () => handle }, preventDefault: jest.fn() });
        const move = () => listeners.pointermove({ pointerId: 1, clientX: 20, clientY: 78, preventDefault: jest.fn() });
        down(); move();
        expect(classes.add).toHaveBeenCalledWith('t-drop-after');
        listeners.pointercancel({ pointerId: 1 });
        expect(current.state.map(entry => entry.name)).toEqual(['STR', 'DEX']);
        down(); move();
        current._id = 'another-card';
        listeners.pointerup({ pointerId: 1, clientX: 20, clientY: 78 });
        expect(current.state.map(entry => entry.name)).toEqual(['STR', 'DEX']);
        expect(current.markAsChanged).not.toHaveBeenCalled();
    });
});
