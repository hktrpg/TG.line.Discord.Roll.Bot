# Rocky Linux 9 + Docker + MongoDB 8.2（CST/UTC+8）最終可用教學

目標：兩個 Bot（Discord + TG）共用同一個 MongoDB，並且所有時間顯示為台灣時間（`Asia/Taipei`，UTC+8 / CST）。

本教學會使用 repo 內新增的檔案：
- `infra/rocky-docker/docker-compose.yml`
- `infra/rocky-docker/Dockerfile`
- `infra/rocky-docker/update-logs.sh`
- `infra/rocky-docker/systemd/update-logs.service`
- `infra/rocky-docker/systemd/update-logs.timer`

## 1. 前置條件

1. Rocky Linux 9
2. Docker Engine + Docker Compose（`docker compose` 可正常使用）
3. 已準備好可掛載 50G 的 Block Volume，並把它掛到 `/data`

## 2. 全系統時區設為台灣時間（重點）

在主機上確認時區：
```bash
timedatectl
```

設定為台灣時間：
```bash
sudo timedatectl set-timezone Asia/Taipei
```

本教學也同時做了容器層級的設定：所有服務都會設定 `TZ=Asia/Taipei`，並掛入 `/etc/localtime`，避免跨系統時間偏差。

## 3. 建立目錄與權限（/data 統一管理）

以下目錄都建議放在 `/data`：
```bash
sudo mkdir -p /data/bots /data/mongodb /data/logs/discord-bot /data/logs/tg-bot /data/logs/archive
```

MongoDB 容器在此 compose 內以 `user: "999:999"` 執行，建議預先把資料夾權限調整：
```bash
sudo chown -R 999:999 /data/mongodb
```

## 4. 設定 MongoDB（含 rollbot / backup 帳號）

### 4.1 啟動 MongoDB + 兩個 Bot 容器

repo 根目錄執行：
```bash
docker compose -f infra/rocky-docker/docker-compose.yml up -d
```

MongoDB root 密碼請使用 `infra/rocky-docker/.env.example` 的方式提供（請確保存在 `infra/rocky-docker/.env`，或在執行 compose 前先用 `export MONGO_INITDB_ROOT_PASSWORD=...`）：
- 需要 `infra/rocky-docker/.env`（包含 `MONGO_INITDB_ROOT_PASSWORD=...`）

### 4.2 在 MongoDB 建立 rollbot / backup 帳號

容器啟動後，使用 root 帳號登入並建立：
```bash
docker compose -f infra/rocky-docker/docker-compose.yml exec mongodb mongosh -u hktrpgadmin -p YOUR_ROOT_PASSWORD --authenticationDatabase admin
```

在 `mongosh` 裡執行：
```javascript
use hktrpgRollBot
db.createUser({
  user: "rollbot",
  pwd: "YOUR_ROLLBOT_PASSWORD",
  roles: [{ role: "readWrite", db: "hktrpgRollBot" }]
})

use admin
db.createUser({
  user: "backup",
  pwd: "YOUR_BACKUP_PASSWORD",
  roles: [
    { role: "backup", db: "admin" },
    { role: "read", db: "hktrpgRollBot" }
  ]
})

show users
exit
```

## 5. 設定兩個 Bot 的 `.env`（rollbot 連線 + TZ）

需要兩個檔案（分別給兩個容器讀取）：
- `infra/rocky-docker/discord-bot/.env`
- `infra/rocky-docker/tg-bot/.env`

建議複製範本：
- `infra/rocky-docker/discord-bot/.env.example` -> `infra/rocky-docker/discord-bot/.env`
- `infra/rocky-docker/tg-bot/.env.example` -> `infra/rocky-docker/tg-bot/.env`

必填至少包含：
- `mongoURL`（兩者都必填）
- `infra/rocky-docker/discord-bot/.env`：`DISCORD_CHANNEL_SECRET`（Discord 容器），`TELEGRAM_CHANNEL_SECRET` 留空
- `infra/rocky-docker/tg-bot/.env`：`TELEGRAM_CHANNEL_SECRET`（TG 容器），`DISCORD_CHANNEL_SECRET` 留空

`mongoURL` 請使用「容器網路可解析的 MongoDB service 名稱」：

Discord 與 TG 都一樣：
```env
mongoURL=mongodb://rollbot:YOUR_ROLLBOT_PASSWORD@mongodb:27017/hktrpgRollBot?authSource=admin
```

時區請保持：
```env
TZ=Asia/Taipei
```

更新完 `.env` 後重啟：
```bash
docker compose -f infra/rocky-docker/docker-compose.yml restart
```

### 5.1 分工規則（避免重複處理）
為避免 Discord/TG 模組在錯誤容器啟動：
- `discord-bot/.env`：`DISCORD_CHANNEL_SECRET` 有值，`TELEGRAM_CHANNEL_SECRET` 留空
- `tg-bot/.env`：`TELEGRAM_CHANNEL_SECRET` 有值，`DISCORD_CHANNEL_SECRET` 留空

## 6. 日常管理指令

查看狀態：
```bash
docker compose -f infra/rocky-docker/docker-compose.yml ps
```

即時看完整 log（最推薦）：
```bash
docker compose -f infra/rocky-docker/docker-compose.yml logs -f -t discord-bot
docker compose -f infra/rocky-docker/docker-compose.yml logs -f -t tg-bot
```

手動更新 `current.log`（重寫檔案）：
```bash
bash infra/rocky-docker/update-logs.sh
```

檢視：
```bash
tail -f /data/logs/discord-bot/current.log
tail -f /data/logs/tg-bot/current.log
```

## 7. 系統級自動更新 `current.log`（systemd timer）

repo 提供了範本：
- `infra/rocky-docker/systemd/update-logs.service`
- `infra/rocky-docker/systemd/update-logs.timer`

實作時你需要確定 `ExecStart` 指向伺服器上實際存在的 `update-logs.sh` 路徑（範本預設以 `/data/bots/update-logs.sh` 為主）。

安裝範例（需依你的路徑調整）：
```bash
sudo cp infra/rocky-docker/systemd/update-logs.service /etc/systemd/system/update-logs.service
sudo cp infra/rocky-docker/systemd/update-logs.timer /etc/systemd/system/update-logs.timer

sudo systemctl daemon-reload
sudo systemctl enable --now update-logs.timer
sudo systemctl status update-logs.timer
```

## 8. MongoDB 備份（保留你原本的腳本）

你原本已存在的備份腳本建議保留在：
- `/data/backup-mongodb.sh`

手動執行方式（依你的目錄/使用者調整）：
```bash
cd /data
sudo -u hktrpgbot ./backup-mongodb.sh
```

如果你需要我把 `backup-mongodb.sh` 也「依你現在實際用的版本」一併整理成 repo 內的檔案，貼一下你現有 `/data/backup-mongodb.sh` 的內容即可。

