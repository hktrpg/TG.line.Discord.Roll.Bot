/**
 * Session log detail / landing page — Qidian-style hero, links to reader.
 */
/* global SessionLogReader, SessionLogApi */
const SessionLogDetailPage = {
    log: null,
    chapters: [],
    logId: '',
    shareToken: '',
    ageGateAccepted: false,

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
        if (this.log?.synopsis) {
            const text = this.log.synopsis;
            if (text.length <= 150) return text;
            return `${text.slice(0, 150)}…`;
        }
        const events = this.log?.events || [];
        const narration = events.find((event) => event.type === 'narration' && event.text);
        const text = narration?.text || this.log?.subtitle || '';
        if (text.length <= 150) return text;
        return `${text.slice(0, 150)}…`;
    },

    needsAgeGate() {
        if (!this.log) return false;
        if (this.log.isOwner) return false;
        if (this.log.rating !== 'r18') return false;
        if (localStorage.getItem('sessionLogAgeOk') === '1') return false;
        return !this.ageGateAccepted;
    },

    renderAgeGate() {
        const existing = document.getElementById('sessionLogAgeGate');
        if (existing) existing.remove();
        if (!this.needsAgeGate()) return;

        const overlay = document.createElement('div');
        overlay.id = 'sessionLogAgeGate';
        overlay.className = 'session-log-age-gate';
        overlay.innerHTML = `
            <div class="session-log-age-gate-box">
                <h2>${this.esc(this.t('trpg_age_gate_title'))}</h2>
                <p>${this.esc(this.t('trpg_age_gate_desc'))}</p>
                <div class="session-log-age-gate-actions">
                    <button type="button" class="trpg-btn-primary" id="ageGateConfirm">${this.esc(this.t('trpg_age_gate_confirm'))}</button>
                    <a href="/explore/logs" class="trpg-btn-sm">${this.esc(this.t('trpg_age_gate_leave'))}</a>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        overlay.querySelector('#ageGateConfirm')?.addEventListener('click', () => {
            localStorage.setItem('sessionLogAgeOk', '1');
            this.ageGateAccepted = true;
            overlay.remove();
        });
    },

    buildReadUrl() {
        const query = this.shareToken ? `?token=${encodeURIComponent(this.shareToken)}` : '';
        return `/logs/${encodeURIComponent(this.logId)}/read${query}`;
    },

    renderCover(log, theme) {
        if (log.coverUrl) {
            return `<img class="trpg-log-card-cover-img session-log-hero-cover-img" src="${this.esc(log.coverUrl)}" alt="">`;
        }
        return `
            <span class="iconify" data-icon="${this.logThemeIcon(theme)}" data-width="48"></span>
            <span class="session-log-hero-cover-title">${this.esc(log.title)}</span>`;
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
        const lead = players[0] || (log.author?.penName || 'KP');
        const synopsis = this.getSynopsis();
        const ratingKey = `trpg_rating_${log.rating || 'general'}`;
        const licenseKey = `trpg_license_${log.license || 'all_rights_reserved'}`;

        const tags = [
            log.isDemo ? this.t('trpg_logs_demo_badge') : '',
            this.t(ratingKey),
            this.t(licenseKey),
            themeLabel,
            ...(log.tags || []).slice(0, 4),
        ].filter(Boolean);
        const tagsHtml = tags.map((tag) => `<span class="session-log-hero-tag">${this.esc(tag)}</span>`).join('');
        const castHtml = players.slice(0, 6).map((name) => `
            <span class="session-log-hero-cast-item">${this.esc(name)}</span>`).join('');

        const authorHtml = log.author?.slug
            ? `<p class="session-log-hero-author"><a href="/authors/${this.esc(log.author.slug)}">${this.esc(log.author.penName)}</a></p>`
            : '';

        const editBtn = log.canEdit
            ? `<a class="session-log-hero-btn" href="/logs/${this.esc(this.logId)}/edit">${this.esc(this.t('trpg_work_action_edit'))}</a>`
            : '';

        const reportBtn = log.visibility === 'public' && !log.isOwner
            ? `<button type="button" class="session-log-hero-btn" id="reportLogBtn">${this.esc(this.t('trpg_report_btn'))}</button>`
            : '';

        hero.innerHTML = `
            <div class="session-log-hero-cover trpg-log-card-art-${theme}${log.coverUrl ? ' session-log-hero-cover-has-img' : ''}" aria-hidden="true">
                ${this.renderCover(log, theme)}
            </div>
            <div class="session-log-hero-main">
                <h1 class="session-log-hero-title">${this.esc(log.title)}</h1>
                ${authorHtml}
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
                    ${editBtn}
                    ${reportBtn}
                </div>
            </div>
            <aside class="session-log-hero-side">
                <div class="session-log-hero-avatar" aria-hidden="true">
                    ${log.author?.avatarUrl
        ? `<img src="${this.esc(log.author.avatarUrl)}" alt="" style="width:52px;height:52px;border-radius:50%;">`
        : `<span class="iconify" data-icon="mdi:account-circle" data-width="52"></span>`}
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

        hero.querySelector('#reportLogBtn')?.addEventListener('click', async () => {
            const reason = globalThis.prompt(this.t('trpg_report_reason_prompt'), 'other');
            if (!reason) return;
            try {
                await SessionLogApi.reportLog(this.logId, { reason, detail: '' });
                globalThis.alert(this.t('trpg_report_submitted'));
            } catch (error) {
                globalThis.alert(error.message || this.t('trpg_report_failed'));
            }
        });

        this.renderAgeGate();
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
