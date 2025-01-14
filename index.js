"use strict";

require('dotenv').config({ override: true });
const fs = require('fs').promises;
const path = require('path');

// 統一的錯誤處理函數
const errorHandler = (error, context) => {
  console.error(`[${new Date().toISOString()}] Error in ${context}:`);
  console.error(error);
};

// 非同步模組載入
async function loadModules() {
  try {
    const modulesDir = path.join(__dirname, 'modules');
    const files = await fs.readdir(modulesDir);
    
    for (const file of files) {
      if (file.match(/\.js$/) && file.match(/^core-/)) {
        const name = file.replace('.js', '');
        try {
          exports[name] = require(path.join(modulesDir, file));
          console.log(`[${new Date().toISOString()}] Successfully loaded module: ${name}`);
        } catch (err) {
          errorHandler(err, `Loading module ${name}`);
        }
      }
    }
  } catch (err) {
    errorHandler(err, 'Reading modules directory');
  }
}

// 啟動應用程式
async function init() {
  try {
    await loadModules();
    console.log(`[${new Date().toISOString()}] Application started successfully`);
  } catch (err) {
    errorHandler(err, 'Initialization');
  }
}

// 處理程序級別的警告
process.on('warning', (warning) => {
  errorHandler(warning, 'Process Warning');
});

// 處理標準輸出錯誤
process.stdout.on('error', (err) => {
  if (err.code === "EPIPE") {
    errorHandler(err, 'STDOUT EPIPE');
  }
});

// 處理未捕獲的異常
process.on('uncaughtException', (err) => {
  errorHandler(err, 'Uncaught Exception');
});

// 處理未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  errorHandler(reason, 'Unhandled Promise Rejection');
});

// 啟動應用
init();

/*
流程解釋

首先這裡會call modules/中的Discord line Telegram 三個檔案
如果在Heroku 有輸入它們各自的TOKEN 的話
服務就會各自啓動

Discord line Telegram三套BOT 都會統一呼叫analytics.js
再由analytics.js 呼叫roll/ 中各個的骰檔

所以基本上,要增加骰組
參考/roll中的DEMO骰組就好

以上, 有不明可以在GITHUB問我

另外, 使用或參考其中代碼的話, 請保持開源
感謝

*/