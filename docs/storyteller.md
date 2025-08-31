# StoryTeller 互動故事系統

## 概述

StoryTeller 是一個強大的互動故事系統，允許用戶創建、管理和遊玩文字冒險遊戲。系統支援多種平台（Discord、Line、Telegram、WhatsApp），並提供豐富的功能來創建沉浸式的互動體驗。

## 快速開始

### 基本指令

```bash
.st start <alias|title> [alone|all|poll x]  # 啟動劇本
.st list                                    # 顯示可啟動的劇本清單
.st pause                                   # 暫停目前進行中的劇本
.st continue [runId]                        # 繼續暫停中的劇本
.st end                                     # 結束目前劇本
```

### 遊戲進行

```bash
.st goto <page>                             # 跳至指定頁面/選項
.st set <var> <value>                       # 設定變數
```

## 詳細功能說明

### 1. 劇本管理

#### 創建和上傳劇本

**Discord 專用功能：**

```bash
.st import <alias> [title]                  # 上傳檔案以新增劇本
.st update <alias> [title]                  # 上傳檔案以覆蓋既有劇本
.st exportfile <alias>                      # 將劇本以私訊傳送文字檔
```

**支援的檔案格式：**
- `.json` - 完整的 StoryTeller 格式
- `.txt` - RUN_DESIGN 語法格式

#### 劇本管理指令

```bash
.st my [alias]                              # 查看自己新增之劇本統計
.st mylist                                  # 顯示自己所有新增之劇本清單
.st list <alias>                            # 顯示該劇本簡介與可用資訊
.st delete <alias>                          # 刪除自己擁有的劇本
.st verify <alias>                          # 檢查劇本內容格式是否正確
```

### 2. 權限管理

```bash
.st allow <alias> AUTHOR                    # 僅作者本人可在任何地方啟動（預設）
.st allow <alias>                           # 在本群組/頻道允許啟動
.st allow <alias> <groupId...>              # 允許指定之群組/頻道啟動（可多個）
.st allow <alias> all                       # 任何人皆可啟動（公開）
```

### 3. 遊戲設定

```bash
.st edit alone|all|poll x                   # 發起者可切換參與權限
```

**參與權限選項：**
- `alone` - 僅發起者可互動
- `all` - 任何人可參與
- `poll x` - 啟用 Discord 投票 x 分鐘（預設 3，僅 Discord）

### 4. 狀態檢視

```bash
.st game                                    # 顯示目前運行與暫停中的遊戲
.st debug                                   # 顯示詳細的除錯資訊
```

## RUN_DESIGN 語法

StoryTeller 支援 RUN_DESIGN 語法，這是一種簡潔的文字格式來定義互動故事。

### 基本語法結構

```txt
[meta] title "故事標題"
[intro] 故事簡介內容

[player_var] name "請輸入角色名稱" "範例：小明"
[stat_def] hp 1 20 "生命值"
[var_def] gold 0 1000 "金幣"

[label] 0
[title] 開始頁面
[text] 歡迎來到這個故事世界！
[text|if=hp>10] 你的生命值看起來不錯。
[set] gold=100
[random] 50%
[text] 你發現了一些寶藏！

[choice]
-> 繼續前進 | 1
-> 休息一下 | 2 | if=hp<5
-> 結束遊戲 | END

[label] 1
[title] 第二頁
[text] 你繼續前進了...
[ending]
[text] 恭喜你完成了故事！
```

### 語法元素說明

#### 元數據
- `[meta] title "標題"` - 設定故事標題

#### 簡介
- `[intro] 內容` - 設定故事簡介

#### 玩家變數
- `[player_var] key "提示文字" "預設值"` - 定義玩家需要設定的變數

#### 統計值定義
- `[stat_def] key min max "標籤"` - 定義遊戲統計值（如生命值、攻擊力等）

#### 變數定義
- `[var_def] key min max "標籤"` - 定義遊戲變數

#### 頁面結構
- `[label] id` - 定義頁面 ID
- `[title] 標題` - 設定頁面標題
- `[text] 內容` - 顯示文字內容
- `[text|if=條件] 內容` - 條件性文字
- `[text|speaker=角色] 內容` - 指定說話角色

#### 變數操作
- `[set] key=value` - 設定變數值
- `[set|if=條件] key=value` - 條件性設定變數

#### 隨機事件
- `[random] 百分比%` - 設定隨機觸發機率

#### 選項
- `[choice]` - 開始定義選項
- `-> 選項文字 | 目標頁面 | if=條件 | stat=統計變化`

#### 結局
- `[ending]` - 標記為結局頁面

## 變數系統

### 變數類型

1. **玩家變數** (`playerVariables`)
   - 由玩家設定的角色相關資訊
   - 例如：角色名稱、職業等

2. **統計值** (`stats`)
   - 遊戲中的數值屬性
   - 例如：生命值、攻擊力、防禦力等

3. **遊戲變數** (`variables`)
   - 故事進行中的狀態變數
   - 例如：金幣數量、任務進度等

### 變數操作

```bash
.st set name 小花          # 設定角色名稱
.st set hp 12             # 設定生命值
.st set gold 500          # 設定金幣數量
```

### 條件表達式

支援多種條件判斷：

```txt
[text|if=hp>10] 你的生命值很高
[text|if=gold>=100] 你有足夠的金幣
[text|if=name=="小明"] 你好，小明！
[text|if=hp>5 && gold>50] 你的狀態不錯
```

### 骰子系統

支援骰子表達式：

```txt
[text] 你投出了 {2d6} 點傷害
[text] 你的攻擊力是 {1d20+5}
```

## 平台特定功能

### Discord 專用功能

1. **投票系統**
   ```bash
   .st start story poll 5    # 啟用 5 分鐘投票
   .st edit poll 3          # 切換為 3 分鐘投票
   ```

2. **檔案上傳**
   - 支援拖拽上傳 `.json` 或 `.txt` 檔案
   - 自動解析和驗證檔案格式

3. **私訊功能**
   - 可將劇本以私訊方式傳送給用戶

### 跨平台相容性

- **Line/Telegram/WhatsApp**: 支援基本功能，不支援投票和檔案上傳
- **Discord**: 支援所有功能，包括投票、檔案上傳等

## 限制和規則

### 檔案大小限制
- 最大上傳檔案：1MB
- 最大頁數：400 頁
- 每段文字最大長度：500 字

### 用戶限制
根據 VIP 等級有不同的限制：

| VIP 等級 | 劇本數量限制 | 同時進行遊戲數 |
|---------|-------------|---------------|
| 0       | 3           | 3             |
| 1       | 10          | 10            |
| 2+      | 100         | 100           |

### 權限系統

1. **AUTHOR_ONLY**: 僅作者可啟動
2. **GROUP_ONLY**: 僅指定群組可啟動
3. **ANYONE**: 任何人可啟動

## 最佳實踐

### 創建劇本

1. **規劃故事結構**
   - 先設計主要情節和分支
   - 確定結局數量和多樣性

2. **變數設計**
   - 合理設計統計值範圍
   - 提供有意義的玩家變數

3. **測試和驗證**
   - 使用 `.st verify` 檢查格式
   - 測試所有分支和結局

### 遊戲進行

1. **角色設定**
   - 鼓勵玩家設定豐富的角色資訊
   - 根據角色資訊提供個性化內容

2. **進度管理**
   - 適時使用暫停功能
   - 記錄重要的遊戲狀態

3. **社群互動**
   - 在 Discord 中使用投票功能增加參與感
   - 鼓勵玩家分享遊戲體驗

## 故障排除

### 常見問題

1. **找不到劇本**
   - 檢查 alias 是否正確
   - 確認權限設定

2. **無法啟動遊戲**
   - 檢查是否已達同時進行遊戲數限制
   - 確認劇本格式是否正確

3. **變數設定失敗**
   - 檢查變數名稱是否正確
   - 確認數值範圍是否合理

### 除錯工具

```bash
.st debug    # 顯示詳細的遊戲狀態資訊
```

## 範例劇本

### 簡單冒險故事

```txt
[meta] title "森林冒險"
[intro] 你是一個勇敢的冒險者，正在探索神秘的森林。

[player_var] name "請輸入你的角色名稱" "範例：亞瑟"
[stat_def] hp 10 20 "生命值"
[stat_def] strength 1 10 "力量"

[label] 0
[title] 森林入口
[text] 歡迎，{name}！你來到了神秘的森林入口。
[text] 你的生命值：{hp}，力量：{strength}
[choice]
-> 進入森林 | 1
-> 先休息一下 | 2 | if=hp<15
-> 離開 | END

[label] 1
[title] 森林深處
[text] 你進入了森林深處，發現了一個古老的遺跡。
[random] 30%
[text] 突然，一隻野獸出現了！
[set] hp=hp-5
[choice]
-> 戰鬥 | 3 | if=strength>5
-> 逃跑 | 4
-> 投降 | END

[label] 2
[title] 休息
[text] 你決定先休息一下，恢復了一些體力。
[set] hp=hp+5
[choice]
-> 現在進入森林 | 1
-> 繼續休息 | 2

[label] 3
[title] 戰鬥勝利
[text] 你勇敢地擊敗了野獸！
[set] strength=strength+1
[ending]
[text] 恭喜你完成了冒險！

[label] 4
[title] 逃跑
[text] 你選擇了逃跑，雖然安全但錯過了寶藏。
[ending]
[text] 你安全離開了森林，但沒有獲得任何獎勵。
```

這個範例展示了 StoryTeller 的基本功能，包括變數設定、條件判斷、隨機事件和多重結局。

## 更新日誌

### 最新功能
- 支援 RUN_DESIGN 語法
- Discord 投票系統
- 跨平台暫停/繼續功能
- 增強的角色統計系統
- 改進的權限管理

### 已知限制
- 投票功能僅限 Discord
- 檔案上傳僅限 Discord
- 某些進階功能需要 VIP 等級

---

*StoryTeller 系統持續更新中，請關注最新版本的功能和改進。*
