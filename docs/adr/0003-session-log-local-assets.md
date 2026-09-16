# ADR 0003: Local session-log assets with sharp normalization

## Status
Accepted

## Context
Authors need cover and inline images. Object storage (S3) adds ops cost for a solo deployment. Uploaded files cannot be trusted by Content-Type alone and may contain EXIF PII.

## Decision
Store assets under `assets/session-logs/{ownerDiscordId}/`. Accept uploads via multer memory storage, validate and strip metadata with `sharp`, emit webp variants (cover/thumb or full/thumb), dedupe by content hash, enforce per-author quota (Patreon-tiered). Private assets may use HMAC signed URLs.

## Consequences
- Simple backup (copy directory) and gitignore of uploads.
- Disk growth must be monitored; orphan purge job required.
- Future migration to object storage can keep the same public URL shape behind a reverse proxy.
