# RUN_DESIGN 文字格式指南

本指南描述一種簡潔、便於人手編輯的互動故事文字格式（RUN_DESIGN）。同時支援可逆轉換：JSON → RUN_DESIGN → JSON，在支援的欄位範圍內不會有語義流失。

## 目標

- 簡單、可讀、利於版本控管的文字格式
- 能編譯成 JSON 的故事結構
- 能將 JSON 無語義差異地匯出回文字

## 檔案編碼

- UTF-8

## 空白與註解（Whitespace & Comments）

- 允許空白行。
- 以 `//` 開頭的單行為註解，編譯時會被忽略。

## 頂層後設資料（Metadata）

- `[meta] title "<Title>"` 設定故事標題
- `[intro] <text>` 追加一行故事導言（可重複多行）

顯示行為：

- 在 `.st list` 中：
  - 指定 alias 時，會完整顯示該故事的導言（若有）。
  - 列出所有可啟動劇本時，會在每列標題下顯示導言第一行的預覽（最多 80 字）。
- 在 `.st mylist` 中：
  - 每項劇本會顯示導言第一行的預覽（最多 80 字）。
- 在啟動遊戲後且玩家變數尚未完成設定時：
  - 角色設定提示前會先顯示【簡介】區塊，內容為導言全文。

範例：

```text
[meta] title "貓咪的一天"
[intro] 歡迎來到互動故事！
```

## 玩家變數（Player Variables）

- `[player_var] <key> "<prompt>" ["<placeholder>"]`
  - key：識別字，例如 `cat_name`
  - prompt：顯示給玩家的提問
  - placeholder：可選的提示文字

範例：

```text
[player_var] cat_name "1. 請輸入你的貓咪名字：" "例如：橘子、Mochi、小黑"
[player_var] owner_name "2. 請輸入主人的名字：" "例如：小明、艾蜜莉、阿傑"
```

## 遊戲屬性（Game Stats）

- `[stat_def] <key> <min> <max> ["<label>"]`

- 初始化：未被明確設定時，首次開始時以 `min`~`max` 隨機整數初始化。
- 鎖定：若該屬性曾被內容內的 `[set]` 明確指定，之後將不再被隨機初始化覆寫。

範例：

```text
[stat_def] Cuteness 1 10 "萌度 (Cuteness)"
[stat_def] Energy 1 10 "活力 (Energy)"
[stat_def] Mischief 1 10 "淘氣度 (Mischief)"
```

## 變數（Variables）

- `[var_def] <key> <min> <max> ["<label>"]`

範例：

```text
[var_def] rain 0 1 "下雨"
```

## 頁面（Pages）

故事由多個頁面組成。

- 定義頁面標籤（ID）：`[label] <id>`
- 可選頁面標題：`[title] <text>`
- 頁面內容（不限行數）：
  - `[text] <content>`
  - `[text|if=<expr>] <content>` 條件顯示
  - `[text|speaker=<key>] <content>` 指定說話者
  - `[text|speaker=<key>,if=<expr>] <content>` 指定說話者且具條件
  - `[random] <percent>%` 僅影響「下一行」的 `[text]`（例如 30%），`percent` 為 0~100 的整數。
  - `[set] <key>=<expr>` 在渲染時設定值：若 `key` 屬於已定義的 `stat_def`，則寫入 `stats`；否則寫入 `variables`。`<expr>` 支援基本運算式（見下文）。
    - 任一屬性一旦被 `[set]` 明確設定，之後將不再由隨機初始化覆寫。
  - 文字內可直接擲骰：`{xDy}` 會在顯示時擲骰並以總和取代，例如 `{1D100}`、`{2d20}`、`{3d6}`。
- 結局標記：
  - `[ending]` 之後的 `[text]` 行視為結局文字，會使用第一個符合條件的結局
  - 要求：一個有效的 RUN_DESIGN 必須至少包含一個帶有 `[ending]` 標記的頁面；若未定義結局，上傳/更新將被拒絕。
- 選項區塊：
  - `[choice]` 開始定義選項列表
  - `-> <text> | <action> [| if=<expr>] [| stat=a+1,b-2]`
    - `<action>` 可為任意頁面 ID（字串將原樣作為 ID 使用），或特殊值 `END`。
    - `<action>` 為 `END` 時，介面會提供「`.st end`」按鈕以結束遊戲。
    - `stat=` 僅支援整數加減，並在成功前往該選項之目標頁面時套用（例：`Cuteness+1,Energy-2`）。

### 運算式（Expressions）

- 條件以小型、類 JS 的子集合為語法，運行於 scope（`variables` + `stats` + `playerVariables`）
- 支援運算子：`&& || < <= > >= == === != !== + - * / % ()`
- 安全限制：不允許任何函式呼叫；不可存取 `globalThis`、`global`、`process`、`this`、`Function`、`constructor`、`require` 等識別字。
  - 範例：`if=Cuteness>=8 && Energy>3`

#### 擲骰（Dice）

- 在條件與賦值運算式中，可直接使用 `xDy` 字面量，會在運算前擲骰並以總和值替換，例如：
  - `if=2d20>25`
  - `[set] luck=3d6+2`
  - 允許的範圍：`x` 1~100、`y` 1~10000；超出將被夾在此範圍內。

#### 條件賦值（Conditional Set）

- 支援在 `[set]` 上使用條件選項：`[set|if=<expr>] key=<expr>`。
- 結合擲骰，可實作常見的檢定流程。

範例：

```text
[stat_def] san 0 100 "SAN"
[set] san=70

[label] SAN_CHECK
[set] sancheck=1d100
[text] sancheck={sancheck}
[set|if=san<sancheck] san=san-1
[text|if=san<sancheck] 你扣了1san
[text|if=san>=sancheck] 你穩住了心神
```

### 範例頁面（Example Page）

```text
[label] 0
[title] 角色創造
[text] 設定完成！現在，讓我們來看看 {cat_name} 今天的狀態...
[text] (系統會為你隨機生成 1-10 的數值)
[text] - 萌度 (Cuteness): {Cuteness}
[text] - 活力 (Energy): {Energy}
[text] - 淘氣度 (Mischief): {Mischief}
[choice]
-> 準備好了嗎？ | 1
```

### 結局頁（Ending Page）

```text
[label] 22
[title] 結局
[ending]
[text|if=Cuteness>8] 以賣萌獲得原諒
[text] 溫柔的無奈
[choice]
-> 回到開頭 | 0
-> 結束遊戲 | END
```

## 佔位符（Placeholders）

- 在 `[text]` 內使用 `{key}` 會依序從 `playerVariables`、`stats`、`variables` 取值並套入（優先順序如前，後者可覆蓋前者）。
- 若找不到對應鍵，將保留原樣（例如 `{unknown_key}` 會原樣輸出）。

## 往返轉換（Round Trip）

- 匯入文字（於 Discord 夾帶檔案）：傳送 `.st import <alias> [title]` 並附上 `.txt`（RUN_DESIGN）或 `.json` 檔案
- 更新既有劇本：`.st update <alias> [title]` 並附上新檔案
- 匯出文字：`.st exportfile <alias>`（機器人將以私訊傳送文字檔）
- 驗證可逆：`.st verify <alias>`

### 正規化（Normalization）

- 編譯器會將緊鄰的 `[random]` 與其後的第一行 `[text]` 合併解釋為「機率顯示」。
- 匯出時，若頁面是結局頁，`[ending]` 會緊跟在該頁 `[label]` 之下，以維持可逆性。

## 慣例（Conventions）

- 初始頁面預設為 `0`。若需要可在編譯後的 JSON 再行設定。
- 說話者為可選；示例採用純文字。
- 若需在內文中加入隨機性，請於欲影響的 `[text]` 之前「緊貼」放置 `[random] <percent>%`（percent 為整數）。
- 若需在選項上改變屬性值，使用 `stat=a+1,b-2`（僅支援整數加減）。

## 最佳實務（Best Practices）

- 為可讀性建議使用數字且連續的 ID
- 條件判斷儘量簡單並以已定義的鍵為基礎
- 避免過長的行；可拆分成多個 `[text]`
- 確保每個結局頁面都提供重新開始或結束的選項

## 限制（Limits）

- 最多頁數：400
- 每段文字（每一行 `[text]`，包含結局文字）最長 500 字
- 至少需包含一個帶有 `[ending]` 的頁面
- 匯入/更新之附件大小上限：約 1 MB
