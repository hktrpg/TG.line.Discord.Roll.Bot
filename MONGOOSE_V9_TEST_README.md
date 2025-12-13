# Mongoose v9 語法測試模組 (暫時性)

## 📋 說明

此測試模組會在應用啟動後自動執行一次，測試所有 Mongoose v9 相關語法，確保遷移成功。

## 🚀 使用方法

### 自動執行（預設）

測試會在應用啟動後自動執行，無需額外配置。

### 禁用測試

如果不想執行測試，可以設置環境變數：

```bash
# 禁用自動測試
ENABLE_MONGOOSE_V9_TEST=false node index.js
```

或在 `.env` 文件中添加：

```
ENABLE_MONGOOSE_V9_TEST=false
```

## 📊 測試內容

測試模組會檢查以下項目：

1. **Schema 定義測試**
   - 驗證所有 Schema 是否正確定義
   - 檢查 Model 是否有效

2. **Schema 實例化測試**
   - 測試關鍵 Schema 的實例化
   - 驗證實例創建是否正常

3. **查詢操作測試**
   - `findOne()` 與 `lean()`
   - `find()` 與 `limit()`
   - `countDocuments()`
   - `findOneAndUpdate()` 與 `upsert`
   - `deleteOne()`

4. **Mongoose 9 特定功能測試**
   - `strictQuery` 設置
   - 連接狀態
   - Schema 對象使用
   - `Model.exists()` 返回類型

5. **索引測試**
   - 獲取索引信息
   - 驗證索引是否正確創建

6. **事務測試**
   - Session 創建
   - 事務語法驗證

## 📝 測試輸出

測試執行時會在控制台輸出：

```
============================================================
🧪 [Mongoose v9 Test] Starting Syntax Tests...
============================================================

⏳ [Mongoose v9 Test] Waiting for MongoDB connection...
✅ [Mongoose v9 Test] MongoDB connection established

📋 [Mongoose v9 Test] Testing Schema Definitions...
✅ [Mongoose v9 Test] Schema chatRoom - Model definition: PASSED
...

============================================================
📊 [Mongoose v9 Test] Test Results Summary:
============================================================
✅ Passed: 25
❌ Failed: 0
📈 Total: 25

🎉 [Mongoose v9 Test] All tests passed! Mongoose v9 migration is successful.
============================================================
```

## 🗑️ 移除測試模組

測試完成後，可以安全移除：

1. **刪除測試模組文件**：
   ```bash
   rm modules/mongoose-v9-syntax-test.js
   ```

2. **移除 db-connector.js 中的測試代碼**：
   刪除 `modules/db-connector.js` 文件末尾的以下代碼塊：
   ```javascript
   // 🧪 TEMPORARY: Auto-run Mongoose v9 syntax test after connection
   // This will be removed after testing is complete
   if (process.env.ENABLE_MONGOOSE_V9_TEST !== 'false') {
       // ... 測試代碼 ...
   }
   ```

3. **刪除此 README 文件**（可選）

## ⚠️ 注意事項

- 測試會創建一個臨時的測試記錄（在 `chatRoom` collection），測試完成後會自動清理
- 測試不會修改或刪除現有數據
- 如果測試失敗，請檢查錯誤訊息並修正問題
- 測試只會執行一次（即使應用重啟）

## 🔍 手動執行測試

如果需要手動執行測試：

```javascript
const mongooseTest = require('./modules/mongoose-v9-syntax-test.js');
mongooseTest.runAllTests().then(success => {
    console.log('Test completed:', success ? 'PASSED' : 'FAILED');
});
```

## 📅 測試時間

- 測試會在 MongoDB 連接建立後 5 秒執行
- 確保所有模組都已載入
- 測試執行時間約 1-3 秒（取決於數據庫響應速度）
