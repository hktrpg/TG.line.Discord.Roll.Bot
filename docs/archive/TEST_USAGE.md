# Records 模块测试使用指南

## 📋 测试文件说明

### 1. `test/records-integration.test.js` 
**单元测试** - 使用 Mock，不需要实际服务

- ✅ 可以随时运行
- ✅ 不需要数据库连接
- ✅ 快速执行（几秒钟）
- ✅ 测试所有 records 方法

### 2. `test/run-after-startup.test.js`
**集成测试** - 需要服务启动后运行

- ⚠️ 需要服务先启动
- ⚠️ 需要数据库连接
- ✅ 测试实际运行环境
- ✅ 验证服务启动后的行为

---

## 🚀 快速开始

### 方式 1: 运行单元测试（推荐）

```bash
# 直接运行，不需要服务启动
yarn test:records
```

### 方式 2: 运行集成测试

```bash
# 步骤 1: 启动服务（在一个终端）
node index.js

# 步骤 2: 运行测试（在另一个终端）
yarn test:startup
```

### 方式 3: 运行所有相关测试

```bash
yarn test:all
```

---

## 📝 测试内容

### ✅ 基本操作测试
- `get()` - 获取各种数据
- `updateRecord()` - 更新记录
- 所有 `set*` 方法
- 所有 `push*` 方法

### ✅ 功能模块测试
- Block 功能 (z_stop.js 相关)
- Command 功能 (z_saveCommand.js 相关)
- Database 功能 (z_trpgDatabase.js 相关)
- Dark Rolling 功能 (z_DDR_darkRollingToGM.js 相关)

### ✅ 特殊功能测试
- Chat Room 操作
- Forwarded Message 操作
- 错误处理
- 连接状态处理

### ✅ 初始化模式测试
- 模块初始化模式
- 并行初始化
- 服务启动后的行为

---

## 🔧 可用命令

```bash
# 运行所有测试
yarn test

# 运行 records 单元测试
yarn test:records

# 运行启动后集成测试
yarn test:startup

# 运行所有 records 相关测试
yarn test:all
```

---

## ⚙️ 配置

### 环境变量

`run-after-startup.test.js` 需要：
- `mongoURL` - MongoDB 连接字符串

如果未设置，测试会自动跳过。

### 超时设置

- 单元测试：默认超时（通常 5 秒）
- 集成测试：30 秒初始化超时，每个测试 10-15 秒

---

## 🐛 故障排除

### 问题：测试失败 - mongoURL not set

**原因**: `run-after-startup.test.js` 需要数据库连接

**解决**:
```bash
# 设置环境变量
export mongoURL="mongodb://localhost:27017/your-db"

# 或只运行单元测试（不需要数据库）
yarn test:records
```

### 问题：测试超时

**原因**: 服务可能还没完全启动

**解决**:
1. 等待服务完全启动（查看日志）
2. 检查数据库连接是否正常
3. 增加超时时间（在测试文件中修改）

### 问题：Module not found

**原因**: 模块路径问题

**解决**:
1. 确保在项目根目录运行
2. 检查 `node_modules` 是否安装完整

---

## 📊 测试结果示例

### 成功运行单元测试
```
PASS  test/records-integration.test.js
  Records Module Integration Tests
    Basic Get Operations
      ✓ should get block data (5ms)
      ✓ should get trpgCommand data (3ms)
      ...
    Update Record Operations
      ✓ should update record with setBlockFunction (4ms)
      ...
```

### 成功运行集成测试
```
PASS  test/run-after-startup.test.js
  Records Module - Post-Startup Integration Test
    Service Initialization Check
      ✓ should have records module loaded (2ms)
      ✓ should have database connection ready (5ms)
    Basic Records Operations
      ✓ should get block data without errors (150ms)
      ...
```

---

## 💡 最佳实践

1. **开发时**: 使用 `yarn test:records` 快速验证
2. **部署前**: 运行 `yarn test:all` 完整测试
3. **CI/CD**: 只运行 `yarn test:records`（不需要服务）
4. **本地验证**: 启动服务后运行 `yarn test:startup`

---

## 📚 相关文档

- [test/README-RECORDS-TEST.md](../../test/README-RECORDS-TEST.md) - 详细测试文档
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - 迁移完成文档
- [FINAL_CHECK_REPORT.md](./FINAL_CHECK_REPORT.md) - 最终检查报告

---

**创建日期**: 2025-01-XX  
**测试框架**: Jest  
**Node.js 版本**: >=18
