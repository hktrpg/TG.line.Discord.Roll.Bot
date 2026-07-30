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

Discord slash `.root restart gateway|discord`: cluster IPC is **deferred** until after `editReply` / channel send (`_pendingClusterIpc` → `flushPendingClusterIpc`), so the interaction is not left on “thinking…”.

## Docker (multi-Gateway)

When Discord and TG/LINE/WA are **separate containers**, run one shared **`roll-primary`** service and point both Gateways at it (`ROLL_WORKER_SPAWN=false`). Details and upgrade steps: [DOCKER_SETUP.md](./DOCKER_SETUP.md).

| Pitfall | Fix |
|---------|-----|
| Primary binds `127.0.0.1` only | `ROLL_WORKER_HOST=0.0.0.0` in Primary container |
| Each Gateway spawns its own Primary | Shared URL + `ROLL_WORKER_SPAWN=false` |
| `EACCES mkdir modules/log` | Create / mount writable `modules/log` (not only root `log/`) |
| `.admin state` shows `detached · unknown` | `build-info` uses git `safe.directory=*` + `.git` file fallback (redeploy code) |
| AI crash on Worker | Copy `OPENAI_*` / `AI_MODEL_*` into Primary env |

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
| `defer-queue.js` | `REMOTE_ONLY` defer-busy in-memory queue |
| `roll/z_admin.js` | `.root` / `/root` restart & stop |
| `restart-reply.js` | Ops-facing reply text |
| `modules/discord/bot.js` | Discord finalize + deferred cluster IPC |

## Limits

1. Embedded / `needsLocal` need Gateway restart to refresh code  
2. Non-loopback Primary admin reload/stop may 403  
3. `stop` flags are in-memory — Gateway process restart clears them (auto-spawn may return)  
4. Defer queue is in-memory — lost on Gateway restart  
5. `stop` flags are **per process** — Discord multi-cluster / TG·Line vs Discord do not share them

---

## Branch review (`Distributed-` vs `master`)

Reviewed: 2026-07-30. Scope: Gateway → Primary → Standby → Embedded routing, lifecycle restart/stop, Discord defer + cluster IPC, `REMOTE_ONLY` defer-busy.

### What landed (summary)

- HTTP Roll Worker (`roll-worker.js`) + Gateway client/router (`modules/roll-worker/*`)
- Auto-spawn Primary; optional Standby; Embedded last resort / `needsLocal`
- `.root restart|stop primary|standby` (+ Discord/gateway targets)
- `ROLL_WORKER_REMOTE_ONLY` + optional defer-busy queue
- Discord slash restart: flush cluster IPC **after** reply (avoids stuck “thinking…”)

### Known bugs — fixed (2026-07-31)

| Sev | Fix | Tests |
|-----|-----|-------|
| **High** | `ensurePrimaryWorker` health-checks URL; unhealthy → discover/spawn (or `pending` if SPAWN off). `restartPrimary` uses `forceSpawn: true`. | `roll-worker-local-worker-unit.test.js`, live `stop-restart` |
| **High** | `purgeExpired` / queue-full drop call `notifyDroppedJob` → deliverer with `system_busy` (clears Discord “thinking…”). | `roll-worker-defer-queue.test.js` |
| **Medium** | Enqueue failure → `remoteOnlyFailResult` returns `system_busy` (not silent empty). Mutator mid-flight timeout stays silent via `remoteOnlySilentFailResult`. | `roll-worker-review-fixes.test.js` |
| **Medium** | `reloadRemote` takes the shared `reloading` mutex. | `roll-worker-local-worker-unit.test.js` |

### Known limits (open / by design)

| Sev | Location | Note |
|-----|----------|------|
| **Medium** | stop flags + Discord clusters | `stoppedPrimary` / `stoppedStandby` remain **process-local**. Other clusters / platform processes keep hitting a stopped Primary until transport fails. |
| — | Mutator mid-flight timeout | Still silent empty (Worker may have committed — no busy spam / no replay). |

### Not bugs / intentional

- Empty reply on `REMOTE_ONLY` + defer-busy when enqueue succeeds (`deferred: true`) — reply comes later on drain.
- Embedded has no `.root` target — use `restart gateway`.
- Stop flags clearing on Gateway process restart — documented limit.
