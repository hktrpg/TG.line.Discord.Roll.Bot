"use strict";

// Requirements
const EventEmitter = require('events');
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
// const schedule = require('node-schedule');

// Configuration parameters
const config = {
    mongoUrl: process.env.mongoURL,
    maxRetries: 5,
    baseRetryInterval: 1000,  // Base retry interval
    maxRetryInterval: 30_000,  // Maximum retry interval
    maxTotalRetryTime: 300_000, // Maximum total time for all retries (5 minutes)
    restartTime: '30 04 */3 * *',
    // Timeout settings optimized for local MongoDB
    connectTimeout: 30_000,     // 30 seconds - Local MongoDB should connect quickly
    socketTimeout: 60_000,     // 60 seconds - Reduced from 180s for faster failure detection
    // Each connection uses ~1-2MB RAM, so 80 connections = ~160MB
    // Reduced from 200 to balance memory (4GB RAM) vs performance (104K guilds)
    poolSize: 200,                // Max pool size 
    minPoolSize: 5,              // Min pool size - Lower to save memory, connections will scale up as needed
    // Heartbeat: Local MongoDB doesn't need frequent checks
    heartbeatInterval: 30_000,  // 30 seconds - Reduced frequency for local MongoDB (was 15s)
    // Server selection: Local MongoDB should be fast
    serverSelectionTimeout: 10_000,  // 10 seconds - Local MongoDB should respond quickly (was 60s)
    // Idle connection cleanup: Close idle connections faster to save memory
    maxIdleTimeMS: 30_000,       // 30 seconds - Close idle connections quickly (was 90s)
    bufferCommands: true,       // Enable command buffering to allow operations before connection
    w: 1,                        // Write concern: 1 (local MongoDB, no replica set) - Changed from 'majority'
    retryWrites: true,          // Enable write retries
    autoIndex: process.env.DEBUG  // Enable auto-indexing only in debug mode
    // Note: useNewUrlParser and useUnifiedTopology are removed in Mongoose 6+ (now default behavior)
};

if (!config.mongoUrl) {
    console.error('[db-connector] MongoDB URL is not configured');
    return;
}

// Connection status
let isConnected = false;
let connectionAttempts = 0;
let isInitializing = false; // Prevent duplicate initialization
let reconnecting = false; // Prevent duplicate reconnection
let sharedConnectionPromise = null; // Shared connection Promise to avoid multiple shards creating duplicate connections
let connectionCooldown = false; // Connection cooldown period to avoid excessive connection attempts
let connectionStartTime = null; // Track when connection attempts started

// Event emitter for connection state changes
const connectionEmitter = new EventEmitter();

// const master = require.main?.filename.includes('index');

// MongoDB configuration
mongoose.set('strictQuery', false);
cachegoose(mongoose, {
    engine: 'memory'
});

// Connection status monitoring
const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
};

// Calculate exponential backoff time
function calculateBackoffTime(attempt) {
    const backoffTime = Math.min(
        config.baseRetryInterval * Math.pow(2, attempt),
        config.maxRetryInterval
    );
    return backoffTime + Math.random() * 1000; // Add random jitter
}

// Classify MongoDB errors to determine if they are permanent or temporary
function classifyMongoDBError(error) {
    const message = error.message || String(error);

    // Permanent errors (don't retry)
    const permanentErrors = [
        'bad auth',
        'Authentication failed',
        'not authorized',
        'Invalid credentials',
        'MongoServerError: bad auth'
        // Note: 'MongoError' was replaced by 'MongoServerError' in MongoDB Driver 4.x+
        // Keeping only MongoServerError for Mongoose 9 compatibility
    ];

    // Temporary errors (retry)
    const temporaryErrors = [
        'connection timed out',
        'Server selection timed out',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ECONNRESET',
        'ETIMEDOUT',
        'connect ETIMEDOUT',
        'connect ECONNREFUSED',
        'PoolClearedError',
        'connection  to .* closed',
        'topology was destroyed',
        'connection is closed'
    ];

    for (const permanentError of permanentErrors) {
        if (message.includes(permanentError)) {
            return 'permanent';
        }
    }

    for (const temporaryError of temporaryErrors) {
        if (message.includes(temporaryError)) {
            return 'temporary';
        }
    }

    // Default to temporary for unknown errors
    return 'temporary';
}

// Establish connection - Force only one connection, support multi-shard sharing
async function connect(retries = 0) {
    // Check if there's already an active connection
    if (mongoose.connection.readyState === 1 && isConnected) {
        console.log('[db-connector] MongoDB connection already active, skipping...');
        return true;
    }

    // If in cooldown period, wait a bit
    if (connectionCooldown) {
        console.log('[db-connector] Connection in cooldown period, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        connectionCooldown = false;
    }

    // If there's an ongoing connection attempt, return that Promise
    if (sharedConnectionPromise) {
        console.log('[db-connector] Waiting for existing connection attempt...');
        try {
            await sharedConnectionPromise;
            return mongoose.connection.readyState === 1;
        } catch {
            console.log('[db-connector] Existing connection attempt failed, will retry...');
            sharedConnectionPromise = null;
        }
    }

    // If connecting, wait for connection to complete
    if (mongoose.connection.readyState === 2) { // connecting
        console.log('[db-connector] MongoDB connection in progress, waiting...');
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 30_000);

            mongoose.connection.once('connected', () => {
                clearTimeout(timeout);
                console.log('[db-connector] MongoDB connection established while waiting');
                isConnected = true;
                resolve(true);
            });

            mongoose.connection.once('error', (connectionError) => {
                clearTimeout(timeout);
                console.error('MongoDB connection failed while waiting:', connectionError.message);
                isConnected = false;
                reject(connectionError);
            }).on('error', () => {
                // Ignore additional errors during connection attempt
            });
        });
    }

    // Create shared connection Promise
    sharedConnectionPromise = (async () => {
        try {
            connectionAttempts++;
            // Track start time for total retry time limit
            if (!connectionStartTime) {
                connectionStartTime = Date.now();
            }

            console.log(`[db-connector] Attempting to connect to MongoDB (Attempt ${connectionAttempts}) - ReadyState: ${mongoose.connection.readyState}`);

            // Only create new connection when truly disconnected
            if (mongoose.connection.readyState === 0) { // disconnected
                console.log('[db-connector] Creating new MongoDB connection...');
                await mongoose.connect(config.mongoUrl, {
                    connectTimeoutMS: config.connectTimeout,
                    socketTimeoutMS: config.socketTimeout,
                    serverSelectionTimeoutMS: config.serverSelectionTimeout,
                    maxPoolSize: config.poolSize,
                    minPoolSize: config.minPoolSize,
                    heartbeatFrequencyMS: config.heartbeatInterval,
                    maxIdleTimeMS: config.maxIdleTimeMS,
                    bufferCommands: config.bufferCommands,
                    w: config.w,
                    retryWrites: config.retryWrites,
                    autoIndex: config.autoIndex
                    // Note: useNewUrlParser and useUnifiedTopology removed (default in Mongoose 6+)
                });
            } else if (mongoose.connection.readyState === 3) { // disconnecting
                console.log('[db-connector] Waiting for disconnect to complete before reconnecting...');
                // Wait for disconnect to complete, then create new connection
                await new Promise(resolve => {
                    const checkState = () => {
                        if (mongoose.connection.readyState === 0) {
                            resolve();
                        } else {
                            setTimeout(checkState, 100);
                        }
                    };
                    checkState();
                });

                console.log('[db-connector] Reconnecting after disconnect...');
                await mongoose.connect(config.mongoUrl, {
                    connectTimeoutMS: config.connectTimeout,
                    socketTimeoutMS: config.socketTimeout,
                    serverSelectionTimeoutMS: config.serverSelectionTimeout,
                    maxPoolSize: config.poolSize,
                    minPoolSize: config.minPoolSize,
                    heartbeatFrequencyMS: config.heartbeatInterval,
                    maxIdleTimeMS: config.maxIdleTimeMS,
                    bufferCommands: config.bufferCommands,
                    w: config.w,
                    retryWrites: config.retryWrites,
                    autoIndex: config.autoIndex
                    // Note: useNewUrlParser and useUnifiedTopology removed (default in Mongoose 6+)
                });
            } else {
                console.log(`[db-connector] MongoDB connection state is ${mongoose.connection.readyState}, no action needed`);
                return true;
            }

            console.log(`[db-connector] MongoDB connected successfully. Connection state: ${connectionStates[mongoose.connection.readyState]}`);
            isConnected = true;
            connectionAttempts = 0;
            connectionStartTime = null; // Reset retry timer on successful connection

            // Listen for connection events
            setupConnectionListeners();

            // Setup connection pool monitoring
            setupPoolMonitoring();

            return true;
        } catch (error) {
            console.error(`MongoDB Connection Error: ${error.message}`);
            isConnected = false;

            // Classify the error
            const errorType = classifyMongoDBError(error);

            // Special handling for authentication errors (permanent)
            if (errorType === 'permanent') {
                console.error('MongoDB Permanent Error (will not retry):', error.message);
                // Reset connection tracking
                connectionStartTime = null;
                connectionCooldown = true;

                // For permanent errors, wait longer before next attempt
                const PERMANENT_ERROR_DELAY = 300_000; // 5 minutes
                setTimeout(() => {
                    console.log('[db-connector] Attempting to reconnect after permanent error delay...');
                    connectionCooldown = false;
                    connect(0);
                }, PERMANENT_ERROR_DELAY);

                throw error;
            }

            // Check total retry time limit
            const elapsedTime = Date.now() - (connectionStartTime || Date.now());
            if (elapsedTime > config.maxTotalRetryTime) {
                console.error(`MongoDB connection failed after ${Math.round(elapsedTime / 1000)} seconds of attempts. Giving up for now.`);
                connectionStartTime = null;
                connectionCooldown = true;

                // Schedule a retry after extended delay
                const EXTENDED_RETRY_DELAY = 300_000; // 5 minutes
                setTimeout(() => {
                    console.log('[db-connector] Attempting to reconnect after extended delay...');
                    connectionCooldown = false;
                    connect(0);
                }, EXTENDED_RETRY_DELAY);

                throw error;
            }

            // Check retry count limit
            if (retries < config.maxRetries) {
                const backoffTime = calculateBackoffTime(retries);
                console.log(`[db-connector] Retrying connection in ${Math.round(backoffTime / 1000)} seconds... (${retries + 1}/${config.maxRetries}, elapsed: ${Math.round(elapsedTime / 1000)}s)`);

                // Add jitter to prevent thundering herd
                const jitter = Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffTime + jitter));
                return connect(retries + 1);
            }

            console.error(`MongoDB connection failed after ${config.maxRetries} retries and ${Math.round(elapsedTime / 1000)} seconds. Will retry periodically.`);
            // Set cooldown period
            connectionCooldown = true;
            connectionStartTime = null;

            // Schedule a retry after extended delay
            const RETRY_DELAY = 120_000; // 2 minutes (increased from 1 minute)
            setTimeout(() => {
                console.log('[db-connector] Attempting to reconnect to MongoDB after extended delay...');
                connectionCooldown = false;
                connect(0);
            }, RETRY_DELAY);

            throw error; // Throw error so Promise rejects
        }
    })();

    try {
        return await sharedConnectionPromise;
    } catch (error) {
        sharedConnectionPromise = null; // Reset on failure
        throw error;
    }
}

// Setup connection pool monitoring
function setupPoolMonitoring() {
    const client = mongoose.connection.getClient();
    if (client.topology) {
        client.topology.on('timeout', (event) => {
            console.warn('[db-connector] MongoDB operation timeout:', event);
        });

        client.topology.on('error', (error) => {
            console.error('[db-connector] MongoDB topology error:', error);
        });
    }
}

// Setup connection listeners
function setupConnectionListeners() {
    // Remove existing event listeners to avoid duplicate registration
    mongoose.connection.removeAllListeners('disconnected');
    mongoose.connection.removeAllListeners('error');
    mongoose.connection.removeAllListeners('connected');
    mongoose.connection.removeAllListeners('reconnected');
    mongoose.connection.removeAllListeners('connecting');
    mongoose.connection.removeAllListeners('disconnecting');

    mongoose.connection.on('disconnected', handleDisconnect);
    mongoose.connection.on('error', handleError);
    mongoose.connection.on('connected', () => {
        console.log(`[db-connector] MongoDB connection established - ReadyState: ${mongoose.connection.readyState}`);
        isConnected = true;
        connectionAttempts = 0;

        // Emit connection event
        connectionEmitter.emit('connected', {
            isConnected: true,
            lastConnectionTime: new Date(),
            reconnectionAttempts: connectionAttempts
        });
    });
    mongoose.connection.on('reconnected', () => {
        console.log(`[db-connector] MongoDB reconnected - ReadyState: ${mongoose.connection.readyState}`);
        isConnected = true;
        connectionAttempts = 0;

        // Emit reconnection event
        connectionEmitter.emit('reconnected', {
            isConnected: true,
            lastConnectionTime: new Date(),
            reconnectionAttempts: connectionAttempts
        });
    });
    mongoose.connection.on('connecting', () => {
        console.log(`[db-connector] MongoDB connecting... - ReadyState: ${mongoose.connection.readyState}`);
    });
    mongoose.connection.on('disconnecting', () => {
        console.log(`[db-connector] MongoDB disconnecting... - ReadyState: ${mongoose.connection.readyState}`);
    });
}

// Reconnect
async function restart() {
    console.log('[db-connector] Restarting MongoDB connection...');
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        isConnected = false;
        const success = await connect();
        if (!success) {
            console.error('[db-connector] Restart failed to establish connection');
            return false;
        }
        return true;
    } catch (error) {
        console.error('[db-connector] Restart failed:', error);
        return false;
    }
}

// Handle disconnection
async function handleDisconnect() {
    console.log('[db-connector] MongoDB disconnected');
    isConnected = false;

    // Emit disconnection event
    connectionEmitter.emit('disconnected', {
        isConnected: false,
        lastDisconnectionTime: new Date()
    });

    // If already reconnecting, skip
    if (reconnecting) {
        console.log('[db-connector] Reconnection already in progress, skipping...');
        return;
    }

    reconnecting = true;

    // Use exponential backoff for retries
    const backoffTime = calculateBackoffTime(connectionAttempts);
    setTimeout(async () => {
        if (!isConnected && reconnecting) {
            console.log(`[db-connector] Attempting to reconnect after ${Math.round(backoffTime / 1000)} seconds...`);
            try {
                await restart();
            } catch (error) {
                console.error('Reconnection attempt failed:', error);
            } finally {
                reconnecting = false;
            }
        } else {
            reconnecting = false;
        }
    }, backoffTime);
}

// Error handling
async function handleError(error) {
    console.error('[db-connector] MongoDB connection error:', error);
    isConnected = false;

    // If already reconnecting, skip
    if (reconnecting) {
        console.log('[db-connector] Reconnection already in progress (from error handler), skipping...');
        return;
    }

    reconnecting = true;

    // Use exponential backoff for retries
    const backoffTime = calculateBackoffTime(connectionAttempts);
    setTimeout(async () => {
        if (!isConnected && reconnecting) {
            console.log(`[db-connector] Attempting to recover from error after ${Math.round(backoffTime / 1000)} seconds...`);
            try {
                await restart();
            } catch (error) {
                console.error('Recovery attempt failed:', error);
            } finally {
                reconnecting = false;
            }
        } else {
            reconnecting = false;
        }
    }, backoffTime);
}

// Periodic reconnection
//
//  const restartMongo = schedule.scheduleJob(config.restartTime, restart);

// Health check
function checkHealth() {
    return {
        isConnected,
        state: connectionStates[mongoose.connection.readyState],
        connectionAttempts,
        lastError: mongoose.connection.error
    };
}

// Wait for connection to be ready (with timeout)
async function waitForConnection(timeout = 30_000) {
    // If already connected, return immediately
    if (mongoose.connection.readyState === 1 && isConnected) {
        return true;
    }

    // If connecting, wait for connection to complete
    if (mongoose.connection.readyState === 2) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, timeout);

            mongoose.connection.once('connected', () => {
                clearTimeout(timeoutId);
                resolve(true);
            });

            mongoose.connection.once('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    // If disconnected, try to connect
    if (mongoose.connection.readyState === 0) {
        try {
            await connect();
            return mongoose.connection.readyState === 1 && isConnected;
        } catch (error) {
            throw error;
        }
    }

    // For other states, wait with polling
    const startTime = Date.now();
    while ((Date.now() - startTime) < timeout) {
        if (mongoose.connection.readyState === 1 && isConnected) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error('Connection timeout');
}

// Transaction support
async function withTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

// Graceful disconnect function
async function disconnect() {
    try {
        console.log('[db-connector] Disconnecting from MongoDB...');
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('[db-connector] Successfully disconnected from MongoDB');
        } else {
            console.log('[db-connector] MongoDB connection already closed or not connected');
        }
        isConnected = false;
    } catch (error) {
        console.error('[db-connector] Error during disconnect:', error);
        throw error;
    }
}

// Initial connection
let retryInterval = null;

async function initializeConnection() {
    // Prevent duplicate initialization
    if (isInitializing) {
        console.log('[db-connector] MongoDB initialization already in progress, skipping...');
        return;
    }

    if (isConnected) {
        console.log('[db-connector] MongoDB already connected, skipping initialization...');
        return;
    }

    isInitializing = true;

    try {
        console.log('[db-connector] Initializing MongoDB connection...');
        const success = await connect();
        if (!success) {
            console.error('[db-connector] Failed to establish initial MongoDB connection after all retries');
            // Setup periodic retry
            if (retryInterval) {
                clearInterval(retryInterval);
            }
            retryInterval = setInterval(async () => {
                try {
                    const retrySuccess = await connect();
                    if (retrySuccess) {
                        clearInterval(retryInterval);
                        retryInterval = null;
                        console.log('[db-connector] Successfully connected to MongoDB after retries');
                    }
                } catch (error) {
                    console.error('[db-connector] Retry connection error:', error);
                }
            }, config.maxRetryInterval);
        }
    } catch (error) {
        console.error('[db-connector] Initial connection error:', error);
        // Setup periodic retry
        if (retryInterval) {
            clearInterval(retryInterval);
        }
        retryInterval = setInterval(async () => {
            try {
                const retrySuccess = await connect();
                if (retrySuccess) {
                    clearInterval(retryInterval);
                    retryInterval = null;
                    console.log('[db-connector] Successfully connected to MongoDB after retries');
                }
            } catch (error) {
                console.error('[db-connector] Retry connection error:', error);
            }
        }, config.maxRetryInterval);
    } finally {
        isInitializing = false;
    }
}

// Start initial connection - Execute only once
let initialized = false;
if (!initialized) {
    initialized = true;
    initializeConnection().catch(error => {
        console.error('Failed to initialize MongoDB connection:', error);
    });
}



// Export
module.exports = {
    mongoose,
    checkHealth,
    waitForConnection,
    restart,
    connect,    
    disconnect,
    withTransaction,
    connectionEmitter
};