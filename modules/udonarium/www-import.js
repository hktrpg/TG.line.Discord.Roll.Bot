"use strict";

const { persistImportedCharacterCard, MAX_IMPORT_XML_BYTES } = require("../character-card/persist-import.js");
const { buildCharacterCardPatchFromUdonarium } = require("./character-bridge.js");

/**
 * @param {object} params
 * @param {string} params.platformUserId
 * @param {string} params.cardId
 * @param {string} params.fileContent - Udonarium character XML
 * @param {boolean} [params.replaceMode]
 * @param {string} [params.locale]
 */
async function runUdonariumCharacterCardImport(params) {
    const { platformUserId, cardId, fileContent, replaceMode = true, locale } = params;
    if (!platformUserId || !cardId || !fileContent) {
        return { ok: false, code: "invalid_request" };
    }
    const xml = fileContent.toString();
    if (Buffer.byteLength(xml, "utf8") > MAX_IMPORT_XML_BYTES) {
        return { ok: false, code: "file_too_large" };
    }
    if (!/<character[\s>]/i.test(xml)) {
        return { ok: false, code: "invalid_udonarium_xml" };
    }

    let patch;
    try {
        patch = buildCharacterCardPatchFromUdonarium(xml);
    } catch (error) {
        return {
            ok: false,
            code: "invalid_udonarium_xml",
            message: error.message,
        };
    }

    if (patch.states.length === 0 && patch.rolls.length === 0 && patch.notes.length === 0) {
        return { ok: false, code: "empty_udonarium_sheet" };
    }

    const result = await persistImportedCharacterCard({
        platformUserId,
        cardId,
        patch,
        replaceMode,
        locale,
    });
    if (!result.ok) {
        return result;
    }
    return {
        ...result,
        source: "udonarium",
    };
}

module.exports = {
    runUdonariumCharacterCardImport,
};
