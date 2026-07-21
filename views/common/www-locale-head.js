/**
 * Early www locale detection — load in <head> before body so <html lang> matches browser language.
 * Priority: ?lang= → shared cookie (*.hktrpg.com) → localStorage → navigator.languages → defaultLocale
 *
 * Language is stored in a Domain=.hktrpg.com cookie so card / rollbot / bus / patreon
 * subdomains share one preference (localStorage alone is per-origin).
 *
 * window.HKTRPG_LOCALES is injected by core-www before this file body (from lang/locales.json).
 */
(function (global) {
    'use strict';

    const COOKIE_NAME = 'wwwLocale';
    const COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60;

    const meta = global.HKTRPG_LOCALES || {
        defaultLocale: 'zh-tw',
        supported: ['zh-tw', 'en', 'zh-hans'],
        definitions: {
            'zh-tw': { prefixes: ['zh-tw', 'zh'], intl: 'zh-Hant-HK', name: '正體中文' },
            en: { prefixes: ['en'], intl: 'en', name: 'English' },
            'zh-hans': { prefixes: ['zh-hans'], intl: 'zh-Hans', name: '简体中文' }
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
                if (value === prefix || value.startsWith(`${prefix}-`) || value.startsWith(prefix)) {
                    prefixHits.push({ code, length: prefix.length });
                }
            }
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

    /**
     * Cookie Domain for cross-subdomain share. Empty = host-only (localhost / IP / other domains).
     * @returns {string}
     */
    function getWwwLocaleCookieDomain() {
        const host = global.location?.hostname || '';
        if (!host || host === 'localhost' || host === '127.0.0.1') {
            return '';
        }
        if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
            return '';
        }
        if (host === 'hktrpg.com' || host.endsWith('.hktrpg.com')) {
            return '.hktrpg.com';
        }
        return '';
    }

    function readWwwLocaleCookie() {
        try {
            const cookies = global.document?.cookie || '';
            const parts = cookies.split(';');
            for (const part of parts) {
                const trimmed = part.trim();
                if (!trimmed.startsWith(`${COOKIE_NAME}=`)) continue;
                return decodeURIComponent(trimmed.slice(COOKIE_NAME.length + 1));
            }
        } catch {
            // ignore
        }
        return null;
    }

    function writeWwwLocaleCookie(locale) {
        try {
            if (!global.document) return;
            const domain = getWwwLocaleCookieDomain();
            let cookie = `${COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
            if (domain) {
                cookie += `; Domain=${domain}`;
            }
            if (global.location?.protocol === 'https:') {
                cookie += '; Secure';
            }
            global.document.cookie = cookie;
        } catch {
            // ignore
        }
    }

    /**
     * Persist locale for all HKTRPG www pages (cookie + localStorage).
     * @param {string} locale
     */
    function persistWwwLocale(locale) {
        const normalized = normalizeWwwLocale(locale) || getDefaultLocale();
        writeWwwLocaleCookie(normalized);
        try {
            global.localStorage.setItem(COOKIE_NAME, normalized);
        } catch {
            // ignore
        }
        return normalized;
    }

    function resolveWwwLocale() {
        try {
            const fromQuery = normalizeWwwLocale(
                new URLSearchParams(global.location.search).get('lang')
            );
            if (fromQuery) {
                persistWwwLocale(fromQuery);
                return fromQuery;
            }

            const fromCookie = normalizeWwwLocale(readWwwLocaleCookie());
            if (fromCookie) {
                // Keep localStorage in sync on this origin
                try {
                    global.localStorage.setItem(COOKIE_NAME, fromCookie);
                } catch {
                    // ignore
                }
                return fromCookie;
            }

            const fromSaved = normalizeWwwLocale(global.localStorage.getItem(COOKIE_NAME));
            if (fromSaved) {
                // Migrate old per-origin preference to shared cookie
                writeWwwLocaleCookie(fromSaved);
                return fromSaved;
            }
        } catch {
            // ignore
        }

        const langs = (global.navigator?.languages?.length)
            ? global.navigator.languages
            : [global.navigator?.language].filter(Boolean);
        for (const lang of langs) {
            const resolved = normalizeWwwLocale(lang);
            if (resolved) {
                persistWwwLocale(resolved);
                return resolved;
            }
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
    global.persistWwwLocale = persistWwwLocale;
    global.HKTRPG_LOCALES = meta;

    if (global.document?.documentElement) {
        applyEarlyWwwHtmlLang();
    }
})(typeof globalThis === 'undefined' ? window : globalThis);
