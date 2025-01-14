"use strict";

// Requirements
const mongoose = require('mongoose');
const cachegoose = require('recachegoose');
const schedule = require('node-schedule');

// 配置參數
const config = {
    mongoUrl: process.env.mongoURL,
    maxRetries: 5,
    retryInterval: 5000,
    restartTime: '30 04 */3 * *',
    connectTimeout: 120000,  // 2 minutes
    socketTimeout: 120000,   // 2 minutes
    poolSize: 10,           // 連線池大小
    heartbeatInterval: 10000 // 心跳檢測間隔
};

if (!config.mongoUrl) return;

// 連線狀態
let isConnected = false;
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

// 建立連線
async function connect(retries = 0) {
    if (isConnected) return;

    try {
        await mongoose.connect(config.mongoUrl, {
            connectTimeoutMS: config.connectTimeout,
            socketTimeoutMS: config.socketTimeout,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: config.poolSize,
            minPoolSize: 2,
            heartbeatFrequencyMS: config.heartbeatInterval,
            autoIndex: true,
            retryWrites: true
        });

        console.log(`MongoDB connected successfully. Connection state: ${connectionStates[mongoose.connection.readyState]}`);
        isConnected = true;

        // 監聽連線事件
        setupConnectionListeners();

    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        isConnected = false;

        if (retries < config.maxRetries) {
            console.log(`Retrying connection... (${retries + 1}/${config.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, config.retryInterval));
            return connect(retries + 1);
        }

        throw new Error('Failed to connect to MongoDB after max retries');
    }
}

// 設置連線監聽器
function setupConnectionListeners() {
    mongoose.connection.on('disconnected', handleDisconnect);
    mongoose.connection.on('error', handleError);
    mongoose.connection.on('connected', () => {
        console.log('MongoDB connection established');
        isConnected = true;
    });
    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
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
    setTimeout(() => {
        if (!isConnected) restart();
    }, config.retryInterval);
}

// 錯誤處理
function handleError(error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    setTimeout(() => {
        if (!isConnected) restart();
    }, config.retryInterval);
}

// 定期重新連線
const restartMongo = schedule.scheduleJob(config.restartTime, restart);

// 健康檢查
function checkHealth() {
    return {
        isConnected,
        state: connectionStates[mongoose.connection.readyState],
        poolSize: mongoose.connection.getClient().topology?.s?.poolSize || 0
    };
}

// 初始連線
(async () => {
    try {
        await connect();
    } catch (error) {
        console.error('Initial connection failed:', error);
    }
})();

// 匯出
module.exports = {
    mongoose,
    checkHealth,
    restart,
    connect
};