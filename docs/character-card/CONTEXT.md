# Character Card

Glossary for HKTRPG web and bot character sheets stored as Mongo `characterCard` documents.

## Language

**Character Card**:
One player-owned sheet shared across chat groups; stored as state, roll, and notes lists.
_Avoid_: Sheet file, token

**Bucket**:
One of three fixed lists — state, roll, or notes — that define field shape and how `.ch` resolves names.
_Avoid_: Section, tab

**Section**:
Optional display group label on entries within a bucket; does not change `.ch` matching.
_Avoid_: Layer, Udonarium DataElement tree

**Roll Entry**:
An item in the roll bucket whose itemA is a bot roll command; matched by exact name for `.ch`.
_Avoid_: Attack row, skill row

**Schema version**:
`1` keeps flat buckets only; `2` also stores a `sections` tree synced from flat data on import and web save.
_Avoid_: API version

**Sections block**:
A v2 grouping node (`title`, `bucket`, `items`) in Mongo; projected to flat arrays for the bot.
_Avoid_: HTML `<section>`, UI tab only

**Legacy projection**:
Flat `state` / `roll` / `notes` derived from or mirrored into `sections`; bot and `.ch` always read flat lists.
_Avoid_: Cache, backup file

## Write paths (v2 authority)

| Entry | Behavior |
|-------|----------|
| Web `updateCard` | `prepareCardForMongoSave(forceV2)` → validate → `cardFieldsForMongoSet` |
| Web / bot DDB import | patch → `forceV2` → `$set` flat + `sections` |
| Web / bot Udon import | same as DDB |
| Bot `.char add/edit` | v1 flat only; if card already v2, rebuild `sections` on save |

See [ADR 0002](../adr/0002-character-card-v2-dual-write.md).

**Regression:** `yarn test:character-card` (grouping, facade, DDB integration, Udon import/export, validate, slash helpers).

## Import / export

- **Import**: Web socket `importCharacterCard` (DDB ID or Udonarium XML) via `www-import-router.js`; bot `.char importddb` / `.char importudon`.
- **Export**: Web import modal → **Export Udonarium XML** (`exportUdonariumCharacterCard` socket); Discord/TG/Line → `.char exportudon name[CardName]~` (Discord attaches `temp/*.xml` via `fileLink`); server builds XML via `udonarium-export.js` (lossy; no avatar/tabletop).
- Discord slash: `/char importddb`, `/char importudon`, `/char exportudon`, `/ch compare` → same text commands.

## Udonarium type mapping (import / export)

| Udon `data@type` | HKTRPG bucket | Notes |
|------------------|---------------|--------|
| `numberResource` | state | `itemA` / `itemB` = current / max |
| `abilityScore`, `simpleNumber` | state | `itemA` value |
| `note`, `markdown` | notes | long text in `itemA` |
| `chat-palette` lines | roll | command in `itemA`, label in `name` |

Roll rows are not exported as nested `data` elements; they round-trip through `<chat-palette>`.
