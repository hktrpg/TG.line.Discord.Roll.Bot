'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { importWork } = require('./import/index.js');
const { generateShareToken } = require('./discord-import.js');
const { writeAudit } = require('./audit.js');

const IMPORT_TEMP_DIR = path.join(process.cwd(), 'temp', 'session-log-import');
const SYNC_EVENT_LIMIT = 2000;

function ensureTempDir() {
    fs.mkdirSync(IMPORT_TEMP_DIR, { recursive: true });
}

/**
 * Persist large import payload to temp file.
 * @param {string} jobId
 * @param {object} payload
 * @returns {string}
 */
function writeJobPayload(jobId, payload) {
    ensureTempDir();
    const filePath = path.join(IMPORT_TEMP_DIR, `${jobId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload));
    return filePath;
}

function readJobPayload(payloadRef) {
    if (!payloadRef || !fs.existsSync(payloadRef)) return null;
    try {
        return JSON.parse(fs.readFileSync(payloadRef, 'utf8'));
    } catch {
        return null;
    }
}

function cleanupJobPayload(payloadRef) {
    if (!payloadRef) return;
    try {
        if (fs.existsSync(payloadRef)) fs.unlinkSync(payloadRef);
    } catch {
        // ignore
    }
}

/**
 * Run import and create sessionLog document.
 * @param {object} schema
 * @param {{ discordId: string, userName: string }} user
 * @param {string} source
 * @param {object} options
 */
async function createWorkFromImport(schema, user, source, options = {}) {
    const { payload, warnings, preview } = importWork(source, options);

    // Duplicate content warning (24h)
    if (payload.contentHash) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dup = await schema.sessionLog.findOne({
            ownerDiscordId: user.discordId,
            contentHash: payload.contentHash,
            createdAt: { $gte: since },
            deletedAt: null,
        }).select('_id title').lean();
        if (dup) {
            warnings.push(`Possible duplicate of work ${dup._id} (${dup.title})`);
        }
    }

    const doc = await schema.sessionLog.create({
        ownerDiscordId: user.discordId,
        ownerUserName: user.userName,
        shareToken: payload.visibility === 'unlisted' ? generateShareToken() : undefined,
        ...payload,
    });

    await writeAudit(schema, {
        workId: doc._id,
        actor: user.userName,
        action: 'import',
        detail: { source, eventCount: payload.messageCount },
    });

    return { doc, warnings, preview };
}

/**
 * Process a queued import job.
 * @param {object} schema
 * @param {object} jobDoc
 */
async function processImportJob(schema, jobDoc) {
    jobDoc.status = 'parsing';
    jobDoc.progress = 10;
    await jobDoc.save();

    const stored = readJobPayload(jobDoc.payloadRef);
    if (!stored) {
        jobDoc.status = 'failed';
        jobDoc.error = 'PAYLOAD_MISSING';
        await jobDoc.save();
        return jobDoc;
    }

    try {
        const user = {
            discordId: jobDoc.ownerDiscordId,
            userName: stored.userName || 'author',
        };
        const { doc, warnings } = await createWorkFromImport(schema, user, jobDoc.source, {
            messages: stored.messages,
            content: stored.content,
            metadata: stored.metadata || jobDoc.metadata || {},
        });
        jobDoc.status = 'done';
        jobDoc.progress = 100;
        jobDoc.workId = doc._id;
        jobDoc.eventCount = doc.messageCount;
        jobDoc.warnings = warnings;
        await jobDoc.save();
        cleanupJobPayload(jobDoc.payloadRef);
        jobDoc.payloadRef = undefined;
        await jobDoc.save();
        return jobDoc;
    } catch (error) {
        jobDoc.status = 'failed';
        jobDoc.error = String(error.message || 'IMPORT_FAILED').slice(0, 500);
        await jobDoc.save();
        return jobDoc;
    }
}

module.exports = {
    SYNC_EVENT_LIMIT,
    IMPORT_TEMP_DIR,
    writeJobPayload,
    readJobPayload,
    cleanupJobPayload,
    createWorkFromImport,
    processImportJob,
};
