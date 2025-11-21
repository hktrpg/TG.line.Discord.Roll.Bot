#!/usr/bin/env node

/**
 * 系統復原力測試腳本
 * 測試關鍵組件是否正常運作
 */

const path = require('path');

// 測試模組載入
console.log('🔍 測試系統組件載入...');

try {
    // 測試 dbWatchdog
    const dbWatchdog = require('../modules/dbWatchdog.js');
    console.log('✅ dbWatchdog 載入成功');

    // 測試 healthMonitor
    const healthMonitor = require('../modules/healthMonitor.js');
    console.log('✅ healthMonitor 載入成功');

    // 測試斷路器功能
    console.log('🔄 測試斷路器功能...');
    const circuitBreaker = dbWatchdog.circuitBreaker;
    console.log(`✅ 斷路器狀態: ${circuitBreaker.state}`);

    // 測試健康監控
    console.log('📊 測試健康監控...');
    const healthReport = dbWatchdog.getHealthReport();
    console.log(`✅ 健康報告狀態: ${healthReport.status}`);

    // 測試健康監控器
    const statusSummary = healthMonitor.getStatusSummary();
    console.log(`✅ 狀態摘要: ${statusSummary.summary}`);

    console.log('\n🎉 所有系統組件測試通過！');
    console.log('\n📋 建議下一步:');
    console.log('1. 重啟 Discord 機器人');
    console.log('2. 監控健康儀表板');
    console.log('3. 檢查 /state 命令輸出');
    console.log('4. 測試部分分群故障場景');

} catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.error('請檢查程式碼語法和依賴項');
    process.exit(1);
}
