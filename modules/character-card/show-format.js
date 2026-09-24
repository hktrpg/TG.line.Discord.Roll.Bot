"use strict";

const { groupEntriesBySection, SECTION } = require("./grouping.js");

function shouldUseSectionHeaders(list) {
    if (!Array.isArray(list) || list.length === 0) {
        return false;
    }
    return list.some(entry => entry?.section && entry.section !== SECTION.GENERAL);
}

function formatStateLine(entry, mode) {
    if (mode === "addMode" || mode === "showAllMode") {
        let line = entry.name + ": " + entry.itemA;
        line += entry.itemB ? "/" + entry.itemB : "";
        return line + " ";
    }
    let line = entry.itemA ? entry.name + ": " + entry.itemA : "";
    line += entry.itemA && entry.itemB ? "/" + entry.itemB : "";
    return line ? line + " " : "";
}

function formatRollLine(entry, mode) {
    if (mode === "addMode" || mode === "showAllMode") {
        return entry.name + ": " + entry.itemA + "  ";
    }
    return entry.itemA ? entry.name + ": " + entry.itemA + "  " : "";
}

function formatNoteLine(entry) {
    return entry.name + ": " + entry.itemA + "　\n";
}

/**
 * @param {object[]} list
 * @param {'showAllMode'|'showMode'|'addMode'} mode
 * @param {'state'|'roll'|'notes'} bucket
 * @param {string[]} colorEmoji
 */
function formatBucketForShow(list, mode, bucket, colorEmoji) {
    if (!list || list.length === 0) {
        return "";
    }
    const useHeaders = mode === "showAllMode" && shouldUseSectionHeaders(list);
    let returnStr = "";
    let a = 0;

    let rollOutCount = 0;

    const renderEntry = (entry, index, linePrefix) => {
        if (bucket === "state") {
            if (!(entry.itemA || entry.itemB)) {
                return;
            }
            if (a !== 0 && a % 4 === 0) {
                returnStr += "　\n";
            }
            returnStr += linePrefix + formatStateLine(entry, mode);
            a++;
        } else if (bucket === "roll") {
            returnStr += linePrefix + formatRollLine(entry, mode);
            rollOutCount++;
            if (rollOutCount % 2 === 0) {
                returnStr += "　\n";
            }
        } else {
            returnStr += formatNoteLine(entry);
        }
    };

    if (!useHeaders) {
        for (let i = 0; i < list.length; i++) {
            const prefix = bucket === "notes" ? "" : (colorEmoji[(i + 1) % 4] || "");
            renderEntry(list[i], i, prefix);
        }
        return returnStr;
    }

    const groups = groupEntriesBySection(list);
    for (const group of groups) {
        if (group.key !== SECTION.GENERAL) {
            returnStr += `【${group.key}】\n`;
        }
        for (let gi = 0; gi < group.items.length; gi++) {
            const { entry, index } = group.items[gi];
            const prefix = bucket === "notes" ? "" : (colorEmoji[(index + 1) % 4] || "");
            renderEntry(entry, index, prefix);
        }
    }
    return returnStr;
}

module.exports = {
    formatBucketForShow,
    shouldUseSectionHeaders,
};
