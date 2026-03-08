/**
 * Strict Mode and Schema Validation Tests
 * 
 * This test verifies that database operations correctly handle schemas,
 * especially focusing on "Strict Mode" errors where fields not in the schema
 * are used in queries or updates.
 */

// Set this BEFORE requiring any modules that check for it at top level
process.env.mongoURL = 'mongodb://localhost:27017/test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// We need to use the real records module but with a real database
// However, records.js imports db-connector which might try to connect to a real DB
// So we mock db-connector to use our in-memory DB
jest.mock('../modules/db-connector.js', () => {
    // Inside jest.mock factory, we must require dependencies locally or they must be prefixed with 'mock'
    const mongooseInside = require('mongoose');
    return {
        mongoose: mongooseInside,
        checkHealth: jest.fn(() => ({ isConnected: true })),
        connect: jest.fn(() => Promise.resolve()),
        waitForConnection: jest.fn(() => Promise.resolve())
    };
});

// Import these AFTER the mock and AFTER setting process.env.mongoURL
const schema = require('../modules/schema.js');
const records = require('../modules/records.js');

describe('Database Strict Mode Tests', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        // Ensure mongoose is connected to the in-memory server
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear collections
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    describe('trpgDatabaseAllgroup (Global Schema)', () => {
        test('should NOT throw StrictModeError when pushing to trpgDatabaseAllgroup', async () => {
            const data = {
                trpgDatabaseAllgroup: [{
                    topic: 'Test Topic',
                    contact: 'Test Content'
                }]
            };

            // This should now work correctly after the fix
            await expect(records.pushTrpgDatabaseAllGroup('trpgDatabaseAllgroup', data))
                .resolves.toBeDefined();
            
            // Verify data was saved
            const saved = await records.get('trpgDatabaseAllgroup');
            expect(saved.length).toBe(1);
            expect(saved[0].trpgDatabaseAllgroup[0].topic).toBe('Test Topic');
        });

        test('should correctly handle multiple pushes to the same global document', async () => {
            const data1 = {
                trpgDatabaseAllgroup: [{
                    topic: 'Topic 1',
                    contact: 'Content 1'
                }]
            };
            const data2 = {
                trpgDatabaseAllgroup: [{
                    topic: 'Topic 2',
                    contact: 'Content 2'
                }]
            };

            await records.pushTrpgDatabaseAllGroup('trpgDatabaseAllgroup', data1);
            await records.pushTrpgDatabaseAllGroup('trpgDatabaseAllgroup', data2);
            
            const saved = await records.get('trpgDatabaseAllgroup');
            expect(saved.length).toBe(1); // Only one global document
            expect(saved[0].trpgDatabaseAllgroup.length).toBe(2);
        });
    });

    describe('randomAnsAllgroup (Global Schema)', () => {
        test('should NOT throw StrictModeError when pushing to randomAnsAllgroup', async () => {
            const data = {
                randomAnsAllgroup: ['Option 1', 'Option 2']
            };

            await expect(records.pushRandomAnswerAllGroup('randomAnsAllgroup', data))
                .resolves.toBeDefined();
            
            const saved = await records.get('randomAnsAllgroup');
            expect(saved.length).toBe(1);
        });
    });

    describe('GroupSetting (Mixed Schema)', () => {
        test('should NOT throw StrictModeError when using GroupSettingfunction', async () => {
            const data = {
                groupid: 'test-group',
                GroupSettingfunction: ['setting1']
            };

            // This should work now as we added GroupSettingfunction to the schema
            await expect(records.pushGroupSettingFunction('GroupSetting', data))
                .resolves.toBeDefined();
            
            const saved = await records.get('GroupSetting');
            expect(saved.length).toBe(1);
            expect(saved[0].groupid).toBe('test-group');
            // $push: { GroupSettingfunction: data.GroupSettingfunction } 
            // where data.GroupSettingfunction is ['setting1']
            // results in GroupSettingfunction being [['setting1']]
            expect(saved[0].GroupSettingfunction[0]).toContain('setting1');
        });
    });

    describe('Schema Strictness Verification', () => {
        test('Mongoose should throw StrictModeError if we manually add an invalid field in a query during upsert', async () => {
            const Model = schema.trpgDatabaseAllgroup;
            
            // This replicates the error we had:
            // Path "groupid" is not in schema, strict mode is `true`, and upsert is `true`.
            try {
                await Model.findOneAndUpdate(
                    { groupid: 'some-id' }, // invalid field for this schema
                    { $push: { trpgDatabaseAllgroup: { topic: 't', contact: 'c' } } },
                    { upsert: true, runValidators: true }
                );
                throw new Error('Should have thrown StrictModeError');
            } catch (error) {
                expect(error.name).toBe('StrictModeError');
                expect(error.path).toBe('groupid');
            }
        });
    });
});
