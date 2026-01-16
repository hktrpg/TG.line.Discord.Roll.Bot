/**
 * Jest Setup File
 *
 * Configures test environment and global utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Add custom matchers
expect.extend({
    toBeValidResponse(received) {
        const pass = received &&
            typeof received === 'object' &&
            received.hasOwnProperty('default') &&
            received.hasOwnProperty('type') &&
            received.hasOwnProperty('text');

        return {
            message: () => `expected ${received} to be a valid response object`,
            pass
        };
    },

    toHaveErrorText(received, errorText) {
        const pass = received &&
            received.text &&
            received.text.includes(errorText);

        return {
            message: () => `expected response to contain error text "${errorText}"`,
            pass
        };
    }
});

// Global test utilities
global.testUtils = require('./test-utils');

// Setup console spy for cleaner test output
const originalConsole = { ...console };
beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    Object.assign(console, originalConsole);
});

// Increase timeout for async tests
jest.setTimeout(10000);