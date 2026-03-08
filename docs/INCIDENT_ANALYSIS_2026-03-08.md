# Incident Analysis: 2026-03-08 MongoDB Connection Failure & Degraded Mode

## 1. 現況摘要 (Current Situation Summary)

### 1.1 系統狀態 (from `top`)

| 項目 | 數值 | 解讀 |
|------|------|------|
| **記憶體** | 4GB total, **35MB free**, 3.4GB used, 524MB buff/cache | **記憶體極度吃緊**，可用幾乎為 0 |
| **Swap** | 27GB total, **9GB used**, 18GB free | 已大量使用 swap，會拖慢 I/O |
| **Load** | 0.82, 0.81, 0.90 | 負載尚可，但搭配 swap 會令響應變慢 |
| **Node 行程** | PID 7958: 128MB RES, **state D**; 30390: 324MB; 31970: 570MB | 其中一行程處於 **D (uninterruptible sleep)**，多為 I/O 或 swap 等待 |

**結論**：主機處於 **記憶體壓力 + 高 swap** 狀態，容易導致 MongoDB 或 Node 連線/心跳超時或失敗。

---

### 1.2 應用程式狀態 (from PM2 logs)

| 現象 | 說明 |
|------|------|
| **MongoDB 連線** | 持續無法就緒：`readyState !== 1`，dbWatchdog 一直報 "MongoDB connection not ready" |
| **Mongoose 緩衝逾時** | 多種操作出現 `Operation xxx buffering timed out after 10000ms`（mynames.find, mynamerecords.findOneAndUpdate, forwardedmessages.findOne, charactergpswitches.findOne, veryimportantpeople.find, trpglevelsystems.insertOne 等） |
| **DB-Protection** | 已進入 **DEGRADED MODE**（改用記憶體快取），且健康檢查持續失敗，無法脫離降級模式 |
| **錯誤計數** | dbWatchdog 錯誤計數曾飆到 180+，之後曾重置（可能因重啟或計數器重置） |

**結論**：應用層面是 **MongoDB 連線長時間不可用**，導致所有依賴 DB 的指令（.meXXX, .myname, .ch, VIP, level config, Records 等）失敗或逾時。

---

## 2. 根因分析 (Root Cause Analysis)

### 2.1 主要根因：MongoDB 連線不可用

- **現象**：`mongoose.connection.readyState` 不為 1（connected），連線從未成功建立或建立後斷開且未再連上。
- **可能原因**（需在伺服器上逐一排查）：
  1. **MongoDB 服務未運行或當掉**（例如 OOM、crash）
  2. **網路問題**：防火牆、網路分割、MongoDB 綁定在 localhost 但 Node 用不同網段
  3. **MongoDB 過載**：連線數或 CPU/磁碟滿載，無法在 `serverSelectionTimeoutMS`（20s）內回應
  4. **主機資源不足**：記憶體與 swap 壓力導致 MongoDB 或 Node 反應變慢，連線/心跳超時

### 2.2 次要因素：主機記憶體與 Swap

- 僅約 **35MB free**、**9GB swap 使用**：
  - 容易觸發 OOM、行程變慢、I/O 等待（與 PID 7958 的 **D 狀態** 一致）
  - MongoDB 或 Node 的連線建立/維持可能因延遲而逾時（例如 `connectTimeoutMS` 30s、`serverSelectionTimeoutMS` 20s）

### 2.3 應用程式行為（與程式碼一致）

- **db-connector.js**：`bufferCommands: true`，未設定 `bufferTimeoutMS`，故使用 Mongoose 預設 **10 秒**；連線未建立時，所有排隊操作會在 10 秒後拋出 "buffering timed out after 10000ms"。
- **db-protection-layer.js**：連續 3 次健康檢查失敗即進入 **DEGRADED MODE**；之後每 30 秒做一次健康檢查，若 `ping` 仍失敗則每 2 分鐘再嘗試脫離降級模式；目前 DB 一直不健康，故持續 "Still in degraded mode - DB health check failed"。

---

## 3. 建議處置 (Recommended Actions)

### 3.1 立即檢查（在伺服器上執行）

1. **確認 MongoDB 是否在跑、有無錯誤**  
   ```bash
   systemctl status mongod
   # 或
   ps aux | findstr mongo
   tail -n 100 /var/log/mongodb/mongod.log
   ```

2. **確認本機能否連到 MongoDB**  
   ```bash
   mongosh "YOUR_MONGO_URI" --eval "db.adminCommand('ping')"
   ```
   （將 `YOUR_MONGO_URI` 換成與 `process.env.mongoURL` 相同之連線字串）

3. **檢視記憶體與 swap**  
   ```bash
   free -h
   ```
   若 free 極低且 swap 使用高，重啟前可考慮先釋放非必要服務或暫時增加 swap/記憶體。

### 3.2 短期緩解

1. **若 MongoDB 已停或異常**：重啟 MongoDB，並檢查磁碟與日誌是否有錯誤或權限問題。  
2. **若主機記憶體不足**：  
   - 暫時關閉或縮減其他佔記憶體服務；或  
   - 重啟 Node 應用（PM2 restart）以釋放殘留記憶體（注意：重啟期間仍無法連 DB 則錯誤會持續，需先確保 MongoDB 正常）。  
3. **確認環境變數**：  
   - `mongoURL` 是否正確、MongoDB 是否綁定在該 host/port，且無防火牆阻擋。

### 3.3 程式面可選優化（中長期）

1. **延長緩衝逾時（僅緩解現象，不取代修好連線）**  
   在 `modules/db-connector.js` 的 `mongoose.connect()` 選項中加入：  
   `bufferTimeoutMS: 30000`（或更大），可減少在「連線短暫不穩」時過早拋出 buffering timeout；**根本仍須確保 MongoDB 可連**。

2. **錯誤日誌**  
   目前部分 log 為 `MongooseError undefined`，可考慮在 catch 時輸出 `error.message` 或 `error.reason`，方便日後區分是連線失敗、逾時還是其他錯誤。

3. **監控告警**  
   對 `[DB-Protection] ENTERING DEGRADED MODE` 與 dbWatchdog 的 "MongoDB connection not ready" 設告警，以便在連線問題再次發生時及早處理。

---

## 4. 結論

| 層面 | 結論 |
|------|------|
| **現象** | MongoDB 連線長時間不可用，應用進入並持續處於 DEGRADED MODE；多項 DB 操作 buffering 逾時（10s）。 |
| **根因** | 以 **MongoDB 無法連線或未正常服務** 為主因，**主機記憶體與 swap 壓力** 為可能加重因素。 |
| **優先動作** | 在伺服器上確認 MongoDB 狀態、本機連線測試、必要時重啟 MongoDB 並檢視記憶體/swap；再視情況重啟 Node（PM2）。 |

以上分析基於你提供的 `top` 輸出與 PM2 錯誤日誌，並對照專案內 `db-connector.js`、`db-protection-layer.js` 與 dbWatchdog 的邏輯。

---

## 5. 更新：MongoDB 日誌與 free -h（2026-03-08 補充）

### 5.1 MongoDB 狀態（mongod5.log）

| 項目 | 觀察 |
|------|------|
| **服務** | MongoDB **有在運行**，持續接受連線（Connection accepted）、認證成功（Authentication succeeded）。 |
| **連線數** | `connectionCount` 在 **200–205** 之間浮動（connectionId 達 7165920），連線數偏高。 |
| **用戶端** | 來自 127.0.0.1，Node.js driver 4.17.2，另有 Mongoose 7.0.0\|9.0.1。 |

**結論**：MongoDB 本身沒有掛掉，而是 **Node 端部分 process（例如部分 Discord cluster）的 mongoose 連線未就緒或曾斷開後重連逾時**，導致該 process 一直處於 "connection not ready"；其他已連上的連線仍正常，所以 MongoDB 日誌看到的是「有連線在進出」。

### 5.2 慢查詢（Slow query）

- **Collection**：`hktrpgRollBot.firsttimemessages`
- **操作**：`aggregate`，pipeline 為 `$match: {}` + `$group: { _id: 1, n: { $sum: 1 } }`（即全表 count）
- **planSummary**：**COLLSCAN**，`docsExamined: 250565`，`durationMillis: 501` / 153ms

對照程式碼可知，此查詢來自 **`schema.firstTimeMessage.countDocuments({})`**（無條件計數），用於：

- `modules/analytics.js`：系統狀態報告的使用者數
- `modules/discord_bot.js`：統計「使用者總數」

`countDocuments({})` 會掃描整表，約 25 萬筆時出現數百 ms 的慢查詢屬預期；若頻繁執行會加重 MongoDB 與連線負擔。

### 5.3 記憶體（free -h）

```
Mem:  3.8G total, 3.3G used, 71M free, 432M buff/cache, 414M available
Swap: 25G total, 8.6G used, 17G free
```

- 與先前相比，**free 略升（71M）、available 約 414M**，仍偏緊。
- **Swap 8.6G 使用中**，I/O 與延遲風險仍在。

### 5.4 修正後的根因理解

| 項目 | 說明 |
|------|------|
| **MongoDB** | 服務正常、可連線，但 **連線數約 200+**，且存在 **firsttimemessages 全表 count** 的慢查詢。 |
| **Node** | 部分 cluster 的 mongoose **連線未建立或斷開後在 serverSelectionTimeoutMS（20s）內未重連成功**，可能因：MongoDB 一時負載高、主機記憶體/swap 導致回應變慢、或連線池滿/排隊過久。 |
| **結果** | 這些 process 的 `readyState !== 1`，健康檢查 ping 逾時或失敗 → 進入並維持 DEGRADED MODE，所有 DB 操作 buffering 後 10s 逾時。 |

### 5.5 建議後續動作（依你提供的日誌更新）

1. **讓所有 Node process 重新建立連線**  
   現在已知 MongoDB 有在正常接受連線，可重啟應用讓每個 cluster 重新 connect：  
   ```bash
   pm2 restart all
   ```  
   重啟後觀察是否仍出現 "MongoDB connection not ready" / "Still in degraded mode"。

2. **減輕 firsttimemessages 全表 count 負擔**  
   - 若「使用者總數」不需即時精確值，可改為 **`estimatedDocumentCount()`**（讀取 metadata，O(1)），或  
   - 以定時任務寫入快取、儀表板改讀快取，避免每次請求都跑 `countDocuments({})`。  
   （若你希望，我可以在專案內標出可改為 `estimatedDocumentCount` 或加快取的位置並給 patch。）

3. **持續監控**  
   - MongoDB：連線數（例如 `db.serverStatus().connections`）、慢查詢。  
   - 主機：記憶體與 swap（`free -h`），必要時考慮加 RAM 或減少並行服務。

4. **可選：連線參數**  
   若重啟後仍偶發「重連逾時」，可視情況在 `db-connector.js` 將 `serverSelectionTimeoutMS` 略為調高（例如 30s）或加上 `bufferTimeoutMS`，作為緩解，根本仍建議控制連線數與慢查詢。

---

## 6. countDocuments 全表掃描盤點與改良（2026-03-08）

### 6.1 已改為 estimatedDocumentCount（無條件全表 count）

| 檔案 | Collection | 用途 | 狀態 |
|------|------------|------|------|
| modules/analytics.js | firstTimeMessage | 系統狀態報告「使用者總數」 | 已改 |
| modules/analytics.js | characterCard | 系統狀態報告「角色卡數量」 | 已改 |
| modules/discord_bot.js | firstTimeMessage | 統計「使用者總數」 | 已改 |
| roll/z_Level_system.js | trpgLevelSystemMember | 世界排行榜總人數 (docMemberCount) | 已改 |

### 6.2 保留 countDocuments（有查詢條件，非全表）

| 檔案 | Collection | 查詢條件 | 說明 |
|------|------------|----------|------|
| modules/analytics.js | trpgLevelSystem | { Switch: '1' } | 經驗值群組數，需精確 |
| roll/z_Level_system.js | trpgLevelSystemMember | { EXP: { $gt: myExp.EXP } } | 排名「比我高的人數」 |
| roll/z_async_test.js | translateChannel | { groupid, switch: true } | 群組翻譯頻道數上限檢查 |
| roll/2-coc.js | developmentRollingRecord | groupID, userID, skillName... | 紀錄條數，用於保留最近 10 筆 |
| roll/z_schedule.js | agendaAtHKTRPG | name, data.groupid | .at / .cron 群組上限檢查 |
| roll/z_myname.js | myName | { userID } | 使用者名稱數量 |
| roll/z_role.js | roleReact, roleInvites | { groupid } | 群組角色數 |
| roll/z-story-teller.js | storyRun, story | starterID/ownerID/story 等 | 故事與回合數 |
| modules/records.js | 多處 | roomNumber, filter 等 | 聊天室／轉發訊息數 |

以上皆為「有條件」的 count，需精確值或依條件篩選，**不適合**改為 estimatedDocumentCount；若日後出現慢查詢，應在對應欄位加 index。

---

## 7. first time message 功能改良（2026-03-08）

### 7.1 流程說明

- **firstTimeMessage()**：僅回傳 `assets/message.json` 的 firstTimeUseMessage 文案（記憶體快取），無 DB。
- **newUserChecker(userid, botname)**：判斷是否「首次使用該 bot」；若是則寫入 DB 並回傳 true，呼叫端再送首次歡迎訊息（Line / Discord / Telegram）。

### 7.2 已實作改良

| 項目 | 改良內容 |
|------|----------|
| **Schema 唯一約束** | `firstTimeMessage` 的複合 index 改為 `{ userID: 1, botname: 1, unique: true }`，避免同一 user+bot 重複寫入與並發時發兩次歡迎訊息。 |

**已還原**：曾改為「僅 insert + E11000 視為已存在」。若 DB 尚未建立 unique index，insert 會成功導致舊用戶被當成新用戶而再次收到歡迎訊息，故已改回 **findOne 再 save** 的流程，不依賴 index 是否已存在。

### 7.3 索引遷移（若 DB 已存在）

若 collection `firsttimemessages` 在加 unique 前已有重複的 (userID, botname)，建立 unique index 會失敗。上線前可：

1. 檢查重複：`db.firsttimemessages.aggregate([{$group:{_id:{userID:"$userID",botname:"$botname"}, n:{$sum:1}}}, {$match:{n:{$gt:1}}}])`
2. 若有重複，先刪除重複只留一筆再建 index，或由應用程式重啟後讓 Mongoose 同步 index（無重複時會成功）。
