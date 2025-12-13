# Mongoose v6 到 v9 迁移检查报告

## 检查日期
2025-01-XX

## 当前状态
- **package.json**: 已配置为 `"mongoose": "^9"`
- **代码库**: 大部分代码已兼容，但有一些需要修正的地方

---

## ✅ 已正确配置的部分

### 1. 连接选项
- ✅ 已移除 `useNewUrlParser` 和 `useUnifiedTopology`（Mongoose 6+ 默认行为）
- ✅ 连接选项符合 Mongoose 9 要求
- ✅ 使用正确的连接参数（`maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS` 等）

### 2. 查询方法
- ✅ 使用 `countDocuments()` 而不是已废弃的 `count()`
- ✅ 使用 `deleteOne()` / `deleteMany()` 而不是已废弃的 `remove()`
- ✅ 没有发现 `findOneAndRemove()` / `findByIdAndRemove()` 的使用

### 3. 异步模式
- ✅ 代码中主要使用 `async/await` 和 Promise，没有使用 Mongoose 的回调模式

---

## ⚠️ 需要修正的问题

### 1. **records.js - 回调函数模式** (优先级: 中)

**问题描述:**
`modules/records.js` 中的方法使用回调函数模式，虽然不是 Mongoose 的回调，但为了代码质量和未来兼容性，建议改为 Promise。

**影响范围:**
- `updateRecord()` - 使用回调参数
- `get()` - 使用回调参数
- 所有 `set*` 和 `push*` 方法 - 使用回调参数
- `chatRoomGet()` - 使用回调参数

**修复建议:**
保持向后兼容，同时支持 Promise：

```javascript
// 修改前
async updateRecord(databaseName, query, update, options, callback) {
    // ... 操作
    callback(document);
}

// 修改后 - 支持回调和 Promise
async updateRecord(databaseName, query, update, options, callback) {
    try {
        // ... 操作
        const document = await this.dbOperations[databaseName].findOneAndUpdate(query, update, options);
        
        // 如果提供了回调，使用回调；否则返回 Promise
        if (typeof callback === 'function') {
            callback(document);
        } else {
            return document;
        }
    } catch (error) {
        if (typeof callback === 'function') {
            callback(null);
        } else {
            throw error;
        }
    }
}
```

**调用位置:**
- `modules/core-www.js:1278` - `records.chatRoomGet("公共房間", (msgs) => {...})`
- `modules/core-www.js:1329` - `records.chatRoomGet(roomNumber, (msgs) => {...})`

---

### 2. **strictQuery 设置** (优先级: 低)

**当前状态:**
```javascript
mongoose.set('strictQuery', false);
```

**说明:**
- Mongoose 9 中 `strictQuery` 默认为 `false`，所以这个设置是多余的，但不会造成问题
- 可以保留以明确意图，或移除（因为已经是默认值）

**建议:**
保留当前设置，因为它明确表达了意图。

---

### 3. **findOne(null) / find(null) 行为变化** (优先级: 低)

**Mongoose 9 变化:**
- v9 中 `findOne(null)` 和 `find(null)` 会抛出错误，而不是返回第一个文档

**检查结果:**
- ✅ 代码库中没有发现 `findOne(null)` 或 `find(null)` 的使用
- ✅ 所有查询都使用有效的查询对象（如 `{}` 或具体的查询条件）

---

### 4. **pre/post middleware 的 next() 回调** (优先级: 高，如果存在)

**Mongoose 9 变化:**
- v9 移除了 pre/post middleware 中的 `next()` 回调支持
- 必须使用 async 函数或返回 Promise

**检查结果:**
- ✅ 代码库中没有发现使用 `next()` 回调的 pre/post middleware
- ✅ 所有 middleware 都是 async 函数或返回 Promise

---

## 📋 建议的修复清单

### 高优先级（必须修复）
1. ✅ **无** - 没有发现必须修复的 Mongoose v9 兼容性问题

### 中优先级（建议修复）
1. **records.js 回调函数** - 建议改为 Promise 模式，同时保持向后兼容
   - 文件: `modules/records.js`
   - 影响方法: `updateRecord`, `get`, `chatRoomGet`, 所有 `set*`/`push*` 方法

### 低优先级（可选优化）
1. **strictQuery 设置** - 可以移除（已经是默认值），但保留也无妨
2. **代码风格** - 统一使用 async/await 而不是回调

---

## 🔍 详细检查结果

### 已检查的项目

#### ✅ Mongoose v7 迁移检查
- [x] 移除回调支持 - **通过**（代码使用 async/await）
- [x] 移除 `useNewUrlParser` / `useUnifiedTopology` - **通过**
- [x] 移除 `findOneAndRemove()` - **通过**（未使用）

#### ✅ Mongoose v8 迁移检查
- [x] 移除 `overwrite` 选项 - **通过**（未使用）
- [x] 移除 `Model.count()` - **通过**（使用 `countDocuments()`）
- [x] `findOne(null)` 行为变化 - **通过**（未使用 null 查询）

#### ✅ Mongoose v9 迁移检查
- [x] 移除 pre/post middleware 的 `next()` 回调 - **通过**（未使用）
- [x] 连接选项兼容性 - **通过**
- [x] 查询方法兼容性 - **通过**

---

## 🛠️ 修复步骤

### 步骤 1: 修复 records.js（可选但建议）

如果决定修复 `records.js` 的回调模式，可以：

1. **选项 A**: 保持回调支持，同时添加 Promise 支持（向后兼容）
2. **选项 B**: 完全移除回调，改为 Promise（需要修改所有调用点）

**推荐选项 A**，因为：
- 保持向后兼容
- 不破坏现有代码
- 允许逐步迁移

### 步骤 2: 测试

修复后需要测试：
- 所有使用 `records` 模块的功能
- 数据库连接和查询操作
- 错误处理

---

## 📝 总结

### 兼容性状态: ✅ **基本兼容**

代码库已经很好地兼容 Mongoose v9，主要发现：

1. **无阻塞性问题** - 没有发现会导致运行时错误的兼容性问题
2. **代码质量改进机会** - `records.js` 可以改进为 Promise 模式
3. **配置正确** - 连接选项和查询方法都符合 v9 要求

### 建议行动

1. **立即行动**: 无（代码可以正常运行）
2. **短期改进**: 考虑改进 `records.js` 的回调模式
3. **长期维护**: 逐步统一使用 Promise/async-await 模式

---

## 📚 参考资源

- [Mongoose v7 迁移指南](https://mongoosejs.com/docs/migrating_to_7.html)
- [Mongoose v8 迁移指南](https://mongoosejs.com/docs/migrating_to_8.html)
- [Mongoose v9 迁移指南](https://mongoosejs.com/docs/migrating_to_9.html)
- [Mongoose Changelog](https://raw.githubusercontent.com/Automattic/mongoose/refs/heads/master/CHANGELOG.md)

---

## 检查文件清单

已检查的文件：
- ✅ `modules/db-connector.js` - 连接配置
- ✅ `modules/schema.js` - Schema 定义
- ✅ `modules/records.js` - 数据库操作（需要改进）
- ✅ `modules/level.js` - 等级系统
- ✅ `modules/discord_bot.js` - Discord 机器人
- ✅ `modules/core-www.js` - Web 服务器
- ✅ 其他使用 Mongoose 的模块
