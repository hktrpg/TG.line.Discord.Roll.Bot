/**
 * Public author profile page.
 */
/* global SessionLogApi */
const SessionLogAuthorPage = {
    slug: '',

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
        return icons[this.logThemeArtClass(theme)] || icons.kakuyomu;
    },

    renderWorkCard(log) {
        const theme = this.logThemeArtClass(log.theme);
        const messageLabel = this.t('trpg_logs_messages', { count: log.messageCount || 0 });
        const coverHtml = log.coverUrl
            ? `<img class="trpg-log-card-cover-img" src="${this.esc(log.coverUrl)}" alt="">`
            : `<div class="trpg-log-card-art trpg-log-card-art-${theme}" aria-hidden="true">
                <span class="iconify trpg-log-card-icon" data-icon="${this.logThemeIcon(theme)}" data-width="46"></span>
               </div>`;

        return `
            <a class="trpg-log-card" href="/logs/${this.esc(log.id)}">
                <div class="trpg-log-card-cover">
                    ${coverHtml}
                    <span class="trpg-log-card-tag trpg-log-card-tag-right">${this.esc(messageLabel)}</span>
                    <div class="trpg-log-card-caption">
                        <strong class="trpg-log-card-title">${this.esc(log.title)}</strong>
                        ${log.subtitle ? `<span class="trpg-log-card-sub">${this.esc(log.subtitle)}</span>` : ''}
                    </div>
                </div>
            </a>`;
    },

    renderHero(author) {
        const hero = document.getElementById('authorHero');
        if (!hero) return;

        const avatarHtml = author.avatarUrl
            ? `<img class="trpg-author-avatar" src="${this.esc(author.avatarUrl)}" alt="">`
            : `<span class="iconify trpg-author-avatar-icon" data-icon="mdi:account-circle" data-width="64"></span>`;

        hero.innerHTML = `
            <div class="trpg-author-hero">
                ${avatarHtml}
                <div>
                    <h1>${this.esc(author.penName)}</h1>
                    ${author.bio ? `<p class="trpg-console-lead">${this.esc(author.bio)}</p>` : ''}
                </div>
            </div>`;
        document.title = `${author.penName} · ${this.t('trpg_author_page_title')}`;
    },

    async load(slug) {
        this.slug = slug;
        const grid = document.getElementById('authorWorksGrid');
        const hero = document.getElementById('authorHero');

        try {
            const data = await SessionLogApi.getAuthor(slug);
            this.renderHero(data.author);
            const works = data.works || [];
            if (grid) {
                grid.innerHTML = works.length
                    ? works.map((log) => this.renderWorkCard(log)).join('')
                    : `<p class="trpg-msg-muted">${this.esc(this.t('trpg_author_no_works'))}</p>`;
            }
        } catch (error) {
            if (hero) {
                hero.innerHTML = `<p class="trpg-msg-error">${this.esc(this.t('trpg_author_not_found'))}</p>`;
            }
            if (grid) grid.innerHTML = '';
        }
    },

    async init(slug) {
        await this.load(slug);
    },
};

window.SessionLogAuthorPage = SessionLogAuthorPage;

window.initSessionLogAuthorPage = async function initSessionLogAuthorPage(slug) {
    await SessionLogAuthorPage.init(slug);
};
