'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test.each([
    [{ chatHistoryProtocol: '2' }, 0],
    [{}, 1],
])('initial public history respects the client protocol', async (query, expectedQueries) => {
    const source = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
    const start = source.indexOf('let roomHistoryGeneration = 0;');
    const end = source.indexOf('socket.on("greet"', start);
    if (start === -1 || end === -1) throw new Error('initial history handler not found');
    const scheduled = [];
    const records = { chatRoomGet: jest.fn(async () => []) };
    const socket = { handshake: { query }, emit: jest.fn() };
    new vm.Script(source.slice(start, end)).runInNewContext({
        socket, records, setTimeout: fn => scheduled.push(fn), console: { error: jest.fn() },
    });
    for (const fn of scheduled) await fn();
    expect(records.chatRoomGet).toHaveBeenCalledTimes(expectedQueries);
    expect(socket.emit).toHaveBeenCalledTimes(expectedQueries);
});

test('discard an older history query when the same room is joined again', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
    const start = source.indexOf('let roomJoinChain = Promise.resolve();');
    const end = source.indexOf("socket.on('disconnect'", start);
    if (start === -1 || end === -1) throw new Error('room join handler not found');
    let handler;
    const timers = [];
    const socket = { handshake: { address: 'test' }, rooms: new Set(),
        on: (_event, fn) => { handler = fn; }, emit: jest.fn(),
        join: jest.fn(async room => socket.rooms.add(room)),
        leave: jest.fn(async room => socket.rooms.delete(room)) };
    let finishOldQuery;
    const records = { chatRoomGet: jest.fn()
        .mockReturnValueOnce(new Promise(resolve => { finishOldQuery = resolve; }))
        .mockResolvedValueOnce([{ _id: 'new' }]) };
    const context = { socket, records, roomHistoryGeneration: 0,
        limitRaterChatRoom: async () => false, setTimeout: fn => timers.push(fn),
        console: { error: jest.fn() }, Promise, Number };
    new vm.Script(source.slice(start, end)).runInNewContext(context);
    const join = requestId => new Promise(resolve => handler('room', { requestId }, resolve));
    await join(1);
    const oldQuery = timers.shift()();
    await join(2);
    await timers.shift()();
    finishOldQuery([{ _id: 'old' }]);
    await oldQuery;
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit.mock.calls[0][1]).toEqual([{ _id: 'new' }]);
    expect(socket.emit.mock.calls[0][3].requestId).toBe(2);
});

test('legacy newRoom signature still joins and receives history without a request id', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
    const start = source.indexOf('let roomJoinChain = Promise.resolve();');
    const end = source.indexOf("socket.on('disconnect'", start);
    let handler;
    const timers = [];
    const socket = { handshake: { address: 'test' }, rooms: new Set(), emit: jest.fn(),
        on: (_event, fn) => { handler = fn; }, join: jest.fn(async () => {}), leave: jest.fn(async () => {}) };
    new vm.Script(source.slice(start, end)).runInNewContext({ socket, roomHistoryGeneration: 0,
        records: { chatRoomGet: async () => [{ _id: 'legacy' }] },
        limitRaterChatRoom: async () => false, setTimeout: fn => timers.push(fn), console: { error: jest.fn() }, Promise, Number });
    const result = await new Promise(resolve => handler('legacy-room', resolve));
    expect(result.ok).toBe(true);
    await timers.shift()();
    expect(socket.emit.mock.calls[0][0]).toBe('chatRecord');
    expect(socket.emit.mock.calls[0][1]).toEqual([{ _id: 'legacy' }]);
    expect(socket.emit.mock.calls[0][3].requestId).toBeNull();
});

test('a rate-limited room join sends failure without joining or querying', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../modules/core-www.js'), 'utf8');
    const start = source.indexOf('let roomJoinChain = Promise.resolve();');
    const end = source.indexOf("socket.on('disconnect'", start);
    let handler;
    const schedule = jest.fn();
    const socket = { handshake: { address: 'test' }, rooms: new Set(), emit: jest.fn(),
        on: (_event, fn) => { handler = fn; }, join: jest.fn(), leave: jest.fn() };
    new vm.Script(source.slice(start, end)).runInNewContext({ socket, roomHistoryGeneration: 0,
        limitRaterChatRoom: async () => true, setTimeout: schedule, console: { error: jest.fn() }, Promise, Number });
    const result = await new Promise(resolve => handler('room', { requestId: 1 }, resolve));
    expect(result.ok).toBe(false);
    expect(socket.join).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
});
