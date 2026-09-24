"use strict";

const cheerio = require("cheerio");
const { SECTION, tagEntry, normalizeSectionKey } = require("../character-card/section-keys.js");
const { NOTES_CONTENT_MAX_V2 } = require("../www/validate-card-payload.js");

const ROLL_COMMAND_PATTERN = /(\d+d[\d+*/-]*|cc\s|ccb|cc\s*\(|\.sc|1d100|b\d+|f\d+|\{)/i;

function looksLikeRollCommand(text) {
    return ROLL_COMMAND_PATTERN.test(text || "");
}

function splitPaletteLine(line) {
    const trimmed = (line || "").trim();
    if (!trimmed) {
        return null;
    }
    const parts = trimmed.split(/[\s　]+/);
    if (parts.length >= 2 && looksLikeRollCommand(parts[0])) {
        const name = parts.slice(1).join(" ").trim() || parts[0];
        return {
            name: name.slice(0, 50),
            itemA: parts[0].slice(0, 150),
        };
    }
    if (looksLikeRollCommand(trimmed)) {
        return {
            name: trimmed.slice(0, 50),
            itemA: trimmed.slice(0, 150),
        };
    }
    return null;
}

function parseChatPalette($, root) {
    const rolls = [];
    const paletteEl = root.find("chat-palette").first();
    if (paletteEl.length === 0) {
        return rolls;
    }
    const text = paletteEl.text() || "";
    for (const line of text.split(/\r?\n/)) {
        const entry = splitPaletteLine(line);
        if (entry) {
            rolls.push(tagEntry(entry, SECTION.COMBAT, "roll"));
        }
    }
    return rolls;
}

function walkDataElement($, $el, sectionPath, out) {
    const name = ($el.attr("name") || "").trim();
    const type = ($el.attr("type") || "").trim();
    const childData = $el.children("data");
    const section = normalizeSectionKey(sectionPath || name || SECTION.GENERAL);

    if (childData.length > 0) {
        childData.each((_i, child) => {
            walkDataElement($, $(child), name || sectionPath, out);
        });
        return;
    }
    if (!name) {
        return;
    }

    const currentValue = $el.attr("currentValue");
    const text = ($el.text() || "").trim();

    if (type === "note" || type === "markdown") {
        out.notes.push(tagEntry({
            name: name.slice(0, 50),
            itemA: text.slice(0, NOTES_CONTENT_MAX_V2),
        }, section, "note"));
        return;
    }
    if (type === "numberResource") {
        const itemA = currentValue != null ? String(currentValue) : text;
        const itemB = text && currentValue != null ? text : "";
        out.states.push(tagEntry({
            name: name.slice(0, 50),
            itemA: itemA.slice(0, 50),
            itemB: itemB.slice(0, 50),
        }, section, "resource"));
        return;
    }
    const display = currentValue != null ? String(currentValue) : text;
    out.states.push(tagEntry({
        name: name.slice(0, 50),
        itemA: display.slice(0, 50),
    }, section, type === "abilityScore" ? "ability" : "stat"));
}

function dedupeRollNames(rolls) {
    const seen = new Map();
    return rolls.map(entry => {
        const base = entry.name || "Roll";
        const key = base.toLowerCase();
        const count = seen.get(key) || 0;
        seen.set(key, count + 1);
        if (count === 0) {
            return entry;
        }
        return {
            ...entry,
            name: `${base} (${count + 1})`.slice(0, 50),
        };
    });
}

function parseUdonariumCharacterXml(xmlString) {
    const $ = cheerio.load(xmlString, { xmlMode: true });
    const root = $("character").first();
    if (root.length === 0) {
        throw new Error("invalid_udonarium_xml");
    }
    const out = { states: [], rolls: [], notes: [] };
    root.children("data").each((_i, el) => {
        walkDataElement($, $(el), "", out);
    });
    const paletteRolls = parseChatPalette($, root);
    out.rolls.push(...paletteRolls);
    out.rolls = dedupeRollNames(out.rolls);
    return out;
}

function buildCharacterCardPatchFromUdonarium(xmlString) {
    const parsed = parseUdonariumCharacterXml(xmlString);
    return {
        states: parsed.states,
        rolls: parsed.rolls,
        notes: parsed.notes,
        image: "",
        importSummary: {
            stateCount: parsed.states.length,
            rollCount: parsed.rolls.length,
            noteCount: parsed.notes.length,
        },
    };
}

module.exports = {
    parseUdonariumCharacterXml,
    buildCharacterCardPatchFromUdonarium,
    splitPaletteLine,
};
