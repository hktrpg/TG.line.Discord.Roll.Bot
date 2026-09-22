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
});
