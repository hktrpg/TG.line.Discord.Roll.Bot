"use strict";

const fs = require('node:fs');
const path = require('node:path');

const OVERLAYS_DIR = path.join(__dirname, '..', 'lang', 'overlays');

/** Indexed funny keys stored in lang/overlays/{locale}/funny.*.json */
const FUNNY_BULK_KEY_PATTERN = /^(joke|daily_answer|tarot_label|flag_script|duck_reply|fuckup_discuss|fuckup_former|fuckup_after|fuckup_quote)_\d+$/;

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

function splitFunnyBulkKeys(funnyObject = {}) {
    const bundles = {};
    const keep = {};
    for (const [key, value] of Object.entries(funnyObject)) {
        if (isFunnyBulkKey(key)) {
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

function funnyBundleFileName(bundleName) {
    return `funny.${bundleName}.json`;
}

module.exports = {
    OVERLAYS_DIR,
    FUNNY_BULK_KEY_PATTERN,
    getOverlayDir,
    listOverlayFiles,
    parseOverlayNamespace,
    readOverlayFile,
    loadLocaleBundle,
    splitFunnyBulkKeys,
    funnyBundleFileName,
    isFunnyBulkKey
};
