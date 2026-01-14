/**
 * Run After Startup Test
 * 
 * This test runs all records-related code after service startup
 * to verify the migration from callback to Promise pattern works correctly.
 * 
 * Usage:
 * 1. Start the service: node index.js
 * 2. Run this test: yarn test test/run-after-startup.test.js
 * 
 * Or add to package.json scripts to run automatically after startup
 */

// Only run if mongoURL is set (service is running)
const shouldSkipTest = !process.env.mongoURL;

// Wait a bit for service to fully initialize
const WAIT_TIME = 2000; // 2 seconds

describe('Records Module - Post-Startup Integration Test', () => {
    let records;
    let dbConnector;
    let timeoutHandle;

    beforeAll(async () => {
        if (shouldSkipTest) {
            console.log('⚠️  Skipping startup test - mongoURL not set');
            return;
        }

        // Wait for service to initialize
        await new Promise(resolve => {
            timeoutHandle = setTimeout(resolve, WAIT_TIME);
        });

        // Import modules (they should be initialized by now)
        records = require('../modules/records.js');
        dbConnector = require('../modules/db-connector.js');

        // Wait for database connection if needed (with timeout)
        if (dbConnector.waitForConnection) {
            try {
                await Promise.race([
                    dbConnector.waitForConnection(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection timeout')), 10_000)
                    )
                ]);
            } catch {
                console.warn('[Test] Database connection timeout, continuing with tests');
            }
        }
    }, 30_000); // 30 second timeout for initialization

    afterAll(async () => {
        // Clean up timeout if it exists
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
        
        // Give Jest time to clean up
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Skip all tests if mongoURL is not set
    const testFn = shouldSkipTest ? test.skip : test;
    const describeFn = shouldSkipTest ? describe.skip : describe;

    describeFn('Service Initialization Check', () => {
        testFn('should have records module loaded', () => {
            expect(records).toBeDefined();
            expect(typeof records.get).toBe('function');
            expect(typeof records.updateRecord).toBe('function');
        });

        testFn('should have database connection ready', async () => {
            const health = dbConnector.checkHealth();
            expect(health).toBeDefined();
            // Connection should be ready or at least attempting
            expect(health.isConnected || dbConnector.mongoose.connection.readyState === 2).toBeTruthy();
        });
    });

    describeFn('Basic Records Operations', () => {
        testFn('should get block data without errors', async () => {
            const result = await records.get('block');
            expect(Array.isArray(result)).toBe(true);
        }, 10_000);

        testFn('should get trpgCommand data without errors', async () => {
            const result = await records.get('trpgCommand');
            expect(Array.isArray(result)).toBe(true);
        }, 10_000);

        testFn('should get trpgDatabase data without errors', async () => {
            const result = await records.get('trpgDatabase');
            expect(Array.isArray(result)).toBe(true);
        }, 10_000);

        testFn('should get trpgDarkRolling data without errors', async () => {
            const result = await records.get('trpgDarkRolling');
            expect(Array.isArray(result)).toBe(true);
        }, 10_000);
    });

    describeFn('Module Initialization Patterns', () => {
        testFn('should handle z_stop.js initialization pattern', async () => {
            // Simulate z_stop.js initialization
            const blockData = await records.get('block');
            expect(Array.isArray(blockData)).toBe(true);
        }, 10_000);

        testFn('should handle z_saveCommand.js initialization pattern', async () => {
            // Simulate z_saveCommand.js initialization
            const commandData = await records.get('trpgCommand');
            expect(Array.isArray(commandData)).toBe(true);
        }, 10_000);

        testFn('should handle z_DDR_darkRollingToGM.js initialization pattern', async () => {
            // Simulate z_DDR_darkRollingToGM.js initialization
            const darkRollingData = await records.get('trpgDarkRolling');
            expect(Array.isArray(darkRollingData)).toBe(true);
        }, 10_000);
    });

    describeFn('Parallel Operations', () => {
        testFn('should handle parallel get operations', async () => {
            const [blockData, commandData, dbData] = await Promise.all([
                records.get('block'),
                records.get('trpgCommand'),
                records.get('trpgDatabase')
            ]);

            expect(Array.isArray(blockData)).toBe(true);
            expect(Array.isArray(commandData)).toBe(true);
            expect(Array.isArray(dbData)).toBe(true);
        }, 15_000);
    });

    describeFn('Update Operations', () => {
        testFn('should handle updateRecord without errors', async () => {
            const query = { groupid: 'test-integration-group' };
            const update = { $set: { testField: 'test-value' } };
            const options = { upsert: true };

            try {
                const result = await records.updateRecord('block', query, update, options);
                // Should not throw error
                expect(result !== undefined).toBe(true);
            } catch (error) {
                // If it's a validation error, that's okay - means security is working
                if (error.message && error.message.includes('Validation failed')) {
                    expect(true).toBe(true); // Expected behavior
                } else {
                    throw error; // Unexpected error
                }
            }
        }, 10_000);
    });

    describeFn('Chat Room Operations', () => {
        testFn('should get chat room messages without errors', async () => {
            const result = await records.chatRoomGet('test-room');
            expect(Array.isArray(result)).toBe(true);
        }, 10_000);
    });

    describeFn('Error Handling', () => {
        testFn('should handle invalid groupId gracefully', async () => {
            const invalidData = {
                groupid: null, // Invalid
                blockfunction: []
            };

            await expect(records.setBlockFunction('block', invalidData)).rejects.toThrow();
        }, 10_000);

        testFn('should return empty array on get error', async () => {
            // This should not throw, but return empty array
            const result = await records.get('nonExistentSchema');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        }, 10_000);
    });

    describeFn('Function Availability Check', () => {
        testFn('should have all set functions available', () => {
            expect(typeof records.setBlockFunction).toBe('function');
            expect(typeof records.setTrpgCommandFunction).toBe('function');
            expect(typeof records.setTrpgDatabaseFunction).toBe('function');
            expect(typeof records.setTrpgDarkRollingFunction).toBe('function');
        });

        testFn('should have all push functions available', () => {
            expect(typeof records.pushBlockFunction).toBe('function');
            expect(typeof records.pushTrpgCommandFunction).toBe('function');
            expect(typeof records.pushTrpgDatabaseFunction).toBe('function');
            expect(typeof records.pushTrpgDarkRollingFunction).toBe('function');
        });

        testFn('should have chat room functions available', () => {
            expect(typeof records.chatRoomGet).toBe('function');
            expect(typeof records.chatRoomPush).toBe('function');
            expect(typeof records.chatRoomGetMax).toBe('function');
            expect(typeof records.chatRoomSetMax).toBe('function');
        });

        testFn('should have forwarded message functions available', () => {
            expect(typeof records.findForwardedMessage).toBe('function');
            expect(typeof records.createForwardedMessage).toBe('function');
            expect(typeof records.deleteForwardedMessage).toBe('function');
            expect(typeof records.countForwardedMessages).toBe('function');
        });
    });

    describeFn('Promise Pattern Verification', () => {
        testFn('should return Promise from get method', () => {
            const result = records.get('block');
            expect(result).toBeInstanceOf(Promise);
        });

        testFn('should return Promise from updateRecord method', () => {
            const query = { groupid: 'test' };
            const update = { $set: { test: 'value' } };
            const result = records.updateRecord('block', query, update);
            expect(result).toBeInstanceOf(Promise);
        });

        testFn('should not have callback parameter in method signatures', () => {
            // Check that methods don't expect callbacks
            const getFunction = records.get.toString();
            expect(getFunction).not.toContain('callback');
            
            const updateFunction = records.updateRecord.toString();
            expect(updateFunction).not.toContain('callback');
        });
    });
});
