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
- 以 `//` 開頭的單行為註解，編譯時會被忽略。請另開新行。

## 頂層後設資料（Metadata）

- `[meta] title "<Title>"` 設定故事標題
- `[meta] author "<Author>"` 設定作者（必填；匯入/更新時若缺少會被拒絕）
- `[intro] <text>` 追加一行故事導言（可重複多行），在劇本開始時會顯示。

顯示行為：

- 在 `.st list` 中：
  - 指定 alias 時，會顯示作者並完整顯示該故事的導言（若有）。
  - 列出所有可啟動劇本時，會在每列標題下顯示作者與導言第一行的預覽（最多 80 字）。
- 在 `.st mylist` 中：
  - 每項劇本會顯示導言第一行的預覽（最多 80 字）。
- 在啟動遊戲後且玩家變數尚未完成設定時：
  - 角色設定提示前會先顯示【簡介】區塊，內容為導言全文。

範例：

```text
[meta] title "貓咪的一天"
[meta] author "HKTRPG"
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
[player_var] owner_name "2. 請輸入主人的名字：" "小明、艾蜜莉、阿傑"
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

額外示例（供後續範例使用）：

```text
[stat_def] Power 1 10 "力量 (Power)"
[stat_def] Agility 1 10 "敏捷 (Agility)"
[stat_def] Wit 1 10 "智力 (Wit)"
```

## 變數（Variables）

- `[var_def] <key> <min> <max> ["<label>"]`

- 初始化：未被明確設定時，變數初始值為其 `min`。

範例：

```text
[var_def] rain 0 1 "下雨"
```

## 頁面（Pages）

故事由多個頁面組成。

- 定義頁面標籤（ID）：`[label] <id>`
  - **限制**：頁面 ID 只能使用數字（如 `0`, `1`, `2`, `10` 等）
  - **開點頁面**：`[label] 0` 為故事的起始頁面，遊戲開始時會自動載入此頁面
  - 其他頁面可使用任意數字作為 ID，建議使用連續數字以保持可讀性
- 可選頁面標題：`[title] <text>`
- 頁面內容（不限行數）：
  - `[text] <content>`
  - `[text|if=<expr>] <content>` 條件顯示
  - `[text|else] <content>` 與前一或多個連續的 `[text|if=...]` 形成條件鏈，只會顯示第一個符合條件的項目；若皆不符合則顯示 `else`。也支援於結局區塊中使用。
  - `[text|ifs=<expr>] <content>` 獨立條件顯示：只要命中就顯示，不會與上下鄰近的 `[text|if=...]`/`[text|else]` 形成條件鏈。
  - `[text|speaker=<key>] <content>` 指定說話者
  - `[text|speaker=<key>,if=<expr>] <content>` 指定說話者且具條件
  - `[random] <percent>%` 僅影響「下一行」的 `[text]`（例如 30%），`percent` 為 0~100 的整數。
  - `[set] <key>=<expr>` 在渲染時設定值：若 `key` 屬於已定義的 `stat_def`，則寫入 `stats`；否則寫入 `variables`。`<expr>` 支援基本運算式（見下文）。
  - `[set|if=<expr>] <key>=<expr>` 條件賦值（命中才執行）。
  - `[set|ifs=<expr>] <key>=<expr>` 獨立條件賦值：不與相鄰的 `[text|if=...]`/`[text|else]` 形成條件鏈，命中即執行；常用於和多段 `ifs` 顯示對齊。

    - 任一屬性一旦被 `[set]` 明確設定，之後將不再由隨機初始化覆寫。
  - 文字內可直接擲骰：`{xDy}` 會在顯示時擲骰並以總和取代，例如 `{1D100}`、`{2d20}`、`{3d6}`。
- 結局標記：
  - `[ending]` 之後的 `[text]` 行視為結局文字，會使用第一個符合條件的結局
  - 支援條件鏈：可使用多行 `[text|if=...]` 後接一行 `[text|else]` 作為後備
  - 要求：一個有效的 RUN_DESIGN 必須至少包含一個帶有 `[ending]` 標記的頁面；若未定義結局，上傳/更新將被拒絕。
- 選項區塊：
  - `[choice]` 開始定義選項列表
  - `-> <text> | <頁面代號> [| if=<expr>] [| stat=a+1,b-2]`
    - `<頁面代號>` 必須為數字頁面 ID，或使用帶字母尾碼的變體（例如 `2a`、`2b`、`2c`）；或特殊值 `END`。
    - **新功能**：支援 `2a`, `2b`, `2c` 等格式，其中數字部分（如 `2`）為實際跳轉的頁面，字母部分（如 `a`, `b`, `c`）僅用於區分不同的加成或描述變體（實際跳轉到 `2`）。
    - `<頁面代號>` 為 `END` 時，介面會提供「`.st end`」按鈕以結束遊戲。
    - `stat=` 僅支援整數加減，並在成功前往該選項之目標頁面時套用（例：`Cuteness+1,Energy-2`）。

### 新功能：多選項同頁面跳轉

使用 `2a`, `2b`, `2c` 等格式可以讓多個選項都跳轉到同一個頁面（如頁面 `2`），但每個選項可以有不同的加成效果：

```text
[choice]
-> 準備好大鬧一場了！ | 2a | stat=Mischief+1
-> 先伸個懶腰，看看今天心情如何。 | 2b | stat=Cuteness+1
-> 今天也要充滿活力！ | 2c | stat=Energy+1
```

當玩家使用 `.st goto 2a`、`.st goto 2b`、`.st goto 2c` 時：

- 都會跳轉到頁面 `2`
- 但會分別獲得不同的加成：淘氣度+1、萌度+1、活力+1

### 運算式（Expressions）

- 條件以小型、類 JS 的子集合為語法，運行於 scope（`variables` + `stats` + `playerVariables`）
- 支援運算子：`&& || ! < <= > >= == === != !== + - * / % ()`
- 安全限制：不允許任何函式呼叫；不可存取 `globalThis`、`global`、`process`、`this`、`Function`、`constructor`、`require` 等識別字。

  - 範例：`if=Cuteness>=8 && Energy>3`
- 支援一元否定 `!expr`（可搭配括號以控制優先順序）。

  - 範例：`if=(Strength>5) && !(Agility>5)`

#### 擲骰（Dice）

- 在條件與賦值運算式中，可直接使用 `xDy` 字面量，會在運算前擲骰並以總和值替換，例如：
  - `if=2d20>25`
  - `[set] luck=3d6+2`
  - 允許的範圍：`x` 1~100、`y` 1~10000；超出將被夾在此範圍內。

#### 條件賦值（Conditional Set）

- 支援在 `[set]` 上使用條件選項：
  - `[set|if=<expr>] key=<expr>`：一般條件賦值。
  - `[set|ifs=<expr>] key=<expr>`：獨立條件賦值（不參與 if/else 鏈）。
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
[text|ifs=Wit==1]確切屬性值 -> Wit: 1
[text|ifs=Wit==2]確切屬性值 -> Wit: 2
[text|ifs=Wit==3]確切屬性值 -> Wit: 3
[text|ifs=Wit==4]確切屬性值 -> Wit: 4
[text|if=Cuteness>Mischief+2] 他笑了笑，把它撿起來，說：「你這個小搗蛋鬼。」然後把我抱起來，親了一下。我的惡作劇成功了！
[text|if=Cuteness<=Mischief+2 && Cuteness > 4] 他嘆了口氣說：「{cat_name}，不可以這樣喔。」但他還是忍不住摸了摸我的頭。看來這次被原諒了。
[text|if=Cuteness<=4] 他看起來有點生氣，把我抱起來唸了幾句，今天沒有點心了。
[text|if=Cleverness>=10] 他注意到我的聰明眼神，笑著說：「你是不是在計劃什麼？」並給了我額外獎勵。
[text|else] 他只是搖搖頭，收拾了一下。今天是普通的一天。
[choice]
-> 準備好了嗎？ | 1
```

### 結局頁（Ending Page）

```text
[label] 22
[title] 結局
[ending]
[text|if=Cuteness>8] 以賣萌獲得原諒
[text|else] 溫柔的無奈
[choice]
-> 回到開頭 | 0
-> 結束遊戲 | END
```

## 佔位符（Placeholders）

- 在 `[text]` 內使用 `{key}` 時，鍵值解析優先順序為：`variables` → `stats` → `playerVariables`（玩家變數最高優先）。
- 若同名鍵同時存在，後者將覆蓋前者；若找不到對應鍵，將保留原樣（例如 `{unknown_key}` 會原樣輸出）。
- 字串值內若再包含 `{...}`，會進行一次巢狀展開。

### 註：相容性與限制補充

- 目前不支援以純字串作為頁面 ID；請使用數字頁面 ID（例如 `0`, `1`, `2`）。
- `[set]` 行允許在值的後方加上行尾 `//` 註解，匯入時該註解會被忽略，不影響賦值內容。

## 往返轉換（Round Trip）

- 匯入文字（於 Discord 夾帶檔案）：傳送 `.st import <alias> [title]` 並附上 `.txt`（RUN_DESIGN）或 `.json` 檔案
- 更新既有劇本：`.st update <alias> [title]` 並附上新檔案
- 匯出文字：`.st exportfile <alias>`（機器人將以私訊傳送文字檔）
- 驗證可逆：`.st verify <alias>`

### 正規化（Normalization）

- 編譯器會將緊鄰的 `[random]` 與其後的第一行 `[text]` 合併解釋為「機率顯示」。
- 匯出時，若頁面是結局頁，`[ending]` 會緊跟在該頁 `[label]` 之下，以維持可逆性。

## 慣例（Conventions）

- **開點頁面**：`[label] 0` 為故事的起始頁面，遊戲開始時會自動載入此頁面。若需要可在編譯後的 JSON 再行設定。
- **頁面 ID 限制**：只能使用數字作為頁面 ID。
- 說話者為可選；示例採用純文字。
- 若需在內文中加入隨機性，請於欲影響的 `[text]` 之前「緊貼」放置 `[random] <percent>%`（percent 為整數）。
- 若需在選項上改變屬性值，使用 `stat=a+1,b-2`（僅支援整數加減）。
- 若需多個選項跳轉到同一頁面但有不同的加成效果，使用 `2a`, `2b`, `2c` 等格式。

## 最佳實務（Best Practices）

- 為可讀性建議使用數字且連續的 ID
- 條件判斷儘量簡單並以已定義的鍵為基礎
- 避免過長的行；可拆分成多個 `[text]`
- 確保每個結局頁面都提供重新開始或結束的選項
- 善用 `2a`, `2b`, `2c` 格式來創建有不同加成的選項

## 限制（Limits）

- 最多頁數：400
- 每段文字（每一行 `[text]`，包含結局文字）最長 500 字
- 至少需包含一個帶有 `[ending]` 的頁面
- 匯入/更新之附件大小上限：約 1 MB
- 頁面 ID 只能使用數字

## 更多範例（More Examples）

### 說話者（Speakers）與條件鏈

```text
[label] 5
[title] 對話示例
[text|speaker=cat] 喵～今天要做什麼呢？
[text|if=Energy>=8] 我覺得精力充沛！
[text|if=Energy>=5 && Energy<8] 還行，可以動一動。
[text|else] 有點想睡覺……
[choice]
-> 出門巡視 | 6
-> 先小睡一下 | 7
```

說話者為可選欄位，渲染時僅作為資料欄位保存，不影響文字輸出。

### 隨機顯示（Random）

```text
[label] 6
[title] 隨機事件
[random] 30%
[text] 你意外撿到一根貓薄荷棒！
[text] 無論是否撿到，你繼續前進。
```

`[random] <percent>%` 僅作用於其後第一行 `[text]`，編譯器在匯出時會保持可逆性。

### 內嵌擲骰（Dice）與條件檢定

```text
[label] 8
[title] 擲骰檢定
[set] roll=1d20
[text] 你的檢定結果為：{roll}
[text|if=roll+Energy>=18] 大成功！
[text|else] 普通成功或失敗。
```

在運算式中可使用 `xDy` 字面量；在文字中可用 `{xDy}` 直接內嵌擲骰，顯示總和。

### 條件賦值（Conditional Set）與字串值

```text
[label] 9
[title] 狀態標記
[set|if=Energy>=8] mood="energetic"
[set|if=Energy<8] mood="lazy"
[text] 目前心情：{mood}
```

RHS 以引號包裝時會被視為字串常值；否則會嘗試以表達式求值。

### 多個選項同頁面跳轉（帶加成）

```text
[label] 10
[title] 開場選擇
[choice]
-> 走力量路線 | 2a | stat=Power+1
-> 走敏捷路線 | 2b | stat=Agility+1
-> 走智力路線 | 2c | stat=Wit+1

[label] 2
[title] 共用頁面
[text] 你來到了訓練場。
```

玩家輸入 `.st goto 2a/2b/2c` 皆會抵達頁面 `2`，但各自套用不同的加成。

### 獨立條件顯示（ifs）

```text
[label] 11
[title] 屬性揭示
[text|ifs=Wit==1] 你感到有點遲鈍。
[text|ifs=Wit>=8] 你靈光一閃，找到了捷徑。
[text] 無論如何，你繼續前進。
```

使用 `ifs` 的 `[text]` 不會與相鄰的 `if/else` 形成條件鏈，命中就顯示，可同時出現多行。

### 結局區塊的條件鏈

```text
[label] 99
[title] 結局
[ending]
[text] 旅程告一段落。
[text|if=Power>=8] 你以力量壓倒眾人，建立了威名。
[text|if=Agility>=8] 你以身法穿梭暗影，無跡可尋。
[text|else] 你學到了寶貴的一課，準備再出發。
[choice]
-> 重新開始 | 0
-> 結束 | END
```

結局的多行 `[text|if=...]` 與一行 `[text|else]` 形成條件鏈，僅顯示第一個符合條件者；可在其上方書寫無條件前言文字。

### 佔位符的優先順序與巢狀

```text
[label] 12
[title] 佔位符
[set] title="勇者"
[set] who="{owner_name}"
[text] {who} 稱呼你為「{title}」。
```

`{key}` 鍵值解析優先順序為 `variables` → `stats` → `playerVariables`（玩家變數最高優先）。字串值內若再包含 `{...}`，會進行一次巢狀展開。