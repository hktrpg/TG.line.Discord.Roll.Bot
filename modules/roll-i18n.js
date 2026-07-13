"use strict";

const i18n = require('./i18n.js');

function getT(params = {}) {
    return params.t || i18n.createTranslator(params.locale || i18n.DEFAULT_LOCALE);
}

function getLocale(params = {}) {
    return params.locale || i18n.DEFAULT_LOCALE;
}

function isEnglish(params = {}) {
    return getLocale(params) === 'en';
}

function resolveHelp(params, key, zhFallback) {
    if (isEnglish(params)) {
        const text = getT(params)(key);
        if (text && text !== key) {
            return text;
        }
    }
    return typeof zhFallback === 'function' ? zhFallback() : zhFallback;
}

function withPartialTranslationNotice(text, params = {}) {
    if (!isEnglish(params)) {
        return text;
    }
    const banner = getT(params)('common.errors.partial_translation_banner');
    return `${banner}\n${text}`;
}

function resolveGameName(params, key, zhFallback) {
    try {
        const text = getT(params)(key);
        return text && text !== key ? text : zhFallback;
    } catch {
        return zhFallback;
    }
}

module.exports = {
    getT,
    getLocale,
    isEnglish,
    resolveHelp,
    resolveGameName,
    withPartialTranslationNotice,
    DEFAULT_LOCALE: i18n.DEFAULT_LOCALE
};
