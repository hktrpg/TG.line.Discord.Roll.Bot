"use strict";

const schema = require("../db/schema.js");
const { applyImportPatch } = require("../dndbeyond/card-patch.js");
const { validateCardPayload } = require("../www/validate-card-payload.js");
const { prepareCardForMongoSave, cardFieldsForMongoSet } = require("./card-facade.js");

const MAX_IMPORT_XML_BYTES = 512 * 1024;

/**
 * @param {object} params
 * @param {string} params.platformUserId
 * @param {string} params.cardId
 * @param {{ states: object[], rolls: object[], notes: object[], image?: string, importSummary?: object }} patch
 * @param {boolean} [params.replaceMode]
 * @param {string} [params.locale]
 */
async function persistImportedCharacterCard(params) {
    const { platformUserId, cardId, patch, replaceMode = true, locale } = params;
    const existing = await schema.characterCard.findOne({
        id: platformUserId,
        _id: cardId,
    });
    if (!existing) {
        return { ok: false, code: "card_not_found" };
    }

    const merged = applyImportPatch(existing.toObject(), {
        states: patch.states,
        rolls: patch.rolls,
        notes: patch.notes,
        image: patch.image,
    }, replaceMode);
    merged.state = (merged.state || []).filter(item => item?.name);
    merged.roll = (merged.roll || []).filter(item => item?.name);
    merged.notes = (merged.notes || []).filter(item => item?.name);

    const prepared = prepareCardForMongoSave(merged, {
        forceV2: true,
        existingSchemaVersion: existing.schemaVersion,
    });

    const validationError = validateCardPayload(
        {
            name: existing.name,
            state: prepared.state,
            roll: prepared.roll,
            notes: prepared.notes,
            schemaVersion: prepared.schemaVersion,
        },
        locale
    );
    if (validationError) {
        return { ok: false, code: "validation_failed", message: validationError };
    }

    const dataFields = cardFieldsForMongoSet(prepared);
    await schema.characterCard.updateOne(
        { id: platformUserId, _id: cardId },
        {
            $set: {
                ...dataFields,
                ...(replaceMode
                    ? { image: prepared.image || "" }
                    : prepared.image
                        ? { image: prepared.image }
                        : {}),
            },
        }
    );

    const summary = patch.importSummary || {
        stateCount: (patch.states || []).length,
        rollCount: (patch.rolls || []).length,
        noteCount: (patch.notes || []).length,
    };

    return {
        ok: true,
        importSummary: summary,
        rollCount: summary.rollCount,
        card: {
            _id: merged._id || existing._id,
            state: prepared.state,
            roll: prepared.roll,
            notes: prepared.notes,
            sections: prepared.sections,
            schemaVersion: prepared.schemaVersion,
            image: prepared.image,
        },
    };
}

module.exports = {
    MAX_IMPORT_XML_BYTES,
    persistImportedCharacterCard,
};
