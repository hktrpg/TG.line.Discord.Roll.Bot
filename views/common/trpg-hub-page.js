/* global SessionLogCover */
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
    if (window.SessionLogCover) {
        SessionLogCover.bindCoverImageFallbacks(document);
    }
    initHubFilterTabs();
    await loadHubFeaturedDemos();
}

async function loadHubFeaturedDemos() {
    const grid = document.getElementById('hubDemoGrid');
    if (!grid || !window.SessionLogCover) {
        return;
    }

    const loading = typeof wwwT === 'function' ? wwwT('trpg_view_loading') : '…';
    grid.innerHTML = `<p class="trpg-msg-muted">${loading}</p>`;

    try {
        const response = await fetch('/api/session-logs/demos');
        if (!response.ok) {
            throw new Error('demos');
        }
        const data = await response.json();
        const logs = (data.logs || []).slice(0, 8);
        if (logs.length === 0) {
            grid.innerHTML = '';
            return;
        }
        grid.innerHTML = logs.map((log) => renderHubDemoCard(log)).join('');
    } catch {
        grid.innerHTML = '';
    }
}

function renderHubDemoCard(log) {
    const esc = (text) => SessionLogCover.esc(text);
    const messageLabel = typeof wwwT === 'function'
        ? wwwT('trpg_logs_messages', { count: log.messageCount || 0 })
        : '';
    const captionSub = log.subtitle || [log.sessionDate, log.location].filter(Boolean).join(' · ');

    return `
        <a class="trpg-log-card trpg-log-card-demo" href="/logs/${esc(log.id)}">
            <div class="trpg-log-card-cover">
                ${SessionLogCover.renderCoverArt(log, { demo: true })}
                <span class="trpg-log-card-tag trpg-log-card-tag-right">${esc(messageLabel)}</span>
                <div class="trpg-log-card-caption">
                    <strong class="trpg-log-card-title">${esc(log.title)}</strong>
                    ${captionSub ? `<span class="trpg-log-card-sub">${esc(captionSub)}</span>` : ''}
                </div>
            </div>
        </a>`;
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
