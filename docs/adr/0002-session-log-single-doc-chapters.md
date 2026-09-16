# ADR 0002: Session-log chapters as embedded metadata

## Status
Accepted

## Context
Works need chapter titles, order, and per-chapter publish state. Splitting chapters into a separate Mongo collection would require rewriting the reader, which currently loads one Work document and splits events client-side.

## Decision
Store `chapters[]` metadata on the Work (`sessionLog`) document. Each chapter references `startEventId` / `endEventId` ranges inside `events`. Content remains in `events`.

## Consequences
- Compatible with the existing reader and demo logs.
- Document size stays bounded by existing event limits.
- Cross-work chapter queries are not efficient (acceptable for v1).
