/**
 * Test for improved socketManager retry logic and connection handling
 */

// Mock window object for browser environment
globalThis.window = {};

// Mock socket.io-client for testing
const mockSocket = {
    connected: false,
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn()
};

// Mock SocketManager for testing
let _SocketManager;
let socketManagerInstance;

describe('SocketManager Retry Logic', () => {
    beforeEach(() => {
        // Reset mocks
        for (const key of Object.keys(mockSocket)) {
            if (typeof mockSocket[key] === 'function') {
                mockSocket[key].mockClear();
            }
        }

        // Mock retryManager FIRST (before socketManager is created)
        globalThis.window.retryManager = {
            calculateRetryDelay: jest.fn().mockReturnValue(100),
            resetAllRetryStates: jest.fn(),
            retry: jest.fn().mockResolvedValue(true)
        };

        // Mock the io function to return our mock socket
        globalThis.io = jest.fn().mockReturnValue(mockSocket);

        // Mock cardManager
        globalThis.cardManager = {
            getCardList: jest.fn(),
            getCard: jest.fn()
        };

        // Mock debugLog function
        globalThis.debugLog = jest.fn();

        // Mock uiManager
        globalThis.uiManager = {
            showAlert: jest.fn(),
            showError: jest.fn(),
            showSuccess: jest.fn(),
            showPopup: jest.fn()
        };

        // Mock authManager
        globalThis.authManager = {
            handleListInfoWithRetry: jest.fn(),
            handleLoginResponse: jest.fn()
        };

        // Import SocketManager after setting up mocks (this creates the global instance)
        delete require.cache[require.resolve('../views/common/socketManager.js')];
        require('../views/common/socketManager.js');
        socketManagerInstance = globalThis.window.socketManager;

        // Verify the mock is properly set
        expect(socketManagerInstance.retryManager).toBeDefined();
        expect(socketManagerInstance.retryManager.calculateRetryDelay).toBeDefined();
    });

    afterEach(() => {
        // Clean up - don't call resetRetryCounters here as it might interfere with tests
        delete globalThis.io;
        delete globalThis.cardManager;
        delete globalThis.debugLog;
        delete globalThis.uiManager;
        delete globalThis.authManager;
        delete globalThis.window.retryManager;
    });

    describe('calculateRetryDelay', () => {
        it('should delegate to retryManager.calculateRetryDelay', () => {
            const result = socketManagerInstance.calculateRetryDelay(5);
            expect(globalThis.window.retryManager.calculateRetryDelay).toHaveBeenCalledWith(5);
            expect(result).toBe(100); // Mock returns 100
        });
    });

    describe('Connection State Management', () => {
        it('should have resetRetryCounters method', () => {
            // Verify that the resetRetryCounters method exists
            expect(typeof socketManagerInstance.resetRetryCounters).toBe('function');
        });

        it('should have setupConnectionListeners method', () => {
            // Verify that the setupConnectionListeners method exists
            expect(typeof socketManagerInstance.setupConnectionListeners).toBe('function');
        });
    });

    describe('Public List Retry Logic', () => {
        it('should have handlePublicListInfo method', () => {
            // Verify that the handlePublicListInfo method exists
            expect(typeof socketManagerInstance.handlePublicListInfo).toBe('function');
        });

        it('should delegate private list info handling to authManager', () => {
            const mockListInfo = { temp: [{ _id: 'private-test' }] };

            // Mock authManager
            globalThis.authManager = {
                handleListInfoWithRetry: jest.fn()
            };

            socketManagerInstance.handleListInfo(mockListInfo);

            // Should have called authManager.handleListInfoWithRetry
            expect(globalThis.authManager.handleListInfoWithRetry).toHaveBeenCalledWith(mockListInfo);
        });
    });

    describe('Socket Instance', () => {
        it('should have a socket instance', () => {
            expect(socketManagerInstance.socket).toBeDefined();
            expect(socketManagerInstance.getSocket()).toBe(socketManagerInstance.socket);
        });

        it('should have connection checking method', () => {
            expect(typeof socketManagerInstance.isConnected).toBe('function');
            // Since we're using a mock socket, isConnected will return false
            expect(socketManagerInstance.isConnected()).toBe(false);
        });
    });
});
