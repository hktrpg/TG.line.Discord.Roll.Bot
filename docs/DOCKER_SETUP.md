# Docker Setup

Images:

- `docker/Dockerfile.discord` — Discord (+ CJK fonts for `.token` etc.)
- `docker/Dockerfile.non-discord` — Telegram / LINE / WhatsApp / WWW / Plurk (+ Chromium)

Also see [roll-worker.md](./roll-worker.md) for Gateway / Primary / Standby naming.

## VIP social video reposts

Paste a public Facebook Reel or video, X post, Instagram Reel or post, or TikTok
video. HKTRPG replies with an MP4 attachment in the same chat, topic or channel.
It processes the first supported link and the first video in that post.

1. Make `yt-dlp`, `ffmpeg`, `ffprobe` and `nice` available in the gateway. When building either
   Dockerfile in this repo, set the build argument `INSTALL_SOCIAL_VIDEO=true`.
   For Compose, set that argument under the gateway's `build.args`. Keep the
   downloader current as provider sites change. To point to another installation,
   configure the executable paths with `SOCIAL_VIDEO_YTDLP_PATH` and
   `SOCIAL_VIDEO_FFMPEG_PATH`. If ffprobe is in a separate directory, configure
   `SOCIAL_VIDEO_FFPROBE_PATH` as well.
2. Set `SOCIAL_VIDEO_TELEGRAM_GROUP_IDS` on the Telegram gateway and/or
   `SOCIAL_VIDEO_DISCORD_GUILD_IDS` on the Discord gateway to comma-separated
   group or server IDs where regular links should trigger the bot. To allow
   `.video <link>` in other groups, set `SOCIAL_VIDEO_GROUP_COMMAND_ENABLED=true`.
   In Telegram groups with privacy mode enabled, use `/video@BotUsername <link>`.
   A VIP group uses its group quota. In a group without group VIP, the sender
   needs personal VIP and uses the same allowance as in DMs. A VIP group with
   exhausted quota waits for its quota reset. The bot must be able to read the
   triggering messages and attach files. For Telegram automatic reposts, the bot
   must be a group admin or have BotFather group privacy disabled.
3. To enable DMs, set `SOCIAL_VIDEO_DM_ENABLED=true` on the Telegram or Discord
   gateway. The sending account needs an existing personal VIP level of at least
   1 on that platform.
4. For Threads, install a compatible Threads extractor in the gateway's
   yt-dlp environment, verify that `yt-dlp --list-extractors` shows `threads`,
   and set `SOCIAL_VIDEO_THREADS_ENABLED=true`. A third-party extractor is
   available from [yt-dlp-threads](https://github.com/tribixbite/yt-dlp-threads).
   To load it from a dedicated plugin directory, set
   `SOCIAL_VIDEO_THREADS_PLUGIN_DIR` to the absolute path to that directory and
   pass the same directory to `yt-dlp --plugin-dirs <directory> --list-extractors`
   when checking it. The image build argument does not install the Threads plugin.

Both gateways must use the same MongoDB database. The feature uses one shared
job slot and keeps daily counters in `socialVideoQuotas`. At Hong Kong midnight,
the quota renews. Personal VIPs get 20 successful uploads per day and a
30-second cooldown. VIP groups get 60 per day, with 10 per sender, a 15-second
group cooldown and a 30-second sender cooldown. Attempt limits are twice the
upload limits. An ambiguous upload timeout can consume an upload allowance.

The source limit is 30 MiB and five minutes. Attachment caps are 30 MiB on
Telegram and 20 MiB on Discord. Compatible files are remuxed without encoding.
If the attachment is too big or uses incompatible codecs, a source at most
90 seconds, 1080p or equivalent, and 30 fps can be converted with one low-priority
encoder thread for up to 30 seconds. Live streams and larger inputs are skipped.
Before starting, the host must have 256 MiB available and a memory-limited
container must have 128 MiB of cgroup v2 headroom. To encode, the host must have
512 MiB available, the container needs 256 MiB of headroom, and the one-minute
load must be below 75% of at least two available CPUs.

Video files are staged on Linux tmpfs and removed after the attempt. The default
is `/dev/shm`. Set `SOCIAL_VIDEO_TMP_DIR` to a dedicated tmpfs when the gateway
shares that mount with Chromium or another workload. The feature requires at
least 62 MiB free on a 64 MiB tmpfs, and stops if that check fails.
After a gateway crash, the next job can remove expired scratch directories.
Keep host swap policy in mind when configuring tmpfs. The uploaded copy lives in
the chat and follows its deletion and retention settings.

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
