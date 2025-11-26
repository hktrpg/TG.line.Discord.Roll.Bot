"use strict";

// Requirements
const EventEmitter = require('events');
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
// const schedule = require('node-schedule');

// 配置參數
const config = {
    mongoUrl: process.env.mongoURL,
    maxRetries: 5,
    baseRetryInterval: 1000,  // 基礎重試間隔
    maxRetryInterval: 30_000,  // 最大重試間隔
    restartTime: '30 04 */3 * *',
    connectTimeout: 30_000,    // Reduced to 30s (fail fast)
    socketTimeout: 45_000,     // Reduced to 45s
    poolSize: 5,               // Reduced for 56 clusters (56 * 5 = 280 connections)
    minPoolSize: 1,            // Minimal connection
    heartbeatInterval: 10_000,  // Frequent check
    serverSelectionTimeout: 5_000,  // Fail fast (5s) to prevent blocking Heartbeat
    maxIdleTimeMS: 30_000,     // Close idle connections faster
    bufferCommands: true,     // Enable command buffering to allow operations before connection
    w: 'majority',            // 寫入確認級別
    retryWrites: true,        // 啟用寫入重試
    autoIndex: true,          // 自動建立索引
    useNewUrlParser: true,    // 使用新的 URL 解析器
    useUnifiedTopology: true  // 使用新的拓撲引擎
};

if (!config.mongoUrl) {
    console.error('MongoDB URL is not configured');
    return;
}

// 連線狀態
let isConnected = false;
let connectionAttempts = 0;
let isInitializing = false; // 防止重複初始化
let reconnecting = false; // 防止重複重新連接
let sharedConnectionPromise = null; // 共享連接 Promise，避免多個 shard 重複建立連接
let connectionCooldown = false; // 連接冷卻期，避免過度連接嘗試

// Event emitter for connection state changes
const connectionEmitter = new EventEmitter();

// const master = require.main?.filename.includes('index');

// MongoDB 配置
mongoose.set('strictQuery', false);
cachegoose(mongoose, {
    engine: 'memory'
});

// 連線狀態監控
const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
};

// 計算指數退避時間
function calculateBackoffTime(attempt) {
    const backoffTime = Math.min(
        config.baseRetryInterval * Math.pow(2, attempt),
        config.maxRetryInterval
    );
    return backoffTime + Math.random() * 1000; // 添加隨機抖動
}

// 建立連線 - 強制只建立一個連接，支援多 shard 共享
async function connect(retries = 0) {
    // 檢查是否已經有活躍連接
    if (mongoose.connection.readyState === 1 && isConnected) {
        console.log('[db-connector] MongoDB connection already active, skipping...');
        return true;
    }

    // 如果正在冷卻期，等待一下
    if (connectionCooldown) {
        console.log('[db-connector] Connection in cooldown period, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        connectionCooldown = false;
    }

    // 如果有正在進行的連接嘗試，返回該 Promise
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

    // 如果正在連接中，等待連接完成
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

    // 建立共享連接 Promise
    sharedConnectionPromise = (async () => {
        try {
            connectionAttempts++;
            console.log(`[db-connector] Attempting to connect to MongoDB (Attempt ${connectionAttempts}) - ReadyState: ${mongoose.connection.readyState}`);

            // 只有在真正斷開連接時才建立新連接
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
                // 等待斷開完成，然後建立新連接
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

            // 監聽連線事件
            setupConnectionListeners();

            // 設置連線池監控
            setupPoolMonitoring();

            return true;
        } catch (error) {
            console.error(`MongoDB Connection Error: ${error.message}`);
            isConnected = false;

            // 特別處理認證錯誤
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

// 設置連線池監控
function setupPoolMonitoring() {
    const client = mongoose.connection.getClient();
    if (client.topology) {
        client.topology.on('timeout', (event) => {
            console.warn('MongoDB operation timeout:', event);
        });
        
        client.topology.on('error', (error) => {
            console.error('MongoDB topology error:', error);
        });
    }
}

// 設置連線監聽器
function setupConnectionListeners() {
    // 移除現有的事件監聽器，避免重複註冊
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

// 重新連線
async function restart() {
    console.log('[db-connector] Restarting MongoDB connection...');
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        isConnected = false;
        const success = await connect();
        if (!success) {
            console.error('Restart failed to establish connection');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Restart failed:', error);
        return false;
    }
}

// 斷線處理
async function handleDisconnect() {
    console.log('[db-connector] MongoDB disconnected');
    isConnected = false;
    
    // Emit disconnection event
    connectionEmitter.emit('disconnected', {
        isConnected: false,
        lastDisconnectionTime: new Date()
    });

    // 如果已經在重新連接中，跳過
    if (reconnecting) {
        console.log('[db-connector] Reconnection already in progress, skipping...');
        return;
    }

    reconnecting = true;

    // 使用指數退避進行重試
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

// 錯誤處理
async function handleError(error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    
    // 如果已經在重新連接中，跳過
    if (reconnecting) {
        console.log('[db-connector] Reconnection already in progress (from error handler), skipping...');
        return;
    }

    reconnecting = true;

    // 使用指數退避進行重試
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

// 定期重新連線
// const restartMongo = schedule.scheduleJob(config.restartTime, restart);

// 健康檢查
function checkHealth() {
    return {
        isConnected,
        state: connectionStates[mongoose.connection.readyState],
        connectionAttempts,
        lastError: mongoose.connection.error
    };
}

// 事務支援
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

// 初始連線
let retryInterval = null;

async function initializeConnection() {
    // 防止重複初始化
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
            console.error('Failed to establish initial MongoDB connection after all retries');
            // 設置定期重試
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
                    console.error('Retry connection error:', error);
                }
            }, config.maxRetryInterval);
        }
    } catch (error) {
        console.error('Initial connection error:', error);
        // 設置定期重試
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
                console.error('Retry connection error:', error);
            }
        }, config.maxRetryInterval);
    } finally {
        isInitializing = false;
    }
}

// 啟動初始連線 - 只執行一次
let initialized = false;
if (!initialized) {
    initialized = true;
    initializeConnection().catch(error => {
        console.error('Failed to initialize MongoDB connection:', error);
    });
}

// 匯出
module.exports = {
    mongoose,
    checkHealth,
    restart,
    connect,
    withTransaction,
    connectionEmitter
};