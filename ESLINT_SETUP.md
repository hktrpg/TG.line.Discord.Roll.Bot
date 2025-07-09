# ESLint 9.x 設定指南

## 安裝的外掛程式

本專案已使用 yarn 安裝以下 ESLint 外掛程式：

- **eslint-plugin-unicorn** (v59.0.1) - 提供現代 JavaScript 最佳實踐規則
- **eslint-plugin-n** (v17.21.0) - Node.js 特定的 ESLint 規則（替代舊的 eslint-plugin-node）
- **eslint-plugin-import** (v2.32.0) - 模組導入/導出的規則

## 配置檔案

配置檔案位於 `eslint.config.mjs`，使用了 ESLint 9.x 的平面配置格式（flat config）。

### 主要配置特點

1. **CommonJS 支援**: 專案主要使用 CommonJS 模組格式
2. **現代 Node.js 規則**: 使用 `eslint-plugin-n` 提供 Node.js 最佳實踐
3. **Unicorn 規則**: 啟用現代 JavaScript 模式，但針對專案需求調整
4. **導入管理**: 規範模組導入順序和格式

### 規則調整

為了適應專案結構，我們做了以下調整：

- 允許 `z_*.js` 檔案名稱格式（不強制 kebab-case）
- 關閉 `prefer-module` 規則（因為使用 CommonJS）
- 允許動態 require（專案需要）
- 放寬測試檔案的規則限制

## 使用方式

### 執行 ESLint 檢查

```bash
# 檢查所有檔案
npx eslint .

# 檢查特定檔案
npx eslint modules/analytics.js

# 自動修復可修復的問題
npx eslint . --fix
```

### 在 package.json 中添加腳本

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## 規則效果示例

執行 ESLint 後，您會看到以下類型的改善建議：

1. **Node.js 協議**: `require('fs')` → `require('node:fs')`
2. **空值使用**: `null` → `undefined`（在適當情況下）
3. **字串替換**: `replace(/g, '')` → `replaceAll('')`
4. **正則表達式**: `string.match(regex)` → `regex.test(string)`
5. **迴圈最佳化**: `.forEach()` → `for...of`

## 專案特定設定

### 允許的檔案命名
- `z_*.js` - 保持現有的前綴命名慣例
- 其他檔案建議使用 kebab-case

### 全域變數設定
配置了以下全域變數：
- jQuery ($)
- Vue.js (Vue)
- Socket.io (io)
- Jest 測試框架相關變數

### 測試檔案特殊規則
`test/**/*.js` 和 `**/*.test.js` 檔案有放寬的規則：
- 允許使用 `null`
- 允許函數作用域不一致
- 允許 CommonJS 格式

## 下一步建議

1. **逐步修復**: 建議先修復自動可修復的問題 (`--fix`)
2. **手動檢視**: 檢查需要手動修復的規則違反
3. **持續整合**: 考慮在 CI/CD 流程中加入 ESLint 檢查
4. **編輯器整合**: 設定編輯器的 ESLint 外掛程式以獲得即時回饋

## 更新記錄

- 2024: 升級到 ESLint 9.x 平面配置
- 使用 `eslint-plugin-n` 替代已棄用的 `eslint-plugin-node`
- 整合 `eslint-plugin-unicorn` 提升程式碼品質
- 配置 `eslint-plugin-import` 管理模組導入 