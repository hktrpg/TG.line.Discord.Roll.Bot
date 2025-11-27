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
    restartTime: '30 04 */3 * *',
    connectTimeout: 180_000,    // 3 minutes (increased for sharding)
    socketTimeout: 180_000,     // 3 minutes (increased for sharding)
    poolSize: 5,                // Connection pool size - Optimized for 28+ shards (reduced from 12 to 5 per shard)
    minPoolSize: 2,             // Minimum connection pool size - Reduced from 5 to 2
    heartbeatInterval: 15_000,  // Heartbeat detection interval - Increased to reduce load
    serverSelectionTimeout: 60_000,  // Increased to 60 seconds for better stability with multiple shards
    maxIdleTimeMS: 90_000,      // Maximum idle time - Increased from 60s to 90s to close idle connections faster
    bufferCommands: true,     // Enable command buffering to allow operations before connection
    w: 'majority',            // Write confirmation level
    retryWrites: true,        // Enable write retries
    autoIndex: process.env.DEBUG,  // Enable auto-indexing only in debug mode
    useNewUrlParser: true,    // Use new URL parser
    useUnifiedTopology: true  // Use new topology engine
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
                    autoIndex: config.autoIndex,
                    useNewUrlParser: config.useNewUrlParser,
                    useUnifiedTopology: config.useUnifiedTopology
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
                autoIndex: config.autoIndex,
                useNewUrlParser: config.useNewUrlParser,
                useUnifiedTopology: config.useUnifiedTopology
            });
        } else {
            console.log(`[db-connector] MongoDB connection state is ${mongoose.connection.readyState}, no action needed`);
            return true;
        }

            console.log(`[db-connector] MongoDB connected successfully. Connection state: ${connectionStates[mongoose.connection.readyState]}`);
            isConnected = true;
            connectionAttempts = 0;

            // Listen for connection events
            setupConnectionListeners();

            // Setup connection pool monitoring
            setupPoolMonitoring();

            return true;
        } catch (error) {
            console.error(`MongoDB Connection Error: ${error.message}`);
            isConnected = false;

            // Special handling for authentication errors
            if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
                console.error('MongoDB Authentication Error: Please check your credentials');
            }

            if (retries < config.maxRetries) {
                const backoffTime = calculateBackoffTime(retries);
                console.log(`[db-connector] Retrying connection in ${Math.round(backoffTime/1000)} seconds... (${retries + 1}/${config.maxRetries})`);

                // Add jitter to prevent thundering herd
                const jitter = Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffTime + jitter));
                return connect(retries + 1);
            }

            console.error('MongoDB connection failed after all retries. Will retry periodically.');
            // Set cooldown period
            connectionCooldown = true;
            // Schedule a retry after a longer delay
            const RETRY_DELAY = 60_000;
            setTimeout(() => {
                console.log('[db-connector] Attempting to reconnect to MongoDB after extended delay...');
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
            console.log(`[db-connector] Attempting to reconnect after ${Math.round(backoffTime/1000)} seconds...`);
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
            console.log(`[db-connector] Attempting to recover from error after ${Math.round(backoffTime/1000)} seconds...`);
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
// const restartMongo = schedule.scheduleJob(config.restartTime, restart);

// Health check
function checkHealth() {
    return {
        isConnected,
        state: connectionStates[mongoose.connection.readyState],
        connectionAttempts,
        lastError: mongoose.connection.error
    };
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
    restart,
    connect,
    withTransaction,
    connectionEmitter
};