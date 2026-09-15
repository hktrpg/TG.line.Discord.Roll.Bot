/**
 * Shared bootstrap for TRPG Hub pages: i18n, site chrome, theme.
 */
async function initTrpgHubPage(options = {}) {
    const { titleKey } = options;
    if (window.wwwI18n?.ready) {
        await window.wwwI18n.ready;
    }
    if (typeof wwwApplyDomI18n === 'function') {
        wwwApplyDomI18n(document.body);
    }
    if (titleKey && typeof wwwT === 'function') {
        const title = wwwT(titleKey);
        if (title && !title.startsWith('www.')) {
            document.title = title;
        }
    }
    if (typeof loadSiteChromeWithI18n === 'function') {
        loadSiteChromeWithI18n({ title: 'HKTRPG' });
    }
    if (window.wwwThemeManager) {
        window.wwwThemeManager.init();
    }
    initHubFilterTabs();
}

function initHubFilterTabs() {
    for (const tabBar of document.querySelectorAll('.trpg-filter-tabs')) {
        const grid = tabBar.nextElementSibling;
        if (!grid?.classList.contains('trpg-poster-grid')) {
            continue;
        }
        for (const btn of tabBar.querySelectorAll('[data-filter]')) {
            btn.addEventListener('click', () => {
                for (const b of tabBar.querySelectorAll('[data-filter]')) {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                }
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                const filter = btn.dataset.filter;
                for (const card of grid.querySelectorAll('.trpg-poster-card')) {
                    const show = filter === 'all' || card.dataset.cat === filter;
                    card.hidden = !show;
                }
            });
        }
    }
}

window.initTrpgHubPage = initTrpgHubPage;
