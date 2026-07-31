# Docker Setup

Images:

- `docker/Dockerfile.discord` — Discord (+ CJK fonts for `.token` etc.)
- `docker/Dockerfile.non-discord` — Telegram / LINE / WhatsApp / WWW / Plurk (+ Chromium)

Also see [roll-worker.md](./roll-worker.md) for Gateway / Primary / Standby naming.

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
[roll-primary]  :3950 on compose network only
       ↑ shared ROLL_WORKER_TOKEN
[discord-bot]   [non-discord-bot / tg-bot]
```

| Service | Role | Key env |
|---------|------|---------|
| `roll-primary` | HTTP dice (`node roll-worker.js`) | `ROLL_WORKER_HOST=0.0.0.0`, `ROLL_WORKER_PORT=3950`, `mongoURL`, `ROLL_WORKER_TOKEN`, AI keys if needed |
| Gateways | Platforms | `ROLL_WORKER_URL=http://roll-primary:3950`, same `ROLL_WORKER_TOKEN`, `ROLL_WORKER_SPAWN=false` |

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
docker exec roll-primary curl -sS http://127.0.0.1:3950/health
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
docker exec roll-primary curl -sS http://127.0.0.1:3950/health

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

- Log line: `[Gateway] Primary http://roll-primary:3950 (configured) | …`
- Platform smoke test (TG / Discord `1d100`)
- Discord: wait until enough clusters show Ready (❓/⏳ right after recreate is normal)

Rollback: keep compose / `.env` backups; restore previous image tag or `git checkout` previous commit on bind-mount trees, then `up -d --force-recreate` that service only.

## Notes

- `mongoURL` should use the compose service hostname `mongodb:27017`.
- This repo may not track `yarn.lock`; Dockerfiles run `yarn install --non-interactive`.
- Admin HTTP reload on Primary from another container may 403 (loopback-only); use `docker compose restart roll-primary` instead.
- Do not publish Primary `:3950` on `0.0.0.0` public interfaces.
