# RUN_DESIGN Text Format Guide

This guide describes a concise, human-editable text format (RUN_DESIGN) for interactive stories that compiles to the JSON schema used by `story` in `modules/schema.js` (e.g., `03.json`). It also supports round-trip conversion: JSON → RUN_DESIGN → JSON without loss for supported fields.

## Goals

- Simple, readable, version-friendly text format
- Can compile into JSON story schema
- Can export JSON story back to text with no semantic differences

## File Encoding

- UTF-8

## Top-level Metadata

- `[meta] title "<Title>"` Set story title
- `[intro] <text>` Append one line to introduction (repeatable)

Example:

```text
[meta] title "貓咪的一天"
[intro] 歡迎來到互動故事！
```

## Player Variables

- `[player_var] <key> "<prompt>" ["<placeholder>"]`
  - key: identifier, e.g. `cat_name`
  - prompt: question shown to player
  - placeholder: optional hint

Example:

```text
[player_var] cat_name "1. 請輸入你的貓咪名字：" "例如：橘子、Mochi、小黑"
[player_var] owner_name "2. 請輸入主人的名字：" "例如：小明、艾蜜莉、阿傑"
```

## Game Stats

- `[stat_def] <key> <min> <max> ["<label>"]`

Example:

```text
[stat_def] Cuteness 1 10 "萌度 (Cuteness)"
[stat_def] Energy 1 10 "活力 (Energy)"
[stat_def] Mischief 1 10 "淘氣度 (Mischief)"
```

## Variables

- `[var_def] <key> <min> <max> ["<label>"]`

Example:

```text
[var_def] rain 0 1 "下雨"
```

## Pages

A story is a collection of pages.

- Define a page label (ID): `[label] <id>`
- Optional page title: `[title] <text>`
- Page content (any number of lines):
  - `[text] <content>`
  - `[text|if=<expr>] <content>` (conditional)
  - `[text|speaker=<key>] <content>`
  - `[text|speaker=<key>,if=<expr>] <content>`
  - `[random] <percent>%` affects the next `[text]` line (e.g., 30%)
  - `[set] <var>=<value>` sets `variables` during render
- Ending mark:
  - `[ending]` subsequent `[text]` lines become ending texts, the first condition-matching ending is used
  - Requirement: a valid RUN_DESIGN must contain at least one page marked with `[ending]`. Upload/update will be rejected if no endings are defined.
- Choices block:
  - `[choice]` starts choices list
  - `-> <text> | <action> [| if=<expr>] [| stat=a+1,b-2]`

### Expressions

- Conditions use a small JS-like subset against scope: variables + stats + playerVariables
- Supported operators: `&& || < <= > >= == === != !== + - * / % ()`

### Example Page

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

### Ending Page

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

## Placeholders

- `{key}` inside `[text]` interpolates from `playerVariables`, `stats`, and `variables` (in that order of preference).

## Round Trip

- Import text (Discord attachment): send `.st import <alias> [title]` with a `.txt` (RUN_DESIGN) or `.json` file attached
- Update existing: `.st update <alias> [title]` with the new attachment
- Export text: `.st exportfile <alias>` (the bot will DM you a text file)
- Verify reversible: `.st verify <alias>`

## Conventions

- Initial page defaults to `0`. You can set it in JSON after compile if needed.
- Speakers are optional; the demo uses plain text.
- For randomness within content, use `[random] <percent>%` immediately before a `[text]`.
- For stat changes on choices, use `stat=a+1,b-2`.

## Best Practices

- Keep IDs numeric and sequential for readability
- Keep conditions simple and based on defined keys
- Avoid excessively long lines; split into multiple `[text]`
- Ensure every ending page provides choices to restart or end

## Limits

- Maximum pages: 400
- Maximum characters per text segment (each `[text]` line, including endings): 500
- At least one page must be marked with `[ending]`
- Upload size limit (for import/update attachments): approximately 1 MB

## RUN_DESIGN 文字格式指南（繁體中文）

本指南描述一種簡潔、便於人手編輯的互動故事文字格式（RUN_DESIGN），可編譯成 `modules/schema.js` 中 `story` 使用的 JSON 結構（例如 `03.json`）。同時支援可逆轉換：JSON → RUN_DESIGN → JSON，在支援的欄位範圍內不會有語義流失。

## 目標

- 簡單、可讀、利於版本控管的文字格式
- 能編譯成 JSON 的故事結構
- 能將 JSON 無語義差異地匯出回文字

## 檔案編碼

- UTF-8

## 頂層後設資料（Metadata）

- `[meta] title "<Title>"` 設定故事標題
- `[intro] <text>` 追加一行故事導言（可重複多行）

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
  - `[random] <percent>%` 影響緊接著的下一行 `[text]`（例如 30%）
  - `[set] <var>=<value>` 在渲染時設定 `variables`
- 結局標記：
  - `[ending]` 之後的 `[text]` 行視為結局文字，會使用第一個符合條件的結局
  - 要求：一個有效的 RUN_DESIGN 必須至少包含一個帶有 `[ending]` 標記的頁面；若未定義結局，上傳/更新將被拒絕。
- 選項區塊：
  - `[choice]` 開始定義選項列表
  - `-> <text> | <action> [| if=<expr>] [| stat=a+1,b-2]`

### 運算式（Expressions）

- 條件以小型、類 JS 的子集合為語法，運行於 scope（`variables` + `stats` + `playerVariables`）
- 支援運算子：`&& || < <= > >= == === != !== + - * / % ()`

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

- 在 `[text]` 內使用 `{key}` 會依序從 `playerVariables`、`stats`、`variables` 取值並套入（優先順序如前）。

## 往返轉換（Round Trip）

- 匯入文字（於 Discord 夾帶檔案）：傳送 `.st import <alias> [title]` 並附上 `.txt`（RUN_DESIGN）或 `.json` 檔案
- 更新既有劇本：`.st update <alias> [title]` 並附上新檔案
- 匯出文字：`.st exportfile <alias>`（機器人將以私訊傳送文字檔）
- 驗證可逆：`.st verify <alias>`

## 慣例（Conventions）

- 初始頁面預設為 `0`。若需要可在編譯後的 JSON 再行設定。
- 說話者為可選；示例採用純文字。
- 若需在內文中加入隨機性，請在欲影響的 `[text]` 之前緊接著放置 `[random] <percent>%`。
- 若需在選項上改變屬性值，使用 `stat=a+1,b-2`。

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
