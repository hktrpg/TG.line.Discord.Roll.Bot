/**
 * Early www locale detection — load in <head> before body so <html lang> matches browser language.
 * Priority: ?lang= → localStorage wwwLocale → navigator.languages → zh-tw
 */
(function (global) {
    'use strict';

    function normalizeWwwLocale(input) {
        if (input == null || input === '') return null;
        const value = String(input).toLowerCase().replaceAll('_', '-');
        if (value.startsWith('en')) return 'en';
        if (value.startsWith('zh')) return 'zh-tw';
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
        return 'zh-tw';
    }

    function wwwLocaleToHtmlLang(locale) {
        return locale === 'en' ? 'en' : 'zh-Hant-HK';
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
    global.applyEarlyWwwHtmlLang = applyEarlyWwwHtmlLang;

    if (!global.__WWW_LOCALE_HEAD_APPLIED__) {
        global.__WWW_LOCALE_HEAD_APPLIED__ = true;
        applyEarlyWwwHtmlLang();
    }
})(typeof window !== 'undefined' ? window : globalThis);
