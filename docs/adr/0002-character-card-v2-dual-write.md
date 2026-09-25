# Character card v2 dual-write (flat + sections)

HKTRPG character sheets stay bot-compatible via flat `state` / `roll` / `notes`. v2 cards also store a `sections[]` tree for grouping and future editors. We treat **flat buckets as the runtime authority for `.ch` and roll resolution**, and **rebuild `sections` from flat on every v2 write** (import, web save, bot import) so Mongo never drifts.

## Considered Options

- **Sections-only authority** with on-read projection to flat: rejected; bot and legacy paths already read flat; higher regression risk.
- **Manual dual-edit** (www edits tree and flat separately): rejected; Phase 2 www tree editor deferred; would need merge rules.
- **Flat authority + synthesize sections on save** (chosen): matches Phase 1 section metadata; `card-facade.js` `synthesizeSectionsFromFlat` + `prepareCardForMongoSave({ forceV2 })`.

## Consequences

- `schemaVersion >= 2` after import or authenticated web save; v1 cards unchanged until upgraded.
- Bot `.char add/edit` only syncs sections when the card is already v2.
- `sections[].items` note bodies follow flat `notes` limits (4000 on v2); not a separate edit surface yet.
- Udonarium / DDB import always `forceV2: true`.
- No ADR for www tree editor until product needs structured editing beyond flat + `section` dropdown.
- Manual chat and web steps: [Character card context](../character-card/CONTEXT.md#manual-test).
