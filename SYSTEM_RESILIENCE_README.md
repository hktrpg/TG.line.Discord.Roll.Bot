# HKTRPG 系統復原力改進計劃

## 概述

此計劃針對 Discord 機器人常見的故障模式實施全面的系統復原力改進。通過斷路器模式、部分故障處理、健康監控和優雅關機等技術，大幅提升系統的穩定性和可靠性。

## 已實施的改進

### 1. 🔄 MongoDB 連線復原力

**檔案**: `modules/dbWatchdog.js`, `modules/db-connector.js`

**改進內容**:
- 新增斷路器 (Circuit Breaker) 類別防止連鎖故障
- 增強連線監控和自動恢復機制
- 實作指數退避重試策略
- 新增連線池健康檢查

**關鍵特性**:
```javascript
// 斷路器自動保護資料庫操作
await dbWatchdog.executeDatabaseOperation(async () => {
    // 資料庫操作
}, 'operation_name');
```

### 2. 🔗 分群部分故障處理

**檔案**: `modules/discord_bot.js`

**改進內容**:
- 修改 `count()` 和 `count2()` 函數以處理個別分群失敗
- 實作 `collectClusterStats()` 輔助函數
- 即使部分分群離線也能顯示可用統計資料

**效果**: 即使有些 shard 當機，統計功能仍能正常顯示可用資料。

### 3. ⚡ 互動逾時預防

**檔案**: `modules/discord_bot.js`

**改進內容**:
- 優化 `__handlingInteractionMessage()` 函數
- 新增互動處理效能監控
- 改善錯誤處理和逾時管理

### 4. 📊 健康監控系統

**檔案**: `modules/healthMonitor.js`

**功能特性**:
- 即時系統健康狀態監控
- 自動警報系統
- 互動成功率追蹤
- 分群狀態監控
- 資料庫健康檢查

**使用方式**:
```javascript
// 發出互動處理事件
healthMonitor.emit('interactionProcessed', {
    type: 'command',
    commandName: 'roll',
    duration: 150,
    success: true
});

// 獲取狀態摘要
const summary = healthMonitor.getStatusSummary();
```

### 5. 🔄 優雅關機程序

**檔案**: `modules/core-Discord.js`, `modules/discord_bot.js`

**改進內容**:
- 增強關機信號處理
- 新增資源清理程序
- 實作超時保護機制

### 6. 📈 監控儀表板

**檔案**: `views/health-dashboard.html`

**功能**:
- 即時系統狀態視覺化
- 互動統計圖表
- 分群健康狀態
- 警報管理介面

## 部署指南

### 步驟 1: 確保 MongoDB 正常運行

```bash
# 檢查 MongoDB 狀態
sudo systemctl status mongod

# 如果未運行，啟動服務
sudo systemctl start mongod

# 驗證連線
mongosh --port 27069
```

### 步驟 2: 重啟 Discord 機器人

```bash
# 停止現有進程
pkill -f "node.*index.js"

# 重新啟動服務
npm start
# 或
yarn start
```

### 步驟 3: 監控系統健康狀態

1. 使用 `/state` 命令檢查機器人狀態
2. 訪問 `http://your-domain/health-dashboard.html` 查看詳細監控資料
3. 檢查應用程式日誌中的健康報告

### 步驟 4: 驗證改進效果

**測試案例**:
1. **MongoDB 連線中斷**: 停止 MongoDB 服務，觀察系統是否優雅降級
2. **部分分群故障**: 模擬部分 shard 離線，檢查統計功能是否正常
3. **高負載情況**: 測試大量互動時的系統表現
4. **網路不穩定**: 測試網路波動時的恢復能力

## 監控指標

### 關鍵效能指標 (KPIs)

- **互動成功率**: > 95%
- **平均回應時間**: < 2秒
- **分群可用性**: > 80%
- **資料庫連線穩定性**: > 99%

### 警報閾值

- 互動失敗率 > 10%: 警告
- 分群離線 > 50%: 嚴重
- 資料庫斷路器開啟: 嚴重
- 記憶體使用 > 90%: 警告

## 故障排除

### 常見問題

**問題**: 統計顯示 "無法獲取統計資料"
**解決方案**: 檢查 MongoDB 連線和分群狀態

**問題**: 互動經常逾時
**解決方案**: 查看健康監控儀表板，檢查系統負載

**問題**: 分群不斷重啟
**解決方案**: 檢查 MongoDB 連線穩定性，考慮增加連線池大小

### 日誌分析

```bash
# 查看健康監控日誌
tail -f logs/health-monitor.log

# 查看資料庫連線日誌
tail -f log/hktrpg-mongod.log

# 查看 Discord 機器人日誌
tail -f app.log
```

## 效能最佳化

### 建議配置

```javascript
// 在 .env 文件中調整
MONGODB_POOL_SIZE=10
DISCORD_SHARD_COUNT=auto
HEALTH_CHECK_INTERVAL=30000
CIRCUIT_BREAKER_THRESHOLD=5

// 資料庫連線優化
MONGODB_CONNECT_TIMEOUT=120000
MONGODB_SOCKET_TIMEOUT=120000
MONGODB_SERVER_SELECTION_TIMEOUT=30000
```

### 緊急修復步驟

當遇到以下錯誤時的快速修復：

#### 1. MongoDB 連線錯誤
```
MongoDB Connection Error: Server selection timed out after 30000 ms
```

**立即修復**:
```bash
# 檢查 MongoDB 狀態
sudo systemctl status mongod

# 如果停止，重新啟動
sudo systemctl restart mongod

# 檢查網路連線
ping localhost
```

#### 2. TypeError in dbWatchdog
```
TypeError: Cannot read properties of undefined
```

**修復**: 資料庫結構已修復，重新啟動應用程式即可。

#### 3. 互動逾時錯誤
```
Interaction expired before immediate deferral
```

**修復**: 互動處理邏輯已優化，系統會自動重試。

#### 4. 多重 SIGTERM 訊號
```
[Discord Bot] Received SIGTERM signal
```

**修復**: 優雅關機邏輯已改善，只會處理第一個訊號。

### 資源需求

- **CPU**: 至少 2 核心
- **記憶體**: 至少 2GB RAM
- **網路**: 穩定連線，建議使用 CDN
- **儲存**: 足夠的日誌儲存空間

## 未來改進

### 計劃中的功能

1. **自動擴展**: 根據負載動態調整分群數量
2. **分散式追蹤**: 實作分散式追蹤系統
3. **預測性維護**: 使用機器學習預測潛在故障
4. **多區域部署**: 支援跨區域高可用性部署

### 監控增強

1. **Grafana 整合**: 連接到 Grafana 進行進階視覺化
2. **Slack/PagerDuty 整合**: 自動警報通知
3. **長期趨勢分析**: 歷史資料分析和趨勢預測

## 支援與維護

### 定期維護任務

1. **每日**: 檢查健康監控儀表板
2. **每週**: 審查系統日誌和警報
3. **每月**: 效能評估和最佳化
4. **每季**: 安全性更新和依賴升級

### 緊急聯絡

- 檢查健康儀表板: `http://your-domain/health-dashboard.html`
- 系統狀態命令: 在 Discord 中使用 `/state`
- 日誌位置: `/logs/` 目錄

---

## 總結

此系統復原力改進計劃通過多層防護機制大幅提升了 HKTRPG Discord 機器人的穩定性。核心改進包括：

1. **故障隔離**: 斷路器模式防止單點故障影響整個系統
2. **部分降級**: 即使部分元件故障，系統仍能提供基本功能
3. **主動監控**: 即時健康檢查和自動警報系統
4. **優雅處理**: 改進的啟動和關機程序

這些改進將顯著減少停機時間，提升使用者體驗，並為系統的長期穩定運行提供堅實保障。
