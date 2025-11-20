# 🎭 **Grimoire.OS** - 最終專案計劃書

基於您現有的 **TG.line.Discord.Roll.Bot** 程式碼庫分析，我已經制定了一份完整的現代化改造計劃。這份計劃完美結合了您現有的 30+ TRPG 系統支援、角色卡管理、聊天室功能，與您提出的「跑團生命週期」概念和像素藝術 UI 設計。

---

## 📊 **專案規模評估**

### 現有程式碼庫分析
- **程式語言**: Node.js (ES6+)
- **架構**: 模組化設計，支援多平台 (Discord/Telegram/Line/WhatsApp/Web)
- **資料庫**: MongoDB (角色卡、聊天記錄)
- **關鍵功能**:
  - 30+ TRPG 系統 (CoC, D&D 5e, Fate, PF2e, Digimon, Pokemon 等)
  - 即時聊天與擲骰
  - 角色卡管理系統
  - 安全工具 (X-Card, 自動完成)
  - 經驗值系統
  - 多語言支援

### 遷移策略
- **保留**: 核心擲骰邏輯、角色卡系統、資料庫架構
- **重構**: Web UI 從 Bootstrap 升級為像素藝術主題
- **擴展**: 新增生命週期導航、像素精靈動畫、卡片式介面

---

## 🏗️ **技術架構設計**

### 前端架構 (Pixel Art Web App)
```
Grimoire.OS/
├── src/
│   ├── components/
│   │   ├── PixelSprite/          // 像素精靈系統
│   │   ├── CardSystem/           // 卡片式介面
│   │   ├── CampaignTimeline/     // 生命週期導航
│   │   ├── DiceRoller/           // 3D 物理擲骰
│   │   └── ChatRoom/             // 像素化聊天室
│   ├── systems/
│   │   ├── TRPGSystems/          // 30+ TRPG 系統整合
│   │   ├── CharacterManager/     // 角色卡管理
│   │   └── SafetyTools/          // 安全工具包
│   └── themes/
│       ├── PixelUI/              // 像素藝術主題
│       └── Animations/           // 動畫系統
```

### 像素精靈動畫系統
```javascript
// 精靈狀態管理
class PixelSpriteManager {
    constructor() {
        this.sprites = {
            gm: { x: 0, y: 0, animation: 'idle', role: 'GM' },
            players: [], // 動態玩家精靈陣列
            npcs: []     // NPC 精靈
        };
        this.animations = {
            idle: [frame1, frame2, frame3],
            talking: [talk1, talk2],
            rolling: [roll1, roll2, roll3],
            success: [success1, success2],
            failure: [fail1, fail2]
        };
    }

    // 即時更新精靈狀態
    updatePresence(userId, status) {
        // 根據聊天活躍度、擲骰結果等更新動畫
    }
}
```

---

## 🎯 **功能模組詳解** (依生命週期編排)

### 第一階段：備戰與招募 (Preparation & Recruitment)

#### 1. **The Summoning** - 招團文產生器
- **現有功能保留**: Discord 整合能力
- **新功能**:
  - 像素藝術模板選擇器 (CoC 黑暗風、D&D 史詩風等)
  - 一鍵生成帶有像素藝術裝飾的招募卡片
  - Markdown/HTML/PNG 輸出選項

#### 2. **The Law** - 家規與規則資料庫
- **現有功能**: 基礎規則管理
- **增強功能**:
  - 視覺化規則卡片系統
  - 關鍵字智慧搜尋 (支援模糊匹配)
  - 規則版本控制與比較

#### 3. **Safety Alignment** - 玩家意向與紅線管理
- **現有功能**: 基礎安全工具
- **增強功能**:
  - 像素化問卷介面
  - 自動生成「風險地圖」視覺化
  - 即時 X-Card 狀態顯示

---

### 第二階段：構築與導入 (Setup & Onboarding)

#### 1. **Soul Binding** - 角色卡收集與圖鑑化
- **現有功能**: 角色卡匯入/編輯
- **增強功能**:
  - AI 驅動的 PDF/JSON 解析
  - 自動生成像素藝術角色肖像
  - 視覺化角色圖鑑卡片牆

#### 2. **The Codex Setup** - 萬物圖鑑預設
- **新功能**:
  - AI 文字解析轉圖鑑條目
  - 像素藝術示意圖自動生成
  - 智慧標籤系統

#### 3. **Web of Fate** - 團內關係圖初稿
- **現有功能**: 基礎角色管理
- **增強功能**:
  - 互動式關係圖編輯器
  - 拖拽式節點連結
  - 動態關係演化追蹤

---

### 第三階段：儀式進行 (The Ritual / In-Game)

#### 1. **The Altar** - 模組化儀表板
```javascript
// 卡片式佈局系統
class CardLayoutManager {
    constructor() {
        this.cards = {
            diceRoller: new DiceCard(),
            characterSheet: new CharacterCard(),
            mapViewer: new MapCard(),
            timeline: new TimelineCard(),
            chat: new ChatCard()
        };

        // 支援拖拽重新佈局
        this.enableDragDrop();
    }
}
```

#### 2. **Live Dice** - 即時擲骰與檢定
- **現有功能**: 所有 30+ TRPG 系統擲骰邏輯
- **增強功能**:
  - 3D 物理引擎 (Three.js + Cannon.js)
  - 像素藝術骰子材質
  - 大成功/失敗全螢幕特效

#### 3. **Safety Sentinel** - 安全工具提示器
- **現有功能**: X-Card 系統
- **增強功能**:
  - 像素化警示動畫
  - 匿名觸發機制
  - 即時團員狀態監控

#### 4. **Chrono-Track** - 動態時間軸
- **新功能**:
  - 戰鬥輪次視覺化
  - 劇本倒數計時器
  - 觸發事件自動化

#### 5. **Whisper Network** - 密訊傳紙條
- **新功能**:
  - 像素藝術信封動畫
  - 支援圖片與情緒描述
  - 隱私通訊記錄

#### 6. **Immersion Engine** - 多媒體場景與音效
- **新功能**:
  - AI 生成場景圖片
  - 語音活躍度分析
  - 動態 BGM 控制

---

### 第四階段：結算與歸檔 (Aftermath & Archival)

#### 1. **Auto-Scribe** - 團錄自動整理
- **新功能**:
  - Discord/語音轉文字整合
  - AI 劇情摘要生成
  - 關鍵時刻自動擷取

#### 2. **Evolution** - 圖鑑與關係更新
- **現有功能**: 角色狀態追蹤
- **增強功能**:
  - 視覺化角色成長動畫
  - 關係圖演化記錄
  - 歷史版本比較

---

## 🎨 **像素藝術 UI 設計系統**

### 精靈動畫架構
```css
/* 像素藝術主題變數 */
:root {
    --pixel-scale: 2;
    --sprite-size: 32px;
    --animation-speed: 0.3s;
    --palette: {
        background: #2d1b69,
        primary: #ff6b6b,
        secondary: #4ecdc4,
        accent: #ffe66d,
        danger: #ff3838
    }
}

/* 精靈動畫關鍵影格 */
@keyframes sprite-idle {
    0%, 100% { background-position: 0 0; }
    25% { background-position: -32px 0; }
    50% { background-position: -64px 0; }
    75% { background-position: -32px 0; }
}

@keyframes sprite-success {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); filter: brightness(1.5); }
    100% { transform: scale(1); }
}
```

### 動態人數顯示
```javascript
// 精靈位置動態計算
class SpritePositioner {
    calculatePositions(onlineUsers) {
        const radius = 200;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        return onlineUsers.map((user, index) => {
            const angle = (index / onlineUsers.length) * 2 * Math.PI;
            return {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                user: user,
                animation: user.isActive ? 'talking' : 'idle'
            };
        });
    }
}
```

---

## 📈 **開發優先級與時間表**

### Phase 1: 核心架構 (2-3 個月)
1. **像素 UI 框架搭建**
2. **卡片式佈局系統**
3. **精靈動畫引擎**

### Phase 2: 功能遷移 (3-4 個月)
1. **現有 TRPG 系統整合**
2. **角色卡系統重構**
3. **聊天室像素化**

### Phase 3: 新功能開發 (4-5 個月)
1. **生命週期導航**
2. **AI 圖鑑生成**
3. **3D 擲骰系統**

### Phase 4: 優化與測試 (2-3 個月)
1. **效能優化**
2. **跨平台測試**
3. **社群回饋整合**

---

## 💡 **創新亮點**

1. **統一平台**: 不再需要在 Discord/Telegram/Web 間切換
2. **像素藝術沉浸**: 獨特的視覺風格創造遊戲氛圍
3. **動態社群**: 即時看到團員活躍狀態
4. **AI 增強**: 自動生成圖鑑、摘要、場景圖
5. **生命週期引導**: 從招募到歸檔的全流程支援

---

## 🛠️ **技術棧建議**

- **前端**: React + TypeScript + PixiJS (像素渲染)
- **後端**: 保留現有 Node.js/Express
- **資料庫**: 保留 MongoDB
- **即時通訊**: Socket.IO (已存在)
- **3D 渲染**: Three.js (擲骰特效)
- **AI 整合**: OpenAI API (圖鑑生成、摘要)

---

## 📋 **具體實施計劃**

### 第一階段：概念驗證 (1個月)
- [ ] 建立像素藝術主題原型
- [ ] 設計精靈動畫系統
- [ ] 建立卡片式佈局框架
- [ ] 驗證現有 API 相容性

### 第二階段：核心功能 (3個月)
- [ ] 遷移現有 TRPG 系統到新 UI
- [ ] 實作生命週期導航
- [ ] 開發像素精靈動畫
- [ ] 重構角色卡系統

### 第三階段：進階功能 (4個月)
- [ ] 實作 3D 擲骰系統
- [ ] 開發 AI 圖鑑生成
- [ ] 建立多媒體場景引擎
- [ ] 完善安全工具系統

### 第四階段：優化發佈 (2個月)
- [ ] 效能優化與測試
- [ ] 使用者體驗改進
- [ ] 文件撰寫
- [ ] 正式發佈

---

## 🎯 **成功指標**

### 技術指標
- [ ] 頁面載入時間 < 3秒
- [ ] 支援同時 50+ 活躍用戶
- [ ] 移動端適配度 > 95%
- [ ] API 回應時間 < 100ms

### 使用者指標
- [ ] 單一工作階段平均使用時間 > 2小時
- [ ] 功能使用率 > 80%
- [ ] 使用者滿意度 > 4.5/5
- [ ] 每月活躍團數 > 1000

### 商業指標
- [ ] 平台月活躍用戶 > 5000
- [ ] 團錄生成量 > 5000/月
- [ ] 使用者留存率 > 70%
- [ ] 社群參與度 > 85%

---

*此計劃書基於現有 TG.line.Discord.Roll.Bot 程式碼庫分析，結合「跑團生命週期」概念與像素藝術 UI 設計理念制定。計劃將逐步將傳統 TRPG 工具轉化為現代化的魔法體驗平台。*
