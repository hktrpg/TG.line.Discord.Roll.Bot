/**
 * Public session log discovery page.
 */
/* global SessionLogApi, SessionLogCover */
const SessionLogExplorePage = {
    safe: true,
    sort: 'latest',

    t(key, options) {
        return typeof window.wwwT === 'function' ? window.wwwT(key, options) : key;
    },

    esc(text) {
        return String(text ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
    },

    renderCard(log) {
        const messageLabel = this.t('trpg_logs_messages', { count: log.messageCount || 0 });
        const ratingKey = `trpg_rating_${log.rating || 'general'}`;
        const coverHtml = SessionLogCover.renderCoverArt(log);
        const synopsis = log.synopsis ? `<p class="trpg-explore-card-synopsis">${this.esc(log.synopsis.slice(0, 100))}${log.synopsis.length > 100 ? '…' : ''}</p>` : '';

        return `
            <a class="trpg-log-card" href="/logs/${this.esc(log.id)}">
                <div class="trpg-log-card-cover">
                    ${coverHtml}
                    <span class="trpg-status-badge trpg-status-badge-rating">${this.esc(this.t(ratingKey))}</span>
                    <span class="trpg-log-card-tag trpg-log-card-tag-right">${this.esc(messageLabel)}</span>
                    <div class="trpg-log-card-caption">
                        <strong class="trpg-log-card-title">${this.esc(log.title)}</strong>
                        ${log.subtitle ? `<span class="trpg-log-card-sub">${this.esc(log.subtitle)}</span>` : ''}
                    </div>
                </div>
                ${synopsis}
            </a>`;
    },

    async load() {
        const grid = document.getElementById('exploreGrid');
        if (!grid) return;

        grid.innerHTML = `<p class="trpg-msg-muted">${this.esc(this.t('trpg_view_loading'))}</p>`;

        try {
            const params = { sort: this.sort, limit: 50 };
            if (this.safe) params.safe = 1;
            const data = await SessionLogApi.listPublicLogs(params);
            const logs = data.logs || [];
            grid.innerHTML = logs.length
                ? logs.map((log) => this.renderCard(log)).join('')
                : `<p class="trpg-msg-muted">${this.esc(this.t('trpg_explore_empty'))}</p>`;
        } catch (error) {
            grid.innerHTML = `<p class="trpg-msg-error">${this.esc(error.message || this.t('trpg_explore_error'))}</p>`;
        }
    },

    bindEvents() {
        const safeFilter = document.getElementById('exploreSafeFilter');
        if (safeFilter) {
            safeFilter.addEventListener('change', () => {
                this.safe = safeFilter.checked;
                this.load();
            });
        }

        const sortSelect = document.getElementById('exploreSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sort = sortSelect.value;
                this.load();
            });
        }
    },

    async init() {
        this.bindEvents();
        await this.load();
    },
};

window.SessionLogExplorePage = SessionLogExplorePage;

window.initSessionLogExplorePage = async function initSessionLogExplorePage() {
    await SessionLogExplorePage.init();
};
