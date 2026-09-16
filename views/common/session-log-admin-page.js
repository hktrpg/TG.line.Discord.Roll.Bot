/**
 * Session log admin console — reports / works / authors / audits.
 */
/* global SessionLogApi */
const SessionLogAdminPage = {
    state: {
        tab: 'reports',
        authorized: false,
        actor: '',
        reportStatus: 'open',
        workQuery: { moderation: '', q: '', status: '' },
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

    setTab(tab) {
        this.state.tab = tab;
        this.render();
    },

    async checkAccess() {
        try {
            const data = await SessionLogApi.adminMe();
            this.state.authorized = true;
            this.state.actor = data.actor || '';
            return true;
        } catch {
            this.state.authorized = false;
            this.state.actor = '';
            return false;
        }
    },

    renderLogin(panel) {
        panel.innerHTML = `
            <div class="trpg-console-block trpg-account-card">
                <h2>${this.esc(this.t('trpg_admin_login_title'))}</h2>
                <p class="trpg-form-hint">${this.esc(this.t('trpg_admin_login_hint'))}</p>
                <form id="adminLoginForm" class="trpg-import-form">
                    <div class="trpg-form-group">
                        <label for="adminUserName">${this.esc(this.t('trpg_logs_username'))}</label>
                        <input id="adminUserName" name="userName" autocomplete="username" required>
                    </div>
                    <div class="trpg-form-group">
                        <label for="adminPassword">${this.esc(this.t('trpg_logs_password'))}</label>
                        <input id="adminPassword" name="userPassword" type="password" autocomplete="current-password" required>
                    </div>
                    <p class="trpg-form-hint">${this.esc(this.t('trpg_admin_or_secret'))}</p>
                    <div class="trpg-form-group">
                        <label for="adminSecret">${this.esc(this.t('trpg_admin_secret_label'))}</label>
                        <input id="adminSecret" name="adminSecret" type="password" autocomplete="off">
                    </div>
                    <button class="trpg-btn-primary" type="submit">${this.esc(this.t('trpg_admin_login_btn'))}</button>
                    <p id="adminLoginError" class="trpg-msg-error d-none"></p>
                </form>
            </div>`;
    },

    async renderReports(panel) {
        panel.innerHTML = `<p class="trpg-msg-muted">${this.esc(this.t('trpg_upload_processing'))}</p>`;
        let reports = [];
        try {
            const data = await SessionLogApi.adminListReports(this.state.reportStatus);
            reports = data.reports || [];
        } catch (error) {
            panel.innerHTML = `<p class="trpg-msg-error">${this.esc(error.message)}</p>`;
            return;
        }

        const rows = reports.map((report) => {
            const workTitle = report.work?.title || report.workId;
            return `
                <tr>
                    <td>${this.esc(report.reason)}</td>
                    <td><a href="/logs/${this.esc(report.workId)}">${this.esc(workTitle)}</a></td>
                    <td>${this.esc(report.detail || '')}</td>
                    <td>${this.esc(report.status)}</td>
                    <td class="trpg-admin-actions">
                        <button type="button" class="trpg-btn-sm" data-report-resolve="${this.esc(report.id || report._id)}">${this.esc(this.t('trpg_admin_report_resolve'))}</button>
                        <button type="button" class="trpg-btn-sm" data-report-reject="${this.esc(report.id || report._id)}">${this.esc(this.t('trpg_admin_report_reject'))}</button>
                        <button type="button" class="trpg-btn-sm trpg-btn-danger" data-moderate-id="${this.esc(report.workId)}" data-moderate-state="taken_down">${this.esc(this.t('trpg_admin_take_down'))}</button>
                    </td>
                </tr>`;
        }).join('');

        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_admin_tab_reports'))}</h2>
                    <p>${this.esc(this.t('trpg_admin_actor', { actor: this.state.actor }))}</p>
                </div>
                <div class="trpg-admin-toolbar">
                    <select id="reportStatusFilter">
                        <option value="open"${this.state.reportStatus === 'open' ? ' selected' : ''}>${this.esc(this.t('trpg_admin_report_open'))}</option>
                        <option value="resolved"${this.state.reportStatus === 'resolved' ? ' selected' : ''}>${this.esc(this.t('trpg_admin_report_resolved'))}</option>
                        <option value="rejected"${this.state.reportStatus === 'rejected' ? ' selected' : ''}>${this.esc(this.t('trpg_admin_report_rejected'))}</option>
                    </select>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm trpg-admin-table">
                        <thead>
                            <tr>
                                <th>${this.esc(this.t('trpg_admin_col_reason'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_work'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_detail'))}</th>
                                <th>${this.esc(this.t('trpg_field_status'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_actions'))}</th>
                            </tr>
                        </thead>
                        <tbody>${rows || `<tr><td colspan="5">${this.esc(this.t('trpg_admin_reports_empty'))}</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    },

    async renderWorks(panel) {
        panel.innerHTML = `<p class="trpg-msg-muted">${this.esc(this.t('trpg_upload_processing'))}</p>`;
        let logs = [];
        let total = 0;
        try {
            const data = await SessionLogApi.adminListWorks(this.state.workQuery);
            logs = data.logs || [];
            total = data.total || 0;
        } catch (error) {
            panel.innerHTML = `<p class="trpg-msg-error">${this.esc(error.message)}</p>`;
            return;
        }

        const rows = logs.map((log) => `
            <tr>
                <td><a href="/logs/${this.esc(log.id)}">${this.esc(log.title)}</a></td>
                <td>${this.esc(log.ownerUserName || '')}</td>
                <td>${this.esc(log.status)}</td>
                <td>${this.esc(log.visibility)}</td>
                <td>${this.esc(log.moderation || 'ok')}</td>
                <td class="trpg-admin-actions">
                    <button type="button" class="trpg-btn-sm" data-moderate-id="${this.esc(log.id)}" data-moderate-state="ok">${this.esc(this.t('trpg_admin_restore_ok'))}</button>
                    <button type="button" class="trpg-btn-sm" data-moderate-id="${this.esc(log.id)}" data-moderate-state="under_review">${this.esc(this.t('trpg_admin_under_review'))}</button>
                    <button type="button" class="trpg-btn-sm trpg-btn-danger" data-moderate-id="${this.esc(log.id)}" data-moderate-state="taken_down">${this.esc(this.t('trpg_admin_take_down'))}</button>
                </td>
            </tr>`).join('');

        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_admin_tab_works'))}</h2>
                    <p>${this.esc(this.t('trpg_admin_works_total', { count: total }))}</p>
                </div>
                <form id="adminWorkFilter" class="trpg-admin-toolbar">
                    <input name="q" placeholder="${this.esc(this.t('trpg_library_search'))}" value="${this.esc(this.state.workQuery.q || '')}">
                    <select name="moderation">
                        <option value="">${this.esc(this.t('trpg_admin_moderation_all'))}</option>
                        <option value="ok"${this.state.workQuery.moderation === 'ok' ? ' selected' : ''}>ok</option>
                        <option value="under_review"${this.state.workQuery.moderation === 'under_review' ? ' selected' : ''}>under_review</option>
                        <option value="taken_down"${this.state.workQuery.moderation === 'taken_down' ? ' selected' : ''}>taken_down</option>
                    </select>
                    <button class="trpg-btn-sm" type="submit">${this.esc(this.t('trpg_library_filter'))}</button>
                </form>
                <div class="table-responsive">
                    <table class="table table-sm trpg-admin-table">
                        <thead>
                            <tr>
                                <th>${this.esc(this.t('trpg_admin_col_work'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_author'))}</th>
                                <th>${this.esc(this.t('trpg_field_status'))}</th>
                                <th>${this.esc(this.t('trpg_upload_visibility'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_moderation'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_actions'))}</th>
                            </tr>
                        </thead>
                        <tbody>${rows || `<tr><td colspan="6">${this.esc(this.t('trpg_explore_empty'))}</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    },

    async renderAuthors(panel) {
        panel.innerHTML = `<p class="trpg-msg-muted">${this.esc(this.t('trpg_upload_processing'))}</p>`;
        let authors = [];
        try {
            const data = await SessionLogApi.adminListAuthors();
            authors = data.authors || [];
        } catch (error) {
            panel.innerHTML = `<p class="trpg-msg-error">${this.esc(error.message)}</p>`;
            return;
        }
        const rows = authors.map((author) => `
            <tr>
                <td>${this.esc(author.userName)}${author.isAdmin ? ' <span class="trpg-status-badge">ADMIN</span>' : ''}</td>
                <td>${this.esc(author.profile?.penName || '')}</td>
                <td>${author.profile?.slug ? `<a href="/authors/${this.esc(author.profile.slug)}">${this.esc(author.profile.slug)}</a>` : '—'}</td>
                <td>${author.profile?.isPublic ? 'public' : 'private'}</td>
            </tr>`).join('');
        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_admin_tab_authors'))}</h2>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm trpg-admin-table">
                        <thead>
                            <tr>
                                <th>${this.esc(this.t('trpg_logs_username'))}</th>
                                <th>${this.esc(this.t('trpg_author_pen_name'))}</th>
                                <th>${this.esc(this.t('trpg_author_slug'))}</th>
                                <th>${this.esc(this.t('trpg_author_public'))}</th>
                            </tr>
                        </thead>
                        <tbody>${rows || `<tr><td colspan="4">—</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    },

    async renderAudits(panel) {
        panel.innerHTML = `<p class="trpg-msg-muted">${this.esc(this.t('trpg_upload_processing'))}</p>`;
        let audits = [];
        try {
            const data = await SessionLogApi.adminListAudits();
            audits = data.audits || [];
        } catch (error) {
            panel.innerHTML = `<p class="trpg-msg-error">${this.esc(error.message)}</p>`;
            return;
        }
        const rows = audits.map((audit) => `
            <tr>
                <td>${this.esc(audit.createdAt ? new Date(audit.createdAt).toLocaleString() : '')}</td>
                <td>${this.esc(audit.actor)}</td>
                <td>${this.esc(audit.action)}</td>
                <td><a href="/logs/${this.esc(audit.workId)}">${this.esc(audit.workId)}</a></td>
                <td><code>${this.esc(JSON.stringify(audit.detail || {}))}</code></td>
            </tr>`).join('');
        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_admin_tab_audits'))}</h2>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm trpg-admin-table">
                        <thead>
                            <tr>
                                <th>${this.esc(this.t('trpg_admin_col_time'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_actor'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_action'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_work'))}</th>
                                <th>${this.esc(this.t('trpg_admin_col_detail'))}</th>
                            </tr>
                        </thead>
                        <tbody>${rows || `<tr><td colspan="5">—</td></tr>`}</tbody>
                    </table>
                </div>
            </div>`;
    },

    bindEvents(panel) {
        const loginForm = panel.querySelector('#adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const err = panel.querySelector('#adminLoginError');
                err?.classList.add('d-none');
                try {
                    const secret = loginForm.adminSecret.value.trim();
                    if (secret) {
                        SessionLogApi.setAdminSecret(secret);
                    } else {
                        SessionLogApi.setAdminSecret('');
                        const userName = loginForm.userName.value.trim();
                        const userPassword = loginForm.userPassword.value;
                        await SessionLogApi.login(userName, userPassword);
                        if (!SessionLogApi.isAdmin()) {
                            throw new Error(this.t('trpg_admin_not_admin'));
                        }
                    }
                    const ok = await this.checkAccess();
                    if (!ok) throw new Error(this.t('trpg_admin_login_failed'));
                    this.setTab('reports');
                } catch (error) {
                    if (err) {
                        err.textContent = error.message || this.t('trpg_admin_login_failed');
                        err.classList.remove('d-none');
                    }
                }
            });
        }

        const reportFilter = panel.querySelector('#reportStatusFilter');
        if (reportFilter) {
            reportFilter.addEventListener('change', () => {
                this.state.reportStatus = reportFilter.value;
                this.render();
            });
        }

        const workFilter = panel.querySelector('#adminWorkFilter');
        if (workFilter) {
            workFilter.addEventListener('submit', (event) => {
                event.preventDefault();
                this.state.workQuery = {
                    q: workFilter.q.value.trim(),
                    moderation: workFilter.moderation.value,
                };
                this.render();
            });
        }

        for (const btn of panel.querySelectorAll('[data-report-resolve]')) {
            btn.addEventListener('click', async () => {
                await SessionLogApi.adminUpdateReport(btn.dataset.reportResolve, 'resolved');
                this.render();
            });
        }
        for (const btn of panel.querySelectorAll('[data-report-reject]')) {
            btn.addEventListener('click', async () => {
                await SessionLogApi.adminUpdateReport(btn.dataset.reportReject, 'rejected');
                this.render();
            });
        }
        for (const btn of panel.querySelectorAll('[data-moderate-id]')) {
            btn.addEventListener('click', async () => {
                const reason = globalThis.prompt(this.t('trpg_admin_reason_prompt'), '') || '';
                await SessionLogApi.adminModerate(btn.dataset.moderateId, btn.dataset.moderateState, reason);
                this.render();
            });
        }
    },

    updateNav() {
        for (const btn of document.querySelectorAll('[data-admin-tab]')) {
            const active = btn.dataset.adminTab === this.state.tab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-current', active ? 'page' : 'false');
        }
    },

    async render() {
        this.updateNav();
        const panel = document.getElementById('adminPanel');
        if (!panel) return;

        if (!this.state.authorized && this.state.tab !== 'login') {
            this.state.tab = 'login';
        }

        switch (this.state.tab) {
            case 'login': {
                this.renderLogin(panel);
                break;
            }
            case 'reports': {
                await this.renderReports(panel);
                break;
            }
            case 'works': {
                await this.renderWorks(panel);
                break;
            }
            case 'authors': {
                await this.renderAuthors(panel);
                break;
            }
            case 'audits': {
                await this.renderAudits(panel);
                break;
            }
            default: {
                this.renderLogin(panel);
            }
        }

        this.bindEvents(panel);
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(panel);
        }
    },

    async init() {
        await this.checkAccess();
        this.state.tab = this.state.authorized ? 'reports' : 'login';
        for (const btn of document.querySelectorAll('[data-admin-tab]')) {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                this.setTab(btn.dataset.adminTab);
            });
        }
        await this.render();
    },
};

window.SessionLogAdminPage = SessionLogAdminPage;

async function initSessionLogAdminPage() {
    await SessionLogAdminPage.init();
}

window.initSessionLogAdminPage = initSessionLogAdminPage;
