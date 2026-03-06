# HKTRPG 機器人架構現代化提案：前後端分離與國際化 (i18n) 計畫

## 1. 願景與核心目標 (Vision & Goals)
為了讓 HKTRPG 機器人能夠從單一平台工具演進為多端生態系統（Discord, Web, App, Line），我們必須打破現有「以 Discord 為中心」的開發模式。

*   **核心目標**：
    *   **邏輯原子化**：擲骰運算不再依賴特定平台的 API 對象。
    *   **數據結構化**：Web UI 能接收 JSON 數據進行富文本渲染，而非僅顯示純文字。
    *   **語系動態化**：支援全球社群協作翻譯。
    *   **權限標準化**：VIP 等級轉化為具體功能開關 (Feature Flags)。

---

## 2. 架構演進：從「耦合」到「適配」

### 2.1 現狀：模擬模式 (Current: Simulation Mode)
目前 Web 端透過偽造 `Interaction` 對象來欺騙骰組邏輯，這導致了脆弱的代碼結構。
```text
[Web API] -> [Fake Interaction] -> [Roll Logic (Hardcoded Strings & Discord API)]
```

### 2.2 目標：適配器模式 (Target: Hexagonal Architecture)
建立一個純粹的「領域邏輯層」，由各平台適配器負責轉譯請求。
```text
[Discord Adapter] \
[Web API Adapter]  -> [Dice Service (Logic)] -> [I18n Provider]
[Line Adapter]    /          |
                       [Structured Result]
```

---

## 3. 分離決策矩陣 (Decoupling Decision Matrix)

並非所有代碼都需要分離。針對本 Repo 的特性，我們採用以下準則：

### 3.1 必須分離 (Must Decouple)
*   **遊戲規則邏輯** (如 `2-coc.js`, `5e.js`, `wod.js`)：這些邏輯需要同時支援 Discord 文字指令與 Web UI 的視覺化操作。
*   **使用者狀態管理** (如 `z_character.js`, `z_Level_system.js`)：數據必須在不同平台間保持一致。
*   **複雜運算引擎** (`rollbase.js`)：這是系統的心臟，不應與任何平台 API 綁定。

### 3.2 無需分離 (Keep Platform-Specific)
*   **平台管理工具** (`ds-deploy-commands.js`)：僅限 Discord 使用的指令部署邏輯。
*   **原生通知系統** (`z_admin.js` 中的伺服器狀態報告)：直接回傳給管理員的文字訊息。
*   **簡單膠水代碼**：僅用於調用其他服務的單層封裝。

---

## 4. 資料持久化與快取策略 (MongoDB & Cache Architecture)

在前後端分離的架構中，MongoDB 不再直接被骰組邏輯調用，而是位於 **Infrastructure Layer (基礎設施層)**。

### 4.1 MongoDB 的戰略定位
*   **唯一事實來源 (Source of Truth)**：存儲所有跨平台共享的狀態（角色卡、等級、設定）。
*   **位置**：位於 `DiceService` 之下，透過 `Repository Pattern` 提供數據，邏輯層不直接看見 Mongoose Schema。

### 4.2 內存快取與降級機制 (`db-protection-layer`)
為了應對高併發擲骰與資料庫不穩定，系統實作了以下三層防護：
1.  **L1 Cache (In-Memory)**：利用 `Map` 物件存儲頻繁讀取的設定（如 VIP 等級、群組黑名單）。
2.  **Degraded Mode (降級模式)**：當 MongoDB 連線失敗時，系統切換至內存運作，確保「擲骰」功能不中斷，僅暫停寫入。
3.  **Sync Queue (異步同步)**：
    *   **讀取**：優先命中內存快取。
    *   **寫入**：寫入內存後，將操作放入 `syncQueue`，由後台任務異步更新至 MongoDB，避免阻塞事件循環。

---

## 5. 核心組件設計 (Core Components)

### 3.1 抽象上下文：`GenericContext`
每個請求進入系統後，會被封裝為一個標準 Context：
```typescript
interface GenericContext {
  platform: 'discord' | 'line' | 'web';
  userId: string;
  groupId: string;
  lang: string;
  permissions: {
    vipLevel: number;
    canExport: boolean;
    rateLimit: number;
  };
  t: (key: string, params?: object) => string; // 翻譯函式
}
```

### 3.2 結構化輸出：`DiceResult`
骰組不再僅回傳 `text`，而是回傳資料：
```typescript
interface DiceResult {
  rawRolls: number[];     // 原始骰點
  successLevel: string;   // 成功等級 (e.g., "Hard Success")
  finalValue: number;     // 最終數值
  formattedText: string;  // 預設格式化文字 (供舊平台使用)
  actions: ActionButton[]; // 抽象化的按鈕定義
  metadata: {
    system: string;       // 所屬系統 (e.g., "CoC7")
    effects: string[];    // 特殊效果標籤
  };
}

interface ActionButton {
  label: string;
  command: string;        // 點擊後執行的標準化指令
  style: 'primary' | 'danger' | 'secondary';
}
```

### 3.3 管道化服務：`DiceService Pipeline`
參考 `analytics.js` 的複雜邏輯，新的服務層將採用中介軟體模式：
1.  **Guard Middleware**：檢查 `z_stop` (群組黑名單) 與 `rateLimiter`。
2.  **Identity Middleware**：從 `veryImportantPerson.js` 注入權限與功能開關。
3.  **Template Engine**：處理 `z_character.js` 風格的變數替換 `{STR} + 10`。
4.  **Core Dice Logic**：執行 `roll/*.js` 中的純運算，產出 `DiceResult`。
5.  **I18n Formatter**：根據語系將 `DiceResult` 轉換為各平台最終文字。

---

## 4. 深度案例研究：邏輯與表現分離路徑

### 案例 A：`2-coc.js` (規則重重)
*   **重構前**：邏輯內直接判斷 `temp <= check[index] / 5` 並回傳 `"極限成功"`。
*   **重構後**：`coc.logic.js` 回傳 `{ successLevel: 'EXTREME' }`。由 i18n 資源檔決定在 Discord 顯示 `極限成功`，在英文 Web 版顯示 `Extreme Success`。

### 案例 B：`token.js` & `wheel-animator.js` (資源密集)
*   **重構策略**：將圖像處理抽離為「Media Service」。
*   **調用流程**：`Web/Discord -> DiceService -> MediaService (Sharp/Canvas) -> Storage -> URL`。這能解決 Web 前端無法直接調用 Node.js 圖像庫的問題。

### 案例 C：`z_myname.js` (扮演發言)
*   **重構策略**：建立「Webhook 適配層」。
*   **優點**：Web UI 可以直接透過 Socket.io 即時更新 `.mehistory`，不需要重複查詢資料庫。

---

## 5. i18n 實作路徑
將硬編碼的中文轉移至 `assets/i18n/`：
*   **命名空間劃分**：`common.json`, `coc7.json`, `dnd5e.json`。
*   **動態注入**：在 `DiceService` 執行前，根據 `Context.lang` 綁定對應的翻譯實體。
*   **範例**：
    `rply.text = context.t('coc:success_hard')` 而非 `rply.text = "困難成功"`。

---

## 6. VIP 系統：從等級到功能開關
VIP 判定將移至 Middleware 層：
1.  **解析**：查詢 `vipManager` 獲取等級。
2.  **轉換**：將等級 2 轉換為 `{ canExport: true, cooldown: 60000 }`。
3.  **注入**：骰組直接檢查 `context.permissions.canExport`。

---

## 7. 安全防護與品質保證 (Security & QA)

### 7.1 安全閘道器 (Security Guard)
利用 `utils/security.js` 現有的功能，在新架構中落實：
*   **輸入消毒 (Sanitization)**：所有經由 Web API 進入的 `inputStr` 必須通過 `validateChatMessage` 的檢查，阻斷 XSS 與 NoSQL 注入。
*   **敏感資訊脫敏**：利用 `sanitizeLogData` 確保日誌中不會出現 Patreon 金鑰或使用者密碼。
*   **跨來源資源共用 (CORS)**：統一使用 `validateOrigin` 驗證 Web 端請求，防止惡意站點調用 API。

### 7.2 回歸測試框架
利用 `test/` 已建立的基礎設施：
*   **邏輯不變性驗證**：遷移骰組至 `DiceService` 後，必須通過現有的 `*.test.js`（例如 `2-coc.test.js`），確保輸出數值邏輯與舊版 100% 相同。
*   **內存集成測試**：使用 `global-setup.js` 啟動的 MongoMemoryServer 驗證 `records.js` 的 V2 介面是否正常。
*   **i18n 覆蓋率**：新增測試案例，驗證所有硬編碼字串是否已正確抽取至 JSON。

---

## 8. 實作藍圖 (Migration Roadmap)

### Milestone 1: 基礎建設 (Infrastructure) - [預計 2 週]
*   建立 `modules/core/GenericContext.js`。
*   實作 `modules/services/i18nProvider.js`。
*   開發 `modules/services/diceService.js` 入口。

### Milestone 2: 模組遷移 (Migration) - [持續進行]
*   優先遷移 `advroll.js` 作為標竿。
*   實作結構化輸出協議。

### Milestone 3: 介面升級 (V2 API) - [預計 1 週]
*   發布 `/api/v2/roll`。
*   Web 端 UI 改寫，支援結構化數據展示。

---

## 8. 成本與效益總結 (Executive Summary)

*   **成本**：
    *   **開發**：初期需投入約 150-200 工時進行核心重構。
    *   **風險**：Discord Slash Command 的模擬適配需極度精確。
*   **效益**：
    *   **維護性**：Bug 隔離度提升，擲骰邏輯可獨立於平台更新。
    *   **擴充性**：支援未來推出繁簡中、英文、日文版，搶佔國際 TRPG 市場。
    *   **商業價值**：Patreon 贊助者可在 Web 端享受更優質的「沉浸式擲骰介面」。

---
**結論：這是一項針對架構債務的「清償行動」，更是 HKTRPG 邁向國際化與多端運作的基石。**
