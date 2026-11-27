"use strict";

jest.mock('../modules/db/connector.js', () => ({
    mongoose: { connection: { readyState: 1 } },
    checkHealth: () => ({ isConnected: true }),
    connect: async () => {},
    waitForConnection: async () => {}
}));

const mockSort = jest.fn().mockResolvedValue([]);
const mockFind = jest.fn(() => ({ sort: mockSort }));

jest.mock('../modules/db/schema.js', () => ({
    chatRoom: { find: mockFind }
}));

const records = require('../modules/db/records.js');
const { setImmediate: nextTurn } = require('node:timers/promises');

describe('chatRoomGet query guard', () => {
    beforeEach(() => {
        mockFind.mockClear();
        mockSort.mockClear();
    });

    test('rejects operator objects instead of querying MongoDB', async () => {
        const result = await records.chatRoomGet({ $ne: '' });
        expect(result).toEqual([]);
        expect(mockFind).not.toHaveBeenCalled();
    });

    test('rejects empty and overlong room names', async () => {
        expect(await records.chatRoomGet('   ')).toEqual([]);
        expect(await records.chatRoomGet('a'.repeat(51))).toEqual([]);
        expect(mockFind).not.toHaveBeenCalled();
    });

    test('queries with a trimmed string room name', async () => {
        const result = await records.chatRoomGet('  公共房間  ');
        expect(result).toEqual([]);
        expect(mockFind).toHaveBeenCalledWith({ roomNumber: '公共房間' });
    });

    test('propagates database failures rather than reporting an empty room', async () => {
        mockSort.mockRejectedValueOnce(new Error('database unavailable'));
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            await expect(records.chatRoomGet('error-test-room')).rejects.toThrow('database unavailable');
        } finally {
            spy.mockRestore();
        }
    });
});

test('retention failure does not report an already saved message as unsent', async () => {
    const oldModel = records.ChatRoomModel;
    const save = jest.fn().mockResolvedValue();
    const Model = jest.fn().mockImplementation(() => ({ save, _id: 'test-id' }));
    Model.countDocuments = jest.fn().mockRejectedValue(new Error('retention unavailable'));
    records.ChatRoomModel = Model;
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onMessage = jest.fn();
    records.on('new_message', onMessage);
    try {
        await expect(records.chatRoomPush({ name: 'Tester', msg: 'hello', roomNumber: 'test-room' })).resolves.toMatchObject({ _id: 'test-id' });
        expect(save).toHaveBeenCalledTimes(1);
        expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ _id: 'test-id' }));
        await nextTurn();
        expect(spy).toHaveBeenCalledWith('[Records] Chat room retention failed:', 'retention unavailable');
    } finally {
        records.ChatRoomModel = oldModel;
        records.off('new_message', onMessage);
        spy.mockRestore();
    }
});

test('saved messages finish before retention and pending cleanup is coalesced by room', async () => {
    const oldModel = records.ChatRoomModel;
    const pendingCount = Promise.withResolvers();
    const save = jest.fn().mockResolvedValue();
    const Model = jest.fn(() => ({ save, _id: 'test-id' }));
    Model.countDocuments = jest.fn().mockReturnValueOnce(pendingCount.promise).mockResolvedValue(0);
    records.ChatRoomModel = Model;
    const onMessage = jest.fn();
    records.on('new_message', onMessage);
    const message = { name: 'Tester', msg: 'hello', roomNumber: 'test-room' };
    const firstWrite = records.chatRoomPush(message);
    try {
        await expect(Promise.race([firstWrite, nextTurn().then(() => null)])).resolves.toMatchObject({ _id: 'test-id' });
        expect(onMessage).toHaveBeenCalledTimes(1);
        await Promise.all([
            records.chatRoomPush(message), records.chatRoomPush(message),
            records.chatRoomPush({ ...message, roomNumber: 'other-room' }),
        ]);
        expect(save).toHaveBeenCalledTimes(4);
        expect(Model.countDocuments).toHaveBeenCalledTimes(1);
        pendingCount.resolve(0);
        await nextTurn();
        expect(Model.countDocuments.mock.calls).toEqual([
            [{ roomNumber: 'test-room' }], [{ roomNumber: 'test-room' }], [{ roomNumber: 'other-room' }],
        ]);
    } finally {
        pendingCount.resolve(0);
        await firstWrite;
        await nextTurn();
        records.ChatRoomModel = oldModel;
        records.off('new_message', onMessage);
    }
});
