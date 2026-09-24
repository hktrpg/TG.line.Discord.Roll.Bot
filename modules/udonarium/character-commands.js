"use strict";

const { buildCharacterCardPatchFromUdonarium } = require("./character-bridge.js");

function parseImportUdonInput(inputStr) {
    let rest = inputStr.replace(/^\.char\s+importudon\s+/i, "").trim();
    const replaceMode = /^replace\s+/i.test(rest);
    if (replaceMode) {
        rest = rest.replace(/^replace\s+/i, "");
    }

    const nameMatch = rest.match(/name\[(.*?)\]~/i);
    const xmlMatch = rest.match(/xml\[([\s\S]*?)\]~/i);
    let cardName = nameMatch ? nameMatch[1].trim() : "";
    let xmlContent = xmlMatch ? xmlMatch[1].trim() : "";

    if (!cardName) {
        const withoutXml = rest.replace(/xml\[[\s\S]*?\]~/i, "").trim();
        const tokens = withoutXml.split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
            cardName = tokens.at(-1) || tokens.join(" ");
        }
    }

    return {
        replaceMode,
        cardName,
        xmlContent,
    };
}

function buildPatchFromXml(xmlContent) {
    return buildCharacterCardPatchFromUdonarium(xmlContent);
}

function parseExportUdonInput(inputStr) {
    let rest = inputStr.replace(/^\.char\s+exportudon\s+/i, "").trim();
    const nameMatch = rest.match(/name\[(.*?)\]~/i);
    if (nameMatch) {
        return nameMatch[1].trim();
    }
    const token = rest.split(/\s+/).find(Boolean);
    return token || rest;
}

module.exports = {
    parseImportUdonInput,
    parseExportUdonInput,
    buildPatchFromXml,
};
