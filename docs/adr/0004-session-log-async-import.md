# ADR 0004: Async import for large session-log payloads

## Status
Accepted

## Context
Imports may include up to 20k messages. Synchronous HTTP handling risks timeouts and blocks the web process.

## Decision
Imports estimated under 2000 events stay synchronous (HTTP 201). Larger imports create a `sessionLogImportJob`, persist payload under `temp/session-log-import/`, return HTTP 202, and process via agenda (or timer fallback). The UI polls `GET /api/session-logs/jobs/:id`.

## Consequences
- Simple mode stays snappy for typical Discord sessions.
- Requires temp disk cleanup and job status UX.
- Agenda availability is optional; timers provide a degraded path.
