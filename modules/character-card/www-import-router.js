"use strict";

const { runDdbCharacterCardImport } = require("../dndbeyond/www-import.js");
const { runUdonariumCharacterCardImport } = require("../udonarium/www-import.js");

/**
 * @param {object} params
 * @param {string} params.source - "ddb" | "udonarium"
 */
async function runCharacterCardImport(params) {
    const source = (params.source || "ddb").toString().toLowerCase();
    if (source === "ddb") {
        return runDdbCharacterCardImport(params);
    }
    if (source === "udonarium") {
        return runUdonariumCharacterCardImport(params);
    }
    return { ok: false, code: "unsupported_source" };
}

module.exports = {
    runCharacterCardImport,
};
