"use strict";

const { persistImportedCharacterCard } = require("../character-card/persist-import.js");
const { fetchCharacterData } = require("./character-client.js");
const { buildCharacterCardPatch } = require("./attack-extractor.js");

/**
 * @param {object} params
 * @param {string} params.platformUserId - HKTRPG user id (accountPW.id)
 * @param {string} params.cardId - Mongo _id string
 * @param {string} params.idInput - provider-specific id or URL
 * @param {boolean} [params.replaceMode]
 * @param {string} [params.locale]
 */
async function runDdbCharacterCardImport(params) {
    const { platformUserId, cardId, idInput, replaceMode = true, locale } = params;
    if (!platformUserId || !cardId || !idInput) {
        return { ok: false, code: "invalid_request" };
    }

    const fetchResult = await fetchCharacterData(idInput, platformUserId);
    if (!fetchResult.ok) {
        return { ok: false, code: fetchResult.code, retryMs: fetchResult.retryMs };
    }

    const patch = buildCharacterCardPatch(fetchResult.data, fetchResult.characterId);
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
        source: "ddb",
        characterId: fetchResult.characterId,
        skipped: patch.skipped,
    };
}

module.exports = {
    runDdbCharacterCardImport,
};
