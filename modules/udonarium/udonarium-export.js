"use strict";

const { groupEntriesBySection } = require("../character-card/grouping.js");
const { SECTION } = require("../character-card/section-keys.js");

function escapeXml(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;");
}

function udonGroupNameForSection(sectionKey, bucket) {
    if (bucket === "notes" && sectionKey === SECTION.GENERAL) {
        return "Notes";
    }
    if (sectionKey === SECTION.ABILITIES) {
        return "Attributes";
    }
    if (sectionKey === SECTION.GENERAL) {
        return "General";
    }
    return sectionKey;
}

function stateDataXml(entry) {
    const name = escapeXml(entry.name);
    const itemB = entry.itemB !== undefined && entry.itemB !== null
        ? String(entry.itemB).trim()
        : "";
    if (itemB) {
        return `<data name="${name}" type="numberResource" currentValue="${escapeXml(entry.itemA)}">${escapeXml(itemB)}</data>`;
    }
    if (entry.kind === "ability") {
        return `<data name="${name}" type="abilityScore">${escapeXml(entry.itemA)}</data>`;
    }
    return `<data name="${name}" type="simpleNumber">${escapeXml(entry.itemA)}</data>`;
}

function noteDataXml(entry) {
    return `<data name="${escapeXml(entry.name)}" type="note">${escapeXml(entry.itemA)}</data>`;
}

function buildChatPaletteText(rolls) {
    const lines = [];
    for (const roll of rolls || []) {
        if (!roll?.name) {
            continue;
        }
        const cmd = (roll.itemA || "").trim();
        const label = (roll.name || "").trim();
        if (!cmd) {
            continue;
        }
        if (label && label !== cmd) {
            lines.push(`${cmd} ${label}`);
        } else {
            lines.push(cmd);
        }
    }
    return lines.join("\n");
}

/**
 * Lossy export: flat HKTRPG card → Udonarium character XML (no token / images).
 * @param {{ name?: string, state?: object[], roll?: object[], notes?: object[] }} card
 */
function buildUdonariumCharacterXml(card) {
    const charName = escapeXml(card?.name || "Character");
    const lines = [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        `<character name="${charName}">`,
    ];

    for (const group of groupEntriesBySection(card?.state || [])) {
        const inner = group.items.map(({ entry }) => stateDataXml(entry)).join("\n    ");
        if (!inner) {
            continue;
        }
        const groupName = escapeXml(udonGroupNameForSection(group.key, "state"));
        lines.push(`  <data name="${groupName}">`, `    ${inner}`, "  </data>");
    }

    for (const group of groupEntriesBySection(card?.notes || [])) {
        const inner = group.items.map(({ entry }) => noteDataXml(entry)).join("\n    ");
        if (!inner) {
            continue;
        }
        const groupName = escapeXml(udonGroupNameForSection(group.key, "notes"));
        lines.push(`  <data name="${groupName}">`, `    ${inner}`, "  </data>");
    }

    const palette = buildChatPaletteText(card?.roll);
    if (palette) {
        lines.push("  <chat-palette dicebot=\"\">", escapeXml(palette), "  </chat-palette>");
    }

    lines.push("</character>");
    return lines.join("\n");
}

module.exports = {
    buildUdonariumCharacterXml,
    escapeXml,
    udonGroupNameForSection,
};
