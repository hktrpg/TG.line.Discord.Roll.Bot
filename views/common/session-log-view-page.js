/**
 * Session log reader page — chapters, icon rail, catalog & settings drawers.
 */
/* global SessionLogReader, SessionLogApi */
const SessionLogViewPage = {
    log: null,
    logId: '',
    shareToken: '',
    chapters: [],
    chapterIndex: 0,
    themeId: 'kakuyomu',
    activePanel: null,
    readerSettings: { ...SessionLogReader.DEFAULT_READER_SETTINGS },

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

    loadReaderSettings() {
        this.readerSettings = { ...SessionLogReader.DEFAULT_READER_SETTINGS };
        try {
            const raw = localStorage.getItem('sessionLogReaderSettings');
            if (raw) {
                this.readerSettings = { ...this.readerSettings, ...JSON.parse(raw) };
            }
        } catch {
            // ignore
        }
        const validSchemes = SessionLogReader.SETTING_OPTIONS.colorScheme || [];
        if (!validSchemes.includes(this.readerSettings.colorScheme)) {
            this.readerSettings.colorScheme = 'default';
        }
    },

    resetReaderSettings() {
        this.readerSettings = { ...SessionLogReader.DEFAULT_READER_SETTINGS };
        this.saveReaderSettings();
        this.applyReaderSurface();
        this.renderPreview();
        this.renderDrawerBody();
    },

    isLayoutSettingKey(key) {
        return ['lineHeight', 'fontFamily', 'pageWidth', 'contentPadding', 'fontSize'].includes(key);
    },

    renderColorSchemeChips() {
        const options = SessionLogReader.SETTING_OPTIONS.colorScheme || [];
        return options.map((value) => {
            const active = String(this.readerSettings.colorScheme) === String(value) ? ' active' : '';
            const label = SessionLogReader.colorSchemeLabel(value);
            const scheme = SessionLogReader.colorSchemeDef(value);
            const swatch = scheme
                ? `<span class="reader-color-swatch" style="background:${this.esc(scheme.swatch)}"></span>`
                : '<span class="reader-color-swatch reader-color-swatch-default" aria-hidden="true"></span>';
            return `<button type="button" class="reader-setting-chip reader-color-chip${active}" data-setting-key="colorScheme" data-setting-value="${this.esc(value)}">${swatch}<span>${this.esc(label)}</span></button>`;
        }).join('');
    },

    renderFontFamilyChips() {
        const options = SessionLogReader.SETTING_OPTIONS.fontFamily || [];
        return options.map((value) => {
            const active = String(this.readerSettings.fontFamily) === String(value) ? ' active' : '';
            const label = SessionLogReader.fontLabel(value);
            const family = SessionLogReader.fontFamilyStack(value);
            return `<button type="button" class="reader-setting-chip reader-font-chip${active}" data-setting-key="fontFamily" data-setting-value="${this.esc(value)}" style="font-family:${family}">${this.esc(label)}</button>`;
        }).join('');
    },

    renderSettingChips(optionKey, settingKey, labelFn) {
        const options = SessionLogReader.SETTING_OPTIONS[optionKey] || [];
        return options.map((value) => {
            const active = String(this.readerSettings[settingKey]) === String(value) ? ' active' : '';
            const label = labelFn ? labelFn(value) : value;
            return `<button type="button" class="reader-setting-chip${active}" data-setting-key="${settingKey}" data-setting-value="${this.esc(value)}">${this.esc(label)}</button>`;
        }).join('');
    },

    saveReaderSettings() {
        try {
            localStorage.setItem('sessionLogReaderSettings', JSON.stringify(this.readerSettings));
        } catch {
            // ignore
        }
    },

    buildChapters() {
        const events = this.log?.events || [];
        this.chapters = SessionLogReader.splitIntoChapters(events);
        const hash = Number.parseInt((globalThis.location.hash || '').replace(/^#ch-?/i, ''), 10);
        if (!Number.isNaN(hash) && hash >= 0 && hash < this.chapters.length) {
            this.chapterIndex = hash;
        } else {
            this.chapterIndex = 0;
        }
    },

    currentChapter() {
        return this.chapters[this.chapterIndex] || this.chapters[0] || { title: '', events: [] };
    },

    buildDetailUrl() {
        const query = this.shareToken ? `?token=${encodeURIComponent(this.shareToken)}` : '';
        return `/logs/${encodeURIComponent(this.logId)}${query}`;
    },

    setDetailBackLink() {
        const back = document.getElementById('sessionLogBackToDetail');
        if (back) back.href = this.buildDetailUrl();
    },

    updateChapterBar() {
        const label = document.getElementById('chapterNavLabel');
        const prev = document.getElementById('chapterPrev');
        const next = document.getElementById('chapterNext');
        const bar = document.getElementById('chapterNavBar');
        if (!label || !bar) return;

        const total = this.chapters.length;
        const multi = total > 1;
        bar.hidden = !multi;

        if (!multi) return;

        const chapter = this.currentChapter();
        label.textContent = this.t('trpg_view_chapter_label', {
            current: this.chapterIndex + 1,
            total,
            title: chapter.title,
        });
        if (prev) prev.disabled = this.chapterIndex <= 0;
        if (next) next.disabled = this.chapterIndex >= total - 1;
    },

    applyReaderSurface() {
        const preview = document.getElementById('sessionLogPreview');
        if (!preview) return;
        SessionLogReader.applySurfaceVars(preview, this.readerSettings);
        const tinted = SessionLogReader.isTintedColorScheme(this.readerSettings.colorScheme);
        for (const page of preview.querySelectorAll('.page')) {
            page.classList.toggle('reader-tinted', tinted);
        }
    },

    renderPreview(options = {}) {
        if (!this.log) return;
        const preview = document.getElementById('sessionLogPreview');
        if (!preview) return;

        const scrollTop = options.preserveScroll ? preview.scrollTop : 0;

        this.applyReaderSurface();

        const chapter = this.currentChapter();
        const multi = this.chapters.length > 1;
        const { html } = SessionLogReader.render(this.log, this.themeId, {
            events: chapter.events,
            chapterTitle: multi ? chapter.title : '',
            showBookHead: !multi,
            readerSettings: this.readerSettings,
        });
        preview.innerHTML = html;
        this.appendChapterFooter(preview);
        this.applyReaderSurface();
        preview.scrollTop = scrollTop;
        this.updateChapterBar();
    },

    chapterNavLabel(direction) {
        const isPrev = direction === 'prev';
        const key = isPrev ? 'trpg_reader_prev_chapter' : 'trpg_reader_next_chapter';
        const translated = this.t(key);
        const text = translated && !translated.startsWith('trpg_') ? translated : (isPrev ? '上一章' : '下一章');
        return isPrev ? `← ${text}` : `${text} →`;
    },

    renderChapterNavButton(direction, chapter) {
        const label = this.chapterNavLabel(direction);
        return `<button type="button" class="reader-chapter-nav-btn reader-chapter-${direction}-btn" data-chapter-nav="${direction}" aria-label="${this.esc(label)}：${this.esc(chapter.title)}">
            <span class="reader-chapter-nav-label">${this.esc(label)}</span>
            <span class="reader-chapter-nav-title">${this.esc(chapter.title)}</span>
        </button>`;
    },

    appendChapterFooter(preview) {
        if (this.chapters.length <= 1) return;

        const hasPrev = this.chapterIndex > 0;
        const hasNext = this.chapterIndex < this.chapters.length - 1;
        const actions = [];
        if (hasPrev) {
            actions.push(this.renderChapterNavButton('prev', this.chapters[this.chapterIndex - 1]));
        }
        if (hasNext) {
            actions.push(this.renderChapterNavButton('next', this.chapters[this.chapterIndex + 1]));
        }
        if (actions.length === 0) return;

        const footer = document.createElement('div');
        footer.className = 'reader-chapter-footer';
        footer.innerHTML = `
            <p class="reader-chapter-footer-hint">${this.esc(this.t('trpg_reader_chapter_nav_hint'))}</p>
            <div class="reader-chapter-footer-actions">${actions.join('')}</div>`;
        preview.appendChild(footer);

        footer.querySelector('[data-chapter-nav="prev"]')?.addEventListener('click', () => {
            this.setChapter(this.chapterIndex - 1);
        });
        footer.querySelector('[data-chapter-nav="next"]')?.addEventListener('click', () => {
            this.setChapter(this.chapterIndex + 1);
        });
    },

    setChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;
        this.chapterIndex = index;
        if (this.chapters.length > 1) {
            globalThis.location.hash = `ch-${index}`;
        }
        this.renderPreview();
        this.renderDrawerBody();
        this.updateChapterBar();
    },

    setTheme(themeId) {
        this.themeId = themeId;
        this.renderPreview();
        this.renderDrawerBody();
    },

    openPanel(panelId) {
        this.activePanel = panelId;
        const overlay = document.getElementById('readerOverlay');
        const title = document.getElementById('readerDrawerTitle');
        if (!overlay || !title) return;

        const titles = {
            catalog: 'trpg_reader_catalog',
            info: 'trpg_reader_info',
            settings: 'trpg_reader_settings',
        };
        title.textContent = this.t(titles[panelId] || 'trpg_reader_settings');
        overlay.hidden = false;
        document.body.classList.add('session-log-drawer-open');

        for (const btn of document.querySelectorAll('[data-reader-panel]')) {
            btn.classList.toggle('active', btn.dataset.readerPanel === panelId);
        }
        this.renderDrawerBody();
    },

    closePanel() {
        this.activePanel = null;
        const overlay = document.getElementById('readerOverlay');
        if (overlay) overlay.hidden = true;
        document.body.classList.remove('session-log-drawer-open');
        for (const btn of document.querySelectorAll('[data-reader-panel]')) {
            btn.classList.remove('active');
        }
    },

    renderCatalogPanel() {
        const items = this.chapters.map((chapter, index) => {
            const active = index === this.chapterIndex ? ' active' : '';
            const count = chapter.events.length;
            return `<button type="button" class="reader-catalog-item${active}" data-chapter-index="${index}">
                <span class="reader-catalog-num">${index + 1}</span>
                <span class="reader-catalog-text">
                    <strong>${this.esc(chapter.title)}</strong>
                    <small>${this.t('trpg_reader_chapter_messages', { count })}</small>
                </span>
            </button>`;
        }).join('');

        return `
            <p class="reader-drawer-hint">${this.esc(this.t('trpg_reader_catalog_hint', { count: this.chapters.length }))}</p>
            <div class="reader-catalog-list">${items}</div>`;
    },

    renderInfoPanel() {
        const log = this.log;
        const messageCount = log.messageCount ?? (log.events || []).length;
        const players = (log.playerNames || []).map((name) => `<span class="trpg-tag">${this.esc(name)}</span>`).join('');
        return `
            <div class="reader-info-card">
                <h3>${this.esc(log.title)}</h3>
                ${log.subtitle ? `<p>${this.esc(log.subtitle)}</p>` : ''}
                <dl class="reader-info-dl">
                    <dt>${this.esc(this.t('trpg_reader_info_date'))}</dt><dd>${this.esc(log.sessionDate || '—')}</dd>
                    <dt>${this.esc(this.t('trpg_reader_info_location'))}</dt><dd>${this.esc(log.location || '—')}</dd>
                    <dt>${this.esc(this.t('trpg_reader_info_messages'))}</dt><dd>${this.esc(this.t('trpg_logs_messages', { count: messageCount }))}</dd>
                    <dt>${this.esc(this.t('trpg_reader_info_chapters'))}</dt><dd>${this.esc(String(this.chapters.length))}</dd>
                </dl>
                ${players ? `<div class="reader-info-tags">${players}</div>` : ''}
            </div>`;
    },

    renderSettingsPanel() {
        const themes = SessionLogReader.THEMES.map((theme) => {
            const active = theme.id === this.themeId ? ' active' : '';
            return `<button type="button" class="reader-theme-chip${active}" data-theme-id="${theme.id}" title="${this.esc(SessionLogReader.themeLabel(theme.id))}">${this.esc(SessionLogReader.themeLabel(theme.id))}</button>`;
        }).join('');

        const widthBtns = this.renderSettingChips('pageWidth', 'pageWidth', (width) => (
            width === 'auto' ? this.t('trpg_reader_width_auto') : width
        ));
        const lineHeightBtns = this.renderSettingChips('lineHeight', 'lineHeight', (value) => (
            this.t(`trpg_reader_line_${value}`)
        ));
        const fontFamilyBtns = this.renderFontFamilyChips();
        const paddingBtns = this.renderSettingChips('contentPadding', 'contentPadding', (value) => (
            this.t(`trpg_reader_padding_${value}`)
        ));

        return `
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_view_theme_nav'))}</h4>
                <div class="reader-theme-grid">${themes}</div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_color_scheme'))}</h4>
                <div class="reader-color-grid">${this.renderColorSchemeChips()}</div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_font_size'))}</h4>
                <div class="reader-font-control">
                    <button type="button" class="reader-setting-chip" data-font-delta="-1">A−</button>
                    <span class="reader-font-value">${this.readerSettings.fontSize}</span>
                    <button type="button" class="reader-setting-chip" data-font-delta="1">A+</button>
                </div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_line_height'))}</h4>
                <div class="reader-setting-row">${lineHeightBtns}</div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_font_family'))}</h4>
                <div class="reader-font-grid">${fontFamilyBtns}</div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_page_width'))}</h4>
                <div class="reader-setting-row">${widthBtns}</div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_content_padding'))}</h4>
                <div class="reader-setting-row">${paddingBtns}</div>
            </div>
            <div class="reader-settings-group">
                <h4>${this.esc(this.t('trpg_reader_display'))}</h4>
                <label class="reader-toggle">
                    <input type="checkbox" id="readerHideOoc" ${this.readerSettings.hideOOC ? 'checked' : ''}>
                    <span>${this.esc(this.t('trpg_reader_hide_ooc'))}</span>
                </label>
                <label class="reader-toggle">
                    <input type="checkbox" id="readerHideDice" ${this.readerSettings.hideDice ? 'checked' : ''}>
                    <span>${this.esc(this.t('trpg_reader_hide_dice'))}</span>
                </label>
                <label class="reader-toggle">
                    <input type="checkbox" id="readerHideNarration" ${this.readerSettings.hideNarration ? 'checked' : ''}>
                    <span>${this.esc(this.t('trpg_reader_hide_narration'))}</span>
                </label>
                <label class="reader-toggle">
                    <input type="checkbox" id="readerHideReferences" ${this.readerSettings.hideReferences ? 'checked' : ''}>
                    <span>${this.esc(this.t('trpg_reader_hide_references'))}</span>
                </label>
                <label class="reader-toggle">
                    <input type="checkbox" id="readerEmphasizeScenes" ${this.readerSettings.emphasizeScenes ? 'checked' : ''}>
                    <span>${this.esc(this.t('trpg_reader_emphasize_scenes'))}</span>
                </label>
            </div>
            <div class="reader-settings-group reader-settings-actions">
                <button type="button" class="reader-setting-chip reader-reset-btn" id="readerResetSettings">
                    ${this.esc(this.t('trpg_reader_reset_settings'))}
                </button>
            </div>`;
    },

    renderDrawerBody() {
        const body = document.getElementById('readerDrawerBody');
        if (!body || !this.activePanel) return;

        if (this.activePanel === 'catalog') {
            body.innerHTML = this.renderCatalogPanel();
        } else if (this.activePanel === 'info') {
            body.innerHTML = this.renderInfoPanel();
        } else {
            body.innerHTML = this.renderSettingsPanel();
        }
        this.bindDrawerEvents(body);
    },

    bindDrawerEvents(body) {
        for (const btn of body.querySelectorAll('[data-chapter-index]')) {
            btn.addEventListener('click', () => {
                this.setChapter(Number(btn.dataset.chapterIndex));
                this.closePanel();
            });
        }

        for (const btn of body.querySelectorAll('[data-theme-id]')) {
            btn.addEventListener('click', () => {
                this.setTheme(btn.dataset.themeId);
            });
        }

        for (const btn of body.querySelectorAll('[data-setting-key]')) {
            btn.addEventListener('click', () => {
                const { settingKey, settingValue } = btn.dataset;
                if (!settingKey) return;
                this.readerSettings[settingKey] = settingValue;
                this.saveReaderSettings();
                if (this.isLayoutSettingKey(settingKey)) {
                    this.applyReaderSurface();
                } else {
                    this.renderPreview({ preserveScroll: settingKey === 'colorScheme' });
                }
                this.renderDrawerBody();
            });
        }

        for (const btn of body.querySelectorAll('[data-font-delta]')) {
            btn.addEventListener('click', () => {
                const delta = Number(btn.dataset.fontDelta);
                this.readerSettings.fontSize = Math.min(32, Math.max(12, this.readerSettings.fontSize + delta));
                this.saveReaderSettings();
                this.applyReaderSurface();
                this.renderDrawerBody();
            });
        }

        const toggleMap = [
            ['#readerHideOoc', 'hideOOC'],
            ['#readerHideDice', 'hideDice'],
            ['#readerHideNarration', 'hideNarration'],
            ['#readerHideReferences', 'hideReferences'],
            ['#readerEmphasizeScenes', 'emphasizeScenes'],
        ];
        for (const [selector, key] of toggleMap) {
            const input = body.querySelector(selector);
            if (!input) continue;
            input.addEventListener('change', () => {
                this.readerSettings[key] = input.checked;
                this.saveReaderSettings();
                this.renderPreview();
                if (key === 'emphasizeScenes') {
                    this.renderDrawerBody();
                }
            });
        }

        body.querySelector('#readerResetSettings')?.addEventListener('click', () => {
            this.resetReaderSettings();
        });
    },

    bindChrome() {
        for (const btn of document.querySelectorAll('[data-reader-panel]')) {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.readerPanel;
                if (this.activePanel === panel) {
                    this.closePanel();
                } else {
                    this.openPanel(panel);
                }
            });
        }

        document.getElementById('readerDrawerClose')?.addEventListener('click', () => this.closePanel());
        document.getElementById('readerOverlay')?.addEventListener('click', (event) => {
            if (event.target.id === 'readerOverlay') this.closePanel();
        });

        document.getElementById('chapterPrev')?.addEventListener('click', () => {
            this.setChapter(this.chapterIndex - 1);
        });
        document.getElementById('chapterNext')?.addEventListener('click', () => {
            this.setChapter(this.chapterIndex + 1);
        });

        globalThis.addEventListener('hashchange', () => {
            const hash = Number.parseInt((globalThis.location.hash || '').replace(/^#ch-?/i, ''), 10);
            if (!Number.isNaN(hash) && hash !== this.chapterIndex && hash >= 0 && hash < this.chapters.length) {
                this.chapterIndex = hash;
                this.renderPreview();
            }
        });

    },

    async load(logId, shareToken) {
        this.logId = logId;
        this.shareToken = shareToken || '';
        this.loadReaderSettings();
        this.log = await SessionLogApi.getLog(logId, shareToken);
        this.themeId = this.log.theme || 'kakuyomu';
        this.buildChapters();
        document.title = `${this.log.title} · HKTRPG`;
        this.setDetailBackLink();
        this.renderPreview();
    },

    async init(logId, shareToken) {
        this.bindChrome();
        try {
            await this.load(logId, shareToken);
            const openPanel = new URLSearchParams(globalThis.location.search).get('open');
            if (openPanel === 'catalog' || openPanel === 'settings' || openPanel === 'info') {
                this.openPanel(openPanel);
            }
        } catch (error) {
            const errorEl = document.getElementById('sessionLogReaderError');
            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = error.status === 403
                    ? this.t('trpg_view_forbidden')
                    : this.t('trpg_view_not_found');
            }
        }
    },
};

if (typeof window !== 'undefined') {
    window.SessionLogViewPage = SessionLogViewPage;

    window.initSessionLogViewPage = async function initSessionLogViewPage(logId, shareToken) {
        await SessionLogViewPage.init(logId, shareToken);
    };
}
