/**
 * Browser i18n helper for HKTRPG web views (character card, roll UI).
 * Loads flattened strings from /api/www-i18n.
 * Load /common/www-locale-head.js in <head> for early browser-language detection.
 */
class WwwI18n {
    constructor() {
        this.locale = typeof resolveWwwLocale === 'function'
            ? resolveWwwLocale()
            : this.fallbackResolveLocale();
        this.strings = {};
        this.fallback = {};
        this.ready = this.init();
    }

    fallbackResolveLocale() {
        try {
            const params = new URLSearchParams(globalThis.location.search);
            const fromQuery = params.get('lang');
            if (fromQuery) {
                return fromQuery.toLowerCase().startsWith('en') ? 'en' : 'zh-tw';
            }
            const saved = localStorage.getItem('wwwLocale');
            if (saved) {
                return saved.toLowerCase().startsWith('en') ? 'en' : 'zh-tw';
            }
        } catch {
            // ignore
        }
        const langs = (navigator.languages?.length)
            ? navigator.languages
            : [navigator.language].filter(Boolean);
        for (const lang of langs) {
            const value = String(lang || '').toLowerCase();
            if (value.startsWith('en')) return 'en';
            if (value.startsWith('zh')) return 'zh-tw';
        }
        return 'zh-tw';
    }

    async init() {
        try {
            const res = await fetch(`/api/www-i18n?lang=${encodeURIComponent(this.locale)}`);
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            this.locale = data.locale || this.locale;
            this.strings = data.strings || {};
            this.fallback = data.fallback || {};
            document.documentElement.lang = typeof wwwLocaleToHtmlLang === 'function'
                ? wwwLocaleToHtmlLang(this.locale)
                : this.locale;
            document.documentElement.dataset.wwwLocale = this.locale;
            this.applyDomI18n(document);
            await ensureWwwLocaleSwitcher();
        } catch (error) {
            console.warn('[www-i18n] Failed to load locale bundle:', error.message);
        }
    }

    t(key, options = {}) {
        const fullKey = key.includes('.') ? key : `www.views.${key}`;
        let text = this.strings[fullKey]
            ?? this.fallback[fullKey]
            ?? this.strings[key]
            ?? this.fallback[key]
            ?? fullKey;
        for (const [name, value] of Object.entries(options)) {
            text = text.split(`{{${name}}}`).join(String(value));
        }
        return text;
    }

    applyDomI18n(root) {
        if (!root) return;
        const t = (key, options) => this.t(key, options);

        for (const el of root.querySelectorAll('[data-www-i18n]')) {
            const key = el.getAttribute('data-www-i18n');
            if (!key) continue;
            el.textContent = t(key);
        }
        for (const el of root.querySelectorAll('[data-www-i18n-html]')) {
            const key = el.getAttribute('data-www-i18n-html');
            if (!key) continue;
            el.innerHTML = t(key);
        }
        for (const el of root.querySelectorAll('[data-www-i18n-placeholder]')) {
            const key = el.getAttribute('data-www-i18n-placeholder');
            if (!key) continue;
            el.setAttribute('placeholder', t(key));
        }
        for (const el of root.querySelectorAll('[data-www-i18n-title]')) {
            const key = el.getAttribute('data-www-i18n-title');
            if (!key) continue;
            el.setAttribute('title', t(key));
        }
        for (const el of root.querySelectorAll('[data-www-i18n-aria]')) {
            const key = el.getAttribute('data-www-i18n-aria');
            if (!key) continue;
            el.setAttribute('aria-label', t(key));
        }
        for (const el of root.querySelectorAll('[data-www-i18n-content]')) {
            const key = el.getAttribute('data-www-i18n-content');
            if (!key) continue;
            el.setAttribute('content', t(key));
        }
    }
}

window.wwwI18n = new WwwI18n();

/**
 * @param {string} key - www.views.* or character.validation_* key
 * @param {object} [options]
 * @returns {string}
 */
function wwwT(key, options) {
    return window.wwwI18n.t(key, options);
}

/**
 * Apply data-www-i18n* attributes under root (after dynamic HTML load).
 * @param {ParentNode} [root]
 */
function wwwApplyDomI18n(root) {
    window.wwwI18n.applyDomI18n(root || document);
}

/**
 * Current www locale (sync; uses early head detection before bundle load).
 * @returns {string}
 */
function getWwwLocale() {
    if (typeof resolveWwwLocale === 'function') {
        return resolveWwwLocale();
    }
    return window.wwwI18n?.locale || 'zh-tw';
}

/**
 * Socket.io client options with lang query for server-side i18n.
 * @param {object} [extraOptions]
 * @returns {object}
 */
function getWwwSocketIoOptions(extraOptions = {}) {
    const locale = getWwwLocale();
    return {
        ...extraOptions,
        query: {
            ...(extraOptions.query || {}),
            lang: locale
        }
    };
}

/**
 * Page-scoped wwwT helper that avoids double-prefixing.
 * @param {string} prefix - e.g. 'bus_', 'cardtest_'
 * @param {string} key
 * @param {object} [options]
 * @returns {string}
 */
function wwwPrefixT(prefix, key, options) {
    if (typeof wwwT !== 'function') {
        return key;
    }
    if (key.startsWith('www.') || (prefix && key.startsWith(prefix))) {
        return wwwT(key, options);
    }
    return wwwT(prefix ? `${prefix}${key}` : key, options);
}

window.getWwwLocale = getWwwLocale;
window.getWwwSocketIoOptions = getWwwSocketIoOptions;
window.wwwPrefixT = wwwPrefixT;

/**
 * Switch www locale and reload page (persists in localStorage + ?lang=).
 * @param {string} locale
 */
function setWwwLocale(locale) {
    const normalized = typeof normalizeWwwLocale === 'function'
        ? (normalizeWwwLocale(locale) || 'zh-tw')
        : (String(locale).toLowerCase().startsWith('en') ? 'en' : 'zh-tw');
    try {
        localStorage.setItem('wwwLocale', normalized);
    } catch {
        // ignore
    }
    const url = new URL(globalThis.location.href);
    url.searchParams.set('lang', normalized);
    globalThis.location.href = url.toString();
}

/**
 * Wire language dropdown in shared header (#www-locale-switcher) or floating fab (#www-locale-switcher-fab).
 * @param {ParentNode} [root]
 */
function initWwwLocaleSwitcher(root) {
    const containers = [];
    if (root) {
        const el = root.querySelector('#www-locale-switcher, #www-locale-switcher-fab');
        if (el) containers.push(el);
    } else {
        for (const el of document.querySelectorAll('#www-locale-switcher, #www-locale-switcher-fab')) {
            containers.push(el);
        }
    }
    if (containers.length === 0) return;

    const locale = window.wwwI18n?.locale || 'zh-tw';

    for (const container of containers) {
        if (!container.dataset.wwwLocaleItemsBound) {
            container.dataset.wwwLocaleItemsBound = '1';
            for (const el of container.querySelectorAll('[data-www-locale]')) {
                const itemLocale = el.getAttribute('data-www-locale');
                el.classList.toggle('active', itemLocale === locale);
                el.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (itemLocale && itemLocale !== locale) {
                        setWwwLocale(itemLocale);
                    }
                });
            }
        } else {
            for (const el of container.querySelectorAll('[data-www-locale]')) {
                const itemLocale = el.getAttribute('data-www-locale');
                el.classList.toggle('active', itemLocale === locale);
            }
        }

        const toggle = container.querySelector('[data-www-locale-toggle]');
        const menu = container.querySelector('[data-www-locale-menu]');
        if (toggle && menu) {
            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const open = menu.classList.toggle('www-locale-fab-menu-open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            if (!container.dataset.wwwLocaleFabBound) {
                container.dataset.wwwLocaleFabBound = '1';
                document.addEventListener('click', () => {
                    menu.classList.remove('www-locale-fab-menu-open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
                menu.addEventListener('click', (event) => event.stopPropagation());
            }
        }
    }
}

function injectWwwLocaleFabStyles() {
    if (document.getElementById('www-locale-fab-styles')) return;
    const style = document.createElement('style');
    style.id = 'www-locale-fab-styles';
    style.textContent = `
#www-locale-switcher-fab {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 1200;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
#www-locale-switcher-fab .www-locale-fab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: #343a40;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transition: background 0.15s ease, transform 0.15s ease;
}
#www-locale-switcher-fab .www-locale-fab-btn:hover {
    background: #495057;
    transform: scale(1.05);
}
#www-locale-switcher-fab .www-locale-fab-menu {
    display: none;
    position: absolute;
    bottom: 52px;
    right: 0;
    min-width: 140px;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    overflow: hidden;
}
#www-locale-switcher-fab .www-locale-fab-menu.www-locale-fab-menu-open {
    display: block;
}
#www-locale-switcher-fab .www-locale-fab-menu a {
    display: block;
    padding: 10px 14px;
    color: #212529;
    text-decoration: none;
    font-size: 14px;
}
#www-locale-switcher-fab .www-locale-fab-menu a:hover,
#www-locale-switcher-fab .www-locale-fab-menu a.active {
    background: #e9ecef;
}
`;
    document.head.appendChild(style);
}

function mountWwwLocaleSwitcherFab() {
    if (document.getElementById('www-locale-switcher-fab')) return null;
    injectWwwLocaleFabStyles();
    const fab = document.createElement('div');
    fab.id = 'www-locale-switcher-fab';
    fab.innerHTML = `
<button type="button" class="www-locale-fab-btn" data-www-locale-toggle
    data-www-i18n-title="nav_language" data-www-i18n-aria="nav_language"
    title="Language" aria-label="Language" aria-haspopup="true" aria-expanded="false">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>
</button>
<div class="www-locale-fab-menu" data-www-locale-menu>
    <a href="#" data-www-locale="zh-tw" data-www-i18n="nav_lang_zh_tw">繁體中文</a>
    <a href="#" data-www-locale="en" data-www-i18n="nav_lang_en">English</a>
</div>`;
    document.body.appendChild(fab);
    if (typeof wwwApplyDomI18n === 'function') {
        wwwApplyDomI18n(fab);
    }
    return fab;
}

function removeWwwLocaleSwitcherFab() {
    const fab = document.getElementById('www-locale-switcher-fab');
    if (fab) fab.remove();
}

/**
 * Mount floating locale switcher when shared header is absent; wire navbar switcher when present.
 */
async function ensureWwwLocaleSwitcher() {
    const headerPlaceholder = document.getElementById('header');
    if (headerPlaceholder && !document.getElementById('www-locale-switcher')) {
        await new Promise((resolve) => setTimeout(resolve, 800));
    }

    if (document.getElementById('www-locale-switcher')) {
        removeWwwLocaleSwitcherFab();
        initWwwLocaleSwitcher();
        return;
    }

    const fab = mountWwwLocaleSwitcherFab();
    if (fab) {
        initWwwLocaleSwitcher(fab);
    }
}
