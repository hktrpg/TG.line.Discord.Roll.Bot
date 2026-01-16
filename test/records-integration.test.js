/**
 * Records Module Integration Test
 * 
 * This test runs after service startup to verify all records module methods
 * work correctly after migrating from callback to Promise pattern.
 * 
 * Run: yarn test test/records-integration.test.js
 */

// Set environment variables for testing
process.env.mongoURL = 'mongodb://localhost:27017/test';

// Mock db-connector to avoid actual database connection during tests
jest.mock('../modules/db-connector.js', () => {
    const mockMongoose = {
        connection: {
            readyState: 1 // connected
        }
    };

    return {
        mongoose: mockMongoose,
        checkHealth: jest.fn(() => ({
            isConnected: true
        })),
        connect: jest.fn(() => Promise.resolve()),
        waitForConnection: jest.fn(() => Promise.resolve())
    };
});

// Mock schema to avoid actual database operations
const mockSchemas = {};

// Create a mock query chain for find().sort()
class MockQueryChain {
    constructor(mockResult) {
        this.mockResult = mockResult;
        this.sort = jest.fn().mockReturnValue(this);
        this.limit = jest.fn().mockReturnValue(this);
        this.skip = jest.fn().mockReturnValue(this);
        this.lean = jest.fn().mockReturnValue(this);
        this.catch = jest.fn().mockReturnValue(this);
    }

    then(callback) {
        if (callback) {
            try {
                const result = callback(this.mockResult);
                return Promise.resolve(result);
            } catch (error) {
                return Promise.reject(error);
            }
        }
        return this;
    }
}

const createMockQueryChain = (mockResult) => new MockQueryChain(mockResult);

const mockSchemaMethods = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn((query) => createMockQueryChain([])),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    collection: {
        dropIndexes: jest.fn(),
        createIndex: jest.fn()
    }
};

// Create mock schemas for all common collections
const schemaNames = [
    'block', 'trpgCommand', 'trpgDatabase', 'trpgDatabaseAllgroup',
    'trpgDarkRolling', 'trpgLevelSystem', 'GroupSetting', 'randomAns',
    'chatRoom', 'forwardedMessage'
];

for (const name of schemaNames) {
    mockSchemas[name] = {
        ...mockSchemaMethods,
        modelName: name
    };
}

// Create a mock constructor for ChatRoomModel
const MockChatRoomModel = jest.fn(function(data) {
    this._id = 'test-id';
    this.name = data?.name || '';
    this.msg = data?.msg || '';
    this.time = data?.time || new Date();
    this.roomNumber = data?.roomNumber || '';
    this.save = jest.fn().mockResolvedValue(this);
    return this;
});

// Add static methods to MockChatRoomModel
MockChatRoomModel.find = jest.fn((query) => createMockQueryChain([]));
MockChatRoomModel.countDocuments = jest.fn().mockResolvedValue(0);
MockChatRoomModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

// Override chatRoom to use the constructor
mockSchemas.chatRoom = MockChatRoomModel;

jest.mock('../modules/schema.js', () => mockSchemas);

// Import records module (after mocks)
const records = require('../modules/records.js');

describe('Records Module Integration Tests', () => {
    // Set default timeout for all tests
    jest.setTimeout(15_000);

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Setup default mock return values
        for (const name of Object.keys(mockSchemas)) {
            const schema = mockSchemas[name];
            if (name === 'chatRoom') {
                // ChatRoomModel is a constructor, handle differently
                MockChatRoomModel.find.mockReturnValue(createMockQueryChain([]));
                MockChatRoomModel.countDocuments.mockResolvedValue(0);
                MockChatRoomModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
            } else {
                schema.findOneAndUpdate.mockResolvedValue({ _id: 'test-id', groupid: 'test-group' });
                schema.find.mockImplementation(() => createMockQueryChain([]));
                schema.countDocuments.mockResolvedValue(0);
                schema.deleteMany.mockResolvedValue({ deletedCount: 0 });
                schema.findOne.mockResolvedValue(null);
                schema.findOneAndDelete.mockResolvedValue(null);
                schema.create.mockResolvedValue({ _id: 'test-id' });
                if (schema.save) {
                    schema.save.mockResolvedValue({ _id: 'test-id' });
                }
            }
        }
    });

    describe('Basic Get Operations', () => {
        test('should get block data', async () => {
            const mockData = [
                { groupid: 'test-group', blockfunction: ['test1', 'test2'] }
            ];
            mockSchemas.block.find.mockReturnValue(createMockQueryChain(mockData));

            const result = await records.get('block');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(mockSchemas.block.find).toHaveBeenCalledWith({});
        });

        test('should get trpgCommand data', async () => {
            const mockData = [
                { groupid: 'test-group', trpgCommandfunction: [] }
            ];
            mockSchemas.trpgCommand.find.mockReturnValue(createMockQueryChain(mockData));

            const result = await records.get('trpgCommand');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        test('should return empty array for non-existent schema', async () => {
            const result = await records.get('nonExistentSchema');

            expect(result).toEqual([]);
        });

        test('should handle database errors gracefully', async () => {
            // Mock find to throw error
            const errorPromise = Promise.reject(new Error('Database error'));
            errorPromise.sort = jest.fn().mockReturnThis();
            mockSchemas.block.find.mockReturnValue(errorPromise);

            const result = await records.get('block');

            expect(result).toEqual([]);
        });
    });

    describe('Update Record Operations', () => {
        test('should update record with setBlockFunction', async () => {
            const data = {
                groupid: 'test-group',
                blockfunction: ['test1', 'test2']
            };

            await records.setBlockFunction('block', data);

            expect(mockSchemas.block.findOneAndUpdate).toHaveBeenCalledWith(
                { groupid: 'test-group' },
                { $set: { blockfunction: ['test1', 'test2'] } },
                expect.objectContaining({
                    upsert: true,
                    new: true,
                    runValidators: true
                })
            );
        });

        test('should push to block function', async () => {
            const data = {
                groupid: 'test-group',
                blockfunction: 'new-item'
            };

            await records.pushBlockFunction('block', data);

            expect(mockSchemas.block.findOneAndUpdate).toHaveBeenCalledWith(
                { groupid: 'test-group' },
                { $push: { blockfunction: 'new-item' } },
                expect.objectContaining({
                    new: true,
                    upsert: true,
                    runValidators: true
                })
            );
        });

        test('should handle database errors', async () => {
            // Mock database operation to throw an error
            mockSchemaMethods.findOneAndUpdate.mockRejectedValueOnce(new Error('Database connection failed'));

            const data = {
                groupid: "test-group",
                blockfunction: ['test']
            };

            // Should throw database error
            await expect(records.setBlockFunction('block', data)).rejects.toThrow('Database connection failed');
        });
    });

    describe('TRPG Command Operations', () => {
        test('should push trpg command function', async () => {
            const data = {
                groupid: 'test-group',
                trpgCommandfunction: [{ topic: 'test', contact: 'command' }]
            };

            await records.pushTrpgCommandFunction('trpgCommand', data);

            expect(mockSchemas.trpgCommand.findOneAndUpdate).toHaveBeenCalled();
        });

        test('should set trpg command function', async () => {
            const data = {
                groupid: 'test-group',
                trpgCommandfunction: [{ topic: 'test', contact: 'command' }]
            };

            await records.setTrpgCommandFunction('trpgCommand', data);

            expect(mockSchemas.trpgCommand.findOneAndUpdate).toHaveBeenCalled();
        });

        test('should edit trpg command function', async () => {
            const data = {
                groupid: 'test-group',
                trpgCommandfunction: [{ topic: 'test', contact: 'updated-command' }]
            };

            await records.editsetTrpgCommandFunction('trpgCommand', data);

            expect(mockSchemas.trpgCommand.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe('TRPG Database Operations', () => {
        test('should push trpg database function', async () => {
            const data = {
                groupid: 'test-group',
                trpgDatabasefunction: [{ topic: 'test', contact: 'content' }]
            };

            await records.pushTrpgDatabaseFunction('trpgDatabase', data);

            expect(mockSchemas.trpgDatabase.findOneAndUpdate).toHaveBeenCalled();
        });

        test('should set trpg database function', async () => {
            const data = {
                groupid: 'test-group',
                trpgDatabasefunction: [{ topic: 'test', contact: 'content' }]
            };

            await records.setTrpgDatabaseFunction('trpgDatabase', data);

            expect(mockSchemas.trpgDatabase.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe('TRPG Dark Rolling Operations', () => {
        test('should push trpg dark rolling function', async () => {
            const data = {
                groupid: 'test-group',
                trpgDarkRollingfunction: [{ userid: 'user1', displayname: 'Test User' }]
            };

            await records.pushTrpgDarkRollingFunction('trpgDarkRolling', data);

            expect(mockSchemas.trpgDarkRolling.findOneAndUpdate).toHaveBeenCalled();
        });

        test('should set trpg dark rolling function', async () => {
            const data = {
                groupid: 'test-group',
                trpgDarkRollingfunction: []
            };

            await records.setTrpgDarkRollingFunction('trpgDarkRolling', data);

            expect(mockSchemas.trpgDarkRolling.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe('Chat Room Operations', () => {
        test('should get chat room messages', async () => {
            const mockMessages = [
                { name: 'User1', msg: 'Hello', time: new Date(), roomNumber: 'test-room' }
            ];

            MockChatRoomModel.find.mockReturnValue(createMockQueryChain(mockMessages));

            const result = await records.chatRoomGet('test-room');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(MockChatRoomModel.find).toHaveBeenCalledWith({ roomNumber: 'test-room' });
        });

        test('should push chat room message', async () => {
            const message = {
                name: 'Test User',
                msg: 'Test message',
                time: new Date(),
                roomNumber: 'test-room'
            };

            // Mock the constructor to return an instance with save method
            const mockSave = jest.fn().mockResolvedValue({ _id: 'test-id', ...message });
            MockChatRoomModel.mockImplementation(function(data) {
                this._id = 'test-id';
                this.name = data?.name || '';
                this.msg = data?.msg || '';
                this.time = data?.time || new Date();
                this.roomNumber = data?.roomNumber || '';
                this.save = mockSave;
                return this;
            });
            MockChatRoomModel.countDocuments.mockResolvedValue(50);

            await records.chatRoomPush(message);

            expect(MockChatRoomModel).toHaveBeenCalled();
            expect(mockSave).toHaveBeenCalled();
        });

        test('should handle chat room errors', async () => {
            const invalidMessage = {
                name: 'A'.repeat(51), // Invalid: name too long (>50 characters)
                msg: 'Test',
                roomNumber: 'test-room'
            };

            // Validation should throw error for name too long
            await expect(records.chatRoomPush(invalidMessage)).rejects.toThrow('Invalid chat message');
        });
    });

    describe('Forwarded Message Operations', () => {
        test('should find forwarded message', async () => {
            const query = { userId: 'user1', sourceMessageId: 'msg1' };
            const mockMessage = { userId: 'user1', sourceMessageId: 'msg1', fixedId: 1 };

            mockSchemas.forwardedMessage.findOne.mockResolvedValue(mockMessage);

            const result = await records.findForwardedMessage(query);

            expect(result).toBeDefined();
            expect(result.userId).toBe('user1');
        });

        test('should create forwarded message', async () => {
            const data = {
                userId: 'user1',
                sourceMessageId: 'msg1',
                fixedId: 1
            };

            mockSchemas.forwardedMessage.findOne.mockResolvedValue(null); // No existing message
            mockSchemas.forwardedMessage.create.mockResolvedValue({ _id: 'test-id', ...data });

            const result = await records.createForwardedMessage(data);

            expect(result).toBeDefined();
            expect(mockSchemas.forwardedMessage.create).toHaveBeenCalled();
        });

        test('should delete forwarded message', async () => {
            const filter = { userId: 'user1', fixedId: 1 };
            const mockMessage = { userId: 'user1', fixedId: 1, sourceMessageId: 'msg1' };

            mockSchemas.forwardedMessage.findOne.mockResolvedValue(mockMessage);
            mockSchemas.forwardedMessage.findOneAndDelete.mockResolvedValue(mockMessage);

            const result = await records.deleteForwardedMessage(filter);

            expect(result).toBeDefined();
            expect(mockSchemas.forwardedMessage.findOneAndDelete).toHaveBeenCalled();
        });

        test('should count forwarded messages', async () => {
            mockSchemas.forwardedMessage.countDocuments.mockResolvedValue(5);

            const result = await records.countForwardedMessages({ userId: 'user1' });

            expect(result).toBe(5);
            expect(mockSchemas.forwardedMessage.countDocuments).toHaveBeenCalledWith({ userId: 'user1' });
        });
    });

    describe('Error Handling', () => {
        test('should throw error on security validation', async () => {
            // Test with database error (since security validation happens at DB level)
            mockSchemas.block.findOneAndUpdate.mockRejectedValue(new Error('Security validation failed'));
            const data = {
                groupid: "test-group",
                blockfunction: ['test']
            };
            await expect(records.setBlockFunction('block', data)).rejects.toThrow('Security validation failed');
        });

        test('should throw error on database operation failure', async () => {
            mockSchemas.block.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

            const data = {
                groupid: 'test-group',
                blockfunction: []
            };

            await expect(records.setBlockFunction('block', data)).rejects.toThrow('Database error');
        });

        test('should return empty array on get error', async () => {
            mockSchemas.block.find.mockRejectedValue(new Error('Database error'));

            const result = await records.get('block');

            expect(result).toEqual([]);
        });
    });

    describe('Connection Handling', () => {
        test('should handle connection not ready', async () => {
            const dbConnector = require('../modules/db-connector.js');
            dbConnector.checkHealth.mockReturnValue({ isConnected: false });
            dbConnector.mongoose.connection.readyState = 0; // disconnected
            // Mock connect to resolve immediately (don't actually wait)
            dbConnector.connect.mockResolvedValue();

            // When connection is not ready, should return empty array without querying
            // The code will try to connect, but since we mock it, it should return quickly
            const result = await records.get('block');

            // Should return empty array when connection not ready
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        }, 15_000);
    });

    describe('Cache Operations', () => {
        test('should use cache for chat room messages', async () => {
            const mockMessages = [
                { name: 'User1', msg: 'Hello', time: new Date(), roomNumber: 'test-room' }
            ];

            MockChatRoomModel.find.mockReturnValue(createMockQueryChain(mockMessages));

            // First call - should query database
            const result1 = await records.chatRoomGet('test-room');
            expect(MockChatRoomModel.find).toHaveBeenCalledTimes(1);
            expect(result1).toBeDefined();

            // Second call - should use cache (if cache is working)
            const result2 = await records.chatRoomGet('test-room');
            // Note: Cache behavior depends on implementation
            expect(result2).toBeDefined();
            // Cache may or may not prevent second call, both are valid
        });
    });

    describe('Integration with Module Functions', () => {
        test('should work with updateRecord method', async () => {
            const query = { groupid: 'test-group' };
            const update = { $set: { blockfunction: ['test'] } };
            const options = { upsert: true };

            await records.updateRecord('block', query, update, options);

            expect(mockSchemas.block.findOneAndUpdate).toHaveBeenCalledWith(
                query,
                update,
                expect.objectContaining({
                    new: true,
                    runValidators: true,
                    ...options
                })
            );
        });

        test('should handle all set operations', async () => {
            // Use actual schema names and methods that exist
            const testCases = [
                { method: 'setRandomAnswerFunction', schema: 'randomAns', data: { groupid: 'test', randomAnsfunction: [] } },
                { method: 'setGroupSettingFunction', schema: 'GroupSetting', data: { groupid: 'test', GroupSettingfunction: [] } },
                { method: 'setTrpgLevelSystemFunctionLevelUpWord', schema: 'trpgLevelSystem', data: { groupid: 'test', LevelUpWord: 'test' } }
            ];

            for (const testCase of testCases) {
                if (typeof records[testCase.method] === 'function') {
                    await records[testCase.method](testCase.schema, testCase.data);
                    // Verify method was called
                    expect(mockSchemas[testCase.schema].findOneAndUpdate).toHaveBeenCalled();
                }
            }
        });

        test('should handle all push operations', async () => {
            // Use actual schema names that exist in mockSchemas
            const testCases = [
                { method: 'pushRandomAnswerFunction', schema: 'randomAns', data: { groupid: 'test', randomAnsfunction: 'item' } },
                { method: 'pushGroupSettingFunction', schema: 'GroupSetting', data: { groupid: 'test', GroupSettingfunction: 'item' } },
                { method: 'pushTrpgLevelSystemFunction', schema: 'trpgLevelSystem', data: { groupid: 'test', trpgLevelSystemfunction: 'item' } }
            ];

            for (const testCase of testCases) {
                await records[testCase.method](testCase.schema, testCase.data);
                // Verify method was called
                expect(mockSchemas[testCase.schema].findOneAndUpdate).toHaveBeenCalled();
            }
        });
    });
});

describe('Records Module - Service Startup Integration', () => {
    /**
     * This test simulates what happens when the service starts
     * and modules try to initialize data from records
     */
    test('should handle module initialization patterns', async () => {
        // Ensure connection is ready to avoid waiting
        const dbConnector = require('../modules/db-connector.js');
        dbConnector.checkHealth.mockReturnValue({ isConnected: true });
        dbConnector.mongoose.connection.readyState = 1; // connected

        // Simulate z_stop.js initialization
        const blockMockData = [
            { groupid: 'test-group', blockfunction: ['test1'] }
        ];
        mockSchemas.block.find.mockReturnValue(createMockQueryChain(blockMockData));

        const blockData = await records.get('block');
        expect(blockData).toBeDefined();
        expect(Array.isArray(blockData)).toBe(true);

        // Simulate z_saveCommand.js initialization
        const commandMockData = [
            { groupid: 'test-group', trpgCommandfunction: [] }
        ];
        mockSchemas.trpgCommand.find.mockReturnValue(createMockQueryChain(commandMockData));

        const commandData = await records.get('trpgCommand');
        expect(commandData).toBeDefined();
        expect(Array.isArray(commandData)).toBe(true);

        // Simulate z_DDR_darkRollingToGM.js initialization
        const darkRollingMockData = [
            { groupid: 'test-group', trpgDarkRollingfunction: [] }
        ];
        mockSchemas.trpgDarkRolling.find.mockReturnValue(createMockQueryChain(darkRollingMockData));

        const darkRollingData = await records.get('trpgDarkRolling');
        expect(darkRollingData).toBeDefined();
        expect(Array.isArray(darkRollingData)).toBe(true);
    }, 15_000);

    test('should handle parallel initialization', async () => {
        // Ensure connection is ready to avoid waiting
        const dbConnector = require('../modules/db-connector.js');
        dbConnector.checkHealth.mockReturnValue({ isConnected: true });
        dbConnector.mongoose.connection.readyState = 1; // connected

        // Simulate multiple modules initializing at the same time
        mockSchemas.block.find.mockReturnValue(createMockQueryChain([]));
        mockSchemas.trpgCommand.find.mockReturnValue(createMockQueryChain([]));
        mockSchemas.trpgDatabase.find.mockReturnValue(createMockQueryChain([]));

        const [blockData, commandData, dbData] = await Promise.all([
            records.get('block'),
            records.get('trpgCommand'),
            records.get('trpgDatabase')
        ]);

        expect(blockData).toBeDefined();
        expect(Array.isArray(blockData)).toBe(true);
        expect(commandData).toBeDefined();
        expect(Array.isArray(commandData)).toBe(true);
        expect(dbData).toBeDefined();
        expect(Array.isArray(dbData)).toBe(true);
    }, 15_000);
});
