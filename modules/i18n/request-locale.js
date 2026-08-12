"use strict";

const { AsyncLocalStorage } = require('node:async_hooks');
const i18n = require('./i18n.js');

/**
 * Per-message locale context (Node AsyncLocalStorage).
 * Set once at the analytics / worker entry; call loc('key') anywhere below.
 * Do NOT use a process-global currentLocale — concurrent groups would clash.
 */

const als = new AsyncLocalStorage();

/**
 * @typedef {{ locale: string, t: Function }} LocaleStore
 */

/**
 * Run fn with request-scoped locale + translator.
 * Accepts a locale string or { locale, t }.
 * @template T
 * @param {string|{ locale?: string, t?: Function }} localeOrStore
 * @param {() => T} fn
 * @returns {T}
 */
function runWithLocale(localeOrStore, fn) {
    let locale;
    let t;
    if (typeof localeOrStore === 'string') {
        locale = i18n.normalizeLocale(localeOrStore);
        t = i18n.createTranslator(locale);
    } else {
        locale = i18n.normalizeLocale(localeOrStore?.locale || i18n.DEFAULT_LOCALE);
        t = localeOrStore?.t || i18n.createTranslator(locale);
    }
    return als.run({ locale, t }, fn);
}

/**
 * @returns {LocaleStore|undefined}
 */
function getStore() {
    return als.getStore();
}

/**
 * Current request locale, or null if outside runWithLocale.
 * @returns {string|null}
 */
function getRequestLocale() {
    return getStore()?.locale || null;
}

/**
 * Current request translator, or null if outside runWithLocale.
 * @returns {Function|null}
 */
function getRequestTranslator() {
    return getStore()?.t || null;
}

/**
 * Translate a key using the request locale (fallback: DEFAULT_LOCALE).
 * @param {string} key
 * @param {object} [options]
 * @returns {string}
 */
function loc(key, options = {}) {
    const store = getStore();
    if (store?.t) {
        return store.t(key, options);
    }
    return i18n.createTranslator(i18n.DEFAULT_LOCALE)(key, options);
}

module.exports = {
    runWithLocale,
    getRequestLocale,
    getRequestTranslator,
    getStore,
    loc
};
