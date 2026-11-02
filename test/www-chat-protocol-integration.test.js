'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('versioned room join connects the real client handler to the real server handler', async () => {
    const serverSource = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
    const start = serverSource.indexOf('let roomJoinChain = Promise.resolve();');
    const end = serverSource.indexOf("socket.on('disconnect'", start);
    const html = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf8');
    const clientStart = html.indexOf('const socketManager = {');
    const clientEnd = html.indexOf('// UI Management', clientStart);
    if ([start, end, clientStart, clientEnd].includes(-1)) throw new Error('chat handlers not found');

    const clientHandlers = {};
    const serverHandlers = {};
    const timers = [];
    const rendering = [];
    const roomMessage = { _id: 'record-1', roomNumber: 'room', msg: 'hello', time: 1 };
    const server = {
        handshake: { address: 'test' }, rooms: new Set(),
        on: (event, fn) => { serverHandlers[event] = fn; },
        join: async room => { server.rooms.add(room); },
        leave: async room => { server.rooms.delete(room); },
        emit: (event, ...args) => { if (clientHandlers[event]) rendering.push(clientHandlers[event](...args)); },
    };
    const client = {
        connected: true,
        on: (event, fn) => { clientHandlers[event] = fn; },
        timeout() { return this; },
        emitWithAck: (event, ...args) => new Promise(resolve => serverHandlers[event](...args, resolve)),
    };
    new vm.Script(serverSource.slice(start, end)).runInNewContext({
        socket: server, records: { chatRoomGet: async () => [roomMessage] }, roomHistoryGeneration: 0,
        limitRaterChatRoom: async () => false, setTimeout: fn => timers.push(fn),
        console: { error() {} }, Promise, Number,
    });
    const state = { socket: client, currentRoom: 'room', joinEpoch: 0, pendingLive: [], displayedMessageIds: new Set() };
    const uiManager = { addMessageToBox: jest.fn(async () => {}) };
    const context = { state, uiManager, chatroomManager: { currentRoom: 'room' },
        CONFIG: { DEFAULT_ROOM: 'public', PERSONAL_ROOM: 'personal' },
        document: { getElementById: () => ({ innerHTML: '' }) },
        console: { log() {}, warn() {}, error() {} }, setTimeout() {}, clearTimeout() {}, alert() {}, rt: () => '', Date, Set };
    const manager = new vm.Script(`${html.slice(clientStart, clientEnd)}; socketManager`).runInNewContext(context);
    manager.setupEventListeners();
    clientHandlers.connect();
    clientHandlers.chatReady();
    await new Promise(setImmediate);
    expect(state.readyRoom).toBe('room');
    expect(server.rooms.has('chat-room:room')).toBe(true);
    state.isHistoryLoading = true;
    state.pendingLive.push(roomMessage);
    await timers.shift()();
    await Promise.all(rendering);
    expect(uiManager.addMessageToBox).toHaveBeenCalledTimes(1);
    expect(state.isHistoryLoading).toBe(false);
});
