# 角色卡頁面重構說明

## 問題解決方案

### 1. 重複代碼問題
- **問題**: `characterCard.html` 和 `characterCardPublic.html` 有大量重複代碼
- **解決方案**: 創建統一的基礎模板 `baseCharacterCard.html`，使用模板變數處理差異

### 2. CSS衝突問題
- **問題**: Bootstrap 4 覆蓋自定義樣式，導致大量使用 `!important`
- **解決方案**: 
  - 調整CSS載入順序，讓Bootstrap在自定義CSS之後載入
  - 創建 `bootstrap-overrides.css` 使用更高特異性而非 `!important`
  - 更新CSS變數系統，提供更好的Bootstrap兼容性

## 文件結構

```
views/
├── common/
│   ├── baseCharacterCard.html          # 統一基礎模板
│   ├── pageConfigManager.js            # 頁面配置管理器
│   ├── templateGenerator.js            # 模板生成器
│   ├── generatePages.js                # 頁面生成腳本
│   └── ... (其他現有文件)
├── css/
│   ├── bootstrap-overrides.css         # Bootstrap覆蓋樣式
│   ├── variables.css                   # 更新的CSS變數
│   └── ... (其他現有文件)
├── characterCard.html                  # 生成的私有頁面
└── characterCardPublic.html            # 生成的公開頁面
```

## 使用方法

### 生成頁面
```bash
# 生成所有頁面
node views/common/generatePages.js

# 只生成私有頁面
node views/common/generatePages.js private

# 只生成公開頁面
node views/common/generatePages.js public
```

### 手動生成
```javascript
const PageGenerator = require('./views/common/generatePages.js');
const generator = new PageGenerator();
generator.generateAll();
```

## CSS載入順序

新的CSS載入順序解決Bootstrap覆蓋問題：

1. `variables.css` - CSS變數定義
2. `utilities.css` - 工具類別
3. `card.css` - 基礎卡片樣式
4. `modern-card.css` - 現代化樣式
5. `hybrid-card-optimized.css` - 混合樣式
6. `bootstrap.min.css` - Bootstrap框架
7. `bootstrap-overrides.css` - Bootstrap覆蓋樣式

## 配置系統

### 頁面配置
```javascript
const configs = {
    private: {
        title: "Character Card 角色卡",
        bodyClass: "",
        containerClass: "container-fluid px-3 px-md-4 py-3",
        isPublic: false,
        // ... 其他配置
    },
    public: {
        title: "Character Card 角色卡", 
        bodyClass: "center container",
        containerClass: "container",
        isPublic: true,
        // ... 其他配置
    }
};
```

### 模板變數
- `{{TITLE}}` - 頁面標題
- `{{BODY_CLASS}}` - Body CSS類別
- `{{CONTAINER_CLASS}}` - 容器CSS類別
- `{{VUE_CONTAINER_CLASS}}` - Vue容器CSS類別
- `{{IS_PUBLIC}}` - 是否為公開頁面
- `{{PUBLIC_SOCKET_LISTENERS}}` - 公開頁面專用Socket監聽器

## 優勢

### 1. 減少重複代碼
- 單一基礎模板管理所有頁面
- 配置驅動的差異處理
- 統一的維護點

### 2. 解決CSS衝突
- 減少 `!important` 使用
- 更好的Bootstrap兼容性
- 更清晰的樣式優先級

### 3. 提高可維護性
- 模組化架構
- 配置與代碼分離
- 自動化生成流程

### 4. 更好的擴展性
- 易於添加新頁面類型
- 統一的配置管理
- 可重用的組件

## 遷移步驟

1. **備份現有文件**
2. **運行生成腳本**: `node views/common/generatePages.js`
3. **測試生成的文件**
4. **更新引用路徑**（如需要）
5. **部署並驗證**

## 注意事項

- 生成的文件會覆蓋現有的 `characterCard.html` 和 `characterCardPublic.html`
- 確保在生成前備份重要修改
- 測試所有功能確保正常工作
- CSS變數更新可能影響現有樣式

## 故障排除

### 模板變數未替換
- 檢查 `pageConfigManager.js` 中的配置
- 確認模板變數格式正確 `{{VARIABLE_NAME}}`

### CSS樣式問題
- 檢查CSS載入順序
- 確認 `bootstrap-overrides.css` 正確載入
- 使用瀏覽器開發者工具檢查樣式優先級

### JavaScript錯誤
- 檢查 `pageConfigManager.js` 是否正確載入
- 確認所有依賴模組存在
- 查看瀏覽器控制台錯誤信息
