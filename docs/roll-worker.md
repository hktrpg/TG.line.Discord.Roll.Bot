# Gateway / Primary / Standby / Embedded

## Names (use these only)

| Name | What it is | Env / port | Role |
|------|------------|------------|------|
| **Gateway** | Platform process (Discord / TG / LINE / WA / WWW / Plurk) | `yarn start` / docker | Receives messages; stays online |
| **Primary** | Preferred HTTP dice (`roll-worker.js`) | `ROLL_WORKER_URL` → `:3950` | First choice for rolls |
| **Standby** | Fallback HTTP dice (same binary) | `ROLL_STANDBY_URL` → `:3951` | Only if **Primary** fails |
| **Embedded** | Same `analytics` + `roll/*` **inside Gateway** | (no URL) | Last resort / `needsLocal` — **not** a separate process |

**Ports**

| Who starts | Default port |
|------------|--------------|
| Gateway auto-Primary | `:3950` |
| Standby (`SPAWN=true` / URL) | `:3951` |
| `yarn start:roll-worker` (manual) | `:3952` |
| `yarn start:roll-worker:primary` | `:3950` |
| `yarn start:roll-worker:standby` | `:3951` |

```text
Gateway  →  Primary (:3950)  →  Standby (:3951)  →  Embedded
              ↑ prefer             ↑ if Primary down      ↑ last / needsLocal
```

## Lifecycle commands

```text
.root restart primary|standby|discord|gateway|all
.root restart discord all
.root restart discord <clusterId>
.root stop    primary|standby

/root restart target:…  [cluster_id=all|<id> when discord]
/root stop    target:…
```

| Target | restart | stop |
|--------|---------|------|
| `primary` | HTTP self-reload / ensure-spawn | shutdown + flag (parse skips) |
| `standby` | supervised respawn or self-reload | shutdown + flag |
| `discord all` | Discord cluster IPC (all) — **must type `all`** | — |
| `discord <id>` | one Discord cluster | — |
| `gateway` | Discord → all clusters; else SIGTERM (PM2/docker) | — |
| `all` | standby → primary → gateway | — |

Bare `.root restart discord` is rejected (foolproof). Embedded has **no** CLI switch — use `restart gateway`.

HTTP (loopback + Bearer): `POST /v1/admin/reload` = self-restart; `POST /v1/admin/shutdown` = exit.

## Quick start

**Default:** leave URLs unset. Gateway auto-discovers/spawns **Primary only** (`:3950`).

**Standby** only if you set `ROLL_STANDBY_URL` and/or `ROLL_STANDBY_SPAWN=true`.

When `ROLL_STANDBY_URL` is set, Gateway pings Standby `/health` (~5s while down, ~30s while up). Failure logs `[StandbyLink] DISCONNECTED`; recovery logs `[StandbyLink] CONNECTED` (no auto-respawn).

`ROLL_WORKER_SPAWN=false` → no auto Primary (Embedded only unless `ROLL_WORKER_URL` is set).

**Manual start:** `yarn start:roll-worker` binds **`:3952`** so it does not collide with auto-Primary. To run Primary yourself (`ROLL_WORKER_SPAWN=false` or after crash): `yarn start:roll-worker:primary`.

```env
ROLL_WORKER_URL=http://127.0.0.1:3950
# Optional Standby:
# ROLL_STANDBY_URL=http://127.0.0.1:3951
# ROLL_STANDBY_SPAWN=true
ROLL_WORKER_TOKEN=change-me-shared-secret
# Pure Embedded only:
# ROLL_WORKER_SPAWN=false
```

## Code map

| File | Role |
|------|------|
| `local-worker.js` | Auto-spawn; restart / stop flags |
| `parse-router.js` | Route; skip stopped layers |
| `roll/z_admin.js` | `.root` / `/root` restart & stop |
| `restart-reply.js` | Ops-facing reply text |

## Limits

1. Embedded / `needsLocal` need Gateway restart to refresh code  
2. Non-loopback Primary admin reload/stop may 403  
3. `stop` flags are in-memory — Gateway process restart clears them (auto-spawn may return)
