# Records Module Integration Tests

## 概述

这些测试用于验证 Records 模块从回调模式迁移到 Promise 模式后的功能是否正常。

## 测试文件

### 1. `records-integration.test.js`
**单元测试** - 使用 mock，不需要实际数据库连接

- 测试所有 records 模块方法
- 使用 mock 的 schema 和 db-connector
- 可以快速运行，不需要服务启动

**运行方式:**
```bash
yarn test:records
# 或
yarn test test/records-integration.test.js
```

### 2. `run-after-startup.test.js`
**集成测试** - 需要服务启动后运行

- 测试实际的服务启动后的行为
- 需要真实的数据库连接
- 验证所有模块初始化模式

**运行方式:**
```bash
# 1. 先启动服务
node index.js

# 2. 在另一个终端运行测试
yarn test:startup
# 或
yarn test test/run-after-startup.test.js
```

## 测试覆盖范围

### ✅ 基本操作
- `get()` - 获取数据
- `updateRecord()` - 更新记录
- 所有 `set*` 方法
- 所有 `push*` 方法

### ✅ 功能模块
- Block 功能 (z_stop.js)
- Command 功能 (z_saveCommand.js)
- Database 功能 (z_trpgDatabase.js)
- Dark Rolling 功能 (z_DDR_darkRollingToGM.js)

### ✅ 特殊功能
- Chat Room 操作
- Forwarded Message 操作
- 错误处理
- 连接处理

### ✅ 初始化模式
- 模块初始化
- 并行初始化
- 服务启动后的行为

## 运行所有测试

```bash
# 运行所有 records 相关测试
yarn test:all

# 运行所有测试（包括其他测试）
yarn test
```

## 测试要求

### records-integration.test.js
- ✅ 不需要数据库连接
- ✅ 使用 mock
- ✅ 可以随时运行
- ✅ 快速执行

### run-after-startup.test.js
- ⚠️ 需要服务启动
- ⚠️ 需要数据库连接
- ⚠️ 需要设置 `mongoURL` 环境变量
- ⚠️ 需要等待服务初始化（约 2 秒）

## 故障排除

### 测试失败：mongoURL not set
**原因**: `run-after-startup.test.js` 需要数据库连接

**解决**:
1. 确保设置了 `mongoURL` 环境变量
2. 或者只运行 `records-integration.test.js`（不需要数据库）

### 测试失败：Connection timeout
**原因**: 服务可能还没完全启动

**解决**:
1. 等待服务完全启动（查看日志确认）
2. 增加 `WAIT_TIME` 常量（在测试文件中）

### 测试失败：Module not found
**原因**: 模块可能还没加载

**解决**:
1. 确保服务已启动
2. 检查模块路径是否正确

## 持续集成

可以在 CI/CD 中运行：

```yaml
# 示例 GitHub Actions
- name: Run Records Integration Tests
  run: |
    yarn test:records  # 不需要服务启动
    
# 如果需要完整测试
- name: Start Service
  run: node index.js &
  
- name: Run Startup Tests
  run: |
    sleep 5  # 等待服务启动
    yarn test:startup
```

## 注意事项

1. **单元测试** (`records-integration.test.js`) 可以随时运行
2. **集成测试** (`run-after-startup.test.js`) 需要服务运行
3. 集成测试会自动跳过如果 `mongoURL` 未设置
4. 所有测试都验证 Promise 模式，不测试回调模式

## 相关文档

- [MIGRATION_COMPLETE.md](../MIGRATION_COMPLETE.md) - 迁移完成文档
- [BUGFIX_ASYNC_FUNCTIONS.md](../BUGFIX_ASYNC_FUNCTIONS.md) - async 函数修复
- [FINAL_CHECK_REPORT.md](../FINAL_CHECK_REPORT.md) - 最终检查报告
