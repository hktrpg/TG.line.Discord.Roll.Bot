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
ROLL_WORKER_TOKEN=optional-shared-secret
```

3. Start gateways as usual (`yarn start` / docker discord vs non-discord).

Without `ROLL_WORKER_URL`, behavior is unchanged (in-process analytics).

## Process tips

| Process | Env focus |
|---------|-----------|
| `yarn start:roll-worker` | `mongoURL`, no platform secrets required |
| Discord gateway | `DISCORD_CHANNEL_SECRET`, `ROLL_WORKER_URL`, `mongoURL` |
| WWW + LINE | `CREATEWEB`, LINE secrets, `ROLL_WORKER_URL` |
| WhatsApp alone | `WHATSAPP_SWITCH`, session volume, `ROLL_WORKER_URL` |

Worker sets `ROLL_WORKER_MODE=true` and **does not** start the Agenda job processor (platforms keep `scheduleAtMessage*` handlers).

## Discord hybrid routing

- Allowlisted modules include dice, token, forward, openai, export, chatroom, **admin**, **story-teller**.
- `LOCAL_DISCORD_ONLY` is empty — unknown new modules still stay local on Discord.
- Safe remote without live client: `.admin help|state|debug|id|mongod`, `.patreon *`, `.root help`, `.st help|list|mylist`.
- Cluster / attachment / export ops → Worker `needsLocal` → Discord local retry.
- `token`: Gateway prefetches `avatarUrl` before remote parse.
- `openai`: Gateway prefetches `attachmentsMeta` / `replyContent`; `.ait` text+files can run on Worker (no channel progress msgs).
- Cluster / export html|txt / forward create / story import → Worker `needsLocal` → Discord local retry.

## Health

`GET http://127.0.0.1:3950/health`

## Character card (WWW)

`POST /v1/character-action` with `{ doc, item, locale, botname }` — used by WWW socket rolling when `ROLL_WORKER_URL` is set.
