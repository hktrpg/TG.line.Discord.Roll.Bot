"use strict";

const EventEmitter = require('events');

// Create mock EventEmitter instance
const mockConnectionEmitter = new EventEmitter();

// Mock dependencies before requiring the module
jest.mock('../modules/db-connector.js', () => ({
    mongoose: {
        connection: {
            readyState: 1,
            db: {
                admin: () => ({
                    ping: jest.fn().mockResolvedValue(true)
                })
            }
        }
    },
    connectionEmitter: mockConnectionEmitter
}));

jest.mock('../modules/schema.js', () => ({
    testCollection: {
        find: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
    },
    block: {
        find: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
    },
    trpgCommand: {
        find: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
    },
    trpgDarkRolling: {
        find: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
    },
    chatRoom: {
        find: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
    }
}));

const dbProtectionLayer = require('../modules/db-protection-layer.js');

describe('DBProtectionLayer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton state for testing
        dbProtectionLayer.isDegradedMode = false;
        dbProtectionLayer.memoryCache.clear();
        dbProtectionLayer.consecutiveFailures = 0;
        dbProtectionLayer.syncQueue = [];
        dbProtectionLayer.removeAllListeners();
    });

    afterEach(() => {
        dbProtectionLayer.removeAllListeners();
    });

    describe('Initialization', () => {
        test('should have correct default values', () => {
            expect(dbProtectionLayer.isDegradedMode).toBeDefined();
            expect(dbProtectionLayer.memoryCache).toBeInstanceOf(Map);
            expect(dbProtectionLayer.cacheTTL).toBe(5 * 60 * 1000); // 5 minutes
            expect(dbProtectionLayer.healthCheckInterval).toBe(30 * 1000); // 30 seconds
            expect(dbProtectionLayer.maxConsecutiveFailures).toBe(3);
        });
    });

    describe('performHealthCheck', () => {
        test('should handle healthy database', async () => {
            await dbProtectionLayer.performHealthCheck();
            expect(dbProtectionLayer.consecutiveFailures).toBe(0);
        });

        test('should enter degraded mode after consecutive failures', async () => {
            // Mock unhealthy database
            const { mongoose } = require('../modules/db-connector.js');
            mongoose.connection.readyState = 0;

            const enterSpy = jest.spyOn(dbProtectionLayer, 'enterDegradedMode');

            // Simulate 3 consecutive failures
            for (let i = 0; i < 3; i++) {
                await dbProtectionLayer.performHealthCheck();
            }

            expect(enterSpy).toHaveBeenCalled();
        });
    });

    describe('checkDBHealth', () => {
        test('should return false for unhealthy connection', async () => {
            const { mongoose } = require('../modules/db-connector.js');
            const originalState = mongoose.connection.readyState;
            mongoose.connection.readyState = 0;

            const result = await dbProtectionLayer.checkDBHealth();
            expect(result).toBe(false);

            // Restore original state
            mongoose.connection.readyState = originalState;
        });
    });

    describe('Degraded Mode', () => {
        test('enterDegradedMode should emit event when entering degraded mode', () => {
            const originalMode = dbProtectionLayer.isDegradedMode;
            const emitSpy = jest.spyOn(dbProtectionLayer, 'emit');

            if (!originalMode) {
                dbProtectionLayer.enterDegradedMode();

                expect(emitSpy).toHaveBeenCalledWith('degraded-mode-entered', expect.objectContaining({
                    timestamp: expect.any(Date),
                    reason: 'MongoDB connection failures'
                }));
            }
        });

        test('exitDegradedMode should work when DB is healthy', async () => {
            // Put the system in degraded mode first
            dbProtectionLayer.isDegradedMode = true;
            const emitSpy = jest.spyOn(dbProtectionLayer, 'emit');

            // Mock DB to be healthy
            const { mongoose } = require('../modules/db-connector.js');
            const originalReadyState = mongoose.connection.readyState;
            mongoose.connection.readyState = 1; // Connected

            await dbProtectionLayer.exitDegradedMode();

            // Should emit exit event since DB is healthy
            expect(emitSpy).toHaveBeenCalledWith('degraded-mode-exited', expect.any(Object));

            // Restore original state
            mongoose.connection.readyState = originalReadyState;
        });
    });

    describe('Safe Database Operations', () => {
        describe('safeFind', () => {
            test('should use database when not in degraded mode', async () => {
                // Ensure not in degraded mode
                dbProtectionLayer.isDegradedMode = false;

                const mockResults = [{ id: 1 }];
                const { testCollection } = require('../modules/schema.js');
                testCollection.find.mockResolvedValue(mockResults);

                const result = await dbProtectionLayer.safeFind('testCollection', { id: 1 });

                expect(testCollection.find).toHaveBeenCalledWith({ id: 1 }, {});
                expect(result).toEqual(mockResults);
            });

            test('should fallback to memory when in degraded mode', async () => {
                dbProtectionLayer.isDegradedMode = true;

                const result = await dbProtectionLayer.safeFind('testCollection', { id: 1 });

                expect(result).toEqual([]);
            });

            test('should fallback to memory when database operation fails', async () => {
                const { testCollection } = require('../modules/schema.js');
                testCollection.find.mockRejectedValue(new Error('DB Error'));

                const result = await dbProtectionLayer.safeFind('testCollection', { id: 1 });

                expect(result).toEqual([]);
                expect(dbProtectionLayer.consecutiveFailures).toBeGreaterThan(0);
            });
        });

        describe('safeCreate', () => {
            test('should use database when not in degraded mode', async () => {
                // Ensure not in degraded mode
                dbProtectionLayer.isDegradedMode = false;

                const mockData = { id: 1, name: 'test' };
                const mockResult = { ...mockData, _id: 'mockId' };
                const { testCollection } = require('../modules/schema.js');
                testCollection.create.mockResolvedValue(mockResult);

                const result = await dbProtectionLayer.safeCreate('testCollection', mockData);

                expect(testCollection.create).toHaveBeenCalledWith(mockData);
                expect(result).toEqual(mockResult);
            });

            test('should fallback to memory when in degraded mode', async () => {
                dbProtectionLayer.isDegradedMode = true;
                const mockData = { id: 1, name: 'test' };

                const result = await dbProtectionLayer.safeCreate('testCollection', mockData);

                expect(result).toEqual(mockData);
            });
        });

        describe('safeUpdate', () => {
            test('should use database when not in degraded mode', async () => {
                // Ensure not in degraded mode
                dbProtectionLayer.isDegradedMode = false;

                const query = { id: 1 };
                const update = { name: 'updated' };
                const mockResult = { acknowledged: true, modifiedCount: 1 };
                const { testCollection } = require('../modules/schema.js');
                testCollection.findOneAndUpdate.mockResolvedValue(mockResult);

                const result = await dbProtectionLayer.safeUpdate('testCollection', query, update);

                expect(testCollection.findOneAndUpdate).toHaveBeenCalledWith(query, update, {});
                expect(result).toEqual(mockResult);
            });

            test('should fallback to memory when in degraded mode', async () => {
                dbProtectionLayer.isDegradedMode = true;
                const query = { id: 1 };
                const update = { name: 'updated' };

                const result = await dbProtectionLayer.safeUpdate('testCollection', query, update);

                expect(result).toEqual({ acknowledged: true, modifiedCount: 1 });
            });
        });
    });

    describe('Memory Operations', () => {
        test('memoryFind should return cached result or default empty array', () => {
            const result = dbProtectionLayer.memoryFind('testCollection', { id: 1 });
            expect(result).toEqual([]);
        });

        test('memoryCreate should store data and add to sync queue', () => {
            const initialQueueLength = dbProtectionLayer.syncQueue ? dbProtectionLayer.syncQueue.length : 0;
            const mockData = { id: 1, name: 'test' };

            const result = dbProtectionLayer.memoryCreate('testCollection', mockData);

            expect(result).toEqual(mockData);
            expect(dbProtectionLayer.syncQueue).toHaveLength(initialQueueLength + 1);
            expect(dbProtectionLayer.syncQueue.at(-1)).toMatchObject({
                collectionName: 'testCollection',
                operation: 'create',
                data: mockData
            });
        });

        test('memoryUpdate should return mock result and add to sync queue', () => {
            const initialQueueLength = dbProtectionLayer.syncQueue ? dbProtectionLayer.syncQueue.length : 0;
            const query = { id: 1 };
            const update = { name: 'updated' };

            const result = dbProtectionLayer.memoryUpdate('testCollection', query, update);

            expect(result).toEqual({ acknowledged: true, modifiedCount: 1 });
            expect(dbProtectionLayer.syncQueue).toHaveLength(initialQueueLength + 1);
        });
    });

    describe('Cache Operations', () => {
        test('setCache should store data with timestamp', () => {
            const key = 'testKey';
            const data = { test: 'data' };

            dbProtectionLayer.setCache(key, data);

            const cached = dbProtectionLayer.memoryCache.get(key);
            expect(cached.data).toEqual(data);
            expect(cached.timestamp).toBeDefined();
            expect(cached.permanent).toBe(false);
        });

        test('setCache should support permanent flag', () => {
            const key = 'testKey';
            const data = { test: 'data' };

            dbProtectionLayer.setCache(key, data, true);

            const cached = dbProtectionLayer.memoryCache.get(key);
            expect(cached.permanent).toBe(true);
        });

        test('getFromCache should return null for non-existent key', () => {
            const result = dbProtectionLayer.getFromCache('nonExistentKey');
            expect(result).toBeNull();
        });

        test('getFromCache should return cached data within TTL', () => {
            const key = 'testKey';
            const data = { test: 'data' };
            dbProtectionLayer.setCache(key, data);

            const result = dbProtectionLayer.getFromCache(key);
            expect(result).toEqual(data);
        });

        test('getFromCache should handle permanent cache correctly', () => {
            const key = 'permanentKey';
            const data = { test: 'permanent' };
            dbProtectionLayer.setCache(key, data, true);

            const result = dbProtectionLayer.getFromCache(key);
            expect(result).toEqual(data);
        });
    });

    describe('Sync Operations', () => {
        test('syncMemoryCacheToDB should process sync queue', async () => {
            // Ensure not in degraded mode so sync can work
            dbProtectionLayer.isDegradedMode = false;

            // Add items to sync queue
            dbProtectionLayer.addToSyncQueue('testCollection', 'create', { id: 1 });
            dbProtectionLayer.addToSyncQueue('testCollection', 'update', {
                query: { id: 1 },
                update: { name: 'updated' },
                options: {}
            });

            const { testCollection } = require('../modules/schema.js');
            testCollection.create.mockResolvedValue({ id: 1 });
            testCollection.findOneAndUpdate.mockResolvedValue({ acknowledged: true });

            await dbProtectionLayer.syncMemoryCacheToDB();

            expect(testCollection.create).toHaveBeenCalledWith({ id: 1 });
            expect(testCollection.findOneAndUpdate).toHaveBeenCalled();
            expect(dbProtectionLayer.syncQueue).toHaveLength(0);
        });
    });

    describe('getStatusReport', () => {
        test('should return comprehensive status report', () => {
            const report = dbProtectionLayer.getStatusReport();

            expect(report).toHaveProperty('isDegradedMode');
            expect(report).toHaveProperty('consecutiveFailures');
            expect(report).toHaveProperty('lastHealthCheck');
            expect(report).toHaveProperty('cacheSize');
            expect(report).toHaveProperty('pendingSyncOperations');
            expect(report).toHaveProperty('dbConnectionState');
        });
    });
});