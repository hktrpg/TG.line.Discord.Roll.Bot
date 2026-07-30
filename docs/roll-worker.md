# Roll Worker (Gateway / Backend split)

## Goal

- **Gateways** (Discord / TG / LINE / WA / Plurk / WWW) stay online.
- **Roll Worker** runs `analytics` + `roll/*` and can restart independently.

## Quick start (single machine)

1. Start worker:

```bash
yarn start:roll-worker
```

2. On each gateway process, set:

```env
ROLL_WORKER_URL=http://127.0.0.1:3950
ROLL_WORKER_TOKEN=change-me-shared-secret
```

3. Start gateways as usual (`yarn start` / docker discord vs non-discord).

Without `ROLL_WORKER_URL`, behavior is unchanged (in-process analytics).

**Auth:** set the same `ROLL_WORKER_TOKEN` on worker and every gateway. If unset, Worker (and Gateway when `ROLL_WORKER_URL` is set) auto-generate a 64-hex token and append it to `.env` so a single-machine split shares one secret. `ROLL_WORKER_ALLOW_NO_TOKEN=true` skips auto-generate (local tests only; auth off; non-loopback bind refused). Gateways attach an HMAC signature (`_gatewayAuth`) over identity and Discord prefetch claims; Worker rejects unsigned/expired bodies when a token is set.

**Artifacts:** Worker writes `export/` and `temp/` under `ROLL_ARTIFACT_ROOT` (default: process cwd) via `getTempFilePath` / `getExportDir`. Gateway and Worker must share that directory (same machine cwd or a mounted volume). Gateway skips attach when the file is missing (`assertArtifactReadable`). Writers: token, wheel GIF, `.st export`, openai `createFile`, export HTML/TXT.

**JSON body:** Worker accepts up to `ROLL_WORKER_JSON_LIMIT` (default `32mb`) so Discord `exportHistoryMeta` fits. Override if needed.

**Timeout:** `ROLL_WORKER_TIMEOUT_MS` (default `120000`). Override lower for tests if needed.

**SSRF:** Worker-side URL fetches allowlist Discord CDN hosts, resolve a public IP (`resolvePublicFetchTarget`), connect IP-pinned with `Host` header, refuse redirects, and enforce a hard byte cap.

## Env cheat sheet

| Variable | Where | Default / notes |
|----------|--------|-----------------|
| `ROLL_WORKER_URL` | Gateway | unset = local analytics |
| `ROLL_LOCAL_WORKER_URL` | Gateway | optional HTTP fallback on hybrid `workerError` (ignored if equal to `ROLL_WORKER_URL`) |
| `ROLL_LOCAL_WORKER_SPAWN` | Gateway | `true` = Gateway may spawn one supervised local child (single-process) |
| `ROLL_LOCAL_WORKER_PORT` | Gateway | default `3951` when spawning |
| `ROLL_LOCAL_WORKER_DRAIN_MS` | Gateway | drain before reload kill (default `1500`) |
| `ROLL_LOCAL_WORKER_RELOAD_WAIT_MS` | Gateway | wait for external local worker health after shutdown (default `15000`) |
| `ROLL_LOCAL_WORKER_HEALTH_PROBE_MS` | Gateway | initial local URL / lock health probe (default `5000`) |
| `ROLL_GATEWAY_NAME` | Gateway | optional Worker CONNECTED label; default auto `Discord+Telegram+…` |
| `ROLL_WORKER_TOKEN` | Both | auto-generated into `.env` if unset (unless allow-no-token) |
| `ROLL_WORKER_TIMEOUT_MS` | Gateway | `120000` |
| `ROLL_WORKER_REMOTE_ONLY` | Gateway | `true` = never local analytics (busy on error/needsLocal/denylist) |
| `ROLL_WORKER_DEFER_BUSY` | Gateway | default on when remote-only; `false` to opt out of silent queue |
| `ROLL_WORKER_DEFER_MAX` / `PER_USER` / `TTL_MS` | Gateway | `10000` / `20` / `600000` (memory queue; Discord+TG) |
| `ROLL_WORKER_HOST` / `PORT` | Worker | `127.0.0.1` / `3950` |
| `ROLL_WORKER_JSON_LIMIT` | Worker | `32mb` |
| `ROLL_WORKER_RATE_LIMIT_POINTS` / `DURATION` | Worker | `300` / `60` (per IP on `/v1/*`) |
| `ROLL_WORKER_RATE_LIMIT_DISABLED` | Worker | tests only |
| `ROLL_WORKER_DISCORD_DENYLIST` | Both | comma module ids forced local on Discord |
| `ROLL_ARTIFACT_ROOT` | Both | cwd; must match across processes |
| `ROLL_WORKER_ALLOW_NO_TOKEN` | Worker | tests only; loopback only |
| `ROLL_WORKER_MODE` | Worker (set by `roll-worker.js`) | Agenda **DB connect** at boot (API only); skips job processor |

## Process tips

| Process | Env focus |
|---------|-----------|
| `yarn start:roll-worker` | `mongoURL`, `ROLL_WORKER_TOKEN`, no platform secrets required |
| Discord gateway | `DISCORD_CHANNEL_SECRET`, `ROLL_WORKER_URL`, optional `ROLL_LOCAL_WORKER_URL`, `mongoURL` |
| WWW + LINE | `CREATEWEB`, LINE secrets, `ROLL_WORKER_URL` |
| WhatsApp alone | `WHATSAPP_SWITCH`, session volume, `ROLL_WORKER_URL` |
| Local fallback worker | Same binary as primary; e.g. `ROLL_WORKER_PORT=3951 yarn start:roll-worker` |

Worker sets `ROLL_WORKER_MODE=true`, **eagerly** loads Agenda at boot (`await _ready`, API only), and **does not** start the Agenda job processor (platforms keep `scheduleAtMessage*` handlers).

Scripts: `yarn test:roll-worker`, `yarn proof:roll-worker`, `yarn proof:local-worker`.

---

## Local HTTP fallback + `.root reload` (Phase A/B)

### Goal

- Keep Discord Gateway process up (no IDENTIFY / shard respawn) when updating **compute** code.
- Hybrid `workerError` can fall back to a **second HTTP Roll Worker** (`ROLL_LOCAL_WORKER_URL`) instead of only in-process `analytics`.
- Admin `.root reload` restarts compute Workers only — **never** `.root respawn*` (cluster/shard).

### Recommended ops (shared local worker per machine)

```bash
# Terminal A — primary
ROLL_WORKER_PORT=3950 yarn start:roll-worker

# Terminal B — local fallback (one per host; not per Discord cluster process)
ROLL_WORKER_PORT=3951 yarn start:roll-worker
```

Gateway `.env`:

```env
ROLL_WORKER_URL=http://127.0.0.1:3950
ROLL_LOCAL_WORKER_URL=http://127.0.0.1:3951
ROLL_WORKER_TOKEN=change-me
```

Optional single-process Gateway auto-spawn (dev / non-sharded only):

```env
ROLL_LOCAL_WORKER_SPAWN=true
ROLL_LOCAL_WORKER_PORT=3951
```

Uses `temp/roll-local-worker.lock` so a second Gateway process reuses an existing healthy child instead of double-spawning. If `ROLL_LOCAL_WORKER_URL` is set but unhealthy **and** `SPAWN=true`, Gateway spawns a replacement on `ROLL_LOCAL_WORKER_PORT` and overwrites the URL. **Do not enable SPAWN on every Discord hybrid-sharding cluster worker** — prefer Terminal B above.

### Three-way fallback (hybrid)

| Path | Where it runs | Covered by `.root reload local`? |
|------|---------------|----------------------------------|
| Primary OK | `ROLL_WORKER_URL` HTTP | No (use `.root reload remote` / PM2 restart primary) |
| `workerError` (non fail-closed) | 1) `ROLL_LOCAL_WORKER_URL` HTTP → 2) in-process `analytics` | **Yes** for step 1 only |
| `needsLocal` (live `discordClient` / Message) | Gateway in-process `analytics` | **No** — Gateway restart required |
| `FAIL_CLOSED_ON_WORKER_ERROR` | no local re-run | n/a |
| `REMOTE_ONLY` | defer-busy / silent (unchanged) | local HTTP unused |

Proof markers (`keepProof` / tests): `_rollWorker: true` (primary), `_rollLocalWorker: true` (local HTTP), `_rollWorker: false` (main-thread).

### Why `needsLocal` is not hot-reloadable

`needsLocal` re-runs on the Gateway with live `discordClient` / `discordMessage` (not JSON-serializable). Local/remote Workers cannot receive those objects. Reloading a child process only refreshes code **inside that process**; Gateway `require` cache for Discord-coupled paths stays until Gateway restart.

### Admin commands

```text
.root reload              # same as local
.root reload local        # drain + restart local compute
.root reload remote       # loopback POST /v1/admin/reload on ROLL_WORKER_URL
.root reload all          # local then remote
/root reload              # Discord slash → .root reload local
/root reload target:…     # local | remote | all
```

- Runs on **Gateway** (`adminSubNeedsLiveDiscord('.root','reload')` → always `needsLocal`).
- **Not** Discord cluster respawn. Do not confuse with `.root respawn` / `respawnall`.
- Reply text includes `ok` / `mode` / `url` / `pid` and an explicit note about Discord-coupled paths.

### `POST /v1/admin/reload` (preferred for `.root reload`)

| Rule | Detail |
|------|--------|
| Auth | Bearer `ROLL_WORKER_TOKEN` (same middleware as `/v1/*`) |
| Network | **Loopback callers only** (`127.0.0.1` / `::1`); else `403` |
| Behavior | Respond `{ ok, reloading, pid, drainMs, mode: 'self-restart' }`, then drain → close HTTP listener → **spawn successor** `roll-worker.js` (detached) → `process.exit(0)` |
| Ops | Works without PM2 for bare `yarn start:roll-worker`; successor inherits env and rebinds the same port |

### `POST /v1/admin/shutdown`

| Rule | Detail |
|------|--------|
| Auth | Bearer `ROLL_WORKER_TOKEN` (same middleware as `/v1/*`) |
| Network | **Loopback callers only** (`127.0.0.1` / `::1`); else `403` |
| Behavior | Respond `{ ok, shuttingDown, pid, drainMs }` then `process.exit(0)` after `drainMs` (cap 10s) — **no successor** |
| Ops | Use for supervised SPAWN (Gateway respawns) or when PM2/docker/systemd owns restart |

Remote hosts: Gateway `.root reload remote` gets `403` / transport error → reply tells you to restart Worker on that host via process manager. No public kill endpoint.

### Reload modes (`local-worker.js`)

| Mode | When | Effect |
|------|------|--------|
| `supervised-respawn` | Gateway owns child (`SPAWN=true`) | shutdown → wait unhealthy → Gateway respawn → wait health |
| `self-restart` | Shared local / primary Worker | `/v1/admin/reload` → wait unhealthy → wait health (successor) |
| `reload-sent` | Reload started; health not back within wait | warn: check Worker logs / start Worker |
| `reload-uncertain` | Reload requested but `/health` still OK | fail: process may not have restarted |

### Key modules (Phase A/B)

| File | Role |
|------|------|
| `local-worker.js` | SPAWN/lock, `reloadLocal` / `reloadRemote`, status, Gateway shutdown of supervised child |
| `client.js` | `isLocalEnabled`, `parseLocal`, `parseWithUrl`, `requestAdminReload` / `requestAdminShutdown`, `healthAt` |
| `parse-router.js` | hybrid: `workerError` → local HTTP then main-thread; `needsLocal` → main-thread only |
| `server.js` | `POST /v1/admin/reload` (self-restart) + `POST /v1/admin/shutdown` (loopback) |
| `admin-remote.js` | `.root reload` always Gateway-local |
| `roll/z_admin.js` | `.root reload [local\|remote\|all]` command |

### Tests / proof

```bash
yarn test:roll-worker          # includes local-http + reload Jest
yarn proof:local-worker        # live primary+local Workers + parseRouter fallback + reload
# Targeted:
yarn jest test/roll-worker-parse-router.test.js test/roll-worker-local-http-fallback.test.js test/roll-worker-reload.test.js --runInBand
```

| Suite | Covers |
|-------|--------|
| `roll-worker-parse-router.test.js` | mock: local HTTP preferred on `workerError`; `needsLocal` skips `parseLocal` |
| `roll-worker-local-http-fallback.test.js` | live spawn two Workers; `client.parse` / `parseLocal` |
| `roll-worker-reload.test.js` | unit shutdown auth; supervised respawn; shared/local + remote **self-restart** |
| `scripts/proof-local-worker.js` | full parseRouter `_rollLocalWorker` after primary kill |

### Review verdict (Phase A/B)

**Ship-ready for hybrid ops behind `ROLL_LOCAL_WORKER_URL`.** Correctly avoids `worker_threads` for full `analytics` (Discord live objects). Hot reload covers **HTTP compute** (primary + local Workers), not Gateway Discord-coupled `needsLocal` paths — documented and surfaced in `.root reload` replies.

| Check | Result |
|-------|--------|
| Shared local worker (not per-cluster spawn by default) | Yes — URL + optional SPAWN+lock |
| Three-way fallback | Yes — remote / local HTTP / main-thread |
| Fail-closed unchanged | Yes |
| Shutdown loopback-only | Yes |
| Discord Gateway never restarted by reload | Yes |
| Proof green | `yarn proof:local-worker` → PASSED |

**Accepted limits:**

1. Main-thread `needsLocal` code still needs Gateway restart to pick up source changes.
2. `.root reload remote` on a non-loopback Worker host cannot kill remotely — use PM2/docker on that host.
3. Local HTTP Worker still loads full `analytics` + Mongo (same as primary); memory cost is a second process, not a thread.

## Discord hybrid routing

- **Phase 3j denylist**: any matched Discord module remotes by default; `LOCAL_DISCORD_ONLY` is the only hard block (empty).
- `REMOTE_ALLOWLIST` is documentation of known remote-capable modules.
- Unmatched Discord chat stays local (`isRemoteAllowed(null)` → false).
- Modules that need live Discord return `needsLocal` or use Gateway prefetch meta (token/openai/export/story/forward/chatroom/admin).
- `.st mylist`: Gateway prefetches `storyGroupNamesMeta` for GROUP_ONLY channel/guild display names.
- Still needsLocal (fallback only): missing prefetch meta for Discord-coupled steps (export history, avatar, attachments, cluster/slash/fixshard meta, etc.).
- Bare Discord `.ai*` (no help/arg/reply/attachments) on Worker returns `needsLocal`; explicit `.ai help` stays remote help text.

## Separation status

**Module split is complete (Phase 3 → 3ab).** Remaining `needsLocal` paths are intentional Gateway fallbacks when prefetch meta is unavailable — not unfinished remotes. **Hybrid:** Worker outages fall back to **`ROLL_LOCAL_WORKER_URL` HTTP when set**, else in-process analytics (except `FAIL_CLOSED_ON_WORKER_ERROR` mutators). **Phase A/B:** `.root reload local|remote|all` restarts compute only; Discord Gateway stays up. **`ROLL_WORKER_REMOTE_ONLY`:** no local analytics; defer-busy queues safe failures (Discord/TG/LINE/WA/WWW/Plurk) and **never shows system_busy** while defer is on (timeout/mutator mid-flight → silent empty, not replayed). HTTP `/api` and `/api/local` have no push channel → return `{ deferred: true }` under defer so clients (個人小屋) can retry until Worker is back (opt-out `DEFER_BUSY=false` restores system_busy text). Both `needsLocal` and `workerError` hybrid fallbacks use `skipExp`. Export history prefetch skips GP cooldown / low userrole; empty `sum_messages` does not count as prefetch. Chatroom ManageChannels checks the invoking member via `guild.members.fetch`. `.forward` Gateway fallback live-retries ownership when prefetch flags are false (deleted reply-refs fail closed). Schedule `[[dice]]` uses `skipExp` so cron/at jobs never award channel XP. Non-Discord platforms (including WWW chat) keep local `findRollList` as the command gate so chatter does not hit Worker / award EXP via parse. OpenAI Discord attachment downloads use `safeFetchBuffer` with a 50MB hard cap. `fileLink` / `dmFileLink` attach only paths under `ROLL_ARTIFACT_ROOT`.

## Health

`GET http://127.0.0.1:3950/health` (primary; local fallback uses its own port, e.g. `:3951/health`)

`POST http://127.0.0.1:3950/v1/admin/shutdown` — Bearer + loopback only (see Phase A/B).

## Character card (WWW)

`POST /v1/character-action` with `{ doc, item, locale, botname }` — used by WWW socket rolling when `ROLL_WORKER_URL` is set.

---

## Branch review (`Distributed-` vs `master`)

| Field | Value |
|-------|-------|
| Code tip (fixes) | working tree Phase A/B (local HTTP + `.root reload`) |
| Prior code tip | Pass 3ab REMOTE_ONLY defer-busy |
| Base | `master` (`793d1058`) |
| Pass 8 | 2026-07-29 — Bugbot + findings list |
| Pass 9 | 2026-07-29 — **fix all** open High/Medium (+ key Lows) |
| Pass 10 | 2026-07-29 — **strict proof**: Phase 3x Jest + live Worker+Gateway |
| Pass 11 | 2026-07-29 — **fix remaining** L2/L9/L15/I11 + Phase 3y proof |
| Pass 12 | 2026-07-29 — **fix remaining Lows** L3–L7/L12/L13 + Phase 3z proof |
| Pass 13 | 2026-07-29 — **fix L8/L10/M4** + M6 design contract + Phase 3aa proof |
| Pass 3ab | 2026-07-29 — REMOTE_ONLY defer-busy + ops UX (token/link/mode) Jest+live proof |
| Phase A/B | 2026-07-30 — local HTTP fallback + `.root reload` + loopback admin shutdown |

### Verdict

**Pass 9–13 + 3ab: remoting is production-ready behind `ROLL_WORKER_URL`.** All actionable High/Medium/Low review findings are closed or accepted (M6). Latest ops layer: auto-token, link CONNECTED/DISCONNECTED, `ROLL_WORKER_REMOTE_ONLY`, and silent defer-busy queue (Discord/TG/LINE/WA/WWW).

**Phase A/B (2026-07-30): local compute hot-reload is production-ready behind `ROLL_LOCAL_WORKER_URL`.** Hybrid `workerError` → local HTTP then in-process; `.root reload` never touches Discord Gateway; `needsLocal` remains Gateway-bound by design.

**Last green proof (2026-07-30):** Phase A/B Jest → **63 passed** (8 suites); `yarn proof:local-worker` → **PASSED** (primary → local HTTP → in-process → reload `shutdown-sent`). Prior: `yarn proof:roll-worker` → Phase 3 → 3ab.

**Fixed in Pass 9:** H1–H4, M1–M3, M5, M7–M15, L1, L11, L14.

**Fixed in Pass 11:** L2 (rate-limit `/v1/*`), L9 (`.env.copy` HOST/PORT/JSON/RATE), I11 (Api + `/api/local` `findRollList` gate), L15 (LevelUp `{user.displayName}` via signed `displaynameDiscord`).

**Fixed in Pass 12:** L3 (reject future HMAC `ts`), L4 (`discord.com` + nested CDN hosts), L5 (realpath artifact jail), L6 (`/health` counters require Bearer), L7 (chatroom permission text), L12 (mylist unknown group label), L13 (Gateway export wait notice before remote).

**Fixed in Pass 13:** L8 (HMAC signs all body keys), L10 (`courtMessage` skipped when `skipExp`), M4 (`ROLL_WORKER_DISCORD_DENYLIST` ops override; default still empty).

**Added in Pass 3ab (ops / UX, not prior finding IDs):**

| Item | Behavior |
|------|----------|
| Auto token | Missing `ROLL_WORKER_TOKEN` → generate 64-hex + upsert `.env` (`ensure-token.js`) |
| Link status | Gateway `[RollWorkerLink] CONNECTED/DISCONNECTED`; Worker peer CONNECTED + 90s idle DISCONNECTED |
| ParseMode | One-liner: `GATEWAY → REMOTE WORKER \| local=ON\|OFF \| defer=on\|off` |
| `REMOTE_ONLY` | No in-process analytics; errors/needsLocal/denylist → busy (or defer) |
| Defer-busy | **Only when `REMOTE_ONLY`**: silent memory queue (max 10000 / 20 per user / TTL 10m); deliver on CONNECTED + 5s drain; **never show `system_busy`** while defer is on (queue or silent empty); mutator **timeout** not replayed (silent); mutator **pre-flight** connect may defer |

**Added in Phase A/B (local HTTP + reload):**

| Item | Behavior |
|------|----------|
| `ROLL_LOCAL_WORKER_URL` | Hybrid `workerError` → `client.parseLocal` before in-process analytics |
| `ROLL_LOCAL_WORKER_SPAWN` | Optional supervised child + `temp/roll-local-worker.lock` (single-process) |
| `.root reload` | `local` / `remote` / `all`; Gateway-only; never cluster respawn |
| `/v1/admin/reload` | Bearer + loopback; drain → close → spawn successor → exit |
| `/v1/admin/shutdown` | Bearer + loopback; drain then `process.exit(0)` (no successor; SPAWN/PM2) |
| ParseMode | Logs `localHttp=<url\|off>` when remoting |
| Hot-reload scope | HTTP Workers yes; Gateway `needsLocal` + live Discord paths no |

**Proof commands (exit 0):**

```bash
yarn test:roll-worker     # Phase 3 → 3ab + Phase A/B Jest
yarn proof:roll-worker    # spawns roll-worker.js + Gateway parseRouter/client (→ 3ab)
yarn proof:local-worker   # primary + local Workers; parseRouter fallback + reload
```

**Still optional / ops / accepted design:**

1. M6: Axios abort does not cancel Worker parse (fail-closed mutators mitigate)
2. Defer queue is **in-memory** (lost on Gateway restart)
3. Interaction token ~15m → defer TTL capped at 14m; ephemeral slash cannot recover after expiry
4. Ops: shared `ROLL_WORKER_TOKEN` + `ROLL_ARTIFACT_ROOT`; bind Worker loopback/private
5. WWW HTTP Api/Local cannot defer (no reply channel); character deferred drain emits socket only (no selectedGroupId bridge)
6. Phase A/B: Gateway Discord-coupled `needsLocal` code still requires Gateway restart to refresh
7. Phase A/B: non-loopback primary Worker cannot be killed via `.root reload remote` (use host PM2/docker)

### Architecture overview

```mermaid
flowchart LR
  subgraph Gateways
    D[Discord bot.js]
    T[TG / LINE / WA / Plurk / WWW]
  end
  PR[parse_router]
  Q[defer_queue_memory]
  W[RollWorker_primary]
  LW[RollWorker_local]
  A[analytics_main_thread]
  M[(Mongo)]
  FS[Shared_ROLL_ARTIFACT_ROOT]

  D -->|prefetch_meta| PR
  T -->|findRollList_gate| PR
  PR -->|"1_primary_HTTP"| W
  PR -->|"2_workerError_local_HTTP"| LW
  PR -->|"3_needsLocal_or_localHttp_down"| A
  PR -->|REMOTE_ONLY_busy_safe| Q
  Q -->|drain_CONNECTED| W
  Q -->|deferredReplay_needsLocal| A
  W --> M
  LW --> M
  A --> M
  W --> FS
  LW --> FS
  D --> FS
  Admin["root_reload"] -->|restart_local| LW
  Admin -.->|loopback_shutdown| W
```

| Layer | Behavior |
|-------|----------|
| Opt-in | No `ROLL_WORKER_URL` → in-process analytics (unchanged) |
| Discord | Prefetch meta → Worker; missing meta → `needsLocal` (except openai M3) |
| Other platforms | Remote when enabled + matched; local `findRollList` gates chatter |
| Auth | Bearer `ROLL_WORKER_TOKEN` (+ auto `.env` generate) + HMAC `_gatewayAuth` |
| Hybrid fail | `ROLL_LOCAL_WORKER_URL` HTTP then in-process; `FAIL_CLOSED_ON_WORKER_ERROR` skips both |
| Local HTTP | Optional second Worker; hot-reload via `.root reload local` |
| Remote-only | No local; busy or **defer-busy** (Discord/TG/LINE/WA/WWW); mutator timeout still immediate busy |
| EXP | `needsLocal` + `workerError` fallbacks use `skipExp`; schedule `[[dice]]` uses `skipExp` |

### Key modules (`modules/roll-worker/`)

| File | Role |
|------|------|
| `server.js` | Express Worker (`/health`, `/v1/parse`, `/v1/character-action`, `/v1/admin/shutdown`) + peer link logs |
| `client.js` | Gateway HTTP client + `parseLocal` / shutdown + serializable context + link monitor |
| `local-worker.js` | SPAWN/lock supervisor + `.root reload` local/remote |
| `parse-router.js` | Remote vs local routing, prefetch, fallbacks, REMOTE_ONLY, defer enqueue |
| `defer-queue.js` | In-memory busy queue (REMOTE_ONLY); drain + deliverers |
| `ensure-token.js` | Auto-generate / upsert `ROLL_WORKER_TOKEN` in `.env` |
| `connection-status.js` | Edge-triggered `[RollWorkerLink] CONNECTED/DISCONNECTED` |
| `request-auth.js` | HMAC over signed claims |
| `safe-fetch.js` | Discord CDN allowlist + byte-capped fetch |
| `route-table.js` | Discord denylist (`LOCAL_DISCORD_ONLY` + env) |
| `discord-prefetch.js` | Discord asset / history / permission prefetch |
| `admin-remote.js` | Admin/root meta + live-sub classifier |
| `artifacts.js` | Shared `ROLL_ARTIFACT_ROOT` path jail |
| `export-history.js` | Empty-history prefetch guard |
| `forward-ownership.js` | Live forward ownership retry |
| `character-action.js` | WWW character roll helper |
| `dark-rolling.js` | Mongo-backed GM list + TTL cache (Discord/TG/Line/WA via `getGroupGms`) |

### Strengths

1. Clear Gateway / Worker split; Discord uses prefetch + `needsLocal` instead of shipping the Discord client to Worker.
2. Dual auth with claim integrity (`userrole` / prefetch metas cannot be rewritten in transit without the secret).
3. Fail-closed for quota / artifact / API mutators: `export`, `openai`, `token`, `z_admin`, `z-story-teller`, `forward`, `z_multi-server`.
4. `skipExp` on `needsLocal` **and** `workerError` fallback; schedule `[[dice]]` never awards channel XP.
5. Artifact path jail; Agenda processor disabled on Worker (`ROLL_WORKER_MODE`).
6. Non-Discord chatter gated locally (avoids Worker / EXP spam), including WWW.
7. Discord gateway side-effects ordered correctly: `clusterIpc` / `gatewayAction` / `adminDm*` / artifact attach via `assertArtifactReadable`.
8. Unusually thorough incremental test suite (`test/roll-worker-phase3*.test.js` through 3w) + `scripts/proof-gateway-worker.js`.
9. Forward deleted reply-refs fail with error (no infinite `needsLocal` loop).
10. `SIGNED_CLAIM_KEYS` covers current `toSerializableContext` / character-action fields.
11. Empty OpenAI / export prefetch arrays correctly treated as “not prefetched”.
12. Worker refuses `ALLOW_NO_TOKEN` on non-loopback bind.
13. Discord/TG/Line/WA dark-roll all use `darkRolling.getGroupGms` + invalidate.
14. Auto-token + concise ParseMode + dual-side link CONNECTED/DISCONNECTED.
15. `REMOTE_ONLY` + defer-busy (silent queue; proved Phase 3ab) without showing system_busy for safe failures.
16. Phase A/B: local HTTP fallback + `.root reload` without Discord Gateway restart; loopback admin shutdown.

### Open findings

**Pass 9:** High/Medium from Pass 1–8 are **fixed** in the working tree (see Fixed table). Remaining are Low/Info only.

#### Fixed (Pass 9)

| ID | Fix |
|----|-----|
| H1 | `workerError` local fallback passes `skipExp: true` |
| H2 | `FAIL_CLOSED_ON_WORKER_ERROR` expanded (schedule/character/cmd/random_ans/trpgDatabase/event/level/stop/dark-roll + prior 7) |
| H3 | Discord `privateMsgFinder` → `darkRolling.getGroupGms` |
| H4 | `invalidateGroupConfig` clears sticky `tempSwitchV2`; parse-router invalidates after remoted `.level` |
| M1 | WWW `character-action` fail-closed on Worker error (no local retry) |
| M2 | `safe-fetch` IP-pinned + redirect refuse via `resolvePublicFetchTarget` |
| M3 | Bare Discord `.ai*` on Worker → `needsLocal` (explicit `.ai help` still remote help) |
| M5 | Default `ROLL_WORKER_TIMEOUT_MS` → `120000` |
| M7/M12 | Gateway reloads `.bk` / `.cmd` RAM after remoted mutate |
| M8 | Export prefetch skips history when `hasReadPermission === false` |
| M9–M11 | wheel / `.st export` / openai `createFile` use `getTempFilePath` |
| M13 | Nested `needsLocal` carries `nestedInputStr` + `parentResult`; Gateway re-runs nested only |
| M14 | Slash deploy deferred like fixshard (`gatewayAction: slashDeploy`) |
| M15 | `.at`/`.cron` surface Agenda save errors (`at_save_error` / `cron_save_error`) |
| L1 | Bearer compared with `timingSafeEqual` |
| L11 | VIP `invalidateCache` after remoted `z_admin` |
| L14 | `result.statue = tempEXPUP?.status` |
| L2 | `/v1/*` RateLimiterMemory (default 300/60s per IP; env override / disable) |
| L9 | `.env.copy` documents HOST/PORT/JSON_LIMIT/RATE_LIMIT* |
| I11 | WWW `handleApiRequest` + `/api/local` local `findRollList` gate |
| L15 | `resolveLevelUpDisplayName` + Discord `displaynameDiscord` from `member.displayName` |
| L3 | Reject future HMAC `ts` beyond 5s skew |
| L4 | Allow `discord.com` + nested CDN subdomains |
| L5 | `assertArtifactReadable` uses `realpathSync` jail |
| L6 | `/health` counters/uptime require Bearer when token set (probes get `{ok,role}`) |
| L7 | `.chatroom` permission deny returns `chatroom.permission_denied` |
| L12 | `.st mylist` uses `mylist_group_unknown` when names meta missing |
| L13 | Gateway sends export wait notice before remoted export (`exportWaitNoticeSent`) |
| L8 | HMAC `pickClaims` signs all body keys (not allowlist-only) |
| L10 | `courtMessage` skipped when `skipExp` (no dual-exec metric inflate) |
| M4 | `ROLL_WORKER_DISCORD_DENYLIST` ops override; built-in set still empty |

#### Remaining Low / Info / accepted design

| ID | Location | Finding |
|----|----------|---------|
| M6 | Timeout race | Axios abort does not cancel Worker parse (accepted; mutators fail-closed). |
| D1 | Defer persistence | Memory-only; Gateway restart drops queue (by design MVP). |
| D2 | Defer platforms | **Closed:** Discord/TG/LINE/WA/WWW socket deliverers; HTTP Api/Local still immediate busy. |
| D3 | Slash token | Interaction TTL ≤14m; after expiry channel.send fallback (ephemeral lost). |

### Pass triage

| Pass | Highlights |
|------|------------|
| 1–8 | Architecture + findings H1–H4 / M1–M15 / L* |
| 9 | **Fixed** H1–H4, M1–M3, M5, M7–M15, L1, L11, L14 |
| 10 | **Proved** Pass 9 via Phase 3x Jest + live Worker proof |
| 11 | **Fixed+proved** L2/L9/L15/I11 via Phase 3y Jest + live Worker proof |
| 12 | **Fixed+proved** L3–L7/L12/L13 via Phase 3z Jest + live Worker proof |
| 13 | **Fixed+proved** L8/L10/M4 + M6 contract via Phase 3aa Jest + live Worker proof |
| 3ab | **Added+proved** REMOTE_ONLY defer-busy, auto-token, link status, ParseMode (264 Jest + live) |
| A/B | **Added+proved** local HTTP fallback, `.root reload`, loopback `/v1/admin/shutdown`, SPAWN+lock |

### Test coverage

**Well covered:** routing, client serialization, HMAC tamper, SSRF host allowlist, byte limits, **redirect refuse + IP pin (M2)**, needsLocal+skipExp, **workerError skipExp (H1)**, fail-closed openai/export **+ DB mutators (H2)**, artifacts escape + **getTempFilePath writers (M9–M11)**, prefetch helpers, live spawn+token, fixshard deferred, schedule skipExp, multi-platform fallback, empty-array prefetch guards, loopback allow-no-token, 32mb JSON body, **bare Discord `.ai` needsLocal + `.ai help` remote (M3)**, **WWW character-action fail-closed (M1)**, **nested needsLocal (M13)**, **level sticky invalidate (H4)**, **Discord getGroupGms (H3)**, **`.bk`/`.cmd` reload (M7/M12)**, **slashDeploy defer (M14)**, **schedule save errors (M15)**, **statue←status (L14)**, default 120s timeout (M5), **/v1 rate-limit 429 (L2)**, **Api+/api/local findRollList (I11)**, **LevelUp displayName signed fallback (L15)**, **REMOTE_ONLY defer-busy enqueue/drain (3ab)**, **auto-token upsert**, **link CONNECTED edge**, **local HTTP `parseLocal` fallback (A)**, **admin shutdown loopback (A/B)**, **supervised / remote reload (A/B)**, **`proof:local-worker`**.

**Remaining gaps (optional):**

1. `discord/bot.js` full integration (artifact attach / `clusterIpc` live) — proof covers source + key remotes.
2. Timeout vs long OpenAI call end-to-end (M5/M6 design).
3. Multi-gateway concurrent fallback races on Mongo.
4. Live `.drgm` → `ddr` GM DM with Mongo (H3 unit covers Discord `getGroupGms` wiring).
5. Persist defer queue (Agenda/Mongo).
6. Phase A/B: live Discord `.root reload` slash UX (text command covered); Monorepo `@hktrpg/core` deferred.

### Recommended fixes (shortest path)

**Pass 9–13 + 3ab + Phase A/B closed remoting + local compute hot-reload.** Remaining accepted design: M6 (no Worker cancel); `needsLocal` Gateway-bound. Optional next: persist defer queue; incremental `@hktrpg/core` extract (not required for reload).

### Focus-area checklist (Pass 9)

| Area | Result |
|------|--------|
| analytics needsLocal / skipExp / Discord guards | needsLocal + LevelUp merge OK; skipExp on needsLocal **and** workerError; nested nested-only handoff; statue←status fixed; Discord guard still dead (M4) |
| discord/bot.js wiring | parseRouter, artifacts, `clusterIpc`, `gatewayAction`, admin DM ordered correctly (I10) |
| Discord dark-roll | **Fixed:** `getGroupGms` on Discord too |
| Level / `.bk` / `.cmd` RAM | **Fixed:** invalidate sticky + reload `.bk`/`.cmd` after remoted mutate |
| Artifact writers | **Fixed:** token / wheel / `.st export` / openai `createFile` use `getTempFilePath` |
| Admin slash vs fixshard | **Fixed:** both deferred via `gatewayAction` |
| client.js | 503→needsLocal; 5xx/timeout → fallback; default 120s |
| parse-router fail-closed / fallback | Expanded fail-closed + skipExp on workerError; nested handoff; cache invalidation hooks; **Phase A local HTTP before in-process** |
| local-worker / reload | SPAWN+lock; `.root reload local\|remote\|all`; shutdown loopback-only |
| discord-prefetch | Chatroom OK; empty export history OK; denied-read skips fetch |
| forward-ownership | Deleted refs fail closed (I4) |
| getRoll + schedule | `skipExp` OK; Agenda skipped on Worker; Agenda save errors surfaced |
| openai/token/export/forward/z_admin | All have needsLocal where required; bare `.ai*` → needsLocal |
| SIGNED_CLAIM_KEYS | Complete — Pass 13 L8 signs **all** body keys |
| Timeout race Mongo | Fall-open yes (H1/H2/M6); fail-closed still charges (I3) |
| core-* vs Discord | Parse OK; WWW character-action fail-closed + REMOTE_ONLY gate; Api+/api/local gated (I11) |
| safe-fetch | Host allowlist + IP pin + redirect refuse + byte cap |
| Env / scripts | Cheat sheet aligned; auto-token; REMOTE_ONLY + DEFER_*; proof clears REMOTE_ONLY for hybrid phases |
| courtMessage / metrics | skipExp skips courtMessage (L10); needsLocal does not dual-count |
| Defer-busy | REMOTE_ONLY only; Discord/TG/LINE/WA/WWW/Plurk; never surface system_busy while defer on; Discord drain full finalize; mutator timeout silent no-replay; pre-flight connect may defer |

### Delivered on this branch (through Phase A/B)

| Area | What landed |
|------|-------------|
| Backend | `roll-worker.js` + Express `/health`, `/v1/parse`, `/v1/character-action`, `/v1/admin/shutdown` |
| Routing | `parse-router` remote/local + Discord prefetch + fail-closed + REMOTE_ONLY |
| Local HTTP | `ROLL_LOCAL_WORKER_URL` + `parseLocal`; SPAWN+lock supervisor |
| Reload | `.root reload local\|remote\|all` (Gateway; no Discord respawn) |
| Auth | Bearer + HMAC; auto-generate token into `.env` |
| Discord hybrid | Prefetch metas + `needsLocal` |
| Defer-busy | `defer-queue.js` silent queue when REMOTE_ONLY (Discord/TG/LINE/WA/WWW deliver) |
| Link UX | `[RollWorkerLink]` / Worker peer CONNECTED–DISCONNECTED |
| Artifacts | Shared `ROLL_ARTIFACT_ROOT` jail; Gateway attach gated |
| Safety | CDN allowlist fetch + byte caps; rate-limit `/v1/*`; health counters auth; shutdown loopback |
| Platforms | TG/Line/WA/Plurk/WWW + Discord + schedule `skipExp` |
| Tests | Phase 3 → **3ab** + Phase A/B Jest + `proof-gateway-worker.js` + `proof-local-worker.js` |
| Ops version | `modules/runtime/build-info.js` — display `branch · YYYY-MM-DD · sha` on `.admin state` / `.root mem` / Bearer `/health` |

### Ops build identity (`build-info`)

Display format (not `package.json` semver):

```text
Distributed- · 2026-07-30 · a1b2c3d
```

| Field | Env (preferred on prod) | Fallback |
|-------|-------------------------|----------|
| branch | `GIT_BRANCH` / `GITHUB_REF_NAME` / `BRANCH_NAME` / `HEROKU_BRANCH` | `git rev-parse --abbrev-ref HEAD` |
| sha | `GITHUB_SHA` / `SOURCE_VERSION` / `GIT_COMMIT` / `HEROKU_SLUG_COMMIT` | `git rev-parse --short HEAD` |
| date | `BUILD_TIME` / `SOURCE_DATE` (UTC day) | git committer date / process start |

`.admin state` shows up to three lines: Gateway (self or `gatewayBuildInfo` prefetch when report runs on Worker), Worker (`ROLL_WORKER_URL` health / self on Worker), Local (`ROLL_LOCAL_WORKER_URL` health).  
Gateway always attaches `gatewayBuildInfo` in the remote parse body so Worker-side state still shows the Gateway line.  
`.root mem` (B3 bars) footers Gateway only.  
Bearer-detailed `GET /health` includes `version: { display, gitBranch, gitSha, builtAt, … }`.

### Commits in scope (`master..Distributed-`)

```
56e2b2fc Update roll-worker.md
520b7338 Update roll-worker.md
e0565b7c Harden roll-worker fallbacks and fetch limits
e89e1395 Add Phase 3v fallback, WWW gate, and OpenAI cap
fa809998 Harden roll worker auth and fetch safety
ae9d98c8 Add forward live retry and schedule skipExp
eb074b8b Fix member fetch and export prefetch gating
82245721 Enable local fallback for all worker outages
0e88acba Complete roll-worker Phase 3m to 3o
efabdbdf Harden roll worker auth and artifact handling
df748e8a Expand Discord worker routing with prefetch
6ec8754d Expand roll-worker Discord remote coverage
2e79d5d8 Localize busy reply and log fallback events
874e2f82 Add roll worker backend and parse routing
```
