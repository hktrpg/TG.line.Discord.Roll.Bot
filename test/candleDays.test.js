"use strict";

// Mock process.env before requiring the module
const originalEnv = process.env;
process.env = { ...originalEnv };

const candleDays = require('../modules/candleDays.js');

describe('CandleDays Module Tests', () => {
    beforeEach(() => {
        // Reset process.env before each test
        process.env = { ...originalEnv };
        
        // Clear any existing console.log calls
        jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        // Restore original process.env after each test
        process.env = originalEnv;
        // Restore console.log
        jest.restoreAllMocks();
        // Cleanup timers
        candleDays.cleanup();
    });

    afterAll(() => {
        // Final cleanup
        candleDays.cleanup();
    });

    test('Test checker returns empty string when no dates are configured', () => {
        process.env.CANDLE_DATES = undefined;
        candleDays.reset(new Date('2024-01-01'));
        const result = candleDays.checker();
        expect(result).toBe('');
    });

    test('Test checker returns candle emoji on configured date', () => {
        // Configure for February 14 with 🌷
        process.env.CANDLE_DATES = '2,14,🌷';
        candleDays.reset(new Date('2024-02-14'));
        
        const result = candleDays.checker();
        expect(result).toBe('🌷');
    });

    test('Test checker returns default candle emoji when no specific emoji is provided', () => {
        // Configure for December 25 without specific emoji
        process.env.CANDLE_DATES = '12,25';
        candleDays.reset(new Date('2024-12-25'));
        
        const result = candleDays.checker();
        expect(result).toBe('🕯️');
    });

    test('Test checker returns empty string on non-configured date', () => {
        // Configure for different dates
        process.env.CANDLE_DATES = '2,14,🌷 12,25,🕯️';
        candleDays.reset(new Date('2024-01-01'));
        
        const result = candleDays.checker();
        expect(result).toBe('');
    });

    test('Test checker handles multiple configured dates', () => {
        // Configure multiple dates
        process.env.CANDLE_DATES = '2,14,🌷 12,25,🎄 6,4,🎂';
        candleDays.reset(new Date('2024-12-25'));
        
        const result = candleDays.checker();
        expect(result).toBe('🎄');
    });

    test('Test checker updates when date changes', () => {
        process.env.CANDLE_DATES = '2,14,🌷';
        candleDays.reset(new Date('2024-02-13'));
        
        // Initial check should be empty
        expect(candleDays.checker()).toBe('');
        
        // Change date to February 14
        candleDays.setDate(new Date('2024-02-14'));
        
        // Check should now return the candle
        expect(candleDays.checker()).toBe('🌷');
    });

    test('Test checker handles invalid date format gracefully', () => {
        // Configure with invalid date format
        process.env.CANDLE_DATES = 'invalid,14,🌷';
        candleDays.reset(new Date('2024-02-14'));
        
        const result = candleDays.checker();
        expect(result).toBe('');
    });

    test('Test checker handles empty date configuration', () => {
        // Configure with empty string
        process.env.CANDLE_DATES = '';
        candleDays.reset(new Date('2024-02-14'));
        
        const result = candleDays.checker();
        expect(result).toBe('');
    });
}); 