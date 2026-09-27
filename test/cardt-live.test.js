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
        expect(live.sectionOrder()).toHaveLength(8);
        expect(live.sectionOrder()).not.toContain('saves');
        expect(live.sectionLabel('status')[0]).toContain('理智');
        live.project('dnd');
        expect(live.sectionOrder()).toHaveLength(12);
        expect(live.sectionOrder()).toContain('saves');
        expect(live.sectionLabel('powers')[0]).toContain('法術位');
        expect(JSON.stringify([current.state, current.roll, current.notes])).toBe(before);
    });
    test('reading hides per-entry editing and adding while retaining rolls and note detail', () => {
        const { live, current } = setup({ editMode: false });
        const ui = { open: jest.fn() };
        expect(live.section('skills', true, { id: 16, button })).toContain('live-roll');
        expect(live.section('skills', true, { id: 16, button })).not.toContain('live-entry');
        expect(live.section('skills', true, { id: 16, button })).not.toContain('live-add');
        expect(live.section('notes', true, { id: 16, button })).toContain('live-detail');
        live.handle('live-entry', { dataset: { bucket: 'roll', index: '0' } }, ui);
        expect(ui.open).not.toHaveBeenCalled();
        current.editMode = true;
        expect(live.section('skills', true, { id: 16, button })).toContain('live-entry');
        expect(live.section('skills', true, { id: 16, button })).toContain('live-add');
    });
    test('shows every canonical entry, including legacy and unknown sections', () => {
        const { live, current } = setup();
        const count = ['attributes', 'status', 'skills', 'actions', 'notes'].reduce((n, key) => n + live.count(key), 0);
        expect(count).toBe(current.state.length + current.roll.length + current.notes.length);
        expect(live.count('notes')).toBe(1);
        expect(live.count('status')).toBe(2);
    });
    test('legacy exact ability names are presented without rewriting the source', () => {
        const { live, current } = setup({ state: [{ name: '力量', itemA: '50' }, { name: '專注', itemA: '10' }] });
        const before = JSON.stringify(current.state);
        expect(live.project('coc').attributes[0].value).toBe(50);
        expect(live.count('status')).toBe(1);
        expect(JSON.stringify(current.state)).toBe(before);
    });
    test('presentation changes never create fictional skills or resources', () => {
        const { live, current } = setup({ state: [], roll: [], notes: [] });
        expect(live.project('dnd').resources).toHaveLength(0);
        expect(live.project('coc').skills).toHaveLength(0);
        expect(current.state).toHaveLength(0);
    });
    test('all 20 styles include full skill names and full note bodies in their DOM', () => {
        const name = '一個非常長的技能名稱'.repeat(4);
        const { live } = setup({ roll: [{ name, itemA: 'CC 40' }] });
        for (let id = 1; id <= 20; id++) {
            expect(live.section('skills', false, { id, button, esc })).toContain(name);
            expect(live.section('notes', true, { id, button, esc })).toContain('正文'.repeat(1000));
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
        for (let id = 1; id <= 20; id++) for (const system of ['generic', 'coc', 'dnd']) for (const density of ['summary', 'open']) {
            const { context } = setup();
            const root = { innerHTML: '', contains: () => false };
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
});
