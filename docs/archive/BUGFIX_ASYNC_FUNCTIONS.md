# Bug 修复：async 函数声明

## 问题描述

在完全迁移到 Promise 模式后，出现了语法错误：

```
SyntaxError: await is only valid in async functions and the top level bodies of modules
```

**错误位置**: `roll/z_saveCommand.js:135`

**原因**: 在非 async 函数中使用了 `await` 关键字

---

## 修复内容

### 修复的文件
- `roll/z_saveCommand.js`

### 修复的函数

1. **`handleAddCommand`** (第 108 行)
   - **修改前**: `const handleAddCommand = (inputStr, mainMsg, groupid, response, permissionError, limit) => {`
   - **修改后**: `const handleAddCommand = async (inputStr, mainMsg, groupid, response, permissionError, limit) => {`

2. **`handleEditCommand`** (第 147 行)
   - **修改前**: `const handleEditCommand = (mainMsg, groupid, response, permissionError, limit) => {`
   - **修改后**: `const handleEditCommand = async (mainMsg, groupid, response, permissionError, limit) => {`

3. **`handleDeleteAllCommands`** (第 190 行)
   - **修改前**: `const handleDeleteAllCommands = (groupid, response, permissionError) => {`
   - **修改后**: `const handleDeleteAllCommands = async (groupid, response, permissionError) => {`

4. **`handleDeleteSpecificCommand`** (第 212 行)
   - **修改前**: `const handleDeleteSpecificCommand = (mainMsg, groupid, response, permissionError) => {`
   - **修改后**: `const handleDeleteSpecificCommand = async (mainMsg, groupid, response, permissionError) => {`

### 修复的调用

在 `rollDiceCommand` 函数中，所有调用这些辅助函数的地方都添加了 `await`：

```javascript
// 修改前
case /^\.cmd$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]):
    return handleAddCommand(...);

// 修改后
case /^\.cmd$/i.test(mainMsg[0]) && /^add$/i.test(mainMsg[1]):
    return await handleAddCommand(...);
```

---

## 修复详情

### 1. handleAddCommand
- 使用 `await records.pushTrpgCommandFunction()`
- 使用 `await updateCommandData()`
- 需要 async 函数

### 2. handleEditCommand
- 使用 `await records.editsetTrpgCommandFunction()` 或 `await records.pushTrpgCommandFunction()`
- 使用 `await updateCommandData()`
- 需要 async 函数

### 3. handleDeleteAllCommands
- 使用 `await records.setTrpgCommandFunction()`
- 使用 `await updateCommandData()`
- 需要 async 函数

### 4. handleDeleteSpecificCommand
- 使用 `await records.setTrpgCommandFunction()`
- 使用 `await updateCommandData()`
- 需要 async 函数

---

## 验证

### 已检查的文件
- ✅ `roll/z_stop.js` - `rollDiceCommand` 已经是 async
- ✅ `roll/z_DDR_darkRollingToGM.js` - `rollDiceCommand` 已经是 async
- ✅ `roll/z_trpgDatabase.js` - 方法已经是 async
- ✅ `roll/z_saveCommand.js` - **已修复**

### Linter 检查
- ✅ 无 linter 错误

---

## 总结

**问题**: 在非 async 函数中使用 `await`

**解决方案**: 将所有使用 `await` 的辅助函数改为 `async` 函数，并在调用时使用 `await`

**状态**: ✅ 已修复

---

**修复日期**: 2025-01-XX  
**影响范围**: `roll/z_saveCommand.js`  
**严重程度**: 🔴 高（导致应用无法启动）
