"use strict";

const schema = require("../db/schema.js");
const { buildUdonariumCharacterXml } = require("../udonarium/udonarium-export.js");

/**
 * @param {{ platformUserId: string, cardId: string }} params
 */
async function runUdonariumCharacterCardExport(params) {
    const { platformUserId, cardId } = params;
    const card = await schema.characterCard.findOne({
        id: platformUserId,
        _id: cardId,
    }).lean();
    if (!card) {
        return { ok: false, code: "card_not_found" };
    }
    const safeBase = (card.name || "character").toString().replaceAll(/[^\w\u3040-\u30FF\u3400-\u9FFF-]+/g, "_").slice(0, 40) || "character";
    return {
        ok: true,
        xml: buildUdonariumCharacterXml(card),
        fileName: `${safeBase}.xml`,
    };
}

module.exports = {
    runUdonariumCharacterCardExport,
};
