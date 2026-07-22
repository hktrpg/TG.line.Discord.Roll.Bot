# Mongoose v9 修复指南

## 修复优先级

### ✅ 无需立即修复（代码已兼容）

代码库已经基本兼容 Mongoose v9，没有发现会导致运行时错误的兼容性问题。

### 🔧 可选改进（代码质量）

#### 1. records.js - 改进回调模式为 Promise

**当前问题:**
`modules/records.js` 中的方法使用回调函数，虽然不是 Mongoose 的回调，但可以改进为更现代的 Promise 模式。

**修复方案:**

保持向后兼容，同时支持 Promise：

```javascript
// 修改 updateRecord 方法
async updateRecord(databaseName, query, update, options, callback) {
    try {
        // 🔒 Sanitize groupId if present in query
        if (query && query.groupid) {
            try {
                query.groupid = InputValidator.sanitizeGroupId(query.groupid);
            } catch (error) {
                console.error(`[Records] [SECURITY] Invalid groupId:`, error.message);
                if (typeof callback === 'function') {
                    callback(null);
                    return;
                }
                throw error;
            }
        }
        
        // 🔒 Validate query object
        try {
            if (query && typeof query === 'object') {
                InputValidator.sanitizeObject(query);
            }
        } catch (error) {
            console.error(`[Records] [SECURITY] Suspicious query object:`, error.message);
            if (typeof callback === 'function') {
                callback(null);
                return;
            }
            throw error;
        }
        
        // Validate input data if schema exists
        if (validationSchemas[databaseName]) {
            const validationResult = validate(query, validationSchemas[databaseName]);
            if (!validationResult.valid) {
                throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
            }
        }

        // Always perform database operation
        const document = await this.dbOperations[databaseName].findOneAndUpdate(query, update, options);

        // Update cache with new document
        if (document) {
            const cacheKey = `${databaseName}:${JSON.stringify(query)}`;
            cache.set(cacheKey, document);
        }

        // 支持回调和 Promise
        if (typeof callback === 'function') {
            callback(document);
        } else {
            return document;
        }
    } catch (error) {
        console.error(`[Records] Database operation failed for ${databaseName}:`, error);
        if (typeof callback === 'function') {
            callback(null);
        } else {
            throw error;
        }
    }
}

// 修改 get 方法
async get(target, callback) {
    try {
        // ... 连接检查代码保持不变 ...
        
        if (schema[target]) {
            const documents = await schema[target].find({});
            
            // 支持回调和 Promise
            if (typeof callback === 'function') {
                callback(documents);
            } else {
                return documents;
            }
        } else {
            const result = [];
            if (typeof callback === 'function') {
                callback(result);
            } else {
                return result;
            }
        }
    } catch (error) {
        console.error(`[Records] Failed to get documents from ${target}:`, error);
        const result = [];
        if (typeof callback === 'function') {
            callback(result);
        } else {
            return result;
        }
    }
}

// 修改 chatRoomGet 方法
async chatRoomGet(roomNumber, callback) {
    try {
        // Check cache first
        const cacheKey = `chatRoom:${roomNumber}`;
        const cachedMessages = cache.get(cacheKey);
        if (cachedMessages) {
            if (typeof callback === 'function') {
                callback(cachedMessages);
            } else {
                return cachedMessages;
            }
            return;
        }

        // Always return messages in chronological order with a deterministic tiebreaker
        const messages = await this.ChatRoomModel
            .find({ roomNumber })
            .sort({ time: 1, _id: 1 });

        // Update cache
        cache.set(cacheKey, messages);

        // 支持回调和 Promise
        if (typeof callback === 'function') {
            callback(messages);
        } else {
            return messages;
        }
    } catch (error) {
        console.error('[Records] Chat room get failed:', error);
        const result = [];
        if (typeof callback === 'function') {
            callback(result);
        } else {
            return result;
        }
    }
}
```

**注意:** 这个改进是可选的，当前代码可以正常工作。

---

## 检查清单

### ✅ 已通过检查

- [x] 没有使用 Mongoose 回调模式（所有操作使用 async/await）
- [x] 没有使用 `findOneAndRemove()` / `findByIdAndRemove()`
- [x] 没有使用 `Model.count()` / `Query.count()`（使用 `countDocuments()`）
- [x] 没有使用 `findOne(null)` / `find(null)`
- [x] 没有在 pre/post middleware 中使用 `next()` 回调
- [x] 连接选项正确（已移除废弃选项）
- [x] 没有使用需要 `updatePipeline: true` 的聚合管道更新

### ⚠️ 可选改进

- [ ] 改进 `records.js` 的回调模式（不影响功能，但可以提升代码质量）

---

## 测试建议

修复后建议测试：

1. **数据库连接**
   ```javascript
   // 测试连接是否正常
   const dbConnector = require('./modules/db-connector.js');
   await dbConnector.waitForConnection();
   ```

2. **基本查询操作**
   ```javascript
   const schema = require('./modules/schema.js');
   const result = await schema.block.findOne({ groupid: 'test' });
   ```

3. **更新操作**
   ```javascript
   await schema.block.findOneAndUpdate(
       { groupid: 'test' },
       { $set: { blockfunction: [] } },
       { upsert: true }
   );
   ```

4. **records 模块**（如果修改了）
   ```javascript
   const records = require('./modules/records.js');
   // 测试回调模式
   records.get('block', (docs) => console.log(docs));
   // 测试 Promise 模式
   const docs = await records.get('block');
   ```

---

## 总结

**当前状态:** ✅ **代码已兼容 Mongoose v9**

**建议行动:**
1. 无需立即修复任何问题
2. 可选：改进 `records.js` 的回调模式（不影响功能）
3. 继续监控 Mongoose 的更新和最佳实践

**风险评估:** 🟢 **低风险** - 当前代码可以安全运行在 Mongoose v9 上
