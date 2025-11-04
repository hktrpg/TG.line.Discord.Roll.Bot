# HKTRPG 骰子機器人 i18n 國際化實現計劃 (小規模應用優化版)

## 📊 重新評估與策略調整

### 🎯 小規模應用特性分析

#### 應用規模特點
- **用戶規模**: 數萬活躍用戶（非百萬級）
- **使用模式**: 主要為TRPG遊戲功能，交互頻繁但請求量中等
- **資源限制**: 使用現有基礎設施，無需複雜的雲端服務
- **維護成本**: 團隊規模小，需要簡化運維負擔

#### 技術決策重新評估
**核心原則**: **簡單、有效、快速見效**

1. **選擇 i18next**: 確認使用 i18next 作為唯一解決方案
2. **移除複雜功能**: 無需 A/B 測試、灰度發布、高級快取
3. **簡化架構**: 直接集成到現有模組系統
4. **優先順序**: 先處理高影響功能，快速獲得用戶回饋

---

## 🏆 簡化實施策略

### 核心設計原則
1. **漸進式部署**: 每個功能都可以獨立開關
2. **最小化干擾**: 不影響現有功能運行
3. **快速迭代**: 基於真實用戶回饋調整
4. **簡單維護**: 易於理解和修改的代碼結構

### 📦 技術組件選擇 (精簡版)

#### 後端組件
```json
{
  "dependencies": {
    "i18next": "^25.6.0",
    "i18next-fs-backend": "^2.6.0"
  }
}
```

#### 前端組件
```json
{
  "dependencies": {
    "i18next": "^25.6.0",
    "i18next-http-backend": "^3.0.2"
  }
}
```

## 🚀 簡化實施計劃

### 階段性實施策略
**總體時間**: 4-6 週
**核心理念**: 每個階段都能獨立運行，快速獲得用戶價值

### 📅 階段一：核心基礎設施 (第1週)
**目標**: 建立基本的 i18n 系統，讓系統能夠支持雙語

#### 1.1 建立 i18n 核心模組 (1-2天)

##### 技術實現結構

**檔案**: `modules/core-i18n.js`
```javascript
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

class I18nManager {
    constructor() {
        this.isEnabled = process.env.I18N_ENABLED === 'true';
        this.instances = new Map(); // 為不同語言快取實例
        this.currentLanguage = 'zh-cht';
        this.fallbackLanguage = 'en';

        if (this.isEnabled) {
            this.initialize();
        }
    }

    async initialize() {
        try {
            // 建立預設實例
            const defaultInstance = i18next.createInstance();
            await defaultInstance
                .use(Backend)
    .init({
                    lng: this.currentLanguage,
                    fallbackLng: this.fallbackLanguage,
        backend: {
                        loadPath: path.join(__dirname, '../assets/i18n/{{lng}}.json')
                    },
                    // 小規模應用優化：關閉不必要的功能
                    saveMissing: false,
                    preload: [this.currentLanguage, this.fallbackLanguage]
                });

            this.instances.set('default', defaultInstance);
            global.logger.info('i18n system initialized successfully');
        } catch (error) {
            global.logger.error('Failed to initialize i18n system:', error);
            this.isEnabled = false;
        }
    }

    // 獲取翻譯（同步方法，適合小規模應用）
    t(key, params = {}, lng = null) {
        if (!this.isEnabled) return key;

        const targetLang = lng || this.currentLanguage;
        const instance = this.instances.get('default');

        if (!instance) return key;

        try {
            return instance.t(key, { ...params, lng: targetLang });
        } catch (error) {
            global.logger.warn(`Translation failed for key: ${key}`, error.message);
            return key;
        }
    }

    // 簡單的語言切換
    async changeLanguage(lang) {
        if (!this.isEnabled) return false;

        try {
            const instance = this.instances.get('default');
            await instance.changeLanguage(lang);
            this.currentLanguage = lang;
            return true;
        } catch (error) {
            global.logger.error(`Failed to change language to ${lang}:`, error);
            return false;
        }
    }
}

const i18n = new I18nManager();
module.exports = i18n;
```

**初始化集成** (`index.js`):
```javascript
// 在 ModuleManager 初始化之後
const i18n = require('./modules/core-i18n');

// 設置全域實例
global.i18n = i18n;
```

#### 1.2 建立語言檔案結構 (1天)

##### 目錄結構 (單一檔案模式)
```
assets/i18n/
├── zh-cht.json          # 繁體中文
├── en.json              # 英文
└── zh-cn.json           # 簡體中文 (可選)
```

##### 鍵值命名規範 (參考實際代碼結構)
- **模組命名**: `{modulename}.{function}.{key}`
- **通用錯誤**: `common.errors.{error_type}`
- **成功訊息**: `common.success.{type}`
- **扁平結構**: 單一檔案包含所有鍵值

##### 初始語言檔案示例 (參考 roll/rollbase.js, 1-funny.js 結構)

**assets/i18n/zh-cht.json**:
```json
{
  "common": {
    "errors": {
      "invalid_input": "無效輸入",
      "dice_count_limit": "不支援{{min}}顆以下及{{max}}顆以上骰子",
      "dice_sides_limit": "不支援{{min}}以下及{{max}}以上面數",
      "calculation_error": "計算錯誤",
      "network_error": "網路錯誤"
    },
    "success": {
      "roll_complete": "擲骰完成",
      "command_executed": "指令執行成功"
    },
    "loading": "載入中...",
    "not_found": "找不到"
  },
  "help": {
    "main": "【🎲HKTRPG 骰子機器人】\n\n🎯 基本擲骰: .z xDy\n🎲 趣味功能: .choice 項目1 項目2\n📚 詳細說明: https://www.hktrpg.com/",
    "commands": {
      "roll": "擲骰指令說明",
      "choice": "隨機選擇功能"
    }
  },
  "rollbase": {
    "dice_limit": "（計算過程太長，僅顯示結果）",
    "roll_guide": "擲骰說明 https://dice-roller.github.io/documentation/guide/notation/dice.html#standard-d-n"
  },
  "funny": {
    "choice": {
      "no_options": "請提供選擇項目",
      "result": "🎲 隨機選擇結果：{{result}}"
    },
    "tarot": {
      "draw_single": "🎴 單張塔羅牌：{{card}}",
      "draw_multi": "🎴 多張塔羅牌：{{cards}}"
    }
  },
  "i18n": {
    "current_language": "您當前的語言設定是：{{lang}}",
    "unsupported_language": "不支援的語言：{{lang}}",
    "language_changed": "語言已切換為：{{lang}}"
  }
}
```

**assets/i18n/en.json**:
```json
{
  "common": {
  "errors": {
      "invalid_input": "Invalid input",
      "dice_count_limit": "Dice count must be between {{min}} and {{max}}",
      "dice_sides_limit": "Dice sides must be between {{min}} and {{max}}",
      "calculation_error": "Calculation error",
      "network_error": "Network error"
  },
  "success": {
      "roll_complete": "Roll completed",
      "command_executed": "Command executed successfully"
    },
    "loading": "Loading...",
    "not_found": "Not found"
  },
  "help": {
    "main": "【🎲HKTRPG Dice Bot】\n\n🎯 Basic Roll: .z xDy\n🎲 Fun Features: .choice item1 item2\n📚 Details: https://www.hktrpg.com/",
    "commands": {
      "roll": "Dice rolling commands",
      "choice": "Random choice function"
    }
  },
  "rollbase": {
    "dice_limit": "(Calculation too long, showing result only)",
    "roll_guide": "Dice rolling guide: https://dice-roller.github.io/documentation/guide/notation/dice.html#standard-d-n"
  },
  "funny": {
    "choice": {
      "no_options": "Please provide options to choose from",
      "result": "🎲 Random choice result: {{result}}"
    },
    "tarot": {
      "draw_single": "🎴 Single Tarot Card: {{card}}",
      "draw_multi": "🎴 Multiple Tarot Cards: {{cards}}"
    }
  },
  "i18n": {
    "current_language": "Your current language setting is: {{lang}}",
    "unsupported_language": "Unsupported language: {{lang}}",
    "language_changed": "Language changed to: {{lang}}"
  }
}
```

#### 1.3 功能旗標控制系統 (0.5天)

##### 實現簡單的環境變數控制
```bash
# .env 文件
I18N_ENABLED=true
I18N_DEFAULT_LANG=zh-cht
I18N_FALLBACK_LANG=en
```

##### 動態啟用檢查
```javascript
// 在任何需要 i18n 的地方
if (global.i18n?.isEnabled) {
    const message = global.i18n.t('common.success');
    // 使用翻譯
} else {
    const message = '成功'; // 後備
}
```

---

### 📅 階段二：核心功能本地化 (第2週)
**目標**: 將最常用的功能轉換為雙語支持

#### 2.1 Help 命令本地化 (2-3天)

##### 現有代碼分析
**檔案**: `roll/help.js`

##### 改造策略
1. **保持原有邏輯不變**
2. **添加翻譯層**
3. **提供後備機制**

##### 實現結構 (參考實際 roll/help.js 結構)
```javascript
// roll/help.js (修改後)
const help = (context) => {
    const rply = {
        type: 'text',
        text: ''
    };

    // 檢查 i18n 是否啟用
    const useI18n = global.i18n?.isEnabled;
    const userLang = context.language || 'zh-cht';

    switch (context.command) {
        case 'help':
            rply.text = getHelpText(userLang, useI18n);
            return rply;
        // ... 其他命令
    }

    return rply;
};

// 分離的幫助文本生成函數
function getHelpText(lang, useI18n) {
    if (useI18n) {
        try {
            return global.i18n.t('help.main', {}, lang);
        } catch (error) {
            global.logger.warn('Help translation failed, using fallback');
        }
    }

    // 後備：返回原始中文文本
    return `【🎲HKTRPG 骰子機器人】\n...`;
}
```

##### 更新語言檔案
在 `assets/i18n/zh-cht.json` 和 `assets/i18n/en.json` 中添加 help 部分（已在上面的示例中包含）

#### 2.2 基礎錯誤訊息本地化 (1-2天)

##### 實現通用錯誤處理
**檔案**: `modules/core-i18n.js` (擴展)

```javascript
// 添加通用錯誤翻譯方法
getErrorMessage(errorCode, params = {}, lang = null) {
    const key = `errors.${errorCode}`;
    return this.t(key, params, lang);
}
```

##### 用法示例
```javascript
// 在各個模組中使用
const errorMsg = global.i18n.getErrorMessage('invalid_input', {}, userLang);
// 或者
const errorMsg = global.i18n.t('errors.invalid_input', {}, userLang);
```

---

### 📅 階段三：平台適配與用戶體驗 (第3週)
**目標**: 讓用戶能夠實際使用多語言功能

#### 3.1 用戶語言偏好存儲 (2天)

##### 資料庫架構設計
**使用現有 schema 系統**

```javascript
// 在現有的 user schema 中添加語言字段
const userLanguageSchema = new schema({
    userId: String,
    platform: String, // 'discord', 'telegram', 'line'
    language: {
        type: String,
        default: 'zh-cht',
        enum: ['zh-cht', 'en', 'zh-cn']
    },
    updatedAt: { type: Date, default: Date.now }
});

// 添加到現有 schema
schema.userLanguages = userLanguageSchema;
```

##### 語言管理方法
```javascript
// modules/core-i18n.js 中添加
async setUserLanguage(userId, platform, lang) {
    if (!this.isEnabled) return;

    try {
        await schema.userLanguages.findOneAndUpdate(
            { userId, platform },
            { language: lang, updatedAt: new Date() },
            { upsert: true }
        );
        } catch (error) {
        global.logger.error('Failed to save user language preference:', error);
    }
}

async getUserLanguage(userId, platform) {
    if (!this.isEnabled) return this.currentLanguage;

    try {
        const pref = await schema.userLanguages.findOne({ userId, platform });
        return pref?.language || this.currentLanguage;
    } catch (error) {
        global.logger.error('Failed to get user language preference:', error);
        return this.currentLanguage;
    }
}
```

#### 3.2 語言切換命令 (1-2天)

##### 實現簡單的語言切換
**新增檔案**: `roll/i18n.js`

```javascript
const language = (context) => {
    const rply = { type: 'text', text: '' };
    const { args, userId, platform } = context;

    const requestedLang = args[0];
    const supportedLangs = ['zh-cht', 'en', 'zh-cn'];

    if (!requestedLang) {
        // 顯示當前語言
        const currentLang = global.i18n.getUserLanguage(userId, platform);
        rply.text = global.i18n.t('i18n.current_language', { lang: currentLang }, currentLang);
        return rply;
    }

    if (!supportedLangs.includes(requestedLang)) {
        rply.text = global.i18n.t('i18n.unsupported_language', { lang: requestedLang });
        return rply;
    }

    // 設定用戶語言
    global.i18n.setUserLanguage(userId, platform, requestedLang);
    rply.text = global.i18n.t('i18n.language_changed', { lang: requestedLang }, requestedLang);

    return rply;
};

module.exports = { language };
```

##### 對應語言檔案
**assets/i18n/zh-cht/i18n.json**:
```json
{
  "current_language": "您當前的語言設定是：{{lang}}",
  "unsupported_language": "不支援的語言：{{lang}}",
  "language_changed": "語言已切換為：{{lang}}"
}
```

---

### 📅 階段四：功能擴展與優化 (第4-6週)
**目標**: 擴展到更多功能模組，優化用戶體驗

#### 4.1 高頻功能本地化 (第4週)

##### 優先順序
1. **1-funny.js** - 趣味擲骰 (用戶使用頻繁)
2. **rollbase.js** - 基礎擲骰結果
3. **2-coc.js** - CoC 系統 (TRPG 核心)

##### 實現模式
- 參考 help.js 的改造模式
- 逐步替換硬編碼文本
- 保持向後兼容

##### rollbase.js 實際改造示例
```javascript
// roll/rollbase.js (修改後)

// 常數定義區塊保持不變
const DICE_LIMITS = {
  MAX_DICE_COUNT: 1000,
  MIN_DICE_COUNT: 1,
  MAX_DICE_SIDES: 90_000_000,
  MIN_DICE_SIDES: 1,
  MAX_EQUATION_DICE_COUNT: 200,
  MAX_EQUATION_DICE_SIDES: 500,
  MAX_ROLL_TIMES: 30,
  MAX_DISPLAY_LENGTH: 250
};

// 修改錯誤訊息常數，添加 i18n 支持
const ERROR_MESSAGES = {
  DICE_COUNT_LIMIT: (lang) => global.i18n?.isEnabled ?
    global.i18n.t('rollbase.errors.dice_count_limit', {
      min: DICE_LIMITS.MIN_DICE_COUNT,
      max: DICE_LIMITS.MAX_DICE_COUNT
    }, lang) :
    `不支援${DICE_LIMITS.MIN_DICE_COUNT - 1}顆以下及${DICE_LIMITS.MAX_DICE_COUNT}顆以上骰子`,

  DICE_SIDES_LIMIT: (lang) => global.i18n?.isEnabled ?
    global.i18n.t('rollbase.errors.dice_sides_limit', {
      min: DICE_LIMITS.MIN_DICE_SIDES,
      max: DICE_LIMITS.MAX_DICE_SIDES
    }, lang) :
    `不支援${DICE_LIMITS.MIN_DICE_SIDES - 1}以下及${DICE_LIMITS.MAX_DICE_SIDES}以上面數`,

  DISPLAY_LIMIT: (lang) => global.i18n?.isEnabled ?
    global.i18n.t('rollbase.dice_limit', {}, lang) :
    '（計算過程太長，僅顯示結果）'
};

// 在使用錯誤訊息的地方修改
function someDiceFunction(input, lang = 'zh-cht') {
    // ... 現有邏輯
    if (diceCount < DICE_LIMITS.MIN_DICE_COUNT || diceCount > DICE_LIMITS.MAX_DICE_COUNT) {
        return ERROR_MESSAGES.DICE_COUNT_LIMIT(lang);
    }
    // ... 其他邏輯
}

// 修改主要處理函數，添加語言參數
const rollDice = function ({
    mainMsg,
    inputStr,
    userlang = 'zh-cht'  // 添加語言參數
}) {
    // ... 現有邏輯保持不變，只在錯誤處理中使用語言參數
    try {
        // ... 擲骰邏輯
        if (displayText.length > DICE_LIMITS.MAX_DISPLAY_LENGTH) {
            reply.text = roll.output + ERROR_MESSAGES.DISPLAY_LIMIT(userlang);
        } else {
            reply.text = roll.output;
        }
    } catch (error) {
        reply.text = roll.output;
        reply.text += `${error.name}  \n ${error.message}`;
        reply.text += `\n${global.i18n?.isEnabled ?
            global.i18n.t('rollbase.roll_guide', {}, userlang) :
            '擲骰說明 https://dice-roller.github.io/documentation/guide/notation/dice.html#standard-d-n'}`;
    }
    // ... 其他邏輯
};
```

##### 1-funny.js 實際改造示例
```javascript
// roll/1-funny.js (修改後)

const funny = async (context) => {
    let rply = {
        type: 'text',
        text: ''
    };

    const userlang = context.language || 'zh-cht';
    const useI18n = global.i18n?.isEnabled;

    switch (true) {
        case /^help$/i.test(mainMsg[0]):
            rply.text = await this.getHelpMessage(userlang, useI18n);
            break;

        case /^choice$/i.test(mainMsg[0]):
            rply.text = choice(inputStr, mainMsg, userlang, useI18n);
            break;

        case /^tarot$/i.test(mainMsg[0]):
            if (mainMsg[1] <= 1) {
                rply.text = NomalDrawTarot(mainMsg[1], mainMsg[2], userlang, useI18n);
            } else {
                rply.text = MultiDrawTarot(mainMsg[1], mainMsg[2], 1, userlang, useI18n);
            }
            break;

        // ... 其他case保持不變
    }
    return rply;
};

// 修改 choice 函數
function choice(inputStr, mainMsg, lang = 'zh-cht', useI18n = false) {
    if (!mainMsg || mainMsg.length <= 1) {
        return useI18n ?
            global.i18n.t('funny.choice.no_options', {}, lang) :
            '請提供選擇項目';
    }

    const result = mainMsg[Math.floor(Math.random() * mainMsg.length)];
    return useI18n ?
        global.i18n.t('funny.choice.result', { result }, lang) :
        `🎲 隨機選擇結果：${result}`;
}

// 修改塔羅牌函數
function NomalDrawTarot(times, style, lang = 'zh-cht', useI18n = false) {
    // ... 現有邏輯
    const card = getCard(); // 假設的獲取卡牌函數

    return useI18n ?
        global.i18n.t('funny.tarot.draw_single', { card }, lang) :
        `🎴 單張塔羅牌：${card}`;
}
```

#### 4.2 前端網頁本地化 (第5週)

##### HTML 界面適配
**檔案**: `views/common/i18n-frontend.js`

```javascript
class FrontendI18n {
    constructor() {
        this.currentLang = localStorage.getItem('hktrpg_lang') || 'zh-cht';
        this.translations = {};
        this.init();
    }

    async init() {
        await this.loadLanguage(this.currentLang);
        this.updateUI();
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`/api/i18n/${lang}`);
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('hktrpg_lang', lang);
        } catch (error) {
            console.error('Failed to load language:', error);
        }
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        // 簡單參數替換
        return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    updateUI() {
        // 更新所有帶 data-i18n 屬性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // 更新語言選擇器
        const langSelector = document.getElementById('language-selector');
        if (langSelector) {
            langSelector.value = this.currentLang;
        }
    }
}

// 全域實例
window.i18n = new FrontendI18n();
```

##### 後端 API 端點
**檔案**: `index.js` (添加路由)

```javascript
// 簡單的 i18n API 端點
app.get('/api/i18n/:lang', (req, res) => {
    const lang = req.params.lang;
    const fs = require('fs').promises;
    const path = require('path');

    // 單一檔案模式：直接讀取對應語言檔案
    const filePath = path.join(__dirname, 'assets', 'i18n', `${lang}.json`);

    fs.readFile(filePath, 'utf8')
        .then(data => {
            res.json(JSON.parse(data));
        })
        .catch(error => {
            res.status(404).json({ error: 'Language file not found' });
        });
});
```

#### 4.3 效能優化與監控 (第6週)

##### 快取優化
- **語言檔案快取**: 應用啟動時載入到記憶體
- **用戶偏好快取**: 使用簡單的 Map 快取活躍用戶

##### 監控指標
```javascript
// modules/core-i18n.js 中添加
getStats() {
    return {
        enabled: this.isEnabled,
        currentLanguage: this.currentLanguage,
        loadedLanguages: Array.from(this.instances.keys()),
        cacheSize: this.userLanguageCache?.size || 0
    };
}
```

---

## 🔧 部署與維護策略

### 功能旗標控制
```bash
# 環境變數控制
I18N_ENABLED=true          # 總開關
I18N_MODULES=help,common   # 啟用的模組
I18N_PLATFORMS=all         # 啟用的平台
```

### 緊急回退機制
```javascript
// 全域後備函數
function safeTranslate(key, fallback) {
    try {
        return global.i18n?.isEnabled ? global.i18n.t(key) : fallback;
    } catch {
        return fallback;
    }
}
```

### 部署檢查清單

#### 每個新功能上架前檢查
- [ ] 功能旗標設置正確
- [ ] 後備機制有效（停用旗標時功能正常）
- [ ] 語言檔案完整性
- [ ] 基本功能測試通過

#### 部署後監控
- [ ] 錯誤率監控（< 1%）
- [ ] 性能影響檢查（響應時間增加 < 50ms）
- [ ] 用戶回饋收集

---

## 📊 成功指標與效益分析

### 技術指標
- **載入效能**: 語言切換 < 200ms
- **記憶體增加**: < 20MB
- **錯誤率**: < 0.5%
- **響應時間**: 平均延遲增加 < 20ms

### 用戶體驗指標
- **功能可用性**: > 95%
- **英文用戶增長**: 每月 > 10%
- **用戶滿意度**: > 80% (簡單調查)

### 業務效益 (小規模應用重點)
- **用戶覆蓋**: 支持英語用戶使用核心功能
- **品牌形象**: 顯示專業的國際化支持
- **維護效率**: 降低重複代碼，集中管理文本

---

## 🎯 結論

這個**小規模應用優化版** i18n 計劃專為數萬用戶規模的應用設計，重點放在：

1. **快速見效**: 第1週就能看到基本功能
2. **簡單維護**: 避免過度複雜的架構
3. **資源節省**: 使用現有基礎設施
4. **風險控制**: 每個功能都可以獨立控制

**實施重點**: 從 help 命令開始，逐步擴展，按照用戶回饋調整優先順序，確保每一步都能帶來實際價值。