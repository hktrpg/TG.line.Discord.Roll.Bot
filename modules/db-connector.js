"use strict";

// Requirements
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
// const dbWatchdog = require('./dbWatchdog.js'); // Removed to break circular dependency
// const schedule = require('node-schedule');

// 配置參數
const config = {
    mongoUrl: process.env.mongoURL,
    maxRetries: 5,
    baseRetryInterval: 1000,  // 基礎重試間隔
    maxRetryInterval: 30_000,  // 最大重試間隔
    restartTime: '30 04 */3 * *',
    connectTimeout: 180_000,    // 3 minutes (increased for sharding)
    socketTimeout: 180_000,     // 3 minutes (increased for sharding)
    poolSize: 12,              // 連線池大小 - Reduced for multi-shard environment (每個 cluster 3 個連接)
    minPoolSize: 5,           // 最小連線池大小 - Reduced
    heartbeatInterval: 15_000,  // 心跳檢測間隔 - Increased to reduce load
    serverSelectionTimeout: 60_000,  // Increased to 60 seconds for better stability with multiple shards
    maxIdleTimeMS: 60_000,     // 最大閒置時間 - Increased to reduce connection churn
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

// 延遲加載 dbWatchdog 以避免循環依賴
function getDbWatchdog() {
    try {
        return require('./dbWatchdog.js');
    } catch (error) {
        // 如果加載失敗，靜默忽略
        return null;
    }
}
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
        console.log('MongoDB connection already active, skipping...');
        return true;
    }

    // 如果正在冷卻期，等待一下
    if (connectionCooldown) {
        console.log('Connection in cooldown period, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        connectionCooldown = false;
    }

    // 如果有正在進行的連接嘗試，返回該 Promise
    if (sharedConnectionPromise) {
        console.log('Waiting for existing connection attempt...');
        try {
            await sharedConnectionPromise;
            return mongoose.connection.readyState === 1;
        } catch (error) {
            console.log('Existing connection attempt failed, will retry...');
            sharedConnectionPromise = null;
        }
    }

    // 如果正在連接中，等待連接完成
    if (mongoose.connection.readyState === 2) { // connecting
        console.log('MongoDB connection in progress, waiting...');
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 30000);

            mongoose.connection.once('connected', () => {
                clearTimeout(timeout);
                console.log('MongoDB connection established while waiting');
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
            console.log(`Attempting to connect to MongoDB (Attempt ${connectionAttempts}) - ReadyState: ${mongoose.connection.readyState}`);

            // 只有在真正斷開連接時才建立新連接
            if (mongoose.connection.readyState === 0) { // disconnected
                console.log('Creating new MongoDB connection...');
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
            console.log('Waiting for disconnect to complete before reconnecting...');
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

            console.log('Reconnecting after disconnect...');
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
            console.log(`MongoDB connection state is ${mongoose.connection.readyState}, no action needed`);
            return true;
        }

            console.log(`MongoDB connected successfully. Connection state: ${connectionStates[mongoose.connection.readyState]}`);
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
                console.log(`Retrying connection in ${Math.round(backoffTime/1000)} seconds... (${retries + 1}/${config.maxRetries})`);

                // Add jitter to prevent thundering herd
                const jitter = Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffTime + jitter));
                return connect(retries + 1);
            }

            console.error('MongoDB connection failed after all retries. Will retry periodically.');
            // Set cooldown period
            connectionCooldown = true;
            // Schedule a retry after a longer delay
            const RETRY_DELAY = 60000;
            setTimeout(() => {
                console.log('Attempting to reconnect to MongoDB after extended delay...');
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
        console.log(`MongoDB connection established - ReadyState: ${mongoose.connection.readyState}`);
        isConnected = true;
        connectionAttempts = 0;

        // 更新 dbWatchdog 的連接狀態
        const dbWatchdog = getDbWatchdog();
        if (dbWatchdog && dbWatchdog.connectionState) {
            dbWatchdog.connectionState.isConnected = true;
            dbWatchdog.connectionState.lastConnectionTime = new Date();
            dbWatchdog.connectionState.reconnectionAttempts = connectionAttempts;
        }
    });
    mongoose.connection.on('reconnected', () => {
        console.log(`MongoDB reconnected - ReadyState: ${mongoose.connection.readyState}`);
        isConnected = true;
        connectionAttempts = 0;

        // 更新 dbWatchdog 的連接狀態
        const dbWatchdog = getDbWatchdog();
        if (dbWatchdog && dbWatchdog.connectionState) {
            dbWatchdog.connectionState.isConnected = true;
            dbWatchdog.connectionState.lastConnectionTime = new Date();
            dbWatchdog.connectionState.reconnectionAttempts = connectionAttempts;
        }
    });
    mongoose.connection.on('connecting', () => {
        console.log(`MongoDB connecting... - ReadyState: ${mongoose.connection.readyState}`);
    });
    mongoose.connection.on('disconnecting', () => {
        console.log(`MongoDB disconnecting... - ReadyState: ${mongoose.connection.readyState}`);
    });
}

// 重新連線
async function restart() {
    console.log('Restarting MongoDB connection...');
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
    console.log('MongoDB disconnected');
    isConnected = false;

    // 更新 dbWatchdog 的連接狀態
    if (dbWatchdog && dbWatchdog.connectionState) {
        dbWatchdog.connectionState.isConnected = false;
        dbWatchdog.connectionState.lastDisconnectionTime = new Date();
    }

    // 如果已經在重新連接中，跳過
    if (reconnecting) {
        console.log('Reconnection already in progress, skipping...');
        return;
    }

    reconnecting = true;

    // 使用指數退避進行重試
    const backoffTime = calculateBackoffTime(connectionAttempts);
    setTimeout(async () => {
        if (!isConnected && reconnecting) {
            console.log(`Attempting to reconnect after ${Math.round(backoffTime/1000)} seconds...`);
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
        console.log('Reconnection already in progress (from error handler), skipping...');
        return;
    }

    reconnecting = true;

    // 使用指數退避進行重試
    const backoffTime = calculateBackoffTime(connectionAttempts);
    setTimeout(async () => {
        if (!isConnected && reconnecting) {
            console.log(`Attempting to recover from error after ${Math.round(backoffTime/1000)} seconds...`);
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
        console.log('MongoDB initialization already in progress, skipping...');
        return;
    }

    if (isConnected) {
        console.log('MongoDB already connected, skipping initialization...');
        return;
    }

    isInitializing = true;

    try {
        console.log('Initializing MongoDB connection...');
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
                        console.log('Successfully connected to MongoDB after retries');
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
                    console.log('Successfully connected to MongoDB after retries');
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

// 每 5 分鐘印一次連接池狀態（除錯神器）
const MONITORING_INTERVAL = 300000;
setInterval(() => {
    try {
        const client = mongoose.connection.getClient();
        if (client?.topology) {
            const pools = client.topology.s?.description?.servers || [];
            let total = 0;
            for (const server of pools) {
                const pool = server.s?.pool;
                if (pool) total += pool.totalConnectionCount || 0;
            }
            const clusterId = process.env.CLUSTER_ID || process.env.SHARD_ID || 'unknown';
            console.log(`[MongoDB] Current active connections: ${total} (Cluster ${clusterId})`);
        }
    } catch {
        // Silently ignore errors in monitoring
    }
}, MONITORING_INTERVAL);

// 匯出
module.exports = {
    mongoose,
    checkHealth,
    restart,
    connect,
    withTransaction
};