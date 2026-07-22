# HKTRPG i18n Translation Scope

Last updated: 2026-07-13

This document records **what is translated today**, **what is partial**, and **what is not started**.  
Update this file whenever you migrate a module or add lang keys.

---

## System overview

| Item | Value |
|------|-------|
| Default locale | `zh-tw` (Traditional Chinese) |
| Opt-in locales | `zh-tw`, `en`, `zh-hans` |
| Storage | MongoDB `botLocale` (`scope`: `group` / `user`) |
| Engine | `i18next` + `modules/i18n.js` + `modules/i18n-overlays.js` |
| Roll helper | `modules/roll-i18n.js` (`getT`, `resolveHelp`, `withPartialTranslationNotice`) |
| Lang files | `lang/zh-tw.json`, `lang/en.json`, `lang/zh-hans.json`, `lang/overlays/{locale}/*.json` |
| Key parity CI | `yarn test:lang` (main JSON + overlay parity across all locales) |

**Rules (unchanged):**

- Command prefixes (`.cc`, `bothelp`, etc.) and slash **names** are never translated.
- User-generated content (character cards, custom replies) does not go through i18n.
- Welcome message body (`zh-tw`) is bilingual Chinese/English; bilingual `welcome.i18n_guide` is appended. `en` locale stays English-only.
- Discord client locale does **not** auto-switch bot replies.

---

## Overlay bundles (`lang/overlays/{locale}/`)

Large indexed `funny.*` tables live outside the main locale JSON files.  
Loaded at i18n init and merged into the `translation` namespace (keys unchanged, e.g. `funny.joke_0`).

| File | Keys | Notes |
|------|------|-------|
| `funny.daily_answer.json` | 726 | Answer book |
| `funny.joke.json` | 1331 | Daily jokes (complete en / 1331 zh source lines) |
| `funny.tarot_label.json` | 157 | Tarot card labels |
| `funny.flag_script.json` | 131 | Death-flag lines |
| `funny.duck_reply.json` | 25 | Duck-beast replies |
| `funny.fuckup_discuss.json` | 42 | Daily nonsense filler |
| `funny.fuckup_former.json` | 31 | |
| `funny.fuckup_after.json` | 44 | |
| `funny.fuckup_quote.json` | 110 | Celebrity quotes |
| `coc.mania.json` | 100 | Mania table |
| `coc.phobia.json` | 100 | Phobia table |
| `coc.cult_appearance.json` | 100 | Cult appearance |
| `coc.cult_personality.json` | 100 | Cult personality |
| `coc.pcbg_personal.json` | 36 | PC personal description |
| `coc.pcbg_belief.json` | 10 | PC background belief |
| `coc.pcbg_sig_who.json` | 10 | Significant person (who) |
| `coc.pcbg_sig_why.json` | 10 | Significant person (why) |
| `coc.pcbg_location.json` | 10 | Meaningful location |
| `coc.pcbg_trait.json` | 10 | Trait |
| `coc.cult_leader.json` | 10 | Cult leader role |
| `coc.cult_goal.json` | 10 | Cult goals |
| `coc.madness_rt.json` | 10 | Temporary madness (real-time) |
| `coc.madness_su.json` | 10 | Temporary madness (summary) |
| `coc.mythos_book.json` | 106 | Mythos tomes |
| `coc.mythos_spell.json` | 52 | Mythos spells |
| `coc.mythos_monster.json` | 44 | Mythos creatures |
| `coc.mythos_god.json` | 31 | Mythos deities |

**Add new overlay keys:** `node temp/merge-funny-overlay.js <bundle> <start> <count> [en-module.js]`  
**COC bulk tables:** `coc.<table>.json` under overlays (d100/d10 tables migrated).

---

## JSON namespaces (`lang/*.json`)

| Namespace | Purpose | Status |
|-----------|---------|--------|
| `common` | Shared errors, partial-translation banner, zh-only notice, permission errors | Done |
| `platform` | Line/Telegram/WhatsApp dark-roll notices, schedule cleanup | Done (runtime) |
| `rollbase` | Basic dice help, multi-roll header, errors, `/rr` error footer | Done |
| `help` | Main menu, Base help, submenus, about/privacy/link/report, game name | Done (runtime) |
| `lang` | `.lang` / `/lang` command | Done |
| `welcome` | Join / first-time messages + `i18n_guide` | Done (zh-tw body bilingual; en English-only; guide bilingual) |
| `token` | Full help, `.token*` command replies, upload errors, `/token*` slash direct replies | Done |
| `forward` | `/forward` validation + `.forward` help and all runtime replies | Done |
| `buttons` | Button labels / empty row padding | Done |
| `slash` | Slash description localizations (deploy via `ds-deploy-commands`) | Partial (all major commands have `slash.*` keys; JS `setDescription` stays zh default) |
| `discord` | `discord_bot.js` UI strings (export, edit, character buttons, story poll, webhook/me, request-rolling buttons, stats, shards, dark roll) | Done (runtime) |
| `init` | Initiative tracker (`.in` / `.init`) | Done |
| `advroll` | Advanced roll `.ca` help, D66/D66s/D66n, `.int`, 5B10/5U10 output, error footer, slash `/ca` `/int` validation | Partial (slash descriptions zh-tw) |
| `request_rolling` | `.re` full help + game_name | Done (runtime) |
| `ddr` | Dark-roll GM `.drgm` + dr/ddr/dddr | Done (runtime; full help en) |
| `coc` | CoC help + `.dp` + `cc`/`ccn` + `ccb` + SAN check + chase + build + cult/mythos/pcbg | Partial (mythos books complete) |
| `character` | `.char` / `.ch` commands, validation, list UI, full help, reroll output prefixes | Done (runtime) |
| `export` | `.discord html/txt` errors, cooldowns, success DM, full help, export log labels | Done (runtime) |
| `myname` | `.myname` / `.me` commands, show list, history, full help | Done (runtime) |
| `bcdice` | `.bc` full help, use/delete, config messages, eval errors | Partial (dice output from BcDice lib) |
| `dnd5e` | `.5ebuild` help + stat roller output | Partial |
| `pf2e` | `.pf2` full help + search wrapper messages | Partial (entry descriptions stay zh-tw) |
| `fate` | `.4df` help + roll output + errors | Done |
| `wikitools` | `.wiki` / `.image` / `.tran` help + error messages | Done |
| `wod` | `.nwd` help + roll output | Done (runtime) |
| `level` | `.level` commands, rankings, config, default titles/messages, full help | Done (runtime) |
| `wn` | `.wn` help + roll output + sin cost messages, full help | Done (runtime) |
| `trpgdb` | `.db` / `.dbp` errors, list format, add/del/show, full help, `{my.name}` fallback | Done (runtime) |
| `random_ans` | `.ra`/`.rap`/`.ras` errors, lists, roll output, full help | Done (runtime) |
| `funny` | Full help, `.wl` wheel errors, daily fetch errors, tarot/luck/choice/sort UI, tarot cards, flag/duck, horoscope/almanac templates, fuckup (full), daily answer keys, FunnyRandom i18n wired | Partial (joke complete; acg/slogan/blackjoke/mlove txt zh) |
| `chatroom` | `.chatroom` synced chat (Discord) | Done |
| `edit` | `.edit` message edit help | Done (runtime uses checkTools permission msgs) |
| `code` | `.code` playground help + runtime messages | Done (runtime) |
| `kc` | `.kc` Cat Ghost Messenger help + roll output | Done |
| `demo` | Demo module help | Done |
| `stop` | `.bk` roll block filter | Done |
| `role` | `.roleReact` Discord role reactions | Partial (roleInvites still zh-tw) |
| `cmd` | `.cmd` saved roll commands + slash validation errors | Done |
| `schedule` | `.at` / `.cron` scheduled messages | Done |
| `openai` | Help via lang keys, permission errors, slash validation, file validation, VIP/rate-limit errors, progress DM | Partial (AI system prompts zh; slash descriptions zh) |
| `admin` | `.admin` / `.root` / `.patreon` help + all runtime replies + `.admin state` report + Patreon CSV import detail lines | Done (runtime + `slash.admin` / `slash.root` / `slash.patreon` deploy localizations) |
| `event` | `.event` / `.evt` help + all command replies incl. EXP effects | Done (runtime) |
| `storyteller` | `.st` help + system/runtime messages + page choices + player setup prompts + validation/permission | Partial (user-authored story content stays as-is) |
| `pokemon` | `.poke` help, mon/move search, vs simulation, type matchup labels | Partial (Pokémon/move names stay zh; type labels + matchup effect text localized) |
| `digmon` | `.digi` help, search/move/list/path UI + evolution route tree labels | Partial (game data names/personalities stay zh) |
| `www` | Bus ETA speak API + web UI (`www.views.*`, `www.busstop.*`, `/api/www-i18n`) | Partial (test pages low priority) |

---

## Infrastructure (fully wired)

| File | Role |
|------|------|
| `modules/i18n.js` | init, locale resolve/set, slash enrichment, overlay load |
| `modules/i18n-overlays.js` | overlay discovery, merge into locale bundles |
| `modules/roll-i18n.js` | Roll-module helpers |
| `modules/analytics.js` | `RollContext.locale` / `t` → `params`; `.admin state` report; character reroll prefixes | Done (runtime) |
| `modules/schema.js` | `botLocale` model |
| `modules/message.js` | Welcome messages + `i18n_guide` |
| `modules/ds-deploy-commands.js` | Slash `description_localizations` on deploy |
| `modules/patreon-import.js` | Patreon CSV import report/errors/keyMessages/email subject (locale via `runImport`) | Done (runtime) |
| `roll/lang.js` | `.lang` / `/lang` |
| `test/i18n.test.js` | normalizeLocale, snapshots, enrichment |
| `test/lang-keys.test.js` | zh-tw / en key parity |

---

## Modules — translated or wired

### Full / core path (en replies when `.lang en`)

| Module | Coverage |
|--------|----------|
| `roll/lang.js` | All command strings + help |
| `roll/rollbase.js` | Full help, multi-roll header, max-roll error, dice limit errors; `/rr` direct slash errors; `rollDiceCommand` locale |
| `roll/help.js` | Main menu (en); `bothelp Base` (en); submodule help shows partial banner |
| `roll/init.js` | Help, all replies, initiative table formatting |
| `roll/token.js` | Full help, all command/upload error messages, `/token`, `/token2`, `/token3`, `/tokenupload` direct replies |
| `roll/forward.js` | Full help, show/delete/set, all validation and success messages |
| `roll/0-advroll.js` | Full help, `.ca` errors, D66/D66s/D66n, `.int`, 5B10/5U10 output, slash `/ca` `/int` validation |
| `roll/request-rolling.js` | Full help (en) |
| `roll/edit.js` | Full help (en) |
| `roll/code.js` | Full help + cooldown/errors/lang list (en) |
| `roll/yumingkueichai.js` | Full help + `.kc` roll output |
| `roll/demo.js` | Demo help |
| `roll/z_DDR_darkRollingToGM.js` | Full `.drgm` GM management messages + full help (en) |
| `roll/2-coc.js` | Help, `.dp`, `cc`/`ccn`, `ccb`, SAN check, chase, `.cc6build`/`.ccpulpbuild`, `.cccc`/`.ccpc`/`.ccdr`/`.cc7bg`, `.cc7build`, `ccrt`/`ccsu`, PcBG, pushed casting, mythos tables, cult generator |
| `roll/digmon.js` | Help, search/move/list/path output + evolution route tree labels |
| `roll/wn.js` | Full help, roll output, sin cost messages |
| `roll/z_trpgDatabase.js` | Full help, `.db`/`.dbp` errors, list format, add/del/show |
| `roll/z_random_ans.js` | Full help, `.ra`/`.rap`/`.ras` commands, roll output |
| `roll/z_myname.js` | Full help, add/delete/me/show/history |
| `roll/z_saveCommand.js` | `.cmd` help and all command replies |
| `roll/z_schedule.js` | `.at` / `.cron` help and all command replies |
| `roll/openai.js` | Help, VIP/admin/discord-only errors, slash validation, file validation, rate-limit/VIP/model errors, progress DM |
| `roll/z_event.js` | Help + all command replies + eventProcessExp EXP effects |
| `roll/z-story-teller.js` | Help + all command replies + renderPageText choices + renderPlayerSetupPrompt + goto invalid target + validation/permission |
| `roll/pokemon.js` | Help, mon/move search output, vs simulation, type matchup UI; type labels + effectiveness scripts localized |
| `roll/z_character.js` | Full help, handlers, validation, show list, add/show success messages |
| `roll/export.js` | Help, permissions, cooldowns, errors, success DM |
| `roll/1-funny.js` | Full help (en), `.wl` errors, daily fetch errors, tarot/luck/choice/sort UI, tarot labels, flag/duck scripts, horoscope/almanac templates, DailyFuckUp full generator, daily answer keys, FunnyRandom i18n (joke partial) |
| `roll/z_bcdice.js` | Full help, use/delete/dicehelp/config messages, eval errors, unknown subcommand |
| `roll/5e.js` | Full help + 4d6dl1 stat generator |
| `roll/pf2e.js` | Full help (en) + search not-found/too-many/error |
| `roll/z_async_test.js` | Wiki/image/translate help + wiki/image/tran errors |
| `roll/fate.js` | Full help (en) + roll output |
| `roll/wod.js` | Full help + WoD roll output |
| `roll/z_multi-server.js` | `.chatroom` help, create/join/exit success messages |
| `roll/z_Level_system.js` | Commands, rankings, config, default titles/templates, full help |
| `roll/z_stop.js` | `.bk` help and all command replies |
| `roll/z_role.js` | `.roleReact` help and command replies |
| `roll/z_admin.js` | `.admin` / `.root` / `.patreon` help + all runtime replies |
| `modules/discord_bot.js` | Locale injection; no-response; command error; welcome; buttons (partial); export DM (partial); edit message (partial); character / request-rolling buttons (partial) |

### Welcome & onboarding

| Trigger | Content |
|---------|---------|
| `guildCreate` | zh-tw join embed + `i18n_guide` |
| First interaction (slash) | DM first-time message + `i18n_guide` |
| First bridge command | DM via `newUserChecker` (deduped) |

---

## Modules — not migrated / partial (roll/*.js audit)

**Fully unmigrated (no `roll-i18n`):** none — all `roll/*.js` now import i18n helpers.

**Partial — runtime wired, remaining zh in JS:**

| File | Remaining |
|------|-----------|
| `help.js` | Legacy zh fallback in `resolveHelp` for submodule menus |
| `export.js` | `gameName` wired via `export.game_name` |
| `request-rolling.js` | `gameName` wired; slash uses `slash.re` on deploy |
| `demo.js` | `gameName` wired |
| `z_role.js` | `gameName` wired; slash uses `slash.rolereact` on deploy |
| **All other `roll/*.js`** | `game_name` wired via `resolveGameName()` |
| `openai.js` | `SYSTEM_PROMPT` / translate prompts (intentional zh for AI) |
| `1-funny.js` | acg/slogan/blackjoke/mlove txt assets; daily API content |
| `2-coc.js` | Some inline data tables / edge strings |
| `pokemon.js` / `digmon.js` | Game data names (Pokémon/move/digimon names stay zh) |
| `z-story-teller.js` | User-authored story content (intentional) |
| `wheel-animator.js` | No user strings (graphics only) |

**Not in roll/:**

| Priority | Area |
|----------|------|
| Done | `views/common/*.js` — Batch 75 (`www-i18n.js`, `wwwT()`, `/api/www-i18n`) |
| Done | Character card HTML — Batch 76 + 81 (`hybridCharacterCardUI.html`, `characterCardModals.html` incl. readme/detailed-help bodies) |
| `discordLog.html` | Done (Batch 84) |
| `discordlog-new.html` | Done (Batch 85) |
| `theater.html` | Done (Batch 86) |
| `roll.html` | Done (Batch 86) |
| `includes/error.html` | Done (Batch 86) |
| `namecard/namecard_character.html` | Done (Batch 87) |
| `namecard/namecard_player.html` | Done (Batch 88) |
| `udoSad.html` | Done (Batch 89) |
| `randomDeleteOLD.html` | Done (Batch 90) |
| `cardtest-direct.html` | Done (Batch 92) |
| `cardtest-standalone.html`, `characterCard-test.html` | Done (Batch 92) |
| `hybrid-*-test.html`, `modern-test.html` | Done (Batch 92 — dev shells load hybrid UI) |
| `test-optimization.html`, `autocomplete-test.html`, `0535.html` | Done (Batch 92) |
| `common/modernCharacterCardUI.html` | Done (Batch 92 — Vue `t()` + shared card keys) |

### Other platforms & web

| Area | Status |
|------|--------|
| `modules/core-Line.js` | Done (runtime dark-roll + schedule + EXPUP locale) |
| `modules/core-Telegram.js` | Done (runtime dark-roll + schedule + EXPUP locale) |
| `modules/core-Whatsapp.js` | Done (runtime dark-roll + schedule) |
| `modules/core-plurk.js` | Done (EXPUP locale) |
| `modules/core-www.js` | Partial (`/busstop/*`, card validation, autocomplete API, socket i18n, `/api/www-i18n`; socket「公共房間」DB ID unchanged) |
| `views/common/*.js` | Done (Batch 75) |
| Character card HTML (`hybridCharacterCardUI.html`, modals, alerts) | Done (Batch 76 + 81 — readme & detailed-help bodies) |
| `characterCardUI.html` (legacy fallback) | Done (Batch 87) |
| `includes/header.html`, `includes/footer.html` | Done (Batch 77) |
| `busstop.html` | Done (Batch 78) |
| `index.html` (roll chat) | Done (Batch 79 + 83 — dice-set API locale) |
| `patreon.html` | Done (Batch 80) |
| `signalToNoise.html` | Done (Batch 82) |
| `discordLog.html` | Done (Batch 84) |
| `discordlog-new.html` | Done (Batch 85) |
| `theater.html` | Done (Batch 86) |
| `roll.html` | Done (Batch 86) |
| `includes/error.html` | Done (Batch 86) |
| `namecard/namecard_character.html` | Done (Batch 87) |
| `namecard/namecard_player.html` | Done (Batch 88) |
| `udoSad.html` | Done (Batch 89) |
| `randomDeleteOLD.html` | Done (Batch 90) |
| Remaining `views/*.html` test/orphan pages | Done (Batch 92) |
| `common/modernCharacterCardUI.html` | Done (Batch 92) |
| `common/cardtest-page.js` | Done (Batch 92 — shared cardtest i18n bootstrap) |

---

## Slash localization (Phase 3)

Deployed via `enrichSlashCommandLocalizations` when slash commands are registered.

| Command | en-US description in JSON |
|---------|---------------------------|
| All registered slash commands | Yes — `slash.*` keys in `lang/en.json` (deploy via `ds-deploy-commands`) |
| `admin`, `root`, `patreon` | Yes (Batch 71 — subcommands, options, choice labels) |
| JS `setDescription()` in roll modules | Still zh-tw (Discord default); EN via `description_localizations` on deploy |

Includes: `bothelp`, `lang`, `rr`, `token`, `forward`, `in`, `init`, `initn`, `kc`, `edit`, `re`, `code`, `ca`, `int`, `wd`, `4df`, `5ebuild`, `pf2`, `wiki`, `imagesearch`, `bcdice`, `token2`, `token3`, `tokenupload`, CoC (`ccrt`…`ccpc`), funny (`排序`…`每日`), `drgm`, `dr`, `ddr`, `dddr`, `db`, `dbp`, `ra`, `rap`, `ras`, `myname`, `me`, `mee`, `mehistory`, `cmd`, `level`, `wn`, `wndd`, `wnmod`, `at`, `cron`, `char`, `ch`, `export`, `rolereact`, `ai`, `tran`, `image`, `st`, `event`, `poke`, `digi`, `admin`, `root`, `patreon`.

Re-deploy global slash commands after changing `slash.*` keys.

---

## How to migrate a new module

1. Add matching keys to **`lang/zh-tw.json`** and **`lang/en.json`** (keep structure identical).
2. In the roll module:
   ```javascript
   const { getT, resolveHelp, withPartialTranslationNotice } = require('../modules/roll-i18n.js');
   // rollDiceCommand({ locale, t, ... }) → const translate = getT({ locale, t });
   ```
3. Bridge slash: return `'.command ...'` (locale resolved in `handlingCommand`).
4. Direct slash: use `interaction._hktrpgT('key')`.
5. Run `yarn test:lang`.
6. **Update this file.**

---

## Partial translation UX

When locale is `en` but content is still zh-tw:

- `bothelp` main menu / Base: English where keys exist.
- `bothelp Dice/Tool/admin/...` detail: zh-tw help + `common.errors.partial_translation_banner`.
- Unmigrated commands: remain zh-tw (no auto banner unless wrapped with `withPartialTranslationNotice`).

Optional: `common.zh_only_notice` prefix on funny daily commands when locale is `en`.

---

## Verification

```bash
yarn test:lang          # key parity + i18n unit tests
yarn jest test/help.test.js test/advroll.test.js   # spot checks
```

Manual: `.lang en` → `bothelp`, `bothelp Base`, `.in 1d20 test`, `/rr` error, `/token` fail message.

---

## Recent batches (2026-07-13)

### Batch 93 (universal locale switcher)
- **`views/common/www-i18n.js`**: `ensureWwwLocaleSwitcher()` — navbar `mdi:translate` icon when `#header` loads shared chrome; floating FAB (bottom-right) on all other pages with `www-i18n.js` (namecard, cardtest dev, `0535`, autocomplete-test, etc.)
- **`views/common/site-chrome.js`**, **`views/udoSad.html`**: Remove floating FAB when shared header mounts

### Batch 92 (remaining HTML views i18n)
- **`views/cardtest-direct.html`**: Refactored to load `hybridCharacterCardUI.html` (was ~670 lines inline zh); public `/cardtest` route now uses shared hybrid template + i18n chrome
- **`views/cardtest-standalone.html`**, **`characterCard-test.html`**: `cardtest_*` chrome keys, `www-i18n.js`, `cardtest-page.js`, shared alerts
- **`views/hybrid-test.html`**, **`hybrid-fixed-test.html`**, **`hybrid-corrected-test.html`**, **`hybrid-final-test.html`**, **`modern-test.html`**: Replaced inline dev Vue demos with thin shells loading hybrid UI + i18n
- **`views/test-optimization.html`**: `opttest_*` keys via `data-www-i18n*`
- **`views/autocomplete-test.html`**: `actest_*` keys; JS result labels via `wwwT()`
- **`views/0535.html`**: `page0535_*` accordion labels
- **`views/common/modernCharacterCardUI.html`**: Orphan legacy template wired to Vue `t()` + existing card keys (`btn_add_item`, `default_*_label`, `note_empty_content`)
- **`views/common/cardtest-page.js`**: Shared `initCardtestChrome`, `cardtestLoadHybridUi`, localized `showError`/`updateCard`
- **Lang keys**: +89 per locale (`cardtest_*`, `actest_*`, `opttest_*`, `page0535_*`, `btn_add_item`, `default_*`, `note_empty_content`)

### Batch 91 (site language switcher + index title race fix)
- **`views/includes/header.html`**: Locale toggle (iconify `mdi:translate`; `title`/`aria-label` from `nav_language`)
- **`views/common/site-chrome.js`**: `initWwwLocaleSwitcher()` after chrome load
- **`views/index.html`**: Load site chrome inside `applyRollPageI18n()` after `wwwI18n.ready` (fixes raw key in navbar title)
- **Lang keys**: +3 per locale (`nav_language`, `nav_lang_zh_tw`, `nav_lang_en`)

### Batch 90 (randomDeleteOLD.html legacy text converter)
- **`views/randomDeleteOLD.html`**: Legacy garbled-text tool — shared site chrome, reuses `stn_*` UI keys + `stn_old_*` page/modal keys
- **Lang keys**: +4 per locale (`www.views.stn_old_*`, `stn_btn_add_block`)

### Batch 89 (Udonarium landing page)
- **`views/udoSad.html`**: Udonarium version picker + changelog via `data-www-i18n*` / `udo_*`; header/footer re-i18n after jQuery load
- **Lang keys**: +14 per locale (`www.views.udo_*`)

### Batch 88 (namecard player preference card)
- **`views/namecard/namecard_player.html`**: Player preference card editor — UI chrome, edit form, color settings modal, export progress via `np()` (`nplayer_*`); demo slot/style data intentionally Chinese
- **Lang keys**: +89 per locale (`www.views.nplayer_*`)

### Batch 87 (character card legacy UI + namecard character)
- **`views/common/characterCardUI.html`**: Legacy fallback template wired to Vue `t()` + existing card keys
- **`views/namecard/namecard_character.html`**: PNG character card editor — UI chrome, edit form, export/backup modals via `nc()` (`ncard_*`)
- **Lang keys**: +81 per locale (`www.views.ncard_*`)

### Batch 86 (error / roll / theater i18n)
- **`views/includes/error.html`**: 404 page via `data-www-i18n*` + site chrome (`errpg_*`)
- **`views/roll.html`**: Simple dice roller nav, meta, buttons via `rollm_*` + shared `nav_*` / `footer_copyright_html`
- **`views/theater.html`**: Session theater UI, filters, site chrome; JS placeholders via `tt()` (`theater_*`)
- **Lang keys**: +54 per locale (`www.views.errpg_*`, `rollm_*`, `theater_*`)

### Batch 85 (discordlog-new.html i18n)
- **`views/discordlog-new.html`**: Vue SPA — site chrome, `dt()`/`t()` helpers, time-range chips, summary/relationship/heatmap/quote tabs, filters, decrypt modal; chart labels reuse `dlog_chart_*`; datetime/duration via shared `dlog_*` + `dlogn_*`
- **Lang keys**: +80 per locale (`www.views.dlogn_*`)

### Batch 84 (discordLog.html i18n)
- **`views/discordLog.html`**: Shared site chrome, stats UI, filters, table headers, help modal, chart labels, date/duration formatting via `dt()` + `data-www-i18n*`
- **Lang keys**: +42 per locale (`www.views.dlog_*`)

### Batch 83 (index.html dice-set API locale)
- **`modules/core-www.js`**: `/api/dice-commands?lang=` passes locale to `gameName` / `getHelpMessage`; enriches slash JSON + localized descriptions/choices; fixes autocomplete meta from builder options
- **`views/index.html`**: Fetch dice commands with `wwwI18n.locale`; CoC label trim by prefix; `roll_scroll_to_bottom`, `roll_msg_image_alt`, `roll_autocomplete_no_results`, `roll_operation_failed`
- **Lang keys**: +4 per locale (`www.views.roll_*`)

### Batch 82 (signalToNoise.html i18n)
- **`views/signalToNoise.html`**: UI labels, modal, og meta, copy toast via `st()` + `data-www-i18n*`
- **`applyStnPageI18n()`**: page title, og tags, site chrome title
- **Lang keys**: +14 per locale (`www.views.stn_*`)

### Batch 81 (character card readme modals)
- **`views/common/characterCardModals.html`**: Readme + detailed-help bodies via `readme_body_html` / `detailed_help_body_html`; login placeholders
- **Lang keys**: +4 per locale (`readme_body_html`, `detailed_help_body_html`, `username_placeholder`, `password_placeholder`)

### Batch 80 (patreon.html i18n)
- **`views/patreon.html`**: Full page UI, modals, slot form, history labels, save/login errors via `pt()` + `data-www-i18n*`
- **`applyPatreonPageI18n()`**: Page title, static chrome, `loadSiteChromeWithI18n({ title })`
- **Lang keys**: +84 per locale (`www.views.patreon_*`)

### Batch 79 (index.html roll chat i18n)
- **`views/index.html`**: Sidebar, input chrome, modals, readme guide (`roll_readme_html`), validation alerts via `rt()`
- **`views/common/www-i18n.js`**: `data-www-i18n-content` for meta description
- **Room IDs** `公共房間` / `個人小屋` unchanged (socket); display via `roomDisplayName()`
- **Lang keys**: +48 per locale (`www.views.roll_*`)

### Batch 78 (busstop.html i18n)
- **`views/busstop.html`**: Full builder UI, speak mode, ETA messages, iOS shortcut guide via `bt()` / `bs()` + `data-www-i18n*`
- **`modules/core-www.js`**: `buildWwwI18nBundle()` also flattens `www.busstop.*` for client `bs()` helper
- **Lang keys**: +88 per locale (`www.views.bus_*` ×88)

### Batch 77 (shared site chrome i18n)
- **`views/includes/header.html`**, **`footer.html`**: Nav labels + footer via `data-www-i18n*` (`www.views.nav_*`, `footer_copyright_html`)
- **`views/common/site-chrome.js`**: `loadSiteChromeWithI18n({ title })` — load header/footer + `wwwApplyDomI18n`
- **Wired**: `characterCardCommon.js`, `busstop.html`, `index.html`, `patreon.html`, `signalToNoise.html`, character card pages
- **Lang keys**: +22 per locale (`www.views.nav_*`, `footer_copyright_html`)

### Batch 76 (character card HTML UI chrome)
- **`views/common/www-i18n.js`**: `applyDomI18n()` + `wwwApplyDomI18n()` for `data-www-i18n*` attributes; auto-apply on bundle load
- **`views/common/hybridCharacterCardUI.html`**: All buttons, section titles, placeholders, tooltips, floating controls via Vue `t()`
- **`views/common/characterCardModals.html`**: Login/logout/card-list/public/edit-close modal chrome via `data-www-i18n*`; readme/detailed-help **body content** still zh
- **`views/common/cardManager.js`**: `t()` method on card + card-list Vue apps
- **`views/characterCard.html`**, **`characterCardPublic.html`**, **`baseCharacterCard.html`**: Update alerts (`alert_update_*_html`), modal load → `wwwApplyDomI18n`; private card `beforeunload` → `unsaved_changes_confirm`
- **Lang keys**: +88 per locale (`www.views.*`)

### Batch 75 (views/common frontend i18n)
- **`views/common/www-i18n.js`**: Browser `WwwI18n` class + global `wwwT()`; loads `/api/www-i18n`
- **`modules/core-www.js`**: `GET /api/www-i18n` → `buildWwwI18nBundle()` (flattens `www.views.*` + `character.validation_*`)
- **Wired**: `uiManager.js`, `socketManager.js`, `characterCardCommon.js`, `cardManager.js`, `autocomplete-manager.js`
- **HTML**: `baseCharacterCard.html`, `characterCard.html`, `characterCardPublic.html` load `www-i18n.js` first
- **Lang keys**: +31 per locale (`www.views.*`)

### Batch 74 (core-www API + socket i18n)
- **`modules/core-www.js`**: Patreon REST API, autocomplete API, slot validation, socket `getListInfo` / `removeChannel` errors via `www.api.*`, `www.patreon.*`, `www.socket.*`; `getSocketT()` helper
- **Lang keys**: +22 per locale (`www.api.*` ×3, `www.patreon.*` ×11, `www.socket.*` ×8)

### Batch 73 (patreon tier labels + socket chat validation)
- **`modules/patreon-tiers.js`**: `getTierLabel(level, locale)` via `patreon.tier_label_*`
- **`roll/z_admin.js`**, **`modules/patreon-import.js`**: Pass locale into `getTierLabel`
- **`modules/core-www.js`**: Patreon API `tierLabel` locale-aware; socket chat validation errors via `www.chat_validation.*`
- **Lang keys**: +16 per locale (`patreon.tier_label_*` ×7, `www.chat_validation.*` ×8)

### Batch 72 (autocomplete + wheel GIF caption)
- **`roll/z_random_ans.js`**: Wheel GIF caption → `random_ans.wheel_file_caption`
- **`roll/digmon.js`**, **`roll/pokemon.js`**, **`roll/pf2e.js`**: Web autocomplete empty text → `autocompleteNoResultsKey` lang keys
- **`modules/core-www.js`**: `resolveAutocompleteNoResultsText()` resolves `autocompleteNoResultsKey` with request locale
- **Lang keys**: +9 per locale (`random_ans.wheel_file_caption`, `digmon.autocomplete_*` ×2, `pokemon.autocomplete_*` ×4, `pf2e.autocomplete_no_results`)

### Batch 71 (slash admin/root/patreon EN localizations)
- **`lang/en.json`**, **`lang/zh-tw.json`**: Full `slash.admin`, `slash.root`, `slash.patreon` (subcommands, shared options, choice labels for tier/news/status/fixshard/importpatreon)
- **Tool**: `temp/slash-admin-batch71.js` (one-time patcher)
- **Note**: Re-deploy global slash commands for Discord clients to pick up new `description_localizations`

### Batch 70 (event/storyteller/digmon help → lang files)
- **`lang/zh-tw.json`**: Full `event.help`, `storyteller.help`, `digmon.help` migrated from JS legacy builders
- **`roll/z_event.js`**, **`roll/z-story-teller.js`**, **`roll/digmon.js`**: Remove `build*HelpLegacy()`; zh fallback → lang keys
- **Tool**: `temp/migrate-help-batch70.js` (one-time extractor)

### Batch 69 (remove inline help builders + digmon level labels)
- **`roll/pokemon.js`**: Remove `buildPokemonHelpLegacy()`; zh fallback → `pokemon.help` lang key
- **`roll/openai.js`**: Remove `buildOpenAiHelp()` (~65 lines zh); zh fallback → `openai.help` lang key
- **`roll/digmon.js`**: `getLevelLabelForTable()` uses `digmon.level_label_*` via `getT`, no zh literal fallbacks

### Batch 68 (init line hint + digmon stage + funny default name)
- **`roll/init.js`**: Remove inline zh help fallback; use `init.help` lang key; remove hardcoded `line_friend_hint` JS fallback
- **`lang/en.json`**: `init` / `ddr` / `level` `line_friend_hint` English text (+3)
- **`roll/digmon.js`**: Remove zh literal fallbacks in `getStageName()`; always use `getT` for stage labels
- **`roll/1-funny.js`**: Daily nonsense default name → `funny.default_you`
- **Lang keys**: +4 (`funny.default_you` ×2 locales; `line_friend_hint` en ×3)

### Batch 67 (patreon-import runtime i18n)
- **`modules/patreon-import.js`**: `runImport(csv, { keyMode, generateEmail, locale })`; CSV validation, per-row report lines, `keyMessages`, stats footer, email subject via `admin.patreon_import_*`
- **`roll/z_admin.js`**: Pass `locale` into `runImport` (DM key lines now follow admin locale)
- **Lang keys**: +35 (`admin.patreon_import_*` ×35 per locale)

### Batch 66 (bcdice + random_ans + slash deploy messages)
- **`roll/z_bcdice.js`**: Eval error fallback → `bcdice.no_error_message`
- **`roll/z_random_ans.js`**: `{my.name}` fallback → `random_ans.unnamed`
- **`modules/ds-deploy-commands.js`**: Deploy/remove slash command replies via `admin.deploy_*`; accepts `locale`
- **`roll/z_admin.js`**: Pass `locale` into deploy helpers
- **Lang keys**: +11 (`bcdice.no_error_message`, `random_ans.unnamed`, `admin.deploy_*` ×9 per locale)

### Batch 65 (storyteller validation + advroll slash + openai progress)
- **`roll/z-story-teller.js`**: Permission reasons, RUN_DESIGN validation, poll choice fallback, export DM filename, default title
- **`roll/0-advroll.js`**: `/ca` `/int` slash empty-input errors via `advroll.slash_*`
- **`roll/openai.js`**: Progress DM (OCR/PDF/translate/glossary), analysis report, completion, attachment labels, chunk failures
- **Lang keys**: +52 (`storyteller.*` ×13, `advroll.slash_*` ×2, `openai.progress_*` ×37 per locale)

### Batch 64 (openai file validation + platform EXPUP + event default)
- **`roll/openai.js`**: File validation/size/VIP limit errors via `openai.file_*`; `isOpenAiValidationError()` for bilingual catch; `_locale` set on AI instances in `processCommand`; remaining translate/chat model-not-found and VIP throws
- **`roll/z_event.js`**: Default EXP effect → `event.nothing_happened`
- **`roll/2-coc.js`**: `dpRecorder` catch fix (no spurious zh error return)
- **`modules/core-Line.js`**, **`core-Telegram.js`**, **`core-plurk.js`**: Pass locale into `EXPUP()` for level-up messages
- **Lang keys**: +19 (`openai.file_*` ×8, `event.nothing_happened`, existing openai VIP/model keys completed per locale)

### Batch 63 (check.js + level.js + core-www validation)
- **`modules/check.js`**: Permission errors via `common.permission.*`; accepts `locale` / `t` in `permissionErrMsg()`
- **Roll modules**: All `permissionErrMsg()` call sites pass `locale`
- **`modules/level.js`**: Default titles, unnamed, level-up word via `level.*`; `EXPUP()` accepts `locale`
- **`modules/analytics.js`** / **`discord_bot.js`**: Pass locale into `EXPUP()`
- **`modules/core-www.js`**: `validateCardPayload()` uses `character.validation_*`; `/api/dice-commands` autocomplete `noResultsText`
- **Lang keys**: +10 (`common.permission.*` ×4, `character.validation_*` ×3 per locale)

### Batch 62 (analytics + core-www busstop + trpgdb gap)
- **`modules/analytics.js`**: `.admin state` report via `admin.state_report.*` (locale-aware cache); character reroll prefixes via `character.reroll_*`
- **`modules/core-www.js`**: `/busstop/speak` + `/busstop/shortcut` via `www.busstop.*`; locale from `?lang=` or `Accept-Language`
- **`roll/z_trpgDatabase.js`**: `{my.name}` fallback → `trpgdb.unnamed`
- **Lang keys**: +42 (`admin.state_report.*` ×17, `character.reroll_*` ×2, `www.busstop.*` ×14, `trpgdb.unnamed` per locale)

### Batch 61 (platform cores i18n)
- **`modules/core-Line.js`**, **`core-Telegram.js`**, **`core-Whatsapp.js`**: Dark-roll `dr/ddr/dddr` notices + six-month schedule message via `platform.*`; locale from `i18n.resolveLocale`
- **Lang keys**: +14 (`platform.dark_roll.*` ×7, `platform.schedule.*` per locale)

### Batch 60 (discord_bot.js runtime i18n)
- **`modules/discord_bot.js`**: Stats/shard monitoring, dark-roll notices, HTML export DM, role-react errors, story polls, character buttons, token DM, processing fallback
- **Lang keys**: +68 (`discord.stats.*`, `discord.shards.*`, `discord.dark_roll.*`, etc. ×34 per locale)

### Batch 59 (export.js full i18n)
- **`roll/export.js`**: Full `export.help`, export log labels (`interaction_used`, `system_*`, `reply_quote`), HTML title, cooldown time units
- **Lang keys**: +22 (`export.*` ×11 per locale)

### Batch 58 (help.js full i18n)
- **`roll/help.js`**: All user-facing strings wired — `help.main_menu_full`, `help.base`, submenus, about/privacy/link/report/ver; `resolveGameName` for `gameName()`
- **Lang keys**: +24 (`help.*` ×12 per locale)

### Batch 57 (gameName batch)
- **All `roll/*.js`**: `game_name` keys (+33 namespaces) + `resolveGameName()` helper in `roll-i18n.js`
- **`bothelp` menus**: `.lang en` shows English module names where `game_name` exists
- **Lang keys**: +66 (`*.game_name` ×33 per locale)

### Batch 56 (JS i18n cleanup)
- **`modules/discord_bot.js`**: webhook errors, no-response fallback, request-rolling button labels, roll/click action text (`discord.me.*`, `discord.buttons.action_*`)
- **`roll/help.js`**: pass `{ locale, t }` to `gameName()` in bothelp menus
- **`roll/{request-rolling,export,demo,z_role,z_admin}.js`**: `game_name` keys wired
- **Lang keys**: +14 (`discord.me.*`, `discord.buttons.action_*`, `*.game_name` ×5)

### Batch 55 (JS i18n)
- **`roll/z_admin.js`**: Full i18n migration — `admin.*` (+109 keys/locale), `slash.admin`
- **`roll/lang.js`**: `lang.help` wired via `resolveHelp`
- **Roll modules**: all `roll/*.js` now use `roll-i18n` (no fully unmigrated roll files)

### Batch 54
- **`lang/overlays/*/funny.joke.json`**: `joke_1250`–`1330` (+81 zh +81 en) — **joke overlay complete**
- **Daily jokes progress**: 1331 / 1331 (100%)
- **Lang keys**: +162 overlay (`funny.joke_*` ×81 per locale)

### Batch 53
- **`lang/overlays/*/funny.joke.json`**: `joke_1150`–`1249` (+100 zh +100 en)
- **Daily jokes progress**: 1250 / 1331 (~94%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 52
- **`lang/overlays/*/funny.joke.json`**: `joke_1050`–`1149` (+100 zh +100 en)
- **Daily jokes progress**: 1150 / 1331 (~86%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 51
- **`lang/overlays/*/funny.joke.json`**: `joke_950`–`1049` (+100 zh +100 en)
- **Daily jokes progress**: 1050 / 1331 (~79%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 50
- **`lang/overlays/*/funny.joke.json`**: `joke_850`–`949` (+100 zh +100 en)
- **Daily jokes progress**: 950 / 1331 (~71%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 49
- **`lang/overlays/*/funny.joke.json`**: `joke_750`–`849` (+100 zh +100 en)
- **Daily jokes progress**: 850 / 1331 (~64%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 48
- **`lang/overlays/*/funny.joke.json`**: `joke_650`–`749` (+100 zh +100 en)
- **Daily jokes progress**: 750 / 1331 (~56%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 47
- **`lang/overlays/*/funny.joke.json`**: `joke_550`–`649` (+100 zh +100 en)
- **Daily jokes progress**: 650 / 1331 (~49%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 46
- **`lang/overlays/*/funny.joke.json`**: `joke_450`–`549` (+100 zh +100 en)
- **Daily jokes progress**: 550 / 1331 (~41%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 45
- **`lang/overlays/*/funny.joke.json`**: `joke_350`–`449` (+100 zh +100 en)
- **Daily jokes progress**: 450 / 1331 (~34%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 44
- **`lang/overlays/*/funny.joke.json`**: `joke_250`–`349` (+100 zh +100 en)
- **Daily jokes progress**: 350 / 1331 (~26%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 43
- **`lang/overlays/*/funny.joke.json`**: `joke_150`–`249` (+100 zh +100 en)
- **Daily jokes progress**: 250 / 1331 (~19%)
- **Lang keys**: +200 overlay (`funny.joke_*` ×100 per locale)

### Batch 42 (architecture)
- **`modules/i18n-overlays.js`**: overlay loader; **`modules/i18n.js`** merges `lang/overlays/{locale}/*.json` at init
- **Migrated** indexed `funny.*` bulk keys out of `en.json` / `zh-tw.json` into 9 overlay files per locale
- **`test/lang-keys.test.js`**: parity checks main + overlays; **`temp/merge-funny-overlay.js`** for future batches
- Main locale JSON: ~5500 → ~4087 lines

### Batch 41
- **`lang/*.json`**: `funny.joke_50`–`149` (+100 zh +100 en)
- **Daily jokes progress**: 150 / 1331 (~11%)
- **Lang keys**: +200 (`funny.joke_*` ×100 per locale)

### Batch 40
- **`roll/1-funny.js`**: `FunnyRandom` i18n via `pickFunnyRandomContent` + `keyPrefix`; daily joke/acg/slogan/blackjoke/mlove wired (per-entry notice when untranslated)
- **`lang/*.json`**: `funny.joke_0`–`49` (+50 zh +50 en)
- **Lang keys**: +100 (`funny.joke_*` ×50 per locale)

### Batch 39
- **`lang/en.json`**: `daily_answer_626`–`725` English (+100); gap-fill `daily_answer_1`–`25` remaining zh stubs (+17)
- **Daily answer book**: all 726 keys now have EN text (3 entries `GO`/`WHY`/`NOT` identical in both locales)
- **Lang keys**: +117 (`daily_answer` updates ×117)

### Batch 38
- **`lang/en.json`**: `daily_answer_526`–`625` English (+100); full `pokemon.help` EN (replaces one-line stub)
- **`lang/zh-tw.json`**: full `pokemon.help` zh (replaces English one-line stub; matches `buildPokemonHelpLegacy`)
- **Lang keys**: +100 (`daily_answer` updates ×100; `pokemon.help` content expanded in both locales)

### Batch 37
- **`roll/pokemon.js`**: Type labels (`pokemon.type_*` ×18), matchup effect scripts (`pokemon.effect_*` ×7), English type input (`Fire` / `Fighting`); `formatTypeLabel` / `resolveTypeKeyLocalized` for vs + mon display
- **`lang/en.json`**: `daily_answer_426`–`525` English (+100)
- **Lang keys**: +125 (`pokemon.type_*` ×18, `pokemon.effect_*` ×7, `daily_answer` updates ×100)

### Batch 36
- **`roll/1-funny.js`**: DailyFuckUp celebrity quote bodies (`funny.fuckup_quote_*` ×110) wired via `pickFuckupText`
- **`lang/en.json`**: `daily_answer_326`–`425` English (+100)
- **Lang keys**: +210 (`funny.fuckup_quote_*` ×110, `daily_answer` updates ×100)

### Batch 35
- **`roll/1-funny.js`**: Daily nonsense generator (`DailyFuckUp`) — discuss / former / after phrases (`funny.fuckup_*` ×117); `.lang en` uses EN filler text (celebrity quote bodies still zh)
- **`lang/en.json`**: `daily_answer_226`–`325` English (+100)
- **Lang keys**: +217 (`funny.fuckup_*` ×117, `daily_answer` updates ×100)

### Batch 34
- **`roll/1-funny.js`**: Almanac section labels localized on read (`funny.almanac_label_*`, weekdays, western zodiac, directions, 吉/凶)
- **`lang/en.json`**: `daily_answer_126`–`225` English (+100)
- **Lang keys**: +142 (`funny.almanac_*` ×42, `daily_answer` updates ×100)

### Batch 33
- **`roll/1-funny.js`**: Horoscope report template (`funny.astro_report`, `astro_sign_*`); almanac title; big-event error strings; `FunnyRandom` error message; astro/almanac cache stores raw data and formats per locale
- **`lang/en.json`**: `daily_answer_26`–`125` English (+100); 10 remaining `mythos_book_*` titles
- **Lang keys**: +118 (`funny.*` ×18, `daily_answer` updates ×100)

### Batch 32
- **`roll/1-funny.js`**: Tarot card labels (`funny.tarot_label_*` ×157); death-flag lines (`funny.flag_script_*` ×131); duck-beast replies (`funny.duck_reply_*` ×25); tarot / 立flag / 鴨霸獸 no longer wrapped with zh-only notice
- **Lang keys**: +313

### Batch 31
- **`roll/2-coc.js`**: Cult generator (`.cccc`) full random content — leader roles, appearance, personality, power sources, goals, means; cult skill names via `formatBuildSkillName`; spell list uses `mythos_spell_*`
- **Lang keys**: +235 (`coc.cult_*` ×232, `coc.build_skill_{brawl_blade,natural_history,cthulhu_mythos}` ×3)

### Batch 30
- **`roll/2-coc.js`**: Mythos random tables (`coc.mythos_monster_*`, `mythos_god_*`, `mythos_spell_*`, `mythos_book_*`); `.cccc` / `.ccdr` output no longer wrapped with zh-only notice when translated
- **`roll/1-funny.js`**: Daily answer book (`funny.daily_answer_*` ×726) with zh-only notice on untranslated entries
- **Lang keys**: +959 (`coc.mythos_*` ×233, `funny.daily_answer_*` ×726)

### Batch 29
- **`roll/2-coc.js`**: `.cc7bg` PcBG random content (`coc.pcbg_*` ×95); `ccrt`/`ccsu` phobia/mania 100-item tables (`coc.phobia_*`, `coc.mania_*`); removed zh-only notice on translated outputs
- **Lang keys**: +295 (`pcbg_*` ×95, `phobia_*` ×100, `mania_*` ×100)

### Batch 28
- **`roll/2-coc.js`**: `.cc7build` random mode — all 66 CoC 7 skill names via `coc.build_skill_*`; `.ccpc` pushed casting / powerful backlash effects (`coc.pushed_casting_*`, `coc.pushed_powerful_*`)
- **Lang keys**: +82 (`coc.build_skill_*` ×66, `coc.pushed_casting_*` ×8, `coc.pushed_powerful_*` ×8)

### Batch 27
- **`roll/2-coc.js`**: `.cc7bg` / PcBG section labels (`coc.pcbg_*`); `.cc7build` random mode skill label `信譽` → `coc.build7_skill_credit`
- **`roll/1-funny.js`**: Tarot UI labels; luck fortune levels; choice/sort/daily-answer format strings; luck no longer wrapped with zh-only notice
- **Lang keys**: +44 (`coc.pcbg_*`, `coc.build7_skill_credit`, `funny.tarot_*`, `funny.luck_*`, `funny.choice_result`, `funny.sort_result`, `funny.daily_answer_line`)
