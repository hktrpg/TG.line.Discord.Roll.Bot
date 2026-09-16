/**
 * Session log edit page — basic / rating / cover / chapters / publish / danger tabs.
 */
/* global SessionLogApi */
const SessionLogEditPage = {
    logId: '',
    log: null,
    tab: 'basic',

    RATINGS: ['general', 'teen', 'r15', 'r18'],
    LICENSES: ['all_rights_reserved', 'cc_by', 'cc_by_nc', 'cc_by_nc_nd', 'cc0'],
    ORIGINALITIES: ['original', 'fanwork', 'translation'],
    THEMES: ['kakuyomu', 'kindle', 'parchment', 'notion', 'letter', 'script', 'discord', 'chat', 'term'],
    STATUSES: ['draft', 'scheduled', 'published', 'archived'],

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

    setTab(tab) {
        this.tab = tab;
        for (const btn of document.querySelectorAll('[data-edit-tab]')) {
            const active = btn.dataset.editTab === tab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-current', active ? 'page' : 'false');
        }
        this.renderPanel();
    },

    renderPanel() {
        const panel = document.getElementById('editPanel');
        if (!panel || !this.log) return;

        const log = this.log;
        let html = '';

        if (this.tab === 'basic') {
            html = `
                <form id="editBasicForm" class="trpg-import-form">
                    <div class="trpg-form-group"><label for="editTitle">${this.esc(this.t('trpg_upload_title_label'))}</label><input id="editTitle" value="${this.esc(log.title)}"></div>
                    <div class="trpg-form-group"><label for="editSubtitle">${this.esc(this.t('trpg_edit_subtitle'))}</label><input id="editSubtitle" value="${this.esc(log.subtitle || '')}"></div>
                    <div class="trpg-form-group"><label for="editSynopsis">${this.esc(this.t('trpg_edit_synopsis'))}</label><textarea id="editSynopsis" rows="5">${this.esc(log.synopsis || '')}</textarea></div>
                    <div class="trpg-form-group"><label for="editTags">${this.esc(this.t('trpg_edit_tags'))}</label><input id="editTags" value="${this.esc((log.tags || []).join(', '))}"></div>
                    <div class="trpg-form-group"><label for="editGenre">${this.esc(this.t('trpg_edit_genre'))}</label><input id="editGenre" value="${this.esc(log.genre || '')}"></div>
                    <div class="trpg-form-group"><label for="editSessionDate">${this.esc(this.t('trpg_reader_info_date'))}</label><input id="editSessionDate" value="${this.esc(log.sessionDate || '')}"></div>
                    <div class="trpg-form-group"><label for="editLocation">${this.esc(this.t('trpg_reader_info_location'))}</label><input id="editLocation" value="${this.esc(log.location || '')}"></div>
                    <div class="trpg-form-group"><label for="editTheme">${this.esc(this.t('trpg_view_theme_nav'))}</label>
                        <select id="editTheme">${this.THEMES.map((th) => `<option value="${th}"${log.theme === th ? ' selected' : ''}>${this.esc(this.t(`trpg_theme_${th}`))}</option>`).join('')}</select>
                    </div>
                    <button type="submit" class="trpg-btn-primary">${this.esc(this.t('trpg_edit_save'))}</button>
                    <p id="editStatus" class="trpg-msg-muted"></p>
                    <p id="editError" class="trpg-msg-error d-none"></p>
                </form>`;
        } else if (this.tab === 'rating') {
            html = `
                <form id="editRatingForm" class="trpg-import-form">
                    <div class="trpg-form-group"><label for="editRating">${this.esc(this.t('trpg_rating_label'))}</label>
                        <select id="editRating">${this.RATINGS.map((r) => `<option value="${r}"${log.rating === r ? ' selected' : ''}>${this.esc(this.t(`trpg_rating_${r}`))}</option>`).join('')}</select>
                    </div>
                    <div class="trpg-form-group"><label for="editWarnings">${this.esc(this.t('trpg_edit_content_warnings'))}</label><input id="editWarnings" value="${this.esc((log.contentWarnings || []).join(', '))}"></div>
                    <div class="trpg-form-group"><label for="editLicense">${this.esc(this.t('trpg_license_label'))}</label>
                        <select id="editLicense">${this.LICENSES.map((l) => `<option value="${l}"${log.license === l ? ' selected' : ''}>${this.esc(this.t(`trpg_license_${l}`))}</option>`).join('')}</select>
                    </div>
                    <div class="trpg-form-group"><label for="editOriginality">${this.esc(this.t('trpg_originality_label'))}</label>
                        <select id="editOriginality">${this.ORIGINALITIES.map((o) => `<option value="${o}"${log.originality === o ? ' selected' : ''}>${this.esc(this.t(`trpg_originality_${o}`))}</option>`).join('')}</select>
                    </div>
                    <div class="trpg-form-group" id="editAttributionGroup"${log.originality === 'original' ? ' hidden' : ''}>
                        <label for="editSourceAttribution">${this.esc(this.t('trpg_source_attribution_label'))}</label>
                        <input id="editSourceAttribution" value="${this.esc(log.sourceAttribution || '')}">
                    </div>
                    <button type="submit" class="trpg-btn-primary">${this.esc(this.t('trpg_edit_save'))}</button>
                    <p id="editStatus" class="trpg-msg-muted"></p>
                    <p id="editError" class="trpg-msg-error d-none"></p>
                </form>`;
        } else if (this.tab === 'cover') {
            html = `
                <form id="editCoverForm" class="trpg-import-form">
                    ${log.coverUrl ? `<img class="trpg-log-card-cover-img" src="${this.esc(log.coverUrl)}" alt="" style="max-width:200px;border-radius:8px;margin-bottom:1rem;">` : ''}
                    <div class="trpg-form-group"><label for="editCoverFile">${this.esc(this.t('trpg_edit_cover_upload'))}</label><input id="editCoverFile" type="file" accept="image/*"></div>
                    <div class="trpg-form-group"><label for="editCoverUrl">${this.esc(this.t('trpg_edit_cover_url'))}</label><input id="editCoverUrl" value="${this.esc(log.coverUrl || '')}"></div>
                    <button type="submit" class="trpg-btn-primary">${this.esc(this.t('trpg_edit_save'))}</button>
                    <p id="editStatus" class="trpg-msg-muted"></p>
                    <p id="editError" class="trpg-msg-error d-none"></p>
                </form>`;
        } else if (this.tab === 'chapters') {
            const chapters = log.chapters || [];
            html = `
                <form id="editChaptersForm" class="trpg-import-form">
                    <p class="trpg-form-hint">${this.esc(this.t('trpg_edit_chapters_hint'))}</p>
                    <div id="chapterList">${chapters.map((ch, i) => `
                        <div class="trpg-chapter-edit-row" data-index="${i}">
                            <input type="hidden" class="chapter-id" value="${this.esc(ch.id)}">
                            <input class="chapter-title" value="${this.esc(ch.title)}" placeholder="${this.esc(this.t('trpg_edit_chapter_title'))}">
                            <select class="chapter-status">
                                ${['draft', 'scheduled', 'published'].map((s) => `<option value="${s}"${ch.status === s ? ' selected' : ''}>${this.esc(this.t(`trpg_status_${s}`))}</option>`).join('')}
                            </select>
                        </div>`).join('')}</div>
                    <button type="submit" class="trpg-btn-primary">${this.esc(this.t('trpg_edit_save'))}</button>
                    <p id="editStatus" class="trpg-msg-muted"></p>
                    <p id="editError" class="trpg-msg-error d-none"></p>
                </form>`;
        } else if (this.tab === 'publish') {
            const publishAt = log.publishAt ? new Date(log.publishAt).toISOString().slice(0, 16) : '';
            html = `
                <form id="editPublishForm" class="trpg-import-form">
                    <div class="trpg-form-group"><label for="editVisibility">${this.esc(this.t('trpg_upload_visibility'))}</label>
                        <select id="editVisibility">
                            <option value="private"${log.visibility === 'private' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_private'))}</option>
                            <option value="unlisted"${log.visibility === 'unlisted' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_unlisted'))}</option>
                            <option value="public"${log.visibility === 'public' ? ' selected' : ''}>${this.esc(this.t('trpg_upload_visibility_public'))}</option>
                        </select>
                    </div>
                    <div class="trpg-form-group"><label for="editStatusField">${this.esc(this.t('trpg_edit_status'))}</label>
                        <select id="editStatusField">${this.STATUSES.map((s) => `<option value="${s}"${log.status === s ? ' selected' : ''}>${this.esc(this.t(`trpg_status_${s}`))}</option>`).join('')}</select>
                    </div>
                    <div class="trpg-form-group" id="editPublishAtGroup"${log.status !== 'scheduled' ? ' hidden' : ''}>
                        <label for="editPublishAt">${this.esc(this.t('trpg_edit_publish_at'))}</label>
                        <input id="editPublishAt" type="datetime-local" value="${this.esc(publishAt)}">
                    </div>
                    <button type="submit" class="trpg-btn-primary">${this.esc(this.t('trpg_edit_save'))}</button>
                    <p id="editStatus" class="trpg-msg-muted"></p>
                    <p id="editError" class="trpg-msg-error d-none"></p>
                </form>`;
        } else {
            html = `
                <div class="trpg-import-form">
                    <p class="trpg-form-hint">${this.esc(this.t('trpg_edit_danger_hint'))}</p>
                    <div class="trpg-form-group">
                        <button type="button" class="trpg-btn-sm" id="exportJsonBtn">${this.esc(this.t('trpg_work_action_export'))}</button>
                    </div>
                    <div class="trpg-form-group">
                        <button type="button" class="trpg-btn-sm trpg-btn-danger" id="softDeleteBtn">${this.esc(this.t('trpg_logs_delete'))}</button>
                    </div>
                    <div class="trpg-form-group">
                        <button type="button" class="trpg-btn-sm trpg-btn-danger" id="purgeBtn">${this.esc(this.t('trpg_trash_purge'))}</button>
                    </div>
                    <p id="editStatus" class="trpg-msg-muted"></p>
                    <p id="editError" class="trpg-msg-error d-none"></p>
                </div>`;
        }

        panel.innerHTML = html;
        this.bindPanelEvents(panel);
        if (typeof wwwApplyDomI18n === 'function') wwwApplyDomI18n(panel);
    },

    async savePatch(payload, panel) {
        const statusEl = panel.querySelector('#editStatus');
        const errorEl = panel.querySelector('#editError');
        errorEl?.classList.add('d-none');
        try {
            await SessionLogApi.updateLog(this.logId, payload);
            this.log = await SessionLogApi.getLog(this.logId);
            if (statusEl) statusEl.textContent = this.t('trpg_edit_saved');
            const titleEl = document.getElementById('editPageTitle');
            if (titleEl) titleEl.textContent = this.log.title;
        } catch (error) {
            if (errorEl) {
                errorEl.textContent = error.message || this.t('trpg_edit_save_failed');
                errorEl.classList.remove('d-none');
            }
        }
    },

    bindPanelEvents(panel) {
        const basicForm = panel.querySelector('#editBasicForm');
        if (basicForm) {
            basicForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const tags = panel.querySelector('#editTags').value.split(',').map((t) => t.trim()).filter(Boolean);
                await this.savePatch({
                    title: panel.querySelector('#editTitle').value.trim(),
                    subtitle: panel.querySelector('#editSubtitle').value.trim(),
                    synopsis: panel.querySelector('#editSynopsis').value.trim(),
                    tags,
                    genre: panel.querySelector('#editGenre').value.trim(),
                    sessionDate: panel.querySelector('#editSessionDate').value.trim(),
                    location: panel.querySelector('#editLocation').value.trim(),
                    theme: panel.querySelector('#editTheme').value,
                }, panel);
            });
        }

        const ratingForm = panel.querySelector('#editRatingForm');
        if (ratingForm) {
            const originality = panel.querySelector('#editOriginality');
            originality?.addEventListener('change', () => {
                const group = panel.querySelector('#editAttributionGroup');
                if (group) group.hidden = originality.value === 'original';
            });
            ratingForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const warnings = panel.querySelector('#editWarnings').value.split(',').map((t) => t.trim()).filter(Boolean);
                await this.savePatch({
                    rating: panel.querySelector('#editRating').value,
                    contentWarnings: warnings,
                    license: panel.querySelector('#editLicense').value,
                    originality: panel.querySelector('#editOriginality').value,
                    sourceAttribution: panel.querySelector('#editSourceAttribution').value.trim(),
                }, panel);
            });
        }

        const coverForm = panel.querySelector('#editCoverForm');
        if (coverForm) {
            const coverFile = panel.querySelector('#editCoverFile');
            coverFile?.addEventListener('change', async () => {
                const file = coverFile.files?.[0];
                if (!file) return;
                const statusEl = panel.querySelector('#editStatus');
                if (statusEl) statusEl.textContent = this.t('trpg_upload_processing');
                try {
                    const result = await SessionLogApi.uploadAsset(file, 'cover');
                    panel.querySelector('#editCoverUrl').value = result.url;
                    if (statusEl) statusEl.textContent = '';
                } catch (error) {
                    const errorEl = panel.querySelector('#editError');
                    if (errorEl) {
                        errorEl.textContent = error.message;
                        errorEl.classList.remove('d-none');
                    }
                    if (statusEl) statusEl.textContent = '';
                }
            });
            coverForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await this.savePatch({ coverUrl: panel.querySelector('#editCoverUrl').value.trim() }, panel);
                this.renderPanel();
            });
        }

        const chaptersForm = panel.querySelector('#editChaptersForm');
        if (chaptersForm) {
            chaptersForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const statusEl = panel.querySelector('#editStatus');
                const errorEl = panel.querySelector('#editError');
                errorEl?.classList.add('d-none');
                const chapters = [...panel.querySelectorAll('.trpg-chapter-edit-row')].map((row, index) => ({
                    id: row.querySelector('.chapter-id').value,
                    title: row.querySelector('.chapter-title').value.trim(),
                    status: row.querySelector('.chapter-status').value,
                    order: index,
                }));
                try {
                    await SessionLogApi.updateChapters(this.logId, chapters);
                    this.log = await SessionLogApi.getLog(this.logId);
                    if (statusEl) statusEl.textContent = this.t('trpg_edit_saved');
                } catch (error) {
                    if (errorEl) {
                        errorEl.textContent = error.message;
                        errorEl.classList.remove('d-none');
                    }
                }
            });
        }

        const publishForm = panel.querySelector('#editPublishForm');
        if (publishForm) {
            const statusField = panel.querySelector('#editStatusField');
            statusField?.addEventListener('change', () => {
                const group = panel.querySelector('#editPublishAtGroup');
                if (group) group.hidden = statusField.value !== 'scheduled';
            });
            publishForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const publishAt = panel.querySelector('#editPublishAt').value;
                await this.savePatch({
                    visibility: panel.querySelector('#editVisibility').value,
                    status: statusField.value,
                    publishAt: publishAt || undefined,
                }, panel);
            });
        }

        panel.querySelector('#exportJsonBtn')?.addEventListener('click', async () => {
            const data = await SessionLogApi.exportLog(this.logId, 'json');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `session-log-${this.logId}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
        });

        panel.querySelector('#softDeleteBtn')?.addEventListener('click', async () => {
            if (!globalThis.confirm(this.t('trpg_logs_confirm_delete'))) return;
            await SessionLogApi.deleteLog(this.logId);
            globalThis.location.href = '/logs#trash';
        });

        panel.querySelector('#purgeBtn')?.addEventListener('click', async () => {
            if (!globalThis.confirm(this.t('trpg_trash_confirm_purge'))) return;
            await SessionLogApi.purgeLog(this.logId);
            globalThis.location.href = '/logs';
        });
    },

    async load(logId) {
        this.logId = logId;
        this.log = await SessionLogApi.getLog(logId);
        if (!this.log.canEdit) {
            throw new Error(this.t('trpg_edit_forbidden'));
        }
        const titleEl = document.getElementById('editPageTitle');
        const leadEl = document.getElementById('editPageLead');
        const backLink = document.getElementById('editBackLink');
        if (titleEl) titleEl.textContent = this.log.title;
        if (leadEl) leadEl.textContent = this.log.subtitle || '';
        if (backLink) backLink.href = `/logs/${logId}`;
        document.title = `${this.log.title} · ${this.t('trpg_edit_page_title')}`;
        this.renderPanel();
    },

    async init(logId) {
        for (const btn of document.querySelectorAll('[data-edit-tab]')) {
            btn.addEventListener('click', () => this.setTab(btn.dataset.editTab));
        }
        const panel = document.getElementById('editPanel');
        try {
            await this.load(logId);
        } catch (error) {
            if (panel) {
                panel.innerHTML = `<p class="trpg-msg-error">${this.esc(error.message || this.t('trpg_view_not_found'))}</p>`;
            }
        }
    },
};

window.SessionLogEditPage = SessionLogEditPage;

window.initSessionLogEditPage = async function initSessionLogEditPage(logId) {
    await SessionLogEditPage.init(logId);
};
