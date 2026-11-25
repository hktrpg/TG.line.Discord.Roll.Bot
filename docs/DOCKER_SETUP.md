# Docker Setup

Images:

- `docker/Dockerfile.discord` — Discord (+ CJK fonts for `.token` etc.)
- `docker/Dockerfile.non-discord` — Telegram / LINE / WhatsApp / WWW / Plurk (+ Chromium)

Also see [roll-worker.md](./roll-worker.md) for Gateway / Primary / Standby naming.

## VIP social video reposts

In an enabled VIP group or a personal VIP DM, paste a public Facebook Reel or
video, X post, Instagram Reel or post, or TikTok video. HKTRPG replies to the
original message with an MP4 attachment in the same chat, topic or channel.
It processes the first supported link and the first video in that post.

1. Make `yt-dlp` and `ffmpeg` available in the gateway. When building either
   Dockerfile in this repo, set the build argument `INSTALL_SOCIAL_VIDEO=true`.
   For Compose, set that argument under the gateway's `build.args`. Keep the
   downloader current as provider sites change. To point to another installation,
   set the gateway's `SOCIAL_VIDEO_YTDLP_PATH` or `SOCIAL_VIDEO_FFMPEG_PATH` to the
   relevant absolute executable path.
2. Set `SOCIAL_VIDEO_TELEGRAM_GROUP_IDS` on the Telegram gateway and/or
   `SOCIAL_VIDEO_DISCORD_GUILD_IDS` on the Discord gateway to comma-separated
   group or server IDs. Empty values leave this feature disabled. The chat or
   server also needs an existing group VIP level of at least 1. The bot must be
   able to read ordinary group messages and attach files. For Telegram, the bot
   must be a group admin or have BotFather group privacy disabled.
3. To enable DMs, set `SOCIAL_VIDEO_DM_ENABLED=true` on the Telegram or Discord
   gateway. The sending account needs an existing personal VIP level of at least
   1 on that platform. Group use still requires the configured group VIP.
4. For Threads, install a compatible Threads extractor in the gateway's
   yt-dlp environment, verify that `yt-dlp --list-extractors` shows `threads`,
   and set `SOCIAL_VIDEO_THREADS_ENABLED=true`. A third-party extractor is
   available from [yt-dlp-threads](https://github.com/tribixbite/yt-dlp-threads).
   To load it from a dedicated plugin directory, set
   `SOCIAL_VIDEO_THREADS_PLUGIN_DIR` to the absolute path to that directory and
   pass the same directory to `yt-dlp --plugin-dirs <directory> --list-extractors`
   when checking it. The standard image build only installs yt-dlp and FFmpeg.

Telegram accepts up to 49 MB from this feature and Discord up to 20 MiB. It
skips live streams and videos with a known duration longer than five minutes.
Each gateway process handles two jobs at a time. Groups have a 15-second
cooldown, and personal VIPs have a 30-second DM cooldown. Links posted while
the process or recipient is busy are ignored. Facebook share links must
redirect to a supported Facebook video URL.
Private posts and provider login prompts can prevent retrieval.

The uploaded copy lives in the chat. HKTRPG removes the temporary server files
after the upload attempt. Chat deletion and retention settings apply to the copy.

## Included files

- `.dockerignore`
- `docker/Dockerfile.discord`
- `docker/Dockerfile.non-discord`
- `docker/docker-compose.example.yml` — Mongo + **roll-primary** + discord + non-discord
- `docker/.env.discord.example`
- `docker/.env.non-discord.example`
- `docker/.env.roll-primary.example`

## Recommended topology (two Gateways)

When Discord and TG/LINE/WA run as **separate containers**, do **not** let each Gateway auto-spawn its own Primary.

```text
[roll-primary]  :20612 on compose network only
       ↑ shared ROLL_WORKER_TOKEN
[discord-bot]   [non-discord-bot / tg-bot]
```

| Service | Role | Key env |
|---------|------|---------|
| `roll-primary` | HTTP dice (`node roll-worker.js`) | `ROLL_WORKER_HOST=0.0.0.0`, `ROLL_WORKER_PORT=20612`, `mongoURL`, `ROLL_WORKER_TOKEN`, AI keys if needed |
| Gateways | Platforms | `ROLL_WORKER_URL=http://roll-primary:20612`, same `ROLL_WORKER_TOKEN`, `ROLL_WORKER_SPAWN=false` |

`ROLL_WORKER_HOST` must be `0.0.0.0` inside the Primary container (default `127.0.0.1` is unreachable from other containers).

Copy AI / OpenAI keys into Primary’s env if `.ai` / `.ait` run on the Worker — missing `AI_MODEL_*` can crash module load.

### Shared artifacts (`.wl` / `.token` / export)

Worker writes files under `/app/temp` and `/app/export`. Gateways read those paths when sending Discord attachments. **They must be the same mount on every container** (named volume or host bind), otherwise logs show:

`[Discord] fileLink artifact missing (shared ROLL_ARTIFACT_ROOT / cwd?): /app/temp/wheel_….gif`

| Mount | Purpose |
|-------|---------|
| `/app/temp` | Wheel GIF, token PNG, OpenAI file attachments, … |
| `/app/export` | Channel export txt/html |

Optional: set `ROLL_ARTIFACT_ROOT=/app` on Worker + Gateways (same absolute root). Default is `process.cwd()` (`/app` in the images).

**Wrong** (common bind-mount mistake — each service has its own host dir):

```yaml
# Do NOT do this when using a shared Primary
- ./tg-bot/temp:/app/temp
- ./discord-bot/temp:/app/temp
- ./roll-primary/temp:/app/temp
```

**Right** — one shared host path (or one named volume) on all three:

```yaml
volumes:
  - ./roll-primary:/app          # or ./discord-bot:/app / ./tg-bot:/app
  - ./shared-temp:/app/temp      # SAME host path on roll-primary + gateways
  # export may already be a shared named volume, e.g. export-data:/app/export
  - ./shared-export:/app/export  # only if not using a shared named volume
```

`docker/docker-compose.example.yml` uses named volumes `shared-temp` / `shared-export`.

**Zero Discord downtime when fixing an existing deploy:** Docker cannot hot-swap mounts; recreate is required for any service whose volume line changes. Point **roll-primary** and **tg-bot** at Discord’s *existing* temp bind, then recreate only those two — leave `discord-bot` running:

```yaml
# all three services:
- ./discord-bot/temp:/app/temp
```

```bash
docker compose up -d --force-recreate roll-primary tg-bot
# verify: touch on roll-primary /app/temp is visible inside discord-bot
```

Later, during a maintenance window, you may migrate everyone to `./shared-temp` (that change *does* require recreating Discord).

## Quick start

```bash
cp docker/.env.discord.example docker/.env.discord
cp docker/.env.non-discord.example docker/.env.non-discord
cp docker/.env.roll-primary.example docker/.env.roll-primary
# Fill secrets; use the SAME ROLL_WORKER_TOKEN in all three files.

cd docker
docker compose -f docker-compose.example.yml up --build -d
```

Health check:

```bash
docker exec roll-primary curl -sS http://127.0.0.1:20612/health
# Expect: {"ok":true,"role":"roll-worker",...}
```

## Bind-mount layouts (production-style)

If you mount host git checkouts as `/app` (like `/data/bots/tg-bot:/app`):

1. **`modules/log`** — watchdog writes `modules/log/hktrpg-mongod.log` (not root `log/`). Ensure the directory exists and is group-writable by the container user (`node` + `group_add` / `chmod 2775`). Repo includes `modules/log/.gitkeep`.
2. **`node_modules` named volume** — overlays the image install. After `package.json` changes: rebuild image, then refresh the volume (`docker volume rm …` when stopped, or `yarn install` inside the container) before restart.
3. **WhatsApp** — keep a dedicated volume/bind for `.wwebjs_auth`; never delete it during upgrades.
4. **Version line in `.admin state`** — if you see `detached · … · unknown`, the process user cannot run git on a host-owned `.git` (“dubious ownership”). Fixed in `modules/runtime/build-info.js` via `safe.directory=*` + reading `.git/HEAD` (no `GIT_BRANCH` / `GITHUB_SHA` required). Redeploy code and recreate containers to pick up the fix.
5. **Shared `/app/temp`** — required for `.wl` / `.token` / similar Worker→Gateway files. See [Shared artifacts](#shared-artifacts-wl--token--export) above. Do not use per-service `./…/temp` binds with a shared Primary.

## Better upgrade workflow

Prefer **one service at a time**:

```bash
# 1) Primary first (shared)
docker compose build roll-primary
docker compose up -d roll-primary
docker exec roll-primary curl -sS http://127.0.0.1:20612/health

# 2) Non-Discord Gateway
docker compose build non-discord-bot   # or tg-bot
docker compose stop non-discord-bot
# optional if deps changed:
# docker volume rm <project>_…-node_modules
docker compose up -d --force-recreate non-discord-bot
# if using an empty named volume for node_modules:
# docker exec -u root non-discord-bot yarn install --non-interactive
# docker compose restart non-discord-bot

# 3) Discord last (sharding takes a few minutes to warm all clusters)
docker compose build discord-bot
docker compose up -d --force-recreate discord-bot
```

Checklist after upgrade:

- Log line: `[Gateway] Primary http://roll-primary:20612 (configured) | …`
- Platform smoke test (TG / Discord `1d100`)
- Discord: wait until enough clusters show Ready (❓/⏳ right after recreate is normal)

Rollback: keep compose / `.env` backups; restore previous image tag or `git checkout` previous commit on bind-mount trees, then `up -d --force-recreate` that service only.

## Notes

- `mongoURL` should use the compose service hostname `mongodb:27017`.
- This repo may not track `yarn.lock`; Dockerfiles run `yarn install --non-interactive`.
- Admin HTTP reload on Primary from another container may 403 (loopback-only); use `docker compose restart roll-primary` instead.
- Do not publish Primary `:20612` on `0.0.0.0` public interfaces.
