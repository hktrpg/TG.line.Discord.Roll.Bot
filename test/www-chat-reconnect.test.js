'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf8');
const begin = html.indexOf('const socketManager = {');
const end = html.indexOf('// UI Management', begin);
if (begin === -1 || end === -1) throw new Error('socket manager not found');
const script = new vm.Script(`${html.slice(begin, end)}; socketManager`);

function setup(room = '房間A') {
    const handlers = {};
    const socket = {
        connected: true,
        on: jest.fn((event, fn) => { handlers[event] = fn; }),
        timeout: jest.fn().mockReturnThis(),
        emitWithAck: jest.fn(async (_event, target) => ({ ok: true, room: target })),
    };
    const state = { socket, currentRoom: room, hasConnected: true, pendingLive: [], joinEpoch: 0, displayedMessageIds: new Set() };
    const chatroomManager = { currentRoom: room };
    const uiManager = { addMessageToBox: jest.fn(async () => {}) };
    const context = { state, chatroomManager, uiManager, CONFIG: { DEFAULT_ROOM: '公共房間', PERSONAL_ROOM: '個人小屋' },
        console: { log: jest.fn(), warn: jest.fn(), error: jest.fn() }, document: { getElementById: () => ({ innerHTML: '' }) },
        alert: jest.fn(), rt: () => '', setTimeout: jest.fn(() => 1), clearTimeout: jest.fn(), Date, Set };
    const manager = script.runInNewContext(context);
    context.socketManager = manager;
    manager.setupEventListeners();
    return { state, socket, handlers, chatroomManager, uiManager, manager, context };
}

test('socket handshake announces the versioned history protocol and preserves locale', () => {
    const { manager, context, socket } = setup();
    context.getWwwSocketIoOptions = options => ({ ...options, query: { lang: 'zh-tw' } });
    context.io = jest.fn(() => socket);
    manager.init();
    expect(context.io).toHaveBeenCalledWith(expect.objectContaining({
        query: { lang: 'zh-tw', chatHistoryProtocol: '2' },
    }));
});

test('waits for server readiness and room acknowledgement on reconnect', async () => {
    const { state, socket, handlers } = setup();
    handlers.connect();
    expect(socket.emitWithAck).not.toHaveBeenCalled();
    expect(state.readyRoom).toBeNull();
    handlers.chatReady();
    expect(socket.emitWithAck).toHaveBeenCalledWith('newRoom', '房間A', { requestId: 1 });
    await new Promise(setImmediate);
    expect(state.readyRoom).toBe('房間A');
    handlers.disconnect();
    expect(state.readyRoom).toBeNull();
});

test('reports a server that never sends chatReady and accepts a later ready event', () => {
    const { state, handlers, context } = setup();
    handlers.connect();
    const onTimeout = context.setTimeout.mock.calls[0][0];
    onTimeout();
    expect(context.alert).toHaveBeenCalledWith('伺服器尚未就緒或版本不相容，請稍後再試。');
    handlers.chatReady();
    expect(state.chatReady).toBe(true);
});

test('ignores late acknowledgement for a room already left', async () => {
    const { state, socket, chatroomManager, manager } = setup();
    state.chatReady = true;
    let finish;
    socket.emitWithAck.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const first = manager.joinRoom('房間A');
    chatroomManager.currentRoom = '房間B';
    await manager.joinRoom('房間B');
    finish({ ok: true, room: '房間A' });
    await first;
    expect(state.readyRoom).toBe('房間B');
});

test('does not mark a rejected room as ready', async () => {
    const { state, socket, manager } = setup();
    state.chatReady = true;
    socket.emitWithAck.mockResolvedValueOnce({ ok: false });
    await manager.joinRoom('房間A');
    expect(state.readyRoom).toBeNull();
    expect(state.isHistoryLoading).toBe(false);
});

test('deduplicates a message present in history and buffered live events', async () => {
    const { state, handlers, uiManager } = setup();
    const msg = { _id: 'id-1', roomNumber: '房間A', msg: 'hello', time: 1 };
    state.pendingLive = [msg];
    state.isHistoryLoading = true;
    await handlers.chatRecord([msg], '房間A', { requestId: 0 });
    expect(uiManager.addMessageToBox).toHaveBeenCalledTimes(1);
    expect(state.pendingLive).toHaveLength(0);
});

test('ignores an older history response for the same room', async () => {
    const { state, handlers, uiManager } = setup();
    state.joinEpoch = 5;
    await handlers.chatRecord([{ _id: 'old', roomNumber: '房間A', msg: 'old', time: 1 }], '房間A', { requestId: 3 });
    expect(uiManager.addMessageToBox).not.toHaveBeenCalled();
});

test('does not display a delayed live message that was already rendered as history', async () => {
    const source = html.replaceAll('\r\n', '\n');
    const start = source.indexOf('addMessageToBox: async (message) => {');
    const end = source.indexOf('\n            }\n        };', start);
    if (start === -1 || end === -1) throw new Error('message renderer not found');
    const children = [];
    const content = { children, appendChild: node => children.push(node), removeChild: () => children.shift() };
    const createElement = () => ({ classList: { add() {} }, appendChild() {}, innerHTML: '' });
    const document = { createElement, getElementById(id) {
        if (id === 'content') return content;
        if (id === 'name') return { value: 'Tester' };
        return { scrollHeight: 100, clientHeight: 100, scrollTop: 0 };
    } };
    const state = { displayedMessageIds: new Set(), color: 0, max_record: 100, isHistoryLoading: true };
    const context = { state, document, CONFIG: { MAX_MESSAGES: 100, PERSONAL_ROOM: 'personal' },
        chatroomManager: { currentRoom: 'room' }, utils: { convertUrlsToLinks: s => s, tryEmbedImagesInto() {}, scrollToBottom() {} },
        requestAnimationFrame() {}, Date, Math, Number };
    const ui = new vm.Script(`({${source.slice(start, end)}\n            }})`).runInNewContext(context);
    const msg = { _id: 'bot-id', name: 'HKTRPG', roomNumber: 'room', msg: 'hello', time: 1 };
    await ui.addMessageToBox(msg);
    state.isHistoryLoading = false;
    await ui.addMessageToBox(msg);
    expect(children).toHaveLength(1);
    state.displayedMessageIds.clear();
    await ui.addMessageToBox(msg);
    expect(children).toHaveLength(2);
});

test('selecting the current room retries a failed join without switching rooms', () => {
    const start = html.indexOf('const chatroomManager = {');
    const end = html.indexOf('// 個人小屋本地儲存', start);
    if (start === -1 || end === -1) throw new Error('chatroom manager not found');
    const state = { readyRoom: null, chatReady: true, socket: { connected: true } };
    const socketManager = { joinRoom: jest.fn() };
    const manager = new vm.Script(`${html.slice(start, end)}; chatroomManager`).runInNewContext({
        state, socketManager, CONFIG: { DEFAULT_ROOM: 'room', PERSONAL_ROOM: 'personal' },
    });
    manager.switchRoom('room');
    expect(socketManager.joinRoom).toHaveBeenCalledWith('room');
    expect(state.isHistoryLoading).toBe(true);
    expect(state.reconnectHistoryRoom).toBe('room');
    state.readyRoom = 'room';
    manager.switchRoom('room');
    expect(socketManager.joinRoom).toHaveBeenCalledTimes(1);
    state.historyFailed = true;
    manager.switchRoom('room');
    expect(socketManager.joinRoom).toHaveBeenCalledTimes(2);
});

test('history error is retryable while preserving buffered messages', async () => {
    const { state, handlers, uiManager } = setup();
    state.readyRoom = '房間A';
    state.pendingLive = [{ _id: '1', roomNumber: '房間A', msg: 'hello', time: 1 }];
    await handlers.chatRecord([], '房間A', { requestId: 0, error: true });
    expect(state.historyFailed).toBe(true);
    expect(state.readyRoom).toBe('房間A');
    expect(uiManager.addMessageToBox).toHaveBeenCalledTimes(1);
    await handlers.chatRecord([], '房間A', { requestId: 0 });
    expect(state.historyFailed).toBe(false);
});

test.each([{ requestId: 0 }, { requestId: 0, error: true }])('keeps live messages buffered while flushing empty or failed history', async status => {
    const { state, handlers, uiManager } = setup();
    let finish;
    uiManager.addMessageToBox.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    state.pendingLive = [{ _id: 'first', roomNumber: '房間A', msg: 'first', time: 1 }];
    state.isHistoryLoading = true;
    const flushing = handlers.chatRecord([], '房間A', status);
    expect(state.isHistoryLoading).toBe(true);
    state.pendingLive.push({ _id: 'second', roomNumber: '房間A', msg: 'second', time: 2 });
    finish();
    await flushing;
    expect(uiManager.addMessageToBox.mock.calls.map(call => call[0]._id)).toEqual(['first', 'second']);
    expect(state.isHistoryLoading).toBe(false);
});

test.each(['rejected', 'unconfirmed'])('keeps typed text when the server reports %s', async code => {
    const source = html.replaceAll('\r\n', '\n');
    const start = source.indexOf('sendForm.addEventListener("submit", async (e) => {');
    const finish = source.indexOf('\n                });\n            },', start);
    if (start === -1 || finish === -1) throw new Error('send handler not found');
    let submit;
    const sendForm = { addEventListener: (_name, handler) => { submit = handler; } };
    const msgInput = { value: 'keep this message' };
    const socket = { connected: true, timeout: jest.fn().mockReturnThis(),
        emitWithAck: jest.fn(async () => ({ ok: false, code })) };
    const alert = jest.fn();
    const context = { sendForm, msgInput, nameInput: { value: 'Tester' }, alert,
        state: { socket, readyRoom: 'room' }, chatroomManager: { currentRoom: 'room' },
        CONFIG: { PERSONAL_ROOM: 'personal' }, getPageLocale: () => 'zh-tw',
        securityManager: { canSubmit: () => ({ allowed: true }), validateInput: msg => ({ valid: true, sanitized: msg }),
            checkRateLimit: () => ({ allowed: true }), setSubmitting: jest.fn() },
        rt: key => key, console: { error: jest.fn(), warn: jest.fn() }, Date };
    new vm.Script(source.slice(start, finish + '\n                });'.length)).runInNewContext(context);
    await submit({ preventDefault() {} });
    expect(msgInput.value).toBe('keep this message');
    expect(alert).toHaveBeenCalledWith(code === 'rejected' ? 'roll_send_failed' : 'roll_send_unconfirmed');
    expect(context.securityManager.setSubmitting).toHaveBeenLastCalledWith(false);
});
