/**
 * Shared header/footer loader with www i18n support.
 * Requires jQuery, www-i18n.js (optional but recommended).
 * @param {object} [options]
 * @param {string} [options.title] - Text for #title in navbar brand
 */
function loadSiteChromeWithI18n(options = {}) {
    const titleText = options.title || '';

    $('#header').load('includes/header.html', function () {
        const titleEl = document.getElementById('title');
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

    $('#footer').load('includes/footer.html', function () {
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(document.getElementById('footer'));
        }
        if (typeof Iconify !== 'undefined' && Iconify.scan) {
            Iconify.scan(document.getElementById('footer'));
        }
    });
}
