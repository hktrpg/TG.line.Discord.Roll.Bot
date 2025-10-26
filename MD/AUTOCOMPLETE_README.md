# 泛用自動完成功能系統

這是一個為HKTRPG擲骰機器人設計的泛用自動完成功能系統，支持任何骰組通過配置來啟用自動完成功能。

## 功能特點

- **泛用性**: 任何骰組都可以通過配置啟用自動完成
- **可擴展**: 新模組只需註冊即可使用
- **靈活性**: 支持API、靜態數據、函數等多種數據源
- **一致性**: 統一的用戶體驗和API接口
- **可維護**: 清晰的架構分離，易於維護和擴展

## 系統架構

### 1. 後端API

#### 自動完成模組註冊
```javascript
// 在 core-www.js 中註冊模組
const autocompleteModules = {
    "digimon": {
        getData: () => digimonInstance.getAllDigimonNames(),
        search: (query, limit) => digimonInstance.searchForAutocomplete(query, limit),
        transform: (item) => ({
            id: item.id,
            display: item.display,
            value: item.value,
            metadata: item.metadata
        })
    }
};
```

#### API端點
```
GET /api/autocomplete/:module?q=query&limit=10
```

### 2. 前端管理器

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
    minQueryLength: 1
});
```

## 使用方法

### 1. 為骰組添加自動完成支持

#### 在骰組的discordCommand中添加autocomplete配置
```javascript
.addStringOption(option =>
    option.setName('name')
        .setDescription('數碼寶貝名稱或編號')
        .setRequired(true)
        .setAutocomplete(true))  // 啟用自動完成
```

#### 在骰組中添加搜尋方法
```javascript
// 為自動完成功能提供搜尋方法
searchForAutocomplete(query, limit = 10) {
    // 實現搜尋邏輯
    return results.map(item => ({
        id: item.id,
        display: item.name,
        value: item.name,
        metadata: {
            // 額外信息
        }
    }));
}

// 獲取所有數據（用於初始化）
getAllData() {
    return this.data.map(item => ({
        id: item.id,
        display: item.name,
        value: item.name,
        metadata: {}
    }));
}
```

### 2. 註冊自動完成模組

在 `core-www.js` 中註冊新模組：
```javascript
autocompleteModules['pokemon'] = {
    getData: () => pokemonInstance.getAllPokemon(),
    search: (query, limit) => pokemonInstance.searchPokemon(query, limit),
    transform: (item) => ({
        id: item.id,
        display: item.name,
        value: item.name,
        metadata: {
            type: item.type,
            generation: item.generation
        }
    })
};
```

### 3. 前端集成

#### 在快速命令系統中自動檢測
系統會自動檢測選項是否支持自動完成，並自動添加相應功能。

#### 手動添加自動完成
```javascript
const config = {
    dataSource: 'api',
    module: 'digimon',
    searchFields: ['display', 'value', 'metadata.zh-cn-name'],
    limit: 8,
    minQueryLength: 1,
    placeholder: '輸入搜尋關鍵字...',
    noResultsText: '找不到相關結果'
};

autocompleteManager.attachToInput(inputElement, config);
```

## 配置選項

### 數據源配置
```javascript
{
    dataSource: 'api',        // 'api' | 'static' | 'function'
    endpoint: '/api/search',  // API端點（當dataSource為'api'時）
    module: 'digimon',        // 模組名稱（當dataSource為'api'時）
    staticData: [...],        // 靜態數據（當dataSource為'static'時）
    searchFunction: 'search'  // 搜尋函數（當dataSource為'function'時）
}
```

### 搜尋配置
```javascript
{
    searchFields: ['display', 'value'],  // 搜尋字段
    limit: 8,                            // 最大顯示數量
    minQueryLength: 1,                   // 最小查詢長度
    debounceDelay: 300                   // 防抖延遲（毫秒）
}
```

### 顯示配置
```javascript
{
    placeholder: '輸入搜尋關鍵字...',     // 佔位符文本
    noResultsText: '找不到相關結果'       // 無結果提示
}
```

## 數據格式

### 統一數據格式
```javascript
{
    id: "unique_id",           // 唯一標識符
    display: "顯示名稱",        // 顯示給用戶的名稱
    value: "實際值",           // 實際使用的值
    metadata: {                // 額外元數據
        stage: "階段",
        attribute: "屬性",
        // 其他信息...
    }
}
```

## 事件

### 自動完成選擇事件
```javascript
input.addEventListener('autocomplete-select', (e) => {
    const item = e.detail.item;
    console.log('選擇了:', item.display, item.value);
});
```

## 樣式自定義

系統提供了完整的CSS類名，可以自定義樣式：

- `.autocomplete-dropdown` - 下拉選單容器
- `.autocomplete-item` - 選項項目
- `.autocomplete-main` - 主要顯示文本
- `.autocomplete-meta` - 元數據信息
- `.autocomplete-item.no-results` - 無結果提示

## 測試

訪問 `/autocomplete-test.html` 可以測試自動完成功能。

## 擴展新模組

1. 在骰組中實現 `searchForAutocomplete` 和 `getAllData` 方法
2. 在 `core-www.js` 中註冊模組
3. 在骰組的discordCommand中為相關選項添加 `.setAutocomplete(true)`
4. 系統會自動處理其餘部分

## 注意事項

- 確保API端點正確響應
- 數據格式必須符合統一標準
- 搜尋性能考慮：建議使用防抖和限制結果數量
- 錯誤處理：系統會自動處理API錯誤並顯示友好提示
