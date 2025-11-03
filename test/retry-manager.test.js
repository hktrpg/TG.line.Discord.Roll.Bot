/**
 * Test for RetryManager unified retry logic
 */

// Mock window object for browser environment
globalThis.window = {};

// Mock debugLog function
globalThis.debugLog = jest.fn();

describe('RetryManager', () => {
    let retryManager;

    beforeEach(() => {
        // Reset mocks
        globalThis.debugLog.mockClear();

        // Create RetryManager instance directly
        delete require.cache[require.resolve('../views/common/retry-manager.js')];
        const RetryManagerClass = require('../views/common/retry-manager.js');
        retryManager = new RetryManagerClass();
    });

    describe('calculateRetryDelay', () => {
        it('should return fast retry delays for first 3 attempts', () => {
            expect(retryManager.calculateRetryDelay(0)).toBeGreaterThanOrEqual(80);  // ~100ms with randomization
            expect(retryManager.calculateRetryDelay(1)).toBeGreaterThanOrEqual(160); // ~200ms with randomization
            expect(retryManager.calculateRetryDelay(2)).toBeGreaterThanOrEqual(320); // ~400ms with randomization
        });

        it('should return medium retry delays for attempts 3-9', () => {
            const delay3 = retryManager.calculateRetryDelay(3);
            const delay4 = retryManager.calculateRetryDelay(4);
            const delay5 = retryManager.calculateRetryDelay(5);

            expect(delay3).toBeGreaterThanOrEqual(160);  // ~200ms (2^(3-1) * 100)
            expect(delay4).toBeGreaterThanOrEqual(320);  // ~400ms (2^(4-1) * 100)
            expect(delay5).toBeGreaterThanOrEqual(640);  // ~800ms (2^(5-1) * 100)
        });

        it('should return slow retry delay for attempts 10+', () => {
            // For attempts 10+, it should be around maxDelay (10000) with randomization
            const delay10 = retryManager.calculateRetryDelay(10);
            const delay20 = retryManager.calculateRetryDelay(20);

            expect(delay10).toBeGreaterThanOrEqual(8000);  // Should be around 10000 with randomization
            expect(delay20).toBeGreaterThanOrEqual(8000);  // Should be around 10000 with randomization
        });

        it('should apply randomization to prevent thundering herd', () => {
            const delays = [];
            for (let i = 0; i < 10; i++) {
                delays.push(retryManager.calculateRetryDelay(0));
            }

            // Should have some variation (not all exactly 100)
            const uniqueDelays = new Set(delays);
            expect(uniqueDelays.size).toBeGreaterThan(1);
        });
    });

    describe('retry functionality', () => {
        it('should execute operation successfully on first try', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');
            const result = await retryManager.retry('test-key', mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            let callCount = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    return Promise.reject(new Error('Temporary failure'));
                }
                return Promise.resolve('success');
            });

            const result = await retryManager.retry('test-key', mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        it('should give up after max retries', async () => {
            const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

            // Create a manager with low max retries for testing
            const RetryManagerClass = require('../views/common/retry-manager.js');
            const testManager = new RetryManagerClass({
                maxRetries: 2  // 2 retries = 3 total attempts
            });

            await expect(testManager.retry('test-key', mockOperation)).rejects.toThrow('Persistent failure');
            expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry = 2 calls before maxRetries reached
        });

        it('should call onRetry callback', async () => {
            let callCount = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount < 2) {
                    return Promise.reject(new Error('Failure'));
                }
                return Promise.resolve('success');
            });

            const onRetry = jest.fn();
            await retryManager.retry('test-key', mockOperation, { onRetry });

            expect(onRetry).toHaveBeenCalledTimes(1);
            expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
        });
    });

    describe('state management', () => {
        it('should have state management methods', () => {
            expect(typeof retryManager.getRetryStats).toBe('function');
            expect(typeof retryManager.resetAllRetryStates).toBe('function');
        });
    });

    describe('executeOnce', () => {
        it('should execute operation without retry', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');
            const result = await retryManager.executeOnce('test-key', mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should not retry on failure', async () => {
            const mockOperation = jest.fn().mockRejectedValue(new Error('Failure'));

            await expect(retryManager.executeOnce('test-key', mockOperation)).rejects.toThrow('Failure');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });
    });
});
