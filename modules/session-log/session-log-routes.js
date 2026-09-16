'use strict';

const crypto = require('node:crypto');
const express = require('express');
const {
    applyMods,
    generateShareToken,
} = require('./discord-import.js');
const {
    listDemoLogs,
    getDemoLog,
    isDemoLogId,
} = require('./demo-logs.js');
const {
    isValidSource,
    parseImport,
} = require('./import/index.js');
const {
    normalizeTags,
    normalizeCoverUrl,
    normalizeWarnings,
    STATUSES,
    RATINGS,
    LICENSES,
    ORIGINALITIES,
} = require('./import/build-work.js');
const {
    createUploader,
    saveProcessedAsset,
    deleteAsset,
    deleteCoverAssets,
    resolveAssetPath,
    verifyAssetSignature,
    getQuotaUsage,
} = require('./session-log-assets.js');
const { evaluateWorkAccess } = require('./permissions.js');
const { filterEventsByChapterAccess, buildChaptersFromEvents } = require('./chapters.js');
const { writeAudit } = require('./audit.js');
const {
    SYNC_EVENT_LIMIT,
    writeJobPayload,
    createWorkFromImport,
} = require('./import-jobs.js');
const { registerSessionLogJobs } = require('./session-log-jobs.js');

const MAX_IMPORT_MESSAGES = 20_000;
const MAX_EVENTS_RETURN = 5000;
const MAX_CONTENT_CHARS = 2_000_000;
const VIEW_THROTTLE_MS = 30 * 60 * 1000;

/** @type {Map<string, number>} */
const viewThrottle = new Map();

function getBearerToken(req) {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string') return null;
    if (!header.startsWith('Bearer ')) return null;
    return header.slice(7).trim();
}

function registerSessionLogRoutes({
    www,
    schema,
    security,
    checkRateLimit,
    verifyPasswordSecure,
    agenda,
}) {
    if (!www || !schema?.sessionLog) return;

    const upload = createUploader();
    const importJson = express.json({ limit: '15mb' });
    const jwtSecret = process.env.JWT_SECRET || process.env.SECRET || 'hktrpg-session-log';

    registerSessionLogJobs({ schema, agenda });

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
            isAdmin: Boolean(doc.isAdmin),
        };
    }

    /**
     * Admin access via ADMIN_SECRET header/query OR JWT account with isAdmin.
     * @param {import('express').Request} req
     * @returns {Promise<{ ok: boolean, actor: string }>}
     */
    async function resolveAdminAccess(req) {
        const secret = process.env.ADMIN_SECRET;
        const header = req.headers['x-admin-secret'] || req.query?.adminSecret;
        if (secret && header && String(header) === String(secret)) {
            return { ok: true, actor: 'admin-secret' };
        }
        const user = await resolveAuthUser(req);
        if (user?.isAdmin) {
            return { ok: true, actor: user.userName };
        }
        return { ok: false, actor: '' };
    }

    async function resolvePatreonLevel(user) {
        if (!user || !schema.patreonMember) return 0;
        try {
            // Best-effort: match by discord id stored encrypted or notes — fall back to 0
            const member = await schema.patreonMember.findOne({
                switch: true,
                notes: new RegExp(user.discordId),
            }).select('level').lean();
            return member?.level || 0;
        } catch {
            return 0;
        }
    }

    function sendJson(res, status, body) {
        res.status(status).json(body);
    }

    function mapLogSummary(log) {
        const chapterCount = Array.isArray(log.chapters) ? log.chapters.length : 0;
        const wordCount = Array.isArray(log.chapters)
            ? log.chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)
            : 0;
        return {
            id: log._id,
            title: log.title,
            subtitle: log.subtitle,
            synopsis: log.synopsis ? String(log.synopsis).slice(0, 200) : '',
            coverUrl: log.coverUrl || '',
            tags: log.tags || [],
            genre: log.genre || '',
            sessionDate: log.sessionDate,
            location: log.location,
            visibility: log.visibility,
            status: log.status || 'published',
            publishAt: log.publishAt,
            rating: log.rating || 'general',
            license: log.license || 'all_rights_reserved',
            theme: log.theme,
            messageCount: log.messageCount,
            chapterCount,
            wordCount,
            views: log.stats?.views || 0,
            playerNames: log.playerNames,
            importSource: log.importSource,
            moderation: log.moderation?.state || 'ok',
            deletedAt: log.deletedAt || null,
            seriesId: log.seriesId || null,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            shareUrl: log.visibility === 'unlisted' && log.shareToken
                ? `/logs/${log._id}?token=${log.shareToken}`
                : null,
        };
    }

    function extractMetadata(body = {}) {
        const meta = body.metadata && typeof body.metadata === 'object'
            ? body.metadata
            : body;
        return {
            title: meta.title,
            subtitle: meta.subtitle,
            synopsis: meta.synopsis,
            coverUrl: meta.coverUrl,
            coverAssetId: meta.coverAssetId,
            tags: meta.tags,
            genre: meta.genre,
            sessionDate: meta.sessionDate,
            location: meta.location,
            channelName: meta.channelName || body.channelName,
            visibility: meta.visibility ?? body.visibility,
            status: meta.status ?? body.status,
            publishAt: meta.publishAt ?? body.publishAt,
            theme: meta.theme ?? body.theme,
            rating: meta.rating ?? body.rating,
            contentWarnings: meta.contentWarnings ?? body.contentWarnings,
            license: meta.license ?? body.license,
            originality: meta.originality ?? body.originality,
            sourceAttribution: meta.sourceAttribution ?? body.sourceAttribution,
            settings: meta.settings,
            sourceMeta: meta.sourceMeta,
            chapters: meta.chapters,
            seriesId: meta.seriesId,
            seriesOrder: meta.seriesOrder,
        };
    }

    function estimateEventCount(source, body) {
        if (source === 'discord_export' && Array.isArray(body.messages)) {
            return body.messages.length;
        }
        if (typeof body.content === 'string') {
            return Math.ceil(body.content.length / 80);
        }
        return 0;
    }

    function recordView(logId, ip) {
        const key = `${ip || 'unknown'}:${logId}`;
        const now = Date.now();
        const last = viewThrottle.get(key) || 0;
        if (now - last < VIEW_THROTTLE_MS) return false;
        viewThrottle.set(key, now);
        if (viewThrottle.size > 10_000) {
            for (const [entryKey, ts] of viewThrottle) {
                if (now - ts > VIEW_THROTTLE_MS) viewThrottle.delete(entryKey);
            }
        }
        return true;
    }

    www.use('/api/session-logs/import', importJson);
    www.use('/api/session-logs/preview', importJson);

    // ——— Auth ———
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
            sendJson(res, 200, {
                token,
                userName: doc.userName,
                isAdmin: Boolean(doc.isAdmin),
            });
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

    // ——— Quota ———
    www.get('/api/session-logs/quota', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        const level = await resolvePatreonLevel(user);
        sendJson(res, 200, {
            ...getQuotaUsage(user.discordId, level),
            patreonLevel: level,
        });
    });

    // ——— Author profile ———
    www.get('/api/authors/me', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        if (!schema.authorProfile) {
            sendJson(res, 200, { ownerDiscordId: user.discordId, penName: user.userName, isPublic: false });
            return;
        }
        let profile = await schema.authorProfile.findOne({ ownerDiscordId: user.discordId }).lean();
        if (!profile) {
            profile = {
                ownerDiscordId: user.discordId,
                penName: user.userName,
                isPublic: false,
                bio: '',
                links: [],
            };
        }
        sendJson(res, 200, profile);
    });

    www.patch('/api/authors/me', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        if (!schema.authorProfile) {
            sendJson(res, 500, { error: 'SCHEMA_MISSING' });
            return;
        }
        const body = req.body || {};
        const update = {
            penName: String(body.penName || user.userName).slice(0, 60),
            bio: String(body.bio || '').slice(0, 1000),
            avatarUrl: normalizeCoverUrl(body.avatarUrl),
            isPublic: Boolean(body.isPublic),
            links: Array.isArray(body.links)
                ? body.links.slice(0, 5).map((link) => ({
                    label: String(link.label || '').slice(0, 40),
                    url: String(link.url || '').slice(0, 500),
                }))
                : [],
        };
        if (body.slug !== undefined) {
            const slug = String(body.slug || '')
                .toLowerCase()
                .replaceAll(/[^a-z0-9-]/g, '-')
                .replaceAll(/-+/g, '-')
                .slice(0, 60);
            update.slug = slug || undefined;
        }
        const profile = await schema.authorProfile.findOneAndUpdate(
            { ownerDiscordId: user.discordId },
            { $set: update, $setOnInsert: { ownerDiscordId: user.discordId } },
            { upsert: true, new: true },
        ).lean();
        sendJson(res, 200, profile);
    });

    www.get('/api/authors/:slug', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        if (!schema.authorProfile) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        const profile = await schema.authorProfile.findOne({
            slug: String(req.params.slug || '').toLowerCase(),
            isPublic: true,
        }).lean();
        if (!profile) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        const works = await schema.sessionLog.find({
            ownerDiscordId: profile.ownerDiscordId,
            visibility: 'public',
            status: 'published',
            deletedAt: null,
            'moderation.state': { $ne: 'taken_down' },
        })
            .sort({ updatedAt: -1 })
            .select('title subtitle synopsis coverUrl tags genre rating theme messageCount stats createdAt updatedAt')
            .limit(50)
            .lean();
        sendJson(res, 200, {
            author: {
                penName: profile.penName,
                slug: profile.slug,
                avatarUrl: profile.avatarUrl,
                bio: profile.bio,
                links: profile.links,
            },
            works: works.map((log) => mapLogSummary(log)),
        });
    });

    // ——— Public discovery ———
    www.get('/api/session-logs/public', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
            const safe = String(req.query.safe || '') === '1';
            const filter = {
                visibility: 'public',
                status: 'published',
                deletedAt: null,
                $or: [
                    { 'moderation.state': 'ok' },
                    { 'moderation.state': { $exists: false } },
                ],
            };
            if (safe) {
                filter.rating = { $nin: ['r15', 'r18'] };
            }
            if (req.query.tag) filter.tags = String(req.query.tag).slice(0, 40);
            if (req.query.genre) filter.genre = String(req.query.genre).slice(0, 40);
            if (req.query.q) {
                const q = String(req.query.q).slice(0, 80);
                const escaped = q.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
                filter.$and = [
                    {
                        $or: [
                            { title: new RegExp(escaped, 'i') },
                            { synopsis: new RegExp(escaped, 'i') },
                        ],
                    },
                ];
            }
            const sort = String(req.query.sort || 'latest') === 'popular'
                ? { 'stats.views': -1, updatedAt: -1 }
                : { updatedAt: -1 };
            const [logs, total] = await Promise.all([
                schema.sessionLog.find(filter)
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .select('title subtitle synopsis coverUrl tags genre rating theme messageCount playerNames stats createdAt updatedAt ownerUserName')
                    .lean(),
                schema.sessionLog.countDocuments(filter),
            ]);
            sendJson(res, 200, {
                logs: logs.map((log) => mapLogSummary(log)),
                page,
                total,
            });
        } catch (error) {
            console.error('[SessionLog] public list error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    // ——— My library ———
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
            const trash = String(req.query.trash || '') === '1';
            const filter = { ownerDiscordId: user.discordId };
            if (trash) {
                filter.deletedAt = { $ne: null };
            } else {
                filter.deletedAt = null;
            }
            if (req.query.status && STATUSES.has(req.query.status)) {
                filter.status = req.query.status;
            }
            if (req.query.tag) filter.tags = String(req.query.tag).slice(0, 40);
            if (req.query.q) {
                const q = String(req.query.q).slice(0, 80);
                const escaped = q.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
                filter.title = new RegExp(escaped, 'i');
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
            const logs = await schema.sessionLog.find(filter)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('title subtitle synopsis coverUrl tags genre sessionDate location visibility status publishAt rating license theme messageCount playerNames importSource chapters stats moderation deletedAt seriesId createdAt updatedAt shareToken')
                .lean();
            sendJson(res, 200, {
                logs: logs.map((log) => mapLogSummary(log)),
                page,
            });
        } catch (error) {
            console.error('[SessionLog] list error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    // ——— Assets ———
    www.post('/api/session-logs/assets', async (req, res) => {
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
            upload.single('file')(req, res, async (err) => {
                if (err) {
                    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED';
                    sendJson(res, 400, { error: code });
                    return;
                }
                try {
                    const kind = String(req.query?.kind || req.body?.kind || 'inline') === 'cover'
                        ? 'cover'
                        : 'inline';
                    const level = await resolvePatreonLevel(user);
                    const result = await saveProcessedAsset(user, req.file?.buffer, kind, level);
                    if (!result.ok) {
                        sendJson(res, 400, { error: result.error });
                        return;
                    }
                    sendJson(res, 201, result);
                } catch (error) {
                    console.error('[SessionLog] asset process error:', error.message);
                    sendJson(res, 500, { error: 'SERVER_ERROR' });
                }
            });
        } catch (error) {
            console.error('[SessionLog] asset upload error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.delete('/api/session-logs/assets/:assetId', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        const ok = deleteAsset(user.discordId, req.params.assetId);
        if (!ok) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        sendJson(res, 200, { ok: true });
    });

    www.get('/session-log-assets/:ownerId/:filename', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const filePath = resolveAssetPath(req.params.ownerId, req.params.filename);
        if (!filePath) {
            res.status(404).end();
            return;
        }
        // Private access: if sig provided, verify; otherwise allow public cacheable serve
        // (Phase 1: assets are reachable if URL known; signed URLs preferred for private works)
        if (req.query.sig || req.query.exp) {
            const valid = verifyAssetSignature(
                jwtSecret,
                req.params.ownerId,
                req.params.filename,
                req.query.exp,
                req.query.sig,
            );
            if (!valid) {
                res.status(403).end();
                return;
            }
            res.setHeader('Cache-Control', 'private, max-age=600');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        res.sendFile(filePath);
    });

    // ——— Preview / Import ———
    www.post('/api/session-logs/preview', async (req, res) => {
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
            const source = String(body.source || 'discord_export');
            if (!isValidSource(source)) {
                sendJson(res, 400, { error: 'INVALID_SOURCE' });
                return;
            }
            if (typeof body.content === 'string' && body.content.length > MAX_CONTENT_CHARS) {
                sendJson(res, 400, { error: 'CONTENT_TOO_LARGE' });
                return;
            }
            if (Array.isArray(body.messages) && body.messages.length > MAX_IMPORT_MESSAGES) {
                sendJson(res, 400, { error: 'TOO_MANY_MESSAGES', limit: MAX_IMPORT_MESSAGES });
                return;
            }
            const parsed = parseImport(source, {
                messages: body.messages,
                content: body.content,
            });
            const chapters = buildChaptersFromEvents(parsed.events);
            sendJson(res, 200, {
                warnings: parsed.warnings,
                eventCount: parsed.events.length,
                playerNames: parsed.playerNames,
                sampleEvents: parsed.events.slice(0, 20),
                chapters: chapters.map((chapter) => ({
                    id: chapter.id,
                    title: chapter.title,
                    order: chapter.order,
                    wordCount: chapter.wordCount,
                })),
                sourceMeta: parsed.sourceMeta,
            });
        } catch (error) {
            console.error('[SessionLog] preview error:', error.message);
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
            const source = String(body.source || (Array.isArray(body.messages) ? 'discord_export' : ''));
            if (!isValidSource(source)) {
                sendJson(res, 400, { error: 'INVALID_SOURCE' });
                return;
            }
            if (typeof body.content === 'string' && body.content.length > MAX_CONTENT_CHARS) {
                sendJson(res, 400, { error: 'CONTENT_TOO_LARGE' });
                return;
            }
            if (Array.isArray(body.messages) && body.messages.length > MAX_IMPORT_MESSAGES) {
                sendJson(res, 400, { error: 'TOO_MANY_MESSAGES', limit: MAX_IMPORT_MESSAGES });
                return;
            }
            if (source === 'discord_export' && (!Array.isArray(body.messages) || body.messages.length === 0)) {
                sendJson(res, 400, { error: 'MESSAGES_REQUIRED' });
                return;
            }
            if (source !== 'discord_export' && !body.content) {
                sendJson(res, 400, { error: 'CONTENT_REQUIRED' });
                return;
            }

            const metadata = extractMetadata(body);
            if (metadata.status === undefined || metadata.status === null) {
                metadata.status = 'published';
            }
            if (metadata.originality !== 'original' && !metadata.sourceAttribution) {
                sendJson(res, 400, { error: 'SOURCE_ATTRIBUTION_REQUIRED' });
                return;
            }

            const estimated = estimateEventCount(source, body);
            if (estimated > SYNC_EVENT_LIMIT && schema.sessionLogImportJob) {
                const job = await schema.sessionLogImportJob.create({
                    ownerDiscordId: user.discordId,
                    source,
                    status: 'queued',
                    progress: 0,
                    metadata,
                });
                const payloadRef = writeJobPayload(String(job._id), {
                    messages: body.messages,
                    content: body.content,
                    metadata,
                    userName: user.userName,
                });
                job.payloadRef = payloadRef;
                await job.save();
                sendJson(res, 202, {
                    jobId: job._id,
                    status: 'queued',
                    estimatedEvents: estimated,
                });
                return;
            }

            const { doc, warnings } = await createWorkFromImport(schema, user, source, {
                messages: body.messages,
                content: body.content,
                metadata,
            });
            sendJson(res, 201, {
                id: doc._id,
                title: doc.title,
                status: doc.status,
                visibility: doc.visibility,
                warnings,
                shareUrl: doc.shareToken ? `/logs/${doc._id}?token=${doc.shareToken}` : null,
            });
        } catch (error) {
            console.error('[SessionLog] import error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.get('/api/session-logs/jobs/:id', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        if (!schema.sessionLogImportJob) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        const job = await schema.sessionLogImportJob.findById(req.params.id).lean();
        if (!job || job.ownerDiscordId !== user.discordId) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        sendJson(res, 200, {
            id: job._id,
            status: job.status,
            progress: job.progress,
            warnings: job.warnings || [],
            error: job.error,
            workId: job.workId,
            eventCount: job.eventCount,
        });
    });

    // ——— Get one ———
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
            const access = evaluateWorkAccess(log, user, shareToken);
            if (!access.allowed) {
                sendJson(res, access.reason === 'NOT_FOUND' ? 404 : 403, {
                    error: access.reason || 'FORBIDDEN',
                });
                return;
            }

            let effectiveEvents = applyMods(log.events || [], log.mods || []);
            effectiveEvents = filterEventsByChapterAccess(
                effectiveEvents,
                log.chapters || [],
                access.isOwner,
            );
            const events = effectiveEvents.slice(0, MAX_EVENTS_RETURN);

            if (!access.isOwner && recordView(logId, req.ip)) {
                schema.sessionLog.updateOne(
                    { _id: log._id },
                    {
                        $inc: { 'stats.views': 1 },
                        $set: { 'stats.lastViewedAt': new Date() },
                    },
                ).catch(() => {});
            }

            let author = null;
            if (schema.authorProfile) {
                const profile = await schema.authorProfile.findOne({
                    ownerDiscordId: log.ownerDiscordId,
                    isPublic: true,
                }).lean();
                if (profile) {
                    author = {
                        penName: profile.penName,
                        slug: profile.slug,
                        avatarUrl: profile.avatarUrl,
                    };
                }
            }

            sendJson(res, 200, {
                id: log._id,
                title: log.title,
                subtitle: log.subtitle,
                synopsis: log.synopsis || '',
                coverUrl: log.coverUrl || '',
                tags: log.tags || [],
                genre: log.genre || '',
                sessionDate: log.sessionDate,
                location: log.location,
                visibility: log.visibility,
                status: log.status || 'published',
                publishAt: log.publishAt,
                rating: log.rating || 'general',
                contentWarnings: log.contentWarnings || [],
                license: log.license || 'all_rights_reserved',
                originality: log.originality || 'original',
                sourceAttribution: log.sourceAttribution || '',
                chapters: log.chapters || [],
                stats: log.stats || { views: 0, reads: 0 },
                moderation: log.moderation || { state: 'ok' },
                importSource: log.importSource,
                sourceMeta: log.sourceMeta,
                theme: log.theme,
                settings: log.settings,
                playerNames: log.playerNames,
                messageCount: log.messageCount,
                seriesId: log.seriesId,
                author,
                events,
                isOwner: access.isOwner,
                canEdit: access.isOwner && !log.deletedAt,
                accessReason: access.reason,
            });
        } catch (error) {
            console.error('[SessionLog] get error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    // ——— Export ———
    www.get('/api/session-logs/:id/export', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        const log = await schema.sessionLog.findById(req.params.id).lean();
        if (!log || log.ownerDiscordId !== user.discordId) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        const format = String(req.query.format || 'json');
        if (format === 'md') {
            const lines = [`# ${log.title}`, ''];
            if (log.synopsis) lines.push(log.synopsis, '');
            for (const event of log.events || []) {
                switch (event.type) {
                    case 'scene': {
                        lines.push(`## ${event.title}`, '');
                        break;
                    }
                    case 'say': {
                        lines.push(`**${event.name}**: ${event.text}`, '');
                        break;
                    }
                    case 'reference': {
                        lines.push(`![${event.caption || ''}](${event.url || ''})`, '');
                        break;
                    }
                    default: {
                        if (event.text) lines.push(event.text, '');
                    }
                }
            }
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${log._id}.md"`);
            res.send(lines.join('\n'));
            return;
        }
        sendJson(res, 200, log);
    });

    // ——— Patch metadata ———
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
            if (!log || log.ownerDiscordId !== user.discordId) {
                sendJson(res, 404, { error: 'NOT_FOUND' });
                return;
            }
            if (log.deletedAt) {
                sendJson(res, 400, { error: 'IN_TRASH' });
                return;
            }

            const body = req.body || {};
            const patch = {};
            if (body.title) {
                log.title = String(body.title).slice(0, 200);
                patch.title = log.title;
            }
            if (body.subtitle !== undefined) {
                log.subtitle = String(body.subtitle).slice(0, 200);
                patch.subtitle = log.subtitle;
            }
            if (body.synopsis !== undefined) {
                log.synopsis = String(body.synopsis).slice(0, 2000);
                patch.synopsis = log.synopsis;
            }
            if (body.coverUrl !== undefined) {
                log.coverUrl = normalizeCoverUrl(body.coverUrl);
                patch.coverUrl = log.coverUrl;
            }
            if (body.coverAssetId !== undefined) {
                log.coverAssetId = String(body.coverAssetId || '').slice(0, 100);
            }
            if (body.tags !== undefined) {
                log.tags = normalizeTags(body.tags);
                patch.tags = log.tags;
            }
            if (body.genre !== undefined) log.genre = String(body.genre).slice(0, 40);
            if (body.sessionDate !== undefined) log.sessionDate = String(body.sessionDate).slice(0, 120);
            if (body.location !== undefined) log.location = String(body.location).slice(0, 200);
            if (body.theme) log.theme = String(body.theme).slice(0, 40);
            if (RATINGS.has(body.rating)) log.rating = body.rating;
            if (body.contentWarnings !== undefined) {
                log.contentWarnings = normalizeWarnings(body.contentWarnings);
            }
            if (LICENSES.has(body.license)) log.license = body.license;
            if (ORIGINALITIES.has(body.originality)) {
                log.originality = body.originality;
                if (body.originality !== 'original' && !body.sourceAttribution && !log.sourceAttribution) {
                    sendJson(res, 400, { error: 'SOURCE_ATTRIBUTION_REQUIRED' });
                    return;
                }
            }
            if (body.sourceAttribution !== undefined) {
                log.sourceAttribution = String(body.sourceAttribution).slice(0, 500);
            }
            if (body.seriesId !== undefined) {
                log.seriesId = body.seriesId ? String(body.seriesId).slice(0, 40) : undefined;
            }
            if (body.seriesOrder !== undefined) log.seriesOrder = Number(body.seriesOrder) || 0;
            if (STATUSES.has(body.status)) {
                log.status = body.status;
                patch.status = log.status;
            }
            if (body.publishAt !== undefined) {
                log.publishAt = body.publishAt ? new Date(body.publishAt) : undefined;
                if (log.publishAt && log.status === 'draft') log.status = 'scheduled';
            }
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
                patch.visibility = log.visibility;
            }

            // Keep metadata history (max 10)
            if (Object.keys(patch).length > 0) {
                const history = Array.isArray(log.metadataHistory) ? [...log.metadataHistory] : [];
                history.push({ at: new Date(), by: user.userName, patch });
                log.metadataHistory = history.slice(-10);
            }

            await log.save();
            await writeAudit(schema, {
                workId: log._id,
                actor: user.userName,
                action: 'update',
                detail: patch,
            });
            sendJson(res, 200, {
                id: log._id,
                status: log.status,
                visibility: log.visibility,
                coverUrl: log.coverUrl,
                shareUrl: log.shareToken ? `/logs/${log._id}?token=${log.shareToken}` : null,
            });
        } catch (error) {
            console.error('[SessionLog] patch error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    // ——— Chapters ———
    www.patch('/api/session-logs/:id/chapters', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        const log = await schema.sessionLog.findById(req.params.id);
        if (!log || log.ownerDiscordId !== user.discordId || log.deletedAt) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        const incoming = Array.isArray(req.body?.chapters) ? req.body.chapters : null;
        if (!incoming) {
            sendJson(res, 400, { error: 'CHAPTERS_REQUIRED' });
            return;
        }
        const byId = new Map((log.chapters || []).map((chapter) => [chapter.id, chapter]));
        log.chapters = incoming.map((item, index) => {
            const prev = byId.get(item.id) || {};
            return {
                id: String(item.id || prev.id || `c${String(index + 1).padStart(4, '0')}`).slice(0, 16),
                title: String(item.title ?? prev.title ?? `Chapter ${index + 1}`).slice(0, 300),
                order: Number.isFinite(item.order) ? item.order : index,
                startEventId: item.startEventId || prev.startEventId || '',
                endEventId: item.endEventId || prev.endEventId || '',
                status: ['draft', 'scheduled', 'published'].includes(item.status)
                    ? item.status
                    : (prev.status || 'published'),
                publishAt: item.publishAt ? new Date(item.publishAt) : prev.publishAt,
                wordCount: prev.wordCount || 0,
                views: prev.views || 0,
            };
        }).sort((a, b) => a.order - b.order);
        await log.save();
        await writeAudit(schema, {
            workId: log._id,
            actor: user.userName,
            action: 'update_chapters',
        });
        sendJson(res, 200, { id: log._id, chapters: log.chapters });
    });

    // ——— Soft delete / restore / purge ———
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
            const log = await schema.sessionLog.findOne({
                _id: req.params.id,
                ownerDiscordId: user.discordId,
            });
            if (!log) {
                sendJson(res, 404, { error: 'NOT_FOUND' });
                return;
            }
            log.deletedAt = new Date();
            await log.save();
            await writeAudit(schema, {
                workId: log._id,
                actor: user.userName,
                action: 'soft_delete',
            });
            sendJson(res, 200, { ok: true, deletedAt: log.deletedAt });
        } catch (error) {
            console.error('[SessionLog] delete error:', error.message);
            sendJson(res, 500, { error: 'SERVER_ERROR' });
        }
    });

    www.post('/api/session-logs/:id/restore', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        const log = await schema.sessionLog.findOne({
            _id: req.params.id,
            ownerDiscordId: user.discordId,
        });
        if (!log || !log.deletedAt) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        log.deletedAt = undefined;
        await log.save();
        await writeAudit(schema, {
            workId: log._id,
            actor: user.userName,
            action: 'restore',
        });
        sendJson(res, 200, { ok: true, id: log._id });
    });

    www.delete('/api/session-logs/:id/purge', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const user = await resolveAuthUser(req);
        if (!user) {
            sendJson(res, 401, { error: 'UNAUTHORIZED' });
            return;
        }
        const log = await schema.sessionLog.findOne({
            _id: req.params.id,
            ownerDiscordId: user.discordId,
        });
        if (!log) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        if (log.coverAssetId) {
            deleteCoverAssets(user.discordId, log.coverAssetId);
        }
        await schema.sessionLog.deleteOne({ _id: log._id });
        await writeAudit(schema, {
            workId: log._id,
            actor: user.userName,
            action: 'purge',
        });
        sendJson(res, 200, { ok: true });
    });

    // ——— Report ———
    www.post('/api/session-logs/:id/report', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        if (!schema.sessionLogReport) {
            sendJson(res, 500, { error: 'SCHEMA_MISSING' });
            return;
        }
        const log = await schema.sessionLog.findById(req.params.id).select('_id visibility status').lean();
        if (!log || log.visibility !== 'public' || log.status !== 'published') {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        const reason = String(req.body?.reason || 'other');
        const allowed = new Set(['infringement', 'illegal', 'rating', 'spam', 'other']);
        if (!allowed.has(reason)) {
            sendJson(res, 400, { error: 'INVALID_REASON' });
            return;
        }
        const reporterHash = crypto.createHash('sha256')
            .update(String(req.ip || 'unknown'))
            .digest('hex')
            .slice(0, 32);
        await schema.sessionLogReport.create({
            workId: log._id,
            reporterHash,
            reason,
            detail: String(req.body?.detail || '').slice(0, 1000),
        });
        sendJson(res, 201, { ok: true });
    });

    // ——— Admin moderation ———
    www.get('/api/admin/session-logs/me', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        sendJson(res, 200, { ok: true, actor: access.actor });
    });

    www.get('/api/admin/session-logs/reports', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        if (!schema.sessionLogReport) {
            sendJson(res, 200, { reports: [] });
            return;
        }
        const status = String(req.query.status || 'open');
        const filter = {};
        if (['open', 'resolved', 'rejected'].includes(status)) {
            filter.status = status;
        }
        const reports = await schema.sessionLogReport.find(filter)
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();
        const workIds = [...new Set(reports.map((item) => String(item.workId)))];
        const works = await schema.sessionLog.find({ _id: { $in: workIds } })
            .select('title ownerUserName visibility status moderation')
            .lean();
        const workMap = new Map(works.map((work) => [String(work._id), work]));
        sendJson(res, 200, {
            reports: reports.map((report) => ({
                ...report,
                id: report._id,
                work: workMap.get(String(report.workId)) || null,
            })),
        });
    });

    www.patch('/api/admin/session-logs/reports/:id', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        const status = String(req.body?.status || '');
        if (!['open', 'resolved', 'rejected'].includes(status)) {
            sendJson(res, 400, { error: 'INVALID_STATUS' });
            return;
        }
        const report = await schema.sessionLogReport.findById(req.params.id);
        if (!report) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        report.status = status;
        await report.save();
        await writeAudit(schema, {
            workId: report.workId,
            actor: access.actor,
            action: 'report_status',
            detail: { reportId: report._id, status },
        });
        sendJson(res, 200, { ok: true, id: report._id, status: report.status });
    });

    www.get('/api/admin/session-logs/works', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        const filter = {};
        if (req.query.moderation) {
            filter['moderation.state'] = String(req.query.moderation).slice(0, 40);
        }
        if (req.query.status && STATUSES.has(req.query.status)) {
            filter.status = req.query.status;
        }
        if (req.query.visibility) {
            filter.visibility = String(req.query.visibility).slice(0, 20);
        }
        if (String(req.query.trash || '') === '1') {
            filter.deletedAt = { $ne: null };
        } else if (String(req.query.trash || '') !== 'all') {
            filter.deletedAt = null;
        }
        if (req.query.q) {
            const escaped = String(req.query.q).slice(0, 80)
                .replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
            filter.$or = [
                { title: new RegExp(escaped, 'i') },
                { ownerUserName: new RegExp(escaped, 'i') },
            ];
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
        const [logs, total] = await Promise.all([
            schema.sessionLog.find(filter)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('title ownerUserName ownerDiscordId visibility status rating moderation deletedAt stats messageCount createdAt updatedAt')
                .lean(),
            schema.sessionLog.countDocuments(filter),
        ]);
        sendJson(res, 200, {
            logs: logs.map((log) => ({
                ...mapLogSummary(log),
                ownerUserName: log.ownerUserName,
                ownerDiscordId: log.ownerDiscordId,
            })),
            page,
            total,
        });
    });

    www.get('/api/admin/session-logs/authors', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        const accounts = await schema.accountPW.find({ userName: { $type: 'string' } })
            .select('userName id isAdmin createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(200)
            .lean();
        const profiles = schema.authorProfile
            ? await schema.authorProfile.find({})
                .select('ownerDiscordId penName slug isPublic')
                .lean()
            : [];
        const profileMap = new Map(profiles.map((item) => [item.ownerDiscordId, item]));
        sendJson(res, 200, {
            authors: accounts.map((account) => ({
                userName: account.userName,
                discordId: account.id,
                isAdmin: Boolean(account.isAdmin),
                profile: profileMap.get(account.id) || null,
            })),
        });
    });

    www.get('/api/admin/session-logs/audits', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        if (!schema.sessionLogAudit) {
            sendJson(res, 200, { audits: [] });
            return;
        }
        const filter = {};
        if (req.query.workId) filter.workId = req.query.workId;
        const audits = await schema.sessionLogAudit.find(filter)
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();
        sendJson(res, 200, { audits });
    });

    www.post('/api/admin/session-logs/:id/moderate', async (req, res) => {
        if (await checkRateLimit('card', req.ip)) {
            res.status(429).end();
            return;
        }
        const access = await resolveAdminAccess(req);
        if (!access.ok) {
            sendJson(res, 403, { error: 'FORBIDDEN' });
            return;
        }
        const state = String(req.body?.state || '');
        if (!['ok', 'under_review', 'taken_down'].includes(state)) {
            sendJson(res, 400, { error: 'INVALID_STATE' });
            return;
        }
        const log = await schema.sessionLog.findById(req.params.id);
        if (!log) {
            sendJson(res, 404, { error: 'NOT_FOUND' });
            return;
        }
        log.moderation = {
            state,
            reason: String(req.body?.reason || '').slice(0, 500),
            at: new Date(),
            by: access.actor,
        };
        await log.save();
        await writeAudit(schema, {
            workId: log._id,
            actor: access.actor,
            action: 'moderate',
            detail: { state, reason: log.moderation.reason },
        });
        sendJson(res, 200, { ok: true, moderation: log.moderation });
    });
}

module.exports = { registerSessionLogRoutes };
