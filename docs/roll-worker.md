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

### Known bugs (open)

| Sev | Location | Finding |
|-----|----------|---------|
| **High** | `local-worker.js` `ensurePrimaryWorker` (~L307–309) + `restartPrimary` | After `.root stop primary`, `ROLL_WORKER_URL` stays set while the process is dead. `.root restart primary` clears the stop flag, `waitHealth` fails, then `ensurePrimaryWorker` short-circuits on `client.isEnabled()` **without** health-check/spawn and returns `ok: true` (`existing` / `ensure-spawn`) while Primary stays down. Standby’s ensure path *does* health-check. Live test works around this by spawning before `restartPrimary`. |
| **High** | `defer-queue.js` `purgeExpired` (~L247–258) | Under `REMOTE_ONLY` + defer-busy, expired jobs are removed with only a warn log — no platform deliver / no Discord `deleteReply`. Users get no reply; slash can stay on “thinking…” until the interaction token expires (`ROLL_WORKER_DEFER_TTL_MS`, default 10m; interactions capped shorter). |
| **High** | `defer-queue.js` enqueue full (~L229–232) | Same class: queue-full `shift()` drops oldest job with log only — no user reply / no Discord clear. |
| **Medium** | `parse-router.js` `remoteOnlyFailResult` + platforms (e.g. `core-Line.js` ~L225–230, TG same pattern) | When defer-busy is on but enqueue fails (per-user cap, missing deliverer, etc.), router returns **empty text** without `deferred: true`. Platforms treat `didParse` as done and send nothing — silent drop (by design avoids `system_busy`, but user sees no feedback). |
| **Medium** | `local-worker.js` `reloadRemote` (~L639–698) | Primary reload does not take the `reloading` mutex used by Standby reload / stop — concurrent stop/restart can interleave. |
| **Medium** | `local-worker.js` stop flags + Discord clusters | `stoppedPrimary` / `stoppedStandby` are process-local. Only the Gateway that ran `.root stop` skips Primary; other clusters / platform processes keep hitting the dead URL until transport fails. |

### Not bugs / intentional

- Empty reply on `REMOTE_ONLY` + defer-busy when Primary is down **and** enqueue succeeds (`deferred: true`) — reply comes later on drain.
- Embedded has no `.root` target — use `restart gateway`.
- Stop flags clearing on Gateway process restart — documented limit.

### Suggested fix order

1. `ensurePrimaryWorker`: if URL set, `waitHealth` (or clear URL) before treating as `existing`; align with Standby ensure.  
2. On expire / queue-full drop: invoke registered deliverer with a failure/empty clear (especially Discord interaction).  
3. On enqueue failure under defer-busy: return a short user-visible fail text (or true `deferred` only when queued), not silent empty.  
4. Add `reloading` guard to `reloadRemote`; document or sync stop flags across clusters if multi-Gateway stop matters.
