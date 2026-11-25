# Docker Setup

Images:

- `docker/Dockerfile.discord` — Discord (+ CJK fonts for `.token` etc.)
- `docker/Dockerfile.non-discord` — Telegram / LINE / WhatsApp / WWW / Plurk (+ Chromium)

Also see [roll-worker.md](./roll-worker.md) for Gateway / Primary / Standby naming.

## VIP social video reposts

Paste a public Facebook Reel or post, Instagram Reel or post, Threads post, X
video post, or TikTok video. HKTRPG replies in the same chat, topic or channel.
It processes the first supported link. For Facebook, Instagram and Threads it
chooses the first playable video attached to the main post, or up to four attached
images when the post has no video. Facebook cards attached to the main post
can supply a preview image. Replies and quoted posts are ignored.

1. Install the project dependencies with `corepack yarn install --frozen-lockfile`
   or build the Docker image. This installs the gateway's private copies of
   `yt-dlp`, `ffmpeg` and `ffprobe`. There is no manual PATH setup. To use
   another installation,
   configure the executable paths with `SOCIAL_VIDEO_YTDLP_PATH` and
   `SOCIAL_VIDEO_FFMPEG_PATH`. If ffprobe is in a separate directory, configure
   `SOCIAL_VIDEO_FFPROBE_PATH` as well. Explicit paths take precedence over
   the bundle. Clear old overrides when switching to the bundled tools.
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
   A Discord server command uses the group setting even if the DM switch is enabled.
3. To enable DMs, set `SOCIAL_VIDEO_DM_ENABLED=true` on the Telegram or Discord
   gateway. The sending account needs an existing personal VIP level of at least
   1 on that platform.
4. For Threads, set `SOCIAL_VIDEO_THREADS_ENABLED=true`. The bot reads public
   post data directly, including `/share/` links. Images must be JPEG or PNG
   and no larger than 3 MiB each. A login wall or changes to provider pages can
   prevent retrieval.

Both gateways must use the same MongoDB database. All Discord clusters and
shards share one job slot with the Telegram gateway. The slot and daily counters
live in the `socialVideoQuotas` collection. At Hong Kong midnight,
the quota renews. Personal VIPs get 20 successful uploads per day and a
30-second cooldown. VIP groups get 60 per day, with 10 per sender, a 15-second
group cooldown and a 30-second sender cooldown. Attempt limits are twice the
upload limits. An ambiguous upload timeout can consume an upload allowance.

The source limit is 30 MiB and five minutes. Attachment caps are 30 MiB on
Telegram and 20 MiB on Discord. Compatible files are remuxed without encoding.
If Instagram or Threads offers a smaller compatible rendition of the same
video, the bot can combine that rendition with its audio without re-encoding.
If the attachment is too big or uses incompatible codecs, a source at most
90 seconds, 1080p or equivalent, and 30 fps can be converted with one low-priority
encoder thread for up to 30 seconds. Live streams and larger inputs are skipped.
Before starting, the host must have 256 MiB available. Encoding requires
512 MiB and at least two available CPUs. Linux checks that one-minute load is
below 75% of available CPUs. When the container has a memory limit, it also
requires 128 MiB of cgroup v2 headroom to start or 256 MiB to encode. Windows
samples CPU activity and requires more than 25% idle time before encoding.
Both platforms run the encoder below normal priority.

Job files are removed after each attempt. After a gateway crash, the next job
can remove expired scratch directories. The uploaded copy lives in the chat
and follows its deletion and retention settings.

### Docker on Linux or Docker Desktop

The standard Discord and Telegram Docker builds install and check the three
media tools automatically. Use the newly built image for this release. The
tools stay outside `/app/node_modules` in the image, so a mounted dependency
volume will not hide them. The default scratch path is the container's
`/dev/shm`, which needs at least 62 MiB free on a 64 MiB tmpfs. If another
workload shares that space, give the gateway a dedicated 64 MiB tmpfs and set
`SOCIAL_VIDEO_TMP_DIR` to its mount path.

### Native Windows

The installer supports x64 Windows. Run the standard install and check
commands below as the account that will run the bot.

Set `SOCIAL_VIDEO_WINDOWS_TEMP_ENABLED=true` in the checkout's `.env`.
Windows uses a dedicated scratch subdirectory in the running user's temp
directory and checks for at least 64 MiB free. On a regular drive, media bytes
are briefly written to disk and removed after use. For a RAM-only setup, point
`SOCIAL_VIDEO_TMP_DIR` to a private directory on a RAM drive with sufficient
free space, or use Docker Desktop with Linux containers.

### Native Linux

The installer supports x64 and ARM64 Linux on glibc and Alpine musl.
It selects a pinned, SHA-256-verified yt-dlp release for the host without
requiring a system Python installation. The bundled FFmpeg and FFprobe come
from pinned npm packages. For another architecture, install compatible
tools and set their executable paths using the variables above.

The default scratch path is `/dev/shm`. If its mount exceeds 64 MiB, set up a
dedicated 64 MiB tmpfs and set `SOCIAL_VIDEO_TMP_DIR` to that path. This example
creates a mount for the account running the commands:

```sh
sudo install -d -m 0700 /run/hktrpg-media
sudo mount -t tmpfs -o "size=64m,mode=0700,uid=$(id -u),gid=$(id -g),nosuid,nodev,noexec" tmpfs /run/hktrpg-media
```

Set `SOCIAL_VIDEO_TMP_DIR=/run/hktrpg-media`. A manual mount lasts until reboot.
For a long-running host, configure the mount through its service setup.

### Start and check the native gateway

Use the Node.js version required by `package.json`. For a fresh checkout, create
`.env` from `.env.copy` and set the normal gateway token, `mongoURL`, and
the applicable media flags above. From the project directory:

```sh
corepack yarn install --frozen-lockfile
corepack yarn check:social-video
corepack yarn start
```

If the install skipped lifecycle scripts or a download failed, retry with
`corepack yarn setup:social-video` from the full checkout with optional npm
dependencies available. Downloads happen during setup. The bot does not fetch
new executables while handling a link.

In an enabled group, paste a public link as a VIP group member or a personal
VIP. In a group where only the command is enabled, use `.video <link>`.
The same MongoDB database is required to share quota across installations.

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
