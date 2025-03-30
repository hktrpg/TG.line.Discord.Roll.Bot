"use strict";

const fs = require('fs').promises;
const path = require('path');

// 測試配置
const config = {
    logFile: 'restart-test.log',
    errorFile: 'restart-test-error.log',
    restartCountFile: 'restart-count.txt'
};

// 日誌系統
class Logger {
    constructor() {
        this.logFile = config.logFile;
        this.errorFile = config.errorFile;
    }

    async log(message, isError = false) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        const file = isError ? this.errorFile : this.logFile;
        try {
            await fs.appendFile(file, logMessage, 'utf8');
            console.log(logMessage.trim());
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }
}

const logger = new Logger();

// 重啟計數器
async function getRestartCount() {
    try {
        const data = await fs.readFile(config.restartCountFile, 'utf8');
        return parseInt(data, 10) || 0;
    } catch (error) {
        await logger.log('No restart count file found, starting from 0', true);
        return 0;
    }
}

async function incrementRestartCount() {
    try {
        const count = await getRestartCount();
        await fs.writeFile(config.restartCountFile, (count + 1).toString(), 'utf8');
        await logger.log(`Incremented restart count to ${count + 1}`);
        return count + 1;
    } catch (error) {
        await logger.log(`Failed to increment restart count: ${error.message}`, true);
        return 0;
    }
}

// 模擬錯誤
async function simulateError() {
    const count = await getRestartCount();
    await logger.log(`Current restart count: ${count}`);

    // 模擬不同的錯誤情況
    switch (count % 3) {
        case 0:
            // 模擬未捕獲的異常
            await logger.log('Simulating uncaught exception...');
            throw new Error('Simulated uncaught exception');
        case 1:
            // 模擬未處理的 Promise rejection
            await logger.log('Simulating unhandled promise rejection...');
            return Promise.reject(new Error('Simulated unhandled promise rejection'));
        case 2:
            // 模擬初始化錯誤
            await logger.log('Simulating initialization error...');
            throw new Error('Simulated initialization error');
    }
}

// 主程序
async function main() {
    try {
        await logger.log('Starting test application...');
        
        // 模擬一些正常操作
        await logger.log('Simulating normal operation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模擬錯誤
        await simulateError();
        
        // 如果沒有錯誤，等待一段時間
        await logger.log('No error occurred, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        await logger.log(`Error occurred: ${error.message}`, true);
        await incrementRestartCount();
        throw error; // 重新拋出錯誤以觸發重啟
    }
}

// 啟動程序
main().catch(async (error) => {
    await logger.log('Application will restart due to error...', true);
    // 這裡不需要手動重啟，因為 index.js 會處理重啟
});

// 處理正常關閉
process.on('SIGTERM', async () => {
    await logger.log('Received SIGTERM signal, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    await logger.log('Received SIGINT signal, shutting down gracefully...');
    process.exit(0);
}); 