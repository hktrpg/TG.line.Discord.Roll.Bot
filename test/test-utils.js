/**
 * Test Utilities for HKTRPG
 *
 * Provides utilities for testing with or without MongoDB
 */

// const mongoose = require('mongoose'); // Unused, commented out

// Mock database for tests without MongoDB
class MockDatabase {
    constructor() {
        this.data = new Map();
        this.idCounter = 1;
    }

    generateId() {
        return this.idCounter++;
    }

    // Mock collection methods
    async find(query = {}) {
        const collection = [...this.data.values()];
        // Simple query filtering (can be extended)
        return collection.filter(item => {
            for (const [key, value] of Object.entries(query)) {
                if (item[key] !== value) return false;
            }
            return true;
        });
    }

    async findOne(query = {}) {
        const results = await this.find(query);
        return results.length > 0 ? results[0] : null;
    }

    async insertOne(doc) {
        const _id = this.generateId().toString();
        const document = { ...doc, _id };
        this.data.set(_id, document);
        return { acknowledged: true, insertedId: _id };
    }

    async updateOne(query, update) {
        const results = await this.find(query);
        if (results.length > 0) {
            const existing = results[0];
            const updated = { ...existing, ...update.$set };
            this.data.set(existing._id, updated);
            return { acknowledged: true, modifiedCount: 1 };
        }
        return { acknowledged: true, modifiedCount: 0 };
    }

    async deleteMany(query = {}) {
        const toDelete = await this.find(query);
        for (const item of toDelete) this.data.delete(item._id);
        return { acknowledged: true, deletedCount: toDelete.length };
    }

    async countDocuments(query = {}) {
        const results = await this.find(query);
        return results.length;
    }
}

// Test data factories
const TestDataFactory = {
    // Create test group data
    createGroupData(groupid = 'test-group', data = []) {
        return {
            groupid,
            trpgDatabasefunction: data
        };
    },

    // Create test user data
    createUserData(userid = 'test-user', data = {}) {
        return {
            userid,
            ...data
        };
    },

    // Create test character data
    createCharacterData(id = 'test-user', name = 'Test Character') {
        return {
            id,
            name,
            state: {},
            roll: {},
            notes: {}
        };
    },

    // Create test random answer data
    createRandomAnswerData(groupid = 'test-group', answers = []) {
        return {
            groupid,
            randomAnsfunction: answers.map((answer, index) => [index.toString(), ...answer])
        };
    }
};

// Enhanced mock setup
const createEnhancedMock = (schemaName, mockData = []) => {
    const mockDb = new MockDatabase();
    for (const data of mockData) mockDb.insertOne(data);

    return {
        findOne: jest.fn((query) => mockDb.findOne(query)),
        find: jest.fn((query) => mockDb.find(query)),
        updateOne: jest.fn((query, update) => mockDb.updateOne(query, update)),
        deleteMany: jest.fn((query) => mockDb.deleteMany(query)),
        countDocuments: jest.fn((query) => mockDb.countDocuments(query)),
        findOneAndUpdate: jest.fn((query, update) => mockDb.updateOne(query, update)),
        findOneAndDelete: jest.fn((query) => {
            const result = mockDb.findOne(query);
            if (result) mockDb.deleteMany(query);
            return result;
        })
    };
};

// Test configuration
const TestConfig = {
    // Check if MongoDB is available
    hasMongoDB: () => !!process.env.mongoURL,

    // Check if we should run full integration tests
    shouldRunIntegrationTests: () => TestConfig.hasMongoDB() && process.env.RUN_INTEGRATION_TESTS === 'true',

    // Get test timeout based on test type
    getTestTimeout: (isIntegration = false) => isIntegration ? 30_000 : 5000,

    // Setup test environment
    setupTestEnvironment: () => {
        // Set test environment variables if not set
        if (!process.env.mongoURL) {
            process.env.mongoURL = 'test_mongo_url';
        }
    },

    // Cleanup test environment
    cleanupTestEnvironment: () => {
        // Reset any test modifications
        jest.clearAllMocks();
    }
};

// Test assertions helpers
const TestAssertions = {
    // Assert response structure
    assertResponseStructure: (response, expectedType = 'text') => {
        expect(response).toHaveProperty('default', 'on');
        expect(response).toHaveProperty('type', expectedType);
        expect(response).toHaveProperty('text');
        expect(typeof response.text).toBe('string');
    },

    // Assert successful operation
    assertSuccessResponse: (response, successText = '') => {
        TestAssertions.assertResponseStructure(response);
        if (successText) {
            expect(response.text).toContain(successText);
        }
    },

    // Assert error response
    assertErrorResponse: (response, errorText = '') => {
        TestAssertions.assertResponseStructure(response);
        if (errorText) {
            expect(response.text).toContain(errorText);
        }
    },

    // Assert command result
    assertCommandResult: (result, expectedText = '', shouldHaveCmd = false) => {
        expect(result).toHaveProperty('text');
        if (expectedText) {
            expect(result.text).toContain(expectedText);
        }
        if (shouldHaveCmd) {
            expect(result).toHaveProperty('cmd', true);
        }
    }
};

module.exports = {
    MockDatabase,
    TestDataFactory,
    createEnhancedMock,
    TestConfig,
    TestAssertions
};