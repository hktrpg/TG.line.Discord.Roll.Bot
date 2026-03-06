/**
 * Records Module Integration Test (Improved)
 * 
 * This test uses a real in-memory MongoDB server to verify all records module methods.
 * It ensures that database operations correctly handle actual schemas and strict mode.
 * 
 * Run: yarn jest test/records-integration.test.js
 */

// Set environment variables BEFORE any imports
process.env.mongoURL = 'mongodb://localhost:27017/test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock db-connector to use our in-memory mongoose instance
jest.mock('../modules/db-connector.js', () => {
    const mongooseInside = require('mongoose');
    return {
        mongoose: mongooseInside,
        checkHealth: jest.fn(() => ({ isConnected: true })),
        connect: jest.fn(() => Promise.resolve()),
        waitForConnection: jest.fn(() => Promise.resolve())
    };
});

// Import real schema and records module AFTER the mock
const schema = require('../modules/schema.js');
const records = require('../modules/records.js');

describe('Records Module Real Integration Tests', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Connect to the in-memory database
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
        // Clear all collections between tests
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    describe('Block Function Operations', () => {
        test('should push and get block data', async () => {
            const data = {
                groupid: 'test-group',
                blockfunction: ['user1', 'user2']
            };

            await records.pushBlockFunction('block', data);
            
            const result = await records.get('block');
            expect(result.length).toBe(1);
            expect(result[0].groupid).toBe('test-group');
            // Depending on implementation, blockfunction might be pushed as an array or element
            // In records.js: $push: { blockfunction: data.blockfunction }
            expect(result[0].blockfunction[0]).toContain('user1');
        });
    });

    describe('Random Answer Operations', () => {
        test('should push and set random answer function', async () => {
            const data = {
                groupid: 'test-group',
                randomAnsfunction: ['Dice1', 'Option1', 'Option2']
            };

            await records.pushRandomAnswerFunction('randomAns', data);
            let result = await records.get('randomAns');
            expect(result[0].randomAnsfunction[0]).toContain('Dice1');

            // Test set (overwrite)
            const newData = {
                groupid: 'test-group',
                randomAnsfunction: ['NewDice']
            };
            await records.setRandomAnswerFunction('randomAns', newData);
            result = await records.get('randomAns');
            expect(result[0].randomAnsfunction).toEqual(['NewDice']);
        });

        test('should handle Global Random Answer (randomAnsAllgroup)', async () => {
            const data = {
                randomAnsAllgroup: ['GlobalOption']
            };

            await records.pushRandomAnswerAllGroup('randomAnsAllgroup', data);
            const result = await records.get('randomAnsAllgroup');
            expect(result.length).toBe(1);
            // pushRandomAnswerAllGroup in records.js pushes the whole array, creating a nested array
            expect(result[0].randomAnsAllgroup[0]).toContain('GlobalOption');
        });
    });

    describe('TRPG Database Operations', () => {
        test('should push group specific database entries', async () => {
            const data = {
                groupid: 'group1',
                trpgDatabasefunction: [{ topic: 'Sword', contact: 'Sharp' }]
            };

            await records.pushTrpgDatabaseFunction('trpgDatabase', data);
            const result = await records.get('trpgDatabase');
            expect(result[0].groupid).toBe('group1');
            expect(result[0].trpgDatabasefunction[0].topic).toBe('Sword');
        });

        test('should push GLOBAL database entries (Verified Fix)', async () => {
            const data = {
                trpgDatabaseAllgroup: [{ topic: 'World', contact: 'Large' }]
            };

            // This is what failed before with StrictModeError
            await expect(records.pushTrpgDatabaseAllGroup('trpgDatabaseAllgroup', data))
                .resolves.toBeDefined();
            
            const result = await records.get('trpgDatabaseAllgroup');
            expect(result.length).toBe(1);
            expect(result[0].trpgDatabaseAllgroup[0].topic).toBe('World');
        });
    });

    describe('Group Setting Operations (Verified Fix)', () => {
        test('should push group setting function', async () => {
            const data = {
                groupid: 'test-group',
                GroupSettingfunction: ['setting1']
            };

            await expect(records.pushGroupSettingFunction('GroupSetting', data))
                .resolves.toBeDefined();
            
            const result = await records.get('GroupSetting');
            expect(result[0].GroupSettingfunction[0]).toContain('setting1');
        });
    });

    describe('TRPG Level System', () => {
        test('should set level system config', async () => {
            const data = {
                groupid: 'test-group',
                Switch: '1',
                Hidden: '0'
            };

            await records.setTrpgLevelSystemFunctionConfig('trpgLevelSystem', data);
            const result = await records.get('trpgLevelSystem');
            expect(result[0].Switch).toBe('1');
            expect(result[0].Hidden).toBe('0');
        });
    });

    describe('Error Handling and Security', () => {
        test('should throw error when databaseName is invalid', async () => {
            const data = { groupid: 'test' };
            await expect(records.pushBlockFunction('invalidSchema', data))
                .rejects.toThrow();
        });

        test('should block suspicious query objects with invalid groupId types', async () => {
            // This tests the InputValidator integration in updateRecord
            const suspiciousData = {
                groupid: { $ne: null }, // Potential injection, but invalid type
                blockfunction: ['test']
            };
            
            // InputValidator should throw because groupid is not a string
            await expect(records.pushBlockFunction('block', suspiciousData))
                .rejects.toThrow('Invalid groupId type');
        });
    });
});
