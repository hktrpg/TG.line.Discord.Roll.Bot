/**
 * Early www locale detection — load in <head> before body so <html lang> matches browser language.
 * Priority: ?lang= → localStorage wwwLocale → navigator.languages → defaultLocale
 *
 * window.HKTRPG_LOCALES is injected by core-www before this file body (from lang/locales.json).
 */
(function (global) {
    'use strict';

    const meta = global.HKTRPG_LOCALES || {
        defaultLocale: 'zh-tw',
        supported: ['zh-tw', 'en'],
        definitions: {
            'zh-tw': { prefixes: ['zh-tw', 'zh'], intl: 'zh-Hant-HK' },
            en: { prefixes: ['en'], intl: 'en' }
        }
    };

    function getDefaultLocale() {
        return meta.defaultLocale || 'zh-tw';
    }

    function normalizeWwwLocale(input) {
        if (input == null || input === '') return null;
        const value = String(input).toLowerCase().replaceAll('_', '-');
        const definitions = meta.definitions || {};
        const supported = meta.supported || Object.keys(definitions);

        if (definitions[value] || supported.includes(value)) {
            return value;
        }

        const prefixHits = [];
        for (const code of supported) {
            const prefixes = definitions[code]?.prefixes || [code];
            for (const prefix of prefixes) {
                if (value === prefix || value.startsWith(prefix)) {
                    prefixHits.push({ code, length: prefix.length });
                }
            }
            // Also accept bare language family for zh (zh-cn → still need zh-tw for Hant; keep zh* → default zh locale)
            if (code.startsWith('zh') && value.startsWith('zh')) {
                prefixHits.push({ code, length: 2 });
            }
        }
        if (prefixHits.length > 0) {
            prefixHits.sort((a, b) => b.length - a.length);
            return prefixHits[0].code;
        }
        return null;
    }

    function resolveWwwLocale() {
        try {
            const fromQuery = normalizeWwwLocale(
                new URLSearchParams(global.location.search).get('lang')
            );
            if (fromQuery) return fromQuery;
            const fromSaved = normalizeWwwLocale(global.localStorage.getItem('wwwLocale'));
            if (fromSaved) return fromSaved;
        } catch {
            // ignore
        }
        const langs = (global.navigator?.languages?.length)
            ? global.navigator.languages
            : [global.navigator?.language].filter(Boolean);
        for (const lang of langs) {
            const resolved = normalizeWwwLocale(lang);
            if (resolved) return resolved;
        }
        return getDefaultLocale();
    }

    function wwwLocaleToHtmlLang(locale) {
        const code = normalizeWwwLocale(locale) || getDefaultLocale();
        return (meta.definitions?.[code]?.intl) || code;
    }

    function applyEarlyWwwHtmlLang() {
        const locale = resolveWwwLocale();
        document.documentElement.lang = wwwLocaleToHtmlLang(locale);
        document.documentElement.dataset.wwwLocale = locale;
        return locale;
    }

    global.normalizeWwwLocale = normalizeWwwLocale;
    global.resolveWwwLocale = resolveWwwLocale;
    global.wwwLocaleToHtmlLang = wwwLocaleToHtmlLang;
    global.getWwwDefaultLocale = getDefaultLocale;
    global.HKTRPG_LOCALES = meta;

    if (global.document?.documentElement) {
        applyEarlyWwwHtmlLang();
    }
})(typeof globalThis === 'undefined' ? window : globalThis);
