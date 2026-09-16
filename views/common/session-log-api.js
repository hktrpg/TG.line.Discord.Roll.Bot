/**
 * Session log REST API client (JWT via localStorage).
 */
const SessionLogApi = {
    getToken() {
        return localStorage.getItem('jwtToken') || '';
    },

    getUserName() {
        return localStorage.getItem('userName') || '';
    },

    setAuth(userName, token) {
        localStorage.setItem('userName', userName);
        localStorage.setItem('jwtToken', token);
    },

    clearAuth() {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('sessionLogIsAdmin');
    },

    isAdmin() {
        return localStorage.getItem('sessionLogIsAdmin') === '1';
    },

    getAdminSecret() {
        return sessionStorage.getItem('sessionLogAdminSecret') || '';
    },

    setAdminSecret(secret) {
        if (secret) sessionStorage.setItem('sessionLogAdminSecret', secret);
        else sessionStorage.removeItem('sessionLogAdminSecret');
    },

    async request(path, options = {}) {
        const headers = {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {}),
        };
        const token = this.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(path, { ...options, headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(data.error || `HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    },

    async login(userName, userPassword) {
        const data = await this.request('/api/session-logs/auth', {
            method: 'POST',
            body: JSON.stringify({ userName, userPassword }),
        });
        this.setAuth(data.userName || userName, data.token);
        if (data.isAdmin) {
            localStorage.setItem('sessionLogIsAdmin', '1');
        } else {
            localStorage.removeItem('sessionLogIsAdmin');
        }
        return data;
    },

    async listLogs(params = {}) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                query.set(key, String(value));
            }
        }
        const suffix = query.toString() ? `?${query}` : '';
        return this.request(`/api/session-logs${suffix}`);
    },

    async listDemoLogs() {
        return this.request('/api/session-logs/demos');
    },

    async listPublicLogs(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/api/session-logs/public?${query}`);
    },

    async importLog(payload) {
        return this.request('/api/session-logs/import', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async importWork(payload) {
        return this.importLog(payload);
    },

    async previewImport(payload) {
        return this.request('/api/session-logs/preview', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async getImportJob(jobId) {
        return this.request(`/api/session-logs/jobs/${encodeURIComponent(jobId)}`);
    },

    async uploadAsset(file, kind = 'inline') {
        const form = new FormData();
        form.append('file', file);
        form.append('kind', kind);
        return this.request(`/api/session-logs/assets?kind=${encodeURIComponent(kind)}`, {
            method: 'POST',
            body: form,
        });
    },

    async deleteAsset(assetId) {
        return this.request(`/api/session-logs/assets/${encodeURIComponent(assetId)}`, {
            method: 'DELETE',
        });
    },

    async getQuota() {
        return this.request('/api/session-logs/quota');
    },

    async getAuthorMe() {
        return this.request('/api/authors/me');
    },

    async updateAuthorMe(payload) {
        return this.request('/api/authors/me', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },

    async getAuthor(slug) {
        return this.request(`/api/authors/${encodeURIComponent(slug)}`);
    },

    async getLog(id, shareToken) {
        const query = shareToken ? `?token=${encodeURIComponent(shareToken)}` : '';
        return this.request(`/api/session-logs/${encodeURIComponent(id)}${query}`);
    },

    async updateLog(id, payload) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },

    async updateChapters(id, chapters) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}/chapters`, {
            method: 'PATCH',
            body: JSON.stringify({ chapters }),
        });
    },

    async deleteLog(id) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
    },

    async restoreLog(id) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}/restore`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
    },

    async purgeLog(id) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}/purge`, {
            method: 'DELETE',
        });
    },

    async exportLog(id, format = 'json') {
        const token = this.getToken();
        const response = await fetch(
            `/api/session-logs/${encodeURIComponent(id)}/export?format=${encodeURIComponent(format)}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        if (format === 'md') return response.text();
        return response.json();
    },

    async reportLog(id, payload) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}/report`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async adminRequest(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        const secret = this.getAdminSecret();
        if (secret) headers['x-admin-secret'] = secret;
        return this.request(path, { ...options, headers });
    },

    async adminMe() {
        return this.adminRequest('/api/admin/session-logs/me');
    },

    async adminListReports(status = 'open') {
        return this.adminRequest(`/api/admin/session-logs/reports?status=${encodeURIComponent(status)}`);
    },

    async adminUpdateReport(id, status) {
        return this.adminRequest(`/api/admin/session-logs/reports/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    async adminListWorks(params = {}) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                query.set(key, String(value));
            }
        }
        return this.adminRequest(`/api/admin/session-logs/works?${query}`);
    },

    async adminListAuthors() {
        return this.adminRequest('/api/admin/session-logs/authors');
    },

    async adminListAudits(workId) {
        const query = workId ? `?workId=${encodeURIComponent(workId)}` : '';
        return this.adminRequest(`/api/admin/session-logs/audits${query}`);
    },

    async adminModerate(id, state, reason = '') {
        return this.adminRequest(`/api/admin/session-logs/${encodeURIComponent(id)}/moderate`, {
            method: 'POST',
            body: JSON.stringify({ state, reason }),
        });
    },
};

window.SessionLogApi = SessionLogApi;
