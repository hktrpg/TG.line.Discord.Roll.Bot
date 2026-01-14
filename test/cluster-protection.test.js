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

    describe('safeBroadcastEval', () => {
        let mockClient;

        beforeEach(() => {
            mockClient = {
                cluster: {
                    broadcastEval: jest.fn(),
                    ids: new Set([0, 1, 2])
                }
            };
        });

        test('should execute successfully on first attempt', async () => {
            const expectedResult = 'success';
            mockClient.cluster.broadcastEval.mockResolvedValue(expectedResult);

            const result = await clusterProtection.safeBroadcastEval(mockClient, () => 'test');

            expect(result).toBe(expectedResult);
            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledTimes(1);
            expect(clusterProtection.unhealthyClusters.size).toBe(0);
        });

        test('should retry on failure and succeed', async () => {
            mockClient.cluster.broadcastEval
                .mockRejectedValueOnce(new Error('CLUSTERING_NO_CHILD_EXISTS: ClusterId: 1'))
                .mockResolvedValueOnce('success');

            const result = await clusterProtection.safeBroadcastEval(mockClient, () => 'test');

            // When unhealthy clusters exist after first failure, it switches to filteredBroadcastEval which returns array
            expect(result).toEqual(['success']); // Only cluster 0 succeeds, cluster 1 is unhealthy and filtered out
            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledTimes(3); // 1 failed + 2 filtered calls
            expect(clusterProtection.unhealthyClusters.has(1)).toBe(true);
        });

        test('should use filtered broadcast when unhealthy clusters exist', async () => {
            clusterProtection.unhealthyClusters.add(1);
            // Mock individual cluster calls for filtered broadcast
            mockClient.cluster.broadcastEval
                .mockResolvedValueOnce('result0')
                .mockResolvedValueOnce('result2');

            const result = await clusterProtection.safeBroadcastEval(mockClient, () => 'test');

            expect(result).toEqual(['result0', 'result2']);
        });

        test('should handle latency measurement option', async () => {
            clusterProtection.unhealthyClusters.add(1);
            mockClient.cluster.broadcastEval.mockResolvedValue('latency result');

            const result = await clusterProtection.safeBroadcastEval(mockClient, () => 'test', {
                isLatencyMeasurement: true
            });

            expect(result).toBe('latency result');
            expect(clusterProtection.unhealthyClusters.has(1)).toBe(true); // Should keep unhealthy clusters for latency measurements
        });

        test('should support context options', async () => {
            const context = { key: 'value' };
            mockClient.cluster.broadcastEval.mockResolvedValue('success');

            await clusterProtection.safeBroadcastEval(mockClient, () => 'test', { context });

            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledWith(
                expect.any(Function),
                { context }
            );
        });

        test('should fail after all retries exhausted', async () => {
            clusterProtection.unhealthyClusters.clear();
            // Mock detectMissingClusters to do nothing to avoid marking clusters unhealthy
            jest.spyOn(clusterProtection, 'detectMissingClusters').mockResolvedValue();

            mockClient.cluster.broadcastEval.mockRejectedValue(new Error('Persistent error'));

            await expect(clusterProtection.safeBroadcastEval(mockClient, () => 'test')).rejects.toThrow('Persistent error');

            // Restore the original method
            clusterProtection.detectMissingClusters.mockRestore();
        });

        test('should respect custom timeout option', async () => {
            mockClient.cluster.broadcastEval.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('slow'), 200))
            );

            await expect(clusterProtection.safeBroadcastEval(mockClient, () => 'test', { timeout: 100 })).rejects.toThrow('Operation timed out');
        });
    });

    describe('filteredBroadcastEval', () => {
        let mockClient;

        beforeEach(() => {
            mockClient = {
                cluster: {
                    broadcastEval: jest.fn(),
                    ids: new Set([0, 1, 2])
                }
            };
        });

        test('should filter out unhealthy clusters', async () => {
            clusterProtection.unhealthyClusters.add(1);
            mockClient.cluster.broadcastEval
                .mockResolvedValueOnce('result0')
                .mockResolvedValueOnce('result2');

            const result = await clusterProtection.filteredBroadcastEval(mockClient, () => 'test', 5000, false);

            expect(result).toEqual(['result0', 'result2']);
            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledTimes(2);
        });

        test('should include all clusters for latency measurements', async () => {
            clusterProtection.unhealthyClusters.add(1);
            mockClient.cluster.broadcastEval
                .mockResolvedValueOnce('result0')
                .mockResolvedValueOnce('result1')
                .mockResolvedValueOnce('result2');

            const result = await clusterProtection.filteredBroadcastEval(mockClient, () => 'test', 5000, true);

            expect(result).toEqual(['result0', 'result1', 'result2']);
            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledTimes(3);
        });

        test('should throw error when no clusters available', async () => {
            mockClient.cluster.ids = new Set();

            await expect(clusterProtection.filteredBroadcastEval(mockClient, () => 'test', 5000, false)).rejects.toThrow('No clusters available');
        });

        test('should throw error when no healthy clusters available', async () => {
            clusterProtection.unhealthyClusters.add(0);
            clusterProtection.unhealthyClusters.add(1);
            clusterProtection.unhealthyClusters.add(2);

            await expect(clusterProtection.filteredBroadcastEval(mockClient, () => 'test', 5000, false)).rejects.toThrow('No healthy clusters available');
        });

        test('should handle individual cluster failures gracefully', async () => {
            mockClient.cluster.broadcastEval
                .mockResolvedValueOnce('result0')
                .mockRejectedValueOnce(new Error('Cluster 1 failed'))
                .mockResolvedValueOnce('result2');

            const result = await clusterProtection.filteredBroadcastEval(mockClient, () => 'test', 5000, false);

            expect(result).toEqual(['result0', 'result2']);
        });

        test('should support context parameter', async () => {
            const context = { key: 'value' };
            mockClient.cluster.broadcastEval
                .mockResolvedValueOnce('result0')
                .mockResolvedValueOnce('result1')
                .mockResolvedValueOnce('result2');

            await clusterProtection.filteredBroadcastEval(mockClient, () => 'test', 5000, false, context);

            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledWith(
                expect.any(Function),
                { cluster: 0, context }
            );
            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledWith(
                expect.any(Function),
                { cluster: 1, context }
            );
            expect(mockClient.cluster.broadcastEval).toHaveBeenCalledWith(
                expect.any(Function),
                { cluster: 2, context }
            );
        });
    });

    describe('checkClusterHealth', () => {
        jest.setTimeout(10_000); // Increase timeout for this describe block
        let mockClient;

        beforeEach(() => {
            mockClient = {
                cluster: {
                    broadcastEval: jest.fn(),
                    ids: new Set([0, 1, 2])
                }
            };
        });

        test('should return healthy status when clusters respond', async () => {
            const mockResponses = [
                { clusterId: 0 },
                { clusterId: 1 },
                { clusterId: 2 }
            ];
            mockClient.cluster.broadcastEval.mockResolvedValue(mockResponses);

            const result = await clusterProtection.checkClusterHealth(mockClient);

            expect(result.healthy).toBe(true);
            expect(result.totalClusters).toBe(3);
            expect(result.healthyClusters).toBe(3);
            expect(result.unhealthyClusters).toBe(0);
        });

        test('should return unhealthy status when no client available', async () => {
            const result = await clusterProtection.checkClusterHealth(null);

            expect(result.healthy).toBe(false);
            expect(result.reason).toBe('No cluster client');
        });

        test('should filter out invalid responses', async () => {
            const mockResponses = [
                { clusterId: 0 },
                null,
                { clusterId: -1 }
            ];
            mockClient.cluster.broadcastEval.mockResolvedValue(mockResponses);

            const result = await clusterProtection.checkClusterHealth(mockClient);

            expect(result.healthy).toBe(true);
            expect(result.healthyClusters).toBe(1);
        });

        test('should handle broadcastEval failure', async () => {
            mockClient.cluster.broadcastEval.mockRejectedValue(new Error('Network error'));

            const result = await clusterProtection.checkClusterHealth(mockClient);

            expect(result.healthy).toBe(false);
            expect(result.reason).toBe('Network error');
            expect(result.totalClusters).toBe(3);
        });

        test('should handle timeout', async () => {
            mockClient.cluster.broadcastEval.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve([]), 6000))
            );

            const result = await clusterProtection.checkClusterHealth(mockClient);

            expect(result.healthy).toBe(false);
            expect(result.reason).toContain('Operation timed out');
        });
    });

    describe('detectMissingClusters', () => {
        let mockClient;

        beforeEach(() => {
            mockClient = {
                cluster: {
                    broadcastEval: jest.fn(),
                    ids: new Set([0, 1, 2])
                }
            };
        });

        test('should detect missing clusters correctly', async () => {
            // Simulate cluster 1 not responding
            mockClient.cluster.broadcastEval.mockResolvedValue([
                { clusterId: 0 },
                { clusterId: 2 }
            ]);

            await clusterProtection.detectMissingClusters(mockClient);

            expect(clusterProtection.unhealthyClusters.has(1)).toBe(true);
            expect(clusterProtection.unhealthyClusters.has(0)).toBe(false);
            expect(clusterProtection.unhealthyClusters.has(2)).toBe(false);
        });

        test('should handle no missing clusters', async () => {
            mockClient.cluster.broadcastEval.mockResolvedValue([
                { clusterId: 0 },
                { clusterId: 1 },
                { clusterId: 2 }
            ]);

            await clusterProtection.detectMissingClusters(mockClient);

            expect(clusterProtection.unhealthyClusters.size).toBe(0);
        });

        test('should handle broadcastEval failure gracefully', async () => {
            // Mock the entire withTimeout call to return empty array on failure
            jest.spyOn(clusterProtection, 'withTimeout').mockResolvedValue([]);

            await clusterProtection.detectMissingClusters(mockClient);

            // Should not crash, unhealthyClusters should remain unchanged
            expect(clusterProtection.unhealthyClusters.size).toBe(0);

            clusterProtection.withTimeout.mockRestore();
        });

        test('should skip when no client available', async () => {
            await clusterProtection.detectMissingClusters(null);

            expect(clusterProtection.unhealthyClusters.size).toBe(0);
        });

        test('should handle empty cluster IDs', async () => {
            mockClient.cluster.ids = new Set();

            await clusterProtection.detectMissingClusters(mockClient);

            expect(clusterProtection.unhealthyClusters.size).toBe(0);
        });
    });
});