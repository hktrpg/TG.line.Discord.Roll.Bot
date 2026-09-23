/**
 * Shared session log cover art: theme placeholder + optional image with broken-URL fallback.
 */
const SessionLogCover = {
    DEFAULT_HUB_POSTER: '/image/hub/poster-default.svg',

    HUB_POSTERS: {
        logs: '/image/hub/poster-logs.svg',
        cards: '/image/hub/poster-cards.svg',
        roll: '/image/hub/poster-roll.svg',
        tools: '/image/hub/poster-tools.svg',
        guide: '/image/hub/poster-guide.svg',
        news: '/image/hub/poster-news.svg',
    },

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

    logThemeArtClass(theme) {
        const allowed = ['kakuyomu', 'kindle', 'parchment', 'notion', 'letter', 'script', 'discord', 'chat', 'term'];
        return allowed.includes(theme) ? theme : 'kakuyomu';
    },

    logThemeIcon(theme) {
        const icons = {
            kakuyomu: 'mdi:book-open-page-variant',
            kindle: 'mdi:book-outline',
            parchment: 'mdi:scroll-text',
            notion: 'mdi:note-text-outline',
            letter: 'mdi:email-newsletter',
            script: 'mdi:script-text-outline',
            discord: 'mdi:chat-outline',
            chat: 'mdi:message-text-outline',
            term: 'mdi:console',
        };
        const resolved = this.logThemeArtClass(theme);
        return icons[resolved] || icons.kakuyomu;
    },

    renderThemeArt(log, options = {}) {
        const { demo = false, extraClass = '' } = options;
        const theme = this.logThemeArtClass(log?.theme);
        const themeLabel = demo ? '' : this.t(`trpg_theme_${theme}`);
        const leftTag = demo ? this.t('trpg_logs_demo_badge') : themeLabel;
        const tagHtml = leftTag
            ? `<span class="trpg-log-card-tag trpg-log-card-tag-left${demo ? ' trpg-log-card-tag-demo' : ''}">${this.esc(leftTag)}</span>`
            : '';
        return `
            ${tagHtml}
            <div class="trpg-log-card-art trpg-log-card-art-${theme}${extraClass ? ` ${extraClass}` : ''}" aria-hidden="true">
                <span class="iconify trpg-log-card-icon" data-icon="${this.logThemeIcon(theme)}" data-width="46"></span>
            </div>`;
    },

    renderCoverArt(log, options = {}) {
        const coverUrl = String(log?.coverUrl || '').trim();
        if (!coverUrl) {
            return this.renderThemeArt(log, options);
        }
        const fallback = this.renderThemeArt(log, { ...options, extraClass: 'trpg-cover-fallback-layer' });
        return `
            <div class="trpg-cover-stack">
                ${fallback}
                <img class="trpg-log-card-cover-img" src="${this.esc(coverUrl)}" alt="" data-session-log-cover-img>
            </div>`;
    },

    renderHeroCover(log, theme) {
        const coverUrl = String(log?.coverUrl || '').trim();
        if (!coverUrl) {
            return `
                <span class="iconify" data-icon="${this.logThemeIcon(theme)}" data-width="48"></span>
                <span class="session-log-hero-cover-title">${this.esc(log.title)}</span>`;
        }
        const themeArt = this.logThemeArtClass(theme);
        return `
            <div class="trpg-cover-stack trpg-cover-stack-hero">
                <div class="trpg-log-card-art trpg-log-card-art-${themeArt} trpg-cover-fallback-layer session-log-hero-cover-fallback" aria-hidden="true">
                    <span class="iconify" data-icon="${this.logThemeIcon(theme)}" data-width="48"></span>
                </div>
                <img class="trpg-log-card-cover-img session-log-hero-cover-img" src="${this.esc(coverUrl)}" alt="" data-session-log-cover-img>
            </div>`;
    },

    hubPosterImg(kind) {
        const src = this.HUB_POSTERS[kind] || this.DEFAULT_HUB_POSTER;
        return `<img class="trpg-poster-bg" src="${src}" alt="" data-hub-poster-img loading="lazy" decoding="async">`;
    },

    bindCoverImageFallbacks(root = document) {
        if (root.__sessionLogCoverBound) {
            return;
        }
        root.__sessionLogCoverBound = true;
        root.addEventListener('error', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLImageElement)) {
                return;
            }
            if (target.dataset.sessionLogCoverImg !== undefined) {
                target.remove();
                return;
            }
            if (target.dataset.hubPosterImg !== undefined) {
                if (target.src.includes('poster-default.svg')) {
                    target.remove();
                    return;
                }
                target.src = SessionLogCover.DEFAULT_HUB_POSTER;
            }
        }, true);
    },
};

window.SessionLogCover = SessionLogCover;
