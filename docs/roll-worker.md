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

**Auth:** set the same `ROLL_WORKER_TOKEN` on worker and every gateway. Worker refuses to start without a token unless `ROLL_WORKER_ALLOW_NO_TOKEN=true` (local tests only; non-loopback bind refused). Gateways attach an HMAC signature (`_gatewayAuth`) over identity and Discord prefetch claims; Worker rejects unsigned/expired bodies when a token is set.

**Artifacts:** Worker writes `export/` and `temp/` under `ROLL_ARTIFACT_ROOT` (default: process cwd) via `getTempFilePath` / `getExportDir`. Gateway and Worker must share that directory (same machine cwd or a mounted volume). Gateway skips attach when the file is missing (`assertArtifactReadable`). Writers: token, wheel GIF, `.st export`, openai `createFile`, export HTML/TXT.

**JSON body:** Worker accepts up to `ROLL_WORKER_JSON_LIMIT` (default `32mb`) so Discord `exportHistoryMeta` fits. Override if needed.

**Timeout:** `ROLL_WORKER_TIMEOUT_MS` (default `120000`). Override lower for tests if needed.

**SSRF:** Worker-side URL fetches allowlist Discord CDN hosts, resolve a public IP (`resolvePublicFetchTarget`), connect IP-pinned with `Host` header, refuse redirects, and enforce a hard byte cap.

## Env cheat sheet

| Variable | Where | Default / notes |
|----------|--------|-----------------|
| `ROLL_WORKER_URL` | Gateway | unset = local analytics |
| `ROLL_WORKER_TOKEN` | Both | required on Worker unless allow-no-token |
| `ROLL_WORKER_TIMEOUT_MS` | Gateway | `120000` |
| `ROLL_WORKER_HOST` / `PORT` | Worker | `127.0.0.1` / `3950` |
| `ROLL_WORKER_JSON_LIMIT` | Worker | `32mb` |
| `ROLL_ARTIFACT_ROOT` | Both | cwd; must match across processes |
| `ROLL_WORKER_ALLOW_NO_TOKEN` | Worker | tests only; loopback only |
| `ROLL_WORKER_MODE` | Worker (set by `roll-worker.js`) | skips Agenda processor |

## Process tips

| Process | Env focus |
|---------|-----------|
| `yarn start:roll-worker` | `mongoURL`, `ROLL_WORKER_TOKEN`, no platform secrets required |
| Discord gateway | `DISCORD_CHANNEL_SECRET`, `ROLL_WORKER_URL`, `mongoURL` |
| WWW + LINE | `CREATEWEB`, LINE secrets, `ROLL_WORKER_URL` |
| WhatsApp alone | `WHATSAPP_SWITCH`, session volume, `ROLL_WORKER_URL` |

Worker sets `ROLL_WORKER_MODE=true` and **does not** start the Agenda job processor (platforms keep `scheduleAtMessage*` handlers).

Scripts: `yarn test:roll-worker`, `yarn proof:roll-worker`.

## Discord hybrid routing

- **Phase 3j denylist**: any matched Discord module remotes by default; `LOCAL_DISCORD_ONLY` is the only hard block (empty).
- `REMOTE_ALLOWLIST` is documentation of known remote-capable modules.
- Unmatched Discord chat stays local (`isRemoteAllowed(null)` → false).
- Modules that need live Discord return `needsLocal` or use Gateway prefetch meta (token/openai/export/story/forward/chatroom/admin).
- `.st mylist`: Gateway prefetches `storyGroupNamesMeta` for GROUP_ONLY channel/guild display names.
- Still needsLocal (fallback only): missing prefetch meta for Discord-coupled steps (export history, avatar, attachments, cluster/slash/fixshard meta, etc.).
- Bare Discord `.ai*` (no help/arg/reply/attachments) on Worker returns `needsLocal`; explicit `.ai help` stays remote help text.

## Separation status

**Module split is complete (Phase 3 → 3w).** Remaining `needsLocal` paths are intentional Gateway fallbacks when prefetch meta is unavailable — not unfinished remotes. Worker outages fall back to local analytics on all platforms (opt-out: `allowLocalFallback: false`), except DB/quota/API mutators in `FAIL_CLOSED_ON_WORKER_ERROR` (export/openai/token/admin/story/forward/multi-server + schedule/character/cmd/random_ans/trpgDatabase/event/level/stop/dark-roll) which fail closed. Both `needsLocal` and `workerError` local fallbacks use `skipExp`. Export history prefetch skips GP cooldown / low userrole; empty `sum_messages` does not count as prefetch. Chatroom ManageChannels checks the invoking member via `guild.members.fetch`. `.forward` Gateway fallback live-retries ownership when prefetch flags are false (deleted reply-refs fail closed). Schedule `[[dice]]` uses `skipExp` so cron/at jobs never award channel XP. Non-Discord platforms (including WWW chat) keep local `findRollList` as the command gate so chatter does not hit Worker / award EXP via parse. OpenAI Discord attachment downloads use `safeFetchBuffer` with a 50MB hard cap. `fileLink` / `dmFileLink` attach only paths under `ROLL_ARTIFACT_ROOT`.

## Health

`GET http://127.0.0.1:3950/health`

## Character card (WWW)

`POST /v1/character-action` with `{ doc, item, locale, botname }` — used by WWW socket rolling when `ROLL_WORKER_URL` is set.

---

## Branch review (`Distributed-` vs `master`)

| Field | Value |
|-------|-------|
| Code tip (fixes) | working tree Pass 9 + Pass 10 proof |
| Prior code tip | `e0565b7c` Harden roll-worker fallbacks and fetch limits |
| Base | `master` (`793d1058`) |
| Pass 8 | 2026-07-29 — Bugbot + findings list |
| Pass 9 | 2026-07-29 — **fix all** open High/Medium (+ key Lows) |
| Pass 10 | 2026-07-29 — **strict proof**: Phase 3x Jest + live Worker+Gateway |

### Verdict

**Pass 9 fixed the production blockers** from Pass 8; **Pass 10 proved them** with `yarn test:roll-worker` (212 passed) and `yarn proof:roll-worker` (Phase 3 → 3x live). Gateway/Worker remoting is safe to rely on behind `ROLL_WORKER_URL` for normal ops. Remaining items mostly Low/Info (rate-limit, health auth, denylist dead code, WWW Api ungated chatter, LevelUp displayName degradation).

**Fixed in Pass 9:** H1–H4, M1–M3, M5, M7–M15, L1, L10 (already corrected), L11, L14. Intentionally deferred / accepted: M4 (empty denylist by design), M6 (timeout race design), L2–L9/L12–L13/L15, I*.

**Pass 10 proof commands (exit 0):**

```bash
yarn test:roll-worker   # 33 suites / 212 tests incl. phase3x-pass9-proof
yarn proof:roll-worker  # spawns roll-worker.js + Gateway parseRouter/client
```

**Still optional / ops:**

1. Rate-limit `/v1/parse` + trim huge signed bodies (L2)
2. Discord denylist for modules without remote contract (M4) — currently empty by design
3. WWW Api/`/api/local` local `findRollList` gate (I11)
4. Discord LevelUp `{user.displayName}` on Worker (L15 — degraded UX)
5. Ops: shared `ROLL_WORKER_TOKEN` + `ROLL_ARTIFACT_ROOT`; bind Worker loopback/private

### Architecture overview

```mermaid
flowchart LR
  subgraph Gateways
    D[Discord bot.js]
    T[TG / LINE / WA / Plurk / WWW]
  end
  PR[parse-router]
  W[Roll Worker :3950]
  A[analytics + roll/*]
  M[(Mongo)]
  FS[Shared ROLL_ARTIFACT_ROOT]

  D -->|prefetch meta| PR
  T -->|findRollList gate then| PR
  PR -->|ROLL_WORKER_URL set + remote allowed| W
  PR -->|unset / denylist / needsLocal / error| A
  W --> A
  A --> M
  W --> FS
  D --> FS
```

| Layer | Behavior |
|-------|----------|
| Opt-in | No `ROLL_WORKER_URL` → in-process analytics (unchanged) |
| Discord | Prefetch meta → Worker; missing meta → `needsLocal` (except openai M3) |
| Other platforms | Remote when enabled + matched; local `findRollList` gates chatter |
| Auth | Bearer `ROLL_WORKER_TOKEN` + HMAC `_gatewayAuth` over signed claims |
| Fail strategy | Default local fallback; expanded `FAIL_CLOSED_ON_WORKER_ERROR` set on Worker error |
| EXP | `needsLocal` + `workerError` fallbacks use `skipExp`; schedule `[[dice]]` uses `skipExp` |

### Key modules (`modules/roll-worker/`)

| File | Role |
|------|------|
| `server.js` | Express Worker (`/health`, `/v1/parse`, `/v1/character-action`) |
| `client.js` | Gateway HTTP client + serializable context |
| `parse-router.js` | Remote vs local routing, prefetch enrichment, fallbacks |
| `request-auth.js` | HMAC over signed claims |
| `safe-fetch.js` | Discord CDN allowlist + byte-capped fetch |
| `route-table.js` | Discord denylist (`LOCAL_DISCORD_ONLY`) |
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

#### Remaining Low / Info

| ID | Location | Finding |
|----|----------|---------|
| L2 | `server.js` JSON + HMAC | Authenticated DoS: default `32mb` JSON; no request rate limit. |
| L3 | `request-auth.js` | Future `ts` within window slightly extends replay. |
| L4 | `safe-fetch.js` | Host allowlist one subdomain deep. |
| L5 | `artifacts.js` | Symlink under root can escape path jail (low practical risk). |
| L6 | `server.js` `/health` | Unauthenticated uptime + counters. |
| L7 | `z_multi-server.js` | Permission deny still silent return (legacy UX). |
| L8 | `request-auth.js` | Future unsigned field integrity-blind (current keys covered). |
| L9 | `.env.copy` | Omits HOST/PORT/JSON_LIMIT (TIMEOUT now documents 120000). |
| L10 | courtMessage | Only fall-open dual-exec inflated metrics; fail-closed + skipExp now cover mutators. |
| L12 | `.st mylist` | Raw guild IDs when names meta missing (degraded UX). |
| L13 | `export.js` wait notice | Remoted export skips “processing” notice. |
| L15 | `level.js` displayName | Remoted Discord LevelUp `{user.displayName}` falls back to stored name. |
| M4 | `route-table.js` | Discord live-client guard still dead (`LOCAL_DISCORD_ONLY` empty) — by design. |
| M6 | Timeout race | Axios abort does not cancel Worker parse (design). |
| I11 | WWW Api / `/api/local` | Still no local `findRollList` gate (socket gated). |

### Pass triage

| Pass | Highlights |
|------|------------|
| 1–8 | Architecture + findings H1–H4 / M1–M15 / L* |
| 9 | **Fixed** H1–H4, M1–M3, M5, M7–M15, L1, L11, L14 |
| 10 | **Proved** via `test/roll-worker-phase3x-pass9-proof.test.js` + `scripts/proof-gateway-worker.js` (live Worker) |

### Test coverage

**Well covered:** routing, client serialization, HMAC tamper, SSRF host allowlist, byte limits, **redirect refuse + IP pin (M2)**, needsLocal+skipExp, **workerError skipExp (H1)**, fail-closed openai/export **+ DB mutators (H2)**, artifacts escape + **getTempFilePath writers (M9–M11)**, prefetch helpers, live spawn+token, fixshard deferred, schedule skipExp, multi-platform fallback, empty-array prefetch guards, loopback allow-no-token, 32mb JSON body, **bare Discord `.ai` needsLocal + `.ai help` remote (M3)**, **WWW character-action fail-closed (M1)**, **nested needsLocal (M13)**, **level sticky invalidate (H4)**, **Discord getGroupGms (H3)**, **`.bk`/`.cmd` reload (M7/M12)**, **slashDeploy defer (M14)**, **schedule save errors (M15)**, **statue←status (L14)**, default 120s timeout (M5).

**Remaining gaps (optional):**

1. No load/DoS stress test for 32mb signed bodies (L2 ops).
2. `discord/bot.js` full integration (artifact attach / `clusterIpc` live) — proof covers source + key remotes.
3. Timeout vs long OpenAI call end-to-end (M5/M6 design).
4. Multi-gateway concurrent fallback races on Mongo.
5. Live `.drgm` → `ddr` GM DM with Mongo (H3 unit covers Discord `getGroupGms` wiring).

### Recommended fixes (shortest path)

**Pass 9 + Pass 10 closed the priority fix + proof path.** Remaining optional work: rate-limit (L2), denylist tuning (M4), Api `findRollList` (I11), LevelUp displayName (L15).

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
| parse-router fail-closed / fallback | Expanded fail-closed + skipExp on workerError; nested handoff; cache invalidation hooks |
| discord-prefetch | Chatroom OK; empty export history OK; denied-read skips fetch |
| forward-ownership | Deleted refs fail closed (I4) |
| getRoll + schedule | `skipExp` OK; Agenda skipped on Worker; Agenda save errors surfaced |
| openai/token/export/forward/z_admin | All have needsLocal where required; bare `.ai*` → needsLocal |
| SIGNED_CLAIM_KEYS | Complete for current fields (L8 future risk only) |
| Timeout race Mongo | Fall-open yes (H1/H2/M6); fail-closed still charges (I3) |
| core-* vs Discord | Parse OK; WWW character-action fail-closed; Api + `/api/local` still ungated (I11) |
| safe-fetch | Host allowlist + IP pin + redirect refuse + byte cap |
| Env / scripts | Cheat sheet vs `.env.copy` gaps (L9); scripts present |
| courtMessage / metrics | needsLocal does **not** double-count (L10 corrected); workerError fall-open can |

### Delivered on this branch (through Pass 9 fixes)

| Area | What landed |
|------|-------------|
| Backend | `roll-worker.js` + Express `/health`, `/v1/parse`, `/v1/character-action` |
| Routing | `parse-router` remote/local + Discord prefetch enrichment + fail-closed mutators |
| Auth | Bearer + HMAC `_gatewayAuth` over `SIGNED_CLAIM_KEYS` |
| Discord hybrid | Prefetch metas (token/openai/export/story/forward/chatroom/admin) + `needsLocal` |
| Artifacts | Shared `ROLL_ARTIFACT_ROOT` jail; Gateway attach gated by `assertArtifactReadable` |
| Safety | Discord CDN allowlist fetch + byte caps; empty-array prefetch guards; loopback-only allow-no-token |
| Platforms | TG/Line/WA/Plurk/WWW + Discord bot + schedule `[[dice]]` `skipExp` |
| Tests | Phase 3 → 3x Jest suites (incl. Pass 9 proof) + `scripts/proof-gateway-worker.js` |

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
