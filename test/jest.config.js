/**
 * Jest Configuration for HKTRPG Tests
 *
 * Supports different test modes:
 * - Unit tests: Run without MongoDB using mocks
 * - Integration tests: Run with MongoDB for full functionality
 */

module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test setup
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

    // Test patterns
    testMatch: [
        '<rootDir>/test/**/*.test.js',
        '<rootDir>/test/**/*.spec.js'
    ],

    // Coverage
    collectCoverageFrom: [
        'roll/**/*.js',
        'modules/**/*.js',
        'index.js',
        '!**/node_modules/**',
        '!**/coverage/**'
    ],

    // Test timeouts
    timeout: 10_000,

    // Setup files to run before everything else
    setupFiles: ['<rootDir>/test/setup-env.js'],

    // Always use global setup for in-memory MongoDB
    globalSetup: '<rootDir>/test/global-setup.js',
    globalTeardown: '<rootDir>/test/global-teardown.js',

    // Transform patterns to ignore problematic modules
    transformIgnorePatterns: [
        'node_modules/(?!(@jest|mongodb-memory-server)/)',
        '<rootDir>/modules/schema.js'
    ],

    // Module name mapper for problematic modules
    moduleNameMapper: {
        '^(\\./modules/schema\\.js)$': '<rootDir>/test/mocks/schema-mock.js'
    },

    // Custom test environment for MongoDB tests
    testEnvironmentOptions: {
        // Custom options can be added here
    },

    // Reporters
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'test-results',
            outputName: 'junit.xml'
        }]
    ]
};