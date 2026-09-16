# ADR 0005: Best-effort chat export parsers

## Status
Accepted

## Context
WhatsApp, Telegram, and LINE export formats vary by locale, app version, and device. Perfect fidelity is unrealistic.

## Decision
Ship best-effort parsers that return `{ events, warnings, sourceMeta }`. Unrecognized lines increment warnings instead of failing the whole import. Detailed mode shows warnings before publish. Markdown uses `marked.lexer` tokens.

## Consequences
- Authors can still import imperfect exports.
- Support burden shifts to documenting formats and improving fixtures over time.
- UI must set expectations that media binaries are usually absent from chat exports.
