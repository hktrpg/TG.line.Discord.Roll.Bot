"use strict";

const i18n = require('./i18n.js');
const {
    loc,
    runWithLocale,
    getRequestLocale,
    getRequestTranslator
} = require('./request-locale.js');

/**
 * Prefer explicit params, then request-scoped ALS (runWithLocale), then default.
 * New roll code can use loc('key') instead of getT({ locale, t })('key').
 */
function getT(params = {}) {
    if (params.t) {
        return params.t;
    }
    if (params.locale) {
        return i18n.createTranslator(params.locale);
    }
    return getRequestTranslator() || i18n.createTranslator(i18n.DEFAULT_LOCALE);
}

function getInteractionT(interaction) {
    if (!interaction) {
        return getRequestTranslator() || i18n.createTranslator(i18n.DEFAULT_LOCALE);
    }
    return interaction._hktrpgT
        || (interaction._hktrpgLocale
            ? i18n.createTranslator(interaction._hktrpgLocale)
            : null)
        || getRequestTranslator()
        || i18n.createTranslator(i18n.DEFAULT_LOCALE);
}

function getLocale(params = {}) {
    if (params.locale) {
        return params.locale;
    }
    return getRequestLocale() || i18n.DEFAULT_LOCALE;
}

function isDefaultLocale(params = {}) {
    return getLocale(params) === i18n.DEFAULT_LOCALE;
}

/** Locale code whose i18next id is "en" (from lang/locales.json). */
const ENGLISH_LOCALE = i18n.SUPPORTED_LOCALES.find(
    (code) => code === 'en' || i18n.LOCALE_DEFINITIONS[code]?.i18next === 'en'
);

/** @deprecated Prefer isDefaultLocale / getLocale; kept for English-specific content branches */
function isEnglish(params = {}) {
    return Boolean(ENGLISH_LOCALE) && getLocale(params) === ENGLISH_LOCALE;
}

/**
 * Resolve help text for the request locale.
 * Non-default locales try their own translation first; missing keys fall back to DEFAULT_LOCALE.
 *
 * @param {object} params
 * @param {string} key
 * @param {Function|string|object} [fallbackOrOptions] - legacy fallback, or i18n t() options object
 */
function resolveHelp(params, key, fallbackOrOptions) {
    const isOptionsObject = fallbackOrOptions
        && typeof fallbackOrOptions === 'object'
        && typeof fallbackOrOptions !== 'function';
    const tOptions = isOptionsObject ? fallbackOrOptions : undefined;
    const legacyFallback = isOptionsObject ? undefined : fallbackOrOptions;

    if (!isDefaultLocale(params)) {
        const text = getT(params)(key, tOptions);
        if (text && text !== key) {
            return text;
        }
    }
    if (typeof legacyFallback === 'function') {
        return legacyFallback();
    }
    if (legacyFallback !== undefined) {
        return legacyFallback;
    }
    return getT({ locale: i18n.DEFAULT_LOCALE })(key, tOptions);
}

function withPartialTranslationNotice(text, params = {}) {
    if (isDefaultLocale(params)) {
        return text;
    }
    const banner = getT(params)('common.errors.partial_translation_banner');
    return `${banner}\n${text}`;
}

function resolveGameName(params, key, fallback) {
    try {
        const text = getT(params)(key);
        return text && text !== key ? text : fallback;
    } catch {
        return fallback;
    }
}

module.exports = {
    getT,
    getInteractionT,
    getLocale,
    isDefaultLocale,
    isEnglish,
    resolveHelp,
    resolveGameName,
    withPartialTranslationNotice,
    loc,
    runWithLocale,
    getRequestLocale,
    DEFAULT_LOCALE: i18n.DEFAULT_LOCALE
};
