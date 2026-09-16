# Session Log / Author Works

Glossary for the commercial author publishing platform built on Session Logs. Implementation details live in code and ADRs.

## Language

**Work（作品）**:
A single `sessionLog` document presented as a chaptered narrative for readers. Authors manage Works from the console at `/logs`.
_Avoid_: Story (that is the Discord interactive storyteller model), Novel (informal UI synonym only)

**Author（作者）**:
A logged-in `accountPW` user, identified by `ownerDiscordId`. Optional public profile (`authorProfile`) adds pen name, slug, bio, and avatar.
_Avoid_: User (too generic), accountPW (persistence detail)

**Chapter（章節）**:
A publishable unit inside a Work. Stored as lightweight metadata (`chapters[]`) pointing at event id ranges; event bodies stay in `events`.
_Avoid_: Scene (an event type that often starts a chapter), Page

**Event**:
One content unit inside a Work (`say`, `narration`, `scene`, `dice`, `ooc`, `reference`, …).
_Avoid_: Message (import-source wording only)

**ImportSource**:
The pipeline that produced a Work: `discord_export`, `manual_md`, `whatsapp`, `telegram`, `line` (legacy `manual` accepted as Markdown).
_Avoid_: Upload (UI action), Parser (implementation)

**PublishStatus**:
Work lifecycle: `draft`, `scheduled`, `published`, `archived`. Distinct from **Visibility** and from moderation state.
_Avoid_: Visibility, public/private (those are Visibility)

**Visibility**:
Who may read a published Work: `private`, `unlisted` (token link), `public` (discoverable).
_Avoid_: Status

**Asset**:
An author-uploaded image stored under `assets/session-logs/{ownerId}/`, normalized (EXIF stripped, webp variants). May also be an external `https://` URL on the Work.
_Avoid_: Attachment (chat-export leftover), Image (too vague)

**ImportJob**:
An asynchronous import task for large payloads (`sessionLogImportJob`), polled by the console until `done` or `failed`.
_Avoid_: Import (the user action / sync path)

**Report**:
A reader complaint (`sessionLogReport`) that can lead to moderation take-down.
_Avoid_: Flag (ambiguous)

**Audit**:
An append-only record of author or admin actions on a Work (`sessionLogAudit`).
_Avoid_: Log (confused with Session Log / Work)

## Product wording

- Console and author-facing UI prefer **作品 (Work)**.
- Hub entry points may still say **團錄 (Session log)** for continuity with existing TRPG users.

## Dev / test accounts

Seed with `node scripts/seed-session-log-accounts.js` (optional `--force` to reset passwords).

| Account | Default password | Role |
|---|---|---|
| `testauthor` | `TestAuthor123!` | Author |
| `testauthor2` | `TestAuthor123!` | Author |
| `admin` | `AdminTest123!` | Admin (`isAdmin: true`) |

Override via `SESSION_LOG_TEST_USER` / `SESSION_LOG_TEST_PASSWORD` / `SESSION_LOG_ADMIN_USER` / `SESSION_LOG_ADMIN_PASSWORD`.

Admin console: `/logs/admin` — login with admin account **or** `ADMIN_SECRET` header/field.
