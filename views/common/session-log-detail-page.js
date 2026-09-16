/**
 * Session log detail / landing page — Qidian-style hero, links to reader.
 */
/* global SessionLogReader, SessionLogApi */
const SessionLogDetailPage = {
    log: null,
    chapters: [],
    logId: '',
    shareToken: '',

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

    buildChapters() {
        const events = this.log?.events || [];
        this.chapters = SessionLogReader.splitIntoChapters(events);
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

    getSynopsis() {
        const events = this.log?.events || [];
        const narration = events.find((event) => event.type === 'narration' && event.text);
        const text = narration?.text || this.log?.subtitle || '';
        if (text.length <= 150) return text;
        return `${text.slice(0, 150)}…`;
    },

    buildReadUrl() {
        const query = this.shareToken ? `?token=${encodeURIComponent(this.shareToken)}` : '';
        return `/logs/${encodeURIComponent(this.logId)}/read${query}`;
    },

    renderHero() {
        const hero = document.getElementById('sessionLogHero');
        if (!hero || !this.log) return;

        const log = this.log;
        const theme = this.logThemeArtClass(log.theme);
        const themeLabel = SessionLogReader.themeLabel(theme);
        const messageCount = log.messageCount ?? (log.events || []).length;
        const firstChapter = this.chapters[0] || { title: '' };
        const players = log.playerNames || [];
        const lead = players[0] || 'KP';
        const synopsis = this.getSynopsis();
        const tags = [
            log.isDemo ? this.t('trpg_logs_demo_badge') : '',
            themeLabel,
            log.subtitle ? log.subtitle.split('·')[0].trim() : '',
            log.location || '',
        ].filter(Boolean);
        const tagsHtml = tags.map((tag) => `<span class="session-log-hero-tag">${this.esc(tag)}</span>`).join('');
        const castHtml = players.slice(0, 6).map((name) => `
            <span class="session-log-hero-cast-item">${this.esc(name)}</span>`).join('');

        hero.innerHTML = `
            <div class="session-log-hero-cover trpg-log-card-art-${theme}" aria-hidden="true">
                <span class="iconify" data-icon="${this.logThemeIcon(theme)}" data-width="48"></span>
                <span class="session-log-hero-cover-title">${this.esc(log.title)}</span>
            </div>
            <div class="session-log-hero-main">
                <h1 class="session-log-hero-title">${this.esc(log.title)}</h1>
                <p class="session-log-hero-meta">
                    ${this.esc(log.sessionDate || '')}
                    ${log.subtitle ? ` · ${this.esc(log.subtitle)}` : ''}
                </p>
                <p class="session-log-hero-latest">
                    ${this.esc(this.t('trpg_reader_latest_chapter', {
                        num: 1,
                        title: firstChapter.title,
                    }))}
                </p>
                <div class="session-log-hero-tags">${tagsHtml}</div>
                ${synopsis ? `<p class="session-log-hero-synopsis">${this.esc(synopsis)}</p>` : ''}
                <div class="session-log-hero-stats">
                    <span><strong>${this.esc(this.t('trpg_logs_messages', { count: messageCount }))}</strong></span>
                    <span><strong>${this.esc(this.t('trpg_reader_chapter_count', { count: this.chapters.length }))}</strong></span>
                    ${log.charCount ? `<span><strong>${this.esc(this.t('trpg_reader_char_count', { count: log.charCount }))}</strong></span>` : ''}
                </div>
                <div class="session-log-hero-actions">
                    <a class="session-log-hero-btn session-log-hero-btn-primary" href="${this.esc(this.buildReadUrl())}">
                        ${this.esc(this.t('trpg_reader_start_read'))}
                    </a>
                </div>
            </div>
            <aside class="session-log-hero-side">
                <div class="session-log-hero-avatar" aria-hidden="true">
                    <span class="iconify" data-icon="mdi:account-circle" data-width="52"></span>
                </div>
                <strong class="session-log-hero-side-name">${this.esc(lead)}</strong>
                <p class="session-log-hero-side-role">${this.esc(this.t('trpg_reader_hero_cast'))}</p>
                <div class="session-log-hero-cast">${castHtml}</div>
                <dl class="session-log-hero-side-stats">
                    <div><dt>${this.esc(this.t('trpg_reader_info_messages'))}</dt><dd>${messageCount}</dd></div>
                    <div><dt>${this.esc(this.t('trpg_reader_info_chapters'))}</dt><dd>${this.chapters.length}</dd></div>
                    <div><dt>${this.esc(this.t('trpg_reader_hero_players'))}</dt><dd>${players.length}</dd></div>
                </dl>
            </aside>`;
    },

    async load(logId, shareToken) {
        this.logId = logId;
        this.shareToken = shareToken || '';
        this.log = await SessionLogApi.getLog(logId, shareToken);
        this.buildChapters();
        document.title = `${this.log.title} · HKTRPG`;
        this.renderHero();
    },

    async init(logId, shareToken) {
        try {
            await this.load(logId, shareToken);
        } catch (error) {
            const hero = document.getElementById('sessionLogHero');
            if (hero) {
                hero.innerHTML = `<p class="session-log-hero-error">${this.esc(error.status === 403
                    ? this.t('trpg_view_forbidden')
                    : this.t('trpg_view_not_found'))}</p>`;
            }
        }
    },
};

if (typeof window !== 'undefined') {
    window.SessionLogDetailPage = SessionLogDetailPage;

    window.initSessionLogDetailPage = async function initSessionLogDetailPage(logId, shareToken) {
        await SessionLogDetailPage.init(logId, shareToken);
    };
}
