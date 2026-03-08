# DB-Related Optimizations (2026-03-08)

## 1. Level 功能

### 1.1 已實作

| 項目 | 說明 |
|------|------|
| **排名改為 countDocuments** | `modules/level.js` 的 `returnTheLevelWord` 原本用 `find({ groupid }).sort({ EXP: -1 })` 載入全群組成員再算排名，改為 `countDocuments({ groupid, EXP: { $gt: userInfo.EXP } }) + 1`，只做一次計數，大群組可大幅減少記憶體與 I/O。 |
| **複合索引** | `modules/schema.js` 的 `trpgLevelSystemMember` 新增 `{ groupid: 1, EXP: -1 }`，供上述排名查詢使用。 |
| **錯誤日誌** | level.js 內 MongoDB 錯誤改為輸出 `error.reason ?? error.message`，避免只顯示 "MongooseError undefined"。 |

### 1.2 群組「是否有開 LEVEL」快取（減少每次檢查 DB）

| 項目 | 說明 |
|------|------|
| **gpInfoCache** | `modules/level.js` 新增 in-memory 快取：key = groupid，value = 群組 level 設定（僅當 SwitchV2 為 true 時才快取）。TTL 5 分鐘、上限 2000 群。 |
| **getGroupLevelConfig(groupid)** | 先查快取，未命中或過期才 `findOne({ groupid, SwitchV2: true }).lean()` 並寫入快取。供 EXPUP 與 `.level show` / `.level showMe` 使用。 |
| **invalidateGroupConfig(groupid)** | 當群組變更 level 設定（.level config / LevelUpWord / RankWord / TitleWord）時由 `z_Level_system.js` 呼叫，清除該群快取，下次請求會重新讀 DB。 |

效果：同一群組在 5 分鐘內多次發言或查詢時，只會打一次 DB 取「是否有開 level + 設定」，其餘用快取。

### 1.3 其餘 Level 相關（z_Level_system.js）

- 多處 `findOne({ groupid })` 已有 `groupid` 單欄索引或複合索引，負載不高時可維持現狀。
- 若日後有「世界排名」或「群組前 N 名」的慢查詢，可再針對對應查詢加索引或改用 `estimatedDocumentCount`／快取。

---

## 2. First time message

### 2.1 已實作

| 項目 | 說明 |
|------|------|
| **findOne().lean()** | `modules/message.js` 的 `newUserChecker` 中 `findOne({ userID, botname })` 改為 `.lean()`，只判斷是否存在，不需建完整 Mongoose document，略省記憶體與 CPU。 |

### 2.2 既有設計（無改動）

- 已有 24 小時 TTL 的 in-memory cache，避免重複查 DB。
- Schema 已有 `{ userID: 1, botname: 1, unique: true }`。
- 使用者總數在 analytics / discord_bot 已用 `estimatedDocumentCount()`，無全表 countDocuments。

---

## 3. 其他 DB 相關可選優化

| 位置 | 建議 | 優先度 |
|------|------|--------|
| **z_Level_system.js / 其他** | 多處 `.catch(error => console.error(..., error.name, error.reason))` 可改為 `error.reason ?? error.message`，方便除錯。 | 低 |
| **tempSwitchV2 (level.js)** | 目前以陣列存 `{ groupid, SwitchV2 }`，群組很多時可考慮改為 Map 或以 LRU 限制筆數，避免無界成長。 | 低 |
| **trpgLevelSystem findOne** | 多數查詢已用 `.cache(60)` 或 `.lean()`，維持即可。 | - |

---

## 4. 索引一覽（與本次相關）

| Collection | 索引 | 用途 |
|------------|------|------|
| trpgLevelSystemMember | `{ groupid: 1, userid: 1 }` | findOne 單一用戶 |
| trpgLevelSystemMember | `{ groupid: 1, EXP: -1 }` | 排名 countDocuments(EXP > x) |
| firstTimeMessage | `{ userID: 1, botname: 1, unique: true }` | newUserChecker 查詢與防重複 |

Mongoose 啟動時會同步 schema 內宣告的 index；若 DB 已存在且尚未有 `trpgLevelSystemMember.groupid_1_EXP_-1`，重啟應用後會自動建立。

---

## 5. Per-message DB 稽核（每則訊息是否打 DB）

每則訊息共同流程：`handlingResponMessage` → `analytics.parseInput`（含 EXPUP、z_stop、rolldice）→ 依指令前綴進入各 roll 模組。

| 項目 | 是否每則訊息打 DB | 說明 |
|------|-------------------|------|
| **Level (EXPUP)** | 是（已優化） | 有 groupid 的訊息都會跑 EXPUP。現用 `getGroupLevelConfig`（5 分鐘快取）與 member `.cache(60)`，多數為 0～1 次 DB。 |
| **Block (z_stop)** | 否 | 阻擋清單在啟動時由 `records.get('block')` 載入記憶體（`save.save`），每則只查記憶體。 |
| **VIP** | 否 | 僅在「執行到會檢查 VIP 的指令」時才用（如 .at、.cron、.bk add、z_character 等）；且 `veryImportantPerson.js` 有 5 分鐘快取，非每則訊息打 DB。 |
| **First-time (newUserChecker)** | 僅有回覆時 | 在 `parseInput` 之後、有 `rplyVal.text` 且 mongoURL 時才呼叫；且有 24 小時 userCache，重複使用者不重打。 |
| **courtMessage (logs.js)** | 否 | 僅更新記憶體計數（RollingLog.*），`saveLog` 已註解，無每則寫 DB。 |
| **其餘 DB** | 否（依指令） | characterCard / characterGpSwitch、trpgLevelSystem（.level show）、agendaAtHKTRPG（.at/.cron）、translateChannel、z_trpgDatabase 等，皆在「該指令被觸發」時才查，非每則訊息。 |

結論：除 **Level (EXPUP)** 與 **First-time（有回覆且未命中 cache）** 外，沒有其他「每則訊息都會檢查 DB」的邏輯；Level 已用快取壓低負載。

---

## 6. 各項目優化方案檢查及說明

針對「每則訊息相關」的五個項目：目前狀態、已做優化、可選優化方案如下。

### 6.1 Level (EXPUP)

| 項目 | 說明 |
|------|------|
| **目前狀態** | 有 groupid 的每則訊息都會跑 EXPUP；群組設定用 `getGroupLevelConfig`（gpInfoCache 5 分鐘），成員用 `findOne(...).cache(60)`（recachegoose 記憶體快取 60 秒），升級時會 `userInfo.save()` 與 `returnTheLevelWord` 內一次 `countDocuments`（排名）。 |
| **已做優化** | gpInfoCache、getGroupLevelConfig、invalidateGroupConfig；排名改 countDocuments + 複合索引；member 查詢 .cache(60)。 |
| **可選優化** | **(1)** 若希望再減 DB 讀取：可將 member 查詢的 `.cache(60)` 改為較長 TTL（例如 120～300 秒），需權衡「等級/EXP 更新延遲」是否可接受。**(2)** `tempSwitchV2` 為陣列且無上限，群組數極多時可改為 Map 或 LRU、並在「群組從未開 level」時限制筆數，避免記憶體無界成長（見 §3）。**(3)** 不建議對 EXP 寫入做「每 N 則或每 M 秒才寫一次」的批次化，會改變語意且實作複雜。 |

### 6.2 Block (z_stop)

| 項目 | 說明 |
|------|------|
| **目前狀態** | 阻擋清單在啟動時以 `records.get('block')` 載入 `save.save`；每則訊息只做 `save.save.find(...)` 與 `groupInfo.blockfunction.find(...)`，不打 DB。`.bk add` / `.bk del` 會寫 DB 並立即 `save.save = await records.get('block')` 重載，行為正確。 |
| **已做優化** | 無需 DB 優化（已全記憶體）。 |
| **可選優化** | **(1)** 若群組與關鍵字數量很大：可將「依 groupid 找該群 block 清單」改為 `Map<groupid, blockfunction[]>`，查詢 O(1)。**(2)** 關鍵字比對維持現狀即可；若單群關鍵字極多再考慮用 Set 或 Trie（實作成本較高）。 |

### 6.3 VIP

| 項目 | 說明 |
|------|------|
| **目前狀態** | 僅在執行到會檢查 VIP 的指令時才呼叫（如 .at、.cron、.bk add、.char 等）；`veryImportantPerson.js` 內 `refreshCache()` 每 5 分鐘最多打一次 `schema.veryImportantPerson.find({})`，其餘用記憶體 `vipCache`。 |
| **已做優化** | 5 分鐘快取，非每則訊息打 DB。 |
| **可選優化** | **(1)** `find({})` 可改為 `find({}).lean()`，減少回傳物件大小與記憶體。**(2)** 若 VIP 筆數很多且只關心「有開」的：可改為 `find({ switch: { $ne: false } })` 並加索引，略減資料量；目前筆數不多可維持現狀。 |

### 6.4 First-time (newUserChecker)

| 項目 | 說明 |
|------|------|
| **目前狀態** | 僅在「有回覆（rplyVal.text）且 mongoURL」時才呼叫；內部有 24 小時 TTL 的 `userCache`（key = hash:botname），命中則不查 DB。未命中時 `findOne({ userID: hash, botname }).lean()`，若無則寫入一筆並設 cache。 |
| **已做優化** | 24h userCache、findOne().lean()、unique 索引。 |
| **可選優化** | **(1)** `userCache` 目前僅依 24h 定時清空，若使用者數極多可加「最大筆數」或 LRU，超過時淘汰舊 key，避免記憶體無界成長。**(2)** 目前為「先查 DB → 無則寫入 → 再設 cache」，語意正確，不建議改為只寫不讀（會失去「是否首次」的準確性）。 |

### 6.5 courtMessage (logs.js)

| 項目 | 說明 |
|------|------|
| **目前狀態** | 每則訊息只更新記憶體中的 `RollingLog.*` 計數（LineCountRoll、TelegramCountText 等）；`saveLog` 已註解，不寫 DB。 |
| **已做優化** | 無 DB 寫入，無需優化。 |
| **可選優化** | **(1)** 若未來要「把 RollingLog 寫回 DB」：建議改為**批次寫入**（例如每 N 秒或每 M 筆彙總一次寫入一筆或一個時段統計），避免每則訊息都寫 DB。**(2)** 若僅需重啟後保留計數：可考慮定時（如每 5 分鐘）或 process 結束前寫入一次，不建議每則寫入。 |

---

### 6.6 總結

| 項目 | 每則打 DB？ | 建議 |
|------|-------------|------|
| Level (EXPUP) | 是（已用快取壓低） | 維持現狀；可選：member cache 延長 TTL、tempSwitchV2 上限/LRU。 |
| Block | 否 | 維持；可選：大規模時用 Map 依 groupid 查詢。 |
| VIP | 否 | 維持；可選：find().lean()、條件查詢。 |
| First-time | 僅有回覆且未命中 cache | 維持；可選：userCache 筆數上限或 LRU。 |
| courtMessage | 否 | 維持；若恢復寫入改為批次或定時。 |

---

## 7. 可改善 DB 連線問題的項目

以下項目能**直接或間接改善 DB 連線穩定性**（減少逾時、buffering timed out、連線池壓力）。

### 7.1 已實作且對連線有幫助

| 項目 | 如何改善連線 |
|------|----------------|
| **Level：gpInfoCache + member .cache(60)** | 大幅減少「每則訊息」的 DB 查詢次數 → 連線池並發數下降，連線不穩或記憶體吃緊時較不易出現 buffering timed out 或 pool 耗盡。 |
| **First-time：userCache + findOne().lean()** | 減少重複使用者的 DB 查詢 → 同上，降低並發與負載。 |
| **level.js 內 isDbOnline()  early return** | 當 dbWatchdog 判定 DB 離線時，EXPUP 直接 return，不送查詢 → 不會在連線不可用時堆積 buffered 操作。 |
| **bufferTimeoutMS: 30_000（db-connector.js）** | 連線建立前／重連期間，Mongoose 預設 10 秒就對排隊操作拋出 "buffering timed out"；改為 30 秒可讓**短暫不穩**時多一點時間恢復，減少誤報逾時（根本仍須確保 MongoDB 與主機資源正常）。 |

### 7.2 連線問題的根因與優先順序

1. **根本**：確保 MongoDB 服務正常、網路可達、主機記憶體/swap 足夠（見 `docs/INCIDENT_ANALYSIS_2026-03-08.md`）。
2. **減負載**：Level / First-time 快取已減少每則訊息打 DB，有助於連線與主機壓力大時少出錯。
3. **緩解現象**：`bufferTimeoutMS` 延長排隊等待時間，僅緩解「短暫不穩」時的逾時，無法取代修好連線或資源。

### 7.3 可選：進一步減輕連線負擔

| 做法 | 說明 |
|------|------|
| 其他模組在非關鍵路徑先 `isDbOnline()` 再打 DB | 與 level 相同，連線已知不可用時不做查詢，避免堆積。 |
| VIP find().lean()、First-time userCache 上限 | 略減記憶體與查詢量，間接降低高負載時對連線的壓力。 |
| 監控告警 | 對 `[DB-Protection] ENTERING DEGRADED MODE` 與 "MongoDB connection not ready" 設告警，連線問題時及早處理。 |
