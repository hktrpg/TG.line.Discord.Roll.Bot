# SIGINT/SIGTERM 觸發機制分析

## 重要發現：代碼中沒有直接發送 SIGINT/SIGTERM

**所有信號都是從外部接收的**，主要是由 **PM2** 發送。但以下機制可能間接導致 PM2 發送信號：

---

## 1. 直接 process.exit() 調用

### modules/discord_bot.js

**位置 1: gracefulShutdown() 函數**
```javascript
// Line 723
process.exit(0);  // 正常關閉
// Line 727  
process.exit(1);  // 錯誤關閉
```

**觸發條件：**
- 收到 SIGINT/SIGTERM 信號時
- 關閉超時後強制退出

**位置 2: 信號處理器中的超時退出**
```javascript
// Line 743, 761
shutdownTimeout = setTimeout(() => {
    process.exit(1);  // 15秒超時後強制退出
}, 15_000);
```

### modules/core-Discord.js

**位置 1: gracefulShutdown() 中的 broadcastEval**
```javascript
// Line 152
await manager.broadcastEval(async (client) => {
    // ...
    process.exit(0);  // 每個子進程都會退出
}, { timeout: 15_000 });
```

**位置 2: gracefulShutdown() 最後**
```javascript
// Line 159
process.exit(0);  // Cluster Manager 退出
// Line 163
process.exit(1);  // 錯誤時退出
```

**位置 3: 信號處理器超時**
```javascript
// Line 324, 342
shutdownTimeout = setTimeout(() => {
    process.exit(1);  // 30秒超時後強制退出
}, 30_000);
```

**位置 4: spawn 失敗**
```javascript
// Line 378
manager.spawn({...}).catch(error => {
    process.exit(1);  // 啟動失敗時退出
});
```

### index.js

**位置 1: gracefulShutdown()**
```javascript
// Line 356
process.exit(0);  // 主進程正常退出
```

**位置 2: unhandledRejection 處理**
```javascript
// Line 464
gracefulShutdown(moduleManager);  // 最終會調用 process.exit(0)
```

---

## 2. Cluster Respawn 機制（可能間接觸發 PM2 重啟）

### modules/discord_bot.js

**位置 1: respawnCluster() - 錯誤重試**
```javascript
// Line 790-802
function respawnCluster(err) {
    if (!/CLUSTERING_NO_CHILD_EXISTS/i.test(err.toString())) return;
    // ...
    if (errorCount[number] > 3) {
        client.cluster.evalOnManager(`this.clusters.get(${client.cluster.id}).respawn({ delay: 7000, timeout: -1 })`);
    }
}
```

**觸發條件：**
- `count2()` 函數出錯時 (Line 578)
- Cluster 錯誤超過 3 次

**位置 2: respawnCluster2() - 直接重啟**
```javascript
// Line 803-809
function respawnCluster2() {
    client.cluster.evalOnManager(`this.clusters.get(${client.cluster.id}).respawn({ delay: 7000, timeout: -1 })`);
}
```

**觸發條件：**
- MongoDB 連接失敗時 (Line 112)
- 用戶命令觸發 (Line 1527: `rplyVal.respawn`)

**位置 3: Heartbeat Monitor 觸發的 Respawn**
```javascript
// Line 271-274
if (heartbeat > CRITICAL_THRESHOLD) {
    for (const shardId of isAwake) {
        client.cluster.evalOnManager(`this.clusters.get(${shardId}).respawn({ delay: 7000, timeout: -1 })`);
    }
}
```

**觸發條件：**
- Heartbeat 檢查失敗超過 5 次
- 有 shard 下線

### modules/core-Discord.js

**位置 1: Cluster Death 事件**
```javascript
// Line 217-227
if (event === 'death') {
    setTimeout(() => {
        shard.respawn({ timeout: 60_000 });  // 子進程死亡時重啟
    }, RETRY_DELAY);
}
```

**位置 2: 手動 Respawn 消息**
```javascript
// Line 243-259
if (message.respawn === true) {
    await targetCluster.respawn({ delay: 1000, timeout: 60_000 });
}
```

**位置 3: 全部重啟消息**
```javascript
// Line 262-272
if (message.respawnall === true) {
    await manager.respawnAll({...});
}
```

**位置 4: 定時維護任務**
```javascript
// Line 279-292
agenda.define('dailyDiscordMaintenance', async () => {
    await manager.respawnAll({...});  // 每日維護時重啟所有 cluster
});
```

---

## 3. 服務器重啟機制（最嚴重）

### modules/discord_bot.js

**位置: startHeartbeatMonitor()**
```javascript
// Line 250-252
const restartServer = () => {
    require('child_process').exec('sudo reboot');  // ⚠️ 重啟整個服務器
}

// Line 283-285
if (heartbeat > 20) {
    restartServer();  // Heartbeat 失敗 20 次後重啟服務器
}
```

**觸發條件：**
- Heartbeat 檢查連續失敗 20 次（約 20 分鐘）
- 這會導致**所有進程**收到 SIGTERM/SIGINT（因為整個系統重啟）

---

## 4. 錯誤處理導致的退出

### index.js

**位置: unhandledRejection**
```javascript
// Line 447-466
process.on('unhandledRejection', (reason) => {
    // 數據庫錯誤不關閉
    if (reason.message && reason.message.includes('MongoDB')) {
        return;
    }
    // 其他錯誤會觸發關閉
    gracefulShutdown(moduleManager);  // → process.exit(0)
});
```

**位置: uncaughtException**
```javascript
// Line 414-417
process.on('uncaughtException', (err) => {
    errorHandler(err, 'Uncaught Exception');
    gracefulShutdown(moduleManager);  // → process.exit(0)
});
```

---

## 5. PM2 自動重啟觸發的場景

當以下情況發生時，PM2 會自動重啟並發送 SIGTERM/SIGINT：

1. **進程異常退出** (exit code !== 0)
2. **內存超限** (`max_memory_restart` 觸發)
3. **進程崩潰** (uncaught exception)
4. **PM2 監控檢測到問題**
5. **Respawn 操作導致進程退出** - 這可能是關鍵！

---

## 關鍵發現：Respawn 可能觸發 PM2 重啟

**問題鏈：**

1. **Respawn 操作** (`cluster.respawn()` 或 `manager.respawnAll()`)
   - 會終止舊的子進程
   - 創建新的子進程

2. **PM2 檢測到進程退出**
   - PM2 監控到子進程退出
   - 可能誤判為應用崩潰

3. **PM2 自動重啟**
   - PM2 發送 SIGTERM/SIGINT 給主進程
   - 嘗試重啟整個應用

---

## 建議的解決方案

### 1. 減少不必要的 Respawn

**問題代碼：**
```javascript
// modules/discord_bot.js Line 112
if (!dbStatus && checkMongodb.isDbRespawn()) {
    respawnCluster2();  // MongoDB 連接問題時立即 respawn
}
```

**建議：** 添加重試機制，避免立即 respawn

### 2. 優化 Heartbeat Monitor

**問題代碼：**
```javascript
// Line 283-285
if (heartbeat > 20) {
    restartServer();  // 重啟整個服務器太激進
}
```

**建議：** 
- 增加閾值（例如 30-40）
- 添加更詳細的日誌
- 考慮只重啟有問題的 cluster，而不是整個服務器

### 3. 添加 Respawn 日誌追蹤

在每次 respawn 時記錄詳細信息，幫助診斷是否 respawn 觸發了 PM2 重啟。

### 4. PM2 配置優化

確保 PM2 配置正確：
- `max_memory_restart: "600M"` ✅
- `kill_timeout: 30000` ✅
- `max_restarts: 10` ✅
- `min_uptime: "60s"` ✅

---

## 總結

**代碼中沒有直接發送 SIGINT/SIGTERM**，但以下機制可能間接觸發：

1. ✅ **process.exit()** - 正常關閉流程
2. ⚠️ **Respawn 操作** - 可能導致 PM2 誤判並重啟
3. ⚠️ **Heartbeat Monitor** - 可能觸發過多 respawn
4. ⚠️ **錯誤處理** - 未處理的錯誤導致退出
5. 🔴 **sudo reboot** - 重啟整個服務器（最嚴重）

**最可能的原因：** Respawn 操作導致進程頻繁退出，PM2 檢測到後自動重啟並發送 SIGTERM。

