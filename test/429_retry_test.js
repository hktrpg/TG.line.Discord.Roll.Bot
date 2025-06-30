// Test file for 429 retry mechanism
const { RetryManager } = require('../roll/openai.js');

// Mock AI_CONFIG for testing
global.AI_CONFIG = {
    MODELS: {
        LOW: {
            models: [
                { name: 'model1', display: 'Model 1' },
                { name: 'model2', display: 'Model 2' },
                { name: 'model3', display: 'Model 3' }
            ]
        }
    }
};

// Mock RETRY_CONFIG for testing
global.RETRY_CONFIG = {
    MODEL_CYCLING: {
        enabled: true
    }
};

describe('429 Retry Mechanism Tests', () => {
    let retryManager;

    beforeEach(() => {
        retryManager = new RetryManager();
    });

    test('should start with no rate limited models', () => {
        expect(retryManager.rateLimitedModels.size).toBe(0);
        expect(retryManager.activeModelIndex).toBe(0);
    });

    test('should mark model as rate limited', () => {
        retryManager.markModelAsRateLimited(0);
        expect(retryManager.rateLimitedModels.has(0)).toBe(true);
        expect(retryManager.rateLimitedModels.size).toBe(1);
    });

    test('should get next available model when current is rate limited', () => {
        retryManager.markModelAsRateLimited(0);
        const nextIndex = retryManager.getNextAvailableModelIndex();
        expect(nextIndex).toBe(1);
        expect(retryManager.activeModelIndex).toBe(1);
    });

    test('should cycle through models when rate limited', () => {
        // Mark first model as rate limited
        retryManager.markModelAsRateLimited(0);
        expect(retryManager.getCurrentActiveModelIndex()).toBe(1);

        // Mark second model as rate limited
        retryManager.markModelAsRateLimited(1);
        expect(retryManager.getCurrentActiveModelIndex()).toBe(2);

        // Mark third model as rate limited
        retryManager.markModelAsRateLimited(2);
        expect(retryManager.getCurrentActiveModelIndex()).toBe(0); // Should reset to first
    });

    test('should reset rate limited models when all are limited', () => {
        retryManager.markModelAsRateLimited(0);
        retryManager.markModelAsRateLimited(1);
        retryManager.markModelAsRateLimited(2);
        
        expect(retryManager.rateLimitedModels.size).toBe(3);
        const nextIndex = retryManager.getNextAvailableModelIndex();
        expect(nextIndex).toBe(0);
        expect(retryManager.rateLimitedModels.size).toBe(0);
    });

    test('should preserve rate limited state after resetRetryCounters', () => {
        retryManager.markModelAsRateLimited(0);
        retryManager.globalRetryCount = 5;
        retryManager.modelRetryCount = 3;
        
        retryManager.resetRetryCounters();
        
        expect(retryManager.globalRetryCount).toBe(0);
        expect(retryManager.modelRetryCount).toBe(0);
        expect(retryManager.rateLimitedModels.has(0)).toBe(true);
        expect(retryManager.rateLimitedModels.size).toBe(1);
    });

    test('should reset everything after resetCounters', () => {
        retryManager.markModelAsRateLimited(0);
        retryManager.globalRetryCount = 5;
        retryManager.modelRetryCount = 3;
        
        retryManager.resetCounters();
        
        expect(retryManager.globalRetryCount).toBe(0);
        expect(retryManager.modelRetryCount).toBe(0);
        expect(retryManager.rateLimitedModels.size).toBe(0);
        expect(retryManager.activeModelIndex).toBe(0);
    });

    test('should stay on working model until rate limited', () => {
        // Start with model 0
        expect(retryManager.getCurrentActiveModelIndex()).toBe(0);
        
        // Use model 0 multiple times without rate limiting
        for (let i = 0; i < 10; i++) {
            expect(retryManager.getCurrentActiveModelIndex()).toBe(0);
        }
        
        // Now rate limit model 0
        retryManager.markModelAsRateLimited(0);
        expect(retryManager.getCurrentActiveModelIndex()).toBe(1);
        
        // Use model 1 multiple times
        for (let i = 0; i < 5; i++) {
            expect(retryManager.getCurrentActiveModelIndex()).toBe(1);
        }
    });

    test('should not automatically reset rate limited models', () => {
        retryManager.markModelAsRateLimited(0);
        expect(retryManager.rateLimitedModels.has(0)).toBe(true);
        
        // Simulate time passing (no automatic reset)
        setTimeout(() => {
            expect(retryManager.rateLimitedModels.has(0)).toBe(true);
        }, 100);
    });
});

console.log('429 Retry Mechanism Tests completed'); 