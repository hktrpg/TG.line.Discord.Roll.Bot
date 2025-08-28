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
- Choices block:
  - `[choice]` starts choices list
  - `-> <text> | <action> [| if=<expr>] [| stat=a+1,b-2]`

### Expressions

- Conditions use a small JS-like subset against scope: variables + stats + playerVariables
- Supported operators: `&& || ! < <= > >= == === != !== + - * / % ()`

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

- Import text: `.st importfile <alias> <path> [title]`
- Export text: `.st exportfile <alias> <path>` (also writes `roll/storyTeller/<alias>`)
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
