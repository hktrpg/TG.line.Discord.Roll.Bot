# Mongoose v9 優化建議

## 📋 優化項目清單

### 🔴 高優先級（建議修正）

#### 1. ✅ Schema 定義不一致 - 統一使用 Schema 對象 [已完成]
**位置**: `modules/schema.js`

**狀態**: ✅ **已完成** - 所有 13 個 model 已統一使用 `new mongoose.Schema()` 語法

**修正內容**: 
- 已將所有使用舊語法 `mongoose.model('name', {})` 的 model 改為 `mongoose.model('name', new mongoose.Schema({}))`
- 統一了代碼風格，提高了可維護性

**已修正的 models** (13個):
- ✅ `chattest` (line 10)
- ✅ `block` (line 16)
- ✅ `randomAns` (line 22)
- ✅ `randomAnsPersonal` (line 27)
- ✅ `randomAnsAllgroup` (line 34)
- ✅ `randomAnsServer` (line 38)
- ✅ `trpgDatabase` (line 45)
- ✅ `trpgDatabaseAllgroup` (line 53)
- ✅ `GroupSetting` (line 61)
- ✅ `trpgCommand` (line 80)
- ✅ `trpgDarkRolling` (line 138)
- ✅ `RealTimeRollingLog` (line 148)
- ✅ `RollingLog` (line 170)

**驗證**: 
- ✅ 無 linter 錯誤
- ✅ 所有 Schema 定義已統一

#### 2. Model 重複定義檢查
**位置**: `modules/schema.js`

**問題**: 
- 只有 `MyNameRecord` 有檢查 `mongoose.models.MyNameRecord`
- 其他 model 沒有檢查，可能導致重複定義警告

**建議**: 統一使用檢查模式或使用 `mongoose.models` 檢查

```javascript
// 當前只有 MyNameRecord 有檢查
const MyNameRecord = mongoose.models.MyNameRecord || mongoose.model('MyNameRecord', myNameRecordSchema);

// 建議：為所有 model 添加檢查（可選，因為 Mongoose 會自動處理）
// 或者使用 helper function
function getOrCreateModel(name, schema) {
    return mongoose.models[name] || mongoose.model(name, schema);
}
```

### 🟡 中優先級（可選優化）

#### 3. Find 查詢使用三參數語法
**位置**: `modules/db-protection-layer.js:187`

**問題**:
```javascript
const results = await schema[collectionName].find(query, null, options);
```

**建議**: 雖然仍然工作，但更好的做法是使用選項對象
```javascript
// 當前
const results = await schema[collectionName].find(query, null, options);

// 建議改為
const results = await schema[collectionName].find(query, options);
```

**注意**: 如果 `options` 包含 projection，應該使用：
```javascript
const results = await schema[collectionName].find(query, options.projection, { ...options, projection: undefined });
```

#### 4. MongoError 字符串匹配優化
**位置**: `modules/db-connector.js:91`

**當前代碼**:
```javascript
const permanentErrors = [
    'bad auth',
    'Authentication failed',
    'not authorized',
    'Invalid credentials',
    'MongoServerError: bad auth',
    'MongoError: bad auth'  // 舊的錯誤格式
];
```

**建議**: 可以移除 `'MongoError: bad auth'`，因為 MongoDB Driver 4.x+ 只使用 `MongoServerError`
```javascript
const permanentErrors = [
    'bad auth',
    'Authentication failed',
    'not authorized',
    'Invalid credentials',
    'MongoServerError: bad auth'
    // 移除 'MongoError: bad auth' - MongoDB Driver 4.x+ 不再使用
];
```

**注意**: 保留也無害，可以兼容舊的錯誤日誌

### 🟢 低優先級（代碼質量）

#### 5. 統一 Model 導出模式
**位置**: `modules/schema.js`

**建議**: 考慮使用更一致的導出模式，例如：
```javascript
// 可以考慮使用對象導出，而不是單個變量
module.exports = {
    models: {
        chatTest: chatTestSchema,
        block: blockSchema,
        // ...
    },
    // 或者保持當前方式（也可以）
};
```

## 🛠️ 實施建議

### 優先級順序
1. ✅ **高優先級**: Schema 定義統一化 [已完成]
2. ✅ **中優先級**: Find 查詢語法優化 [已完成]
3. **低優先級**: 其他優化（可選）

### 注意事項
- 所有優化都是**可選的**，當前代碼已經完全兼容 Mongoose v9
- 建議在修正前進行測試
- Schema 定義統一化工作量較大，可以分批進行

## ✅ 當前狀態總結

**好消息**: 
- ✅ 所有 breaking changes 都已處理
- ✅ 代碼完全兼容 Mongoose v9
- ✅ 沒有必須修正的錯誤

**優化空間**:
- 🔧 代碼風格統一化
- 🔧 使用更現代的 Mongoose API
- 🔧 提高代碼一致性

## 📝 實施檢查清單

優化進度：

- [x] 1. 測試當前代碼確保一切正常
- [x] 2. 修正 `db-protection-layer.js` 中的 find 查詢（簡單）
- [x] 3. 移除 `MongoError` 字符串匹配
- [x] 4. 統一 Schema 定義（13個 model 全部完成）
- [ ] 5. 優化後再次測試（建議在實際環境中測試）
