"use strict";

const fs = require('node:fs');
const path = require('node:path');

const OVERLAYS_DIR = path.join(__dirname, '..', 'lang', 'overlays');

/** Indexed funny keys stored in lang/overlays/{locale}/funny.*.json */
const FUNNY_BULK_KEY_PATTERN = /^(joke|daily_answer|tarot_label|flag_script|duck_reply|fuckup_discuss|fuckup_former|fuckup_after|fuckup_quote)_\d+$/;

/** Indexed CoC d100/d10 tables stored in lang/overlays/{locale}/coc.*.json */
const COC_BULK_KEY_PATTERN = /^(mania|phobia|cult_appearance|cult_personality|pcbg_personal|pcbg_belief|pcbg_sig_who|pcbg_sig_why|pcbg_location|pcbg_trait|cult_leader|cult_goal|madness_rt|madness_su|mythos_book|mythos_spell|mythos_monster|mythos_god)_\d+$/;

function getOverlayDir(locale) {
    return path.join(OVERLAYS_DIR, locale);
}

function listOverlayFiles(locale) {
    const dir = getOverlayDir(locale);
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir).filter((file) => file.endsWith('.json')).sort();
}

function parseOverlayNamespace(fileName) {
    const match = fileName.match(/^([^.]+)\..+\.json$/);
    if (!match) {
        return null;
    }
    return { namespace: match[1] };
}

function readOverlayFile(locale, fileName) {
    const filePath = path.join(getOverlayDir(locale), fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function mergeOverlayIntoBundle(bundle, fileName, overlayContent) {
    const parsed = parseOverlayNamespace(fileName);
    if (!parsed) {
        return bundle;
    }
    bundle[parsed.namespace] = {
        ...bundle[parsed.namespace],
        ...overlayContent
    };
    return bundle;
}

function loadLocaleBundle(locale, mainBundle) {
    const merged = structuredClone(mainBundle);
    for (const fileName of listOverlayFiles(locale)) {
        const overlayContent = readOverlayFile(locale, fileName);
        mergeOverlayIntoBundle(merged, fileName, overlayContent);
    }
    return merged;
}

function isFunnyBulkKey(key) {
    return FUNNY_BULK_KEY_PATTERN.test(key);
}

function isCocBulkKey(key) {
    return COC_BULK_KEY_PATTERN.test(key);
}

function splitIndexedBulkKeys(object = {}, isBulkKey) {
    const bundles = {};
    const keep = {};
    for (const [key, value] of Object.entries(object)) {
        if (isBulkKey(key)) {
            const bundleName = key.replace(/_\d+$/, '');
            if (!bundles[bundleName]) {
                bundles[bundleName] = {};
            }
            bundles[bundleName][key] = value;
        } else {
            keep[key] = value;
        }
    }
    return { bundles, keep };
}

function splitFunnyBulkKeys(funnyObject = {}) {
    return splitIndexedBulkKeys(funnyObject, isFunnyBulkKey);
}

function splitCocBulkKeys(cocObject = {}) {
    return splitIndexedBulkKeys(cocObject, isCocBulkKey);
}

function funnyBundleFileName(bundleName) {
    return `funny.${bundleName}.json`;
}

function cocBundleFileName(bundleName) {
    return `coc.${bundleName}.json`;
}

module.exports = {
    OVERLAYS_DIR,
    FUNNY_BULK_KEY_PATTERN,
    COC_BULK_KEY_PATTERN,
    getOverlayDir,
    listOverlayFiles,
    parseOverlayNamespace,
    readOverlayFile,
    loadLocaleBundle,
    splitFunnyBulkKeys,
    splitCocBulkKeys,
    funnyBundleFileName,
    cocBundleFileName,
    isFunnyBulkKey,
    isCocBulkKey
};
