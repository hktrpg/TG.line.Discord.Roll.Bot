'use strict';

const {
    buildSessionLogFromMessages,
    applyMods,
    generateShareToken,
} = require('./discord-import.js');
const {
    listDemoLogs,
    getDemoLog,
    isDemoLogId,
} = require('./demo-logs.js');

const MAX_IMPORT_MESSAGES = 20_000;
const MAX_EVENTS_RETURN = 5000;

/**
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getBearerToken(req) {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string') return null;
    if (!header.startsWith('Bearer ')) return null;
    return header.slice(7).trim();
}

/**
 * @param {object} deps
 * @param {import('express').Application} deps.www
 * @param {object} deps.schema
 * @param {object} deps.security
 * @param {function} deps.checkRateLimit
 * @param {function} deps.verifyPasswordSecure
 */
function registerSessionLogRoutes({
    www,
    schema,
    security,
    checkRateLimit,
    verifyPasswordSecure,
}) {
    if (!www || !schema?.sessionLog) return;

    /**
     * @param {import('express').Request} req
     * @returns {Promise<{ discordId: string, userName: string }|null>}
     */
    async function resolveAuthUser(req) {
        const token = getBearerToken(req);
        if (!token || !security.verifyToken) return null;
        const decoded = security.verifyToken(token);
        if (!decoded?.userName) return null;
        const doc = await schema.accountPW.findOne({
            userName: String(decoded.userName).trim(),
        }).lean().catch(() => null);
        if (!doc?.id) return null;
        return {
            discordId: doc.id,
            userName: doc.userName || decoded.userName,
        };
    }

    function sendJson(res, status, body) {
        res.status(status).json(body);
    }

    www.post('/api/session-logs/auth', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const validation = security.validateCredentials(req.body || {});
            if (!validation.valid) {
                sendJson(res, 400, { error: validation.error });
                return;
            }
            const { userName, userPassword } = validation.data;
            const doc = await schema.accountPW.findOne({
                userName: String(userName).trim(),
            });
            if (!doc) {
                sendJson(res, 401, { error: 'USER_NOT_FOUND' });
                return;
            }
            const isValid = await verifyPasswordSecure(userPassword, doc.password);
            if (!isValid) {
                sendJson(res, 401, { error: 'INVALID_PASSWORD' });
                return;
            }
            if (!security.generateToken) {
                sendJson(res, 500, { error: 'JWT_UNAVAILABLE' });
                return;
            }
            const token = security.generateToken({
                id: doc._id.toString(),
                userName: doc.userName,
            });
            sendJson(res, 200, { token, userName: doc.userName });
        } catch (error) {
            console.error('[SessionLog] auth error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.get('/api/session-logs/demos', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            sendJson(res, 200, { logs: listDemoLogs() });
        } catch (error) {
            console.error('[SessionLog] demos error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.get('/api/session-logs', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const user = await resolveAuthUser(req);
            if (!user) {
                sendJson(res, 401, { error: 'UNAUTHORIZED' });
                return;
            }
            const logs = await schema.sessionLog.find({ ownerDiscordId: user.discordId })
                .sort({ updatedAt: -1 })
                .select('title subtitle sessionDate visibility theme messageCount playerNames createdAt updatedAt shareToken')
                .limit(100)
                .lean();
            sendJson(res, 200, {
                logs: logs.map((log) => ({
                    id: log._id,
                    title: log.title,
                    subtitle: log.subtitle,
                    sessionDate: log.sessionDate,
                    visibility: log.visibility,
                    theme: log.theme,
                    messageCount: log.messageCount,
                    playerNames: log.playerNames,
                    createdAt: log.createdAt,
                    updatedAt: log.updatedAt,
                    shareUrl: log.visibility === 'unlisted' && log.shareToken
                        ? `/logs/${log._id}?token=${log.shareToken}`
                        : null,
                })),
            });
        } catch (error) {
            console.error('[SessionLog] list error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.post('/api/session-logs/import', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const user = await resolveAuthUser(req);
            if (!user) {
                sendJson(res, 401, { error: 'UNAUTHORIZED' });
                return;
            }
            const body = req.body || {};
            const messages = Array.isArray(body.messages) ? body.messages : null;
            if (!messages || messages.length === 0) {
                sendJson(res, 400, { error: 'MESSAGES_REQUIRED' });
                return;
            }
            if (messages.length > MAX_IMPORT_MESSAGES) {
                sendJson(res, 400, { error: 'TOO_MANY_MESSAGES', limit: MAX_IMPORT_MESSAGES });
                return;
            }

            const visibility = ['private', 'unlisted', 'public'].includes(body.visibility)
                ? body.visibility
                : 'private';
            const payload = buildSessionLogFromMessages(messages, {
                title: String(body.title || '未命名團錄').slice(0, 200),
                subtitle: String(body.subtitle || '').slice(0, 200),
                sessionDate: body.sessionDate,
                location: String(body.location || '').slice(0, 200),
                channelName: body.channelName,
                visibility,
                theme: String(body.theme || 'kakuyomu').slice(0, 40),
            });

            const doc = await schema.sessionLog.create({
                ownerDiscordId: user.discordId,
                ownerUserName: user.userName,
                shareToken: visibility === 'unlisted' ? generateShareToken() : undefined,
                ...payload,
            });

            sendJson(res, 201, {
                id: doc._id,
                title: doc.title,
                shareUrl: doc.shareToken ? `/logs/${doc._id}?token=${doc.shareToken}` : null,
            });
        } catch (error) {
            console.error('[SessionLog] import error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.get('/api/session-logs/:id', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const logId = String(req.params.id || '');
            if (logId === 'demo' || logId === 'demos') {
                sendJson(res, 200, { logs: listDemoLogs() });
                return;
            }
            if (isDemoLogId(logId)) {
                const demo = getDemoLog(logId);
                if (!demo) {
                    sendJson(res, 404, { error: 'NOT_FOUND' });
                    return;
                }
                sendJson(res, 200, demo);
                return;
            }

            const log = await schema.sessionLog.findById(logId).lean();
            if (!log) {
                sendJson(res, 404, { error: 'NOT_FOUND' });
                return;
            }

            const user = await resolveAuthUser(req);
            const shareToken = String(req.query.token || '');
            const isOwner = user && user.discordId === log.ownerDiscordId;
            const hasShare = log.visibility === 'unlisted'
                && shareToken
                && log.shareToken === shareToken;
            const isPublic = log.visibility === 'public';

            if (!isOwner && !hasShare && !isPublic) {
                sendJson(res, 403, { error: 'FORBIDDEN' });
                return;
            }

            const effectiveEvents = applyMods(log.events || [], log.mods || []);
            const events = effectiveEvents.slice(0, MAX_EVENTS_RETURN);

            sendJson(res, 200, {
                id: log._id,
                title: log.title,
                subtitle: log.subtitle,
                sessionDate: log.sessionDate,
                location: log.location,
                visibility: log.visibility,
                theme: log.theme,
                settings: log.settings,
                playerNames: log.playerNames,
                messageCount: log.messageCount,
                events,
                isOwner,
                canEdit: isOwner,
            });
        } catch (error) {
            console.error('[SessionLog] get error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.patch('/api/session-logs/:id', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const user = await resolveAuthUser(req);
            if (!user) {
                sendJson(res, 401, { error: 'UNAUTHORIZED' });
                return;
            }
            const log = await schema.sessionLog.findById(req.params.id);
            if (!log) {
                sendJson(res, 404, { error: 'NOT_FOUND' });
                return;
            }
            if (log.ownerDiscordId !== user.discordId) {
                sendJson(res, 403, { error: 'FORBIDDEN' });
                return;
            }

            const body = req.body || {};
            if (body.title) log.title = String(body.title).slice(0, 200);
            if (body.subtitle !== undefined) log.subtitle = String(body.subtitle).slice(0, 200);
            if (body.theme) log.theme = String(body.theme).slice(0, 40);
            if (body.settings && typeof body.settings === 'object') {
                log.settings = {
                    hideOOC: Boolean(body.settings.hideOOC),
                    hideDice: Boolean(body.settings.hideDice),
                };
            }
            if (['private', 'unlisted', 'public'].includes(body.visibility)) {
                log.visibility = body.visibility;
                if (body.visibility === 'unlisted' && !log.shareToken) {
                    log.shareToken = generateShareToken();
                }
                if (body.visibility === 'private') {
                    log.shareToken = undefined;
                }
            }

            await log.save();
            sendJson(res, 200, {
                id: log._id,
                shareUrl: log.shareToken ? `/logs/${log._id}?token=${log.shareToken}` : null,
            });
        } catch (error) {
            console.error('[SessionLog] patch error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.delete('/api/session-logs/:id', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const user = await resolveAuthUser(req);
            if (!user) {
                sendJson(res, 401, { error: 'UNAUTHORIZED' });
                return;
            }
            const result = await schema.sessionLog.deleteOne({
                _id: req.params.id,
                ownerDiscordId: user.discordId,
            });
            if (!result.deletedCount) {
                sendJson(res, 404, { error: 'NOT_FOUND' });
                return;
            }
            sendJson(res, 200, { ok: true });
        } catch (error) {
            console.error('[SessionLog] delete error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });
}

module.exports = { registerSessionLogRoutes };
