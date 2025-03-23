"use strict";

// Requirements
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
const schedule = require('node-schedule');

// 配置參數
const config = {
    mongoUrl: process.env.mongoURL,
    maxRetries: 5,
    baseRetryInterval: 1000,  // 基礎重試間隔
    maxRetryInterval: 30000,  // 最大重試間隔
    restartTime: '30 04 */3 * *',
    connectTimeout: 120000,    // 2 minutes
    socketTimeout: 120000,     // 2 minutes
    poolSize: 10,             // 連線池大小
    minPoolSize: 2,           // 最小連線池大小
    heartbeatInterval: 10000,  // 心跳檢測間隔
    serverSelectionTimeout: 5000,
    maxIdleTimeMS: 60000,     // 最大閒置時間
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
const master = require.main?.filename.includes('index');

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

// 建立連線
async function connect(retries = 0) {
    if (isConnected) return;

    try {
        connectionAttempts++;
        console.log(`Attempting to connect to MongoDB (Attempt ${connectionAttempts})`);

        await mongoose.connect(config.mongoUrl, {
            connectTimeoutMS: config.connectTimeout,
            socketTimeoutMS: config.socketTimeout,
            serverSelectionTimeoutMS: config.serverSelectionTimeout,
            maxPoolSize: config.poolSize,
            minPoolSize: config.minPoolSize,
            heartbeatFrequencyMS: config.heartbeatInterval,
            maxIdleTimeMS: config.maxIdleTimeMS,
            w: config.w,
            retryWrites: config.retryWrites,
            autoIndex: config.autoIndex,
            useNewUrlParser: config.useNewUrlParser,
            useUnifiedTopology: config.useUnifiedTopology
        });

        console.log(`MongoDB connected successfully. Connection state: ${connectionStates[mongoose.connection.readyState]}`);
        isConnected = true;
        connectionAttempts = 0;

        // 監聽連線事件
        setupConnectionListeners();

        // 設置連線池監控
        setupPoolMonitoring();

    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        isConnected = false;

        if (retries < config.maxRetries) {
            const backoffTime = calculateBackoffTime(retries);
            console.log(`Retrying connection in ${Math.round(backoffTime/1000)} seconds... (${retries + 1}/${config.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return connect(retries + 1);
        }

        throw new Error(`Failed to connect to MongoDB after ${config.maxRetries} retries: ${error.message}`);
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
    mongoose.connection.on('disconnected', handleDisconnect);
    mongoose.connection.on('error', handleError);
    mongoose.connection.on('connected', () => {
        console.log('MongoDB connection established');
        isConnected = true;
        connectionAttempts = 0;
    });
    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
        connectionAttempts = 0;
    });
    mongoose.connection.on('connecting', () => {
        console.log('MongoDB connecting...');
    });
    mongoose.connection.on('disconnecting', () => {
        console.log('MongoDB disconnecting...');
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
        await connect();
    } catch (error) {
        console.error('Restart failed:', error);
        throw error;
    }
}

// 斷線處理
function handleDisconnect() {
    console.log('MongoDB disconnected');
    isConnected = false;
    
    // 使用指數退避進行重試
    const backoffTime = calculateBackoffTime(connectionAttempts);
    setTimeout(() => {
        if (!isConnected) {
            console.log(`Attempting to reconnect after ${Math.round(backoffTime/1000)} seconds...`);
            restart();
        }
    }, backoffTime);
}

// 錯誤處理
function handleError(error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    
    // 使用指數退避進行重試
    const backoffTime = calculateBackoffTime(connectionAttempts);
    setTimeout(() => {
        if (!isConnected) {
            console.log(`Attempting to recover from error after ${Math.round(backoffTime/1000)} seconds...`);
            restart();
        }
    }, backoffTime);
}

// 定期重新連線
const restartMongo = schedule.scheduleJob(config.restartTime, restart);

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
(async () => {
    try {
        await connect();
    } catch (error) {
        console.error('Initial connection failed:', error);
        process.exit(1);
    }
})();

// 匯出
module.exports = {
    mongoose,
    checkHealth,
    restart,
    connect,
    withTransaction
};