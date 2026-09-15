/**
 * Session log console — sidebar layout with library / import / account tabs.
 */
/* global SessionLogApi, SessionLogDecrypt */
const SessionLogDashboard = {
    state: {
        tab: 'library',
        loggedIn: false,
        userName: '',
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
        if (hash === 'import' || hash === 'account') return hash;
        return 'library';
    },

    isLoggedIn() {
        return Boolean(SessionLogApi.getToken());
    },

    async refreshAuth() {
        this.state.loggedIn = this.isLoggedIn();
        this.state.userName = SessionLogApi.getUserName();
        if (!this.state.loggedIn) return;
        try {
            await SessionLogApi.listLogs();
        } catch {
            SessionLogApi.clearAuth();
            this.state.loggedIn = false;
            this.state.userName = '';
        }
    },

    renderLogRow(log, options = {}) {
        const { demo = false } = options;
        const players = (log.playerNames || []).slice(0, 4);
        const tags = players.map((name) => `<span class="trpg-tag">${this.esc(name)}</span>`).join('');
        const demoBadge = demo
            ? `<span class="trpg-tag trpg-tag-demo">${this.esc(this.t('trpg_logs_demo_badge'))}</span>`
            : '';
        return `
            <article class="trpg-log-item${demo ? ' trpg-log-item-demo' : ''}">
                <div>
                    <h3>${this.esc(log.title)}</h3>
                    <p class="trpg-log-meta">${this.esc(log.sessionDate || '')} · ${this.t('trpg_logs_messages', { count: log.messageCount || 0 })}</p>
                    ${log.subtitle ? `<p class="trpg-log-subtitle">${this.esc(log.subtitle)}</p>` : ''}
                    <div class="trpg-tags">${demoBadge}${tags}</div>
                </div>
                <div class="trpg-log-actions">
                    <a class="trpg-btn-sm trpg-btn-sm-accent" href="/logs/${this.esc(log.id)}">${this.esc(this.t('trpg_logs_read'))}</a>
                </div>
            </article>`;
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
                const data = await SessionLogApi.listLogs();
                userLogs = data.logs || [];
            } catch {
                userLogs = [];
            }
        }

        const demoHtml = (demos.logs || []).map((log) => this.renderLogRow(log, { demo: true })).join('');
        const userHtml = userLogs.map((log) => this.renderLogRow(log)).join('');

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
                <div class="trpg-log-list">${demoHtml}</div>
            </section>
            ${this.state.loggedIn ? `
            <section class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_logs_my_section'))}</h2>
                    <a class="trpg-btn-sm" href="#import" data-tab-jump="import">${this.esc(this.t('trpg_logs_import_action'))}</a>
                </div>
                <div class="trpg-log-list">${userHtml || `<p class="trpg-msg-muted">${this.esc(this.t('trpg_logs_empty'))}</p>`}</div>
            </section>` : ''}`;
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

        panel.innerHTML = `
            <div class="trpg-console-block">
                <div class="trpg-console-block-head">
                    <h2>${this.esc(this.t('trpg_import_title'))}</h2>
                    <p>${this.esc(this.t('trpg_import_lead'))}</p>
                </div>
                <div class="trpg-import-steps">
                    <div class="trpg-import-step"><span>1</span><p>${this.esc(this.t('trpg_import_step_file'))}</p></div>
                    <div class="trpg-import-step"><span>2</span><p>${this.esc(this.t('trpg_import_step_decrypt'))}</p></div>
                    <div class="trpg-import-step"><span>3</span><p>${this.esc(this.t('trpg_import_step_publish'))}</p></div>
                </div>
                <form id="importForm" class="trpg-import-form">
                    <div class="trpg-form-group">
                        <label for="logTitle">${this.esc(this.t('trpg_upload_title_label'))}</label>
                        <input id="logTitle" name="logTitle" data-www-i18n-placeholder="trpg_upload_title_placeholder">
                    </div>
                    <div class="trpg-form-group">
                        <label for="exportFile">${this.esc(this.t('trpg_upload_file'))}</label>
                        <input id="exportFile" name="exportFile" type="file" accept=".html,text/html" required>
                    </div>
                    <div class="trpg-form-group">
                        <label for="exportPassword">${this.esc(this.t('trpg_upload_password'))}</label>
                        <input id="exportPassword" name="exportPassword" type="password" maxlength="32" required>
                        <p class="trpg-form-hint">${this.esc(this.t('trpg_import_password_hint'))}</p>
                    </div>
                    <div class="trpg-form-group">
                        <label for="visibility">${this.esc(this.t('trpg_upload_visibility'))}</label>
                        <select id="visibility" name="visibility">
                            <option value="private">${this.esc(this.t('trpg_upload_visibility_private'))}</option>
                            <option value="unlisted">${this.esc(this.t('trpg_upload_visibility_unlisted'))}</option>
                        </select>
                    </div>
                    <button class="trpg-btn-primary trpg-import-submit" type="submit">${this.esc(this.t('trpg_upload_btn'))}</button>
                    <p id="importStatus" class="trpg-msg-muted"></p>
                    <p id="importError" class="trpg-msg-error d-none"></p>
                </form>
            </div>`;

        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(panel);
        }
    },

    renderAccount(panel) {
        if (this.state.loggedIn) {
            panel.innerHTML = `
                <div class="trpg-console-block trpg-account-card">
                    <h2>${this.esc(this.t('trpg_account_title'))}</h2>
                    <p class="trpg-msg-muted">${this.esc(this.t('trpg_logs_logged_in', { user: this.state.userName }))}</p>
                    <p class="trpg-form-hint">${this.esc(this.t('trpg_account_hint'))}</p>
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
                this.setTab('account');
            });
        }

        const importForm = panel.querySelector('#importForm');
        if (importForm) {
            importForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const status = panel.querySelector('#importStatus');
                const error = panel.querySelector('#importError');
                error?.classList.add('d-none');
                if (status) status.textContent = this.t('trpg_upload_processing');

                const file = importForm.exportFile.files[0];
                const exportPassword = importForm.exportPassword.value;
                const title = importForm.logTitle.value.trim();
                const visibility = importForm.visibility.value;

                if (!file || !exportPassword) {
                    if (error) {
                        error.textContent = this.t('trpg_upload_fill_all');
                        error.classList.remove('d-none');
                    }
                    if (status) status.textContent = '';
                    return;
                }

                try {
                    const parsed = await SessionLogDecrypt.parseExportHtmlFile(file, exportPassword);
                    const result = await SessionLogApi.importLog({
                        title: title || parsed.channelName || this.t('trpg_upload_title_placeholder'),
                        channelName: parsed.channelName,
                        messages: parsed.messages,
                        visibility,
                    });
                    globalThis.location.href = `/logs/${result.id}`;
                } catch (importError) {
                    if (error) {
                        error.textContent = importError.message || this.t('trpg_upload_fill_all');
                        error.classList.remove('d-none');
                    }
                    if (status) status.textContent = '';
                }
            });
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
        } else {
            this.renderAccount(panel);
        }
        this.bindPanelEvents(panel);
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(panel);
        }
    },

    async init() {
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
