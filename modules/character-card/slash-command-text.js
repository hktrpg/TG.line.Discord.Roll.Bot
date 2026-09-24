"use strict";

function slashImportDdbText({ ddbId, cardName, replace = false }) {
    const prefix = replace ? ".char importddb replace" : ".char importddb";
    return `${prefix} ${ddbId} ${cardName}`;
}

function slashImportUdonText({ cardName, xml, replace = false }) {
    const mode = replace ? ".char importudon replace" : ".char importudon";
    return `${mode} name[${cardName}]~xml[${xml}]~`;
}

function slashCompareText({ rollA, rollB, ac }) {
    if (ac !== null && ac !== undefined && !Number.isNaN(ac)) {
        return `.ch compare ${rollA} ${rollB} ${ac}`;
    }
    return `.ch compare ${rollA} ${rollB}`;
}

function slashExportUdonText({ cardName }) {
    return `.char exportudon name[${cardName}]~`;
}

module.exports = {
    slashImportDdbText,
    slashImportUdonText,
    slashCompareText,
    slashExportUdonText,
};
