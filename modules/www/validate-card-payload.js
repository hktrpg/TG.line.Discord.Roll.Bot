"use strict";

const i18n = require("../i18n/i18n.js");

const { MAX_SECTION_KEY_LENGTH, MAX_KIND_LENGTH } = require("../character-card/section-keys.js");

const NOTES_CONTENT_MAX_V1 = 1500;
const NOTES_CONTENT_MAX_V2 = 4000;

function notesContentMaxLength(card) {
    const version = Number(card?.schemaVersion) || 1;
    return version >= 2 ? NOTES_CONTENT_MAX_V2 : NOTES_CONTENT_MAX_V1;
}

function validateCardEntryMeta(it) {
    const tooLong = (v, m) => (v || "").toString().length > m;
    if (it.section !== undefined && it.section !== null && tooLong(it.section, MAX_SECTION_KEY_LENGTH)) {
        return "section";
    }
    if (it.kind !== undefined && it.kind !== null && tooLong(it.kind, MAX_KIND_LENGTH)) {
        return "kind";
    }
    return null;
}

function validateCardPayload(card, locale = i18n.DEFAULT_LOCALE) {
    const t = i18n.createTranslator(locale);
    try {
        if (!card) {
            return t("character.validation_invalid_input");
        }
        const name = (card.name || "").toString().trim();
        if (!name) {
            return t("character.validation_name_empty");
        }
        if (name.length > 50) {
            return t("character.validation_name_too_long");
        }

        const norm = s => (s || "").toString().trim().toLowerCase();
        const tooLong = (v, m) => (v || "").toString().length > m;
        const findDups = arr => {
            const seen = new Set();
            const d = new Set();
            for (const it of arr || []) {
                const k = norm(it && it.name);
                if (!k) {
                    continue;
                }
                if (seen.has(k)) {
                    d.add((it.name || "").toString());
                } else {
                    seen.add(k);
                }
            }
            return [...d];
        };

        const sD = findDups(card.state);
        const rD = findDups(card.roll);
        const nD = findDups(card.notes);
        if (sD.length > 0 || rD.length > 0 || nD.length > 0) {
            return t("character.validation_duplicate_names");
        }

        for (const it of card.state || []) {
            if (!it || !it.name || !it.name.toString().trim()) {
                return t("character.validation_state_name_empty");
            }
            if (tooLong(it.name, 50)) {
                return t("character.validation_state_name_too_long", { name: it.name });
            }
            if (tooLong(it.itemA, 50)) {
                return t("character.validation_state_value_a_too_long", { name: it.name });
            }
            if (tooLong(it.itemB, 50)) {
                return t("character.validation_state_value_b_too_long", { name: it.name });
            }
            if (validateCardEntryMeta(it)) {
                return t("character.validation_failed");
            }
        }
        for (const it of card.roll || []) {
            if (!it || !it.name || !it.name.toString().trim()) {
                return t("character.validation_roll_name_empty");
            }
            if (tooLong(it.name, 50)) {
                return t("character.validation_roll_name_too_long", { name: it.name });
            }
            if (tooLong(it.itemA, 150)) {
                return t("character.validation_roll_content_too_long", { name: it.name });
            }
            if (validateCardEntryMeta(it)) {
                return t("character.validation_failed");
            }
        }
        for (const it of card.notes || []) {
            if (!it || !it.name || !it.name.toString().trim()) {
                return t("character.validation_notes_name_empty");
            }
            if (tooLong(it.name, 50)) {
                return t("character.validation_notes_name_too_long", { name: it.name });
            }
            if (tooLong(it.itemA, notesContentMaxLength(card))) {
                return t("character.validation_notes_content_too_long", { name: it.name });
            }
            if (validateCardEntryMeta(it)) {
                return t("character.validation_failed");
            }
        }
        return null;
    } catch {
        return t("character.validation_failed");
    }
}

module.exports = {
    validateCardPayload,
    notesContentMaxLength,
    NOTES_CONTENT_MAX_V1,
    NOTES_CONTENT_MAX_V2,
};
