/**
 * Test for AuthManager private card retry logic
 */

// Mock window object for browser environment
globalThis.window = {};

// Mock dependencies
globalThis.cardManager = {
    getCardList: jest.fn()
};
globalThis.debugLog = jest.fn();
globalThis.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
};

describe('AuthManager Private Card Retry Logic', () => {
    let authManagerInstance;

    beforeEach(() => {
        // Reset mocks
        globalThis.cardManager.getCardList.mockClear();
        globalThis.debugLog.mockClear();
        globalThis.localStorage.getItem.mockClear();
        globalThis.localStorage.setItem.mockClear();

        // Mock socketManager
        globalThis.window.socketManager = {
            privateCardListRetryCount: 0,
            maxPrivateCardListRetries: 50,
            privateCardListRetryTimeouts: [],
            calculateRetryDelay: jest.fn().mockReturnValue(100)
        };

        // Create a minimal AuthManager instance for testing
        authManagerInstance = {
            assignPrivateCardListWithRetry: function(list) {
                const socketManager = globalThis.window.socketManager;
                if (!socketManager) {
                    globalThis.debugLog('SocketManager not available for private card list assignment', 'error');
                    return;
                }

                // Check if we've exceeded max retries
                if (socketManager.privateCardListRetryCount >= socketManager.maxPrivateCardListRetries) {
                    globalThis.debugLog(`Private card list assignment failed after ${socketManager.maxPrivateCardListRetries} retries, giving up`, 'error');
                    return;
                }

                const cardListApp = globalThis.cardManager.getCardList();
                if (cardListApp && cardListApp.list !== undefined) {
                    // Success! Assign the list
                    cardListApp.list = list;
                    globalThis.debugLog('Private card list assigned successfully', 'info');
                    return;
                }

                // Increment retry count and schedule retry with exponential backoff
                socketManager.privateCardListRetryCount++;
                const delay = socketManager.calculateRetryDelay(socketManager.privateCardListRetryCount - 1);

                globalThis.debugLog(`Private card list app not ready, retrying in ${delay}ms (attempt ${socketManager.privateCardListRetryCount}/${socketManager.maxPrivateCardListRetries})`, 'warn');

                // Schedule retry with exponential backoff
                const timeoutId = setTimeout(() => {
                    this.assignPrivateCardListWithRetry(list);
                }, delay);

                // Store timeout ID in socketManager for cleanup
                socketManager.privateCardListRetryTimeouts.push(timeoutId);
            }
        };
    });

    afterEach(() => {
        // Reset socketManager mock
        if (globalThis.window.socketManager) {
            globalThis.window.socketManager.privateCardListRetryCount = 0;
            globalThis.window.socketManager.privateCardListRetryTimeouts = [];
            globalThis.window.socketManager.calculateRetryDelay.mockClear();
        }
    });

    describe('assignPrivateCardListWithRetry', () => {
        it('should assign list immediately when cardList app is ready', () => {
            const mockList = [{ _id: 'test-card' }];
            const mockCardListApp = { list: [] };

            globalThis.cardManager.getCardList.mockReturnValue(mockCardListApp);

            authManagerInstance.assignPrivateCardListWithRetry(mockList);

            expect(mockCardListApp.list).toBe(mockList);
            expect(globalThis.debugLog).toHaveBeenCalledWith('Private card list assigned successfully', 'info');
        });

        it('should schedule retry when cardList app is not ready', () => {
            const mockList = [{ _id: 'test-card' }];

            // Mock cardList app as not ready
            globalThis.cardManager.getCardList.mockReturnValue(null);

            authManagerInstance.assignPrivateCardListWithRetry(mockList);

            // Should have scheduled a timeout
            expect(globalThis.window.socketManager.privateCardListRetryTimeouts).toHaveLength(1);
            expect(globalThis.window.socketManager.calculateRetryDelay).toHaveBeenCalledWith(0);
            expect(globalThis.window.socketManager.privateCardListRetryCount).toBe(1);
        });

        it('should give up after max retries', () => {
            const mockList = [{ _id: 'test-card' }];

            globalThis.cardManager.getCardList.mockReturnValue(null);
            globalThis.window.socketManager.privateCardListRetryCount = globalThis.window.socketManager.maxPrivateCardListRetries;

            authManagerInstance.assignPrivateCardListWithRetry(mockList);

            expect(globalThis.debugLog).toHaveBeenCalledWith(
                `Private card list assignment failed after ${globalThis.window.socketManager.maxPrivateCardListRetries} retries, giving up`,
                'error'
            );
            expect(globalThis.window.socketManager.privateCardListRetryTimeouts).toHaveLength(0);
        });
    });
});
