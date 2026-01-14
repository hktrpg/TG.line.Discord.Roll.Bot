"use strict";

const clusterProtection = require('../modules/cluster-protection.js');

describe('ClusterProtection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton state
        clusterProtection.unhealthyClusters.clear();
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(clusterProtection.unhealthyClusters).toBeInstanceOf(Set);
            expect(clusterProtection.clusterHealthTimeout).toBe(30_000);
            expect(clusterProtection.maxRetries).toBe(2);
            expect(clusterProtection.retryDelay).toBe(1000);
        });
    });

    describe('extractClusterIdFromError', () => {
        test('should extract cluster ID from error message', () => {
            const errorMessage = 'CLUSTERING_NO_CHILD_EXISTS: ClusterId: 5';
            const result = clusterProtection.extractClusterIdFromError(errorMessage);
            expect(result).toBe(5);
        });

        test('should return null when no cluster ID found', () => {
            const errorMessage = 'Some other error message';
            const result = clusterProtection.extractClusterIdFromError(errorMessage);
            expect(result).toBeNull();
        });
    });

    describe('withTimeout', () => {
        test('should resolve when promise completes within timeout', async () => {
            const promise = Promise.resolve('success');
            const result = await clusterProtection.withTimeout(promise, 1000);
            expect(result).toBe('success');
        });

        test('should reject when promise times out', async () => {
            const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));
            await expect(clusterProtection.withTimeout(promise, 100)).rejects.toThrow('Operation timed out');
        });
    });

    describe('safeBroadcastEval', () => {
        test('should throw error when client is not available', async () => {
            await expect(clusterProtection.safeBroadcastEval(null, () => {})).rejects.toThrow('Cluster client not available');
        });

        test('should throw error when cluster is not available', async () => {
            await expect(clusterProtection.safeBroadcastEval({ cluster: null }, () => {})).rejects.toThrow('Cluster client not available');
        });
    });

    describe('resetUnhealthyClusters', () => {
        test('should clear unhealthy clusters set', () => {
            clusterProtection.unhealthyClusters.add(1);
            clusterProtection.unhealthyClusters.add(2);

            clusterProtection.resetUnhealthyClusters();

            expect(clusterProtection.unhealthyClusters.size).toBe(0);
        });
    });

    describe('getStatusReport', () => {
        test('should return comprehensive status report', () => {
            clusterProtection.unhealthyClusters.add(1);

            const report = clusterProtection.getStatusReport();

            expect(report.unhealthyClusters).toEqual([1]);
            expect(report.unhealthyCount).toBe(1);
            expect(report.healthTimeout).toBe(30_000);
            expect(report.maxRetries).toBe(2);
        });
    });
});