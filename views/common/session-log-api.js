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
    },

    async request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
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
        return data;
    },

    async listLogs() {
        return this.request('/api/session-logs');
    },

    async listDemoLogs() {
        return this.request('/api/session-logs/demos');
    },

    async importLog(payload) {
        return this.request('/api/session-logs/import', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
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

    async deleteLog(id) {
        return this.request(`/api/session-logs/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
    },
};

window.SessionLogApi = SessionLogApi;
