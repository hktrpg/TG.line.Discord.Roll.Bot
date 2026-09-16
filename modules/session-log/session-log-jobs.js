'use strict';

/**
 * Agenda jobs for session-log publish schedule, trash purge, orphan assets, async import.
 * @param {object} deps
 * @param {object} deps.schema
 * @param {object} [deps.agenda] - agenda instance if available
 */
function registerSessionLogJobs({ schema, agenda }) {
    if (!schema?.sessionLog) return;

    async function publishScheduled() {
        const now = new Date();
        const works = await schema.sessionLog.find({
            status: 'scheduled',
            publishAt: { $lte: now },
            deletedAt: null,
        }).limit(50);
        for (const work of works) {
            work.status = 'published';
            await work.save();
        }

        const withChapters = await schema.sessionLog.find({
            'chapters.status': 'scheduled',
            'chapters.publishAt': { $lte: now },
            deletedAt: null,
        }).limit(50);
        for (const work of withChapters) {
            let changed = false;
            for (const chapter of work.chapters || []) {
                if (chapter.status === 'scheduled' && chapter.publishAt && chapter.publishAt <= now) {
                    chapter.status = 'published';
                    changed = true;
                }
            }
            if (changed) await work.save();
        }
    }

    async function purgeTrash() {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const trash = await schema.sessionLog.find({
            deletedAt: { $lte: cutoff },
        }).limit(100);
        const { deleteCoverAssets } = require('./session-log-assets.js');
        for (const work of trash) {
            if (work.coverAssetId) {
                deleteCoverAssets(work.ownerDiscordId, work.coverAssetId);
            }
            await schema.sessionLog.deleteOne({ _id: work._id });
        }
    }

    async function purgeOrphanAssets() {
        const fs = require('node:fs');
        const path = require('node:path');
        const { ASSETS_ROOT } = require('./session-log-assets.js');
        if (!fs.existsSync(ASSETS_ROOT)) return;

        const cutoffMs = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const referenced = new Set();
        const works = await schema.sessionLog.find({})
            .select('ownerDiscordId coverUrl coverAssetId events')
            .lean()
            .limit(5000);
        for (const work of works) {
            if (work.coverAssetId) referenced.add(work.coverAssetId);
            if (work.coverUrl) {
                const match = String(work.coverUrl).match(/\/([^/]+)$/);
                if (match) referenced.add(match[1]);
            }
            for (const event of work.events || []) {
                if (event.url && event.url.includes('/session-log-assets/')) {
                    const match = String(event.url).match(/\/([^/?]+)$/);
                    if (match) referenced.add(match[1]);
                }
            }
        }

        for (const ownerEntry of fs.readdirSync(ASSETS_ROOT, { withFileTypes: true })) {
            if (!ownerEntry.isDirectory()) continue;
            const dir = path.join(ASSETS_ROOT, ownerEntry.name);
            for (const file of fs.readdirSync(dir)) {
                if (referenced.has(file)) continue;
                const hash = file.split('-')[0];
                const anyVariantRef = [...referenced].some((item) => item.startsWith(`${hash}-`));
                if (anyVariantRef) continue;
                const full = path.join(dir, file);
                try {
                    const stat = fs.statSync(full);
                    if (now - stat.mtimeMs > cutoffMs) {
                        fs.unlinkSync(full);
                    }
                } catch {
                    // ignore
                }
            }
        }
    }

    async function processQueuedImports() {
        if (!schema.sessionLogImportJob) return;
        const { processImportJob } = require('./import-jobs.js');
        const jobs = await schema.sessionLogImportJob.find({ status: 'queued' })
            .sort({ createdAt: 1 })
            .limit(5);
        for (const job of jobs) {
            await processImportJob(schema, job);
        }
    }

    if (agenda && typeof agenda.define === 'function') {
        agenda.define('session-log:publish-scheduled', async () => {
            await publishScheduled();
        });
        agenda.define('session-log:purge-trash', async () => {
            await purgeTrash();
        });
        agenda.define('session-log:purge-orphan-assets', async () => {
            await purgeOrphanAssets();
        });
        agenda.define('session-log:process-imports', async () => {
            await processQueuedImports();
        });

        (async () => {
            try {
                await agenda.every('1 minute', 'session-log:publish-scheduled');
                await agenda.every('1 hour', 'session-log:process-imports');
                await agenda.every('1 day', 'session-log:purge-trash');
                await agenda.every('1 day', 'session-log:purge-orphan-assets');
            } catch (error) {
                console.error('[SessionLog] agenda schedule failed:', error.message);
            }
        })();
    } else {
        // Fallback timers when agenda is unavailable
        setInterval(() => {
            publishScheduled().catch((error) => console.error('[SessionLog] publish job:', error.message));
            processQueuedImports().catch((error) => console.error('[SessionLog] import job:', error.message));
        }, 60_000).unref?.();
        setInterval(() => {
            purgeTrash().catch((error) => console.error('[SessionLog] purge trash:', error.message));
            purgeOrphanAssets().catch((error) => console.error('[SessionLog] purge orphans:', error.message));
        }, 24 * 60 * 60 * 1000).unref?.();
    }

    return {
        publishScheduled,
        purgeTrash,
        purgeOrphanAssets,
        processQueuedImports,
    };
}

module.exports = { registerSessionLogJobs };
