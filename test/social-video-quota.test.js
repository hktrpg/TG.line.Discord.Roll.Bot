'use strict';

const { acquireVideoLease, reserveVideoQuota } = require('../modules/chat/social-video-quota');
const { mongoose } = require('../modules/db/connector');

jest.mock('../modules/db/connector', () => ({
    mongoose: { connection: { readyState: 1, db: { collection: jest.fn() } } },
}));

const time = Date.parse('2026-11-25T15:59:30Z');
const personal = { platform: 'Discord', scope: 'user', id: '456', userId: '456' };
const group = { ...personal, scope: 'group', id: '123' };
let collection;

beforeEach(() => {
    collection = {
        findOne: jest.fn().mockResolvedValue(null),
        createIndex: jest.fn().mockResolvedValue('expiresAt_1'),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };
    mongoose.connection.db.collection.mockReturnValue(collection);
});

test('shares one lease and releases only the token held by the caller', async () => {
    const lease = await acquireVideoLease();
    const [query, update, options] = collection.updateOne.mock.calls[0];
    expect(query).toEqual({ _id: 'active-job', expiresAt: { $lte: expect.any(Date) } });
    expect(options.upsert).toBe(true);
    await lease.release();
    expect(collection.deleteOne).toHaveBeenCalledWith(
        { _id: 'active-job', token: update.$set.token }, expect.anything(),
    );
    collection.updateOne.mockRejectedValueOnce(Object.assign(new Error('Lease exists'), { code: 11_000 }));
    await expect(acquireVideoLease()).resolves.toBeNull();
});

test.each([
    [personal, { used: 20 }, 'quota'],
    [personal, { attempts: 40 }, 'quota'],
    [personal, { last: time - 29_999 }, 'cooldown'],
    [group, { used: 60 }, 'quota'],
    [group, { attempts: 120 }, 'quota'],
    [group, { last: time - 14_999 }, 'cooldown'],
    [group, { members: { 456: { used: 10 } } }, 'quota'],
    [group, { members: { 456: { attempts: 20 } } }, 'quota'],
    [group, { members: { 456: { last: time - 29_999 } } }, 'cooldown'],
])('enforces the quota and cooldown for %j with %j', async (recipient, row, reason) => {
    collection.findOne.mockResolvedValue(row);
    await expect(reserveVideoQuota({ collection }, recipient, time)).resolves.toEqual({ reason });
    expect(collection.updateOne).not.toHaveBeenCalled();
});

test('charges group and member, refunds only the upload and uses a new row at Hong Kong midnight', async () => {
    const reservation = await reserveVideoQuota({ collection }, group, time);
    const [query, charge] = collection.updateOne.mock.calls[0];
    expect(charge.$inc).toEqual({ used: 1, attempts: 1, 'members.456.used': 1, 'members.456.attempts': 1 });
    await reservation.refund();
    expect(collection.updateOne.mock.calls[1].slice(0, 2)).toEqual([query, { $inc: { used: -1, 'members.456.used': -1 } }]);
    await reserveVideoQuota({ collection }, group, time + 30_000);
    expect(collection.updateOne.mock.calls[2][0]._id).not.toBe(query._id);
});
