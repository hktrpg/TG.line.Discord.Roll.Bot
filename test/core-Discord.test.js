"use strict";

// Mock environment variables
process.env.DISCORD_CHANNEL_SECRET = 'test-secret';
process.env.DISCORDDELAY = '1000';

// Create mock instances
const mockManagerInstance = {
    on: jest.fn(),
    extend: jest.fn(),
    spawn: jest.fn().mockResolvedValue(undefined),
    clusters: {
        get: jest.fn(() => ({
            respawn: jest.fn()
        }))
    },
    respawnAll: jest.fn()
};

const mockHeartbeatInstance = {
    interval: 2000,
    maxMissedHeartbeats: 10,
    onMissedHeartbeat: jest.fn()
};

// Mock discord-hybrid-sharding
const mockClusterManager = jest.fn(() => mockManagerInstance);
const mockHeartbeatManager = jest.fn(() => mockHeartbeatInstance);

jest.mock('discord-hybrid-sharding', () => ({
    ClusterManager: mockClusterManager,
    HeartbeatManager: mockHeartbeatManager
}));

// Mock schedule module
jest.mock('../modules/schedule', () => ({
    agenda: {
        define: jest.fn()
    }
}));

// Mock ds-deploy-commands
jest.mock('../modules/ds-deploy-commands', () => {});

describe('Core Discord Module Tests', () => {
    let coreDiscord;
    let schedule;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Clear module cache
        jest.resetModules();
        
        // Reset environment variables
        process.env.DISCORD_CHANNEL_SECRET = 'test-secret';
        process.env.DISCORDDELAY = '1000';
        
        // Get mock implementations
        schedule = require('../modules/schedule');
        
        // Require the module
        coreDiscord = require('../modules/core-Discord.js');
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.DISCORD_CHANNEL_SECRET;
        delete process.env.DISCORDDELAY;
    });

    test('Module should not initialize without DISCORD_CHANNEL_SECRET', () => {
        delete process.env.DISCORD_CHANNEL_SECRET;
        jest.resetModules();
        const result = require('../modules/core-Discord.js');
        expect(result).toBeUndefined();
    });

    test('ClusterManager should be initialized with correct options', () => {
        expect(mockClusterManager).toHaveBeenCalledWith(
            './modules/discord_bot.js',
            expect.objectContaining({
                token: 'test-secret',
                shardsPerClusters: 2,
                totalShards: 'auto',
                mode: 'process',
                spawnTimeout: -1,
                respawn: true,
                retry: {
                    attempts: 3,
                    delay: 5000
                }
            })
        );
    });

    test('Cluster event handlers should be registered', () => {
        const mockCluster = {
            id: 1,
            on: jest.fn(),
            respawn: jest.fn(),
            manager: {
                totalShards: 6
            }
        };

        // Get the clusterCreate handler
        const clusterCreateHandler = mockManagerInstance.on.mock.calls.find(
            call => call[0] === 'clusterCreate'
        )[1];

        // Call the handler with mock cluster
        clusterCreateHandler(mockCluster);

        // Verify event handlers were registered
        expect(mockCluster.on).toHaveBeenCalledWith('ready', expect.any(Function));
        expect(mockCluster.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockCluster.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
        expect(mockCluster.on).toHaveBeenCalledWith('death', expect.any(Function));
        expect(mockCluster.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('Message handler should handle respawn message', async () => {
        const mockCluster = {
            id: 1,
            on: jest.fn(),
            respawn: jest.fn()
        };

        mockManagerInstance.clusters.get.mockReturnValue(mockCluster);

        // Get both clusterCreate handlers
        const clusterCreateHandlers = mockManagerInstance.on.mock.calls
            .filter(call => call[0] === 'clusterCreate')
            .map(call => call[1]);

        // Call both handlers with mock cluster
        clusterCreateHandlers.forEach(handler => handler(mockCluster));

        // Get the message handler from the second clusterCreate handler
        const messageHandler = mockCluster.on.mock.calls
            .find(call => call[0] === 'message')[1];
        expect(messageHandler).toBeTruthy();

        // Call the message handler
        await messageHandler({ respawn: true, id: 1 });

        // Verify the respawn was called
        expect(mockCluster.respawn).toHaveBeenCalledWith({
            delay: 100,
            timeout: 30000
        });
    });

    test('Message handler should handle respawnAll message', async () => {
        const mockCluster = {
            id: 1,
            on: jest.fn()
        };

        // Get both clusterCreate handlers
        const clusterCreateHandlers = mockManagerInstance.on.mock.calls
            .filter(call => call[0] === 'clusterCreate')
            .map(call => call[1]);

        // Call both handlers with mock cluster
        clusterCreateHandlers.forEach(handler => handler(mockCluster));

        // Get the message handler from the second clusterCreate handler
        const messageHandler = mockCluster.on.mock.calls
            .find(call => call[0] === 'message')[1];
        expect(messageHandler).toBeTruthy();

        // Call the message handler
        await messageHandler({ respawnall: true });

        // Verify respawnAll was called
        expect(mockManagerInstance.respawnAll).toHaveBeenCalledWith({
            clusterDelay: 1000 * 60,
            respawnDelay: 500,
            timeout: 1000 * 60 * 2
        });
    });

    test('Daily maintenance job should be registered', () => {
        expect(schedule.agenda.define).toHaveBeenCalledWith(
            'dailyDiscordMaintenance',
            expect.any(Function)
        );
    });

    test('HeartbeatManager should be initialized with correct options', () => {
        expect(mockHeartbeatManager).toHaveBeenCalledWith({
            interval: 2000,
            maxMissedHeartbeats: 10,
            onMissedHeartbeat: expect.any(Function)
        });
    });

    test('Cluster spawn should be called with correct options', () => {
        expect(mockManagerInstance.spawn).toHaveBeenCalledWith({
            timeout: -1,
            delay: 1000
        });
    });

    test('Error handling in cluster spawn', async () => {
        jest.resetModules();
        
        const error = new Error('Spawn failed');
        mockManagerInstance.spawn.mockRejectedValueOnce(error);
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const processSpy = jest.spyOn(process, 'exit').mockImplementation();

        // Require the module to trigger the spawn
        await require('../modules/core-Discord.js');

        // Wait for the next tick to allow the error handler to execute
        await new Promise(resolve => process.nextTick(resolve));

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Cluster] Failed to spawn clusters:',
            error
        );
        expect(processSpy).toHaveBeenCalledWith(1);

        consoleSpy.mockRestore();
        processSpy.mockRestore();
    });
});