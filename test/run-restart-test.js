"use strict";

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// 配置
const config = {
    mainFile: path.join(__dirname, 'restart-test.js'),
    logFile: 'restart-test.log',
    errorFile: 'restart-test-error.log',
    maxRestarts: 5,  // 最大重啟次數
    checkInterval: 1000  // 檢查間隔（毫秒）
};

// 監控重啟
let restartCount = 0;
let childProcess = null;

// 清理舊的日誌文件
async function cleanupLogs() {
    try {
        await fs.writeFile(config.logFile, '', 'utf8');
        await fs.writeFile(config.errorFile, '', 'utf8');
        console.log('Cleaned up old log files');
    } catch (error) {
        console.error('Failed to clean up log files:', error);
    }
}

function startProcess() {
    if (restartCount >= config.maxRestarts) {
        console.log('Max restarts reached, stopping test');
        process.exit(1);
    }

    console.log(`Starting process (attempt ${restartCount + 1}/${config.maxRestarts})...`);
    
    childProcess = spawn('node', [config.mainFile], {
        stdio: 'inherit',
        detached: true
    });

    childProcess.on('error', (error) => {
        console.error('Failed to start process:', error);
        restartCount++;
        setTimeout(startProcess, config.checkInterval);
    });

    childProcess.on('close', (code) => {
        console.log(`Process exited with code ${code}`);
        if (code !== 0) {
            restartCount++;
            if (restartCount < config.maxRestarts) {
                setTimeout(startProcess, config.checkInterval);
            } else {
                console.log('Max restarts reached, stopping test');
                process.exit(1);
            }
        } else {
            console.log('Process completed successfully');
            process.exit(0);
        }
    });
}

// 開始測試
async function startTest() {
    try {
        await cleanupLogs();
        startProcess();
    } catch (error) {
        console.error('Failed to start test:', error);
        process.exit(1);
    }
}

// 處理中斷信號
process.on('SIGINT', () => {
    console.log('Received SIGINT, stopping test...');
    if (childProcess) {
        childProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, stopping test...');
    if (childProcess) {
        childProcess.kill();
    }
    process.exit(0);
});

// 啟動測試
startTest(); 