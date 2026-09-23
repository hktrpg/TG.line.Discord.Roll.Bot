/**
 * Session log commercial console — library / import / author / trash / account tabs.
 */
/* global SessionLogApi, SessionLogDecrypt, SessionLogCover */
const SessionLogDashboard = {
    IMPORT_DRAFT_KEY: 'sessionLogImportDraft',

    IMPORT_SOURCES: ['discord_export', 'manual_md', 'whatsapp', 'telegram', 'line'],
    FILE_ACCEPT: {
        discord_export: '.html,text/html',
        manual_md: '.md,.txt,text/markdown,text/plain',
        whatsapp: '.txt,text/plain',
        telegram: '.json,.txt,application/json,text/plain',
        line: '.txt,text/plain',
    },
    THEMES: ['kakuyomu', 'kindle', 'parchment', 'notion', 'letter', 'script', 'discord', 'chat', 'term'],
    RATINGS: ['general', 'teen', 'r15', 'r18'],
    LICENSES: ['all_rights_reserved', 'cc_by', 'cc_by_nc', 'cc_by_nc_nd', 'cc0'],
    ORIGINALITIES: ['original', 'fanwork', 'translation'],
    STATUSES: ['draft', 'scheduled', 'published', 'archived'],

    state: {
        tab: 'library',
        loggedIn: false,
        userName: '',
        importMode: 'simple',
        importSource: 'discord_export',
        importStep: 1,
        libraryFilter: { status: '', q: '' },
        quota: null,
        importDraft: {},
        importPreview: null,
        authorProfile: null,
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

    formatBytes(bytes) {
        const n = Number(bytes) || 0;
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    },

    defaultImportDraft() {
        return {
            title: '',
            subtitle: '',
            synopsis: '',
            tags: '',
            genre: '',
            sessionDate: '',
            location: '',
            theme: 'kakuyomu',
            rating: 'general',
            contentWarnings: '',
            license: 'all_rights_reserved',
            originality: 'original',
            sourceAttribution: '',
            coverUrl: '',
            coverAssetId: '',
            visibility: 'private',
            status: 'draft',
            publishAt: '',
        };
    },

    loadImportDraft() {
        try {
            const raw = localStorage.getItem(this.IMPORT_DRAFT_KEY);
            if (!raw) return this.defaultImportDraft();
            return { ...this.defaultImportDraft(), ...JSON.parse(raw) };
        } catch {
            return this.defaultImportDraft();
        }
    },

    saveImportDraft() {
        const { importDraft, importMode, importSource, importStep } = this.state;
        localStorage.setItem(this.IMPORT_DRAFT_KEY, JSON.stringify({
            ...importDraft,
            importMode,
            importSource,
            importStep,
        }));
    },

    setTab(tab) {
        this.state.tab = tab;
        const hash = tab === 'library' ? '' : tab;
        if (hash) {
            globalThis.location.hash = hash;
        } else if (globalThis.location.hash) {
            globalThis.history.replaceState(null, '', globalThis.location.pathname);
        }
        this.render();
    },

    readTabFromHash() {
        const hash = (globalThis.location.hash || '').replace(/^#/, '');
        if (hash === 'import' || hash === 'account' || hash === 'author' || hash === 'trash') {
            return hash;
        }
        return 'library';
    },

    isLoggedIn() {
        return Boolean(SessionLogApi.getToken());
    },

    async refreshAuth() {
        this.state.loggedIn = this.isLoggedIn();
        this.state.userName = SessionLogApi.getUserName();
        if (!this.state.loggedIn) {
            this.state.quota = null;
            return;
        }
        try {
            await SessionLogApi.listLogs();
            this.state.quota = await SessionLogApi.getQuota();
        } catch {
            SessionLogApi.clearAuth();
            this.state.loggedIn = false;
            this.state.userName = '';
            this.state.quota = null;
        }
    },

    renderCoverArt(log, demo) {
        return SessionLogCover.renderCoverArt(log, { demo });
    },

    renderLogCard(log, options = {}) {
        const { demo = false } = options;
        const messageLabel = this.t('trpg_logs_messages', { count: log.messageCount || 0 });
        const captionMeta = [log.sessionDate, log.location].filter(Boolean).join(' · ');
        const captionSub = log.subtitle || captionMeta;
        const hoverTags = [];
        if (log.sessionDate) hoverTags.push(log.sessionDate);
        if (log.location) hoverTags.push(log.location);
        for (const name of (log.playerNames || []).slice(0, 5)) {
            hoverTags.push(name);
        }
        const tagsHtml = hoverTags
            .map((item) => `<span class="trpg-log-card-hashtag">#${this.esc(item)}</span>`)
            .join('');

        return `
            <a class="trpg-log-card${demo ? ' trpg-log-card-demo' : ''}" href="/logs/${this.esc(log.id)}">
                <div class="trpg-log-card-cover">
                    ${this.renderCoverArt(log, demo)}
                    <span class="trpg-log-card-tag trpg-log-card-tag-right">${this.esc(messageLabel)}</span>
                    <div class="trpg-log-card-caption">
                        <strong class="trpg-log-card-title">${this.esc(log.title)}</strong>
                        ${captionSub ? `<span class="trpg-log-card-sub">${this.esc(captionSub)}</span>` : ''}
                    </div>
                </div>
                ${tagsHtml ? `<div class="trpg-log-card-tags-panel">${tagsHtml}</div>` : ''}
            </a>`;
    },

    renderWorkCard(log) {
        const messageLabel = this.t('trpg_logs_messages', { count: log.messageCount || 0 });
        const statusKey = `trpg_status_${log.status || 'published'}`;
        const ratingKey = `trpg_rating_${log.rating || 'general'}`;
        const captionSub = log.subtitle || [log.sessionDate, log.location].filter(Boolean).join(' · ');

        const shareUrl = log.shareUrl || `/logs/${log.id}`;
        return `
            <div class="trpg-log-card trpg-log-card-work" data-log-id="${this.esc(log.id)}" data-share-url="${this.esc(shareUrl)}">
                <a class="trpg-log-card-link" href="/logs/${this.esc(log.id)}">
                    <div class="trpg-log-card-cover">
                        ${this.renderCoverArt(log, false)}
                        <span class="trpg-status-badge trpg-status-badge-${this.esc(log.status || 'published')}">${this.esc(this.t(statusKey))}</span>
                        <span class="trpg-log-card-tag trpg-log-card-tag-right">${this.esc(messageLabel)}</span>
                        <div class="trpg-log-card-caption">
                            <strong class="trpg-log-card-title">${this.esc(log.title)}</strong>
                            ${captionSub ? `<span class="trpg-log-card-sub">${this.esc(captionSub)}</span>` : ''}
                        </div>
                    </div>
                </a>
                <div class="trpg-work-card-meta">
                    <span class="trpg-status-badge trpg-status-badge-rating">${this.esc(this.t(ratingKey))}</span>
                </div>
                <div class="trpg-work-actions">
                    <button type="button" class="trpg-work-actions-toggle" aria-label="Actions" data-action="menu-toggle">
                        <span class="iconify" data-icon="mdi:dots-vertical" data-width="18"></span>
                    </button>
                    <div class="trpg-work-actions-menu" hidden>
                        <a href="/logs/${this.esc(log.id)}/edit" data-action="edit">${this.esc(this.t('trpg_work_action_edit'))}</a>
                        <a href="/logs/${this.esc(log.id)}/read" data-action="read">${this.esc(this.t('trpg_logs_read'))}</a>
                        <button type="button" data-action="share">${this.esc(this.t('trpg_work_action_share'))}</button>
                        <button type="button" data-action="export">${this.esc(this.t('trpg_work_action_export'))}</button>
                        <button type="button" data-action="archive">${this.esc(this.t('trpg_work_action_archive'))}</button>
                        <button type="button" data-action="delete">${this.esc(this.t('trpg_logs_delete'))}</button>
                    </div>
                </div>
            </div>`;
    },

    renderQuotaBar() {
        const q = this.state.quota;
        if (!q) return '';
        const pct = q.limit > 0 ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
        return `
            <div class="trpg-quota-bar" role="meter" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                <div class="trpg-quota-bar-label">
                    <span>${this.esc(this.t('trpg_quota_label'))}</span>
                    <span>${this.esc(this.formatBytes(q.used))} / ${this.esc(this.formatBytes(q.limit))}</span>
                </div>
                <div class="trpg-quota-bar-track"><div class="trpg-quota-bar-fill" style="width:${pct}%"></div></div>
            </div>`;
    },

    async renderLibrary(panel) {
        let demos = { logs: [] };
        try {
            demos = await SessionLogApi.listDemoLogs();
        } catch (error) {
            console.warn('[SessionLogDashboard] demo list failed:', error.message);
        }

        let userLogs = [];
        if (this.state.loggedIn) {
            try {
                const params = {};
                if (this.state.libraryFilter.status) params.status = this.state.libraryFilter.status;
                if (this.state.libraryFilter.q) params.q = this.state.libraryFilter.q;
                const data = await SessionLogApi.listLogs(params);
                userLogs = data.logs || [];
            } catch {
                userLogs = [];
            }
        }

        const demoHtml = (demos.logs || []).map((log) => this.renderLogCard(log, { demo: true })).join('');
        const userHtml = userLogs.map((log) => this.renderWorkCard(log)).join('');
        const statusOptions = [
            { value: '', label: this.t('trpg_filter_all') },
            ...this.STATUSES.map((s) => ({ value: s, label: this.t(`trpg_status_${s}`) })),
        ];
        const statusSelect = statusOptions.map((opt) => `
            <option value="${this.esc(opt.value)}"${opt.value === this.state.libraryFilter.status ? ' selected' : ''}>${this.esc(opt.label)}</option>`).join('');

        panel.innerHTML = `
            ${this.state.loggedIn ? '' : `<div class="trpg-console-banner">
                <p>${this.esc(this.t('trpg_logs_demo_intro'))}</p>
                <button type="button" class="trpg-btn-sm trpg-btn-sm-accent" data-tab-jump="account">${this.esc(this.t('trpg_logs_login_btn'))}</button>
            </div>`}
            <section class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_logs_demo_section'))}</h2>
                    <p>${this.esc(this.t('trpg_logs_demo_section_desc'))}</p>
                </div>
                <div class="trpg-log-card-grid">${demoHtml}</div>
            </section>
            ${this.state.loggedIn ? `
            <section class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_logs_my_section'))}</h2>
                    <a class="trpg-btn-sm" href="#import" data-tab-jump="import">${this.esc(this.t('trpg_logs_import_action'))}</a>
                </div>
                ${this.renderQuotaBar()}
                <div class="trpg-library-toolbar">
                    <select id="libraryStatusFilter" class="trpg-form-select">${statusSelect}</select>
                    <input id="librarySearch" type="search" class="trpg-form-input" placeholder="${this.esc(this.t('trpg_library_search_placeholder'))}" value="${this.esc(this.state.libraryFilter.q)}">
                </div>
                <div class="trpg-log-card-grid" id="userLogGrid">${userHtml || `<p class="trpg-log-card-empty trpg-msg-muted">${this.esc(this.t('trpg_logs_empty'))}</p>`}</div>
            </section>` : ''}`;
    },

    renderImportModeToggle() {
        const { importMode } = this.state;
        return `
            <div class="trpg-import-mode-toggle" role="group">
                <button type="button" class="trpg-btn-sm${importMode === 'simple' ? ' active' : ''}" data-import-mode="simple">${this.esc(this.t('trpg_import_mode_simple'))}</button>
                <button type="button" class="trpg-btn-sm${importMode === 'detailed' ? ' active' : ''}" data-import-mode="detailed">${this.esc(this.t('trpg_import_mode_detailed'))}</button>
            </div>`;
    },

    renderSourceSelect(id = 'importSource') {
        return this.IMPORT_SOURCES.map((src) => `
            <option value="${src}"${src === this.state.importSource ? ' selected' : ''}>${this.esc(this.t(`trpg_import_source_${src}`))}</option>`).join('');
    },

    renderImportSimple(panel) {
        const draft = this.state.importDraft;
        const isDiscord = this.state.importSource === 'discord_export';
        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_import_title'))}</h2>
                    <p>${this.esc(this.t('trpg_import_lead'))}</p>
                </div>
                ${this.renderImportModeToggle()}
                <form id="importSimpleForm" class="trpg-import-form">
                    <div class="trpg-form-group">
                        <label for="importSource">${this.esc(this.t('trpg_import_source_label'))}</label>
                        <select id="importSource" name="importSource">${this.renderSourceSelect()}</select>
                    </div>
                    <div class="trpg-form-group">
                        <label for="exportFile">${this.esc(this.t('trpg_upload_file'))}</label>
                        <input id="exportFile" name="exportFile" type="file" accept="${this.esc(this.FILE_ACCEPT[this.state.importSource] || '*')}" required>
                    </div>
                    ${isDiscord ? `
                    <div class="trpg-form-group" id="discordPasswordGroup">
                        <label for="exportPassword">${this.esc(this.t('trpg_upload_password'))}</label>
                        <input id="exportPassword" name="exportPassword" type="password" maxlength="32">
                        <p class="trpg-form-hint">${this.esc(this.t('trpg_import_password_hint'))}</p>
                    </div>` : ''}
                    <div class="trpg-form-group">
                        <label for="logTitle">${this.esc(this.t('trpg_upload_title_label'))}</label>
                        <input id="logTitle" name="logTitle" value="${this.esc(draft.title)}" data-www-i18n-placeholder="trpg_upload_title_placeholder">
                    </div>
                    <div class="trpg-form-group">
                        <label for="visibility">${this.esc(this.t('trpg_upload_visibility'))}</label>
                        <select id="visibility" name="visibility">
                            <option value="private"${draft.visibility === 'private' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_private'))}</option>
                            <option value="unlisted"${draft.visibility === 'unlisted' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_unlisted'))}</option>
                            <option value="public"${draft.visibility === 'public' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_public'))}</option>
                        </select>
                    </div>
                    <div class="trpg-form-group">
                        <label for="rating">${this.esc(this.t('trpg_rating_label'))}</label>
                        <select id="rating" name="rating">
                            ${this.RATINGS.map((r) => `<option value="${r}"${draft.rating === r ? ' selected' : ''}>${this.esc(this.t(`trpg_rating_${r}`))}</option>`).join('')}
                        </select>
                    </div>
                    <button class="trpg-btn-primary trpg-import-submit" type="submit">${this.esc(this.t('trpg_upload_btn'))}</button>
                    <p id="importStatus" class="trpg-msg-muted"></p>
                    <p id="importError" class="trpg-msg-error d-none"></p>
                </form>
            </div>`;
    },

    renderWizardSteps() {
        const step = this.state.importStep;
        const labels = [
            this.t('trpg_import_wizard_step1'),
            this.t('trpg_import_wizard_step2'),
            this.t('trpg_import_wizard_step3'),
            this.t('trpg_import_wizard_step4'),
            this.t('trpg_import_wizard_step5'),
        ];
        return `<ol class="trpg-import-wizard-steps">${labels.map((label, i) => `
            <li class="${i + 1 === step ? 'active' : ''}${i + 1 < step ? ' done' : ''}"><span>${i + 1}</span>${this.esc(label)}</li>`).join('')}</ol>`;
    },

    renderImportDetailed(panel) {
        const draft = this.state.importDraft;
        const step = this.state.importStep;
        const isDiscord = this.state.importSource === 'discord_export';
        const preview = this.state.importPreview;

        let stepHtml = '';
        if (step === 1) {
            stepHtml = `
                <div class="trpg-form-group">
                    <label for="importSource">${this.esc(this.t('trpg_import_source_label'))}</label>
                    <select id="importSource">${this.renderSourceSelect()}</select>
                </div>
                <div class="trpg-form-group">
                    <label for="exportFile">${this.esc(this.t('trpg_upload_file'))}</label>
                    <input id="exportFile" type="file" accept="${this.esc(this.FILE_ACCEPT[this.state.importSource] || '*')}">
                </div>
                ${isDiscord ? `
                <div class="trpg-form-group" id="discordPasswordGroup">
                    <label for="exportPassword">${this.esc(this.t('trpg_upload_password'))}</label>
                    <input id="exportPassword" type="password" maxlength="32">
                </div>` : ''}
                <button type="button" class="trpg-btn-sm" id="previewImportBtn">${this.esc(this.t('trpg_import_preview_btn'))}</button>
                ${preview ? `
                <div class="trpg-import-preview" id="importPreviewBox">
                    <p>${this.esc(this.t('trpg_import_preview_events', { count: preview.eventCount || 0 }))}</p>
                    ${(preview.warnings || []).length ? `<ul class="trpg-import-warnings">${preview.warnings.map((w) => `<li>${this.esc(w)}</li>`).join('')}</ul>` : ''}
                    ${(preview.chapters || []).length ? `<p><strong>${this.esc(this.t('trpg_import_preview_chapters'))}</strong></p><ul>${preview.chapters.slice(0, 8).map((c) => `<li>${this.esc(c.title)}</li>`).join('')}</ul>` : ''}
                </div>` : ''}`;
        } else if (step === 2) {
            stepHtml = `
                <div class="trpg-form-group"><label for="draftTitle">${this.esc(this.t('trpg_upload_title_label'))}</label><input id="draftTitle" value="${this.esc(draft.title)}"></div>
                <div class="trpg-form-group"><label for="draftSubtitle">${this.esc(this.t('trpg_edit_subtitle'))}</label><input id="draftSubtitle" value="${this.esc(draft.subtitle)}"></div>
                <div class="trpg-form-group"><label for="draftSynopsis">${this.esc(this.t('trpg_edit_synopsis'))}</label><textarea id="draftSynopsis" rows="4">${this.esc(draft.synopsis)}</textarea></div>
                <div class="trpg-form-group"><label for="draftTags">${this.esc(this.t('trpg_edit_tags'))}</label><input id="draftTags" value="${this.esc(draft.tags)}" placeholder="${this.esc(this.t('trpg_edit_tags_hint'))}"></div>
                <div class="trpg-form-group"><label for="draftGenre">${this.esc(this.t('trpg_edit_genre'))}</label><input id="draftGenre" value="${this.esc(draft.genre)}"></div>
                <div class="trpg-form-group"><label for="draftSessionDate">${this.esc(this.t('trpg_reader_info_date'))}</label><input id="draftSessionDate" value="${this.esc(draft.sessionDate)}"></div>
                <div class="trpg-form-group"><label for="draftLocation">${this.esc(this.t('trpg_reader_info_location'))}</label><input id="draftLocation" value="${this.esc(draft.location)}"></div>
                <div class="trpg-form-group"><label for="draftTheme">${this.esc(this.t('trpg_view_theme_nav'))}</label>
                    <select id="draftTheme">${this.THEMES.map((th) => `<option value="${th}"${draft.theme === th ? ' selected' : ''}>${this.esc(this.t(`trpg_theme_${th}`))}</option>`).join('')}</select>
                </div>`;
        } else if (step === 3) {
            stepHtml = `
                <div class="trpg-form-group"><label for="draftRating">${this.esc(this.t('trpg_rating_label'))}</label>
                    <select id="draftRating">${this.RATINGS.map((r) => `<option value="${r}"${draft.rating === r ? ' selected' : ''}>${this.esc(this.t(`trpg_rating_${r}`))}</option>`).join('')}</select>
                </div>
                <div class="trpg-form-group"><label for="draftWarnings">${this.esc(this.t('trpg_edit_content_warnings'))}</label><input id="draftWarnings" value="${this.esc(draft.contentWarnings)}" placeholder="${this.esc(this.t('trpg_edit_tags_hint'))}"></div>
                <div class="trpg-form-group"><label for="draftLicense">${this.esc(this.t('trpg_license_label'))}</label>
                    <select id="draftLicense">${this.LICENSES.map((l) => `<option value="${l}"${draft.license === l ? ' selected' : ''}>${this.esc(this.t(`trpg_license_${l}`))}</option>`).join('')}</select>
                </div>
                <div class="trpg-form-group"><label for="draftOriginality">${this.esc(this.t('trpg_originality_label'))}</label>
                    <select id="draftOriginality">${this.ORIGINALITIES.map((o) => `<option value="${o}"${draft.originality === o ? ' selected' : ''}>${this.esc(this.t(`trpg_originality_${o}`))}</option>`).join('')}</select>
                </div>
                <div class="trpg-form-group" id="sourceAttributionGroup"${draft.originality === 'original' ? ' hidden' : ''}>
                    <label for="draftSourceAttribution">${this.esc(this.t('trpg_source_attribution_label'))}</label>
                    <input id="draftSourceAttribution" value="${this.esc(draft.sourceAttribution)}">
                </div>`;
        } else if (step === 4) {
            stepHtml = `
                <div class="trpg-form-group">
                    <label for="coverFile">${this.esc(this.t('trpg_edit_cover_upload'))}</label>
                    <input id="coverFile" type="file" accept="image/*">
                </div>
                <div class="trpg-form-group">
                    <label for="draftCoverUrl">${this.esc(this.t('trpg_edit_cover_url'))}</label>
                    <input id="draftCoverUrl" value="${this.esc(draft.coverUrl)}" placeholder="https://">
                </div>
                ${draft.coverUrl ? `<img class="trpg-log-card-cover-img" src="${this.esc(draft.coverUrl)}" alt="" style="max-width:160px;border-radius:8px;">` : ''}`;
        } else {
            const chapters = (this.state.importPreview?.chapters || []);
            stepHtml = `
                ${chapters.length ? `<ul class="trpg-chapter-preview-list">${chapters.map((c) => `<li>${this.esc(c.title)} <span class="trpg-msg-muted">(${c.wordCount || 0})</span></li>`).join('')}</ul>` : `<p class="trpg-msg-muted">${this.esc(this.t('trpg_import_no_chapters'))}</p>`}
                <div class="trpg-form-group"><label for="draftVisibility">${this.esc(this.t('trpg_upload_visibility'))}</label>
                    <select id="draftVisibility">
                        <option value="private"${draft.visibility === 'private' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_private'))}</option>
                        <option value="unlisted"${draft.visibility === 'unlisted' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_unlisted'))}</option>
                        <option value="public"${draft.visibility === 'public' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_public'))}</option>
                    </select>
                </div>
                <div class="trpg-form-group"><label for="draftStatus">${this.esc(this.t('trpg_edit_status'))}</label>
                    <select id="draftStatus">
                        ${['draft', 'scheduled', 'published'].map((s) => `<option value="${s}"${draft.status === s ? ' selected' : ''}>${this.esc(this.t(`trpg_status_${s}`))}</option>`).join('')}
                    </select>
                </div>
                <div class="trpg-form-group" id="publishAtGroup"${draft.status !== 'scheduled' ? ' hidden' : ''}>
                    <label for="draftPublishAt">${this.esc(this.t('trpg_edit_publish_at'))}</label>
                    <input id="draftPublishAt" type="datetime-local" value="${this.esc(draft.publishAt)}">
                </div>`;
        }

        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_import_title'))}</h2>
                    <p>${this.esc(this.t('trpg_import_lead'))}</p>
                </div>
                ${this.renderImportModeToggle()}
                ${this.renderWizardSteps()}
                <form id="importWizardForm" class="trpg-import-form">
                    ${stepHtml}
                    <div class="trpg-wizard-nav">
                        ${step > 1 ? `<button type="button" class="trpg-btn-sm" id="wizardPrev">${this.esc(this.t('trpg_wizard_prev'))}</button>` : ''}
                        ${step < 5 ? `<button type="button" class="trpg-btn-primary" id="wizardNext">${this.esc(this.t('trpg_wizard_next'))}</button>` : `<button type="submit" class="trpg-btn-primary">${this.esc(this.t('trpg_import_submit'))}</button>`}
                    </div>
                    <p id="importStatus" class="trpg-msg-muted"></p>
                    <p id="importError" class="trpg-msg-error d-none"></p>
                </form>
            </div>`;
    },

    renderImport(panel) {
        if (!this.state.loggedIn) {
            panel.innerHTML = `
                <div class="trpg-console-empty">
                    <p>${this.esc(this.t('trpg_import_login_required'))}</p>
                    <button type="button" class="trpg-btn-primary" data-tab-jump="account">${this.esc(this.t('trpg_logs_login_btn'))}</button>
                </div>`;
            return;
        }
        if (this.state.importMode === 'detailed') {
            this.renderImportDetailed(panel);
        } else {
            this.renderImportSimple(panel);
        }
    },

    async renderAuthor(panel) {
        if (!this.state.loggedIn) {
            panel.innerHTML = `
                <div class="trpg-console-empty">
                    <p>${this.esc(this.t('trpg_author_login_required'))}</p>
                    <button type="button" class="trpg-btn-primary" data-tab-jump="account">${this.esc(this.t('trpg_logs_login_btn'))}</button>
                </div>`;
            return;
        }

        let profile = this.state.authorProfile;
        if (!profile) {
            try {
                profile = await SessionLogApi.getAuthorMe();
                this.state.authorProfile = profile;
            } catch {
                profile = { penName: this.state.userName, slug: '', bio: '', avatarUrl: '', isPublic: false };
            }
        }

        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_author_title'))}</h2>
                    <p>${this.esc(this.t('trpg_author_lead'))}</p>
                </div>
                <form id="authorForm" class="trpg-import-form">
                    <div class="trpg-form-group">
                        <label for="penName">${this.esc(this.t('trpg_author_pen_name'))}</label>
                        <input id="penName" name="penName" value="${this.esc(profile.penName || '')}" required>
                    </div>
                    <div class="trpg-form-group">
                        <label for="authorSlug">${this.esc(this.t('trpg_author_slug'))}</label>
                        <input id="authorSlug" name="slug" value="${this.esc(profile.slug || '')}" pattern="[a-z0-9-]+">
                        <p class="trpg-form-hint">${this.esc(this.t('trpg_author_slug_hint'))}</p>
                    </div>
                    <div class="trpg-form-group">
                        <label for="authorBio">${this.esc(this.t('trpg_author_bio'))}</label>
                        <textarea id="authorBio" name="bio" rows="4">${this.esc(profile.bio || '')}</textarea>
                    </div>
                    <div class="trpg-form-group">
                        <label for="avatarUrl">${this.esc(this.t('trpg_author_avatar_url'))}</label>
                        <input id="avatarUrl" name="avatarUrl" value="${this.esc(profile.avatarUrl || '')}" placeholder="https://">
                    </div>
                    <div class="trpg-form-group trpg-form-check">
                        <label><input type="checkbox" id="isPublic" name="isPublic"${profile.isPublic ? ' checked' : ''}> ${this.esc(this.t('trpg_author_is_public'))}</label>
                    </div>
                    ${profile.slug && profile.isPublic ? `<p class="trpg-form-hint"><a href="/authors/${this.esc(profile.slug)}" target="_blank" rel="noopener">${this.esc(this.t('trpg_author_view_page'))}</a></p>` : ''}
                    <button class="trpg-btn-primary" type="submit">${this.esc(this.t('trpg_author_save'))}</button>
                    <p id="authorStatus" class="trpg-msg-muted"></p>
                    <p id="authorError" class="trpg-msg-error d-none"></p>
                </form>
            </div>`;
    },

    async renderTrash(panel) {
        if (!this.state.loggedIn) {
            panel.innerHTML = `
                <div class="trpg-console-empty">
                    <p>${this.esc(this.t('trpg_trash_login_required'))}</p>
                    <button type="button" class="trpg-btn-primary" data-tab-jump="account">${this.esc(this.t('trpg_logs_login_btn'))}</button>
                </div>`;
            return;
        }

        let logs = [];
        try {
            const data = await SessionLogApi.listLogs({ trash: 1 });
            logs = data.logs || [];
        } catch {
            logs = [];
        }

        const listHtml = logs.length
            ? logs.map((log) => `
                <div class="trpg-trash-item" data-log-id="${this.esc(log.id)}">
                    <div>
                        <strong>${this.esc(log.title)}</strong>
                        <span class="trpg-msg-muted">${this.esc(this.t('trpg_logs_messages', { count: log.messageCount || 0 }))}</span>
                    </div>
                    <div class="trpg-trash-actions">
                        <button type="button" class="trpg-btn-sm" data-action="restore">${this.esc(this.t('trpg_trash_restore'))}</button>
                        <button type="button" class="trpg-btn-sm trpg-btn-danger" data-action="purge">${this.esc(this.t('trpg_trash_purge'))}</button>
                    </div>
                </div>`).join('')
            : `<p class="trpg-msg-muted">${this.esc(this.t('trpg_trash_empty'))}</p>`;

        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_trash_title'))}</h2>
                    <p>${this.esc(this.t('trpg_trash_lead'))}</p>
                </div>
                <div class="trpg-trash-list">${listHtml}</div>
            </div>`;
    },

    renderAccount(panel) {
        if (this.state.loggedIn) {
            panel.innerHTML = `
                <div class="trpg-console-block trpg-account-card">
                    <h2>${this.esc(this.t('trpg_account_title'))}</h2>
                    <p class="trpg-msg-muted">${this.esc(this.t('trpg_logs_logged_in', { user: this.state.userName }))}</p>
                    <p class="trpg-form-hint">${this.esc(this.t('trpg_account_hint'))}</p>
                    ${SessionLogApi.isAdmin() ? `<p><a class="trpg-btn-sm" href="/logs/admin">${this.esc(this.t('trpg_console_nav_admin'))}</a></p>` : ''}
                    <button type="button" class="trpg-btn-sm" id="logoutBtn">${this.esc(this.t('trpg_account_logout'))}</button>
                </div>`;
            return;
        }

        panel.innerHTML = `
            <div class="trpg-console-block trpg-account-card">
                <h2>${this.esc(this.t('trpg_logs_login_title'))}</h2>
                <p class="trpg-form-hint">${this.esc(this.t('trpg_account_login_desc'))}</p>
                <form id="loginForm" class="trpg-import-form">
                    <div class="trpg-form-group">
                        <label for="userName">${this.esc(this.t('trpg_logs_username'))}</label>
                        <input id="userName" name="userName" autocomplete="username" required>
                    </div>
                    <div class="trpg-form-group">
                        <label for="userPassword">${this.esc(this.t('trpg_logs_password'))}</label>
                        <input id="userPassword" name="userPassword" type="password" autocomplete="current-password" required>
                    </div>
                    <button class="trpg-btn-primary" type="submit">${this.esc(this.t('trpg_logs_login_btn'))}</button>
                    <p id="loginError" class="trpg-msg-error d-none"></p>
                </form>
            </div>`;

        const saved = localStorage.getItem('userName');
        const userInput = panel.querySelector('#userName');
        if (saved && userInput) userInput.value = saved;
    },

    collectMetadataFromDraft(draft, overrides = {}) {
        const tags = String(draft.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
        const contentWarnings = String(draft.contentWarnings || '').split(',').map((t) => t.trim()).filter(Boolean);
        return {
            title: draft.title,
            subtitle: draft.subtitle,
            synopsis: draft.synopsis,
            tags,
            genre: draft.genre,
            sessionDate: draft.sessionDate,
            location: draft.location,
            theme: draft.theme,
            rating: draft.rating,
            contentWarnings,
            license: draft.license,
            originality: draft.originality,
            sourceAttribution: draft.sourceAttribution,
            coverUrl: draft.coverUrl,
            coverAssetId: draft.coverAssetId,
            visibility: draft.visibility,
            status: draft.status,
            publishAt: draft.publishAt || undefined,
            ...overrides,
        };
    },

    async buildImportPayload(file, password) {
        const source = this.state.importSource;
        const metadata = this.collectMetadataFromDraft(this.state.importDraft);
        if (source === 'discord_export') {
            const parsed = await SessionLogDecrypt.parseExportHtmlFile(file, password);
            return {
                source: 'discord_export',
                messages: parsed.messages,
                metadata: {
                    ...metadata,
                    title: metadata.title || parsed.channelName || this.t('trpg_upload_title_placeholder'),
                    channelName: parsed.channelName,
                },
            };
        }
        const content = await file.text();
        return { source, content, metadata };
    },

    async pollImportJob(jobId, statusEl) {
        for (let i = 0; i < 300; i++) {
            await new Promise((resolve) => { setTimeout(resolve, 2000); });
            const job = await SessionLogApi.getImportJob(jobId);
            if (statusEl) {
                statusEl.textContent = this.t('trpg_import_job_progress', {
                    status: job.status,
                    progress: job.progress || 0,
                });
            }
            if (job.status === 'done' && job.workId) {
                return job.workId;
            }
            if (job.status === 'failed') {
                throw new Error(job.error || this.t('trpg_import_job_failed'));
            }
        }
        throw new Error(this.t('trpg_import_job_timeout'));
    },

    async submitImport(form, statusEl, errorEl, options = {}) {
        errorEl?.classList.add('d-none');
        if (statusEl) statusEl.textContent = this.t('trpg_upload_processing');

        const fileInput = form.querySelector('#exportFile') || document.getElementById('exportFile');
        const file = fileInput?.files?.[0];
        if (!file) {
            if (errorEl) {
                errorEl.textContent = this.t('trpg_upload_fill_all');
                errorEl.classList.remove('d-none');
            }
            if (statusEl) statusEl.textContent = '';
            return;
        }

        const password = (form.querySelector('#exportPassword') || document.getElementById('exportPassword'))?.value || '';

        if (this.state.importSource === 'discord_export' && !password) {
            if (errorEl) {
                errorEl.textContent = this.t('trpg_upload_fill_all');
                errorEl.classList.remove('d-none');
            }
            if (statusEl) statusEl.textContent = '';
            return;
        }

        if (options.simple) {
            const title = form.logTitle?.value?.trim() || '';
            const visibility = form.visibility?.value || 'private';
            const rating = form.rating?.value || 'general';
            this.state.importDraft = {
                ...this.state.importDraft,
                title,
                visibility,
                rating,
                status: 'published',
                originality: 'original',
            };
            this.saveImportDraft();
        }

        try {
            const payload = await this.buildImportPayload(file, password);
            const result = await SessionLogApi.importLog(payload);
            if (result.jobId) {
                const workId = await this.pollImportJob(result.jobId, statusEl);
                globalThis.location.href = `/logs/${workId}`;
                return;
            }
            globalThis.location.href = `/logs/${result.id}`;
        } catch (importError) {
            if (errorEl) {
                errorEl.textContent = importError.message || this.t('trpg_upload_fill_all');
                errorEl.classList.remove('d-none');
            }
            if (statusEl) statusEl.textContent = '';
        }
    },

    syncDraftFromWizardForm(panel) {
        const draft = { ...this.state.importDraft };
        const get = (id) => panel.querySelector(`#${id}`)?.value ?? '';
        if (panel.querySelector('#draftTitle')) draft.title = get('draftTitle').trim();
        if (panel.querySelector('#draftSubtitle')) draft.subtitle = get('draftSubtitle').trim();
        if (panel.querySelector('#draftSynopsis')) draft.synopsis = get('draftSynopsis').trim();
        if (panel.querySelector('#draftTags')) draft.tags = get('draftTags');
        if (panel.querySelector('#draftGenre')) draft.genre = get('draftGenre').trim();
        if (panel.querySelector('#draftSessionDate')) draft.sessionDate = get('draftSessionDate').trim();
        if (panel.querySelector('#draftLocation')) draft.location = get('draftLocation').trim();
        if (panel.querySelector('#draftTheme')) draft.theme = get('draftTheme');
        if (panel.querySelector('#draftRating')) draft.rating = get('draftRating');
        if (panel.querySelector('#draftWarnings')) draft.contentWarnings = get('draftWarnings');
        if (panel.querySelector('#draftLicense')) draft.license = get('draftLicense');
        if (panel.querySelector('#draftOriginality')) draft.originality = get('draftOriginality');
        if (panel.querySelector('#draftSourceAttribution')) draft.sourceAttribution = get('draftSourceAttribution').trim();
        if (panel.querySelector('#draftCoverUrl')) draft.coverUrl = get('draftCoverUrl').trim();
        if (panel.querySelector('#draftVisibility')) draft.visibility = get('draftVisibility');
        if (panel.querySelector('#draftStatus')) draft.status = get('draftStatus');
        if (panel.querySelector('#draftPublishAt')) draft.publishAt = get('draftPublishAt');
        this.state.importDraft = draft;
        this.saveImportDraft();
        return draft;
    },

    async handleWorkAction(action, logId, log) {
        if (action === 'share') {
            const url = log.shareUrl
                ? `${globalThis.location.origin}${log.shareUrl}`
                : `${globalThis.location.origin}/logs/${logId}`;
            await navigator.clipboard.writeText(url);
            return;
        }
        if (action === 'export') {
            const data = await SessionLogApi.exportLog(logId, 'json');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `session-log-${logId}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            return;
        }
        if (action === 'archive') {
            if (!globalThis.confirm(this.t('trpg_work_confirm_archive'))) return;
            await SessionLogApi.updateLog(logId, { status: 'archived' });
            await this.render();
            return;
        }
        if (action === 'delete') {
            if (!globalThis.confirm(this.t('trpg_logs_confirm_delete'))) return;
            await SessionLogApi.deleteLog(logId);
            await this.render();
        }
    },

    bindPanelEvents(panel) {
        for (const el of panel.querySelectorAll('[data-tab-jump]')) {
            el.addEventListener('click', (event) => {
                event.preventDefault();
                this.setTab(el.dataset.tabJump);
            });
        }

        const loginForm = panel.querySelector('#loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const err = panel.querySelector('#loginError');
                err?.classList.add('d-none');
                try {
                    const userName = loginForm.userName.value.trim();
                    const userPassword = loginForm.userPassword.value;
                    await SessionLogApi.login(userName, userPassword);
                    localStorage.setItem('userName', userName);
                    await this.refreshAuth();
                    this.setTab('library');
                } catch {
                    if (err) {
                        err.textContent = this.t('trpg_logs_login_failed');
                        err.classList.remove('d-none');
                    }
                }
            });
        }

        const logoutBtn = panel.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                SessionLogApi.clearAuth();
                this.state.loggedIn = false;
                this.state.userName = '';
                this.state.quota = null;
                this.state.authorProfile = null;
                this.setTab('account');
            });
        }

        const statusFilter = panel.querySelector('#libraryStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.state.libraryFilter.status = statusFilter.value;
                this.renderLibrary(panel);
                this.bindPanelEvents(panel);
            });
        }

        const librarySearch = panel.querySelector('#librarySearch');
        if (librarySearch) {
            let searchTimer;
            librarySearch.addEventListener('input', () => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(async () => {
                    this.state.libraryFilter.q = librarySearch.value.trim();
                    await this.renderLibrary(panel);
                    this.bindPanelEvents(panel);
                }, 300);
            });
        }

        for (const card of panel.querySelectorAll('.trpg-log-card-work')) {
            const logId = card.dataset.logId;
            const toggle = card.querySelector('[data-action="menu-toggle"]');
            const menu = card.querySelector('.trpg-work-actions-menu');
            if (toggle && menu) {
                toggle.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const open = !menu.hidden;
                    for (const m of panel.querySelectorAll('.trpg-work-actions-menu')) m.hidden = true;
                    menu.hidden = open;
                });
            }
            for (const btn of card.querySelectorAll('.trpg-work-actions-menu [data-action]')) {
                btn.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    menu.hidden = true;
                    const action = btn.dataset.action;
                    if (action === 'edit' || action === 'read') {
                        globalThis.location.href = btn.href;
                        return;
                    }
                    try {
                        const shareUrl = card.dataset.shareUrl || `/logs/${logId}`;
                        await this.handleWorkAction(action, logId, { shareUrl });
                    } catch (error) {
                        console.warn('[SessionLogDashboard] action failed:', error.message);
                    }
                });
            }
        }

        if (!this._workMenuClickBound) {
            this._workMenuClickBound = true;
            document.addEventListener('click', (event) => {
                if (!event.target.closest('.trpg-work-actions')) {
                    for (const m of document.querySelectorAll('.trpg-work-actions-menu')) m.hidden = true;
                }
            });
        }

        for (const btn of panel.querySelectorAll('[data-import-mode]')) {
            btn.addEventListener('click', () => {
                this.state.importMode = btn.dataset.importMode;
                this.saveImportDraft();
                this.renderImport(panel);
                this.bindPanelEvents(panel);
            });
        }

        const importSource = panel.querySelector('#importSource');
        if (importSource) {
            importSource.addEventListener('change', () => {
                this.state.importSource = importSource.value;
                this.saveImportDraft();
                this.renderImport(panel);
                this.bindPanelEvents(panel);
            });
        }

        const importSimpleForm = panel.querySelector('#importSimpleForm');
        if (importSimpleForm) {
            importSimpleForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await this.submitImport(
                    importSimpleForm,
                    panel.querySelector('#importStatus'),
                    panel.querySelector('#importError'),
                    { simple: true },
                );
            });
        }

        const previewBtn = panel.querySelector('#previewImportBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', async () => {
                const statusEl = panel.querySelector('#importStatus');
                const errorEl = panel.querySelector('#importError');
                errorEl?.classList.add('d-none');
                if (statusEl) statusEl.textContent = this.t('trpg_upload_processing');
                try {
                    const file = panel.querySelector('#exportFile')?.files?.[0];
                    if (!file) throw new Error(this.t('trpg_upload_fill_all'));
                    const password = panel.querySelector('#exportPassword')?.value || '';
                    const payload = await this.buildImportPayload(file, password);
                    this.state.importPreview = await SessionLogApi.previewImport(payload);
                    if (statusEl) statusEl.textContent = '';
                    this.renderImport(panel);
                    this.bindPanelEvents(panel);
                } catch (error) {
                    if (errorEl) {
                        errorEl.textContent = error.message;
                        errorEl.classList.remove('d-none');
                    }
                    if (statusEl) statusEl.textContent = '';
                }
            });
        }

        const wizardPrev = panel.querySelector('#wizardPrev');
        if (wizardPrev) {
            wizardPrev.addEventListener('click', () => {
                this.syncDraftFromWizardForm(panel);
                this.state.importStep = Math.max(1, this.state.importStep - 1);
                this.saveImportDraft();
                this.renderImport(panel);
                this.bindPanelEvents(panel);
            });
        }

        const wizardNext = panel.querySelector('#wizardNext');
        if (wizardNext) {
            wizardNext.addEventListener('click', () => {
                this.syncDraftFromWizardForm(panel);
                if (this.state.importStep === 1 && !this.state.importPreview) {
                    const errorEl = panel.querySelector('#importError');
                    if (errorEl) {
                        errorEl.textContent = this.t('trpg_import_preview_required');
                        errorEl.classList.remove('d-none');
                    }
                    return;
                }
                this.state.importStep = Math.min(5, this.state.importStep + 1);
                this.saveImportDraft();
                this.renderImport(panel);
                this.bindPanelEvents(panel);
            });
        }

        const draftOriginality = panel.querySelector('#draftOriginality');
        if (draftOriginality) {
            draftOriginality.addEventListener('change', () => {
                const group = panel.querySelector('#sourceAttributionGroup');
                if (group) group.hidden = draftOriginality.value === 'original';
            });
        }

        const draftStatus = panel.querySelector('#draftStatus');
        if (draftStatus) {
            draftStatus.addEventListener('change', () => {
                const group = panel.querySelector('#publishAtGroup');
                if (group) group.hidden = draftStatus.value !== 'scheduled';
            });
        }

        const coverFile = panel.querySelector('#coverFile');
        if (coverFile) {
            coverFile.addEventListener('change', async () => {
                const file = coverFile.files?.[0];
                if (!file) return;
                const statusEl = panel.querySelector('#importStatus');
                if (statusEl) statusEl.textContent = this.t('trpg_upload_processing');
                try {
                    const result = await SessionLogApi.uploadAsset(file, 'cover');
                    this.state.importDraft.coverUrl = result.url;
                    this.state.importDraft.coverAssetId = result.assetId;
                    this.saveImportDraft();
                    if (statusEl) statusEl.textContent = '';
                    this.renderImport(panel);
                    this.bindPanelEvents(panel);
                } catch (error) {
                    if (statusEl) statusEl.textContent = '';
                    const errorEl = panel.querySelector('#importError');
                    if (errorEl) {
                        errorEl.textContent = error.message;
                        errorEl.classList.remove('d-none');
                    }
                }
            });
        }

        const importWizardForm = panel.querySelector('#importWizardForm');
        if (importWizardForm) {
            importWizardForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                this.syncDraftFromWizardForm(panel);
                await this.submitImport(
                    importWizardForm,
                    panel.querySelector('#importStatus'),
                    panel.querySelector('#importError'),
                );
            });
        }

        const authorForm = panel.querySelector('#authorForm');
        if (authorForm) {
            authorForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const statusEl = panel.querySelector('#authorStatus');
                const errorEl = panel.querySelector('#authorError');
                errorEl?.classList.add('d-none');
                try {
                    const payload = {
                        penName: authorForm.penName.value.trim(),
                        slug: authorForm.slug.value.trim(),
                        bio: authorForm.bio.value.trim(),
                        avatarUrl: authorForm.avatarUrl.value.trim(),
                        isPublic: authorForm.isPublic.checked,
                    };
                    this.state.authorProfile = await SessionLogApi.updateAuthorMe(payload);
                    if (statusEl) statusEl.textContent = this.t('trpg_author_saved');
                } catch (error) {
                    if (errorEl) {
                        errorEl.textContent = error.message || this.t('trpg_author_save_failed');
                        errorEl.classList.remove('d-none');
                    }
                }
            });
        }

        for (const item of panel.querySelectorAll('.trpg-trash-item')) {
            const logId = item.dataset.logId;
            for (const btn of item.querySelectorAll('[data-action]')) {
                btn.addEventListener('click', async () => {
                    const action = btn.dataset.action;
                    if (action === 'restore') {
                        if (!globalThis.confirm(this.t('trpg_trash_confirm_restore'))) return;
                        await SessionLogApi.restoreLog(logId);
                    } else if (action === 'purge') {
                        if (!globalThis.confirm(this.t('trpg_trash_confirm_purge'))) return;
                        await SessionLogApi.purgeLog(logId);
                    }
                    await this.renderTrash(panel);
                    this.bindPanelEvents(panel);
                });
            }
        }
    },

    updateNav() {
        for (const btn of document.querySelectorAll('[data-console-tab]')) {
            const active = btn.dataset.consoleTab === this.state.tab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-current', active ? 'page' : 'false');
        }
    },

    async render() {
        this.updateNav();
        const panel = document.getElementById('consolePanel');
        if (!panel) return;

        if (this.state.tab === 'library') {
            await this.renderLibrary(panel);
        } else if (this.state.tab === 'import') {
            this.renderImport(panel);
        } else if (this.state.tab === 'author') {
            await this.renderAuthor(panel);
        } else if (this.state.tab === 'trash') {
            await this.renderTrash(panel);
        } else {
            this.renderAccount(panel);
        }
        this.bindPanelEvents(panel);
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(panel);
        }
    },

    async init() {
        const saved = this.loadImportDraft();
        this.state.importDraft = saved;
        if (saved.importMode) this.state.importMode = saved.importMode;
        if (saved.importSource) this.state.importSource = saved.importSource;
        if (saved.importStep) this.state.importStep = saved.importStep;

        await this.refreshAuth();
        this.state.tab = this.readTabFromHash();
        for (const btn of document.querySelectorAll('[data-console-tab]')) {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                this.setTab(btn.dataset.consoleTab);
            });
        }
        globalThis.addEventListener('hashchange', () => {
            this.state.tab = this.readTabFromHash();
            this.render();
        });
        await this.render();
    },
};

window.SessionLogDashboard = SessionLogDashboard;

async function initSessionLogDashboard() {
    await SessionLogDashboard.init();
}

window.initSessionLogDashboard = initSessionLogDashboard;
