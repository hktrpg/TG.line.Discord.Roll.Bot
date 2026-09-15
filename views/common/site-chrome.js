/**
 * Shared header/footer loader with www i18n support.
 * Requires jQuery, www-i18n.js (optional but recommended).
 * @param {object} [options]
 * @param {string} [options.title] - Text for #title in navbar brand
 * @param {function} [options.titleResolver] - Called when header HTML is ready (wins over options.title)
 */
const WWW_BOOTSTRAP_SCRIPTS = [
    {
        src: 'https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js',
        integrity: 'sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN',
    },
    {
        src: 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
        integrity: 'sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV',
    },
];

function loadScriptSequentially(scripts) {
    return scripts.reduce((chain, script) => chain.then(() => new Promise((resolve) => {
        const el = document.createElement('script');
        el.src = script.src;
        el.crossOrigin = 'anonymous';
        if (script.integrity) {
            el.integrity = script.integrity;
        }
        el.addEventListener('load', () => resolve(), { once: true });
        el.addEventListener('error', () => resolve(), { once: true });
        document.head.append(el);
    })), Promise.resolve());
}

function ensureBootstrap4() {
    if (window.jQuery && typeof window.jQuery.fn.dropdown === 'function') {
        return Promise.resolve();
    }
    if (!window.jQuery) {
        return Promise.resolve();
    }
    if (window.__wwwBootstrapLoading) {
        return window.__wwwBootstrapLoading;
    }
    window.__wwwBootstrapLoading = loadScriptSequentially(WWW_BOOTSTRAP_SCRIPTS);
    return window.__wwwBootstrapLoading;
}

function mountSiteChrome(options = {}) {
    const resolveTitle = () => {
        if (typeof options.titleResolver === 'function') {
            return options.titleResolver() || '';
        }
        return options.title || '';
    };

    $('#header').load('/includes/header.html', function () {
        const titleEl = document.getElementById('title');
        const titleText = resolveTitle();
        if (titleEl && titleText) {
            titleEl.textContent = titleText;
        }
        if (typeof removeWwwLocaleSwitcherFab === 'function') {
            removeWwwLocaleSwitcherFab();
        }
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(document.getElementById('header'));
        }
        if (typeof initWwwLocaleSwitcher === 'function') {
            initWwwLocaleSwitcher(document.getElementById('header'));
        }
        if (typeof Iconify !== 'undefined' && Iconify.scan) {
            Iconify.scan(document.getElementById('header'));
        }
    });

    $('#footer').load('/includes/footer.html', function () {
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(document.getElementById('footer'));
        }
        if (typeof Iconify !== 'undefined' && Iconify.scan) {
            Iconify.scan(document.getElementById('footer'));
        }
    });
}

function loadSiteChromeWithI18n(options = {}) {
    ensureBootstrap4().then(() => {
        mountSiteChrome(options);
    });
}

window.ensureBootstrap4 = ensureBootstrap4;
window.loadSiteChromeWithI18n = loadSiteChromeWithI18n;
