# 泛用自動完成功能系統

這是一個為HKTRPG擲骰機器人設計的泛用自動完成功能系統，支持任何骰組通過配置來啟用自動完成功能。

## 功能特點

- **完全泛用**: 任何骰組都可以通過配置啟用自動完成，無需修改核心代碼
- **動態註冊**: 系統自動掃描並註冊有自動完成功能的骰組模組
- **無硬編碼**: 完全移除硬編碼的特定骰組數據，保持系統通用性
- **靈活性**: 支持API、靜態數據、函數等多種數據源
- **一致性**: 統一的用戶體驗和API接口
- **可維護**: 清晰的架構分離，易於維護和擴展
- **智能定位**: 自動調整下拉選單位置，避免被快速輸入面板遮擋
- **防抖搜尋**: 避免頻繁API請求，提升性能
- **鍵盤導航**: 支持上下箭頭鍵和Enter鍵操作
- **響應式設計**: 自動適應不同屏幕尺寸和布局

## 系統架構

### 1. 後端架構 (`modules/core-www.js`)

#### 動態模組註冊系統
```javascript
// 自動掃描 roll/ 目錄，註冊有 autocomplete 對象的模組
const registerAutocompleteModules = () => {
    const rollDir = path.join(process.cwd(), 'roll');
    const files = fs.readdirSync(rollDir);
    
    for (const file of files) {
        if (file.endsWith('.js') && !ignoredFiles.some(prefix => file.startsWith(prefix))) {
            const commandModule = require(modulePath);
            
            // 檢查模組是否有自動完成功能
            if (commandModule.autocomplete && typeof commandModule.autocomplete === 'object') {
                const moduleName = commandModule.autocomplete.moduleName || file.replace('.js', '');
                autocompleteModules[moduleName] = commandModule.autocomplete;
                console.log(`Registered autocomplete module: ${moduleName}`);
            }
        }
    }
};
```

#### 通用API端點
```
GET /api/autocomplete/:module?q=query&limit=10
```

**參數說明:**
- `module`: 模組名稱（如 'digimon'）
- `q`: 搜尋查詢（可選）
- `limit`: 結果數量限制（可選，預設10）

**回應格式:**
```json
[
    {
        "id": "unique_id",
        "display": "顯示名稱",
        "value": "實際值",
        "metadata": {
            "stage": "階段",
            "attribute": "屬性"
        }
    }
]
```

### 2. 前端架構 (`views/common/autocompleteManager.js`)

#### 自動完成管理器
```javascript
// 全局實例
window.autocompleteManager = new AutocompleteManager();

// 為輸入框添加自動完成
autocompleteManager.attachToInput(input, config);
```

#### 自動完成類
```javascript
const autocomplete = new Autocomplete(input, {
    dataSource: 'api',
    module: 'digimon',
    searchFields: ['display', 'value'],
    limit: 8,
    minQueryLength: 1,
    debounceDelay: 300
});
```

### 3. 前端集成 (`views/index.html`)

系統會自動檢測骰組選項是否支持自動完成，並自動添加相應功能：

```javascript
// 檢查是否支持自動完成
if (option.autocomplete && option.autocomplete.enabled) {
    const autocompleteConfig = {
        dataSource: 'api',
        module: option.autocomplete.module || 'default',
        searchFields: option.autocomplete.searchFields || ['display', 'value'],
        limit: option.autocomplete.limit || 8,
        minQueryLength: option.autocomplete.minQueryLength || 1,
        placeholder: option.autocomplete.placeholder || option.description,
        noResultsText: option.autocomplete.noResultsText || '找不到相關結果'
    };
    
    // 為輸入框添加自動完成
    if (window.autocompleteManager) {
        window.autocompleteManager.attachToInput(input, autocompleteConfig);
    }
}
```

## 使用方法

### 1. 為骰組添加自動完成支持

#### 步驟1: 在骰組模組中添加自動完成配置
```javascript
// 在骰組模組的 module.exports 中添加
const autocomplete = {
    moduleName: 'your_module_name',
    getData: () => {
        // 返回所有數據用於初始化
        const instance = YourClass.init();
        return instance.getAllData();
    },
    search: (query, limit) => {
        // 實現搜尋邏輯
        const instance = YourClass.init();
        return instance.searchForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

module.exports = {
    // ... 其他導出
    autocomplete
};
```

**重要**: 確保 `autocomplete` 對象直接掛載在 `module.exports` 上，而不是嵌套在其他對象內。

#### 步驟2: 在骰組中實現搜尋方法
```javascript
// 在骰組的主要類中添加搜尋方法
class YourClass {
    // 為自動完成功能提供搜尋方法
    searchForAutocomplete(query, limit = 10) {
        // 實現搜尋邏輯
        const results = this.performSearch(query);
        return results.slice(0, limit).map(item => ({
            id: item.id,
            display: item.name,
            value: item.name,
            metadata: {
                stage: item.stage,
                attribute: item.attribute,
                // 其他元數據...
            }
        }));
    }

    // 獲取所有數據（用於初始化）
    getAllData() {
        return this.data.map(item => ({
            id: item.id,
            display: item.name,
            value: item.name,
            metadata: {
                stage: item.stage,
                attribute: item.attribute
            }
        }));
    }
}
```

**搜尋方法要求**:
- `searchForAutocomplete(query, limit)`: 根據查詢字符串搜尋，返回最多 `limit` 個結果
- `getAllData()`: 返回所有可用數據，用於初始化
- 兩個方法都必須返回符合統一數據格式的數組

#### 步驟3: 在discordCommand中配置選項
```javascript
.addStringOption(option => {
    const opt = option.setName('your_option')
        .setDescription('選項描述')
        .setRequired(true)
        .setAutocomplete(true);
    
    // 添加自動完成配置到選項對象
    opt.autocompleteModule = 'your_module_name';
    opt.autocompleteSearchFields = ['display', 'value', 'metadata.zh-cn-name'];
    opt.autocompleteLimit = 8;
    opt.autocompleteMinQueryLength = 1;
    opt.autocompleteNoResultsText = '找不到相關結果';
    
    return opt;
})
```

**配置說明**:
- `autocompleteModule`: 對應的模組名稱，必須與 `autocomplete.moduleName` 一致
- `autocompleteSearchFields`: 搜尋字段數組，支持嵌套字段（如 `metadata.stage`）
- `autocompleteLimit`: 最大顯示結果數量
- `autocompleteMinQueryLength`: 最小查詢長度
- `autocompleteNoResultsText`: 無結果時的提示文字

### 2. 系統自動處理

一旦完成上述配置，系統會自動：
1. 註冊自動完成模組
2. 為相關選項添加自動完成功能
3. 處理API請求
4. 渲染下拉選單
5. 處理用戶交互

## 配置選項

### 骰組模組配置 (`autocomplete` 對象)
```javascript
{
    moduleName: 'digimon',                    // 模組名稱
    getData: () => [...],                     // 獲取所有數據的函數
    search: (query, limit) => [...],          // 搜尋函數
    transform: (item) => ({...})              // 數據轉換函數
}
```

### Discord選項配置
```javascript
{
    autocompleteModule: 'digimon',            // 對應的模組名稱
    autocompleteSearchFields: ['display', 'value'], // 搜尋字段
    autocompleteLimit: 8,                     // 最大顯示數量
    autocompleteMinQueryLength: 1,            // 最小查詢長度
    autocompleteNoResultsText: '找不到相關結果' // 無結果提示
}
```

### 前端配置
```javascript
{
    dataSource: 'api',                        // 數據源類型
    module: 'digimon',                        // 模組名稱
    searchFields: ['display', 'value'],       // 搜尋字段
    limit: 8,                                 // 最大顯示數量
    minQueryLength: 1,                        // 最小查詢長度
    debounceDelay: 300,                       // 防抖延遲（毫秒）
    placeholder: '輸入搜尋關鍵字...',          // 佔位符文本
    noResultsText: '找不到相關結果'           // 無結果提示
}
```

## 數據格式

### 統一數據格式
所有自動完成數據都必須遵循以下格式：
```javascript
{
    id: "unique_id",           // 唯一標識符
    display: "顯示名稱",        // 顯示給用戶的名稱
    value: "實際值",           // 實際使用的值
    metadata: {                // 額外元數據
        stage: "階段",
        attribute: "屬性",
        "zh-cn-name": "中文名稱",
        // 其他信息...
    }
}
```

### 數碼寶貝示例
```javascript
{
    id: 21,
    display: "亞古獸",
    value: "亞古獸",
    metadata: {
        stage: "成長期",
        attribute: "疫苗種",
        "zh-cn-name": "亞古獸"
    }
}
```

## 事件系統

### 自動完成選擇事件
```javascript
input.addEventListener('autocomplete-select', (e) => {
    const item = e.detail.item;
    const input = e.detail.input;
    console.log('選擇了:', item.display, item.value);
    console.log('輸入框:', input);
});
```

### 事件詳情
- `e.detail.item`: 選中的項目對象
- `e.detail.input`: 觸發事件的輸入框元素

## 樣式自定義

系統提供了完整的CSS類名，可以自定義樣式：

### 主要樣式類
- `.autocomplete-dropdown` - 下拉選單容器
- `.autocomplete-item` - 選項項目
- `.autocomplete-main` - 主要顯示文本
- `.autocomplete-meta` - 元數據信息
- `.autocomplete-item.no-results` - 無結果提示
- `.autocomplete-item.selected` - 選中狀態
- `.autocomplete-dropdown-up` - 向上顯示的下拉選單

### 樣式示例
```css
.autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 1100;
    max-height: 200px;
    overflow-y: auto;
}

.autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
    background-color: #f8f9fa;
}
```

## 高級功能

### 1. 智能定位
系統會自動檢測下拉選單是否會被快速輸入面板遮擋，並自動調整位置：
- 正常情況下向下顯示
- 空間不足時向上顯示
- 動態監聽快速輸入面板狀態變化

### 2. 防抖搜尋
```javascript
// 預設防抖延遲為300毫秒
debounceDelay: 300
```

### 3. 鍵盤導航
- `↑/↓`: 上下導航
- `Enter`: 選擇當前項目
- `Escape`: 關閉下拉選單

### 4. 滑鼠交互
- 懸停高亮
- 點擊選擇
- 點擊外部關閉

## 實際使用示例

### 數碼寶貝骰組 (`roll/digmon.js`)

#### 完整的自動完成配置示例
```javascript
// 在 roll/digmon.js 文件末尾添加
const autocomplete = {
    moduleName: 'digimon',
    getData: () => {
        const instance = Digimon.init();
        return instance.getAllDigimonNames();
    },
    search: (query, limit) => {
        const instance = Digimon.init();
        return instance.searchForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

// 在 module.exports 中添加
module.exports = {
    // ... 其他導出
    autocomplete
};
```

#### Discord選項配置示例
```javascript
// 在 discordCommand 中配置
.addStringOption(option => {
    const opt = option.setName('name')
        .setDescription('數碼寶貝名稱或編號')
        .setRequired(true)
        .setAutocomplete(true);
    
    opt.autocompleteModule = 'digimon';
    opt.autocompleteSearchFields = ['display', 'value', 'metadata.zh-cn-name'];
    opt.autocompleteLimit = 8;
    opt.autocompleteMinQueryLength = 1;
    opt.autocompleteNoResultsText = '找不到相關的數碼寶貝';
    
    return opt;
})
```

#### 搜尋方法實現示例
```javascript
// 在 Digimon 類中實現
searchForAutocomplete(query, limit = 10) {
    if (!query || query.trim().length === 0) {
        return this.getAllDigimonNames().slice(0, limit);
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = [];
    
    // 搜尋所有數碼寶貝
    for (const digimon of this.digimonData) {
        const name = digimon.name || '';
        const zhName = digimon['zh-cn-name'] || '';
        const stage = digimon.stage || '';
        const attribute = digimon.attribute || '';
        
        // 多字段搜尋
        const searchableText = `${name} ${zhName} ${stage} ${attribute}`.toLowerCase();
        
        if (searchableText.includes(searchTerm)) {
            results.push({
                id: digimon.id,
                display: name,
                value: name,
                metadata: {
                    stage: stage,
                    attribute: attribute,
                    'zh-cn-name': zhName
                }
            });
        }
    }
    
    // 按相關性排序（名稱完全匹配優先）
    results.sort((a, b) => {
        const aExact = a.display.toLowerCase() === searchTerm;
        const bExact = b.display.toLowerCase() === searchTerm;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.display.localeCompare(b.display);
    });
    
    return results.slice(0, limit);
}

getAllDigimonNames() {
    return this.digimonData.map(digimon => ({
        id: digimon.id,
        display: digimon.name,
        value: digimon.name,
        metadata: {
            stage: digimon.stage,
            attribute: digimon.attribute,
            'zh-cn-name': digimon['zh-cn-name']
        }
    }));
}
```

## 測試和調試

### 1. 檢查模組註冊
```javascript
// 在瀏覽器控制台中檢查
console.log(window.autocompleteManager.modules);
```

### 2. 測試API端點
```bash
# 獲取所有數據
curl "http://localhost:20721/api/autocomplete/digimon"

# 搜尋特定項目
curl "http://localhost:20721/api/autocomplete/digimon?q=亞古獸&limit=5"
```

### 3. 檢查自動完成實例
```javascript
// 在瀏覽器控制台中檢查
console.log(window.autocompleteManager.activeAutocomplete);
```

## 故障排除

### 常見問題

1. **自動完成不顯示**
   - 檢查模組是否正確註冊
   - 檢查API端點是否正常響應
   - 檢查輸入框是否有正確的配置

2. **搜尋結果為空**
   - 檢查搜尋函數實現
   - 檢查數據格式是否正確
   - 檢查搜尋字段配置

3. **樣式問題**
   - 檢查CSS類名是否正確
   - 檢查z-index是否足夠高
   - 檢查定位是否正確

### 調試技巧

1. **啟用詳細日誌**
```javascript
// 在瀏覽器控制台中啟用
localStorage.setItem('debug', 'autocomplete');
```

2. **檢查網絡請求**
   - 打開開發者工具的Network標籤
   - 查看API請求是否成功
   - 檢查回應數據格式

3. **檢查DOM結構**
   - 檢查下拉選單是否正確創建
   - 檢查事件監聽器是否正確綁定

## 擴展新模組

### 完整步驟

1. **在骰組中實現搜尋方法**
```javascript
class YourClass {
    searchForAutocomplete(query, limit) {
        // 實現搜尋邏輯
    }
    
    getAllData() {
        // 實現數據獲取邏輯
    }
}
```

2. **添加自動完成配置**
```javascript
const autocomplete = {
    moduleName: 'your_module',
    getData: () => yourInstance.getAllData(),
    search: (query, limit) => yourInstance.searchForAutocomplete(query, limit),
    transform: (item) => ({...})
};

module.exports = {
    // ... 其他導出
    autocomplete
};
```

3. **配置Discord選項**
```javascript
.addStringOption(option => {
    const opt = option.setName('option_name')
        .setDescription('選項描述')
        .setRequired(true)
        .setAutocomplete(true);
    
    opt.autocompleteModule = 'your_module';
    // ... 其他配置
    
    return opt;
})
```

4. **測試功能**
   - 重啟服務器
   - 檢查模組註冊日誌
   - 測試API端點
   - 測試前端功能

### 快速模板

#### 新骰組自動完成模板
```javascript
// 1. 在骰組文件末尾添加以下代碼
const autocomplete = {
    moduleName: 'your_game_name', // 替換為你的遊戲名稱
    getData: () => {
        const instance = YourGameClass.init(); // 替換為你的主要類
        return instance.getAllData();
    },
    search: (query, limit) => {
        const instance = YourGameClass.init(); // 替換為你的主要類
        return instance.searchForAutocomplete(query, limit);
    },
    transform: (item) => ({
        id: item.id,
        display: item.display,
        value: item.value,
        metadata: item.metadata
    })
};

// 2. 在 module.exports 中添加
module.exports = {
    // ... 其他導出
    autocomplete
};

// 3. 在你的主要類中添加搜尋方法
class YourGameClass {
    // 搜尋方法
    searchForAutocomplete(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return this.getAllData().slice(0, limit);
        }
        
        const searchTerm = query.toLowerCase().trim();
        const results = [];
        
        // 在這裡實現你的搜尋邏輯
        for (const item of this.yourDataArray) {
            const searchableText = `${item.name} ${item.description}`.toLowerCase();
            
            if (searchableText.includes(searchTerm)) {
                results.push({
                    id: item.id,
                    display: item.name,
                    value: item.name,
                    metadata: {
                        // 添加相關的元數據
                        category: item.category,
                        type: item.type
                    }
                });
            }
        }
        
        return results.slice(0, limit);
    }
    
    // 獲取所有數據
    getAllData() {
        return this.yourDataArray.map(item => ({
            id: item.id,
            display: item.name,
            value: item.name,
            metadata: {
                category: item.category,
                type: item.type
            }
        }));
    }
}

// 4. 在 Discord 命令中配置選項
.addStringOption(option => {
    const opt = option.setName('item_name')
        .setDescription('選擇項目')
        .setRequired(true)
        .setAutocomplete(true);
    
    opt.autocompleteModule = 'your_game_name'; // 與上面的 moduleName 一致
    opt.autocompleteSearchFields = ['display', 'value', 'metadata.category'];
    opt.autocompleteLimit = 8;
    opt.autocompleteMinQueryLength = 1;
    opt.autocompleteNoResultsText = '找不到相關項目';
    
    return opt;
})
```

## 性能優化

### 1. 搜尋優化
- 使用索引和緩存
- 限制搜尋結果數量
- 實現防抖搜尋

### 2. 數據載入優化
- 延遲載入數據
- 使用分頁載入
- 實現數據緩存

### 3. 渲染優化
- 虛擬滾動（大量數據時）
- 防抖渲染
- 智能更新

## 常見問題與解決方案

### 1. 自動完成不顯示
**問題**: 輸入框沒有顯示自動完成下拉選單
**解決方案**:
- 檢查模組是否正確註冊（查看服務器啟動日誌）
- 確認 `autocomplete` 對象正確掛載在 `module.exports` 上
- 檢查 API 端點是否正常響應
- 確認輸入框配置正確

### 2. 搜尋結果為空
**問題**: 輸入內容後沒有搜尋結果
**解決方案**:
- 檢查 `searchForAutocomplete` 方法實現
- 確認數據格式符合統一標準
- 檢查搜尋字段配置是否正確
- 測試 API 端點直接調用

### 3. 樣式問題
**問題**: 下拉選單樣式異常或位置不正確
**解決方案**:
- 檢查 CSS 類名是否正確
- 確認 z-index 足夠高（建議 1100+）
- 檢查父容器是否有正確的定位
- 確認快速輸入面板不會遮擋下拉選單

### 4. 性能問題
**問題**: 搜尋響應慢或卡頓
**解決方案**:
- 實現搜尋結果緩存
- 限制搜尋結果數量
- 使用防抖搜尋避免頻繁請求
- 優化搜尋算法

## 最佳實踐

### 1. 搜尋算法優化
```javascript
searchForAutocomplete(query, limit = 10) {
    // 1. 空查詢處理
    if (!query || query.trim().length === 0) {
        return this.getAllData().slice(0, limit);
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = [];
    
    // 2. 多字段搜尋
    for (const item of this.data) {
        const searchableText = `${item.name} ${item.alias} ${item.description}`.toLowerCase();
        
        if (searchableText.includes(searchTerm)) {
            // 3. 計算相關性分數
            const score = this.calculateRelevanceScore(item, searchTerm);
            results.push({ ...item, score });
        }
    }
    
    // 4. 按相關性排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
}

calculateRelevanceScore(item, searchTerm) {
    let score = 0;
    const name = item.name.toLowerCase();
    
    // 完全匹配得分最高
    if (name === searchTerm) score += 100;
    // 開頭匹配次之
    else if (name.startsWith(searchTerm)) score += 50;
    // 包含匹配
    else if (name.includes(searchTerm)) score += 25;
    
    return score;
}
```

### 2. 數據格式標準化
```javascript
// 統一的數據轉換函數
transformItem(item) {
    return {
        id: item.id || item._id || Math.random().toString(36),
        display: item.display || item.name || item.title,
        value: item.value || item.name || item.title,
        metadata: {
            category: item.category || item.type,
            description: item.description || item.desc,
            // 添加其他有用的元數據
        }
    };
}
```

### 3. 錯誤處理
```javascript
searchForAutocomplete(query, limit = 10) {
    try {
        // 搜尋邏輯
        return this.performSearch(query, limit);
    } catch (error) {
        console.error('Autocomplete search error:', error);
        return []; // 返回空數組而不是拋出錯誤
    }
}
```

## 注意事項

- 確保API端點正確響應
- 數據格式必須符合統一標準
- 搜尋性能考慮：建議使用防抖和限制結果數量
- 錯誤處理：系統會自動處理API錯誤並顯示友好提示
- 模組名稱必須唯一
- 搜尋函數必須返回正確格式的數據
- 確保輸入框有正確的父容器用於定位
- 避免在搜尋函數中進行同步的繁重操作
- 建議實現搜尋結果緩存以提升性能

## 版本歷史

- **v1.0**: 初始版本，支持基本的自動完成功能
- **v2.0**: 添加動態模組註冊系統
- **v3.0**: 移除硬編碼，實現完全泛用
- **v4.0**: 添加智能定位和防抖搜尋
- **v5.0**: 完善文檔和錯誤處理
- **v6.0**: 添加快速模板和最佳實踐指南