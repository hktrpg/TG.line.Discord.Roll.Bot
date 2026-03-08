# 更新檢查摘要 (2026-03-08)

## 1. modules/level.js

| 項目 | 狀態 | 說明 |
|------|------|------|
| gpInfoCache | ✅ | Map，TTL 5 分鐘、上限 2000，prune 用 for...of 符合 eslint |
| getGroupLevelConfig(groupid) | ✅ | 先查快取，再 findOne().lean()，僅快取 SwitchV2 true |
| invalidateGroupConfig(groupid) | ✅ | gpInfoCache.delete(groupid) |
| EXPUP 使用 getGroupLevelConfig | ✅ | 取代直接 findOne，catch 時回傳 null，錯誤 log 用 error.reason ?? error.message |
| tempSwitchV2 更新 | ✅ | 僅在 !filterSwitchV2 時 push { groupid, SwitchV2: !!gpInfo } |
| returnTheLevelWord 排名 | ✅ | countDocuments({ groupid, EXP: { $gt: userInfo.EXP } }) + 1，錯誤時回傳 0 |
| usermember_count 除零 | ✅ | 改為 Math.max(membercount, 1) 避免 ranking % 除零 |
| 錯誤日誌 | ✅ | 四處皆為 error.reason ?? error.message |
| module.exports | ✅ | EXPUP, tempSwitchV2, getGroupLevelConfig, invalidateGroupConfig |

---

## 2. modules/schema.js

| 項目 | 狀態 | 說明 |
|------|------|------|
| trpgLevelSystemMember 索引 | ✅ | { groupid: 1, userid: 1 }, { groupid: 1, EXP: -1 } |

---

## 3. modules/message.js

| 項目 | 狀態 | 說明 |
|------|------|------|
| newUserChecker findOne | ✅ | 加上 .lean()，僅判斷是否存在 |

---

## 4. roll/z_Level_system.js

| 項目 | 狀態 | 說明 |
|------|------|------|
| .level config 00/01/10/11 | ✅ | 每次 save 後呼叫 invalidateGroupConfig(groupid)，且 if (temp) temp.SwitchV2 = ... 防 undefined |
| TitleWord 刪除/新增 | ✅ | save 或 updateOne 後 invalidateGroupConfig(groupid) |
| LevelUpWord 刪除/新增 | ✅ | save 後 invalidateGroupConfig(groupid) |
| RankWord 刪除/新增 | ✅ | save 後 invalidateGroupConfig(groupid) |
| .level show | ✅ | 改用 getGroupLevelConfig(groupid)，!doc 時顯示未開啟訊息 |
| .level showMe | ✅ | 改用 getGroupLevelConfig(groupid)，!doc 時顯示未開啟訊息 |
| 錯誤日誌 | ✅ | 上述兩處 catch 使用 error.reason ?? error.message |

---

## 5. test/z_Level_system.test.js

| 項目 | 狀態 | 說明 |
|------|------|------|
| level mock | ✅ | 新增 getGroupLevelConfig、invalidateGroupConfig 為 jest.fn()，避免 require 時缺少 export |

---

## 6. docs

| 檔案 | 狀態 |
|------|------|
| DB_OPTIMIZATION_2026-03-08.md | ✅ 含 Level 排名、索引、gpInfo 快取、first time message、可選優化、索引一覽 |

---

## 7. Lint

| 項目 | 狀態 |
|------|------|
| level.js | ✅ 無錯誤 |
| z_Level_system.js | ✅ 無錯誤 |
| message.js / schema.js | ✅ 無錯誤 |

---

## 8. 邊界與注意

- **gpInfo 為 plain object**：returnTheLevelWord 與 checkTitle 使用 gpInfo.Title 等，.lean() 回傳的 plain object 欄位一致，無問題。
- **首次 config**：該群尚未在 tempSwitchV2 時，temp 為 undefined，已用 if (temp) 避免寫入 undefined。
- **usermember_count**：改為 Math.max(membercount, 1) 避免 membercount 為 0 時 ranking % 除零。

以上更新已檢查完畢。
