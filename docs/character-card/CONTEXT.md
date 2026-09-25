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
A category name the user types on an entry. It only groups the display; it does not change `.ch` matching. There is no fixed category list.
_Avoid_: Layer, Udonarium DataElement tree, built-in D&D section menu

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

## Manual test

Run the automated suite first, then the chat and web steps in a real group. D&D Beyond allows one fetch per user about every 60 seconds (`DEBUG=1` shortens that to 5 seconds). The public demo sheet is `95607806` (https://www.dndbeyond.com/characters/95607806). Use your own public character the same way.

```bash
yarn test:character-card
```

Do the chat steps in a group where the bot can reply. Slash commands are Discord-only and call the same text.

### 1. Create a card and import D&D Beyond

```text
.char add name[Manual DDB]~state[HP:1/1;]~roll[Ping:1d20;]~notes[Note:before import;]~
.char importddb 95607806 Manual DDB
```

Expect a success line with state, roll, attack, and note counts, plus the unofficial-endpoint disclaimer. `Ping` and `Note` should still be there (merge).

Replace the whole card:

```text
.char importddb replace 95607806 Manual DDB
```

`Ping` and `Note` should be gone. HP should be two numbers (current and max), not one `38/38` string. Wait for the cooldown before this second fetch.

Bad id, still in the same group:

```text
.char importddb 0 Manual DDB
.char importddb https://www.dndbeyond.com/characters/1 Manual DDB
```

Expect invalid id, or not public / not found. A failed fetch still starts the cooldown, so the next real id can return the rate-limit line.

Discord slash (same two modes):

```text
/char importddb ddb_id:95607806 card_name:Manual DDB replace:False
/char importddb ddb_id:https://www.dndbeyond.com/characters/95607806 card_name:Manual DDB replace:True
```

### 2. Use the card, then compare attacks

```text
.char use Manual DDB
.ch show
.ch showall
.char show
```

`use` is required before compare. Pick two attack names that `.ch showall` actually printed. Names with spaces stay intact:

```text
.ch compare Fire Bolt Longsword
.ch compare Fire Bolt Longsword 16
.char compare Fire Bolt Longsword 16
```

Expect hit rate, crit rate, average damage, average on hit, and an AnyDice block. `16` is target AC. With no AC, the command uses `15` or an `ac:` stored on the roll.

These should not run a simulation:

```text
.ch compare
.ch compare Fire Bolt NotASword
```

The first is the usage line. The second is not found.

Discord slash:

```text
/ch compare roll_a:Fire Bolt roll_b:Longsword ac:16
```

Oversized dice must be rejected. Set one roll, then compare it:

```text
.ch set Fire Bolt hit:1d20+5; dmg:1000000000d6
.ch compare Fire Bolt Longsword
```

Expect the invalid roll-spec line, and the bot should answer immediately.

Put a normal spec back before later steps:

```text
.ch set Fire Bolt hit:1d20+5; dmg:1d10
```

### 3. Change a v2 card from the bot

```text
.ch HP
.ch set HP 12
.ch HP -1
.ch show
```

`.ch HP` prints the current value and, when a max exists, `/` plus the max. `.ch set HP 12` writes the current value. `.ch HP -1` subtracts from that current value (the minus stays on the number, with a space before it). After both edits, `.ch show` and a later web reload must show the same current value. That is the flat field and the v2 section staying in sync.

### 4. Import Udonarium XML

One message, in the group:

```text
.char importudon name[Manual Udon]~xml[<character name="Sample Investigator"><data name="HP" type="numberResource" currentValue="8">10</data><data name="DEX" type="simpleNumber">65</data><data name="Background" type="note">Former librarian.</data><chat-palette>1d100&lt;=65 DEX</chat-palette></character>]~
```

Expect HP current `8` and max `10`, DEX `65`, note `Background`, and roll `DEX`.

Merge onto the DDB card (old rows remain):

```text
.char importudon name[Manual DDB]~xml[<character name="Manual DDB"><data name="Luck" type="simpleNumber">7</data></character>]~
.ch showall
```

`Luck` appears and the DDB attacks are still there. Switch the active card first if compare or `.ch` still points at `Manual DDB`:

```text
.char use Manual DDB
```

Replace that card from XML:

```text
.char importudon replace name[Manual DDB]~xml[<character name="Manual DDB"><data name="HP" type="numberResource" currentValue="3">9</data><chat-palette>1d20+1 Club</chat-palette></character>]~
.char use Manual DDB
.ch showall
```

Only HP and `Club` should remain.

Discord slash (the `xml` option is the same `<character>…</character>` text; Discord caps it near 4000 characters):

```text
/char importudon name:Manual Udon xml:<character name="Sample Investigator"><data name="DEX" type="simpleNumber">65</data></character> replace:True
```

### 5. Export Udonarium XML

```text
.char exportudon name[Manual Udon]~
.char exportudon Manual Udon
```

Both forms are valid. Discord should attach an `.xml` file. Telegram and Line should return the file the same way. The file has no avatar and no tabletop objects. Chat-palette lines are the roll rows.

```text
/char exportudon name:Manual Udon
```

Re-import the file you just downloaded with the step 4 replace command and confirm HP / rolls round-trip.

### 6. Web card (private)

1. Create a web login if you do not have one: `.admin account <account> <password>`
2. Open `https://card.hktrpg.com/` or, on a local server, `http://localhost:<port>/card`
3. Log in, open the card list, and select `Manual DDB` or `Manual Udon`.
4. Open the import menu and choose **D&D Beyond**. Paste `95607806` or `https://www.dndbeyond.com/characters/95607806`. Leave **取代整張角色卡內容** checked. Click **開始匯入**.
5. Confirm the sheet reloads with split HP, attacks, and an avatar when D&D Beyond has one. Import again with the replace box checked on a character that has no avatar: the old picture must clear.
6. Start an import, switch to another card before the result arrives. The card on screen must not change. A notice says the data was written to the card you started from.
7. Choose **Udonarium（XML）**, upload the file from step 5, leave replace checked, and click **開始匯入**.
8. In that same Udonarium panel, click **匯出 Udonarium XML** and confirm a download.
9. Turn on edit mode. Each row has a **分類名稱** field, not a fixed category list. Type a new name and leave the field: that row moves into the category you typed. Suggestions only list names already used on this card. Clearing the field puts the row in the ungrouped set.
10. Change a value, do not save, and close the tab. The browser should ask before leaving.

### 7. Public page

1. In the group: `.char public Manual Udon`
2. Open `https://publiccard.hktrpg.com/` or `http://localhost:<port>/publiccard`
3. The card list modal must appear after the page finishes loading. Select `Manual Udon`. Fields are visible; saving is not.

```text
.char unpublic Manual Udon
.char nonuse
```
